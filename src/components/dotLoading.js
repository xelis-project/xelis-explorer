import { useEffect, useState, useRef, useMemo } from 'react'

const SPACE_UNICODE = `\u00A0`

function DotLoading(props) {
  const { delay = 500, max = 3 } = props

  const cursorRef = useRef(max)
  const content = useMemo(() => {
    let content = []

    for (let i = 0; i < max; i++) {
      content.push(`.`)
    }

    return content
  }, [max])

  const [dots, setDots] = useState(content)

  useEffect(() => {
    let intervalId = setInterval(() => {
      cursorRef.current++

      if (cursorRef.current > max) {
        cursorRef.current = 0
      }

      const newContent = content.map((_, index) => {
        if (index < cursorRef.current) {
          return `.`
        }
        return SPACE_UNICODE
      })

      setDots(newContent)
    }, delay)
    return () => clearInterval(intervalId)
  }, [delay, content, max])

  return dots.join(``)
}

export default DotLoading
