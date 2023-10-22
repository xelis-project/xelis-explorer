import { useEffect, useRef } from 'react'
import { Chart as ChartJS } from 'chart.js/auto'

function ReactChart(props) {
  const { chartRef, config, style, ...restProps } = props

  const canvasRef = useRef()

  useEffect(() => {
    const ctx = canvasRef.current.getContext(`2d`)
    const chart = new ChartJS(ctx, config)
    chart.update()

    if (chartRef) chartRef.current = chart

    return () => {
      return chart.destroy()
    }
  }, [config])

  return <div style={{ position: `relative`, ...style }} {...restProps}>
    <canvas ref={canvasRef} style={{ maxWidth: `100%` }} />
  </div>
}

export default ReactChart