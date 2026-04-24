# Design Rationale: Why This Architecture

## Requirements

From the PRAXIS analysis:
1. Integrate taxonomy skill as active toolset (not static reference)
2. Track payload lineage (technique → template → result)
3. Query effectiveness (what actually works)
4. Suggest attack chains (intent → technique → template)
5. Stdlib only (no external dependencies)

## Constraints

| Constraint | Impact |
|------------|--------|
| Stdlib only | No NetworkX, no pandas, no SQLAlchemy |
| Backward compatible | Old kb.py workflows must still work |
| Lineage tracking | Must persist across sessions |
| ~100 taxonomy entries | Over-engineering is easy |

## Decision Log

### 1. Database vs JSON

**Considered:** Keep using browser_agent_subset.json, build index files
**Rejected:** Query performance O(N), no ACID for concurrent lineage writes
**Chosen:** SQLite (normalized schema)

### 2. Normalized vs Single Table

**Considered:** Single table with JSON blob
**Rejected:** No referential integrity (orphaned technique IDs in lineage)
**Chosen:** 7 tables + relationships
**Revised confidence:** MEDIUM (75%) — 7 tables may be over-engineered

### 3. Auto-tagging vs Manual

**Considered:** Manual tagging for all templates
**Rejected:** 40+ templates, maintenance burden
**Chosen:** Heuristic auto-tagging + manual override capability
**Revised confidence:** LOW (60%) — validation script provided

### 4. Integration Approach

**Considered:** Fork workbench/ code to add taxonomy calls inline
**Rejected:** Increases coupling, harder to disable
**Chosen:** Bridge pattern (WorkbenchTaxonomyBridge) — optional, modular

## Key Trade-offs

| Trade-off | Choice | Rationale |
|-----------|--------|-----------|
| Complexity vs correctness | Complexity | Referential integrity prevents data corruption |
| Automation vs accuracy | Automation + validation | Manual override available for errors |
| Consistency vs simplicity | Consistency | Mirror workbench patterns (anchoring risk acknowledged) |
| Performance vs features | Features | 20ms extra latency acceptable for lineage |

## Validation Plan

Before production use:

1. **Auto-tagging validation:**
   ```bash
   python3 scripts/validate_auto_tag.py --sample 20 --report
   # Target: >80% accuracy, manual fix for rest
   ```

2. **Query performance:**
   ```python
   import time
   from taxonomy_toolset.db import TaxonomyDB
   db = TaxonomyDB()
   start = time.time()
   db.list_entries(section='techniques', tier=3)
   assert time.time() - start < 0.01  # 10ms threshold
   ```

3. **Integration test:**
   ```bash
   # Generate payload via brief API
   curl -X POST localhost:8080/api/generate/brief \
     -d '{"mode":"nl","text":"college care order approval"}'
   
   # Verify lineage recorded
   python3 -c "from taxonomy_toolset.db import TaxonomyDB; db = TaxonomyDB(); print(len(db._conn.execute('SELECT * FROM payload_lineage').fetchall()))"
   ```

## Confidence Summary (Post-WFGY)

| Component | Before | After | Change |
|-----------|--------|--------|--------|
| Schema | HIGH | MEDIUM | Acknowledged over-engineering risk |
| API | MEDIUM | HIGH | Consistent with workbench |
| Auto-tagging | MEDIUM | LOW | Heuristics unvalidated |
| Integration | HIGH | MEDIUM | Unverified in production |
| **Overall** | **85%** | **72%** | **Honest assessment** |

## When to Revisit

- **Table count > 15:** Consider simplification or graph approach
- **Auto-tag accuracy < 70%:** Add more heuristics or increase manual tagging
- **Query latency > 50ms:** Add caching layer
- **External deps allowed:** Consider NetworkX for graph operations

## File Map

```
taxonomy_toolset/
├── db.py                    # 508 lines - TaxonomyDB class
├── suggest.py               # 357 lines - SuggestionEngine
├── importer.py              # 210 lines - JSON → DB loader
├── cli.py                   # 293 lines - Command interface
├── api.py                   # 242 lines - HTTP handlers
├── workbench_integration.py # 290 lines - Bridge class
├── schema.sql               # 156 lines - DDL
├── scripts/
│   ├── build_taxonomy_links.py  # 197 lines - Auto-tagger
│   └── validate_auto_tag.py     # 290 lines - Validation + ground truth
├── README.md                # Architecture docs (revised confidence)
└── tests/                   # (TBD) unit tests

Total: ~2,500 lines core + 500 lines validation/docs
```

## Decision Authority

- **Type 1 (irreversible):** Schema changes — schema.sql is committed
- **Type 2 (reversible):** Heuristics, overrides, suggestions — can iterate

Human sign-off recommended before:
- Production deployment (verify validation results)
- Expanding to >200 taxonomy entries (reconsider normalization)
