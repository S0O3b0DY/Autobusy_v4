// Copyright (c) 2026 Szymon Piera. All rights reserved.
// Wszelkie prawa zastrzeżone.

// hooks
import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

// components
import { Sun, Moon, ChevronDown, Check } from "@boxicons/react"

// types
// constants
// other
import gsap from 'gsap'




interface ThemeToggleProps {
  isDark: boolean;
  toggle: (theme: 'light' | 'dark' ) => void;
}

export default function ThemeToggle({ toggle, isDark }: ThemeToggleProps) {
  const { t } = useTranslation()

  const [dropdownShown, setDropDownShown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const arrowRef = useRef<HTMLDivElement>(null)


  useEffect(() => {
    if (dropdownShown) {
      gsap.fromTo(dropdownRef.current, 
        { opacity: 0, y: -10, scale: 0.95 }, 
        { opacity: 1, y: 0, scale: 1, duration: 0.2, ease: "power2.out" }
      )
      gsap.to(arrowRef.current, { rotate: 180, duration: 0.2 })
      
      gsap.fromTo(".theme-option", 
        { x: -10, opacity: 0 }, 
        { x: 0, opacity: 1, stagger: 0.05, delay: 0.05, duration: 0.15 }
      )
    } else {
      gsap.to(arrowRef.current, { rotate: 0, duration: 0.2 })
    }
  }, [dropdownShown])

  return (
    <div className="relative font-sans antialiased">
      {/* Główny przycisk */}
      <button
        onClick={() => setDropDownShown(prev => !prev)}
        className="group w-32 h-9 bg-white dark:bg-zinc-900 backdrop-blur-md 
                   hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-200 
                   dark:border-zinc-800 rounded-full px-3 flex items-center gap-2 
                   transition-all shadow-sm active:scale-95 z-10"
      >
        <div className="flex items-center justify-center text-blue-500 dark:text-blue-400">
          {isDark ? <Moon size="sm" /> : <Sun size="sm" />}
        </div>
        
        <span className="text-[13px] font-bold tracking-tight text-zinc-700 dark:text-zinc-200">
          {isDark ? t('theme.dark') : t('theme.light')}
        </span>

        <div ref={arrowRef} className="ml-auto text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200 transition-colors">
          <ChevronDown size="sm" />
        </div>
      </button>

      {/* Dropdown Menu */}
      {dropdownShown && (
        <>
          {/* Overlay do zamykania kliknięciem poza */}
          <div className="fixed inset-0 z-20" onClick={() => setDropDownShown(false)} />
          
          <div 
            ref={dropdownRef}
            className="absolute top-11 left-0 w-40 bg-white/95 dark:bg-zinc-900/95 
                       backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 
                       rounded-2xl shadow-2xl p-1.5 z-30 origin-top-left overflow-hidden"
          >
            <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest px-3 py-2">
              {t('theme.title')}
            </p>

            <div className="flex flex-col gap-0.5">
              <ThemeOption 
                label={t('theme.light')}
                icon={<Sun size="sm" />} 
                active={!isDark} 
                onClick={() => { toggle("light"); setDropDownShown(false); }} 
              />
              <ThemeOption 
                label={t('theme.dark')}
                icon={<Moon size="sm" />} 
                active={isDark} 
                onClick={() => { toggle("dark"); setDropDownShown(false); }} 
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function ThemeOption({ label, icon, active, onClick }: { label: string, icon: any, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`
        theme-option w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all
        ${active 
          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold' 
          : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'}
      `}
    >
      <span className={active ? "text-blue-500" : "text-zinc-400"}>{icon}</span>
      <span className="text-[13px] tracking-tight flex-1 text-left">{label}</span>
      {active && <Check size="xs" className="animate-in zoom-in duration-300" />}
    </button>
  )
}
