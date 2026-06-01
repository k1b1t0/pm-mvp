---
name: apple-ui-skill
description: >
  Build web UIs in the Apple / Things 3 design style: clean, minimal, refined, premium-feeling.
  Use this skill whenever the user wants an Apple-style, iOS-style, macOS-style, or Things-inspired
  interface, or describes the aesthetic as "clean", "minimal", "simple and beautiful", "calm UI",
  "productivity app feel", or "premium but not flashy". Also apply for expense trackers, task managers,
  note-taking apps, dashboards, or any MVP web app that should feel polished without visual noise.
  This skill targets Vanilla HTML/CSS/JS only — no frameworks, no build tools. All state persists
  via localStorage so the app works across browser sessions without a backend.
---

# Apple / Things UI Style — Vanilla HTML/CSS/JS

Design philosophy: **"Content is the interface."** Every element serves the content.
Whitespace is intentional. Motion is subtle. Color is restrained.

---

## Tech Constraints (MVP)

- **Stack**: Vanilla HTML + CSS + JS only. No React, no Vue, no build step.
- **Persistence**: Use `localStorage` for all app state. Data survives browser refresh and
  reopening — it is scoped to the origin (domain + port) and stays until the user clears
  browser data. This is the correct choice for a single-user MVP with no backend.
- **Fonts**: Use the system font stack. Do NOT load Google Fonts or any external font.
  `-apple-system, BlinkMacSystemFont, "Helvetica Neue", system-ui, sans-serif`
  renders as SF Pro on Apple devices — which is the entire point.
- **Icons**: Use Unicode symbols or inline SVG. No icon library imports.
- **Single file preferred**: Keep HTML/CSS/JS in one `.html` file unless complexity demands
  separate files. For an MVP, one file is easier to share, open, and iterate on.

---

## localStorage Pattern

```js
// Save state
function saveData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Load state (with fallback default)
function loadData(key, fallback = null) {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : fallback;
}

// Usage example for an expense app
let expenses = loadData('expenses', []);

function addExpense(item) {
  expenses.push(item);
  saveData('expenses', expenses);
  render();
}
```

Always call `saveData` after every mutation. Call `loadData` once on page load inside a
`DOMContentLoaded` listener to restore state.

---

## Design Tokens

Declare all tokens as CSS custom properties on `:root`. Never hardcode colors or sizes
outside of these variables.

