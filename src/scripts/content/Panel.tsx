import React from 'react'
import { Lock } from 'lucide-react' // you can swap for custom SVG if needed

const Panel = ({ onClose }: { onClose: () => void }) => {
    return (
        <div className="fixed top-0 right-0 h-full w-[520px] bg-neutral-900 text-white shadow-2xl z-[999999] flex flex-col border-l border-zinc-800">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-zinc-700">
                <h2 className="text-xl font-bold">LeetCopilot</h2>
                <button onClick={onClose} className="text-xl text-white hover:text-red-400">✕</button>
            </div>

            {/* Title + Tabs */}
            <div className="p-4">
                <p className="text-sm mb-2">1. Two Sum - <span className="text-green-400">Easy</span></p>
                <div className="flex gap-2 mb-4">
                    {['Python', 'C++', 'Java'].map(lang => (
                        <button
                            key={lang}
                            className="px-4 py-1 bg-zinc-800 text-white border border-zinc-600 rounded hover:bg-zinc-700"
                        >
                            {lang}
                        </button>
                    ))}
                </div>
                <div className="flex">
                    {/* Sidebar Hint Locks */}
                    <div className="flex flex-col items-center pr-4 border-r border-zinc-700 gap-4">
                        {[10, 20, 30, 40, 100].map(pct => (
                            <div key={pct} className="flex flex-col items-center text-sm">
                                <Lock size={20} />
                                <span className="text-gray-300">{pct}%</span>
                            </div>
                        ))}
                    </div>

                    {/* Main Hint Preview Panel */}
                    <div className="flex-1 pl-6">
                        <p className="text-base mb-4">
                            This is an <code>O(n^2)</code> hint and weighs 10% of the problem. Do you want to use it?
                        </p>
                        <button className="mt-2 px-4 py-2 rounded bg-orange-400 text-black font-bold hover:bg-orange-300">
                            UNLOCK
                        </button>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-auto p-4 border-t border-zinc-700 flex justify-between items-center text-sm">
                <span className="text-gray-300">Assistance used: 0%</span>
                <div className="flex gap-2">
                    <button className="px-4 py-1 rounded bg-zinc-800 hover:bg-zinc-700">FINISH</button>
                    <button className="px-4 py-1 rounded bg-zinc-800 hover:bg-zinc-700">SAVE</button>
                </div>
            </div>
        </div>
    )
}

export default Panel
