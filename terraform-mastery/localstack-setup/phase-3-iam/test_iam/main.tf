terraform {
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
}

provider "aws" {
  region     = "ap-south-1"
  access_key = "test"
  secret_key = "test"

  endpoints {
    iam = "http://localhost:4566"
    sts = "http://localhost:4566"
    s3  = "http://localhost:4566"
  }

  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true
  s3_use_path_style           = true
}

# IAM Role for Lambda/EC2
data "aws_iam_policy_document" "assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com", "lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "app_role" {
  name               = "localstack-app-role"
  assume_role_policy = data.aws_iam_policy_document.assume_role.json
}

# Custom policy
data "aws_iam_policy_document" "app_permissions" {
  statement {
    effect    = "Allow"
    actions   = ["s3:GetObject", "s3:PutObject", "s3:ListBucket"]
    resources = ["arn:aws:s3:::my-app-*", "arn:aws:s3:::my-app-*/*"]
  }

  statement {
    effect    = "Allow"
    actions   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
    resources = ["arn:aws:logs:*:*:*"]
  }
}

resource "aws_iam_policy" "app_policy" {
  name   = "localstack-app-policy"
  policy = data.aws_iam_policy_document.app_permissions.json
}

resource "aws_iam_role_policy_attachment" "app" {
  role       = aws_iam_role.app_role.name
  policy_arn = aws_iam_policy.app_policy.arn
}

resource "aws_iam_instance_profile" "app" {
  name = "localstack-app-profile"
  role = aws_iam_role.app_role.name
}

# IAM User (for programmatic access)
resource "aws_iam_user" "developer" {
  name = "developer-localstack"
}

resource "aws_iam_user_policy_attachment" "developer" {
  user       = aws_iam_user.developer.name
  policy_arn = aws_iam_policy.app_policy.arn
}

output "role_arn"              { value = aws_iam_role.app_role.arn }
output "instance_profile_name" { value = aws_iam_instance_profile.app.name }
output "user_name"             { value = aws_iam_user.developer.name }
