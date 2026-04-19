# Examples 5.1 — Lambda & Serverless (50 examples)

---

## Basic

### 1. Minimal Lambda function
```hcl
resource "aws_lambda_function" "hello" {
  function_name = "hello-world"
  runtime       = "python3.12"
  handler       = "index.handler"
  role          = aws_iam_role.lambda.arn
  filename      = "lambda.zip"
}
```

### 2. IAM role for Lambda
```hcl
resource "aws_iam_role" "lambda" {
  name = "lambda-execution-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "basic" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}
```

### 3. Zip archive from local file
```hcl
data "archive_file" "lambda" {
  type        = "zip"
  source_file = "${path.module}/src/index.py"
  output_path = "${path.module}/dist/lambda.zip"
}

resource "aws_lambda_function" "app" {
  function_name    = "my-app"
  runtime          = "python3.12"
  handler          = "index.handler"
  role             = aws_iam_role.lambda.arn
  filename         = data.archive_file.lambda.output_path
  source_code_hash = data.archive_file.lambda.output_base64sha256
}
```

### 4. Environment variables
```hcl
resource "aws_lambda_function" "app" {
  function_name = "my-app"
  runtime       = "python3.12"
  handler       = "index.handler"
  role          = aws_iam_role.lambda.arn
  filename      = "lambda.zip"

  environment {
    variables = {
      DB_HOST     = var.db_host
      DB_NAME     = "mydb"
      LOG_LEVEL   = "INFO"
      ENVIRONMENT = var.environment
    }
  }
}
```

### 5. Lambda timeout and memory
```hcl
resource "aws_lambda_function" "app" {
  function_name = "my-app"
  runtime       = "python3.12"
  handler       = "index.handler"
  role          = aws_iam_role.lambda.arn
  filename      = "lambda.zip"
  timeout       = 30
  memory_size   = 512
}
```

### 6. Lambda layer
```hcl
resource "aws_lambda_layer_version" "deps" {
  layer_name          = "python-dependencies"
  filename            = "layer.zip"
  compatible_runtimes = ["python3.12", "python3.11"]
  description         = "Common Python dependencies"
}

resource "aws_lambda_function" "app" {
  function_name = "my-app"
  runtime       = "python3.12"
  handler       = "index.handler"
  role          = aws_iam_role.lambda.arn
  filename      = "lambda.zip"
  layers        = [aws_lambda_layer_version.deps.arn]
}
```

### 7. CloudWatch Log Group for Lambda
```hcl
resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${aws_lambda_function.app.function_name}"
  retention_in_days = 14
}
```

### 8. Lambda URL (function URL)
```hcl
resource "aws_lambda_function_url" "app" {
  function_name      = aws_lambda_function.app.function_name
  authorization_type = "NONE"

  cors {
    allow_credentials = false
    allow_origins     = ["*"]
    allow_methods     = ["GET", "POST"]
    allow_headers     = ["content-type"]
    max_age           = 86400
  }
}

output "lambda_url" {
  value = aws_lambda_function_url.app.function_url
}
```

### 9. Dead letter queue (DLQ)
```hcl
resource "aws_sqs_queue" "dlq" {
  name = "lambda-dlq"
}

resource "aws_lambda_function" "app" {
  function_name = "my-app"
  runtime       = "python3.12"
  handler       = "index.handler"
  role          = aws_iam_role.lambda.arn
  filename      = "lambda.zip"

  dead_letter_config {
    target_arn = aws_sqs_queue.dlq.arn
  }
}
```

### 10. Reserved concurrency
```hcl
resource "aws_lambda_function" "app" {
  function_name                  = "my-app"
  runtime                        = "python3.12"
  handler                        = "index.handler"
  role                           = aws_iam_role.lambda.arn
  filename                       = "lambda.zip"
  reserved_concurrent_executions = 100
}
```

### 11. X-Ray tracing
```hcl
resource "aws_lambda_function" "app" {
  function_name = "my-app"
  runtime       = "python3.12"
  handler       = "index.handler"
  role          = aws_iam_role.lambda.arn
  filename      = "lambda.zip"

  tracing_config {
    mode = "Active"
  }
}
```

### 12. Lambda with SNS trigger
```hcl
resource "aws_sns_topic" "events" {
  name = "lambda-trigger"
}

resource "aws_lambda_permission" "sns" {
  statement_id  = "AllowSNSInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.app.function_name
  principal     = "sns.amazonaws.com"
  source_arn    = aws_sns_topic.events.arn
}

resource "aws_sns_topic_subscription" "lambda" {
  topic_arn = aws_sns_topic.events.arn
  protocol  = "lambda"
  endpoint  = aws_lambda_function.app.arn
}
```

