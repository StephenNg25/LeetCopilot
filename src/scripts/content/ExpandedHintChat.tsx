import React, { useRef, useEffect, useState } from 'react';
import { Check, Lock as LockIcon, Copy, ChevronDown } from 'lucide-react';
import ShrinkIcon from '@/assets/shrink-D.png';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';

const hintData = [
  { percent: 10, text: 'This is an O(n^2) approach hint and weighs 10% of the problem. Do you want to use it?' },
  { percent: 20, text: 'This is an O(n) approach hint and weighs 20% of the problem. Do you want to use it?' },
  { percent: 30, text: 'This is an O(n^2) technical hint and weighs 30% of the problem. Do you want to use it?' },
  { percent: 40, text: 'This is an O(n) technical hint and weighs 40% of the problem. Do you want to use it?' },
  { percent: 100, text: 'This is the entire most optimized solution. Do you want to see it?' }
];

const languages = ['Python', 'C++', 'Java']; // Define languages for the dropdown

const highlightTerms = (text: string) => {
  if (typeof text !== 'string') return text;

  const terms = ['hash[-]?table', 'hash-based', 'arrays?', 'stack', 'queue', 'linked lists?', 
                 'binary tree', 'graph', 'DFS', 'BFS', 'iterative', 'recursive', 'brute[-]?force',
                 'sorting', 'merging', 'binary search', 'optimal', 'most'];
  const regex = new RegExp(`\\b(${terms.join('|')})\\b`, 'gi');
  
  // Split the text into segments: code blocks and non-code-block sections
  const segments: { type: string; content: string }[] = [];
  let remainingText = text;
  let inCodeBlock = false;
  let currentIndex = 0;

  while (currentIndex < text.length) {
    const nextCodeFence = remainingText.indexOf('```');
    if (nextCodeFence === -1) {
      // No more code fences, treat the rest as non-code-block text
      segments.push({ type: 'text', content: remainingText });
      break;
    }

    if (!inCodeBlock) {
      // Add the text before the code block
      if (nextCodeFence > 0) {
        segments.push({ type: 'text', content: remainingText.substring(0, nextCodeFence) });
      }
      // Move past the opening ```
      inCodeBlock = true;
      remainingText = remainingText.substring(nextCodeFence + 3);
      currentIndex += nextCodeFence + 3;
    } else {
      // Find the end of the code block
      const endCodeFence = remainingText.indexOf('```');
      if (endCodeFence === -1) {
        // No closing fence, treat the rest as part of the code block
        segments.push({ type: 'code', content: '```' + remainingText });
        break;
      }
      // Add the code block, including the fences
      segments.push({ type: 'code', content: '```' + remainingText.substring(0, endCodeFence + 3) });
      inCodeBlock = false;
      remainingText = remainingText.substring(endCodeFence + 3);
      currentIndex += endCodeFence + 3;
    }
  }

  // Process segments: apply highlighting to non-code-block text only
  const processedSegments = segments.map(segment => {
    if (segment.type === 'code') {
      return segment.content; // Preserve code blocks unchanged
    }
    return segment.content.replace(regex, (match) => `<span class="text-orange-400 font-semibold">${match}</span>`);
  });

  return processedSegments.join('');
};

