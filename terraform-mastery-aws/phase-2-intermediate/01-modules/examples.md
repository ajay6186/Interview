# Examples 2.1 — Modules (50 examples)

> **Topic Overview:** Terraform modules are the primary mechanism for code reuse, encapsulation, and team collaboration. A module is any directory containing `.tf` files — the "root module" is your working directory, and any module called via `module` blocks is a "child module." Modules allow you to abstract away complexity, enforce organizational standards, and consume community-maintained infrastructure patterns. Understanding module sources, versioning, provider passing, `for_each`/`count` on modules, and output chaining is critical for building scalable Terraform architectures.

---

## Basic

### 1. Call a local module

> The simplest module call — a relative path to a directory containing `.tf` files. Variables are passed as arguments. The module encapsulates all its resources; the caller only sees what the module explicitly outputs. Local modules are useful for organization within a monorepo, but for sharing across teams use registry or git sources.

```hcl
module "vpc" {
  source = "./modules/vpc"

  cidr_block  = "10.0.0.0/16"
  environment = "production"
}
```

### 2. Module with required and optional variables

> Every module should define its interface in `variables.tf`. Required variables (no `default`) must be supplied by the caller. Optional variables have `default` values. The `description` field is documentation — it appears in `terraform-docs` output and the Terraform Registry. Always describe what a variable is used for, not what type it is.

```hcl
# modules/ec2/variables.tf
variable "instance_type" {
  type        = string
  description = "EC2 instance type"
}

variable "ami_id" {
  type        = string
  description = "AMI ID"
}

variable "tags" {
  type        = map(string)
  default     = {}
  description = "Resource tags"
}
```

### 3. Module outputs

> Outputs in `outputs.tf` form the module's public API — only explicitly declared outputs are visible to the caller. This is what makes modules proper abstractions: internal implementation details (resource names, intermediate locals) are hidden. Add `description` to all outputs — they appear in `terraform output` and the Registry.

```hcl
# modules/vpc/outputs.tf
output "vpc_id" {
  value       = aws_vpc.main.id
  description = "The ID of the VPC"
}

output "public_subnet_ids" {
  value       = aws_subnet.public[*].id
  description = "List of public subnet IDs"
}
```

### 4. Use module output in a resource

> Module outputs are referenced as `module.<name>.<output_name>`. This creates an implicit dependency — `aws_instance.web` won't be created until `module.vpc` has applied successfully and produced the `public_subnet_ids` output. Terraform understands this dependency graph automatically.

```hcl
module "vpc" {
  source = "./modules/vpc"
  cidr_block = "10.0.0.0/16"
}

resource "aws_instance" "web" {
  ami           = data.aws_ami.amazon_linux.id
  instance_type = "t3.micro"
  subnet_id     = module.vpc.public_subnet_ids[0]
}
```

### 5. Call a registry module

> The Terraform Registry (`registry.terraform.io`) hosts community and partner modules. The `source` format is `<namespace>/<module>/<provider>`. Always specify `version` — without it Terraform downloads the latest, which can break on upgrades. The `~>` constraint allows patch/minor updates but not major version bumps.

```hcl
module "s3_bucket" {
  source  = "terraform-aws-modules/s3-bucket/aws"
  version = "~> 3.0"

  bucket = "my-app-bucket"
  acl    = "private"

  versioning = {
    enabled = true
  }
}
```

### 6. Module source — local path

> Local paths (starting with `./` or `../`) refer to directories relative to the calling module. These are useful in monorepos where modules live alongside the root configuration. Terraform copies the module to `.terraform/modules/` on `init`. No `version` constraint is needed (or supported) for local modules.

```hcl
module "security_groups" {
  source = "./modules/security-groups"
}
```

### 7. Module source — Git repository

> Git sources allow pinning modules to a specific commit reference (`?ref=`). Use a version tag (`v1.2.0`) rather than a branch name for reproducibility — branches move. The double-slash `//` separates the repository URL from the subdirectory path within the repo. Requires `git` to be installed when running `terraform init`.

```hcl
module "vpc" {
  source = "git::https://github.com/myorg/terraform-modules.git//vpc?ref=v1.2.0"
}
```

### 8. Module source — registry with version

> Community EKS module from the Terraform Registry with exact version management. The `cluster_version` parameter controls the Kubernetes API version. Using `module.vpc.vpc_id` and `module.vpc.private_subnets` shows output chaining — the VPC module provides values that the EKS module needs, creating an implicit dependency.

```hcl
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.0"

  cluster_name    = "my-cluster"
  cluster_version = "1.29"
  vpc_id          = module.vpc.vpc_id
  subnet_ids      = module.vpc.private_subnets
}
```

### 9. terraform get — download modules

> `terraform get` downloads modules declared in the configuration to `.terraform/modules/`. `terraform init` calls `get` automatically. The `-update` flag checks for newer versions allowed by constraints. Run this after adding a new `module` block before running `plan`.

```bash
terraform get          # download/update modules declared in config
terraform get -update  # force update even if already downloaded
```

