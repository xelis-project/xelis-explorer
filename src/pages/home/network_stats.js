import to from 'await-to-js'
import prettyMs from 'pretty-ms'
import { css } from 'goober'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNodeSocket, useNodeSocketSubscribe } from '@xelis/sdk/react/daemon'
import { RPCEvent } from '@xelis/sdk/daemon/types'
import Icon from 'g45-react/components/fontawesome_icon'
import { useLang } from 'g45-react/hooks/useLang'
import Age from 'g45-react/components/age'
import useLocale from 'g45-react/hooks/useLocale'

import { formatHashRate, formatXelis, formatDifficulty } from '../../utils'
import theme from '../../style/theme'
import { useTheme } from '../../hooks/useTheme'

const style = {
  title: css`
    margin: 2em 0 1em 0;
    font-weight: bold;
    font-size: 1.5em;
  `,
  networkStats: {
    container: css`
      background-color: var(--content-bg-color);
      padding: 2em;
      border-radius: 1em;
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
        transition: .1s all;

        &:hover {
          transform: scale(.98);
        }
      }
    `,
    title: css`
      margin-bottom: 1em;
      font-weight: bold;
      font-size: 2em;
    `,
    items: css`
      display: grid;
      grid-template-columns: 1fr;
      gap: 1em;

      ${theme.query.minDesktop} {
        grid-template-columns: 1fr 1fr 1fr;
        gap: 2em;
      }
    `,
    item: {
      container: css`
        padding: 1em 0;
      `,
      title: css`
        margin-bottom: .5em;
        font-size: .9em;
        color: var(--muted-color);
      `,
      value: css`
        font-weight: bold;
        font-size: 2em;
      `
    }
  },
  lastUpdate: css`
    position: absolute;
    top: 0;
    right: 0;
    margin: 2em;
    color: var(--muted-color);
    font-weight: bold;
  `,
  miniChart: css`
    max-height: 3em;
    margin-top: 0.25em;
  `
}


export function NetworkStats(props) {
  const { blocks, info } = props
  const nodeSocket = useNodeSocket()
  const { t } = useLang()
  const locale = useLocale()

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
    const mined = ((data.circulating_supply || 0) * 100 / (maxSupply || 1))

    return [
      { title: t(`Max Supply`), render: () => formatXelis(maxSupply, { withSuffix: false, locale }) },
      { title: t(`Circulating Supply`), render: () => formatXelis(data.circulating_supply, { withSuffix: false, locale }) },
      { title: t(`Mined`), render: () => `${mined.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%` },

      { title: t(`Topo Height`), render: () => (data.topoheight || 0).toLocaleString(locale) },
      { title: t(`Block Reward`), render: () => formatXelis(data.block_reward, { withSuffix: false, locale }) },
      { title: t(`Mempool`), render: () => `${(data.mempool_size || 0).toLocaleString(locale)} tx` },

      { title: t(`Height`), render: () => (data.height || 0).toLocaleString(locale) },
      { title: t(`Stable Height`), render: () => (data.stableheight || 0).toLocaleString(locale) },
      { title: t(`Peers`), render: () => (p2pStatus.peer_count || 0).toLocaleString(locale) },

      { title: t(`Difficulty`), render: () => formatDifficulty(data.difficulty, { locale })},
      { title: t(`Hashrate`), render: () => formatHashRate(data.difficulty, { blockTime: info.block_time_target, locale }) },
      { title: t(`Avg Block Time`), render: () => prettyMs((data.average_block_time || 0), { compact: true }) },
    ]
  }, [info, blocks, currentTheme, t, p2pStatus])

  return <div>
    <div className={style.title}>{t('Network Stats')}</div>
    <div className={style.networkStats.container}>
      <div className={style.lastUpdate} title={t(`Last update since`)}>
        <Age ssrKey="network-update" timestamp={lastUpdate} update />
      </div>
      <div className={style.networkStats.items}>
        {stats.map((item) => {
          let value = null
          if (typeof item.render === 'function') value = item.render()
          return <div key={item.title} className={style.networkStats.item.container}>
            <div className={style.networkStats.item.title}>{item.title}</div>
            <div className={style.networkStats.item.value}>{info ? value : '--'}</div>
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