import { fetchDebugger } from '@/utils/fetchdebugger';
import { isSubmissionsPage, isExactLeetCodeProblemPage} from '@/utils/browser';

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
    isAccepted = acceptedElem?.textContent?.trim().toLowerCase() === 'accepted';
  } else if (isProblemPage) {
    const consoleResultElem = document.querySelector('span[data-e2e-locator="console-result"]');
    hasResult = !!consoleResultElem;
    isAccepted = consoleResultElem?.textContent?.trim().toLowerCase() === 'accepted';
  }
  // Can't proceed if there's no error(isAccepted) or no test run(!hasResult) on a problem page or there's no error(isAccepted) on a submission page
  if ((isSubmission && isAccepted) || (isProblemPage && (!hasResult || isAccepted))) {
    setDebugResponse('Debugging is only available when there is an error to debug.');
    return;
  }
  
  try {
    const extractSubmissionFromPage = async () => {
      let submittedCode = '';

      // Define the scope for DOM queries
      let rootElement: Document | Element = document; // Default to global document
      if (isSubmission) {
        // Scope to submission page container with specific error context
        const submissionContainer = document.querySelector('div.flex-col.gap-4.px-4.py-3');
        rootElement = submissionContainer;
        console.log("Root Element for Submission:", rootElement);
      } else if (isProblemPage) {
        // Scope to problem page container with specific error context
        const problemContainer = document.querySelector('div.mx-5.my-4.space-y-4 span[data-e2e-locator="console-result"]')?.closest('div.mx-5.my-4.space-y-4');
        rootElement = problemContainer;
        console.log("Root Element for Problem:", rootElement);
      }

      if (!rootElement) {
        throw new Error('Could not determine the correct panel for scraping.');
      }

      // Handle "View More" button to expand hidden error details
      if (isSubmission || isProblemPage) {
        const viewMoreButton = rootElement.querySelector('div.text-sd-muted-foreground div.flex.items-center.gap-1');
        if (viewMoreButton) {
          console.log("Found View More button, attempting to expand...");
          // Simulate a click to expand the hidden content
          (viewMoreButton as HTMLElement).click();
          // Wait briefly to ensure the DOM updates after clicking
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Get error type (e.g., Runtime Error, Time Limit Exceeded, Wrong Answer)
      let errorType = 'Unknown Error';
      if (isSubmission) {
        const errorTypeElem = rootElement.querySelector('h3[class*="text-red-6"], h3[class*="dark:text-red-60"]');
        const errorTypeRaw = errorTypeElem?.textContent?.trim() || 'Unknown Error';
        errorType = errorTypeRaw.replace(/(Error|Exceeded|Answer)(\d+)/, '$1\n$2');
      } else if (isProblemPage) {
        const errorTypeElem = rootElement.querySelector('span.text-red-s.dark\\:text-dark-red-s[data-e2e-locator="console-result"]');
        const errorTypeRaw = errorTypeElem?.textContent?.trim() || 'Unknown Error';
        errorType = errorTypeRaw.replace(/(Error|Exceeded|Answer)(\d+)/, '$1\n$2');
      }

      // Get traceback or error message block
      let traceback = '';
      if (isSubmission) {
        const tracebackElem = rootElement.querySelector('div.font-menlo.whitespace-pre-wrap[class*="text-red"]');
        traceback = tracebackElem?.textContent?.trim() || '';
        // If traceback is incomplete, try to find hidden content
        if (traceback && !traceback.includes('location: class Solution')) {
          const hiddenTraceback = rootElement.querySelector('div.font-menlo.whitespace-pre-wrap[class*="text-red"] > div[style*="display: none"], div.font-menlo.whitespace-pre-wrap[class*="text-red"] > div[style*="height"]');
          if (hiddenTraceback) {
            (hiddenTraceback as HTMLElement).style.display = 'block';
            traceback = rootElement.querySelector('div.font-menlo.whitespace-pre-wrap[class*="text-red"]')?.textContent?.trim() || traceback;
          }
        }
      } else if (isProblemPage) {
        const tracebackElem = rootElement.querySelector('div.font-menlo.whitespace-pre-wrap.text-xs.text-red-60.dark\\:text-red-60');
        traceback = tracebackElem?.textContent?.trim() || '';
        // If traceback is incomplete, try to find hidden content
        if (traceback && !traceback.includes('expected')) {
          const hiddenTraceback = rootElement.querySelector('div.font-menlo.whitespace-pre-wrap.text-xs.text-red-60.dark\\:text-red-60 > div[style*="display: none"], div.font-menlo.whitespace-pre-wrap.text-xs.text-red-60.dark\\:text-red-60 > div[style*="height"]');
          if (hiddenTraceback) {
            (hiddenTraceback as HTMLElement).style.display = 'block';
            traceback = rootElement.querySelector('div.font-menlo.whitespace-pre-wrap.text-xs.text-red-60.dark\\:text-red-60')?.textContent?.trim() || traceback;
          }
        }
      }

      // Determine submitted code based on page type
      if (isSubmission) {
        // Try scraping code for each supported language within the root element
        const languages = ['python', 'java', 'cpp'];
        for (const lang of languages) {
          const codeElement = rootElement.querySelector(`pre code.language-${lang}`);
          console.log("language for submitted:", codeElement);
          if (codeElement) {
            submittedCode = Array.from(codeElement.childNodes)
              .map(node => node.textContent || '')
              .join('')
              .trim();
            break; // Exit loop once we find a match
          }
        }

        // If no code was found for any language, fall back to view-lines
        if (!submittedCode) {
          const fallbackLines = Array.from(rootElement.querySelectorAll('.view-lines > div'));
          submittedCode = fallbackLines
            .map(line => line.textContent || '')
            .join('\n')
            .trim();
        }
      } else if (isProblemPage) {
        // Scrape from Monaco Editor on problem page
        submittedCode = await injectScriptAndGetEditorContent();
      }

      // Construct full error description with only error type and traceback
      let fullErrorDescription = `${errorType}`;
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
  const originalMatch = raw.match(/#*\s?Original Snippet:?[\s\S]*?```(?:\w+)?\s*([\s\S]*?)(?=```)/i);
  const modifiedMatch = raw.match(/#*\s?Modified Snippet:?[\s\S]*?```(?:\w+)?\s*([\s\S]*?)(?=```)/i);
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