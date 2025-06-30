console.log('Background Service Worker Loaded')

chrome.runtime.onInstalled.addListener(async () => {
    console.log('Extension installed')
})

chrome.action.setBadgeText({ text: 'ON' })

chrome.action.onClicked.addListener((tab) => {
    if (tab.id) {
        chrome.tabs.sendMessage(tab.id, { message: 'clicked_browser_action' });
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const { command } = message
    switch (command) {
        case 'hello-world':
            console.log('Hello World, from the Background Service Worker')
            sendResponse({ success: true, message: 'Hello World' })
            break
        default:
            break
    }
})

chrome.commands.onCommand.addListener(command => {
    console.log(`Command: ${command}`)

    if (command === 'refresh_extension') {
        chrome.runtime.reload()
    }
})
//------------ SolvedSection.tsx------------//
// Use GraphQL to fetch completed submissions on every open triggered on Panel (constant update) and save to Chrome storage.
// Avoid using failed fetch and falls back to latest successfully saved submissions from Chrome storage
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'FETCH_PROBLEMS') {
        console.log('Received FETCH_PROBLEMS message');
        (async () => {
            try {
                // Fetch problems
                const response = await fetch('https://leetcode.com/api/problems/all/', {
                    credentials: 'include',
                });
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data = await response.json();
                console.log('API Response (Problems):', data);

                if (!data.stat_status_pairs || !Array.isArray(data.stat_status_pairs)) {
                    throw new Error('Invalid API response: stat_status_pairs is not an array');
                }

                const problems = data.stat_status_pairs.map((problem: any) => ({
                    questionId: problem.stat.question_id,
                    title: problem.stat.question__title,
                    slug: problem.stat.question__title_slug,
                    difficulty: problem.difficulty.level,
                    status: problem.status,
                }));
                console.log('Parsed Problems:', problems);
                console.log('Number of Problems:', problems.length);

                // Fetch submissions using GraphQL
                let submissions = [];
                let offset = 0;
                const limit = 20;
                let hasNext = true;
                let fetchFailed = false;

                while (hasNext) {
                    const query = {
                        operationName: "submissions",
                        variables: { offset, limit },
                        query: `query submissions($offset: Int!, $limit: Int!) {
                            submissionList(offset: $offset, limit: $limit) {
                                hasNext
                                submissions {
                                    id
                                    title
                                    titleSlug
                                    statusDisplay
                                    timestamp
                                }
                            }
                        }`
                    };

                    const response = await fetch('https://leetcode.com/graphql', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(query),
                        credentials: 'include',
                    });

                    if (!response.ok) {
                        console.warn(`GraphQL fetch failed with status: ${response.status}`);
                        fetchFailed = true;
                        break;
                    }

                    const data = await response.json();
                    if (data.errors) {
                        console.warn('GraphQL errors:', data.errors);
                        fetchFailed = true;
                        break;
                    }

                    const submissionList = data.data.submissionList;
                    if (!submissionList) {
                        console.warn('No submissionList in response');
                        fetchFailed = true;
                        break;
                    }

                    submissions = submissions.concat(submissionList.submissions);
                    hasNext = submissionList.hasNext;
                    offset += limit;
                    await new Promise(resolve => setTimeout(resolve, 500)); // 0.5-second delay
                }

                const processedSubmissions = submissions.map((sub: any) => ({
                    titleSlug: sub.titleSlug,
                    status: sub.statusDisplay === 'Accepted' ? 'Accepted' : 'Not Accepted',
                    timestamp: sub.timestamp * 1000,
                }));
                console.log('Parsed Submissions:', processedSubmissions);
                console.log('Number of Submissions:', processedSubmissions.length);

                // Check if fetch was successful
                if (fetchFailed) {
                    console.warn('Fetch failed, falling back to storage');
                    const stored = await new Promise((resolve) =>
                        chrome.storage.local.get(['problems'], (result) => resolve(result.problems || []))
                    ) as any[];
                    sendResponse(stored);
                    return;
                }

                const submissionMap = processedSubmissions.reduce((map: any, sub: any) => {
                    const slug = sub.titleSlug;
                    if (!map[slug]) map[slug] = [];
                    map[slug].push(sub);
                    return map;
                }, {});
                console.log('Submission Map:', submissionMap);

                // Process problems using 'ac' status and enhance with submissions
                const processedProblems = problems
                    .filter((problem) => problem.status === 'ac' || problem.status === 'notac')
                    .map((problem) => {
                        const subs = submissionMap[problem.slug] || [];
                        subs.sort((a: any, b: any) => b.timestamp - a.timestamp);

                        let displayStatus = problem.status === 'ac' ? 'Solved' : 'In Progress';
                        let timestamp = null;
                        if (subs.length > 0) {
                            const latestAccepted = subs.find((sub: any) => sub.status === 'Accepted');
                            timestamp = latestAccepted ? new Date(latestAccepted.timestamp) : new Date(subs[0].timestamp);
                        } else if (problem.status === 'ac' && problem.stat && problem.stat.last_attempted_time) {
                            timestamp = new Date(problem.stat.last_attempted_time * 1000);
                        }

                        return {
                            questionId: problem.questionId,
                            title: problem.title,
                            slug: problem.slug,
                            difficulty: { 1: 'Easy', 2: 'Medium', 3: 'Hard' }[problem.difficulty],
                            status: displayStatus,
                            timestamp: timestamp instanceof Date ? timestamp : null,
                        };
                    });

                console.log('Final Processed Problems:', processedProblems);
                console.log('Number of Processed Problems:', processedProblems.length);

                // Retrieve totalAssistance for all problems from Chrome storage
                const problemSlugs = processedProblems.map((problem) => problem.slug);
                const storageResult = await new Promise((resolve) => chrome.storage.local.get(problemSlugs, resolve));
                console.log('Storage Result:', storageResult); // Debug storage data
                const enhancedProblems = processedProblems.map((problem) => {
                const state = storageResult[problem.slug] || {};
                return {
                    ...problem,
                    totalAssistance: state.totalAssistance || 0,
                };
                });

                // Save to storage and send response
                chrome.storage.local.set({ problems: enhancedProblems }, () => {
                console.log('Problems saved to storage');
                });
                sendResponse(enhancedProblems); // Send immediately
            } catch (error) {
                console.error('Error processing problem data:', error);
                const stored = await new Promise((resolve) =>
                chrome.storage.local.get(['problems'], (result) => resolve(result.problems || []))
                ) as any[];
                console.log('Fallback Problems:', stored); // Debug fallback
                sendResponse(stored);
            }
            })();
            return true; // Indicates async response
        }
});