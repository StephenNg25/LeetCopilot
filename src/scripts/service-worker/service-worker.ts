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
            difficulty: problem.difficulty.level,
            status: problem.status,
          }));
          console.log('Parsed Problems:', problems);
          console.log('Number of Problems:', problems.length);
  
          // Optionally fetch submissions (with error handling)
          let submissions = [];
          let offset = 0;
          const limit = 20;
          try {
            while (true) {
              const subResponse = await fetch(
                `https://leetcode.com/api/submissions/?limit=${limit}&offset=${offset}`,
                { credentials: 'include' }
              );
              if (!subResponse.ok) {
                console.warn(`Submissions fetch failed at offset ${offset} with status: ${subResponse.status}`);
                break;
              }
              const subData = await subResponse.json();
              console.log('Submissions Response:', subData);
  
              if (!subData.submissions_dump || !Array.isArray(subData.submissions_dump)) {
                console.warn('Invalid submissions response: submissions_dump is not an array');
                break;
              }
  
              submissions = submissions.concat(subData.submissions_dump);
              console.log('Current Submissions (Page):', subData.submissions_dump);
              console.log('Total Submissions so far:', submissions.length);
  
              if (!subData.has_next) break;
              offset += limit;
              await new Promise((resolve) => setTimeout(resolve, 500)); // 0.5 seconds delay to avoid rate limiting
            }
          } catch (subError) {
            console.error('Error fetching submissions:', subError);
          }
          const processedSubmissions = submissions.map((sub: any) => ({
            questionId: sub.question_id,
            status: sub.status === 'Accepted' ? 'Accepted' : 'Not Accepted',
            timestamp: sub.timestamp * 1000,
          }));
          console.log('Parsed Submissions:', processedSubmissions);
          console.log('Number of Submissions:', processedSubmissions.length);
  
          // Map submissions by questionId
          const submissionMap = processedSubmissions.reduce((map: any, sub: any) => {
            if (!map[sub.questionId]) map[sub.questionId] = [];
            map[sub.questionId].push(sub);
            return map;
          }, {});
          console.log('Submission Map:', submissionMap);
  
          // Process problems using 'ac' status and enhance with submissions if available
          const processedProblems = problems
            .filter((problem) => problem.status === 'ac' || problem.status === 'notac')
            .map((problem) => {
                const subs = submissionMap[problem.questionId] || [];
                subs.sort((a: any, b: any) => b.timestamp - a.timestamp);

                let displayStatus = problem.status === 'ac' ? 'Solved' : 'In Progress';
                let timestamp = null;
                if (subs.length > 0) {
                const latestAccepted = subs.find((sub: any) => sub.status === 'Accepted');
                timestamp = latestAccepted ? new Date(latestAccepted.timestamp) : new Date(subs[0].timestamp);
                } else if (problem.status === 'ac' && problem.stat && problem.stat.last_attempted_time) {
                // Fallback to last_attempted_time from problems API if available
                timestamp = new Date(problem.stat.last_attempted_time * 1000);
                }

                return {
                questionId: problem.questionId,
                title: problem.title,
                difficulty: { 1: 'Easy', 2: 'Medium', 3: 'Hard' }[problem.difficulty],
                status: displayStatus,
                timestamp: timestamp instanceof Date ? timestamp : null,
                };
            });
  
          console.log('Final Processed Problems:', processedProblems);
          console.log('Number of Processed Problems:', processedProblems.length);
          sendResponse(processedProblems);
        } catch (error) {
          console.error('Error processing problem data:', error);
          sendResponse([]); // Fallback to empty array on error
        }
      })();
      return true; // Indicates async response
    }
  });