---

## Intermediate

### 13. VPC Lambda
```hcl
resource "aws_lambda_function" "vpc_app" {
  function_name = "vpc-app"
  runtime       = "python3.12"
  handler       = "index.handler"
  role          = aws_iam_role.lambda_vpc.arn
  filename      = "lambda.zip"

  vpc_config {
    subnet_ids         = var.private_subnet_ids
    security_group_ids = [aws_security_group.lambda.id]
  }
}

resource "aws_iam_role_policy_attachment" "vpc_access" {
  role       = aws_iam_role.lambda_vpc.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}
```

### 14. SQS event source mapping
```hcl
resource "aws_sqs_queue" "input" {
  name                       = "lambda-input"
  visibility_timeout_seconds = 35
}

resource "aws_lambda_event_source_mapping" "sqs" {
  event_source_arn                   = aws_sqs_queue.input.arn
  function_name                      = aws_lambda_function.app.arn
  batch_size                         = 10
  maximum_batching_window_in_seconds = 5
  function_response_types            = ["ReportBatchItemFailures"]
}
```

### 15. DynamoDB stream event source
```hcl
resource "aws_lambda_event_source_mapping" "dynamo" {
  event_source_arn  = aws_dynamodb_table.main.stream_arn
  function_name     = aws_lambda_function.processor.arn
  starting_position = "LATEST"
  batch_size        = 100

  filter_criteria {
    filter {
      pattern = jsonencode({ eventName = ["INSERT", "MODIFY"] })
    }
  }
}
```

### 16. Lambda with API Gateway (HTTP API)
```hcl
resource "aws_apigatewayv2_api" "http" {
  name          = "my-http-api"
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_integration" "lambda" {
  api_id             = aws_apigatewayv2_api.http.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.app.invoke_arn
  integration_method = "POST"
}

resource "aws_apigatewayv2_route" "default" {
  api_id    = aws_apigatewayv2_api.http.id
  route_key = "ANY /{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.http.id
  name        = "$default"
  auto_deploy = true
}

resource "aws_lambda_permission" "apigw" {
  statement_id  = "AllowAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.app.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http.execution_arn}/*/*"
}
```

### 17. Provisioned concurrency
```hcl
resource "aws_lambda_alias" "live" {
  name             = "live"
  function_name    = aws_lambda_function.app.function_name
  function_version = aws_lambda_function.app.version
}

resource "aws_lambda_provisioned_concurrency_config" "app" {
  function_name                      = aws_lambda_function.app.function_name
  qualifier                          = aws_lambda_alias.live.name
  provisioned_concurrent_executions  = 10
}
```

### 18. Lambda with Secrets Manager access
```hcl
data "aws_secretsmanager_secret" "db" {
  name = "prod/db/credentials"
}

resource "aws_iam_role_policy" "secrets" {
  name = "read-secrets"
  role = aws_iam_role.lambda.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["secretsmanager:GetSecretValue"]
      Resource = data.aws_secretsmanager_secret.db.arn
    }]
  })
}
```

### 19. EventBridge rule triggering Lambda
```hcl
resource "aws_cloudwatch_event_rule" "schedule" {
  name                = "daily-job"
  schedule_expression = "cron(0 2 * * ? *)"
}

resource "aws_cloudwatch_event_target" "lambda" {
  rule      = aws_cloudwatch_event_rule.schedule.name
  target_id = "DailyJob"
  arn       = aws_lambda_function.app.arn
}

resource "aws_lambda_permission" "eventbridge" {
  statement_id  = "AllowEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.app.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.schedule.arn
}
```

### 20. Lambda container image
```hcl
resource "aws_ecr_repository" "lambda" {
  name                 = "my-lambda"
  image_tag_mutability = "IMMUTABLE"
}

resource "aws_lambda_function" "container" {
  function_name = "container-lambda"
  role          = aws_iam_role.lambda.arn
  package_type  = "Image"
  image_uri     = "${aws_ecr_repository.lambda.repository_url}:latest"
  timeout       = 60
  memory_size   = 1024
}
```

