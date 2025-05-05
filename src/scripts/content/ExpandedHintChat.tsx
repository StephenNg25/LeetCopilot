import React, { useRef } from 'react';
import { Check, Lock as LockIcon } from 'lucide-react'; 
import ShrinkIcon from '@/assets/shrink.png';

const hintData = [
  { percent: 10, text: 'This is an O(n^2) approach hint and weighs 10% of the problem. Do you want to use it?' },
  { percent: 20, text: 'This is an O(n) approach hint and weighs 20% of the problem. Do you want to use it?' },
  { percent: 30, text: 'This is an O(n^2) technical hint and weighs 30% of the problem. Do you want to use it?' },
  { percent: 40, text: 'This is an O(n) technical hint and weighs 40% of the problem. Do you want to use it?' },
  { percent: 100, text: 'This is the entire most optimized solution. Do you want to see it?' }
];

const ExpandedHintModal = ({
  onClose,
  hintMessages,
  activeHint,
  setActiveHint,
  unlockedHints,
  handleUnlockHint,
  userInput,
  setUserInput,
  handleSendMessage
}) => {
  const chatEndRef = useRef(null);
  const isHintUnlocked = unlockedHints.has(activeHint);
  const currentHintData = hintData.find(h => h.percent === activeHint);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[1000000]">
      <div className="bg-zinc-900 text-white rounded-xl shadow-2xl p-5 w-[70vw] h-[70vh] flex relative">
        {/* Main Chat Window */}
        <div className="flex-1 flex-col w-full px-4">
            {/* Header with Hint Tabs + Shrink Button */}
            <div className="flex justify-between items-center mb-4">
                <div className="flex gap-2 flex-wrap">
                {hintData.map(({ percent }) => {
                    const unlocked = unlockedHints.has(percent);
                    return (
                    <button
                        key={percent}
                        onClick={() => setActiveHint(percent)}
                        className={`text-sm font-medium px-3 py-1 rounded-md transition-all duration-200 flex items-center gap-1
                        ${activeHint === percent ? 'bg-zinc-800 text-orange-400' : 'text-zinc-400 hover:text-orange-300'}
                        ${unlocked ? 'text-orange-400' : ''}
                        `}
                    >
                        Hint({percent}%)
                        {unlocked ? (
                        <Check size={14} className="text-green-400" />
                        ) : (
                        <LockIcon size={14} className="text-red-400" />
                        )}
                    </button>
                    );
                })}
                </div>
            <button onClick={onClose} className="hover:opacity-80">
                <img src={ShrinkIcon} alt="Shrink" className="w-5 h-5 object-contain" />
            </button>
            </div>

          {/* Content */}
          {isHintUnlocked ? (
            <>
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Scrollable Messages */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-3">
                    {(hintMessages[activeHint] || []).map((msg, idx) => (
                    <div key={idx} className={msg.role === 'bot' ? 'flex items-start gap-2' : 'flex justify-end'}>
                        {msg.role === 'bot' ? (
                        <>
                            <div className="h-6 w-6 flex items-center justify-center text-lg">🤓</div>
                            <div className="bg-zinc-800 text-sm px-4 py-2 rounded-lg max-w-[90%] break-words whitespace-pre-wrap">{msg.text}</div>
                        </>
                        ) : (
                        <div className="bg-orange-500 text-sm px-4 py-2 rounded-lg max-w-[70%] break-words whitespace-pre-wrap text-white">
                            {msg.text}
                        </div>
                        )}
                    </div>
                    ))}
                    <div ref={chatEndRef} />
                </div>

                {/* Chat Input at Bottom */}
                <div className="relative">
                    <textarea
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                        setUserInput('');
                        }
                    }}
                    placeholder="Message LeetCopilot..."
                    rows={1}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-full text-sm px-4 py-2 pr-10 resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                    <button
                    onClick={() => {
                        handleSendMessage();
                        setUserInput('');
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-orange-500 hover:bg-orange-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs shadow"
                    >↑</button>
                </div>
            </div>

            </>
          ) : (
            <>
              {/* Unlock Prompt */}
              <div className="flex-1 flex flex-col items-start justify-center text-left">
                <p className="text-sm text-zinc-300 mb-3 max-w-xl">{currentHintData?.text || ''}</p>
                <button
                  onClick={() => handleUnlockHint(activeHint)}
                  className="px-6 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition"
                >
                  UNLOCK
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpandedHintModal;