### 10. Module with minimal interface

> A module with just two resources and no explicit variables defined here — in real code `var.bucket_name` would be declared in `variables.tf`. The website configuration resource is tightly coupled to the bucket — bundling related resources in a module ensures they're always deployed together and prevents partial configurations.

```hcl
# modules/s3-website/main.tf
resource "aws_s3_bucket" "site" {
  bucket = var.bucket_name
}

resource "aws_s3_bucket_website_configuration" "site" {
  bucket = aws_s3_bucket.site.id
  index_document { suffix = "index.html" }
  error_document { key = "error.html" }
}
```

### 11. Viewing module outputs after apply

> `terraform output` shows root module outputs. `-json` returns machine-parseable output for scripting. `-raw` prints a scalar value without quotes — useful in shell scripts that capture the output: `SUBNET_ID=$(terraform output -raw public_subnet_id)`. Nested module outputs are only visible if re-exported from the root.

```bash
terraform output                          # all outputs from root
terraform output -json                    # JSON format
terraform output -raw vpc_id             # raw string value
```

### 12. Module versioning from public registry

> Pinning to an exact version (`5.5.0`) makes the configuration completely reproducible — every `terraform init` downloads exactly that version. This is safer than `~>` for production infrastructure where unexpected behavior from upstream changes is unacceptable. Review changelogs before upgrading versions.

```hcl
terraform {
  required_providers {
    aws = { source = "hashicorp/aws"; version = "~> 5.0" }
  }
}

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.5.0"  # pin exact version for reproducibility

  name = "my-vpc"
  cidr = "10.0.0.0/16"
  azs  = ["us-east-1a", "us-east-1b", "us-east-1c"]
}
```

---

## Intermediate

### 13. Module with optional variables using defaults

> Boolean feature flags and numeric limits make modules flexible without exposing every AWS resource argument. The `validation` block on `nat_gateway_count` enforces business rules at the module interface, not buried in resource logic. Callers get a clear error message rather than a cryptic AWS API error.

```hcl
variable "enable_nat_gateway" {
  type    = bool
  default = false
}

variable "nat_gateway_count" {
  type    = number
  default = 1
  validation {
    condition     = var.nat_gateway_count >= 1 && var.nat_gateway_count <= 3
    error_message = "NAT gateway count must be between 1 and 3."
  }
}
```

### 14. Pass provider alias to module

> Modules inherit the default provider configuration automatically. To pass a non-default provider (alias), use the `providers` map argument. The map keys must match the provider references inside the module. This pattern is used for multi-region modules — the root defines regional provider aliases and passes them explicitly.

```hcl
provider "aws" {
  region = "us-east-1"
}
provider "aws" {
  alias  = "replica"
  region = "us-west-2"
}

module "replica_bucket" {
  source = "./modules/s3-replica"
  providers = {
    aws         = aws
    aws.replica = aws.replica
  }
}
```

### 15. Module declaring required provider aliases

> When a module needs a provider alias (not just the default), it must declare this in its own `terraform` block using `configuration_aliases`. Without this declaration, Terraform won't know the module needs the alias and won't pass it through. The module can then use `provider = aws.replica` on specific resources.

```hcl
# modules/s3-replica/main.tf
terraform {
  required_providers {
    aws = {
      source                = "hashicorp/aws"
      version               = "~> 5.0"
      configuration_aliases = [aws.replica]
    }
  }
}

resource "aws_s3_bucket" "primary" {
  bucket = var.primary_bucket_name
}

resource "aws_s3_bucket" "replica" {
  provider = aws.replica
  bucket   = var.replica_bucket_name
}
```

### 16. Module output used in another module

> This shows multi-module dependency chaining. The `compute` module depends on `network` (needs vpc_id and subnets), and the `database` module depends on both (needs subnets from network and sg from compute). Terraform builds the correct apply order automatically from these output references — no `depends_on` needed here.

```hcl
module "network" {
  source     = "./modules/network"
  cidr_block = "10.0.0.0/16"
}

module "compute" {
  source             = "./modules/compute"
  vpc_id             = module.network.vpc_id         # chained output
  private_subnet_ids = module.network.private_subnet_ids
}

module "database" {
  source     = "./modules/database"
  subnet_ids = module.network.private_subnet_ids
  sg_ids     = [module.compute.db_security_group_id] # chained output
}
```

### 17. Module with complex object variable

> Using `object()` type for a module variable groups related configuration and makes the interface self-documenting. `optional(bool, true)` (Terraform 1.3+) means the caller doesn't have to supply `enable_dns_hostnames` — it defaults to `true`. This is much cleaner than having four separate top-level variables for VPC configuration.

```hcl
variable "vpc_config" {
  type = object({
    cidr_block           = string
    enable_dns_hostnames = optional(bool, true)
    enable_dns_support   = optional(bool, true)
    tags                 = optional(map(string), {})
  })
}
```

### 18. Module count — create multiple instances

