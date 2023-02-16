import { createContext, useContext, useEffect, useState } from 'react'
import useWebSocket from '../hooks/useWebSocket'

const Context = createContext(null)

export const NodeSocketProvider = (props) => {
  const { children } = props

  const { lastMessage, connected, loading, err, send } = useWebSocket(NODE_WS_ENDPOINT)
  const [newBlocks, setNewBlocks] = useState([])

  useEffect(() => {
    try {
      const block = JSON.parse(lastMessage)
      if (Object.keys(block).length > 0) {
        setNewBlocks((blocks) => {
          if (blocks.length >= 10) blocks.pop()
          return [block, ...blocks]
        })
      }
    } catch { }
  }, [lastMessage])

  useEffect(() => {
    if (connected) {
      const subscribeToBlock = JSON.stringify({
        "jsonrpc": "2.0",
        "id": 1,
        "method": "subscribe",
        "params": {
          "notify": "NewBlock"
        }
      })

      send(subscribeToBlock)
    }
  }, [connected])

  return <Context.Provider value={{ connected, loading, newBlocks, err }}>
    {children}
  </Context.Provider>
}

export const useNodeSocket = () => useContext(Context)
export default useNodeSocket
