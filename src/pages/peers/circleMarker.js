import { createElementObject, createPathComponent, extendContext } from '@react-leaflet/core'
import { CircleMarker } from 'leaflet'

// we have to create or own CircleMarker because the updateCircle function is not correctly comparing the center array variable
// https://github.com/PaulLeCam/react-leaflet/blob/9be06c0c1bb1e355f468393ac31ecb19e9a1f20d/packages/core/src/circle.ts#L27

const createCircleMarker = (props, context) => {
  const { children, ...restProps } = props
  const { center, options } = restProps

  const marker = new CircleMarker(center, options)
  return createElementObject(
    marker,
    extendContext(context, { overlayContainer: marker }),
  )
}

const updateCircle = (instance, props, prevProps) => {
  if (props.center.toString() !== prevProps.center.toString()) {
    instance.setLatLng(props.center)
  }

  if (props.radius != null && props.radius !== prevProps.radius) {
    instance.setRadius(props.radius)
  }
}

export default createPathComponent(createCircleMarker, updateCircle)