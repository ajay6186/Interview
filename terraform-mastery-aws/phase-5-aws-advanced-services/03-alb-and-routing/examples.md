# Examples 5.3 — ALB & Routing (50 examples)

---

## Basic

### 1. Application Load Balancer
```hcl
resource "aws_lb" "main" {
  name               = "app-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = var.public_subnet_ids

  enable_deletion_protection = true

  tags = { Name = "app-alb" }
}
```

### 2. Target group
```hcl
resource "aws_lb_target_group" "app" {
  name        = "app-tg"
  port        = 8080
  protocol    = "HTTP"
  vpc_id      = module.vpc.vpc_id
  target_type = "ip"

  health_check {
    path                = "/health"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    matcher             = "200"
  }
}
```

### 3. HTTP listener
```hcl
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = "redirect"
    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}
```

### 4. HTTPS listener with ACM certificate
```hcl
resource "aws_acm_certificate" "main" {
  domain_name       = "example.com"
  validation_method = "DNS"

  subject_alternative_names = ["*.example.com"]

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = aws_acm_certificate.main.arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}
```

### 5. Target group with stickiness
```hcl
resource "aws_lb_target_group" "sticky" {
  name     = "sticky-tg"
  port     = 8080
  protocol = "HTTP"
  vpc_id   = module.vpc.vpc_id

  stickiness {
    type            = "lb_cookie"
    cookie_duration = 86400  # 1 day
    enabled         = true
  }
}
```

### 6. ALB access logs
```hcl
resource "aws_lb" "main" {
  name               = "app-alb"
  load_balancer_type = "application"
  subnets            = var.public_subnet_ids
  security_groups    = [aws_security_group.alb.id]

  access_logs {
    bucket  = aws_s3_bucket.alb_logs.id
    prefix  = "alb-logs"
    enabled = true
  }
}
```

### 7. Network Load Balancer
```hcl
resource "aws_lb" "nlb" {
  name               = "app-nlb"
  internal           = false
  load_balancer_type = "network"
  subnets            = var.public_subnet_ids

  enable_cross_zone_load_balancing = true
}
```

### 8. Target group with slow start
```hcl
resource "aws_lb_target_group" "slow_start" {
  name     = "slow-start-tg"
  port     = 8080
  protocol = "HTTP"
  vpc_id   = module.vpc.vpc_id

  slow_start = 60  # 60-second warm-up period

  health_check {
    path    = "/health"
    matcher = "200"
  }
}
```

### 9. Fixed response action
```hcl
resource "aws_lb_listener_rule" "maintenance" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 999

  condition {
    path_pattern {
      values = ["/maintenance"]
    }
  }

  action {
    type = "fixed-response"
    fixed_response {
      content_type = "text/plain"
      message_body = "Service temporarily unavailable"
      status_code  = "503"
    }
  }
}
```

### 10. Deletion protection
```hcl
resource "aws_lb" "prod" {
  name                       = "prod-alb"
  load_balancer_type         = "application"
  subnets                    = var.public_subnet_ids
  security_groups            = [aws_security_group.alb.id]
  enable_deletion_protection = true
  drop_invalid_header_fields = true
}
```

### 11. Internal ALB
```hcl
resource "aws_lb" "internal" {
  name               = "internal-alb"
  internal           = true
  load_balancer_type = "application"
  subnets            = var.private_subnet_ids
  security_groups    = [aws_security_group.internal_alb.id]
}
```

### 12. Target group attachment
```hcl
resource "aws_lb_target_group_attachment" "app" {
  target_group_arn = aws_lb_target_group.app.arn
  target_id        = aws_instance.app.id
  port             = 8080
}
```

---

## Intermediate

### 13. Path-based routing
```hcl
resource "aws_lb_listener_rule" "api" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 10

  condition {
    path_pattern {
      values = ["/api/*"]
    }
  }

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }
}

resource "aws_lb_listener_rule" "static" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 20

  condition {
    path_pattern {
      values = ["/static/*", "/assets/*"]
    }
  }

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.static.arn
  }
}
```

