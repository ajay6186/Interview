# Examples 5.5 — Route53 & DNS (50 examples)

---

## Basic

### 1. Public hosted zone
```hcl
resource "aws_route53_zone" "main" {
  name = "example.com"
  tags = { ManagedBy = "terraform" }
}
```

### 2. Private hosted zone
```hcl
resource "aws_route53_zone" "internal" {
  name = "internal.example.com"

  vpc {
    vpc_id = module.vpc.vpc_id
  }
}
```

### 3. A record
```hcl
resource "aws_route53_record" "web" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "www.example.com"
  type    = "A"
  ttl     = 300
  records = ["203.0.113.1"]
}
```

### 4. CNAME record
```hcl
resource "aws_route53_record" "api" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "api.example.com"
  type    = "CNAME"
  ttl     = 300
  records = ["api-backend.example.net"]
}
```

### 5. Alias record for ALB
```hcl
resource "aws_route53_record" "app" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "app.example.com"
  type    = "A"

  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}
```

### 6. Alias record for CloudFront
```hcl
resource "aws_route53_record" "cdn" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "cdn.example.com"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.main.domain_name
    zone_id                = aws_cloudfront_distribution.main.hosted_zone_id
    evaluate_target_health = false
  }
}
```

### 7. MX record
```hcl
resource "aws_route53_record" "mail" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "example.com"
  type    = "MX"
  ttl     = 3600
  records = [
    "10 mail1.example.com.",
    "20 mail2.example.com."
  ]
}
```

### 8. TXT record for SPF
```hcl
resource "aws_route53_record" "spf" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "example.com"
  type    = "TXT"
  ttl     = 3600
  records = [
    "\"v=spf1 include:_spf.google.com ~all\"",
    "\"google-site-verification=abc123\""
  ]
}
```

### 9. NS record delegation
```hcl
output "name_servers" {
  value = aws_route53_zone.main.name_servers
}

# For subdomain delegation
resource "aws_route53_record" "subdomain_ns" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "dev.example.com"
  type    = "NS"
  ttl     = 86400
  records = aws_route53_zone.dev.name_servers
}
```

### 10. Health check (HTTP)
```hcl
resource "aws_route53_health_check" "api" {
  fqdn              = "api.example.com"
  port              = 443
  type              = "HTTPS"
  resource_path     = "/health"
  failure_threshold = 3
  request_interval  = 30

  tags = { Name = "api-health-check" }
}
```

### 11. AAAA record (IPv6)
```hcl
resource "aws_route53_record" "ipv6" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "www.example.com"
  type    = "AAAA"
  ttl     = 300
  records = ["2001:db8::1"]
}
```

### 12. ACM certificate DNS validation
```hcl
resource "aws_acm_certificate" "main" {
  domain_name       = "example.com"
  validation_method = "DNS"
  subject_alternative_names = ["*.example.com"]
}

resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.main.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      type   = dvo.resource_record_type
      record = dvo.resource_record_value
    }
  }

  zone_id = aws_route53_zone.main.zone_id
  name    = each.value.name
  type    = each.value.type
  ttl     = 60
  records = [each.value.record]
}

resource "aws_acm_certificate_validation" "main" {
  certificate_arn         = aws_acm_certificate.main.arn
  validation_record_fqdns = [for r in aws_route53_record.cert_validation : r.fqdn]
}
```

---

## Intermediate

### 13. Weighted routing
```hcl
resource "aws_route53_record" "weighted_primary" {
  zone_id        = aws_route53_zone.main.zone_id
  name           = "api.example.com"
  type           = "A"
  set_identifier = "primary"

  weighted_routing_policy {
    weight = 90
  }

  alias {
    name                   = aws_lb.primary.dns_name
    zone_id                = aws_lb.primary.zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "weighted_canary" {
  zone_id        = aws_route53_zone.main.zone_id
  name           = "api.example.com"
  type           = "A"
  set_identifier = "canary"

  weighted_routing_policy {
    weight = 10
  }

  alias {
    name                   = aws_lb.canary.dns_name
    zone_id                = aws_lb.canary.zone_id
    evaluate_target_health = true
  }
}
```

