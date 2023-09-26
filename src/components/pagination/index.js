import { css } from 'goober'
import { useCallback, useMemo } from 'react'
import theme from '../../theme'

export function getPaginationRange(pageState) {
  const { page, size } = pageState
  const start = page * size - size
  const end = start + size - 1
  return { start, end }
}

export  const style = css`
  display: flex;
  gap: .6em;
  align-items: center;
  padding: .6em 2em;
  background-color: rgb(0 0 0 / 20%);
  border-radius: 30px;
  justify-content: center;
  font-size: .9em;
  color: var(--text-color);

  button {
    border: none;
    cursor: pointer;
    border-radius: 30px;
    background-color: rgb(0 0 0 / 20%);
    padding: .5em 1em;
    color: var(--text-color);
  }

  select {
    border-radius: 20px;
    padding: .3em .7em;
    border: none;
    outline: none;
    margin-right: 2em;
    background-color: rgb(0 0 0 / 20%);
    color: var(--text-color);
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

  return <div {...restProps}>
    <select value={state.size} onChange={changeSize}>
      {sizes.map((v) => <option key={v} value={v}>{v}</option>)}
    </select>
    <button onClick={setFirstPage} disabled={!canFirstPage}>First</button>
    <button onClick={setPreviousPage} disabled={!canPreviousPage}>Previous</button>
    <div>Page {state.page} of {pageCount}</div>
    <button onClick={setNextPage} disabled={!canNextPage}>Next</button>
    <button onClick={setLastPage} disabled={!canLastPage}>Last</button>
    <div>({count || 0} {countText})</div>
  </div>
}

export default Pagination
