import React, { useState, useEffect } from 'react';
import { Lock, BookOpen, CheckCircle2, Star } from 'lucide-react';
import { cn } from '@/utils/browser';
import WLCPLogo from '@/assets/LCP-W.png';

const hintData = [
  { percent: 10, text: 'This is an O(n^2) approach hint and weighs 10% of the problem. Do you want to use it?' },
  { percent: 20, text: 'This is an O(n) approach hint and weighs 20% of the problem. Do you want to use it?' },
  { percent: 30, text: 'This is an O(n^2) technical hint and weighs 30% of the problem. Do you want to use it?' },
  { percent: 40, text: 'This is an O(n) technical hint and weighs 40% of the problem. Do you want to use it?' },
  { percent: 100, text: 'This is the entire most optimized solution. Do you want to see it?' }
];

const tabIcons: Record<string, JSX.Element> = {
  'Problem': <BookOpen size={18} />, 
  'Solved': <CheckCircle2 size={18} />, 
  'Favourite': <Star size={18} />
};

const languages = ['Python', 'C++', 'Java'];

async function fetchProblemData(titleSlug: string) {
  const query = `
    query questionData($titleSlug: String!) {
      question(titleSlug: $titleSlug) {
        questionFrontendId
        title
        difficulty
        content
      }
    }
  `;

  const variables = { titleSlug };

  const response = await fetch('https://leetcode.com/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query, variables })
  });

  const data = await response.json();
  return data.data.question;
}

const Panel = ({ onClose }: { onClose: () => void }) => {
  const [activeHint, setActiveHint] = useState(10);
  const [tab, setTab] = useState('Problem');
  const [languageIndex, setLanguageIndex] = useState(0);
  const [problemTitle, setProblemTitle] = useState('');
  const [difficulty, setDifficulty] = useState('');

  const scrollLeft = () => {
    setLanguageIndex((prev) => Math.max(prev - 1, 0));
  };

  const scrollRight = () => {
    setLanguageIndex((prev) => Math.min(prev + 1, languages.length - 1));
  };

  const getDifficultyColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'easy': return 'text-green-500';
      case 'medium': return 'text-yellow-500';
      case 'hard': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  useEffect(() => {
    const titleSlug = window.location.pathname.split('/')[2];
    console.log('[LeetCopilot] Detected titleSlug:', titleSlug);

    const getProblemInfo = async () => {
      try {
        const problem = await fetchProblemData(titleSlug);
        console.log('[LeetCopilot] Fetched problem:', problem);
        setProblemTitle(`${problem.questionFrontendId}. ${problem.title}`);
        setDifficulty(problem.difficulty);
      } catch (err) {
        console.error('[LeetCopilot] Failed to fetch problem:', err);
      }
    };

    getProblemInfo();
  }, []);

  const currentLanguage = languages[languageIndex];

  return (
    <div
      className="fixed bg-white text-zinc-800 shadow-2xl z-[999999] border border-gray-200 flex flex-col font-sans p-5 gap-5 overflow-y-auto rounded-xl"
      style={{
        top: '10px',
        right: '10px',
        bottom: '20px',
        width: '600px',
        height: 'calc(100% - 40px)',
      }}
    >
      {/* Header + Close */}
      <div className="flex justify-between items-center mb-1 border-b border-gray-200 pb-1">
        <img
          src={WLCPLogo}
          alt="LeetCopilot"
          className="h-10 w-auto object-contain m-0 p-0 pointer-events-none"
        />
        <button 
          onClick={onClose} 
          className="text-gray-500 hover:text-red-400 transition-colors duration-200 h-8 w-8 rounded-full flex items-center justify-center hover:bg-gray-100"
        >
          ✕
        </button>
      </div>

      {/* Utility Tabs with Icons in a Box */}
      <div className="rounded-xl bg-gray-50 p-2 shadow-sm border border-gray-200/30">
        <div className="flex justify-center space-x-2">
          {['Problem', 'Solved', 'Favourite'].map(item => (
            <button
              key={item}
              onClick={() => setTab(item)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-base font-medium transition-all duration-200 flex-1 justify-center",
                tab === item
                  ? "bg-white text-orange-500 border border-gray-200 shadow-sm"
                  : "bg-transparent text-gray-600 hover:bg-white/60"
              )}
            >
              {tabIcons[item]}
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Problem Title */}
      <p className="text-base font-medium text-left">
        {problemTitle} – <span className={cn("font-semibold", getDifficultyColor(difficulty))}>{difficulty}</span>
      </p>

      {/* Language Slider Styled like Toggle Pill */}
      <div className="rounded-full bg-gray-100 px-2 py-1 shadow-inner border border-gray-200 flex items-center justify-between">
        <button
          onClick={scrollLeft}
          disabled={languageIndex === 0}
          className="p-1.5 rounded-full hover:bg-gray-200 transition disabled:opacity-30"
        >
          ◀
        </button>
        <div className="flex w-full justify-center">
          {languages.map((lang, i) => (
            <button
              key={lang}
              onClick={() => setLanguageIndex(i)}
              className={cn(
                "text-base px-6 py-2 rounded-full font-medium transition-all duration-200",
                i === languageIndex 
                  ? "bg-white text-orange-500 shadow-md" 
                  : "text-gray-500 hover:text-orange-400"
              )}
            >
              {lang}
            </button>
          ))}
        </div>
        <button
          onClick={scrollRight}
          disabled={languageIndex === languages.length - 1}
          className="p-1.5 rounded-full hover:bg-gray-200 transition disabled:opacity-30"
        >
          ▶
        </button>
      </div>

      {/* Main Panel */}
      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Sidebar Hints */}
        <div className="flex flex-col w-[100px] h-full gap-1.5">
          {hintData.map(({ percent }) => (
            <button
              key={percent}
              onClick={() => setActiveHint(percent)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 px-2 transition-all duration-200",
                "hover:bg-gray-50 border",
                activeHint === percent
                  ? "border-orange-400/80 bg-white text-orange-500 shadow-sm rounded-lg"
                  : "border-gray-100 text-gray-500"
              )}
            >
              <Lock size={18} className="mb-1.5" />
              <span className="text-sm font-medium">{percent}%</span>
            </button>
          ))}
        </div>

        {/* Hint Card */}
        <div className="flex flex-col flex-1 rounded-xl bg-white p-5 shadow-md border border-gray-200/30 justify-between">
          <div className="flex-1 flex flex-col justify-between">
            <p className="text-lg text-zinc-700 leading-relaxed mb-3">
              {hintData.find(h => h.percent === activeHint)?.text || ''} <br/>
              <span className="text-sm text-gray-400">Language: {currentLanguage}</span>
            </p>
            <div className="flex justify-center mb-3">
              <button className="px-8 py-2.5 bg-orange-400 text-white font-medium text-base rounded-lg transition-all duration-200 hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-400/30 shadow-sm hover:shadow-md flex items-center justify-center">
                UNLOCK
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-gray-200 mt-auto">
            <span className="text-sm text-gray-500 font-medium">Assistance used: 0%</span>
            <div className="flex gap-3">
              <button className="px-6 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-zinc-700 transition-colors duration-200 text-sm border border-gray-200 shadow-sm hover:shadow">
                FINISH
              </button>
              <button className="px-6 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-zinc-700 transition-colors duration-200 text-sm border border-gray-200 shadow-sm hover:shadow">
                SAVE
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Panel;