### 14. Host-based routing
```hcl
resource "aws_lb_listener_rule" "api_host" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 1

  condition {
    host_header {
      values = ["api.example.com"]
    }
  }

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }
}

resource "aws_lb_listener_rule" "app_host" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 2

  condition {
    host_header {
      values = ["app.example.com"]
    }
  }

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.web.arn
  }
}
```

### 15. Weighted target groups
```hcl
resource "aws_lb_listener_rule" "canary" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 5

  condition {
    path_pattern {
      values = ["/*"]
    }
  }

  action {
    type = "forward"
    forward {
      target_group {
        arn    = aws_lb_target_group.stable.arn
        weight = 90
      }
      target_group {
        arn    = aws_lb_target_group.canary.arn
        weight = 10
      }
      stickiness {
        enabled  = true
        duration = 300
      }
    }
  }
}
```

### 16. Header-based routing
```hcl
resource "aws_lb_listener_rule" "mobile" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 15

  condition {
    http_header {
      http_header_name = "X-Client-Type"
      values           = ["mobile", "tablet"]
    }
  }

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.mobile.arn
  }
}
```

### 17. Query string routing
```hcl
resource "aws_lb_listener_rule" "version" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 25

  condition {
    query_string {
      key   = "version"
      value = "v2"
    }
  }

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.v2.arn
  }
}
```

### 18. Cognito authentication
```hcl
resource "aws_lb_listener_rule" "authenticated" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 1

  condition {
    path_pattern {
      values = ["/dashboard/*", "/admin/*"]
    }
  }

  action {
    type = "authenticate-cognito"
    authenticate_cognito {
      user_pool_arn       = aws_cognito_user_pool.main.arn
      user_pool_client_id = aws_cognito_user_pool_client.alb.id
      user_pool_domain    = aws_cognito_user_pool_domain.main.domain
      on_unauthenticated_request = "authenticate"
      session_timeout     = 3600
    }
  }

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}
```

### 19. Multiple SSL certificates (SNI)
```hcl
resource "aws_lb_listener_certificate" "additional" {
  listener_arn    = aws_lb_listener.https.arn
  certificate_arn = aws_acm_certificate.additional_domain.arn
}
```

### 20. WAF integration
```hcl
resource "aws_wafv2_web_acl_association" "alb" {
  resource_arn = aws_lb.main.arn
  web_acl_arn  = aws_wafv2_web_acl.main.arn
}
```

### 21. ALB with Lambda target
```hcl
resource "aws_lb_target_group" "lambda" {
  name        = "lambda-tg"
  target_type = "lambda"

  lambda_multi_value_headers_enabled = true

  health_check {
    enabled = false
  }
}

resource "aws_lambda_permission" "alb" {
  statement_id  = "AllowALB"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api.function_name
  principal     = "elasticloadbalancing.amazonaws.com"
  source_arn    = aws_lb_target_group.lambda.arn
}

resource "aws_lb_target_group_attachment" "lambda" {
  target_group_arn = aws_lb_target_group.lambda.arn
  target_id        = aws_lambda_function.api.arn
  depends_on       = [aws_lambda_permission.alb]
}
```

### 22. Cross-zone load balancing
```hcl
resource "aws_lb" "multi_az" {
  name               = "multi-az-alb"
  load_balancer_type = "application"
  subnets            = var.public_subnet_ids  # At least 2 AZs
  security_groups    = [aws_security_group.alb.id]

  # Cross-zone is enabled by default for ALB
  # Explicitly set for clarity:
  enable_cross_zone_load_balancing = true
}
```

### 23. ALB connection timeout
```hcl
resource "aws_lb" "main" {
  name               = "app-alb"
  load_balancer_type = "application"
  subnets            = var.public_subnet_ids
  security_groups    = [aws_security_group.alb.id]

  idle_timeout = 60  # seconds (default 60, max 4000)
}
```