> `count` on a module creates N identical (but parameterized) instances. Access individual instances via `module.web_server[0]`, `[1]`, etc., or all at once with `module.web_server[*].instance_id`. Use `count.index` to differentiate instances. Downside: if you remove an element from the middle, all subsequent indices shift, causing unnecessary destroy/recreate.

```hcl
module "web_server" {
  count  = 3
  source = "./modules/ec2"

  instance_type = "t3.micro"
  name          = "web-${count.index + 1}"
  subnet_id     = var.subnet_ids[count.index]
}

output "web_server_ids" {
  value = module.web_server[*].instance_id
}
```

### 19. Module for_each — one module per environment

> `for_each` on a module is the preferred alternative to `count` — each instance has a stable string key, so adding/removing environments doesn't affect other instances. The `var.environments` map drives everything: add a new environment by adding an entry, no index shifting. Access outputs as `module.app["prod"].some_output`.

```hcl
variable "environments" {
  type = map(object({
    instance_type = string
    min_size      = number
    max_size      = number
  }))
  default = {
    dev  = { instance_type = "t3.micro",  min_size = 1, max_size = 2 }
    prod = { instance_type = "t3.medium", min_size = 2, max_size = 10 }
  }
}

module "app" {
  for_each      = var.environments
  source        = "./modules/app"
  environment   = each.key
  instance_type = each.value.instance_type
  min_size      = each.value.min_size
  max_size      = each.value.max_size
}
```

### 20. Module depends_on

> `depends_on` on a module creates an explicit dependency when there's no implicit one through output references. This is necessary when a module uses data sources that query AWS resources created by another module — Terraform doesn't know about the dependency because data sources are evaluated during plan, before the creating module has run.

```hcl
module "app" {
  source     = "./modules/app"
  depends_on = [module.network, module.iam]  # ensure these complete first
}
```

### 21. Module with lifecycle prevent_destroy

> Applying `lifecycle` to a module block prevents Terraform from destroying the entire module's resources. This is a safety net for critical modules like databases or KMS keys. Note: it doesn't prevent individual resources within the module from having their own lifecycle settings.

```hcl
module "database" {
  source = "./modules/rds"

  lifecycle {
    prevent_destroy = true
  }
}
```

### 22. Conditional module invocation

> `count = var.enable_cdn ? 1 : 0` is the standard pattern for conditional module invocation. When the count is 0, no resources in the module are created. The output reference uses `[0]` with a ternary guard to avoid an out-of-bounds error when CDN is disabled. This is cleaner than wrapping every resource in `count`.

```hcl
module "cdn" {
  count  = var.enable_cdn ? 1 : 0
  source = "./modules/cloudfront"

  origin_domain = aws_lb.app.dns_name
}

output "cdn_domain" {
  value = var.enable_cdn ? module.cdn[0].domain_name : null
}
```

### 23. Module from private registry

> Private Terraform Registry (Terraform Cloud/Enterprise) uses the format `app.terraform.io/<org>/<module>/<provider>`. These modules are accessible only to authenticated users in your organization. Useful for internal modules that shouldn't be public — enforces organizational standards across all teams.

```hcl
module "vpc" {
  source  = "app.terraform.io/my-org/vpc/aws"
  version = "~> 2.0"

  cidr_block = "10.0.0.0/16"
}
```

### 24. terraform-aws-modules/vpc complete example

> The community `terraform-aws-modules/vpc` module is the most widely used Terraform module in production. Key parameters: `azs` (list of AZs to span), `private_subnets`/`public_subnets` (CIDR blocks per AZ), `single_nat_gateway` (one NAT GW for non-prod to save cost). This single module call replaces ~200 lines of resource definitions.

```hcl
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.5"

  name = "${var.environment}-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["us-east-1a", "us-east-1b", "us-east-1c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

  enable_nat_gateway   = true
  single_nat_gateway   = var.environment != "prod"
  enable_dns_hostnames = true

  tags = {
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}
```

### 25. Module with sensitive output

> Sensitive outputs from a child module must be re-declared sensitive in the root module output. If the root doesn't mark it sensitive, the value will be displayed in terminal output. The `sensitive = true` propagation chain: child module output → root module output → `terraform output` (hidden by default, visible with `terraform output -raw`).

```hcl
# modules/rds/outputs.tf
output "db_password" {
  value       = random_password.db.result
  sensitive   = true
  description = "Database master password"
}

# Root module
output "db_password" {
  value     = module.database.db_password
  sensitive = true
}
```

---

## Nested

### 26. Three-level module hierarchy

> Modules can call other modules — creating hierarchies. Here the root calls `platform`, which internally calls `network` and `compute`. Relative paths in nested modules are relative to the module's own directory, not the root. Deep hierarchies (>3 levels) become hard to debug — keep module graphs shallow and explicit.

