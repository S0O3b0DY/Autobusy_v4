
import { createBrowserRouter } from 'react-router-dom'
import { lazy, Suspense } from "react"

const App = lazy(() => import("./pages/App"))
import PreviewPage from './pages/PreviewPage'
import HomePage from './pages/HomePage'
import NotFoundPage from './pages/NotFoundPage'
import ErrorPage from './pages/ErrorPage'
import Policy from './pages/Policy'
import LinesDesc from './pages/LinesDesc'
import LoginPage from './pages/Login'

export const router = createBrowserRouter([
  { path: '/',        element: <HomePage />,     errorElement: <ErrorPage /> },
  { path: '/logowanie',        element: <LoginPage />,     errorElement: <ErrorPage /> },
  { path: '/app',        element: <App />,     errorElement: <ErrorPage /> },
  { path: '/preview', element:  <PreviewPage />, errorElement: <ErrorPage /> },
  { path: '/polityka-prywatnosci', element:  <Policy />, errorElement: <ErrorPage /> },
  { path: '/spis-linii', element:  <LinesDesc />, errorElement: <ErrorPage /> },
  { path: '*',        element: <NotFoundPage /> },
])
