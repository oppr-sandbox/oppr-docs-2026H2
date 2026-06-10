// Open the printable HTML in a popup window.
//
// Why a Blob URL and not document.write into window.open(""):
//   • document.write into a popup is deprecated and Safari/Firefox block it.
//   • Blob URLs inherit no parent origin, but `text/html` blobs are fine for
//     standalone documents (no need to talk back to the parent).
//   • The user can then either click "Print / Save as PDF" inside the popup
//     or use Cmd/Ctrl+P. Browser handles Save-as-PDF.
//
// IMPORTANT: the feature string must NOT include "noopener" — per spec,
// window.open returns null when noopener is requested even though the window
// opens, which made the popup-blocker check false-positive on every export.
//
// Two-phase API: openPrintShell() must be called synchronously inside the
// click handler (while the user activation is alive) so the browser allows
// the popup; loadPrintHtml() navigates it once async prep (image inlining,
// PDF rasterising) completes. openPrintWindow() remains the one-shot path
// for callers with no async work between click and open.

const WINDOW_FEATURES = "popup,width=920,height=1180"

export function openPrintShell(): Window | null {
  const win = window.open("about:blank", "_blank", WINDOW_FEATURES)
  if (!win) return null
  try {
    win.document.title = "Preparing export…"
    win.document.body.innerHTML =
      '<p style="font-family:ui-sans-serif,system-ui;color:#475569;padding:24px">Preparing export…</p>'
  } catch {
    /* navigated or opaque — fine, the blob URL replaces it */
  }
  return win
}

export function loadPrintHtml(win: Window, html: string): void {
  const url = toBlobUrl(html)
  try {
    win.location.href = url
  } catch {
    URL.revokeObjectURL(url)
    return
  }
  scheduleRevoke(win, url)
}

export function openPrintWindow(html: string): Window | null {
  const url = toBlobUrl(html)
  const win = window.open(url, "_blank", WINDOW_FEATURES)
  if (!win) {
    URL.revokeObjectURL(url)
    return null
  }
  scheduleRevoke(win, url)
  return win
}

function toBlobUrl(html: string): string {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" })
  return URL.createObjectURL(blob)
}

// Retain the URL until the popup closes so back/refresh inside it still work.
// Some browsers (Safari) block unload listeners across opaque origins, so a
// generous fallback timeout prevents leaking the URL forever.
function scheduleRevoke(win: Window, url: string): void {
  const cleanup = () => URL.revokeObjectURL(url)
  setTimeout(cleanup, 5 * 60 * 1000)
  try {
    win.addEventListener?.("unload", cleanup, { once: true })
  } catch {
    /* opaque origin */
  }
}
