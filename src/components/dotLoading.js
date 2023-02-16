import { useEffect, useState } from 'react'

function DotLoading(props) {
  const { delay = 500, max = 3 } = props
  const [dots, setDots] = useState(() => {
    let start = ``
    for (let i = 0; i < max; i++) {
      start += `.`
    }
    return start
  })

  useEffect(() => {
    let intervalId = setInterval(() => {
      setDots(dots => {
        if (dots.length === max) return ``
        return dots + `.`
      })
    }, delay)
    return () => clearInterval(intervalId)
  }, [delay, max])

  return dots
}

export default DotLoading
