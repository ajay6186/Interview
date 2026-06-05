# 5.4 — S3 Static Website + CloudFront CDN

**Goal:** Host a static website or SPA on S3 with global CDN delivery via CloudFront, secured with Origin Access Control.

## Architecture

```
User (anywhere in world)
        │  HTTPS
        ▼
CloudFront Edge (200+ locations globally)
        │  Cache miss → fetch from origin
        │  Cache hit  → return cached (fast)
        ▼
S3 Bucket (ap-south-1)
        ↑
   NOT publicly accessible — only CloudFront can read via OAC
```

## Key Components

### S3 Bucket (private — no public access)
```hcl
resource "aws_s3_bucket_public_access_block" "website" {
  block_public_acls   = true   # no public ACLs
  block_public_policy = false  # allow bucket policy (for OAC)
}
```

### Origin Access Control (OAC) — modern security
```hcl
resource "aws_cloudfront_origin_access_control" "website" {
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"   # sign all requests with SigV4
  signing_protocol                  = "sigv4"
}
```
OAC replaces the older OAI (Origin Access Identity). CloudFront signs every S3 request — only CloudFront can read objects. Direct S3 access returns 403.

### Bucket Policy (grants CloudFront read access)
```hcl
data "aws_iam_policy_document" "website" {
  statement {
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.website.arn}/*"]

    principals { type = "Service"; identifiers = ["cloudfront.amazonaws.com"] }

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.website.arn]  # only THIS distribution
    }
  }
}
```

## SPA (React/Angular/Vue) Routing Fix

Without this, a user navigating to `/about` gets a 403 from S3 (file doesn't exist):
```hcl
custom_error_response {
  error_code         = 404
  response_code      = 200
  response_page_path = "/index.html"   # let SPA router handle it
}
```

## Cache Settings

```hcl
default_cache_behavior {
  min_ttl     = 0        # browser: no minimum cache
  default_ttl = 3600     # cache for 1 hour if no Cache-Control header
  max_ttl     = 86400    # max 24 hours

  viewer_protocol_policy = "redirect-to-https"  # force HTTPS
  compress               = true                  # gzip/brotli
}
```

## Cache Invalidation (after deploy)

```bash
# After uploading new files to S3, invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id E1234567890 \
  --paths "/*"
```

Cost: First 1000 invalidation paths/month free, then $0.005/path.

## How to Run

```bash
terraform init
terraform plan
terraform apply -auto-approve
# Takes 10-15 min — CloudFront distribution deployment is slow

# Visit the site
terraform output cloudfront_domain

terraform destroy -auto-approve
# Also slow — CloudFront teardown takes time
```

## Cost Estimate
- S3: free tier (5GB, 20k GET)
- CloudFront: free tier (1TB transfer, 10M requests/month for 12 months)
- After free tier: ~$0.0085/GB transfer

## Interview Questions

**Q: What is Origin Access Control (OAC) and why use it?**
> OAC allows CloudFront to authenticate to S3 using AWS SigV4 signatures. The S3 bucket stays private — only CloudFront requests with valid signatures succeed. This prevents users from bypassing CloudFront (and its caching/security features) to access S3 directly.

**Q: How do you handle React/Vue routing with CloudFront + S3?**
> Configure a custom error response: when S3 returns 404 (the route doesn't exist as a file), CloudFront returns `index.html` with status 200. The SPA's JavaScript router then handles the path client-side.

**Q: Why does CloudFront take so long to deploy?**
> CloudFront must propagate configuration to 200+ edge locations worldwide. This takes 10-20 minutes. Terraform waits for full propagation before marking the resource as created.
