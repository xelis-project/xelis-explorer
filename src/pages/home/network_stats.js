import to from 'await-to-js'
import prettyMs from 'pretty-ms'
import { css } from 'goober'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNodeSocket, useNodeSocketSubscribe } from '@xelis/sdk/react/daemon'
import { RPCEvent } from '@xelis/sdk/daemon/types'
import Icon from 'g45-react/components/fontawesome_icon'
import { useLang } from 'g45-react/hooks/useLang'
import Age from 'g45-react/components/age'

import { formatHashRate, formatXelis, formatDifficulty } from '../../utils'
import theme from '../../style/theme'
import { scaleOnHover } from '../../style/animate'
import { useTheme } from '../../hooks/useTheme'

const style = {
  container: css`
    .title {
      margin: 2em 0 1em 0;
      font-weight: bold;
      font-size: 1.5em;
    }

    .network-stats {
      background-color: var(--stats-bg-color);
      padding: 2em;
      border-radius: .5em;
      position: relative;

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

      .title {
        margin-bottom: 1em;
        font-weight: bold;
        font-size: 2em;
      }

      .items {
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
            font-size: .9em;
            color: var(--muted-color);
          }
    
          > :nth-child(2) {
            font-weight: bold;
            font-size: 2em;
          }
        }
      }

      .last-update {
        position: absolute;
        top: 0;
        right: 0;
        margin: 2em;
        color: var(--muted-color);
        font-weight: bold;
      }

      .mini-chart {
        max-height: 3em;
        margin-top: 0.25em;
      }
    }
  `,
}


export function NetworkStats(props) {
  const { blocks, info } = props
  const nodeSocket = useNodeSocket()
  const { t } = useLang()

  const [p2pStatus, setP2PStatus] = useState({})
  const { theme: currentTheme } = useTheme()
  const [lastUpdate, setLastUpdate] = useState(Date.now())

  const loadP2PStatus = useCallback(async () => {
    if (nodeSocket.readyState !== WebSocket.OPEN) return

    const [err, p2p] = await to(nodeSocket.daemon.methods.p2pStatus())
    if (err) return

    setP2PStatus(p2p)
  }, [nodeSocket.readyState])

  useEffect(() => {
    loadP2PStatus()
    setLastUpdate(Date.now())
  }, [blocks, loadP2PStatus])

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
    const mined = ((data.circulating_supply || 0) * 100 / (maxSupply || 1)).toFixed(2)

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

      { title: t(`Difficulty`), render: () => formatDifficulty(data.difficulty).toLocaleString() },
      { title: t(`Hashrate`), render: () => formatHashRate(data.difficulty) },
      { title: t(`Avg Block Time`), render: () => prettyMs((data.average_block_time || 0), { compact: true })},
    ]
  }, [info, blocks, currentTheme, t, p2pStatus])

  return <div className={style.container}>
    <div className="title">{t('Network Stats')}</div>
    <div className="network-stats">
      <div className="last-update" title={t(`Last update since`)}>
        <Age ssrKey="network-update" timestamp={lastUpdate} update />
      </div>
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
      <a href={STATS_LINK} target="_blank">
        {t(`See more`)}
        <Icon name="arrow-right" />
      </a>
    </div>
  </div>
}