import { Helmet } from 'react-helmet-async'
import useNodeSocket from '@xelis/sdk/react/context'
import { useState, useCallback, useEffect } from 'react'
import to from 'await-to-js'
import { Link } from 'react-router-dom'
import { css } from 'goober'

import TableFlex from '../../components/tableFlex'
import { useServerData } from '../../context/useServerData'
import { daemonRPC } from '../../ssr/nodeRPC'
import { usePageLoad } from '../../context/usePageLoad'

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

function loadAccounts_SSR({ limit }) {
  const defaultResult = { accounts: [], loaded: false }
  return useServerData(`func:loadAccounts(${limit})`, async () => {
    let result = Object.assign({}, defaultResult)
    const [err, res] = await to(daemonRPC.getAccounts({ maximum: limit }))
    result.err = err
    if (err) return result

    result.loaded = true
    result.accounts = res.result
    return result
  }, defaultResult)
}

function Accounts() {
  const nodeSocket = useNodeSocket()

  const { firstPageLoad } = usePageLoad()
  const serverResult = loadAccounts_SSR({ limit: 20 })
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState()
  const [accounts, setAccounts] = useState(serverResult.accounts)

  const loadAccounts = useCallback(async () => {
    if (!nodeSocket.connected) return

    setLoading(true)
    setErr(null)
    const resErr = (err) => {
      setErr(err)
      setLoading(false)
    }

    const [err, accounts] = await to(nodeSocket.daemon.getAccounts({ maximum: 20 }))
    if (err) return resErr(err)

    setAccounts(accounts)
    setLoading(false)
  }, [nodeSocket])

  useEffect(() => {
    if (firstPageLoad && serverResult.loaded) return
    loadAccounts()
  }, [loadAccounts, firstPageLoad])

  return <div className={style.container}>
    <Helmet>
      <title>Accounts</title>
    </Helmet>
    <h1>Accounts</h1>
    <TableFlex loading={loading} err={err} emptyText="No accounts"
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