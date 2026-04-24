# Migration Guide: Old & New Architecture

This document compares the old crispy-robot-main architecture with the new
taxonomy_toolset-integrated design, providing concrete migration steps.

## Before/After Comparison

### Querying Techniques

**OLD (crispy-robot-main):**
```bash
# Static JSON query — no relationships, no effectiveness data
python3 redteam/scripts/query.py tier 3 --section techniques
python3 redteam/scripts/query.py show narrative_injection
```

**NEW (crispy-robot-rebuild):**
```bash
# Database query with effectiveness analytics
python3 -m taxonomy_toolset.cli query --tier 3 --section techniques
python3 -m taxonomy_toolset.cli show narrative_injection

# Get success rates from arena results
python3 -m taxonomy_toolset.cli analyze --section techniques
```

**Benefit:** Analytics integrate with arena results, showing actual effectiveness.

---

### Suggestion Engine

**OLD:**
```bash
# Manual recipe composition from paper research
python3 redteam/scripts/kb.py compose --priority P1
# Returns technique list, user manually picks
```

**NEW:**
```bash
# Intent-driven automatic suggestions
python3 -m taxonomy_toolset.cli suggest --intent business_integrity --combo

# Suggests technique + combo + templates
```

**Benefit:** Structured intent→technique→template recommendation pipeline.

---

### Payload Generation

**OLD (brief.py):**
```python
# _parse_nl extracts keywords → TEMPLATE_KEYWORDS dict lookup
fixed["template"] = _greedy_match(text, TEMPLATE_KEYWORDS)
# Generated, but no lineage recorded
_db.insert_payload(...)  # Only workbench metadata
```

**NEW (brief.py + integration):**
```python
from taxonomy_toolset.workbench_integration import WorkbenchTaxonomyBridge

with WorkbenchTaxonomyBridge() as bridge:
    # Suggests based on intent detection
    suggestions = bridge.suggest_for_brief(text, matched_keywords)
    
    # Records full lineage
    bridge.record_generated_payload(
        payload_id=meta.get("payload_id"),
        template=meta.get("template"),
        metadata=meta,  # Links to technique_id, intent_id
        workbench_session=session_id
    )
_db.insert_payload(...)  # Still stores workbench metadata
```

**Benefit:** Every payload linked to taxonomy entries; queryable by technique effectiveness.

---

### Template Management

**OLD:**
```python
# Templates are just text files
# Technique linkage implicit in naming conventions
# No validation that template actually uses claimed technique
```

**NEW:**
```python
# Templates explicitly linked to taxonomy entries
python3 taxonomy_toolset/scripts/build_taxonomy_links.py --verify

# Database enforces referential integrity
taxonomy_db.get_templates_for_technique("narrative_injection")
```

**Benefit:** Templates queryable by technique/intent; validation of taxonomy coverage.

---

## Step-by-Step Migration

### Phase 1: Database Setup (30 min)

```bash
# In crispy-robot-rebuild directory
cd taxonomy_toolset

# Import taxonomy data
python3 -m importer --source ../redteam/browser_agent_subset.json --relationships --combos

# Verify
python3 -c "from db import TaxonomyDB; db = TaxonomyDB(); print(db.list_entries(section='techniques', tier=3, limit=5))"
```

### Phase 2: Template Linking (1 hour)

```bash
# Auto-tag all templates
python3 scripts/build_taxonomy_links.py --verify

# Manual review: Check templates with low confidence
python3 -c "
from db import TaxonomyDB
db = TaxonomyDB()
rows = db._conn.execute('SELECT * FROM template_taxonomy_links WHERE confidence_score < 0.7')
for r in rows:
    print(r['template_id'], r['technique_id'], r['confidence_score'])
"
```

### Phase 3: Workbench Integration (2 hours)

**Modify `workbench/api/brief.py`:**

1. Add import:
```python
from taxonomy_toolset.workbench_integration import WorkbenchTaxonomyBridge
```

2. Modify `_store_payloads()`:
```python
def _store_payloads(payloads, mode, db):
    # Original workbench insert (keep this)
    for p in payloads:
        if "error" in p:
            continue
        meta = p.get("metadata", {})
        db.insert_payload(...)
    
    # NEW: Taxonomy lineage
    with WorkbenchTaxonomyBridge() as bridge:
        for p in payloads:
            if "error" in p:
                continue
            meta = p.get("metadata", {})
            bridge.record_generated_payload(
                payload_id=meta.get("payload_id", ""),
                template=meta.get("template", ""),
                metadata=meta,
                workbench_session=mode
            )
```

3. Optionally add suggestion hook to `handle_brief()`:
```python
def handle_brief(body):
    # ... existing parsing ...
    
    # NEW: Suggest when parsing is ambiguous
    if len(unmatched_keywords) > 2:
        with WorkbenchTaxonomyBridge() as bridge:
            suggestions = bridge.suggest_for_brief(text, matched_keywords)
            # Merge suggestions into fixed params
    
    # ... rest unchanged ...
```

### Phase 4: API Routes (30 min)

**Modify `workbench/server.py`:**

```python
from taxonomy_toolset.api import make_taxonomy_routes

# After router = Router()
make_taxonomy_routes(router)
```

**Verify:**
```bash
curl http://localhost:8080/api/taxonomy/entries?section=techniques
curl -X POST http://localhost:8080/api/taxonomy/suggest \
  -H "Content-Type: application/json" \
  -d '{"intent_id": "business_integrity"}'
```

### Phase 5: CLI Migration (optional, 1 hour)

Update scripts/kb.py to use taxonomy_db internally:

```python
# Inside kb.py
from taxonomy_toolset.db import TaxonomyDB

def cmd_techniques(args, conn):
    # OLD: Query redteam/master.db
    # NEW: Also query taxonomy database for effectiveness
    
    taxonomy_db = TaxonomyDB()
    try:
        # Merge results from both databases
        techniques = db.execute(...)  # From master.db
        effectiveness = taxonomy_db.get_effectiveness_report(section='techniques')
        # Combine and display
    finally:
        taxonomy_db.close()
```

---

## Validation Checklist

After migration, verify:

- [ ] All 107 taxonomy entries importable
- [ ] CLI query commands functional
- [ ] Suggest API returns recommendations
- [ ] Brief.py records lineage automatically
- [ ] Template links >80% accurate
- [ ] API endpoints accessible via workbench
- [ ] Zero external dependencies (stdlib only)

---

## Rollback Plan

If issues arise:

1. **Database Only:** Simply stop using taxonomy.db; workbench.db still functional
2. **Brief.py:** Revert `_store_payloads()` to original; remove lineage calls
3. **API:** Skip taxonomy routes; existing workbench API unchanged

The integration is modular — each component can be disabled independently.

---

## Performance Considerations

| Metric | Before | After | Impact |
|--------|--------|-------|--------|
| Brief.latency | ~50ms | ~70ms | +20ms (lineage insert) |
| Query speed | ~200ms (file read) | ~5ms (indexed) | 40x faster |
| Memory | JSON loaded each time | Connection pooled | Lower memory |
| Disk | ~200KB JSON | ~500KB SQLite | +300KB |

Trade-offs favor development velocity over raw speed.
