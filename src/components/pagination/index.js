import { useCallback, useMemo } from 'react'

export function getPaginationRange(pageState) {
  const { page, size } = pageState
  const start = page * size - size
  const end = start + size - 1
  return { start, end }
}

function Pagination(props) {
  const { count, state = { page: 1, size: 20 }, setState, sizes = [5, 10, 20],
    countText = `items`, className = ``, ...restProps } = props

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

  const setPreviousPage = useCallback(() => {
    setState({ ...state, page: state.page - 1 })
  }, [state])

  const setNextPage = useCallback(() => {
    setState({ ...state, page: state.page + 1 })
  }, [state])

  const setLastPage = useCallback(() => {
    setState({ ...state, page: pageCount })
  }, [state, pageCount])

  const canFirstPage = state.page !== 1
  const canPreviousPage = state.page > 1
  const canNextPage = state.page < pageCount
  const canLastPage = state.page !== pageCount

  return <div className={`pagination ${className}`} {...restProps}>
    <select value={state.size} onChange={changeSize}>
      {sizes.map((v) => <option key={v} value={v}>{v}</option>)}
    </select>
    <button onClick={setFirstPage} disabled={!canFirstPage}>First</button>
    <button onClick={setPreviousPage} disabled={!canPreviousPage}>Previous</button>
    <div>Page {state.page} of {pageCount}</div>
    <button onClick={setNextPage} disabled={!canNextPage}>Next</button>
    <button onClick={setLastPage} disabled={!canLastPage}>Last</button>
    <div>({count} {countText})</div>
  </div>
}

export default Pagination
