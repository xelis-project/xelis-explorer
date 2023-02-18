import { useCallback, useEffect, useMemo, useState } from 'react'
import { formatXelis, reduceText } from '../../utils'
import { Link } from 'react-router-dom'
import useNodeRPC from '../../hooks/useNodeRPC'
import bytes from 'bytes'
import Age from '../../components/age'
import { Helmet } from 'react-helmet'
import TableBody from '../../components/tableBody'
import to from 'await-to-js'

function Blocks() {
  const nodeRPC = useNodeRPC()

  const [err, setErr] = useState()
  const [loading, setLoading] = useState(true)
  const [blocks, setBlocks] = useState([])

  const loadBlocks = useCallback(async () => {
    const resErr = (err) => {
      setErr(err)
      setLoading(false)
    }

    setLoading(true)
    const [err1, topBlock] = await to(nodeRPC.getTopBlock())
    if (err1) return resErr(err1)

    const [err2, blocks] = await to(nodeRPC.getBlocks(topBlock.topoheight - 19, topBlock.topoheight))
    if (err2) return resErr(err2)
    setLoading(false)

    setBlocks(blocks.reverse())
  }, [])

  useEffect(() => {
    loadBlocks()
  }, [loadBlocks])

  return <div>
    <Helmet>
      <title>Blocks</title>
    </Helmet>
    <h1>Blocks</h1>
    <div className="table-responsive">
      <table>
        <thead>
          <tr>
            <th>Topo Height</th>
            <th>Age</th>
            <th>Size</th>
            <th>Hash</th>
            <th>Fees</th>
            <th>Miner</th>
            <th>Reward</th>
          </tr>
        </thead>
        <TableBody err={err} loading={loading} colSpan={7}>
          {blocks.map((item) => {
            const size = bytes.format(item.total_size_in_bytes)
            return <tr key={item.topoheight}>
              <td>
                <Link to={`/blocks/${item.topoheight}`}>{item.topoheight}</Link>
              </td>
              <td>{item.age}
                <Age timestamp={item.timestamp} />
              </td>
              <td>{size}</td>
              <td>{reduceText(item.hash)}</td>
              <td>{item.total_fees}</td>
              <td>{reduceText(item.miner)}</td>
              <td>{formatXelis(item.reward)}</td>
            </tr>
          })}
        </TableBody>
      </table>
    </div>
  </div>
}

export default Blocks
