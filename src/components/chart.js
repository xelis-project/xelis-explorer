import { useEffect, useRef } from 'react'
import { Chart } from 'chart.js/auto'

function ReactChart(props) {
  const { chart, style, ...restProps } = props

  const chartRef = useRef()

  useEffect(() => {
    const ctx = chartRef.current.getContext(`2d`)
    const _chart = new Chart(ctx, chart)


  }, [])

  return <div style={{ position: `relative`, ...style }} {...restProps}>
    <canvas ref={chartRef} style={{ maxWidth: `100%` }} />
  </div>
}

export default ReactChart