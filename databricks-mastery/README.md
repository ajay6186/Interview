# Databricks Mastery

Structured learning path from Spark basics to production-grade Lakehouse engineering.
**6 phases · 30 topics · 50 examples + exercises + solutions per topic.**

---

## Structure

Each topic folder contains three files:

| File | Purpose |
|------|---------|
| `examples.py` | 50 annotated examples (BASIC → INTERMEDIATE → ADVANCED → EXPERT) |
| `exercise.py` | Hands-on exercise with assertion-based tests — fill in the `None` / `pass` stubs |
| `solution.py` | Complete working solution |

---

## Learning Path

### Phase 1 — Fundamentals
| # | Topic | Key concepts |
|---|-------|-------------|
| 01 | Spark Basics | SparkSession, DataFrames, RDDs, actions vs transformations |
| 02 | DataFrame Operations | select, filter, withColumn, join, groupBy, agg |
| 03 | SQL and Views | temp views, spark.sql(), DDL, CTAS |
| 04 | Reading & Writing Data | CSV, JSON, Parquet, Delta, JDBC |
| 05 | Transformations & Actions | lazy evaluation, DAG, collect, count, cache |

### Phase 2 — Intermediate
| # | Topic | Key concepts |
|---|-------|-------------|
| 01 | Joins & Aggregations | inner/left/cross joins, broadcast, agg functions |
| 02 | Window Functions | row_number, rank, lag/lead, running totals |
| 03 | Delta Lake Basics | ACID transactions, time travel, MERGE, schema enforcement |
| 04 | Streaming Basics | readStream, writeStream, checkpoints, triggers |
| 05 | UDFs & Pandas UDFs | Python UDFs, Pandas UDFs (Arrow), when to avoid |

### Phase 3 — Advanced
| # | Topic | Key concepts |
|---|-------|-------------|
| 01 | Advanced Delta | CDF, deletion vectors, liquid clustering, Z-ORDER |
| 02 | Performance Tuning | AQE, skew, shuffle tuning, broadcast, coalesce |
| 03 | Advanced Streaming | watermarks, late data, stateful aggregations, DLT |
| 04 | Unity Catalog | hierarchy, grants, lineage, external locations |
| 05 | MLflow Integration | experiment tracking, model registry, feature store |

### Phase 4 — Patterns
| # | Topic | Key concepts |
|---|-------|-------------|
| 01 | Medallion Architecture | Bronze → Silver → Gold design, incremental loads |
| 02 | Data Quality | Great Expectations, custom DQ rules, quarantine pattern |
| 03 | Schema Evolution | mergeSchema, addNewColumns, backward compatibility |
| 04 | Orchestration Patterns | Databricks Workflows, DABs, dependency graphs |
| 05 | Secrets & Config | dbutils.secrets, cluster policies, environment configs |

### Phase 5 — Real-World Projects
| # | Topic | Key concepts |
|---|-------|-------------|
| 01 | E-Commerce Pipeline | full Bronze→Silver→Gold, MERGE, RFM segmentation |
| 02 | Real-Time Dashboard | Structured Streaming, Auto Loader, live aggregations |
| 03 | ML Feature Store | feature engineering, Databricks Feature Store, serving |
| 04 | Data Lakehouse | star schema, SCD Type 2, CDC, multi-source fan-in |
| 05 | Reporting Pipeline | gold aggregations, SLA-based scheduling, alerting |

### Phase 6 — Production
| # | Topic | Key concepts |
|---|-------|-------------|
| 01 | Production ETL | idempotency, retry, dead-letter queue, audit log, watermarks |
| 02 | CI/CD & Testing | pytest, fixtures, schema contracts, idempotency tests, DABs |
| 03 | Cost Optimization | Photon, spot instances, AQE, OPTIMIZE/VACUUM, file sizing |
| 04 | Security & Governance | Unity Catalog RLS, column masks, PII masking, secrets, GDPR |
| 05 | Observability | structured logs, metrics, SLA alerts, anomaly detection |

---

## Prerequisites

```bash
pip install pyspark delta-spark
# Optional for testing:
pip install pytest chispa
```

For Databricks-specific features (dbutils, Delta constraints, Unity Catalog),
run notebooks directly in a Databricks workspace (DBR 12+).

---

## How to Use

### Work through examples
```bash
python phase-1-fundamentals/01-spark-basics/examples.py
```

### Attempt the exercise
```bash
python phase-1-fundamentals/01-spark-basics/exercise.py
# Fix the TODO stubs until all assertions pass
```

### Check the solution
```bash
python phase-1-fundamentals/01-spark-basics/solution.py
```

### Recommended order
1. Read `examples.py` top-to-bottom — don't run it line-by-line, read the patterns.
2. Attempt `exercise.py` without looking at the solution.
3. When stuck, re-read the relevant examples section.
4. Check `solution.py` only to compare after you have a working version.

---

## Key Production Patterns

| Pattern | Where | Description |
|---------|-------|-------------|
| Medallion Architecture | Phase 4-01 | Bronze raw → Silver clean → Gold aggregated |
| MERGE (upsert) | Phase 2-03 | Idempotent incremental loads via Delta MERGE |
| Dead-letter queue | Phase 6-01 | Quarantine bad records with error_reason column |
| Watermark-based incremental | Phase 6-01 | File-based state store for batch watermarks |
| Broadcast join | Phase 6-03 | Eliminate shuffle for small dimension tables |
| OPTIMIZE + Z-ORDER | Phase 6-03 | Compact files + enable data skipping |
| Column masking | Phase 6-04 | PII masking via dynamic views or column masks |
| Structured logging | Phase 6-05 | JSON logs with run_id + stage for correlation |
| SLA monitoring | Phase 6-05 | Freshness, row count, null rate checks per run |

---

## Interview Topics Covered

- **Spark internals**: DAG, stages, tasks, shuffle, AQE, broadcast joins
- **Delta Lake**: ACID, time travel, MERGE, schema evolution, deletion vectors
- **Medallion architecture**: Bronze/Silver/Gold design decisions
- **Performance**: skew handling, partition tuning, Z-ORDER, Photon
- **Production ETL**: idempotency, retry, error handling, schema contracts
- **Security**: Unity Catalog, RBAC, PII masking, secrets, GDPR
- **Observability**: structured logging, metrics, SLA alerting, anomaly detection
- **Cost**: cluster types, spot instances, OPTIMIZE/VACUUM, serverless
- **Testing**: pytest + PySpark, schema contracts, idempotency tests, CI/CD
- **Streaming**: Structured Streaming, Auto Loader, watermarks, DLT
