import to from 'await-to-js'
import prettyMs from 'pretty-ms'
import { css } from 'goober'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNodeSocket, useNodeSocketSubscribe } from '@xelis/sdk/react/daemon'
import { RPCEvent } from '@xelis/sdk/daemon/types'
import { useServerData } from 'g45-react/hooks/useServerData'
import Icon from 'g45-react/components/fontawesome_icon'
import { useLang } from 'g45-react/hooks/useLang'

import { formatHashRate, formatXelis } from '../../utils'
import theme from '../../style/theme'
import { scaleOnHover } from '../../style/animate'
import Chart from '../../components/chart'
import { useTheme } from '../../hooks/useTheme'
import { daemonRPC } from '../../hooks/nodeRPC'

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
    margin: 5em 0 3em 0;
    background-color: var(--stats-bg-color);
    padding: 2em;
    border-radius: .5em;

    ${theme.query.minLarge} {
      padding: 4em;
    }

    a {
      border-radius: 1em;
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

    > :nth-child(1) {
      margin-bottom: 1em;
      font-weight: bold;
      font-size: 1.5em;
      
      &::after {
        margin-top:.6em;
        height: .1em;
        content: '';
        background-color: var(--text-color);
        width: 100%;
        display: block;
        border-radius: .5em;
      }
    }

    > :nth-child(2) {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1em;
  
      ${theme.query.minDesktop} {
        grid-template-columns: 1fr 1fr 1fr;
        gap: 2em;
      }
  
      > div {
        padding: 1em 0;
  
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

    .mini-chart {
      height: 3em;
      margin-top: 0.25em;
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

  return <Chart config={chartConfig} className="mini-chart" />
}

function loadNetworkStats_SSR() {
  const defaultResult = { err: null, info: {}, loaded: false }
  return useServerData(`func:loadNetworkStats`, async () => {
    const result = Object.assign({}, defaultResult)
    const [err, res1] = await to(daemonRPC.getInfo())
    result.err = err
    if (err) return

    result.info = res1.result
    result.loaded = true
    return result
  }, defaultResult)
}

export function NetworkStats(props) {
  const { blocks } = props
  const nodeSocket = useNodeSocket()
  const { t } = useLang()

  const serverResult = loadNetworkStats_SSR()

  const [info, setInfo] = useState(serverResult.info)
  const [err, setErr] = useState()
  const [loading, setLoading] = useState()
  const [p2pStatus, setP2PStatus] = useState({})
  const { theme: currentTheme } = useTheme()

  const loadInfo = useCallback(async () => {
    if (nodeSocket.readyState !== WebSocket.OPEN) return

    const resErr = (err) => {
      setInfo({})
      setErr(err)
      setLoading(false)
    }

    setLoading(true)
    const [err, info] = await to(nodeSocket.daemon.getInfo())
    if (err) return resErr(err)
    setInfo(info)
    setLoading(false)
  }, [nodeSocket.readyState])

  const loadP2PStatus = useCallback(async () => {
    if (nodeSocket.readyState !== WebSocket.OPEN) return

    const [err, p2p] = await to(nodeSocket.daemon.p2pStatus())
    if (err) return

    setP2PStatus(p2p)
  }, [nodeSocket.readyState])

  useEffect(() => {
    loadInfo()
    loadP2PStatus()
  }, [blocks, loadInfo, loadP2PStatus])

  useNodeSocketSubscribe({
    event: RPCEvent.TransactionAddedInMempool,
    onData: () => {
      setInfo((info) => {
        info.mempool_size++
        return { ...info }
      })
    }
  }, [])

  const stats = useMemo(() => {
    const data = info || {}

    const maxSupply = data.maximum_supply || 0
    const mined = ((data.circulating_supply || 0) * 100 / maxSupply).toFixed(2)

    const labels = []
    const difficultyHistory = []

    const _blocks = Object.assign([], blocks)
    _blocks.reverse().forEach((b, i) => {
      labels.push(`${i}`)
      difficultyHistory.push(b.difficulty)
    })

    labels.push(labels.length)
    difficultyHistory.push(data.difficulty)

    const difficultyChartData = {
      labels: labels,
      datasets: [{
        label: 'Units',
        data: difficultyHistory,
        borderColor: currentTheme === 'light' ? `#1c1c1c` : `#f1f1f1`,
        fill: true,
        backgroundColor: currentTheme === 'light' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)',
        borderWidth: 4,
        tension: .3
      }]
    }

    return [
      { title: t(`Max Supply`), render: () => formatXelis(maxSupply, { withSuffix: false }) },
      { title: t(`Circulating Supply`), render: () => formatXelis(data.circulating_supply, { withSuffix: false }) },
      { title: t(`Mined`), render: () => `${mined}%` },

      { title: t(`Topo Height`), render: () => (data.topoheight || 0).toLocaleString() },
      { title: t(`Block Reward`), render: () => formatXelis(data.block_reward, { withSuffix: false }) },
      { title: t(`Mempool`), render: () => `${data.mempool_size || 0} tx` },

      { title: t(`Height`), render: () => (data.height || 0).toLocaleString() },
      { title: t(`Stable Height`), render: () => (data.stableheight || 0).toLocaleString() },
      { title: t(`Peers`), render: () => (p2pStatus.peer_count || 0).toLocaleString() },

      {
        title: t(`Difficulty`), render: () => {
          return <div>
            <div>{(data.difficulty || 0).toLocaleString()}</div>
            <MiniChart data={difficultyChartData} />
          </div>
        }
      },
      {
        title: t(`Hashrate`), render: () => formatHashRate((data.difficulty || 0) / 15)
      },
      {
        title: t(`Avg Block Time`), render: () => prettyMs((data.average_block_time || 0), { compact: true })
      },
    ]
  }, [info, blocks, currentTheme, t, p2pStatus])

  return <div className={style.container}>
    <div>{t('Network Stats')}</div>
    <div>
      {stats.map((item) => {
        let value = null
        if (typeof item.render === 'function') value = item.render()
        return <div key={item.title}>
          <div>{item.title}</div>
          <div>{info ? value : '--'}</div>
        </div>
      })}
    </div>
    <a href={STATS_LINK} target="_blank">
      {t(`See more`)}
      <Icon name="arrow-right" />
    </a>
  </div>
}