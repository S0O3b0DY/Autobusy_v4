
// hooks
import { useEffect, useRef } from 'react'
import { useRouteError, isRouteErrorResponse } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

// components
// types
// constants
// other
import { gsap } from 'gsap'



export default function ErrorPage() {
  const ref = useRef(null)
  const error = useRouteError()

  const { t } = useTranslation()

  const message = isRouteErrorResponse(error)
    ? error.statusText
    : error instanceof Error
      ? error.message
      : 'Nieznany błąd aplikacji'

  const code = isRouteErrorResponse(error) ? error.status : 500

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('[data-el]', {
        opacity: 0,
        y: 16,
        duration: 0.5,
        stagger: 0.08,
        ease: 'power2.out',
      })
    }, ref)
    return () => ctx.revert()
  }, [])

  return (
    <div ref={ref} className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col items-center justify-center px-6 text-center">

      <div data-el className="font-mono text-[10rem] font-semibold leading-none text-zinc-100 dark:text-zinc-900 select-none pointer-events-none">
        {code}
      </div>

      <div className="-mt-8 relative z-10 space-y-3">
        <p data-el className="font-mono text-xs text-red-400 uppercase tracking-widest">
          {t('error.tag')}
        </p>
        <h1 data-el className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          {t('error.title')}
        </h1>

        <div data-el className="inline-flex items-start gap-2 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900 max-w-sm">
          <span className="text-red-400 mt-0.5 text-xs">✕</span>
          <code className="font-mono text-xs text-red-600 dark:text-red-400 text-left break-all">
            {message}
          </code>
        </div>

        <div data-el className="pt-2 flex flex-wrap gap-2 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
          >
            ↺ {t('error.refresh')}
          </button>
          <a
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors"
          >
            ← {t('error.home')}
          </a>
        </div>
      </div>

      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: `
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />
    </div>
  )
}
