# `src/styles` Code Map

Centralized CSS and Tailwind/theme configuration.

| File | Purpose | Notes |
| --- | --- | --- |
| `src/styles/fonts.css` | Imports display/body fonts used across landing and dashboard UI. | Google Fonts imports. |
| `src/styles/tailwind.css` | Tailwind v4 entrypoint and project custom utility classes. | Defines `border-5`, neo-brutalist shadow helpers. |
| `src/styles/theme.css` | Theme variables and base element typography defaults. | Includes light/dark token definitions and base layer rules. |
| `src/styles/similarListings.css` | Utility styles for carousel behavior and no-scrollbar display. | Used by dashboard similar listing row. |
| `src/styles/styles.ts` | Reserved TypeScript style helper module for future extracted style tokens/utilities. | Intentionally retained as scaffold. |

## Notes

- Global style wiring is handled via `src/app/globals.css`.
- Keep token-like values in CSS variables where possible; keep component-specific classes close to components.
