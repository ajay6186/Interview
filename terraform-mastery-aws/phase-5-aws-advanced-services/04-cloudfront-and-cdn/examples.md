# Examples 5.4 — CloudFront & CDN (50 examples)

---

## Basic

### 1. Simple CloudFront distribution
```hcl
resource "aws_cloudfront_distribution" "main" {
  enabled         = true
  is_ipv6_enabled = true
  price_class     = "PriceClass_100"

  origin {
    domain_name = aws_s3_bucket.website.bucket_regional_domain_name
    origin_id   = "S3Origin"
  }

  default_cache_behavior {
    target_origin_id       = "S3Origin"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]

    forwarded_values {
      query_string = false
      cookies { forward = "none" }
    }
  }

  restrictions {
    geo_restriction { restriction_type = "none" }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}
```

### 2. S3 origin with OAC (Origin Access Control)
```hcl
resource "aws_cloudfront_origin_access_control" "s3" {
  name                              = "s3-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_s3_bucket_policy" "cf_access" {
  bucket = aws_s3_bucket.website.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "cloudfront.amazonaws.com" }
      Action    = "s3:GetObject"
      Resource  = "${aws_s3_bucket.website.arn}/*"
      Condition = {
        StringEquals = { "AWS:SourceArn" = aws_cloudfront_distribution.main.arn }
      }
    }]
  })
}
```

### 3. Custom origin (ALB)
```hcl
resource "aws_cloudfront_distribution" "alb" {
  enabled = true

  origin {
    domain_name = aws_lb.main.dns_name
    origin_id   = "ALBOrigin"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }

    custom_header {
      name  = "X-Custom-Header"
      value = var.origin_secret
    }
  }

  default_cache_behavior {
    target_origin_id       = "ALBOrigin"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods         = ["GET", "HEAD"]

    forwarded_values {
      query_string = true
      headers      = ["Authorization", "Accept"]
      cookies { forward = "all" }
    }

    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 0
  }

  restrictions {
    geo_restriction { restriction_type = "none" }
  }

  viewer_certificate {
    acm_certificate_arn = aws_acm_certificate.main.arn
    ssl_support_method  = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
}
```

### 4. Price class
```hcl
resource "aws_cloudfront_distribution" "regional" {
  price_class = "PriceClass_100"  # US, Canada, Europe only (cheapest)
  # PriceClass_200 = above + Asia/Africa/MiddleEast
  # PriceClass_All = all edge locations (most expensive)
  enabled = true

  origin {
    domain_name = aws_s3_bucket.website.bucket_regional_domain_name
    origin_id   = "S3"
    origin_access_control_id = aws_cloudfront_origin_access_control.s3.id
  }

  default_cache_behavior {
    target_origin_id       = "S3"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    forwarded_values {
      query_string = false
      cookies { forward = "none" }
    }
  }

  restrictions { geo_restriction { restriction_type = "none" } }
  viewer_certificate { cloudfront_default_certificate = true }
}
```

### 5. Geo restriction
```hcl
resource "aws_cloudfront_distribution" "geo_restricted" {
  enabled = true

  origin {
    domain_name = aws_s3_bucket.website.bucket_regional_domain_name
    origin_id   = "S3"
    origin_access_control_id = aws_cloudfront_origin_access_control.s3.id
  }

  default_cache_behavior {
    target_origin_id       = "S3"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    forwarded_values {
      query_string = false
      cookies { forward = "none" }
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "whitelist"
      locations        = ["US", "CA", "GB", "DE", "FR"]
    }
  }

  viewer_certificate { cloudfront_default_certificate = true }
}
```

### 6. Custom error responses
```hcl
resource "aws_cloudfront_distribution" "spa" {
  enabled = true

  origin {
    domain_name = aws_s3_bucket.website.bucket_regional_domain_name
    origin_id   = "S3"
    origin_access_control_id = aws_cloudfront_origin_access_control.s3.id
  }

  default_cache_behavior {
    target_origin_id       = "S3"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    forwarded_values {
      query_string = false
      cookies { forward = "none" }
    }
  }

  # SPA routing: return index.html for 404s
  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 10
  }

  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 10
  }

  restrictions { geo_restriction { restriction_type = "none" } }
  viewer_certificate { cloudfront_default_certificate = true }
}
```

### 7. Access logging
```hcl
resource "aws_cloudfront_distribution" "logged" {
  enabled = true

  logging_config {
    bucket          = aws_s3_bucket.cf_logs.bucket_domain_name
    prefix          = "cloudfront/"
    include_cookies = false
  }

  origin {
    domain_name = aws_s3_bucket.website.bucket_regional_domain_name
    origin_id   = "S3"
    origin_access_control_id = aws_cloudfront_origin_access_control.s3.id
  }

  default_cache_behavior {
    target_origin_id       = "S3"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    forwarded_values { query_string = false; cookies { forward = "none" } }
  }

  restrictions { geo_restriction { restriction_type = "none" } }
  viewer_certificate { cloudfront_default_certificate = true }
}
```

