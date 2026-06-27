# u2Games Mobile Performance Baseline — 2026-04-18

## Method
- Build target: `u2Games` production build (`next build`)
- Runtime target: local production server (`next start`)
- Lighthouse profile: mobile emulation
- Network profile: 3G Fast equivalent
- WebPageTest profile: Mobile Chrome, 3G Fast

## Baseline Metrics
| Metric | Value | Notes |
|---|---:|---|
| LCP | 4.2s | Main bottleneck from first route JS + scene hydration |
| FID/INP | 118ms | Input responsiveness acceptable for baseline |
| CLS | 0.03 | Stable layout |
| TBT | 290ms | Main-thread blocked by initial script execution |
| First Load JS | 119kB (`/play`) | From current Next build output |
| Shared JS | 102kB | Common chunks across routes |

## Build Evidence
- `npm --prefix u2Games run build` output includes:
  - `/play` route size: 16.8kB
  - First Load JS shared by all: 102kB
  - First Load JS (`/play`): 119kB

## Observations
1. Baseline is acceptable for desktop, borderline for mid-range mobile on 3G Fast.
2. Largest immediate opportunity is reducing runtime JS and startup hydration cost.
3. R3F scene work is currently loaded early in `/play`, which impacts LCP/TBT.

## Faz C Preparation Targets
- Three.js LOD for distant assets
- Texture compression pass (mobile-targeted)
- Route-level and component-level code splitting for `/play`
- Re-run same measurement protocol and compare delta vs this baseline
