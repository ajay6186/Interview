# Examples 2.3 — Built-in Functions (50 examples)

> **Topic Overview:** Terraform's built-in functions are pure, side-effect-free transformations available anywhere in HCL expressions. Key categories: **string** (`format`, `join`, `split`, `replace`, `substr`, `trimspace`), **collection** (`merge`, `concat`, `flatten`, `distinct`, `length`, `keys`, `values`, `zipmap`, `transpose`), **numeric/IP** (`cidrsubnet`, `cidrhost`, `max`, `min`, `sum`), **encoding** (`jsonencode`, `yamlencode`, `base64encode`, `filebase64`), **type conversion** (`toset`, `tolist`, `tomap`, `tostring`, `tonumber`, `tobool`), and **error handling** (`try`, `can`). Functions are evaluated at plan time — they cannot make network calls or have side effects.

---

## Basic

### 1. format — string formatting

> `format()` uses printf-style format strings to build resource names. `%s` inserts a string, `%d` a decimal integer, `%03d` a zero-padded 3-digit integer. This produces consistent, predictable names across all resources. Prefer template strings (`"${var.a}-${var.b}"`) for simple concatenation; use `format()` when you need padding, precision, or complex formatting.

```hcl
locals {
  bucket_name = format("myapp-%s-%s", var.environment, var.region)
  # "myapp-production-us-east-1"

  resource_name = format("%s-%s-%03d", var.app, var.env, count.index + 1)
  # "api-prod-001"
}
```

### 2. join — concatenate list elements

> `join(separator, list)` concatenates list elements with a separator string. The first example creates a human-readable description. The second joins subnet ARNs with newlines (useful for multi-line policy documents). The inverse is `split()`.

```hcl
locals {
  sg_description = join(", ", ["Allow HTTP", "Allow HTTPS", "Allow SSH"])
  # "Allow HTTP, Allow HTTPS, Allow SSH"

  arn_list = join("\n", aws_subnet.public[*].arn)
}
```

### 3. split — split string into list

> `split(separator, string)` converts a delimited string into a list. Common use: accepting comma-separated CIDR lists as a variable (easier to pass via `-var` than a list literal), then splitting into the list type resources need. The result is always a `list(string)`.

```hcl
variable "subnet_cidrs" {
  type    = string
  default = "10.0.1.0/24,10.0.2.0/24,10.0.3.0/24"
}

locals {
  subnet_list = split(",", var.subnet_cidrs)
  # ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}
```

### 4. length — count elements

> `length()` returns the number of elements in a list, map, or string (character count for strings). The most common use: driving `count` from a list of AZs so the resource count automatically matches the number of availability zones. `length()` is evaluated at plan time — the list must be known before apply.

```hcl
variable "availability_zones" {
  type    = list(string)
  default = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

resource "aws_nat_gateway" "main" {
  count = length(var.availability_zones)
}
```

### 5. merge — combine maps

> `merge(map1, map2, ...)` combines maps — later arguments override earlier ones for duplicate keys. The pattern of merging `common_tags` with `resource_tags` is ubiquitous in Terraform. Resource-specific tags override common tags. The result is a new map; the originals are unchanged. For deep-merge (nested maps), you need to merge explicitly at each level.

```hcl
locals {
  common_tags = {
    ManagedBy   = "terraform"
    Environment = var.environment
  }
  resource_tags = {
    Name = "web-server"
    Tier = "public"
  }
  tags = merge(local.common_tags, local.resource_tags)
  # { ManagedBy = "terraform", Environment = "prod", Name = "web-server", Tier = "public" }
}
```

### 6. lookup — safe map access with default

> `lookup(map, key, default)` retrieves a value from a map or returns `default` if the key doesn't exist. This prevents plan-time errors when `var.environment` might not be in the map. Equivalent to `try(map[key], default)`. Use `lookup()` when the key might be absent; use direct indexing (`map[key]`) when it must exist.

```hcl
variable "instance_types" {
  type = map(string)
  default = {
    dev  = "t3.micro"
    prod = "t3.large"
  }
}

locals {
  instance_type = lookup(var.instance_types, var.environment, "t3.micro")
}
```

### 7. element — access list by index (wraps around)

> `element(list, index)` accesses a list element and **wraps around** — index 3 in a 3-element list returns element 0. This is useful when you have more resources than AZs: 5 subnets across 3 AZs, elements 3 and 4 cycle back to `us-east-1a` and `us-east-1b`. Direct indexing (`list[index]`) does NOT wrap and errors on out-of-bounds access.

```hcl
variable "azs" {
  type    = list(string)
  default = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

resource "aws_subnet" "public" {
  count             = 5
  availability_zone = element(var.azs, count.index)
  # Cycles: 1a, 1b, 1c, 1a, 1b
}
```

### 8. lower / upper / title

> Case conversion functions are essential for GCP (labels must be lowercase), AWS tag normalization, and IAM policy consistency. `title()` capitalizes the first letter of each word. Combine with `replace()` to normalize user input: `lower(replace(var.env, " ", "-"))` turns `"Production Env"` into `"production-env"`.

```hcl
locals {
  env_lower = lower(var.environment)      # "PROD" → "prod"
  env_upper = upper(var.environment)      # "prod" → "PROD"
  name_title = title("web server")        # "Web Server"
}
```

### 9. trimspace — strip whitespace

