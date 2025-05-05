import React, { useRef } from 'react';
import { Unlock, Lock } from 'lucide-react';
import ShrinkIcon from '@/assets/shrink.png';

const hintData = [10, 20, 30, 40, 100];

const ExpandedHintModal = ({ onClose, hintMessages, activeHint, userInput, setUserInput, handleSendMessage }) => {
  const chatEndRef = useRef(null);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[1000000]">
      <div className="bg-zinc-900 text-white rounded-xl shadow-2xl p-5 w-[70vw] h-[70vh] flex relative">

        {/* Hint Tabs */}
        <div className="w-[70px] border-r border-zinc-700 flex flex-col gap-2 pr-2">
          {hintData.map(percent => (
            <button
              key={percent}
              className={`flex flex-col items-center py-2 px-1 rounded-lg transition-all duration-200 hover:bg-zinc-800 ${
                percent === activeHint ? 'bg-zinc-800 text-orange-400' : 'text-zinc-400'
              }`}
            >
              {hintMessages[percent] ? <Unlock size={18} className="text-green-400 mb-1" /> : <Lock size={18} className="text-red-400 mb-1" />}
              <span className="text-xs font-medium">{percent}%</span>
            </button>
          ))}
        </div>

        {/* Main Chat Window */}
        <div className="flex-1 flex flex-col px-4">
          {/* Title + Shrink */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Hint {activeHint}</h2>
            <button onClick={onClose} className="hover:opacity-80">
              <img src={ShrinkIcon} alt="Shrink" className="w-5 h-5 object-contain" />
            </button>
          </div>

          {/* Chat Scroll Area */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
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

          {/* Input Field */}
          <div className="relative mt-4">
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
      </div>
    </div>
  );
};

export default ExpandedHintModal;
