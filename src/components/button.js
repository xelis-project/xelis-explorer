import Icon from './icon'

function Button(props) {
  const { children, type = 'submit', size = 1, icon, iconLocation = 'left', style, ...restProps } = props
  return <button type={type} style={{ '--ggs': size, ...style }} {...restProps}>
    {icon && iconLocation === `left` && <Icon name={icon} />}
    {children}
    {icon && iconLocation === `right` && <Icon name={icon} />}
  </button>
}

export default Button