### 24. HTTP/2 and gRPC support
```hcl
resource "aws_lb_target_group" "grpc" {
  name             = "grpc-tg"
  port             = 50051
  protocol         = "HTTP"
  protocol_version = "GRPC"
  vpc_id           = module.vpc.vpc_id

  health_check {
    path     = "/grpc.health.v1.Health/Check"
    protocol = "HTTP"
    matcher  = "0"  # gRPC success code
  }
}
```

### 25. ALB with desync mitigation
```hcl
resource "aws_lb" "secure" {
  name               = "secure-alb"
  load_balancer_type = "application"
  subnets            = var.public_subnet_ids
  security_groups    = [aws_security_group.alb.id]

  desync_mitigation_mode     = "strictest"
  drop_invalid_header_fields = true
  preserve_host_header       = false
}
```

---

## Nested

### 26. Multi-service ALB routing module
```hcl
module "alb_routing" {
  source = "./modules/alb"

  name        = "production"
  environment = "prod"

  vpc_id          = module.vpc.vpc_id
  public_subnets  = module.vpc.public_subnet_ids
  certificate_arn = aws_acm_certificate.main.arn

  services = {
    api = {
      host     = "api.example.com"
      path     = "/api/*"
      priority = 10
      target_group = {
        port        = 8080
        target_type = "ip"
        health_path = "/api/health"
      }
    }
    web = {
      host     = "app.example.com"
      path     = "/*"
      priority = 100
      target_group = {
        port        = 3000
        target_type = "ip"
        health_path = "/"
      }
    }
    admin = {
      host     = "admin.example.com"
      path     = "/*"
      priority = 50
      require_auth = true
      cognito = {
        user_pool_arn    = aws_cognito_user_pool.admin.arn
        client_id        = aws_cognito_user_pool_client.admin.id
        domain           = aws_cognito_user_pool_domain.main.domain
      }
      target_group = {
        port        = 8081
        target_type = "ip"
        health_path = "/health"
      }
    }
  }

  waf_acl_arn    = aws_wafv2_web_acl.main.arn
  log_bucket_id  = aws_s3_bucket.alb_logs.id
  tags           = local.common_tags
}
```

### 27. Dynamic listener rules with for_each
```hcl
variable "routing_rules" {
  type = list(object({
    priority    = number
    path        = string
    host        = optional(string)
    target_group = string
  }))
}

resource "aws_lb_listener_rule" "dynamic" {
  for_each     = { for r in var.routing_rules : r.priority => r }
  listener_arn = aws_lb_listener.https.arn
  priority     = each.key

  dynamic "condition" {
    for_each = each.value.path != null ? [each.value.path] : []
    content {
      path_pattern {
        values = [condition.value]
      }
    }
  }

  dynamic "condition" {
    for_each = each.value.host != null ? [each.value.host] : []
    content {
      host_header {
        values = [condition.value]
      }
    }
  }

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.services[each.value.target_group].arn
  }
}
```

### 28. Blue-green ALB switching
```hcl
locals {
  active_color = var.active_deployment  # "blue" or "green"
}

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = aws_acm_certificate.main.arn

  default_action {
    type             = "forward"
    target_group_arn = local.active_color == "blue" ? aws_lb_target_group.blue.arn : aws_lb_target_group.green.arn
  }

  lifecycle {
    ignore_changes = [default_action]  # Managed by CI/CD
  }
}

resource "aws_lb_target_group" "blue" {
  name        = "app-blue"
  port        = 8080
  protocol    = "HTTP"
  vpc_id      = module.vpc.vpc_id
  target_type = "ip"

  health_check {
    path    = "/health"
    matcher = "200"
  }
}

resource "aws_lb_target_group" "green" {
  name        = "app-green"
  port        = 8080
  protocol    = "HTTP"
  vpc_id      = module.vpc.vpc_id
  target_type = "ip"

  health_check {
    path    = "/health"
    matcher = "200"
  }
}
```

