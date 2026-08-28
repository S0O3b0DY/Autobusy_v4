// Copyright (c) 2026 Szymon Piera. All rights reserved.
// Wszelkie prawa zastrzeżone.

import { useState } from "react"
import clsx from "clsx"

import { Bug, Star, Trash, User, Discussion, Send, CheckCircle, X, InfoCircle } from "@boxicons/react"

import AppCTA from "../components/AppCTA"
import Header from "../components/Header.tsx"
import Footer from "../components/Footer.tsx"

import { ref, push } from "firebase/database"
import { dbR } from '../lib/firebase.ts'
import { Helmet } from "react-helmet"

// ─── Typy ────────────────────────────────────────────────────────────────────

type TopicValue = 'bug' | 'feature' | 'data-deletion' | 'account' | 'other'

// ─── Konfiguracja tematów ─────────────────────────────────────────────────────

const TOPICS: {
  value: TopicValue
  label: string
  description: string
  Icon: React.ElementType
  iconBg: string
  iconColor: string
  border: string
  borderActive: string
  bgActive: string
}[] = [
  {
    value: 'bug',
    label: 'Błąd w aplikacji',
    description: 'Coś nie działa jak powinno',
    Icon: Bug,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    border: 'border-neutral-200 hover:border-red-300 hover:bg-red-50/40',
    borderActive: 'border-red-500',
    bgActive: 'bg-red-50',
  },
  {
    value: 'feature',
    label: 'Propozycja funkcji',
    description: 'Masz pomysł na ulepszenie?',
    Icon: Star,
    iconBg: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
    border: 'border-neutral-200 hover:border-yellow-300 hover:bg-yellow-50/40',
    borderActive: 'border-yellow-500',
    bgActive: 'bg-yellow-50',
  },
  {
    value: 'data-deletion',
    label: 'Usunięcie danych',
    description: 'Usuń swoje konto i dane',
    Icon: Trash,
    iconBg: 'bg-neutral-100',
    iconColor: 'text-neutral-600',
    border: 'border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50/40',
    borderActive: 'border-neutral-600',
    bgActive: 'bg-neutral-50',
  },
  {
    value: 'account',
    label: 'Problem z kontem',
    description: 'Problem z logowaniem lub kontem',
    Icon: User,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    border: 'border-neutral-200 hover:border-blue-300 hover:bg-blue-50/40',
    borderActive: 'border-blue-500',
    bgActive: 'bg-blue-50',
  },
  {
    value: 'other',
    label: 'Inne',
    description: 'Inne pytania i uwagi',
    Icon: Discussion,
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    border: 'border-neutral-200 hover:border-purple-300 hover:bg-purple-50/40',
    borderActive: 'border-purple-500',
    bgActive: 'bg-purple-50',
  },
]

// ─── Wspólna klasa pola tekstowego ───────────────────────────────────────────

const INPUT =
  "w-full md:w-100 bg-white border border-neutral-300 rounded-xl py-2.5 px-4 text-[14px] " +
  "placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primaty-900/20 " +
  "focus:border-primaty-900 transition-all shadow-sm"

// ─── Komponent ────────────────────────────────────────────────────────────────