### 14. Latency-based routing
```hcl
resource "aws_route53_record" "latency_us" {
  zone_id        = aws_route53_zone.main.zone_id
  name           = "api.example.com"
  type           = "A"
  set_identifier = "us-east-1"

  latency_routing_policy {
    region = "us-east-1"
  }

  alias {
    name                   = aws_lb.us_east.dns_name
    zone_id                = aws_lb.us_east.zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "latency_eu" {
  zone_id        = aws_route53_zone.main.zone_id
  name           = "api.example.com"
  type           = "A"
  set_identifier = "eu-west-1"

  latency_routing_policy {
    region = "eu-west-1"
  }

  alias {
    name                   = aws_lb.eu_west.dns_name
    zone_id                = aws_lb.eu_west.zone_id
    evaluate_target_health = true
  }
}
```

### 15. Failover routing
```hcl
resource "aws_route53_record" "primary" {
  zone_id        = aws_route53_zone.main.zone_id
  name           = "app.example.com"
  type           = "A"
  set_identifier = "primary"

  failover_routing_policy {
    type = "PRIMARY"
  }

  health_check_id = aws_route53_health_check.primary.id

  alias {
    name                   = aws_lb.primary.dns_name
    zone_id                = aws_lb.primary.zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "secondary" {
  zone_id        = aws_route53_zone.main.zone_id
  name           = "app.example.com"
  type           = "A"
  set_identifier = "secondary"

  failover_routing_policy {
    type = "SECONDARY"
  }

  alias {
    name                   = aws_lb.dr.dns_name
    zone_id                = aws_lb.dr.zone_id
    evaluate_target_health = false
  }
}
```

### 16. Geolocation routing
```hcl
resource "aws_route53_record" "geo_us" {
  zone_id        = aws_route53_zone.main.zone_id
  name           = "app.example.com"
  type           = "A"
  set_identifier = "us-users"

  geolocation_routing_policy {
    country = "US"
  }

  alias {
    name                   = aws_lb.us.dns_name
    zone_id                = aws_lb.us.zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "geo_eu" {
  zone_id        = aws_route53_zone.main.zone_id
  name           = "app.example.com"
  type           = "A"
  set_identifier = "eu-users"

  geolocation_routing_policy {
    continent = "EU"
  }

  alias {
    name                   = aws_lb.eu.dns_name
    zone_id                = aws_lb.eu.zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "geo_default" {
  zone_id        = aws_route53_zone.main.zone_id
  name           = "app.example.com"
  type           = "A"
  set_identifier = "default"

  geolocation_routing_policy {
    country = "*"
  }

  alias {
    name                   = aws_lb.global.dns_name
    zone_id                = aws_lb.global.zone_id
    evaluate_target_health = true
  }
}
```

### 17. Multi-value routing
```hcl
resource "aws_route53_record" "multivalue" {
  for_each = {
    "instance-1" = { ip = "203.0.113.1", health_check = aws_route53_health_check.inst1.id }
    "instance-2" = { ip = "203.0.113.2", health_check = aws_route53_health_check.inst2.id }
    "instance-3" = { ip = "203.0.113.3", health_check = aws_route53_health_check.inst3.id }
  }

  zone_id        = aws_route53_zone.main.zone_id
  name           = "api.example.com"
  type           = "A"
  ttl            = 60
  set_identifier = each.key
  records        = [each.value.ip]
  health_check_id = each.value.health_check

  multivalue_answer_routing_policy {
    route_all_qualified_resource_records = false
  }
}
```

