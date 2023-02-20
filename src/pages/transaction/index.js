import { useCallback, useEffect, useState } from 'react'
import useNodeRPC from '../../hooks/useNodeRPC'
import { useParams } from 'react-router'
import { Helmet } from 'react-helmet'
import NotFound from '../notFound'
import to from 'await-to-js'
import TableBody from '../../components/tableBody'
import { reduceText, formatXelis, formatAsset, formatAssetName } from '../../utils'

function Transaction() {
  const { hash } = useParams()

  const nodeRPC = useNodeRPC()

  const [err, setErr] = useState()
  const [loading, setLoading] = useState(true)
  const [tx, setTx] = useState()

  const load = useCallback(async () => {
    const resErr = (err) => {
      setErr(err)
      setLoading(false)
    }

    setLoading(true)
    const [err, data] = await to(nodeRPC.getTransaction(hash))
    if (err) return resErr(err)

    setTx(data)
    setLoading(false)
  }, [hash])

  useEffect(() => {
    load()
  }, [load])

  if (loading) return null
  if (!loading && !tx) return <NotFound />

  const transfers = tx.data.Transfer

  return <div>
    <Helmet>
      <title>Transaction {hash}</title>
    </Helmet>
    <h1>Transaction</h1>
    <div>
      <div className="table-responsive">
        <table>
          <tbody>
            <tr>
              <th>Hash</th>
              <td>{hash}</td>
            </tr>
            <tr>
              <th>Signer</th>
              <td>{tx.owner}</td>
            </tr>
            <tr>
              <th>Signature</th>
              <td>{tx.signature}</td>
            </tr>
            <tr>
              <th>Fees</th>
              <td>{formatXelis(tx.fee)}</td>
            </tr>
            <tr>
              <th>Nonce</th>
              <td>{tx.nonce}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <h2>Transfers</h2>
      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Asset</th>
              <th>Amount</th>
              <th>Recipient</th>
            </tr>
          </thead>
          <TableBody list={transfers} emptyText="No transfers" 
            onItem={(item, index) => {
              return <tr key={index}>
                <td>{formatAssetName(item.asset)}</td>
                <td>{formatAsset(item.amount, item.asset)}</td>
                <td>{reduceText(item.to)}</td>
              </tr>
            }}
          />
        </table>
      </div>
      <h2>Extra Data</h2>
      {JSON.stringify(tx.extra_data, null, 2)}
    </div>
  </div>
}

export default Transaction
