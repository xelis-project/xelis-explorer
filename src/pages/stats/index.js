import bytes from 'bytes'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import Button from '../../components/button'
import Chart from '../../components/chart'
import Pagination, { getPaginationRange } from '../../components/pagination'
import TableBody from '../../components/tableBody'
import useSupabase from '../../hooks/useSupabase'
import { formatXelis } from '../../utils'

function StatsTable(props) {
  const { count, loading, err, list, pageState, setPageState } = props

  return <div>
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
              <td>{item.time}</td>
              <td>{item.block_count}</td>
              <td>{bytes.format(item.sum_size)}</td>
              <td>{formatXelis(item.sum_block_reward, false)}</td>
              <td>{formatXelis(item.sum_block_fees, false)}</td>
              <td>{item.tx_count}</td>
              <td>{item.avg_difficulty}</td>
              <td>{item.avg_block_time}</td>
              <td>{bytes.format(item.avg_block_size)}</td>
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

function StatsChart() {
  const data = useMemo(() => {
    let rnd = []
    for (let i = 0; i < 6; i++) {
      rnd.push(Math.random())
    }

    return {
      labels: ['January', 'February', 'March', 'April', 'May', 'June'],
      datasets: [{
        label: 'Units',
        data: rnd,
        borderColor: '#1870cb',
        borderWidth: 4,
        tension: .3
      }]
    }
  }, [])

  const chart = useMemo(() => {
    return {
      type: 'line',
      data: data,
      options: {
        maintainAspectRatio: false,
        elements: {
          point: {
            radius: 0
          }
        },
        plugins: {
          legend: {
            display: false
          },
        },
        scales: {
          y: {
            display: true,
            beginAtZero: false
          },
          x: {
            display: true
          }
        }
      }
    }
  }, [])

  return <div>
    <div className="stats-buttons">
      <Button className="button">Hash rate</Button>
      <Button className="button">Txs</Button>
      <Button className="button">Difficulty</Button>
      <Button className="button">Supply</Button>
      <Button className="button">Avg block size</Button>
      <Button className="button">Avg block time</Button>
      <Button className="button">Blockchain size</Button>
    </div>
    <Chart style={{ height: 500 }} chart={chart} />
  </div>
}

function Stats() {
  const supabase = useSupabase()

  const [loading, setLoading] = useState(true)
  const [count, setCount] = useState(0)
  const [list, setList] = useState([])
  const [err, setErr] = useState()
  const [pageState, setPageState] = useState({ page: 1, size: 20 })

  const load = useCallback(async () => {
    setLoading(true)
    const query = supabase
      .rpc(`get_stats`, { interval: `day` }, { count: 'exact' })
      .order(`time`, { ascending: false })

    const { start, end } = getPaginationRange(pageState)
    const { error, data, count } = await query.range(start, end)
    setLoading(false)
    if (error) return console.log(error)

    setCount(count)
    setList(data)
  }, [supabase])

  useEffect(() => {
    load()
  }, [load])


  return <div>
    <Helmet>
      <title>Stats</title>
    </Helmet>

    <h1>Statistics</h1>
    <div className="stats-buttons">
      <Button icon="chart" className="button">Graph</Button>
      <Button icon="view-list" className="button">Table</Button>
    </div>
    <StatsTable list={list} loading={loading} err={err} count={count}
      pageState={pageState} setPageState={setPageState} />
  </div>
}

export default Stats