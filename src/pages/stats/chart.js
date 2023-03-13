import bytes from 'bytes'
import prettyMS from 'pretty-ms'
import { useCallback, useEffect, useState, useMemo } from 'react'

import Button from '../../components/button'
import Chart from '../../components/chart'
import useSupabase from '../../hooks/useSupabase'
import { formatXelis } from '../../utils'
import { IntervalSelect } from './table'

function StatsChart() {
  const supabase = useSupabase()
  const [interval, setInterval] = useState(`day`)
  const [loading, setLoading] = useState(true)
  const [count, setCount] = useState(0)
  const [list, setList] = useState([])
  const [column, setColumn] = useState(`block_count`)

  const columns = useMemo(() => {
    return {
      'block_count': `Blocks`,
      'avg_difficulty': `Difficulty`,
      'sum_size': `Bandwidth`,
      'avg_block_size': `Block size`,
      'tx_count': 'Tx count',
      'avg_block_time': 'Block time',
      'sum_block_fees': 'Block fees',
      'sum_block_reward': 'Reward',
      'avg_block_reward': 'Block Reward'
    }
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    const query = supabase
      .rpc(`get_stats`, { interval }, { count: 'exact' })
      .order(`time`, { ascending: false })

    const { error, data, count } = await query.range(0, 50)
    setLoading(false)
    if (error) return console.log(error)

    setCount(count)
    setList(data.reverse())
  }, [supabase, interval])

  useEffect(() => {
    load()
  }, [load])

  const chartData = useMemo(() => {
    const labels = list.map((item) => {
      if (interval === `hour`) return new Date(item.time).toLocaleString()
      return new Date(item.time).toLocaleDateString()
    })

    const data = list.map((item) => {
      return item[column]
    })

    const label = columns[column]

    const datasets = [{
      label,
      data,
      borderColor: '#1870cb',
      borderWidth: 4,
      tension: .3
    }]

    /*
    const datasets = Object.keys(columns).map((key) => {
      return {
        label: columns[key],
        data: list.map((item) => item[key]),
        borderColor: '#1870cb',
        borderWidth: 4,
        tension: .3
      }
    })*/

    return {
      labels,
      datasets
    }
  }, [list, column, interval])

  const chartConfig = useMemo(() => {
    return {
      type: 'line',
      data: chartData,
      options: {
        spanGaps: true,
        maintainAspectRatio: false,
        elements: {
          point: {
            radius: 0
          }
        },
        plugins: {
          legend: {
            display: true
          },
        },
        scales: {
          y: {
            display: true,
            beginAtZero: false,
            ticks: {
              callback: (value, index, values) => {
                switch (column) {
                  case `avg_block_size`:
                  case `sum_size`:
                    return bytes.format(value)
                  case 'sum_block_fees':
                  case 'sum_block_reward':
                  case 'avg_block_reward':
                    return formatXelis(value)
                  case 'avg_block_time':
                    return prettyMS(value)
                  default:
                    return value
                }
              }
            }
          },
          x: {
            display: true
          }
        }
      }
    }
  }, [chartData])

  return <div>
    <IntervalSelect value={interval} onChange={(e) => setInterval(e.target.value)} />
    <div className="stats-buttons">
      {Object.keys(columns).map(key => {
        const title = columns[key]
        return <Button key={key} className="button" onClick={() => setColumn(key)}>{title}</Button>
      })}
    </div>
    <h2>{columns[column]}</h2>
    <Chart style={{ height: 500 }} config={chartConfig} />
  </div>
}

export default StatsChart
