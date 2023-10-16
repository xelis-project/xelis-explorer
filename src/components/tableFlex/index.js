import { css } from 'goober'

import DotLoading from '../dotLoading'
import theme from '../../style/theme'
import { displayError } from '../../utils'
import { useCallback } from 'react'

theme.xelis`
  --table-th-bg-color: rgb(122 250 211);
  --table-td-bg-color: #0c0c0c;
`

theme.dark`
  --table-th-bg-color: #373737;
  --table-td-bg-color: #0e0e0e;
`

theme.light`
  --table-th-bg-color: #cbcbcb;
  --table-td-bg-color: #f5f5f5;
`

export const style = {
  container: css`
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
      overflow: auto;
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
        background-color: var(--table-th-bg-color);
        color: ${theme.apply({ xelis: 'var(--bg-color)', dark: '#f1f1f1', light: '#1c1c1c' })};
      }

      table td {
        border-bottom: thin solid ${theme.apply({ xelis: '#232323', dark: '#2b2b2b', light: '#cbcbcb' })};
        background-color: var(--table-td-bg-color);
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
  const { headers = [], data = [], rowClassName, rowKey, loading, err, emptyText = `No items`, keepTableDisplay = false } = props

  const loadingStyle = loading ? { opacity: .5, userSelect: 'none' } : {}
  const colSpan = headers.length

  const getRowKeyValue = useCallback((item, index) => {
    let key = ``
    if (typeof item === 'object') {
      if (typeof rowKey === 'function') key = rowKey(item, index)
      if (typeof rowKey === 'string') key = item[rowKey]
    }

    if (typeof item === 'string') key = item

    return key || 0
  }, [rowKey])

  let displayTable = data.length > 1
  if (keepTableDisplay) displayTable = true

  return <div className={style.container}>
    <div className="table-mobile">
      {data.map((item, dataIndex) => {
        const key = getRowKeyValue(item, dataIndex)
        return <div key={key}>
          {headers.map((header, headerIndex) => {
            let value = item[header.key]
            if (typeof (header.render) === 'function') {
              value = header.render(value, item, dataIndex)
            }

            return <div key={headerIndex}>
              <div>{header.title}</div>
              <div>{value}</div>
            </div>
          })}
        </div>
      })}
    </div>
    <div className="table-desktop">
      <table>
        {displayTable && <thead>
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
        <tbody style={loadingStyle} className={!displayTable ? 'td-100' : ''}>
          {!displayTable && data.length === 1 && <>
            {headers.map((header, index) => {
              const item = data[0]
              let value = item[header.key]
              if (typeof (header.render) === 'function') {
                value = header.render(value, item, 0)
              }

              return <tr key={index}>
                <th>{header.title}</th>
                <td>{value}</td>
              </tr>
            })}
          </>}
          {displayTable && data.map((item, dataIndex) => {
            const key = getRowKeyValue(item, dataIndex)
            let className = null
            if (typeof rowClassName === `function`) {
              className = rowClassName(item, dataIndex)
            }

            return <tr key={key} className={className}>
              {headers.map((header, headerIndex) => {
                let value = item[header.key]
                if (typeof (header.render) === 'function') {
                  value = header.render(value, item, dataIndex)
                }
                return <td key={headerIndex}>{value}</td>
              })}
            </tr>
          })}
        </tbody>
      </table>
    </div>
  </div>
}

export default TableFlex
