# ============================================================================
# Solution 4.5 — Secrets & Configuration Management
# ============================================================================

import os, json
from pyspark.sql import SparkSession
from pyspark.sql import functions as F

spark = SparkSession.builder.appName("secrets-config-solution").getOrCreate()
spark.sparkContext.setLogLevel("WARN")

# 1. Environment variable with default
ENV = os.environ.get("ENV", "dev")
assert ENV in {"dev", "staging", "prod"}
print(f"[1] ENV={ENV}")

# 2. spark.conf set and get
spark.conf.set("myapp.batch_size", "1500")
batch_size = int(spark.conf.get("myapp.batch_size", "500"))
assert batch_size == 1500
print(f"[2] batch_size={batch_size}")

# 3. AppConfig class
class AppConfig:
    ENVS = {
        "dev":     {"catalog": "dev",     "max_records": 10_000},
        "staging": {"catalog": "staging", "max_records": 500_000},
        "prod":    {"catalog": "prod",    "max_records": None},
    }

    def __init__(self, env: str):
        if env not in self.ENVS:
            raise ValueError(f"Unknown env: {env}. Valid: {list(self.ENVS)}")
        self._env = env
        self._d   = self.ENVS[env]

    @property
    def env(self): return self._env

    @property
    def catalog(self): return self._d["catalog"]

    @property
    def database(self): return "raw"

    @property
    def orders_table(self): return f"{self.catalog}.{self.database}.orders"

    @property
    def max_records(self): return self._d["max_records"]

dev_cfg  = AppConfig("dev")
prod_cfg = AppConfig("prod")
assert dev_cfg.catalog == "dev"
assert dev_cfg.orders_table == "dev.raw.orders"
assert dev_cfg.max_records == 10_000
assert prod_cfg.catalog == "prod"
assert prod_cfg.max_records is None
try:
    AppConfig("unknown")
    assert False
except ValueError:
    pass
print(f"[3] AppConfig: {dev_cfg.orders_table} | prod max={prod_cfg.max_records}")

# 4. JSON config load and validate
config_path = "/tmp/ex_app_config.json"
config_raw  = {"batch_size": 1000, "parallelism": 8, "checkpoint_path": "/tmp/ckpt"}
with open(config_path, "w") as f:
    json.dump(config_raw, f)
with open(config_path) as f:
    loaded_cfg = json.load(f)
assert loaded_cfg["batch_size"] == 1000
assert loaded_cfg["parallelism"] == 8
print(f"[4] loaded: {loaded_cfg}")

# 5. Config validation
def validate_config(cfg: dict, required_keys: list) -> bool:
    missing = [k for k in required_keys if not cfg.get(k)]
    if missing:
        raise ValueError(f"Missing required config keys: {missing}")
    return True

assert validate_config({"catalog": "prod", "batch_size": 1000}, ["catalog", "batch_size"]) is True
try:
    validate_config({"catalog": "prod"}, ["catalog", "batch_size"])
    assert False
except ValueError as e:
    print(f"[5] validation error: {e}")

# 6. Config layering
def merge_configs(*dicts: dict) -> dict:
    out = {}
    for d in dicts:
        out.update(d)
    return out

base     = {"batch_size": 500, "retries": 3, "log_level": "INFO", "timeout": 60}
env_over = {"batch_size": 2000, "log_level": "WARN"}
hotfix   = {"retries": 5}
final = merge_configs(base, env_over, hotfix)
assert final["batch_size"] == 2000
assert final["retries"] == 5
assert final["log_level"] == "WARN"
assert final["timeout"] == 60
print(f"[6] merged: {final}")

# 7. Config from Delta
cfg_df = spark.createDataFrame([
    ("batch_size",  "3000", "prod"),
    ("parallelism", "12",   "prod"),
    ("max_retries", "5",    "prod"),
    ("batch_size",  "500",  "dev"),
], ["cfg_key", "cfg_value", "env"])
cfg_df.createOrReplaceTempView("pipeline_config")
prod_batch = int(spark.sql("SELECT cfg_value FROM pipeline_config WHERE cfg_key='batch_size' AND env='prod'").collect()[0][0])
assert prod_batch == 3000
print(f"[7] prod batch_size={prod_batch}")

# 8. Secret masking
def mask_secret(value: str) -> str:
    if len(value) <= 4:
        return "***"
    return value[:2] + "***" + value[-2:]

assert mask_secret("mypassword") == "my***rd"
assert mask_secret("ab") == "***"
assert mask_secret("abcd") == "***"
assert mask_secret("abcde") == "ab***de"
print(f"[8] masked: {mask_secret('supersecretpass123')}")

# 9. Config drift detection
def detect_drift(current: dict, expected: dict) -> set:
    return {k for k in expected if current.get(k) != expected[k]}

current_confs  = {"shuffle_partitions": "200", "adaptive": "true",  "cache": "false"}
expected_confs = {"shuffle_partitions": "200", "adaptive": "false", "cache": "true"}
drifted = detect_drift(current_confs, expected_confs)
assert drifted == {"adaptive", "cache"}
print(f"[9] drifted: {drifted}")

# 10. PipelineConfig
class PipelineConfig:
    VALID_ENVS = {"dev", "staging", "prod"}

    def __init__(self, env: str, batch_size: int, checkpoint_path: str):
        assert env in self.VALID_ENVS, f"env must be in {self.VALID_ENVS}"
        assert batch_size > 0, "batch_size must be positive"
        assert checkpoint_path.startswith("/"), "checkpoint_path must be absolute"
        self.env = env
        self.batch_size = batch_size
        self.checkpoint_path = checkpoint_path

pc = PipelineConfig("prod", 2000, "/checkpoints/orders")
assert pc.env == "prod"
assert pc.batch_size == 2000
try:
    PipelineConfig("unknown_env", 100, "/ckpt")
    assert False
except AssertionError:
    pass
try:
    PipelineConfig("dev", -1, "/ckpt")
    assert False
except AssertionError:
    pass
print(f"[10] PipelineConfig: env={pc.env} batch={pc.batch_size}")

print("\nAll assertions passed!")
spark.stop()
