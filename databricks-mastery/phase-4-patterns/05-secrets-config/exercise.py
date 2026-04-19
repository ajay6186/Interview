# ============================================================================
# Exercise 4.5 — Secrets & Configuration Management
# ============================================================================
# Practice safe secret access patterns, config class design, validation,
# layered config merging, and hot-reload from Delta.
#
# Instructions: Replace every None / pass so all assertions pass.
# Run with: python exercise.py
# ============================================================================

import os, json
from pyspark.sql import SparkSession
from pyspark.sql import functions as F

spark = SparkSession.builder.appName("secrets-config-exercise").getOrCreate()
spark.sparkContext.setLogLevel("WARN")

# ---------------------------------------------------------------------------
# 1. Environment variable with default
# ---------------------------------------------------------------------------
# TODO: Read ENV from os.environ, default to "dev" if not set
ENV = None  # replace

assert ENV in {"dev", "staging", "prod"}, f"Unknown env: {ENV}"
print(f"[1] ENV={ENV}")

# ---------------------------------------------------------------------------
# 2. spark.conf set and get
# ---------------------------------------------------------------------------
# TODO: Set spark conf "myapp.batch_size" to "1500"
# TODO: Read it back into batch_size as an integer

batch_size = None  # replace

assert isinstance(batch_size, int)
assert batch_size == 1500
print(f"[2] batch_size={batch_size}")

# ---------------------------------------------------------------------------
# 3. Config class with per-environment defaults
# ---------------------------------------------------------------------------
# TODO: Implement AppConfig class:
#   - __init__(self, env: str) — raises ValueError for unknown envs
#   - env property
#   - catalog property: "dev" / "staging" / "prod" based on env
#   - database property: always "raw"
#   - orders_table property: returns f"{catalog}.{database}.orders"
#   - max_records property: dev=10_000, staging=500_000, prod=None

class AppConfig:
    ENVS = {
        "dev":     {"catalog": "dev",     "max_records": 10_000},
        "staging": {"catalog": "staging", "max_records": 500_000},
        "prod":    {"catalog": "prod",    "max_records": None},
    }

    def __init__(self, env: str):
        pass  # TODO

    @property
    def catalog(self): pass  # TODO

    @property
    def database(self): return "raw"

    @property
    def orders_table(self): pass  # TODO

    @property
    def max_records(self): pass  # TODO


dev_cfg  = AppConfig("dev")
prod_cfg = AppConfig("prod")

assert dev_cfg.catalog == "dev"
assert dev_cfg.orders_table == "dev.raw.orders"
assert dev_cfg.max_records == 10_000
assert prod_cfg.catalog == "prod"
assert prod_cfg.max_records is None

try:
    AppConfig("unknown")
    assert False, "Should raise ValueError for unknown env"
except ValueError:
    pass

print(f"[3] AppConfig dev table={dev_cfg.orders_table}  prod max={prod_cfg.max_records}")

# ---------------------------------------------------------------------------
# 4. JSON config load and validate
# ---------------------------------------------------------------------------
config_path = "/tmp/ex_app_config.json"
config_raw = {"batch_size": 1000, "parallelism": 8, "checkpoint_path": "/tmp/ckpt"}

# TODO: Write config_raw to config_path as JSON
# TODO: Read it back into loaded_cfg

loaded_cfg = None  # replace

assert loaded_cfg is not None
assert loaded_cfg["batch_size"] == 1000
assert loaded_cfg["parallelism"] == 8
print(f"[4] loaded config: {loaded_cfg}")

# ---------------------------------------------------------------------------
# 5. Config validation
# ---------------------------------------------------------------------------
# TODO: implement validate_config(cfg: dict, required_keys: list) → raises ValueError
#       if any required_key is missing or falsy; returns True otherwise

def validate_config(cfg: dict, required_keys: list) -> bool:
    pass  # TODO

assert validate_config({"catalog": "prod", "batch_size": 1000}, ["catalog", "batch_size"]) is True

