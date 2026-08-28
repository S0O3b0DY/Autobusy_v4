// Copyright (c) 2026 Szymon Piera. All rights reserved.
// Wszelkie prawa zastrzeżone.

import { useEffect, useMemo, useState } from 'react'

import { Link } from 'react-router-dom'
import { Grid, List, Search, CalendarAlt, Clock, ArrowRight, Flame, Share, Check, Bookmark } from '@boxicons/react'
import Header from "../components/Header"
import Footer from '../components/Footer'
import AppCTA from '../components/AppCTA'

import { blogData } from '../const/blog'
import { Helmet } from 'react-helmet'


// ------------------------------------------------------------------
// Konfiguracja i drobne helpery
// ------------------------------------------------------------------
const POSTS_PER_PAGE = 6
const BOOKMARKS_STORAGE_KEY = 'urbanTransitBookmarkedPosts'

const CATEGORY_STYLES: Record<string, { dot: string, badge: string, chip: string }> = {
  'Darmowe przejazdy': { dot: 'bg-emerald-500', badge: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  'Bilety i taryfy': { dot: 'bg-blue-500', badge: 'bg-blue-500', chip: 'bg-blue-50 text-blue-700 border-blue-200' },
  'Zniżki i ulgi': { dot: 'bg-purple-500', badge: 'bg-purple-500', chip: 'bg-purple-50 text-purple-700 border-purple-200' },
  'Utrudnienia i remonty': { dot: 'bg-red-500', badge: 'bg-red-500', chip: 'bg-red-50 text-red-700 border-red-200' },
  'Tabor i inwestycje': { dot: 'bg-amber-500', badge: 'bg-amber-500', chip: 'bg-amber-50 text-amber-700 border-amber-200' },
  'Sieć i trasy': { dot: 'bg-cyan-500', badge: 'bg-cyan-500', chip: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  'Ciekawostki': { dot: 'bg-pink-500', badge: 'bg-pink-500', chip: 'bg-pink-50 text-pink-700 border-pink-200' },
}
const DEFAULT_CATEGORY_STYLE = { dot: 'bg-neutral-500', badge: 'bg-neutral-800', chip: 'bg-neutral-100 text-neutral-700 border-neutral-200' }

function formatDate(iso: any) {
  return new Date(iso).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })
}