const components = {
  h3: ({ children }: { children: React.ReactNode }) => <h3 className="text-lg font-bold text-white mt-4 mb-2">{children}</h3>,
  ul: ({ children }: { children: React.ReactNode }) => <ul className="list-disc pl-5 space-y-1 text-zinc-300">{children}</ul>,
  ol: ({ children }: { children: React.ReactNode }) => <ol className="list-decimal pl-5 space-y-1 text-zinc-300">{children}</ol>,
  li: ({ children }: { children: React.ReactNode }) => <li className="text-sm">{children}</li>,
  strong: ({ children }: { children: React.ReactNode }) => <strong className="text-orange-400 font-semibold">{children}</strong>,
  code({ node, className, children, ...props }: { node?: any; className?: string; children: React.ReactNode }) {
    const codeRef = useRef<HTMLElement>(null);
    const [copied, setCopied] = React.useState(false);

    // Extract language from className (e.g., 'language-python')
    let language = className
      ? className.replace(/(^|\s)hljs(\s|$)/g, '').replace('language-', '').trim()
      : 'plaintext';

    // Infer language from local state if not specified
    const currentLanguage = React.useContext(CurrentLanguageContext);
    if (!language || language === 'plaintext') {
      language = languages.includes(currentLanguage) ? currentLanguage.toLowerCase() : 'plaintext';
    }

    const copyToClipboard = () => {
      if (codeRef.current) {
        const text = codeRef.current.innerText;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    };

    const isBlock = Array.isArray(children) && children.length > 0;

    if (isBlock) {
      // Flatten children to a single string, preserving newlines
      const flattenChildren = (child: React.ReactNode): string => {
        if (typeof child === 'string') return child;
        if (typeof child === 'number') return child.toString();
        if (Array.isArray(child)) return child.map(flattenChildren).join('');
        if (React.isValidElement(child)) {
          // Safely handle React elements by checking if props.children exists
          return flattenChildren(child.props.children ?? '');
        }
        return '';
      };

      const codeText = flattenChildren(children);
      // Trim leading/trailing newlines to match <pre> rendering
      const trimmedCodeText = codeText.replace(/^\n+|\n+$/g, '');
      const codeLines = trimmedCodeText.split('\n');

      return (
        <div className="my-4 border border-zinc-700 rounded-lg bg-zinc-800 group">
          <div className="flex justify-between items-center px-4 py-2 bg-zinc-700 rounded-t-lg">
            <span className="text-sm text-zinc-300">{language}</span>
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1 text-zinc-300 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              <span className="text-sm">{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <div className="flex">
            {/* Line Numbers */}
            <div className="bg-zinc-900 text-zinc-400 text-sm font-mono py-4 pl-4 pr-2 border-r border-zinc-700">
              {codeLines.map((_, index) => (
                <div key={index} className="text-right leading-6">
                  {index + 1}
                </div>
              ))}
            </div>
            {/* Code Content */}
            <pre className="p-4 overflow-auto flex-1 text-sm leading-6">
              <code ref={codeRef} className={`language-${language}`} {...props}>
                {children}
              </code>
            </pre>
          </div>
        </div>
      );
    }

    return (
      <span className="bg-orange-400/10 text-orange-300 font-mono text-sm px-1.5 py-0.5 rounded">
        {children}
      </span>
    );
  },
};

const CurrentLanguageContext = React.createContext<string>('python');

interface ExpandedHintModalProps {
  onClose: () => void;
  hintMessages: { [key: string]: { role: string; text: string }[] };
  activeHint: number;
  setActiveHint: (hint: number) => void;
  unlockedHints: Set<string>;
  handleUnlockHint: (hint: number) => Promise<void>;
  userInput: string;
  setUserInput: (input: string) => void;
  handleSendMessage: (message: string, hint: number) => Promise<void>;
  currentLanguage: string;
  setLanguageIndex: (index: number) => void; // New prop to update languageIndex in Panel
}

const ExpandedHintModal: React.FC<ExpandedHintModalProps> = ({
  onClose,
  hintMessages,
  activeHint,
  setActiveHint,
  unlockedHints,
  handleUnlockHint,
  userInput,
  setUserInput,
  handleSendMessage,
  currentLanguage: initialLanguage,
  setLanguageIndex, // Destructure the new prop
}) => {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [currentLanguage, setCurrentLanguage] = useState<string>(initialLanguage);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const hintKey = activeHint >= 30 ? `${activeHint}-${currentLanguage}` : `${activeHint}`;
  const isHintUnlocked = unlockedHints.has(hintKey);
  const currentHintData = hintData.find(h => h.percent === activeHint);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [hintMessages, activeHint, currentLanguage]);

  useEffect(() => {
    setCurrentLanguage(initialLanguage);
  }, [initialLanguage]);

  const handleUnlock = async () => {
    setIsLoading(true);
    try {
      await handleUnlockHint(activeHint);
    } catch (error) {
      console.error('Failed to unlock hint:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendUserMessage = async () => {
    if (!userInput.trim() || isLoading) return;

    setIsLoading(true);
    try {
      await handleSendMessage(userInput, activeHint);

      setUserInput('');
      const textarea = document.querySelector('textarea');
      if (textarea) {
        textarea.style.height = '50px';
        textarea.focus();
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(prev => !prev);
  };

  const handleLanguageSelect = (language: string) => {
    setCurrentLanguage(language);
    // Update the languageIndex in Panel by finding the index of the selected language
    const newIndex = languages.indexOf(language);
    if (newIndex !== -1) {
      setLanguageIndex(newIndex);
    }
    setIsDropdownOpen(false);
  };

  return (
    <CurrentLanguageContext.Provider value={currentLanguage}>
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[1000000]">
        <div className="bg-zinc-900 text-white rounded-xl shadow-2xl p-5 w-[70vw] h-[90vh] flex relative">
          <div className="flex-1 flex flex-col w-full px-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-2 flex-wrap">
                {hintData.map(({ percent }) => {
                  const unlocked = unlockedHints.has(percent >= 30 ? `${percent}-${currentLanguage}` : `${percent}`);
                  return (
                    <button
                      key={percent}
                      onClick={() => setActiveHint(percent)}
                      className={`text-lg font-medium px-3 py-1 rounded-md transition-all duration-200 flex items-center gap-1
                      ${activeHint === percent ? 'bg-zinc-800 text-orange-400' : 'text-zinc-400 hover:text-orange-300'}
                      ${unlocked ? 'text-orange-400' : ''}`}
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
              <div className="flex items-center gap-2">
                <div className="relative">
                  <button
                    onClick={toggleDropdown}
                    className="flex items-center gap-1 bg-zinc-800 text-white px-3 py-1 rounded-md hover:bg-zinc-700 transition-all duration-200"
                  >
                    <span className="text-sm">{currentLanguage}</span>
                    <ChevronDown size={16} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-1 w-32 bg-zinc-800 border border-zinc-700 rounded-md shadow-lg z-10">
                      {languages.map((language) => (
                        <button
                          key={language}
                          onClick={() => handleLanguageSelect(language)}
                          className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-zinc-700 transition-all duration-200"
                        >
                          {language}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={onClose} className="hover:opacity-80">
                  <img src={ShrinkIcon} alt="Shrink" className="w-6 h-6 object-contain" />
                </button>
              </div>
            </div>

            {isHintUnlocked ? (
              <>
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-3">
                    {(hintMessages[hintKey] || []).map((msg, idx) => (
                      <div key={idx} className={msg.role === 'assistant' ? 'flex items-start gap-2' : 'flex justify-end'}>
                        {msg.role === 'assistant' ? (
                          <>
                            <div className="h-6 w-6 flex items-center justify-center text-lg">🤓</div>
                            <div className="bg-zinc-800 text-sm px-4 py-2 rounded-lg max-w-[90%] prose prose-invert break-words whitespace-pre-wrap">
                              <ReactMarkdown
                                rehypePlugins={[rehypeRaw, rehypeHighlight]}
                                components={components}
                              >
                                {highlightTerms(msg.text)}
                              </ReactMarkdown>
                            </div>
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

                  <div className="mt-auto w-full flex items-center px-2 pb-1">
                    <div className="relative w-full">
                      <textarea
                        value={userInput}
                        onChange={(e) => {
                          const target = e.target as HTMLTextAreaElement;
                          setUserInput(target.value);
                          if (target.value.trim() === '') {
                            target.style.height = '50px';
                          } else {
                            target.style.height = 'auto';
                            target.style.height = `${Math.min(target.scrollHeight, 160)}px`;
                          }
                        }}
                        onInput={(e) => {
                          const target = e.target as HTMLTextAreaElement;
                          if (target.value.trim() === '') {
                            target.style.height = '50px';
                          } else {
                            target.style.height = 'auto';
                            target.style.height = `${Math.min(target.scrollHeight, 160)}px`;
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendUserMessage();
                            const target = e.target as HTMLTextAreaElement;
                            target.style.height = '50px';
                          }
                        }}
                        placeholder="Message LeetCopilot..."
                        className="w-full max-h-[160px] overflow-y-auto bg-zinc-800 border border-zinc-700 rounded-xl text-md px-4 py-3 pr-7 resize-none focus:outline-none focus:ring-2 focus:ring-orange-400 scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-transparent"
                        style={{ height: '50px' }}
                      />
                      <button
                        onClick={() => {
                          sendUserMessage();
                          const textarea = document.querySelector('textarea');
                          if (textarea) textarea.style.height = '50px';
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-orange-500 hover:bg-orange-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs shadow"
                      >
                        ↑
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center">
                {isLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80 z-10">
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="relative w-12 h-12">
                        <div className="custom-spinner w-full h-full rounded-full" />
                      </div>
                      <p className="text-white text-sm mt-4">LET IT COOK...</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center animate-pulse">
                    <p className="text-lg text-zinc-300 mb-4 transform transition-all duration-300 hover:scale-110 hover:text-orange-400">
                      {currentHintData?.text || ''}
                    </p>
                    <button
                      onClick={handleUnlock}
                      className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full text-lg font-bold shadow-lg hover:shadow-xl hover:scale-110 hover:from-orange-600 hover:to-red-600 transition-all duration-300 ease-in-out animate-pulse-slow focus:outline-none focus:ring-4 focus:ring-orange-400"
                    >
                      UNLOCK
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .hljs-keyword { color: #569cd6; } /* Keywords in blue */
        .hljs-string { color: #ce9178; } /* Strings in orange */
        .hljs-comment { color: #6a9955; } /* Comments in green */
        .hljs-number { color: #b5cea8; } /* Numbers in light green */
        .hljs-function { color: #dcdcaa; } /* Functions in yellow */
      `}</style>
    </CurrentLanguageContext.Provider>
  );
};

export default ExpandedHintModal;