### 18. Route53 Resolver
```hcl
resource "aws_route53_resolver_endpoint" "inbound" {
  name      = "inbound-dns"
  direction = "INBOUND"
  security_group_ids = [aws_security_group.dns_resolver.id]

  ip_address {
    subnet_id = var.private_subnet_ids[0]
  }

  ip_address {
    subnet_id = var.private_subnet_ids[1]
  }
}

resource "aws_route53_resolver_endpoint" "outbound" {
  name      = "outbound-dns"
  direction = "OUTBOUND"
  security_group_ids = [aws_security_group.dns_resolver.id]

  ip_address {
    subnet_id = var.private_subnet_ids[0]
  }

  ip_address {
    subnet_id = var.private_subnet_ids[1]
  }
}

resource "aws_route53_resolver_rule" "on_prem" {
  domain_name          = "corp.example.com"
  name                 = "forward-to-on-prem"
  rule_type            = "FORWARD"
  resolver_endpoint_id = aws_route53_resolver_endpoint.outbound.id

  target_ip {
    ip   = var.on_prem_dns_ip_1
    port = 53
  }

  target_ip {
    ip   = var.on_prem_dns_ip_2
    port = 53
  }
}
```

### 19. DMARC TXT record
```hcl
resource "aws_route53_record" "dmarc" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "_dmarc.example.com"
  type    = "TXT"
  ttl     = 3600
  records = ["\"v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@example.com; pct=100\""]
}
```

### 20. DNSSEC
```hcl
resource "aws_route53_key_signing_key" "main" {
  hosted_zone_id             = aws_route53_zone.main.id
  key_management_service_arn = aws_kms_key.dnssec.arn
  name                       = "main-ksk"
}

resource "aws_route53_hosted_zone_dnssec" "main" {
  depends_on     = [aws_route53_key_signing_key.main]
  hosted_zone_id = aws_route53_key_signing_key.main.hosted_zone_id
}
```

### 21. Private zone with multiple VPC associations
```hcl
resource "aws_route53_zone" "internal" {
  name = "internal.corp"

  vpc {
    vpc_id = module.vpc_us_east.vpc_id
  }
}

resource "aws_route53_zone_association" "secondary" {
  zone_id = aws_route53_zone.internal.zone_id
  vpc_id  = module.vpc_eu_west.vpc_id
  vpc_region = "eu-west-1"
}
```

### 22. CloudWatch alarm-based health check
```hcl
resource "aws_cloudwatch_metric_alarm" "api_errors" {
  alarm_name          = "api-high-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "API 5XX errors exceeded threshold"
}

resource "aws_route53_health_check" "alb_alarm" {
  type                            = "CLOUDWATCH_METRIC"
  cloudwatch_alarm_name           = aws_cloudwatch_metric_alarm.api_errors.alarm_name
  cloudwatch_alarm_region         = "us-east-1"
  insufficient_data_health_status = "Healthy"
}
```

### 23. Route53 traffic policy (complex routing)
```hcl
resource "aws_route53_traffic_policy" "main" {
  name    = "failover-traffic-policy"
  comment = "Primary/secondary failover with health checks"

  document = jsonencode({
    AWSPolicyFormatVersion = "2015-10-01"
    RecordType             = "A"
    Endpoints = {
      primary   = { Type = "value", Value = "203.0.113.1" }
      secondary = { Type = "value", Value = "203.0.113.2" }
    }
    Rules = {
      main = {
        RuleType = "failover"
        Primary = { EndpointReference = "primary", HealthCheck = aws_route53_health_check.api.id }
        Secondary = { EndpointReference = "secondary" }
      }
    }
    StartRule = "main"
  })
}
```

### 24. Route53 for RDS private DNS
```hcl
resource "aws_route53_record" "db" {
  zone_id = aws_route53_zone.internal.zone_id
  name    = "db.internal.example.com"
  type    = "CNAME"
  ttl     = 60
  records = [aws_db_instance.main.address]
}

resource "aws_route53_record" "db_read" {
  zone_id = aws_route53_zone.internal.zone_id
  name    = "db-read.internal.example.com"
  type    = "CNAME"
  ttl     = 60
  records = [aws_rds_cluster.aurora.reader_endpoint]
}

resource "aws_route53_record" "cache" {
  zone_id = aws_route53_zone.internal.zone_id
  name    = "cache.internal.example.com"
  type    = "CNAME"
  ttl     = 60
  records = [aws_elasticache_replication_group.redis.primary_endpoint_address]
}
```

### 25. SRV record for service discovery
```hcl
resource "aws_route53_record" "srv" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "_https._tcp.api.example.com"
  type    = "SRV"
  ttl     = 300
  records = ["10 5 443 api.example.com."]
}
```

