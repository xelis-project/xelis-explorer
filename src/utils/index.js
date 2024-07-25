import BigNumber from 'bignumber.js'
import prettyBytes from 'pretty-bytes'

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

// ENV is defined with esbuild from g45-react package
export const XELIS_PREFIX = ENV === `testnet` ? `XET` : `XEL`

export const formatXelis = (value, { locale, withSuffix } = {}) => {
  if (!withSuffix) withSuffix = true

  const number = formatAsset({ value, decimals: XELIS_DECIMALS, locale })
  return `${number}${withSuffix ? ` ${XELIS_PREFIX}` : ``}`
}

export const formatAsset = ({ value, decimals, locale }) => {
  return shiftNumber(value, decimals).toNumber().toLocaleString(locale, { maximumFractionDigits: decimals })
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

export const formatSize = (value, options) => {
  return prettyBytes(value || 0, options)
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

const HASH_UNIT_ARRAY = [
  { unit: 1_000_000_000_000_000_000_000_000, suffix: 'Y' }, // YottaHash
  { unit: 1_000_000_000_000_000_000_000, suffix: 'Z' }, // ZettaHash
  { unit: 1_000_000_000_000_000_000, suffix: 'E' }, // ExaHash
  { unit: 1_000_000_000_000_000, suffix: 'P' }, // PetaHash
  { unit: 1_000_000_000_000, suffix: 'T' }, // TeraHash
  { unit: 1_000_000_000, suffix: 'G' }, // GigaHash
  { unit: 1_000_000, suffix: 'M' }, // MegaHash
  { unit: 1_000, suffix: 'K' }, // KiloHash
]

export const BLOCK_TIME = 15 // in seconds

export const formatHashRate = (difficulty, { locale } = {}) => {
  let value = new BigNumber(difficulty, 10).div(BLOCK_TIME)
  return `${formatDifficulty(value.toString(), { locale })}H/s`
}

export const formatDifficulty = (difficulty, { locale, decimals } = {}) => {
  if (!decimals) decimals = 2

  let suffix = ``
  let value = new BigNumber(difficulty, 10)

  for (let i = 0; i < HASH_UNIT_ARRAY.length; i++) {
    const item = HASH_UNIT_ARRAY[i]
    if (value >= item.unit) {
      suffix = item.suffix
      value = value.div(item.unit)
      break
    }
  }

  return `${value.toNumber().toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })} ${suffix}`
}

export const formatBlock = ({ block, topoheight, locale }) => {
  if (!block) return {}

  return {
    utcDate: new Date(block.timestamp).toLocaleString(locale, { timeZone: `UTC` }),
    miner: reduceText(block.miner),
    totalFees: formatXelis(block.total_fees, { locale }), // if available (include_txs?)
    reward: formatXelis(block.reward, { locale }),
    confirmations: block.topoheight != null ? topoheight - block.topoheight : 0,
    size: formatSize(block.total_size_in_bytes, { locale }),
    hasPreviousBlock: block.topoheight > 0,
    hasNextBlock: block.topoheight < topoheight,
    hashRate: formatHashRate(block.difficulty, { locale }),
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
  try {
    ips.sort() // sort or the hash we not be the same
    const query = `?ips=${ips.join(`,`)}`
    const res = await fetch(`https://geoip.xelis.io${query}`)
    const data = await res.json()
    return Promise.resolve(data)
  } catch (e) {
    return Promise.reject(e)
  }
}

export const isHash = (id) => {
  return (/[a-z]/i.test(id))
}
