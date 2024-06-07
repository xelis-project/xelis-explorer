import React from 'react'
import { css } from 'goober'

const style = {
  container: css`
    position: absolute;
    display: flex;
    width: 100%;
    justify-content: center;
    align-items: center;
    height: 100%;
    top: 0;
    z-index: 999;
  `,
  content: css`
    background-color: black;
    padding: .5em;
    border-radius: .5em;
    display: flex;
    gap: .25em;

    > :nth-child(1) {
      animation-delay: 0;
    }

    > :nth-child(2) {
      animation-delay: .25s;
    }

    > :nth-child(3) {
      animation-delay: .5s;
    }

    @keyframes scale {
      0% {
        transform: scaleY(1);
      }
      20% {
        transform: scaleY(.8);
      }
      40% {
        transform: scaleY(1);
      }
    }
  `,
  line: css`
    width: .5em;
    height: 1.5em;
    background-color: white;
    border-radius: .5em;
    animation-name: scale;
    animation-duration: .75s;
    animation-iteration-count: infinite;
  `
}

function MapLoad(props) {
  const { loading } = props
  if (!loading) return

  return <div className={style.container}>
    <div className={style.content}>
      <div className={style.line} />
      <div className={style.line} />
      <div className={style.line} />
    </div>
  </div>
}

export default MapLoad
