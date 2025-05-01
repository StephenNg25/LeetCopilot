import React from 'react'
import { createRoot } from 'react-dom/client'
import styles from '@/styles/index.css?inline'
import App from './App'
import { isLeetCodeProblemPage } from '@/utils/browser'

const isProduction: boolean = process.env.NODE_ENV === 'production'
const ROOT_ID = 'leetcopilot-root'

const injectReact = (rootId: string): void => {
    if (!isLeetCodeProblemPage()) return

    // Prevent duplicate injection
    if (document.getElementById(rootId)) return

    console.log('✅ Injecting LeetCopilot UI...')

    const container = document.createElement('div')
    container.id = rootId
    container.style.position = 'fixed'
    container.style.top = '0'
    container.style.right = '0'
    container.style.zIndex = '2147483666'
    container.style.pointerEvents = 'none'
    document.body.appendChild(container)

    const target = isProduction
        ? container.attachShadow({ mode: 'open' })
        : container

    const root = createRoot(target)
    root.render(
        <React.StrictMode>
            {isProduction && <style>{styles.toString()}</style>}
            <div style={{ all: 'initial', pointerEvents: 'auto' }}>
                <App />
            </div>
        </React.StrictMode>
    )
}

// ✅ First injection when the script loads
injectReact(ROOT_ID)

// ✅ Monitor SPA navigation (LeetCode doesn't fully reload pages)
let lastPath = window.location.pathname
setInterval(() => {
    const currentPath = window.location.pathname
    if (currentPath !== lastPath) {
        lastPath = currentPath
        console.log('🔁 SPA navigation detected:', currentPath)

        // Clean up old panel if needed
        const oldRoot = document.getElementById(ROOT_ID)
        if (oldRoot) oldRoot.remove()

        // Re-inject panel on new problem page
        injectReact(ROOT_ID)
    }
}, 800)
