import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet'
import { useCallback, useEffect, useState } from 'react'
import TableBody from '../../components/tableBody'
import useNodeSocket from '../../context/useNodeSocket'
import useNodeRPC from '../../hooks/useNodeRPC'
import to from 'await-to-js'
import { formatXelis, reduceText } from '../../utils'

function TxPool() {
  const [memPool, setMemPool] = useState([])
  const [executed, setExecuted] = useState([])
  const nodeSocket = useNodeSocket()
  const nodeRPC = useNodeRPC()

  const loadMemPool = useCallback(async () => {
    const [err, data] = await to(nodeRPC.getMemPool())
    if (err) return console.log(err)
    setMemPool(data)
  }, [])

  const loadTransactions = useCallback(async () => {
    const [err1, topoheight] = await to(nodeRPC.getTopoHeight())
    if (err1) return console.log(err1)

    const [err2, blocks] = await to(nodeRPC.getBlocks(topoheight - 19, topoheight))
    if (err2) return console.log(err2)

    blocks.reverse()

    let txs_hashes = []
    blocks.forEach(block => {
      txs_hashes = [...block.txs_hashes, ...txs_hashes]
    })

    txs_hashes = txs_hashes.slice(0, 20)
    console.log(txs_hashes)
  }, [])

  useEffect(() => {
    if (!nodeSocket.connected) return

    const unsubscribe = nodeSocket.onTransactionAddedInMempool((data) => {
      console.log(data)
      setMemPool((pool) => [data, ...pool])
    })

    return () => {
      unsubscribe()
    }
  }, [nodeSocket.connected])

  useEffect(() => {
    if (!nodeSocket.connected) return

    const unsubscribe = nodeSocket.onTransactionExecuted((data) => {
      console.log(data)
      setExecuted((executed) => [data, ...executed])
    })

    return () => {
      unsubscribe()
    }
  }, [nodeSocket.connected])

  useEffect(() => {
    loadMemPool()
    //loadTransactions()
  }, [loadMemPool, loadTransactions])

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
          </tr>
        </thead>
        <TableBody list={memPool} colSpan={5} emptyText="No transactions"
          onItem={(item) => {
            return <tr key={item.hash}>
              <td>
                <Link to={`/txs/${item.hash}`}>{item.hash}</Link>
              </td>
              <td>{item.data.Transfer.length}</td>
              <td>{reduceText(item.owner)}</td>
              <td>{formatXelis(item.fee)}</td>
            </tr>
          }}
        />
      </table>
    </div>
    <h2>Executed</h2>
    <div className="table-responsive">
      <table>
        <thead>
          <tr>
            <th>Hash</th>
            <th>Transfers</th>
            <th>Signer</th>
            <th>Fees</th>
          </tr>
        </thead>
        <TableBody colSpan={5}
          onItem={(item) => {
            return <tr key={item.hash}>
              <td>
                <Link to={`/txs/${item.hash}`}>{item.hash}</Link>
              </td>
              <td>{item.data.Transfer.length}</td>
              <td>{reduceText(item.owner)}</td>
              <td>{formatXelis(item.fee)}</td>
            </tr>
          }}
        />
      </table>
    </div>
  </div>
}

export default TxPool