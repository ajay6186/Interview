# Databases with ACK — Examples

## Basic

### 1. Create RDS PostgreSQL via ACK
```yaml
apiVersion: rds.services.k8s.aws/v1alpha1
kind: DBInstance
metadata:
  name: app-postgres
  namespace: production
spec:
  dbInstanceIdentifier: myapp-postgres
  dbInstanceClass: db.t3.micro
  engine: postgres
  engineVersion: "15.4"
  masterUsername: admin
  masterUserPassword:
    namespace: production
    name: rds-master-secret
    key: password
  allocatedStorage: 20
  storageType: gp3
  storageEncrypted: true
  multiAZ: false
  publiclyAccessible: false
  skipFinalSnapshot: true
  tags:
    - key: Environment
      value: production
    - key: ManagedBy
      value: ack
```
```bash
kubectl apply -f rds-postgres.yaml
kubectl get dbinstance app-postgres
kubectl describe dbinstance app-postgres

# Check endpoint when available
kubectl get dbinstance app-postgres \
  -o jsonpath='{.status.endpoint.address}'
```

---

### 2. Create the master password secret first
```bash
# Create secret for RDS master password
kubectl create secret generic rds-master-secret \
  --from-literal=password=MySecurePassword123! \
  -n production
```

---

### 3. Create RDS MySQL via ACK
```yaml
apiVersion: rds.services.k8s.aws/v1alpha1
kind: DBInstance
metadata:
  name: app-mysql
spec:
  dbInstanceIdentifier: myapp-mysql
  dbInstanceClass: db.t3.micro
  engine: mysql
  engineVersion: "8.0"
  masterUsername: admin
  masterUserPassword:
    namespace: default
    name: mysql-master-secret
    key: password
  allocatedStorage: 20
  storageType: gp3
  dbName: appdb
  port: 3306
```

---

### 4. Create DB Subnet Group via ACK
```yaml
apiVersion: rds.services.k8s.aws/v1alpha1
kind: DBSubnetGroup
metadata:
  name: app-db-subnet-group
spec:
  name: myapp-db-subnet-group
  description: "DB subnet group for production RDS"
  subnetIDs:
    - subnet-private-aaaa
    - subnet-private-bbbb
  tags:
    - key: Environment
      value: production
```

---

### 5. RDS instance with custom DB subnet group
```yaml
apiVersion: rds.services.k8s.aws/v1alpha1
kind: DBInstance
metadata:
  name: app-postgres
spec:
  dbInstanceIdentifier: myapp-postgres
  dbInstanceClass: db.t3.micro
  engine: postgres
  engineVersion: "15.4"
  masterUsername: admin
  masterUserPassword:
    namespace: default
    name: rds-secret
    key: password
  allocatedStorage: 20
  dbSubnetGroupRef:
    from:
      name: app-db-subnet-group   # references DBSubnetGroup CR
  vpcSecurityGroupRefs:
    - from:
        name: db-tier-sg          # references SecurityGroup CR
```

---

### 6. Check RDS instance status
```bash
kubectl get dbinstance app-postgres -o yaml | grep -A20 "status:"

# Status fields:
# dbInstanceStatus: available | creating | modifying | deleting
# endpoint.address: the connection hostname
# endpoint.port: connection port
```

---

### 7. DynamoDB table via ACK
```yaml
apiVersion: dynamodb.services.k8s.aws/v1alpha1
kind: Table
metadata:
  name: users-table
spec:
  tableName: users
  billingMode: PAY_PER_REQUEST
  keySchema:
    - attributeName: userId
      keyType: HASH
    - attributeName: createdAt
      keyType: RANGE
  attributeDefinitions:
    - attributeName: userId
      attributeType: S
    - attributeName: createdAt
      attributeType: N
  tags:
    - key: Environment
      value: production
```
```bash
kubectl apply -f dynamodb-table.yaml
kubectl get table users-table
kubectl get table users-table -o jsonpath='{.status.tableStatus}'
```

---

### 8. DynamoDB with Global Secondary Index
```yaml
apiVersion: dynamodb.services.k8s.aws/v1alpha1
kind: Table
metadata:
  name: orders-table
spec:
  tableName: orders
  billingMode: PAY_PER_REQUEST
  keySchema:
    - attributeName: orderId
      keyType: HASH
  attributeDefinitions:
    - attributeName: orderId
      attributeType: S
    - attributeName: userId
      attributeType: S
    - attributeName: status
      attributeType: S
  globalSecondaryIndexes:
    - indexName: UserIdIndex
      keySchema:
        - attributeName: userId
          keyType: HASH
        - attributeName: status
          keyType: RANGE
      projection:
        projectionType: ALL
```

