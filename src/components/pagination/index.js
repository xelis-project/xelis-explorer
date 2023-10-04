import { css } from 'goober'
import { useCallback, useMemo } from 'react'
import theme from '../../style/theme'

export function getPaginationRange(pageState) {
  const { page, size } = pageState
  const start = page * size - size
  const end = start + size - 1
  return { start, end }
}

export const style = css`
  display: flex;
  gap: .7em;
  align-items: center;
  flex-wrap: wrap;

  select {
    border: thin solid var(--text-color);
    border-radius: 25px;
    padding: .5em 1em;
    font-weight: bold;
    outline: none;
    cursor: pointer;
  }

  button {
    border-radius: 25px;
    border: thin solid var(--text-color);
    cursor: pointer;
    padding: .5em 1em;
    font-weight: bold;
    transition: .25s all;
    background: none;
    color: var(--text-color);

    &.active {
      background-color: var(--text-color);
      color: var(--bg-color);
    }
  }

  .count {
    color: var(--muted-color);
  }
`

function Pagination(props) {
  const { count, state = { page: 1, size: 20 }, setState, sizes = [5, 10, 20],
    countText = `items`, ...restProps } = props

  const pageCount = useMemo(() => {
    const pages = Math.ceil((count || 0) / state.size)
    if (pages > 1) return pages
    return 1
  }, [state, count])

  const changeSize = useCallback((e) => {
    const size = parseInt(e.target.value)
    setState({ size, page: 1 })
  }, [])

  const setFirstPage = useCallback(() => {
    setState({ ...state, page: 1 })
  }, [state])

  const setPage = useCallback((page) => {
    setState({ ...state, page })
  }, [state])

  const setLastPage = useCallback(() => {
    setState({ ...state, page: pageCount })
  }, [state, pageCount])

  const canFirstPage = state.page !== 1
  const canLastPage = state.page !== pageCount

  return <div {...restProps}>
      <select value={state.size} onChange={changeSize}>
        {sizes.map((v) => <option key={v} value={v}>{v}</option>)}
      </select>
      <button onClick={setFirstPage} disabled={!canFirstPage} className={!canFirstPage ? `active` : ``}>1</button>
      {(() => {
        const items = []

        const start = Math.max(2, state.page - 2)
        const end = Math.min(pageCount, state.page + 2)

        if (start - 1 > 1) {
          items.push(<div key={1}>...</div>)
        }

        for (let i = start; i < end; i++) {
          items.push(<button key={i} onClick={() => setPage(i)} className={i == state.page ? `active` : ``}>
            {i}
          </button>)
        }

        if (end < pageCount) {
          items.push(<div key={pageCount}>...</div>)
        }

        return items
      })()}
      {pageCount > 1 && <button onClick={setLastPage} disabled={!canLastPage} className={!canLastPage ? `active` : ``}>{pageCount}</button>}
      <div className="count">{`${count} ${countText}`}</div>
  </div>
}

export default Pagination
