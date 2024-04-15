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

// https://en.wikipedia.org/wiki/Names_of_large_numbers
// https://units.fandom.com/wiki/Prefix_Of_Numbers
const BIG_NUMBER_MAP = {
  k: 1_000, // thousand
  m: 1_000_000, // million
  b: 1_000_000_000, // billion
  t: 1_000_000_000_000, // trillion
  qa: 1_000_000_000_000_000, // quadrillion
  qi: 1_000_000_000_000_000_000, // quintillion
  sx: 1_000_000_000_000_000_000_000, // sextillion
  sp: 1_000_000_000_000_000_000_000_000, // septillion
  oc: 1_000_000_000_000_000_000_000_000_000, // octillion
  no: 1_000_000_000_000_000_000_000_000_000_000, // nonillion
  dc: 1_000_000_000_000_000_000_000_000_000_000_000 // decillion
}

export const prettyFormatNumber = (nbr, { decimals = 2 } = {}) => {
  let prefix = ''
  let value = new BigNumber(nbr, 10)

  if (value >= BIG_NUMBER_MAP.dc) {
    prefix = ' Dc'
    value = value.div(BIG_NUMBER_MAP.dc)
  } else if (value >= BIG_NUMBER_MAP.no) {
    prefix = ' No'
    value = value.div(BIG_NUMBER_MAP.no)
  } else if (value >= BIG_NUMBER_MAP.oc) {
    prefix = ' Oc'
    value = value.div(BIG_NUMBER_MAP.oc)
  } else if (value >= BIG_NUMBER_MAP.sp) {
    prefix = ' Sp'
    value = value.div(BIG_NUMBER_MAP.sp)
  } else if (value >= BIG_NUMBER_MAP.sx) {
    prefix = ' Sx'
    value = value.div(BIG_NUMBER_MAP.sx)
  } else if (value >= BIG_NUMBER_MAP.qi) {
    prefix = ' Qi'
    value = value.div(BIG_NUMBER_MAP.qi)
  } else if (value >= BIG_NUMBER_MAP.qa) {
    prefix = ' Qa'
    value = value.div(BIG_NUMBER_MAP.qa)
  } else if (value >= BIG_NUMBER_MAP.t) {
    prefix = ' T'
    value = value.div(BIG_NUMBER_MAP.t)
  } else if (value >= BIG_NUMBER_MAP.b) {
    prefix = ' B'
    value = value.div(BIG_NUMBER_MAP.b)
  } else if (value >= BIG_NUMBER_MAP.m) {
    prefix = ' M'
    value = value.div(BIG_NUMBER_MAP.m)
  } else if (value >= BIG_NUMBER_MAP.k) {
    prefix = ' K'
    value = value.div(BIG_NUMBER_MAP.k)
  }

  return `${value.toFixed(decimals)}${prefix}`
}

const HASH_RATE_MAP = {
  h: 1,
  kh: 1_000, // KiloHash
  mh: 1_000_000, // MegaHash
  gh: 1_000_000_000, // GigaHash
  th: 1_000_000_000_000, // TeraHash
  ph: 1_000_000_000_000_000, // PetaHash
  eh: 1_000_000_000_000_000_000,	// ExaHash
  zh: 1_000_000_000_000_000_000_000, // ZettaHash
  yh: 1_000_000_000_000_000_000_000_000 // YottaHash
}

export const BLOCK_TIME = 15 // 15 seconds

export const formatHashRate = (difficulty, { decimals = 2, withSuffix = true } = {}) => {
  let prefix = `H/s`

  let value = new BigNumber(difficulty, 10).div(BLOCK_TIME)

  if (value >= HASH_RATE_MAP.yh) {
    value = value.div(HASH_RATE_MAP.yh)
    prefix = `YH/s`
  } else if (value >= HASH_RATE_MAP.zh) {
    value = value.div(HASH_RATE_MAP.zh)
    prefix = `ZH/s`
  } else if (value >= HASH_RATE_MAP.eh) {
    value = value.div(HASH_RATE_MAP.eh)
    prefix = `EH/s`
  } else if (value >= HASH_RATE_MAP.ph) {
    value = value.div(HASH_RATE_MAP.ph)
    prefix = `PH/s`
  } else if (value >= HASH_RATE_MAP.th) {
    value = value.div(HASH_RATE_MAP.th)
    prefix = `TH/s`
  } else if (value >= HASH_RATE_MAP.gh) {
    value = value.div(HASH_RATE_MAP.gh)
    prefix = `GH/s`
  } else if (value >= HASH_RATE_MAP.mh) {
    value = value.div(HASH_RATE_MAP.mh)
    prefix = `MH/s`
  } else if (value >= HASH_RATE_MAP.kh) {
    value = value.div(HASH_RATE_MAP.kh)
    prefix = `KH/s`
  }

  if (withSuffix) {
    return `${value.toFixed(decimals)} ${prefix}`
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