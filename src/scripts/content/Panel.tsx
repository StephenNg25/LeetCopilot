import WLCPLogo from '@/assets/LCP-B.png';
import CoffeeCup from '@/assets/coffee.png';
import ExpandIcon from '@/assets/expand.png';
import SettingIcon from '@/assets/setting-icon.svg';
import React, { useState, useEffect, useRef } from 'react';
import { Lock, Unlock, BookOpen, CheckCircle2 } from 'lucide-react';
import { fetchProblemContent, fetchProblemTitle } from '@/utils/problemfetch';
import { fetchHintFromGroq } from '@/utils/fetchhint';
import { fetchConversation } from '@/utils/fetchconversation';
import { fetchThoughtsEvaluation } from '@/utils/fetchthoughts';
import { isSubmissionsPage, isLeetCodeProblemPage, cn } from '@/utils/browser';
import { handleDebug, parsePatchResponse } from '@/utils/debugger'; 
import ExpandedHintModal from './ExpandedHintChat';
import FixSuggestionCard from './FixSuggestionCard';
import ErrorDisplay from './ErrorDisplay';
import SolvedSection from './SolvedSection';
import Setting from './Setting';

const hintData = [
  { percent: 10, text: 'A small nudge in words based on the naive idea weighs 10% of the problem. Want to use it?' },
  { percent: 20, text: 'A small nudge in words hinting at a more efficient approach weighs 20% of the problem. Want to use it?' },
  { percent: 30, text: 'A technical hint showing how the naive approach should be built weighs 30% of the problem. Reveal it?' },
  { percent: 40, text: 'A technical hint showing how a faster solution might be built weighs 40% of the problem. Reveal it?' },
  { percent: 100, text: 'Complete code & explanation for both brute-force and optimal solutions weighs. Ready to see them all?' }
];

const tabIcons = {
  'Problem': <BookOpen size={18} />, 
  'Progress': <CheckCircle2 size={18} />, 
};

const languages = ['Python', 'C++', 'Java'];

const getHintLevel = (percent: number): number => {
  const levels = [10, 20, 30, 40, 100];
  return levels.includes(percent) ? percent : 10;
};

