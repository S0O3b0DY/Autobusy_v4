import { useTheme } from '../hooks/useTheme'
import { useEffect, useRef } from "react"

import maplibregl, { Map as MapLibreMap, Marker, Popup } from "maplibre-gl"

import "maplibre-gl/dist/maplibre-gl.css"
import { osmProviders } from '../lib/osmProviders'
import type {  } from "../types"

export default function App() {
  // THEME
  const { isDark, toggle } = useTheme()

  // REF'S
  const mapContainer = useRef<HTMLDivElement | null>(null)
  const map = useRef<MapLibreMap | null>(null)
  const marker = useRef<Marker | null>(null)

  // STATE'S
  
  // USEEFFECT'S
  // load map
  useEffect(() => {
    if (map.current || !mapContainer.current) return
    
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      center: [19.49589069067231, 51.7323631400332],
      zoom: 11,
      style: "https://tiles.openfreemap.org/styles/liberty",
    })

    // Kontrolki nawigacji
    map.current.addControl(new maplibregl.NavigationControl(), "top-right")

    // Skala
    map.current.addControl(
      new maplibregl.ScaleControl({ unit: "metric" }),
      "bottom-left"
    )

    // Marker z popupem
    const popup = new Popup({ offset: 25 }).setHTML(
      "<h3>Kraków</h3><p>Witaj na mapie!</p>"
    )

    marker.current = new maplibregl.Marker({ color: "#e74c3c" })
      .setLngLat([19.49589069067231, 51.7323631400332])
      .setPopup(popup)
      .addTo(map.current)

    // Klik na mapę — loguje współrzędne
    map.current.on("click", (e) => {
      const { lng, lat } = e.lngLat
      console.log(`Kliknięto: ${lat.toFixed(5)}, ${lng.toFixed(5)}`)
    })

    return () => {
      marker.current?.remove()
      map.current?.remove()
      map.current = null
    }
  }, [])
  // change dark/light map style
  useEffect(() => {
    if (!map.current) return
    map.current.setStyle(isDark ? osmProviders.maptilerDark : osmProviders.OFMLiberty)
  }, [isDark])


  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900 text-black dark:text-white">
      <button className='absolute top-0 z-10 bg-red-700' onClick={() => toggle(isDark ? 'light' : 'dark')}>{isDark ? 'light' : 'dark'}</button>
      <div ref={mapContainer} className='w-full h-dvh'></div>
    </div>
  )
}
