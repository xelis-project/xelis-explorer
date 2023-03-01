import { useCallback, useEffect, useRef, useState } from 'react'

const useWebSocket = (endpoint) => {
  const socketRef = useRef()
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState()
  const [connected, setConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState(``)
  const triesRef = useRef()

  const send = useCallback((data) => {
    if (socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(data)
    }
  }, [])

  const connectWebSocket = useCallback(() => {
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
        triesRef.current = 0
      }

      const onClose = (event) => {
        setConnected(false)
        setLoading(false)
        console.log(event)

        // try reconnecting max 3 tries
        triesRef.current++
        if (triesRef.current < 3) {
          setTimeout(connectWebSocket, 1000)
        }
      }

      const onError = (err) => {
        setLoading(false)
        setErr(new Error(`WebSocket failed.`))
        console.log(err)
      }

      const onMessage = (obj) => {
        setLastMessage(obj.data)
      }

      socket.addEventListener('open', onOpen)
      socket.addEventListener('close', onClose)
      socket.addEventListener('error', onError)
      socket.addEventListener('message', onMessage)

      return () => {
        socket.removeEventListener('close', onClose)
        socket.removeEventListener('error', onError)
        socket.removeEventListener('open', onOpen)
        socket.removeEventListener('message', onMessage)
      }
    } catch (err) {
      setLoading(false)
      return setErr(err)
    }
  }, [endpoint])

  useEffect(() => {
    connectWebSocket()
  }, [connectWebSocket])

  return { loading, err, connected, send, lastMessage, socketRef }
}

export default useWebSocket