### 8. CloudFront with custom domain and ACM cert
```hcl
# ACM certificate must be in us-east-1 for CloudFront
resource "aws_acm_certificate" "cdn" {
  provider          = aws.us_east_1
  domain_name       = "cdn.example.com"
  validation_method = "DNS"
}

resource "aws_cloudfront_distribution" "cdn" {
  enabled     = true
  aliases     = ["cdn.example.com"]

  origin {
    domain_name = aws_s3_bucket.assets.bucket_regional_domain_name
    origin_id   = "Assets"
    origin_access_control_id = aws_cloudfront_origin_access_control.s3.id
  }

  default_cache_behavior {
    target_origin_id       = "Assets"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    forwarded_values { query_string = false; cookies { forward = "none" } }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.cdn.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  restrictions { geo_restriction { restriction_type = "none" } }
}
```

### 9. Default root object
```hcl
resource "aws_cloudfront_distribution" "website" {
  enabled             = true
  default_root_object = "index.html"

  origin {
    domain_name = aws_s3_bucket.website.bucket_regional_domain_name
    origin_id   = "S3"
    origin_access_control_id = aws_cloudfront_origin_access_control.s3.id
  }

  default_cache_behavior {
    target_origin_id       = "S3"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    forwarded_values { query_string = false; cookies { forward = "none" } }
  }

  restrictions { geo_restriction { restriction_type = "none" } }
  viewer_certificate { cloudfront_default_certificate = true }
}
```

### 10. Cache invalidation via CLI
```bash
# Invalidate all files
aws cloudfront create-invalidation \
  --distribution-id E1234567890ABC \
  --paths "/*"

# Invalidate specific paths
aws cloudfront create-invalidation \
  --distribution-id E1234567890ABC \
  --paths "/index.html" "/api/*"
```

### 11. Invalidation via Terraform null_resource
```hcl
resource "null_resource" "invalidate" {
  triggers = {
    version = var.app_version
  }

  provisioner "local-exec" {
    command = "aws cloudfront create-invalidation --distribution-id ${aws_cloudfront_distribution.main.id} --paths '/*'"
  }

  depends_on = [aws_cloudfront_distribution.main]
}
```

### 12. CloudFront outputs
```hcl
output "cdn_domain" {
  value = aws_cloudfront_distribution.main.domain_name
}

output "cdn_hosted_zone_id" {
  value = aws_cloudfront_distribution.main.hosted_zone_id
}

output "distribution_id" {
  value = aws_cloudfront_distribution.main.id
}
```

---

## Intermediate

### 13. Multiple cache behaviors (path patterns)
```hcl
resource "aws_cloudfront_distribution" "multi_behavior" {
  enabled = true

  origin {
    domain_name = aws_s3_bucket.website.bucket_regional_domain_name
    origin_id   = "S3Static"
    origin_access_control_id = aws_cloudfront_origin_access_control.s3.id
  }

  origin {
    domain_name = aws_lb.api.dns_name
    origin_id   = "APIOrigin"
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # API: no caching, pass everything
  ordered_cache_behavior {
    path_pattern           = "/api/*"
    target_origin_id       = "APIOrigin"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods         = ["GET", "HEAD"]
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0
    forwarded_values {
      query_string = true
      headers      = ["Authorization", "Content-Type"]
      cookies { forward = "all" }
    }
    compress = true
  }

  # Static assets: long-term caching
  ordered_cache_behavior {
    path_pattern           = "/static/*"
    target_origin_id       = "S3Static"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    min_ttl                = 86400
    default_ttl            = 604800  # 1 week
    max_ttl                = 31536000  # 1 year
    forwarded_values {
      query_string = false
      cookies { forward = "none" }
    }
    compress = true
  }

  # Default: SPA
  default_cache_behavior {
    target_origin_id       = "S3Static"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
    forwarded_values {
      query_string = false
      cookies { forward = "none" }
    }
    compress = true
  }

  restrictions { geo_restriction { restriction_type = "none" } }
  viewer_certificate { cloudfront_default_certificate = true }
}
```

### 14. CloudFront Functions (viewer-request)
```hcl
resource "aws_cloudfront_function" "redirect" {
  name    = "url-normalizer"
  runtime = "cloudfront-js-2.0"
  comment = "Normalize URLs and add trailing slash"
  publish = true

  code = <<-JS
    function handler(event) {
      var request = event.request;
      var uri = request.uri;

      // Redirect to index.html for directories
      if (uri.endsWith('/')) {
        request.uri += 'index.html';
      } else if (!uri.includes('.')) {
        request.uri += '/index.html';
      }

      return request;
    }
  JS
}

resource "aws_cloudfront_distribution" "with_function" {
  enabled = true

  origin {
    domain_name = aws_s3_bucket.website.bucket_regional_domain_name
    origin_id   = "S3"
    origin_access_control_id = aws_cloudfront_origin_access_control.s3.id
  }

  default_cache_behavior {
    target_origin_id       = "S3"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    forwarded_values { query_string = false; cookies { forward = "none" } }

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.redirect.arn
    }
  }

  restrictions { geo_restriction { restriction_type = "none" } }
  viewer_certificate { cloudfront_default_certificate = true }
}
```

