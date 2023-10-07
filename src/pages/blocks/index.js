import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import to from 'await-to-js'
import { css } from 'goober'
import { useNodeSocket, useNodeSocketSubscribe } from '@xelis/sdk/react/context'

import { formatSize, formatXelis, reduceText } from '../../utils'
import Age from '../../components/age'
import { Helmet } from 'react-helmet-async'
import Pagination, { getPaginationRange, style as paginationStyle } from '../../components/pagination'
import TableFlex from '../../components/tableFlex'
import { daemonRPC } from '../../ssr/nodeRPC'
import { useServerData } from '../../context/useServerData'
import { usePageLoad } from '../../context/usePageLoad'
import { RPCEvent } from '@xelis/sdk/daemon/types'

const style = {
  container: css`
    h1 {
      margin: 1.5em 0 .5em 0;
      font-weight: bold;
      font-size: 2em;
    }

    .table-mobile, .table-desktop {
      margin-bottom: 1em;
    }
  `
}

export function loadBlocks_SSR({ limit, defaultBlocks = [] }) {
  const defaultResult = { totalBlocks: 0, blocks: defaultBlocks, err: null, loaded: false }

  return useServerData(`func:loadBlocks(${limit})`, async () => {
    const result = Object.assign({}, defaultResult)
    const [err, res1] = await to(daemonRPC.getTopoHeight())
    result.err = err
    if (err) return result

    const topoheight = res1.result

    let startTopoheight = Math.max(0, topoheight - limit + 1)
    let endTopoheight = topoheight

    const [err2, res2] = await to(daemonRPC.getBlocksRangeByTopoheight({
      start_topoheight: startTopoheight,
      end_topoheight: endTopoheight,
    }))
    result.err = err2
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
  const [pageState, setPageState] = useState({ page: 1, size: 20 })

  const serverResult = loadBlocks_SSR({ limit: 20 })
  const [blockCount, setBlockCount] = useState(serverResult.totalBlocks)
  const [blocks, setBlocks] = useState(serverResult.blocks)
  const nodeSocket = useNodeSocket()

  const loadBlocks = useCallback(async () => {
    if (!nodeSocket.connected) return

    setErr(null)
    setLoading(true)

    const resErr = (err) => {
      setBlocks([])
      setBlockCount(0)
      setErr(err)
      setLoading(false)
    }

    let pagination = getPaginationRange(pageState)

    const [err1, topoheight] = await to(nodeSocket.daemon.getTopoHeight())
    if (err1) return resErr(err1)

    // reverse pager range
    let startTopoheight = Math.max(0, topoheight - pagination.end)
    let endTopoheight = topoheight - pagination.start

    const [err2, blocks] = await to(nodeSocket.daemon.getBlocksRangeByTopoheight({
      start_topoheight: startTopoheight,
      end_topoheight: endTopoheight
    }))
    if (err2) return resErr(err2)

    setBlockCount(topoheight + 1)
    setBlocks(blocks.reverse())
    setLoading(false)
  }, [pageState, nodeSocket])

  useNodeSocketSubscribe({
    event: RPCEvent.NewBlock,
    onData: (_, block) => {
      // don't add new block if we're not on first page
      if (pageState.page > 1) return

      setBlocks((blocks) => {
        blocks.unshift(block)
        if (blocks.length > pageState.size) {
          blocks.pop()
        }

        return [...blocks]
      })
      setCount((count) => count + 1)
    }
  }, [pageState])

  useNodeSocketSubscribe({
    event: RPCEvent.NewBlock,
    onData: (_, block) => {
      console.log('newblock')
    }
  }, [pageState])

  useEffect(() => {
    if (firstPageLoad && serverResult.loaded) return
    loadBlocks()
  }, [loadBlocks, firstPageLoad])

  useEffect(() => {
    loadBlocks()
  }, [pageState])

  return <div className={style.container}>
    <Helmet>
      <title>Blocks</title>
    </Helmet>
    <h1>Blocks</h1>
    <TableFlex data={blocks} rowKey={'topoheight'} err={err} loading={loading} emptyText="No blocks"
      headers={[
        {
          key: 'topoheight',
          title: 'Topo Height',
          render: (value) => <Link to={`/blocks/${value}`}>{value}</Link>
        },
        {
          key: 'txs_hashes',
          title: 'Txs',
          render: (value) => (value || []).length
        },
        {
          key: 'timestamp',
          title: 'Age',
          render: (value) => <Age timestamp={value} update format={{ secondsDecimalDigits: 0 }} />
        },
        {
          key: 'total_size_in_bytes',
          title: 'Size',
          render: (value) => formatSize(value)
        },
        {
          key: 'hash',
          title: 'Hash',
          render: (value) => <Link to={`/blocks/${value}`}>{reduceText(value)}</Link>
        },
        {
          key: 'total_fees',
          title: 'Fees',
          render: (value) => formatXelis(value)
        },
        {
          key: 'miner',
          title: 'Miner',
          render: (value) => {
            return <Link to={`/accounts/${value}`}>{reduceText(value, 0, 7)}</Link>
          }
        },
        {
          key: 'reward',
          title: 'Reward',
          render: (value) => formatXelis(value)
        }
      ]}
    />
    <Pagination className={paginationStyle} state={pageState} setState={setPageState} countText="blocks" count={blockCount} />
  </div>
}

export default Blocks
