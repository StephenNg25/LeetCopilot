import React, { useEffect, useState, useRef } from 'react';
import { cn } from '@/utils/browser';
import { CheckCircle2, Clock, FileText, X, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';

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

const SolvedSection: React.FC<SolvedSectionProps> = ({ problems: initialProblems, loading, error, solvedDifficultyTab, setSolvedDifficultyTab }) => {
  const [selectedSubmission, setSelectedSubmission] = useState<{ code: string; result: string; language: string; description: string; problem: any } | null>(null);
  const [copied, setCopied] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [notesBySlug, setNotesBySlug] = useState<{ [slug: string]: string }>({});
  const [currentNotes, setCurrentNotes] = useState('');
  const codeRef = useRef<HTMLDivElement>(null);
  const [hoveredProblemId, setHoveredProblemId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const visibleTagCount = 2;

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
    chrome.storage.local.get('notesBySlug', (result) => {
      setNotesBySlug(result.notesBySlug || {});
    });
  }, []);

  useEffect(() => {
    chrome.storage.local.set({ notesBySlug }, () => {
      console.log('Notes saved to storage');
    });
  }, [notesBySlug]);

  useEffect(() => {
    if (selectedSubmission) {
      const slug = selectedSubmission.problem.slug;
      const savedNotes = notesBySlug[slug] || '';
      setCurrentNotes(savedNotes);
      setShowNotes(savedNotes.trim().length > 0);
    } else {
      setCurrentNotes('');
      setShowNotes(false);
    }
  }, [selectedSubmission, notesBySlug]);

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

  const handleRedo = (slug: string, status: string) => {
    if (status === "Solved") {
      const confirmed = window.confirm('This action will reset everything used for this problem! Are you sure to continue?');
      if (confirmed) {
        chrome.storage.local.get(slug, (result) => {
          const currentState = result[slug] || {};
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
          setNotesBySlug((prev) => {
            const newNotes = { ...prev };
            delete newNotes[slug];
            return newNotes;
          });
          chrome.storage.local.set({ [slug]: resetState }, () => {
            console.log(`State reset for problem: ${slug}`);
            window.open(`https://leetcode.com/problems/${slug}/`, '_blank');
          });
        });
      }
    } else {
      window.open(`https://leetcode.com/problems/${slug}/`, '_blank');
    }
  };

  const handleFileTextClick = (problem: any) => {
    console.log('FileText clicked for problem:', problem);
    if (problem.latestSubmissionId) {
      console.log(`Fetching details for submissionId: ${problem.latestSubmissionId}`);
      chrome.runtime.sendMessage(
        { type: 'FETCH_SUBMISSION_DETAILS', submissionId: problem.latestSubmissionId },
        (response) => {
          console.log('Received response from service worker:', response);
          if (response.error) {
            console.error('Submission details fetch failed:', response.error);
            setSelectedSubmission({ code: 'Error fetching submission', result: 'N/A', language: 'Unknown', description: 'No description available', problem });
          } else {
            setSelectedSubmission({ code: response.code, result: response.result, language: response.language, description: response.description, problem });
          }
        }
      );
    } else {
      console.warn('No latestSubmissionId for problem:', problem.slug);
      setSelectedSubmission({ code: 'No submission available', result: 'N/A', language: 'Unknown', description: 'No description available', problem });
    }
  };

  const handleCopy = () => {
    if (codeRef.current) {
      const codeText = codeRef.current.textContent || '';
      navigator.clipboard.writeText(codeText).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  // Extract unique topics from all problems
  const allTopics = [...new Set(initialProblems.flatMap((problem) => problem.topicTags || []))].sort();
  const filteredProblems = initialProblems
    .filter((problem) => problem?.difficulty === solvedDifficultyTab)
    .filter((problem) => 
      !searchTerm || problem.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((problem) => 
      !selectedTopic || (problem.topicTags && problem.topicTags.includes(selectedTopic))
    )
    .sort((a, b) => a.questionId - b.questionId);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

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
                  : "bg-gray-50 border-b text-gray-600 hover:bg-white hover:text-orange-400",
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
          <div className={cn("sticky top-0 w-full flex z-10 mb-4", {
            'reverse-gradient': solvedDifficultyTab === 'In Progress',
          })}>
            <input
              type="text"
              placeholder="Search problems..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-[77%] p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <select
              value={selectedTopic || ''}
              onChange={(e) => setSelectedTopic(e.target.value || null)}
              className="w-[23%] p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ml-2"
            >
              <option value="">All Topics</option>
              {allTopics.map((topic) => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-4">
            {filteredProblems.length === 0 ? (
              <div>No problems found for this difficulty, search, or topic.</div>
            ) : (
              filteredProblems.map((problem) => {
                const helpScore = getHelpScore(problem);
                const slug = getSlugFromTitle(problem.title);
                // Truncate title to 46 characters with ellipsis if longer
                const truncatedTitle = problem.title.length > 43 ? problem.title.substring(0, 43) : problem.title;
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
                          {`${problem.questionId}. ${truncatedTitle}`}
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
                        <FileText className="icon-button" onClick={() => handleFileTextClick(problem)} />
                        {problem.topicTags && problem.topicTags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {problem.topicTags.slice(0, visibleTagCount).map((tag: string, index: number) => (
                              <span key={index} className="text-xs bg-gray-200 text-gray-800 px-2 py-1 rounded-full">
                                {tag}
                              </span>
                            ))}
                            {problem.topicTags.length > visibleTagCount && (
                              <span
                                className="text-xs bg-gray-200 text-gray-800 px-2 py-1 rounded-full cursor-pointer"
                                onMouseEnter={() => setHoveredProblemId(problem.questionId)}
                                onMouseLeave={() => setHoveredProblemId(null)}
                              >
                                +{problem.topicTags.length - visibleTagCount}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <span className="meta-text">
                        {problem.timestamp
                          ? `Last Submitted: ${new Date(problem.timestamp).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
                          : "No activity yet"}
                      </span>
                    </div>
                    {hoveredProblemId === problem.questionId && problem.topicTags && problem.topicTags.length > visibleTagCount && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {problem.topicTags.slice(visibleTagCount).map((tag, index) => (
                          <span key={index} className="text-xs bg-gray-200 text-gray-800 px-2 py-1 rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {selectedSubmission && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-7xl max-h-[90vh] overflow-y-auto relative">
              <button
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 transition-colors duration-200"
                onClick={() => setSelectedSubmission(null)}
              >
                <X size={20} />
              </button>
              <h3 className="text-lg font-semibold mb-4">{`${selectedSubmission.problem.questionId}. ${selectedSubmission.problem.title} - ${selectedSubmission.problem.difficulty}`}</h3>
              <div className="mb-2 text-gray-800" dangerouslySetInnerHTML={{ __html: selectedSubmission.description }} />
              <p className="mb-2">
                Result of Latest Submission: <span className={selectedSubmission.result === 'Accepted' ? 'text-green-500' : 'text-red-500'}>{selectedSubmission.result}</span>
              </p>
              <p className="mb-2">Code | {selectedSubmission.language.charAt(0).toUpperCase() + selectedSubmission.language.slice(1)}</p>
              <div className="my-4 border border-zinc-700 rounded-lg bg-zinc-800 p-4 relative text-white" ref={codeRef}>
                <button
                  onClick={handleCopy}
                  className="absolute top-0 right-0 p-2 text-white hover:text-gray-300 transition-colors duration-200"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
                <div className="overflow-x-auto">
                  <ReactMarkdown
                    rehypePlugins={[rehypeHighlight]}
                  >
                    {`~~~${selectedSubmission.language.toLowerCase().replace('python3', 'python').replace('c++', 'cpp')}\n${selectedSubmission.code}\n~~~`}
                  </ReactMarkdown>
                </div>
              </div>
              {showNotes && (
                <div className="mt-4">
                  <textarea
                    className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-all duration-200 resize-y"
                    value={currentNotes}
                    onChange={(e) => {
                      const newNotes = e.target.value;
                      setCurrentNotes(newNotes);
                      if (selectedSubmission) {
                        const slug = selectedSubmission.problem.slug;
                        setNotesBySlug((prev) => ({ ...prev, [slug]: newNotes }));
                      }
                    }}
                    placeholder="Add your notes here..."
                    rows={4}
                  />
                </div>
              )}
              <div className="mt-4">
                <button
                  className="px-6 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
                  onClick={() => setSelectedSubmission(null)}
                >
                  Close
                </button>
                <button
                  className="px-6 py-2 text-black hover:text-blue-500 transition-colors duration-200"
                  onClick={() => setShowNotes(true)}
                >
                  + Add Notes
                </button>
              </div>
            </div>
          </div>
        )}

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
            max-width: 100%;
          }

          .problem-card.reverse-gradient {
            background: bg-gray-50;
            border: 1px solid;
            border-image: linear-gradient(45deg, #60a5fa, #fdba74) 1;
            border-radius: 8px;
            padding: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            animation: fadeIn 2s ease forwards;
            max-width: 100%;
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

          .flex-1.overflow-y-auto {
            -ms-overflow-style: none; /* IE and Edge */
            scrollbar-width: none; /* Firefox */
          }
          .flex-1.overflow-y-auto::-webkit-scrollbar {
            display: none; /* Chrome, Safari, and Opera */
          }

          .max-h-\[90vh\].overflow-y-auto {
            -ms-overflow-style: none; /* IE and Edge */
            scrollbar-width: none; /* Firefox */
          }
          .max-h-\[90vh\].overflow-y-auto::-webkit-scrollbar {
            display: none; /* Chrome, Safari, and Opera */
          }

          .sticky.top-0 input,
          .sticky.top-0 select {
            border: 1px solid;
            border-radius: 8px;
            padding: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            background: bg-gray-50;
            transition: all 0.3s ease;
          }

          .sticky.top-0:not(.reverse-gradient) input,
          .sticky.top-0:not(.reverse-gradient) select {
            border-image: linear-gradient(45deg, #fdba74, #60a5fa) 1;
          }

          .sticky.top-0.reverse-gradient input,
          .sticky.top-0.reverse-gradient select {
            border-image: linear-gradient(45deg, #60a5fa, #fdba74) 1;
          }

          .sticky.top-0 input:hover,
          .sticky.top-0 select:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
          }

          .sticky.top-0:not(.reverse-gradient) input:hover,
          .sticky.top-0:not(.reverse-gradient) select:hover {
            border-image: linear-gradient(45deg, #f97316, #3b82f6) 1;
          }

          .sticky.top-0.reverse-gradient input:hover,
          .sticky.top-0.reverse-gradient select:hover {
            border-image: linear-gradient(45deg, #3b82f6, #f97316) 1;
          }

          .hljs-keyword { color: #569cd6; } /* Keywords in blue */
          .hljs-string { color: #ce9178; } /* Strings in orange */
          .hljs-comment { color: #6a9955; } /* Comments in green */
          .hljs-number { color: #b5cea8; } /* Numbers in light green */
          .hljs-function { color: #dcdcaa; } /* Functions in yellow */
        `}</style>
      </div>
    </ErrorBoundary>
  );
};

export default SolvedSection;