### 29. ALB with microservices routing
```hcl
locals {
  microservices = {
    users    = { port = 8081, path = "/users/*",    priority = 10 }
    products = { port = 8082, path = "/products/*", priority = 20 }
    orders   = { port = 8083, path = "/orders/*",   priority = 30 }
    payments = { port = 8084, path = "/payments/*", priority = 40 }
  }
}

resource "aws_lb_target_group" "services" {
  for_each    = local.microservices
  name        = "svc-${each.key}"
  port        = each.value.port
  protocol    = "HTTP"
  vpc_id      = module.vpc.vpc_id
  target_type = "ip"

  health_check {
    path    = "/${each.key}/health"
    matcher = "200"
  }
}

resource "aws_lb_listener_rule" "services" {
  for_each     = local.microservices
  listener_arn = aws_lb_listener.https.arn
  priority     = each.value.priority

  condition {
    path_pattern {
      values = [each.value.path]
    }
  }

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.services[each.key].arn
  }
}
```

### 30. ALB with rate limiting via WAF
```hcl
resource "aws_wafv2_web_acl" "api_protection" {
  name  = "api-rate-limiting"
  scope = "REGIONAL"

  default_action { allow {} }

  rule {
    name     = "RateLimit"
    priority = 1
    action { block {} }

    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"

        scope_down_statement {
          byte_match_statement {
            field_to_match { uri_path {} }
            positional_constraint = "STARTS_WITH"
            search_string         = "/api/"
            text_transformation {
              priority = 0
              type     = "NONE"
            }
          }
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "APIRateLimit"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "APIWebACL"
    sampled_requests_enabled   = true
  }
}
```

### 31. ALB with response headers policy
```hcl
resource "aws_lb_listener_rule" "security_headers" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 1

  condition {
    path_pattern {
      values = ["/*"]
    }
  }

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}

# Security headers via Lambda@Edge or WAF custom response
resource "aws_wafv2_web_acl" "headers" {
  name  = "security-headers"
  scope = "REGIONAL"

  custom_response_body {
    key          = "security-headers"
    content      = ""
    content_type = "TEXT_PLAIN"
  }

  default_action { allow {} }

  visibility_config {
    cloudwatch_metrics_enabled = false
    metric_name                = "headers"
    sampled_requests_enabled   = false
  }
}
```

### 32. Shared ALB across accounts (via PrivateLink)
```hcl
resource "aws_vpc_endpoint_service" "alb" {
  acceptance_required        = true
  network_load_balancer_arns = [aws_lb.nlb.arn]

  allowed_principals = [
    "arn:aws:iam::${var.consumer_account_id}:root"
  ]
}
```

### 33. ALB with geo-restriction via WAF
```hcl
resource "aws_wafv2_web_acl" "geo_restricted" {
  name  = "geo-restricted"
  scope = "REGIONAL"

  default_action { allow {} }

  rule {
    name     = "BlockCountries"
    priority = 1
    action { block {} }

    statement {
      geo_match_statement {
        country_codes = ["CN", "RU", "KP"]
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "GeoBlock"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "GeoACL"
    sampled_requests_enabled   = true
  }
}
```

---

## Advanced

### 34. Complete ALB module for production
```hcl
module "alb_production" {
  source = "./modules/alb-production"

  name        = "api-gateway"
  environment = "production"

  networking = {
    vpc_id         = module.vpc.vpc_id
    public_subnets = module.vpc.public_subnet_ids
  }

  ssl = {
    certificate_arn    = aws_acm_certificate.main.arn
    policy             = "ELBSecurityPolicy-TLS13-1-2-2021-06"
    additional_certs   = [aws_acm_certificate.api.arn, aws_acm_certificate.admin.arn]
  }

  security = {
    waf_acl_arn                = aws_wafv2_web_acl.main.arn
    drop_invalid_headers       = true
    desync_mitigation_mode     = "strictest"
    deletion_protection        = true
  }

  access_logs = {
    enabled   = true
    bucket_id = aws_s3_bucket.alb_logs.id
    prefix    = "api-gateway"
  }

  targets = local.service_routing

  alarms = {
    target_response_time_threshold = 1.0
    error_rate_threshold           = 5
    unhealthy_hosts_threshold      = 1
    alert_topic_arn                = aws_sns_topic.alerts.arn
  }

  tags = local.common_tags
}
```

