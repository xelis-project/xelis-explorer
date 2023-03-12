import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import Pagination, { getPaginationRange } from '../../components/pagination'
import TableBody from '../../components/tableBody'
import useSupabase from '../../hooks/useSupabase'
import { formatXelis, reduceText } from '../../utils'

function Transactions() {
  const supabase = useSupabase()
  const [loading, setLoading] = useState(false)
  const [txs, setTxs] = useState([])
  const [pageState, setPageState] = useState({ page: 1, size: 20 })
  const [count, setCount] = useState(0)
  const [err, setErr] = useState()

  const load = useCallback(async () => {
    setLoading(true)

    const { start, end } = getPaginationRange(pageState)
    const query = supabase
      .from('transactions')
      .select('*', { count: 'exact' })

    const { error, data, count } = await query.range(start, end)
    setLoading(false)
    if (error) return setErr(err)

    setCount(count)
    setTxs(data)
  }, [supabase, pageState])

  useEffect(() => {
    load()
  }, [load])

  return <div>
    <Pagination state={pageState} setState={setPageState}
      countText="txs" count={count} style={{ marginBottom: `1em` }} />
    <div className="table-responsive">
      <table>
        <thead>
          <tr>
            <th>Hash</th>
            <th>Fee</th>
            <th>Nonce</th>
            <th>Owner</th>
            <th>Signature</th>
          </tr>
        </thead>
        <TableBody list={txs} err={err} loading={loading} colSpan={9} emptyText="No transactions"
          onItem={(item) => {
            return <tr key={item.hash}>
              <td>
                <Link to={`/tx/${item.hash}`}>{reduceText(item.hash)}</Link>
              </td>
              <td>{formatXelis(item.fee)}</td>
              <td>{item.nonce}</td>
              <td>{reduceText(item.owner)}</td>
              <td>{reduceText(item.signature)}</td>
            </tr>
          }}
        />
      </table>
    </div>
    <Pagination state={pageState} setState={setPageState}
      countText="txs" count={count} style={{ marginTop: `.5em` }} />
  </div>
}

export default Transactions