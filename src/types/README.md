# `src/types` Code Map

Shared type declarations used by route handlers and build tooling.

| File | Purpose | Key Exports |
| --- | --- | --- |
| `src/types/rapidApiMarketplace.ts` | Declares the RapidAPI marketplace payload and wrapper variants consumed by listing normalization. | `RapidApiMarketplaceListing`, `RapidApiMarketplaceWrapper`, related field interfaces |
| `src/types/css.d.ts` | Allows TypeScript imports for CSS modules/files where needed. | module declaration for `*.css` |

## Notes

- Keep external API payload typing here to avoid duplicating shape assumptions in route files.
- Prefer extending these interfaces when RapidAPI payload formats evolve.
