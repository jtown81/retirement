# Regulatory Reference Mapping

Maps every formula, eligibility rule, and assumption to its governing authority.

---

## Classification Key

| Symbol | Meaning                        |
|--------|--------------------------------|
| ◆      | Hard regulatory requirement    |
| ◇      | Assumption (document & review) |
| ⚙      | User-configurable policy       |

---

## Reference Table

| Rule / Formula                        | Module       | Type | Source                                              | Notes |
|---------------------------------------|--------------|------|-----------------------------------------------------|-------|
| FERS basic annuity formula (1% / 1.1%)| simulation   | ◆    | OPM FERS Handbook, Ch. 50                          | 1.1% applies at age 62 with 20+ years |
| High-3 average salary                 | simulation   | ◆    | OPM FERS Handbook, Ch. 50                          | Highest 3 consecutive years           |
| MRA (Minimum Retirement Age)          | simulation   | ◆    | OPM FERS Handbook, Ch. 40                          | Varies by birth year (55–57)          |
| FERS immediate unreduced annuity      | simulation   | ◆    | OPM FERS Handbook, Ch. 40                          | MRA+30 / 60+20 / 62+5                 |
| Annual leave accrual rates            | leave        | ◆    | 5 U.S.C. § 6303; OPM Leave Guidance                | 4/6/8 hrs/pp by years of service      |
| Annual leave rollover cap             | leave        | ◆    | 5 U.S.C. § 6304                                    | 240 hrs for most employees            |
| Sick leave service credit             | leave        | ◆    | OPM FERS Handbook, Ch. 50, § 50A2.1-1              | Post-2014: 100% credit                |
| GS pay scale (base + locality)        | career       | ◆    | 5 U.S.C. § 5332; OPM Pay Tables (annual)           | Tables updated annually               |
| WGI (Within-Grade Increase) timing    | career       | ◆    | 5 CFR Part 531; OPM Pay Administration             | Steps 1–3: 52 wks; 4–6: 104 wks; 7–9: 156 wks |
| LEO special base rate                 | career       | ◆    | 5 U.S.C. § 8331(3)(C); OPM LEO guidance            | Enhanced pay tables                   |
| Title 38 hybrid pay                   | career       | ◆    | 38 U.S.C. § 7431; OPM Title 38 guidance            | Market pay + base pay                 |
| TSP contribution limit (elective)     | tsp          | ◆    | IRC § 402(g); IRS annual update                    | $23,500 (2025 limit; verify annually) |
| TSP catch-up limit (age 50+)          | tsp          | ◆    | IRC § 414(v); IRS annual update                    | $7,500 (2025; verify annually)        |
| Agency automatic contribution (1%)    | tsp          | ◆    | 5 U.S.C. § 8432(c)(1)                              | Always to Traditional TSP             |
| Agency matching (up to 4%)            | tsp          | ◆    | 5 U.S.C. § 8432(c)(2)                              | Always to Traditional TSP             |
| Military buyback deposit formula      | military     | ◆    | OPM FERS Handbook, Ch. 23; 5 U.S.C. § 8411(b)     | 3% of military basic pay + interest   |
| Military service credit (FERS)        | military     | ◆    | OPM FERS Handbook, Ch. 23                          | Requires waiver of military retirement|
| Required Minimum Distribution (RMD)  | tsp          | ◆    | IRC § 401(a)(9); IRS Pub 590-B; SECURE 2.0 § 107  | Age 73+ threshold; Traditional TSP only |
| Expense smile curve shape             | expenses     | ◇    | Blanchett (2014); various retirement research      | Parametric; user must acknowledge     |
| Inflation rate assumption             | expenses     | ◇    | Historical CPI average                             | Default 2.5%; user-configurable       |
| SRS / FERS supplement eligibility     | simulation   | ◆    | OPM FERS Handbook, Ch. 51                          | MRA+30 or 60+20; pre-SSA FRA         |
| FEHB in retirement eligibility        | simulation   | ◆    | 5 U.S.C. § 8905a; OPM FEHB guidance               | 5-year coverage rule                  |

---

## Assumption Disclosure Framework

When the app relies on an assumption (◇) rather than a hard rule, the user must be:

1. Shown the assumption before it affects their projection.
2. Given the option to override it (if ⚙ flagged).
3. Warned if their override is outside a reasonable range.

---

## Update Monitoring Strategy

- **OPM Pay Tables**: Check annually (typically January). Update `career` module.
- **IRS TSP Limits**: Check annually (typically November). Update `tsp` module.
- **OPM FERS Handbook**: Monitor OPM website for chapter revisions.
- **Federal statutes**: Track GOVINFO.gov for FERS/TSP legislative changes.

---

## Change History

| Version | Date       | Author | Description                            |
|---------|------------|--------|----------------------------------------|
| 0.1.0   | 2026-02-10 |        | Initial regulatory mapping scaffold    |
| 0.2.0   | 2026-02-11 |        | Added RMD (Required Minimum Distribution) per SECURE 2.0 Act |
