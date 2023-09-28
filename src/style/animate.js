import { keyframes } from "goober"

export const scaleOnHover = (props) => {
  let { scale, duration } = props || {}
  if (!scale) scale = '.98'
  if (!duration) duration = '.25s'

  return `
    transition: ${duration} transform;

    &:hover {
      transform: scale(${scale});
    }
  `
}

const bounceInKeyframes = keyframes`
  0% {
    transform: scale(0);
    animation-timing-function: ease-in;
    opacity: 0;
  }
  38% {
    transform: scale(1);
    animation-timing-function: ease-out;
    opacity: 1;
  }
  55% {
    transform: scale(0.7);
    animation-timing-function: ease-in;
  }
  72% {
    transform: scale(1);
    animation-timing-function: ease-out;
  }
  81% {
    transform: scale(0.84);
    animation-timing-function: ease-in;
  }
  89% {
    transform: scale(1);
    animation-timing-function: ease-out;
  }
  95% {
    transform: scale(0.95);
    animation-timing-function: ease-in;
  }
  100% {
    transform: scale(1);
    animation-timing-function: ease-out;
  }
`

export const bounceIn = (duration) => `
  animation: ${bounceInKeyframes} ${duration}s both;
`