### 21. Step Functions state machine
```hcl
resource "aws_sfn_state_machine" "pipeline" {
  name     = "data-pipeline"
  role_arn = aws_iam_role.sfn.arn

  definition = jsonencode({
    Comment = "Data processing pipeline"
    StartAt = "Validate"
    States = {
      Validate = {
        Type     = "Task"
        Resource = aws_lambda_function.validate.arn
        Next     = "Process"
      }
      Process = {
        Type     = "Task"
        Resource = aws_lambda_function.process.arn
        End      = true
      }
    }
  })
}
```

### 22. Lambda alias with traffic shifting
```hcl
resource "aws_lambda_alias" "live" {
  name             = "live"
  function_name    = aws_lambda_function.app.function_name
  function_version = aws_lambda_function.app.version

  routing_config {
    additional_version_weights = {
      (aws_lambda_function.app.version) = 0.1  # 10% to new version
    }
  }
}
```

### 23. Lambda with KMS encryption
```hcl
resource "aws_kms_key" "lambda" {
  description             = "Lambda environment encryption"
  deletion_window_in_days = 7
}

resource "aws_lambda_function" "app" {
  function_name = "secure-app"
  runtime       = "python3.12"
  handler       = "index.handler"
  role          = aws_iam_role.lambda.arn
  filename      = "lambda.zip"
  kms_key_arn   = aws_kms_key.lambda.arn

  environment {
    variables = {
      SECRET_PARAM = "encrypted-value"
    }
  }
}
```

### 24. Lambda with EFS
```hcl
resource "aws_lambda_function" "with_efs" {
  function_name = "efs-lambda"
  runtime       = "python3.12"
  handler       = "index.handler"
  role          = aws_iam_role.lambda.arn
  filename      = "lambda.zip"

  vpc_config {
    subnet_ids         = var.private_subnet_ids
    security_group_ids = [aws_security_group.lambda.id]
  }

  file_system_config {
    arn              = aws_efs_access_point.lambda.arn
    local_mount_path = "/mnt/data"
  }
}
```

### 25. Kinesis stream event source
```hcl
resource "aws_kinesis_stream" "events" {
  name             = "event-stream"
  shard_count      = 2
  retention_period = 24
}

resource "aws_lambda_event_source_mapping" "kinesis" {
  event_source_arn              = aws_kinesis_stream.events.arn
  function_name                 = aws_lambda_function.processor.arn
  starting_position             = "LATEST"
  batch_size                    = 100
  bisect_batch_on_function_error = true
  maximum_retry_attempts        = 3

  destination_config {
    on_failure {
      destination_arn = aws_sqs_queue.dlq.arn
    }
  }
}
```

---

## Nested

### 26. Lambda module with all components
```hcl
module "lambda_api" {
  source = "./modules/lambda"

  function_name = "api-handler"
  runtime       = "python3.12"
  handler       = "index.handler"
  source_dir    = "${path.module}/src/api"

  environment_variables = {
    TABLE_NAME = module.dynamodb.table_name
    QUEUE_URL  = module.sqs.queue_url
  }

  vpc_config = {
    subnet_ids         = module.vpc.private_subnet_ids
    security_group_ids = [module.security_groups.lambda_sg_id]
  }

  allowed_triggers = {
    APIGateway = {
      service    = "apigateway.amazonaws.com"
      source_arn = "${module.api_gateway.execution_arn}/*/*"
    }
  }

  tags = local.common_tags
}
```

### 27. Multiple Lambdas with for_each
```hcl
locals {
  functions = {
    ingest   = { handler = "ingest.handler",   memory = 256,  timeout = 30 }
    process  = { handler = "process.handler",  memory = 1024, timeout = 300 }
    notify   = { handler = "notify.handler",   memory = 128,  timeout = 10 }
  }
}

resource "aws_lambda_function" "functions" {
  for_each = local.functions

  function_name    = "${var.prefix}-${each.key}"
  runtime          = "python3.12"
  handler          = each.value.handler
  role             = aws_iam_role.lambda.arn
  filename         = data.archive_file.lambda[each.key].output_path
  source_code_hash = data.archive_file.lambda[each.key].output_base64sha256
  memory_size      = each.value.memory
  timeout          = each.value.timeout

  environment {
    variables = merge(local.common_env, {
      FUNCTION_NAME = each.key
    })
  }
}
```

