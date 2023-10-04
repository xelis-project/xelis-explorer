import React from 'react'
import { hydrateRoot } from 'react-dom/client'

import { ClientRouter } from '../router'
import App from '../app'

const container = document.getElementById('app')
hydrateRoot(container, <App><ClientRouter /></App>)