```hcl
# Root calls "platform" module
module "platform" {
  source      = "./modules/platform"
  environment = "production"
}

# modules/platform/main.tf calls "network" and "compute"
module "network" {
  source     = "../network"
  cidr_block = var.cidr_block
}

module "compute" {
  source    = "../compute"
  vpc_id    = module.network.vpc_id
  subnet_ids = module.network.private_subnet_ids
}
```

### 27. Module composition for full stack

> Module composition wires together four independent modules (vpc, ec2, rds, alb) through output references. Each module has a focused responsibility, and the composition happens at the root level where all outputs are visible. This pattern scales well: teams can work on individual modules independently and integration happens in the root.

```hcl
module "vpc" {
  source = "./modules/vpc"
  cidr_block = "10.0.0.0/16"
}

module "ec2" {
  source            = "./modules/ec2"
  vpc_id            = module.vpc.vpc_id
  public_subnet_ids = module.vpc.public_subnet_ids
}

module "rds" {
  source             = "./modules/rds"
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  app_security_group = module.ec2.security_group_id
}

module "alb" {
  source             = "./modules/alb"
  vpc_id             = module.vpc.vpc_id
  public_subnet_ids  = module.vpc.public_subnet_ids
  target_instance_ids = module.ec2.instance_ids
}
```

### 28. Nested module with for_each for multi-region

> `for_each = toset(var.regions)` creates one module instance per region. `toset()` converts the list to a set, which is required for `for_each` (sets have unique string keys). This is how you deploy identical infrastructure to multiple regions from a single root configuration. Access outputs as `module.regional_deploy["us-east-1"].some_output`.

```hcl
variable "regions" {
  type    = list(string)
  default = ["us-east-1", "us-west-2", "eu-west-1"]
}

module "regional_deploy" {
  for_each = toset(var.regions)
  source   = "./modules/regional-stack"

  region      = each.value
  environment = var.environment
}
```

### 29. Passing module outputs as a list

> `concat()` merges two lists of subnet IDs from different VPC module instances into a single list. This enables an ASG to span across subnets from multiple VPCs (or regions if configured). The resulting `subnet_ids` list is built at plan time from the computed outputs of both VPC modules.

```hcl
module "web_asg" {
  source = "./modules/asg"

  # Collect outputs from multiple module instances
  subnet_ids = concat(
    module.vpc_east.private_subnet_ids,
    module.vpc_west.private_subnet_ids
  )
}
```

### 30. Module wrapping a registry module

> Wrapper modules are a powerful pattern for enforcing organizational standards. Your internal `app-vpc` module wraps the community `terraform-aws-modules/vpc` module but auto-calculates subnets using `cidrsubnet`, auto-discovers AZs from data sources, and exposes a simplified interface. Teams call your wrapper — the community module is an implementation detail.

```hcl
# modules/app-vpc/main.tf — wraps terraform-aws-modules/vpc
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.5"

  name = "${var.app_name}-${var.environment}"
  cidr = var.cidr_block
  azs  = data.aws_availability_zones.available.names

  private_subnets = [for i, az in data.aws_availability_zones.available.names : cidrsubnet(var.cidr_block, 8, i)]
  public_subnets  = [for i, az in data.aws_availability_zones.available.names : cidrsubnet(var.cidr_block, 8, i + 100)]

  enable_nat_gateway = var.enable_nat_gateway
  tags               = var.tags
}

output "vpc_id"            { value = module.vpc.vpc_id }
output "private_subnets"   { value = module.vpc.private_subnets }
output "public_subnets"    { value = module.vpc.public_subnets }
```

### 31. Module with moved block for refactoring

> When you rename a module call (e.g., `module.legacy_app` → `module.app`) without a `moved` block, Terraform destroys all old resources and creates new ones. The `moved` block tells Terraform to update state addresses instead, preventing that destroy/recreate cycle. Keep moved blocks until all team members have run at least one `apply`.

```hcl
# When renaming a module call without destroying resources
moved {
  from = module.legacy_app
  to   = module.app
}

moved {
  from = module.app.aws_instance.server
  to   = module.app.aws_instance.web
}
```

### 32. Cross-module data sharing via locals

> Using a `local` to aggregate outputs from multiple modules into a single `common_config` object simplifies downstream module interfaces. Instead of passing `vpc_id`, `private_subnet_ids`, and `sg_ids` as three separate arguments, you pass the whole object. The `app` module receives a structured network configuration it can destructure internally.

```hcl
module "network" {
  source = "./modules/network"
}

module "security" {
  source = "./modules/security"
  vpc_id = module.network.vpc_id
}

locals {
  # Aggregate outputs for downstream modules
  common_config = {
    vpc_id             = module.network.vpc_id
    private_subnet_ids = module.network.private_subnet_ids
    sg_ids             = module.security.sg_ids
  }
}

module "app" {
  source  = "./modules/app"
  network = local.common_config
}
```

### 33. Workspace-aware module configuration

> `terraform.workspace` returns the current workspace name. Using a lookup map in `locals` lets you select environment-specific configuration based on the active workspace. This is a common pattern for workspace-based multi-environment deployments — single code base, workspace-driven parameters.

