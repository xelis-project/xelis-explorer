import { Helmet } from 'react-helmet-async'
import useNodeSocket from '@xelis/sdk/react/daemon'
import { useState, useCallback, useEffect } from 'react'
import to from 'await-to-js'
import { Link } from 'react-router-dom'
import { css } from 'goober'

import TableFlex from '../../components/tableFlex'
import { useServerData } from '../../context/useServerData'
import { daemonRPC } from '../../ssr/nodeRPC'
import { usePageLoad } from '../../context/usePageLoad'
import Button from '../../components/button'
import { XELIS_ASSET, formatXelis } from '../../utils'

const style = {
  container: css`
    h1 {
      margin: 1.5em 0 .5em 0;
      font-weight: bold;
      font-size: 2em;
    }

    .pager {
      display: flex;
      gap: .5em;
      margin-top: .5em;

      > button {
        display: flex;
        gap: .5em;
        align-items: center;
        border-radius: 25px;
        border: none;
        background-color: var(--text-color);
        cursor: pointer;
        padding: 0.5em 1em;
        font-weight: bold;
      }
    }
  `
}

function loadAccounts_SSR({ limit }) {
  const defaultResult = { accounts: {}, loaded: false }
  return useServerData(`func:loadAccounts(${limit})`, async () => {
    let result = Object.assign({}, defaultResult)
    const [err, res] = await to(daemonRPC.getAccounts({ maximum: limit }))
    result.err = err
    if (err) return result

    const accounts = []
    const addresses = res.result || []
    for (let i = 0; i < addresses.length; i++) {
      const addr = addresses[i]
      const [err, res] = await to(daemonRPC.getLastBalance({
        address: addr,
        asset: XELIS_ASSET
      }))
      accounts.push({ addr, balance: (res || {}).result })
    }

    result.loaded = true
    result.accounts[1] = accounts
    return result
  }, defaultResult)
}

function Accounts() {
  const nodeSocket = useNodeSocket()

  const pageSize = 10
  const [page, setPage] = useState(1)

  const { firstPageLoad } = usePageLoad()
  const serverResult = loadAccounts_SSR({ limit: pageSize })
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState()
  const [accounts, setAccounts] = useState(serverResult.accounts)

  const loadAccounts = useCallback(async () => {
    if (!nodeSocket.connected) return
    if (accounts[page]) return

    setLoading(true)
    setErr(null)
    const resErr = (err) => {
      setErr(err)
      setLoading(false)
    }

    const [err, result] = await to(nodeSocket.daemon.getAccounts({
      skip: (page - 1) * pageSize,
      maximum: pageSize
    }))
    if (err) return resErr(err)

    const list = []
    const addresses = result || []
    for (let i = 0; i < addresses.length; i++) {
      const addr = addresses[i]
      const [err, balance] = await to(nodeSocket.daemon.getLastBalance({
        address: addr,
        asset: XELIS_ASSET
      }))
      list.push({ addr, balance })
    }

    accounts[page] = list
    setAccounts(Object.assign({}, accounts))
    setLoading(false)
  }, [accounts, page, nodeSocket])

  useEffect(() => {
    if (firstPageLoad && serverResult.loaded) return
    loadAccounts()
  }, [loadAccounts, firstPageLoad])

  useEffect(() => {
    loadAccounts()
  }, [page])

  const list = accounts[page] || accounts[page - 1] || []

  return <div className={style.container}>
    <Helmet>
      <title>Accounts</title>
    </Helmet>
    <h1>Accounts</h1>
    <TableFlex loading={loading} err={err}
      emptyText="No accounts" rowKey="addr"
      headers={[
        {
          key: 'addr',
          title: 'Address',
          render: (value) => {
            return <Link to={`/accounts/${value}`}>{value}</Link>
          }
        },
        {
          key: 'topoheight',
          title: 'Last Topoheight',
          render: (_, item) => {
            const { topoheight } = item.balance || {}
            return topoheight ? topoheight : `--`
          }
        },
        {
          key: 'balance',
          title: 'Balance',
          render: (_, item) => {
            const { balance } = item.balance || {}
            return balance ? formatXelis(balance.balance) : `--`
          }
        }
      ]} data={list} />
    <div className="pager">
      <Button icon="arrow-left" onClick={() => {
        if (page <= 1) return
        setPage(page - 1)
      }}>
        Previous
      </Button>
      <Button icon="arrow-right" iconLocation="right"
        onClick={() => {
          if (list.length === 0) return
          setPage(page + 1)
        }}>
        Next
      </Button>
    </div>
  </div>
}

export default Accounts