### 28. Step Functions with error handling and retry
```hcl
resource "aws_sfn_state_machine" "etl" {
  name     = "etl-pipeline"
  role_arn = aws_iam_role.sfn.arn

  definition = jsonencode({
    Comment = "ETL Pipeline with retry"
    StartAt = "Extract"
    States = {
      Extract = {
        Type     = "Task"
        Resource = aws_lambda_function.extract.arn
        Retry = [{
          ErrorEquals     = ["Lambda.ServiceException", "Lambda.TooManyRequestsException"]
          IntervalSeconds = 2
          MaxAttempts     = 3
          BackoffRate     = 2.0
        }]
        Catch = [{
          ErrorEquals = ["States.ALL"]
          Next        = "HandleError"
        }]
        Next = "Transform"
      }
      Transform = {
        Type     = "Task"
        Resource = aws_lambda_function.transform.arn
        Next     = "Load"
      }
      Load = {
        Type     = "Task"
        Resource = aws_lambda_function.load.arn
        End      = true
      }
      HandleError = {
        Type   = "Task"
        Resource = aws_lambda_function.error_handler.arn
        End    = true
      }
    }
  })
}
```

### 29. API Gateway REST API with Lambda authorizer
```hcl
resource "aws_api_gateway_rest_api" "main" {
  name = "secure-api"
}

resource "aws_api_gateway_authorizer" "jwt" {
  name                   = "jwt-authorizer"
  rest_api_id            = aws_api_gateway_rest_api.main.id
  authorizer_uri         = aws_lambda_function.authorizer.invoke_arn
  authorizer_credentials = aws_iam_role.apigw_authorizer.arn
  type                   = "TOKEN"
  identity_source        = "method.request.header.Authorization"
  authorizer_result_ttl_in_seconds = 300
}

resource "aws_api_gateway_resource" "items" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "items"
}

resource "aws_api_gateway_method" "get_items" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.items.id
  http_method   = "GET"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.jwt.id
}
```

### 30. Lambda with SQS FIFO and deduplication
```hcl
resource "aws_sqs_queue" "fifo_input" {
  name                        = "orders.fifo"
  fifo_queue                  = true
  content_based_deduplication = true
  visibility_timeout_seconds  = 35
}

resource "aws_sqs_queue" "fifo_dlq" {
  name       = "orders-dlq.fifo"
  fifo_queue = true
}

resource "aws_sqs_queue_redrive_policy" "input" {
  queue_url = aws_sqs_queue.fifo_input.id
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.fifo_dlq.arn
    maxReceiveCount     = 3
  })
}

resource "aws_lambda_event_source_mapping" "fifo_processor" {
  event_source_arn        = aws_sqs_queue.fifo_input.arn
  function_name           = aws_lambda_function.order_processor.arn
  batch_size              = 1
  function_response_types = ["ReportBatchItemFailures"]
}
```

### 31. Lambda@Edge for CloudFront
```hcl
resource "aws_lambda_function" "edge" {
  provider         = aws.us_east_1  # Lambda@Edge must be in us-east-1
  function_name    = "cloudfront-edge"
  runtime          = "nodejs20.x"
  handler          = "index.handler"
  role             = aws_iam_role.edge_lambda.arn
  filename         = "edge.zip"
  publish          = true
}

resource "aws_cloudfront_distribution" "main" {
  # ... origin config ...
  default_cache_behavior {
    # ... other settings ...
    lambda_function_association {
      event_type   = "viewer-request"
      lambda_arn   = aws_lambda_function.edge.qualified_arn
      include_body = false
    }
  }
  enabled = true
  origins { domain_name = "example.com"; origin_id = "main" }
  restrictions { geo_restriction { restriction_type = "none" } }
  viewer_certificate { cloudfront_default_certificate = true }
}
```

### 32. EventBridge Pipes (SQS to Lambda)
```hcl
resource "aws_pipes_pipe" "sqs_to_lambda" {
  name     = "sqs-enrichment-pipe"
  role_arn = aws_iam_role.pipes.arn
  source   = aws_sqs_queue.input.arn
  target   = aws_lambda_function.processor.arn

  source_parameters {
    sqs_queue_parameters {
      batch_size                         = 10
      maximum_batching_window_in_seconds = 5
    }
  }

  enrichment = aws_lambda_function.enricher.arn

  target_parameters {
    lambda_function_parameters {
      invocation_type = "FIRE_AND_FORGET"
    }
  }
}
```