```hcl
locals {
  env_config = {
    dev  = { instance_type = "t3.micro", min_size = 1 }
    prod = { instance_type = "t3.large", min_size = 3 }
  }
  config = local.env_config[terraform.workspace]
}

module "app" {
  source        = "./modules/app"
  instance_type = local.config.instance_type
  min_size      = local.config.min_size
}
```

### 34. Module outputs aggregated with for expression

> When a module is instantiated with `for_each`, its output is a map keyed by the same keys as `for_each`. The `for` expression `{ for k, v in module.subnets : k => v.subnet_id }` transforms this into a clean `{ "public" = "subnet-123", "private" = "subnet-456" }` map — perfect for passing to other resources that need a map of subnet IDs.

```hcl
module "subnets" {
  for_each = var.subnet_config
  source   = "./modules/subnet"
  name     = each.key
  cidr     = each.value.cidr
}

output "subnet_ids" {
  value = { for k, v in module.subnets : k => v.subnet_id }
}
```

---

## Advanced

### 35. Reusable VPC module implementation

> This shows the internals of a proper VPC module. Key patterns: `slice()` limits AZ count to `var.az_count`, `cidrsubnet()` auto-calculates subnet CIDRs from the VPC CIDR, the NAT gateway count logic (`single_nat_gateway ? 1 : length(local.azs)`) controls cost vs HA, and `merge(var.tags, {...})` ensures local tags don't override caller tags.

```hcl
# modules/vpc/main.tf
locals {
  azs = slice(data.aws_availability_zones.available.names, 0, var.az_count)
}

resource "aws_vpc" "main" {
  cidr_block           = var.cidr_block
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags = merge(var.tags, { Name = var.name })
}

resource "aws_subnet" "public" {
  count             = length(local.azs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.cidr_block, 8, count.index)
  availability_zone = local.azs[count.index]
  map_public_ip_on_launch = true
  tags = merge(var.tags, { Name = "${var.name}-public-${count.index + 1}", Tier = "public" })
}

resource "aws_subnet" "private" {
  count             = length(local.azs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.cidr_block, 8, count.index + 10)
  availability_zone = local.azs[count.index]
  tags = merge(var.tags, { Name = "${var.name}-private-${count.index + 1}", Tier = "private" })
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  tags   = merge(var.tags, { Name = "${var.name}-igw" })
}

resource "aws_eip" "nat" {
  count  = var.enable_nat_gateway ? (var.single_nat_gateway ? 1 : length(local.azs)) : 0
  domain = "vpc"
}

resource "aws_nat_gateway" "main" {
  count         = var.enable_nat_gateway ? (var.single_nat_gateway ? 1 : length(local.azs)) : 0
  subnet_id     = aws_subnet.public[count.index].id
  allocation_id = aws_eip.nat[count.index].id
}
```

### 36. Module with precondition and postcondition

> Variable `validation` runs before plan. Resource `precondition` runs during plan (can reference other resources). Resource `postcondition` runs after apply to verify the created resource meets expectations. This creates a fail-fast contract: the module validates inputs, checks preconditions at plan, and asserts postconditions after creation.

```hcl
variable "instance_type" {
  type = string
  validation {
    condition     = contains(["t3.micro", "t3.small", "t3.medium", "t3.large"], var.instance_type)
    error_message = "Instance type must be a t3 family type."
  }
}

resource "aws_instance" "web" {
  ami           = data.aws_ami.app.id
  instance_type = var.instance_type

  lifecycle {
    postcondition {
      condition     = self.public_ip != ""
      error_message = "Instance did not receive a public IP."
    }
  }
}
```

### 37. Module with complex output contracts

> Returning a single structured object output (instead of multiple flat outputs) creates a stable contract. Callers reference `module.alb.alb.dns_name`, `module.alb.alb.listener.https_arn`, etc. When the module adds new fields to the object, callers are unaffected. This output style is preferred for modules with many related outputs.

```hcl
# modules/alb/outputs.tf
output "alb" {
  value = {
    id          = aws_lb.main.id
    arn         = aws_lb.main.arn
    dns_name    = aws_lb.main.dns_name
    zone_id     = aws_lb.main.zone_id
    listener = {
      http_arn  = aws_lb_listener.http.arn
      https_arn = aws_lb_listener.https.arn
    }
    target_group_arn = aws_lb_target_group.app.arn
  }
  description = "Complete ALB configuration"
}
```

### 38. Publishing a module to Terraform Registry

> Publishing to the public Registry requires: GitHub repo named `terraform-<provider>-<name>`, semantic version tags (`v1.0.0`), and the standard file structure. The Registry auto-generates documentation from variable/output descriptions. `examples/` subdirectories become runnable examples in the Registry UI.

