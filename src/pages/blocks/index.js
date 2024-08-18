import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import to from 'await-to-js'
import { css } from 'goober'
import { useNodeSocket, useNodeSocketSubscribe } from '@xelis/sdk/react/daemon'
import { RPCEvent } from '@xelis/sdk/daemon/types'
import { usePageLoad } from 'g45-react/hooks/usePageLoad'
import { useServerData } from 'g45-react/hooks/useServerData'
import Age from 'g45-react/components/age'
import { useLang } from 'g45-react/hooks/useLang'
import useQueryString from 'g45-react/hooks/useQueryString'
import hashIt from 'hash-it'
import useLocale from 'g45-react/hooks/useLocale'

import { formatHashRate, formatSize, formatXelis, groupBy, reduceText } from '../../utils'
import Pagination, { getPaginationRange } from '../../components/pagination'
import TableFlex from '../../components/tableFlex'
import { daemonRPC } from '../../node_rpc'
import { slideX } from '../../style/animate'
import PageTitle from '../../layout/page_title'
import { getBlockColor } from '../dag/blockColor'
import useTheme from '../../hooks/useTheme'
import { getBlockType } from '../dag'
import Hashicon from '../../components/hashicon'
import { formatMiner } from '../../utils/known_addrs'

const style = {
  miner: css`
    display: flex;
    gap: .5em;
    align-items: center;
  `,
  animateBlock: css`
    ${slideX({ from: `-100%`, to: `0%`, duration: `0.5s`, easing: `cubic-bezier(0.34, 1.56, 0.64, 1)` })}
  `
}

export function loadStableHeight_SSR() {
  const defaultResult = { stableheight: 0, err: null, loaded: false }

  return useServerData(`func:stableheight`, async () => {
    const result = Object.assign({}, defaultResult)

    const [err, res] = await to(daemonRPC.getStableHeight())
    result.err = err ? err.message : null
    if (err) return result

    result.stableheight = res.result
    result.loaded = true
    return result
  }, defaultResult)
}

export function loadBlocks_SSR({ pageState, defaultBlocks = [] }) {
  const defaultResult = { totalBlocks: 0, blocks: defaultBlocks, err: null, loaded: false }

  return useServerData(`func:loadBlocks(${hashIt(pageState)})`, async () => {
    const result = Object.assign({}, defaultResult)

    const [err, res1] = await to(daemonRPC.getTopoheight())
    result.err = err ? err.message : null
    if (err) return result

    const topoheight = res1.result
    let pagination = getPaginationRange(pageState)
    let startTopoheight = Math.max(0, topoheight - pagination.end)
    let endTopoheight = topoheight - pagination.start

    const [err2, res2] = await to(daemonRPC.getBlocksRangeByTopoheight({
      start_topoheight: startTopoheight,
      end_topoheight: endTopoheight,
    }))
    result.err = err2 ? err.message : null
    if (err2) return result

    result.totalBlocks = topoheight + 1
    result.blocks = res2.result.reverse()
    result.loaded = true

    return result
  }, defaultResult)
}

