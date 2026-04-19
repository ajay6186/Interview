# ============================================================================
# Examples 6.2 — CI/CD & Testing  (50 examples)
# BASIC (1–15) | INTERMEDIATE (16–30) | ADVANCED (31–42) | EXPERT (43–50)
# Covers: pytest PySpark, fixtures, CI/CD, DABs, code quality, integration tests
# ============================================================================

import os
from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from pyspark.sql.types import StructType, StructField, StringType, DoubleType, IntegerType

spark = SparkSession.builder.appName("cicd-testing").getOrCreate()
spark.sparkContext.setLogLevel("WARN")

# ── BASIC ─────────────────────────────────────────────────────────────────────

# 1. Why test ETL code
print("""Ex01 Why test ETL:
  - Business logic bugs are silent (wrong revenue, wrong churn label)
  - Schema changes at source break downstream silently
  - Tests catch regressions before they hit production
  - Enables confident refactoring and parallelisation of development
""")

# 2. What to test in ETL
print("""Ex02 ETL test pyramid:
  Unit tests     (fast, no I/O): transform functions, business logic
  Integration    (medium, small data): full Bronze→Silver→Gold on test fixtures
  End-to-end     (slow, full scale): smoke test in staging environment
  Data quality   (always running): Great Expectations, custom assertions
""")

# 3. Simple unit test for a transform function
def add_line_total(df):
    return df.withColumn("line_total", F.round(F.col("unit_price") * F.col("quantity"), 2))

test_df = spark.createDataFrame([("p1", 2, 99.99), ("p2", 3, 49.00)],
                                  ["product_id","quantity","unit_price"])
result = add_line_total(test_df)
assert "line_total" in result.columns
assert result.filter(F.col("product_id") == "p1").select("line_total").collect()[0][0] == 199.98
print("Ex03 unit test for add_line_total passed")

# 4. Test for null handling
def drop_nulls(df, cols):
    return df.dropna(subset=cols)

df_with_null = spark.createDataFrame([("a",1.0),(None,2.0),("c",None)],["name","val"])
result_no_null = drop_nulls(df_with_null, ["name"])
assert result_no_null.count() == 2
print("Ex04 drop_nulls test passed")

# 5. Test for deduplication
def dedup(df, key_col: str):
    return df.dropDuplicates([key_col])

df_dup = spark.createDataFrame([("a","x"),("b","y"),("a","z")],["id","val"])
deduped = dedup(df_dup, "id")
assert deduped.count() == 2
print("Ex05 dedup test passed")

# 6. Schema assertion helper
def assert_schema(df, expected_cols: list, label: str = "df"):
    actual = set(df.columns)
    expected = set(expected_cols)
    missing = expected - actual
    if missing:
        raise AssertionError(f"{label} missing columns: {missing}")
    print(f"Ex06 schema assertion '{label}' passed")

assert_schema(test_df, ["product_id","quantity","unit_price"])

# 7. Row count assertion
def assert_count(df, expected: int, label: str = "df"):
    actual = df.count()
    assert actual == expected, f"{label}: expected {expected} rows, got {actual}"
    print(f"Ex07 count assertion '{label}' passed: {actual}")

assert_count(deduped, 2, "deduped")

# 8. Data value assertion
def assert_no_negatives(df, col: str, label: str = "df"):
    neg = df.filter(F.col(col) < 0).count()
    assert neg == 0, f"{label}: found {neg} negative values in '{col}'"
    print(f"Ex08 no-negatives assertion '{label}.{col}' passed")

assert_no_negatives(result, "line_total")

# 9. Column type assertion
def assert_col_type(df, col: str, expected_type: str, label: str = "df"):
    actual = dict(df.dtypes).get(col)
    assert actual == expected_type, f"{label}: col '{col}' is '{actual}', expected '{expected_type}'"
    print(f"Ex09 type assertion '{label}.{col}'={actual} passed")

assert_col_type(result, "line_total", "double")

