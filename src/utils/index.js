import BigNumber from 'bignumber.js'
import bytes from 'bytes'
import hashIt from 'hash-it'

export const reduceText = (text, maxLeft = 5, maxRight = 5) => {
  if (typeof text !== 'string') return text
  const length = text.length
  if (length <= maxLeft + maxRight) return text
  const start = text.substring(0, maxLeft)
  const end = text.substring(length - maxRight, length)
  return start + `...` + end
}

export const XELIS_ASSET = `0000000000000000000000000000000000000000000000000000000000000000`
export const XELIS_DECIMALS = 8
export const XELIS_ASSET_DATA = { topoheight: 0, decimals: XELIS_DECIMALS }

export const shiftNumber = (value, decimals) => {
  return new BigNumber(value || 0).shiftedBy(-decimals)
}

export const formatXelis = (value, { withSuffix = true } = {}) => {
  const number = formatAsset(value, XELIS_DECIMALS)
  return `${number}${withSuffix ? ` XEL` : ``}`
}

export const formatAsset = (value, decimals) => {
  return shiftNumber(value, decimals).toNumber().toLocaleString(undefined, { maximumFractionDigits: decimals })
}

/*
export const formatAsset = (value, asset) => {
  switch (asset) {
    case XELIS_ASSET:
      return formatXelis(value)
    default:
      return `${value} (${reduceText(asset)})`
  }
}*/

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

export const BLOCK_TIME = 15 // 15 seconds

export const formatHashRate = (difficulty, { decimals = 2, withSuffix = true } = {}) => {
  let unit = `H/s`

  let value = new BigNumber(difficulty, 10).div(BLOCK_TIME)

  if (value >= HASH_RATE_MAP.yh) {
    value = value.div(HASH_RATE_MAP.yh)
    unit = `YH/s`
  } else if (value >= HASH_RATE_MAP.zh) {
    value = value.div(HASH_RATE_MAP.zh)
    unit = `ZH/s`
  } else if (value >= HASH_RATE_MAP.eh) {
    value = value.div(HASH_RATE_MAP.eh)
    unit = `EH/s`
  } else if (value >= HASH_RATE_MAP.ph) {
    value = value.div(HASH_RATE_MAP.ph)
    unit = `PH/s`
  } else if (value >= HASH_RATE_MAP.th) {
    value = value.div(HASH_RATE_MAP.th)
    unit = `TH/s`
  } else if (value >= HASH_RATE_MAP.gh) {
    value = value.div(HASH_RATE_MAP.gh)
    unit = `GH/s`
  } else if (value >= HASH_RATE_MAP.mh) {
    value = value.div(HASH_RATE_MAP.mh)
    unit = `MH/s`
  } else if (value >= HASH_RATE_MAP.kh) {
    value = value.div(HASH_RATE_MAP.kh)
    unit = `KH/s`
  }

  if (withSuffix) {
    return `${value.toFixed(decimals)} ${unit}`
  }

  return value.toFixed(decimals)
}

export const formatBlock = (block, topoheight) => {
  return {
    date: new Date(block.timestamp).toLocaleString(),
    miner: reduceText(block.miner),
    totalFees: formatXelis(block.total_fees), // if available (include_txs?)
    reward: formatXelis(block.reward),
    confirmations: block.topoheight != null ? topoheight - block.topoheight : 0,
    size: formatSize(block.total_size_in_bytes),
    hasPreviousBlock: block.topoheight > 0,
    hasNextBlock: block.topoheight < topoheight,
    hashRate: formatHashRate(block.difficulty),
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

export const fetchGeoLocation = async (ips) => {
  ips.sort() // sort or the hash we not be the same
  const cacheKey = `geo_cache_${hashIt(ips)}`
  try {
    // using session storage to cache if page reload
    const cacheData = sessionStorage.getItem(cacheKey)
    if (cacheData) {
      const data = JSON.parse(cacheData)
      return Promise.resolve(data)
    }

    const query = `?ips=${ips.join(`,`)}`
    const res = await fetch(`https://geoip.xelis.io${query}`)
    const data = await res.json()
    sessionStorage.setItem(cacheKey, JSON.stringify(data))
    return Promise.resolve(data)
  } catch (e) {
    return Promise.reject(e)
  }
}