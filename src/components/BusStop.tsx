
import { useAppStore } from "../lib/store"

export default function BusStop() {
  const { selectedBusStop } = useAppStore()

  return (
    <div>BusStop, {selectedBusStop?.id} {selectedBusStop?.n}</div>
  )
}
