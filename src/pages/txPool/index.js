import { Link } from 'react-router-dom'

function TxPool() {
  const txs = [{
    height: 344,
    size: `5 KB`,
    age: `10m`,
    fee: `0.5`,
    hash: `2ae2bf36d5ee1b62608582df131f4ed8808aaf223d60e0ce5a9522f961a6db6f`
  }]

  return <div>
    <h1>Transaction Pool</h1>
    <div className="table-responsive">
      <table>
        <thead>
          <tr>
            <th>Height Built</th>
            <th>Hash</th>
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
              <td>{item.age}</td>
              <td>{item.fee}</td>
              <td>{item.size}</td>
            </tr>
          })}
        </tbody>
      </table>
    </div>
  </div>
}

export default TxPool