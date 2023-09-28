import { css } from 'goober'

import DotLoading from '../dotLoading'
import theme from '../../style/theme'
import { displayError } from '../../utils'

export const style = {
  container: css`
    --table-th-bg-color: ${theme.apply({ xelis: 'rgb(122 250 211)', dark: '#373737', light: '#cbcbcb' })};
    --table-td-bg-color: ${theme.apply({ xelis: '#0c0c0c', dark: '#0e0e0e', light: '#f5f5f5' })};

    .table-mobile {
      display: flex;
      gap: 2em;
      flex-direction: column;

      > div {
        width: 100%;
        display: flex;
        gap: 1em;
        flex-direction: column;
        background-color: var(--table-td-bg-color);
        padding: 1em;
        border-top: 5px solid var(--table-th-bg-color);

        > div {
          > :nth-child(1) {
            font-size: 1.2em;
            font-weight: bold;
            margin-bottom: .5em;
          }
  
          > :nth-child(2) {
            word-break: break-all;
            color: var(--muted-color);
          }
        }
      }

      ${theme.query.minDesktop} {
        display: none;
      }
    }

    .table-desktop {
      display: none;

      ${theme.query.minDesktop} {
        display: block;
      }

      table {
        border-collapse: collapse;
        width: 100%;
        white-space: nowrap;

        --table-hover-bg-color: ${theme.apply({ xelis: 'black', dark: '#373737', light: '#cbcbcb' })};
        --table-hover-text-color: var(--text-color);
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

      table tbody.td-100 td {
        width: 100%;
        word-break: break-all;
        white-space: pre-wrap;
      }

      table .error {
        color: red;
      }
    }
  `
}

function TableFlex(props) {
  const { headers = [], data = [], rowKey, loading, err, emptyText = `No items` } = props

  const loadingStyle = loading ? { opacity: .5, userSelect: 'none' } : {}
  const colSpan = headers.length

  return <div className={style.container}>
    <div className="table-mobile">
      {data.map((item) => {
        const key = item[rowKey] || 0
        return <div key={key}>
          {headers.map((header, index) => {
            let value = item[header.key]
            if (typeof (header.render) === 'function') {
              value = header.render(value, item)
            }

            return <div key={index}>
              <div>{header.title}</div>
              <div>{value}</div>
            </div>
          })}
        </div>
      })}
    </div>
    <div className="table-desktop">
      <table>
        {data.length > 1 && <thead>
          <tr>
            {headers.map((header, index) => {
              return <th key={index}>{header.title}</th>
            })}
          </tr>
        </thead>}
        <tbody>
          <tr>
            {loading && <td colSpan={colSpan}>
              loading<DotLoading />
            </td>}
            {err && <td colSpan={colSpan} className="error">
              {displayError(err)}
            </td>}
            {!err && !loading && data.length === 0 && <td colSpan={colSpan}>
              {emptyText}
            </td>}
          </tr>
        </tbody>
        <tbody style={loadingStyle} className={data.length == 1 ? 'td-100' : ''}>
          {data.length == 1 && <>
            {headers.map((header, index) => {
              const item = data[0]
              let value = item[header.key]
              if (typeof (header.render) === 'function') {
                value = header.render(value, item)
              }

              return <tr key={index}>
                <th>{header.title}</th>
                <td>{value}</td>
              </tr>
            })}
          </>}
          {data.length > 1 && data.map((item) => {
            const key = item[rowKey] || 0
            return <tr key={key}>
              {headers.map((header, index) => {
                let value = item[header.key]
                if (typeof (header.render) === 'function') {
                  value = header.render(value, item)
                }
                return <td key={index}>{value}</td>
              })}
            </tr>
          })}
        </tbody>
      </table>
    </div>
  </div>
}

export default TableFlex
