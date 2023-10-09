import { setup } from 'goober'
import { createElement } from 'react'
import { Helmet, HelmetProvider } from 'react-helmet-async'
import { NodeSocketProvider } from '@xelis/sdk/react/daemon'

import { ThemeProvider } from './context/useTheme'
import useSettings, { SettingsProvider, settingsKeys } from './context/useSettings'
import { OverlayProvider } from './context/useOverlay'
import { ServerProvider } from './context/useServer'
import { ServerDataProvider, getServerDataContext } from './context/useServerData'

import "reset-css/reset.css"

import './style/theme'
import './style/page'
import './style/scrollbar'

setup(createElement) // not really sure if this is needed

function App(props) {
  const { children, css, serverContext, helmetContext, serverDataContext = getServerDataContext() } = props

  return <HelmetProvider context={helmetContext}>
    <Helmet titleTemplate="%s · XELIS Explorer">
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link rel="stylesheet" href="/public/client.css" />
      <link rel="icon" href="/public/favicon.ico" />
      <style id="goober">{css}</style>
    </Helmet>
    <ServerProvider context={serverContext}>
      <ServerDataProvider context={serverDataContext}>
        <ThemeProvider>
          <SettingsProvider>
            <SubApp>
              {children}
            </SubApp>
          </SettingsProvider>
        </ThemeProvider>
      </ServerDataProvider>
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
