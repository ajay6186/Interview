# Phase 2 - Exercise 04: IAM Roles & Policies
# Learn: IAM roles, policies, instance profiles, policy documents

terraform {
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
}

provider "aws" { region = "ap-south-1" }

# --- IAM Role for EC2 to access S3 ---

# Trust policy: who can assume this role (EC2 service)
data "aws_iam_policy_document" "ec2_assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

# IAM Role
resource "aws_iam_role" "ec2_s3_role" {
  name               = "tf-mastery-ec2-s3-role"
  assume_role_policy = data.aws_iam_policy_document.ec2_assume_role.json

  tags = { Name = "tf-mastery-ec2-s3-role" }
}

# Inline permission policy: what this role can do
data "aws_iam_policy_document" "s3_read_write" {
  statement {
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject",
      "s3:ListBucket"
    ]
    resources = [
      "arn:aws:s3:::tf-mastery-*",
      "arn:aws:s3:::tf-mastery-*/*"
    ]
  }
}

# Create the policy
resource "aws_iam_policy" "s3_access" {
  name        = "tf-mastery-s3-access"
  description = "Allow EC2 to read/write S3 buckets with tf-mastery prefix"
  policy      = data.aws_iam_policy_document.s3_read_write.json
}

# Attach policy to role
resource "aws_iam_role_policy_attachment" "ec2_s3" {
  role       = aws_iam_role.ec2_s3_role.name
  policy_arn = aws_iam_policy.s3_access.arn
}

# Attach AWS managed policy (optional)
resource "aws_iam_role_policy_attachment" "cloudwatch" {
  role       = aws_iam_role.ec2_s3_role.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

# Instance Profile: wrapper needed to attach role to EC2
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "tf-mastery-ec2-profile"
  role = aws_iam_role.ec2_s3_role.name
}

output "role_arn"              { value = aws_iam_role.ec2_s3_role.arn }
output "instance_profile_name" { value = aws_iam_instance_profile.ec2_profile.name }