---

## Nested

### 26. Multi-region DNS module
```hcl
module "global_dns" {
  source = "./modules/route53-global"

  zone_name = "example.com"

  latency_records = {
    api = {
      name = "api.example.com"
      endpoints = {
        "us-east-1" = { alb_arn = module.alb_us.arn, alb_dns = module.alb_us.dns_name, alb_zone_id = module.alb_us.zone_id }
        "eu-west-1" = { alb_arn = module.alb_eu.arn, alb_dns = module.alb_eu.dns_name, alb_zone_id = module.alb_eu.zone_id }
        "ap-southeast-1" = { alb_arn = module.alb_ap.arn, alb_dns = module.alb_ap.dns_name, alb_zone_id = module.alb_ap.zone_id }
      }
      health_checks = {
        path     = "/health"
        port     = 443
        protocol = "HTTPS"
      }
    }
  }

  failover_records = {
    admin = {
      name              = "admin.example.com"
      primary_alb_dns   = module.alb_primary.dns_name
      primary_alb_zone  = module.alb_primary.zone_id
      secondary_alb_dns = module.alb_dr.dns_name
      secondary_alb_zone = module.alb_dr.zone_id
    }
  }

  weighted_records = {
    beta = {
      name    = "beta.example.com"
      targets = [
        { alb_dns = module.alb_stable.dns_name, alb_zone_id = module.alb_stable.zone_id, weight = 90 }
        { alb_dns = module.alb_canary.dns_name, alb_zone_id = module.alb_canary.zone_id, weight = 10 }
      ]
    }
  }

  enable_dnssec       = var.environment == "production"
  dnssec_kms_key_arn  = aws_kms_key.dnssec.arn
}
```

### 27. For_each routing records
```hcl
locals {
  services = {
    api      = { subdomain = "api",      alb = module.alb_api }
    web      = { subdomain = "app",      alb = module.alb_web }
    admin    = { subdomain = "admin",    alb = module.alb_admin }
    docs     = { subdomain = "docs",     alb = module.alb_docs }
  }
}

resource "aws_route53_record" "services" {
  for_each = local.services

  zone_id = aws_route53_zone.main.zone_id
  name    = "${each.value.subdomain}.example.com"
  type    = "A"

  alias {
    name                   = each.value.alb.dns_name
    zone_id                = each.value.alb.zone_id
    evaluate_target_health = true
  }
}
```

### 28. Route53 Application Recovery Controller (ARC)
```hcl
resource "aws_route53recoverycontrolconfig_cluster" "main" {
  name = "production-cluster"
}

resource "aws_route53recoverycontrolconfig_control_panel" "main" {
  name        = "main-control-panel"
  cluster_arn = aws_route53recoverycontrolconfig_cluster.main.arn
}

resource "aws_route53recoverycontrolconfig_routing_control" "us_east" {
  name              = "us-east-routing-control"
  cluster_arn       = aws_route53recoverycontrolconfig_cluster.main.arn
  control_panel_arn = aws_route53recoverycontrolconfig_control_panel.main.arn
}

resource "aws_route53_health_check" "arc" {
  type                            = "RECOVERY_CONTROL"
  routing_control_arn             = aws_route53recoverycontrolconfig_routing_control.us_east.arn
}
```

### 29. Private zone with cross-VPC access
```hcl
resource "aws_route53_zone" "shared" {
  name = "shared.internal"

  vpc {
    vpc_id = module.vpc_shared.vpc_id
  }

  lifecycle {
    ignore_changes = [vpc]  # Manage associations separately
  }
}

resource "aws_route53_zone_association" "workload_vpcs" {
  for_each   = toset(var.workload_vpc_ids)
  zone_id    = aws_route53_zone.shared.zone_id
  vpc_id     = each.value
}
```

