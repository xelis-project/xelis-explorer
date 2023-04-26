import DotLoading from '../dotLoading'

function TableBody(props) {
  const { list = [], onItem, loading, err, colSpan, emptyText = `No items` } = props

  const listBodyStyle = loading ? { opacity: .5, userSelect: 'none' } : {}

  return <>
    <tbody>
      <tr>
        {loading && <td colSpan={colSpan}>
          loading<DotLoading />
        </td>}
        {err && <td colSpan={colSpan} style={{ color: `var(--error-color)` }}>
          {err.message}
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
