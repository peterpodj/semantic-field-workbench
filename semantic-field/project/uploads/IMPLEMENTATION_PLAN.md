# Implementation Plan: Taxonomy Toolset Integration

## Phase 1: Foundation (Days 1-2)

### 1.1 Create Directory Structure
```bash
mkdir -p taxonomy_toolset
```

**Deliverables:**
- `/mnt/storage/crispy-robot-cleanroom/crispy-robot-rebuild/taxonomy_toolset/` created

### 1.2 Implement Database Layer (**Status: DONE**)
- ✅ `schema.sql` — SQL DDL with all tables, relationships, views
- ✅ `db.py` — TaxonomyDB class with CRUD and analytics

**Validation:**
```python
from taxonomy_toolset.db import TaxonomyDB
db = TaxonomyDB()
# Verify tables created
rows = db._conn.execute("SELECT name FROM sqlite_master WHERE type='table'")
print([r['name'] for r in rows])
```

### 1.3 Implement Import Pipeline
- ✅ `importer.py` — JSON → database loader

**Validation:**
```bash
cd taxonomy_toolset
python3 importer.py --source ../redteam/browser_agent_subset.json --relationships --combos
# Verify import
python3 -c "from db import TaxonomyDB; db = TaxonomyDB(); print(db.list_entries(limit=5))"
```

---

## Phase 2: Query Engine (Days 3-4)

### 2.1 Port Query Functionality
- ✅ `cli.py` — CLI with query, show, suggest commands
- Port functionality from `redteam/scripts/query.py`

**Validation:**
```bash
python3 -m taxonomy_toolset.cli query --section techniques --tier 3
python3 -m taxonomy_toolset.cli show narrative_injection
```

### 2.2 Suggestion Engine
- ✅ `suggest.py` — Recommendation logic

**Validation:**
```python
from taxonomy_toolset.suggest import SuggestionEngine
from taxonomy_toolset.db import TaxonomyDB

db = TaxonomyDB()
engine = SuggestionEngine(db)
result = engine.suggest_full_chain("business_integrity", "wren_and_thistle")
print(result['primary_technique'])
```

### 2.3 Integration Testing
- [ ] Test all CLI commands
- [ ] Verify suggestion accuracy
- [ ] Check error handling

---

## Phase 3: API Integration (Days 5-6)

### 3.1 Workbench API Routes
- ✅ `api.py` — HTTP handlers for taxonomy endpoints

**Validation:**
```python
# Start workbench with taxonomy routes
from workbench.server import router, start_server
from taxonomy_toolset.api import make_taxonomy_routes

make_taxonomy_routes(router)
start_server(port=8080)
# Then: curl http://localhost:8080/api/taxonomy/entries?section=techniques
```

### 3.2 Workbench Integration Module
- ✅ `workbench_integration.py` — Bridge class

**Validation:**
```python
from taxonomy_toolset.workbench_integration import WorkbenchTaxonomyBridge

with WorkbenchTaxonomyBridge() as bridge:
    # Test suggestion hook
    suggestions = bridge.suggest_for_brief("narrative for order approval", {})
    print(suggestions)
```

---

## Phase 4: Template Auto-Tagging (Days 7-8)

### 4.1 Update Build Process
Modify `redteam/scripts/build_master_db.py`:

```python
from pathlib import Path
from taxonomy_toolset.workbench_integration import WorkbenchTaxonomyBridge
from taxonomy_toolset.db import TaxonomyDB

def build_template_taxonomy_links():
    """Auto-tag templates with taxonomy entries."""
    bridge = WorkbenchTaxonomyBridge()
    templates_dir = Path(__file__).parent.parent / "templates"
    
    for tpl_path in templates_dir.rglob("*.txt"):
        with open(tpl_path) as f:
            content = f.read()
        
        # Parse front-matter
        import re
        m = re.match(r"^---\s*\n(.*?)\n---\s*\n(.*)", content, re.DOTALL)
        if m:
            # Simplified: extract key:value pairs
            fm_text, body = m.group(1), m.group(2)
            fm = {}
            for line in fm_text.split("\n"):
                if ":" in line:
                    k, v = line.split(":", 1)
                    fm[k.strip()] = v.strip()
            
            # Auto-tag
            link = bridge.auto_tag_template(
                template_id=tpl_path.stem,
                filepath=tpl_path,
                front_matter=fm,
                body_sample=body
            )
            bridge.db.link_template(link)
    
    bridge.close()
```

**Validation:**
```bash
python3 redteam/scripts/build_master_db.py --with-taxonomy
# Check templates are linked
python3 -m taxonomy_toolset.cli templates --technique narrative_injection
```

