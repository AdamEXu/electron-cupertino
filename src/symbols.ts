/**
 * SF Symbols name → glyph rendering, with zero bundled Apple assets.
 *
 * Symbols live in the SF Pro font that ships with macOS, at Private Use Area
 * codepoints (U+100000+). Rendering one is just dropping the right character
 * into an element styled `font-family: 'SF Pro'` (the `.sf-symbol` class in
 * tokens.css). This module maps a curated set of common symbol names to their
 * codepoints — each pair is a verifiable fact about the installed font, not
 * extracted artwork; nothing from Apple is redistributed.
 *
 * Codepoints CANNOT be derived from any on-disk ordering (assignments are
 * append-only with historical gaps), so never guess: every entry here was
 * verified against the rendering font. Ground truth anchors:
 * xmark = U+100184, sidebar.left = U+1003DA.
 *
 * Need more symbols? `registerSymbols({ 'name': 0x1000XX })` with codepoints
 * you have verified locally (type the candidate character into TextEdit set to
 * SF Pro, or inspect the font's cmap).
 */

const REGISTRY = new Map<string, number>([
  ['gear', 0x10035f],
  ['ant', 0x10031a],
  ['sidebar.left', 0x1003da],
  ['sidebar.right', 0x1003db],
  ['chevron.right', 0x10018a],
  ['chevron.left', 0x100189],
  ['chevron.down', 0x100188],
  ['chevron.up', 0x100187],
  ['plus', 0x10017c],
  ['minus', 0x10017d],
  ['xmark', 0x100184],
  ['xmark.circle.fill', 0x100061],
  ['magnifyingglass', 0x1002ab],
  ['folder', 0x100215],
  ['folder.fill', 0x100216],
  ['doc', 0x100237],
  ['doc.fill', 0x100238],
  ['trash', 0x100211],
  ['star', 0x1002c2],
  ['star.fill', 0x1002c3],
  ['heart', 0x1002b4],
  ['heart.fill', 0x1002b5],
  ['house', 0x10039e],
  ['house.fill', 0x10039f],
  ['person', 0x100269],
  ['person.crop.circle', 0x10026d],
  ['bell', 0x1002d9],
  ['bookmark', 0x10025e],
  ['calendar', 0x100249],
  ['clock', 0x10042b],
  ['tag', 0x1002e1],
  ['paperplane', 0x10021f],
  ['square.and.arrow.up', 0x100202],
  ['square.and.arrow.down', 0x100204],
  ['arrow.clockwise', 0x100148],
  ['arrow.left', 0x10012a],
  ['arrow.right', 0x10012b],
  ['arrow.up', 0x100128],
  ['arrow.down', 0x100129],
  ['ellipsis', 0x100360],
  ['ellipsis.circle', 0x100361],
  ['info.circle', 0x100174],
  ['questionmark.circle', 0x10005c],
  ['exclamationmark.triangle', 0x1001fe],
  ['checkmark', 0x100185],
  ['checkmark.circle', 0x100062],
  ['checkmark.circle.fill', 0x100063],
  ['circle', 0x100000],
  ['circle.fill', 0x100001],
  ['photo', 0x1003c5],
  ['film', 0x1003b6],
  ['music.note', 0x10046a],
  ['mic', 0x1002b0],
  ['link', 0x100263],
  ['lock', 0x1003a0],
  ['lock.open', 0x1003a4],
  ['wifi', 0x100647],
  ['cloud', 0x1001c2],
  ['tray', 0x100223],
  ['archivebox', 0x10022d],
  ['pencil', 0x10020a],
  ['paintbrush', 0x100391],
  ['slider.horizontal.3', 0x100306],
  ['list.bullet', 0x1002f2],
  ['square.grid.2x2', 0x1001f7],
  ['eye', 0x1002ed],
  ['eye.slash', 0x1002ef],
  ['flag', 0x1002c9],
  ['pin', 0x1003a6],
  ['mappin.and.ellipse', 0x1003ab],
  ['location', 0x1002d1],
  ['globe', 0x1001aa],
  ['hammer', 0x100644],
  ['safari', 0x1003ac],
  ['moon', 0x1001b9],
  ['sun.max', 0x1001ad],
  ['bolt', 0x1002e5],
  ['paintpalette', 0x100765],
  ['textformat', 0x100152],
  ['desktopcomputer', 0x100657],
  ['play.fill', 0x100284],
  ['pause.fill', 0x100286],
  ['forward.fill', 0x10028c],
  ['backward.fill', 0x10028a]
])

const FALLBACK_NAME = 'questionmark.circle'

/** The character for a PUA codepoint, ready to drop into a `.sf-symbol` node. */
export function glyph(codepoint: number): string {
  return String.fromCodePoint(codepoint)
}

/**
 * The character for a symbol name. Unknown names render the questionmark
 * fallback (never an empty box) — register the codepoint to fix.
 */
export function symbolGlyph(name: string | null | undefined): string {
  const c = (name && REGISTRY.get(name)) || REGISTRY.get(FALLBACK_NAME)
  return c !== undefined ? glyph(c) : ''
}

/** Whether a symbol name is registered. */
export function hasSymbol(name: string): boolean {
  return REGISTRY.has(name)
}

/** All registered symbol names (sorted). */
export function symbolNames(): string[] {
  return [...REGISTRY.keys()].sort()
}

/**
 * Add or override name → codepoint mappings, e.g. from your own generated
 * index. Codepoints must be verified against the installed SF Pro font.
 */
export function registerSymbols(map: Record<string, number>): void {
  for (const [name, codepoint] of Object.entries(map)) REGISTRY.set(name, codepoint)
}
