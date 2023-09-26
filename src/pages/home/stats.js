import to from 'await-to-js'
import prettyMs from 'pretty-ms'
import { css } from 'goober'
import { useCallback, useMemo, useState } from 'react'

import useNodeSocket, { useNodeSocketSubscribe } from '../../context/useNodeSocket'
import { formatHashRate, formatXelis } from '../../utils'
import theme from '../../theme'
import Icon from '../../components/icon'

const style = {
  container: css`
    margin-bottom: 3em;

    ${theme.query.desktop} {
      padding: 4em;
      background-color: ${theme.apply({ xelis: 'rgb(14 30 32 / 70%)', light: '#e7e7e7', dark: '#0c0c0c'})};

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
    }
  `,
  title: css`
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
  `,
  items: css`
    display: grid;
    grid-template-columns: 1fr;
    gap: 1em;

    ${theme.query.tablet} {
      grid-template-columns: 1fr 1fr;
    }

    ${theme.query.desktop} {
      grid-template-columns: 1fr 1fr 1fr;
    }

    .item {
      padding: .5em 0;

      .title {
        margin-bottom: .5em;
        font-size: .8em;
        color: var(--muted-color);
      }

      .value {
        font-weight: bold;
        font-size: 1.6em;
      }
    }
  `
}

export function Stats() {
  const nodeSocket = useNodeSocket()

  const [info, setInfo] = useState()
  const [err, setErr] = useState()
  const [loading, setLoading] = useState(true)

  const loadInfo = useCallback(async () => {
    setLoading(true)
    const [err, info] = await to(nodeSocket.sendMethod(`get_info`))
    if (err) return setErr(err)
    setInfo(info)
    setLoading(false)
  }, [nodeSocket])

  useNodeSocketSubscribe({
    event: `NewBlock`,
    onLoad: loadInfo,
    onData: loadInfo
  }, [])

  const stats = useMemo(() => {
    const data = info || {}

    const maxSupply = 1840000000000
    const mined = (data.native_supply * 100 / maxSupply).toFixed(2)
    return [
      { title: `Max Supply`, value: formatXelis(maxSupply, false) },
      { title: `Circulating Supply`, value: formatXelis(data.native_supply, false) },
      { title: `Mined`, value: `${mined}%` },
      { title: `Hashrate`, value: formatHashRate(data.difficulty / 15) },
      { title: `Block Reward`, value: formatXelis(data.block_reward, false) },
      { title: `Tx Pool`, value: `${data.mempool_size} tx` },
      { title: `Block Count`, value: (data.topoheight || 0).toLocaleString() },
      { title: `Difficulty`, value: (data.difficulty || 0).toLocaleString() },
      { title: `Avg Block Time`, value: prettyMs((data.average_block_time || 0), { compact: true }) },
    ]
  }, [info])

  return <div className={style.container}>
    <div className={style.title}>Statistics</div>
    <div className={style.items}>
      {stats.map((item) => {
        return <div key={item.title} className="item">
          <div className="title">{item.title}</div>
          <div className="value">{info ? item.value : '--'}</div>
        </div>
      })}
    </div>
    <a href="https://stats.xelis.io" target="_blank">
      Go to stats.xelis.io
      <Icon name="arrow-right" />
    </a>
  </div>
}