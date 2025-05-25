import { convert } from 'html-to-text';

export async function fetchProblemContent(titleSlug: string) {
  const query = `
    query questionData($titleSlug: String!) {
      question(titleSlug: $titleSlug) {
        content
        codeSnippets {
          lang
          code
        }
      }
    }
  `;
  try {
    const response = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { titleSlug } }),
      credentials: 'include', // Include cookies if authentication is needed
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (!data.data || !data.data.question) {
      throw new Error('No question data found in response');
    }

    const question = data.data.question as {
      content: string;
      codeSnippets: { lang: string; code: string }[];
    };

    // Clean the HTML content
    const cleanedContent = convert(question.content, {
      wordwrap: false, // Prevent line wrapping
      selectors: [
        { selector: 'p', format: 'block' }, // Ensure paragraphs are separated
        { selector: 'pre', format: 'block' }, // Preserve preformatted text (e.g., examples)
        { selector: 'code', format: 'inline' }, // Keep inline code as-is
        { selector: 'strong', format: 'inline' }, // Keep strong text as-is
        { selector: 'ul', format: 'block' }, // Format lists as blocks
        { selector: 'li', format: 'block', prefix: '- ' }, // Add bullet points to list items
      ],
    })
      .replace(/\n{2,}/g, '\n') // Normalize multiple newlines to a single newline
      .trim(); // Remove leading/trailing whitespace

    return {
      content: cleanedContent,
      codeSnippets: question.codeSnippets,
    };
  } catch (error) {
    console.error('[LeetCopilot] Failed to fetch problem content:', error);
    throw error; // Let the caller handle the error
  }
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