### 15. WAF WebACL association
```hcl
resource "aws_wafv2_web_acl" "cdn" {
  provider = aws.us_east_1  # WAF for CloudFront must be in us-east-1
  name     = "cdn-protection"
  scope    = "CLOUDFRONT"

  default_action { allow {} }

  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 1
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
    metric_name                = "CDNWAF"
    sampled_requests_enabled   = true
  }
}

resource "aws_cloudfront_distribution" "waf_protected" {
  web_acl_id = aws_wafv2_web_acl.cdn.arn
  enabled    = true

  origin {
    domain_name = aws_s3_bucket.website.bucket_regional_domain_name
    origin_id   = "S3"
    origin_access_control_id = aws_cloudfront_origin_access_control.s3.id
  }

  default_cache_behavior {
    target_origin_id       = "S3"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    forwarded_values { query_string = false; cookies { forward = "none" } }
  }

  restrictions { geo_restriction { restriction_type = "none" } }
  viewer_certificate { cloudfront_default_certificate = true }
}
```

### 16. Real-time logs to Kinesis
```hcl
resource "aws_cloudfront_realtime_log_config" "main" {
  name          = "cdn-realtime-logs"
  sampling_rate = 5  # 5% of requests
  fields        = ["timestamp", "c-ip", "cs-uri-stem", "sc-status", "time-taken", "x-edge-location"]

  endpoint {
    stream_type = "Kinesis"
    kinesis_stream_config {
      role_arn   = aws_iam_role.cloudfront_logs.arn
      stream_arn = aws_kinesis_stream.cf_logs.arn
    }
  }
}
```

### 17. Origin group for failover
```hcl
resource "aws_cloudfront_distribution" "failover" {
  enabled = true

  origin {
    domain_name = aws_s3_bucket.primary.bucket_regional_domain_name
    origin_id   = "PrimaryS3"
    origin_access_control_id = aws_cloudfront_origin_access_control.s3.id
  }

  origin {
    domain_name = aws_s3_bucket.failover.bucket_regional_domain_name
    origin_id   = "FailoverS3"
    origin_access_control_id = aws_cloudfront_origin_access_control.s3.id
  }

  origin_group {
    origin_id = "FailoverGroup"

    failover_criteria {
      status_codes = [500, 502, 503, 504, 403, 404]
    }

    member { origin_id = "PrimaryS3" }
    member { origin_id = "FailoverS3" }
  }

  default_cache_behavior {
    target_origin_id       = "FailoverGroup"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    forwarded_values { query_string = false; cookies { forward = "none" } }
  }

  restrictions { geo_restriction { restriction_type = "none" } }
  viewer_certificate { cloudfront_default_certificate = true }
}
```

### 18. Response headers policy (security headers)
```hcl
resource "aws_cloudfront_response_headers_policy" "security" {
  name    = "security-headers"
  comment = "Adds security headers to all responses"

  security_headers_config {
    content_type_options {
      override = true
    }
    frame_options {
      frame_option = "DENY"
      override     = true
    }
    referrer_policy {
      referrer_policy = "strict-origin-when-cross-origin"
      override        = true
    }
    xss_protection {
      mode_block = true
      protection = true
      override   = true
    }
    strict_transport_security {
      access_control_max_age_sec = 63072000
      include_subdomains         = true
      preload                    = true
      override                   = true
    }
    content_security_policy {
      content_security_policy = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
      override                = true
    }
  }
}
```

### 19. Managed cache policies
```hcl
data "aws_cloudfront_cache_policy" "caching_optimized" {
  name = "Managed-CachingOptimized"
}

data "aws_cloudfront_origin_request_policy" "all_viewer" {
  name = "Managed-AllViewer"
}

resource "aws_cloudfront_distribution" "managed_policies" {
  enabled = true

  origin {
    domain_name = aws_lb.api.dns_name
    origin_id   = "API"
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    target_origin_id          = "API"
    viewer_protocol_policy    = "redirect-to-https"
    allowed_methods           = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods            = ["GET", "HEAD"]
    cache_policy_id           = data.aws_cloudfront_cache_policy.caching_optimized.id
    origin_request_policy_id  = data.aws_cloudfront_origin_request_policy.all_viewer.id
    compress                  = true
  }

  restrictions { geo_restriction { restriction_type = "none" } }
  viewer_certificate { cloudfront_default_certificate = true }
}
```

### 20. Field-level encryption
```hcl
resource "aws_cloudfront_public_key" "fle" {
  comment     = "FLE public key"
  encoded_key = file("${path.module}/public_key.pem")
  name        = "fle-public-key"
}

resource "aws_cloudfront_key_group" "fle" {
  comment = "FLE key group"
  items   = [aws_cloudfront_public_key.fle.id]
  name    = "fle-key-group"
}

resource "aws_cloudfront_field_level_encryption_profile" "cc" {
  comment = "Credit card FLE profile"
  name    = "credit-card-encryption"

  encryption_entities {
    items {
      public_key_id = aws_cloudfront_public_key.fle.id
      provider_id   = "cc-processor"

      field_patterns {
        items = ["CreditCardNumber", "CVV"]
      }
    }
  }
}
```

