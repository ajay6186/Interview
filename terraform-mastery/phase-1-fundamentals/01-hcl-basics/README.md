# 01 - HCL Basics

## What you learn
- HCL (HashiCorp Configuration Language) syntax
- Block types: `terraform`, `provider`, `resource`, `variable`, `output`, `locals`
- Data types: string, number, bool, list, map, object
- String interpolation: `"${var.name}"`
- Comments: `#` single line, `/* */` multi-line

## Key Concepts

| Block       | Purpose                                  |
|-------------|------------------------------------------|
| `terraform` | Version constraints, required providers  |
| `provider`  | Configure cloud (AWS region, auth, etc.) |
| `resource`  | Create actual infrastructure             |
| `variable`  | Input values (parameterize configs)      |
| `output`    | Print values after apply                 |
| `locals`    | Internal computed values (like constants)|
| `data`      | Read existing resources (not create)     |

## HCL Data Types
```hcl
# String
name = "hello"

# Number
port = 8080

# Bool
enabled = true

# List (ordered, same type)
azs = ["ap-south-1a", "ap-south-1b"]

# Map (key-value, same type values)
tags = { env = "dev", team = "infra" }

# Object (key-value, mixed types)
config = { port = 80, enabled = true, name = "web" }
```

## Practice Commands
```bash
terraform init      # initialize — downloads providers
terraform validate  # check syntax
terraform plan      # preview changes (no AWS calls yet)
terraform apply     # create resources
terraform destroy   # delete all resources
terraform fmt       # auto-format .tf files
```

## Exercise
Run `terraform init` and `terraform validate` in this folder.
No resources are created — just HCL practice.
