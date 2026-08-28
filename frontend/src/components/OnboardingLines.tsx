// Copyright (c) 2026 Szymon Piera. All rights reserved.
// Wszelkie prawa zastrzeżone.

// hooks
import { useState, useEffect } from 'react'
import { useAppStore } from "../lib/store"
import { useAuth } from "../contexts/AuthContext"

// components
import { Trash, Checks, Bus, Train } from "@boxicons/react"

// types
// constants
// other
import clsx from "clsx"
import { getUserJWTToken } from "../utils"
import { doc, setDoc } from "firebase/firestore"
import { dbF } from '../lib/firebase.ts'

export default function OnboardingLines() {
  const { userLoggedIn, user } = useAuth()
  const {liveVehiclesList, shownLines, setShownLines, setLiveVehiclesList} = useAppStore()

  const [activeTab, setActiveTab] = useState<'buses' | 'trams'>('buses')

  const currentList = liveVehiclesList[activeTab]
  
  useEffect(() => {
    async function fetchLiveVehiclesList() {
      await fetch(`https://v2.szymon-pira.workers.dev/${await getUserJWTToken()}:list`) // import.meta.env.VITE_API_URL_LINES_LIST
        .then(res => res.json())
        .then(data => setLiveVehiclesList(data))
    }
    if(liveVehiclesList.buses.length === 0) fetchLiveVehiclesList()
  }, [])

  useEffect(() => {
    const save = async () => {
      const userRef = doc(dbF, "users", user.uid)
      
      await setDoc(userRef, { shownLines: shownLines }, { merge: true })
    }
    
    if (!userLoggedIn) return
    save()
  }, [shownLines])

  function toggleLine(line: string) {
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

  // const restoreToDefaults = () => {
  //   setShownLines([])
  // }

  return (
    <>
      <h1 className="text-2xl md:text-3xl font-black text-neutral-900 dark:text-white mb-3 text-center md:text-left">
        Jakimi liniami podróżujesz?
      </h1>
      <p className="text-sm font-medium text-neutral-600 dark:text-zinc-400 mb-6 text-center md:text-left">
        Wybierz linie, z których korzystasz najczęściej.
      </p>

      {/* TABS */}
      <div className="py-3 px-1 border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white dark:bg-zinc-950/40">
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
            Autobusy
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
            Tramwaje
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA - GRID */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Actions bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/20">
          <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
            {activeTab === 'buses' ? "Linie autobusowe" : "Linie tramwajowe"}
          </span>
          <div className="flex gap-2">
            <button 
              onClick={selectAllCurrentTab}
              className="flex items-center gap-1 text-[11px] font-bold text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
            >
              <Checks size="xs" /> Zaznacz Wszystko
            </button>
            <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700" />
            <button 
              onClick={clearCurrentTab}
              className="flex items-center gap-1 text-[11px] font-bold text-zinc-500 dark:text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer"
            >
              <Trash size="xs" /> Wyczyść
            </button>
            {/* <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700" /> */}
            {/* <button 
              onClick={restoreToDefaults}
              className="flex items-center gap-1 text-[11px] font-bold text-zinc-500 dark:text-zinc-400 hover:text-green-500 dark:hover:text-green-400 transition-colors cursor-pointer"
            >
              <RotateCw size="xs" /> Zresetuj
            </button> */}
          </div>
        </div>

        {/* Grid of Lines */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
          <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-11 lg:grid-cols-13 gap-2">
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
                        ? "bg-blue-500 border-blue-500 text-white shadow-md shadow-blue-500/20 dark:shadow-blue-500/10" 
                        : "bg-[#7e2014] border-[#7e2014] text-white shadow-md shadow-orange-500/20 dark:shadow-orange-500/10"
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
    </>
  )
}