### 33. Lambda with AppConfig for feature flags
```hcl
resource "aws_appconfig_application" "app" {
  name = "my-app"
}

resource "aws_appconfig_environment" "prod" {
  application_id = aws_appconfig_application.app.id
  name           = "production"
}

resource "aws_lambda_function" "app" {
  function_name = "feature-flag-app"
  runtime       = "python3.12"
  handler       = "index.handler"
  role          = aws_iam_role.lambda.arn
  filename      = "lambda.zip"
  layers        = [
    "arn:aws:lambda:us-east-1:027255383542:layer:AWS-AppConfig-Extension:128"
  ]

  environment {
    variables = {
      AWS_APPCONFIG_EXTENSION_POLL_INTERVAL_SECONDS = "45"
      APP_CONFIG_APP                                 = aws_appconfig_application.app.name
      APP_CONFIG_ENV                                 = aws_appconfig_environment.prod.name
    }
  }
}
```

### 34. Lambda with PowerTools layer
```hcl
data "aws_lambda_layer_version" "powertools" {
  layer_name = "AWSLambdaPowertoolsPythonV3"
  # Use specific version for reproducibility
  version = 6
}

resource "aws_lambda_function" "app" {
  function_name    = "powertools-app"
  runtime          = "python3.12"
  handler          = "index.handler"
  role             = aws_iam_role.lambda.arn
  filename         = data.archive_file.lambda.output_path
  source_code_hash = data.archive_file.lambda.output_base64sha256
  layers           = [data.aws_lambda_layer_version.powertools.arn]

  environment {
    variables = {
      POWERTOOLS_SERVICE_NAME    = "my-service"
      POWERTOOLS_LOG_LEVEL       = "INFO"
      POWERTOOLS_TRACER_DISABLED = "false"
    }
  }

  tracing_config {
    mode = "Active"
  }
}
```

### 35. Lambda with SES for email sending
```hcl
resource "aws_iam_role_policy" "ses" {
  name = "send-email"
  role = aws_iam_role.lambda.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["ses:SendEmail", "ses:SendRawEmail"]
      Resource = "*"
      Condition = {
        StringEquals = {
          "ses:FromAddress" = "noreply@example.com"
        }
      }
    }]
  })
}

resource "aws_lambda_function" "mailer" {
  function_name = "email-sender"
  runtime       = "python3.12"
  handler       = "mailer.handler"
  role          = aws_iam_role.lambda.arn
  filename      = "lambda.zip"

  environment {
    variables = {
      FROM_ADDRESS = "noreply@example.com"
      SES_REGION   = "us-east-1"
    }
  }
}
```

### 36. Lambda with Bedrock for AI inference
```hcl
resource "aws_iam_role_policy" "bedrock" {
  name = "invoke-bedrock"
  role = aws_iam_role.lambda.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["bedrock:InvokeModel"]
      Resource = "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-*"
    }]
  })
}

resource "aws_lambda_function" "ai_handler" {
  function_name = "ai-inference"
  runtime       = "python3.12"
  handler       = "inference.handler"
  role          = aws_iam_role.lambda.arn
  filename      = "lambda.zip"
  timeout       = 60
  memory_size   = 1024

  environment {
    variables = {
      MODEL_ID = "anthropic.claude-sonnet-4-6"
      REGION   = "us-east-1"
    }
  }
}
```

### 37. Scheduled Lambda with CloudWatch Events
```hcl
locals {
  schedules = {
    cleanup  = { cron = "cron(0 3 * * ? *)",  function = aws_lambda_function.cleanup.arn }
    report   = { cron = "cron(0 8 ? * MON *)", function = aws_lambda_function.report.arn }
    sync     = { cron = "rate(5 minutes)",      function = aws_lambda_function.sync.arn }
  }
}

resource "aws_cloudwatch_event_rule" "schedules" {
  for_each            = local.schedules
  name                = "${var.prefix}-${each.key}"
  schedule_expression = each.value.cron
}

resource "aws_cloudwatch_event_target" "schedules" {
  for_each  = local.schedules
  rule      = aws_cloudwatch_event_rule.schedules[each.key].name
  target_id = each.key
  arn       = each.value.function
}

resource "aws_lambda_permission" "schedules" {
  for_each      = local.schedules
  statement_id  = "Allow-${each.key}"
  action        = "lambda:InvokeFunction"
  function_name = split(":", each.value.function)[6]
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.schedules[each.key].arn
}
```

---

## Advanced