---

### 9. List all ACK database resources
```bash
kubectl get dbinstance        # RDS instances
kubectl get dbcluster         # Aurora clusters
kubectl get dbsubnetgroup     # DB subnet groups
kubectl get table             # DynamoDB tables
kubectl get dbparametergroup  # RDS parameter groups
```

---

### 10. Delete RDS instance via ACK
```bash
# Set skipFinalSnapshot: true before deleting (or handle snapshot)
kubectl patch dbinstance app-postgres \
  --type=merge \
  -p '{"spec":{"skipFinalSnapshot":true}}'

# Delete the instance
kubectl delete dbinstance app-postgres
# ACK will call AWS API to delete the RDS instance
```

---

### 11. RDS parameter group via ACK
```yaml
apiVersion: rds.services.k8s.aws/v1alpha1
kind: DBParameterGroup
metadata:
  name: postgres-params
spec:
  dbParameterGroupFamily: postgres15
  description: "Custom PostgreSQL parameters"
  parameters:
    - parameterName: log_statement
      parameterValue: all
      applyMethod: pending-reboot
    - parameterName: max_connections
      parameterValue: "200"
      applyMethod: pending-reboot
    - parameterName: shared_preload_libraries
      parameterValue: pg_stat_statements
      applyMethod: pending-reboot
```

---

### 12. RDS with custom parameter group
```yaml
apiVersion: rds.services.k8s.aws/v1alpha1
kind: DBInstance
metadata:
  name: app-postgres
spec:
  dbInstanceIdentifier: myapp-postgres
  dbInstanceClass: db.t3.medium
  engine: postgres
  engineVersion: "15.4"
  masterUsername: admin
  masterUserPassword:
    namespace: default
    name: rds-secret
    key: password
  allocatedStorage: 50
  dbParameterGroupRef:
    from:
      name: postgres-params   # references DBParameterGroup CR
```

---

### 13. DynamoDB with TTL (time-to-live)
```yaml
apiVersion: dynamodb.services.k8s.aws/v1alpha1
kind: Table
metadata:
  name: sessions-table
spec:
  tableName: sessions
  billingMode: PAY_PER_REQUEST
  keySchema:
    - attributeName: sessionId
      keyType: HASH
  attributeDefinitions:
    - attributeName: sessionId
      attributeType: S
  timeToLiveSpecification:
    attributeName: expiresAt
    enabled: true
```

---

### 14. ElastiCache (Redis) via ACK
```yaml
apiVersion: elasticache.services.k8s.aws/v1alpha1
kind: ReplicationGroup
metadata:
  name: app-redis
spec:
  replicationGroupID: myapp-redis
  description: "Application Redis cluster"
  cacheNodeType: cache.t3.micro
  engine: redis
  engineVersion: "7.0"
  numCacheClusters: 2    # primary + 1 replica
  automaticFailoverEnabled: true
  multiAZEnabled: true
  atRestEncryptionEnabled: true
  transitEncryptionEnabled: true
  authToken:
    namespace: default
    name: redis-auth-secret
    key: token
```

---

### 15. Check ElastiCache endpoint
```bash
kubectl get replicationgroup app-redis -o yaml | grep -A5 "primaryEndpoint:"
# primaryEndpoint.address: myapp-redis.xxxxx.cache.amazonaws.com
# primaryEndpoint.port: 6379
```

---

## Intermediate

