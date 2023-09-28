import React, { useCallback, useEffect, useMemo, useState } from 'react'
import to from 'await-to-js'
import { Link } from 'react-router-dom'
import { css } from 'goober'
import { useNodeSocket } from '@xelis/sdk/react/context'

import { formatAsset, formatXelis, reduceText } from '../../utils'
import TableBody, { style as tableStyle } from '../../components/tableBody'
import Pagination, { getPaginationRange, style as paginationStyle } from '../../components/pagination'

const style = {
  container: css`
    h2 {
      margin: 1em 0 .5em 0;
      font-weight: bold;
      font-size: 1.5em;
    }

    > :nth-child(2) {
      margin-bottom: .5em;
    }
  `
}

function Transactions(props) {
  const { block } = props

  const nodeSocket = useNodeSocket()

  const count = useMemo(() => {
    return (block.txs_hashes || []).length
  }, [block])

  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState()
  const [transactions, setTransactions] = useState([])
  const [pageState, setPageState] = useState({ page: 1, size: 5 })

  const load = useCallback(async () => {
    if (!nodeSocket.connected) return

    setErr(null)
    setLoading(true)

    const resErr = (err) => {
      setLoading(false)
      setErr(err)
    }

    const { start, end } = getPaginationRange(pageState)

    let txHashes = []
    if (block.txs_hashes && block.txs_hashes.length >= end) {
      txHashes = block.txs_hashes.slice(start, end + 1)
    }

    const [err, txs] = await to(nodeSocket.daemon.getTransactions(txHashes))
    if (err) return resErr(err)

    setTransactions(txs)
    setLoading(false)
  }, [block, pageState, nodeSocket])

  useEffect(() => {
    if (block) load()
  }, [block, load])

  return <div className={style.container}>
    <h2>Transactions</h2>
    <div className={tableStyle}>
      <table>
        <thead>
          <tr>
            <th>Hash</th>
            <th>Transfers / Burns</th>
            <th>Signer</th>
            <th>Fees</th>
          </tr>
        </thead>
        <TableBody list={transactions} loading={loading} err={err} emptyText="No transactions" colSpan={4}
          onItem={(item) => {
            const transfers = item.data.transfers || []

            // only one burn per tx for now but I expect multiple burns per tx later
            let burns = []
            if (item.data.burn) burns = [item.data.burn]

            return <React.Fragment key={item.hash}>
              <tr>
                <td><Link to={`/txs/${item.hash}`}>{item.hash}</Link></td>
                <td>{transfers.length} / {burns.length}</td>
                <td>{reduceText(item.owner, 0, 7)}</td>
                <td>{formatXelis(item.fee)}</td>
              </tr>
              <tr>
                <td colSpan={4}>
                  {transfers.map((transfer, index) => {
                    const { amount, asset, to } = transfer
                    return <div key={index}>
                      {index + 1}. Sent {formatAsset(amount, asset)} to {to}
                    </div>
                  })}
                  {burns.map((burn, index) => {
                    const { amount, asset } = burn
                    return <div key={index}>
                      {index + 1}. Burn {formatAsset(amount, asset)}
                    </div>
                  })}
                </td>
              </tr>
            </React.Fragment>
          }}
        />
      </table>
    </div>
    <Pagination className={paginationStyle} state={pageState} setState={setPageState} countText="txs" count={count} />
  </div>
}

export default Transactions
