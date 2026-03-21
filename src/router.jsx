import { createBrowserRouter } from 'react-router-dom'
import HomePage from './pages/HomePage'
import PreviewPage from './pages/PreviewPage'
import NotFoundPage from './pages/NotFoundPage'
import ErrorPage from './pages/ErrorPage'

export const router = createBrowserRouter([
  { path: '/',        element: <HomePage />,     errorElement: <ErrorPage /> },
  { path: '/preview', element:  <PreviewPage />, errorElement: <ErrorPage /> },
  { path: '*',        element: <NotFoundPage /> },
])