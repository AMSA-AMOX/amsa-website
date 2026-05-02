# AMSA College Match Algorithm

This document defines the scoring rubric used to evaluate an applicant's profile against colleges. It serves as the primary context for the AI matching system.

---

## Overview

The algorithm produces two outputs per (applicant, college) pair:

1. **Applicant Strength Score** (0–100): a single number capturing the overall competitiveness of the applicant.
2. **Match Category**: `safety`, `match`, or `reach`, based on how the applicant's score compares to the college's typical admitted-student profile.

---

## Part 1: Applicant Strength Score

The score is a weighted composite of four domains. Each domain is normalised to 0–100 before weighting.

### 1. Academic Profile (40% of total)

| Sub-factor | Weight within domain | Notes |
|---|---|---|
| GPA (normalised to 4.0) | 35% | `(gpa / gpa_scale) * 4.0` → map to 0–100 linearly |
| Standardised test score | 30% | SAT: `(sat - 400) / 12` → 0–100. ACT: `(act - 1) / 0.35` → 0–100. Use whichever is provided; if both, take the higher. |
| Course rigour (AP/IB count) | 20% | 0 courses = 0, 5+ courses = 100, linear interpolation |
| Class rank (if known) | 15% | Top 10% = 100, top 25% = 75, top 50% = 50, below 50% = 25, unknown = 50 (neutral) |

### 2. Extracurricular Strength (30% of total)

Evaluate the list of activities provided by the applicant. Each activity receives a sub-score; the domain score is the average of the top 5 (or all, if fewer than 5).

| Sub-factor | Weight within domain | Notes |
|---|---|---|
| Leadership / responsibility level | 40% | Founder/president/captain = 100; officer/lead = 75; member/participant = 40 |
| Depth of commitment | 30% | (hours/week × years) → high = 100. Benchmark: 5 h/wk × 4 yrs = 100 |
| Uniqueness / rarity | 20% | Rare or high-achievement activities (national competition, patent, published research) score higher. Common activities (school club member) score lower. |
| Demonstrated impact | 10% | Tangible outcomes mentioned (founded org, raised $X, # people affected) boost score |

### 3. Essay Signals (20% of total)

Derived from the applicant-provided essay themes and personal statement summary.

| Sub-factor | Weight within domain | Notes |
|---|---|---|
| Demonstrated interest in the school / field | 40% | Specific mention of programs, professors, or research matches college offerings |
| Personal narrative clarity | 30% | Clear through-line between background → activities → goals |
| Writing craft indicators | 30% | Avoid generic phrases. Specific, vivid, self-aware writing signals higher craft |

*Note: essay signals are qualitative — the AI should infer a score from the text provided.*

### 4. Financial Fit (10% of total)

| Sub-factor | Weight within domain | Notes |
|---|---|---|
| Budget vs estimated net cost | 100% | If `estimated_net_cost ≤ budget_max`: 100. If `estimated_net_cost > budget_max × 1.5`: 0. Linear interpolation between. If no budget provided: neutral 50. |

---

## Part 2: Match Category Thresholds

Each college has an **admissions profile** derived from its data:

- `acceptance_rate` — percentage of applicants admitted
- `sat_75` / `sat_25` — 75th and 25th percentile SAT of admitted students
- `avg_net_cost` — average net cost for international students

Use the following logic to assign a category:

```
college_difficulty = 100 - (acceptance_rate * 100)
# e.g., 10% acceptance → difficulty 90; 60% acceptance → difficulty 40

if applicant_score >= college_difficulty + 10:
    category = "safety"
elif applicant_score >= college_difficulty - 10:
    category = "match"
else:
    category = "reach"
```

*Boundary adjustments:*
- If acceptance rate < 10% (e.g., MIT, Harvard), treat as pure reach for all applicants with score < 90.
- If college has no acceptance rate data, default to `match` if applicant score > 60, else `reach`.

---

## Part 3: Ranking the Results

After computing category and score for every college in the pool:

1. Sort by category priority: `safety` first, then `match`, then `reach`.
2. Within each category, sort by `financial_accessibility_score` descending (schools that offer more aid to internationals rank higher).
3. Apply major-fit filter: if the applicant specified a major, prefer colleges that offer that field. Schools without the field can still appear but are ranked lower within each category.
4. Return top 20 total (roughly: 5 safeties, 10 matches, 5 reaches — adjust if the pool is smaller).

---

## Part 4: Output Format

The AI must return a JSON object:

```json
{
  "matches": [
    {
      "unitid": 123456,
      "name": "Example University",
      "category": "match",
      "score": 72,
      "reason": "Your 3.8 GPA and SAT 1420 align well with their median admitted student. Your leadership in debate and research internship strengthen your application. Financial fit is strong — their average aid package covers ~70% of costs."
    }
  ]
}
```

- `reason` should be 1–3 sentences, personalised to the applicant's specific profile.
- Do not mention scores or numbers from this rubric directly — write in natural language.
- Flag any major concerns (e.g., "Note: your SAT is below their 25th percentile, so consider this a reach").

---

## Important Notes for AI Evaluation

- This tool is designed for **international students** applying to US universities. Financial aid availability for internationals is a primary signal.
- GPA scoring systems vary by country — if the applicant notes a different scale (e.g., 100-point or 5.0), convert accordingly before scoring.
- Test scores are optional. If neither SAT nor ACT is provided, weight the remaining academic sub-factors proportionally and note the omission in reasons.
- Be constructive: even for reach schools, explain what makes the school worth applying to. For safety schools, explain why it remains a strong option.
