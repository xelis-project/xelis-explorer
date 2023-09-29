import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import to from 'await-to-js'
import { useCallback, useEffect, useState } from 'react'
import { css } from 'goober'
import { useNodeSocket, useNodeSocketSubscribe } from '@xelis/sdk/react/context'

import TableBody, { style as tableStyle } from '../../components/tableBody'
import { formatXelis, reduceText } from '../../utils'
import Age from '../../components/age'

const style = {
  container: css`
    h1, h2 {
      margin: 1.5em 0 .5em 0;
      font-weight: bold;
      font-size: 2em;
    }
  `
}

function MemPool() {
  const [memPool, setMemPool] = useState([])
  const [loading, setLoading] = useState()
  const [err, setErr] = useState()
  const nodeSocket = useNodeSocket()

  const loadMemPool = useCallback(async () => {
    if (!nodeSocket.connected) return

    setErr(null)
    setLoading(true)

    const resErr = (err) => {
      setLoading(false)
      setErr(err)
    }

    const [err, data] = await to(nodeSocket.daemon.getMemPool())
    if (err) return resErr(err)
    setMemPool(data)
    setLoading(false)
  }, [nodeSocket])

  useEffect(() => {
    loadMemPool()
  }, [loadMemPool])

  useNodeSocketSubscribe({
    event: `TransactionAddedInMempool`,
    onData: (_, data) => {
      data.timestamp = new Date().getTime()
      setMemPool((pool) => [data, ...pool])
    }
  }, [])

  return <div className={style.container}>
    <Helmet>
      <title>Mempool</title>
    </Helmet>
    <h1>Mempool</h1>
    <div className={tableStyle}>
      <table>
        <thead>
          <tr>
            <th>Hash</th>
            <th>Transfers</th>
            <th>Signer</th>
            <th>Fees</th>
            <th>Age</th>
          </tr>
        </thead>
        <TableBody list={memPool} loading={loading} err={err} colSpan={5} emptyText="No transactions"
          onItem={(item) => {
            const transfers = item.data.transfers || []
            return <tr key={item.hash}>
              <td title={item.hash}>
                <Link to={`/txs/${item.hash}`}>{reduceText(item.hash)}</Link>
              </td>
              <td>{transfers.length}</td>
              <td>{reduceText(item.owner, 0, 7)}</td>
              <td>{formatXelis(item.fee)}</td>
              <td>
                {item.timestamp
                  ? <Age timestamp={item.timestamp} update format={{ secondsDecimalDigits: 0 }} />
                  : `?`}
              </td>
            </tr>
          }}
        />
      </table>
    </div>
    <TxExecuted setMemPool={setMemPool} />
  </div>
}

function TxExecuted(props) {
  const { setMemPool } = props

  const [loading, setLoading] = useState()
  const [err, setErr] = useState()
  const [executedTxs, setExecutedTxs] = useState([])
  const nodeSocket = useNodeSocket()
  const [topoheight, setTopoheight] = useState()

  const loadExecutedTxs = useCallback(async () => {
    if (!nodeSocket.connected) return

    setLoading(true)
    setErr(null)

    const resErr = (err) => {
      setLoading(false)
      setErr(err)
    }

    const [err1, topoheight] = await to(nodeSocket.daemon.getTopoHeight())
    if (err1) return resErr(err1)
    setTopoheight(topoheight)

    const [err2, blocks] = await to(nodeSocket.daemon.getBlocksRangeByTopoheight({
      start_topoheight: topoheight - 19,
      end_topoheight: topoheight
    }))
    if (err2) return resErr(err2)

    blocks.reverse()
    const txBlockMap = new Map()
    blocks.forEach(block => {
      block.txs_hashes.forEach(txId => {
        txBlockMap.set(txId, block)
      })
    })

    const recentExecuted = []
    for (let i = 0; i < txBlockMap.size; i += 20) {
      const txIds = Array.from(txBlockMap.keys())
      const [err3, txs] = await to(nodeSocket.daemon.getTransactions(txIds.slice(i, 20)))
      if (err3) return resErr(err3)

      txs.forEach((tx) => {
        const block = txBlockMap.get(tx.hash)
        recentExecuted.push({ tx, block })
      })
    }

    setLoading(false)
    setExecutedTxs(recentExecuted)
  }, [nodeSocket])

  useNodeSocketSubscribe({
    event: `TransactionExecuted`,
    onData: (_, data) => {
      // remove from mempool and add tx to data
      setMemPool((pool) => {
        let filteredPool = []
        pool.forEach(async tx => {
          if (tx.hash === data.tx_hash) {
            const [err, block] = await to(nodeSocket.daemon.getBlockAtTopoHeight(data.topoheight))
            if (err) return setErr(err)

            setExecutedTxs((executedTxs) => [{ tx, block }, ...executedTxs])
          } else {
            filteredPool.push(tx)
          }
        })

        return filteredPool
      })
    }
  }, [])

  useNodeSocketSubscribe({
    event: `NewBlock`,
    onData: async () => {
      // remove txs with blocks lower than the first tx block
      const [err, topoheight] = await to(nodeSocket.daemon.getTopoHeight())
      if (err) return setErr(err)

      setTopoheight(topoheight)
      setExecutedTxs((items) => items.filter((item) => {
        return item.block.topoheight > topoheight - 20
      }))
    }
  }, [])

  useEffect(() => {
    loadExecutedTxs()
  }, [loadExecutedTxs])

  return <div>
    <h2>Executed Transactions</h2>
    <div className={tableStyle}>
      <table>
        <thead>
          <tr>
            <th>Topo Height</th>
            <th>Hash</th>
            <th>Transfers</th>
            <th>Signer</th>
            <th>Fees</th>
            <th>Age</th>
          </tr>
        </thead>
        <TableBody list={executedTxs} loading={loading} err={err} colSpan={6}
          emptyText="No tx executed from last 20 blocks."
          onItem={(item) => {
            const { tx, block } = item
            const transfers = tx.data.transfers || []
            return <tr key={tx.hash}>
              <td>
                <Link to={`/blocks/${block.topoheight}`}>{block.topoheight}</Link>
                &nbsp;<span title="Number of blocks from topo height">({topoheight - block.topoheight})</span>
              </td>
              <td>
                <Link to={`/txs/${tx.hash}`}>{reduceText(tx.hash)}</Link>
              </td>
              <td>{transfers.length}</td>
              <td>{reduceText(tx.owner)}</td>
              <td>{formatXelis(tx.fee)}</td>
              <td>
                <Age timestamp={block.timestamp} update format={{ secondsDecimalDigits: 0 }} />
              </td>
            </tr>
          }}
        />
      </table>
    </div>
  </div>
}

export default MemPool