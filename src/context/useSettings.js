import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import store from 'store2'

const Context = createContext()

const storeSettings = store.namespace(`settings`)

export const settingsKeys = {
  NODE_WS_ENDPOINT: 'node_ws_endpoint',
}

export const defaultSettings = {
  [settingsKeys.NODE_WS_ENDPOINT]: NODE_WS_ENDPOINT,
}

export function SettingsProvider(props) {
  const { children } = props

  const [settings, setSettings] = useState(() => {
    return storeSettings.getAll(Object.assign({}, defaultSettings)) // use object.assign or defaultSettings will get overwritten
  })

  const setValue = useCallback((key, value) => {
    settings[key] = value
    setSettings({ ...settings })
  }, [settings])

  useEffect(() => {
    storeSettings.setAll(settings)
  }, [settings])

  return <Context.Provider value={{ settings, setSettings, setValue }}>
    {children}
  </Context.Provider>
}

const useSettings = () => useContext(Context)
export default useSettings