```bash
# Requirements:
# 1. GitHub repo named: terraform-<PROVIDER>-<MODULE_NAME>
# 2. Tag releases as: v<SEMVER> (e.g., v1.0.0)
# 3. Standard module structure:
#    main.tf, variables.tf, outputs.tf
#    modules/ (submodules)
#    examples/

# Module structure
terraform-aws-vpc/
├── main.tf
├── variables.tf
├── outputs.tf
├── versions.tf
├── README.md
├── modules/
│   ├── subnets/
│   └── nat/
└── examples/
    ├── simple/
    └── complete/
```

### 39. Module testing with terraform test (Terraform 1.6+)

> `terraform test` (Terraform 1.6+) runs tests defined in `.tftest.hcl` files. `command = plan` validates without creating resources; `command = apply` creates real resources (and destroys them after). Tests can assert on plan output, resource counts, and attribute values. This is the native alternative to Terratest for module validation.

```hcl
# tests/vpc.tftest.hcl
run "create_vpc" {
  command = plan

  assert {
    condition     = module.vpc.vpc_id != ""
    error_message = "VPC ID should not be empty"
  }

  assert {
    condition     = length(module.vpc.public_subnet_ids) == 3
    error_message = "Should have 3 public subnets"
  }
}

run "full_deploy" {
  command = apply

  assert {
    condition     = module.vpc.vpc_cidr_block == "10.0.0.0/16"
    error_message = "VPC CIDR should be 10.0.0.0/16"
  }
}
```

### 40. Module with dynamic resource creation

> Passing a `list(object(...))` of security group rules to a module allows callers to define arbitrary port/protocol combinations without modifying the module. The `dynamic "ingress"` block inside the module iterates the list and generates the correct number of ingress rules. This pattern eliminates the need for a separate security group module per service.

```hcl
# modules/security-groups/main.tf
variable "rules" {
  type = list(object({
    port        = number
    protocol    = string
    cidr_blocks = list(string)
    description = string
  }))
}

resource "aws_security_group" "main" {
  name   = var.name
  vpc_id = var.vpc_id

  dynamic "ingress" {
    for_each = var.rules
    content {
      from_port   = ingress.value.port
      to_port     = ingress.value.port
      protocol    = ingress.value.protocol
      cidr_blocks = ingress.value.cidr_blocks
      description = ingress.value.description
    }
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
```

### 41. Module version constraints with ~> operator

> `~>` is the "pessimistic constraint" — it allows the rightmost version component to increment. `~> 20.0` means `>= 20.0, < 21.0` (allows 20.x patches). `~> 20` would mean `>= 20, < 21` (same). Use `~>` for non-production and `=` for production to balance flexibility with reproducibility.

```hcl
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.0"  # >= 20.0, < 21.0
}

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = ">= 5.0, < 6.0"  # range constraint
}
```

### 42. Module with optional submodules

> Passing boolean/conditional flags to a module allows it to conditionally create sub-resources. In this pattern, the app module internally uses `count = var.enable_monitoring ? 1 : 0` for its CloudWatch dashboards, `count = var.enable_cdn ? 1 : 0` for CloudFront, etc. The caller doesn't need to know the implementation — just set the flag.

```hcl
module "app" {
  source = "./modules/app"

  # Core config
  name          = "my-app"
  instance_type = "t3.medium"

  # Optional features
  enable_monitoring = true
  enable_cdn        = var.environment == "prod"
  enable_waf        = var.environment == "prod"
}
```

### 43. Aggregating multi-module security group IDs

> Creating named security group modules and aggregating their IDs into a `local` map creates a clean interface for downstream resources. Rather than passing individual SG IDs around, consumers reference `local.all_sg_ids.web`, `local.all_sg_ids.app`, etc. This makes the security group inventory visible and auditable in one place.

```hcl
module "web_sg"  { source = "./modules/sg"; name = "web"; rules = var.web_rules }
module "app_sg"  { source = "./modules/sg"; name = "app"; rules = var.app_rules }
module "db_sg"   { source = "./modules/sg"; name = "db";  rules = var.db_rules }

locals {
  all_sg_ids = {
    web = module.web_sg.id
    app = module.app_sg.id
    db  = module.db_sg.id
  }
}
```

### 44. Module that creates IAM roles and policies

> IAM modules are extremely common — every application needs an IAM role with specific permissions. Using `dynamic "statement"` driven by `var.policy_statements` makes the module generic: callers define what actions/resources the role needs, and the module handles the boilerplate (role creation, assume role policy, inline policy attachment).

```hcl
# modules/app-iam/main.tf
resource "aws_iam_role" "app" {
  name               = "${var.app_name}-${var.environment}-role"
  assume_role_policy = data.aws_iam_policy_document.assume_role.json
}

data "aws_iam_policy_document" "app" {
  dynamic "statement" {
    for_each = var.policy_statements
    content {
      effect    = statement.value.effect
      actions   = statement.value.actions
      resources = statement.value.resources
    }
  }
}

resource "aws_iam_role_policy" "app" {
  name   = "${var.app_name}-policy"
  role   = aws_iam_role.app.id
  policy = data.aws_iam_policy_document.app.json
}
```

### 45. Module source integrity with git tag and SHA