# 10. Fixture-style test data
def make_orders_df():
    """Canonical test fixture for orders tests."""
    return spark.createDataFrame([
        ("o1","c1","p1",2, 99.99,"completed"),
        ("o2","c2","p2",1,199.00,"completed"),
        ("o3","c1","p3",3, 29.99,"refunded"),
        ("o4","c3","p1",1, 99.99,"pending"),
    ], ["order_id","customer_id","product_id","quantity","unit_price","status"])

orders_fixture = make_orders_df()
print(f"Ex10 fixture created: {orders_fixture.count()} rows")

# 11. pytest test file structure
print("""Ex11 tests/test_transforms.py:
import pytest
from pyspark.sql import SparkSession
from my_etl.transforms import add_line_total, drop_nulls

@pytest.fixture(scope='session')
def spark():
    return SparkSession.builder.master('local[2]').appName('tests').getOrCreate()

def test_add_line_total(spark):
    df = spark.createDataFrame([('p1',2,99.99)],['product_id','quantity','unit_price'])
    result = add_line_total(df)
    assert result.filter(result.product_id=='p1').select('line_total').collect()[0][0] == 199.98

def test_drop_nulls_removes_null_rows(spark):
    df = spark.createDataFrame([('a',),(None,)], ['name'])
    assert drop_nulls(df,['name']).count() == 1
""")

# 12. pytest conftest.py — shared SparkSession fixture
print("""Ex12 tests/conftest.py:
import pytest
from pyspark.sql import SparkSession

@pytest.fixture(scope='session')
def spark():
    spark = (SparkSession.builder
        .master('local[2]')
        .appName('test-suite')
        .config('spark.sql.shuffle.partitions','2')
        .config('spark.sql.extensions','io.delta.sql.DeltaSparkSessionExtension')
        .config('spark.sql.catalog.spark_catalog',
                'org.apache.spark.sql.delta.catalog.DeltaCatalog')
        .getOrCreate())
    yield spark
    spark.stop()
""")

# 13. chispa library for DataFrame equality
print("""Ex13 chispa (pip install chispa):
from chispa.dataframe_comparer import assert_df_equality

expected = spark.createDataFrame([('p1',199.98)], ['product_id','line_total'])
actual   = add_line_total(test_df).select('product_id','line_total')
                                   .filter(col('product_id')=='p1')
assert_df_equality(actual, expected, ignore_row_order=True)
""")

# 14. Test parameterisation
print("""Ex14 pytest parametrize:
@pytest.mark.parametrize('status,expected_count', [
    ('completed', 2),
    ('refunded',  1),
    ('pending',   1),
])
def test_status_filter(spark, status, expected_count):
    df = make_orders_df()
    assert df.filter(col('status')==status).count() == expected_count
""")

# 15. Temporary directory for Delta in tests
print("""Ex15 Temp Delta path in tests:
import tempfile, pytest
@pytest.fixture
def tmp_delta_path(tmp_path):
    return str(tmp_path / 'test_table')

def test_write_delta(spark, tmp_delta_path):
    df = spark.range(5)
    df.write.format('delta').save(tmp_delta_path)
    assert spark.read.format('delta').load(tmp_delta_path).count() == 5
""")

# ── INTERMEDIATE ──────────────────────────────────────────────────────────────

# 16. Integration test — full Bronze→Silver pipeline
def run_bronze_to_silver(raw_df, silver_path: str):
    return (raw_df
        .dropDuplicates(["order_id"])
        .withColumn("quantity",   F.col("quantity").cast("int"))
        .withColumn("unit_price", F.col("unit_price").cast("double"))
        .filter(F.col("unit_price") > 0)
        .withColumn("line_total", F.round(F.col("unit_price") * F.col("quantity"), 2)))

raw_fixture = spark.createDataFrame([
    ("o1","c1","p1","2","99.99"),
    ("o2","c2","p2","1","199.00"),
    ("o1","c1","p1","2","99.99"),  # dup
], ["order_id","customer_id","product_id","quantity","unit_price"])

silver_out = run_bronze_to_silver(raw_fixture, "/tmp/test_silver")
assert silver_out.count() == 2, "Dedup should remove 1 duplicate"
assert "line_total" in silver_out.columns
print(f"Ex16 integration test: bronze→silver rows={silver_out.count()}")

