import { Helmet } from 'react-helmet-async'
import { useParams } from 'react-router'
import useNodeSocket from '@xelis/sdk/react/daemon'
import { useState, useCallback, useEffect } from 'react'
import to from 'await-to-js'
import { css } from 'goober'
import { Link } from 'react-router-dom'

import TableFlex from '../../components/tableFlex'
import { XELIS_ASSET, formatAsset, formatAssetName, formatXelis, reduceText } from '../../utils'
import Age from '../../components/age'
import { useServerData } from '../../context/useServerData'
import { daemonRPC } from '../../ssr/nodeRPC'
import { usePageLoad } from '../../context/usePageLoad'
import Icon from '../../components/icon'

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

    .data-info {
      margin-top: 1em;
      color: var(--muted-color);
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

    result.account = res.result
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

    setAccount(result)
    setLoading(false)
  }, [addr, nodeSocket])

  useEffect(() => {
    if (firstPageLoad && serverResult.loaded) return
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
  const [minedBlocks, setMinedBlocks] = useState([])
  const [transactions, setTransactions] = useState([])
  const [transfers, setTransfers] = useState([])

  const max = 5

  const loadData = useCallback(async () => {
    if (!nodeSocket.connected) return
    if (!account.balance) return

    setLoading(true)
    setErr(null)
    const resErr = (err) => {
      setErr(err)
      setLoading(false)
    }

    const minedBlocks = []
    const transactions = []
    const transfers = []
    let topoheight = account.topoheight

    for (let i = 0; i < max; i++) {
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
        minedBlocks.push(block)
      }

      if (block.txs_hashes.length > 0) {
        const [err3, txs] = await to(nodeSocket.daemon.getTransactions(block.txs_hashes))
        if (err3) return resErr(err3)

        txs.forEach((tx) => {
          const txTransfers = tx.data.transfers || []

          if (tx.owner === addr) {
            transactions.push({ tx, block })

            txTransfers.forEach((transfer => {
              transfers.push({ tx, block, transfer, type: 'send' })
            }))
          } else {
            txTransfers.forEach((transfer => {
              if (transfer.to === addr) {
                transfers.push({ tx, block, transfer, type: 'receive' })
              }
            }))
          }
        })
      }
    }

    setMinedBlocks(minedBlocks)
    setTransactions(transactions)
    setTransfers(transfers)
    setLoading(false)
  }, [addr, account, nodeSocket])

  useEffect(() => {
    loadData()
  }, [loadData])

  return <div>
    <div className="data-info">
      The data below is from the last {max} blocks with account balance changes.
    </div>
    <h2>Mined Blocks</h2>
    <TableFlex loading={loading} err={err} rowKey="topoheight"
      emptyText="No mined blocks"
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
          render: (value) => {
            return <Link to={`/blocks/${value}`}>
              {reduceText(value)}
            </Link>
          }
        },
        {
          key: "reward",
          title: "Reward",
          render: (value) => {
            return `${formatXelis(value)}`
          }
        },
        {
          key: "timestamp",
          title: "Age",
          render: (value) => {
            return <Age timestamp={value} />
          }
        }
      ]} data={minedBlocks} />
    <h2>Transactions</h2>
    <TableFlex loading={loading} err={err} rowKey={({ tx }) => tx.hash}
      emptyText="No transactions"
      headers={[
        {
          key: "topoheight",
          title: "Topo Height",
          render: (_, item) => {
            const { block } = item
            return <Link to={`/blocks/${block.topoheight}`}>{block.topoheight}</Link>
          }
        },
        {
          key: "hash",
          title: "Hash",
          render: (_, item) => {
            const { tx } = item
            return <Link to={`/txs/${tx.hash}`}>
              {reduceText(tx.hash)}
            </Link>
          }
        },
        {
          key: "transfer",
          title: "Transfers / Burns",
          render: (_, item) => {
            const { tx } = item

            const transfers = tx.data.transfers || []
            let burns = []
            if (tx.data.burn) burns = [tx.data.burn]

            return `${transfers.length} / ${burns.length}`
          }
        },
        {
          key: "fee",
          title: "Fee",
          render: (_, item) => {
            const { tx } = item
            return formatXelis(tx.fee)
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
      ]} data={transactions} />
    <h2>Transfers</h2>
    <TableFlex loading={loading} err={err} rowKey={({ tx }) => tx.hash}
      emptyText="No transfers"
      headers={[
        {
          key: "type",
          title: "Type",
          render: (value) => {
            switch (value) {
              case "send":
                return <><Icon name="arrow-up" />&nbsp;&nbsp;SEND</>
              case "receive":
                return <><Icon name="arrow-down" />&nbsp;&nbsp;RECEIVE</>
              default:
                return null
            }
          }
        },
        {
          key: "hash",
          title: "Hash",
          render: (_, item) => {
            const { tx } = item
            return <Link to={`/txs/${tx.hash}`}>
              {reduceText(tx.hash)}
            </Link>
          }
        },
        {
          key: "recipient",
          title: "Recipient",
          render: (_, item) => {
            const { transfer } = item
            return <Link to={`/accounts/${transfer.to}`}>
              {reduceText(transfer.to)}
            </Link>
          }
        },
        {
          key: "asset",
          title: "Asset",
          render: (_, item) => {
            const { transfer } = item
            return formatAssetName(transfer.asset)
          }
        },
        {
          key: "amount",
          title: "Amount",
          render: (_, item) => {
            const { transfer } = item
            return formatAsset(transfer.amount, transfer.asset)
          }
        },
      ]} data={transfers} />
  </div>
}