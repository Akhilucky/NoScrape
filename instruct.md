# agents.md — NoScrape

## Vision

Build **NoScrape**, an adversarial web proxy that transforms web content in ways humans do not notice but automated AI scrapers struggle to process.

Instead of blocking bots, NoScrape assumes they will access the content.

Its goal is to reduce the quality, usefulness, and reliability of data collected by LLM scrapers, dataset harvesters, and automated extraction pipelines.

---

# One-Line Pitch

A local MITM proxy that rewrites web traffic in real time, preserving the browsing experience for humans while poisoning data collected by AI scrapers.

---

# Problem

Modern AI companies continuously scrape websites for:

* Training data
* Documentation
* Blog content
* Research articles
* Product information

Traditional protections are weak:

* robots.txt can be ignored
* IP blocking is bypassed
* CAPTCHAs hurt user experience
* Legal action is slow

NoScrape provides a technical defense layer.

---

# Core Idea

Humans consume rendered pages.

Scrapers consume source code.

NoScrape exploits this difference.

The system intercepts traffic and modifies HTML, CSS, and page structure while preserving the visual output seen by users.

Result:

* Human experience remains unchanged
* Browser rendering remains unchanged
* Scraper extraction quality degrades

---

# Agent Workflow

Traffic Interceptor
↓
Threat Analyst
↓
Mutation Planner
↓
Transformation Engine
↓
Adversarial Evaluator

---

# Agent 1 — Threat Analyst

## Purpose

Analyze incoming content and determine protection requirements.

## Responsibilities

* Parse page structure
* Detect valuable content
* Identify scrape-worthy sections
* Estimate extraction risk
* Generate threat profile

## Inputs

* HTML response
* Request metadata
* Configuration

## Output

```json
{
  "risk_level": "high",
  "content_type": "documentation",
  "recommended_mode": "aggressive"
}
```

---

# Agent 2 — Mutation Planner

## Purpose

Design the optimal defense strategy.

## Responsibilities

Select transformations based on:

* Risk score
* Page complexity
* Performance budget
* Protection level

## Available Mutations

### DOM Fragmentation

Break content into multiple visual fragments.

### Attribute Shuffling

Reorder HTML attributes.

Example:

```html
<button class="btn" id="login">
```

becomes

```html
<button id="login" class="btn">
```

### Zero Width Injection

Insert invisible Unicode characters.

Example:

```text
hello
```

becomes

```text
he​llo
```

### Visual Reordering

Change DOM order while preserving visual order.

### Semantic Noise

Inject hidden misleading content.

### Honeypot Elements

Create invisible links and elements.

### Fingerprinting

Insert invisible identifiers.

## Output

```json
{
  "strategy": "aggressive",
  "mutations": [
    "zero_width",
    "attribute_shuffle",
    "dom_fragmentation"
  ]
}
```

---

# Agent 3 — Transformation Engine

## Purpose

Apply transformations to live traffic.

## Responsibilities

* Rewrite HTML
* Modify CSS
* Inject fingerprints
* Apply structural mutations
* Preserve functionality

## Requirements

* Visual appearance unchanged
* User interactions preserved
* Browser compatibility maintained
* Minimal latency

## Output

Protected response.

---

# Agent 4 — Adversarial Evaluator

## Purpose

Act as the attacker.

Attempt to recover protected content and measure effectiveness.

## Responsibilities

Simulate:

### DOM Scraping

Using textContent extraction.

### HTML Parsing

Using Cheerio and BeautifulSoup style extraction.

### Headless Browser Extraction

Using Playwright and Puppeteer.

### LLM Reconstruction

Estimate how much content can be recovered by an AI model.

## Output

```json
{
  "human_fidelity": 100,
  "scraper_success_rate": 21,
  "protection_score": 91
}
```

## Feedback Loop

If protection score is low:

* Recommend stronger mutations
* Recommend additional protections
* Generate optimization suggestions

---

# Deployment Modes

## Local Proxy

Primary deployment mode.

```bash
noscape proxy --port 8080
```

Flow:

User Browser
↓
NoScrape Proxy
↓
Website

---

## Reverse Proxy

```bash
noscape proxy --target https://example.com
```

Protect existing websites without modifying source code.

---

## Cloudflare Worker

Deploy protections at the edge.

---

## Build Plugin

Generate protected HTML during site builds.

Supported:

* Next.js
* Vite
* Astro

---

# CLI

```bash
noscape start

noscape proxy

noscape audit https://example.com

noscape benchmark

noscape report

noscape fingerprint
```

---

# Configuration

```yaml
mode: proxy

protection:
  level: adaptive

mutations:
  dom_fragmentation: true
  attribute_shuffle: true
  zero_width_injection: true
  visual_reordering: true
  semantic_noise: true
  honeypots: true
  fingerprinting: true

evaluation:
  enabled: true
```

---

# Technology Stack

Core Runtime:

* TypeScript

Proxy:

* Node.js
* Express
* HTTP Proxy Middleware

HTML Processing:

* Cheerio
* Parse5

Testing:

* Playwright

Storage:

* SQLite

Dashboard:

* React
* Vite

---

# Success Metrics

* Human fidelity > 99%
* Scraper success rate < 25%
* Latency increase < 50ms
* Browser compatibility maintained
* Automated benchmark suite passing

---

# Why This Project Is Interesting

NoScrape combines:

* Security Engineering
* AI Safety
* Browser Internals
* Networking
* Adversarial Machine Learning
* Agentic Systems

Rather than blocking scrapers, it actively degrades the quality of data they collect.

---

# Resume Bullet

Built NoScrape, an adversarial web proxy that protects websites from AI scraping by dynamically transforming HTML, CSS, and page structure in ways invisible to humans but disruptive to automated extraction systems, using multi-agent analysis, mutation planning, and adversarial evaluation.
