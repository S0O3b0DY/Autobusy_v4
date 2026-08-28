// Copyright (c) 2026 Szymon Piera. All rights reserved.
// Wszelkie prawa zastrzeżone.

import { useEffect, useState, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, CalendarAlt, Clock, Share, Bookmark, Check, Flame, Tag } from '@boxicons/react'

import Header from '../components/Header'
import Footer from '../components/Footer'
import AppCTA from '../components/AppCTA'
import { blogData } from '../const/blog'
import { Helmet } from 'react-helmet'

const BOOKMARKS_STORAGE_KEY = 'urbanTransitBookmarkedPosts'

const CATEGORY_STYLES: Record<string, { badge: string; chip: string }> = {
  'Darmowe przejazdy': { badge: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  'Bilety i taryfy': { badge: 'bg-blue-500', chip: 'bg-blue-50 text-blue-700 border-blue-200' },
  'Zniżki i ulgi': { badge: 'bg-purple-500', chip: 'bg-purple-50 text-purple-700 border-purple-200' },
  'Utrudnienia i remonty': { badge: 'bg-red-500', chip: 'bg-red-50 text-red-700 border-red-200' },
  'Tabor i inwestycje': { badge: 'bg-amber-500', chip: 'bg-amber-50 text-amber-700 border-amber-200' },
  'Sieć i trasy': { badge: 'bg-cyan-500', chip: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  'Ciekawostki': { badge: 'bg-pink-500', chip: 'bg-pink-50 text-pink-700 border-pink-200' },
}
const DEFAULT_CATEGORY_STYLE = { badge: 'bg-neutral-800', chip: 'bg-neutral-100 text-neutral-700 border-neutral-200' }

function formatDate(iso: any) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function BlogPage() {
  const { link } = useParams<{ link: string }>()
  const navigate = useNavigate()

  // 1. Wyszukanie artykułu (poprawione porównanie `===`)
  const article = useMemo(() => blogData.find((item) => item.link === link), [link])

  // Powiązane artykuły (ta sama kategoria, z wyłączeniem aktualnego)
  const relatedPosts = useMemo(() => {
    if (!article) return []
    return blogData
      .filter((item) => item.category === article.category && item.id !== article.id)
      .slice(0, 3)
  }, [article])

  // Stan interakcji
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [copied, setCopied] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)

  // Ustawienie początkowych polubień oraz skrolowanie na górę
  useEffect(() => {
    window.scrollTo(0, 0)
    if (article) {
      // Sprawdź zakładki z LocalStorage
      try {
        const raw = window.localStorage.getItem(BOOKMARKS_STORAGE_KEY)
        if (raw) {
          const set = new Set(JSON.parse(raw))
          setIsBookmarked(set.has(article.id))
        }
      } catch (err) {
        console.error(err)
      }
    }
  }, [article, link])

  // Pasek postępu czytania
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight
      if (totalHeight > 0) {
        const progress = (window.scrollY / totalHeight) * 100
        setScrollProgress(Math.min(100, Math.max(0, progress)))
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Przełączanie zakładki
  const handleToggleBookmark = () => {
    if (!article) return
    try {
      const raw = window.localStorage.getItem(BOOKMARKS_STORAGE_KEY)
      const set = raw ? new Set(JSON.parse(raw)) : new Set()
      
      if (set.has(article.id)) {
        set.delete(article.id)
        setIsBookmarked(false)
      } else {
        set.add(article.id)
        setIsBookmarked(true)
      }

      window.localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify([...set]))
    } catch (err) {
      console.error('Błąd zapisu zakładki', err)
    }
  }

  // Udostępnianie
  const handleShare = async () => {
    if (!article) return
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title: article.title, text: article.excerpt, url })
        return
      } catch (err: any) {
        if (err?.name === 'AbortError') return
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Błąd kopiowania linku', err)
    }
  }

  // Obsługa braku artykułu (404)
  if (!article) {
    return (
      <>
        <Helmet>
          <title>Szukany artykuł nie istnieje lub został usunięty - UrbanTransit</title>
        </Helmet>

        <AppCTA />
        <Header />
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-20">
          <h1 className="text-4xl font-extrabold text-neutral-900 mb-2">404</h1>
          <p className="text-neutral-600 mb-6">Przepraszamy, szukany artykuł nie istnieje lub został usunięty.</p>
          <button
            onClick={() => navigate('/blog')}
            className="px-6 py-2.5 bg-neutral-900 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-neutral-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 fill-current" />
            Wróć do listy wpisów
          </button>
        </div>
        <Footer />
      </>
    )
  }

  const categoryStyle = CATEGORY_STYLES[article.category] || DEFAULT_CATEGORY_STYLE

  return (
    <>

      {/* PASEK POSTĘPU CZYTANIA */}
      <div 
        className="fixed z-2000 top-0 left-0 h-1 bg-blue-600 transition-all duration-150 w-[50vw]"
        style={{ width: `${scrollProgress}vw` }}
        />

      <AppCTA />
      <Header />

      <main className="mb-22 pt-30 max-w-4xl px-5 relative left-[50%] -translate-x-[50%]">
        <Helmet>
          <title>{article.title}</title>
        </Helmet>
        
        {/* POWRÓT & KATEGORIA */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 fill-current" />
            Wróć do bloga
          </button>

          <span className={`${categoryStyle.badge} text-white text-[11px] font-mono uppercase font-bold px-3 py-1 rounded-lg shadow-sm flex items-center gap-1.5`}>
            <Flame className="w-3.5 h-3.5 fill-current" />
            {article.category}
          </span>
        </div>

        {/* TYTUŁ & METADANE */}
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-neutral-900 tracking-tight leading-tight mb-4">
            {article.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-neutral-500 font-bold border-b border-neutral-200 pb-6">
            <span className="flex items-center gap-1.5">
              <CalendarAlt size="sm" />
              {formatDate(article.date).toUpperCase()}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Clock size="sm" />
              {article.readTime} MIN CZYTANIA
            </span>
          </div>
        </header>

        {/* BANER ARTYKUŁU */}
        <div className="relative w-full h-65 sm:h-100 rounded-2xl overflow-hidden border-2 border-neutral-300 mb-10 bg-neutral-900 shadow-md">
          <img
            src={`https://wsrv.nl/?url=${article.imgUrl}&w=1200&output=webp`}
            alt={article.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* GLÓWNA SIATKA TREŚCI & PASEK BOCZNY/STAWKA */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* PANEL INTERAKCJI DLA EKRANÓW DOKOWANY (MOBILNE) / SIDEBAR (DESKTOP) */}
          <aside className="lg:col-span-1 lg:flex lg:flex-col lg:items-center gap-4">
            <div className="sticky top-28 flex lg:flex-col items-center justify-around lg:justify-start gap-4 p-3 bg-white border-2 border-neutral-200 rounded-2xl shadow-sm">
              <button
                onClick={handleToggleBookmark}
                title="Zapisz wpis"
                className={`p-2.5 rounded-xl transition-colors cursor-pointer ${
                  isBookmarked ? 'text-blue-600 bg-blue-50' : 'text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
              >
                <Bookmark pack={isBookmarked ? 'filled' : 'basic'} className="w-5 h-5 fill-current" />
              </button>

              <button
                onClick={handleShare}
                title="Udostępnij"
                className="p-2.5 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-5 h-5 fill-emerald-600" /> : <Share className="w-5 h-5 fill-current" />}
              </button>
            </div>
          </aside>

          {/* TREŚĆ ARTYKUŁU */}
          <article className="lg:col-span-11">
            {/* LEAD / ZAJAWKA */}
            <p className="text-lg sm:text-xl text-neutral-700 font-medium leading-relaxed mb-8 border-l-4 border-blue-600 pl-4 py-1 italic bg-neutral-50 rounded-r-lg">
              {article.excerpt}
            </p>

            {/* DYNAMICZNA LUB STATYCZNA TREŚĆ */}
            <div className="space-y-6 text-neutral-800 text-base sm:text-lg leading-relaxed font-sans">
              {Object.values(article.text).map(p => <p>
                {p}
              </p>)}
            </div>

            {/* TAGI */}
            {article.tags && article.tags.length > 0 && (
              <div className="mt-10 pt-6 border-t border-neutral-200">
                <div className="flex items-center gap-2 mb-3 text-xs font-mono font-bold text-neutral-500 uppercase">
                  <Tag size="xs" />
                  Tagi wpisu:
                </div>
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag: string) => (
                    <span key={tag} className={`text-xs font-mono px-3 py-1 rounded-lg border ${categoryStyle.chip}`}>
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </article>
        </div>

        {/* SEKCJA: POWIĄZANE ARTYKUŁY */}
        {relatedPosts.length > 0 && (
          <section className="mt-20 pt-12 border-t-2 border-neutral-200">
            <h3 className="text-2xl font-extrabold text-neutral-900 mb-6">Zobacz też inne wpisy</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((item) => (
                <Link
                  key={item.id}
                  to={`/blog/${item.link}`}
                  className="bg-white rounded-xl border-2 border-neutral-300 p-4 shadow-sm hover:shadow-md hover:border-neutral-800 transition-all group flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase mb-1 block">
                      {formatDate(item.date)}
                    </span>
                    <h4 className="text-sm font-bold text-neutral-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                      {item.title}
                    </h4>
                  </div>
                  <span className="text-xs font-bold text-neutral-700 mt-4 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Czytaj wpis →
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </>
  )
}