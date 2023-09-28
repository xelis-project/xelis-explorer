const colors = {
  xelis: {
    sync: `#32C732`,
    normal: '#FAC898',
    side: '#5581AA',
    orphaned: '#FF6961'
  },
  light: {
    sync: '#32C732',
    normal: '#FAC898',
    side: '#5581AA',
    orphaned: '#FF6961'
  },
  dark: {
    sync: '#32C732',
    normal: '#FAC898',
    side: '#5581AA',
    orphaned: '#FF6961'
  }
}

const value = (theme, blockType) => {
  return colors[theme][blockType.toLowerCase()]
}

const types = ['sync', 'normal', 'side', 'orphaned']

export default { colors, types, value }
