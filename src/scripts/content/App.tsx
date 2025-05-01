import React, { useEffect, useRef, useState } from 'react'
import Panel from './Panel' // <- NEW
import LCPLogo from '@/assets/LCP.png'

const App = () => {
    const [isPanelOpen, setIsPanelOpen] = useState(false)
    const [isHidden, setIsHidden] = useState(false) // Hidden widget 
    const [positionY, setPositionY] = useState(300) // Initial vertical position
    const startY = useRef(0) // Remember initial Y when drag starts
    const dragRef = useRef<HTMLDivElement | null>(null)
    const isDragging = useRef(false)
    const offsetY = useRef(0)

    const togglePanel = () => setIsPanelOpen(prev => !prev)
    

    // Handle dragging
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
            {/* Floating Button */}
            {!isPanelOpen && !isHidden && (
                <div
                    ref={dragRef}
                    onMouseDown={startDragging}
                    className="fixed z-[999999] cursor-pointer"
                    style={{ top: `${positionY}px`, right: '-26px' }}
                >
                    <div
                        className="relative flex items-center group transition-all duration-300 ease-in-out hover:scale-[1.08] hover:left-[-16px]"
                        style={{
                            height: '72px',
                            borderTopLeftRadius: '10px',
                            borderBottomLeftRadius: '10px',
                            backgroundColor: '#FFE0B2',
                            color: '#000',
                            padding: '0 40px 0 28px',
                            fontWeight: 600,
                            boxShadow: '0 0 8px rgba(0,0,0,0.25)',
                        }}
                        onClick={(e) => {
                            const dragDistance = Math.abs(startY.current - e.clientY)
                            if (dragDistance < 5) {
                                // Small movement = click
                                togglePanel()
                            }
                        }}
                        
                    >
                        <img
                            src={LCPLogo}
                            alt="Hints"
                            className="h-12 w-auto mr-2 pointer-events-none"
                        />

                        {/* Hoverable X (no hover loss) */}
                        <div
                            className="absolute -top-3 -left-3 bg-orange-400 rounded-full w-6 h-6 hidden group-hover:flex items-center justify-center"
                            onClick={(e) => {
                                e.stopPropagation()
                                const ROOT_ID = 'leetcopilot-root'; // Define the ROOT_ID variable
                                const root = document.getElementById(ROOT_ID);
                                if (root) {
                                    root.remove(); // Remove the root element from the DOM
                                    console.log('[LeetCopilot] Root element removed');
                                }
                            }}
                        >
                            <span className="text-white text-xs font-bold">✕</span>
                        </div>
                    </div>
                </div>
            )}




            {/* Sidebar Panel */}
            {isPanelOpen && (
                <Panel onClose={togglePanel} />
            )}
        </>
    )
}

export default App