export default function Contact() {
  const [topic, setTopic]               = useState<TopicValue | ''>('')
  const [email, setEmail]               = useState('')
  const [message, setMessage]           = useState('')
  const [steps, setSteps]               = useState('')
  const [deviceInfo, setDeviceInfo]     = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [status, setStatus]             = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg]         = useState('')

  function handleTopicChange(next: TopicValue) {
    setTopic(next)
    setMessage('')
    setSteps('')
    setDeviceInfo('')
    setConfirmDelete(false)
    setErrorMsg('')
  }

  function validate(): string | null {
    if (!topic) return 'Wybierz temat zgłoszenia.'
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return 'Podaj poprawny adres e-mail.'
    if (topic !== 'data-deletion' && !message.trim())
      return 'Wiadomość nie może być pusta.'
    if (topic === 'data-deletion' && !confirmDelete)
      return 'Musisz potwierdzić chęć usunięcia danych.'
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const err = validate()
    if (err) { setErrorMsg(err); return }
    setErrorMsg('')
    setStatus('loading')
    try {
      await push(ref(dbR, 'CONTACTS'), {
        topic,
        email: email.trim(),
        message: message.trim() || null,
        ...(topic === 'bug' && {
          steps: steps.trim() || null,
          deviceInfo: deviceInfo.trim() || null,
        }),
        ...(topic === 'data-deletion' && { confirmDelete }),
        timestamp: Date.now(),
      })
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  function reset() {
    setTopic(''); setEmail(''); setMessage(''); setSteps('')
    setDeviceInfo(''); setConfirmDelete(false)
    setStatus('idle'); setErrorMsg('')
  }

  return (
    <>
      <Helmet>
        <title>Kontakt - UrbanTransit</title>
      </Helmet>

      <AppCTA />
      <div className="bg-bg-1 min-h-screen flex flex-col">

        {/* ── Header ── */}
        <Header />

        {/* ── Treść ── */}
        <main className="px-6 mb-30 pt-28 max-w-3xl mx-auto w-full flex-1">

          {/* Hero */}
          <div className="mb-12 text-center">
            <h1 className="title mb-4">Kontakt</h1>
            <p className="text max-w-xl">
              Masz problem, pomysł lub pytanie? Wypełnij formularz,
              a odpowiedź na podany adres e-mail zostanie wysłana najszybciej jak to możliwe.
            </p>
          </div>

          {/* ════ Stan sukcesu ════ */}
          {status === 'success' ? (
            <div className="card items-center text-center gap-6 py-16">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
                <CheckCircle size="lg" className="text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Wiadomość wysłana!</h2>
                <p className="text max-w-sm mx-auto">
                  Twoje zgłoszenie zostało zapisane.
                </p>
              </div>
              <button onClick={reset} className="btn-alt mt-2">
                Wyślij kolejną wiadomość
              </button>
            </div>

          ) : (
            /* ════ Formularz ════ */
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">

              {/* ─ 1. Temat ─ */}
              <section className="card gap-5">
                <h2 className="text-xl font-bold">1. Temat zgłoszenia</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {TOPICS.map(({ value, label, description, Icon, iconBg, iconColor, border, borderActive, bgActive }) => {
                    const active = topic === value
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handleTopicChange(value)}
                        className={clsx(
                          "flex items-center gap-3 p-4 rounded-xl border-2 text-left cursor-pointer transition-all active:scale-[0.98]",
                          active
                            ? clsx(borderActive, bgActive)
                            : clsx("bg-white", border)
                        )}
                      >
                        <div className={clsx(
                          "shrink-0 flex items-center justify-center w-9 h-9 rounded-lg",
                          iconBg
                        )}>
                          <Icon size="sm" className={iconColor} />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-neutral-900">{label}</p>
                          <p className="text-[11px] text-neutral-500 mt-0.5">{description}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </section>

              {/* ─ 2. E-mail — pojawia się po wyborze tematu ─ */}
              {topic && (
                <section className="card gap-4">
                  <h2 className="text-xl font-bold">2. Dane kontaktowe</h2>
                  <div>
                    <label className="block text-sm font-bold mb-1.5 text-neutral-700">
                      Adres e-mail <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="ty@przykład.pl"
                      className={INPUT}
                    />
                  </div>
                </section>
              )}

              {/* ─ 3a. Błąd w aplikacji ─ */}
              {topic === 'bug' && (
                <section className="card gap-5">
                  <h2 className="text-xl font-bold">3. Opis błędu</h2>

                  <div>
                    <label className="block text-sm font-bold mb-1.5 text-neutral-700">
                      Co się stało? <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      rows={4}
                      placeholder="Opisz błąd — co się stało i czego się spodziewałeś..."
                      className={clsx(INPUT, "resize-none")}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-1.5 text-neutral-700">
                      Kroki do odtworzenia{" "}
                      <span className="font-normal text-neutral-400">(opcjonalnie)</span>
                    </label>
                    <textarea
                      value={steps}
                      onChange={e => setSteps(e.target.value)}
                      rows={3}
                      placeholder={"1. Wejdź na mapę\n2. Kliknij przystanek\n3. Pojawia się błąd..."}
                      className={clsx(INPUT, "resize-none font-mono text-[13px]")}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-1.5 text-neutral-700">
                      Urządzenie / przeglądarka{" "}
                      <span className="font-normal text-neutral-400">(opcjonalnie)</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={deviceInfo}
                        onChange={e => setDeviceInfo(e.target.value)}
                        placeholder="np. Chrome 125, iPhone 14, Android..."
                        className={clsx(INPUT, "flex-1")}
                      />
                      <button
                        type="button"
                        onClick={() => setDeviceInfo(navigator.userAgent)}
                        title="Uzupełnij automatycznie"
                        className="px-3.5 py-2.5 rounded-xl border-2 border-neutral-200 text-xs font-bold text-neutral-600 hover:bg-neutral-100 hover:border-neutral-300 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Wykryj
                      </button>
                    </div>
                  </div>
                </section>
              )}

              {/* ─ 3b. Propozycja funkcji ─ */}
              {topic === 'feature' && (
                <section className="card gap-4">
                  <h2 className="text-xl font-bold">3. Twoja propozycja</h2>
                  <div>
                    <label className="block text-sm font-bold mb-1.5 text-neutral-700">
                      Opisz pomysł <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      rows={5}
                      placeholder="Jaką funkcję chciałbyś zobaczyć i dlaczego byłaby pomocna?"
                      className={clsx(INPUT, "resize-none")}
                    />
                  </div>
                </section>
              )}

              {/* ─ 3c. Usunięcie danych ─ */}
              {topic === 'data-deletion' && (
                <section className="card gap-5">
                  <h2 className="text-xl font-bold">3. Usunięcie danych</h2>

                  {/* Ostrzeżenie */}
                  <div className="flex gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
                    <InfoCircle size="sm" className="text-red-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">
                      Usunięcie danych jest <strong>nieodwracalne</strong>. Usuniemy Twoje konto,
                      zapisane linie, przystanki oraz całą historię aktywności.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-1.5 text-neutral-700">
                      Powód usunięcia{" "}
                      <span className="font-normal text-neutral-400">
                        (opcjonalnie — pomaga nam się ulepszać)
                      </span>
                    </label>
                    <textarea
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      rows={3}
                      placeholder="Dlaczego chcesz usunąć konto?"
                      className={clsx(INPUT, "resize-none")}
                    />
                  </div>

                  {/* Potwierdzenie */}
                  <label className="flex items-start gap-3 cursor-pointer group select-none p-4 rounded-xl border-2 border-neutral-200 hover:border-primaty-900/30 hover:bg-neutral-50 transition-all">
                    <input
                      type="checkbox"
                      checked={confirmDelete}
                      onChange={e => setConfirmDelete(e.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-primaty-900 cursor-pointer shrink-0"
                    />
                    <span className="text-sm font-medium text-neutral-700 group-hover:text-neutral-900 transition-colors">
                      Rozumiem, że usunięcie danych jest nieodwracalne i chcę kontynuować.
                    </span>
                  </label>
                </section>
              )}

              {/* ─ 3d. Problem z kontem / Inne ─ */}
              {(topic === 'account' || topic === 'other') && (
                <section className="card gap-4">
                  <h2 className="text-xl font-bold">3. Wiadomość</h2>
                  <div>
                    <label className="block text-sm font-bold mb-1.5 text-neutral-700">
                      {topic === 'account' ? 'Opis problemu' : 'Treść wiadomości'}{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      rows={5}
                      placeholder={
                        topic === 'account'
                          ? 'Opisz problem z kontem lub logowaniem...'
                          : 'Napisz do nas — jesteśmy tu, by pomóc...'
                      }
                      className={clsx(INPUT, "resize-none")}
                    />
                  </div>
                </section>
              )}

              {/* ─ Błąd walidacji / Firebase ─ */}
              {(errorMsg || status === 'error') && (
                <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-medium">
                  <X size="sm" className="shrink-0" />
                  {errorMsg || 'Nie udało się wysłać wiadomości. Spróbuj ponownie.'}
                </div>
              )}

              {/* ─ Przycisk — widoczny dopiero po wyborze tematu ─ */}
              {topic && (
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="btn-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  {status === 'loading' ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                      Wysyłanie...
                    </>
                  ) : (
                    <>
                      <Send size="sm" />
                      Wyślij zgłoszenie
                    </>
                  )}
                </button>
              )}

            </form>
          )}
        </main>

        {/* ── Footer ── */}
        <Footer />

      </div>
    </>
  )
}