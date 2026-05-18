# AMSA Dashboard UI Pattern

## Core Concept: Flat Gray Canvas

The dashboard is converging on a **single flat surface** — `bg-gray-50` everywhere. There are no lifted cards, no shadows, no white containers wrapping content. Sections and rows are separated by lines and dividers, not by visual elevation.

---

## Shell / Layout

| Element | Classes |
|---|---|
| Page canvas | `bg-gray-50 h-screen` |
| Sidebar | `bg-gray-50 border-r-2 border-gray-300 w-60` |
| Mobile top bar | `bg-gray-100 border-b-2 border-gray-300` |
| Section dividers | `border-t-2 border-gray-300` |

The sidebar and page share the same base color — no visual separation between chrome and content area.

---

## Navigation (Sidebar)

Active and hover states are gray pills on the flat surface:

```tsx
// Active
"bg-gray-200 text-gray-900"

// Hover
"hover:bg-gray-200 hover:text-gray-900"

// Base
"text-gray-700"
```

- Link shape: `rounded-xl px-4 py-1.5`
- Icon size: `w-5 h-5` strokeWidth `1.8`
- Badge (notifications / admin counts): `bg-red-500 text-white rounded-full min-w-5 h-5`

---

## List / Row Separators

Flat lists (notifications, etc.) use dividers instead of cards:

```
divide-y-2 divide-gray-300
```

Row background is `bg-gray-50` — same as the page, so rows sit flush on the canvas. No border-radius on rows.

---

## Avatars / Identity

Gold circle as the consistent identity element:

```
w-{size} h-{size} rounded-full bg-[#FFCA3A] text-[#001049] font-bold shrink-0 overflow-hidden
```

- Sizes: `w-8 h-8` (sidebar footer), `w-10 h-10` (feed trigger), `w-12 h-12` (composer, notification rows)
- Falls back to uppercase initials when no `profilePic`
- Icon-only rows without an avatar use `bg-[#001049]/10 text-[#001049]` (navy tint circle)

---

## Filter / Tag Chips

Interactive filter chips use `rounded-lg` and `border-2`. Multiple selection is allowed — chips toggle independently without closing the panel.

```tsx
// Inactive
"border-2 border-gray-300 bg-white text-gray-600 hover:border-gray-400"

// Active (selected)
"bg-gray-700 text-white border-gray-700"
```

Used for: topic filters, tag chips. **No navy blue for selected state.**

---

## Segmented Controls (binary / small option sets)

For two-option or short-list toggles (e.g. Answered / Unanswered), use an inline segmented control: a shared rounded container with a border, and the selected segment lifts into a white pill with a shadow.

```tsx
// Container
"inline-flex rounded-xl border-2 border-gray-300 bg-gray-100 p-1 gap-1"

// Segment — inactive
"px-4 py-1.5 rounded-lg text-sm font-semibold text-gray-400"

// Segment — active
"px-4 py-1.5 rounded-lg text-sm font-semibold bg-white text-gray-900 shadow-sm"
```

Used for: binary view toggles, small mutually-exclusive option sets.

---

## Border Radius

Prefer lower radius throughout — avoid `rounded-2xl` on interactive elements and containers.

| Element | Radius |
|---|---|
| Composer / modal shell | `rounded-xl` |
| Action buttons | `rounded-lg` |
| Toolbar icon buttons | `rounded-lg` |
| Dropdowns (emoji, hash) | `rounded-lg` |
| Image previews in composer | `rounded-lg` |
| Nav pills (active/hover) | `rounded-xl` (kept — nav items feel right slightly larger) |
| Avatar | `rounded-full` (always circular) |
| Pill chips (filters, tags) | `rounded-full` (intentional pill shape) |

## Action Buttons

```tsx
// Primary (enabled)
"px-5 py-2 rounded-lg bg-[#001049] text-white text-sm font-semibold hover:opacity-90"

// Disabled
"bg-gray-200 text-gray-500 opacity-40"

// Ghost / toolbar
"p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700"
```

---

## Typography Scale

| Role | Classes |
|---|---|
| Section label | `text-sm font-semibold tracking-wide uppercase text-gray-400` |
| Primary text | `text-base font-semibold text-gray-900` |
| Body text | `text-sm text-gray-700` |
| Meta / timestamp | `text-xs text-gray-400` |
| Accent heading | `text-[#001049]` |

---

## Color Tokens

| Token | Value | Usage |
|---|---|---|
| Navy | `#001049` | Primary action buttons, headings only — not for selected/active states |
| Gold | `#FFCA3A` | Avatar background |
| Canvas | `gray-50` | Entire page surface |
| Active nav | `gray-200` | Nav pill hover/active |
| Divider | `gray-300` (2px) | Section and list separators |

---

## Summary Rule

> **Everything sits on the same `gray-50` surface — no lifted containers.**  
> **Sections are separated by `border-gray-300` lines, not cards.**  
> **Selected filter/tag chips → `bg-gray-700 text-white`. Primary action buttons → `bg-[#001049] text-white`.**  
> **Segmented controls → white pill with shadow on active segment, `bg-gray-100` container.**  
> **Avatars → `bg-[#FFCA3A] rounded-full`.**
