# 6.5 — Cost Optimization

**Goal:** Implement cost tagging strategy, AWS Budgets alerts, S3 storage tiers, and spot instance patterns.

## Cost Optimization Pillars

```
1. Visibility     → Tags + Cost Explorer + Budgets
2. Right-sizing   → Correct instance types/sizes
3. Scheduling     → Stop dev/test resources at night
4. Pricing model  → Reserved Instances, Savings Plans, Spot
5. Storage tiers  → S3 lifecycle rules, Intelligent Tiering
```

## 1. Cost Allocation Tags (Mandatory)

```hcl
locals {
  mandatory_tags = {
    Owner       = "platform-team"
    Project     = "my-app"
    Environment = "prod"
    CostCenter  = "engineering-001"
    ManagedBy   = "terraform"
  }
}

# Apply to EVERY resource
resource "aws_instance" "web" {
  tags = merge(local.mandatory_tags, { Name = "web-server" })
}
```

**In AWS:** Enable these as Cost Allocation Tags in Billing → activate them → Cost Explorer groups costs by tag.

## 2. AWS Budgets

```hcl
resource "aws_budgets_budget" "monthly" {
  budget_type  = "COST"
  limit_amount = "500"
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  notification {
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"         # actual spend
    subscriber_email_addresses = ["team@company.com"]
  }

  notification {
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED"     # projected to exceed
    subscriber_email_addresses = ["team@company.com"]
  }
}
```

## 3. S3 Storage Class Comparison

| Storage Class | Cost/GB | Retrieval | Use Case |
|--------------|---------|-----------|----------|
| STANDARD | $0.023 | Instant | Active data |
| STANDARD_IA | $0.0125 | Instant | Accessed monthly |
| GLACIER_IR | $0.004 | Instant | Accessed quarterly |
| GLACIER | $0.0036 | 1-5 min | Archives |
| DEEP_ARCHIVE | $0.00099 | 12 hours | Long-term archives |
| INTELLIGENT_TIERING | Auto | Auto | Unknown access pattern |

## 4. Spot Instances (up to 90% savings)

```hcl
resource "aws_instance" "worker" {
  instance_type        = "m5.large"

  instance_market_options {
    market_type = "spot"
    spot_options {
      max_price                      = "0.05"     # max you'll pay/hr
      spot_instance_type             = "persistent"
      instance_interruption_behavior = "stop"     # stop (not terminate) on interruption
    }
  }
}

# Better: use ASG with mixed instance policy
resource "aws_autoscaling_group" "workers" {
  mixed_instances_policy {
    instances_distribution {
      on_demand_percentage_above_base_capacity = 20   # 20% on-demand
      spot_allocation_strategy                 = "capacity-optimized"
    }
    launch_template {
      launch_template_specification {
        launch_template_id = aws_launch_template.worker.id
      }
      override { instance_type = "m5.large" }
      override { instance_type = "m5a.large" }
      override { instance_type = "m4.large" }
    }
  }
}
```

## 5. Resource Scheduling (dev/test savings)

```hcl
# Stop dev EC2 at night — 65% savings
resource "aws_autoscaling_schedule" "stop_dev_night" {
  scheduled_action_name  = "stop-at-night"
  min_size               = 0
  max_size               = 0
  desired_capacity       = 0
  recurrence             = "0 20 * * MON-FRI"    # 8pm weekdays
  autoscaling_group_name = aws_autoscaling_group.dev.name
}

resource "aws_autoscaling_schedule" "start_dev_morning" {
  scheduled_action_name  = "start-in-morning"
  min_size               = 1
  max_size               = 3
  desired_capacity       = 2
  recurrence             = "0 8 * * MON-FRI"     # 8am weekdays
  autoscaling_group_name = aws_autoscaling_group.dev.name
}
```

## 6. Reserved Instances vs Savings Plans

| Option | Commitment | Savings | Flexibility |
|--------|-----------|---------|-------------|
| On-Demand | None | 0% | Full |
| Reserved (1yr) | 1 year | ~40% | Region-locked |
| Reserved (3yr) | 3 years | ~60% | Region-locked |
| Compute Savings Plan | 1-3 years | ~66% | Any EC2/Fargate/Lambda |
| EC2 Savings Plan | 1-3 years | ~72% | Specific region/family |

**Best practice:** Savings Plans over Reserved Instances — more flexible, same discount.

## How to Run

```bash
terraform init
terraform apply -auto-approve

# View budgets in AWS Console → Billing → Budgets
# View tag-based costs → Cost Explorer → Group by Tag

terraform destroy -auto-approve
```

## Interview Questions

**Q: What is the AWS Savings Plan and how does it differ from Reserved Instances?**
> Both require upfront commitment for discounts. Reserved Instances lock you to a specific instance type in a specific region. Compute Savings Plans apply to any EC2 instance family, size, region, or OS — and also cover Fargate and Lambda. Savings Plans are preferred for their flexibility.

**Q: What is S3 Intelligent Tiering and when should you use it?**
> Intelligent Tiering monitors access patterns and automatically moves objects between tiers (Frequent, Infrequent, Archive) at no retrieval charge. Use it when access patterns are unpredictable. There's a small monitoring fee per object, so it's cost-effective for objects > 128KB.
