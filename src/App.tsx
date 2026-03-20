import { useTheme } from './hooks/useTheme'

export default function App() {
  const { dark, toggle } = useTheme()

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900 text-black dark:text-white">
      <button onClick={toggle}>{dark ? 'Light' : 'Dark'}</button>
    </div>
  )
}
