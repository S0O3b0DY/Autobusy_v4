
import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { useTranslation } from 'react-i18next'

export default function NotFoundPage() {
  const ref = useRef(null)
  const { t } = useTranslation()
  

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
        404
      </div>

      <div className="-mt-8 relative z-10 space-y-3">
        <p data-el className="font-mono text-xs text-sky-500 uppercase tracking-widest">
          {t('notFound.tag')}
        </p>
        <h1 data-el className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          {t('notFound.title')}
        </h1>
        <p data-el className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto">
          {t('notFound.description')}
        </p>
        <div data-el className="pt-2">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors"
          >
            ← {t('notFound.home')}
          </a>
        </div>
      </div>

      {/* Dekoracyjna siatka */}
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