> Pinning to a git commit SHA (`?ref=abc1234...`) is the most reproducible source reference — tags can be moved but commit SHAs are immutable. Use SHA pinning for security-sensitive modules in production. For internal modules, a version tag is usually sufficient. Never use a branch name (`?ref=main`) in production — branches change.

```hcl
module "vpc" {
  # Pin to exact git commit hash for reproducibility
  source = "git::https://github.com/myorg/terraform-modules.git//vpc?ref=abc1234def567890"
}

# Or pin to tag
module "eks" {
  source = "git::https://github.com/myorg/terraform-modules.git//eks?ref=v2.3.1"
}
```

### 46. Module wrapping for internal standards enforcement

> This is the most important enterprise module pattern: an internal wrapper that enforces non-negotiable security standards (IMDSv2, encryption, monitoring, gp3 volumes). Engineers use the internal module instead of `aws_instance` directly — they get all the guardrails automatically. The module accepts only the parameters teams actually need to vary.

```hcl
# internal/modules/ec2/main.tf — always enforces tagging, encryption, etc.
resource "aws_instance" "this" {
  ami                         = var.ami_id
  instance_type               = var.instance_type
  subnet_id                   = var.subnet_id
  vpc_security_group_ids      = var.security_group_ids
  iam_instance_profile        = var.instance_profile
  monitoring                  = true                    # always enabled
  ebs_optimized               = true                    # always enabled
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"            # IMDSv2 always required
    http_put_response_hop_limit = 1
  }
  root_block_device {
    encrypted   = true                                  # always encrypted
    volume_type = "gp3"
    volume_size = var.root_volume_size
  }
  tags = merge(var.tags, {
    ManagedBy   = "terraform"
    Module      = "internal/ec2"
  })
}
```

### 47. Module with for_each and complex outputs

> Using `for_each` with a services map and collecting outputs with a `for` expression is the standard microservices deployment pattern. Each service gets its own ECS service, task role, and other resources — all managed from a single module call. The `service_arns` and `task_role_arns` outputs give operations teams a complete inventory.

```hcl
module "microservices" {
  for_each = var.services

  source        = "./modules/ecs-service"
  name          = each.key
  image         = each.value.image
  cpu           = each.value.cpu
  memory        = each.value.memory
  port          = each.value.port
  desired_count = each.value.desired_count

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnet_ids
  cluster_id = aws_ecs_cluster.main.id
}

output "service_arns" {
  value = { for k, v in module.microservices : k => v.service_arn }
}

output "task_role_arns" {
  value = { for k, v in module.microservices : k => v.task_role_arn }
}
```

### 48. Module generating multiple related resources

> Some infrastructure components always come in pairs or groups (primary + replica S3 buckets with replication, VPC + peering connection, etc.). Bundling them in a module with `configuration_aliases` for the replica provider ensures both sides of the relationship are always provisioned correctly — callers can't forget the replication configuration.

```hcl
# modules/s3-with-replication/main.tf
resource "aws_s3_bucket" "primary" {
  bucket = var.bucket_name
  provider = aws
}

resource "aws_s3_bucket" "replica" {
  bucket   = "${var.bucket_name}-replica"
  provider = aws.replica
}

resource "aws_s3_bucket_replication_configuration" "replication" {
  bucket = aws_s3_bucket.primary.id
  role   = aws_iam_role.replication.arn

  rule {
    id     = "full-replication"
    status = "Enabled"
    destination {
      bucket        = aws_s3_bucket.replica.arn
      storage_class = "STANDARD_IA"
    }
  }
}
```

### 49. Module documentation with README

> Well-documented modules include a usage example, requirements table (Terraform and provider versions), and inputs/outputs tables. Tools like `terraform-docs` can auto-generate these tables from variable/output descriptions. The README is the first thing engineers see — it should answer "how do I use this?" in 30 seconds.

```markdown
## Usage
module "vpc" {
  source      = "terraform-aws-modules/vpc/aws"
  version     = "~> 5.5"
  name        = "my-vpc"
  cidr        = "10.0.0.0/16"
  azs         = ["us-east-1a", "us-east-1b"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24"]
}

## Requirements
| Name | Version |
|------|---------|
| terraform | >= 1.5 |
| aws | ~> 5.0 |

## Inputs
| Name | Description | Type | Required |
|------|-------------|------|----------|
| name | VPC name | string | yes |
```

### 50. Complete multi-tier infrastructure with modules

> The gold standard pattern: compose four community modules (vpc, alb, ecs, rds) into a complete production stack. Each module is versioned, wired together through output references, and configured with environment-specific parameters. This is how modern AWS infrastructure should be built — not hundreds of raw resource blocks, but composed, versioned, tested modules.