### 21. CloudFront with S3 website redirect
```hcl
resource "aws_cloudfront_distribution" "www_redirect" {
  enabled = true
  aliases = ["www.example.com"]

  origin {
    domain_name = aws_s3_bucket_website_configuration.redirect.website_endpoint
    origin_id   = "S3WebsiteRedirect"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    target_origin_id       = "S3WebsiteRedirect"
    viewer_protocol_policy = "allow-all"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    forwarded_values { query_string = true; cookies { forward = "none" } }
  }

  restrictions { geo_restriction { restriction_type = "none" } }
  viewer_certificate {
    acm_certificate_arn = aws_acm_certificate.main.arn
    ssl_support_method  = "sni-only"
  }
}
```

### 22. Continuous deployment with staging distribution
```hcl
resource "aws_cloudfront_distribution" "staging" {
  enabled     = true
  staging     = true  # Mark as staging distribution
  comment     = "Staging - attached to production for CD"

  origin {
    domain_name = aws_s3_bucket.staging.bucket_regional_domain_name
    origin_id   = "StagingS3"
    origin_access_control_id = aws_cloudfront_origin_access_control.s3.id
  }

  default_cache_behavior {
    target_origin_id       = "StagingS3"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    forwarded_values { query_string = false; cookies { forward = "none" } }
  }

  restrictions { geo_restriction { restriction_type = "none" } }
  viewer_certificate { cloudfront_default_certificate = true }
}
```

### 23. Signed URLs via CloudFront key pair
```hcl
resource "aws_cloudfront_public_key" "signing" {
  comment     = "Signing key for private content"
  encoded_key = file("${path.module}/signing_public_key.pem")
  name        = "content-signing-key"
}

resource "aws_cloudfront_key_group" "signing" {
  comment = "Key group for signed URLs"
  items   = [aws_cloudfront_public_key.signing.id]
  name    = "content-signing-key-group"
}

resource "aws_cloudfront_distribution" "private" {
  enabled = true

  origin {
    domain_name = aws_s3_bucket.private.bucket_regional_domain_name
    origin_id   = "PrivateS3"
    origin_access_control_id = aws_cloudfront_origin_access_control.s3.id
  }

  default_cache_behavior {
    target_origin_id       = "PrivateS3"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    trusted_key_groups     = [aws_cloudfront_key_group.signing.id]
    forwarded_values { query_string = false; cookies { forward = "none" } }
  }

  restrictions { geo_restriction { restriction_type = "none" } }
  viewer_certificate { cloudfront_default_certificate = true }
}
```

### 24. CloudFront with Lambda@Edge for A/B testing
```hcl
resource "aws_lambda_function" "ab_test" {
  provider         = aws.us_east_1
  function_name    = "ab-testing-edge"
  runtime          = "nodejs20.x"
  handler          = "index.handler"
  role             = aws_iam_role.lambda_edge.arn
  filename         = "ab-test.zip"
  publish          = true

  # Lambda@Edge must be in us-east-1
}
```

### 25. Route53 alias record for CloudFront
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

---

## Nested

### 26. Complete static website with CloudFront module
```hcl
module "static_website" {
  source = "./modules/cloudfront-website"

  domain_name     = "app.example.com"
  aliases         = ["app.example.com", "www.example.com"]
  certificate_arn = aws_acm_certificate.main.arn
  price_class     = "PriceClass_100"

  s3_bucket = {
    name            = "app-static-assets-${var.account_id}"
    force_destroy   = false
    versioning      = true
  }

  cache_behaviors = {
    static = {
      path_pattern    = "/static/*"
      default_ttl     = 86400 * 365  # 1 year
      min_ttl         = 86400 * 365
      max_ttl         = 86400 * 365
      compress        = true
    }
    api = {
      path_pattern    = "/api/*"
      default_ttl     = 0
      min_ttl         = 0
      max_ttl         = 0
      origin_id       = "ALBOrigin"
      allowed_methods = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    }
  }

  security = {
    waf_acl_arn         = aws_wafv2_web_acl.cdn.arn
    response_headers    = true
    geo_restriction     = ["none"]
    signed_urls         = false
  }

  spa_mode = true  # Return index.html for 404/403

  access_logs = {
    enabled    = true
    bucket_id  = aws_s3_bucket.cf_logs.id
    prefix     = "app-cdn"
  }

  tags = local.common_tags
}
```

### 27. Multi-origin CloudFront with dynamic behaviors
```hcl
locals {
  origins = {
    s3_static = {
      type        = "s3"
      bucket_name = aws_s3_bucket.static.id
    }
    alb_api = {
      type        = "alb"
      domain_name = aws_lb.api.dns_name
    }
    alb_admin = {
      type        = "alb"
      domain_name = aws_lb.admin.dns_name
    }
  }

  behaviors = {
    "/api/*"   = { origin = "alb_api",   ttl = 0,      forward_all = true  }
    "/admin/*" = { origin = "alb_admin", ttl = 0,      forward_all = true  }
    "/static/*" = { origin = "s3_static", ttl = 604800, forward_all = false }
  }
}
```

