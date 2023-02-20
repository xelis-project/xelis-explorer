function Icon(props) {
  const { name, className = ``, ...restProps } = props
  return <i className={`gg-${name} ${className}`} {...restProps} />
}

export default Icon
