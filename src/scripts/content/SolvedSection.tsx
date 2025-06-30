import React, { useEffect } from 'react';
import { cn } from '@/utils/browser';
import { CheckCircle2, Clock, FileText } from 'lucide-react';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: string | null }> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div>Error: {this.state.error || 'Something went wrong. Please refresh.'}</div>;
    }
    return this.props.children;
  }
}

interface SolvedSectionProps {
  solvedDifficultyTab: string;
  setSolvedDifficultyTab: (tab: string) => void;
  problems: any[];
  loading: boolean;
  error: string | null;
}

const SolvedSection: React.FC<SolvedSectionProps> = ({ problems, loading, error, solvedDifficultyTab, setSolvedDifficultyTab}) => {

    const getHelpScore = (problem: any) => problem.totalAssistance || 0;

    const saveState = () => {
        const state = { solvedDifficultyTab };
        chrome.storage.local.set({ solvedSectionState: state }, () => {
        console.log('Solved section state saved');
        });
    };

    const loadState = () => {
        chrome.storage.local.get('solvedSectionState', (result) => {
        const storedState = result.solvedSectionState;
        if (storedState) {
            setSolvedDifficultyTab(storedState.solvedDifficultyTab || 'Easy');
            console.log('Loaded solved section state:', storedState);
        }
        });
    };

    useEffect(() => {
        loadState();
    }, []);

    useEffect(() => {
        saveState();
    }, [solvedDifficultyTab]);

    const getSlugFromTitle = (title: string) => {
        return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;

    const handleRedo = (slug: string, status: string) => {
        if (status === "Solved") {
            const confirmed = window.confirm('This action will reset everything used for this problem! Are you sure to continue?');
            if (confirmed) {
                // Load the current state for the target problem
                chrome.storage.local.get(slug, (result) => {
                    const currentState = result[slug] || {};
            
                    // Reset the state for the target problem
                    const resetState = {
                    activeHint: 10,
                    hintMessages: {},
                    unlockedHints: [],
                    totalAssistance: 0,
                    isExpanded: false,
                    isDebugDisabled: true,
                    thoughts: '',
                    aiFeedback: '',
                    timeComplexity: 'N/A',
                    optimizedScore: '0',
                    reducedHistory: [],
                    };
            
                    // Save the reset state back to chrome.storage.local for the target slug
                    chrome.storage.local.set({ [slug]: resetState }, () => {
                        console.log(`State reset for problem: ${slug}`);
                        window.open(`https://leetcode.com/problems/${slug}/`, '_blank'); // Navigate to the problem page
                    });
                });
            }
        } else {
            window.open(`https://leetcode.com/problems/${slug}/`, '_blank'); // Navigate to the problem page
        }
    };

    return (
        <ErrorBoundary>
            <div className="flex flex-col flex-1 overflow-hidden">
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

                <div className="flex-1 overflow-y-auto p-6 bg-white rounded-b-md border-l border-r border-b border-gray-200 border-t-0 -mt-px">
                    <div className="grid gap-4">
                        {problems.length === 0 ? (
                        <div>No problems found for this difficulty.</div>
                        ) : (
                        [...problems]
                            .filter((problem) => problem?.difficulty === solvedDifficultyTab)
                            .sort((a, b) => a.questionId - b.questionId)
                            .map((problem) => {
                            const helpScore = getHelpScore(problem);
                            const slug = getSlugFromTitle(problem.title);
                            return (
                                <div key={problem.questionId} className={`problem-card ${problem.status === 'In Progress' ? 'reverse-gradient' : ''} group`}>
                                    <div className="flex items-center gap-3">
                                        <h3 className={`problem-title inline-flex items-center gap-2 ${problem.status === 'In Progress' ? 'blue-gradient' : ''}`}>
                                        <a
                                            href={`https://leetcode.com/problems/${slug}/`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`hover:underline ${problem.status === 'In Progress' ? 'hover:decoration-blue-400' : 'hover:decoration-orange-400'} truncate max-w-[calc(100%-2rem)]`}
                                        >
                                            {`${problem.questionId}. ${problem.title}`}
                                        </a>
                                        {problem.status === "Solved" ? (
                                            <CheckCircle2 className="status-icon text-green-500 w-5 h-5" />
                                        ) : problem.status === "In Progress" ? (
                                            <Clock className="status-icon text-gray-500 w-5 h-5" />
                                        ) : (
                                            <span className="status-icon text-gray-300 w-5 h-5">?</span>
                                        )}
                                        </h3>
                                        <div className="help-score">
                                        <svg viewBox="0 0 36.5 35" className="circular-progress">
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
                                            stroke="#00c853"
                                            strokeWidth="3.5"
                                            strokeLinecap="round"
                                            strokeDasharray={`${helpScore}, 100`}
                                            />
                                            <text x="18.8" y="21.5" className="percentage">{`${helpScore}%`}</text>
                                        </svg>
                                        <span className="help-label">Usage Of Help</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                        <div className="flex items-center gap-2">
                                        <button
                                            className={`action-button ${problem.status === "Solved" ? "redo" : "continue"}`}
                                            onClick={() => handleRedo(slug, problem.status)}
                                            >
                                            {problem.status === "Solved" ? "Redo" : "Continue"}
                                        </button>
                                        <FileText className="icon-button" />
                                        <div className="notes-button">+ Add Notes</div>
                                        </div>
                                        <span className="meta-text">
                                        {problem.timestamp
                                            ? `Last Submitted: ${new Date(problem.timestamp).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
                                            : "No activity yet"}
                                        </span>
                                    </div>
                                </div>
                            );
                            })
                        )}
                    </div>
                </div>

                <style>{`
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Poppins:wght@500;700&display=swap');

                    .problem-card {
                        background: bg-gray-50;
                        border: 1px solid;
                        border-image: linear-gradient(45deg, #fdba74, #60a5fa) 1;
                        border-radius: 8px;
                        padding: 12px;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                        animation: fadeIn 2s ease forwards;
                    }

                    .problem-card.reverse-gradient {
                        background: bg-gray-50;
                        border: 1px solid;
                        border-image: linear-gradient(45deg ,#60a5fa, #fdba74) 1;
                        border-radius: 8px;
                        padding: 12px;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                        animation: fadeIn 2s ease forwards;
                    }

                    .problem-card:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
                        border-image: linear-gradient(45deg, #f97316, #3b82f6) 1;
                    }
                    
                    .problem-card.reverse-gradient:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
                        border-image: linear-gradient(45deg, #3b82f6, #f97316) 1; 
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
                    
                    .problem-title.blue-gradient {
                        font-family: 'Poppins', sans-serif;
                        font-size: 16px;
                        font-weight: 600;
                        background: linear-gradient(90deg, #3b82f6, #60a5fa); 
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
                        font-size: 10px;
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
                        background: linear-gradient(45deg, #f97316, #fdba74);
                    }

                    .action-button.continue {
                        background: linear-gradient(45deg, #3b82f6, #60a5fa);
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

                    .truncate {
                        overflow: hidden;
                        white-space: nowrap;
                        text-overflow: ellipsis;
                    }
                `}</style>
            </div>
        </ErrorBoundary>
    );
};

export default SolvedSection;