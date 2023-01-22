export const reduceText = (text, maxLeft = 7, maxRight = 7) => {
  if (typeof text !== 'string') return text
  const length = text.length
  if (length <= maxLeft + maxRight + 3) return text
  const start = text.substring(0, maxLeft)
  const end = text.substring(length - maxRight, length)
  return start + `...` + end
}