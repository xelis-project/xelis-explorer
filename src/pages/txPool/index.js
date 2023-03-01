import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet'
import { useCallback, useEffect, useState } from 'react'
import TableBody from '../../components/tableBody'
import useNodeSocket, { useNodeSocketSubscribe } from '../../context/useNodeSocket'
import useNodeRPC from '../../hooks/useNodeRPC'
import to from 'await-to-js'
import { formatXelis, reduceText } from '../../utils'
import Age from '../../components/age'

function TxPool() {
  const [memPool, setMemPool] = useState([])
  const nodeRPC = useNodeRPC()
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState()

  const loadMemPool = useCallback(async () => {
    setErr(null)
    setLoading(true)

    const resErr = (err) => {
      setLoading(false)
      setErr(err)
    }

    const [err, data] = await to(nodeRPC.getMemPool())
    if (err) return resErr(err)
    setMemPool(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadMemPool()
  }, [loadMemPool])

  useNodeSocketSubscribe({
    event: `TransactionAddedInMempool`,
    onData: (data) => {
      data.timestamp = new Date().getTime()
      setMemPool((pool) => [data, ...pool])
    }
  })

  return <div>
    <Helmet>
      <title>Transaction Pool</title>
    </Helmet>
    <h1>Transaction Pool</h1>
    <div className="table-responsive">
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
            return <tr key={item.hash}>
              <td>{item.hash}</td> {/* Don't need <Link /> here because tx still does not exists and it will redirect to not found */}
              <td>{item.data.Transfer.length}</td>
              <td>{reduceText(item.owner)}</td>
              <td>{formatXelis(item.fee)}</td>
              <td>
                {item.timestamp ? <Age timestamp={item.timestamp} update format={{ secondsDecimalDigits: 0 }} /> : `?`}
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

  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState()
  const [executedTxs, setExecutedTxs] = useState([])
  const nodeSocket = useNodeSocket()
  const nodeRPC = useNodeRPC()
  const [topoheight, setTopoheight] = useState()

  const loadExecutedTxs = useCallback(async () => {
    setLoading(true)
    setErr(null)

    const resErr = (err) => {
      setLoading(false)
      setErr(err)
    }

    const [err1, topoheight] = await to(nodeRPC.getTopoHeight())
    if (err1) return resErr(err1)
    setTopoheight(topoheight)

    const [err2, blocks] = await to(nodeRPC.getBlocks(topoheight - 19, topoheight))
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
      const [err3, txs] = await to(nodeRPC.getTransactions(txIds.slice(i, 20)))
      if (err3) return resErr(err3)

      txs.forEach((tx) => {
        const block = txBlockMap.get(tx.hash)
        recentExecuted.push({ tx, block })
      })
    }

    setLoading(false)
    setExecutedTxs(recentExecuted)
  }, [])

  useNodeSocketSubscribe({
    event: `TransactionExecuted`,
    onData: (data) => {
      // remove from mempool and add tx to data
      setMemPool((pool) => {
        let filteredPool = []
        pool.forEach(async tx => {
          if (tx.hash === data.tx_hash) {
            const [err, block] = await to(nodeRPC.getBlockAtTopoHeight(data.topoheight))
            if (err) return console.log(err)

            setExecutedTxs((executedTxs) => [{ tx, block }, ...executedTxs])
          } else {
            filteredPool.push(tx)
          }
        })

        return filteredPool
      })
    }
  })

  useNodeSocketSubscribe({
    event: `NewBlock`,
    onData: async () => {
      // remove txs with blocks lower than the first tx block
      const [err, topoheight] = await to(nodeRPC.getTopoHeight())
      if (err) return console.log(err)

      setTopoheight(topoheight)
      setExecutedTxs((items) => items.filter((item) => {
        return item.block.topoheight > topoheight - 20
      }))
    }
  })

  useEffect(() => {
    loadExecutedTxs()
  }, [loadExecutedTxs])

  return <div>
    <h2>Executed Transactions</h2>
    <div>Last 20 blocks</div>
    <div className="table-responsive">
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
            return <tr key={tx.hash}>
              <td>
                <Link to={`/blocks/${block.topoheight}`}>{block.topoheight}</Link>
                &nbsp;<span title="Number of blocks from topo height">({topoheight - block.topoheight})</span>
              </td>
              <td>
                <Link to={`/txs/${tx.hash}`}>{tx.hash}</Link>
              </td>
              <td>{tx.data.Transfer.length}</td>
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

export default TxPool