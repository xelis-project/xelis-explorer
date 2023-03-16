import Icon from './icon'
import { Link } from 'react-router-dom'

function Button(props) {
  const { type = 'submit', icon, iconLocation = 'left', link, iconProps, ...restProps } = props

  const children = <>
    {icon && iconLocation === `left` && <Icon name={icon} {...iconProps} />}
    {props.children}
    {icon && iconLocation === `right` && <Icon name={icon} {...iconProps} />}
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