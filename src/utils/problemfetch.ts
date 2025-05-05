export async function fetchProblemContent(titleSlug: string) {
    const query = `
      query questionData($titleSlug: String!) {
        question(titleSlug: $titleSlug) {
          title
          difficulty
          content
        }
      }
    `;
    const response = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { titleSlug } })
    });
  
    const data = await response.json();
    return data.data.question;
  }

  export async function fetchProblemTitle(titleSlug : string) {
    const query = `
      query questionData($titleSlug: String!) {
        question(titleSlug: $titleSlug) {
          questionFrontendId
          title
          difficulty
        }
      }
    `;
  
    const variables = { titleSlug };
  
    const response = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables })
    });
  
    const data = await response.json();
    return data.data.question;
  }
  