### 28. CloudFront with multiple certificate domains
```hcl
resource "aws_cloudfront_distribution" "multi_domain" {
  enabled = true
  aliases = [
    "example.com",
    "www.example.com",
    "app.example.com",
    "api.example.com"
  ]

  origin {
    domain_name = aws_s3_bucket.website.bucket_regional_domain_name
    origin_id   = "S3"
    origin_access_control_id = aws_cloudfront_origin_access_control.s3.id
  }

  default_cache_behavior {
    target_origin_id       = "S3"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    forwarded_values { query_string = false; cookies { forward = "none" } }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.wildcard.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  restrictions { geo_restriction { restriction_type = "none" } }
}
```

### 29. CloudFront with Kinesis real-time analytics
```hcl
resource "aws_kinesis_stream" "cf_logs" {
  name        = "cloudfront-realtime-logs"
  shard_count = 2
}

resource "aws_cloudfront_realtime_log_config" "analytics" {
  name          = "analytics-logs"
  sampling_rate = 100  # All requests

  fields = [
    "timestamp", "c-ip", "cs-uri-stem", "cs-uri-query",
    "sc-status", "sc-bytes", "time-taken",
    "x-edge-location", "x-edge-request-id",
    "cs-user-agent", "cs-referer",
    "x-forwarded-for", "ssl-protocol"
  ]

  endpoint {
    stream_type = "Kinesis"
    kinesis_stream_config {
      role_arn   = aws_iam_role.cf_kinesis.arn
      stream_arn = aws_kinesis_stream.cf_logs.arn
    }
  }
}
```

### 30. CloudFront distribution with Terraform for_each
```hcl
variable "cdn_configurations" {
  type = map(object({
    bucket_name   = string
    domain_name   = string
    price_class   = string
    geo_whitelist = list(string)
  }))
}

resource "aws_cloudfront_distribution" "multi" {
  for_each = var.cdn_configurations

  enabled     = true
  aliases     = [each.value.domain_name]
  price_class = each.value.price_class

  origin {
    domain_name = "${each.value.bucket_name}.s3.amazonaws.com"
    origin_id   = "S3-${each.key}"
    origin_access_control_id = aws_cloudfront_origin_access_control.s3.id
  }

  default_cache_behavior {
    target_origin_id       = "S3-${each.key}"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    forwarded_values { query_string = false; cookies { forward = "none" } }
  }

  restrictions {
    geo_restriction {
      restriction_type = length(each.value.geo_whitelist) > 0 ? "whitelist" : "none"
      locations        = each.value.geo_whitelist
    }
  }

  viewer_certificate { cloudfront_default_certificate = true }
}
```

### 31. Lambda@Edge for request manipulation
```hcl
resource "aws_lambda_function" "auth_edge" {
  provider         = aws.us_east_1
  function_name    = "auth-edge"
  runtime          = "nodejs20.x"
  handler          = "auth.handler"
  role             = aws_iam_role.lambda_edge.arn
  filename         = "auth-edge.zip"
  publish          = true
  timeout          = 5  # Lambda@Edge max: viewer=5s, origin=30s

  code = <<-JS  # Simplified inline for example
    exports.handler = (event, context, callback) => {
      const request = event.Records[0].cf.request;
      const headers = request.headers;

      if (!headers.authorization) {
        callback(null, { status: '401', body: 'Unauthorized' });
        return;
      }

      callback(null, request);
    };
  JS
}
```

### 32. CloudFront with custom cache policy
```hcl
resource "aws_cloudfront_cache_policy" "api" {
  name    = "api-cache-policy"
  comment = "Cache policy for API responses"
  min_ttl = 0
  default_ttl = 0
  max_ttl = 3600

  parameters_in_cache_key_and_forwarded_to_origin {
    enable_accept_encoding_gzip   = true
    enable_accept_encoding_brotli = true

    headers_config {
      header_behavior = "whitelist"
      headers {
        items = ["Accept", "Accept-Language"]
      }
    }

    query_strings_config {
      query_string_behavior = "whitelist"
      query_strings {
        items = ["version", "format"]
      }
    }

    cookies_config {
      cookie_behavior = "none"
    }
  }
}
```

---

## Advanced

### 33. Full production CloudFront stack
```hcl
module "cdn_production" {
  source = "./modules/cloudfront-production"

  name        = "production"
  environment = "prod"
  account_id  = var.account_id

  domains = {
    primary    = "example.com"
    www        = "www.example.com"
    cdn        = "cdn.example.com"
  }

  certificate_arn = aws_acm_certificate.main.arn
  price_class     = "PriceClass_All"

  origins = {
    s3 = {
      bucket_id    = aws_s3_bucket.website.id
      use_oac      = true
    }
    api = {
      alb_arn      = aws_lb.api.arn
      domain       = aws_lb.api.dns_name
      custom_header = { name = "X-Origin-Secret", value = var.origin_secret }
    }
  }

  cache_behaviors = local.cache_behaviors

  security = {
    waf_acl_arn          = aws_wafv2_web_acl.cdn.arn
    response_headers     = aws_cloudfront_response_headers_policy.security.id
    geo_restriction      = { type = "none" }
    signed_urls          = false
    field_level_encryption = false
  }

  spa_mode           = true
  default_root_object = "index.html"

  logging = {
    enabled    = true
    bucket_id  = aws_s3_bucket.cf_logs.id
    prefix     = "production-cdn"
  }

  realtime_logs = {
    enabled       = true
    sampling_rate = 5
    stream_arn    = aws_kinesis_stream.cf_logs.arn
    role_arn      = aws_iam_role.cf_kinesis.arn
  }

  continuous_deployment = {
    enabled        = true
    staging_weight = 10
  }

  tags = local.common_tags
}
```