### 35. ALB CloudWatch comprehensive monitoring
```hcl
resource "aws_cloudwatch_dashboard" "alb" {
  dashboard_name = "alb-monitoring"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          title   = "Request Count"
          metrics = [["AWS/ApplicationELB", "RequestCount", "LoadBalancer", aws_lb.main.arn_suffix]]
          period  = 60
          stat    = "Sum"
        }
      },
      {
        type = "metric"
        properties = {
          title = "Target Response Time"
          metrics = [
            ["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", aws_lb.main.arn_suffix, { stat = "p50" }],
            ["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", aws_lb.main.arn_suffix, { stat = "p95" }],
            ["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", aws_lb.main.arn_suffix, { stat = "p99" }]
          ]
          period = 60
        }
      },
      {
        type = "metric"
        properties = {
          title = "5XX Errors"
          metrics = [
            ["AWS/ApplicationELB", "HTTPCode_ELB_5XX_Count", "LoadBalancer", aws_lb.main.arn_suffix],
            ["AWS/ApplicationELB", "HTTPCode_Target_5XX_Count", "LoadBalancer", aws_lb.main.arn_suffix]
          ]
          period = 60
          stat   = "Sum"
        }
      }
    ]
  })
}

resource "aws_cloudwatch_metric_alarm" "high_latency" {
  alarm_name          = "alb-high-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  extended_statistic  = "p99"
  threshold           = 2.0  # 2 seconds
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }
}
```

### 36. ALB with IP-based allowlist
```hcl
resource "aws_wafv2_ip_set" "allowlist" {
  name               = "corporate-ips"
  scope              = "REGIONAL"
  ip_address_version = "IPV4"

  addresses = var.allowed_cidr_blocks
}

resource "aws_wafv2_web_acl" "allowlist" {
  name  = "ip-allowlist"
  scope = "REGIONAL"

  default_action { block {} }  # Block by default

  rule {
    name     = "AllowKnownIPs"
    priority = 1
    action { allow {} }

    statement {
      ip_set_reference_statement {
        arn = aws_wafv2_ip_set.allowlist.arn
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AllowedIPs"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "IPAllowlist"
    sampled_requests_enabled   = true
  }
}
```

### 37. ALB with mutual TLS (mTLS)
```hcl
resource "aws_lb_trust_store" "client_ca" {
  name                             = "client-ca-store"
  ca_certificates_bundle_s3_bucket = aws_s3_bucket.certs.id
  ca_certificates_bundle_s3_key    = "ca-bundle.pem"
}

resource "aws_lb_listener" "mtls" {
  load_balancer_arn = aws_lb.main.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = aws_acm_certificate.main.arn

  mutual_authentication {
    mode            = "verify"
    trust_store_arn = aws_lb_trust_store.client_ca.arn
  }

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}
```

### 38. Global Accelerator with ALB
```hcl
resource "aws_globalaccelerator_accelerator" "main" {
  name            = "global-app"
  ip_address_type = "IPV4"
  enabled         = true

  attributes {
    flow_logs_enabled   = true
    flow_logs_s3_bucket = aws_s3_bucket.ga_logs.id
    flow_logs_s3_prefix = "global-accelerator/"
  }
}

resource "aws_globalaccelerator_listener" "https" {
  accelerator_arn = aws_globalaccelerator_accelerator.main.id
  protocol        = "TCP"

  port_range {
    from_port = 443
    to_port   = 443
  }
}

resource "aws_globalaccelerator_endpoint_group" "us_east" {
  listener_arn          = aws_globalaccelerator_listener.https.id
  endpoint_group_region = "us-east-1"

  endpoint_configuration {
    endpoint_id = aws_lb.us_east.arn
    weight      = 100
    client_ip_preservation_enabled = true
  }

  health_check_path             = "/health"
  health_check_protocol         = "HTTPS"
  health_check_interval_seconds = 10
  threshold_count               = 2
}
```

