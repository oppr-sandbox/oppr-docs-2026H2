// Showcase-only QR-looking SVG.
//
// This is intentionally NOT a real QR encoder — adding `qrcode` for a
// frontend-only demo with hardcoded tokens would be overkill. Instead we draw
// the visual anatomy of a QR (three finder patterns, timing tracks, an
// alignment block) and fill the data area with a pattern derived from a
// deterministic hash of the `value` so two different assets render two
// different QR-shaped images.

import { useMemo } from "react"

const SIZE = 29 // 29x29 module grid roughly matches QR Version 3

function hash32(s: string): number {
  // Plain FNV-1a — deterministic and good enough for "looks random" pixels.
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

function moduleFilled(value: string, x: number, y: number): boolean {
  const seed = hash32(`${value}:${x}:${y}`)
  return (seed & 0b11) === 0 // ~25% fill density, matches a real QR's middle weight
}

function isFinderPattern(x: number, y: number): boolean {
  // The three 7x7 corner patterns plus their 1-module quiet ring.
  const inTL = x < 7 && y < 7
  const inTR = x >= SIZE - 7 && y < 7
  const inBL = x < 7 && y >= SIZE - 7
  return inTL || inTR || inBL
}

function finderModule(x: number, y: number): boolean {
  // Map (x,y) into local 7x7 finder coords and return whether that module
  // is filled. A finder pattern is: 7x7 outer ring filled, 5x5 white,
  // 3x3 inner filled.
  let lx = x
  let ly = y
  if (x >= SIZE - 7) lx = x - (SIZE - 7)
  if (y >= SIZE - 7) ly = y - (SIZE - 7)
  // Outer 7x7 border
  const onBorder = lx === 0 || lx === 6 || ly === 0 || ly === 6
  if (onBorder) return true
  // Inner 3x3 block (modules 2..4)
  if (lx >= 2 && lx <= 4 && ly >= 2 && ly <= 4) return true
  return false
}

function isAlignmentPattern(x: number, y: number): boolean {
  // Small 5x5 alignment block in the bottom-right area, like Version 2+ QRs.
  return x >= SIZE - 9 && x <= SIZE - 5 && y >= SIZE - 9 && y <= SIZE - 5
}

function alignmentModule(x: number, y: number): boolean {
  const lx = x - (SIZE - 9)
  const ly = y - (SIZE - 9)
  const onBorder = lx === 0 || lx === 4 || ly === 0 || ly === 4
  if (onBorder) return true
  if (lx === 2 && ly === 2) return true
  return false
}

function isTimingTrack(x: number, y: number): boolean {
  // Horizontal and vertical timing tracks at row/column 6, between finders.
  if (y === 6 && x >= 7 && x < SIZE - 7) return true
  if (x === 6 && y >= 7 && y < SIZE - 7) return true
  return false
}

function timingModule(x: number, y: number): boolean {
  return ((x + y) & 1) === 0
}

export function AssetQrSvg({
  value,
  size = 280,
  className,
}: {
  value: string
  size?: number
  className?: string
}) {
  const modules = useMemo(() => {
    const out: Array<{ x: number; y: number }> = []
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        let on = false
        if (isFinderPattern(x, y)) {
          on = finderModule(x, y)
        } else if (isAlignmentPattern(x, y)) {
          on = alignmentModule(x, y)
        } else if (isTimingTrack(x, y)) {
          on = timingModule(x, y)
        } else {
          on = moduleFilled(value, x, y)
        }
        if (on) out.push({ x, y })
      }
    }
    return out
  }, [value])

  const margin = 2 // 2-module quiet zone
  const total = SIZE + margin * 2

  return (
    <svg
      viewBox={`0 0 ${total} ${total}`}
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={`QR code for ${value}`}
    >
      <rect width={total} height={total} fill="#ffffff" />
      {modules.map((m) => (
        <rect
          key={`${m.x}-${m.y}`}
          x={m.x + margin}
          y={m.y + margin}
          width={1}
          height={1}
          fill="#0a0a0a"
        />
      ))}
    </svg>
  )
}
