# 3.4 — Loops & Conditionals

**Goal:** Use `count`, `for_each`, `for` expressions, and conditional expressions to avoid repetition.

## Four Looping Mechanisms

### 1. `count` — Create N identical resources

```hcl
resource "aws_s3_bucket" "example" {
  count  = 3
  bucket = "bucket-${count.index}"   # count.index = 0, 1, 2
}

# Reference: aws_s3_bucket.example[0], [1], [2]
# All IDs:   aws_s3_bucket.example[*].id
```

**When to use:** Creating N near-identical resources where order matters.

**Weakness:** If you remove element 0 from a list of 3, Terraform destroys [0] and recreates [1]→[0] and [2]→[1] — wasteful.

---

### 2. `for_each` — Create resources from a map or set

```hcl
variable "buckets" {
  default = {
    logs    = { versioning = false }
    backups = { versioning = true }
  }
}

resource "aws_s3_bucket" "example" {
  for_each = var.buckets           # each.key = "logs", each.value = { versioning = false }
  bucket   = "bucket-${each.key}"
}

# Reference: aws_s3_bucket.example["logs"], ["backups"]
```

**When to use:** Creating resources from named config — stable identity, no index shifting.

**Advantage over count:** Removing "logs" only destroys that one bucket, not others.

---

### 3. `for` expression — Transform collections

```hcl
locals {
  # List → List (uppercase all names)
  upper_names = [for name in ["dev", "prod"] : upper(name)]
  # Result: ["DEV", "PROD"]

  # Map → Map (filter + transform)
  versioned = {
    for name, config in var.buckets : name => config
    if config.versioning == true
  }
  # Result: { backups = { versioning = true } }

  # Map → List
  bucket_names = [for k, v in var.buckets : k]
}
```

**When to use:** Transforming or filtering data in `locals` or `output` — not for creating resources.

---

### 4. Conditional Expression — Ternary

```hcl
# condition ? value_if_true : value_if_false
status = var.enable_versioning ? "Enabled" : "Suspended"

# Create 0 or 1 resources
count = var.create_bucket ? 1 : 0
```

---

## count vs for_each — When to Use Which

| Scenario | Use |
|----------|-----|
| Fixed number of identical resources | `count` |
| Resources from a named map/set | `for_each` |
| Resources where removing one shouldn't affect others | `for_each` |
| Simple enable/disable of one resource | `count = var.enabled ? 1 : 0` |

## How to Run

```bash
terraform init
terraform plan
terraform apply -auto-approve

# See indexed resources
terraform state list
# aws_s3_bucket.count_example[0]
# aws_s3_bucket.count_example[1]
# aws_s3_bucket.foreach_example["logs"]
# aws_s3_bucket.foreach_example["backups"]

terraform destroy -auto-approve
```

## Interview Questions

**Q: What is the difference between `count` and `for_each`?**
> `count` creates resources by index (0, 1, 2). `for_each` creates resources by key ("dev", "prod"). With `count`, removing an element mid-list causes index shifting and unnecessary destroy/recreates. `for_each` uses stable keys, so removing one element only destroys that one.

**Q: When would you use a `for` expression vs `for_each`?**
> `for` expressions transform data (lists, maps) inside `locals` or `outputs` — they produce values, not resources. `for_each` creates multiple resource instances. They are complementary: use `for` to prepare the data, `for_each` to iterate over it.
