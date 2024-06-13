import { Helmet } from 'react-helmet-async'

export const preloadSVG = (url) => {
  return <link rel="preload" as="image" href={url} type="image/svg+xml" />
}

export const preloadWOFF = (url) => {
  return <link rel="preload" href={url} as="font" type="font/woff" crossorigin />
}

export const preloadIMG = (url) => {
  return <link rel="preload" as="image" href={url} />
}

export const PreloadAssets = () => {
  return <Helmet>
    {preloadSVG('public/white_background_black_logo-U7YUP3YX.svg')}
    {preloadSVG('public/black_background_white_logo-YRF3CYQV.svg')}
    {preloadWOFF('public/fa-solid-900-7UFRKXGW.woff2')}
    {preloadWOFF('public/fa-brands-400-WYBTWVAN.woff2')}
  </Helmet>
}