### 34. CloudFront monitoring and alerting
```hcl
resource "aws_cloudwatch_metric_alarm" "error_rate" {
  alarm_name          = "cloudfront-5xx-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  threshold           = 1

  metric_query {
    id          = "error_rate"
    expression  = "errors / requests * 100"
    label       = "5xx Error Rate"
    return_data = true
  }

  metric_query {
    id = "errors"
    metric {
      metric_name = "5xxErrorRate"
      namespace   = "AWS/CloudFront"
      period      = 300
      stat        = "Average"
      dimensions = {
        DistributionId = aws_cloudfront_distribution.main.id
        Region         = "Global"
      }
    }
  }

  metric_query {
    id = "requests"
    metric {
      metric_name = "Requests"
      namespace   = "AWS/CloudFront"
      period      = 300
      stat        = "Sum"
      dimensions = {
        DistributionId = aws_cloudfront_distribution.main.id
        Region         = "Global"
      }
    }
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
}
```

### 35. CloudFront with Athena log analysis
```hcl
resource "aws_glue_catalog_database" "cf_logs" {
  name = "cloudfront_logs"
}

resource "aws_glue_catalog_table" "cf_access" {
  name          = "access_logs"
  database_name = aws_glue_catalog_database.cf_logs.name

  storage_descriptor {
    location      = "s3://${aws_s3_bucket.cf_logs.id}/cloudfront/"
    input_format  = "org.apache.hadoop.mapred.TextInputFormat"
    output_format = "org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat"

    ser_de_info {
      serialization_library = "org.apache.hadoop.hive.serde2.lazy.LazySimpleSerDe"
      parameters = {
        "field.delim"            = "\t"
        "serialization.format"   = "\t"
      }
    }

    dynamic "columns" {
      for_each = local.cf_log_columns
      content {
        name = columns.value.name
        type = columns.value.type
      }
    }
  }
}
```

### 36. CloudFront Continuous Deployment
```hcl
resource "aws_cloudfront_distribution" "production" {
  enabled     = true
  comment     = "Production distribution"
  aliases     = ["example.com"]

  origin {
    domain_name = aws_s3_bucket.website.bucket_regional_domain_name
    origin_id   = "S3"
    origin_access_control_id = aws_cloudfront_origin_access_control.s3.id
  }

  default_cache_behavior {
    target_origin_id       = "S3"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    forwarded_values { query_string = false; cookies { forward = "none" } }
  }

  restrictions { geo_restriction { restriction_type = "none" } }
  viewer_certificate {
    acm_certificate_arn = aws_acm_certificate.main.arn
    ssl_support_method  = "sni-only"
  }
}

# Continuous deployment config for canary releases
resource "aws_cloudfront_continuous_deployment_policy" "canary" {
  enabled = true

  staging_distribution_dns_names {
    items    = [aws_cloudfront_distribution.staging.domain_name]
    quantity = 1
  }

  traffic_config {
    type = "SingleWeight"
    single_weight_config {
      weight = 0.15  # 15% to staging
      session_stickiness_config {
        idle_ttl    = 300
        maximum_ttl = 600
      }
    }
  }
}
```

### 37. CloudFront with shield advanced
```hcl
resource "aws_shield_protection" "cloudfront" {
  name         = "cloudfront-shield"
  resource_arn = aws_cloudfront_distribution.main.arn
}

resource "aws_shield_protection_health_check_association" "cloudfront" {
  shield_protection_id     = aws_shield_protection.cloudfront.id
  health_check_arn         = aws_route53_health_check.cdn.arn
}
```

### 38. CloudFront with custom cache warming
```hcl
resource "aws_lambda_function" "cache_warmer" {
  function_name = "cloudfront-cache-warmer"
  runtime       = "python3.12"
  handler       = "warmer.handler"
  role          = aws_iam_role.cache_warmer.arn
  filename      = "cache-warmer.zip"
  timeout       = 300

  environment {
    variables = {
      DISTRIBUTION_ID = aws_cloudfront_distribution.main.id
      BASE_URL        = "https://example.com"
      PATHS_FILE      = "/var/task/paths.txt"
    }
  }
}

resource "aws_cloudwatch_event_rule" "warm_cache" {
  name                = "warm-cloudfront-cache"
  schedule_expression = "cron(0 6 * * ? *)"  # 6 AM daily
}

resource "aws_cloudwatch_event_target" "warm" {
  rule = aws_cloudwatch_event_rule.warm_cache.name
  arn  = aws_lambda_function.cache_warmer.arn
}
```