# 17. Contract test — schema enforcement
def assert_silver_contract(df):
    required = {"order_id":"string","customer_id":"string",
                "unit_price":"double","line_total":"double"}
    actual_types = dict(df.dtypes)
    for col, dtype in required.items():
        assert col in actual_types, f"Missing column: {col}"
        assert actual_types[col] == dtype, f"{col}: expected {dtype}, got {actual_types[col]}"
    print("Ex17 silver contract assertion passed")

assert_silver_contract(silver_out)

# 18. Golden dataset test
print("""Ex18 Golden dataset test:
# Save known-good output once ('golden file')
# On every CI run: compare pipeline output to golden file
expected = spark.read.format('delta').load('/tests/golden/silver_orders')
actual   = run_pipeline(test_input)
from chispa import assert_df_equality
assert_df_equality(actual, expected, ignore_row_order=True)
""")

# 19. Mock external dependency
print("""Ex19 Mock JDBC source in tests:
# Instead of connecting to real DB:
@pytest.fixture
def mock_orders_df(spark):
    return spark.createDataFrame([('o1','c1',99.99)], ['order_id','customer_id','amount'])

# Pass mock to function under test:
def test_cleanse(spark, mock_orders_df):
    result = cleanse_orders(mock_orders_df)
    assert result.count() == 1
""")

# 20. Test Delta MERGE
import tempfile
tmp = tempfile.mkdtemp()
existing = spark.createDataFrame([("o1","completed"),("o2","pending")],["order_id","status"])
existing.write.format("delta").mode("overwrite").save(tmp)
update = spark.createDataFrame([("o2","shipped"),("o3","completed")],["order_id","status"])

from delta.tables import DeltaTable
DeltaTable.forPath(spark, tmp).alias("t") \
    .merge(update.alias("s"),"t.order_id=s.order_id") \
    .whenMatchedUpdateAll().whenNotMatchedInsertAll().execute()

result_merge = spark.read.format("delta").load(tmp)
assert result_merge.count() == 3
o2_status = result_merge.filter(F.col("order_id")=="o2").select("status").collect()[0][0]
assert o2_status == "shipped"
print(f"Ex20 MERGE test passed: count={result_merge.count()} o2={o2_status}")

# 21. pytest markers for slow tests
print("""Ex21 Test markers:
# conftest.py:
# def pytest_configure(config): config.addinivalue_line('markers','slow: slow integration tests')

@pytest.mark.slow
def test_full_pipeline_integration(spark, tmp_path):
    ...

# Run fast only: pytest -m 'not slow'
# Run all:       pytest
""")

# 22. Test coverage
print("""Ex22 Coverage:
# Run with coverage:
# pytest --cov=my_etl --cov-report=html tests/
# Coverage badge in README
# Target: >= 80% for transform functions
""")

# 23. Test data generation
def gen_orders(n: int, seed: int = 42):
    import random
    random.seed(seed)
    data = [(f"o{i}", f"c{random.randint(1,5)}", f"p{random.randint(1,4)}",
             random.randint(1,5), round(random.uniform(10, 1000), 2))
            for i in range(1, n+1)]
    return spark.createDataFrame(data, ["order_id","customer_id","product_id","quantity","unit_price"])

big_test = gen_orders(100)
assert big_test.count() == 100
print(f"Ex23 generated {big_test.count()} test orders")

# 24. Property-based testing concept
print("""Ex24 Property-based testing (hypothesis + pyspark):
from hypothesis import given, settings
from hypothesis.strategies import lists, integers, floats

@given(lists(tuples(text(), floats(min_value=0.01, max_value=9999)),min_size=1))
def test_line_total_always_positive(data):
    df = spark.createDataFrame([(d[0],1,d[1]) for d in data], ['id','qty','price'])
    result = add_line_total(df)
    assert result.filter(col('line_total') <= 0).count() == 0
""")

