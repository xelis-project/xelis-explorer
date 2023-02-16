import { createContext, useCallback, useContext, useState } from 'react'
import store from 'store2'

const Context = createContext()

const storeSettings = store.namespace(`settings`)

const defaultSettings = {
  node_ws_endpoint: NODE_WS_ENDPOINT,
  node_rpc_endpoint: NODE_RPC_ENDPOINT
}

export function SettingsProvider(props) {
  const { children } = props

  const [settings, setSettings] = useState(() => {
    return storeSettings.getAll(defaultSettings)
  })

  const [_, setKeyValue] = useState((key, value) => {
    settings[key] = value
    setSettings({ ...settings })
  }, [settings])

  const save = useCallback(() => {
    storeSettings.setAll(settings)
  }, [settings])

  return <Context.Provider value={{ settings, setSettings, setKeyValue, save }}>
    {children}
  </Context.Provider>
}

const useSettings = () => useContext(Context)
export default useSettings
