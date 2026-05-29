# Terraform + AWS Local Setup Guide

## Step 1: Install Terraform

### Windows (Chocolatey — easiest)
```powershell
choco install terraform
```
### Windows (Manual)
1. Download from https://developer.hashicorp.com/terraform/downloads
2. Extract the zip → copy `terraform.exe` to `C:\Windows\System32\`
3. Verify: `terraform -version`

### WSL / Linux
```bash
sudo apt update && sudo apt install -y gnupg software-properties-common
wget -O- https://apt.releases.hashicorp.com/gpg | gpg --dearmor | sudo tee /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update && sudo apt install terraform
```

---

## Step 2: Install AWS CLI

### Windows
```powershell
winget install Amazon.AWSCLI
```
Verify: `aws --version`

---

## Step 3: Create AWS Free Tier Account

1. Go to https://aws.amazon.com/free
2. Sign up (credit card needed but free tier covers learning)
3. After login → go to **IAM**

---

## Step 4: Create IAM User for Terraform

1. IAM → Users → Create user → name: `terraform-learner`
2. Attach policy: `AdministratorAccess` (for learning — restrict in production)
3. Create user → Security credentials tab → Create access key
4. Choose "CLI" → Download the CSV

---

## Step 5: Configure AWS CLI

```bash
aws configure
# AWS Access Key ID:     <from CSV>
# AWS Secret Access Key: <from CSV>
# Default region:        ap-south-1   (Mumbai — or us-east-1)
# Default output format: json
```

Verify:
```bash
aws sts get-caller-identity
```

---

## Step 6: Install VS Code Extension

Install **HashiCorp Terraform** extension in VS Code for syntax highlighting and autocomplete.

---

## Step 7: Verify Everything Works

Create a test file `test.tf`:
```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "ap-south-1"
}
```

Run:
```bash
terraform init    # downloads AWS provider
terraform validate
```

If no errors — you are ready!

---

## Cost Warning

- Always run `terraform destroy` after each exercise to avoid charges
- Use `ap-south-1` (Mumbai) or `us-east-1` — cheapest regions
- Free tier covers: 750hrs EC2 t2.micro, 5GB S3, 750hrs RDS micro per month
- Set a billing alert at $5 in AWS → Billing → Budgets
