import { createElement } from 'react'
import { Helmet, HelmetProvider } from 'react-helmet-async'
import { NodeSocketProvider } from '@xelis/sdk/react/context'
import { setup } from 'goober'

import { ThemeProvider } from './context/useTheme'
import useSettings, { SettingsProvider, settingsKeys } from './context/useSettings'
import { OverlayProvider } from './context/useOverlay'
import { ServerProvider } from './context/useServer'

import "reset-css"

import './style/theme'
import './style/page'
import './style/scrollbar'

export let helmetContext = {}

setup(createElement)

function App(props) {
  const { children, serverContext } = props

  return <HelmetProvider context={helmetContext}>
    <Helmet titleTemplate="%s · XELIS Explorer">
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link rel="stylesheet" href="/public/client.css" />
      <link rel="icon" href="/public/favicon.ico" />
    </Helmet>
    <ServerProvider context={serverContext}>
      <ThemeProvider>
        <SettingsProvider>
          <SubApp>
            {children}
          </SubApp>
        </SettingsProvider>
      </ThemeProvider>
    </ServerProvider>
  </HelmetProvider>
}

function SubApp(props) {
  const { children } = props

  const { settings } = useSettings()
  const endpoint = settings[settingsKeys.NODE_WS_ENDPOINT]

  return <NodeSocketProvider endpoint={endpoint}>
    <OverlayProvider>
      {children}
    </OverlayProvider>
  </NodeSocketProvider>
}

export default App