```css
:root {
  /* System font — renders as SF Pro on Apple, native on all platforms */
  --font: -apple-system, BlinkMacSystemFont, "Helvetica Neue", system-ui, sans-serif;
  --font-mono: ui-monospace, "SF Mono", monospace;

  /* Type scale */
  --text-xs:   11px;
  --text-sm:   13px;
  --text-base: 15px;
  --text-md:   17px;
  --text-lg:   20px;
  --text-xl:   24px;
  --text-2xl:  28px;
  --text-3xl:  34px;

  /* Weight */
  --w-regular:  400;
  --w-medium:   500;
  --w-semibold: 600;
  --w-bold:     700;

  /* Spacing — 4px base grid */
  --s1: 4px;   --s2: 8px;   --s3: 12px;  --s4: 16px;
  --s5: 20px;  --s6: 24px;  --s8: 32px;  --s10: 40px;
  --s12: 48px; --s16: 64px;

  /* Border radius */
  --r-sm:   6px;
  --r-md:   10px;
  --r-lg:   14px;
  --r-xl:   20px;
  --r-full: 9999px;

  /* Shadows — intentionally light */
  --shadow-xs: 0 1px 2px rgba(0,0,0,0.04);
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04);

  /* Transitions */
  --ease: cubic-bezier(0.25, 0.46, 0.45, 0.94);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --t-fast: 120ms;
  --t-normal: 200ms;

  /* Colors — Light mode */
  --bg:           #FFFFFF;
  --bg-secondary: #F2F2F7;
  --bg-card:      #FFFFFF;

  --label:        rgba(0, 0, 0, 0.88);
  --label-2:      rgba(0, 0, 0, 0.50);
  --label-3:      rgba(0, 0, 0, 0.30);
  --label-4:      rgba(0, 0, 0, 0.18);

  --fill:         rgba(120, 120, 128, 0.20);
  --fill-2:       rgba(120, 120, 128, 0.16);
  --fill-3:       rgba(118, 118, 128, 0.12);

  --separator:    rgba(60, 60, 67, 0.12);

  --accent:       #007AFF;
  --accent-hover: #0066D6;
  --accent-bg:    rgba(0, 122, 255, 0.10);

  --red:    #FF3B30;
  --green:  #34C759;
  --orange: #FF9500;
  --yellow: #FFCC00;
}

/* Dark mode — auto via media query */
@media (prefers-color-scheme: dark) {
  :root {
    --bg:           #1C1C1E;
    --bg-secondary: #000000;
    --bg-card:      #2C2C2E;

    --label:   rgba(255, 255, 255, 0.92);
    --label-2: rgba(235, 235, 245, 0.60);
    --label-3: rgba(235, 235, 245, 0.30);
    --label-4: rgba(235, 235, 245, 0.18);

    --fill:   rgba(120, 120, 128, 0.36);
    --fill-2: rgba(120, 120, 128, 0.28);
    --fill-3: rgba(118, 118, 128, 0.24);

    --separator: rgba(84, 84, 88, 0.65);

    --accent:       #0A84FF;
    --accent-hover: #409CFF;
    --accent-bg:    rgba(10, 132, 255, 0.15);

    --red:    #FF453A;
    --green:  #30D158;
    --orange: #FF9F0A;
  }
}

/* Base reset */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: var(--font);
  font-size: var(--text-base);
  color: var(--label);
  background: var(--bg-secondary);
  -webkit-font-smoothing: antialiased;
}
```

---

## Component Patterns

### Page Layout

```html
<div class="app">
  <aside class="sidebar">...</aside>
  <main class="content">...</main>
</div>
```
```css
.app {
  display: flex;
  height: 100vh;
  overflow: hidden;
}
.sidebar {
  width: 240px;
  flex-shrink: 0;
  background: var(--bg-secondary);
  border-right: 1px solid var(--separator);
  overflow-y: auto;
  padding: var(--s4);
}
.content {
  flex: 1;
  overflow-y: auto;
  padding: var(--s8);
  background: var(--bg-secondary);
}
```

For single-column apps (no sidebar): use `max-width: 680px; margin: 0 auto; padding: var(--s8) var(--s4);`

### Section Header (iOS grouped style)

```html
<div class="section-header">This Month</div>
```
```css
.section-header {
  font-size: var(--text-xs);
  font-weight: var(--w-semibold);
  letter-spacing: 0.4px;
  text-transform: uppercase;
  color: var(--label-2);
  padding: var(--s4) var(--s4) var(--s2);
}
```

### List Card (grouped rows on white card)

```html
<div class="list-card">
  <div class="list-item">...</div>
  <div class="list-item">...</div>
</div>
```
```css
.list-card {
  background: var(--bg-card);
  border-radius: var(--r-lg);
  box-shadow: var(--shadow-xs);
  overflow: hidden;
}
.list-item {
  display: flex;
  align-items: center;
  gap: var(--s3);
  padding: 12px var(--s4);
  cursor: pointer;
  transition: background var(--t-fast) var(--ease);
}
.list-item:hover  { background: var(--fill-3); }
.list-item:active { background: var(--fill-2); }
.list-item + .list-item { border-top: 1px solid var(--separator); }
```

### Button

```css
.btn {
  font-family: var(--font);
  font-size: var(--text-base);
  font-weight: var(--w-semibold);
  padding: 10px var(--s5);
  border-radius: var(--r-md);
  border: none;
  cursor: pointer;
  transition: all var(--t-fast) var(--ease);
  letter-spacing: -0.2px;
}
.btn-primary {
  background: var(--accent);
  color: #fff;
}
.btn-primary:hover  { background: var(--accent-hover); }
.btn-primary:active { transform: scale(0.97); }
.btn-secondary {
  background: var(--fill-3);
  color: var(--label);
}
.btn-destructive { background: transparent; color: var(--red); }
```

