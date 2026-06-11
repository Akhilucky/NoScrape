# noscrape

an adversarial web proxy that protects websites from ai scraping by transforming html, css, and page structure in ways humans don't notice but scrapers struggle with.

```bash
docker pull akhilucky/noscrape
```

```bash
npx noscrape start
```

---

## quick start

```bash
# install
npm install -g noscrape

# run local proxy (default port 8080)
noscrape start

# or protect a static file
noscrape protect index.html -o protected.html

# audit a url
noscrape audit https://example.com

# run benchmark
noscrape benchmark
```

## docker

```bash
# mcp server (port 3001)
docker run -p 3001:3001 akhilucky/noscrape

# reverse proxy (port 8080)
docker run -p 8080:8080 -e PROXY_TARGET=https://example.com akhilucky/noscrape-proxy

# compose
docker compose up
```

---

## pipeline

```
traffic → threat analyst → mutation planner → transformation engine → adversarial evaluator → protected response
```

### agents

- **traffic interceptor** — captures http traffic, applies transformations in real time
- **threat analyst** — parses html, detects high-value content, estimates extraction risk
- **mutation planner** — selects strategy and picks from available mutations
- **transformation engine** — applies structural and content mutations
- **adversarial evaluator** — simulates 4 extraction methods, measures effectiveness, generates feedback

### mutations

| mutation | description |
|----------|-------------|
| dom fragmentation | breaks text into smaller visual fragments |
| attribute shuffle | reorders html attributes |
| zero width injection | inserts invisible unicode characters |
| visual reordering | changes dom order while preserving visual layout |
| semantic noise | injects hidden misleading content |
| honeypots | creates invisible links and elements |
| fingerprinting | embeds invisible tracking identifiers |

---

## deployment

```bash
# local proxy (primary mode)
noscrape proxy --target https://my-site.com

# reverse proxy
docker run -p 8080:8080 -e PROXY_TARGET=https://example.com akhilucky/noscrape-proxy

# cloudflare worker
# deploy src/deployments/cloudflare-worker.ts to cf

# build plugin (next/vite/astro)
import { buildWithProtection } from 'noscrape/deployments/build-plugin'
```

## mcp server

```bash
docker run -p 3001:3001 akhilucky/noscrape
```

json-rpc methods: `initialize`, `protect`, `analyze`, `evaluate`, `listMutations`, `getStatus`

---

## monitoring

key metrics:
- human fidelity > 99%
- scraper success rate < 25%
- latency < 50ms
- browser compatibility maintained

---

## license

mit
