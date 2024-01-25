import { BlockType } from '@xelis/sdk/daemon/types'

const colors = {
  xelis: {
    [BlockType.Sync]: `#32C732`,
    [BlockType.Normal]: '#FAC898',
    [BlockType.Side]: '#5581AA',
    [BlockType.Orphaned]: '#FF6961'
  },
  light: {
    [BlockType.Sync]: '#32C732',
    [BlockType.Normal]: '#FAC898',
    [BlockType.Side]: '#5581AA',
    [BlockType.Orphaned]: '#FF6961'
  },
  dark: {
    [BlockType.Sync]: '#32C732',
    [BlockType.Normal]: '#FAC898',
    [BlockType.Side]: '#5581AA',
    [BlockType.Orphaned]: '#FF6961'
  }
}

export const getBlockColor = (theme, blockType) => {
  return colors[theme][blockType]
}
