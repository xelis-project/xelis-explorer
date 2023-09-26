import { useNavigate } from 'react-router-dom'
import { useCallback, useMemo } from 'react'
import to from 'await-to-js'
import { css } from 'goober'

import Icon from '../../components/icon'
import useNodeRPC from '../../hooks/useNodeRPC'
import Button from '../../components/button'
import theme from '../../theme'

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
  form: css`
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
      right: 5px;
      top: 5px;
      font-size: 1em;
      cursor: pointer;
      background-color: var(--text-color);
      color: var(--bg-color);
      border-radius: 50%;
      height: 42px;
      width: 42px;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      --ggs: .9;

      .text {
        display: none;
      }

      ${theme.query.desktop} {
        width: inherit;
        padding: 0 2em;
        border-radius: 30px;

        .icon {
          display: none;
        }

        .text {
          display: block;
        }
      }
    }
  `
}

export function ExplorerSearch() {
  const navigate = useNavigate()
  const nodeRPC = useNodeRPC()

  const search = useCallback(async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const searchValue = formData.get(`search`)
    if (searchValue === ``) return

    if (searchValue.length === 64) {
      const [err, block] = await to(nodeRPC.getBlockByHash(searchValue))
      if (block) {
        return navigate(`/blocks/${searchValue}`)
      } else {
        return navigate(`/txs/${searchValue}`)
      }
    }

    return navigate(`/blocks/${searchValue}`)
  }, [])

  return <form onSubmit={search}>
    <div className={style.container}>
      <div className={style.title}>Xelis Explorer</div>
      <div className={style.form}>
        <input type="text" name="search" placeholder="Search block, transaction or address"
          autoComplete="off" autoCapitalize="off" />
        <Button type="submit">
          <Icon name="search" className="icon" />
          <span className="text">Search</span>
        </Button>
      </div>
    </div>
  </form>
}