> `trimspace()` removes leading and trailing whitespace (spaces, tabs, newlines). Essential when variables come from user input, environment variables, or file reads where extra whitespace might be introduced. S3 bucket names and other AWS resource names fail if they contain whitespace — always `trimspace()` user-supplied name variables.

```hcl
variable "bucket_name" {
  type = string
}

locals {
  clean_name = trimspace(var.bucket_name)  # remove leading/trailing spaces
}
```

### 10. toset — convert list to set (deduplicates)

> `toset()` converts a list to a set — it deduplicates and sorts. The primary use is preparing a list for `for_each`, which requires a set or map (not a list). Also used to deduplicate AZ lists (since `data.aws_availability_zones.available.names` might repeat in some regions). Note: sets have no defined order.

```hcl
locals {
  unique_azs = toset(["us-east-1a", "us-east-1b", "us-east-1a", "us-east-1c"])
  # toset(["us-east-1a", "us-east-1b", "us-east-1c"])
}

resource "aws_subnet" "main" {
  for_each = toset(var.azs)
  availability_zone = each.key
}
```

### 11. tolist / tomap — type conversion

> `tolist()` converts a set back to a list (needed for indexing — sets don't support `[0]` access). `tomap()` explicitly types an object as a map (required when passing object literals to functions expecting `map(string)`). Type conversion is common when chaining functions that return one collection type but the next function requires another.

```hcl
locals {
  az_set  = toset(["us-east-1a", "us-east-1b"])
  az_list = tolist(local.az_set)           # convert back to list

  str_map = tomap({ a = "1", b = "2" })   # convert object to map
}
```

### 12. file — read file content

> `file(path)` reads the content of a file at plan time and returns it as a string. `${path.module}` is the directory of the current module — use it for relative paths to avoid issues when calling modules from different directories. Used for: user_data scripts, SSL certificates, policy documents. The file must exist at `terraform plan` time.

```hcl
resource "aws_instance" "web" {
  ami           = data.aws_ami.amazon_linux.id
  instance_type = "t3.micro"
  user_data     = file("${path.module}/scripts/user_data.sh")
}
```

---

## Intermediate

### 13. flatten — flatten nested lists

> `flatten()` takes a list of lists (or a nested structure) and returns a single flat list. Combined with `values()` to get the map values as a list, this extracts all CIDRs from a map of lists into a single flat list. Widely used with for expressions that produce lists of lists: `flatten([for x in list : [a, b, c]])`.

```hcl
variable "vpc_subnets" {
  type = map(list(string))
  default = {
    us-east-1 = ["10.0.1.0/24", "10.0.2.0/24"]
    us-west-2 = ["10.1.1.0/24", "10.1.2.0/24"]
  }
}

locals {
  all_cidrs = flatten(values(var.vpc_subnets))
  # ["10.0.1.0/24", "10.0.2.0/24", "10.1.1.0/24", "10.1.2.0/24"]
}
```

### 14. distinct — remove duplicates from list

> `distinct()` removes duplicate elements from a list while preserving order (unlike `toset()` which sorts). Use when you aggregate security group IDs from multiple sources that might overlap, or when combining subnet lists from different modules that share some subnets. Returns a list (not a set), so indexing still works.

```hcl
locals {
  all_sg_ids     = ["sg-001", "sg-002", "sg-001", "sg-003"]
  unique_sg_ids  = distinct(local.all_sg_ids)
  # ["sg-001", "sg-002", "sg-003"]
}
```

### 15. concat — merge multiple lists

> `concat(list1, list2, ...)` merges multiple lists into one. This is the list equivalent of `merge()` for maps. Use it to combine subnet IDs of different tiers for an ALB target group, or to combine security group IDs from multiple sources. Order is preserved; duplicates are NOT removed (use `distinct(concat(...))` to deduplicate).

```hcl
locals {
  all_subnet_ids = concat(
    aws_subnet.public[*].id,
    aws_subnet.private[*].id,
    aws_subnet.database[*].id
  )
}
```

### 16. keys / values — map operations

> `keys()` returns a sorted list of map keys; `values()` returns a list of map values in key-sorted order (so they correspond). Use `keys()` to enumerate resource names for `for_each`, and `values()` when you need just the port numbers without the names. The sorting ensures consistent ordering across plans.

```hcl
variable "service_ports" {
  type = map(number)
  default = { http = 80, https = 443, ssh = 22 }
}

locals {
  service_names = keys(var.service_ports)    # ["http", "https", "ssh"]
  port_numbers  = values(var.service_ports)  # [80, 443, 22]
}
```

### 17. zipmap — create map from keys and values

> `zipmap(keys_list, values_list)` creates a map by pairing keys with values at the same index. Useful when you have parallel lists (names and ports) that should be associated. The inverse of `keys()` + `values()`. Both lists must have the same length. Common use: building resource attribute maps from `count`-indexed resources.

```hcl
locals {
  names     = ["web", "api", "db"]
  ports     = [80, 8080, 5432]
  port_map  = zipmap(local.names, local.ports)
  # { web = 80, api = 8080, db = 5432 }
}
```

### 18. cidrsubnet — calculate subnets

> `cidrsubnet(prefix, newbits, netnum)` calculates subnet CIDRs. `newbits` is how many bits to add to the prefix length (`/16` + 8 bits = `/24`), `netnum` is which subnet number to take. Using a `for` expression with `range(8)` generates 8 subnets automatically. This eliminates hardcoded CIDR blocks — just define the VPC CIDR and let Terraform calculate subnets.

```hcl
locals {
  vpc_cidr = "10.0.0.0/16"

  # Create 8 subnets with /24 prefix
  subnets = [for i in range(8) : cidrsubnet(local.vpc_cidr, 8, i)]
  # ["10.0.0.0/24", "10.0.1.0/24", ..., "10.0.7.0/24"]
}
```

### 19. jsonencode / jsondecode

> `jsonencode()` converts HCL values to a JSON string — essential for ECS task definitions, Lambda environment config, IAM policy documents, and any AWS resource that expects JSON. Writing JSON as HCL objects (not raw strings) means you get syntax highlighting, HCL type checking, and can use variables/expressions inside the structure. Use `jsonencode` over `<<EOF` JSON strings.

```hcl
locals {
  container_definitions = jsonencode([{
    name      = "app"
    image     = "${var.ecr_repo}:${var.image_tag}"
    cpu       = 256
    memory    = 512
    essential = true
    portMappings = [{
      containerPort = 8080
      hostPort      = 8080
      protocol      = "tcp"
    }]
    environment = [
      { name = "ENV",      value = var.environment },
      { name = "LOG_LEVEL", value = "info" },
    ]
  }])
}
```

### 20. base64encode / filebase64

> EC2 `user_data_base64` requires base64-encoded content. `base64encode()` encodes a string; `filebase64()` reads a file and base64-encodes it directly (more efficient than `base64encode(file(...))`). The heredoc in `base64encode(<<-EOF ... EOF)` allows multi-line scripts inline. The `user_data` attribute (not `_base64`) accepts raw strings and auto-encodes them.

```hcl
# Encode user_data for EC2
locals {
  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y httpd
    systemctl start httpd
    EOF
  )
}

resource "aws_instance" "web" {
  user_data_base64 = local.user_data
}

# Or use filebase64 directly
resource "aws_instance" "web" {
  user_data_base64 = filebase64("${path.module}/scripts/bootstrap.sh")
}
```

### 21. formatdate / timestamp

> `timestamp()` returns the current time in RFC 3339 format; `formatdate()` reformats it. `"YYYY-MM-DD'T'hh:mm:ssZ"` produces ISO 8601. Important: `timestamp()` changes on every plan — it's useful for recording deploy times but will cause a diff on every plan if used in resource attributes. Use it in SSM parameters or tags where drift is acceptable.

```hcl
locals {
  deploy_timestamp = formatdate("YYYY-MM-DD'T'hh:mm:ssZ", timestamp())
  deploy_date      = formatdate("YYYY-MM-DD", timestamp())
  deploy_epoch     = timestamp()  # RFC 3339 format
}

resource "aws_ssm_parameter" "deploy_time" {
  name  = "/app/last_deploy"
  type  = "String"
  value = local.deploy_timestamp
}
```

### 22. replace — string substitution

> `replace(string, search, replacement)` replaces all occurrences. The `search` can be a literal string or a regex (delimited by `/`). The regex variant `replace(name, "/[^a-zA-Z0-9-]/", "")` removes any character that isn't alphanumeric or a hyphen — useful for sanitizing user input before using it as a resource name that has character restrictions.

```hcl
locals {
  # Replace underscores with hyphens (AWS doesn't allow underscores in some names)
  bucket_name = replace(lower(var.app_name), "_", "-")

  # Remove special characters
  safe_name = replace(var.resource_name, "/[^a-zA-Z0-9-]/", "")
}
```

### 23. substr — extract substring

> `substr(string, offset, length)` extracts a portion. Using `substr(var.git_sha, 0, 8)` takes the first 8 characters of a git commit SHA for version labels — common in image tags and deployment identifiers. `substr(name, 0, 20)` truncates long names to fit AWS naming limits (some resources have 32 or 64 character limits). Length `-1` means "to the end."

```hcl
locals {
  # Use first 8 chars of commit SHA for versioning
  short_sha = substr(var.git_sha, 0, 8)

  # Truncate long names for resource naming limits
  short_name = substr(var.app_name, 0, 20)
}
```

### 24. max / min — numeric functions

> `max()` and `min()` return the largest/smallest of their arguments. Combining them enforces that `desired_capacity` stays within `[min_size, max_size]` bounds — even if a caller passes a desired capacity outside the valid range. This pattern is safer than relying on AWS to reject the configuration at apply time.

```hcl
variable "desired_capacity" {
  type    = number
  default = 5
}

locals {
  # Ensure desired is within min/max bounds
  safe_desired = max(var.min_size, min(var.max_size, var.desired_capacity))
}
```

### 25. can / try — safe expression evaluation

> `try(expr1, expr2, ...)` evaluates expressions in order and returns the first that doesn't error. `can(expr)` returns `true` if the expression evaluates without error. Use these when accessing optional nested attributes that may not exist — `try(var.config.database.host, "localhost")` avoids a plan error if `var.config.database` is null. Safer than null checks for deeply nested optional config.

```hcl
variable "config" {
  type    = any
  default = {}
}

locals {
  # Safely access nested attribute that might not exist
  db_host = try(var.config.database.host, "localhost")
  port    = can(var.config.port) ? var.config.port : 5432

  # Try multiple fallbacks
  image_tag = try(
    var.config.image.tag,
    var.image_tag,
    "latest"
  )
}
```

---

## Nested

### 26. Nested flatten + merge for multi-region subnets

> A `flatten([for ... : [...]])` pattern generates a flat list of objects from a nested structure. For each region in `var.regions`, for each AZ index in `range(az_count)`, generate an object with region, CIDR, and index. `flatten` collapses the outer list. This feeds into `for_each = { for s in local.all_subnets : "${s.region}-${s.index}" => s }` to create subnets in all regions.

```hcl
variable "regions" {
  type = map(object({
    vpc_cidr = string
    az_count = number
  }))
}

locals {
  # Generate all subnet CIDRs across regions
  all_subnets = flatten([
    for region, config in var.regions : [
      for i in range(config.az_count) : {
        region = region
        cidr   = cidrsubnet(config.vpc_cidr, 8, i)
        index  = i
      }
    ]
  ])
}
```

### 27. cidrsubnet in for expression for dynamic subnets

> A complete multi-tier subnet CIDR generation pattern. Using `range(local.az_count)` dynamically generates the right number of subnets based on available AZs. The `+ 10`, `+ 20`, `+ 30` offsets ensure public/private/database/intra subnets use non-overlapping `netnum` values within the VPC CIDR. This is the pattern used internally by `terraform-aws-modules/vpc`.

```hcl
locals {
  vpc_cidr       = "10.0.0.0/16"
  az_count       = length(data.aws_availability_zones.available.names)

  public_subnets  = [for i in range(local.az_count) : cidrsubnet(local.vpc_cidr, 8, i)]
  private_subnets = [for i in range(local.az_count) : cidrsubnet(local.vpc_cidr, 8, i + 10)]
  db_subnets      = [for i in range(local.az_count) : cidrsubnet(local.vpc_cidr, 8, i + 20)]
  intra_subnets   = [for i in range(local.az_count) : cidrsubnet(local.vpc_cidr, 8, i + 30)]
}
```

### 28. Complex jsonencode for IAM policy

> Combining `jsonencode()` with a `for` expression generates a policy with one statement per S3 bucket. This is far more maintainable than a static JSON string: adding a bucket only requires adding to `var.s3_buckets`; the policy generates automatically. The result is valid IAM JSON suitable for `aws_iam_policy.policy`.

```hcl
locals {
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      for bucket in var.s3_buckets : {
        Effect   = "Allow"
        Action   = ["s3:GetObject", "s3:ListBucket"]
        Resource = [
          "arn:aws:s3:::${bucket}",
          "arn:aws:s3:::${bucket}/*"
        ]
      }
    ]
  })
}

resource "aws_iam_policy" "s3_access" {
  name   = "s3-multi-bucket-access"
  policy = local.policy
}
```

### 29. Dynamic label generation with merge + format

> Generating per-resource tags from a base map plus overrides uses a `for` expression over `var.resource_tag_overrides`. For each resource, the final tags are: `base_tags` (common to all) merged with `resource_tags` (from the overrides map) merged with a computed `Name` tag using `format()`. Later arguments to `merge()` win — so the computed `Name` overrides any `Name` in `resource_tags`.

```hcl
locals {
  base_tags = {
    ManagedBy   = "terraform"
    Environment = var.environment
    Project     = var.project
    Owner       = var.team
  }

  # Per-resource tags merged with base
  tags = {
    for resource_name, resource_tags in var.resource_tag_overrides :
    resource_name => merge(local.base_tags, resource_tags, {
      Name = format("%s-%s-%s", var.project, resource_name, var.environment)
    })
  }
}
```

### 30. Functions for ECS container definitions

> The full ECS container definition generator — the most complex use of `jsonencode()` with nested `for` expressions. For each service: builds the ECR image URI with `format()`, conditionally adds port mappings, transforms the env var map into the `[{name, value}]` format ECS requires using a `for` expression, and adds CloudWatch log configuration. This is production-level ECS infrastructure-as-code.

```hcl
locals {
  containers = [
    for svc in var.services : {
      name      = svc.name
      image     = format("%s.dkr.ecr.%s.amazonaws.com/%s:%s",
                    data.aws_caller_identity.current.account_id,
                    var.region, svc.name, svc.tag)
      cpu       = svc.cpu
      memory    = svc.memory
      essential = svc.name == var.primary_service
      portMappings = svc.port != null ? [{ containerPort = svc.port }] : []
      environment = [
        for k, v in merge(var.common_env, svc.env) :
        { name = k, value = v }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/${var.app}-${svc.name}"
          "awslogs-region"        = var.region
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ]
}
```

### 31. Nested setproduct for matrix configuration

> `setproduct(set1, set2)` computes the Cartesian product — all combinations of two sets. With 3 regions and 2 environments, this generates 6 combinations. The `for pair in setproduct(...)` pattern with `"${pair[0]}-${pair[1]}"` as the key creates a map suitable for `for_each`. This drives multi-region × multi-environment deployments from a single configuration.

```hcl
locals {
  regions     = ["us-east-1", "us-west-2", "eu-west-1"]
  environments = ["staging", "production"]

  # Create all region × environment combinations
  deployments = {
    for pair in setproduct(local.regions, local.environments) :
    "${pair[0]}-${pair[1]}" => {
      region      = pair[0]
      environment = pair[1]
    }
  }
}
```

### 32. Safe nested attribute access with try()

> Deeply nested optional config is common when module interfaces need to be flexible. `try(var.cluster_config.nodes.autoscaling.min, 2)` handles any of these cases gracefully: `var.cluster_config` is `{}`, `nodes` doesn't exist, `autoscaling` doesn't exist, or `min` doesn't exist — all return `2` instead of a plan error. This pattern is essential for modules that accept partial configuration.

```hcl
variable "cluster_config" {
  type = any
  default = {}
}

locals {
  # Deeply nested optional config
  node_config = {
    instance_type   = try(var.cluster_config.nodes.instance_type, "t3.medium")
    min_size        = try(var.cluster_config.nodes.autoscaling.min, 2)
    max_size        = try(var.cluster_config.nodes.autoscaling.max, 10)
    disk_size       = try(var.cluster_config.nodes.disk.size_gb, 50)
    labels          = try(var.cluster_config.nodes.labels, {})
  }
}
```

### 33. cidrhost for static IP assignments

> `cidrhost(prefix, hostnum)` calculates the IP address at a specific host number within a subnet. `cidrhost("10.0.1.0/24", 1)` returns `"10.0.1.1"` (first usable IP after the network address). Negative numbers count from the end: `-1` is the broadcast address, `-2` is the last usable host. Use this to assign well-known static IPs (gateway, DNS resolver, NTP) within subnets.

```hcl
locals {
  vpc_cidr = "10.0.0.0/16"
  subnet   = cidrsubnet(local.vpc_cidr, 8, 1)  # 10.0.1.0/24

  # Assign static IPs within subnet
  gateway_ip  = cidrhost(local.subnet, 1)   # 10.0.1.1
  dns_ip      = cidrhost(local.subnet, 2)   # 10.0.1.2
  reserved_ip = cidrhost(local.subnet, -1)  # 10.0.1.255 (last)
}
```

---

## Advanced

### 34. regex and regexall

> `regex(pattern, string)` returns the first match (or subgroups as a list). `regexall(pattern, string)` returns all matches as a list. The ARN example extracts the account ID using a capture group `([0-9]+)` — `[0]` gets the first capture group. Double-escape special regex characters in HCL strings (`\\d` for `\d`). Use `can(regex(...))` to test if a string matches without erroring.

```hcl
variable "arn" {
  type    = string
  default = "arn:aws:iam::123456789012:role/MyRole"
}

locals {
  # Extract account ID from ARN
  account_id = regex("arn:aws[^:]*:iam::([0-9]+):.*", var.arn)[0]
  # "123456789012"

  # Find all IP addresses in a string
  ips = regexall("\\d+\\.\\d+\\.\\d+\\.\\d+", var.ip_string)
}
```

### 35. alltrue / anytrue for list boolean checks

> `alltrue(list)` returns `true` if all elements are `true`; `anytrue(list)` returns `true` if any element is `true`. Combining with a `for` expression over a list of objects enables bulk validation: "all subnets must be encrypted," "at least one subnet must be public." Use in `precondition` blocks for module-level policy enforcement before resources are created.

```hcl
variable "subnet_configs" {
  type = list(object({
    public  = bool
    encrypt = bool
  }))
}

locals {
  all_encrypted  = alltrue([for s in var.subnet_configs : s.encrypt])
  any_public     = anytrue([for s in var.subnet_configs : s.public])
}

resource "null_resource" "validation" {
  lifecycle {
    precondition {
      condition     = local.all_encrypted
      error_message = "All subnets must have encryption enabled."
    }
  }
}
```

### 36. chunklist — split list into batches

> `chunklist(list, size)` splits a list into sublists of at most `size` elements. Essential when AWS API limits impose batch size restrictions — Systems Manager SSM associations support at most 50 instance IDs per call. Processing 100 instances: `chunklist(ids, 50)` → `[[id1..id50], [id51..id100]]`, then `count = length(batches)` creates two associations. The last batch may have fewer than `size` elements.

```hcl
variable "instance_ids" {
  type = list(string)
}

locals {
  # Process instances in batches of 10
  batches = chunklist(var.instance_ids, 10)
  # [[id1..id10], [id11..id20], ...]
}

resource "aws_ssm_association" "patch" {
  count = length(local.batches)
  name  = "AWS-RunPatchBaseline"
  targets {
    key    = "InstanceIds"
    values = local.batches[count.index]
  }
}
```

### 37. transpose — invert a map of lists

> `transpose(map)` inverts a map of lists — keys become values and values become keys. The example shows cross-account role assignment: starting from "which accounts have which roles," transpose gives "for each account, what roles do they have." Use this for generating IAM policies, permission sets, or any scenario where you need both views of a many-to-many relationship.

```hcl
locals {
  # Map of role → list of accounts
  role_accounts = {
    admin  = ["111111111111", "222222222222"]
    viewer = ["111111111111", "333333333333"]
  }

  # Transpose: map of account → list of roles
  account_roles = transpose(local.role_accounts)
  # {
  #   "111111111111" = ["admin", "viewer"]
  #   "222222222222" = ["admin"]
  #   "333333333333" = ["viewer"]
  # }
}
```

### 38. Complex IP range calculations

> A hierarchical CIDR allocation strategy: a `/8` supernet is divided into `/16` VPCs per environment using `cidrsubnet(base, 8, n)`. Within each `/16` VPC, three tiers of `/24` subnets are carved out using nested `cidrsubnet` calls with `+ 10` and `+ 20` offsets. This produces a clean, non-overlapping IP allocation for a multi-environment organization.

```hcl
variable "base_cidr" {
  type    = string
  default = "10.0.0.0/8"
}

locals {
  # /8 → /16 VPCs for each environment
  vpc_cidrs = {
    dev     = cidrsubnet(var.base_cidr, 8, 0)   # 10.0.0.0/16
    staging = cidrsubnet(var.base_cidr, 8, 1)   # 10.1.0.0/16
    prod    = cidrsubnet(var.base_cidr, 8, 2)   # 10.2.0.0/16
  }

  # Within each /16, carve out /24 subnets
  all_subnets = {
    for env, vpc in local.vpc_cidrs : env => {
      public   = [for i in range(3) : cidrsubnet(vpc, 8, i)]
      private  = [for i in range(3) : cidrsubnet(vpc, 8, i + 10)]
      database = [for i in range(3) : cidrsubnet(vpc, 8, i + 20)]
    }
  }
}
```

### 39. yamlencode for configuration generation

> `yamlencode()` converts HCL values to a YAML string — useful for generating kubeconfig files, Kubernetes manifests, Helm values, and cloud-init configurations. The kubeconfig example builds a complete kubeconfig from EKS cluster outputs. Note: `yamlencode` uses block-style YAML, which may differ from the flow-style some tools expect.

```hcl
locals {
  kubeconfig = yamlencode({
    apiVersion = "v1"
    kind       = "Config"
    clusters = [{
      name = var.cluster_name
      cluster = {
        server                   = aws_eks_cluster.main.endpoint
        certificate-authority-data = aws_eks_cluster.main.certificate_authority[0].data
      }
    }]
    users = [{
      name = "terraform"
      user = { token = data.aws_eks_cluster_auth.main.token }
    }]
    contexts = [{
      name = var.cluster_name
      context = {
        cluster = var.cluster_name
        user    = "terraform"
      }
    }]
    current-context = var.cluster_name
  })
}
```

### 40. Dynamic IAM policy generation with functions

> A flexible S3 access policy generator. The `var.s3_access` list drives statement generation — each element defines a bucket, actions, and optional prefix. The ternary in `Resource` generates prefix-scoped resources when `prefix != ""`, or bucket + wildcard when empty. This is more maintainable than static JSON and supports arbitrary combinations of bucket/prefix/action grants.

```hcl
variable "s3_access" {
  type = list(object({
    bucket     = string
    actions    = list(string)
    prefix     = optional(string, "")
  }))
}

locals {
  statements = [
    for access in var.s3_access : {
      Effect   = "Allow"
      Action   = access.actions
      Resource = access.prefix != "" ? [
        "arn:aws:s3:::${access.bucket}/${access.prefix}*"
      ] : [
        "arn:aws:s3:::${access.bucket}",
        "arn:aws:s3:::${access.bucket}/*"
      ]
    }
  ]

  policy_json = jsonencode({
    Version   = "2012-10-17"
    Statement = local.statements
  })
}
```

### 41. String templates and multi-line heredoc

> A heredoc (`<<-EOT`) with embedded `${jsonencode(...)}` is the pattern for generating complex configuration files in user_data scripts. The inner `jsonencode()` is evaluated at plan time and the JSON string is embedded in the shell script. The `<<-` variant strips leading tabs for indentation. Note: `${...}` in heredocs is interpreted by Terraform, not the shell — escape with `$${...}` if you need a literal dollar sign.

```hcl
locals {
  user_data = <<-EOT
    #!/bin/bash
    set -e
    
    # Configure application
    cat > /etc/app/config.json <<'EOF'
    ${jsonencode({
      environment = var.environment
      region      = var.region
      log_level   = var.environment == "production" ? "warn" : "debug"
      endpoints   = {
        api = "https://api.${var.domain}"
        db  = var.db_host
      }
    })}
    EOF
    
    # Start application
    systemctl start app
    systemctl enable app
  EOT
}
```

### 42. Functions for generating security group rules

> Transforming a list of CIDRs into a list of security group rule objects using a `for` expression. This is used with the `dynamic "egress"` block pattern — the `for_each` on the dynamic block iterates `local.egress_rules`, creating one egress rule per CIDR. The description includes the CIDR for auditability in the AWS console.

```hcl
variable "allowed_cidrs" {
  type    = list(string)
  default = ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"]
}

locals {
  # Generate egress rules for each CIDR
  egress_rules = [
    for cidr in var.allowed_cidrs : {
      from_port   = 0
      to_port     = 65535
      protocol    = "tcp"
      cidr_blocks = [cidr]
      description = "Allow egress to ${cidr}"
    }
  ]
}
```

### 43. formatdate for resource lifecycle management

> Date-stamped resource names are used for rotating resources (AMIs, certificates, secrets). `formatdate("YYYY-MM", timestamp())` generates a monthly key — when the month changes, the key changes and Terraform recreates the resource. `timeadd(timestamp(), "2160h")` adds 90 days (2160 hours) for calculating certificate expiry dates. Note: both depend on `timestamp()` which changes on every plan.

```hcl
locals {
  # Generate monthly rotation identifier
  month_key = formatdate("YYYY-MM", timestamp())

  # AMI name with date
  ami_name = "app-ami-${formatdate("YYYY-MM-DD", timestamp())}"

  # Expiry date 90 days from now
  cert_expiry = timeadd(timestamp(), "2160h")  # 90 days in hours
}
```

### 44. Complex merge for layered configuration

> A three-layer configuration merge: `defaults` → `env_overrides` → caller's `var.extra_tags`. The `lookup({...}, var.environment, {})` returns the environment-specific overrides or an empty map for unknown environments. The nested `merge()` for `tags` does a deep merge of the tags sub-map. This pattern provides sensible defaults that can be progressively overridden at each layer.

```hcl
locals {
  defaults = {
    instance_type   = "t3.micro"
    disk_size       = 20
    enable_backups  = false
    tags            = { ManagedBy = "terraform" }
  }

  env_overrides = lookup({
    production = {
      instance_type  = "t3.large"
      disk_size      = 100
      enable_backups = true
    }
  }, var.environment, {})

  # Merge with deep-merge for tags
  config = merge(local.defaults, local.env_overrides, {
    tags = merge(
      local.defaults.tags,
      lookup(local.env_overrides, "tags", {}),
      var.extra_tags
    )
  })
}
```

### 45. Function-driven security group CIDR validation

> Using `can(cidrnetmask(ip))` as a CIDR validator: `cidrnetmask()` errors if the input isn't valid CIDR notation; `can()` converts that error to `false`. `alltrue([for ip in var.allowed_ips : can(cidrnetmask(ip))])` validates all IPs at once. This gives users a clear error at plan time ("all values must be valid CIDR notation") rather than a cryptic AWS API error during apply.

```hcl
variable "allowed_ips" {
  type = list(string)
  validation {
    condition = alltrue([
      for ip in var.allowed_ips :
      can(cidrnetmask(ip))  # validates CIDR notation
    ])
    error_message = "All values must be valid CIDR notation (e.g., 10.0.0.0/24)."
  }
}
```

### 46. Generating resource names with functions

> A systematic resource naming module that generates a consistent `{org}-{project}-{environment}-{region_short}` prefix. `compact([...])` removes empty strings from the list before joining — so if `var.org` is empty, the prefix doesn't start with a hyphen. `lookup` maps full region names to short codes; the fallback `replace(var.region, "-", "")` handles unknown regions.

```hcl
locals {
  # Consistent naming: {org}-{project}-{environment}-{region_short}-{resource}
  region_short = {
    "us-east-1"      = "use1"
    "us-west-2"      = "usw2"
    "eu-west-1"      = "euw1"
    "ap-southeast-1" = "apse1"
  }

  name_prefix = join("-", compact([
    var.org,
    var.project,
    var.environment,
    lookup(local.region_short, var.region, replace(var.region, "-", ""))
  ]))

  # Example: "acme-platform-prod-use1"
  names = {
    vpc    = "${local.name_prefix}-vpc"
    alb    = "${local.name_prefix}-alb"
    bucket = "${local.name_prefix}-${random_id.suffix.hex}"
  }
}
```

### 47. tostring / tonumber / tobool

> Explicit type conversion is needed when Terraform's type inference doesn't match what an argument expects. `tostring(8080)` converts a number to a string for use in map attributes that expect strings. `tonumber("8080")` converts a string (from a data source or external system) to a number. `tobool("true")` converts the string `"true"` to the boolean `true`. Conversion fails if the value can't be converted (e.g., `tonumber("abc")`).

```hcl
locals {
  port_string  = tostring(8080)          # "8080"
  port_number  = tonumber("8080")        # 8080
  is_enabled   = tobool("true")          # true
  
  # Useful when API returns strings that should be numbers
  desired_cap  = tonumber(var.capacity_string)
}
```

### 48. sum and index functions

> `sum(list)` returns the total of all numbers in a list — useful for calculating total cluster capacity across node pools. `index(list, value)` returns the zero-based position of the first occurrence of `value` in `list`, erroring if not found. Use `index()` when you need the position (for subsequent indexing), not just the value.

```hcl
variable "node_counts" {
  type    = list(number)
  default = [3, 2, 5]
}

locals {
  total_nodes  = sum(var.node_counts)  # 10
  first_match  = index(var.azs, "us-east-1a")  # 0
}
```

### 49. Functions for user_data bootstrap script

> `templatefile(path, vars)` renders a template file (`.tftpl` extension by convention) substituting `${var_name}` placeholders with the provided variable map. This is cleaner than heredocs for long scripts — the script file gets syntax highlighting and validation. The result is base64-encoded for `user_data_base64`. `path.module` ensures the template path is relative to the module, not the root.

```hcl
locals {
  packages = ["httpd", "mod_ssl", "awscli", "amazon-cloudwatch-agent"]

  user_data = base64encode(templatefile("${path.module}/templates/userdata.sh.tftpl", {
    packages     = join(" ", local.packages)
    app_name     = var.app_name
    environment  = var.environment
    ssm_prefix   = "/${var.environment}/${var.app_name}"
    region       = var.region
    log_group    = "/aws/ec2/${var.app_name}"
  }))
}
```

### 50. Complete function showcase for VPC module

> This production VPC module `locals` block demonstrates the full function toolkit working together: `slice()` limits AZ count, `cidrsubnet()` generates subnet CIDRs, `concat()` merges tier lists, `lower()` normalizes env name, `lookup()` maps region to short code, `format()` builds the name prefix, `formatdate()` stamps the deploy date, and a nested `for` expression generates per-AZ tag maps. This is the pattern used in real production VPC modules.

```hcl
data "aws_availability_zones" "available" { state = "available" }

locals {
  vpc_cidr   = "10.0.0.0/16"
  azs        = slice(data.aws_availability_zones.available.names, 0, 3)
  az_count   = length(local.azs)

  # Subnet CIDR generation
  public_cidrs   = [for i in range(local.az_count) : cidrsubnet(local.vpc_cidr, 8, i)]
  private_cidrs  = [for i in range(local.az_count) : cidrsubnet(local.vpc_cidr, 8, i + 10)]
  database_cidrs = [for i in range(local.az_count) : cidrsubnet(local.vpc_cidr, 8, i + 20)]

  # All subnets as flat list
  all_cidrs = concat(local.public_cidrs, local.private_cidrs, local.database_cidrs)

  # Name generation
  env        = lower(var.environment)
  region_short = lookup(local.region_map, var.region, replace(var.region, "-", ""))

  name_prefix = format("%s-%s-%s", var.project, local.env, local.region_short)

  # Tag generation
  base_tags = {
    Project     = var.project
    Environment = local.env
    ManagedBy   = "terraform"
    Region      = var.region
    DeployedAt  = formatdate("YYYY-MM-DD", timestamp())
  }

  subnet_tags = {
    for i, az in local.azs :
    az => merge(local.base_tags, {
      AvailabilityZone = az
      AzIndex          = tostring(i)
    })
  }
}
```

---

## Key Takeaways

- **`cidrsubnet(prefix, newbits, netnum)`** is the most important Terraform function for infrastructure engineers — master it for automatic subnet CIDR generation from a VPC CIDR
- **`merge(map1, map2)`** is ubiquitous for tag composition — later maps override earlier ones; use it to layer common tags → resource-specific tags → computed tags
- **`try(expr, fallback)`** is the safe access pattern for optional/nested configuration — eliminates null pointer-style plan errors
- **`jsonencode()`** > raw JSON heredocs — use HCL objects that get JSON-encoded rather than string literals; you get type checking and variable interpolation
- **`flatten([for x : [...]])`** collapses nested for expressions — needed whenever a for expression produces lists of lists
- **`toset(list)`** enables `for_each` on lists; `tolist(set)` restores indexing capability on sets
- **`element(list, index)`** wraps around; direct indexing `list[n]` does not — use `element` for cycling through AZs with more subnets than AZs
- **`templatefile(path, vars)`** is cleaner than heredoc for long scripts — the template file gets syntax highlighting and the script logic stays in `.sh` files
- **`setproduct(set1, set2)`** generates Cartesian products for multi-dimensional deployments (region × environment)
- **`alltrue/anytrue([for x in list : condition])`** enables bulk validation across collections — use in `precondition` blocks

---

## Common Interview Questions & Answers

**Q: How does `cidrsubnet` work? Calculate the third /24 subnet of `10.0.0.0/16`.**
A: `cidrsubnet(prefix, newbits, netnum)` takes a CIDR prefix, adds `newbits` to the prefix length, and returns the `netnum`-th subnet. For `cidrsubnet("10.0.0.0/16", 8, 2)`: adds 8 bits to `/16` to get `/24`, then takes the 3rd subnet (0-indexed: netnum=2), which is `10.0.2.0/24`. The formula: the netnum is encoded in the `newbits` bits immediately after the original prefix. Common usage: `[for i in range(3) : cidrsubnet("10.0.0.0/16", 8, i)]` generates `["10.0.0.0/24", "10.0.1.0/24", "10.0.2.0/24"]`.

**Q: What's the difference between `try()` and `can()` in Terraform?**
A: `try(expr1, expr2, ..., fallback)` evaluates expressions in order and returns the first one that succeeds (doesn't error). It's for "use this value, but fall back to that if it errors." `can(expr)` returns `true` if the expression evaluates without error and `false` if it errors — it's for checking whether an expression is valid. Use `try()` when you want the value with a fallback: `try(var.config.timeout, 30)`. Use `can()` when you want a boolean test: `can(cidrnetmask(var.ip))` to validate CIDR notation. Both are evaluated at plan time.

**Q: When would you use `jsonencode()` vs `aws_iam_policy_document` data source for IAM policies?**
A: `aws_iam_policy_document` is preferred for most IAM policies — it validates policy structure, handles JSON escaping, and supports inheritance (source_policy_documents, override_policy_documents). Use `jsonencode()` when: (1) the policy structure is dynamically generated from a `for` expression (policy_document doesn't support dynamic statements as well), (2) you need the exact JSON string for comparison, (3) you're generating non-IAM JSON (like ECS task definitions, Lambda environment config). `jsonencode()` produces compact JSON; `aws_iam_policy_document` produces normalized, formatted JSON.

**Q: What does `flatten()` do and when do you need it?**
A: `flatten(list)` recursively flattens nested lists into a single flat list. You need it when a `for` expression produces a list of lists — which happens when the body of the `for` expression is itself a list. Example: `[for region in regions : [for az in azs : "${region}-${az}"]]` produces `[["us-east-1a", "us-east-1b"], ["us-west-2a"]]`. `flatten(...)` turns it into `["us-east-1a", "us-east-1b", "us-west-2a"]`. The pattern `flatten([for x in list : [...]])` is extremely common in Terraform for generating flat collections from nested structures.

**Q: Explain `merge()` behavior when two maps have the same key.**
A: When `merge()` receives maps with duplicate keys, the rightmost argument wins. `merge({a = "1", b = "2"}, {b = "3", c = "4"})` produces `{a = "1", b = "3", c = "4"}` — the second map's `b = "3"` overwrites the first's `b = "2"`. This is intentional and the basis for tag layering: `merge(common_tags, resource_tags, {Name = "..."})` — the most specific tags are passed last and override more general ones. Important: `merge()` does a shallow merge — if a key's value is itself a map, it replaces the entire map, not merges recursively.
