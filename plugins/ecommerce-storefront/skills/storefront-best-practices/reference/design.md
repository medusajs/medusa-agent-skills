# Design Guidelines

## Contents

- [Overview](#overview)
- [Discovering Existing Brand Identity](#discovering-existing-brand-identity)
- [Critical Consistency Rules](#critical-consistency-rules)
- [When to Ask User Approval](#when-to-ask-user-approval)
- [New Project Setup](#new-project-setup)
- [Decision Tree](#decision-tree)
- [Common Mistakes](#common-mistakes)

## Overview

**Purpose:** Provide guardrails to maintain brand consistency when building UI components. This prevents agents from accidentally introducing inconsistent colors, fonts, or design patterns.

**Critical principle:** ALWAYS discover and use existing design tokens before creating new components. NEVER introduce new colors or fonts without user approval.

**When to apply:** Before creating any UI component or design-related change.

## Discovering Existing Brand Identity

Before implementing any component, identify existing brand colors, typography, and design patterns. AI agents can do this - focus on WHAT to look for, not detailed HOW.

### What to Look For

**Colors:**
1. **Tailwind config** (`tailwind.config.ts/js`) - Check `theme.extend.colors` or `theme.colors`
2. **CSS variables** (globals.css, app.css) - Look for `:root { --color-primary: ... }`
3. **Existing components** - Scan 2-3 components for color usage patterns

**Typography:**
1. **Tailwind config** - Check `theme.extend.fontFamily`
2. **Font imports** - Look in layout files or CSS (Next.js `next/font`, Google Fonts, local fonts)
3. **CSS variables** - Check for `--font-sans`, `--font-heading`
4. **Existing components** - Identify font usage patterns

**Other patterns:**
- Spacing scale (p-4, mb-6, etc.)
- Border radius (rounded-lg, rounded-xl)
- Shadows (shadow-md, shadow-lg)
- Interactive states (hover, focus colors)

### Detecting Tailwind Version (CRITICAL)

**ALWAYS check the Tailwind CSS version before writing utility classes.**

Tailwind v3 and v4 have different syntax, and mixing them causes errors.

**How to detect version:**
1. **Check `package.json`**: Look for `"tailwindcss": "^3.x.x"` or `"tailwindcss": "^4.x.x"`
2. **Check config file**:
   - v3: Uses `tailwind.config.js/ts` with `module.exports` or `export default`
   - v4: May use CSS-based config with `@import "tailwindcss"`
3. **Check existing components**: Look at class usage patterns

**Key differences:**

**Tailwind v3:**
```tsx
// v3 syntax
<div className="bg-primary text-white">Content</div>
```

**Tailwind v4:**
```tsx
// v4 may use CSS variables differently
// Check the project's existing patterns
<div className="bg-primary text-white">Content</div>
```

**Common mistake:** Using v3 syntax in v4 projects or vice versa. Always verify the version first.

### Document Discovery

Create mental inventory of:
- **Primary color(s)** and their usage
- **Font families** (sans, serif, heading, mono)
- **Common patterns** (button styles, card designs, spacing)
- **Semantic names** (primary, secondary, accent vs blue-500, red-600)

## Critical Consistency Rules

### ALWAYS Follow These Rules

✅ **NEVER use emojis in storefront UI** - Always use icons or images instead

```tsx
// ✅ CORRECT - Using icon component or image
<button className="flex items-center gap-2">
  <ShoppingCartIcon className="w-5 h-5" />
  Add to Cart
</button>

// ❌ WRONG - Using emoji
<button>
  🛒 Add to Cart
</button>
```

**Why:** Emojis appear differently across platforms, lack professional appearance, and can cause accessibility issues. Use icon libraries (Heroicons, Lucide, Font Awesome) or SVG images instead.

✅ **USE existing design tokens** (colors, fonts, spacing from theme)

```tsx
// ✅ CORRECT - Using theme colors
<button className="bg-primary text-white hover:bg-primary-dark">
  Click Me
</button>

// ❌ WRONG - Arbitrary colors when theme exists
<button className="bg-[#3B82F6] text-white hover:bg-[#2563EB]">
  Click Me
</button>
```

✅ **USE existing font definitions**, not new font families

```tsx
// ✅ CORRECT - Using theme font
<h1 className="font-heading text-4xl font-bold">
  Welcome
</h1>

// ❌ WRONG - Introducing new font
<h1 className="font-['Montserrat'] text-4xl font-bold">
  Welcome
</h1>
```

✅ **MATCH patterns from existing components**

```tsx
// If existing buttons use: bg-primary px-6 py-3 rounded-lg
// New buttons should use the same pattern
<button className="bg-primary px-6 py-3 rounded-lg">
  New Button
</button>
```

### NEVER Do These Things

❌ **DON'T introduce new colors without user approval**
- If you need a color not in the theme, ASK first
- Don't use arbitrary values like `bg-[#FF6B6B]` when theme has colors

❌ **DON'T add new fonts without user approval**
- If current design uses Inter, don't add Montserrat without asking
- Don't use `font-['NewFont']` syntax when theme fonts exist

❌ **DON'T use hard-coded values when theme tokens exist**
- Use `bg-primary` not `bg-[#3B82F6]`
- Use `p-6` not `p-[24px]`
- Use `font-heading` not `font-['Poppins']`

❌ **DON'T create inconsistent patterns**
- If buttons use `rounded-lg`, all buttons should
- If cards use `shadow-md`, all cards should
- If hover effects use `hover:bg-primary-dark`, be consistent

## When to Ask User Approval

**ALWAYS ask before:**

### 1. Adding New Color

```
"I notice the current palette doesn't include an orange accent color.
Should I add one, or would you prefer to use the existing accent color?"
```

**Scenario:** You're building a promotional banner that needs an orange color, but theme only has blue/purple.

### 2. Adding New Font

```
"The current design uses Inter for all text. Do you want me to add
a different font for headings, or keep using Inter throughout?"
```

**Scenario:** Building a hero section and wondering if headings should use a different font.

### 3. Changing Existing Definitions

```
"Should I update the primary color to #3B82F6, or create a
new color variant?"
```

**Scenario:** Current primary is #2563EB but new design mockup shows #3B82F6.

### 4. Creating New Pattern

```
"The current components don't have a ghost button style (transparent with border).
Should I create one, or use an existing button variant?"
```

**Scenario:** Need a subtle button style that doesn't exist yet.

### DON'T Ask About

❌ Standard web dev decisions (responsive breakpoints, hover effects)
❌ Component structure or layout choices
❌ Accessibility patterns (AI agents know WCAG)
❌ Using existing theme colors/fonts in new ways

## New Project Setup

When starting a new project WITHOUT existing theme:

### Ask User These Questions

**1. Brand Colors:**
```
"What are your brand colors? Please provide:
- Primary color (main brand color)
- Secondary color (optional)
- Any specific hex codes or color preferences?"
```

**2. Font Preferences:**
```
"Do you have font preferences?
- Modern and clean (Inter, Poppins)
- Classic and professional (Merriweather, Lora)
- Specific fonts?
- Or should I choose appropriate fonts?"
```

**3. Design Style:**
```
"What design style do you prefer?
- Minimal (lots of whitespace, clean lines)
- Bold (vibrant colors, large typography)
- Professional (conservative, trust-focused)
- Modern (rounded corners, gradients, shadows)"
```

**4. Reference Sites (Optional):**
```
"Do you have 2-3 example websites you like the look of?
This helps me understand your aesthetic preferences."
```

### Setup Theme Configuration

After gathering preferences, configure Tailwind theme:

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',     // User's primary color
        secondary: '#8B5CF6',    // User's secondary
        accent: '#F59E0B',       // Accent if needed
        // Full scales if sophisticated design
        brand: {
          50: '#eff6ff',
          500: '#3b82f6',
          900: '#1e3a8a',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Poppins', 'sans-serif'],
      },
    },
  },
}
```

**Use Tailwind CSS for all new projects** - industry standard for ecommerce, highly customizable, excellent DX.

## Decision Tree

**When creating any component:**

```
1. Does a theme configuration exist?
   ├─ Yes → Extract colors/fonts from theme
   │         Use existing tokens for new component
   └─ No → Ask user for brand preferences
           Create theme configuration

2. Are there similar existing components?
   ├─ Yes → Follow their patterns exactly
   │         (spacing, colors, hover states)
   └─ No → Check ANY existing components
           Extract general patterns (spacing scale, hover effects)

3. Do you need a color/font not in theme?
   ├─ Yes → ASK user for approval before adding
   │         Explain why you need it
   └─ No → Proceed with existing tokens

4. Are you unsure about a design pattern?
   ├─ Yes → Check 2-3 existing components for guidance
   │         Follow majority pattern
   └─ No → Implement using theme tokens
           Maintain consistency with existing components
```

## Common Mistakes

### ❌ Using Arbitrary Values When Theme Exists

**Problem:** Using `bg-[#3B82F6]` when `bg-primary` exists.

**Why it's wrong:** Bypasses theme, creates inconsistency, harder to maintain.

**Fix:** Always use semantic names from theme.

### ❌ Introducing New Colors Without Permission

**Problem:** Adding `text-orange-500` when theme doesn't have orange.

**Why it's wrong:** User may not want orange in their brand, creates color chaos.

**Fix:** Ask user first: "Should I add an orange color, or use existing accent?"

### ❌ Not Checking Existing Patterns

**Problem:** Creating buttons with `rounded-full` when all other buttons use `rounded-lg`.

**Why it's wrong:** Visual inconsistency confuses users.

**Fix:** Check 2-3 existing buttons, use same rounding.

### ❌ Adding Fonts Without Permission

**Problem:** Using `font-['Montserrat']` when theme uses Inter everywhere.

**Why it's wrong:** Fonts are brand identity - can't arbitrarily change.

**Fix:** Use existing `font-heading` or `font-sans`, or ask to add Montserrat.

### ❌ Using Inline Styles Instead of Theme

**Problem:** `style={{ backgroundColor: '#3B82F6', padding: '24px' }}`

**Why it's wrong:** Bypasses Tailwind theme, not responsive, harder to maintain.

**Fix:** Use Tailwind classes: `bg-primary p-6`

### ❌ Mixing Tailwind v3 and v4 Syntax

**Problem:** Using Tailwind v3 syntax in a v4 project, or vice versa.

**Why it's wrong:** Different versions have different configuration and syntax patterns. Mixing them causes build errors and unexpected styling behavior.

**Fix:** Check `package.json` for Tailwind version first. Look at existing components to understand the syntax patterns used in the project. Match the version-specific patterns consistently.

### ❌ Inconsistent Interactive States

**Problem:** Some buttons use `hover:bg-primary-600`, others use `hover:brightness-110`.

**Why it's wrong:** Inconsistent user experience.

**Fix:** Check existing buttons, use same hover pattern everywhere.

### ❌ Creating Theme Changes Without Approval

**Problem:** Adding new color to `tailwind.config.ts` without asking.

**Why it's wrong:** Theme changes affect entire project, need user agreement.

**Fix:** Ask first, explain rationale, get approval.

## Summary Checklist

**Before creating any component:**

- [ ] **Detected Tailwind CSS version (v3 or v4) from package.json**
- [ ] Checked for existing theme configuration (Tailwind config or CSS variables)
- [ ] Extracted existing colors and documented them
- [ ] Extracted existing fonts and documented them
- [ ] Reviewed 2-3 existing components for patterns
- [ ] Identified spacing scale, border radius, shadow patterns
- [ ] Confirmed I'm using theme tokens, not arbitrary values
- [ ] Matched hover/focus states from existing components
- [ ] Verified color contrast meets WCAG 2.1 AA (4.5:1 for text) - Use [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [ ] Asked user before adding any new colors or fonts
- [ ] Maintained visual consistency across all components

**This is about CONSISTENCY, not creating new designs.** Match what exists, ask before changing.
