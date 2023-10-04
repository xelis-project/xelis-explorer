import { createRoot } from 'react-dom/client'
import React from 'react'
import { extractCss } from 'goober'

import { ClientRouter } from './router'
import App from './app'

const css = extractCss()

const container = document.getElementById('app')
const root = createRoot(container)
root.render(<App css={css}><ClientRouter /></App>)
