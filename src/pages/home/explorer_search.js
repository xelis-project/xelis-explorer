import { useNavigate } from 'react-router-dom'
import { useCallback, useState } from 'react'
import to from 'await-to-js'
import { css } from 'goober'
import { useNodeSocket } from '@xelis/sdk/react/daemon'
import Icon from 'g45-react/components/fontawesome_icon'
import { useLang } from 'g45-react/hooks/useLang'

import Button from '../../components/button'
import theme from '../../style/theme'
import { opacity, scaleOnHover } from '../../style/animate'

const style = {
  container: css`
    margin: 5em 0;
  `,
  title: css`
    font-size: 3em;
    font-weight: bold;
    margin-bottom: 1em;
    text-align: center;
  `,
  backdrop: css`
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    z-index: 1;
    backdrop-filter: blur(5px);
    background-color: rgb(0 0 0 / 40%);
    ${opacity()};
  `,
  form: css`
    position: relative;
    z-index: 2;
    max-width: 50em;
    margin: 0 auto;

    input {
      width: 100%;
      padding: 1em 1.5em;
      font-size: 1.1em;
      border-radius: 30px;
      outline: none;
      color: var(--text-color);
      background-color: var(--stats-bg-color);
      border: none;
      font-weight: bold;
    }

    button {
      position: absolute;
      top: 0;
      right: 0;
      margin: .4em;
      font-size: 1.1em;
      cursor: pointer;
      background-color: var(--text-color);
      color: var(--bg-color);
      border-radius: 50%;
      height: 76%;
      min-width: 46px;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      transition: .1s transform;
      ${scaleOnHover({ scale: .9 })};

      span {
        display: none;
      }

      ${theme.query.minDesktop} {
        width: inherit;
        padding: 0 2em;
        border-radius: 30px;

        i {
          display: none;
        }

        span {
          display: block;
        }
      }
    }
  `
}

export function ExplorerSearch() {
  const navigate = useNavigate()
  const nodeSocket = useNodeSocket()
  const { t } = useLang()

  const search = useCallback(async (e) => {
    if (nodeSocket.readyState !== WebSocket.OPEN) return


    e.preventDefault()
    const formData = new FormData(e.target)
    let searchValue = formData.get(`search`)
    if (searchValue === ``) return
    searchValue = searchValue.trim()

    // go to account with address
    if (searchValue.length === 63) {
      return navigate(`/accounts/${searchValue}`)
    }

    if (searchValue.length === 64) {
      const [err1, block] = await to(nodeSocket.daemon.methods.getBlockByHash({
        hash: searchValue
      }))
      if (err1) console.log(err1)

      if (block) {
        // go to block with block hash
        return navigate(`/blocks/${searchValue}`)
      }

      const [err2, tx] = await to(nodeSocket.daemon.methods.getTransaction(searchValue))
      if (err2) console.log(err2)

      if (tx) {
        // go to tx with tx hash
        return navigate(`/txs/${searchValue}`)
      }

      // go to block anyway and show error there
      return navigate(`/blocks/${searchValue}`)
    }

    if (!isNaN(parseInt(searchValue))) {
      // go to block with topoheight
      return navigate(`/blocks/${searchValue}`)
    }
  }, [nodeSocket.readyState])

  const [isFocus, setFocus] = useState(false)

  const onFocus = useCallback((e) => {
    setFocus(true)
  }, [])

  const onBlur = useCallback((e) => {
    setFocus(false)
  }, [])

  return <div className={style.container}>
    <div className={style.title}>{t('XELIS Explorer')}</div>
    {isFocus && <div className={style.backdrop} />}
    <form onSubmit={search} onBlur={onBlur} className={style.form}>
      <input onFocus={onFocus} type="text" name="search" placeholder={t('Search block hash / topo, transaction or account address.')}
        autoComplete="off" autoCapitalize="off" />
      <Button type="submit" aria-label="Search" onMouseDown={(e) => e.preventDefault()}>
        <Icon name="search" />
        <span>{t('Search')}</span>
      </Button>
    </form>
  </div>
}
