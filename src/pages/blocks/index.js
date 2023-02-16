import { useCallback, useEffect, useMemo, useState } from 'react'
import { formatXelis, reduceText } from '../../utils'
import { Link } from 'react-router-dom'
import useNodeRPC from '../../hooks/useNodeRPC'
import bytes from 'bytes'
import Age from '../../components/age'

function Blocks() {
  const nodeRPC = useNodeRPC()
  const [blocks, setBlocks] = useState([])

  const loadBlocks = useCallback(async () => {
    const block = await nodeRPC.getTopBlock()
    const data = await nodeRPC.getBlocks(block.topoheight-19, block.topoheight)
    setBlocks(data.reverse())
  }, [])

  useEffect(() => {
    loadBlocks()
  }, [loadBlocks])

  return <div>
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
        <tbody>
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
        </tbody>
      </table>
    </div>
  </div>
}

export default Blocks
