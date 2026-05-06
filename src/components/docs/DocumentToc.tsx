// DocumentToc — auto-generated table of contents for the read view.
//
// Walks the TipTap body for heading nodes and renders a clickable list.
// Each heading gets a stable slug id added at render time (we attach it
// imperatively in the read view); clicking scrolls to that heading.

import { useEffect, useMemo, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { ListTree } from "lucide-react"

interface TocEntry {
  id: string
  level: number
  text: string
}

interface DocumentTocProps {
  body: unknown
  /** Container ref to scope heading-id assignment + scroll-spy. */
  contentRef: React.RefObject<HTMLElement | null>
  className?: string
}

function slugify(text: string, fallback: string): string {
  const s = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  return s || fallback
}

export function extractHeadings(body: unknown): TocEntry[] {
  if (!body || typeof body !== "object") return []
  const root = body as { type?: string; content?: unknown[] }
  if (root.type !== "doc") return []
  const out: TocEntry[] = []
  let n = 0
  function walk(node: unknown) {
    if (!node || typeof node !== "object") return
    const nd = node as {
      type?: string
      attrs?: Record<string, unknown>
      content?: unknown[]
    }
    if (nd.type === "heading") {
      const text = collectText(nd).trim()
      const level = (nd.attrs?.level as number | undefined) ?? 1
      if (text) {
        n += 1
        out.push({ id: slugify(text, `h-${n}`), level, text })
      }
      return
    }
    if (nd.content) for (const c of nd.content) walk(c)
  }
  function collectText(node: unknown): string {
    if (!node || typeof node !== "object") return ""
    const nd = node as { text?: string; content?: unknown[] }
    if (typeof nd.text === "string") return nd.text
    if (!nd.content) return ""
    return nd.content.map(collectText).join("")
  }
  for (const c of root.content ?? []) walk(c)
  return out
}

export function DocumentToc({ body, contentRef, className }: DocumentTocProps) {
  const entries = useMemo(() => extractHeadings(body), [body])
  const [active, setActive] = useState<string | null>(null)
  const idMapRef = useRef<Map<HTMLElement, string>>(new Map())

  // Imperatively attach ids to the rendered heading elements so anchor
  // scroll works without coordinating with the renderer. Re-runs whenever
  // entries change.
  useEffect(() => {
    const root = contentRef.current
    if (!root || entries.length === 0) return
    const headings = root.querySelectorAll<HTMLElement>("h1, h2, h3")
    idMapRef.current.clear()
    headings.forEach((el, i) => {
      const entry = entries[i]
      if (!entry) return
      el.id = entry.id
      idMapRef.current.set(el, entry.id)
    })

    // Scroll-spy via IntersectionObserver — set the topmost visible heading.
    const observer = new IntersectionObserver(
      (records) => {
        const visible = records
          .filter((r) => r.isIntersecting)
          .sort((a, b) => a.target.getBoundingClientRect().top - b.target.getBoundingClientRect().top)
        if (visible.length > 0) {
          const id = visible[0].target.id
          if (id) setActive(id)
        }
      },
      { rootMargin: "-80px 0px -60% 0px" },
    )
    headings.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [entries, contentRef])

  if (!entries.length) return null

  return (
    <nav className={cn("space-y-1", className)} aria-label="Table of contents">
      <div className="mb-2 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        <ListTree className="h-3 w-3" />
        On this page
      </div>
      <ul className="space-y-0.5 border-l">
        {entries.map((e) => (
          <li key={e.id}>
            <a
              href={`#${e.id}`}
              onClick={(ev) => {
                ev.preventDefault()
                const target = document.getElementById(e.id)
                if (target) target.scrollIntoView({ behavior: "smooth", block: "start" })
              }}
              className={cn(
                "block border-l-2 -ml-px pl-3 py-0.5 text-xs transition-colors",
                e.level === 1 && "font-medium",
                e.level === 2 && "pl-4",
                e.level === 3 && "pl-6 text-muted-foreground",
                active === e.id
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {e.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
