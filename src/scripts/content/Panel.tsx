import React, { useState } from 'react'
import { Lock } from 'lucide-react'

const hintData = [
  { percent: 10, text: 'This is an O(n^2) hint and weighs 10% of the problem. Do you want to use it?' },
  { percent: 20, text: 'This is an O(n^2) hint and weighs 20% of the problem. Do you want to use it?' },
  { percent: 30, text: 'This is an O(n) hint and weighs 30% of the problem. Do you want to use it?' },
  { percent: 40, text: 'This is an O(n) hint and weighs 40% of the problem. Do you want to use it?' },
  { percent: 100, text: 'This is the entire most optimized solution. Do you want to use it?' }
]

const Panel = ({ onClose }: { onClose: () => void }) => {
  const [activeHint, setActiveHint] = useState(10)
  const [tab, setTab] = useState('Problem')

  return (
    <div className="fixed top-0 right-0 h-full w-[600px] bg-neutral-900 text-white shadow-2xl z-[999999] border-l border-zinc-800 flex flex-col text-sm font-sans">
      {/* Header */}
      <div className="flex justify-between items-center p-3 border-b border-zinc-700 text-base font-bold">
        <span>LeetCopilot</span>
        <button onClick={onClose} className="text-xl text-white hover:text-red-400">✕</button>
      </div>

      {/* Utility Toggle Bar */}
      <div className="flex gap-4 justify-start px-4 pt-2 pb-3 border-b border-zinc-800 text-sm">
        {['Problem', 'Solved', 'Favourite'].map((item) => (
          <button
            key={item}
            onClick={() => setTab(item)}
            className={`px-3 py-1 rounded-full border text-sm transition-all duration-200 ${
              tab === item
                ? 'bg-white text-sky-600 border-white'
                : 'bg-transparent border-gray-600 text-gray-400 hover:bg-zinc-700'
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {/* Top Metadata & Tabs */}
      <div className="px-4 py-2 flex flex-col border-b border-zinc-800">
        <p className="text-sm mb-2">1. Two Sum - <span className="text-green-400">Easy</span></p>
        <div className="flex gap-2 w-full">
          {['Python', 'C++', 'Java'].map((lang) => (
            <button key={lang} className="px-4 py-1 flex-1 bg-zinc-800 text-white border border-zinc-600 rounded hover:bg-zinc-700">
              {lang}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Hint Levels */}
        <div className="flex flex-col justify-between py-4 px-3 border-r border-zinc-700 w-[70px]">
          {hintData.map(({ percent }) => (
            <button
              key={percent}
              onClick={() => setActiveHint(percent)}
              className={`flex flex-col items-center text-xs border rounded p-1 transition-colors duration-150 ${
                activeHint === percent
                  ? 'border-orange-400 text-orange-400'
                  : 'border-zinc-600 text-gray-300 hover:bg-zinc-800'
              }`}
            >
              <Lock size={18} />
              <span>{percent}%</span>
            </button>
          ))}
        </div>

        {/* Hint Preview Area */}
        <div className="flex flex-col flex-1 px-6 py-4 justify-between">
          <div>
            <p className="text-base leading-relaxed mb-4">
              {hintData.find(h => h.percent === activeHint)?.text}
            </p>
            <button className="mt-2 px-5 py-2 rounded bg-orange-400 text-black font-bold hover:bg-orange-300">
              UNLOCK
            </button>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center text-sm text-gray-400 pt-6 border-t border-zinc-800">
            <span>Assistance used: 0%</span>
            <div className="flex gap-2">
              <button className="px-4 py-1 rounded bg-zinc-800 hover:bg-zinc-700">FINISH</button>
              <button className="px-4 py-1 rounded bg-zinc-800 hover:bg-zinc-700">SAVE</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Panel