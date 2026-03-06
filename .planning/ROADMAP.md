# Roadmap: Baller — Comparison UX Update

## Overview

This branch transforms Baller from a single-listing analyzer into a comparison tool. The work follows a strict dependency chain: first, users need a frictionless way to analyze any similar listing (Phase 1). Then, a side-by-side comparison page gives users structural context for evaluating two listings (Phase 2). Finally, auto-generated pros/cons and a verdict layer turn raw comparison into actionable advice (Phase 3). Each phase delivers standalone value while enabling the next.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: One-Click Re-Analyze** - Users can analyze any similar listing without copy-pasting URLs
- [ ] **Phase 2: Comparison View** - Users can see two listings side-by-side with differences highlighted
- [ ] **Phase 3: Pros/Cons and Verdict** - Users get an evaluated comparison that tells them which listing is the better deal

## Phase Details

### Phase 1: One-Click Re-Analyze
**Goal**: Users can instantly run a full Baller analysis on any similar listing from the current results
**Depends on**: Nothing (first phase)
**Requirements**: REANA-01, REANA-02
**Success Criteria** (what must be TRUE):
  1. User can click a single button on any similar listing card and see that listing's full analysis (price, condition, suggested offer) without manually copying a URL
  2. User sees a clear loading/transition indicator after clicking "Run in Baller" and before the new analysis renders
  3. The re-analyzed listing displays identically to a listing analyzed via the main URL input
**Plans**: 2 plans

Plans:
- [ ] 01-01-PLAN.md — Add "Run in Baller" button to similar listing cards with hover expand interaction
- [ ] 01-02-PLAN.md — Replace pulsing loading text with step-based progress bar

### Phase 2: Comparison View
**Goal**: Users can evaluate two listings side-by-side with visual cues highlighting where they differ
**Depends on**: Phase 1
**Requirements**: COMP-01, COMP-02, COMP-03, COMP-04, DSGN-01, DSGN-02
**Success Criteria** (what must be TRUE):
  1. User can open a comparison page showing two listing analyses rendered in parallel columns
  2. User can compare the currently analyzed listing against any similar listing from the results
  3. User can compare any two listings by selecting them flexibly (not limited to current vs. similar)
  4. Price, condition, and feature differences between the two listings are visually highlighted so users can spot them at a glance
  5. The comparison page uses thick borders, hard shadows, and bold colors consistent with the existing neobrutalist design system
**Plans**: 3 plans

Plans:
- [ ] 02-01-PLAN.md — Build /compare page with dual data pipelines, ComparisonColumn, and ColumnSkeleton
- [ ] 02-02-PLAN.md — Add COMPARE button to ListingCard and sticky CompareBar for flexible pick-two selection
- [ ] 02-03-PLAN.md — Add diff summary banner, price arrow indicators, and condition comparison bars

### Phase 3: Pros/Cons and Verdict
**Goal**: Users get an auto-generated evaluation that tells them which of the two listings is the better deal and why
**Depends on**: Phase 2
**Requirements**: PROS-01, PROS-02
**Success Criteria** (what must be TRUE):
  1. The comparison view displays auto-generated pros and cons for each listing covering price and suggested offer, condition, and features/specs
  2. The comparison view shows a clear "better deal" verdict with human-readable reasoning explaining why one listing is preferred
**Plans**: 2 plans

Plans:
- [ ] 03-01-PLAN.md — Rule-based pros/cons engine and /api/compare-verdict AI endpoint
- [ ] 03-02-PLAN.md — ProsCons chips, VerdictCard with scroll-reveal, winner highlight, and CompareClient wiring

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. One-Click Re-Analyze | 2/2 | Complete | - |
| 2. Comparison View | 3/3 | Complete |  |
| 3. Pros/Cons and Verdict | 0/2 | Planning complete | - |