# 25. Test isolation — each test uses fresh temp path
print("""Ex25 Test isolation:
@pytest.fixture(autouse=True)
def clean_tmp(tmp_path):
    '''Each test gets its own tmp_path — no Delta log cross-contamination'''
    yield
    # tmp_path is automatically cleaned up by pytest
""")

# ── ADVANCED ──────────────────────────────────────────────────────────────────

# 26. Databricks Asset Bundles (DAB) project structure
print("""Ex26 DAB project layout:
my_project/
├── bundle.yml            ← DAB manifest
├── databricks.yml        ← workspace config
├── src/
│   ├── etl/
│   │   ├── __init__.py
│   │   ├── ingest.py
│   │   ├── transform.py
│   │   └── gold.py
│   └── dq/
│       └── checks.py
├── tests/
│   ├── conftest.py
│   ├── unit/
│   │   └── test_transform.py
│   └── integration/
│       └── test_pipeline.py
└── setup.py / pyproject.toml
""")

# 27. bundle.yml CI/CD configuration
print("""Ex27 bundle.yml:
bundle:
  name: orders_pipeline

targets:
  dev:
    mode: development
    workspace: {host: ${DEV_HOST}, token: ${DEV_TOKEN}}
  prod:
    mode: production
    workspace: {host: ${PROD_HOST}, token: ${PROD_TOKEN}}
    run_as: {service_principal_name: prod-etl-sp@company.com}

resources:
  jobs:
    daily_orders_etl:
      name: daily_orders_etl_${bundle.target}
      tasks:
        - task_key: ingest
          python_wheel_task: {package_name: orders_pipeline, entry_point: ingest}
        - task_key: transform
          depends_on: [{task_key: ingest}]
          python_wheel_task: {package_name: orders_pipeline, entry_point: transform}
""")

# 28. GitHub Actions CI pipeline
print("""Ex28 .github/workflows/ci.yml:
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: {python-version: '3.11'}
      - run: pip install pyspark delta-spark pytest chispa
      - run: pytest tests/unit/ -v --tb=short
      - run: pytest tests/integration/ -v -m 'not e2e'
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pip install ruff mypy
      - run: ruff check src/
      - run: mypy src/
""")

# 29. Databricks CI deployment step
print("""Ex29 CD to Databricks (GitHub Actions):
  - name: Deploy bundle
    run: |
      pip install databricks-cli
      databricks bundle deploy --target prod
    env:
      PROD_HOST: ${{ secrets.DATABRICKS_HOST }}
      PROD_TOKEN: ${{ secrets.DATABRICKS_TOKEN }}

  - name: Run integration test job
    run: databricks bundle run --target staging integration_test_job
""")

# 30. Wheel packaging for ETL code
print("""Ex30 Python wheel packaging:
pyproject.toml:
[build-system]
requires = ['setuptools']
[project]
name = 'orders_pipeline'
version = '1.2.0'
packages = ['src/etl', 'src/dq']

Build:   python -m build
Upload:  databricks fs cp dist/orders_pipeline-1.2.0-py3-none-any.whl dbfs:/libs/
Install: cluster → Libraries → Add → DBFS → select wheel
""")

# 31. Pre-commit hooks for code quality
print("""Ex31 .pre-commit-config.yaml:
repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.4.0
    hooks:
      - id: ruff
        args: [--fix]
  - repo: https://github.com/pre-commit/pre-commit-hooks
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
""")

# 32. Test for idempotency
def test_pipeline_idempotency(run_fn, output_path: str) -> bool:
    run_fn()
    c1 = spark.read.format("delta").load(output_path).count()
    run_fn()
    c2 = spark.read.format("delta").load(output_path).count()
    ok = c1 == c2
    print(f"Ex32 idempotency: run1={c1}  run2={c2}  {'OK' if ok else 'FAIL'}")
    return ok

idem_path = "/tmp/idem_ci_test"
def run_idem():
    spark.range(10).write.format("delta").mode("overwrite").save(idem_path)

assert test_pipeline_idempotency(run_idem, idem_path)

