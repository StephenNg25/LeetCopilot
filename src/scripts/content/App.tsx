import React, { useEffect, useRef, useState } from 'react'
import Panel from './Panel'
import LCPLogo from '@/assets/LCP.png'
import { DebugPatch } from '@/utils/debugger';

const App = () => {
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [isHidden, setIsHidden] = useState(false)
  const [positionY, setPositionY] = useState(300)
  const startY = useRef(0)
  const dragRef = useRef<HTMLDivElement | null>(null)
  const isDragging = useRef(false)
  const offsetY = useRef(0)
  const [currentProblemKey, setCurrentProblemKey] = useState<string | null>(null)

  // Lifted thought eval states from Panel to App
  const [thoughts, setThoughts] = useState('');
  const [aiFeedback, setAiFeedback] = useState('');
  const [timeComplexity, setTimeComplexity] = useState('N/A');
  const [optimizedScore, setOptimizedScore] = useState('0');

  // Lifted state from Panel to App
  const [activeHint, setActiveHint] = useState(10)
  const [hintMessages, setHintMessages] = useState<Record<number, { role: string; text: string }[]>>({})
  const [unlockedHints, setUnlockedHints] = useState(new Set<number>())
  const [totalAssistance, setTotalAssistance] = useState(0)
  const [isExpanded, setIsExpanded] = useState(false)
  // Lifted debug states from Panel to App
  const [debugResponse, setDebugResponse] = useState<string | null>(null)
  const [debugPatch, setDebugPatch] = useState<DebugPatch | null>(null)
  const [isDebugDisabled, setIsDebugDisabled] = useState(true)
  // New state for reducedHistory
  const [reducedHistory, setReducedHistory] = useState<{ role: string; text: string }[]>([])

  // Reset states for "↻"
  const resetStates = () => {
    setActiveHint(10);
    setHintMessages({});
    setUnlockedHints(new Set<number>());
    setTotalAssistance(0);
    setIsExpanded(false);
    setDebugResponse(null);
    setDebugPatch(null);
    setIsDebugDisabled(true);
    setThoughts('');
    setAiFeedback('');
    setTimeComplexity('N/A');
    setOptimizedScore('0');
    setReducedHistory([]);
  };

  const togglePanel = () => setIsPanelOpen(prev => !prev)

  const getProblemKey = (url: string) => {
      const match = url.match(/https:\/\/leetcode\.com\/problems\/([^\/]+)\/?/)
      return match ? match[1] : null
  }

  const saveState = (problemKey: string) => {
    const state = {
      activeHint,
      hintMessages,
      unlockedHints: Array.from(unlockedHints),
      totalAssistance,
      isExpanded,
      debugResponse,
      debugPatch,
      isDebugDisabled,
      thoughts,
      aiFeedback,
      timeComplexity,
      optimizedScore,
      reducedHistory // Save reducedHistory
    }
    chrome.storage.local.set({ [problemKey]: state }, () => {
      console.log('State saved for problem:', problemKey)
    })
  }

  const loadState = (problemKey: string) => {
    chrome.storage.local.get(problemKey, (result) => {
      const storedState = result[problemKey]
      if (storedState) {
        setActiveHint(storedState.activeHint)
        setHintMessages(storedState.hintMessages)
        setUnlockedHints(new Set(storedState.unlockedHints))
        setTotalAssistance(storedState.totalAssistance)
        setIsExpanded(storedState.isExpanded)
        setDebugResponse(storedState.debugResponse)
        setDebugPatch(storedState.debugPatch)
        setIsDebugDisabled(storedState.isDebugDisabled)
        setThoughts(storedState.thoughts)
        setAiFeedback(storedState.aiFeedback)
        setTimeComplexity(storedState.timeComplexity)
        setOptimizedScore(storedState.optimizedScore)
        setReducedHistory(storedState.reducedHistory || [])
        // Log reducedHistory when loaded
        console.log('Loaded reducedHistory:', JSON.stringify(
          (storedState.reducedHistory || []).map((msg: { role: string; text: string }) => ({
            role: msg.role === 'bot' ? 'assistant' : msg.role,
            content: msg.text
          })),
          null,
          2
        ))
        console.log('State loaded for problem:', problemKey)
      }
    })
  }

  useEffect(() => {
    const checkUrl = () => {
      const currentUrl = window.location.href
      const newProblemKey = getProblemKey(currentUrl)
      if (newProblemKey && newProblemKey === currentProblemKey) {
        // Same problem: no action needed
      } else if (newProblemKey && newProblemKey !== currentProblemKey) {
        // Different problem: update the states
        setCurrentProblemKey(newProblemKey)
        loadState(newProblemKey)
      } else {
        // Different site: reset ProblemKey to nothing
        setCurrentProblemKey(null)
      }
    }
    const initialUrl = window.location.href
    const initialProblemKey = getProblemKey(initialUrl)
    setCurrentProblemKey(initialProblemKey)
    if (initialProblemKey) {
      loadState(initialProblemKey)
    }
    const intervalId = setInterval(checkUrl, 500)
    return () => clearInterval(intervalId)
  }, [currentProblemKey])

  useEffect(() => {
    if (currentProblemKey) {
      saveState(currentProblemKey)
    }
  }, [activeHint, hintMessages, unlockedHints, totalAssistance, isExpanded, debugResponse, debugPatch, isDebugDisabled, thoughts, aiFeedback, timeComplexity, optimizedScore, reducedHistory])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return
      setPositionY(e.clientY - offsetY.current)
    }

    const handleMouseUp = () => {
      isDragging.current = false
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  const startDragging = (e: React.MouseEvent) => {
    isDragging.current = true
    offsetY.current = e.clientY - (dragRef.current?.getBoundingClientRect().top || 0)
    startY.current = e.clientY
  }

  return (
    <>
      {!isPanelOpen && !isHidden && (
        <div
          ref={dragRef}
          onMouseDown={startDragging}
          className="fixed z-[999999] cursor-pointer group"
          style={{ top: `${positionY}px`, right: '0px' }}
        >
            {/* Absolute Close Button */}
            <div
                className="absolute -top-2 -left-2 bg-orange-400 hover:bg-orange-500 rounded-full w-5 h-5 hidden group-hover:flex items-center justify-center shadow-lg z-50 transition-colors duration-200"
                onClick={(e) => {
                e.stopPropagation()
                const root = document.getElementById('leetcopilot-root')
                if (root) root.remove()
                }}
            >
                <span className="text-white text-sm font-bold leading-none">✕</span>
            </div>
            {/* Outer Container */}
            <div className="relative flex items-center transition-all duration-300 ease-in-out group-hover:w-[85px] w-[60px] h-[60px] overflow-hidden shadow-lg">
                {/* Main Body (rounded only left) */}
                <div className="flex items-center h-full bg-orange-100 rounded-l-md">
                    {/* Logo Section */}
                    <div
                    className="flex items-center justify-center w-[60px] h-[60px]"
                    onClick={(e) => {
                        const dragDistance = Math.abs(startY.current - e.clientY)
                        if (dragDistance < 5) togglePanel()
                    }}
                    >
                    <img src={LCPLogo} alt="LCP" className="h-9 w-auto pointer-events-none" />
                    </div>
                </div>

                {/* Slide-out Segment (no border radius at all) */}
                <div className="absolute top-0 right-0 flex items-center justify-center w-[25px] h-full bg-orange-300 hover:bg-orange-400 group-hover:flex hidden rounded-none transition-colors duration-200 cursor-grab">
                    <div className="grid grid-cols-2 gap-x-[2px] gap-y-[2px]">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="w-1 h-1 bg-white rounded-full" />
                    ))}
                    </div>
                </div>
            </div>
        </div>
      )}

      {isPanelOpen && (
        <Panel
          onClose={togglePanel}
          onReset={resetStates}
          thoughts={thoughts}
          setThoughts={setThoughts}
          aiFeedback={aiFeedback}
          setAiFeedback={setAiFeedback}
          timeComplexity={timeComplexity}
          setTimeComplexity={setTimeComplexity}
          optimizedScore={optimizedScore}
          setOptimizedScore={setOptimizedScore}
          activeHint={activeHint}
          setActiveHint={setActiveHint}
          hintMessages={hintMessages}
          setHintMessages={setHintMessages}
          unlockedHints={unlockedHints}
          setUnlockedHints={setUnlockedHints}
          totalAssistance={totalAssistance}
          setTotalAssistance={setTotalAssistance}
          isExpanded={isExpanded}
          setIsExpanded={setIsExpanded}
          debugResponse={debugResponse}
          setDebugResponse={setDebugResponse}
          debugPatch={debugPatch}
          setDebugPatch={setDebugPatch}
          isDebugDisabled={isDebugDisabled}
          setIsDebugDisabled={setIsDebugDisabled}
          reducedHistory={reducedHistory}
          setReducedHistory={setReducedHistory}
        />
      )}
    </>
  )
}

export default App