import React from 'react';
import { cn } from '@/utils/browser';
import { CheckCircle2, Clock, FileText } from 'lucide-react';

interface SolvedSectionProps {
  solvedDifficultyTab: string;
  setSolvedDifficultyTab: (tab: string) => void;
}

const SolvedSection: React.FC<SolvedSectionProps> = ({ solvedDifficultyTab, setSolvedDifficultyTab }) => {
  // Function to determine the color based on percentage in 10% steps
  const getProgressColor = (percent: number) => {
    const colorMap = [
        '#00c853', // 0%   - Vivid Green
        '#32d06c', // 10%  - Light Green
        '#64d87f', // 20%  - Lime Green
        '#96e091', // 30%  - Yellow-Green
        '#c8e8a4', // 40%  - Faint Lime
        '#ffff00', // 50%  - Yellow (neutral)
        '#ffc107', // 60%  - Yellow-Orange
        '#ff9800', // 70%  - Orange
        '#ff5722', // 80%  - Deep Orange
        '#f44336', // 90%  - Light Red
        '#d32f2f'  // 100% - Strong Red (bad)
    ];
    const index = Math.min(Math.floor(percent / 10), 10); // Ensure index stays within bounds
    return colorMap[index];
  };

  const problem1Percent = 10; // Hardcoded percentage for Problem 1
  const problem2Percent = 20; // Hardcoded percentage for Problem 2
  
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Horizontal Navigation Bar for Difficulty Tabs */}
      <div className="flex flex-row flex-shrink-0 border-b border-gray-200">
        {['Easy', 'Medium', 'Hard'].map((difficulty) => (
          <button
            key={difficulty}
            onClick={() => setSolvedDifficultyTab(difficulty)}
            className={cn(
              "flex-1 py-2 text-sm font-medium transition-all duration-200",
              solvedDifficultyTab === difficulty
                ? "border-t border-l border-r border-b-0 bg-white text-orange-500 shadow-md rounded-t-md"
                : "bg-gray-50 text-gray-600 hover:bg-white hover:text-orange-400",
              {
                'text-green-500': difficulty === 'Easy',
                'text-yellow-500': difficulty === 'Medium',
                'text-red-500': difficulty === 'Hard',
              }
            )}
          >
            {difficulty}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 bg-white rounded-b-md border-l border-r border-b border-gray-200 border-t-0 -mt-px">
        {solvedDifficultyTab === 'Easy' && (
          <div className="grid gap-4">
            {/* Problem 1: Solved */}
            <div className="problem-card group">
              <div className="flex items-center gap-3">
                <h3 className="problem-title inline-flex items-center gap-2">
                  1. Two Sum 
                  <CheckCircle2 className="status-icon text-green-500 w-5 h-5" />
                </h3>
                <div className="help-score">
                  <svg viewBox="0 0 36 36" className="circular-progress">
                    <path
                      className="circle-bg"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="3.5"
                    />
                    <path
                      className="circle"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke={getProgressColor(problem1Percent)}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeDasharray={`${problem1Percent}, 100`}
                    />
                    <text x="18" y="20.35" className="percentage">0%</text>
                  </svg>
                  <span className="help-label">Usage Of Help</span>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <button className="action-button redo">Redo</button>
                  <FileText className="icon-button" />
                  <div className="notes-button">+ Add Notes</div>
                </div>
                <span className="meta-text">Last submitted: June 1, 2023</span>
              </div>
            </div>

            {/* Problem 2: In Progress */}
            <div className="problem-card group">
              <div className="flex items-center gap-3">
                <h3 className="problem-title inline-flex items-center gap-2">
                  2. Add Two Numbers
                  <Clock className="status-icon text-gray-500 w-5 h-5" />
                </h3>
                <div className="help-score">
                  <svg viewBox="0 0 36 36" className="circular-progress">
                    <path
                      className="circle-bg"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="3.5"
                    />
                    <path
                      className="circle"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke={getProgressColor(problem2Percent)}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeDasharray={`${problem2Percent}, 100`}
                    />
                    <text x="18" y="20.35" className="percentage">30%</text>
                  </svg>
                  <span className="help-label">Help Score</span>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <button className="action-button continue">Continue</button>
                  <FileText className="icon-button" />
                  <div className="notes-button">+ Add Notes</div>
                </div>
                <span className="meta-text">Last saved: June 2, 2023</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Inline CSS for Premium Styling */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Poppins:wght@500;700&display=swap');

        .problem-card {
          background: bg-gray-50;
          border: 1px solid;
          border-image: linear-gradient(45deg, #f97316, #3b82f6) 1;
          border-radius: 8px;
          padding: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
          animation: fadeIn 0.5s ease forwards;
        }

        .problem-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.15);
          border-image: linear-gradient(45deg, #fdba74, #60a5fa) 1;
        }

        .problem-title {
          font-family: 'Poppins', sans-serif;
          font-size: 16px;
          font-weight: 600;
          background: linear-gradient(90deg, #f97316, #fdba74);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .help-score {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .circular-progress {
          width: 28px;
          height: 28px;
        }

        .circle-bg {
          fill: none;
          stroke: #e5e7eb;
          stroke-width: 3.5;
        }

        .circle {
          fill: none;
          stroke-width: 3.5;
          stroke-linecap: round;
          animation: progress 1s ease-out forwards;
        }

        .percentage {
          fill: #1f2937;
          font-family: 'Inter', sans-serif;
          font-size: 7px;
          text-anchor: middle;
        }

        .help-label {
          font-family: 'Inter', sans-serif;
          font-size: 11px;
          color: #6b7280;
        }

        .meta-text {
          font-family: 'Inter', sans-serif;
          font-size: 11px;
          color: #6b7280;
          white-space: nowrap;
        }

        .status-icon {
          width: 18px;
          height: 18px;
          transition: transform 0.3s ease;
        }

        .status-icon:hover {
          transform: scale(1.2);
        }

        .action-button {
          padding: 6px 10px;
          border-radius: 8px;
          border: none;
          font-family: 'Poppins', sans-serif;
          font-size: 12px;
          font-weight: 500;
          color: #fff;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .action-button.redo {
          background: linear-gradient(45deg, #3b82f6, #60a5fa);
        }

        .action-button.continue {
          background: linear-gradient(45deg, #f97316, #fdba74);
        }

        .action-button:hover {
          transform: scale(1.05);
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.3);
        }

        .icon-button {
          width: 16px;
          height: 16px;
          color: #6b7280;
          cursor: pointer;
          transition: color 0.3s ease;
        }

        .icon-button:hover {
          color: #1f2937;
        }

        .notes-button {
          font-family: 'Inter', sans-serif;
          font-size: 11px;
          color: #6b7280;
          opacity: 0;
          transition: opacity 0.3s ease;
          cursor: pointer;
        }

        .group:hover .notes-button {
          opacity: 1;
        }

        .notes-button:hover {
          color: #f97316;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes progress {
          0% { stroke-dasharray: 0, 100; }
        }
      `}</style>
    </div>
  );
};

export default SolvedSection;