### 39. CloudFront with Terraform data source
```hcl
data "aws_cloudfront_distribution" "existing" {
  id = var.existing_distribution_id
}

# Reference existing distribution in outputs or other resources
output "existing_cdn_domain" {
  value = data.aws_cloudfront_distribution.existing.domain_name
}
```

### 40. CloudFront CORS headers policy
```hcl
resource "aws_cloudfront_response_headers_policy" "cors" {
  name    = "cors-policy"
  comment = "CORS headers for API"

  cors_config {
    access_control_allow_credentials = false

    access_control_allow_headers {
      items = ["Content-Type", "Authorization", "X-Api-Key"]
    }

    access_control_allow_methods {
      items = ["GET", "HEAD", "OPTIONS", "POST", "PUT", "DELETE"]
    }

    access_control_allow_origins {
      items = ["https://app.example.com", "https://admin.example.com"]
    }

    access_control_expose_headers {
      items = ["ETag", "X-Request-Id"]
    }

    access_control_max_age_sec    = 86400
    origin_override               = true
  }
}
```

### 41. Complete media streaming with CloudFront
```hcl
module "media_cdn" {
  source = "./modules/media-cloudfront"

  name       = "video-streaming"
  account_id = var.account_id

  media_bucket = {
    name         = "media-assets-${var.account_id}"
    versioning   = false
    force_destroy = false
  }

  streaming = {
    signed_urls  = true
    key_group_id = aws_cloudfront_key_group.media.id
    url_ttl      = 3600
  }

  hls_settings = {
    compress    = true
    path        = "/hls/*"
    min_ttl     = 0
    default_ttl = 60  # Short cache for live streams
  }

  vod_settings = {
    path        = "/vod/*"
    min_ttl     = 86400
    default_ttl = 604800
    compress    = true
  }

  domains = {
    media = "media.example.com"
  }

  certificate_arn = aws_acm_certificate.main.arn
  waf_acl_arn     = aws_wafv2_web_acl.cdn.arn
  price_class     = "PriceClass_All"

  tags = local.common_tags
}
```

### 42. CloudFront invalidation automation
```hcl
resource "aws_codepipeline" "deploy" {
  name     = "static-site-deploy"
  role_arn = aws_iam_role.pipeline.arn

  artifact_store {
    location = aws_s3_bucket.artifacts.bucket
    type     = "S3"
  }

  stage {
    name = "Source"
    action {
      name             = "GitHub"
      category         = "Source"
      owner            = "ThirdParty"
      provider         = "GitHub"
      version          = "1"
      output_artifacts = ["source"]
      configuration = {
        Owner      = var.github_org
        Repo       = var.github_repo
        Branch     = "main"
        OAuthToken = var.github_token
      }
    }
  }

  stage {
    name = "Deploy"
    action {
      name            = "S3Deploy"
      category        = "Deploy"
      owner           = "AWS"
      provider        = "S3"
      version         = "1"
      input_artifacts = ["source"]
      configuration = {
        BucketName = aws_s3_bucket.website.id
        Extract    = "true"
      }
    }
  }

  stage {
    name = "Invalidate"
    action {
      name     = "InvalidateCDN"
      category = "Invoke"
      owner    = "AWS"
      provider = "Lambda"
      version  = "1"
      configuration = {
        FunctionName   = aws_lambda_function.invalidator.function_name
        UserParameters = aws_cloudfront_distribution.main.id
      }
    }
  }
}
```

### 43. CloudFront with private S3 and signed cookies
```hcl
resource "aws_cloudfront_distribution" "private_content" {
  enabled = true
  aliases = ["premium.example.com"]

  origin {
    domain_name = aws_s3_bucket.private.bucket_regional_domain_name
    origin_id   = "PrivateS3"
    origin_access_control_id = aws_cloudfront_origin_access_control.s3.id
  }

  default_cache_behavior {
    target_origin_id       = "PrivateS3"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    trusted_key_groups     = [aws_cloudfront_key_group.signing.id]
    forwarded_values {
      query_string = false
      cookies {
        forward           = "whitelist"
        whitelisted_names = ["CloudFront-Policy", "CloudFront-Signature", "CloudFront-Key-Pair-Id"]
      }
    }
  }

  viewer_certificate {
    acm_certificate_arn = aws_acm_certificate.main.arn
    ssl_support_method  = "sni-only"
  }

  restrictions { geo_restriction { restriction_type = "none" } }
}
```

### 44. CloudFront with advanced logging and analysis
```hcl
module "cdn_analytics" {
  source = "./modules/cdn-analytics"

  distribution_id = aws_cloudfront_distribution.main.id
  log_bucket_id   = aws_s3_bucket.cf_logs.id

  athena = {
    database_name  = "cf_analytics"
    workgroup_name = "cf-analysis"
    results_bucket = aws_s3_bucket.athena_results.id
  }

  queries = {
    top_paths         = true
    error_analysis    = true
    geographic_report = true
    performance_report = true
  }

  schedule     = "cron(0 1 * * ? *)"  # Run nightly
  alert_topic  = aws_sns_topic.alerts.arn

  tags = local.common_tags
}
```

