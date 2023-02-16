import { useEffect, useState } from 'react'
import prettyMs from 'pretty-ms'

function Age(props) {
  const { timestamp, ms = 3000, formatParams = { compact: false } } = props

  const [age, setAge] = useState(0)
  useEffect(() => {
    let timeoutId = null
    const update = () => {
      const age = new Date().getTime() - timestamp
      setAge(age)

      timeoutId = setTimeout(update, ms)
    }

    update()

    return () => {
      clearTimeout(timeoutId)
    }
  }, [])

  return prettyMs(age, formatParams)
}

export default Age