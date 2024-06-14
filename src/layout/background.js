import { css } from 'goober'

import theme from '../style/theme'
import noiseUrl from '../../assets/noise.jpg'

const style = {
  darker: css`
    position: absolute;
    background: black;
    opacity: 0.1;
    min-width: 100%;
    min-height: 100%;
    width: 100vw;
    height: 100vh;
  `,
  noise: css`
    position: absolute;
    min-width: 100%;
    min-height: 100%;
    width: 100vw;
    height: 100vh;
    background-image: url('${noiseUrl}');
    opacity: 0.06;
  `,
  circle: css`
    position: absolute;
    border-radius: 50%;
    top: -34.4444444444vh;
    left: -12.2395833333vw;
    width: 79.21875vw;
    height: 120vw;
    max-height: 100%;
    background: ${theme.apply({
    light: 'linear-gradient(180deg, rgb(203 203 203 / 28%) 0%, rgba(0,0,0,0) 100%)',
    dark: 'linear-gradient(180deg, rgb(59 59 59 / 15%) 0%, rgba(0,0,0,0) 100%)',
    xelis: `linear-gradient(180deg, rgb(0 139 170 / 15%) 0%, rgba(0,0,0,0) 100%)`
  })};
  `,
  midLight: css`
    position: absolute;
    border-radius: 50%;
    top: 26.4444444444vh;
    left: 47.0833333333vw;
    width: 50vw;
    height: 59.8888888889vh;
    background: ${theme.apply({ light: 'rgb(221 221 221 / 60%)', dark: 'rgb(107 107 107 / 50%)', xelis: `rgb(0 170 129 / 80%)` })};
    filter: blur(12.7604166667vw);
  `,
  topLight: css`
    position: absolute;
    border-radius: 50%;
    top: -19.6666666667vh;
    left: 18.125vw;
    width: 91.25vw;
    height: 65.8888888889vh;
    background: ${theme.apply({ light: 'rgb(213 213 213 / 40%)', dark: 'rgb(49 49 49 / 40%)', xelis: `rgb(0 170 150 / 40%)` })};
    filter: blur(12.7604166667vw);
  `,
  rightLight: css`
    position: absolute;
    border-radius: 50%;
    top: 0;
    left: 65.2604166667vw;
    width: 57.4479166667vw;
    height: 100%;
    background: ${theme.apply({ light: 'rgb(165 165 165 / 70%)', dark: 'rgb(22 22 22 / 70%)', xelis: `rgb(5 124 132 / 70%)` })};
    filter: blur(11.9791666667vw);
  `
}

function Background() {
  return <div>
    <div className={style.noise} />
    <div className={style.circle} />
    <div className={style.midLight} />
    <div className={style.topLight} />
    <div className={style.rightLight} />
    <div className={style.darker} />
  </div>
}

export default Background