### 4.2 Validate Coverage
- [ ] All Gen 1-3 templates linked
- [ ] Confidence scores reasonable (>0.5)
- [ ] Manual review of edge cases

---

## Phase 5: Brief.py Integration (Days 9-10)

### 5.1 Modify Brief Handler
Update `workbench/api/brief.py`:

```python
from taxonomy_toolset.workbench_integration import WorkbenchTaxonomyBridge
from taxonomy_toolset.db import TaxonomyDB

def _store_payloads(payloads, mode, db):
    """Persist composed payloads into workbench.db and taxonomy lineage."""
    # Original workbench insert
    for p in payloads:
        if "error" in p:
            continue
        meta = p.get("metadata", {})
        db.insert_payload(
            payload_id=meta.get("payload_id", ""),
            mode=mode,
            template=meta.get("template", ""),
            narrative=meta.get("narrative", ""),
            evasions=json.dumps(meta.get("evasions", [])),
            evasion_qty=meta.get("evasion_quantity", 0),
            payload_count=meta.get("payload_count", 1),
            prompt_text=p.get("prompt", ""),
            seed_payload=None,
        )
    
    # NEW: Taxonomy lineage tracking
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

def handle_brief(body):
    """Handle POST /api/generate/brief."""
    # ... existing parsing logic ...
    
    # NEW: Use taxonomy suggestions if parsing uncertain
    if len(parsed_as.get("unmatched", [])) > 2:
        with WorkbenchTaxonomyBridge() as bridge:
            suggestions = bridge.suggest_for_brief(text, parsed_as.get("matched", {}))
            # Merge suggestions into fixed params
            if not fixed.get("template") and suggestions.get("templates"):
                fixed["template"] = suggestions["templates"][0]["id"]
    
    # ... rest of existing logic ...
```

### 5.2 Validation
- [ ] Generate payloads with brief API
- [ ] Verify lineage recorded in taxonomy.db
- [ ] Check cross-database consistency

---

## Phase 6: Documentation & Handover (Days 11-12)

### 6.1 Update Documentation
- ✅ `README.md` created
- [ ] Update system CLAUDE.md with new commands
- [ ] Document API endpoints

### 6.2 Create Migration Guide
```markdown
# Migration from crispy-robot-main

## Steps:
1. Copy taxonomy_toolset/ to new project
2. Install no dependencies (stdlib only)
3. Run importer to populate database
4. Update build_master_db.py integration
5. Modify brief.py to use bridge
6. Add taxonomy routes to workbench server
7. Verify with test generation

## Verification:
- All kb.py queries work
- Suggest API returns recommendations
- Lineage recorded for new payloads
```

### 6.3 Testing Suite
Create `taxonomy_toolset/tests/`:

```python
# tests/test_db.py
import unittest
import tempfile
from taxonomy_toolset.db import TaxonomyDB

class TestTaxonomyDB(unittest.TestCase):
    def setUp(self):
        self.db_path = tempfile.mktemp(suffix=".db")
        self.db = TaxonomyDB(self.db_path)
    
    def test_insert_and_get_entry(self):
        entry = {"id": "test_entry", "title": "Test", "relevance": 3}
        self.db.insert_entry(entry)
        got = self.db.get_entry("test_entry")
        self.assertEqual(got["title"], "Test")
    
    def tearDown(self):
        self.db.close()
        import os
        os.unlink(self.db_path)

if __name__ == "__main__":
    unittest.main()
```

---

## File Inventory

```
crispy-robot-rebuild/
├── taxonomy_toolset/
│   ├── __init__.py              # [ ] Package init
│   ├── schema.sql               # [x] Database DDL
│   ├── db.py                    # [x] TaxonomyDB class
│   ├── importer.py              # [x] JSON importer
│   ├── suggeestions.py          # [x] SuggestionEngine
│   ├── cli.py                   # [x] Command-line interface
│   ├── api.py                   # [x] HTTP API handlers
│   ├── workbench_integration.py # [x] Workbench bridge
│   └── README.md                # [x] Architecture docs
└── IMPLEMENTATION_PLAN.md       # [x] This file
```

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Auto-tagging inaccuracy | MEDIUM | Confidence scores + manual review |
| Database migration complexity | LOW | Schema versioning, incremental builds |
| Performance with large lineage | LOW | Indexes, view pre-computation |
| API backward compatibility | HIGH | Version routes, gradual rollout |

---

## Success Criteria

- [ ] All 107 taxonomy entries importable
- [ ] CLI query commands functional
- [ ] Brief.py records lineage automatically
- [ ] Template auto-tagging >80% accurate
- [ ] API endpoints accessible via workbench
- [ ] Zero external dependencies (stdlib only)

**Overall Confidence: HIGH (85%)**