### 30. Geoproximity routing
```hcl
resource "aws_route53_traffic_policy" "geoproximity" {
  name    = "geoproximity-routing"
  comment = "Route to nearest region with bias"

  document = jsonencode({
    AWSPolicyFormatVersion = "2015-10-01"
    RecordType             = "A"
    Endpoints = {
      us_east = { Type = "ELB", Region = "us-east-1", Value = aws_lb.us_east.dns_name }
      eu_west = { Type = "ELB", Region = "eu-west-1", Value = aws_lb.eu_west.dns_name }
    }
    Rules = {
      geoproximity = {
        RuleType = "geoproximity"
        GeoproximityLocations = [
          { Region = "us-east-1", Bias = 0, EndpointReference = "us_east" },
          { Region = "eu-west-1", Bias = 0, EndpointReference = "eu_west" }
        ]
      }
    }
    StartRule = "geoproximity"
  })
}
```

### 31. Route53 Resolver for hybrid DNS
```hcl
module "hybrid_dns" {
  source = "./modules/route53-hybrid"

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnet_ids

  on_prem_dns = {
    ips        = var.on_prem_dns_servers
    domains    = ["corp.example.com", "internal.example.org"]
  }

  aws_private_zones = [
    aws_route53_zone.internal.id,
    aws_route53_zone.services.id
  ]

  security_group_rules = {
    allowed_cidr = var.vpc_cidr
  }
}
```

### 32. DNS failover with health check and SNS notification
```hcl
resource "aws_route53_health_check" "primary_app" {
  fqdn              = aws_lb.primary.dns_name
  port              = 443
  type              = "HTTPS"
  resource_path     = "/health"
  failure_threshold = 2
  request_interval  = 10  # Fast health checks

  cloudwatch_alarm_name   = aws_cloudwatch_metric_alarm.app_health.alarm_name
  cloudwatch_alarm_region = "us-east-1"
  insufficient_data_health_status = "Failure"

  tags = { Name = "primary-app-health" }
}

resource "aws_cloudwatch_metric_alarm" "health_check_failed" {
  alarm_name          = "route53-health-check-failed"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  metric_name         = "HealthCheckStatus"
  namespace           = "AWS/Route53"
  period              = 60
  statistic           = "Minimum"
  threshold           = 1.0
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    HealthCheckId = aws_route53_health_check.primary_app.id
  }
}
```

### 33. Route53 Resolver DNS Firewall
```hcl
resource "aws_route53_resolver_firewall_domain_list" "blocklist" {
  name    = "malware-blocklist"
  domains = ["malware.example.com", "phishing.example.net"]
}

resource "aws_route53_resolver_firewall_rule_group" "main" {
  name = "main-firewall-rules"
}

resource "aws_route53_resolver_firewall_rule" "block_malware" {
  name                    = "block-malware"
  action                  = "BLOCK"
  block_response          = "NXDOMAIN"
  firewall_domain_list_id = aws_route53_resolver_firewall_domain_list.blocklist.id
  firewall_rule_group_id  = aws_route53_resolver_firewall_rule_group.main.id
  priority                = 100
}

resource "aws_route53_resolver_firewall_rule_group_association" "vpc" {
  firewall_rule_group_id = aws_route53_resolver_firewall_rule_group.main.id
  priority               = 100
  vpc_id                 = module.vpc.vpc_id
  name                   = "main-vpc-association"
}
```

---

## Advanced

### 34. Complete DNS architecture for multi-region
```hcl
module "dns_architecture" {
  source = "./modules/dns-full"

  apex_domain   = "example.com"
  account_id    = var.account_id
  org_id        = var.org_id
  environments  = ["production", "staging", "development"]

  zones = {
    public = {
      name         = "example.com"
      enable_dnssec = true
      kms_key_arn   = aws_kms_key.dnssec.arn
    }
    internal = {
      name        = "internal.example.com"
      private     = true
      vpc_ids     = module.vpc_ids
    }
    services = {
      name    = "svc.example.com"
      private = true
      vpc_ids = module.vpc_ids
    }
  }

  global_records = {
    apex_redirect = { name = "example.com",     target_www = true }
    www           = { name = "www.example.com", alb = "global" }
    api           = { name = "api.example.com", routing = "latency", regions = ["us-east-1", "eu-west-1"] }
    cdn           = { name = "cdn.example.com", cloudfront = true }
  }

  health_checks = {
    api = { fqdn = "api.example.com", path = "/health", protocol = "HTTPS", interval = 10 }
  }

  resolver = {
    enable_inbound  = true
    enable_outbound = true
    on_prem_domains = ["corp.mycompany.com"]
    on_prem_dns_ips = var.on_prem_dns_servers
    enable_firewall = true
    blocklists      = ["malware"]
  }

  tags = local.common_tags
}
```