### 38. Full serverless API pattern
```hcl
module "api" {
  source = "./modules/serverless-api"

  name        = "production-api"
  environment = "prod"

  endpoints = {
    "GET /users"        = { function = "list-users",   memory = 256,  timeout = 10  }
    "POST /users"       = { function = "create-user",  memory = 512,  timeout = 30  }
    "GET /users/{id}"   = { function = "get-user",     memory = 256,  timeout = 10  }
    "DELETE /users/{id}" = { function = "delete-user", memory = 256,  timeout = 10  }
  }

  authorizer = {
    type       = "JWT"
    issuer_url = "https://cognito-idp.us-east-1.amazonaws.com/${aws_cognito_user_pool.main.id}"
    audience   = [aws_cognito_user_pool_client.app.id]
  }

  vpc_config = {
    subnet_ids         = module.vpc.private_subnet_ids
    security_group_ids = [module.sg.lambda_id]
  }

  environment_variables = {
    TABLE_NAME = module.dynamodb.table_name
    CACHE_URL  = module.elasticache.endpoint
  }

  xray_enabled             = true
  reserved_concurrency     = 500
  provisioned_concurrency  = 10
  log_retention_days       = 30
}
```

### 39. Lambda blue-green deployment with CodeDeploy
```hcl
resource "aws_codedeploy_app" "lambda" {
  compute_platform = "Lambda"
  name             = "my-lambda-app"
}

resource "aws_codedeploy_deployment_group" "lambda" {
  app_name               = aws_codedeploy_app.lambda.name
  deployment_group_name  = "production"
  service_role_arn       = aws_iam_role.codedeploy.arn
  deployment_config_name = "CodeDeployDefault.LambdaLinear10PercentEvery1Minute"

  auto_rollback_configuration {
    enabled = true
    events  = ["DEPLOYMENT_FAILURE"]
  }

  alarm_configuration {
    alarms  = [aws_cloudwatch_metric_alarm.errors.name]
    enabled = true
  }
}

resource "aws_lambda_alias" "live" {
  name             = "live"
  function_name    = aws_lambda_function.app.function_name
  function_version = aws_lambda_function.app.version
}
```

### 40. Lambda with WAF and rate limiting
```hcl
resource "aws_wafv2_web_acl" "api" {
  name  = "api-protection"
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
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimit"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "APIWebACL"
    sampled_requests_enabled   = true
  }
}

resource "aws_wafv2_web_acl_association" "api" {
  resource_arn = aws_apigatewayv2_stage.default.arn
  web_acl_arn  = aws_wafv2_web_acl.api.arn
}
```

### 41. Lambda with DynamoDB Streams and fan-out
```hcl
resource "aws_dynamodb_table" "events" {
  name             = "domain-events"
  billing_mode     = "PAY_PER_REQUEST"
  hash_key         = "pk"
  range_key        = "sk"
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  attribute {
    name = "pk"
    type = "S"
  }
  attribute {
    name = "sk"
    type = "S"
  }
}

# Fan-out: multiple consumers on same stream via EventBridge Pipes
resource "aws_pipes_pipe" "dynamo_to_eventbridge" {
  name     = "domain-events-pipe"
  role_arn = aws_iam_role.pipes.arn
  source   = aws_dynamodb_table.events.stream_arn
  target   = aws_cloudwatch_event_bus.custom.arn

  source_parameters {
    dynamodb_stream_parameters {
      starting_position             = "LATEST"
      batch_size                    = 100
      maximum_batching_window_in_seconds = 10
    }
  }
}
```

### 42. Saga pattern with Step Functions
```hcl
resource "aws_sfn_state_machine" "order_saga" {
  name     = "order-saga"
  role_arn = aws_iam_role.sfn.arn
  type     = "STANDARD"

  definition = jsonencode({
    Comment = "Order saga with compensating transactions"
    StartAt = "ReserveInventory"
    States = {
      ReserveInventory = {
        Type     = "Task"
        Resource = aws_lambda_function.reserve_inventory.arn
        Next     = "ProcessPayment"
        Catch = [{
          ErrorEquals = ["InsufficientStock"]
          Next        = "OrderFailed"
        }]
      }
      ProcessPayment = {
        Type     = "Task"
        Resource = aws_lambda_function.process_payment.arn
        Next     = "ShipOrder"
        Catch = [{
          ErrorEquals = ["PaymentDeclined"]
          Next        = "ReleaseInventory"
        }]
      }
      ShipOrder = {
        Type     = "Task"
        Resource = aws_lambda_function.ship_order.arn
        End      = true
      }
      ReleaseInventory = {
        Type     = "Task"
        Resource = aws_lambda_function.release_inventory.arn
        Next     = "OrderFailed"
      }
      OrderFailed = {
        Type  = "Fail"
        Error = "OrderFailed"
      }
    }
  })
}
```

