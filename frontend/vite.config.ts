import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import Sitemap from 'vite-plugin-sitemap'
import { execSync } from 'child_process'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { blogData } from './src/const/blog'

const commitHash = execSync('git rev-parse --short HEAD').toString().trim()
const buildDate = new Date().toISOString().split('T')[0]

const dynamicRoutes = [
  ...blogData.map(blog => `/blog/${blog.link}`), 
  '/app', '/blog', '/jak-zainstalowac', '/o-projekcie', '/kontakt',
]

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'UrbanTransit',
        short_name: 'UrbanTransit',
        description: 'UrbanTransit',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    }),
    Sitemap({
      hostname: 'https://autobusy.web.app',
      exclude: ['google798b769421a36d65'],
      dynamicRoutes,
      generateRobotsTxt: true,
    })
  ],
  define: {
    __APP_VERSION__: JSON.stringify(commitHash),
    __BUILD_DATE__: JSON.stringify(buildDate),
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("maplibre-gl"))   return "maplibre"
          if (id.includes("react-dom"))     return "react-dom"
          if (id.includes("node_modules"))  return "vendor"
        }
      }
    },
    chunkSizeWarningLimit: 1512
  }
})
