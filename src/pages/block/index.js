import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router'
import useNodeRPC from '../../hooks/useNodeRPC'
import { formatAsset, formatXelis, reduceText, formatHashRate, formattedBlock } from '../../utils'
import NotFound from '../notFound'
import bytes from 'bytes'
import { Helmet } from 'react-helmet-async'
import to from 'await-to-js'
import PageLoading from '../../components/pageLoading'
import Button from '../../components/button'
import { Link } from 'react-router-dom'
import TableBody from '../../components/tableBody'
import Pagination, { getPaginationRange } from '../../components/pagination'
import DotLoading from '../../components/dotLoading'

function Block() {
  const { id } = useParams()

  const nodeRPC = useNodeRPC()

  const [err, setErr] = useState()
  const [loading, setLoading] = useState(true)
  const [block, setBlock] = useState()
  const [topoheight, setTopoheight] = useState()

  const load = useCallback(async () => {
    setErr(null)
    setLoading(true)

    const resErr = (err) => {
      setErr(err)
      setLoading(false)
    }

    if (/[a-z]/i.test(id)) {
      // by hash
      const [err, blockData] = await to(nodeRPC.getBlockByHash(id))
      if (err) return resErr(err)
      setBlock(blockData)
    } else {
      // by height
      const height = parseInt(id);
      const [err, blockData] = await to(nodeRPC.getBlockAtTopoHeight(height))
      if (err) return resErr(err)
      setBlock(blockData)
    }

    const [err, currentTopoheight] = await to(nodeRPC.getTopoHeight())
    if (err) return resErr(err)
    setTopoheight(currentTopoheight)

    setLoading(false)
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const formatBlock = useMemo(() => {
    if (!block) return {}
    return formattedBlock(block, topoheight || 0)
  }, [block, topoheight])

  if (err) return <div>{err.message}</div>
  if (!block && loading) return <div>Loading<DotLoading /></div>
  if (!loading && !block) return <NotFound />
  if (!block) return null

  return <div>
    <PageLoading loading={loading} />
    <div>
      <Helmet>
        <title>Block {block.topoheight.toString()}</title>
      </Helmet>
      <h1>Block {block.topoheight}</h1>
      <div className="card">
        This block was mined on {formatBlock.date} by {formatBlock.miner}. It currently has {formatBlock.confirmations} confirmations.
        The miner of this block earned {formatBlock.reward}.
      </div>
      <div className="left-right-buttons">
        {formatBlock.hasPreviousBlock && <Button className="button" link={`/block/${block.topoheight - 1}`} icon="chevron-left-r">
          Previous Block ({block.topoheight - 1})
        </Button>}
        {formatBlock.hasNextBlock && <Button className="button" link={`/block/${block.topoheight + 1}`} icon="chevron-right-r" iconLocation="right">
          Next Block ({block.topoheight + 1})
        </Button>}
      </div>
      <div className="table-responsive">
        <table>
          <tbody>
            <tr>
              <th>Block Type</th>
              <td>{block.block_type}</td>
            </tr>
            <tr>
              <th>Hash</th>
              <td>{block.hash}</td>
            </tr>
            <tr>
              <th>Timestamp</th>
              <td>{formatBlock.date} ({block.timestamp})</td>
            </tr>
            <tr>
              <th>Confirmations</th>
              <td>{formatBlock.confirmations}</td>
            </tr>
            <tr>
              <th>Topoheight</th>
              <td>{block.topoheight}</td>
            </tr>
            <tr>
              <th>Height</th>
              <td>{block.height}</td>
            </tr>
            <tr>
              <th>Miner</th>
              <td>{block.miner}</td>
            </tr>
            <tr>
              <th>Total Fees</th>
              <td>{formatBlock.totalFees}</td>
            </tr>
            <tr>
              <th>Reward</th>
              <td>{formatBlock.reward}</td>
            </tr>
            <tr>
              <th>Txs</th>
              <td>{block.txs_hashes.length}</td>
            </tr>
            <tr>
              <th>Difficulty</th>
              <td>
                <span>{block.difficulty} </span>
                <span title="Cumulative Difficulty">
                  ({block.cumulative_difficulty})
                </span>
              </td>
            </tr>
            <tr>
              <th>Hash Rate</th>
              <td>
                {formatBlock.hashRate}
              </td>
            </tr>
            <tr>
              <th>Size</th>
              <td>{formatBlock.size}</td>
            </tr>
            <tr>
              <th>Nonce</th>
              <td>
                <span>{block.nonce} </span>
                <span title="Extra Nonce">({block.extra_nonce})</span>
              </td>
            </tr>
            <tr>
              <th>Tips</th>
              <td style={{ lineHeight: `1.4em` }}>
                {block.tips.map((tip, index) => {
                  return <div key={tip} style={{ wordBreak: `break-all` }}>
                    {index + 1}. <Link to={`/block/${tip}`}>{tip}</Link>
                  </div>
                })}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <Transactions block={block} />
    </div>
  </div>
}

function Transactions(props) {
  const { block } = props

  const nodeRPC = useNodeRPC()

  const count = useMemo(() => {
    return block.txs_hashes.length
  }, [block])

  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState()
  const [transactions, setTransactions] = useState([])
  const [pageState, setPageState] = useState({ page: 1, size: 5 })

  const load = useCallback(async () => {
    setErr(null)
    setLoading(true)

    const resErr = (err) => {
      setLoading(false)
      setErr(err)
    }

    const { start, end } = getPaginationRange(pageState)
    const txHashes = block.txs_hashes.slice(start, end + 1)
    const [err, txs] = await to(nodeRPC.getTransactions(txHashes))
    if (err) return resErr(err)

    setTransactions(txs)
    setLoading(false)
  }, [block, pageState])

  useEffect(() => {
    if (block) load()
  }, [block, load])

  return <div>
    <h2>Transactions</h2>
    <Pagination state={pageState} setState={setPageState}
      countText="txs" count={count} style={{ marginBottom: `1em` }} />
    <div className="table-responsive">
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
                <td><Link to={`/tx/${item.hash}`}>{item.hash}</Link></td>
                <td>{transfers.length} / {burns.length}</td>
                <td>{reduceText(item.owner)}</td>
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
    <Pagination state={pageState} setState={setPageState}
      countText="txs" count={count} style={{ marginTop: `.5em` }} />
  </div>
}

export default Block
