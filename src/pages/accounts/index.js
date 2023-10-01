import { Helmet } from 'react-helmet-async'
import useNodeSocket from '@xelis/sdk/react/context'
import { useState, useCallback, useEffect } from 'react'
import to from 'await-to-js'
import { Link } from 'react-router-dom'
import { css } from 'goober'

import TableFlex from '../../components/tableFlex'

const style = {
  container: css`
    h1 {
      margin: 1.5em 0 .5em 0;
      font-weight: bold;
      font-size: 2em;
    }

    h2 {
      margin: 1em 0 .5em 0;
      font-weight: bold;
      font-size: 1.5em;
    }
  `
}

function Accounts() {
  const nodeSocket = useNodeSocket()

  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState()
  const [accounts, setAccounts] = useState([])

  const load = useCallback(async () => {
    if (!nodeSocket.connected) return

    setLoading(true)
    setErr(null)
    const resErr = (err) => {
      setErr(err)
      setLoading(false)
    }

    const [err, accounts] = await to(nodeSocket.daemon.getAccounts({}))
    if (err) return resErr(err)

    setAccounts(accounts)
    setLoading(false)
  }, [nodeSocket])

  useEffect(() => {
    load()
  }, [load])

  return <div className={style.container}>
    <Helmet>
      <title>Accounts</title>
    </Helmet>
    <h1>Accounts</h1>
    <TableFlex loading={loading} err={err}
      headers={[
        {
          key: 'address',
          title: 'Address',
          render: (_, item) => {
            return <Link to={`/accounts/${item}`}>{item}</Link>
          }
        }
      ]} data={accounts} />
  </div>
}

export default Accounts