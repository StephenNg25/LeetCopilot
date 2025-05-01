import React, { useEffect, useRef, useState } from 'react'
import Panel from './Panel'
import LCPLogo from '@/assets/LCP.png'

const App = () => {
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [isHidden, setIsHidden] = useState(false)
  const [positionY, setPositionY] = useState(300)
  const startY = useRef(0)
  const dragRef = useRef<HTMLDivElement | null>(null)
  const isDragging = useRef(false)
  const offsetY = useRef(0)

  const togglePanel = () => setIsPanelOpen(prev => !prev)

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
                className="absolute -top-2 -left-2 bg-orange-500 rounded-full w-6 h-6 hidden group-hover:flex items-center justify-center shadow-lg z-50"
                onClick={(e) => {
                e.stopPropagation()
                const root = document.getElementById('leetcopilot-root')
                if (root) root.remove()
                }}
            >
                <span className="text-white text-sm font-bold leading-none">✕</span>
            </div>
            {/* Outer Container */}
            <div className="relative flex items-center transition-all duration-300 ease-in-out group-hover:w-[110px] w-[70px] h-[70px] overflow-hidden shadow-lg">
                {/* Main Body (rounded only left) */}
                <div className="flex items-center h-full bg-orange-100 rounded-l-xl">
                    {/* Logo Section */}
                    <div
                    className="flex items-center justify-center w-[70px] h-[70px]"
                    onClick={(e) => {
                        const dragDistance = Math.abs(startY.current - e.clientY)
                        if (dragDistance < 5) togglePanel()
                    }}
                    >
                    <img src={LCPLogo} alt="LCP" className="h-9 w-auto pointer-events-none" />
                    </div>
                </div>

                {/* Slide-out Segment (no border radius at all) */}
                <div className="flex items-center justify-center w-[30px] h-full bg-orange-300 group-hover:flex hidden rounded-none">
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="w-1 h-1 bg-white rounded-full" />
                    ))}
                    </div>
                </div>
            </div>
        </div>
      )}

      {isPanelOpen && (
        <Panel onClose={togglePanel} />
      )}
    </>
  )
}

export default App
