import { useEffect, useMemo, useState } from 'react'
import prettyMs from 'pretty-ms'

import { useServerData } from '../context/useServerData'

function Age(props) {
  const { ssrId, timestamp, ms = 1000, format = { compact: true }, update = false } = props

  // this is important to use server timestamp and avoid timestamp mismatch with hydration
  const serverAge = useServerData(`component:age:${ssrId || ``}`, () => {
    return new Date().getTime() - (timestamp || 0)
  }, 0, [timestamp])

  const [age, setAge] = useState(serverAge)

  useEffect(() => {
    let timeoutId = null
    const updateTime = () => {
      const age = new Date().getTime() - (timestamp || 0)
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