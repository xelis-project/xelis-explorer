import { extendContext, createElementObject, createPathComponent } from '@react-leaflet/core'
import { glob } from 'goober'
import 'leaflet'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'

import theme from '../../style/theme'

// using theme.apply even if its the same colors
// easier to change later if we want to have specific colors
glob`
  .marker-cluster {
    color: white;
  }

  .marker-cluster-small {
    background-color: ${theme.apply({ xelis: '#3a7d1bba', dark: '#3a7d1bba', light: '#3a7d1bba' })};
  }

  .marker-cluster-small div {
    background-color: ${theme.apply({ xelis: '#3a7d1b', dark: '#3a7d1b', light: '#3a7d1b' })};
  }

  .marker-cluster-medium {
    background-color: ${theme.apply({ xelis: '#3675c8ba', dark: '#3675c8ba', light: '#3675c8ba' })};
  }

  .marker-cluster-medium div {
    background-color: ${theme.apply({ xelis: '#3675c8', dark: '#3675c8', light: '#3675c8' })};
  }

  .marker-cluster-large {
    background-color: ${theme.apply({ xelis: '#be4d29bf', dark: '#be4d29bf', light: '#be4d29bf' })};
  }

  .marker-cluster-large div {
    background-color: ${theme.apply({ xelis: '#be4d29', dark: '#be4d29', light: '#be4d29' })};
  }
`

const createMarkerClusterGroup = (props, context) => {
  const { children, ...restProps } = props
  const markerClusterGroup = new L.MarkerClusterGroup(restProps)
  return createElementObject(
    markerClusterGroup,
    extendContext(context, { layerContainer: markerClusterGroup }),
  )
}

const updateMarkerCluster = () => {
  // nothing todo here
}

export default createPathComponent(createMarkerClusterGroup, updateMarkerCluster)