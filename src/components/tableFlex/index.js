import { css } from 'goober'
import { useCallback, Fragment } from 'react'

import DotLoading from '../dotLoading'
import theme from '../../style/theme'
import { displayError } from '../../utils'

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

export const defaultStyle = {
  mobile: css`
    display: flex;
    gap: 1em;
    flex-direction: column;

    > div {
      width: 100%;
      display: flex;
      gap: 1em;
      flex-direction: column;
      background-color: var(--table-td-bg-color);
      padding: 1em;
      border-top: .5em solid var(--table-th-bg-color);
      border-radius: .5em;

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
  `,
  hide: css`
    display: none;

    ${theme.query.minDesktop} {
      display: block;
    }
  `,
  desktop: css`
    overflow: auto;
    border-radius: .5em;

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
      vertical-align: middle;
      background-color: var(--table-th-bg-color);
      color: ${theme.apply({ xelis: 'var(--bg-color)', dark: '#f1f1f1', light: '#1c1c1c' })};
    }

    table thead tr {
      background-color: var(--table-th-bg-color);
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
      background-color: var(--table-td-bg-color);
      padding: .8em 1em;
      color: var(--muted-color);
      vertical-align: middle;
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

    table tbody.td-100 
  `,
  fullWidthTd: css`
    td {
      width: 100%;
      word-break: break-all;
      white-space: pre-wrap;
    }
  `,
  errorText: css`
    color: red !important;
  `
}

function TableFlex(props) {
  const { headers = [], data = [], rowClassName, rowBefore, rowKey, loading, err,
    emptyText = `No items`, mobileFormat = true, keepTableDisplay = false, styling = defaultStyle } = props

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

  return <div>
    {mobileFormat && <div className={styling.mobile}>
      {!err && !loading && data.map((item, dataIndex) => {
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
      {loading && <div>
        loading<DotLoading />
      </div>}
      {err && <div className={styling.errorText}>
        {displayError(err)}
      </div>}
      {!err && !loading && data.length === 0 && <div>
        {emptyText}
      </div>}
    </div>}
    <div className={`${styling.desktop} ${mobileFormat ? styling.hide : ``}`}>
      <table>
        {(displayTable || data.length !== 1) && <thead>
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
            {err && <td colSpan={colSpan} className={styling.errorText}>
              {displayError(err)}
            </td>}
            {!err && !loading && data.length === 0 && <td colSpan={colSpan}>
              {emptyText}
            </td>}
          </tr>
        </tbody>
        <tbody style={loadingStyle} className={!displayTable ? styling.fullWidthTd : ''}>
          {!displayTable && data.length === 1 && <>
            {headers.map((header, index) => {
              const item = data[0]
              let value = item[header.key]
              if (typeof header.render === `function`) {
                value = header.render(value, item, 0)
              }

              return <tr key={index}>
                <th>{header.title}</th>
                <td>{value}</td>
              </tr>
            })}
          </>}
          {!err && displayTable && data.map((item, dataIndex) => {
            const key = getRowKeyValue(item, dataIndex)
            let className = null
            if (typeof rowClassName === `function`) {
              className = rowClassName(item, dataIndex)
            }

            let before = null
            if (typeof rowBefore === `function`) {
              before = rowBefore(item, dataIndex)
            }

            return <Fragment key={key}>
              {before}
              <tr className={className}>
                {headers.map((header, headerIndex) => {
                  let value = item[header.key]
                  if (typeof (header.render) === 'function') {
                    value = header.render(value, item, dataIndex)
                  }
                  return <td key={headerIndex}>{value}</td>
                })}
              </tr>
            </Fragment>
          })}
        </tbody>
      </table>
    </div>
  </div>
}

export default TableFlex
