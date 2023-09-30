import to from 'await-to-js'
import prettyMs from 'pretty-ms'
import { css } from 'goober'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNodeSocket } from '@xelis/sdk/react/context'

import { formatHashRate, formatXelis } from '../../utils'
import theme from '../../style/theme'
import Icon from '../../components/icon'
import { scaleOnHover } from '../../style/animate'
import Chart from '../../components/chart'
import { useTheme } from '../../context/useTheme'

theme.xelis`
  --stats-bg-color: rgb(14 30 32 / 70%);
`

theme.dark`
  --stats-bg-color: rgb(12 12 12 / 50%);
`

theme.light`
  --stats-bg-color: rgb(231 231 231 / 50%);
`

const style = {
  container: css`
    margin-bottom: 3em;

    ${theme.query.minDesktop} {
      padding: 4em;
      background-color: var(--stats-bg-color);

      > {
        max-width: 700px;
        margin: 0 auto;
      }
    }

    a {
      border-radius: 30px;
      background-color: var(--text-color);
      color: var(--bg-color);
      padding: .6em 1em;
      display: inline-flex;
      align-items: center;
      gap: .5em;
      border: none;
      cursor: pointer;
      text-decoration: none;
      margin-top: 2em;
      font-size: 1.2em;
      ${scaleOnHover}
    }

    .title {
      margin-bottom: 1em;
      font-weight: bold;
      font-size: 1.5em;
      
      &::after {
        margin-top:.6em;
        height: 2px;
        content: "";
        background-color: var(--text-color);
        width: 100%;
        display: block;
      }
    }

    .items {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1em;
  
      ${theme.query.minMobile} {
        grid-template-columns: 1fr 1fr;
      }
  
      ${theme.query.minDesktop} {
        grid-template-columns: 1fr 1fr 1fr;
      }
  
      > div {
        padding: 1em;
  
        > :nth-child(1) {
          margin-bottom: .5em;
          font-size: .8em;
          color: var(--muted-color);
        }
  
        > :nth-child(2) {
          font-weight: bold;
          font-size: 2em;
        }
      }
    }

    .chart {
      height: 3em;
      padding: 0.25em;
      margin-top: 0.5em;
    }
  `,
}

function MiniChart(props) {
  const { data } = props

  const chartConfig = useMemo(() => {
    return {
      type: 'line',
      data: data,
      options: {
        animation: {
          duration: 0
        },
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
            display: false,
            beginAtZero: false
          },
          x: {
            display: false
          }
        }
      }
    }
  }, [data])

  return <Chart config={chartConfig} className="chart" />
}

export function NetworkStats(props) {
  const { blocks = [] } = props
  const nodeSocket = useNodeSocket()

  const [info, setInfo] = useState()
  const [err, setErr] = useState()
  const [loading, setLoading] = useState()
  const { theme: currentTheme } = useTheme()

  const loadInfo = useCallback(async () => {
    setLoading(true)
    const [err, info] = await to(nodeSocket.daemon.getInfo())
    if (err) return setErr(err)
    setInfo(info)
    setLoading(false)
  }, [nodeSocket])

  useEffect(() => {
    loadInfo()
  }, [loadInfo, blocks])

  /*
  useNodeSocketSubscribe({
    event: `NewBlock`,
    onConnected: loadInfo,
    onData: loadInfo
  }, [])*/

  const stats = useMemo(() => {
    const data = info || {}

    const maxSupply = 1840000000000
    const mined = (data.native_supply * 100 / maxSupply).toFixed(2)

    const labels = []
    const difficultyHistory = []

    const _blocks = Object.assign([], blocks)
    _blocks.reverse().forEach((b, i) => {
      labels.push(`${i}`)
      difficultyHistory.push(b.difficulty)
    })

    const difficultyChartData = {
      labels: labels,
      datasets: [{
        label: 'Units',
        data: difficultyHistory,
        borderColor: currentTheme === 'light' ? `#1c1c1c` : `#f1f1f1`,
        borderWidth: 4,
        tension: .3
      }]
    }

    return [
      { title: `Max Supply`, render: () => formatXelis(maxSupply, { withSuffix: false }) },
      { title: `Circulating Supply`, render: () => formatXelis(data.native_supply, { withSuffix: false }) },
      { title: `Mined`, render: () => `${mined}%` },
      { title: `Block Count`, render: () => (data.topoheight || 0).toLocaleString() },
      { title: `Block Reward`, render: () => formatXelis(data.block_reward, { withSuffix: false }) },
      { title: `Tx Pool`, render: () => `${data.mempool_size} tx` },
      {
        title: `Difficulty`, render: () => {
          return <div>
            <div>{(data.difficulty || 0).toLocaleString()}</div>
            <MiniChart data={difficultyChartData} />
          </div>
        }
      },
      {
        title: `Hashrate`, render: () => formatHashRate(data.difficulty / 15)
      },
      {
        title: `Avg Block Time`, render: () => prettyMs((data.average_block_time || 0), { compact: true })
      },
    ]
  }, [info, blocks, currentTheme])

  return <div className={style.container}>
    <div className="title">Network Stats</div>
    <div className="items">
      {stats.map((item) => {
        let value = null
        if (typeof item.render === 'function') value = item.render()
        return <div key={item.title}>
          <div>{item.title}</div>
          <div>{info ? value : '--'}</div>
        </div>
      })}
    </div>
    <a href="https://stats.xelis.io" target="_blank">
      Go to stats.xelis.io
      <Icon name="arrow-right" />
    </a>
  </div>
}