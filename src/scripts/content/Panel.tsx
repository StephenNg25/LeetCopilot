import React, { useState } from 'react';
import { Lock, BookOpen, CheckCircle2, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/browser';

const hintData = [
  { percent: 10, text: 'This is an O(n^2) hint and weighs 10% of the problem. Do you want to use it?' },
  { percent: 20, text: 'This is an O(n^2) hint and weighs 20% of the problem. Do you want to use it?' },
  { percent: 30, text: 'This is an O(n) hint and weighs 30% of the problem. Do you want to use it?' },
  { percent: 40, text: 'This is an O(n) hint and weighs 40% of the problem. Do you want to use it?' },
  { percent: 100, text: 'This is the entire most optimized solution. Do you want to use it?' }
];

const tabIcons: Record<string, JSX.Element> = {
  'Problem': <BookOpen size={18} />, 
  'Solved': <CheckCircle2 size={18} />, 
  'Favourite': <Star size={18} />
};

const languages = ['Python', 'C++', 'Java'];

const Panel = ({ onClose }: { onClose: () => void }) => {
  const [activeHint, setActiveHint] = useState(10);
  const [tab, setTab] = useState('Problem');
  const [languageIndex, setLanguageIndex] = useState(0);

  const scrollLeft = () => {
    setLanguageIndex((prev) => Math.max(prev - 1, 0));
  };

  const scrollRight = () => {
    setLanguageIndex((prev) => Math.min(prev + 1, languages.length - 1));
  };

  return (
    <div className="fixed top-0 right-0 h-full w-[620px] bg-white text-zinc-800 shadow-2xl z-[999999] border-l border-gray-200/50 flex flex-col font-sans p-5 gap-5 overflow-y-auto">
      {/* Header + Close */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-zinc-800">LeetCopilot</h2>
        <button 
          onClick={onClose} 
          className="text-gray-500 hover:text-red-400 transition-colors duration-200 h-8 w-8 rounded-full flex items-center justify-center hover:bg-gray-100"
        >
          ✕
        </button>
      </div>

      {/* Utility Tabs with Icons in a Box */}
      <div className="rounded-xl bg-gray-50 p-2 shadow-sm border border-gray-200/30 mb-0">
        <div className="flex justify-center space-x-2">
          {['Problem', 'Solved', 'Favourite'].map(item => (
            <button
              key={item}
              onClick={() => setTab(item)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex-1 justify-center",
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
      <p className="text-sm font-medium text-left">1. Two Sum – <span className="text-green-500 font-medium">Easy</span></p>

      {/* Language Slide Box */}
      <div className="rounded-xl bg-gray-50 p-3 shadow-sm border border-gray-200/30 flex items-center justify-between gap-3">
        <button
          onClick={scrollLeft}
          disabled={languageIndex === 0}
          className="p-1.5 rounded-full hover:bg-gray-200 transition disabled:opacity-30"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex flex-1 justify-center">
          {languages.map((lang, i) => (
            <button
              key={lang}
              className={cn(
                "py-2 px-4 text-sm rounded-lg transition-all duration-200 w-24",
                i === languageIndex 
                  ? "bg-white border border-gray-200 text-zinc-800 font-medium shadow-sm" 
                  : "bg-gray-50 text-gray-600 hover:bg-white/70 hidden"
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
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Main Panel */}
      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Sidebar Hints */}
        <div className="flex flex-col w-[100px] h-full">
          <div className="flex flex-col h-full justify-between gap-0">
            {hintData.map(({ percent }) => (
              <button
                key={percent}
                onClick={() => setActiveHint(percent)}
                className={cn(
                  "flex flex-col items-center justify-center py-4 px-2 transition-all duration-200",
                  "hover:bg-gray-50 border",
                  activeHint === percent
                    ? "border-orange-400/80 bg-white text-orange-500 shadow-sm rounded-lg"
                    : "border-gray-100 text-gray-500"
                )}
              >
                <Lock size={18} className="mb-1.5" />
                <span className="text-xs font-medium">{percent}%</span>
              </button>
            ))}
          </div>
        </div>

        {/* Hint Card */}
        <div className="flex flex-col flex-1 rounded-xl bg-white p-5 shadow-md border border-gray-200/30 justify-between">
          <div className="flex-1 flex flex-col justify-between">
            <p className="text-base text-zinc-700 leading-relaxed mb-3">{hintData.find(h => h.percent === activeHint)?.text || ''}</p>
            <div className="flex justify-center mb-2">
              <button className="px-8 py-2.5 bg-orange-400 text-white font-medium text-sm rounded-lg transition-all duration-200 hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-400/30 shadow-sm hover:shadow-md flex items-center justify-center">
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
