# 4.2 — Dynamic Blocks

**Goal:** Generate repeated nested blocks (like `ingress`, `egress`, `tag`) dynamically from variables.

## Problem Dynamic Blocks Solve

Without dynamic blocks, you must hardcode every nested block:
```hcl
resource "aws_security_group" "web" {
  ingress { from_port = 80;  ... }
  ingress { from_port = 443; ... }
  ingress { from_port = 22;  ... }
  # adding a 4th port = edit the .tf file
}
```

With dynamic blocks, the blocks are generated from a variable:
```hcl
variable "ports" { default = [80, 443, 22] }

resource "aws_security_group" "web" {
  dynamic "ingress" {
    for_each = var.ports
    content {
      from_port = ingress.value
      to_port   = ingress.value
    }
  }
  # adding a 4th port = edit the variable, not the resource block
}
```

## Syntax

```hcl
dynamic "<block_label>" {
  for_each = <collection>      # list, set, or map to iterate over
  iterator = <name>            # optional: name for loop variable (default = block_label)
  content {
    # reference loop variable: <name>.value (list) or <name>.key/<name>.value (map)
  }
}
```

## Iterating a List of Objects

```hcl
variable "rules" {
  default = [
    { port = 80, cidr = "0.0.0.0/0" },
    { port = 22, cidr = "10.0.0.0/8" },
  ]
}

dynamic "ingress" {
  for_each = var.rules
  iterator = rule
  content {
    from_port   = rule.value.port
    to_port     = rule.value.port
    cidr_blocks = [rule.value.cidr]
  }
}
```

## Iterating a Map

```hcl
for_each = { http = 80, https = 443 }
iterator = port_entry
content {
  description = port_entry.key    # "http" or "https"
  from_port   = port_entry.value  # 80 or 443
}
```

## Optional Block (conditional dynamic)

```hcl
dynamic "lifecycle_rule" {
  for_each = var.enable_lifecycle ? [1] : []  # [1] = include block, [] = skip
  content {
    enabled = true
    ...
  }
}
```

## How to Run

```bash
terraform init
terraform plan
terraform apply -auto-approve

# Change port list without editing the resource block
terraform apply -var='ingress_rules=[{"port":80,"protocol":"tcp","cidr_blocks":["0.0.0.0/0"],"description":"HTTP"}]'

terraform destroy -auto-approve
```

## Interview Questions

**Q: What is a dynamic block in Terraform?**
> A dynamic block generates repeated nested configuration blocks from a collection (list or map). Instead of hardcoding multiple identical nested blocks, you define the pattern once and iterate over a variable.

**Q: What blocks can be dynamic?**
> Any nested block within a resource or data source — `ingress`, `egress`, `tag`, `lifecycle_rule`, `statement`, etc. Top-level blocks like `resource` and `variable` cannot be dynamic.