function Blocks() {
  const { firstPageLoad } = usePageLoad()
  const [err, setErr] = useState()
  const [loading, setLoading] = useState()
  const [query, setQuery] = useQueryString({})
  const { t } = useLang()
  const locale = useLocale()
  const { theme: currentTheme } = useTheme()

  const [pageState, _setPageState] = useState(() => {
    const page = parseInt(query.page) || 1
    const size = parseInt(query.size) || 20
    return { page, size }
  })

  const setPageState = useCallback((value) => {
    _setPageState(value)
    setQuery(value)
  }, [])

  const serverResult = loadBlocks_SSR({ pageState })
  const [blockCount, setBlockCount] = useState(serverResult.totalBlocks)
  const [blocks, setBlocks] = useState(serverResult.blocks)
  const nodeSocket = useNodeSocket()
  const [newBlock, setNewBlock] = useState()
  const serverResult2 = loadStableHeight_SSR()
  const [stableheight, setStableheight] = useState(serverResult2.stableheight)

  const loadBlocks = useCallback(async () => {
    if (nodeSocket.readyState !== WebSocket.OPEN) return

    setErr(null)
    setLoading(true)

    const resErr = (err) => {
      setBlocks([])
      setBlockCount(0)
      setErr(err)
      setLoading(false)
    }

    let pagination = getPaginationRange(pageState)

    const [err1, topoheight] = await to(nodeSocket.daemon.methods.getTopoHeight())
    if (err1) return resErr(err1)

    // reverse pager range
    let startTopoheight = Math.max(0, topoheight - pagination.end)
    let endTopoheight = topoheight - pagination.start

    const [err2, blocks] = await to(nodeSocket.daemon.methods.getBlocksRangeByTopoheight({
      start_topoheight: startTopoheight,
      end_topoheight: endTopoheight
    }))
    if (err2) return resErr(err2)

    setBlockCount(topoheight + 1)
    setBlocks(blocks.reverse())
    setLoading(false)
  }, [pageState, nodeSocket.readyState])

  const loadStableHeight = useCallback(async () => {
    if (nodeSocket.readyState !== WebSocket.OPEN) return

    const [err, stableheight] = await to(nodeSocket.daemon.methods.getStableHeight())
    if (err) return setErr(err)
    setStableheight(stableheight)
  }, [nodeSocket.readyState])

  useNodeSocketSubscribe({
    event: RPCEvent.NewBlock,
    onData: (_, newBlock) => {
      // don't add new block if we're not on first page
      if (pageState.page > 1) return

      loadStableHeight()
      setBlocks((blocks) => {
        if (blocks.findIndex(block => block.hash === newBlock.hash) !== -1) return blocks

        blocks.unshift(newBlock)
        if (blocks.length > pageState.size) {
          blocks.pop()
        }

        setNewBlock(newBlock)
        setBlockCount((count) => count + 1)
        return [...blocks]
      })
    }
  }, [pageState])

  useNodeSocketSubscribe({
    event: RPCEvent.BlockOrdered,
    onData: async (_, data) => {
      // dont't update blocks if we are not on first page
      if (pageState.page > 1) return

      const { topoheight, block_hash, block_type } = data

      const [err, blockData] = await to(nodeSocket.daemon.methods.getBlockByHash({ hash: block_hash }))
      if (err) return console.log(err)

      setBlocks((blocks) => blocks.map(block => {
        if (block.hash === block_hash) {
          //block.topoheight = topoheight
          //block.block_type = block_type
          block = blockData
        }
        return block
      }))
    }
  }, [pageState])

  useEffect(() => {
    if (firstPageLoad && serverResult.loaded) return
    if (serverResult.err) return
    loadStableHeight()
    loadBlocks()
  }, [loadBlocks, firstPageLoad])

  useEffect(() => {
    loadStableHeight()
    loadBlocks()
  }, [pageState])

  let stableLineRendered = false
  let hasUnstableblocks = false

  return <div>
    <PageTitle title={t('Blocks')} subtitle={t(`{} mined blocks`, [blockCount.toLocaleString(locale)])}
      metaDescription={t('List of mined blocks. Access block heights, timestamps and transaction counts.')} />
    <TableFlex mobileFormat={false} data={blocks} rowKey="hash" err={err} loading={loading} emptyText={t('No blocks')}
      rowClassName={(block) => {
        if (newBlock && block.hash === newBlock.hash) return style.animateBlock
        return null
      }}
      rowBefore={(block, index) => {
        if (block.height > stableheight) {
          hasUnstableblocks = true
        }

        if (hasUnstableblocks && !stableLineRendered && block.height <= stableheight) {
          stableLineRendered = true
          return <tr>
            <td colSpan={11}>{t('Blocks below are stable and cannot be rearranged.')}</td>
          </tr>
        }

        return null
      }}
      headers={[
        {
          key: 'topoheight',
          title: t('Topo Height'),
          render: (value) => {
            // use `value != null` to handle both (null and undefined)
            // don't use `if (value) {}` because zero needs to pass (genenis block)
            if (value != null) {
              return <Link to={`/blocks/${value}`}>
                {value.toLocaleString(locale)}
              </Link>
            }
            return `--`
          }
        },
        {
          key: 'height',
          title: t('Height'),
          render: (value) => {
            if (value != null) {
              return <Link to={`/height/${value}`}>
                {value.toLocaleString(locale)}
              </Link>
            }
            return `--`
          }
        },
        {
          key: 'block_type',
          title: t('Type'),
          render: (_, block) => {
            const blockType = getBlockType(blocks, block, stableheight)
            const color = getBlockColor(currentTheme, blockType)
            return <span style={{ color }}>{blockType}</span>
          }
        },
        {
          key: 'txs_hashes',
          title: t('Txs'),
          render: (value) => {
            const txCount = (value || []).length
            return txCount.toLocaleString(locale)
          }
        },
        {
          key: 'timestamp',
          title: t('Age'),
          render: (value) => <Age timestamp={value} update format={{ secondsDecimalDigits: 0 }} />
        },
        {
          key: 'total_size_in_bytes',
          title: t('Size'),
          render: (value) => formatSize(value, { locale })
        },
        {
          key: 'hash',
          title: t('Hash'),
          render: (value) => <Link to={`/blocks/${value}`}>
            {reduceText(value)}
          </Link>
        },
        /*
        // always return 0 because I'm not using include_txs
        {
          key: 'total_fees',
          title: t('Fees'),
          render: (value) => formatXelis(value)
        },
        */
        {
          key: 'miner',
          title: t('Miner'),
          render: (value) => {
            return <div className={style.miner}>
              <Hashicon value={value} size={20} />
              <Link to={`/accounts/${value}`}>
                {formatMiner(value)}
              </Link>
            </div>
          }
        },
        {
          key: 'reward',
          title: t('Reward'),
          render: (value) => formatXelis(value, { locale })
        },
        {
          key: 'difficulty',
          title: t('Network Diff'),
          render: (value) => formatHashRate(value, { locale })
        }
      ]}
    />
    <Pagination state={pageState} setState={setPageState} count={blockCount}
      formatCount={(count) => t('{} blocks', [count.toLocaleString(locale)])}
    />
  </div>
}

export default Blocks
