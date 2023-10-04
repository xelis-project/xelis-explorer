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
import useFirstRender from '../../context/useFirstRender'
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

const defaultResult = { count: 0, blocks: [], err: null, loaded: false }

const fetchBlocksSSR = async () => {
  const result = Object.assign({}, defaultResult)
  const [err, res1] = await to(daemonRPC.getTopoHeight())
  result.err = err
  if (err) return result

  const topoheight = res1.result
  // reverse pager range
  let pagination = getPaginationRange({ page: 1, size: 20 })
  let startTopoheight = topoheight - pagination.end
  if (startTopoheight < 0) startTopoheight = 0
  let endTopoheight = topoheight - pagination.start
  console.log(pagination, startTopoheight, endTopoheight)
  const [err2, res2] = await to(daemonRPC.getBlocksRangeByTopoheight({
    start_topoheight: startTopoheight,
    end_topoheight: endTopoheight
  }))
  result.err = err2
  if (err2) return result

  console.log(res2.result.length)
  result.count = topoheight + 1
  result.blocks = res2.result.reverse()
  result.loaded = true

  return result
}

function Blocks() {
  const firstRender = useFirstRender()
  const [err, setErr] = useState()
  const [loading, setLoading] = useState()
  const [pageState, setPageState] = useState({ page: 1, size: 20 })

  const serverResult = useServerData(`result`, async () => {
    return await fetchBlocksSSR()
  }, defaultResult)

  const [result, setResult] = useState(serverResult)
  const nodeSocket = useNodeSocket()

  const loadBlocks = useCallback(async () => {
    if (!nodeSocket.connected) return

    setErr(null)
    setLoading(true)

    const resErr = (err) => {
      setResult({ count: 0, blocks: [] })
      setErr(err)
      setLoading(false)
    }

    let pagination = getPaginationRange(pageState)

    const [err1, topoheight] = await to(nodeSocket.daemon.getTopoHeight())
    if (err1) return resErr(err1)

    // reverse pager range
    let startTopoheight = topoheight - pagination.end
    if (startTopoheight < 0) startTopoheight = 0
    let endTopoheight = topoheight - pagination.start

    const [err2, blocks] = await to(nodeSocket.daemon.getBlocksRangeByTopoheight({
      start_topoheight: startTopoheight,
      end_topoheight: endTopoheight
    }))
    if (err2) return resErr(err2)

    setResult({ count: topoheight + 1, blocks: blocks.reverse() })
    setLoading(false)
  }, [pageState, nodeSocket])

  useNodeSocketSubscribe({
    event: RPCEvent.NewBlock,
    onData: (_, block) => {
      // don't add new block if we're not on first page
      if (pageState.page > 1) return

      setResult((result) => {
        result.blocks.unshift(block)
        if (result.blocks.length > pageState.size) {
          result.blocks.pop()
        }

        result.count++
        return Object.assign({}, result)
      })
    }
  }, [pageState])

  // load if ssr didn't load
  useEffect(() => {
    if (!firstRender || result.loaded) return
    loadBlocks()
  }, [loadBlocks])

  // load on pagination change
  useEffect(() => {
    if (firstRender) return
    loadBlocks()
  }, [pageState])

  const { count, blocks } = result

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
    <Pagination className={paginationStyle} state={pageState} setState={setPageState} countText="blocks" count={count} />
  </div>
}

export default Blocks
