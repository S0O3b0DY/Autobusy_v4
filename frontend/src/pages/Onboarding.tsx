// Copyright (c) 2026 Szymon Piera. All rights reserved.
// Wszelkie prawa zastrzeżone.

// hooks
import { useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import { useAuth } from "../contexts/AuthContext"
import { useNavigate, Navigate } from 'react-router-dom'

// components
import OnboardingLines from '../components/OnboardingLines.tsx'
import OnboardingStops from '../components/OnboardingStops.tsx'

// types
// constants
// other
import gsap from 'gsap'
import { doc, setDoc } from "firebase/firestore"
import { dbF } from '../lib/firebase.ts'



export default function Onboarding() {
  const { userLoggedIn, user, setOnboarding, onboarding } = useAuth()
  const [step, setStep] = useState<number>(0)
  const navigate = useNavigate()
  
  const trackRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    gsap.to(trackRef.current, {
      xPercent: -step * 50, // -0% dla step 0, -50% dla step 1
      duration: 0.5,
      ease: 'power3.out'
    })
  }, { dependencies: [step] })


  


  async function finishOnboarding() {
    if (!userLoggedIn) return

    const userRef = doc(dbF, "users", user.uid)
    await setDoc(userRef, { onboardingFinished: true }, { merge: true })
    setOnboarding(false)

    navigate("/app")
  }

  if (!onboarding) {
    return <Navigate to="/app" />
  }

  return (
    <div className="bg-bg-1 min-h-screen flex flex-col justify-between">
      <main className="px-3 max-w-7xl w-full mx-auto grow flex justify-center items-baseline pt-12">
        <div className="w-full overflow-hidden bg-white border-2 border-neutral-200 rounded-3xl py-8 px-6 md:p-12 shadow-xl max-w-200">        
          <div className="w-full overflow-hidden">
            <div ref={trackRef} className="flex w-[200%]">
              {/* EKRAN 1 */}
              <div className="w-1/2 box-border">
                <OnboardingLines />
              </div>

              {/* EKRAN 2 */}
              <div className="w-1/2 box-border">
                <OnboardingStops />
              </div>
            </div>  
          </div>

          {/* PRZYCISKI NAWIGACJI */}
          <div className="flex justify-between items-center pt-6 mt-4 border-t-2 border-neutral-100">
            {step > 0 ? (
              <button 
                type="button"
                onClick={() => setStep(0)} 
                className="py-2.5 px-5 border-2 border-neutral-200 rounded-lg font-bold text-sm text-neutral-700 hover:bg-neutral-50 hover:-translate-y-0.5 transition-transform cursor-pointer active:border-neutral-800"
              >
                Wstecz
              </button>
            ) : <div />}

            {step === 0 ? (
              <button 
                type="button"
                onClick={() => setStep(1)} 
                className="py-2.5 px-6 border-2 border-neutral-900 bg-neutral-900 text-white rounded-lg font-bold text-sm hover:bg-neutral-800 hover:-translate-y-0.5 transition-transform cursor-pointer active:translate-y-0 shadow-md ml-auto"
              >
                Dalej
              </button>
            ) : (
              <button 
                type="button"
                onClick={() => finishOnboarding()} 
                className="py-2.5 px-6 border-2 border-blue-600 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-500 hover:-translate-y-0.5 transition-transform cursor-pointer active:translate-y-0 shadow-md ml-auto"
              >
                Zatwierdź
              </button>
            )}
          </div>

        </div>
      </main>
    </div>
  )
}