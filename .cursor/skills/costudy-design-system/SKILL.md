---
name: costudy-design-system
description: CoStudy brand colors, typography, spacing, and component patterns. Use when designing UI, creating components, styling pages, or editing Landing, views, or components.
---

# CoStudy Design System

Apply these tokens and patterns consistently when building or editing UI in the CoStudy frontend.

## Colors

**Brand palette** (from `main.css`, Tailwind `brand-*`):

| Token | Hex | Usage |
|-------|-----|-------|
| brand-50 | #fff1f1 | Light tints |
| brand-500 | #ff1a1a | Primary CTA, accents |
| brand-600 | #ed0000 | Hover state |
| brand-900 | #890b0b | Dark red |

**Section backgrounds** (top to bottom):

- Hero: `bg-white` (light) / `dark:bg-slate-950`
- Features: `bg-slate-900` (Lamp container)
- Teachers: `bg-[#e6ffed]` / `dark:bg-emerald-950/40`
- Pricing: `bg-slate-50` / `dark:bg-slate-900`
- CTA: `bg-[#1a1c29]`
- Footer: `bg-[#10121a]`

**Neutrals**: Use `slate-*` for text, borders, secondary UI. `#0a0a0a` for hero text.

## Typography

- **Font stack**: Plus Jakarta Sans (headings), Geist (body), Geist Mono (mono)
- **Hero**: `font-extrabold` (800), `tracking-tighter`, `text-[#0a0a0a]`
- **Subheadings**: `font-medium`, `tracking-[0.2em]`, `uppercase`, `text-slate-500`
- **Section headers**: `font-extrabold` or `font-black`, `tracking-[0.15em] uppercase`
- **Card titles**: `font-semibold`; body text: `font-medium`

## Spacing

- **Section padding**: `py-16 sm:py-20 md:py-28 px-4 sm:px-6`
- **Container**: `max-w-6xl mx-auto` (or `max-w-5xl` for narrower)
- **Grid gaps**: `gap-3 sm:gap-4`, `gap-4 sm:gap-6`, `gap-8 sm:gap-10` for cards
- **Section header margin**: `mb-10 sm:mb-14`

## Component Patterns

### Liquid Glass

Frosted glass on dark backgrounds:

```
backdrop-blur-xl bg-white/60 border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.08)] hover:bg-white/70
```

### Stacked Cards

Wrapper with pseudo-stack layers:

```tsx
<div className="relative group aspect-[3/2]">
  <div className="absolute inset-0 -z-10 bg-white border-4 border-slate-800 rounded-xl rotate-[-6deg] translate-y-[-2%] transition-transform duration-300 group-hover:rotate-[-4deg]" />
  <div className="absolute inset-0 -z-10 bg-white border-4 border-slate-800 rounded-xl rotate-[6deg] translate-y-[2%] transition-transform duration-300 group-hover:rotate-[4deg]" />
  <div className="relative h-full bg-white border-4 border-slate-800 rounded-xl p-6 sm:p-8 flex flex-col justify-center transition-transform duration-300 group-hover:rotate-[2deg]">
    {/* content */}
  </div>
</div>
```

### Primary CTA

```
bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg uppercase tracking-wider
```

### Secondary Button

```
bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold rounded-lg uppercase tracking-wider
```

### Glass Button (on light backgrounds)

```
backdrop-blur-xl bg-white/70 hover:bg-white/90 border border-white/20 rounded-xl font-bold text-slate-800 text-sm uppercase tracking-wider shadow-[0_8px_32px_rgba(0,0,0,0.08)]
```

### Lamp

Use `LampContainer` from `components/ui/lamp.tsx` for dark gradient sections. Pass `compact` for smaller sections.

```tsx
<LampContainer compact className="bg-slate-900">
  {/* content */}
</LampContainer>
```

## Dark Mode

- Tailwind: `darkMode: 'class'`
- Storage key: `costudy-dark-mode`
- Always provide `dark:` variants for text, backgrounds, borders

## Additional Resources

For detailed markup examples, see [reference.md](reference.md).
