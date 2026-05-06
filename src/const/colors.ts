import type { StopIconType } from "../types"

const STOP_ICON_COLORS: Record<StopIconType, [string, string]> = {
  default:  ['rgba(255,234,0,1)',  'rgba(224,191,0,1)' ],
  selected: ['rgba(54,215,255,1)', 'rgba(27,187,227,1)'],
  first:    ['rgba(0,204,24,1)',   'rgba(0,176,0,1)'   ],
  last:     ['rgb(224, 58, 41)',  'rgba(179,32,32,1)' ],
}

// TODO: kolorki
const VEHICLE_COLORS = {
  light: {
    defaultBus: "#18295e",
    selectedBus: "#084202",
    busGroup: "#2a4aa3",

    defaultTram: "#7e2014",
    selectedTram: "#084202",
    tramGroup: "#af4202",
  },

  dark: {
    defaultBus: "#18295e",
    selectedBus: "#084202",
    busGroup: "#2a4aa3",

    defaultTram: "#7e2014",
    selectedTram: "#084202",
    tramGroup: "#af4202",
  }
}

export { STOP_ICON_COLORS, VEHICLE_COLORS }