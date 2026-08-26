---
name: frontend-expert
description: React 19 + TypeScript frontend specialist. Component architecture, hooks, state management, performance optimization, accessibility, and design system patterns. Use when building, reviewing, or refactoring React components and UI features.
---

# Frontend Expert

React 19 + TypeScript specialist for the Curio trivia app. Knows the project's design system, motion vocabulary, and component patterns.

## Activate When
- `/frontend-expert`, "build a component", "React component"
- "UI", "frontend", "screen", "page", "layout"
- "hooks", "state management", "re-render", "performance"
- "accessibility", "a11y", "keyboard", "ARIA"
- "design system", "tokens", "palette", "theme"
- "animation", "motion", "spring", "transition"
- "responsive", "mobile", "viewport"

## Project Context

### Architecture
- React 19 + Vite SPA, TypeScript strict, npm workspaces
- `apps/web/` — the client
- `apps/web/src/design/` — the design system (Scene, Plate, TimerRing, etc.)
- `apps/web/src/screens/` — phase screens
- `apps/web/src/puzzles/` — puzzle renderers
- `apps/web/src/state/` — client state
- `apps/web/src/net/` — transport layer (remote + local)

### Key Rules
1. **Use `m`, never `motion`** — `LazyMotion` runs in strict mode; `motion.div` throws
2. **Springs only** — `glide`, `snap`, `pounce`, `settle` from `design/motion.ts`
3. **`prefers-reduced-motion`** — always use `maybe()` wrapper; reduced = instant cut
4. **Colour is derived** — never raw hex; use CSS custom properties from `derivePalette`
5. **Elevation is tonal** — step up container ladder, shadow is secondary
6. **One interaction model** — `.state` composite on hover/focus/press, no per-component hover
7. **`Scene` is the layout** — rail (context) / stage (scroll) / dock (actions)
8. **Gestures always have tap fallback** — drag-or-tap, a gesture nobody discovers is worse than none

### Type Roles
- `--font-display` — pack's face, content (question, options, primary button)
- `--font-ui` — Bricolage Grotesque, structure (labels, hints, toggles)
- `--font-num` — Inter, figures only, `.num` class on anything that changes in place

## Workflow

### 1. Assess Before Building
```bash
# Check existing patterns
grep -r "from.*design/" apps/web/src/ --include="*.tsx" -l | head -5
grep -r "from.*motion" apps/web/src/ --include="*.tsx" -l | head -5
grep -r "Scene\|Plate\|Board" apps/web/src/screens/ --include="*.tsx" -l | head -5
```
- Read the nearest existing component for style reference
- Check `apps/web/src/design/index.ts` for exported primitives
- Match the existing naming: PascalCase components, camelCase hooks

### 2. Component Architecture
**Composition over configuration.** Small focused components. Slot pattern for layouts.

**Hierarchy:** Pages → Screens → Features → UI Components → Atoms

**Rules:**
- One thing per component
- Small props interfaces (3-5 props max)
- Composition over prop drilling
- Feature folders over tech folders
- Export from `index.ts` barrel files

**Custom Hooks:** Extract stateful logic. Name with `use` prefix.
```
useMediaQuery, useCountdown, usePhaseTimer, useGameSocket
```

### 3. State Management
| Type | Solution |
|------|----------|
| Server/async (API) | Transport layer (`apps/web/src/net/`) |
| URL (params) | `useSearchParams` |
| Form | Controlled inputs + validation |
| Local UI | `useState` / `useReducer` |
| Shared UI | React Context (keep thin) |

The app avoids external state libraries. Follow the existing pattern.

### 4. Performance
1. **`React.memo`** — only with measured evidence of unnecessary re-renders
2. **`useMemo`** — only for expensive computations (>1ms)
3. **`useCallback`** — only when passed to memoized child
4. **Code splitting** — `lazy()` + `Suspense` at route level
5. **Virtualization** — for lists >100 items (not common in this app)
6. **CSS animations** — prefer over JS for simple cases (timer ring uses CSS animation)

**GOLDEN RULE:** Measure before optimizing. Profile, don't guess.

### 5. Motion & Animation
- Import from `design/motion.ts`: `glide`, `snap`, `pounce`, `settle`, `maybe`
- Import `m` from `motion/react`, never `motion` directly
- Wrap transitions in `maybe()` for reduced-motion support
- Use `layoutId` for shared element transitions between phases
- Stagger with `cascade()` for list arrivals
- Springs are interruptible — tap during exit redirects, doesn't queue

### 6. Accessibility
- Semantic HTML first: `<button>`, `<nav>`, `<main>`, `<article>`
- ARIA only when HTML semantics aren't enough
- Keyboard navigation: Tab order, Enter/Space activation, Escape to dismiss
- Focus management: trap focus in modals, return focus on close
- Screen reader: `aria-live` for dynamic content, `aria-label` for icon buttons
- Colour contrast: the design system's `contrastProblems` assertion catches this
- Reduced motion: `maybe()` wraps all springs

### 7. Testing Components
- **Vitest** + **React Testing Library** (project standard)
- Test user behavior, not implementation
- `render` → `screen.getByRole` → `userEvent.*`
- Mock transport layer, not hooks
- One test file per component, co-located

```typescript
// Example test pattern
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Component } from "./Component";

describe("Component", () => {
  it("does the thing", async () => {
    const user = userEvent.setup();
    render(<Component />);
    await user.click(screen.getByRole("button", { name: /action/i }));
    expect(screen.getByText("result")).toBeInTheDocument();
  });
});
```

### 8. TypeScript Patterns
- Strict mode — no `any`, no `@ts-ignore`
- Prefer `interface` for component props, `type` for unions/intersections
- Use discriminated unions for phase/state machines
- Generic components with `Props<T>` pattern when needed
- Utility types: `Pick`, `Omit`, `Extract`, `NonNullable`
- Type guards: custom `is` functions for narrowing
- Return types: explicit on exported functions, inferred on internal

### 9. CSS Patterns
- CSS Modules with `.css` files (project convention)
- CSS custom properties for theming (from design system)
- No inline styles except dynamic values
- BEM-like naming: `.component__element--modifier`
- Layout: `Scene` for page layout, flexbox for components
- Responsive: mobile-first, `clamp()` for fluid typography

## Hard Rules
1. Never use `motion.div` — always `m.div` from `motion/react`
2. Never hardcode colours — use CSS custom properties from the palette
3. Never skip `maybe()` on animations — respect reduced motion
4. Never add external state libraries without explicit approval
5. Always test with `npm run check` after changes
6. Always match existing component style in the target directory
7. Never use `any` — find or create the proper type
