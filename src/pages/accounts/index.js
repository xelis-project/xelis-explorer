import useNodeSocket from '@xelis/sdk/react/daemon'
import { useState, useCallback, useEffect } from 'react'
import to from 'await-to-js'
import { Link } from 'react-router-dom'
import { css } from 'goober'
import { usePageLoad } from 'g45-react/hooks/usePageLoad'
import { useServerData } from 'g45-react/hooks/useServerData'
import { useLang } from 'g45-react/hooks/useLang'

import TableFlex from '../../components/tableFlex'
import { daemonRPC } from '../../hooks/nodeRPC'
import Pagination, { getPaginationRange } from '../../components/pagination'
import { XELIS_ASSET, formatXelis } from '../../utils'
import PageTitle from '../../layout/page_title'

const style = {
  container: css`
    > :nth-child(2) {
      margin-bottom: 1em;
    }
  `
}

function loadAccounts_SSR({ limit }) {
  const defaultResult = { accounts: [], totalAccounts: 0, loaded: false }
  return useServerData(`func:loadAccounts(${limit})`, async () => {
    let result = Object.assign({}, defaultResult)

    const [err1, res1] = await to(daemonRPC.countAccounts())
    result.err = err1
    if (err1) return result
    result.totalAccounts = res1.result

    const [err2, res2] = await to(daemonRPC.getAccounts({ maximum: limit }))
    result.err = err2
    if (err2) return result
    const addresses = res2.result || []

    const accounts = []
    for (let i = 0; i < addresses.length; i++) {
      const addr = addresses[i]
      const [err, res] = await to(daemonRPC.getLastBalance({
        address: addr,
        asset: XELIS_ASSET
      }))
      accounts.push({ addr, balance: (res || {}).result })
    }


    result.loaded = true
    result.accounts = accounts
    return result
  }, defaultResult)
}

function Accounts() {
  const nodeSocket = useNodeSocket()

  const [pageState, setPageState] = useState({ page: 1, size: 20 })

  const { firstPageLoad } = usePageLoad()
  const serverResult = loadAccounts_SSR({ limit: 20 })
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState()
  const [accounts, setAccounts] = useState(serverResult.accounts)
  const [accountCount, setAccountCount] = useState(serverResult.totalAccounts)
  const { t } = useLang()

  const loadAccounts = useCallback(async () => {
    if (nodeSocket.readyState !== WebSocket.OPEN) return


    setLoading(true)
    setErr(null)

    const resErr = (err) => {
      setAccounts([])
      setAccountCount(0)
      setErr(err)
      setLoading(false)
    }

    const [err1, result1] = await to(nodeSocket.daemon.countAccounts())
    if (err1) return resErr(err)

    let pagination = getPaginationRange(pageState)

    const [err2, result2] = await to(nodeSocket.daemon.getAccounts({
      skip: Math.max(0, pagination.start - 1),
      maximum: pageState.size
    }))
    if (err2) return resErr(err2)

    const accounts = []
    const addresses = result2 || []
    for (let i = 0; i < addresses.length; i++) {
      const addr = addresses[i]
      const [err, balance] = await to(nodeSocket.daemon.getLastBalance({
        address: addr,
        asset: XELIS_ASSET
      }))
      accounts.push({ addr, balance })
    }

    setAccounts(accounts)
    setAccountCount(result1)
    setLoading(false)
  }, [pageState, nodeSocket.readyState])

  useEffect(() => {
    if (firstPageLoad && serverResult.loaded) return
    loadAccounts()
  }, [loadAccounts, firstPageLoad])

  useEffect(() => {
    loadAccounts()
  }, [pageState])

  return <div className={style.container}>
    <PageTitle title={t('Accounts')} subtitle={t('{} registered accounts', [accountCount.toLocaleString()])}
      metaDescription={t('List of registered accounts. Check addresses and more.')} />
    <TableFlex loading={loading} err={err}
      emptyText={t('No accounts')} rowKey="addr"
      headers={[
        {
          key: 'addr',
          title: t('Address'),
          render: (value) => {
            return <Link to={`/accounts/${value}`}>{value}</Link>
          }
        },
        {
          key: 'topoheight',
          title: t('Last Topo'),
          render: (_, item) => {
            const { topoheight } = item.balance || {}
            return topoheight ? topoheight : `--`
          }
        },
        {
          key: 'balance',
          title: t('Balance'),
          render: (_, item) => {
            const { balance } = item.balance || {}
            return balance ? formatXelis(balance.balance) : `--`
          }
        }
      ]} data={accounts} />
    <Pagination state={pageState} setState={setPageState} countText={t('accounts')} count={accountCount} />
  </div>
}

export default Accounts