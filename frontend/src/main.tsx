// Copyright (c) 2026 Szymon Piera. All rights reserved.
// Wszelkie prawa zastrzeżone.

import { StrictMode} from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
// @ts-ignore
import { router } from './router'
import posthog from 'posthog-js'
import { AuthProvider } from './contexts/AuthContext.tsx'
import './i18n/config.ts'

posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_KEY, {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
  person_profiles: 'identified_only',
  loaded: (posthog) => {  
    // @ts-ignore
    if (process.env.NODE_ENV === 'development') posthog.opt_out_capturing()  
  } 
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>,
)

