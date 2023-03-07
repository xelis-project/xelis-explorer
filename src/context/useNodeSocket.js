import { createContext, useCallback, useContext, useEffect, useRef } from 'react'
import useWebSocket from '../hooks/useWebSocket'

const Context = createContext(null)

export const NodeSocketProvider = (props) => {
  const { children, sendMethodTimeout = 3000 } = props

  const { connected, loading, err, send, socketRef } = useWebSocket(NODE_WS_ENDPOINT)
  const subscriptions = useRef({})

  const sendMethod = useCallback((method, params) => {
    return new Promise((resolve, reject) => {
      const id = Date.now() + Math.round((Math.random() * 9999))
      const data = { jsonrpc: `2.0`, id, method }
      if (params) data[`params`] = params

      let timeoutId = null
      const onMessage = (message) => {
        const data = JSON.parse(message.data)
        if (data.id === id) {
          clearTimeout(timeoutId)
          socketRef.current.removeEventListener(`message`, onMessage)
          resolve(data.result)
        }
      }

      timeoutId = setTimeout(() => {
        socketRef.current.removeEventListener(`message`, onMessage)
        reject(`timeout`)
      }, sendMethodTimeout)

      socketRef.current.addEventListener(`message`, onMessage)
      send(JSON.stringify(data))
    })
  }, [send, sendMethodTimeout])

  const subscribe = useCallback((event, onData) => {
    const onMessage = (message) => {
      const data = JSON.parse(message.data)
      if (data.id === 1 && data.result.event === event) {
        onData(data.result)
      }
    }

    socketRef.current.addEventListener(`message`, onMessage)

    if (subscriptions.current[event]) {
      subscriptions.current[event] += 1
    } else {
      subscriptions.current[event] = 1
      const data = { jsonrpc: `2.0`, id: 1, method: `subscribe`, params: { notify: event } }
      send(JSON.stringify(data))
    }

    return () => {
      if (subscriptions.current[event] === 1) {
        const data = { jsonrpc: `2.0`, id: 1, method: `unsubscribe`, params: { notify: event } }
        send(JSON.stringify(data))
      }

      subscriptions.current[event] -= 1
      socketRef.current.removeEventListener(`message`, onMessage)
    }
  }, [send])

  const onNewBlock = useCallback((onData) => subscribe(`NewBlock`, onData), [subscribe])
  const onTransactionAddedInMempool = useCallback((onData) => subscribe(`TransactionAddedInMempool`, onData), [subscribe])
  const onTransactionExecuted = useCallback((onData) => subscribe(`TransactionExecuted`, onData), [subscribe])

  const values = {
    connected, loading, err,
    sendMethod, subscribe, onNewBlock, onTransactionAddedInMempool, onTransactionExecuted
  }

  return <Context.Provider value={values}>
    {children}
  </Context.Provider>
}

// handy helper function to avoid rewriting useEffect subscription in components
export const useNodeSocketSubscribe = ({ event, onLoad, onData }, dependencies) => {
  const nodeSocket = useNodeSocket()

  useEffect(() => {
    if (!nodeSocket.connected) return

    if (typeof onLoad === `function`) onLoad()
    const unsubscribe = nodeSocket.subscribe(event, onData)

    return () => {
      unsubscribe()
    }
  }, [nodeSocket, ...dependencies])
}

export const useNodeSocket = () => useContext(Context)
export default useNodeSocket