### 35. Route53 ARC for multi-region failover
```hcl
module "arc_failover" {
  source = "./modules/arc"

  cluster_name  = "production"
  control_panels = ["main"]

  routing_controls = {
    us_east_1 = { region = "us-east-1", alb = module.alb_us.dns_name, alb_zone = module.alb_us.zone_id }
    eu_west_1 = { region = "eu-west-1", alb = module.alb_eu.dns_name, alb_zone = module.alb_eu.zone_id }
  }

  zone_id   = aws_route53_zone.main.zone_id
  dns_name  = "app.example.com"

  safety_rules = {
    minimum_healthy_regions = 1
    assertion_rule_wait_ms  = 5000
  }
}
```

### 36. Route53 with AWS Shield Advanced
```hcl
resource "aws_route53_health_check" "shield" {
  fqdn              = "app.example.com"
  port              = 443
  type              = "HTTPS"
  resource_path     = "/health"
  failure_threshold = 3
  request_interval  = 10

  regions = ["us-east-1", "eu-west-1", "ap-southeast-1"]  # Multi-region health check
}

resource "aws_shield_protection" "route53" {
  name         = "route53-health-check"
  resource_arn = "arn:aws:route53:::healthcheck/${aws_route53_health_check.shield.id}"
}
```

### 37. DNS-based service discovery
```hcl
resource "aws_service_discovery_private_dns_namespace" "main" {
  name = "services.local"
  vpc  = module.vpc.vpc_id
}

resource "aws_service_discovery_service" "api" {
  name = "api"

  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.main.id
    dns_records {
      ttl  = 10
      type = "SRV"
    }
    routing_policy = "WEIGHTED"
  }

  health_check_custom_config {
    failure_threshold = 1
  }
}
```

### 38. Route53 for ECS service discovery
```hcl
resource "aws_service_discovery_http_namespace" "ecs" {
  name = "ecs-services"
}

resource "aws_ecs_service" "api" {
  name            = "api"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = 3
  launch_type     = "FARGATE"

  network_configuration {
    subnets         = var.private_subnet_ids
    security_groups = [aws_security_group.api.id]
  }

  service_connect_configuration {
    enabled   = true
    namespace = aws_service_discovery_http_namespace.ecs.arn

    service {
      port_name      = "http"
      discovery_name = "api"
      client_alias {
        port     = 8080
        dns_name = "api"
      }
    }
  }
}
```

### 39. Automated DNS management with Lambda
```hcl
resource "aws_lambda_function" "dns_manager" {
  function_name = "route53-dns-manager"
  runtime       = "python3.12"
  handler       = "dns_manager.handler"
  role          = aws_iam_role.dns_manager.arn
  filename      = "dns-manager.zip"

  environment {
    variables = {
      ZONE_ID     = aws_route53_zone.main.zone_id
      HOSTED_ZONE = "example.com"
    }
  }
}

resource "aws_iam_role_policy" "dns_manager" {
  name = "route53-access"
  role = aws_iam_role.dns_manager.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["route53:ChangeResourceRecordSets", "route53:ListResourceRecordSets"]
      Resource = "arn:aws:route53:::hostedzone/${aws_route53_zone.main.zone_id}"
    }]
  })
}
```

### 40. Route53 query logging
```hcl
resource "aws_cloudwatch_log_group" "dns_queries" {
  name              = "/aws/route53/${aws_route53_zone.main.name}"
  retention_in_days = 30
}

data "aws_iam_policy_document" "route53_logging" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["route53.amazonaws.com"]
    }
    actions   = ["logs:CreateLogStream", "logs:PutLogEvents"]
    resources = ["${aws_cloudwatch_log_group.dns_queries.arn}:*"]
  }
}

resource "aws_cloudwatch_log_resource_policy" "route53" {
  policy_name     = "route53-query-logging"
  policy_document = data.aws_iam_policy_document.route53_logging.json
}

resource "aws_route53_query_log" "main" {
  depends_on = [aws_cloudwatch_log_resource_policy.route53]

  cloudwatch_log_group_arn = aws_cloudwatch_log_group.dns_queries.arn
  zone_id                  = aws_route53_zone.main.zone_id
}
```

