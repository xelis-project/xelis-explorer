import { useParams } from 'react-router'

function Block() {
  const { id } = useParams()

  const block = {
    'timestamp': `10/10/2023`,
    'confirmations': 2,
    'miner': `xelis452305gi3450`,
    'reward': `1.5 XELIS`
  }

  return <div>
    <div>Block #{id}</div>
    <div>
      This block was mined on {block.timestamp} by {block.miner}. It currently has {block.confirmations} confirmations.
      The miner of this block earned {block.reward}.
    </div>
    <table>
      <tr>
        <th>Hash</th>
        <td></td>
      </tr>
      <tr>
        <th>Confirmations</th>
        <td></td>
      </tr>
      <tr>
        <th>Height</th>
        <td></td>
      </tr>
      <tr>
        <th>Miner</th>
        <td></td>
      </tr>
      <tr>
        <th>Txs</th>
        <td></td>
      </tr>
      <tr>
        <th>Difficulty</th>
        <td></td>
      </tr>
      <tr>
        <th>Size</th>
        <td></td>
      </tr>
    </table>
    <div>Transactions</div>
    <table>
      <thead>
        <tr>
          <th></th>
        </tr>
      </thead>
      <tbody>

      </tbody>
    </table>
  </div>
}

export default Block
