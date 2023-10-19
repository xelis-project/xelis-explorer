import BigNumber from 'bignumber.js'
import bytes from 'bytes'

export const reduceText = (text, maxLeft = 5, maxRight = 5) => {
  if (typeof text !== 'string') return text
  const length = text.length
  if (length <= maxLeft + maxRight) return text
  const start = text.substring(0, maxLeft)
  const end = text.substring(length - maxRight, length)
  return start + `...` + end
}

export const XELIS_ASSET = `0000000000000000000000000000000000000000000000000000000000000000`

export const shiftNumber = (value, decimals) => {
  return new BigNumber(value || 0).shiftedBy(-decimals)
}

export const formatXelis = (value, { withSuffix = true } = {}) => {
  let number = shiftNumber(value, 5).toNumber().toLocaleString(undefined, { maximumFractionDigits: 5 })
  return `${number}${withSuffix ? ` XEL` : ``}`
}

export const formatAsset = (value, asset) => {
  switch (asset) {
    case XELIS_ASSET:
      return formatXelis(value)
    default:
      return `${value} (${reduceText(asset)})`
  }
}

export const formatSize = (value, options = { unitSeparator: ` ` }) => {
  return bytes.format(value, options)
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
    hashRate: formatHashRate(block.difficulty / 15), // BLOCK_TIME is 15
  }
}

export const displayError = (err) => {
  if (err instanceof Error) {
    return err.message
  }

  if (typeof err === 'string') {
    return err
  }

  if (typeof err === 'object') {
    return JSON.stringify(err)
  }

  console.error(err)
  return 'An error occured. Check console log.'
}

export const parseAddressWithPort = (addr) => {
  // ipv4
  const ipv4_matches = /^([0-9.]+):(\d+)$/.exec(addr)
  if (ipv4_matches) {
    return { ip: ipv4_matches[1], port: ipv4_matches[2], family: `ipv4` }
  }

  // ipv6
  const ipv6_matches = /^\[([0-9a-f:]+)\]:(\d+)$/i.exec(addr)
  if (ipv6_matches) {
    return { ip: ipv6_matches[1], port: ipv6_matches[2], family: `ipv6` }
  }

  return null
}