### 41. Route53 with private CA for internal TLS
```hcl
resource "aws_acmpca_certificate_authority" "internal" {
  type = "ROOT"

  certificate_authority_configuration {
    key_algorithm     = "RSA_2048"
    signing_algorithm = "SHA256WITHRSA"

    subject {
      organization = "MyCompany"
      common_name  = "MyCompany Internal CA"
    }
  }

  permanent_deletion_time_in_days = 7
}

resource "aws_route53_record" "internal_service" {
  zone_id = aws_route53_zone.internal.zone_id
  name    = "api.internal.example.com"
  type    = "A"
  ttl     = 60
  records = [aws_instance.api.private_ip]
}
```

### 42. Split-horizon DNS
```hcl
# Public zone
resource "aws_route53_zone" "public" {
  name = "example.com"
}

resource "aws_route53_record" "public_api" {
  zone_id = aws_route53_zone.public.zone_id
  name    = "api.example.com"
  type    = "A"

  alias {
    name                   = aws_lb.public.dns_name
    zone_id                = aws_lb.public.zone_id
    evaluate_target_health = true
  }
}

# Private zone (same domain, different resolution inside VPC)
resource "aws_route53_zone" "private" {
  name = "example.com"

  vpc {
    vpc_id = module.vpc.vpc_id
  }
}

resource "aws_route53_record" "private_api" {
  zone_id = aws_route53_zone.private.zone_id
  name    = "api.example.com"
  type    = "A"

  alias {
    name                   = aws_lb.internal.dns_name
    zone_id                = aws_lb.internal.zone_id
    evaluate_target_health = true
  }
}
```

### 43. DNSSEC key rotation
```hcl
resource "aws_kms_key" "dnssec" {
  customer_master_key_spec = "ECC_NIST_P256"
  deletion_window_in_days  = 7
  key_usage                = "SIGN_VERIFY"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable root access"
        Effect = "Allow"
        Principal = { AWS = "arn:aws:iam::${var.account_id}:root" }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow Route53 DNSSEC"
        Effect = "Allow"
        Principal = { Service = "dnssec-route53.amazonaws.com" }
        Action   = ["kms:DescribeKey", "kms:GetPublicKey", "kms:Sign"]
        Resource = "*"
      }
    ]
  })
}
```

### 44. Route53 for Kubernetes ExternalDNS
```hcl
resource "aws_iam_policy" "external_dns" {
  name        = "external-dns"
  description = "Allow ExternalDNS to manage Route53 records"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["route53:ChangeResourceRecordSets"]
        Resource = "arn:aws:route53:::hostedzone/${aws_route53_zone.main.zone_id}"
      },
      {
        Effect   = "Allow"
        Action   = ["route53:ListHostedZones", "route53:ListResourceRecordSets", "route53:ListTagsForResource"]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role" "external_dns" {
  name = "external-dns"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Federated = aws_iam_openid_connect_provider.eks.arn }
      Action    = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "${replace(aws_eks_cluster.main.identity[0].oidc[0].issuer, "https://", "")}:sub" = "system:serviceaccount:kube-system:external-dns"
        }
      }
    }]
  })
}
```

### 45. Global Accelerator with Route53
```hcl
resource "aws_route53_record" "ga" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "fast.example.com"
  type    = "A"

  alias {
    name                   = aws_globalaccelerator_accelerator.main.dns_name
    zone_id                = "Z2BJ6XQ5FK7U4H"  # Global Accelerator fixed zone ID
    evaluate_target_health = true
  }
}
```

