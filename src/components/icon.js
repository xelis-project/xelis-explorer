import '@fortawesome/fontawesome-free/css/fontawesome.css'
import '@fortawesome/fontawesome-free/css/solid.css'
import '@fortawesome/fontawesome-free/css/brands.css'

function Icon(props) {
  const { name, type = `solid`, className = ``, ...restProps } = props
  return <i className={`fa-${type} fa-${name} ${className}`} {...restProps} />
}

export default Icon