### 45. Multi-region CloudFront with Route53 latency routing
```hcl
# CloudFront is global, but origin ALBs are regional
resource "aws_route53_record" "app" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "app.example.com"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.main.domain_name
    zone_id                = aws_cloudfront_distribution.main.hosted_zone_id
    evaluate_target_health = false
  }
}

# CloudFront automatically routes to nearest PoP
# Origin can have ALBs in multiple regions with origin groups
```

### 46. CloudFront with custom cache key (VPC origin)
```hcl
resource "aws_cloudfront_origin_request_policy" "api" {
  name    = "api-request-policy"
  comment = "Forward auth headers to origin"

  cookies_config {
    cookie_behavior = "none"
  }

  headers_config {
    header_behavior = "whitelist"
    headers {
      items = ["Authorization", "Accept", "Accept-Language", "X-Api-Key"]
    }
  }

  query_strings_config {
    query_string_behavior = "all"
  }
}
```

### 47. CloudFront with S3 lifecycle integration
```hcl
resource "aws_s3_bucket_lifecycle_configuration" "cf_origin" {
  bucket = aws_s3_bucket.website.id

  rule {
    id     = "expire-old-versions"
    status = "Enabled"

    noncurrent_version_expiration {
      noncurrent_days = 30
    }

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}

resource "null_resource" "purge_on_deploy" {
  triggers = {
    bucket_version = aws_s3_bucket_versioning.website.versioning_configuration[0].status
  }

  provisioner "local-exec" {
    command = <<-EOT
      aws cloudfront create-invalidation \
        --distribution-id ${aws_cloudfront_distribution.main.id} \
        --paths "/*"
    EOT
  }
}
```

### 48. CloudFront with detailed monitoring
```hcl
resource "aws_cloudfront_monitoring_subscription" "main" {
  distribution_id = aws_cloudfront_distribution.main.id

  monitoring_subscription {
    realtime_metrics_subscription_config {
      realtime_metrics_subscription_status = "Enabled"
    }
  }
}

resource "aws_cloudwatch_dashboard" "cloudfront" {
  dashboard_name = "cloudfront-production"

  dashboard_body = jsonencode({
    widgets = [
      { type = "metric", properties = {
        title   = "Requests"
        metrics = [["AWS/CloudFront", "Requests", "DistributionId", aws_cloudfront_distribution.main.id, "Region", "Global"]]
        period  = 60
        stat    = "Sum"
      }},
      { type = "metric", properties = {
        title   = "Error Rates"
        metrics = [
          ["AWS/CloudFront", "4xxErrorRate", "DistributionId", aws_cloudfront_distribution.main.id, "Region", "Global"],
          ["AWS/CloudFront", "5xxErrorRate", "DistributionId", aws_cloudfront_distribution.main.id, "Region", "Global"]
        ]
        period = 60
        stat   = "Average"
      }}
    ]
  })
}
```

### 49. CloudFront with Terraform import
```bash
# Import existing CloudFront distribution into Terraform state
terraform import aws_cloudfront_distribution.main E1ABCDEFGHIJKL

# Then generate config with:
terraform show -json | jq '.values.root_module.resources[] | select(.type == "aws_cloudfront_distribution")'
```

### 50. Complete production CDN with all patterns
```hcl
module "production_cdn" {
  source = "./modules/cdn-full"

  name        = "production"
  account_id  = var.account_id
  environment = "production"

  domains = {
    apex    = "example.com"
    www     = "www.example.com"
    cdn     = "cdn.example.com"
    media   = "media.example.com"
  }

  certificate_arn = module.acm.certificate_arn
  price_class     = "PriceClass_All"

  origins = {
    static = { s3_bucket_id = module.static_bucket.id, use_oac = true }
    api    = { alb_dns = module.api_alb.dns_name, custom_header_secret = var.origin_secret }
    media  = { s3_bucket_id = module.media_bucket.id, use_oac = true, private = true }
  }

  routing = {
    spa_mode = true
    behaviors = local.cache_behaviors
  }

  security = {
    waf_acl_arn       = module.waf.cdn_acl_arn
    shield_advanced   = true
    signed_urls       = { enabled = true, paths = ["/media/*", "/premium/*"] }
    response_headers  = module.security_headers_policy.id
    geo_restriction   = { type = "none" }
  }

  performance = {
    compress           = true
    http2              = true
    http3              = true
  }

  observability = {
    access_logs     = { enabled = true, bucket_id = module.logs.id }
    realtime_logs   = { enabled = true, sampling = 5, stream_arn = module.kinesis.arn }
    monitoring      = true
    alarms          = { error_rate = 1.0, latency_ms = 500, alert_arn = aws_sns_topic.alerts.arn }
  }

  continuous_deployment = {
    enabled        = true
    staging_weight = 0.10
  }

  tags = local.common_tags
}
```