### 46. Terraform for_each ACM validation records
```hcl
resource "aws_acm_certificate" "wildcard" {
  provider          = aws.us_east_1
  domain_name       = "*.example.com"
  validation_method = "DNS"

  subject_alternative_names = [
    "example.com",
    "*.api.example.com",
    "*.internal.example.com"
  ]

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "wildcard_validation" {
  for_each = {
    for dvo in aws_acm_certificate.wildcard.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      type   = dvo.resource_record_type
      record = dvo.resource_record_value
    }
  }

  allow_overwrite = true
  zone_id         = aws_route53_zone.main.zone_id
  name            = each.value.name
  type            = each.value.type
  ttl             = 60
  records         = [each.value.record]
}
```

### 47. Route53 health check for ECS service
```hcl
resource "aws_route53_health_check" "ecs_service" {
  fqdn              = aws_lb.main.dns_name
  port              = 443
  type              = "HTTPS"
  resource_path     = "/api/health"
  failure_threshold = 3
  request_interval  = 10

  measure_latency = true

  tags = {
    Name = "ecs-api-health"
  }
}

resource "aws_cloudwatch_metric_alarm" "dns_health" {
  alarm_name          = "route53-health-check"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  metric_name         = "HealthCheckStatus"
  namespace           = "AWS/Route53"
  period              = 60
  statistic           = "Minimum"
  threshold           = 1.0
  alarm_actions       = [aws_sns_topic.pagerduty.arn]

  dimensions = {
    HealthCheckId = aws_route53_health_check.ecs_service.id
  }
}
```

### 48. Private zone for EKS pod DNS
```hcl
resource "aws_route53_zone" "eks" {
  name = "cluster.local"

  vpc {
    vpc_id = module.vpc.vpc_id
  }
}

# EKS uses CoreDNS internally — this is for custom internal records
resource "aws_route53_record" "eks_api" {
  zone_id = aws_route53_zone.eks.zone_id
  name    = "api.cluster.local"
  type    = "A"
  ttl     = 30
  records = [aws_lb.internal.private_ip]  # Internal NLB
}
```

### 49. Route53 for multi-account centralized DNS
```hcl
# In DNS account
resource "aws_route53_zone" "central" {
  name = "example.com"
}

# Share zone with workload accounts
resource "aws_ram_resource_share" "dns_zone" {
  name                      = "dns-zone-share"
  allow_external_principals = false
}

resource "aws_ram_resource_association" "zone" {
  resource_arn       = aws_route53_zone.central.arn
  resource_share_arn = aws_ram_resource_share.dns_zone.arn
}

resource "aws_ram_principal_association" "workload_accounts" {
  for_each           = toset(var.workload_account_ids)
  principal          = each.value
  resource_share_arn = aws_ram_resource_share.dns_zone.arn
}
```

### 50. Complete production DNS setup
```hcl
module "production_dns" {
  source = "./modules/dns-production"

  domain          = "example.com"
  account_id      = var.account_id
  environment     = "production"

  zones = {
    public  = { dnssec = true, kms_key_arn = aws_kms_key.dnssec.arn }
    private = { vpcs = [module.vpc_us.id, module.vpc_eu.id] }
  }

  records = {
    apex   = { type = "A",     alb = module.alb_primary, health_check = true }
    www    = { type = "CNAME", target = "example.com" }
    api    = { routing = "latency", regions = { "us-east-1" = module.alb_us, "eu-west-1" = module.alb_eu } }
    cdn    = { type = "A",     cloudfront = aws_cloudfront_distribution.main }
  }

  internal_records = {
    db       = aws_rds_cluster.aurora.endpoint
    db_read  = aws_rds_cluster.aurora.reader_endpoint
    cache    = aws_elasticache_replication_group.redis.primary_endpoint_address
  }

  health_checks = {
    api = { fqdn = "api.example.com", path = "/health", interval = 10, regions = 3 }
  }

  resolver = {
    enable          = true
    vpc_id          = module.vpc_us.id
    on_prem_domains = var.on_prem_domains
    on_prem_dns     = var.on_prem_dns_servers
    enable_firewall = true
  }

  query_logging    = true
  log_retention    = 90
  alert_topic_arn  = aws_sns_topic.alerts.arn

  tags = local.common_tags
}
```
