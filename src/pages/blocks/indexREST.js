import { useCallback, useEffect, useState } from 'react'
import { formatXelis, reduceText } from '../../utils'
import { Link } from 'react-router-dom'
import bytes from 'bytes'

import Age from '../../components/age'
import { Helmet } from 'react-helmet-async'
import TableBody from '../../components/tableBody'
import Pagination, { getPaginationRange } from '../../components/pagination'
import useSupabase from '../../hooks/useSupabase'

function Blocks() {
  const supabase = useSupabase()

  const [err, setErr] = useState()
  const [loading, setLoading] = useState(true)
  const [blocks, setBlocks] = useState([])
  const [count, setCount] = useState()
  const [pageState, setPageState] = useState({ page: 1, size: 20 })

  const loadBlocks = useCallback(async () => {
    setErr(null)
    setLoading(true)

    const query = supabase
      .rpc(`get_blocks`, null, { count: `exact` })

    query.order(`timestamp`, { ascending: false })

    let { start, end } = getPaginationRange(pageState)
    const { error, data, count } = await query.range(start, end)
    setLoading(false)
    if (error) return resErr(error)

    setCount(count)
    setBlocks(data)
  }, [supabase, pageState])

  useEffect(() => {
    loadBlocks()
  }, [loadBlocks])

  return <div>
    <Helmet>
      <title>Blocks</title>
    </Helmet>
    <h1>Blocks</h1>
    <Pagination state={pageState} setState={setPageState}
      countText="blocks" count={count} style={{ marginBottom: `1em` }} />
    <div className="table-responsive">
      <table>
        <thead>
          <tr>
            <th>Topo Height</th>
            <th>Height</th>
            <th>Type</th>
            <th>Txs</th>
            <th>Age</th>
            <th>Size</th>
            <th>Hash</th>
            <th>Total Fees</th>
            <th>Miner</th>
            <th>Reward</th>
          </tr>
        </thead>
        <TableBody list={blocks} err={err} loading={loading} colSpan={9} emptyText="No blocks"
          onItem={(item) => {
            return <tr key={item.topoheight}>
              <td>
                <Link to={`/block/${item.topoheight}`}>{item.topoheight}</Link>
              </td>
              <td>{item.height}</td>
              <td>{item.block_type}</td>
              <td>{item.tx_count}</td>
              <td>
                <Age timestamp={item.timestamp} format={{ secondsDecimalDigits: 0 }} />
              </td>
              <td>{bytes.format(item.size)}</td>
              <td>{reduceText(item.hash)}</td>
              <td>{formatXelis(item.total_fees)}</td>
              <td>{reduceText(item.miner)}</td>
              <td>{formatXelis(item.reward)}</td>
            </tr>
          }}
        />
      </table>
    </div>
    <Pagination state={pageState} setState={setPageState}
      countText="blocks" count={count} style={{ marginTop: `.5em` }} />
  </div>
}

export default Blocks
