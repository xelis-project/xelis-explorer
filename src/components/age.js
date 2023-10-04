import { useEffect, useState } from 'react'
import prettyMs from 'pretty-ms'

function Age(props) {
  const { timestamp, ms = 1000, format = { compact: true }, update = false } = props

  const [age, setAge] = useState(() => {
    return new Date().getTime() - (timestamp || 0)
  })

  useEffect(() => {
    if (!timestamp) return

    let timeoutId = null
    const updateTime = () => {
      const age = new Date().getTime() - timestamp
      setAge(age)

      if (update) timeoutId = setTimeout(updateTime, ms)
    }

    updateTime()

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [update, timestamp])

  if (!timestamp) return null
  return prettyMs(age, format)
}

export default Age