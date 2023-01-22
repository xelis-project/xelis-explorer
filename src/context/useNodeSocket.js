import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

const Context = createContext(null)

export const NodeSocketProvider = (props) => {
  const { children, endpoint } = props

  const socketRef = useRef()
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState()
  const [connected, setConnected] = useState(false)

  const call = useCallback(() => {
    // TODO
  }, [])

  useEffect(() => {
    try {
      setErr(null)
      setLoading(true)
      setConnected(false)
      const url = new URL(endpoint)
      let socket = new WebSocket(url)
      socketRef.current = socket

      const onOpen = async () => {
        setLoading(false)
        setConnected(true)
      }

      const onClose = (event) => {
        setConnected(false)
        console.log(event)
      }

      const onError = (err) => {
        setLoading(false)
        setErr(new Error(`WebSocket failed.`))
      }

      socket.addEventListener('open', onOpen)
      socket.addEventListener('close', onClose)
      socket.addEventListener('error', onError)

      return () => {
        socket.removeEventListener('close', onClose)
        socket.removeEventListener('error', onError)
        socket.removeEventListener('open', onOpen)
      }
    } catch (err) {
      setLoading(false)
      return setErr(err)
    }
  }, [call, endpoint])

  return <Context.Provider value={{ call, err, connected, loading, endpoint }}>
    {children}
  </Context.Provider>
}

export const useNodeSocket = () => useContext(Context)
export default useNodeSocket