### 43. Lambda power tuning with Terraform
```hcl
# Deploy AWS Lambda Power Tuning tool
resource "aws_sfn_state_machine" "power_tuning" {
  name     = "lambda-power-tuning"
  role_arn = aws_iam_role.sfn.arn

  definition = file("${path.module}/power-tuning-definition.json")
}

# Trigger power tuning via null_resource
resource "null_resource" "tune_lambda" {
  triggers = {
    function_arn = aws_lambda_function.app.arn
  }

  provisioner "local-exec" {
    command = <<-EOT
      aws stepfunctions start-execution \
        --state-machine-arn ${aws_sfn_state_machine.power_tuning.arn} \
        --input '{"lambdaARN":"${aws_lambda_function.app.arn}","powerValues":[128,256,512,1024,2048],"num":10,"payload":{},"parallelInvocation":true}'
    EOT
  }
}
```

### 44. Serverless data pipeline with Lambda and S3
```hcl
module "data_pipeline" {
  source = "./modules/data-pipeline"

  raw_bucket_name       = "data-raw-${var.account_id}"
  processed_bucket_name = "data-processed-${var.account_id}"

  pipeline_stages = [
    {
      name     = "validate"
      function = aws_lambda_function.validator.arn
      trigger  = "s3:ObjectCreated:*"
      prefix   = "incoming/"
    },
    {
      name     = "transform"
      function = aws_lambda_function.transformer.arn
      trigger  = "sqs"
      queue    = aws_sqs_queue.transform_queue.arn
    },
    {
      name     = "load"
      function = aws_lambda_function.loader.arn
      trigger  = "sqs"
      queue    = aws_sqs_queue.load_queue.arn
    }
  ]

  enable_dlq         = true
  enable_monitoring  = true
  alert_email        = "platform@example.com"
}
```

### 45. Lambda with VPC and PrivateLink for external API
```hcl
resource "aws_vpc_endpoint" "secretsmanager" {
  vpc_id              = module.vpc.vpc_id
  service_name        = "com.amazonaws.us-east-1.secretsmanager"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = module.vpc.private_subnet_ids
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true
}

resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id            = module.vpc.vpc_id
  service_name      = "com.amazonaws.us-east-1.dynamodb"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = module.vpc.private_route_table_ids
}

resource "aws_lambda_function" "vpc_lambda" {
  function_name = "vpc-secure-lambda"
  runtime       = "python3.12"
  handler       = "index.handler"
  role          = aws_iam_role.lambda.arn
  filename      = "lambda.zip"

  vpc_config {
    subnet_ids         = module.vpc.private_subnet_ids
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      # No internet access — all via PrivateLink
      USE_PRIVATE_ENDPOINT = "true"
    }
  }
}
```

### 46. Lambda with Cognito authorizer and fine-grained access
```hcl
resource "aws_cognito_user_pool" "main" {
  name = "app-users"
}

resource "aws_cognito_user_pool_client" "api" {
  name         = "api-client"
  user_pool_id = aws_cognito_user_pool.main.id

  explicit_auth_flows = ["ALLOW_USER_SRP_AUTH", "ALLOW_REFRESH_TOKEN_AUTH"]
}

resource "aws_apigatewayv2_authorizer" "cognito" {
  api_id           = aws_apigatewayv2_api.main.id
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]
  name             = "cognito-authorizer"

  jwt_configuration {
    audience = [aws_cognito_user_pool_client.api.id]
    issuer   = "https://cognito-idp.us-east-1.amazonaws.com/${aws_cognito_user_pool.main.id}"
  }
}
```

### 47. Multi-region Lambda with Route53 routing
```hcl
resource "aws_lambda_function" "api" {
  for_each = {
    us_east_1 = { provider = "aws", region = "us-east-1" }
    eu_west_1 = { provider = "aws.eu", region = "eu-west-1" }
  }

  function_name = "global-api"
  runtime       = "python3.12"
  handler       = "index.handler"
  role          = aws_iam_role.lambda.arn
  filename      = "lambda.zip"
}

resource "aws_lambda_function_url" "api" {
  for_each           = aws_lambda_function.api
  function_name      = each.value.function_name
  authorization_type = "AWS_IAM"
}

resource "aws_route53_record" "api" {
  zone_id        = aws_route53_zone.main.zone_id
  name           = "api.example.com"
  type           = "CNAME"
  ttl            = 60
  set_identifier = "us-east-1"
  records        = [replace(aws_lambda_function_url.api["us_east_1"].function_url, "https://", "")]

  latency_routing_policy {
    region = "us-east-1"
  }
}
```

