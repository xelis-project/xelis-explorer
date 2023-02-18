import DotLoading from '../dotLoading'

function TableBody(props) {
  const { children, loading, err, colSpan } = props

  const listBodyStyle = loading ? { opacity: .5 } : {}

  return <>
    <tbody>
      <tr>
        {loading && <td colSpan={colSpan}>
          loading<DotLoading />
        </td>}
        {err && <td colSpan={colSpan} style={{ color: `var(--error-color)` }}>
          {err.message}
        </td>}
      </tr>
    </tbody>
    <tbody style={listBodyStyle}>
      {children}
    </tbody>
  </>
}

export default TableBody
