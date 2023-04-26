import { useCallback, useEffect, useState } from 'react'

import Pagination, { getPaginationRange } from '../../components/pagination'
import TableBody from '../../components/tableBody'
import useSupabase from '../../hooks/useSupabase'
import { formatXelis } from '../../utils'

export const IntervalSelect = (props) => {
  return <select {...props}>
    <option value="hour">Hour</option>
    <option value="day">Day</option>
    <option value="month">Month</option>
  </select>
}

function StatsTable(props) {
  const supabase = useSupabase()
  const [loading, setLoading] = useState(true)
  const [count, setCount] = useState(0)
  const [list, setList] = useState([])
  const [err, setErr] = useState()
  const [pageState, setPageState] = useState({ page: 1, size: 20 })
  const [interval, setInterval] = useState(`day`)

  const load = useCallback(async () => {
    setLoading(true)
    const query = supabase
      .rpc(`get_stats`, { interval }, { count: 'exact' })
      .order(`time`, { ascending: false })

    const { start, end } = getPaginationRange(pageState)
    const { error, data, count } = await query.range(start, end)
    setLoading(false)
    if (error) return setErr(error)

    setCount(count)
    setList(data)
  }, [supabase, interval])

  useEffect(() => {
    load()
  }, [load])

  return <div>
    <IntervalSelect value={interval} onChange={(e) => setInterval(e.target.value)} />
    <Pagination state={pageState} setState={setPageState}
      countText="items" count={count} style={{ marginBottom: `1em` }} />
    <div className="table-responsive">
      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th>Blocks</th>
            <th>Size</th>
            <th>Reward</th>
            <th>Fees</th>
            <th>Txs</th>
            <th>Difficulty</th>
            <th>Block Time</th>
            <th>Block Size</th>
            <th>Block Reward</th>
            <th>Block Fees</th>
          </tr>
        </thead>
        <TableBody list={list} err={err} loading={loading} colSpan={11} emptyText="No stats"
          onItem={(item) => {
            return <tr key={item.time}>
              <td>{new Date(item.time).toLocaleString()}</td>
              <td>{item.block_count}</td>
              <td>{formatSize(item.sum_size)}</td>
              <td>{formatXelis(item.sum_block_reward, false)}</td>
              <td>{formatXelis(item.sum_block_fees, false)}</td>
              <td>{item.tx_count}</td>
              <td>{item.avg_difficulty}</td>
              <td>{item.avg_block_time}</td>
              <td>{formatSize(item.avg_block_size)}</td>
              <td>{formatXelis(item.avg_block_reward, false)}</td>
              <td>{formatXelis(item.avg_block_fees, false)}</td>
            </tr>
          }}
        />
      </table>
    </div>
    <Pagination state={pageState} setState={setPageState}
      countText="items" count={count} style={{ marginTop: `.5em` }} />
  </div>
}

export default StatsTable