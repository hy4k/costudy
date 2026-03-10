# CoStudy Design System — Reference

Detailed markup examples for component patterns.

## Liquid Glass Card

Use on dark backgrounds (e.g. inside LampContainer):

```tsx
<div className="relative rounded-2xl p-6 sm:p-8 backdrop-blur-xl bg-white/60 border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.08)] transition-all duration-300 hover:bg-white/70">
  <span className="block text-2xl sm:text-3xl font-black text-slate-900 mb-3 sm:mb-4 font-mono">1</span>
  <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">Title</h3>
  <p className="text-slate-600 text-sm sm:text-[15px] leading-relaxed font-medium">Description.</p>
</div>
```

## Stacked Card

Full markup with hover states:

```tsx
<div className="relative group aspect-[3/2]">
  <div className="absolute inset-0 -z-10 bg-white border-4 border-slate-800 rounded-xl rotate-[-6deg] translate-y-[-2%] transition-transform duration-300 group-hover:rotate-[-4deg]" />
  <div className="absolute inset-0 -z-10 bg-white border-4 border-slate-800 rounded-xl rotate-[6deg] translate-y-[2%] transition-transform duration-300 group-hover:rotate-[4deg]" />
  <div className="relative h-full bg-white border-4 border-slate-800 rounded-xl p-6 sm:p-8 flex flex-col justify-center transition-transform duration-300 group-hover:rotate-[2deg]">
    <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-2">Card Title</h3>
    <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Card description.</p>
  </div>
</div>
```

## Button Variants

**Primary CTA:**
```tsx
<button className="px-6 sm:px-8 py-3 sm:py-3.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-sm uppercase tracking-wider transition-all shadow-lg shadow-red-500/20 hover:shadow-red-500/30">
  Join the Beta →
</button>
```

**Secondary:**
```tsx
<button className="px-6 sm:px-8 py-3 sm:py-3.5 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold rounded-lg text-sm uppercase tracking-wider transition-all">
  Sign In
</button>
```

**Glass (on light/mint backgrounds):**
```tsx
<button className="px-8 sm:px-10 py-3.5 sm:py-4 backdrop-blur-xl bg-white/70 hover:bg-white/90 border border-white/20 rounded-xl font-bold text-slate-800 text-sm uppercase tracking-wider transition-all shadow-[0_8px_32px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
  Apply as Teacher →
</button>
```

**Ghost / outline:**
```tsx
<button className="w-full py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-lg text-sm transition-all">
  Get Started
</button>
```

## Section Layout Template

```tsx
<section className="py-16 sm:py-20 md:py-28 px-4 sm:px-6 bg-[SECTION_BG]">
  <div className="max-w-6xl mx-auto">
    <div className="text-center mb-10 sm:mb-14">
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-4">
        Section Title
      </h2>
      <p className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto text-sm sm:text-base">
        Optional subheading.
      </p>
    </div>
    {/* Content */}
  </div>
</section>
```

## Badge / Pill

```tsx
<span className="inline-block px-4 py-1.5 rounded-full bg-emerald-200/80 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider">
  For Teachers
</span>
```