```hcl
# main.tf
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.5"
  name    = "${var.app_name}-${var.environment}"
  cidr    = var.vpc_cidr
  azs     = slice(data.aws_availability_zones.available.names, 0, 3)
  private_subnets  = [for i in range(3) : cidrsubnet(var.vpc_cidr, 8, i)]
  public_subnets   = [for i in range(3) : cidrsubnet(var.vpc_cidr, 8, i + 100)]
  database_subnets = [for i in range(3) : cidrsubnet(var.vpc_cidr, 8, i + 200)]
  enable_nat_gateway     = true
  single_nat_gateway     = var.environment != "prod"
  create_database_subnet_group = true
  tags = local.common_tags
}

module "alb" {
  source             = "terraform-aws-modules/alb/aws"
  version            = "~> 9.0"
  name               = "${var.app_name}-alb"
  load_balancer_type = "application"
  vpc_id             = module.vpc.vpc_id
  subnets            = module.vpc.public_subnets
}

module "ecs" {
  source       = "terraform-aws-modules/ecs/aws"
  version      = "~> 5.0"
  cluster_name = "${var.app_name}-${var.environment}"
}

module "rds" {
  source  = "terraform-aws-modules/rds/aws"
  version = "~> 6.0"
  identifier     = "${var.app_name}-${var.environment}"
  engine         = "postgres"
  engine_version = "15"
  instance_class = var.db_instance_class
  db_name        = var.db_name
  username       = "dbadmin"
  db_subnet_group_name   = module.vpc.database_subnet_group_name
  vpc_security_group_ids = [module.security.db_sg_id]
}
```

---

## Key Takeaways

- **Modules are the unit of reuse** — everything beyond a trivial single-resource config should be a module; they enforce encapsulation and enable team collaboration
- **Source types**: local path (`./`), Git (`git::https://...?ref=`), registry (`namespace/module/provider`), private registry (`app.terraform.io/org/module/provider`)
- **Always version-pin registry and git sources** — `~>` for flexibility, `=` for maximum reproducibility in production
- **`for_each` on modules** is preferred over `count` — stable string keys prevent unintended destroy/recreate when the set changes
- **Provider aliases must be explicitly passed** with the `providers` map; child modules must declare `configuration_aliases` to receive them
- **`moved` blocks** are the safe way to rename/restructure modules — without them, renames cause destroy/recreate
- **Wrapper modules** enforce organizational standards (IMDSv2, encryption, tagging) — engineers use internal wrappers, not raw resources
- **`terraform test`** (1.6+) provides native module testing without external tools
- **Module output objects** (single structured output vs. many flat outputs) create stable, evolvable interfaces
- **Sensitive outputs** must be declared sensitive at every level of the module hierarchy to stay hidden in terminal output

---

## Common Interview Questions & Answers

**Q: What's the difference between `count` and `for_each` on a module? When would you use each?**
A: `count` creates N instances indexed by integers (0, 1, 2...). `for_each` creates instances keyed by map keys or set strings. The critical difference: with `count`, removing an element from the middle shifts all subsequent indices, causing Terraform to destroy and recreate all those resources. With `for_each`, each instance has a stable string key — removing one key doesn't affect others. Use `count` only for truly identical instances (like when N is the only dimension). Use `for_each` for named collections (environments, regions, microservices) where stability matters.

**Q: How do you pass a provider alias into a module? Why is this necessary?**
A: At the calling level, use the `providers` map: `providers = { aws = aws, aws.replica = aws.replica }`. Inside the module, declare `configuration_aliases = [aws.replica]` in the `required_providers` block. Without the declaration, Terraform doesn't know the module needs the alias and won't wire it through. This is necessary for multi-region resources (primary in us-east-1, replica in us-west-2) where both providers need to be active within the same module scope.

**Q: How do you refactor a Terraform configuration — renaming a resource or moving it into a module — without destroying and recreating it?**
A: Use `moved` blocks (Terraform 1.1+). Declare `moved { from = aws_instance.server; to = aws_instance.web }` or `moved { from = aws_vpc.main; to = module.network.aws_vpc.main }`. Terraform updates the state addresses during the next `terraform apply` without touching the real infrastructure. Without `moved` blocks, renamed resources appear as delete + create in the plan. Keep `moved` blocks in the configuration until all environments have been applied.

**Q: What is a module's "interface" and why does it matter?**
A: A module's interface consists of its input variables (`variables.tf`) and output values (`outputs.tf`). The interface matters because it's the contract between the module and its callers — you can freely change internal implementation (rename resources, restructure locals) without breaking callers, as long as the interface stays stable. Good module design: minimal required variables, sensible defaults, clear types with validation, and structured output objects for related values. Treat module interfaces like public API — breaking changes require version bumps.

**Q: When should you use `depends_on` on a module vs. letting Terraform infer dependencies?**
A: Terraform infers dependencies automatically when one module's output is used in another module's input — this is the preferred approach. Use explicit `depends_on` only when there's a hidden dependency Terraform can't see: typically when a module queries AWS using data sources and the queried resource is created by another module. For example, if `module.app` runs `data.aws_iam_role.existing` to look up a role created by `module.iam`, Terraform doesn't know about this data source dependency and may run them in the wrong order. `depends_on = [module.iam]` makes the ordering explicit.