### 39. ALB with advanced request routing (composite conditions)
```hcl
resource "aws_lb_listener_rule" "advanced" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 5

  # Route mobile users to v2 API for path /api
  condition {
    http_header {
      http_header_name = "User-Agent"
      values           = ["*Mobile*", "*Android*", "*iPhone*"]
    }
  }

  condition {
    path_pattern {
      values = ["/api/*"]
    }
  }

  condition {
    query_string {
      key   = "v"
      value = "2"
    }
  }

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api_v2_mobile.arn
  }
}
```

### 40. ALB with StickySession and consistent hashing
```hcl
resource "aws_lb_target_group" "stateful" {
  name        = "stateful-tg"
  port        = 8080
  protocol    = "HTTP"
  vpc_id      = module.vpc.vpc_id
  target_type = "ip"

  load_balancing_algorithm_type = "least_outstanding_requests"

  stickiness {
    type            = "app_cookie"
    cookie_name     = "SERVERID"
    cookie_duration = 3600
    enabled         = true
  }

  health_check {
    path                = "/health"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    interval            = 15
    matcher             = "200"
  }
}
```

### 41. ALB with AWS Shield Advanced
```hcl
resource "aws_shield_protection" "alb" {
  name         = "alb-shield"
  resource_arn = aws_lb.main.arn
}

resource "aws_shield_protection_group" "alb_group" {
  protection_group_id = "alb-protection-group"
  aggregation         = "MAX"
  pattern             = "ARBITRARY"
  members             = [aws_lb.main.arn]
}
```

### 42. ALB cost optimization with connection reuse
```hcl
resource "aws_lb_target_group" "optimized" {
  name        = "optimized-tg"
  port        = 8080
  protocol    = "HTTP"
  vpc_id      = module.vpc.vpc_id
  target_type = "ip"

  # Keep connections to targets alive to reduce overhead
  connection_termination = false

  deregistration_delay = 30  # Faster drain for ECS tasks

  health_check {
    path                = "/health"
    healthy_threshold   = 2
    unhealthy_threshold = 2
    interval            = 10
    timeout             = 5
    matcher             = "200"
  }
}
```

### 43. ALB with advanced anomaly detection
```hcl
resource "aws_wafv2_web_acl" "anomaly_detection" {
  name  = "anomaly-detection"
  scope = "REGIONAL"

  default_action { allow {} }

  rule {
    name     = "AWSManagedRulesAmazonIpReputationList"
    priority = 1
    override_action { none {} }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesAmazonIpReputationList"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSIpRep"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 2
    override_action { none {} }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSCommon"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "AnomalyDetection"
    sampled_requests_enabled   = true
  }
}
```

### 44. ALB with target group weighting for A/B testing
```hcl
locals {
  feature_flag_weights = {
    control  = 70
    variant_a = 20
    variant_b = 10
  }
}

resource "aws_lb_listener_rule" "ab_test" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 50

  condition {
    path_pattern {
      values = ["/checkout/*"]
    }
  }

  action {
    type = "forward"
    forward {
      dynamic "target_group" {
        for_each = local.feature_flag_weights
        content {
          arn    = aws_lb_target_group.variants[target_group.key].arn
          weight = target_group.value
        }
      }
      stickiness {
        enabled  = true
        duration = 86400  # Keep user on same variant for 1 day
      }
    }
  }
}
```

### 45. ALB with IP address targeting (hybrid)
```hcl
resource "aws_lb_target_group" "on_premises" {
  name        = "on-prem-servers"
  port        = 8080
  protocol    = "HTTP"
  vpc_id      = module.vpc.vpc_id
  target_type = "ip"  # Supports IPs outside VPC via Direct Connect/VPN

  health_check {
    path    = "/health"
    matcher = "200"
  }
}

resource "aws_lb_target_group_attachment" "on_prem" {
  for_each         = toset(var.on_prem_server_ips)
  target_group_arn = aws_lb_target_group.on_premises.arn
  target_id        = each.value
  port             = 8080
  availability_zone = "all"  # Required for IPs outside VPC
}
```

