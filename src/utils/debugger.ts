import { fetchDebugger } from '@/utils/fetchdebugger';
import { isSubmissionsPage } from '@/utils/browser';

// Define type for setter functions (React dispatch functions)
type SetStateAction<T> = React.Dispatch<React.SetStateAction<T>>;

// export handleDebug function for use in Panel
export const handleDebug = async ( problemContent: string | null, setDebugResponse: SetStateAction<string | null>) => {
    if (!isSubmissionsPage() || !problemContent) return;
    
    try {
      const extractSubmissionFromPage = () => {
        // Get submitted code from <code> block inside <pre>
        const codeElement = document.querySelector('pre code.language-python');
        let submittedCode = '';
  
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
            // Find the wrapper that contains all variable rows under Last Executed Input
            const wrapper = labelElems[i].closest('.flex.flex-col.space-y-2');
            const groupBlocks = wrapper?.querySelectorAll('.group.relative.rounded-lg');
          
            let inputPairs: string[] = [];
            groupBlocks?.forEach(group => {
              const keyElem = group.querySelector('.text-label-3');
              const valueElem = group.querySelector('.font-menlo');
          
              const keyRaw = keyElem?.textContent?.trim();
              const value = valueElem?.textContent?.trim();
          
              // Clean key: remove trailing '=' and whitespace
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
          
              // Skip value lines accidentally parsed as label elements
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
  
        // Construct full error description with conditional sections and traceback
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
  
      const { submittedCode, fullErrorDescription } = extractSubmissionFromPage();
      console.log('errorDescription:', fullErrorDescription);
  
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
    const originalMatch = raw.match(/### Original Snippet[\s\S]*?```python\s+([\s\S]*?)```/);
    const modifiedMatch = raw.match(/### Modified Snippet[\s\S]*?```python\s+([\s\S]*?)```/);
    const explanationMatch = raw.match(/### Diagnostic Explanation\n([\s\S]*?)(?=\n###|$)/);
  
    if (!originalMatch || !modifiedMatch || !explanationMatch) return null;
  
    return {
      original: originalMatch[1].trim(),
      modified: modifiedMatch[1].trim(),
      explanation: explanationMatch[1].trim()
    };
  }