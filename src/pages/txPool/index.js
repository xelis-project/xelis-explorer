import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet'
import { useCallback, useEffect, useState } from 'react'
import TableBody from '../../components/tableBody'
import useNodeSocket from '../../context/useNodeSocket'
import useNodeRPC from '../../hooks/useNodeRPC'
import to from 'await-to-js'

function TxPool() {
  const txs = [{
    height: 344,
    size: `5 KB`,
    signer: `?`,
    age: `10m`,
    fee: `0.5`,
    hash: `2ae2bf36d5ee1b62608582df131f4ed8808aaf223d60e0ce5a9522f961a6db6f`
  }]

  const [memPool, setMemPool] = useState([])
  const [executed, setExecuted] = useState([])
  const nodeSocket = useNodeSocket()
  const nodeRPC = useNodeRPC()

  const loadMemPool = useCallback(async () => {
    const [err, data] = await to(nodeRPC.getMemPool())
    if (err) return console.log(err)
    console.log(data)
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
            <th>Height Built</th>
            <th>Hash</th>
            <th>Signer</th>
            <th>Age</th>
            <th>Fees</th>
            <th>Size</th>
          </tr>
        </thead>
        <tbody>
          {txs.map((item) => {
            return <tr key={item.hash}>
              <td>{item.height}</td>
              <td><Link to={`/txs/${item.hash}`}>{item.hash}</Link></td>
              <td>{item.signer}</td>
              <td>{item.age}</td>
              <td>{item.fee}</td>
              <td>{item.size}</td>
            </tr>
          })}
        </tbody>
      </table>
    </div>
    <h2>Executed</h2>
    <div className="table-responsive">
      <table>
        <thead>
          <tr>
            <th>Block Height</th>
            <th>Hash</th>
            <th>Age</th>
            <th>Fees</th>
            <th>Size</th>
          </tr>
        </thead>
        <TableBody colSpan={5}
          onItem={(item) => {
            return <tr key={item.hash}>
              <td>{item.height}</td>
              <td><Link to={`/txs/${item.hash}`}>{item.hash}</Link></td>
              <td>{item.age}</td>
              <td>{item.fee}</td>
              <td>{item.size}</td>
            </tr>
          }}
        />
      </table>
    </div>
  </div>
}

export default TxPool