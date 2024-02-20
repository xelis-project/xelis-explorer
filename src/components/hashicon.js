import { useEffect, useState } from 'react'

function Hashicon(props) {
  const { value, size, options } = props
  const [hashicon, setHashicon] = useState()
  const [img, setImg] = useState()

  useEffect(() => {
    const load = async () => {
      const hashicon = await import('@emeraldpay/hashicon')
      setHashicon(hashicon)
    }

    load()
  }, [])

  useEffect(() => {
    if (!hashicon) return
    const canvas = hashicon.hashicon(value, { size, ...options })
    setImg(canvas.toDataURL())
  }, [hashicon, value, size, options])

  if (img) {
    return <img src={img} alt={value} width={size} />
  }

  return null
}

export default Hashicon