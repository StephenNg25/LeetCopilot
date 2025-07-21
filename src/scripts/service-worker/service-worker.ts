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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'FETCH_PROBLEMS') {
        console.log('Received FETCH_PROBLEMS message');
        (async () => {
            try {
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
                    topicTags: [], 
                }));
                console.log('Parsed Problems:', problems);

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
                    await new Promise(resolve => setTimeout(resolve, 500));
                }

                const processedSubmissions = submissions.map((sub: any) => ({
                    id: sub.id,
                    titleSlug: sub.titleSlug,
                    status: sub.statusDisplay === 'Accepted' ? 'Accepted' : 'Not Accepted',
                    timestamp: sub.timestamp * 1000,
                }));
                console.log('Parsed Submissions:', processedSubmissions);

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

                // Fetch topic tags via GraphQL for problems with submissions
                const uniqueSlugs = [...new Set(processedSubmissions.map(sub => sub.titleSlug))];
                const tagMap = {};
                for (const slug of uniqueSlugs) {
                    const query = {
                        operationName: "questionData",
                        variables: { titleSlug: slug },
                        query: `query questionData($titleSlug: String!) {
                            question(titleSlug: $titleSlug) {
                                topicTags {
                                    name
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
                    const data = await response.json();
                    if (data.data && data.data.question && data.data.question.topicTags) {
                        tagMap[slug] = data.data.question.topicTags.map((tag: any) => tag.name);
                    } else {
                        tagMap[slug] = []; 
                    }
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
                console.log('Tag Map:', tagMap);

                const processedProblems = problems
                    .filter((problem) => problem.status === 'ac' || problem.status === 'notac')
                    .map((problem) => {
                        const subs = submissionMap[problem.slug] || [];
                        subs.sort((a: any, b: any) => b.timestamp - a.timestamp);

                        let displayStatus = problem.status === 'ac' ? 'Solved' : 'In Progress';
                        let timestamp = null;
                        let latestSubmissionId = null;
                        if (subs.length > 0) {
                            if (displayStatus === 'Solved') {
                                const latestAccepted = subs.find((sub: any) => sub.status === 'Accepted');
                                timestamp = latestAccepted ? new Date(latestAccepted.timestamp) : new Date(subs[0].timestamp);
                                latestSubmissionId = latestAccepted ? latestAccepted.id : subs[0].id;
                            } else {
                                timestamp = new Date(subs[0].timestamp);
                                latestSubmissionId = subs[0].id; 
                            }
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
                            latestSubmissionId: latestSubmissionId,
                            topicTags: tagMap[problem.slug] || [], 
                        };
                    });

                const problemSlugs = processedProblems.map((problem) => problem.slug);
                const storageResult = await new Promise((resolve) => chrome.storage.local.get(problemSlugs, resolve));
                const enhancedProblems = processedProblems.map((problem) => {
                    const state = storageResult[problem.slug] || {};
                    return {
                        ...problem,
                        totalAssistance: state.totalAssistance || 0,
                    };
                });

                chrome.storage.local.set({ problems: enhancedProblems }, () => {
                    console.log('Problems saved to storage');
                });
                sendResponse(enhancedProblems);
            } catch (error) {
                console.error('Error processing problem data:', error);
                const stored = await new Promise((resolve) =>
                    chrome.storage.local.get(['problems'], (result) => resolve(result.problems || []))
                ) as any[];
                sendResponse(stored);
            }
        })();
        return true;
    } else if (message.type === 'FETCH_SUBMISSION_DETAILS') {
        const submissionId = message.submissionId;
        console.log(`Fetching submission details for ID: ${submissionId}`);
        (async () => {
            try {
                const query = {
                    operationName: "submissionDetails",
                    variables: { submissionId: parseInt(submissionId) },
                    query: `query submissionDetails($submissionId: Int!) {
                        submissionDetails(submissionId: $submissionId) {
                            code
                            statusCode
                            runtimeError
                            memory
                            lang {
                                name
                            }
                            question {
                                content
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
                console.log(`GraphQL response status: ${response.status}`);
                const data = await response.json();
                console.log('GraphQL response data:', data);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status} - ${JSON.stringify(data.errors || {})}`);
                }
                if (data.errors) {
                    throw new Error('GraphQL errors: ' + JSON.stringify(data.errors));
                }
                const submissionDetails = data.data.submissionDetails;
                if (!submissionDetails) {
                    throw new Error('No submission details returned');
                }
                const result = {
                    10: 'Accepted',
                    11: 'Wrong Answer',
                    14: 'Time Limit Exceeded',
                    15: 'Memory Limit Exceeded',
                    20: 'Compile Error',
                    21: 'Runtime Error'
                }[submissionDetails.statusCode] || 'N/A';
                sendResponse({
                    code: submissionDetails.code || 'No code available',
                    result: result,
                    language: submissionDetails.lang.name || 'Unknown',
                    description: submissionDetails.question.content || 'No description available'
                });
            } catch (error) {
                console.error('Error fetching submission details:', error);
                sendResponse({ error: error.message || 'Unknown error', code: 'Error fetching submission', result: 'N/A', language: 'Unknown' });
            }
        })();
        return true;
    }
});