# 33. Regression test pattern
print("""Ex33 Regression test:
# Run pipeline against a snapshot of production data (sample)
# Compare aggregated outputs to known baseline:
#   assert abs(gold_revenue - baseline_revenue) / baseline_revenue < 0.01  (within 1%)
# If deviation > threshold: FAIL → investigate before merging
""")

# 34. Test environment management
print("""Ex34 Test environment:
  Local:    SparkSession.builder.master('local[2]') — fast, no cluster
  CI:       Same local[2] setup in GitHub Actions runner
  Staging:  Deploy to real Databricks workspace + run smoke tests
  Prod:     Only after all tests pass on staging
  NEVER:    Run tests against production data directly
""")

# 35. Negative test cases
def test_empty_input(df_transform_fn):
    """Empty DataFrame should return empty, not crash."""
    schema = StructType([
        StructField("order_id",  StringType(), True),
        StructField("quantity",  IntegerType(),True),
        StructField("unit_price",DoubleType(), True),
    ])
    empty_df = spark.createDataFrame([], schema)
    result = df_transform_fn(empty_df)
    assert result.count() == 0
    print("Ex35 empty input test passed")

test_empty_input(lambda df: df.withColumn("line_total", F.col("quantity") * F.col("unit_price")))

# 36. Testing streaming logic in batch mode
print("""Ex36 Test streaming in batch mode:
# Write test data to a Delta table, use it as a mock streaming source
test_data.write.format('delta').save(tmp_bronze)
silver_df = (spark.readStream.format('delta').load(tmp_bronze)
    .filter(col('amount') > 0)
    .writeStream.format('delta')
    .option('checkpointLocation', tmp_ckpt)
    .trigger(availableNow=True)  # process all available + stop
    .start(tmp_silver))
silver_df.awaitTermination()
assert spark.read.format('delta').load(tmp_silver).count() == expected
""")

# 37. Lint and type checking
print("""Ex37 Code quality:
ruff check src/           # style + unused imports
ruff format src/          # auto-format
mypy src/ --ignore-missing-imports   # static type checking
bandit -r src/            # security scan
""")

# 38. Test Delta constraints
print("""Ex38 Test CHECK constraint enforcement:
import pytest
spark.sql('ALTER TABLE delta.`/tmp/test_orders` ADD CONSTRAINT pos_price CHECK (unit_price > 0)')
with pytest.raises(Exception):
    spark.createDataFrame([('bad', -1.0)], ['order_id','unit_price']) \\
         .write.format('delta').mode('append').save('/tmp/test_orders')
print('constraint correctly blocked invalid write')
""")

# 39. Test time travel
print("""Ex39 Test time travel:
orders.write.format('delta').mode('overwrite').save(tmp)
DeltaTable.forPath(spark, tmp).update(col('status')=='pending', {'status': lit('shipped')})
v0 = spark.read.format('delta').option('versionAsOf',0).load(tmp)
v1 = spark.read.format('delta').option('versionAsOf',1).load(tmp)
assert v0.filter(col('status')=='pending').count()  > 0
assert v1.filter(col('status')=='shipped').count()  > 0
""")

# 40. CI badge and quality gates
print("""Ex40 Quality gates in CI:
- Coverage >= 80%    → fail build if below
- No ruff violations → fail build if any
- mypy type errors   → fail build if any
- All tests pass     → fail build on any test failure
- Security scan      → fail on HIGH severity issues (bandit)
""")

# 41. Test parameterisation for environments
print("""Ex41 Environment-parameterised tests:
@pytest.mark.parametrize('env', ['dev','staging'])
def test_catalog_access(spark, env):
    cfg = AppConfig(env)
    # Verify catalog exists and is readable
    tables = spark.sql(f'SHOW TABLES IN {cfg.catalog}.raw').collect()
    assert len(tables) >= 0  # at least no exception
""")

# 42. Test reporting
print("""Ex42 Test report:
pytest tests/ -v --tb=short --junitxml=reports/pytest.xml
# JUnit XML picked up by GitHub Actions / Jenkins / Azure DevOps
# HTML report: pytest --html=reports/index.html
""")

