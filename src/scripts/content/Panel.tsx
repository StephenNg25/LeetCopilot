import { fetchProblemContent, fetchProblemTitle } from '@/utils/problemfetch';
import { fetchHintFromGroq } from '@/utils/fetchhint';
import { fetchConversation } from '@/utils/fetchconversation';
import { fetchThoughtsEvaluation } from '@/utils/fetchthoughts';
import { isSubmissionsPage, isLeetCodeProblemPage, cn } from '@/utils/browser';
import { handleDebug } from '@/utils/debugger'; 
import React, { useState, useEffect, useRef } from 'react';
import { Lock, Unlock, BookOpen, CheckCircle2, Star } from 'lucide-react';
import WLCPLogo from '@/assets/LCP-W.png';
import ExpandIcon from '@/assets/expand.png';
import ExpandedHintModal from './ExpandedHintChat';
import { parsePatchResponse } from '@/utils/debugger';
import FixSuggestionCard from './FixSuggestionCard';
import ErrorDisplay from './ErrorDisplay';

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

// Injecting Script for Selecting All Monaco Editor (monaco-select-all.js)
function injectScriptBySrc(srcPath: string) {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL(srcPath);
  script.onload = () => script.remove();
  (document.head || document.documentElement).appendChild(script);
}

const Panel = ({
  onClose,
  onReset,
  thoughts,
  setThoughts,
  aiFeedback,
  setAiFeedback,
  timeComplexity,
  setTimeComplexity, 
  optimizedScore,
  setOptimizedScore,
  activeHint,
  setActiveHint,
  hintMessages,
  setHintMessages,
  unlockedHints,
  setUnlockedHints,
  totalAssistance,
  setTotalAssistance,
  isExpanded,
  setIsExpanded,
  debugResponse,
  setDebugResponse,
  debugPatch,
  setDebugPatch,
  isDebugDisabled,
  setReducedHistory
}) => {
  const [inputHeight, setInputHeight] = useState(36); // default height
  const [userInput, setUserInput] = useState('')
  const [tab, setTab] = useState('Problem');
  const [languageIndex, setLanguageIndex] = useState(0);
  const [problemTitle, setProblemTitle] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [problemContent, setProblemContent] = useState<string | null>(null);
  const [cardHeight, setCardHeight] = useState<number>(0); 
  const chatEndRef = useRef(null);
  const fixCardRef = useRef<HTMLDivElement>(null);
  const [parsed, setParsed] = useState(null);
  const [isErrorVisible, setIsErrorVisible] = useState(false);

  const currentLanguage = languages[languageIndex];
  // Create a key for language-specific hints (30, 40, 100)
  const hintKey = activeHint >= 30 ? `${activeHint}-${currentLanguage}` : `${activeHint}`;
  const isHintUnlocked = unlockedHints.has(hintKey);
  

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
  }, [hintMessages, activeHint, currentLanguage]);

  const handleSendMessage = async (input = userInput, hint = activeHint) => {
    const trimmed = input.trim();
    if (!trimmed || isSending || !problemContent) return;

    setIsSending(true);

    const newUserMsg = { role: 'user', text: trimmed };
    const currentHintKey = hint >= 30 ? `${hint}-${currentLanguage}` : `${hint}`;
    const prevMessages = hintMessages[currentHintKey] || [];

    setHintMessages(prev => ({
      ...prev,
      [currentHintKey]: [...prevMessages, newUserMsg]
    }));

    if (input === userInput) {
      setUserInput('');
    }

    try {
      // Debug: Log the full message history
      console.log('Full prevMessages:', prevMessages);

      // Step 1: Keep the initial hint and the rest of the messages
      const initialHint = prevMessages.length > 0 ? prevMessages[0] : null;
      let workingMessages = prevMessages.length > 0 ? [...prevMessages.slice(1)] : [];

      // Step 2: Filter out error messages and their preceding user messages
      let i = 0;
      while (i < workingMessages.length) {
        if (workingMessages[i].role === 'assistant' && (workingMessages[i].text === ERROR_MESSAGE || workingMessages[i].text === 'Sorry, I am burning out at this point. Please try again later!')) {
          workingMessages.splice(i, 1);
          if (i > 0 && workingMessages[i - 1].role === 'user') {
            workingMessages.splice(i - 1, 1);
            i--;
          }
        } else {
          i++;
        }
      }
      const reducedHistory = initialHint ? [initialHint, ...workingMessages] : [];

      // Step 3: Temporarily update reducedHistory without the last pair of message and fetchAPI 
      setReducedHistory(reducedHistory);
      console.log('Current reducedHistory:', reducedHistory);
      const hintLevel = getHintLevel(hint);
      const aiResponse = await fetchConversation(reducedHistory, trimmed, hintLevel, problemContent);

      // Step 4: Imediately add the last pair of new user and assistant messages to the history without waiting new user inputs to trigger the save
      let updatedHistory = [...reducedHistory, newUserMsg, { role: 'assistant', text: aiResponse }];

      // Step 5: Filter the updated history again for the last pair only 
      i = 0;
      while (i < updatedHistory.length) {
        if (updatedHistory[i].role === 'assistant' && (updatedHistory[i].text === ERROR_MESSAGE || updatedHistory[i].text === 'Sorry, I am burning out at this point. Please try again later!')) {
          updatedHistory.splice(i, 1);
          if (i > 0 && updatedHistory[i - 1].role === 'user') {
            updatedHistory.splice(i - 1, 1);
            i--;
          }
        } else {
          i++;
        }
      }
      
      // Step 6: Take the last 6 messages (3 pairs) from the filtered list
      const updatedreducedHistory = updatedHistory.length > 0 ? updatedHistory.slice(1).slice(-6) : [];

      // Step 7: Add initialHint in front of updatedreducedHistory
      const finalReducedHistory = initialHint ? [initialHint, ...updatedreducedHistory] : updatedreducedHistory;
      console.log('Final updatedHistory:', finalReducedHistory); // Debug: Log the pre-filtered reducedHistory
      
      // Step 8: Update reducedHistory with the last message included if valid
      setReducedHistory(finalReducedHistory);
      setHintMessages(prev => ({
        ...prev,
        [currentHintKey]: [...(prev[currentHintKey] || []), { role: 'assistant', text: aiResponse }]
      }));
    } catch (err) {
      console.error('[Chat] Failed to get AI response:', err);
      setHintMessages(prev => ({
        ...prev,
        [currentHintKey]: [...(prev[currentHintKey] || []), { role: 'assistant', text: 'Sorry, I am burning out at this point. Please try again later!' }]
      }));
    } finally {
      setIsSending(false);
    }
  };

  const handleUnlockHint = async (percent: number, language: string) => {
    try {
      const languageMap = {
        'Python': 'Python',
        'C++': 'C++',
        'Java': 'Java',
      };
      const titleSlug = window.location.pathname.split('/')[2];
      const problemContentData = await fetchProblemContent(titleSlug);
      if (!problemContentData || !problemContentData.content) return;
      const problemContent = problemContentData.content;
      const codeSnippets = problemContentData.codeSnippets;
      console.log("codeSnippets", codeSnippets);
      const selectedLang = languageMap[language];
      console.log("language:", selectedLang);
      const codeTemplate = codeSnippets.find(snippet => snippet.lang === selectedLang)?.code || null;
      console.log("code template:", codeTemplate);
      setProblemContent(problemContent);
      const hintMessage = await fetchHintFromGroq(percent, problemContent, codeTemplate, language);

      const hintKey = percent >= 30 ? `${percent}-${language}` : `${percent}`;
      setHintMessages(prev => ({
        ...prev,
        [hintKey]: [
          { role: 'assistant', text: hintMessage },
          { role: 'assistant', text: "I'm your AI buddy for the above hint. Feel free to ask me anything about it ~(˘▾˘~)" }
        ]
      }));
      const newUnlocked = new Set(unlockedHints);
      newUnlocked.add(hintKey);
      setUnlockedHints(newUnlocked);
      const unlockedArray = Array.from(newUnlocked)
        .map(key => {
          const [percent] = (key as string).split('-');
          return Number(percent);
        })
        .filter((percent, index, self) => self.indexOf(percent) === index); // Deduplicate by percent
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

  useEffect(() => {
    document.body.style.overflow = isExpanded ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isExpanded]);

  useEffect(() => {
    if (debugResponse) {
      console.log('Received debugResponse:', debugResponse);
      const parsed = parsePatchResponse(debugResponse);
      setParsed(parsed);
      setIsErrorVisible(true);
      console.log('Parsed debugPatch:', parsed);
      if (parsed) {
        setDebugPatch(parsed);
        setCardHeight(0); // Collapse first

        setTimeout(() => {
          if (fixCardRef.current) {
            const contentHeight = fixCardRef.current.scrollHeight;
            const panelMaxHeight = window.innerHeight - 120; // Subtract header/padding space
            const boundedHeight = Math.min(contentHeight, panelMaxHeight);
            setCardHeight(boundedHeight);
            console.log('[FixCard] setCardHeight to bounded:', boundedHeight);
          }
        }, 30); // Wait for DOM update
      }
    }
  }, [debugResponse, setDebugPatch]);

  useEffect(() => {
    if (isErrorVisible) {
      const timer = setTimeout(() => {
        setIsErrorVisible(false); // Hide the error display after 5 seconds
        if (!parsed) {
          // Debug failed: reset debugResponse after the error display is hidden
          setDebugResponse(null);
          setParsed(null); // Ensure parsed is reset for the next attempt
        }
      }, 5000);

      return () => clearTimeout(timer); // Clear the timer if the component unmounts or `isErrorVisible` changes
    }
  }, [isErrorVisible, parsed, setDebugResponse]);

  useEffect(() => {
    if (debugPatch && fixCardRef.current) {
      const contentHeight = fixCardRef.current.scrollHeight;
      console.log('[useEffect] contentHeight:', contentHeight); // Log contentHeight
      setCardHeight(contentHeight); // Set to exact content height
      console.log('[useEffect] cardHeight updated to:', contentHeight); // Log updated cardHeight
    }
  }, [debugPatch]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const startY = e.clientY;
    const startHeight = cardHeight;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = startHeight - (e.clientY - startY);
      let newHeight = Math.max(0, deltaY); // Ensure height doesn't go negative
      if (fixCardRef.current) {
        const contentHeight = fixCardRef.current.scrollHeight;
        const panelMaxHeight = window.innerHeight - 40; // 10px top + 10px bottom + 10px splitter + 10px buffer
        // Cap the height at the content height or panel max height, whichever is smaller
        newHeight = Math.min(contentHeight, panelMaxHeight, newHeight);
      }
      setCardHeight(newHeight);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Modified onClose to reset debug states on error
  const handleClose = () => {
    if (debugResponse !== null && parsed === null) {
      setDebugResponse(null);
      setParsed(null);
    }
    onClose();
  };

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
          <div className="flex gap-2">
            <button onClick={onReset} className="text-gray-500 hover:text-blue-400 transition-colors duration-200 h-6 w-6 text-sm rounded-full flex items-center justify-center hover:bg-gray-100" title="Reset all states">↻</button>
            <button onClick={onReset} className="text-gray-500 hover:text-blue-400 transition-colors duration-200 h-6 w-6 text-sm rounded-full flex items-center justify-center hover:bg-gray-100" title="Setting">⚙</button>
            <button onClick={handleClose} className="text-gray-500 hover:text-red-400 transition-colors duration-200 h-6 w-6 text-sm rounded-full flex items-center justify-center hover:bg-gray-100" title="Close">✕</button>
          </div>
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
              placeholder="Tell me your thought of approaching?...."
              className="w-full border border-gray-200 rounded p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-300 min-h-[60px]"
              value={thoughts}
              onChange={(e) => setThoughts(e.target.value)}
            />
            {aiFeedback && <div className="text-gray-500 text-sm mt-1">{aiFeedback}</div>}
            {debugResponse && <div className="text-gray-500 text-sm mt-1">{debugResponse}</div>}
          </div>
        </div>
      </p>

      <div className="rounded-full bg-gray-100 px-2 py-1 shadow-inner border border-gray-200 flex items-center justify-center flex-shrink-0">
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
              {unlockedHints.has(percent >= 30 ? `${percent}-${currentLanguage}` : `${percent}`) ? (
                <Unlock size={18} className="mb-1.5 text-green-500" />
              ) : (
                <Lock size={18} className="mb-1.5 text-red-300" />
              )}
              <span className="text-sm font-medium">{percent}%</span>
            </button>
          ))}
        </div>

        <div className="flex flex-col flex-1 rounded-xl bg-white px-5 pt-5 pb-3 shadow-md border border-gray-200/30 relative">
          <div className="flex-1 flex flex-col overflow-hidden min-h-[200px] max-h-[450px]">
            {isHintUnlocked ? (
              <div className="flex flex-col flex-1 overflow-hidden">
                <div
                  className="flex-1 overflow-y-auto px-1 space-y-3 min-h-0"
                  style={{ paddingBottom: `${48 + (inputHeight - 36)}px` }} //When input height updates, textarea height adjusts accordingly to make last message fully viewanble
                >
                  {(hintMessages[hintKey] || []).map((msg, idx) => (
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

                <div className="absolute bottom-16 left-5 right-5"> {/* Positioned absolutely just above the horizontal line */}
                  <div className="relative flex items-center w-[100%] mx-auto">
                    <div className="flex flex-row-reverse w-full">
                      <textarea
                        className="w-full rounded-md px-4 py-2 border border-gray-300 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white pr-14 overflow-wrap break-word"
                        rows={1}
                        value={userInput}
                        placeholder="Don't be shy and ask me..."
                        onChange={(e) => setUserInput(e.target.value)}
                        onInput={(e) => {
                          const target = e.target as HTMLTextAreaElement;
                          target.style.height = 'auto';
                          const newHeight = Math.min(target.scrollHeight, 100);
                          target.style.height = `${newHeight}px`;
                          target.style.overflowY = target.scrollHeight > 100 ? 'auto' : 'hidden';
                          setInputHeight(newHeight); // update state
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
              </div>
            ) : (
              <>
                <p className="text-lg text-zinc-700 leading-relaxed mb-3">
                  {hintData.find(h => h.percent === activeHint)?.text || ''}<br />
                  <span className="text-sm text-gray-400">Language: {currentLanguage}</span>
                </p>
                <div className="flex justify-center mb-3">
                  <button onClick={() => handleUnlockHint(activeHint, currentLanguage)}
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
                onClick={() => handleDebug(problemContent, setDebugResponse)}
                disabled={isDebugDisabled}
                className={cn(
                  "px-6 py-2 rounded-lg bg-orange-200 hover:bg-orange-300 text-zinc-700 transition-colors duration-200 text-sm border border-gray-200 shadow-sm hover:shadow",
                  !isDebugDisabled && "flashing-red-border", // Flashing red border when enabled
                  isDebugDisabled && "opacity-50 cursor-not-allowed"
                )}
              >
                DEBUG
              </button>
              <button className="px-6 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-zinc-700 transition-colors duration-200 text-sm border border-gray-200 shadow-sm hover:shadow">SAVE</button>
            </div>
          </div>
        </div>
      </div>

      {debugPatch && (
        <>
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: `${cardHeight}px`,
              transition: 'height 0s cubic-bezier(0.25, 0.1, 0.25, 1)',
            }}
            className="bg-white border border-b-0 rounded-t-md shadow-lg z-[1000] overflow-hidden"
          >
            <div ref={fixCardRef} className="h-full overflow-y-auto p-3 space-y-2" style={{ minHeight: 0 }}>
              <FixSuggestionCard
                original={debugPatch.original}
                modified={debugPatch.modified}
                explanation={debugPatch.explanation}
                onAccept={async () => {
                  try {
                    const modifiedCode = debugPatch?.modified?.trim();
                    if (!modifiedCode) {
                      console.log('No debug patch available.');
                      alert("No debug patch available.");
                      return;
                    }

                    if (!isSubmissionsPage && !isLeetCodeProblemPage) {
                      throw new Error("Code injection can only be performed on a LeetCode problem or submissions page.");
                    }
       
                    // Function to find the Monaco Editor instance
                    const findMonacoEditor = async () => {
                      return new Promise<any>((resolve, reject) => {
                        let observer: MutationObserver | null = null;

                        const editorContainer = document.querySelector('#editor') ||
                                                document.querySelector('.monaco-scrollable-element.editor-scrollable.vs-dark');
                        if (editorContainer) {
                          console.log('Editor container found:', editorContainer);
                          const textarea = editorContainer.querySelector('.inputarea') ||
                                            editorContainer.querySelector('textarea');
                          if (textarea) {
                            console.log('Found textarea:', textarea);
                            if (observer) observer.disconnect();
                            resolve({ type: 'textarea', value: textarea });
                            return;
                          }
                        };
                      });
                    };
                
                    // Attempt to find the editor
                    const result = await findMonacoEditor();
              
                    if (result.type === 'textarea') {
                      const textarea = result.value;
                      console.log('Textarea found, initial value:', textarea.value);
                      textarea.focus();
                      injectScriptBySrc('js/monaco-select-all.js');
                      await new Promise(resolve => setTimeout(resolve, 500));

                      const clipboardData = new DataTransfer();
                      clipboardData.setData('text/plain', modifiedCode);
                      const pasteEvent = new ClipboardEvent('paste', {
                        clipboardData: clipboardData,
                        bubbles: true,
                        cancelable: true
                      });

                      textarea.value = modifiedCode;

                      textarea.dispatchEvent(pasteEvent);
                      textarea.dispatchEvent(new Event('input', { bubbles: true }));
                      textarea.dispatchEvent(new Event('change', { bubbles: true }));
                      textarea.dispatchEvent(new Event('focus', { bubbles: true }));
                      console.log('Textarea after injection:', textarea.value);
              
                      // Add a delay to allow rendering
                      await new Promise(resolve => setTimeout(resolve, 300));
              
                      // Verify the final state
                      console.log('Textarea final value:', textarea.value);
              
                      // Check the editor view
                      const viewLines = document.querySelector('.view-lines');
                      if (viewLines) {
                        console.log('View lines content:', viewLines.textContent);
                        if (viewLines.textContent !== modifiedCode) {
                          console.warn('Editor view does not match textarea value:', viewLines.textContent);
                        }
                      } else {
                        console.warn('View lines not found.');
                      }
                    } else {
                      throw new Error("Unknown result type or editor not found");
                    }
                
                    // Reset debug state
                    setDebugPatch(null);
                    setDebugResponse(null);
                    setCardHeight(0);
                  } catch (error) {
                    console.error('Failed to inject debug patch:', error);
                    alert(`Failed to inject code: ${(error as Error).message}. Please try again or check the console for more details.`);
                  }
                }}
                onAgain={async () => {
                  await handleDebug(problemContent, setDebugResponse);
                }}
                onDiscard={() => {
                  throw new Error('Function not implemented.');
                }}
              />
            </div>
          </div>
          <div
            onMouseDown={handleMouseDown}
            style={{
              position: 'absolute',
              bottom: `${cardHeight}px`,
              left: 0,
              right: 0,
              height: '15px',
              transition: 'bottom 0s cubic-bezier(0.25, 0.1, 0.25, 1)',
            }}
            className="bg-gray-300 cursor-ns-resize flex items-center justify-center z-[1001]"
          >
            <div className="w-6 h-1 bg-gray-400 rounded-full"></div>
          </div>
        </>
      )}
      {debugResponse !== null && parsed === null && <ErrorDisplay isVisible={isErrorVisible} onDismiss={() => setIsErrorVisible(false)} setDebugResponse={setDebugResponse} setParsed={setParsed} debugResponse={debugResponse} parsed={parsed} />}
      {isExpanded && (
        <ExpandedHintModal
          onClose={() => setIsExpanded(false)}
          hintMessages={hintMessages}
          activeHint={activeHint}
          setActiveHint={setActiveHint}
          unlockedHints={unlockedHints}
          handleUnlockHint={(percent) => handleUnlockHint(percent, currentLanguage)}
          userInput={userInput}
          setUserInput={setUserInput}
          handleSendMessage={handleSendMessage}
          currentLanguage={currentLanguage}
        />
      )}

      {/* Inline CSS for flashing red border */}
      <style>
        {`
          .flashing-red-border {
            border: 2px solid red;
            animation: flash 2s infinite;
            box-shadow: 0 0 10px red; 
          }
          
          @keyframes flash {
            0% { border-color: red; box-shadow: 0 0 10px red; }
            50% { border-color: transparent; box-shadow: 0 0 0 transparent; }
            100% { border-color: red; box-shadow: 0 0 10px red; }
          }
        `}
      </style>

    </div>
  );
};

export default Panel;