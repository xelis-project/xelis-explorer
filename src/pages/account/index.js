import { Helmet } from 'react-helmet-async'
import { useParams } from 'react-router'
import useNodeSocket from '@xelis/sdk/react/daemon'
import { useState, useCallback, useEffect, useRef } from 'react'
import to from 'await-to-js'
import { css } from 'goober'
import { Link } from 'react-router-dom'

import TableFlex from '../../components/tableFlex'
import { XELIS_ASSET, formatAsset, formatXelis, reduceText } from '../../utils'
import Age from '../../components/age'
import { useServerData } from '../../context/useServerData'
import { daemonRPC } from '../../ssr/nodeRPC'
import { usePageLoad } from '../../context/usePageLoad'
import Icon from '../../components/icon'
import theme from '../../style/theme'
import Button from '../../components/button'

const style = {
  container: css`
    h1 {
      margin: 1.5em 0 .5em 0;
      font-weight: bold;
      font-size: 2em;
    }

    h2 {
      margin: 0 0 .5em 0;
      font-weight: bold;
      font-size: 1.5em;
    }

    .page {
      display: flex;
      gap: 1em;
      flex-direction: column;

      ${theme.query.minDesktop} {
        flex-direction: row;
      }

      > :nth-child(1) {
        flex: 1;
        background-color: var(--table-td-bg-color);
        padding: 1em;
        border-top: 3px solid var(--table-th-bg-color);
        display: flex;
        gap: 1em;
        flex-direction: column;
        min-width: 200px;

        > div {
          display: flex;
          gap: .5em;
          flex-direction: column;

          > :nth-child(1) {
            color: var(--muted-color);
            font-size: 1em;
          }

          > :nth-child(2) {
            font-size: 1.4em;
          }
        }
      }

      > :nth-child(2) {
        overflow: auto;
        flex: 3;
      }

      .pager {
        display: flex;
        gap: .5em;
        margin-top: .5em;

        > button {
          display: flex;
          gap: .5em;
          align-items: center;
          border-radius: 25px;
          border: none;
          background-color: var(--text-color);
          cursor: pointer;
          padding: 0.5em 1em;
          font-weight: bold;
        }
      }
    }
  `
}

function loadAccount_SSR({ addr }) {
  const defaultResult = { loaded: false, err: null, account: {} }
  return useServerData(`func:loadAccount(${addr})`, async () => {
    const result = Object.assign({}, defaultResult)
    const [err, res] = await to(daemonRPC.getLastBalance({
      address: addr,
      asset: XELIS_ASSET,
    }))
    result.err = err
    if (err) return result

    const [err2, res2] = await to(daemonRPC.getNonce(addr))
    result.err = err2
    if (err2) return result2

    result.account = { addr, balance: res.result, nonce: res2.result }
    result.loaded = true
    return result
  }, defaultResult)
}

function Account() {
  const { addr } = useParams()

  const nodeSocket = useNodeSocket()

  const { firstPageLoad } = usePageLoad()
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

    const [err2, result2] = await to(nodeSocket.daemon.getNonce(addr))
    if (err2) return resErr(err2)

    setAccount({ addr, balance: result, nonce: result2 })
    setLoading(false)
  }, [addr, nodeSocket])

  useEffect(() => {
    if (firstPageLoad && serverResult.loaded) return
    loadAccount()
  }, [loadAccount])

  const balance = account.balance ? account.balance.balance.balance : 0
  const nonce = account.nonce ? account.nonce.nonce : `--`

  return <div className={style.container}>
    <Helmet>
      <title>Account {addr || ''}</title>
    </Helmet>
    <h1>Account {reduceText(addr)}</h1>
    <div className="page">
      <div>
        <div>
          <div>Address</div>
          <div style={{ wordBreak: `break-all` }}>{addr}</div>
        </div>
        <div>
          <div>Balance</div>
          <div>{formatXelis(balance)}</div>
        </div>
        <div>
          <div>Nonce</div>
          <div>{nonce}</div>
        </div>
      </div>
      <div>
        <History account={account} />
      </div>
    </div>
  </div>
}

export default Account

