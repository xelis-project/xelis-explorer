import { createRoot } from 'react-dom/client'
import React from 'react'
import { glob, setup } from 'goober'

import "css.gg/icons/all.css"
import "reset-css"

import App from './app'

import './theme'
import './scrollbar'

setup(React.createElement)

const container = document.getElementById('app')
const root = createRoot(container)
root.render(<App />)
