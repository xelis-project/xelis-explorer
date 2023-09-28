import { createRoot } from 'react-dom/client'
import React from 'react'
import { setup } from 'goober'

import "css.gg/icons/icons.css"
import "reset-css"

import App from './app'

import './style/theme'
import './style/page'
import './style/scrollbar'

setup(React.createElement)

const container = document.getElementById('app')
const root = createRoot(container)
root.render(<App />)