// ------------------------------------------------------------------
// Główny komponent
// ------------------------------------------------------------------
export default function BlogList() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('Wszystkie')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [visibleCount, setVisibleCount] = useState(POSTS_PER_PAGE)
  const [copiedPostId, setCopiedPostId] = useState<number | null>(null)
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Set<number>>(() => new Set())

  // wczytaj zapisane zakładki przy pierwszym renderze
  useEffect(() => {
    window.scrollTo(0, 0)
    try {
      const raw = window.localStorage.getItem(BOOKMARKS_STORAGE_KEY)
      if (raw) setBookmarkedPosts(new Set(JSON.parse(raw)))
    } catch (err) {
      console.error('Nie udało się wczytać zapisanych wpisów')
    }
  }, [])

  const persistBookmarks = (nextSet: any) => {
    setBookmarkedPosts(nextSet)
    try {
      window.localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify([...nextSet]))
    } catch (err) {
      console.error('Nie udało się zapisać zakładki')
    }
  }

  // kategorie wyliczone dynamicznie z danych, razem z licznikiem wpisów
  const categories = useMemo(() => {
    const counts: Record<string, number> = {}
    blogData.forEach((post) => {
      counts[post.category] = (counts[post.category] || 0) + 1
    })
    return [
      { name: 'Wszystkie', count: blogData.length },
      ...Object.entries(counts).map(([name, count]) => ({ name, count })),
    ]
  }, [])

  const sortedPosts = useMemo(
    () => [...blogData].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    []
  )
  const featuredPost = sortedPosts[0]

  const isFiltering = searchQuery.trim().length > 0 || activeCategory !== 'Wszystkie'

  const filteredPosts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return sortedPosts.filter((post) => {
      if (activeCategory !== 'Wszystkie' && post.category !== activeCategory) return false
      if (!query) return true
      const haystack = [post.title, post.excerpt, post.category, ...(post.tags || [])]
        .join(' ')
        .toLowerCase()
      return haystack.includes(query)
    })
  }, [sortedPosts, searchQuery, activeCategory])

  // gdy nic nie filtrujemy, wyróżniony wpis pokazujemy osobno w hero
  // i nie duplikujemy go w siatce poniżej
  const gridSourcePosts = isFiltering
    ? filteredPosts
    : filteredPosts.filter((post) => post.id !== featuredPost?.id)

  const visiblePosts = gridSourcePosts.slice(0, visibleCount)
  const hasMore = visibleCount < gridSourcePosts.length

  const handleCategoryChange = (name: string) => {
    setActiveCategory(name)
    setVisibleCount(POSTS_PER_PAGE)
  }

  const handleSearchChange = (e: any) => {
    setSearchQuery(e.target.value)
    setVisibleCount(POSTS_PER_PAGE)
  }

  const toggleBookmark = (postId: number) => {
    const next = new Set(bookmarkedPosts)
    next.has(postId) ? next.delete(postId) : next.add(postId)
    persistBookmarks(next)
  }

  const handleShare = async (post: any) => {
    const url = `${window.location.origin}/blog/${post.link}`
    if (navigator.share) {
      try {
        await navigator.share({ title: post.title, text: post.excerpt, url })
        return
      } catch (err: any) {
        if (err?.name === 'AbortError') return // użytkownik anulował okno udostępniania
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopiedPostId(post.id)
      setTimeout(() => setCopiedPostId((current) => (current === post.id ? null : current)), 2000)
    } catch (err) {
      console.error('Nie udało się skopiować linku', err)
    }
  }

  return (
    <> 
      <Helmet>
        <title>Blog - UrbanTransit</title>
      </Helmet>
      
      <AppCTA />
      <Header />
      <section className="mb-22 pt-30 max-w-5xl px-5 relative left-[50%] -translate-x-[50%]">
        {/* NAGŁÓWEK SEKCJI ORAZ KONTROLA WIDOKU */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
          <div>
            <h1 className="title text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900">Blog</h1>
            <p className="text text-sm sm:text-base mt-1.5 max-w-xl text-neutral-600">
              Bądź na bieżąco z objazdami, awariami oraz praktycznymi wskazówkami, które ułatwią Ci codzienne podróże komunikacją miejską.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Szukaj wpisu..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-neutral-300 rounded-xl text-sm font-medium placeholder:text-neutral-400 focus:outline-none focus:border-neutral-800 transition-colors shadow-sm"
              />
              <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 fill-neutral-400" />
            </div>

            <div className="hidden sm:flex bg-white border-2 border-neutral-300 rounded-xl p-1 gap-1">
              <button
                onClick={() => setViewMode('grid')}
                title="Widok siatki"
                className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                  viewMode === 'grid' ? 'bg-neutral-900 text-white' : 'text-neutral-400 hover:text-neutral-900'
                }`}
              >
                <Grid className="w-4 h-4 fill-current" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                title="Widok listy"
                className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                  viewMode === 'list' ? 'bg-neutral-900 text-white' : 'text-neutral-400 hover:text-neutral-900'
                }`}
              >
                <List className="w-4 h-4 fill-current" />
              </button>
            </div>
          </div>
        </div>

        {/* FILTRY KATEGORII */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
          {categories.map((cat: any) => {
            const isActive = activeCategory === cat.name
            const style = CATEGORY_STYLES[cat.name] || DEFAULT_CATEGORY_STYLE
            return (
              <button
                key={cat.name}
                onClick={() => handleCategoryChange(cat.name)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap border-2 transition-colors cursor-pointer flex items-center gap-2 ${
                  isActive
                    ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                    : 'bg-white text-neutral-700 hover:bg-neutral-100 border-neutral-300'
                }`}
              >
                {cat.name !== 'Wszystkie' && <span className={`w-2 h-2 rounded-full ${style.dot}`} />}
                {cat.name} ({cat.count})
              </button>
            )
          })}
        </div>

        {/* WYRÓŻNIONY WPIS (tylko gdy nic nie jest przefiltrowane) */}
        {!isFiltering && featuredPost && (
          <div className="mb-10 bg-white rounded-2xl border-2 border-neutral-300 shadow-xl overflow-hidden group grid md:grid-cols-12 hover:border-neutral-400 transition-all">
            <div className="md:col-span-7 relative min-h-60 md:min-h-90 overflow-hidden bg-neutral-900 max-h-50">
              <img
                src={`https://wsrv.nl/?url=${featuredPost.imgUrl}&w=1000&output=webp`}
                alt={featuredPost.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                loading='lazy'
              />
              <div className="absolute top-4 left-4 flex gap-2">
                <span className="bg-neutral-950/80 backdrop-blur-md text-white text-[11px] font-mono uppercase font-bold px-3 py-1 rounded-lg border border-neutral-700">
                  Wyróżniony wpis
                </span>
                <span
                  className={`${(CATEGORY_STYLES[featuredPost.category] || DEFAULT_CATEGORY_STYLE).badge} text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-md flex items-center gap-1`}
                >
                  <Flame className="w-3.5 h-3.5 fill-current" />
                  {featuredPost.category}
                </span>
              </div>
              <a
                className='absolute bottom-4 left-4 font-mono uppercase font-bold text-white text-xs bg-zinc-900/50 rounded-sm px-2 py-0.5 cursor-pointer hover:-translate-y-0.5 transition-transform'
                href={featuredPost.imgUrl}
                target='_blank'
              >
                źródło
              </a>
            </div>

            <div className="md:col-span-5 p-6 md:p-8 flex flex-col justify-between bg-white">
              <div>
                <div className="flex items-center gap-3 text-xs font-mono text-neutral-400 font-bold mb-3">
                  <span className="flex items-center gap-1">
                    <CalendarAlt size='sm' />
                    {formatDate(featuredPost.date).toUpperCase()}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock size='sm' />
                    {featuredPost.readTime} MIN
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 group-hover:text-blue-600 transition-colors mb-3 leading-snug">
                  {featuredPost.title}
                </h2>

                <p className="text-neutral-600 text-sm line-clamp-3 mb-6 leading-relaxed">{featuredPost.excerpt}</p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
                <Link
                  to={`/blog/${featuredPost.link}`}
                  className="inline-flex items-center gap-2 text-sm font-bold text-neutral-900 group-hover:text-blue-600 transition-colors"
                >
                  Czytaj więcej
                  <ArrowRight className="w-6 h-6 fill-current group-hover:translate-x-1 transition-transform" />
                </Link>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleShare(featuredPost)}
                    className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-md transition-colors cursor-pointer"
                    title="Udostępnij"
                  >
                    {copiedPostId === featuredPost.id ? <Check size='sm' /> : <Share size='sm' />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* WYNIKI / SIATKA / LISTA */}
        {gridSourcePosts.length === 0 ? (
          <div className="py-16 text-center border-2 border-dashed border-neutral-300 rounded-2xl">
            <p className="text-neutral-500 font-medium">
              Brak wpisów pasujących do „{searchQuery}” w kategorii „{activeCategory}”.
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {visiblePosts.map((post) => (
              <ArticleCard
                key={post.id}
                post={post}
                bookmarked={bookmarkedPosts.has(post.id)}
                copied={copiedPostId === post.id}
                onBookmark={() => toggleBookmark(post.id)}
                onShare={() => handleShare(post)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {visiblePosts.map((post) => (
              <ArticleRow
                key={post.id}
                post={post}
                bookmarked={bookmarkedPosts.has(post.id)}
                copied={copiedPostId === post.id}
                onBookmark={() => toggleBookmark(post.id)}
                onShare={() => handleShare(post)}
              />
            ))}
          </div>
        )}

        {/* PAGINACJA / LOAD MORE */}
        {gridSourcePosts.length > 0 && (
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-between border-t-2 border-neutral-200 pt-6 gap-4">
            <p className="text-xs font-mono text-neutral-500 uppercase font-bold">
              Wyświetlono <span className="text-neutral-900">{visiblePosts.length}</span> z{' '}
              <span className="text-neutral-900">{gridSourcePosts.length}</span> artykułów
            </p>

            {hasMore && (
              <button
                onClick={() => setVisibleCount((count) => count + POSTS_PER_PAGE)}
                className="w-full sm:w-auto px-6 py-2.5 bg-white border-2 border-neutral-300 hover:border-neutral-800 text-neutral-900 font-bold rounded-xl text-sm transition-all cursor-pointer shadow-sm active:scale-95 flex items-center justify-center gap-2"
              >
                Załaduj starsze wpisy
              </button>
            )}
          </div>
        )}
      </section>

      <Footer />
    </>
  )
}

// ------------------------------------------------------------------
// Karta artykułu — widok siatki
// ------------------------------------------------------------------
function ArticleCard({ post, bookmarked, copied, onBookmark, onShare }: any) {
  const style = CATEGORY_STYLES[post.category] || DEFAULT_CATEGORY_STYLE
  return (
    <article className="bg-white rounded-2xl border-2 border-neutral-300 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group hover:-translate-y-1">
      <div className="relative h-44 overflow-hidden bg-neutral-100 border-b-2 border-neutral-200">
        <img
          src={`https://wsrv.nl/?url=${post.imgUrl}&w=400&output=webp`}
          alt={post.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading='lazy'
        />
        <span className={`absolute top-3 left-3 ${style.badge} text-white text-[10px] font-mono uppercase font-bold px-2.5 py-1 rounded-md`}>
          {post.category}
        </span>
        <a
          className='absolute bottom-4 left-4 font-mono uppercase font-bold text-white text-xs bg-zinc-900/50 rounded-sm px-2 py-0.5 cursor-pointer hover:-translate-y-0.5 transition-transform'
          href={post.imgUrl}
          target='_blank'
        >
          źródło
        </a>
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 font-bold mb-2">
            <span>{formatDate(post.date).toUpperCase()}</span>
            <span>•</span>
            <span>{post.readTime} MIN</span>
          </div>

          <h3 className="text-base font-bold text-neutral-900 group-hover:text-blue-600 transition-colors mb-2 leading-snug line-clamp-2">
            {post.title}
          </h3>

          <p className="text-neutral-600 text-xs sm:text-sm line-clamp-3 mb-4 leading-relaxed">{post.excerpt}</p>
        </div>

        <div>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {post.tags.map((tag: any) => (
              <span key={tag} className={`text-[10px] font-mono px-2 py-0.5 rounded border ${style.chip}`}>
                #{tag}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
            <Link to={`/blog/${post.link}`} className="text-xs font-bold text-neutral-900 group-hover:text-blue-600 flex items-center gap-1">
              Czytaj dalej
              <ArrowRight className="w-5 h-5 fill-current" />
            </Link>

            <div className="flex items-center gap-1">
              <button onClick={onShare} title="Udostępnij" className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-md transition-colors cursor-pointer">
                {copied ? <Check size='xs' /> : <Share size='xs' />}
              </button>
              <button onClick={onBookmark} title="Zapisz na później" className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-md transition-colors cursor-pointer">
                <Bookmark pack={bookmarked ? "filled" : "basic"} size='sm' />
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}

// ------------------------------------------------------------------
// Karta artykułu — widok listy
// ------------------------------------------------------------------
function ArticleRow({ post, bookmarked, copied, onBookmark, onShare }: any) {
  //@ts-ignore
  const style = CATEGORY_STYLES[post.category] || DEFAULT_CATEGORY_STYLE
  return (
    <article className="bg-white rounded-2xl border-2 border-neutral-300 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col sm:flex-row overflow-hidden group max-h-60">
      <div className="relative sm:w-56 h-44 sm:h-auto shrink-0 overflow-hidden bg-neutral-100">
        <img
          src={`https://wsrv.nl/?url=${post.imgUrl}&w=400&output=webp`}
          alt={post.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading='lazy'
        />
        <span className={`absolute top-3 left-3 ${style.badge} text-white text-[10px] font-mono uppercase font-bold px-2.5 py-1 rounded-md`}>
          {post.category}
        </span>
        <a  
          className='absolute bottom-4 left-4 font-mono uppercase font-bold text-white text-xs bg-zinc-900/50 rounded-sm px-2 py-0.5 cursor-pointer hover:-translate-y-0.5 transition-transform'
          href={post.imgUrl}
          target='_blank'
        >
          źródło
        </a>
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 font-bold mb-2">
            <span>{formatDate(post.date).toUpperCase()}</span>
            <span>•</span>
            <span>{post.readTime} MIN</span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-neutral-900 group-hover:text-blue-600 transition-colors mb-2 leading-snug">
            {post.title}
          </h3>
          <p className="text-neutral-600 text-xs sm:text-sm line-clamp-2 mb-3 leading-relaxed">{post.excerpt}</p>
          <div className="flex flex-wrap gap-1.5">
            {post.tags.map((tag: any) => (
              <span key={tag} className={`text-[10px] font-mono px-2 py-0.5 rounded border ${style.chip}`}>
                #{tag}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 mt-3 border-t border-neutral-100">
          <Link to={`/blog/${post.link}`} className="text-xs font-bold text-neutral-900 group-hover:text-blue-600 flex items-center gap-1">
            Czytaj dalej
            <ArrowRight className="w-5 h-5 fill-current" />
          </Link>

          <div className="flex items-center gap-1">
            <button onClick={onShare} title="Udostępnij" className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-md transition-colors cursor-pointer">
              {copied ? <Check size='xs' /> : <Share size='xs' />}
            </button>
            <button onClick={onBookmark} title="Zapisz na później" className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-md transition-colors cursor-pointer">
              <Bookmark pack={bookmarked ? "filled" : "basic"} size='sm' />
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}