'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Category } from '@/app/lib/consent'

/**
 * The visible half of the consent gate.
 *
 * It owns no logic of its own. Every decision about what is and is not allowed
 * lives in the engine that ran in the document head long before this component
 * existed, and this asks it questions and tells it what the visitor pressed.
 * That separation is deliberate: the blocking has to work whether or not React
 * ever loads, so nothing here may be load-bearing.
 *
 * The reference implementation draws its own banner in vanilla DOM because
 * WordPress gives it no view layer to borrow. Here there is one, so the markup
 * is ordinary components and the styling is the site's own.
 */

interface GateState {
  necessary: 1
  analytics: 0 | 1
  advertising: 0 | 1
  functional: 0 | 1
  session_replay: 0 | 1
  gpc: 0 | 1
}

interface Gate {
  needsPrompt: boolean
  gpc: boolean
  hardBlock: boolean
  categories: Category[]
  state: () => GateState
  acceptAll: () => void
  rejectAll: () => void
  save: (choices: Partial<Record<Category, boolean>>) => void
  subscribe: (fn: (state: GateState, needsPrompt: boolean) => void) => () => void
}

declare global {
  interface Window {
    __PCGATE__?: Gate
  }
}

const LABELS: Record<Category, { name: string; detail: string }> = {
  analytics: {
    name: 'Analytics',
    detail: 'Counting visits and which pages get read, so we know what is worth writing more of.',
  },
  advertising: {
    name: 'Advertising',
    detail: 'Measuring adverts and building audiences. This is the one that shares information with other companies.',
  },
  functional: {
    name: 'Chat and call tracking',
    detail: 'Extras such as a live chat window or a phone number that records which page the call came from.',
  },
  session_replay: {
    name: 'Session recording',
    detail: 'Records what you did on the page, including where you moved and what you typed, and plays it back later.',
  },
}

/** Categories the visitor cannot turn on, and the reason, or null when free. */
function lockedReason(cat: Category, gate: Gate): string | null {
  if (gate.hardBlock) return 'Off on this page'
  if (gate.gpc && (cat === 'advertising' || cat === 'analytics' || cat === 'session_replay')) {
    return 'Your browser opted out'
  }
  return null
}

