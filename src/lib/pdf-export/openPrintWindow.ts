// Open a same-origin Blob URL in a new window with the printable HTML.
//
// Why a Blob URL and not document.write into window.open(""):
//   • document.write into a popup is deprecated and Safari/Firefox block it.
//   • Blob URLs inherit no parent origin, but `text/html` blobs are fine for
//     standalone documents (no need to talk back to the parent).
//   • The user can then either click "Print / Save as PDF" inside the popup
//     or use Cmd/Ctrl+P. Browser handles Save-as-PDF.
//
// We retain the URL.revokeObjectURL until the popup is closed so back/refresh
// inside the popup still work.

export function openPrintWindow(html: string): Window | null {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const win = window.open(url, "_blank", "noopener,noreferrer,popup,width=920,height=1180")
  if (!win) {
    URL.revokeObjectURL(url)
    return null
  }
  // Best-effort cleanup once the popup unloads or after a generous timeout.
  const cleanup = () => URL.revokeObjectURL(url)
  // Some browsers (Safari) block onunload listeners across opaque origins;
  // schedule a fallback timeout so we don't leak the URL forever.
  setTimeout(cleanup, 5 * 60 * 1000)
  try {
    win.addEventListener?.("unload", cleanup, { once: true })
  } catch {
    /* opaque origin */
  }
  return win
}
