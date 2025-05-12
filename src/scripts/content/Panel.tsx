import { fetchProblemContent, fetchProblemTitle } from '@/utils/problemfetch';
import { fetchHintFromGroq } from '@/utils/fetchhint';
import { fetchConversation } from '@/utils/fetchconversation';
import { fetchThoughtsEvaluation } from '@/utils/fetchthoughts';
import { fetchDebugger } from '@/utils/fetchdebugger';
import { isSubmissionsPage } from '@/utils/browser';
import { cn } from '@/utils/browser';
import React, { useState, useEffect, useRef } from 'react';
import { Lock, Unlock, BookOpen, CheckCircle2, Star } from 'lucide-react';
import WLCPLogo from '@/assets/LCP-W.png';
import ExpandIcon from '@/assets/expand.png';
import ExpandedHintModal from './ExpandedHintChat';

const hintData = [
  { percent: 10, text: 'This is an O(n^2) approach hint and weighs 10% of the problem. Do you want to use it?' },
  { percent: 20, text: 'This is an O(n) approach hint and weighs 20% of the problem. Do you want to use it?' },
  { percent: 30, text: 'This is an O(n^2) technical hint and weighs 30% of the problem. Do you want to use it?' },
  { percent: 40, text: 'This is an O(n) technical hint and weighs 40% of the problem. Do you want to use it?' },
  { percent: 100, text: 'This is the entire most optimized solution. Do you want to see it?' }
];

const tabIcons = {
  'Problem': <BookOpen size={18} />, 
  'Solved': <CheckCircle2 size={18} />, 
  'Favourite': <Star size={18} />
};

const languages = ['Python', 'C++', 'Java'];

const getHintLevel = (percent: number): number => {
  const levels = [10, 20, 30, 40, 100];
  return levels.includes(percent) ? percent : 10;
};

const ERROR_MESSAGE = "I’m sorry, I can only assist based on the current hint.";

