import { css } from 'goober'

import DotLoading from '../dotLoading'
import theme from '../../style/theme'
import { displayError } from '../../utils'

export const defaultStyle = {
  container: css`
    overflow: auto;
    --table-hover-bg-color: ${theme.apply({ xelis: 'black', dark: '#373737', light: '#cbcbcb' })};
    --table-hover-text-color: var(--text-color);
    border-radius: .5em;

    table {
      border-collapse: collapse;
      width: 100%;
      white-space: nowrap;
    }

    table th {
      font-weight: bold;
      padding: .8em 1em;
      text-align: left;
      vertical-align: middle;
      background-color: ${theme.apply({ xelis: 'rgb(122 250 211)', dark: '#373737', light: '#cbcbcb' })};
      color: ${theme.apply({ xelis: 'var(--bg-color)', dark: '#f1f1f1', light: '#1c1c1c' })};
    }

    table thead th {
      position: sticky;
      top: 0;

      &:first-child {
        border-top-left-radius: .5em;
      }

      &:last-child {
        border-top-right-radius: .5em;
      }
    }

    table td {
      border-bottom: thin solid ${theme.apply({ xelis: '#232323', dark: '#2b2b2b', light: '#cbcbcb' })};
      background-color: ${theme.apply({ xelis: '#0c0c0c', dark: '#0e0e0e', light: '#f5f5f5' })};
      padding: .8em 1em;
      color: var(--muted-color);
    }

    table tr:last-child {
      td {
        border-bottom: none;
      }

      td:first-child {
        border-bottom-left-radius: .5em;
      }

      td:last-child {
        border-bottom-right-radius: .5em;
      }
    }

    table.td-100 td {
      width: 100%;
    }
  `,
  errorText: css`
    color: red !important;
  `
}

function Table(props) {
  const { headers = [], list = [], onItem, loading, err, colSpan, emptyText = `No items`, styling = defaultStyle } = props

  const listBodyStyle = loading ? { opacity: .5, userSelect: 'none' } : {}

  return <div className={styling.container}>
    <table>
      <thead>
        <tr>
          {headers.map((header) => <th key={header}>{header}</th>)}
        </tr>
      </thead>
      <tbody>
        <tr>
          {loading && <td colSpan={colSpan}>
            loading<DotLoading />
          </td>}
          {err && <td colSpan={colSpan} className={styling.errorText}>
            {displayError(err)}
          </td>}
          {!err && !loading && list.length === 0 && <td colSpan={colSpan}>
            {emptyText}
          </td>}
        </tr>
      </tbody>
      <tbody style={listBodyStyle}>
        {list.map((item, index) => onItem(item, index))}
      </tbody>
    </table>
  </div>
}

export default Table
