import { Link } from 'react-router-dom'
import Icon from 'g45-react/components/fontawesome_icon'

function Button(props) {
  const { type = 'submit', icon, loading, loadingIcon = 'spinner', iconLocation = 'left', link, iconProps, ...restProps } = props

  const children = <>
    {icon && iconLocation === `left` && <>
      {!loading && <Icon name={icon} {...iconProps} />}
      {loading && <Icon name={loadingIcon} />}
    </>}
    {props.children}
    {icon && iconLocation === `right` && <>
      {!loading && <Icon name={icon} {...iconProps} />}
      {loading && <Icon name={loadingIcon} />}
    </>}
  </>

  if (link) {
    return <Link to={link} {...restProps}>
      {children}
    </Link>
  }

  return <button type={type} {...restProps}>
    {children}
  </button>
}

export default Button