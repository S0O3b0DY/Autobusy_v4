// Copyright (c) 2026 Szymon Piera. All rights reserved.
// Wszelkie prawa zastrzeżone.

import type { StopIconType } from "../types"

const STOP_ICON_COLORS: Record<StopIconType, [string, string]> = {
  default:  ['rgba(255,234,0,1)',  'rgba(224,191,0,1)' ],
  selected: ['rgba(54,215,255,1)', 'rgba(27,187,227,1)'],
  first:    ['rgba(0,204,24,1)',   'rgba(0,176,0,1)'   ],
  last:     ['rgb(224, 58, 41)',  'rgba(179,32,32,1)' ],
}

const VEHICLE_COLORS = {
  light: {
    defaultBus: "#18295eee",
    selectedBus: "#084202ee",
    busGroup: "#2a4aa3ee",

    defaultTram: "#7e2014ee",
    selectedTram: "#084202ee",
    tramGroup: "#af4202ee",
  },

  dark: {
    defaultBus: "#222222ee",
    selectedBus: "#084202ee",
    busGroup: "#448041ee",

    defaultTram: "#913911ee",
    selectedTram: "#084202ee",
    tramGroup: "#a4935dee",
  }
}

export { STOP_ICON_COLORS, VEHICLE_COLORS }