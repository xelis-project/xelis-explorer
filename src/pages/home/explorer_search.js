import { useNavigate } from 'react-router-dom'
import { useCallback } from 'react'
import to from 'await-to-js'
import { css } from 'goober'
import { useNodeSocket } from '@xelis/sdk/react/daemon'

import Icon from '../../components/icon'
import Button from '../../components/button'
import theme from '../../style/theme'
import { scaleOnHover } from '../../style/animate'

const style = {
  container: css`
    margin: 5em 0;

    .title {
      font-size: 3em;
      font-weight: bold;
      margin-bottom: 1em;
      text-align: center;
    }

    .form {
      position: relative;

      input {
        width: 100%;
        padding: 1em 1.5em;
        font-size: 1em;
        border-radius: 30px;
        outline: none;
        color: var(--text-color);
        background-color: var(--bg-color);
        border: thin solid var(--border-color);
      }
  
      button {
        position: absolute;
        right: 0.4em;
        top: 0.4em;
        font-size: 1em;
        cursor: pointer;
        background-color: var(--text-color);
        color: var(--bg-color);
        border-radius: 50%;
        height: 76%;
        min-width: 42px;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        transition: .25s transform;
        ${scaleOnHover({ scale: .9 })}
  
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
    }
  `,
}

export function ExplorerSearch() {
  const navigate = useNavigate()
  const nodeSocket = useNodeSocket()

  const search = useCallback(async (e) => {
    if (nodeSocket.readyState !== WebSocket.OPEN) return


    e.preventDefault()
    const formData = new FormData(e.target)
    const searchValue = formData.get(`search`)
    if (searchValue === ``) return

    if (searchValue.length === 65) {
      return navigate(`/accounts/${searchValue}`)
    }

    if (searchValue.length === 64) {
      const [err, block] = await to(nodeSocket.daemon.getBlockByHash({
        hash: searchValue
      }))
      if (block) {
        return navigate(`/blocks/${searchValue}`)
      } else {
        return navigate(`/txs/${searchValue}`)
      }
    }

    return navigate(`/blocks/${searchValue}`)
  }, [nodeSocket])

  return <form onSubmit={search}>
    <div className={style.container}>
      <div className="title">XELIS Explorer</div>
      <div className="form">
        <input type="text" name="search" placeholder="Search block, transaction or address"
          autoComplete="off" autoCapitalize="off" />
        <Button type="submit">
          <Icon name="search" />
          <span>Search</span>
        </Button>
      </div>
    </div>
  </form>
}
