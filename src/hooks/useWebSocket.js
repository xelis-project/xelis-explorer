import { useCallback, useEffect, useRef, useState } from 'react'

const useWebSocket = (endpoint) => {
  const socketRef = useRef()
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState()
  const [connected, setConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState(``)

  const send = useCallback((data) => {
    socketRef.current.send(data)
  })

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

  return { loading, err, connected, send, lastMessage }
}

export default useWebSocket
