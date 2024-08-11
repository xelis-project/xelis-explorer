import { createElement } from 'react'
import { Outlet } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { extractCss, setup } from 'goober'
import { PreloadFonts } from 'g45-react/components/fontawesome_icon'
import { prefix } from 'goober/prefixer'

import { ThemeProvider } from './hooks/useTheme'
import { SettingsProvider } from './hooks/useSettings'
import { NotificationProvider } from './components/notifications'
import { PreloadAssets, favicon } from './layout/utils'

import "reset-css/reset.css"

import './style/theme'
import './style/page'
import './style/scrollbar'

setup(createElement, prefix) // this is for goober styled() func

let css = ``

function App(props) {
  const { children, title, defaultSettings } = props

  if (!css) {
    css = extractCss()
  }

  return <>
    <Helmet titleTemplate={title ? `%s · ${title}` : undefined}>
      <meta name="theme-color" content="#7afad3" />
      {favicon()}
      <style>{css}</style> {/* Don't use id="_goober" or css will flicker. Probably an issue with goober reseting css.*/}
    </Helmet>
    <PreloadAssets />
    <PreloadFonts />
    <ThemeProvider>
      <SettingsProvider defaultSettings={defaultSettings}>
        <NotificationProvider>
          {children ? children : <Outlet />}
        </NotificationProvider>
      </SettingsProvider>
    </ThemeProvider>
  </>
}

export default App