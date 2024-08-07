import { css } from 'goober'
import { useCallback, useMemo } from 'react'

import Dropdown from '../dropdown'

export function getPaginationRange(pageState) {
  const { page, size } = pageState
  const start = page * size - size
  const end = start + size - 1
  return { start, end }
}

export const defaultStyle = {
  pagination: css`
    display: flex;
    gap: .7em;
    align-items: center;
    flex-wrap: wrap;
    margin-top: 1em;
    `,
  button: css`
    border-radius: 1em;
    border: 2px solid var(--text-color);
    cursor: pointer;
    padding: .5em 1em;
    font-weight: bold;
    transition: .1s all;
    background: none;
    color: var(--text-color);
    
    &[data-active="true"] {
      background-color: var(--text-color);
      color: var(--bg-color);
    }

    &:hover {
      opacity: .7;
    }
  `,
  count: css`
    color: var(--muted-color);
  `
}

function Pagination(props) {
  const { count, state = { page: 1, size: 20 }, setState, sizes = [5, 10, 20], className = ``,
    styling = defaultStyle, formatCount, ...restProps } = props

  const pageCount = useMemo(() => {
    const pages = Math.ceil((count || 0) / state.size)
    if (pages > 1) return pages
    return 1
  }, [state, count])

  const changeSize = useCallback((item) => {
    const size = parseInt(item.key)
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

  const dropdownSizes = useMemo(() => {
    return sizes.map((size) => ({
      key: size,
      text: size
    }))
  }, [sizes])

  return <div className={`${styling.pagination} ${className}`} {...restProps}>
    <Dropdown items={dropdownSizes} onChange={changeSize} value={state.size} />
    <button className={styling.button} onClick={setFirstPage} disabled={!canFirstPage} data-active={!canFirstPage}>
      1
    </button>
    {(() => {
      const items = []

      const start = Math.max(2, state.page - 2)
      const end = Math.min(pageCount, state.page + 2)

      if (start - 1 > 1) {
        items.push(<div key={1}>...</div>)
      }

      for (let i = start; i < end; i++) {
        items.push(<button className={styling.button} key={i} onClick={() => setPage(i)} data-active={i == state.page}>
          {i}
        </button>)
      }

      if (end < pageCount) {
        items.push(<div key={pageCount}>...</div>)
      }

      return items
    })()}
    {pageCount > 1 && <button className={styling.button} onClick={setLastPage} disabled={!canLastPage} data-active={!canLastPage}>
      {pageCount}
    </button>}
    <div className={styling.count}>
      {typeof formatCount === `function` ? formatCount(count || 0) : `${count || 0}`}
    </div>
  </div>
}

export default Pagination
