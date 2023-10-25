import { useEffect, useState } from 'react'
import { css } from 'goober'

import Icon from '../icon'

const defaultStyle = {
  container: css`
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    align-items: center;
    justify-content: center;

    > div {
      background-color: rgb(0 0 0 / 50%);
      max-width: 300px;
      justify-content: center;
      align-items: center;
      display: flex;
      gap: .5em;
      border-radius: 15px;
      padding: 1em;
      color: white;
    }
  `
}

function PageLoading(props) {
  const { loading, visibleAfter = 250, styling = defaultStyle, ...restProps } = props

  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(false)

    let timeoutId = setTimeout(() => {
      if (loading) setVisible(true)
    }, visibleAfter)

    return () => clearTimeout(timeoutId)
  }, [visibleAfter, loading])

  if (!visible) return null

  return <div className={styling.container} {...restProps}>
    <div>
      <Icon name="circle-notch" className="fa-spin" />
      <div>loading</div>
    </div>
  </div>
}

export default PageLoading
