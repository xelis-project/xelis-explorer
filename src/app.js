import { createElement } from 'react'
import { Outlet } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { extractCss, setup } from 'goober'
import { NodeSocketProvider } from '@xelis/sdk/react/daemon'

import { ThemeProvider } from './hooks/useTheme'
import useSettings, { SettingsProvider, settingsKeys } from './hooks/useSettings'

import "reset-css/reset.css"

import './style/theme'
import './style/page'
import './style/scrollbar'

setup(createElement) // this is for goober styled() func

function SubApp() {
  const { settings } = useSettings()
  const endpoint = settings[settingsKeys.NODE_WS_ENDPOINT]

  return <NodeSocketProvider endpoint={endpoint}>
    <Outlet />
  </NodeSocketProvider>
}

let css = ``

function App(props) {
  if (!css) {
    css = extractCss()
  }

  return <ThemeProvider>
    <SettingsProvider>
      <Helmet titleTemplate='%s · XELIS Explorer'>
        <style>{css}</style> {/* Don't use id="_goober" or css will flicker. Probably an issue with goober reseting css.*/}
      </Helmet>
      <SubApp />
    </SettingsProvider>
  </ThemeProvider>
}

export default App