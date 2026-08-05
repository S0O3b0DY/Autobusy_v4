// Copyright (c) 2026 Szymon Piera. All rights reserved.
// Wszelkie prawa zastrzeżone.

export default function LoadingSceduleColumn() {
  return (
    <div className="animate-pulse bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 h-48 p-3 flex flex-col gap-3">
      <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2 mx-auto" />
      <div className="space-y-2 mt-2">
        <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-full" />
        <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4" />
        <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-5/6" />
      </div>
    </div>
  )
}