export function ConsentBanner({
  heading,
  body,
  privacyPolicyUrl,
  cookiePolicyUrl,
}: {
  heading?: string
  body?: string
  privacyPolicyUrl?: string
  cookiePolicyUrl?: string
}) {
  const [gate, setGate] = useState<Gate | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [showPrefs, setShowPrefs] = useState(false)
  const [choices, setChoices] = useState<Partial<Record<Category, boolean>>>({})
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const returnFocusTo = useRef<Element | null>(null)

  // The engine is already installed by the time React runs, but reading it in an
  // effect rather than during render keeps the server and client markup
  // identical and avoids a hydration mismatch on a component whose entire job
  // is to appear conditionally.
  useEffect(() => {
    const g = window.__PCGATE__
    if (!g) return
    setGate(g)
    setShowBanner(g.needsPrompt)
    return g.subscribe((_state, needsPrompt) => setShowBanner(needsPrompt))
  }, [])

  const openPrefs = useCallback(() => {
    const g = window.__PCGATE__
    if (!g) return
    returnFocusTo.current = document.activeElement
    const s = g.state()
    const next: Partial<Record<Category, boolean>> = {}
    for (const c of g.categories) next[c] = s[c] === 1
    setChoices(next)
    setShowPrefs(true)
  }, [])

  const closePrefs = useCallback(() => {
    setShowPrefs(false)
    const el = returnFocusTo.current as HTMLElement | null
    if (el?.focus) el.focus()
  }, [])

  // Any element anywhere with data-pcgate-open reopens this, which is how the
  // permanent footer link works without the footer importing anything.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      let node = e.target as Element | null
      while (node && node !== document.documentElement) {
        if (node.hasAttribute?.('data-pcgate-open')) {
          e.preventDefault()
          openPrefs()
          return
        }
        node = node.parentElement
      }
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [openPrefs])

  // Escape closes, and Tab is kept inside the dialog while it is open.
  useEffect(() => {
    if (!showPrefs) return
    dialogRef.current?.focus()
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        closePrefs()
        return
      }
      if (e.key !== 'Tab' || !dialogRef.current) return
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [showPrefs, closePrefs])

  if (!gate) return null

  const accept = () => {
    gate.acceptAll()
    setShowBanner(false)
    closePrefs()
  }
  const reject = () => {
    gate.rejectAll()
    setShowBanner(false)
    closePrefs()
  }
  const confirm = () => {
    gate.save(choices)
    setShowBanner(false)
    closePrefs()
  }

  const policyLinks = (
    <>
      {privacyPolicyUrl ? (
        <a href={privacyPolicyUrl} className="pcgate-link">
          Privacy policy
        </a>
      ) : null}
      {cookiePolicyUrl ? (
        <a href={cookiePolicyUrl} className="pcgate-link">
          Cookie policy
        </a>
      ) : null}
    </>
  )

  return (
    <>
      {showBanner ? (
        <div className="pcgate-banner" role="region" aria-label="Your privacy choices">
          <div className="pcgate-text">
            <h2 className="pcgate-heading">{heading || 'Your privacy choices'}</h2>
            <p className="pcgate-body">
              {body ||
                'We use cookies and similar tools for analytics, advertising and support features, some of which share information with other companies. Nothing non-essential runs until you choose.'}
            </p>
            {gate.gpc ? (
              <p className="pcgate-gpc">
                Your browser is sending a privacy signal, so we have already opted you out of sharing your
                information. You can still allow the extras below.
              </p>
            ) : null}
            <p className="pcgate-policies">{policyLinks}</p>
          </div>
          <div className="pcgate-actions">
            <button type="button" className="pcgate-btn pcgate-primary" onClick={accept}>
              Accept all
            </button>
            <button type="button" className="pcgate-btn" onClick={reject}>
              Reject all
            </button>
            <button type="button" className="pcgate-btn" onClick={openPrefs}>
              Manage preferences
            </button>
          </div>
        </div>
      ) : null}

      {showPrefs ? (
        <div
          className="pcgate-modal"
          onClick={(e) => {
            if (e.target === e.currentTarget) closePrefs()
          }}
        >
          <div
            className="pcgate-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Manage your privacy preferences"
            tabIndex={-1}
            ref={dialogRef}
          >
            <h2 className="pcgate-heading">Manage your privacy preferences</h2>
            <p className="pcgate-body">
              Choose what you allow. Anything you leave off is blocked outright rather than merely asked not
              to run.
            </p>

            <div className="pcgate-row">
              <div>
                <strong className="pcgate-row-name">Strictly necessary</strong>
                <span className="pcgate-row-detail">
                  Security, navigation and forms. No tracking and nothing shared with anybody else.
                </span>
              </div>
              <span className="pcgate-always">Always on</span>
            </div>

            {gate.categories.map((cat) => {
              const locked = lockedReason(cat, gate)
              return (
                <div className="pcgate-row" key={cat}>
                  <div>
                    <strong className="pcgate-row-name">{LABELS[cat].name}</strong>
                    <span className="pcgate-row-detail">{LABELS[cat].detail}</span>
                  </div>
                  {locked ? (
                    <span className="pcgate-always">{locked}</span>
                  ) : (
                    <label className="pcgate-toggle">
                      <input
                        type="checkbox"
                        checked={choices[cat] === true}
                        onChange={(e) => setChoices((c) => ({ ...c, [cat]: e.target.checked }))}
                      />
                      <span className="pcgate-track" aria-hidden="true" />
                      <span className="pcgate-sr-only">{LABELS[cat].name}</span>
                    </label>
                  )}
                </div>
              )
            })}

            <div className="pcgate-modal-foot">
              <button type="button" className="pcgate-btn" onClick={reject}>
                Reject all
              </button>
              <button type="button" className="pcgate-btn pcgate-primary" onClick={confirm}>
                Confirm my choices
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Permanent way back in. Required in California, where an opt-out has to
          stay reachable rather than vanishing with the banner. */}
      <button
        type="button"
        className="pcgate-reopen"
        onClick={openPrefs}
        aria-label="Manage privacy choices"
        title="Manage privacy choices"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
          <path d="M12 3l7 3v5c0 4.6-3.1 7.7-7 9-3.9-1.3-7-4.4-7-9V6l7-3z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      </button>
    </>
  )
}
