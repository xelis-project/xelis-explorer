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
        <link rel="preload" as="image" href="/public/img/bg_xelis.jpg" />
        <link rel="preload" as="image" href="/public/img/bg_xelis_light.jpg" />
        <link rel="preload" as="image" href="/public/img/bg_xelis_dark.jpg" />
        <link rel="preload" as="image" href="/public/img/black_background_white_logo.svg" type="image/svg+xml" />
        <link rel="preload" as="image" href="/public/img/white_background_black_logo.svg" type="image/svg+xml" />
        <link rel="preload" as="font" type="font/woff2" href="/public/fa-brands-400-WYBTWVAN.woff2" crossOrigin="anonymous" />
        <link rel="preload" as="font" type="font/woff2" href="/public/fa-solid-900-7UFRKXGW.woff2" crossOrigin="anonymous" />
        <style>{css}</style> {/* Don't use id="_goober" or css will flicker. Probably an issue with goober reseting css.*/}
      </Helmet>
      <SubApp />
    </SettingsProvider>
  </ThemeProvider>
}

export default App