### 48. Lambda Observability (structured logging + metrics + traces)
```hcl
resource "aws_cloudwatch_log_metric_filter" "errors" {
  name           = "lambda-errors"
  log_group_name = aws_cloudwatch_log_group.lambda.name
  pattern        = "{ $.level = \"ERROR\" }"

  metric_transformation {
    name      = "LambdaErrors"
    namespace = "App/Lambda"
    value     = "1"
    dimensions = {
      FunctionName = "$.function_name"
    }
  }
}

resource "aws_cloudwatch_metric_alarm" "error_rate" {
  alarm_name          = "lambda-error-rate-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "LambdaErrors"
  namespace           = "App/Lambda"
  period              = 60
  statistic           = "Sum"
  threshold           = 5
  alarm_actions       = [aws_sns_topic.alerts.arn]
}

resource "aws_cloudwatch_dashboard" "lambda" {
  dashboard_name = "lambda-observability"
  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        properties = {
          metrics = [
            ["AWS/Lambda", "Duration", "FunctionName", aws_lambda_function.app.function_name],
            ["AWS/Lambda", "Errors", "FunctionName", aws_lambda_function.app.function_name],
            ["AWS/Lambda", "Throttles", "FunctionName", aws_lambda_function.app.function_name],
            ["AWS/Lambda", "ConcurrentExecutions", "FunctionName", aws_lambda_function.app.function_name]
          ]
          period = 60
          title  = "Lambda Metrics"
        }
      }
    ]
  })
}
```

### 49. Lambda with SQS fan-out pattern
```hcl
resource "aws_sns_topic" "domain_events" {
  name = "domain-events"
}

resource "aws_sqs_queue" "subscribers" {
  for_each = toset(["billing", "notifications", "analytics"])

  name                       = "${each.key}-events"
  visibility_timeout_seconds = 35
}

resource "aws_sns_topic_subscription" "subscribers" {
  for_each  = aws_sqs_queue.subscribers
  topic_arn = aws_sns_topic.domain_events.arn
  protocol  = "sqs"
  endpoint  = each.value.arn

  filter_policy = jsonencode({
    event_type = [each.key]
  })
}

resource "aws_lambda_event_source_mapping" "processors" {
  for_each = aws_sqs_queue.subscribers

  event_source_arn        = each.value.arn
  function_name           = aws_lambda_function.processors[each.key].arn
  batch_size              = 10
  function_response_types = ["ReportBatchItemFailures"]
}
```

### 50. Complete production serverless platform
```hcl
module "serverless_platform" {
  source = "./modules/serverless-platform"

  name        = "ecommerce"
  environment = "production"
  aws_region  = "us-east-1"

  # API Layer
  api_config = {
    throttling_rate_limit  = 10000
    throttling_burst_limit = 5000
    enable_waf             = true
    enable_access_logs     = true
    log_retention_days     = 90
  }

  # Lambda defaults
  lambda_defaults = {
    runtime             = "python3.12"
    memory_size         = 512
    timeout             = 30
    tracing_mode        = "Active"
    log_retention_days  = 30
    reserved_concurrency = -1  # unreserved
  }

  # Functions
  functions = {
    "order-service"   = { memory = 1024, timeout = 60, provisioned_concurrency = 5 }
    "product-service" = { memory = 512,  timeout = 30, provisioned_concurrency = 0 }
    "payment-service" = { memory = 512,  timeout = 60, provisioned_concurrency = 5 }
    "notification"    = { memory = 256,  timeout = 10, provisioned_concurrency = 0 }
  }

  # Event-driven
  event_sources = {
    sqs_triggers   = ["order-created", "payment-processed"]
    dynamo_streams = ["orders", "products"]
    schedules      = { "cleanup" = "rate(1 day)", "sync" = "rate(5 minutes)" }
  }

  # Infrastructure
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  kms_key_arn        = aws_kms_key.app.arn

  # Observability
  enable_xray          = true
  enable_dashboards    = true
  alarm_sns_topic_arn  = aws_sns_topic.alerts.arn
  error_threshold      = 10
  duration_p99_ms      = 5000
}
```
