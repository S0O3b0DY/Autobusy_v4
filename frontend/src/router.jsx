
import { createBrowserRouter } from 'react-router-dom'
import { lazy, Suspense } from "react"

const HomePage = lazy(() => import("./pages/HomePage"))
import PreviewPage from './pages/PreviewPage'
import NotFoundPage from './pages/NotFoundPage'
import ErrorPage from './pages/ErrorPage'
import Policy from './pages/Policy'
import LinesDesc from './pages/LinesDesc'

export const router = createBrowserRouter([
  { path: '/',        element: <HomePage />,     errorElement: <ErrorPage /> },
  { path: '/preview', element:  <PreviewPage />, errorElement: <ErrorPage /> },
  { path: '/polityka-prywatnosci', element:  <Policy />, errorElement: <ErrorPage /> },
  { path: '/spis-linii', element:  <LinesDesc />, errorElement: <ErrorPage /> },
  { path: '*',        element: <NotFoundPage /> },
])
