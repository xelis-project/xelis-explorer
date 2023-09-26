import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import to from 'await-to-js'
import { css } from 'goober'

import { formatSize, formatXelis, reduceText } from '../../utils'
import useNodeRPC from '../../hooks/useNodeRPC'
import Age from '../../components/age'
import { Helmet } from 'react-helmet-async'
import TableBody, { style as tableStyle } from '../../components/tableBody'
import Pagination, { getPaginationRange, style as paginationStyle } from '../../components/pagination'
import theme from '../../theme'

const style = {
  container: css`
    .header {
      display: flex;
      gap: 1em;
      margin: 2em 0;
      justify-content: space-between;

      h1 {
        font-size: 2.5em;
        font-weight: bold;
      }

      ${theme.query.tablet} {
        flex-direction: column;
      }

      ${theme.query.desktop} {
        flex-direction: row;
      }
    }
  `
}

function Blocks() {
  const nodeRPC = useNodeRPC()

  const [err, setErr] = useState()
  const [loading, setLoading] = useState(true)
  const [blocks, setBlocks] = useState([])
  const [count, setCount] = useState()
  const [pageState, setPageState] = useState({ page: 1, size: 20 })

  const loadBlocks = useCallback(async () => {
    setErr(null)
    setLoading(true)

    const resErr = (err) => {
      setBlocks([])
      setErr(err)
      setLoading(false)
    }

    let pagination = getPaginationRange(pageState)

    const [err1, topoheight] = await to(nodeRPC.getTopoHeight())
    if (err1) return resErr(err1)

    const count = topoheight + 1
    // reverse pager range
    let startTopoheight = count - pagination.end - 1
    if (startTopoheight < 0) startTopoheight = 0
    let endTopoheight = count - pagination.start - 1

    const [err2, blocks] = await to(nodeRPC.getBlocksRangeByTopoheight(startTopoheight, endTopoheight))
    if (err2) return resErr(err2)

    setCount(count)
    setLoading(false)
    setBlocks(blocks.reverse())
  }, [pageState])

  useEffect(() => {
    loadBlocks()
  }, [loadBlocks])

  return <div className={style.container}>
    <Helmet>
      <title>Blocks</title>
    </Helmet>
    <div className="header">
      <h1>Blocks</h1>
      <Pagination className={paginationStyle} state={pageState} setState={setPageState} countText="blocks" count={count} />
    </div>
    <div className={tableStyle}>
      <table>
        <thead>
          <tr>
            <th>Topo Height</th>
            {/*<th>Height</th>*/}
            {/*<th>Type</th>*/}
            <th>Txs</th>
            <th>Age</th>
            <th>Size</th>
            <th>Hash</th>
            <th>Fees</th>
            <th>Miner</th>
            <th>Reward</th>
          </tr>
        </thead>
        <TableBody list={blocks} err={err} loading={loading} colSpan={8} emptyText="No blocks"
          onItem={(item) => {
            const size = formatSize(item.total_size_in_bytes)
            return <tr key={item.topoheight}>
              <td>
                <Link to={`/blocks/${item.topoheight}`}>{item.topoheight}</Link>
              </td>
              {/*<td>{item.height}</td>*/}
              {/*<td>{item.block_type}</td>*/}
              <td>{item.txs_hashes.length}</td>
              <td>
                <Age timestamp={item.timestamp} format={{ secondsDecimalDigits: 0 }} />
              </td>
              <td>{size}</td>
              <td>
                <Link to={`/blocks/${item.hash}`}>{reduceText(item.hash)}</Link>
              </td>
              <td>{formatXelis(item.total_fees, false)}</td>
              <td>{reduceText(item.miner, 0, 7)}</td>
              <td>{formatXelis(item.reward, false)}</td>
            </tr>
          }}
        />
      </table>
    </div>
  </div>
}

export default Blocks
