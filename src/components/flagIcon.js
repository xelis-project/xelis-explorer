import 'flag-icons/css/flag-icons.css'
import { glob } from 'goober'
// import country from 'flag-icons/country.json'

glob`
  .fi {
    position: inherit;
    border-radius: 3px;
  }
`

export default function (props) {
  const { code } = props
  return <i className={`fi fi-${code}`} />
}