# ── EXPERT ────────────────────────────────────────────────────────────────────

# 43. Databricks Workflow-level integration tests
print("""Ex43 Workflow integration test job:
# A dedicated 'integration_test' task in the DAB bundle:
resources:
  jobs:
    integration_tests:
      name: integration_tests_${bundle.target}
      tasks:
        - task_key: run_tests
          spark_python_task:
            python_file: tests/integration/run_all.py
            parameters: ['--env', '${bundle.target}']
      job_clusters:
        - job_cluster_key: test_cluster
          new_cluster: {spark_version: 15.4.x-scala2.12, num_workers: 2}
# CI step: databricks bundle run --target staging integration_tests
""")

# 44. Test data lifecycle management
print("""Ex44 Test data lifecycle:
- Use dedicated 'test' catalog: test.raw.orders (Unity Catalog)
- CI job writes synthetic test data at start of test run
- Test data tagged with run_id → easy cleanup
- Post-test: DELETE FROM test.raw.orders WHERE test_run_id = '{run_id}'
- Never use production data in automated tests (PII risk + side effects)
""")

# 45. Contract testing between teams
print("""Ex45 Contract tests:
Producer team (Data Engineering):
  - Publish schema contract: silver.orders schema + column semantics
  - Validate in CI: silver output matches published schema + DQ rules

Consumer team (Analytics/ML):
  - Validate: inputs from DE match expected schema
  - If mismatch: break CI → alert DE team

Tool: Great Expectations shared expectation suites (JSON stored in git)
""")

# 46. Schema registry integration
print("""Ex46 Schema registry:
# AWS Glue Schema Registry / Confluent Schema Registry
# Register schema before writing:
glue_client.put_schema_version(
    SchemaId={'SchemaName': 'orders', 'RegistryName': 'prod'},
    SchemaDefinition=schema_json, DataFormat='AVRO'
)
# Deserialise with registry on consume side
""")

# 47. Performance testing
print("""Ex47 Performance test:
@pytest.mark.perf
def test_pipeline_completes_in_sla(spark):
    import time
    df = gen_orders(1_000_000)  # 1M row test
    start = time.time()
    result = run_bronze_to_silver(df, tmp_path)
    duration = time.time() - start
    assert duration < 120, f'Pipeline took {duration:.1f}s > SLA 120s'
    print(f'Perf test: {duration:.1f}s for 1M rows')
""")

# 48. Mutation testing
print("""Ex48 Mutation testing (mutmut):
pip install mutmut
mutmut run --paths-to-mutate src/etl/transforms.py --tests-dir tests/unit/
# Mutmut introduces bugs (mutants) and verifies tests catch them
# Surviving mutants = logic not covered by tests
mutmut results
""")

# 49. Continuous deployment
print("""Ex49 CD pipeline:
Trigger: merge to main branch
Steps:
  1. Run unit + integration tests (fast: ~5 min)
  2. Build Python wheel, push to Databricks DBFS
  3. databricks bundle deploy --target staging
  4. Run staging smoke test job (availableNow trigger)
  5. Manual approval gate (Slack notification)
  6. databricks bundle deploy --target prod
  7. Trigger first prod run; monitor Slack for alerts
Rollback: databricks bundle deploy --target prod (previous version tag)
""")

# 50. Testing excellence checklist
print("""Ex50 Testing checklist:
✓ Unit tests for every transform function (local, fast, no I/O)
✓ Integration tests with Delta fixtures (temp path per test)
✓ Schema contract tests before merging
✓ Idempotency test (run twice, same result)
✓ Negative tests (empty input, null values, type mismatches)
✓ Golden dataset regression tests
✓ CI runs on every PR (GitHub Actions/Azure DevOps)
✓ Coverage >= 80% enforced in CI
✓ Lint (ruff) + type check (mypy) in CI
✓ Security scan (bandit) in CI
✓ Performance test for hot-path transforms
✓ Contract tests shared between producer and consumer teams
""")


def main():
    print("\nAll 50 examples ran successfully.")
    spark.stop()

if __name__ == "__main__":
    main()
