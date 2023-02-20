import Icon from './icon'
import { Link } from 'react-router-dom'

function Button(props) {
  const { type = 'submit', size = 1, icon, iconLocation = 'left', style, link, iconProps, ...restProps } = props

  const children = <>
    {icon && iconLocation === `left` && <Icon name={icon} {...iconProps} />}
    {props.children}
    {icon && iconLocation === `right` && <Icon name={icon} {...iconProps} />}
  </>

  if (link) {
    return <Link to={link} style={{ '--ggs': size, ...style }} {...restProps}>
      {children}
    </Link>
  }

  return <button type={type} style={{ '--ggs': size, ...style }} {...restProps}>
    {children}
  </button>
}

export default Button