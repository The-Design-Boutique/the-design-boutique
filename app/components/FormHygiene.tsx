'use client'

import { useEffect } from 'react'
import { isMarketingConsentField } from '@/app/lib/consent'

/**
 * Unticks any marketing opt-in that arrives already ticked.
 *
 * Consent to be marketed at has to be an affirmative act, so a newsletter or
 * SMS box may not be pre-selected. That is a rule about what the visitor did,
 * not about what the form intended, which is why this runs on the rendered page
 * rather than being a lint rule: a box can arrive pre-ticked from a form built
 * in the Studio, from an embed, or from a browser restoring a previous session.
 *
 * Deliberately narrow. It looks at each checkbox's name, id, class, value, its
 * label and its aria-label, and only acts on ones that read as marketing.
 * Terms, privacy policy and "remember me" are excluded outright: those are
 * consent of a sort too, and silently unticking them would be both wrong and
 * infuriating. The classifier lives in app/lib/consent.ts with its tests.
 *
 * It re-runs when nodes are added, because a form that appears after a click
 * has exactly the same obligation as one present at load.
 */
export function FormHygiene() {
  useEffect(() => {
    function fieldText(el: HTMLInputElement): string {
      const bits = [el.name || '', el.id || '', el.className || '', el.value || '']
      let label: HTMLLabelElement | null = null
      if (el.id) {
        try {
          // Typed as always present, but this runs in whatever browser turned up.
          const sel = typeof CSS !== 'undefined' && typeof CSS.escape === 'function' ? CSS.escape(el.id) : el.id
          label = document.querySelector<HTMLLabelElement>(`label[for="${sel}"]`)
        } catch {
          // An id that cannot be escaped into a selector: fall through to the
          // wrapping label rather than giving up on the field.
        }
      }
      if (!label) label = el.closest('label')
      if (label) bits.push(label.textContent || '')
      bits.push(el.getAttribute('aria-label') || '')
      return bits.join(' ')
    }

    function sweep() {
      const boxes = document.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')
      boxes.forEach((box) => {
        if (!box.checked) return
        if (!isMarketingConsentField(fieldText(box))) return
        box.checked = false
        box.removeAttribute('checked')
        box.setAttribute('data-pc-unchecked', '1')
        // React-controlled inputs need telling, or the component's state and
        // the DOM disagree and the next render puts the tick back.
        box.dispatchEvent(new Event('input', { bubbles: true }))
        box.dispatchEvent(new Event('change', { bubbles: true }))
      })
    }

    sweep()

    const mo = new MutationObserver((records) => {
      for (const r of records) {
        if (r.addedNodes.length) {
          sweep()
          return
        }
      }
    })
    try {
      mo.observe(document.documentElement, { childList: true, subtree: true })
    } catch {
      // Nothing to do: the initial sweep has already run.
    }
    return () => mo.disconnect()
  }, [])

  return null
}
