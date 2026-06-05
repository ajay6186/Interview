# 4.4 — Built-in Functions & Expressions

**Goal:** Master Terraform's built-in functions for strings, collections, CIDR math, encoding, and conditionals.

## Most Used Functions by Category

### String Functions
```hcl
upper("dev")                          # "DEV"
lower("PROD")                         # "prod"
trimspace("  hello  ")               # "hello"
replace("hello-world", "-", "_")     # "hello_world"
split(",", "a,b,c")                  # ["a", "b", "c"]
join("-", ["us", "east", "1"])       # "us-east-1"
format("bucket-%s-%03d", "app", 7)   # "bucket-app-007"
substr("hello", 0, 3)                # "hel"
```

### Collection Functions
```hcl
length(["a", "b", "c"])              # 3
merge({a=1}, {b=2})                  # {a=1, b=2}
flatten([[1,2],[3,4]])               # [1, 2, 3, 4]
distinct(["a","b","a"])              # ["a", "b"]
sort(["c","a","b"])                  # ["a", "b", "c"]
keys({a=1, b=2})                     # ["a", "b"]
values({a=1, b=2})                   # [1, 2]
contains(["dev","prod"], "dev")      # true
lookup({dev="small"}, "dev", "med")  # "small"
toset(["a","b","a"])                 # {"a", "b"}
```

### CIDR Functions (essential for VPC design)
```hcl
# cidrsubnet(prefix, newbits, netnum) — carve subnets from a VPC CIDR
cidrsubnet("10.0.0.0/16", 8, 1)     # "10.0.1.0/24"  (adds 8 bits → /24)
cidrsubnet("10.0.0.0/16", 8, 2)     # "10.0.2.0/24"
cidrsubnet("10.0.0.0/16", 8, 11)    # "10.0.11.0/24"

# cidrhost(prefix, hostnum) — get specific host IP in subnet
cidrhost("10.0.1.0/24", 5)          # "10.0.1.5"
cidrhost("10.0.1.0/24", -1)         # "10.0.1.254" (last host)
```

### Encoding Functions
```hcl
jsonencode({name="app", version=1})  # '{"name":"app","version":1}'
jsondecode('{"a":1}')               # {a = 1}
base64encode("hello")               # "aGVsbG8="
base64decode("aGVsbG8=")           # "hello"
```

### Conditional & Coalesce
```hcl
# Ternary
env == "prod" ? "STANDARD" : "STANDARD_IA"

# coalesce: first non-null, non-empty value
coalesce("", null, "fallback")      # "fallback"

# coalescelist: first non-empty list
coalescelist([], ["a", "b"])        # ["a", "b"]

# try: return fallback if expression throws error
try(var.config.key, "default")
```

## Terraform Console — Test Functions Interactively

```bash
terraform console

> upper("hello")
"HELLO"

> cidrsubnet("10.0.0.0/16", 8, 3)
"10.0.3.0/24"

> merge({a=1}, {b=2, a=99})
{a = 99, b = 2}

> [for i in range(3) : "subnet-${i}"]
["subnet-0", "subnet-1", "subnet-2"]

> jsonencode({env="prod", replicas=3})
"{\"env\":\"prod\",\"replicas\":3}"
```

## How to Run

```bash
terraform init
terraform apply -auto-approve

# All function results appear in outputs
terraform output string_functions
terraform output collection_functions
terraform output cidr_functions

terraform destroy -auto-approve
```

## Interview Questions

**Q: How do you generate subnet CIDRs dynamically for a VPC?**
> Use `cidrsubnet()`. Given a VPC CIDR like `10.0.0.0/16`, `cidrsubnet("10.0.0.0/16", 8, 1)` returns `10.0.1.0/24`. Combined with `count` or `for_each`, you can generate all subnets without hardcoding CIDRs.

**Q: What does `merge()` do with duplicate keys?**
> The last map wins. `merge({a=1}, {a=2})` returns `{a=2}`. Useful for merging default tags with resource-specific tags.
