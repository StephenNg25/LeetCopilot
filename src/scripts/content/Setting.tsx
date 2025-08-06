import React from 'react';
import { cn } from '@/utils/browser';

interface SettingProps {
  onBack: () => void;
}

const Setting: React.FC<SettingProps> = ({ onBack }) => {
  return (
    <div
      className="fixed bg-white text-zinc-800 shadow-2xl z-[999999] border border-gray-200 flex flex-col font-sans p-5 gap-5 rounded-xl"
      style={{
        top: '10px',
        right: '10px',
        bottom: '10px',
        width: '600px',
        maxHeight: 'calc(100% - 30px)',
        overflowY: 'auto',
        scrollbarWidth: 'none', 
        msOverflowStyle: 'none' 
      }}
    >
      <div className="flex-shrink-0">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="text-gray-500 hover:text-blue-400 transition-colors duration-200 h-6 w-6 text-sm rounded-full flex items-center justify-center hover:bg-gray-100"
              title="Back to Panel"
            >
              ←
            </button>
            <h1 className="text-2xl font-semibold text-gray-800">Settings</h1>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">

        <section className="mb-6">
          <div className="border border-gray-200 bg-gray-50 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-2">About LeetCopilot</h3>
            <p className="text-sm text-gray-700">
              LeetCopilot is a Chrome extension designed to enhance your LeetCode experience. It provides AI-powered hints, code debugging, and progress tracking to help you solve coding problems more effectively. Key features include:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
              <li>Approach evaluation with AI-estimated time complexity and ideality rating.</li>
              <li>Customized hints in Python/C++/Java at varying levels of detail (10/20/30/40/100%).</li>
              <li>Real-time code debugging with fix suggestions and code injection.</li>
              <li>Progress tracking for every submitted problems across difficulty levels.</li>
            </ul>
            <p className="text-sm text-gray-700 mt-2">
              Version: 1.0.0<br />
              © 2025 LeetCopilot. All rights reserved.<br />
            </p>
          </div>
        </section>

        <section className="mb-6">
          <div className="border border-gray-200 bg-gray-50 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Data Privacy Disclaimer</h3>
            <p className="text-sm text-gray-700">
              LeetCopilot is committed to protecting your privacy. We do not collect, store, or share any personal data beyond what is necessary for the extension to function. Your interactions with the extension, including problem-solving data and hints, are stored locally in your browser's storage and are not transmitted to any external servers. 
            </p>
          </div>
        </section>

        <section className="mb-6">
            <div className="border border-gray-200 bg-gray-50 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-2">Future Updates</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                <li>AI-powered pattern recognition that identifies similar problems you've solved and recommends familiar strategies (e.g. sliding window, binary search, dynamic programming).</li>
                <li>On-page AI tutor for learning core technical concepts directly within LeetCode (e.g. arrays, hash maps, stacks).</li>
                <li>Interview mode: verbal walkthroughs of solutions to help you articulate your approach during technical interviews.</li>
                </ul>
                <p className="text-sm text-gray-700 mt-2">
                Have feedback or ideas? Share them with us at <a href="mailto:support@leetcopilot.com" className="text-blue-500 hover:underline">stephen.n180325@gmail.com</a>.
                </p>
            </div>
        </section>

        <section className="mb-6">
            <div className="border border-gray-200 bg-gray-50 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-2">Support the Project</h3>
                <p className="text-sm text-gray-700 mb-3">
                If you’ve found LeetCopilot helpful, consider supporting its continued development! Your contribution helps me cover server costs, AI model usage, and deployment infrastructure and also fuels future feature like personalized learning for your best experience :))
                </p>
                <p className="text-sm text-gray-700 mb-4">
                Feedback is equally valuable! Whether it’s a bug, idea, or just a word of encouragement, I’d love to hear from you.
                </p>
                <div className="flex gap-3">
                <a
                    href="https://buymeacoffee.com/leetcopilot"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md text-sm font-medium transition shadow"
                >
                    Buy the developer a coffee ☕
                </a>
                </div>
            </div>
        </section>

      </div>
      <style>{`
        div::-webkit-scrollbar {
        display: none;
        }
      `}</style>
    </div>
  );
};

export default Setting;