### 46. ALB with custom error pages from S3
```hcl
resource "aws_lb_listener_rule" "custom_404" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 998

  condition {
    path_pattern {
      values = ["/error-pages/*"]
    }
  }

  action {
    type = "redirect"
    redirect {
      host        = aws_s3_bucket.error_pages.bucket_regional_domain_name
      path        = "/#{path}"
      status_code = "HTTP_302"
    }
  }
}
```

### 47. Multi-region ALB with Terraform
```hcl
module "alb_us_east" {
  source    = "./modules/alb"
  providers = { aws = aws }

  name            = "app-us-east"
  vpc_id          = module.vpc_us_east.vpc_id
  subnet_ids      = module.vpc_us_east.public_subnet_ids
  certificate_arn = aws_acm_certificate.us_east.arn
  services        = local.services
}

module "alb_eu_west" {
  source    = "./modules/alb"
  providers = { aws = aws.eu_west }

  name            = "app-eu-west"
  vpc_id          = module.vpc_eu_west.vpc_id
  subnet_ids      = module.vpc_eu_west.public_subnet_ids
  certificate_arn = aws_acm_certificate.eu_west.arn
  services        = local.services
}
```

### 48. ALB target health alerts
```hcl
resource "aws_cloudwatch_metric_alarm" "unhealthy_hosts" {
  for_each = {
    api  = aws_lb_target_group.api.arn_suffix
    web  = aws_lb_target_group.web.arn_suffix
  }

  alarm_name          = "unhealthy-hosts-${each.key}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Average"
  threshold           = 0
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
    TargetGroup  = each.value
  }
}
```

### 49. ALB with OIDC (OpenID Connect) authentication
```hcl
resource "aws_lb_listener_rule" "oidc_auth" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 1

  condition {
    path_pattern { values = ["/internal/*"] }
  }

  action {
    type = "authenticate-oidc"
    authenticate_oidc {
      authorization_endpoint     = "https://accounts.google.com/o/oauth2/auth"
      client_id                  = var.google_client_id
      client_secret              = var.google_client_secret
      issuer                     = "https://accounts.google.com"
      token_endpoint             = "https://oauth2.googleapis.com/token"
      user_info_endpoint         = "https://openidconnect.googleapis.com/v1/userinfo"
      on_unauthenticated_request = "authenticate"
      scope                      = "openid email profile"
      session_cookie_name        = "AWSELBAuthSessionCookie"
      session_timeout            = 3600
    }
  }

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.internal.arn
  }
}
```

### 50. Complete production ALB with all best practices
```hcl
module "production_alb" {
  source = "./modules/alb-full"

  name        = "production"
  account_id  = var.account_id
  region      = "us-east-1"
  environment = "production"

  networking = {
    vpc_id              = module.vpc.vpc_id
    public_subnet_ids   = module.vpc.public_subnet_ids
    internal            = false
    enable_ipv6         = false
  }

  ssl = {
    primary_cert_arn   = aws_acm_certificate.main.arn
    additional_certs   = [for cert in aws_acm_certificate.alt : cert.arn]
    tls_policy         = "ELBSecurityPolicy-TLS13-1-2-2021-06"
    mtls_enabled       = false
  }

  security = {
    waf_acl_arn              = aws_wafv2_web_acl.production.arn
    shield_advanced          = true
    drop_invalid_headers     = true
    desync_mitigation_mode   = "strictest"
    deletion_protection      = true
  }

  routing = {
    default_action = "fixed-response"
    default_response_code = "404"
    rules = local.routing_rules
  }

  access_logs = {
    enabled         = true
    bucket_id       = aws_s3_bucket.alb_logs.id
    prefix          = "production-alb"
    retention_days  = 90
  }

  monitoring = {
    p50_threshold_seconds  = 0.5
    p99_threshold_seconds  = 2.0
    error_rate_threshold   = 1.0
    unhealthy_host_count   = 0
    alert_topic_arn        = aws_sns_topic.alerts.arn
    dashboard_enabled      = true
  }

  idle_timeout   = 60
  tags           = local.common_tags
}
```
