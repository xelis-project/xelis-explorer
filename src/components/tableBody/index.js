import { css } from 'goober'

import DotLoading from '../dotLoading'
import theme from '../../theme'

export const style = css`
  overflow: auto;
  padding-bottom: .5em;
  --table-hover-bg-color: ${theme.apply({ xelis: 'black', dark: '#373737', light: '#cbcbcb' })};
  --table-hover-text-color: var(--text-color);

  table {
    border-collapse: collapse;
    width: 100%;
    white-space: nowrap;
  }

  table th {
    font-weight: bold;
    padding: .8em 1em;
    text-align: left;
    background-color: ${theme.apply({ xelis: 'rgb(122 250 211)', dark: '#373737', light: '#cbcbcb' })};
    color: ${theme.apply({ xelis: 'var(--bg-color)', dark: '#f1f1f1', light: '#1c1c1c' })};
  }

  table td {
    border-bottom: thin solid ${theme.apply({ xelis: '#232323', dark: '#2b2b2b', light: '#cbcbcb' })};
    background-color: ${theme.apply({ xelis: '#0c0c0c', dark: '#0e0e0e', light: '#f5f5f5' })};
    padding: .8em 1em;
    color: var(--muted-color);
  }

  table.td-100 td {
    width: 100%;
  }
`

function TableBody(props) {
  const { list = [], onItem, loading, err, colSpan, emptyText = `No items` } = props

  const listBodyStyle = loading ? { opacity: .5, userSelect: 'none' } : {}

  return <>
    <tbody>
      <tr>
        {loading && <td colSpan={colSpan}>
          loading<DotLoading />
        </td>}
        {err && <td colSpan={colSpan}>
          {JSON.stringify(err)}
        </td>}
        {!err && !loading && list.length === 0 && <td colSpan={colSpan}>
          {emptyText}
        </td>}
      </tr>
    </tbody>
    <tbody style={listBodyStyle}>
      {list.map((item, index) => onItem(item, index))}
    </tbody>
  </>
}

export default TableBody