const ERROR_MESSAGE = "I'm sorry, I can only assist based on the current hint.";

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
  setReducedHistory,
  solvedDifficultyTab: propSolvedDifficultyTab,
  setSolvedDifficultyTab: setPropSolvedDifficultyTab 
}) => {
  const [inputHeight, setInputHeight] = useState(36); 
  const [userInput, setUserInput] = useState('');
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
  const [isUnlocking, setIsUnlocking] = useState(false); 
  const [problems, setProblems] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [solvedDifficultyTab, setSolvedDifficultyTab] = useState(propSolvedDifficultyTab);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const currentLanguage = languages[languageIndex];
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
    const checkLoginStatus = () => {
      const loginPrompt = document.querySelector('div.flex.items-start.p-2\\.5.leading-\\[20px\\].text-blue-s.dark\\:text-dark-blue-s.bg-blue-0.dark\\:bg-dark-blue-0.m-0.p-\\[8px\\].pl-\\[20px\\]');
      setIsLoggedIn(!loginPrompt);
    };

    checkLoginStatus();

    const observer = new MutationObserver(checkLoginStatus);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

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
    
    setLoading(true);
    setError(null);
    chrome.runtime.sendMessage({ type: 'FETCH_PROBLEMS' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Message sending failed:', chrome.runtime.lastError);
        setError('Failed to communicate with service worker.');
        setProblems([]);
      } else if (response instanceof Error) {
        console.error('Fetch failed:', response);
        setError('Failed to load problems. Please ensure you are logged into LeetCode.');
        setProblems([]);
      } else {
        console.log('Received problems:', response);
        setProblems(response);
      }
      setLoading(false);
    });
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
      console.log('Full prevMessages:', prevMessages);
      const initialHint = prevMessages.length > 0 ? prevMessages[0] : null;
      let workingMessages = prevMessages.length > 0 ? [...prevMessages.slice(1)] : [];

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

      setReducedHistory(reducedHistory);
      console.log('Current reducedHistory:', reducedHistory);
      const hintLevel = getHintLevel(hint);
      const aiResponse = await fetchConversation(reducedHistory, trimmed, hintLevel, problemContent);

      let updatedHistory = [...reducedHistory, newUserMsg, { role: 'assistant', text: aiResponse }];

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
      
      const updatedreducedHistory = updatedHistory.length > 0 ? updatedHistory.slice(1).slice(-6) : [];
      const finalReducedHistory = initialHint ? [initialHint, ...updatedreducedHistory] : updatedreducedHistory;
      console.log('Final updatedHistory:', finalReducedHistory);
      
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
    setIsUnlocking(true);
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
        .filter((percent, index, self) => self.indexOf(percent) === index);
      const total = unlockedArray.reduce((sum, hint) => sum + hint, 0);
      setTotalAssistance(Math.min(100, total));
    } catch (error) {
      console.error('Failed to unlock hint:', error);
    } finally {
      setIsUnlocking(false);
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
        setCardHeight(0);

        setTimeout(() => {
          if (fixCardRef.current) {
            const contentHeight = fixCardRef.current.scrollHeight;
            const panelMaxHeight = window.innerHeight - 120;
            const boundedHeight = Math.min(contentHeight, panelMaxHeight);
            setCardHeight(boundedHeight);
            console.log('[FixCard] setCardHeight to bounded:', boundedHeight);
          }
        }, 30);
      }
    }
  }, [debugResponse, setDebugPatch]);

  useEffect(() => {
    if (isErrorVisible) {
      const timer = setTimeout(() => {
        setIsErrorVisible(false);
        if (!parsed) {
          setDebugResponse(null);
          setParsed(null);
        }
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isErrorVisible, parsed, setDebugResponse]);

  useEffect(() => {
    if (debugPatch && fixCardRef.current) {
      const contentHeight = fixCardRef.current.scrollHeight;
      console.log('[useEffect] contentHeight:', contentHeight);
      setCardHeight(contentHeight);
      console.log('[useEffect] cardHeight updated to:', contentHeight);
    }
  }, [debugPatch]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const startY = e.clientY;
    const startHeight = cardHeight;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = startHeight - (e.clientY - startY);
      let newHeight = Math.max(0, deltaY);
      if (fixCardRef.current) {
        const contentHeight = fixCardRef.current.scrollHeight;
        const panelMaxHeight = window.innerHeight - 40;
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

  const handleClose = () => {
    if (debugResponse !== null && parsed === null) {
      setDebugResponse(null);
      setParsed(null);
    }
    onClose();
  };

  const parseSimpleMarkdown = (text: string) => {
    const lines = text.split('\n');
    const elements: JSX.Element[] = [];
    let bulletList: JSX.Element[] = [];
    let isInBulletList = false;
  
    lines.forEach((line, index) => {
      if (line.startsWith('### ')) {
        if (isInBulletList && bulletList.length > 0) {
          elements.push(
            <ul key={`ul-${index}`} className="list-disc pl-5 space-y-1 text-gray-700">
              {bulletList}
            </ul>
          );
          bulletList = [];
          isInBulletList = false;
        }
        elements.push(
          <h3 key={index} className="text-lg font-bold text-gray-700 mt-2 mb-1">
            {line.slice(4)}
          </h3>
        );
      } else if (line.startsWith('# ')) {
        if (isInBulletList && bulletList.length > 0) {
          elements.push(
            <ul key={`ul-${index}`} className="list-disc pl-5 space-y-1 text-gray-700">
              {bulletList}
            </ul>
          );
          bulletList = [];
          isInBulletList = false;
        }
        elements.push(
          <h1 key={index} className="text-xl font-bold text-gray-800 mt-2 mb-1">
            {line.slice(2)}
          </h1>
        );
      } else if (line.trim().startsWith('* ')) {
        isInBulletList = true;
        const bulletText = line.trim().slice(2);
        const parts = bulletText.split(/(\*\*[^\*]+\*\*|\*[^\*]+\*|`[^`]+`)/g);
        const bulletElements: JSX.Element[] = parts.map((part, partIndex) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong
                key={partIndex}
                className="font-bold text-gray-800"
              >
                {part.slice(2, -2)}
              </strong>
            );
          }
          if (part.startsWith('*') && part.endsWith('*')) {
            return (
              <em
                key={partIndex}
                className="italic text-gray-700"
              >
                {part.slice(1, -1)}
              </em>
            );
          }
          if (part.startsWith('`') && part.endsWith('`')) {
            return (
              <code
                key={partIndex}
                className="bg-orange-200 font-mono text-sm px-1 py-0.5 rounded"
              >
                {part.slice(1, -1)}
              </code>
            );
          }
          return <span key={partIndex}>{part}</span>;
        });

        bulletList.push(
          <li key={index} className="text-sm">
            {bulletElements}
          </li>
        );
      } else {
        if (isInBulletList && bulletList.length > 0) {
          elements.push(
            <ul key={`ul-${index}`} className="list-disc pl-5 space-y-1 text-gray-700">
              {bulletList}
            </ul>
          );
          bulletList = [];
          isInBulletList = false;
        }

        const parts = line.split(/(\*\*[^\*]+\*\*|\*[^\*]+\*|`[^`]+`)/g);
        const lineElements: JSX.Element[] = parts.map((part, partIndex) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong
                key={partIndex}
                className="font-bold text-gray-800"
              >
                {part.slice(2, -2)}
              </strong>
            );
          }
          if (part.startsWith('*') && part.endsWith('*')) {
            return (
              <em
                key={partIndex}
                className="italic text-gray-700"
              >
                {part.slice(1, -1)}
              </em>
            );
          }
          if (part.startsWith('`') && part.endsWith('`') && part !== '```'){
            return (
              <code
                key={partIndex}
                className="bg-orange-200 font-mono text-sm px-1 py-0.5 rounded"
              >
                {part.slice(1, -1)}
              </code>
            );
          }
          return <span key={partIndex}>{part}</span>;
        });

        elements.push(
          <p key={index} className="text-sm text-gray-700 break-words whitespace-pre-wrap">
            {lineElements}
          </p>
        );
      }
    });
  
    if (isInBulletList && bulletList.length > 0) {
      elements.push(
        <ul key="ul-end" className="list-disc pl-5 space-y-1 text-gray-700">
          {bulletList}
        </ul>
      );
    }
  
    return elements;
  };
  
  const saveState = () => {
    const state = { problems, loading, error, solvedDifficultyTab };
    chrome.storage.local.set({ panelState: state }, () => {
      console.log('Panel state saved');
    });
  };

  const loadState = () => {
    chrome.storage.local.get('panelState', (result) => {
      const storedState = result.panelState;
      if (storedState) {
        setProblems(storedState.problems || []);
        setLoading(storedState.loading || false);
        setError(storedState.error || null);
        setSolvedDifficultyTab(storedState.solvedDifficultyTab || 'Easy');
        console.log('Loaded panel state:', storedState);
      }
    });
  };

  useEffect(() => {
    loadState();
  }, []);

  useEffect(() => {
    saveState();
  }, [problems, loading, error, solvedDifficultyTab]);

  useEffect(() => {
    setPropSolvedDifficultyTab(solvedDifficultyTab);
  }, [solvedDifficultyTab, setPropSolvedDifficultyTab]);

  if (isSettingsOpen) {
    return <Setting onBack={() => setIsSettingsOpen(false)} />;
  }
  
  return (
    <div 
      className="fixed bg-white text-zinc-800 shadow-2xl z-[999999] border border-gray-200 flex flex-col font-sans p-5 gap-5 rounded-xl" 
      style={{ 
        top: '10px', 
        right: '10px', 
        bottom: '10px', 
        width: '600px', 
        maxHeight: 'calc(100% - 30px)', 
      }}
    >
      <div>
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-1">
            <img
              src={WLCPLogo}
              alt="LeetCopilot"
              className="h-10 w-auto object-contain pointer-events-none"
            />
            <a
              href="https://buymeacoffee.com/leetcopilot"
              target="_blank"
              rel="noopener noreferrer"
              className="coffee-button"
              style={{
                border: '1px solid #ddd',
                borderRadius: '4px',
                margin: '0 0 0 6px',
                padding: '5px',
                position: 'relative', 
              }}
            >
              <img
                src={CoffeeCup}
                alt="Buy Me a Coffee"
                style={{ width: '25px', height: '25px', objectFit: 'contain' }}
              />
            </a>
          </div>

          <div className="flex gap-2">
            {isLoggedIn && (
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to reset all hints and clear conversation history?')) {
                    onReset();
                  }
                }}
                className="text-gray-500 hover:text-blue-400 transition-colors duration-200 h-6 w-6 text-sm rounded-full flex items-center justify-center hover:bg-gray-100"
                title="Reset all states"
              >
                ↻
              </button>
            )}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="text-gray-500 hover:text-blue-400 transition-colors duration-200 h-6 w-6 rounded-full flex items-center justify-center hover:bg-gray-100"
              title="Settings"
            >
              <img src={SettingIcon} alt="Settings" className="w-4 h-4" />
            </button>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-red-400 transition-colors duration-200 h-6 w-6 text-sm rounded-full flex items-center justify-center hover:bg-gray-100"
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="rounded-xl bg-gray-50 p-1 shadow-sm border border-gray-200/30">
          <div className="flex justify-center space-x-2">
            {['Problem', 'Progress'].map(item => (
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

      {isLoggedIn ? (
        tab === 'Progress' ? (
          <SolvedSection
            solvedDifficultyTab={solvedDifficultyTab}
            setSolvedDifficultyTab={setSolvedDifficultyTab}
            problems={problems}
            loading={loading}
            error={error}
          />
        ) : (
          <>
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
                    className="w-full border border-gray-200 rounded p-2 text-sm resize-none min-h-[60px]"
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
                        : "border-gray-100 text-gray-500 shadow-sm rounded-lg"
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
                        style={{ paddingBottom: `${48 + (inputHeight - 36)}px` }}
                      >
                        {(hintMessages[hintKey] || []).map((msg, idx) => (
                          <div key={idx} className={msg.role === 'assistant' ? 'flex items-start gap-2' : 'flex justify-end'}>
                            {msg.role === 'assistant' ? (
                              <>
                                <div className="h-6 w-6 flex items-center justify-center text-lg mt-1">🤓</div>
                                <div className="relative bg-orange-100 rounded-lg px-4 py-3 text-sm text-gray-700 max-w-[90%] break-words whitespace-pre-wrap speech-bubble">
                                  {parseSimpleMarkdown(msg.text)}
                                </div>
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

                      <div className="absolute bottom-16 left-5 right-5">
                        <div className="relative flex items-center w-[100%] mx-auto">
                          <div className="flex flex-row-reverse w-full">
                            <textarea
                              className="w-full rounded-md px-4 py-2 border border-gray-300 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white pr-14 overflow-wrap break-word"
                              rows={1}
                              value={userInput}
                              placeholder="Don't be shy......(LeetCopilot can make mistakes)"
                              onChange={(e) => setUserInput(e.target.value)}
                              onInput={(e) => {
                                const target = e.target as HTMLTextAreaElement;
                                target.style.height = 'auto';
                                const newHeight = Math.min(target.scrollHeight, 100);
                                target.style.height = `${newHeight}px`;
                                target.style.overflowY = target.scrollHeight > 100 ? 'auto' : 'hidden';
                                setInputHeight(newHeight);
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
                    <div className="flex flex-col items-center justify-center flex-1 text-center">
                      <p className="text-lg text-zinc-700 leading-relaxed mb-4 text-center">
                        {hintData.find(h => h.percent === activeHint)?.text || ''}<br />
                        <span className="text-sm text-gray-400">
                          Language: {activeHint <= 20 ? 'Python, C++, Java' : currentLanguage}
                        </span>
                      </p>
                      <button
                        onClick={() => handleUnlockHint(activeHint, currentLanguage)}
                        className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-lg shadow-lg hover:from-orange-600 hover:to-red-600 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-orange-400"
                      >
                        UNLOCK
                      </button>
                    </div>
                  )}
                  {isUnlocking && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
                      <div className="relative w-12 h-12">
                        <div className="custom-spinner w-full h-full border-6 border-t-orange-500 border-gray-200 rounded-full animate-spin"></div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center mt-auto pt-2 border-t border-gray-200 flex-shrink-0">
                  <span className="text-sm text-gray-500 font-medium">Assistance used: {totalAssistance}%</span>
                  <div className="flex gap-3 items-center">
                    <button
                      onClick={() => setShowTutorial(true)}
                      className="text-gray-500 hover:text-blue-400 transition-colors duration-200 h-6 w-6 rounded-full flex items-center justify-center hover:bg-gray-100"
                      title="Tutorial"
                    >
                      ⓘ
                    </button>
                    <button
                      onClick={() => handleDebug(problemContent, setDebugResponse)}
                      disabled={isDebugDisabled}
                      className={cn(
                        "px-20 py-2 rounded-lg bg-orange-200 hover:bg-orange-300 text-zinc-700 transition-colors duration-200 text-sm border border-gray-200 shadow-sm hover:shadow",
                        !isDebugDisabled && "flashing-red-border",
                        isDebugDisabled && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      DEBUG
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )
      ) : (
        <div className="flex flex-col items-center justify-center flex-1 text-center p-5">
          <p className="text-lg text-zinc-700 mb-2">Please sign in to access LeetCopilot features.</p>
          <button
            onClick={() => window.open('https://leetcode.com/accounts/login/', '_blank')}
            className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-all duration-300"
          >
            Sign In
          </button>
        </div>
      )}

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

                      await new Promise(resolve => setTimeout(resolve, 300));

                      console.log('Textarea final value:', textarea.value);

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
                  setDebugPatch(null);
                  setDebugResponse(null);
                  setCardHeight(0);
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
          setLanguageIndex={setLanguageIndex}
        />
      )}
      {showTutorial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000000]">
          <div className="bg-white rounded-lg w-[800px] shadow-lg">
            <div className="flex items-center border-b px-5 py-4 text-lg font-medium border-divider-border-2 text-label-1 dark:text-dark-label-1">
              🐛🧹Bug Janitor - (Compile/Submission Errors)
              <button
                onClick={() => setShowTutorial(false)}
                className="ml-auto cursor-pointer rounded transition-all"
              >
                ✕
              </button>
            </div>
            <div className="px-6 pb-6 pt-4">
              <div className="text-label-2 dark:text-dark-label-2">
                <ul className="list-disc list-inside space-y-2">
                  <li><strong>Debugger</strong> activates right after you hit <em>Run</em> or <em>Submit</em>, but only when an error is detected.</li>
                  <li>It works directly on the <strong>result page</strong> and your <strong>code snippet</strong>, offering AI-powered debugging suggestions to help you understand and fix the error.</li>
                  <p><em>Note*: If you navigate away to other LeetCode tabs like the question cotent or code editor, the debugger will immediately deactivate. So for best results, stay on the result tab (automatically naviagted after submitting/compiling) to use that active and helpful debugger.</em></p>
                </ul>
                <br></br>
              </div>
              <div style={{ position: 'relative', width: '100%', height: 0, paddingBottom: '62.563%' }}>
                <iframe
                  allow="fullscreen;autoplay"
                  allowFullScreen
                  height="100%"
                  src="https://streamable.com/e/z8wvks?autoplay=1&muted=1"
                  width="100%"
                  style={{ border: 'none', width: '100%', height: '100%', position: 'absolute', left: 0, top: 0, overflow: 'hidden' }}
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      )}

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

          .custom-spinner {
            border-top-color: #f97316;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          .speech-bubble {
            position: relative;
          }

          .speech-bubble::before {
            content: '';
            position: absolute;
            left: -8px;
            top: 12px;
            width: 0;
            height: 0;
            border-top: 8px solid transparent;
            border-bottom: 8px solid transparent;
            border-right: 8px solid #ffedd5;
          }

          .coffee-button:hover {
            background-color: #f0f0f0;  
          }

          .coffee-button:hover::after {
            content: 'Buy developer a coffee to support this project'; 
            position: absolute;
            background-color: #333;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            white-space: nowrap;
            top: 40px;
            left: 50%;
            transform: translateX(-50%); 
            z-index: 10; 
          }
        `}
      </style>
    </div>
  );
};

export default Panel;