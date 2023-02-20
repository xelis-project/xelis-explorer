export const reduceText = (text, maxLeft = 7, maxRight = 7) => {
  if (typeof text !== 'string') return text
  const length = text.length
  if (length <= maxLeft + maxRight + 3) return text
  const start = text.substring(0, maxLeft)
  const end = text.substring(length - maxRight, length)
  return start + `...` + end
}

export const XELIS_ASSET = `0000000000000000000000000000000000000000000000000000000000000000`

export const shiftNumber = (value, decimals) => {
  return value / Math.pow(10, decimals)
}

export const formatXelis = (value) => {
  return `${shiftNumber(value, 5)} XELIS`
}

export const formatAsset = (value, asset) => {
  switch (asset) {
    case XELIS_ASSET:
      return formatXelis(value)
    default:
      return value
  }
}

export const formatAssetName = (asset) => {
  switch (asset) {
    case XELIS_ASSET:
      return `XELIS (${reduceText(XELIS_ASSET)})`
    default:
      return value
  }
}
