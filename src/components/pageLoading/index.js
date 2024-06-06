import { useEffect, useState } from 'react'
import { css } from 'goober'
import Icon from 'g45-react/components/fontawesome_icon'
import { useLang } from 'g45-react/hooks/useLang'

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
    z-index: 1;
  `,
  loading: css`
    background-color: rgb(0 0 0 / 70%);
    max-width: 300px;
    justify-content: center;
    align-items: center;
    display: flex;
    gap: 1em;
    border-radius: 15px;
    padding: 1em;
    color: white;
    font-weight: bold;
  `
}

function PageLoading(props) {
  const { loading, visibleAfter = 250, styling = defaultStyle, ...restProps } = props

  const { t } = useLang()
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
    <div className={styling.loading}>
      <Icon name="circle-notch" className="fa-spin" />
      <div>{t(`LOADING`)}</div>
    </div>
  </div>
}

export default PageLoading
