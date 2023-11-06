import { useMemo } from 'react'
import { useLang } from 'g45-react/hooks/useLang'

import Dropdown from '../../components/dropdown'
import FlagIcon from '../../components/flagIcon'

function LangDropdown(props) {
  const { size } = props
  const { t, langKey, setLangKey } = useLang()

  const languages = useMemo(() => {
    return [
      { key: `en`, text: <><FlagIcon code="us" />&nbsp;&nbsp;{t(`English`)}</> },
      { key: `fr`, text: <><FlagIcon code="fr" />&nbsp;&nbsp;{t(`French`)}</> },
      { key: `es`, text: <><FlagIcon code="es" />&nbsp;&nbsp;{t(`Spanish`)}</> }
    ]
  }, [t])

  return <Dropdown items={languages} value={langKey || `en`} size={size} onChange={(item) => {
    setLangKey(item.key)
  }} />
}

export default LangDropdown
