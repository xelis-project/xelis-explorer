import { useNavigate } from 'react-router-dom'
import { useCallback, useMemo, useState } from 'react'
import to from 'await-to-js'
import { css } from 'goober'
import { useNodeSocket } from '@xelis/sdk/react/daemon'
import Icon from 'g45-react/components/fontawesome_icon'
import { useLang } from 'g45-react/hooks/useLang'

import Button from '../../components/button'
import theme from '../../style/theme'
import { opacity } from '../../style/animate'

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
    z-index: 50;
    backdrop-filter: blur(5px);
    background-color: rgb(0 0 0 / 40%);
    ${opacity()};
  `,
  form: css`
    position: relative;
    transition: .25s all;

    &[data-focus="true"] {
      z-index: 60;
      transform: scale(1.05);
    }

    input {
      width: 100%;
      padding: 1em 1.5em;
      font-size: 1.1em;
      border-radius: 2em;
      outline: none;
      color: var(--text-color);
      background-color: var(--content-bg-color);
      border: none;
      font-weight: bold;
    }

    button {
      font-size: 1.2em;
      cursor: pointer;
      background-color: #f1f1f1;
      color: var(--bg-color);
      height: 100%;
      min-width: 46px;
      border: none;
      display: flex;
      gap: .5em;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      transition: .2s all;
      padding: 0 2em;
      border-radius: 2em;
      background: ${theme.apply({ xelis: '#101a1a', dark: '#0c0c0c', light: '#e7e7e7' })};
      color: var(--text-color);

      &:hover {
        background-color: var(--text-color);
        color: var(--bg-color);
      }
    }
  `,
  searchButton: css`
    position: absolute;
    top: 0;
    right: 0;
    height: 100%;
  `,
  blockHeightButtons: css`
    position: absolute;
    top: 0;
    right: 0;
    display: flex;
    height: 100%;

    > :nth-child(1) {
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
      padding: 0 .5em 0 1em;
    }

    > :nth-child(2) {
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
      padding: 0 1em 0 .5em;
    }
  `
}

export function ExplorerSearch() {
  const navigate = useNavigate()
  const nodeSocket = useNodeSocket()
  const { t } = useLang()

  const [searchValue, setSearchValue] = useState(``)
  const [isFocus, setFocus] = useState(false)

  const onFocus = useCallback((e) => {
    setFocus(true)
  }, [])

  const onBlur = useCallback((e) => {
    setFocus(false)
  }, [])

  const isBlockNumber = useMemo(() => {
    return /^\d+$/.test(searchValue)
  }, [searchValue])

  const goToBlockHeight = useCallback((e) => {
    e.preventDefault()
    navigate(`/height/${searchValue}`)
  }, [searchValue])

  const goToBlockTopoHeight = useCallback((e) => {
    e.preventDefault()
    navigate(`/blocks/${searchValue}`)
  }, [searchValue])

  const onSearchValueChange = useCallback((e) => {
    const value = e.target.value
    setSearchValue(value)
  }, [])

  const searchBlock = useCallback(async (e) => {
    e.preventDefault()
    if (nodeSocket.readyState !== WebSocket.OPEN) return

    let value = searchValue
    if (value === ``) return
    value = value.trim()

    // go to account with address
    if (value.length === 63) {
      return navigate(`/accounts/${value}`)
    }

    if (value.length === 64) {
      const [err1, block] = await to(nodeSocket.daemon.methods.getBlockByHash({
        hash: value
      }))
      if (err1) console.log(err1)

      if (block) {
        // go to block with block hash
        return navigate(`/blocks/${value}`)
      }

      const [err2, tx] = await to(nodeSocket.daemon.methods.getTransaction(value))
      if (err2) console.log(err2)

      if (tx) {
        // go to tx with tx hash
        return navigate(`/txs/${value}`)
      }
    }

    if (isBlockNumber) {
      navigate(`/height/${value}`)
    }
  }, [nodeSocket.readyState, searchValue, isBlockNumber])

  return <div className={style.container}>
    <div className={style.title}>{t('XELIS Explorer')}</div>
    {isFocus && <div className={style.backdrop} />}
    <form onSubmit={searchBlock} onBlur={onBlur} data-focus={isFocus} className={style.form}>
      <input onFocus={onFocus} value={searchValue} onChange={onSearchValueChange} type="text" name="value"
        placeholder={t(`Search block, transaction or account address.`)} autoComplete="off" autoCapitalize="off" />
      {!isBlockNumber && <div className={style.searchButton}>
        <Button type="submit" onClick={(e) => e.preventDefault()}>
          <Icon name="search" />
          <span>{t('SEARCH')}</span>
        </Button>
      </div>}
      {isBlockNumber && <div className={style.blockHeightButtons}>
        <Button type="submit" onClick={goToBlockTopoHeight}>
          <Icon name="cube" />
          <span>{t('Topo')}</span>
        </Button>
        <Button type="submit" onClick={goToBlockHeight}>
          <Icon name="cubes" />
          <span>{t('Height')}</span>
        </Button>
      </div>}
    </form>
  </div>
}
