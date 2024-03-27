import { createElement } from 'react'
import { Outlet } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { extractCss, setup } from 'goober'
import { NodeSocketProvider } from '@xelis/sdk/react/daemon'

import { ThemeProvider } from './hooks/useTheme'
import useSettings, { SettingsProvider, settingsKeys } from './hooks/useSettings'
import { NotificationProvider } from './components/notifications'

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
      {/*currentTheme === `xelis` && <link rel="preload" as="image" href="public/img/bg_xelis.jpg" />}
      {currentTheme === `light` && <link rel="preload" as="image" href="public/img/bg_xelis_light.jpg" />}
{currentTheme === `dark` && <link rel="preload" as="image" href="public/img/bg_xelis_dark.jpg" />}
      {currentTheme !== `light` && <link rel="preload" as="image" href="public/img/white_background_black_logo.svg" type="image/svg+xml" />}
      {currentTheme === `light` && <link rel="preload" as="image" href="public/img/black_background_white_logo.svg" type="image/svg+xml" />*/}
      <style>{css}</style> {/* Don't use id="_goober" or css will flicker. Probably an issue with goober reseting css.*/}
    </Helmet>
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