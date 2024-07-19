import { useMemo } from 'react'
import Icon from 'g45-react/components/fontawesome_icon'
import { useLang } from 'g45-react/hooks/useLang'

import Dropdown from '../../components/dropdown'
import useTheme from '../../hooks/useTheme'

function ThemeDropdown(props) {
  const { size } = props
  const { theme: currentTheme, setTheme } = useTheme()
  const { t } = useLang()

  const themes = useMemo(() => {
    return [
      { key: `xelis`, text: <><Icon name="palette" />&nbsp;&nbsp;{t(`Default`)}</> },
      { key: `dark`, text: <><Icon name="moon" />&nbsp;&nbsp;{t(`Dark`)}</> },
      { key: `light`, text: <><Icon name="sun" />&nbsp;&nbsp;{t(`Light`)}</> }
    ]
  }, [t])

  return <Dropdown items={themes} value={currentTheme} onChange={(item) => {
    setTheme(item.key)
  }} />
}

export default ThemeDropdown
