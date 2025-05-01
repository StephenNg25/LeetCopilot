import React from 'react'
import { createRoot } from 'react-dom/client'
import styles from '@/styles/index.css?inline'
import App from './App'
import { isLeetCodeProblemPage } from '@/utils/browser'

const isProduction: boolean = process.env.NODE_ENV === 'production'
const ROOT_ID = 'leetcopilot-root'

const injectReact = (rootId: string): void => {
    if (!isLeetCodeProblemPage()) {
        console.log('[LeetCopilot] Not a valid problem page.')
        return
    }

    if (document.getElementById(rootId)) {
        console.log('[LeetCopilot] Panel already injected.')
        return
    }

    console.log('[LeetCopilot] Injecting UI...')
    const container = document.createElement('div')
    container.id = rootId
    container.style.position = 'fixed'
    container.style.top = '0'
    container.style.right = '0'
    container.style.zIndex = '2147483666'
    container.style.pointerEvents = 'none'
    document.body.appendChild(container)

    const target = isProduction ? container.attachShadow({ mode: 'open' }) : container

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

// ✅ Inject panel on initial load
injectReact(ROOT_ID)

// ✅ Detect SPA route change
let lastPath = window.location.pathname
setInterval(() => {
    const currentPath = window.location.pathname
    if (currentPath !== lastPath) {
        lastPath = currentPath
        console.log('[LeetCopilot] Detected SPA navigation:', currentPath)

        const oldRoot = document.getElementById(ROOT_ID)
        if (oldRoot) oldRoot.remove()

        injectReact(ROOT_ID)
    }
}, 800)

chrome.runtime.onMessage.addListener((message) => {
    if (message.message === 'clicked_browser_action') {
        const root = document.getElementById(ROOT_ID);
        if (!root) {
          injectReact(ROOT_ID);
        }
    }
});
