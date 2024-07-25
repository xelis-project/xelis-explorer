import { useNavigate } from 'react-router-dom'
import { useCallback, useState } from 'react'
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
  heightContainer: css`
    display: flex;
    flex-direction: column;
    gap: 1em;
    margin-top: 1em;

    ${theme.query.minDesktop} {
      flex-direction: row;
    }

    > * {
      flex: 1;
    }
  `
  ,
  inputs: css`
    max-width: 50em;
    margin: 0 auto;
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
      position: absolute;
      top: 0;
      right: 0;
      font-size: 1.2em;
      cursor: pointer;
      background-color: #f1f1f1;
      color: var(--bg-color);
      height: 100%;
      min-width: 46px;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      transition: .2s all;
      padding: 0 2em;
      border-radius: 2em;
      /* border-top-left-radius: 0; */
      /* border-bottom-left-radius: 0; */
      background: ${theme.apply({ xelis: '#172a29', dark: '#0c0c0c', light: '#e7e7e7' })};
      color: var(--text-color);

      &:hover {
        background-color: var(--text-color);
        color: var(--bg-color);
      }

      span {
        display: none;
      }

      ${theme.query.minDesktop} {
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

  const goToBlockHeight = useCallback((value) => {
    if (nodeSocket.readyState !== WebSocket.OPEN) return

    if (!isNaN(parseInt(value))) {
      // go to block with topoheight
      return navigate(`/height/${value}`)
    }
  }, [nodeSocket])

  const goToBlockTopoHeight = useCallback((value) => {
    if (nodeSocket.readyState !== WebSocket.OPEN) return

    if (!isNaN(parseInt(value))) {
      // go to block with topoheight
      return navigate(`/blocks/${value}`)
    }
  }, [nodeSocket])

  const searchBlock = useCallback(async (value) => {
    if (nodeSocket.readyState !== WebSocket.OPEN) return

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

      // go to block anyway and show error there
      return navigate(`/blocks/${value}`)
    }
  }, [nodeSocket.readyState])

  return <div className={style.container}>
    <div className={style.title}>{t('XELIS Explorer')}</div>
    <div className={style.inputs}>
      <FormInput onSubmit={searchBlock} type="text" placeholder={t(`Search block hash, transaction or account address.`)}>
        <Icon name="search" />
        <span>{t('SEARCH')}</span>
      </FormInput>
      <div className={style.heightContainer}>
        <FormInput onSubmit={goToBlockTopoHeight} type="number" placeholder={t(`Block topo height`)}>
          <Icon name="arrow-right" />
          <span>{t('GO')}</span>
        </FormInput>
        <FormInput onSubmit={goToBlockHeight} type="number" placeholder={t(`Block height`)}>
          <Icon name="arrow-right" />
          <span>{t('GO')}</span>
        </FormInput>
      </div>
    </div>
  </div>
}

function FormInput(props) {
  const { type, placeholder, children, onSubmit } = props

  const [isFocus, setFocus] = useState(false)

  const onFocus = useCallback((e) => {
    setFocus(true)
  }, [])

  const onBlur = useCallback((e) => {
    setFocus(false)
  }, [])

  const _onSubmit = useCallback((e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    let value = formData.get(`value`)

    if (typeof onSubmit === `function`) onSubmit(value)
  }, [onSubmit])

  return <>
    {isFocus && <div className={style.backdrop} />}
    <form onSubmit={_onSubmit} onBlur={onBlur} data-focus={isFocus} className={style.form}>
      <input onFocus={onFocus} type={type} name="value" placeholder={placeholder}
        autoComplete="off" autoCapitalize="off" />
      <Button type="submit" onMouseDown={(e) => e.preventDefault()}>
        {children}
      </Button>
    </form>
  </>
}
