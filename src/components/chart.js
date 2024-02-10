import { forwardRef, useEffect, useRef } from 'react'
import { Chart as ChartJS } from 'chart.js/auto'

function ReactChart(props, ref) {
  const { type, options, data, style, ...restProps } = props

  const canvasRef = useRef()
  let chartRef = useRef()
  if (ref) chartRef = ref

  useEffect(() => {
    const ctx = canvasRef.current.getContext(`2d`)
    var chart = new ChartJS(ctx, { type, data, options })

    chart.update()
    chartRef.current = chart
    return () => {
      return chart.destroy()
    }
  }, [type])

  useEffect(() => {
    chartRef.current.data = data
    chartRef.current.update()
  }, [data])

  useEffect(() => {
    chartRef.current.options = options
    chartRef.current.update()
  }, [options])

  return <canvas ref={canvasRef} style={{ maxWidth: `100%`, ...style }} {...restProps} />
}

export default forwardRef(ReactChart)