import { useState, useEffect } from "react"

interface WindowSize {
  _width: number
  _height: number
}

export function useWindowSize(): WindowSize {
  const [size, setSize] = useState<WindowSize>({
    _width: window.innerWidth,
    _height: window.innerHeight,
  })

  useEffect(() => {
    const handler = () => {
      setSize({
        _width: window.innerWidth,
        _height: window.innerHeight,
      })
    }

    window.addEventListener("resize", handler)
    return () => window.removeEventListener("resize", handler)
  }, [])

  return size
}