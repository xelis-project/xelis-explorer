import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import to from 'await-to-js'
import { css } from 'goober'
import { useNodeSocket } from '@xelis/sdk/react/context'

import { formatSize, formatXelis, reduceText } from '../../utils'
import Age from '../../components/age'
import { Helmet } from 'react-helmet-async'
import TableBody, { style as tableStyle } from '../../components/tableBody'
import Pagination, { getPaginationRange, style as paginationStyle } from '../../components/pagination'
import TableFlex from '../../components/tableFlex'

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

function Blocks() {
  const [err, setErr] = useState()
  const [loading, setLoading] = useState()
  const [blocks, setBlocks] = useState([])
  const [count, setCount] = useState()
  const [pageState, setPageState] = useState({ page: 1, size: 20 })

  const nodeSocket = useNodeSocket()

  const loadBlocks = useCallback(async () => {
    if (!nodeSocket.connected) return

    setErr(null)
    setLoading(true)

    const resErr = (err) => {
      setBlocks([])
      setErr(err)
      setLoading(false)
    }

    let pagination = getPaginationRange(pageState)

    const [err1, topoheight] = await to(nodeSocket.daemon.getTopoHeight())
    if (err1) return resErr(err1)

    const count = topoheight + 1
    // reverse pager range
    let startTopoheight = count - pagination.end - 1
    if (startTopoheight < 0) startTopoheight = 0
    let endTopoheight = count - pagination.start - 1

    const [err2, blocks] = await to(nodeSocket.daemon.getBlocksRangeByTopoheight({
      start_topoheight: startTopoheight,
      end_topoheight: endTopoheight
    }))
    if (err2) return resErr(err2)

    setCount(count)
    setLoading(false)
    setBlocks(blocks.reverse())
  }, [pageState, nodeSocket])

  useEffect(() => {
    loadBlocks()
  }, [loadBlocks])

  return <div className={style.container}>
    <Helmet>
      <title>Blocks</title>
    </Helmet>
    <h1>Blocks</h1>
    <TableFlex
      err={err}
      loading={loading}
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
          render: (value) => <Age timestamp={value} format={{ secondsDecimalDigits: 0 }} />
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
          render: (value) => reduceText(value, 0, 7)
        },
        {
          key: 'reward',
          title: 'Reward',
          render: (value) => formatXelis(value)
        }
      ]}
      data={blocks}
      rowKey={'topoheight'}
    />
    <Pagination className={paginationStyle} state={pageState} setState={setPageState} countText="blocks" count={count} />
  </div>
}

export default Blocks
