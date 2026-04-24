# Alternative Designs Considered (and Rejected)

This document records alternative architectural approaches considered during
the taxonomy_toolset design, with reasons for rejection.

## Alternative 1: Single SQLite Table with JSON Blob

**Design:**
```sql
CREATE TABLE taxonomy (
    id TEXT PRIMARY KEY,
    section TEXT,
    raw_json BLOB,  -- Everything in one JSON blob
    search_text TEXT  -- Concatenated for FTS
);
```

**Pros:**
- Absolute minimal schema (1 table vs 7 tables)
- Zero migration complexity
- Fast bulk imports

**Cons:**
- No referential integrity (orphaned relationships)
- No foreign key constraints on lineage
- Query performance degrades with JSON extraction
- Cannot express many-to-many (technique<->intent)

**Why rejected:**
Loss of referential integrity means `payload_lineage.technique_id` could reference
non-existent techniques. The lineage tracking requirement makes normalized schema
worth the complexity.

---

## Alternative 2: Keep JSON Files, Add Index

**Design:**
- Keep `browser_agent_subset.json` as source of truth
- Build JSON index files: `index_by_technique.json`, `index_by_intent.json`
- Load indices on demand

**Pros:**
- No database at all
- Human-readable source
- Simple `git diff` for changes

**Cons:**
- Query performance O(N) for every operation
- No ACID for concurrent updates
- Cannot incrementally update indices
- Must rebuild entire index on any change

**Why rejected:**
Payload generation happens frequently; O(N) queries (even on ~100 entries)
would add latency to brief.py. SQLite indices provide O(log N) lookups with
no external dependencies.

---

## Alternative 3: Graph Database (NetworkX/SQLite Graph)

**Design:**
```python
import networkx as nx
G = nx.DiGraph()
G.add_node("narrative_injection", type="technique")
G.add_edge("narrative_injection", "business_integrity", effectiveness=0.9)
```

**Pros:**
- Natural fit for technique->intent relationships
- Path-finding for combo recommendations
- Rich graph algorithms available

**Cons:**
- NetworkX requires dependency (violates stdlib-only)
- SQLite graph extensions (R*Tree) add complexity
- Overkill for ~100 nodes, ~50 edges

**Why rejected:**
Violates constraint: "no external dependencies". Also, adjacency list in SQLite
(technique_intent_map table) provides 95% of graph utility with zero deps.

---

## Alternative 4: Denormalized Flat Table

**Design:**
```sql
CREATE TABLE technique_intent_flat (
    technique_id TEXT,
    technique_name TEXT,
    intent_id TEXT,
    intent_name TEXT,
    effectiveness REAL,
    PRIMARY KEY (technique_id, intent_id)
);
```

**Pros:**
- Single-query for technique+intent data
- No joins needed
- Simple mental model

**Cons:**
- Name duplication (technique_name repeated)
- Update anomalies (change name in N places)
- Cannot add technique without intent
- Redundant storage

**Why rejected:**
Update anomalies are real risk: if we update "narrative_injection" description,
must update N rows. Normalized schema (separate tables with FKs) prevents this.

---

## Alternative 5: In-Memory Only (No Persistence)

**Design:**
- Load browser_agent_subset.json at startup
- Keep everything in Python dicts
- Re-parse on every CLI invocation

**Pros:**
- No database file to manage
- Stateless, "functional" design
- No schema versioning

**Cons:**
- 500ms+ startup time for every CLI call
- No cross-session lineage persistence
- Cannot analyze trends across workbench sessions
- Memory usage grows with lineage

**Why rejected:**
Lineage tracking requires persistence. Without database, we'd need to write
lineage to JSON files, which brings back the index problem (Alternative 2).

---

## Why the Chosen Design Won

| Criteria | Chosen (Normalized) | Alt 1 | Alt 2 | Alt 3 | Alt 4 | Alt 5 |
|----------|---------------------|-------|-------|-------|-------|-------|
| Referential integrity | ✅ | ❌ | ❌ | ✅ | ⚠️ | ❌ |
| Stdlib only | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| Query performance | ✅ | ⚠️ | ❌ | ✅ | ✅ | ❌ |
| Persistence | ✅ | ✅ | ⚠️ | ✅ | ✅ | ❌ |
| Schema clarity | ✅ | ✅ | ✅ | ⚠️ | ✅ | ✅ |
| Write performance | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ |
| Migration simplicity | ⚠️ | ✅ | ✅ | ❌ | ✅ | ✅ |

The chosen design (7 normalized tables) wins on the most important criteria
for this use case: referential integrity, persistence, and query performance.

The complexity cost is:
- 7 CREATE TABLE statements vs 1
- Foreign key constraints (actually helps catch bugs)
- JOIN queries (SQLite handles this efficiently)

This is acceptable trade-off given the lineage tracking requirement.

---

## Revisiting This Decision

If any of these become true, reconsider:

1. **Schema exceeds 20 tables** — Consider graph database or document store
2. **External deps allowed** — NetworkX or SQLite JSON1 extension becomes viable
3. **Lineage not needed** — Alternative 2 (JSON index) becomes competitive
4. **Read-only queries** — In-memory cache layer (Alternative 5 hybrid)

Decision log:
- 2025-04-23: Chosen normalized schema after WFGY analysis
- Future: Review if table count > 15 or query patterns change significantly
