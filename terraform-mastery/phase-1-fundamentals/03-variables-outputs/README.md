# 03 - Variables & Outputs

## What you learn
- Declaring input variables with types, defaults, validation
- Using `terraform.tfvars` to set values
- Output values and how to use them
- `sensitive = true` for secrets
- `merge()` function for combining maps

## Variable Types
```hcl
string    → "hello"
number    → 42
bool      → true / false
list(string)  → ["a", "b", "c"]
map(string)   → { key = "value" }
object({ name = string, port = number })
any       → accepts anything
```

## Ways to Pass Variable Values (priority order)
1. `-var` flag: `terraform apply -var="environment=prod"`
2. `-var-file` flag: `terraform apply -var-file="prod.tfvars"`
3. `terraform.tfvars` (auto-loaded)
4. `*.auto.tfvars` (auto-loaded)
5. `TF_VAR_name` environment variable
6. Default value in variable block
7. Interactive prompt (if no default)

## Variable Validation
```hcl
validation {
  condition     = length(var.name) > 3
  error_message = "Name must be longer than 3 characters."
}
```

## Commands
```bash
terraform init
terraform plan                           # uses terraform.tfvars automatically
terraform apply -var="environment=staging"   # override one variable
terraform output                         # show outputs after apply
terraform output bucket_name             # show specific output
terraform destroy
```
