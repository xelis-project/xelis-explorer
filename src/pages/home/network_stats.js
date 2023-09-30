import to from 'await-to-js'
import prettyMs from 'pretty-ms'
import { css } from 'goober'
import { useCallback, useMemo, useState } from 'react'
import { useNodeSocket, useNodeSocketSubscribe } from '@xelis/sdk/react/context'

import { formatHashRate, formatXelis } from '../../utils'
import theme from '../../style/theme'
import Icon from '../../components/icon'
import { scaleOnHover } from '../../style/animate'

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
        padding: .5em 0;
  
        :nth-child(1) {
          margin-bottom: .5em;
          font-size: .8em;
          color: var(--muted-color);
        }
  
        :nth-child(2) {
          font-weight: bold;
          font-size: 2em;
        }
      }
    }
  `,
}

export function NetworkStats() {
  const nodeSocket = useNodeSocket()

  const [info, setInfo] = useState()
  const [err, setErr] = useState()
  const [loading, setLoading] = useState()

  const loadInfo = useCallback(async () => {
    setLoading(true)
    const [err, info] = await to(nodeSocket.daemon.getInfo())
    if (err) return setErr(err)
    setInfo(info)
    setLoading(false)
  }, [nodeSocket])

  useNodeSocketSubscribe({
    event: `NewBlock`,
    onConnected: loadInfo,
    onData: loadInfo
  }, [])

  const stats = useMemo(() => {
    const data = info || {}

    const maxSupply = 1840000000000
    const mined = (data.native_supply * 100 / maxSupply).toFixed(2)
    return [
      { title: `Max Supply`, value: formatXelis(maxSupply, { withSuffix: false }) },
      { title: `Circulating Supply`, value: formatXelis(data.native_supply, { withSuffix: false }) },
      { title: `Mined`, value: `${mined}%` },
      { title: `Hashrate`, value: formatHashRate(data.difficulty / 15) },
      { title: `Block Reward`, value: formatXelis(data.block_reward, { withSuffix: false }) },
      { title: `Tx Pool`, value: `${data.mempool_size} tx` },
      { title: `Block Count`, value: (data.topoheight || 0).toLocaleString() },
      { title: `Difficulty`, value: (data.difficulty || 0).toLocaleString() },
      { title: `Avg Block Time`, value: prettyMs((data.average_block_time || 0), { compact: true }) },
    ]
  }, [info])

  return <div className={style.container}>
    <div className="title">Network Stats</div>
    <div className="items">
      {stats.map((item) => {
        return <div key={item.title}>
          <div>{item.title}</div>
          <div>{info ? item.value : '--'}</div>
        </div>
      })}
    </div>
    <a href="https://stats.xelis.io" target="_blank">
      Go to stats.xelis.io
      <Icon name="arrow-right" />
    </a>
  </div>
}