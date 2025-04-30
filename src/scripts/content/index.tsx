import React from 'react'
import { createRoot } from 'react-dom/client'
import styles from '@/styles/index.css?inline'
import App from './App'
import { isLeetCodeProblemPage } from '@/utils/browser'

const isProduction: boolean = process.env.NODE_ENV === 'production'
const ROOT_ID = 'leetcopilot-root'

const injectReact = (rootId: string): void => {
    if (!isLeetCodeProblemPage()) {
        console.log('❌ Not a LeetCode problem page')
        return
    }

    console.log('✅ Injecting LeetCopilot UI...')

    const container = document.createElement('div')
    container.id = rootId
    container.style.position = 'fixed'
    container.style.top = '0'
    container.style.right = '0'
    container.style.zIndex = '2147483666' // max z-index
    container.style.pointerEvents = 'none' // Let page interactions through
    document.body.appendChild(container)

    const target: ShadowRoot | HTMLElement = isProduction
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

injectReact(ROOT_ID)
