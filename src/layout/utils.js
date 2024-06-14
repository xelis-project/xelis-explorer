import { Helmet } from 'react-helmet-async'
import { preloadSVG, preloadIMG } from 'g45-react/utils/preload'

import noiseUrl from '../../assets/noise.jpg'
import logoBlackUrl from '../../assets/black_background_white_logo.svg'
import logoWhiteUrl from '../../assets/white_background_black_logo.svg'
import faviconUrl from '../../assets/favicon.ico'

export const favicon = () => {
  return <link rel="icon" href={faviconUrl} sizes="any" />
}

export const PreloadAssets = () => {
  return <Helmet>
    {preloadSVG(logoBlackUrl)}
    {preloadSVG(logoWhiteUrl)}
    {preloadIMG(noiseUrl)}
  </Helmet>
}