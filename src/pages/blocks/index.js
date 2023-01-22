import { useMemo } from 'react'
import { reduceText } from '../../utils'
import { Link } from 'react-router-dom'

function Blocks() {
  const blocks = useMemo(() => {
    const items = []
    for (let i = 0; i < 50; i++) {
      items.push({
        height: i,
        age: '5s',
        size: `4 kb`,
        hash: `e5faf4e26d6e3f176cb11895aaaf69ae2edeecd7cdade62705336bc69c6e68d3`,
        fees: `0.5`,
        miner: `xelis345239458gh23`
      })
    }
    return items.reverse()
  }, [])

  return <div className="table-responsive">
    <table>
      <thead>
        <tr>
          <th>Height</th>
          <th>Age</th>
          <th>Size</th>
          <th>Hash</th>
          <th>Fees</th>
          <th>Miner</th>
        </tr>
      </thead>
      <tbody>
        {blocks.map((item) => {
          return <tr key={item.height}>
            <td>
              <Link to={`/blocks/${item.height}`}>{item.height}</Link>
            </td>
            <td>{item.age}</td>
            <td>{item.size}</td>
            <td>{reduceText(item.hash)}</td>
            <td>{item.fees}</td>
            <td>{item.miner}</td>
          </tr>
        })}
      </tbody>
    </table>
  </div>
}

export default Blocks
