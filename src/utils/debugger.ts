import { fetchDebugger } from '@/utils/fetchdebugger';
import { isSubmissionsPage } from '@/utils/browser';

// Define the new function for exact problem page matching
export const isExactLeetCodeProblemPage = () => {
  // Match exactly https://leetcode.com/problems/problem-title/ or https://leetcode.com/problems/problem-title
  const pattern = /^https:\/\/leetcode\.com\/problems\/[^/]+\/?$/;
  return pattern.test(window.location.href);
};

// Define type for setter functions (React dispatch functions)
type SetStateAction<T> = React.Dispatch<React.SetStateAction<T>>;

// Function to inject script and get editor content
function injectScriptAndGetEditorContent(): Promise<string> {
  return new Promise((resolve) => {
    const scriptSrc = 'js/monaco-get-code.js';
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL(scriptSrc);
    script.onload = () => script.remove();
    (document.head || document.documentElement).appendChild(script);

    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'EDITOR_CONTENT') {
        resolve(event.data.content || '');
        window.removeEventListener('message', handleMessage);
      }
    };
    window.addEventListener('message', handleMessage);
  });
}

// Export handleDebug function for use in Panel
export const handleDebug = async (
  problemContent: string | null,
  setDebugResponse: SetStateAction<string | null>
) => {
  if (!problemContent) return;

  // Check if we're on a submissions page or the exact problem page
  const isSubmission = isSubmissionsPage();
  const isProblemPage = isExactLeetCodeProblemPage();

  // Only proceed if on a valid page (submissions or exact problem page)
  if (!isSubmission && !isProblemPage) {
    setDebugResponse('Debugging is only available on LeetCode problem or submissions pages.');
    return;
  }

  // Check if the result is "accepted" to align with Panel.tsx logic
  let isAccepted = false;
  let hasResult = false;
  if (isSubmission) {
    const acceptedElem = document.querySelector('span[data-e2e-locator="submission-result"]');
    hasResult = !!acceptedElem;
    isAccepted = acceptedElem?.textContent?.trim().toLowerCase() === 'accepted';
  } else if (isProblemPage) {
    const consoleResultElem = document.querySelector('span[data-e2e-locator="console-result"]');
    hasResult = !!consoleResultElem;
    isAccepted = consoleResultElem?.textContent?.trim().toLowerCase() === 'accepted';
  }

  // Only proceed if there is a result and it's not "accepted"
  if (!hasResult || isAccepted) {
    setDebugResponse('Debugging is only available when there is an error to debug.');
    return;
  }

  try {
    const extractSubmissionFromPage = async () => {
      let submittedCode = '';
      // Get error type (e.g., Runtime Error, Time Limit Exceeded, Wrong Answer)
      const errorTypeElem = document.querySelector('h3[class*="text-red-6"], h3[class*="dark:text-red-60"]');
      const errorTypeRaw = errorTypeElem?.textContent?.trim() || 'Unknown Error';
      const errorType = errorTypeRaw.replace(/(Error|Exceeded|Answer)(\d+)/, '$1\n$2');

      // Get traceback or error message block
      const tracebackElem = document.querySelector('div.font-menlo.whitespace-pre-wrap[class*="text-red"]');
      const traceback = tracebackElem?.textContent?.trim() || '';

      // Get input, output, expected, and last executed input values
      const labelElems = Array.from(document.querySelectorAll('div[class*="text-label"]'));
      let inputValue = '';
      let outputValue = '';
      let expectedValue = '';
      let lastExecutedInput = '';

      // Debug: Log all labels found to verify selector
      console.log('Labels found:', labelElems.map(elem => elem.textContent?.trim()));

      for (let i = 0; i < labelElems.length; i++) {
        const key = labelElems[i].textContent?.trim();
        const normalizedKey = key?.toLowerCase() || '';

        if (normalizedKey === 'last executed input') {
          const wrapper = labelElems[i].closest('.flex.flex-col.space-y-2');
          const groupBlocks = wrapper?.querySelectorAll('.group.relative.rounded-lg');

          let inputPairs: string[] = [];
          groupBlocks?.forEach(group => {
            const keyElem = group.querySelector('.text-label-3');
            const valueElem = group.querySelector('.font-menlo');

            const keyRaw = keyElem?.textContent?.trim();
            const value = valueElem?.textContent?.trim();

            const key = keyRaw?.replace(/\s*=\s*$/, '');
            if (key && value) {
              inputPairs.push(`${key} = ${value}`);
            }
          });

          lastExecutedInput = inputPairs.join('\n');
        } else if (normalizedKey === 'input') {
          let inputPairs = [];
          i++; // move to next element after "Input"
          while (i < labelElems.length) {
            const nextKey = labelElems[i].textContent?.trim();
            const nextNormalizedKey = nextKey?.toLowerCase() || '';

            if (nextNormalizedKey === 'output' || nextNormalizedKey === 'expected') {
              i--;
              break;
            }

            if (/^\[.*\]$/.test(nextKey) || /^".*"$/.test(nextKey) || /^[\d.]+$/.test(nextKey)) {
              i++;
              continue;
            }

            const nextValueElem = labelElems[i].parentElement?.querySelector('div.font-menlo');
            const nextValue = nextValueElem?.textContent?.trim() || '';

            if (nextKey && nextValue) {
              const cleanedKey = nextKey.replace(/\s*=\s*$/, '');
              inputPairs.push(`${cleanedKey} = ${nextValue}`);
            }
            i++;
          }
          inputValue = inputPairs.join('\n');
        } else if (normalizedKey === 'output') {
          const valueElem = labelElems[i].parentElement?.querySelector('div.font-menlo');
          outputValue = valueElem?.textContent?.trim() || '';
        } else if (normalizedKey === 'expected') {
          const valueElem = labelElems[i].parentElement?.querySelector('div.font-menlo');
          expectedValue = valueElem?.textContent?.trim() || '';
        }
      }

      // Determine submitted code based on page type
      if (isSubmission) {
        // Scrape from submissions page
        const codeElement = document.querySelector('pre code.language-python');
        if (codeElement) {
          submittedCode = Array.from(codeElement.childNodes)
            .map(node => node.textContent || '')
            .join('')
            .trim();
        } else {
          const fallbackLines = Array.from(document.querySelectorAll('.view-lines > div'));
          submittedCode = fallbackLines
            .map(line => line.textContent || '')
            .join('\n')
            .trim();
        }
      } else if (isProblemPage) {
        // Scrape from Monaco Editor on problem page
        submittedCode = await injectScriptAndGetEditorContent();
      }

      // Construct full error description
      let fullErrorDescription = `${errorType}`;
      if (lastExecutedInput) {
        fullErrorDescription += `\n\nLast Executed Input:\n${lastExecutedInput}`;
      }
      if (inputValue) {
        fullErrorDescription += `\n\nInput:\n${inputValue}`;
      }
      if (outputValue) {
        fullErrorDescription += `\n\nOutput:\n${outputValue}`;
      }
      if (expectedValue) {
        fullErrorDescription += `\n\nExpected:\n${expectedValue}`;
      }
      if (traceback) {
        fullErrorDescription += `\n\n${traceback}`;
      }

      return { submittedCode, fullErrorDescription };
    };

    const { submittedCode, fullErrorDescription } = await extractSubmissionFromPage();
    console.log('errorDescription:', fullErrorDescription);
    console.log('submittedCode:', submittedCode);

    const debugResult = await fetchDebugger(problemContent, submittedCode, fullErrorDescription);
    setDebugResponse(debugResult || 'Debugging failed.');
  } catch (error) {
    console.error('[DEBUG] Failed:', error);
    setDebugResponse('Error during debugging.');
  }
};

export interface DebugPatch {
  original: string;
  modified: string;
  explanation: string;
}

export function parsePatchResponse(raw: string): DebugPatch | null {
  const originalMatch = raw.match(/#*\s?Original Snippet:?[\s\S]*?```python\s+([\s\S]*?)(?=\n```|$)/i);
  const modifiedMatch = raw.match(/#*\s?Modified Snippet:?[\s\S]*?```python\s+([\s\S]*?)(?=\n```|$)/i);
  const explanationMatch = raw.match(/#*\s?Diagnostic Explanation:?[\s\S]*$/i);

  if (!originalMatch || !modifiedMatch) return null;

  let explanation = '';
  if (explanationMatch) {
    explanation = explanationMatch[0].split(/#*\s?Diagnostic Explanation:?/i)[1].trim() || '';
  } else {
    const modifiedEndIndex = modifiedMatch.index! + modifiedMatch[0].length;
    explanation = raw.substring(modifiedEndIndex).trim();
  }

  return {
    original: originalMatch[1].trim(),
    modified: modifiedMatch[1].trim(),
    explanation: explanation
  };
}