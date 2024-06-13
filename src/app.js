import { createElement } from 'react'
import { Outlet } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { extractCss, setup } from 'goober'
import { NodeSocketProvider } from '@xelis/sdk/react/daemon'

import { ThemeProvider } from './hooks/useTheme'
import useSettings, { SettingsProvider, settingsKeys } from './hooks/useSettings'
import { NotificationProvider } from './components/notifications'
import { PreloadAssets } from './components/preload'
import { favicon } from './components/favicon'

import "reset-css/reset.css"

import './style/theme'
import './style/page'
import './style/scrollbar'

setup(createElement) // this is for goober styled() func

let css = ``

function SubApp() {
  const { settings } = useSettings()
  const endpoint = settings[settingsKeys.NODE_WS_ENDPOINT]

  if (!css) {
    css = extractCss()
  }

  //const { theme: currentTheme } = useTheme()

  return <NodeSocketProvider endpoint={endpoint}>
    <Helmet titleTemplate='%s · XELIS Explorer'>
      <meta name="theme-color" content="#7afad3" />
      {favicon()}
      <style>{css}</style> {/* Don't use id="_goober" or css will flicker. Probably an issue with goober reseting css.*/}
    </Helmet>
    <PreloadAssets />
    <Outlet />
  </NodeSocketProvider>
}

function App(props) {
  return <ThemeProvider>
    <SettingsProvider>
      <NotificationProvider>
        <SubApp />
      </NotificationProvider>
    </SettingsProvider>
  </ThemeProvider>
}

export default App