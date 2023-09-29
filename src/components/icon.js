import '@fortawesome/fontawesome-free/css/fontawesome.css'
import '@fortawesome/fontawesome-free/css/solid.css'


function Icon(props) {
  const { name, className = ``, ...restProps } = props
  return <i className={`fa-solid fa-${name} ${className}`} {...restProps} />
}

export default Icon
