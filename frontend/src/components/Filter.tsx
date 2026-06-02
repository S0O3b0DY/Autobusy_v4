// Copyright (c) 2026 Szymon Piera. All rights reserved.
// Wszelkie prawa zastrzeżone.

// hooks
import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useAppStore, INIT_SHOWN_LINES } from "../lib/store"
import { useAuth } from "../contexts/AuthContext"

// components
import { Train, Bus, Trash, Checks, X, RotateCw } from "@boxicons/react"

// types
// constants
// other
import clsx from "clsx"
import { doc, setDoc } from "firebase/firestore"
import { dbF } from '../lib/firebase.ts'



export default function Filter() {
  const { userLoggedIn, user } = useAuth()
  const {liveVehiclesList, shownLines, setShownLines, setMenuState} = useAppStore()
  const { t } = useTranslation()

  // console.log(shownLines)
  // Lokalny stan tylko dla interfejsu (aktywna zakładka)
  const [activeTab, setActiveTab] = useState<'buses' | 'trams'>('buses')

  const toggleLine = (line: string) => {
    if (shownLines.includes(line)) {
      setShownLines(shownLines.filter(l => l !== line))
    } else {
      setShownLines([...shownLines, line])
    }
  }

  const selectAllCurrentTab = () => {
    const currentLines = liveVehiclesList[activeTab]
    // Wybieramy te, których jeszcze nie ma w tablicy
    const linesToAdd = currentLines.filter(line => !shownLines.includes(line))
    setShownLines([...shownLines, ...linesToAdd])
  }

  const clearCurrentTab = () => {
    const currentLines = liveVehiclesList[activeTab]
    // Zostawiamy tylko te linie, które NIE NALEŻĄ do aktualnej zakładki
    setShownLines(shownLines.filter(line => !currentLines.includes(line)))
  }

  const restoreToDefaults = () => {
    setShownLines(INIT_SHOWN_LINES)
  }

  const currentList = liveVehiclesList[activeTab]

  useEffect(() => {
    const save = async () => {
      const userRef = doc(dbF, "users", user.uid)
      
      await setDoc(userRef, { shownLines: shownLines }, { merge: true })
    }
    
    if (!userLoggedIn) return
    save()
  }, [shownLines])

  return (
    <div className="flex flex-col h-full font-sans antialiased text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-950 mb-10 overflow-hidden shadow-xl rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60">
      
      {/* HEADER */}
      <div className="px-4 py-3 flex items-center justify-between gap-3 bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200/50 dark:border-zinc-800/50">
        <h2 className="text-[15px] font-bold leading-none tracking-tight">
          {t('filter.title')}
        </h2>
        <button 
          onClick={() => setMenuState(0)}
          className="p-1.5 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-red-500 active:scale-95 transition-all shadow-sm shrink-0 cursor-pointer"
        >
          <X size="sm" />
        </button>
      </div>

      {/* TABS (Segmented Control) */}
      <div className="p-3 border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white dark:bg-zinc-950">
        <div className="flex bg-zinc-100 dark:bg-zinc-900/80 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('buses')}
            className={clsx(
              "flex-1 flex items-center justify-center gap-2 py-2 text-[13px] font-bold rounded-lg transition-all cursor-pointer",
              activeTab === 'buses' 
                ? "bg-white dark:bg-zinc-800 text-blue-500 shadow-sm" 
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
            )}
          >
            <Bus size="sm" />
            {t('filter.tabs.buses')}
          </button>
          <button
            onClick={() => setActiveTab('trams')}
            className={clsx(
              "flex-1 flex items-center justify-center gap-2 py-2 text-[13px] font-bold rounded-lg transition-all cursor-pointer",
              activeTab === 'trams' 
                ? "bg-white dark:bg-zinc-800 text-[#ce3723] shadow-sm" 
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
            )}
          >
            <Train size="sm" />
            {t('filter.tabs.trams')}
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA - GRID */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Actions bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/20">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
            {activeTab === 'buses' ? t('filter.labels.busLines') : t('filter.labels.tramLines')}
          </span>
          <div className="flex gap-2">
            <button 
              onClick={selectAllCurrentTab}
              className="flex items-center gap-1 text-[11px] font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
            >
              <Checks size="xs" /> {t('filter.actions.selectAll')}
            </button>
            <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700" />
            <button 
              onClick={clearCurrentTab}
              className="flex items-center gap-1 text-[11px] font-bold text-zinc-500 hover:text-red-500 transition-colors cursor-pointer"
            >
              <Trash size="xs" /> {t('filter.actions.clear')}
            </button>
            <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700" />
            <button 
              onClick={restoreToDefaults}
              className="flex items-center gap-1 text-[11px] font-bold text-zinc-500 hover:text-green-500 transition-colors cursor-pointer"
            >
              <RotateCw size="xs" /> {t('filter.actions.reset')}
            </button>
          </div>
        </div>

        {/* Grid of Lines */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
          <div className="grid grid-cols-6 sm:grid-cols-7 md:grid-cols-8 lg:grid-cols-9 gap-2">
            {currentList.map(line => {
              const isSelected = shownLines.includes(line)
              const isBus = activeTab === 'buses'
              
              return (
                <button
                  key={line}
                  onClick={() => toggleLine(line)}
                  className={clsx(
                    "flex items-center justify-center h-10 rounded-xl text-[14px] font-black tracking-tighter transition-colors active:scale-90 border cursor-pointer",
                    isSelected 
                      ? isBus 
                        ? "bg-blue-500 border-blue-500 text-white shadow-md shadow-blue-500/20" 
                        : "bg-[#7e2014] border-[#7e2014] text-white shadow-md shadow-orange-500/20"
                      : isBus
                        ? "bg-zinc-50 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10"
                        : "bg-zinc-50 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:border-[#7e2014] dark:hover:border-[#7e2014] hover:text-[#ce3723] hover:bg-orange-50 dark:hover:bg-[#7e2014]/10"
                  )}
                >
                  {line}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="px-4 py-3 border-t border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50/80 dark:bg-zinc-900/50 shrink-0">
        <p className="text-[12px] font-medium text-zinc-500 dark:text-zinc-400 text-center">
          {t('filter.footer.showing')}
          <span className="font-bold text-zinc-800 dark:text-zinc-100"> {t('filter.footer.linesCount', { count: shownLines.length })} </span>
          {t('filter.footer.onMap')}
        </p>
        <p className="text-[12px] font-medium text-zinc-500 dark:text-zinc-400 text-center mt-3">
          {t('filter.footer.warning')}
        </p>
      </div>

    </div>
  )
}

