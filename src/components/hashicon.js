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

  {/* Keep empty div sized. So an element does not have to resize when the image is rendered. Avoid flickers. */}
  return <div style={{ width: size, height: size }} />
}

export default Hashicon