const Panel = ({
  onClose,
  activeHint,
  setActiveHint,
  hintMessages,
  setHintMessages,
  unlockedHints,
  setUnlockedHints,
  totalAssistance,
  setTotalAssistance,
  userInput,
  setUserInput,
  isExpanded,
  setIsExpanded
}) => {
  const [tab, setTab] = useState('Problem');
  const [languageIndex, setLanguageIndex] = useState(0);
  const [problemTitle, setProblemTitle] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [problemContent, setProblemContent] = useState<string | null>(null);
  const [thoughts, setThoughts] = useState('');
  const [aiFeedback, setAiFeedback] = useState('');
  const [timeComplexity, setTimeComplexity] = useState('N/A');
  const [optimizedScore, setOptimizedScore] = useState('0');
  const [debugResponse, setDebugResponse] = useState<string | null>(null);
  const chatEndRef = useRef(null);

  const isHintUnlocked = unlockedHints.has(activeHint);

  const scrollLeft = () => setLanguageIndex(prev => Math.max(prev - 1, 0));
  const scrollRight = () => setLanguageIndex(prev => Math.min(prev + 1, languages.length - 1));

  const getDifficultyColor = (level) => {
    switch (level.toLowerCase()) {
      case 'easy': return 'text-green-500';
      case 'medium': return 'text-yellow-500';
      case 'hard': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  useEffect(() => {
    const titleSlug = window.location.pathname.split('/')[2];
    const getProblemInfo = async () => {
      try {
        const problem = await fetchProblemTitle(titleSlug);
        setProblemTitle(`${problem.questionFrontendId}. ${problem.title}`);
        setDifficulty(problem.difficulty);
        const content = await fetchProblemContent(titleSlug);
        setProblemContent(content?.content || null);
      } catch (err) {
        console.error('[LeetCopilot] Failed to fetch problem:', err);
      }
    };
    getProblemInfo();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [hintMessages, activeHint]);

  const currentLanguage = languages[languageIndex];

  const handleSendMessage = async (input = userInput, hint = activeHint) => {
    const trimmed = input.trim();
    if (!trimmed || isSending || !problemContent) return;

    setIsSending(true);

    const newUserMsg = { role: 'user', text: trimmed };
    const prevMessages = hintMessages[hint] || [];

    setHintMessages(prev => ({
      ...prev,
      [hint]: [...prevMessages, newUserMsg]
    }));

    if (input === userInput) {
      setUserInput('');
    }

    try {
      const reducedHistory = prevMessages.length > 0
        ? [
            prevMessages[0],
            ...prevMessages.slice(1).slice(-6)
          ]
        : [];

      if (reducedHistory.length >= 2 && reducedHistory[reducedHistory.length - 1].role === 'assistant' && reducedHistory[reducedHistory.length - 1].text === ERROR_MESSAGE) {
        reducedHistory.pop();
        if (reducedHistory.length > 1 && reducedHistory[reducedHistory.length - 1].role === 'user') {
          reducedHistory.pop();
        }
      }

      const hintLevel = getHintLevel(hint);
      const aiResponse = await fetchConversation(reducedHistory, trimmed, hintLevel, problemContent);

      setHintMessages(prev => ({
        ...prev,
        [hint]: [...(prev[hint] || []), { role: 'assistant', text: aiResponse }]
      }));
    } catch (err) {
      console.error('[Chat] Failed to get AI response:', err);
      setHintMessages(prev => ({
        ...prev,
        [hint]: [...(prev[hint] || []), { role: 'assistant', text: 'Sorry, I am burning out at this point. Please try again later!' }]
      }));
    } finally {
      setIsSending(false);
    }
  };

  const handleUnlockHint = async (percent: number) => {
    try {
      const titleSlug = window.location.pathname.split('/')[2];
      const problemContentData = await fetchProblemContent(titleSlug);
      if (!problemContentData || !problemContentData.content) return;
      const problemContent = problemContentData.content;
      setProblemContent(problemContent);
      const hintMessage = await fetchHintFromGroq(percent, problemContent);

      setHintMessages(prev => ({
        ...prev,
        [percent]: [
          { role: 'assistant', text: hintMessage },
          { role: 'assistant', text: "Ohh! Pardon me for not introducing myself (^-^'). I'm your AI assistant for the above hint. Feel free to ask me anything about it" }
        ]
      }));
      const newUnlocked = new Set(unlockedHints);
      newUnlocked.add(percent);
      setUnlockedHints(newUnlocked);
      const unlockedArray = Array.from(newUnlocked).map(Number);
      const total = unlockedArray.reduce((sum, hint) => sum + hint, 0);
      setTotalAssistance(Math.min(100, total));
    } catch (error) {
      console.error('Failed to unlock hint:', error);
    }
  };

  const handleEvaluate = async () => {
    if (!thoughts.trim() || !problemContent) return;
    try {
      const { timeComplexity, optimizedScore, feedback } = await fetchThoughtsEvaluation(thoughts, problemContent);
      setTimeComplexity(timeComplexity);
      setOptimizedScore(optimizedScore);
      setAiFeedback(feedback);
    } catch (error) {
      console.error('Failed to evaluate thoughts:', error);
      setAiFeedback('Error evaluating your approach.');
    }
  };

  const handleDelete = () => {
    setThoughts('');
    setAiFeedback('');
    setTimeComplexity('N/A');
    setOptimizedScore('0');
  };
  
const handleDebug = async () => {
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
            // Collect all variable name-value pairs until we hit Output or Expected
            let inputPairs = [];
            i++; // Move to the next label after "Last Executed Input"
            while (i < labelElems.length) {
              const nextKey = labelElems[i].textContent?.trim();
              const nextNormalizedKey = nextKey?.toLowerCase() || '';
              if (nextNormalizedKey === 'output' || nextNormalizedKey === 'expected') {
                i--; // Step back so the Output/Expected label can be processed in the next iteration
                break;
              }
              const nextValueElem = labelElems[i].parentElement?.querySelector('div.font-menlo');
              const nextValue = nextValueElem?.textContent?.trim() || '';
              if (nextKey && nextValue) {
                // Clean nextKey to remove any trailing '=' or whitespace
                const cleanedKey = nextKey.replace(/\s*=\s*$/, '');
                inputPairs.push(`${cleanedKey} = ${nextValue}`);
              }
              i++;
            }
            // Join all input pairs with newlines
            lastExecutedInput = inputPairs.join('\n');
          } else if (normalizedKey === 'input') {
            // Collect all variable name-value pairs until we hit Output or Expected
            let inputPairs = [];
            i++; // Move to the next label after "Input"
            while (i < labelElems.length) {
              const nextKey = labelElems[i].textContent?.trim();
              const nextNormalizedKey = nextKey?.toLowerCase() || '';
              if (nextNormalizedKey === 'output' || nextNormalizedKey === 'expected') {
                i--; // Step back so the Output/Expected label can be processed in the next iteration
                break;
              }
              const nextValueElem = labelElems[i].parentElement?.querySelector('div.font-menlo');
              const nextValue = nextValueElem?.textContent?.trim() || '';
              if (nextKey && nextValue) {
                // Clean nextKey to remove any trailing '=' or whitespace
                const cleanedKey = nextKey.replace(/\s*=\s*$/, '');
                inputPairs.push(`${cleanedKey} = ${nextValue}`);
              }
              i++;
            }
            // Join all input pairs with newlines
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
      setDebugResponse(debugResult);
      setAiFeedback(debugResult || 'Debugging failed.');
    } catch (error) {
      console.error('[DEBUG] Failed:', error);
      setAiFeedback('Error during debugging.');
    }
  };  

  useEffect(() => {
    document.body.style.overflow = isExpanded ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isExpanded]);

  return (
    <div 
      className="fixed bg-white text-zinc-800 shadow-2xl z-[999999] border border-gray-200 flex flex-col font-sans p-5 gap-5 overflow-y-auto rounded-xl" 
      style={{ 
        top: '10px', 
        right: '10px', 
        bottom: '10px', 
        width: '600px', 
        maxHeight: 'calc(100% - 30px)',
        overflowY: 'auto'
      }}
    >
      <div className="border-b border-gray-200 pb-3 flex-shrink-0">
        <div className="flex justify-between items-start mb-2">
          <img src={WLCPLogo} alt="LeetCopilot" className="h-10 w-auto object-contain pointer-events-none" />
          <button onClick={onClose} className="text-gray-500 hover:text-red-400 transition-colors duration-200 h-6 w-6 text-sm rounded-full flex items-center justify-center hover:bg-gray-100">✕</button>
        </div>
        <div className="rounded-xl bg-gray-50 p-1 shadow-sm border border-gray-200/30">
          <div className="flex justify-center space-x-2">
            {['Problem', 'Solved', 'Favourite'].map(item => (
              <button
                key={item}
                onClick={() => setTab(item)}
                className={cn("flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 flex-1 justify-center", tab === item ? "bg-white text-orange-500 border border-gray-200 shadow-sm" : "bg-transparent text-gray-600 hover:bg-white/60")}
              >
                {tabIcons[item]}
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="text-base font-medium text-left flex-shrink-0">
        {problemTitle} – <span className={cn("font-semibold", getDifficultyColor(difficulty))}>{difficulty}</span>
        <div className="border border-gray-300 rounded-md p-3 mt-2 shadow-sm bg-white relative">
          <div className="flex justify-between items-center mb-2 text-sm font-medium">
            <div className="flex space-x-2">
              <button onClick={handleDelete} className="px-2 py-1 bg-red-100 text-red-500 rounded hover:bg-red-200 transition">DELETE</button>
              <button onClick={handleEvaluate} className="px-2 py-1 bg-blue-100 text-blue-500 rounded hover:bg-blue-200 transition">EVALUATE</button>
            </div>
            <div className="text-gray-600">
              Time Complexity: <span className="font-semibold">{timeComplexity}</span>   Ideal: <span className="font-semibold">{optimizedScore}/10</span>
            </div>
          </div>
          <div className="max-h-[90px] overflow-y-auto">
            <textarea
              placeholder="Tell us your thought of approaching?...."
              className="w-full border border-gray-200 rounded p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-300 min-h-[60px]"
              value={thoughts}
              onChange={(e) => setThoughts(e.target.value)}
            />
            {aiFeedback && <div className="text-gray-500 text-sm mt-1">{aiFeedback}</div>}
          </div>
        </div>
      </p>

      <div className="rounded-full bg-gray-100 px-2 py-1 shadow-inner border border-gray-200 flex items-center justify-between flex-shrink-0">
        <button onClick={scrollLeft} disabled={languageIndex === 0} className="p-1.5 rounded-full hover:bg-gray-200 transition disabled:opacity-30">◀</button>
        <div className="flex w-full justify-center">
          {languages.map((lang, i) => (
            <button key={lang} onClick={() => setLanguageIndex(i)} className={cn("text-base px-6 py-2 rounded-full font-medium transition-all duration-200", i === languageIndex ? "bg-white text-orange-500 shadow-md" : "text-gray-500 hover:text-orange-400")}>{lang}</button>
          ))}
        </div>
        <button onClick={scrollRight} disabled={languageIndex === languages.length - 1} className="p-1.5 rounded-full hover:bg-gray-200 transition disabled:opacity-30">▶</button>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
        <div className="flex flex-col w-[70px] h-full gap-1.5 flex-shrink-0">
          {hintData.map(({ percent }) => (
            <button key={percent} 
              onClick={() => setActiveHint(percent)} 
              className={cn(
                "flex flex-col items-center justify-center flex-1 px-2 transition-all duration-200",
                "hover:bg-gray-50 border", 
                activeHint === percent 
                  ? "border-orange-400/80 bg-white text-orange-500 shadow-sm rounded-lg" 
                  : "border-gray-100 text-gray-500"
              )}
            > 
              {unlockedHints.has(percent) ? (
                <Unlock size={18} className="mb-1.5 text-green-500" />
              ) : (
                <Lock size={18} className="mb-1.5 text-red-300" />
              )}
              <span className="text-sm font-medium">{percent}%</span>
            </button>
          ))}
        </div>

        <div className="flex flex-col flex-1 rounded-xl bg-white px-5 pt-5 pb-3 shadow-md border border-gray-200/30">
          <div className="flex-1 flex flex-col overflow-hidden min-h-[200px] max-h-[300px]">
            {isHintUnlocked ? (
              <div className="flex flex-col flex-1 gap-3 overflow-hidden">
                <div className="flex-1 overflow-y-auto px-1 pb-2 space-y-3 min-h-0">
                  {(hintMessages[activeHint] || []).map((msg, idx) => (
                    <div key={idx} className={msg.role === 'assistant' ? 'flex items-start gap-2' : 'flex justify-end'}>
                      {msg.role === 'assistant' ? (
                        <>
                          <div className="h-6 w-6 flex items-center justify-center text-lg">🤓</div>
                          <div className="text-sm text-gray-700 max-w-[90%] break-words whitespace-pre-wrap">{msg.text}</div>
                        </>
                      ) : (
                        <div className="bg-gray-100 rounded-xl px-3 py-2 text-sm text-zinc-900 max-w-[70%] break-words whitespace-pre-wrap break-all">
                          {msg.text}
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                <div className="relative flex items-center mb-1 w-[98%] self-center">
                  <div className="flex flex-row-reverse w-full">
                    <textarea
                      className="w-full rounded-md px-4 py-2 border border-gray-300 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white pr-14 overflow-wrap break-word"
                      rows={1}
                      value={userInput}
                      placeholder="Message LeetCopilot..."
                      onChange={(e) => setUserInput(e.target.value)}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        const newHeight = Math.min(target.scrollHeight, 100);
                        target.style.height = `${newHeight}px`;
                        target.style.overflowY = target.scrollHeight > 100 ? 'auto' : 'hidden';
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                          setUserInput("");
                          const target = e.target as HTMLTextAreaElement;
                          target.style.height = 'auto';
                          target.style.height = `${Math.min(target.scrollHeight, 100)}px`;
                          target.style.overflowY = target.scrollHeight > 100 ? 'auto' : 'hidden';
                        }
                      }}
                      style={{ direction: 'ltr', overflowY: 'hidden' }}
                    />
                  </div>
                  
                  <button
                    title="Expand"
                    onClick={() => setIsExpanded(true)}
                    className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 hover:opacity-80 transition"
                  >
                    <img
                      src={ExpandIcon}
                      alt="Expand"
                      className="w-5 h-5 object-contain"
                    />
                  </button>

                  <button
                    onClick={() => {
                      handleSendMessage();
                      setUserInput("");
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-orange-500 hover:bg-orange-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs shadow"
                  >↑</button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-lg text-zinc-700 leading-relaxed mb-3">
                  {hintData.find(h => h.percent === activeHint)?.text || ''}<br />
                  <span className="text-sm text-gray-400">Language: {currentLanguage}</span>
                </p>
                <div className="flex justify-center mb-3">
                  <button onClick={() => handleUnlockHint(activeHint)}
                          className="px-8 py-2.5 bg-orange-400 text-white font-medium text-base rounded-lg
                                     transition-all duration-200 hover:bg-orange-500 focus:outline-none focus:ring-2
                                     focus:ring-orange-400/30 shadow-sm hover:shadow-md flex items-center justify-center">
                                     UNLOCK
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="flex justify-between items-center mt-auto pt-2 border-t border-gray-200 flex-shrink-0">
            <span className="text-sm text-gray-500 font-medium">Assistance used: {totalAssistance}%</span>
            <div className="flex gap-3">
              <button
                onClick={handleDebug}
                disabled={!isSubmissionsPage()}
                className={cn("px-6 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-zinc-700 transition-colors duration-200 text-sm border border-gray-200 shadow-sm hover:shadow",
                  !isSubmissionsPage() && "opacity-50 cursor-not-allowed")}
              >
                DEBUG
              </button>
              <button className="px-6 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-zinc-700 transition-colors duration-200 text-sm border border-gray-200 shadow-sm hover:shadow">SAVE</button>
            </div>
          </div>
        </div>
      </div>
      {isExpanded && (
        <ExpandedHintModal
          onClose={() => setIsExpanded(false)}
          hintMessages={hintMessages}
          activeHint={activeHint}
          setActiveHint={setActiveHint}
          unlockedHints={unlockedHints}
          handleUnlockHint={handleUnlockHint}
          userInput={userInput}
          setUserInput={setUserInput}
          handleSendMessage={handleSendMessage}
        />
      )}
    </div>
  );
};

export default Panel;