import bytes from 'bytes'

export const reduceText = (text, maxLeft = 7, maxRight = 7) => {
  if (typeof text !== 'string') return text
  const length = text.length
  if (length <= maxLeft + maxRight) return text
  const start = text.substring(0, maxLeft)
  const end = text.substring(length - maxRight, length)
  return start + `...` + end
}

export const XELIS_ASSET = `0000000000000000000000000000000000000000000000000000000000000000`

export const shiftNumber = (value, decimals) => {
  return value / Math.pow(10, decimals)
}

export const formatXelis = (value, withSuffy = true) => {
  return `${shiftNumber(value, 5)}${withSuffy ? ` XELIS` : ``}`
}

export const formatAsset = (value, asset) => {
  switch (asset) {
    case XELIS_ASSET:
      return formatXelis(value)
    default:
      return value
  }
}

export const formatSize = (value, options = { unitSeparator: ` ` }) => {
  return bytes.format(value, options)
}

export const formatAssetName = (asset) => {
  switch (asset) {
    case XELIS_ASSET:
      return `XELIS(${reduceText(XELIS_ASSET)})`
    default:
      return value
  }
}

export const groupBy = (list, getKey) => {
  const map = new Map()

  list.forEach((item) => {
    const key = getKey(item)
    if (map.has(key)) {
      map.set(key, [...map.get(key), item])
    } else {
      map.set(key, [item])
    }
  })
  return map
}

const HASH_RATE_MAP = {
  h: 1,
  kh: 1000, // KiloHash
  mh: 1000000, // MegaHash
  gh: 1000000000, // GigaHash
  th: 1000000000000, // TeraHash
  ph: 1000000000000000, // PetaHash
  eh: 1000000000000000000,	// ExaHash
  zh: 1000000000000000000000, // ZettaHash
  yh: 1000000000000000000000000 // YottaHash
}

export const formatHashRate = (value, decimals = 2) => {
  let unit = `H/s`

  if (value >= HASH_RATE_MAP.yh) {
    value /= HASH_RATE_MAP.yh
    unit = `YH/s`
  } else if (value >= HASH_RATE_MAP.zh) {
    value /= HASH_RATE_MAP.zh
    unit = `ZH/s`
  } else if (value >= HASH_RATE_MAP.eh) {
    value /= HASH_RATE_MAP.eh
    unit = `EH/s`
  } else if (value >= HASH_RATE_MAP.ph) {
    value /= HASH_RATE_MAP.ph
    unit = `PH/s`
  } else if (value >= HASH_RATE_MAP.th) {
    value /= HASH_RATE_MAP.th
    unit = `TH/s`
  } else if (value >= HASH_RATE_MAP.gh) {
    value /= HASH_RATE_MAP.gh
    unit = `GH/s`
  } else if (value >= HASH_RATE_MAP.mh) {
    value /= HASH_RATE_MAP.mh
    unit = `MH/s`
  } else if (value >= HASH_RATE_MAP.kh) {
    value /= HASH_RATE_MAP.kh
    unit = `KH/s`
  }

  return `${value.toFixed(decimals)} ${unit}`
}

export const formattedBlock = (block, topoheight) => {
  return {
    date: new Date(block.timestamp).toLocaleString(),
    miner: reduceText(block.miner),
    totalFees: formatXelis(block.total_fees), // if available (include_txs?)
    reward: formatXelis(block.reward),
    confirmations: topoheight - block.topoheight,
    size: formatSize(block.total_size_in_bytes),
    hasPreviousBlock: block.topoheight > 0,
    hasNextBlock: block.topoheight < topoheight,
    hashRate: formatHashRate(block.difficulty / 15) // BLOCK_TIME is 15
  }
}