function History(props) {
  const { account } = props

  const nodeSocket = useNodeSocket()

  const topoheightRef = useRef()
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState()
  const [history, setHistory] = useState({})

  const [page, setPage] = useState(1)
  const pageSize = 10

  const loadData = useCallback(async () => {
    if (!nodeSocket.connected) return
    if (!account.balance) return
    if (history[page]) return

    setLoading(true)
    setErr(null)
    const resErr = (err) => {
      setErr(err)
      setLoading(false)
    }

    const list = []

    if (!topoheightRef.current) {
      topoheightRef.current = account.balance.topoheight
    }

    let topoheight = topoheightRef.current
    const addr = account.addr

    for (let i = 0; i < pageSize; i++) {
      if (!topoheight) break

      const [err, result] = await to(nodeSocket.daemon.getBalanceAtTopoHeight({
        address: addr,
        asset: XELIS_ASSET,
        topoheight: topoheight
      }))
      if (err) return resErr(err)

      const [err2, block] = await to(nodeSocket.daemon.getBlockAtTopoHeight({
        topoheight: topoheight,
        include_txs: true
      }))
      if (err2) return resErr(err2)

      topoheight = result.previous_topoheight

      if (block.miner === addr) {
        list.push({
          hash: block.hash,
          topoheight: block.topoheight,
          type: 'MINING',
          amount: block.reward,
          asset: XELIS_ASSET,
          timestamp: block.timestamp
        })
      }

      if (block.txs_hashes.length > 0) {
        const [err3, txs] = await to(nodeSocket.daemon.getTransactions(block.txs_hashes))
        if (err3) return resErr(err3)

        txs.forEach((tx) => {
          const transfers = tx.data.transfers || []

          transfers.forEach((transfer) => {
            if (tx.owner === addr) {
              list.push({
                hash: tx.hash,
                topoheight: block.topoheight,
                type: 'SEND',
                amount: transfer.amount,
                asset: transfer.asset,
                timestamp: block.timestamp
              })
            }

            if (transfer.to === addr) {
              list.push({
                hash: tx.hash,
                topoheight: block.topoheight,
                type: 'RECEIVE',
                amount: transfer.amount,
                asset: transfer.asset,
                from: tx.owner,
                timestamp: block.timestamp
              })
            }
          })
        })
      }
    }

    history[page] = list
    setHistory(Object.assign({}, history))
    setLoading(false)
    topoheightRef.current = topoheight
  }, [history, page, account, nodeSocket])

  useEffect(() => {
    loadData()
  }, [loadData])

  const list = history[page] || history[page - 1] || []

  return <div>
    <TableFlex loading={loading} err={err} rowKey={(item, index) => {
      return `${item.hash}_${index}`
    }}
      emptyText="No history" keepTableDisplay
      headers={[
        {
          key: "topoheight",
          title: "Topo Height",
          render: (value) => {
            return <Link to={`/blocks/${value}`}>
              {value}
            </Link>
          }
        },
        {
          key: "hash",
          title: "Hash",
          render: (value, item) => {
            let link = ``

            if (item.type === "SEND" || item.type === "RECEIVE") {
              link = `/txs/${value}`
            }

            if (item.type === "MINING") {
              link = `/blocks/${value}`
            }

            return <Link to={link}>
              {reduceText(value)}
            </Link>
          }
        },
        {
          key: "type",
          title: "Type",
          render: (value) => {
            switch (value) {
              case "SEND":
                return <><Icon name="arrow-up" />&nbsp;&nbsp;SEND</>
              case "RECEIVE":
                return <><Icon name="arrow-down" />&nbsp;&nbsp;RECEIVE</>
              case "MINING":
                return <><Icon name="microchip" />&nbsp;&nbsp;MINING</>
              default:
                return null
            }
          }
        },
        {
          key: "amount",
          title: "Amount",
          render: (value, item) => {
            return formatAsset(value, item.asset)
          }
        },
        {
          key: "from",
          title: "From",
          render: (_, item) => {
            switch (item.type) {
              case "RECEIVE":
                return <Link to={`/accounts/${item.recipient}`}>
                  {reduceText(item.from)}
                </Link>
              case "MINING":
                return `Coinbase`
              default:
                return `--`
            }
          }
        },
        {
          key: "timestamp",
          title: "Age",
          render: (value) => {
            return <Age timestamp={value} update />
          }
        }
      ]} data={list} />
    <div className="pager">
      <Button icon="arrow-left" onClick={() => {
        if (page <= 1) return
        setPage(page - 1)
      }}>
        Previous
      </Button>
      <Button icon="arrow-right" iconLocation="right"
        onClick={() => {
          if (!topoheightRef.current) return
          setPage(page + 1)
        }}>
        Next
      </Button>
    </div>
  </div>
}