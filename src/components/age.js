import { useEffect, useState } from 'react'
import prettyMs from 'pretty-ms'

function Age(props) {
  const { timestamp, ms = 3000, format = { compact: true }, update = false } = props

  const [age, setAge] = useState(0)
  useEffect(() => {
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
  }, [update])

  return prettyMs(age, format)
}

export default Age