### Input / Text Field (filled style, no border)

```css
.input {
  font-family: var(--font);
  font-size: var(--text-base);
  color: var(--label);
  background: var(--fill-3);
  border: none;
  border-radius: var(--r-md);
  padding: 10px var(--s4);
  width: 100%;
  outline: none;
  transition: background var(--t-fast), box-shadow var(--t-fast);
}
.input:focus {
  background: var(--fill-2);
  box-shadow: 0 0 0 3px var(--accent-bg);
}
.input::placeholder { color: var(--label-3); }
```

### Amount / Badge Chip

```css
.chip {
  display: inline-flex;
  align-items: center;
  font-size: var(--text-xs);
  font-weight: var(--w-semibold);
  padding: 3px 9px;
  border-radius: var(--r-full);
  background: var(--fill-2);
  color: var(--label-2);
}
.chip-green  { background: rgba(52,199,89,0.12);  color: var(--green); }
.chip-red    { background: rgba(255,59,48,0.12);   color: var(--red); }
.chip-accent { background: var(--accent-bg); color: var(--accent); }
```

### Circle Checkbox (Things-style)

```html
<button class="checkbox" aria-checked="false" role="checkbox">
  <svg class="check-icon" viewBox="0 0 12 10" fill="none">
    <polyline points="1,5 4.5,8.5 11,1" stroke="white" stroke-width="1.8"
              stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
</button>
```
```css
.checkbox {
  width: 22px; height: 22px;
  border-radius: var(--r-full);
  border: 2px solid var(--separator);
  background: transparent;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  transition: all var(--t-normal) var(--ease-spring);
}
.checkbox[aria-checked="true"] {
  background: var(--accent);
  border-color: var(--accent);
}
.check-icon { opacity: 0; transition: opacity var(--t-fast); }
.checkbox[aria-checked="true"] .check-icon { opacity: 1; }
```

---

## Typography Rules

| Use case | Size | Weight | Notes |
|---|---|---|---|
| Screen title | 28–34px | bold | `letter-spacing: -1px` |
| Section heading | 20–24px | semibold | `letter-spacing: -0.5px` |
| List item title | 15–17px | medium | — |
| Metadata / label | 13px | regular | `color: var(--label-2)` |
| Timestamp / caption | 11–13px | regular | `color: var(--label-3)` |
| Section header | 11px | semibold | ALL CAPS, `letter-spacing: 0.4px` |

Never use pure `#000000` for text — always `rgba(0,0,0,0.88)` or `var(--label)`.

---

## Anti-Patterns — Never Do These

- ❌ Large background gradients
- ❌ Colored or heavy borders (use `var(--separator)` only)
- ❌ Dark/large drop shadows
- ❌ Animations longer than 350ms
- ❌ External fonts (Inter, Roboto, Lato, etc.) — system font only
- ❌ Multiple accent colors simultaneously
- ❌ `border-radius` below 6px — always feels too boxy
- ❌ Full-width CTA buttons on desktop
- ❌ `font-weight: 400` on interactive elements — minimum 500
- ❌ Packing too much on one screen — hide complexity, progressive disclosure

---

## Pre-flight Checklist

- [ ] All colors/sizes use CSS custom properties, no hardcoded values
- [ ] Dark mode handled via `prefers-color-scheme` automatically
- [ ] System font stack used — no external font imports
- [ ] Every interactive element has hover + active + focus state
- [ ] All app state saved to `localStorage` after every mutation
- [ ] State loaded from `localStorage` inside `DOMContentLoaded`
- [ ] Large headings use negative `letter-spacing`
- [ ] Layout has `max-width` and is centered (for single-column)
- [ ] No inline styles — all styling via classes and CSS variables