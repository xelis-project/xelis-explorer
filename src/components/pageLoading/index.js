import { useEffect, useState } from 'react'
import DotLoading from '../dotLoading'
import Icon from '../icon'

function PageLoading(props) {
  const { loading, visibleAfter = 250 } = props

  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(false)

    let timeoutId = setTimeout(() => {
      if (loading) setVisible(true)
    }, visibleAfter)

    return () => clearTimeout(timeoutId)
  }, [visibleAfter, loading])

  if (!visible) return null

  return <div className="page-loading">
    <Icon name="spinner" />
    <div>loading<DotLoading /></div>
  </div>
}

export default PageLoading