### 16. Aurora PostgreSQL Cluster via ACK
```yaml
apiVersion: rds.services.k8s.aws/v1alpha1
kind: DBCluster
metadata:
  name: aurora-postgres
spec:
  dbClusterIdentifier: myapp-aurora
  engine: aurora-postgresql
  engineVersion: "15.4"
  masterUsername: admin
  masterUserPassword:
    namespace: default
    name: aurora-secret
    key: password
  dbSubnetGroupRef:
    from:
      name: app-db-subnet-group
  vpcSecurityGroupRefs:
    - from:
        name: db-tier-sg
  storageEncrypted: true
  backupRetentionPeriod: 7
  deletionProtection: true
  skipFinalSnapshot: false
  finalDBSnapshotIdentifier: myapp-aurora-final-snapshot
---
# Add reader instance to the Aurora cluster
apiVersion: rds.services.k8s.aws/v1alpha1
kind: DBInstance
metadata:
  name: aurora-writer
spec:
  dbInstanceIdentifier: myapp-aurora-writer
  dbInstanceClass: db.t3.medium
  engine: aurora-postgresql
  dbClusterRef:
    from:
      name: aurora-postgres
---
apiVersion: rds.services.k8s.aws/v1alpha1
kind: DBInstance
metadata:
  name: aurora-reader
spec:
  dbInstanceIdentifier: myapp-aurora-reader
  dbInstanceClass: db.t3.medium
  engine: aurora-postgresql
  dbClusterRef:
    from:
      name: aurora-postgres
```

---

### 17. DynamoDB with Point-in-Time Recovery
```yaml
apiVersion: dynamodb.services.k8s.aws/v1alpha1
kind: Table
metadata:
  name: critical-table
spec:
  tableName: critical-data
  billingMode: PAY_PER_REQUEST
  keySchema:
    - attributeName: id
      keyType: HASH
  attributeDefinitions:
    - attributeName: id
      attributeType: S
  pointInTimeRecoverySpecification:
    pointInTimeRecoveryEnabled: true   # enables 35-day PITR
  sseSpecification:
    enabled: true                      # server-side encryption
    sseType: KMS
```

---

### 18. RDS proxy via ACK (connection pooling)
```yaml
apiVersion: rds.services.k8s.aws/v1alpha1
kind: DBProxy
metadata:
  name: app-rds-proxy
spec:
  dbProxyName: myapp-rds-proxy
  engineFamily: POSTGRESQL
  roleARN: arn:aws:iam::123456789:role/RDSProxyRole
  auth:
    - authScheme: SECRETS
      iAMAuth: DISABLED
      secretARN: arn:aws:secretsmanager:ap-south-1:123456789:secret/db-creds
  vpcSecurityGroupIDs:
    - sg-0123456789
  vpcSubnetIDs:
    - subnet-aaaa
    - subnet-bbbb
  requireTLS: true
```

---

### 19. DynamoDB Global Table (multi-region replication)
```yaml
apiVersion: dynamodb.services.k8s.aws/v1alpha1
kind: Table
metadata:
  name: global-users
spec:
  tableName: global-users
  billingMode: PAY_PER_REQUEST
  keySchema:
    - attributeName: userId
      keyType: HASH
  attributeDefinitions:
    - attributeName: userId
      attributeType: S
  replicas:
    - regionName: us-east-1
    - regionName: ap-south-1
    - regionName: eu-west-1
  streamSpecification:
    streamEnabled: true
    streamViewType: NEW_AND_OLD_IMAGES
```

---

### 20. Automated DB snapshot schedule
```yaml
apiVersion: rds.services.k8s.aws/v1alpha1
kind: DBInstance
metadata:
  name: app-postgres
spec:
  dbInstanceIdentifier: myapp-postgres
  backupRetentionPeriod: 7      # keep 7 days of automated backups
  preferredBackupWindow: "02:00-03:00"    # UTC
  preferredMaintenanceWindow: "Mon:03:00-Mon:04:00"
  copyTagsToSnapshot: true
  deletionProtection: true
```

---

## Nested

