import { useMemo } from 'react'
import { useLang } from 'g45-react/hooks/useLang'

import Dropdown from '../../components/dropdown'
import FlagIcon from '../../components/flagIcon'

function LangDropdown(props) {
  const { t, langKey, setLangKey } = useLang()

  const languages = useMemo(() => {
    return [
      { key: `en`, text: <><FlagIcon code="us" />&nbsp;&nbsp;{t(`English`)}</> },
      { key: `fr`, text: <><FlagIcon code="fr" />&nbsp;&nbsp;{t(`French`)}</> },
      { key: `es`, text: <><FlagIcon code="es" />&nbsp;&nbsp;{t(`Spanish`)}</> },
      { key: `de`, text: <><FlagIcon code="de" />&nbsp;&nbsp;{t(`German`)}</> },
      { key: `it`, text: <><FlagIcon code="it" />&nbsp;&nbsp;{t(`Italian`)}</> },
      { key: `id`, text: <><FlagIcon code="id" />&nbsp;&nbsp;{t(`Bahasa Indonesia`)}</> }
    ]
  }, [t])

  return <Dropdown items={languages} value={langKey || `en`} onChange={(item) => {
    setLangKey(item.key)
  }} />
}

export default LangDropdown