try:
    validate_config({"catalog": "prod"}, ["catalog", "batch_size"])
    assert False, "Should have raised ValueError"
except ValueError as e:
    print(f"[5] validation error: {e}")

# ---------------------------------------------------------------------------
# 6. Config layering
# ---------------------------------------------------------------------------
# TODO: implement merge_configs(*dicts) → later dicts override earlier

def merge_configs(*dicts: dict) -> dict:
    pass  # TODO

base     = {"batch_size": 500, "retries": 3, "log_level": "INFO", "timeout": 60}
env_over = {"batch_size": 2000, "log_level": "WARN"}
hotfix   = {"retries": 5}

final = merge_configs(base, env_over, hotfix)
assert final["batch_size"] == 2000
assert final["retries"] == 5
assert final["log_level"] == "WARN"
assert final["timeout"] == 60  # from base, not overridden
print(f"[6] merged config: {final}")

# ---------------------------------------------------------------------------
# 7. Config stored in Delta (config-as-data pattern)
# ---------------------------------------------------------------------------
cfg_df = spark.createDataFrame([
    ("batch_size",  "3000", "prod"),
    ("parallelism", "12",   "prod"),
    ("max_retries", "5",    "prod"),
    ("batch_size",  "500",  "dev"),
], ["cfg_key", "cfg_value", "env"])
cfg_df.createOrReplaceTempView("pipeline_config")

# TODO: Query the temp view to get batch_size for "prod"
#       Store the integer value in prod_batch

prod_batch = None  # replace

assert isinstance(prod_batch, int)
assert prod_batch == 3000
print(f"[7] prod batch_size from Delta config: {prod_batch}")

# ---------------------------------------------------------------------------
# 8. Secret masking utility
# ---------------------------------------------------------------------------
# TODO: implement mask_secret(value: str) → replaces everything except first 2
#       and last 2 characters with "***"
#       e.g., "mypassword" → "my***rd"
#       if len(value) <= 4: return "***"

def mask_secret(value: str) -> str:
    pass  # TODO

assert mask_secret("mypassword") == "my***rd"
assert mask_secret("ab") == "***"
assert mask_secret("abcd") == "***"
assert mask_secret("abcde") == "ab***de"
print(f"[8] masked: {mask_secret('supersecretpass123')}")

# ---------------------------------------------------------------------------
# 9. Config drift detection
# ---------------------------------------------------------------------------
# TODO: implement detect_drift(current: dict, expected: dict) → returns set of
#       keys where current[key] != expected[key] (ignores keys not in expected)

def detect_drift(current: dict, expected: dict) -> set:
    pass  # TODO

current_confs  = {"shuffle_partitions": "200", "adaptive": "true",  "cache": "false"}
expected_confs = {"shuffle_partitions": "200", "adaptive": "false", "cache": "true"}

drifted = detect_drift(current_confs, expected_confs)
assert drifted == {"adaptive", "cache"}, f"Expected drifted={{'adaptive','cache'}}, got {drifted}"
print(f"[9] drifted config keys: {drifted}")

# ---------------------------------------------------------------------------
# 10. PipelineConfig validation class
# ---------------------------------------------------------------------------
# TODO: implement PipelineConfig dataclass-style class with:
#   - __init__(env, batch_size, checkpoint_path)
#   - validates: env in {"dev","staging","prod"}, batch_size > 0,
#     checkpoint_path starts with "/"
#   - raises AssertionError on invalid input

class PipelineConfig:
    pass  # TODO

pc = PipelineConfig("prod", 2000, "/checkpoints/orders")
assert pc.env == "prod"
assert pc.batch_size == 2000

try:
    PipelineConfig("unknown_env", 100, "/ckpt")
    assert False, "Should raise AssertionError for invalid env"
except AssertionError:
    pass

try:
    PipelineConfig("dev", -1, "/ckpt")
    assert False, "Should raise AssertionError for negative batch_size"
except AssertionError:
    pass

print(f"[10] PipelineConfig validated: env={pc.env} batch={pc.batch_size}")

print("\nAll assertions passed!")
spark.stop()
