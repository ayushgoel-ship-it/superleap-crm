# Design System Conventions (Wave D5)

Single source of truth for visual conventions across Superleap CRM. All new
components MUST follow these rules; existing components migrate opportunistically.

## Tone vocabulary
Use exactly one tone vocabulary across the codebase:
`success | warning | danger | info | neutral`

Mapped to CSS custom properties in `src/styles/globals.css`:
- `--color-semantic-success` (emerald-600)
- `--color-semantic-warning` (amber-600)
- `--color-semantic-danger`  (rose-600)
- `--color-semantic-info`    (indigo-600)
- `--color-semantic-neutral` (slate-600)

Deprecated palettes (DO NOT introduce new usages):
- `green-* / amber-* / red-*`
- ad-hoc `success / info / warning / danger` props with custom mappings

## Radius
Three values only:
- `rounded-lg`  (8px)  — inputs, small chips, dense controls
- `rounded-xl`  (12px) — secondary cards, popovers
- `rounded-2xl` (16px) — primary cards, hero blocks
- `rounded-full`        — pills, badges, avatars

NO `rounded-md`, `rounded-3xl`, or arbitrary `rounded-[Npx]`.

## Shadow
Four values only:
- (none)       — flat surfaces, list rows
- `shadow-sm`  — standard cards
- `shadow-md`  — interactive / hover
- `shadow-lg`  — modals, popovers, drawers

NO `shadow-xl`, `shadow-2xl`, or custom shadows.

## Spacing
Tailwind defaults. Prefer:
- `gap-1.5 / 2 / 3 / 4` for flex/grid
- `p-3 / p-4` for cards
- `space-y-2 / space-y-3 / space-y-4` for stacks

NO `p-[Npx]` or arbitrary spacing values except for visual fine-tuning of icons.

## Typography
Until a full type-scale lands:
- Headings: `text-sm font-semibold` (card title), `text-base font-semibold` (section)
- Body:     `text-[12px]` or `text-xs` (dense), `text-sm` (default)
- Caption:  `text-[11px] text-slate-500`
- Micro:    `text-[10px] text-slate-400`

Do NOT introduce new arbitrary pixel sizes (`text-[13px]`, `text-[15px]`, etc.).

## Primitives — first preference
When building or refactoring a component, reach for these primitives from
`src/components/primitives` BEFORE writing bespoke markup:

| Primitive       | Replaces                                                |
| --------------- | ------------------------------------------------------- |
| `Card`          | bespoke `rounded-2xl bg-white border` blocks            |
| `CardHeader`    | repeated icon+title+subtitle header rows                |
| `Chip`          | inline status badges, tag pills                         |
| `ProgressBar`   | inline `bg-slate-100` + colored fill div                |
| `ProgressRing`  | custom SVG circle progress                              |
| `MetricDisplay` | label + value + target rows                             |
| `SegmentControl`| two-state toggles, view switchers                       |
| `EmptyState`    | "no results" placeholders                               |
| `Skeleton`      | loading shimmers                                        |
| `InfoBlock`     | callouts, helper messages                               |
| `SectionHeader` | uppercase eyebrow group titles                          |
| `FilterChip`    | filter pills with active/count states                   |

## Migration checklist (per file)
1. Replace status color literals with `<Chip tone="...">`.
2. Replace bespoke card shells with `<Card>`.
3. Replace eyebrow `<h3>` with `<SectionHeader>`.
4. Replace inline progress with `<ProgressBar>` / `<ProgressRing>`.
5. Replace empty states and skeletons with primitives.
6. Run `grep -n 'rounded-md\|shadow-xl\|text-\[1[35]px\]'` on the file —
   should return zero matches after migration.
