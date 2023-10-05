import { Helmet } from 'react-helmet-async'
import { useParams } from 'react-router'
import useNodeSocket from '@xelis/sdk/react/context'
import { useState, useCallback, useEffect } from 'react'
import to from 'await-to-js'
import { css } from 'goober'
import { Link } from 'react-router-dom'

import TableFlex from '../../components/tableFlex'
import { XELIS_ASSET, formatXelis, reduceText } from '../../utils'
import Age from '../../components/age'
import { useServerData } from '../../context/useServerData'
import { daemonRPC } from '../../ssr/nodeRPC'

const style = {
  container: css`
    h1 {
      margin: 1.5em 0 .5em 0;
      font-weight: bold;
      font-size: 2em;
    }

    h2 {
      margin: 1em 0 .5em 0;
      font-weight: bold;
      font-size: 1.5em;
    }
  `
}

function loadAccount_SSR({ addr }) {
  const defaultResult = { loaded: false, err: null, account: {} }
  return useServerData(`func:loadAccount`, async () => {
    const result = Object.assign({}, defaultResult)
    const [err, res] = await to(daemonRPC.getLastBalance({
      address: addr,
      asset: XELIS_ASSET,
    }))
    result.err = err
    if (err) return result

    result.account = res.result
    result.loaded = true
    return result
  }, defaultResult)
}

function Account() {
  const { addr } = useParams()

  const nodeSocket = useNodeSocket()

  const serverResult = loadAccount_SSR({ addr })

  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState()
  const [account, setAccount] = useState(serverResult.account)

  const loadAccount = useCallback(async () => {
    if (!nodeSocket.connected) return

    setErr(null)
    setLoading(true)

    const resErr = (err) => {
      setErr(err)
      setLoading(false)
    }

    const [err, result] = await to(nodeSocket.daemon.getLastBalance({
      address: addr,
      asset: XELIS_ASSET,
    }))
    if (err) return resErr(err)

    setAccount(result)
    setLoading(false)
  }, [addr, nodeSocket])

  useEffect(() => {
    if (serverResult.loaded) return
    loadAccount()
  }, [loadAccount])

  return <div className={style.container}>
    <Helmet>
      <title>Account {addr || ''}</title>
    </Helmet>
    <h1>Account {reduceText(addr)}</h1>
    <TableFlex err={err} headers={[
      {
        key: "address",
        title: "Address",
        render: () => {
          return addr
        }
      },
      {
        key: "balance",
        title: "Balance",
        render: (_, item) => {
          const { balance } = item.balance || {}
          return balance && formatXelis(balance)
        }
      }
    ]} data={[account]} />
    <History addr={addr} account={account} />
  </div>
}

export default Account

function History(props) {
  const { addr, account } = props

  const nodeSocket = useNodeSocket()

  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState()
  const [history, setHistory] = useState([])

  const loadHistory = useCallback(async () => {
    if (!account.balance) return

    setLoading(true)
    setErr(null)
    const resErr = (err) => {
      setErr(err)
      setLoading(false)
    }

    const max = 5
    let topoheight = account.balance.previous_topoheight
    if (!topoheight) return resErr(null)

    const [err, block] = await to(nodeSocket.daemon.getBlockAtTopoHeight(account.topoheight))
    if (err) return resErr(err)

    const history = [{ balance: account.balance.balance, topoheight: account.topoheight, block }]
    for (let i = 0; i < max; i++) {
      const [err, result] = await to(nodeSocket.daemon.getBalanceAtTopoHeight({
        address: addr,
        asset: XELIS_ASSET,
        topoheight: topoheight
      }))
      if (err) return resErr(err)

      const [err2, block] = await to(nodeSocket.daemon.getBlockAtTopoHeight(topoheight))
      if (err2) return resErr(err2)

      topoheight = result.previous_topoheight
      history.push({ balance: result.balance, topoheight, block })
    }

    setHistory(history)
    setLoading(false)
  }, [addr, account])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  return <div>
    <h2>History</h2>
    <TableFlex loading={loading} err={err} rowKey="topoheight"
      emptyText="No history"
      headers={[
        {
          key: "topoheight",
          title: "Topo Height",
          render: (value) => {
            return <Link to={`/blocks/${value}`}>{value}</Link>
          }
        },
        {
          key: "hash",
          title: "Hash",
          render: (_, item) => {
            const { block } = item
            return <Link to={`/blocks/${block.hash}`}>
              {reduceText(block.hash)}
            </Link>
          }
        },
        {
          key: "balance",
          title: "Balance",
          render: (value, _, index) => {
            let previousBalance = null
            if (history[index + 1]) {
              previousBalance = history[index + 1].balance
            }

            let diff = ``
            if (previousBalance) {
              if (value > previousBalance) {
                diff = `+${formatXelis(value - previousBalance, { withSuffix: false })}`
              }

              if (value < previousBalance) {
                diff = `-${formatXelis(previousBalance - value, { withSuffix: false })}`
              }
            }

            return `${formatXelis(value)} ${diff} `
          }
        },
        {
          key: "miner",
          title: "Miner",
          render: (_, item) => {
            const { block } = item
            return block.miner === addr ? `Yes` : `No`
          }
        },
        {
          key: "timestamp",
          title: "Age",
          render: (_, item) => {
            const { block } = item
            return <Age timestamp={block.timestamp} />
          }
        }
      ]} data={history} />
  </div>
}