### 21. Complete database stack for microservices
```yaml
# Order service: PostgreSQL via ACK
apiVersion: rds.services.k8s.aws/v1alpha1
kind: DBInstance
metadata:
  name: orders-db
spec:
  dbInstanceIdentifier: microservice-orders-db
  dbInstanceClass: db.t3.small
  engine: postgres
  engineVersion: "15.4"
  masterUsername: orders_admin
  masterUserPassword:
    namespace: production
    name: orders-db-secret
    key: password
  dbName: orders
  allocatedStorage: 20
  storageEncrypted: true
  multiAZ: true
  backupRetentionPeriod: 7
  deletionProtection: true
  dbSubnetGroupRef:
    from:
      name: app-db-subnet-group
  vpcSecurityGroupRefs:
    - from:
        name: db-tier-sg
---
# Sessions: ElastiCache Redis
apiVersion: elasticache.services.k8s.aws/v1alpha1
kind: ReplicationGroup
metadata:
  name: sessions-cache
spec:
  replicationGroupID: sessions-cache
  description: Session store
  cacheNodeType: cache.t3.micro
  engine: redis
  numCacheClusters: 2
  atRestEncryptionEnabled: true
  transitEncryptionEnabled: true
---
# Events/Queue: DynamoDB for event sourcing
apiVersion: dynamodb.services.k8s.aws/v1alpha1
kind: Table
metadata:
  name: events-table
spec:
  tableName: domain-events
  billingMode: PAY_PER_REQUEST
  keySchema:
    - attributeName: aggregateId
      keyType: HASH
    - attributeName: eventId
      keyType: RANGE
  attributeDefinitions:
    - attributeName: aggregateId
      attributeType: S
    - attributeName: eventId
      attributeType: S
  streamSpecification:
    streamEnabled: true
    streamViewType: NEW_IMAGE
  pointInTimeRecoverySpecification:
    pointInTimeRecoveryEnabled: true
```

---

### 22. Export DB connection info to ConfigMap via FieldExport
```yaml
# Export RDS endpoint to ConfigMap for app pods to use
apiVersion: services.k8s.aws/v1alpha1
kind: FieldExport
metadata:
  name: db-endpoint-export
spec:
  to:
    name: db-config
    kind: ConfigMap
  from:
    path: ".status.endpoint.address"
    resource:
      group: rds.services.k8s.aws
      kind: DBInstance
      name: app-postgres
---
apiVersion: services.k8s.aws/v1alpha1
kind: FieldExport
metadata:
  name: db-port-export
spec:
  to:
    name: db-config
    kind: ConfigMap
    key: DB_PORT
  from:
    path: ".status.endpoint.port"
    resource:
      group: rds.services.k8s.aws
      kind: DBInstance
      name: app-postgres
```

---

## Advanced

### 23. Aurora Serverless v2 via ACK
```yaml
apiVersion: rds.services.k8s.aws/v1alpha1
kind: DBCluster
metadata:
  name: aurora-serverless
spec:
  dbClusterIdentifier: myapp-serverless
  engine: aurora-postgresql
  engineVersion: "15.4"
  serverlessV2ScalingConfiguration:
    minCapacity: 0.5     # min 0.5 ACU
    maxCapacity: 16      # max 16 ACU (scales automatically)
  masterUsername: admin
  masterUserPassword:
    namespace: default
    name: serverless-secret
    key: password
  storageEncrypted: true
---
apiVersion: rds.services.k8s.aws/v1alpha1
kind: DBInstance
metadata:
  name: aurora-serverless-instance
spec:
  dbInstanceIdentifier: myapp-serverless-instance
  dbInstanceClass: db.serverless
  engine: aurora-postgresql
  dbClusterRef:
    from:
      name: aurora-serverless
```

---

### 24. DynamoDB Accelerator (DAX) via ACK
```yaml
apiVersion: dax.services.k8s.aws/v1alpha1
kind: Cluster
metadata:
  name: app-dax
spec:
  clusterName: myapp-dax
  nodeType: dax.t3.small
  replicationFactor: 2
  iAMRoleARN: arn:aws:iam::123456789:role/DAXRole
  subnetGroupName: dax-subnet-group
  description: "DAX cluster for users table"
```

---

### 25. Database compliance and audit logging
```yaml
# Enable CloudWatch logging for RDS
apiVersion: rds.services.k8s.aws/v1alpha1
kind: DBInstance
metadata:
  name: compliant-postgres
spec:
  dbInstanceIdentifier: compliant-postgres
  engine: postgres
  dbInstanceClass: db.t3.small
  engineVersion: "15.4"
  masterUsername: admin
  masterUserPassword:
    namespace: default
    name: db-secret
    key: password
  allocatedStorage: 20
  storageEncrypted: true
  kmsKeyID: arn:aws:kms:ap-south-1:123456789:key/your-key
  enableCloudwatchLogsExports:
    - postgresql    # for postgres
    # - audit, error, general, slowquery  # for mysql
  enablePerformanceInsights: true
  performanceInsightsRetentionPeriod: 7
  deletionProtection: true
  multiAZ: true
  backupRetentionPeriod: 35   # max for compliance
  copyTagsToSnapshot: true
```

---
