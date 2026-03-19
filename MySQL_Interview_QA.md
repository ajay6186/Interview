# MySQL Interview Questions & Answers (6-7 Years Experience)

---

## 1. Core Concepts & Architecture

### Q1: Explain MySQL's architecture and storage engines.

**Answer:**

```
Client Layer → Connection Pool → SQL Parser → Optimizer → Storage Engine
```

**MySQL Architecture Layers:**
1. **Connection Layer** — Thread handling, authentication, security
2. **Server Layer** — Query parsing, optimization, caching, built-in functions
3. **Storage Engine Layer** — Pluggable engines that handle data storage/retrieval

**Key Storage Engines:**

| Feature | InnoDB (Default) | MyISAM |
|---------|-----------------|--------|
| Transactions | Yes (ACID) | No |
| Row-level Lock | Yes | Table-level only |
| Foreign Keys | Yes | No |
| Crash Recovery | Yes (redo log) | No |
| Full-text Index | Yes (5.6+) | Yes |
| Clustered Index | Yes | No |
| MVCC | Yes | No |

**InnoDB Architecture:**
- **Buffer Pool** — Caches data and index pages in memory
- **Redo Log (WAL)** — Write-Ahead Logging for crash recovery
- **Undo Log** — For transaction rollback and MVCC
- **Doublewrite Buffer** — Prevents partial page writes
- **Adaptive Hash Index** — Auto-created hash indexes for hot pages

```sql
-- Check storage engine
SHOW TABLE STATUS LIKE 'users';

-- Change engine
ALTER TABLE users ENGINE = InnoDB;

-- Check InnoDB buffer pool
SHOW GLOBAL STATUS LIKE 'Innodb_buffer_pool%';
```

---

### Q2: Explain MySQL Indexes in depth. Types, strategies, and pitfalls.

**Answer:**

**Index Types:**

```sql
-- 1. B-Tree Index (default) — Most common
CREATE INDEX idx_name ON users(name);

-- 2. Composite/Multi-column Index
CREATE INDEX idx_name_email ON users(last_name, first_name, email);
-- Follows LEFTMOST PREFIX rule:
-- ✅ WHERE last_name = 'Smith'
-- ✅ WHERE last_name = 'Smith' AND first_name = 'John'
-- ✅ WHERE last_name = 'Smith' AND first_name = 'John' AND email = '...'
-- ❌ WHERE first_name = 'John' (doesn't use index - skips leftmost)
-- ❌ WHERE email = '...' (doesn't use index)

-- 3. Unique Index
CREATE UNIQUE INDEX idx_email ON users(email);

-- 4. Full-text Index
CREATE FULLTEXT INDEX idx_content ON articles(title, body);
SELECT * FROM articles WHERE MATCH(title, body) AGAINST('mysql optimization' IN BOOLEAN MODE);

-- 5. Prefix Index (for long strings)
CREATE INDEX idx_email_prefix ON users(email(10));

-- 6. Covering Index — index contains all needed columns
CREATE INDEX idx_covering ON orders(user_id, status, total);
-- This query uses ONLY the index (no table lookup):
SELECT status, total FROM orders WHERE user_id = 1;
-- EXPLAIN shows "Using index" in Extra
```

**Index Strategies:**

```sql
-- Analyze index usage
EXPLAIN SELECT * FROM users WHERE email = 'test@example.com';
EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = 1 AND status = 'pending';

-- Key EXPLAIN columns:
-- type: const > eq_ref > ref > range > index > ALL
-- key: Which index is used
-- rows: Estimated rows examined
-- Extra: "Using index" = covering index, "Using filesort" = bad

-- Find unused indexes
SELECT * FROM sys.schema_unused_indexes;

-- Find duplicate indexes
SELECT * FROM sys.schema_redundant_indexes;

-- Index hints (use sparingly)
SELECT * FROM orders USE INDEX (idx_user_status) WHERE user_id = 1;
SELECT * FROM orders FORCE INDEX (idx_user_status) WHERE user_id = 1;
```

**When NOT to index:**
1. Tables with very few rows (< 1000)
2. Columns with low cardinality (e.g., boolean, gender)
3. Frequently updated columns (index maintenance overhead)
4. Columns rarely used in WHERE/JOIN/ORDER BY

---

### Q3: Explain MySQL Transactions and Isolation Levels.

**Answer:**

**ACID Properties:**
- **Atomicity** — All or nothing
- **Consistency** — Valid state transitions only
- **Isolation** — Concurrent transactions don't interfere
- **Durability** — Committed data persists after crash

```sql
-- Basic transaction
START TRANSACTION;  -- or BEGIN
    INSERT INTO accounts (user_id, balance) VALUES (1, 1000);
    UPDATE accounts SET balance = balance - 500 WHERE user_id = 2;
    -- If any error:
    -- ROLLBACK;
COMMIT;

-- Savepoints
START TRANSACTION;
    INSERT INTO orders (user_id, total) VALUES (1, 100);
    SAVEPOINT sp1;
    INSERT INTO order_items (order_id, product_id) VALUES (1, 999);
    -- This item has an error, rollback just this part
    ROLLBACK TO SAVEPOINT sp1;
    INSERT INTO order_items (order_id, product_id) VALUES (1, 100);
COMMIT;
```

**Isolation Levels:**

| Level | Dirty Read | Non-Repeatable Read | Phantom Read | Performance |
|-------|-----------|-------------------|-------------|-------------|
| READ UNCOMMITTED | Yes | Yes | Yes | Fastest |
| READ COMMITTED | No | Yes | Yes | Fast |
| REPEATABLE READ (default) | No | No | Yes* | Medium |
| SERIALIZABLE | No | No | No | Slowest |

*InnoDB prevents phantom reads at REPEATABLE READ using gap locks.

```sql
-- Set isolation level
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
-- or globally
SET GLOBAL TRANSACTION ISOLATION LEVEL REPEATABLE READ;

-- Check current level
SELECT @@transaction_isolation;
```

**Concurrency Problems Explained:**

```sql
-- Dirty Read: Reading uncommitted data from another transaction
-- Transaction A: UPDATE users SET balance = 0 WHERE id = 1; (not committed)
-- Transaction B: SELECT balance FROM users WHERE id = 1; -- reads 0 (dirty!)
-- Transaction A: ROLLBACK; -- balance is actually unchanged

-- Non-Repeatable Read: Same query returns different results
-- Transaction A: SELECT balance FROM users WHERE id = 1; -- returns 1000
-- Transaction B: UPDATE users SET balance = 500 WHERE id = 1; COMMIT;
-- Transaction A: SELECT balance FROM users WHERE id = 1; -- returns 500 (different!)

-- Phantom Read: New rows appear in repeated query
-- Transaction A: SELECT COUNT(*) FROM orders WHERE status = 'pending'; -- 10
-- Transaction B: INSERT INTO orders (status) VALUES ('pending'); COMMIT;
-- Transaction A: SELECT COUNT(*) FROM orders WHERE status = 'pending'; -- 11 (phantom!)
```

---

### Q4: Explain MySQL Locking mechanisms.

**Answer:**

```sql
-- 1. ROW-LEVEL LOCKS (InnoDB)

-- Shared Lock (S) — allows others to read, blocks writes
SELECT * FROM users WHERE id = 1 FOR SHARE;  -- MySQL 8.0+
SELECT * FROM users WHERE id = 1 LOCK IN SHARE MODE;  -- older syntax

-- Exclusive Lock (X) — blocks reads and writes
SELECT * FROM users WHERE id = 1 FOR UPDATE;

-- Skip locked rows (great for job queues)
SELECT * FROM jobs WHERE status = 'pending'
    ORDER BY created_at
    LIMIT 1
    FOR UPDATE SKIP LOCKED;

-- Nowait — fail immediately if locked
SELECT * FROM users WHERE id = 1 FOR UPDATE NOWAIT;

-- 2. GAP LOCKS (prevent phantom reads in REPEATABLE READ)
-- Locks the "gap" between index records
-- If index has values 10, 20, 30:
SELECT * FROM t WHERE id BETWEEN 15 AND 25 FOR UPDATE;
-- Locks gap (10, 20] and (20, 30)

-- 3. TABLE LOCKS
LOCK TABLES users WRITE;
-- ... operations
UNLOCK TABLES;

-- 4. DEADLOCK DETECTION
-- InnoDB automatically detects deadlocks and rolls back one transaction

-- Example deadlock scenario:
-- Transaction A: UPDATE accounts SET balance = 100 WHERE id = 1; (locks row 1)
-- Transaction B: UPDATE accounts SET balance = 200 WHERE id = 2; (locks row 2)
-- Transaction A: UPDATE accounts SET balance = 300 WHERE id = 2; (waits for B)
-- Transaction B: UPDATE accounts SET balance = 400 WHERE id = 1; (waits for A → DEADLOCK!)

-- Prevention strategies:
-- 1. Always lock rows in the same order
-- 2. Keep transactions short
-- 3. Use appropriate isolation level
-- 4. Add proper indexes (reduces lock scope)

-- View current locks
SELECT * FROM performance_schema.data_locks;
SELECT * FROM information_schema.INNODB_TRX;

-- Check deadlock info
SHOW ENGINE INNODB STATUS;
```

---

### Q5: How do you optimize slow MySQL queries?

**Answer:**

```sql
-- STEP 1: Identify slow queries
-- Enable slow query log
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1;  -- seconds
SET GLOBAL log_queries_not_using_indexes = 'ON';

-- STEP 2: Analyze with EXPLAIN
EXPLAIN ANALYZE
SELECT o.id, o.total, u.name
FROM orders o
JOIN users u ON o.user_id = u.id
WHERE o.status = 'pending'
  AND o.created_at > '2025-01-01'
ORDER BY o.created_at DESC
LIMIT 20;

-- STEP 3: Common optimizations

-- a) Add proper indexes
CREATE INDEX idx_orders_status_created ON orders(status, created_at DESC);

-- b) Avoid SELECT *
-- ❌ SELECT * FROM orders WHERE user_id = 1;
-- ✅ SELECT id, total, status FROM orders WHERE user_id = 1;

-- c) Use covering indexes
CREATE INDEX idx_covering ON orders(user_id, status, total, created_at);

-- d) Avoid functions on indexed columns
-- ❌ WHERE YEAR(created_at) = 2025
-- ✅ WHERE created_at >= '2025-01-01' AND created_at < '2026-01-01'

-- ❌ WHERE LOWER(email) = 'test@example.com'
-- ✅ Use case-insensitive collation or generated column

-- e) Use EXISTS instead of IN for subqueries
-- ❌ SELECT * FROM users WHERE id IN (SELECT user_id FROM orders);
-- ✅ SELECT * FROM users u WHERE EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id);

-- f) Optimize JOINs
-- Ensure join columns are indexed
-- Use smaller table as the driving table
-- Avoid joining too many tables (max 3-4)

-- g) Pagination optimization (avoid large OFFSET)
-- ❌ SELECT * FROM products ORDER BY id LIMIT 10 OFFSET 100000;
-- ✅ Keyset pagination:
SELECT * FROM products WHERE id > 100000 ORDER BY id LIMIT 10;

-- h) Batch operations
-- ❌ DELETE FROM logs WHERE created_at < '2024-01-01';  -- locks entire table
-- ✅ Batch delete:
DELETE FROM logs WHERE created_at < '2024-01-01' LIMIT 10000;
-- Repeat in a loop

-- STEP 4: Monitor query performance
SELECT
    digest_text,
    count_star AS exec_count,
    avg_timer_wait / 1000000000 AS avg_ms,
    sum_rows_examined,
    sum_rows_sent
FROM performance_schema.events_statements_summary_by_digest
ORDER BY avg_timer_wait DESC
LIMIT 20;
```

---

### Q6: Explain MySQL Replication and High Availability.

**Answer:**

```
                     ┌── Replica 1 (reads)
Primary (writes) ───┤
                     └── Replica 2 (reads)
```

**Replication Types:**

| Type | How it works | Pros | Cons |
|------|-------------|------|------|
| Async | Primary doesn't wait | Fast writes | Data loss possible |
| Semi-sync | Waits for 1 replica ACK | Better safety | Slightly slower |
| Group Replication | Consensus-based | Auto-failover | More complex |

```sql
-- Check replication status
SHOW REPLICA STATUS\G  -- MySQL 8.0.22+

-- Key fields to monitor:
-- Seconds_Behind_Source: Replication lag
-- Replica_IO_Running: Must be "Yes"
-- Replica_SQL_Running: Must be "Yes"

-- GTID-based replication (recommended)
-- my.cnf on Primary:
-- gtid_mode=ON
-- enforce_gtid_consistency=ON
-- server_id=1

-- On Replica:
CHANGE REPLICATION SOURCE TO
    SOURCE_HOST='primary-host',
    SOURCE_USER='repl_user',
    SOURCE_AUTO_POSITION=1;
START REPLICA;
```

**High Availability Solutions:**

1. **MySQL InnoDB Cluster** — Group Replication + MySQL Router + MySQL Shell
2. **ProxySQL** — Query routing, read/write splitting, connection pooling
3. **Orchestrator** — Automated failover
4. **MySQL on Kubernetes** — MySQL Operator

```sql
-- Read/Write splitting with ProxySQL
-- Writes go to primary
-- Reads go to replicas

-- Application-level (Django example)
class ReplicaRouter:
    def db_for_read(self, model, **hints):
        return 'replica'

    def db_for_write(self, model, **hints):
        return 'default'
```

---

### Q7: How do you design schemas for performance?

**Answer:**

```sql
-- 1. NORMALIZATION vs DENORMALIZATION

-- Normalized (3NF) — for OLTP
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Denormalized — for read-heavy / reporting
CREATE TABLE order_summary (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    user_name VARCHAR(100),      -- denormalized from users
    user_email VARCHAR(255),      -- denormalized from users
    total DECIMAL(10,2),
    created_at TIMESTAMP
);

-- 2. DATA TYPES — Choose the smallest appropriate type
-- ❌ BIGINT for a status field
-- ✅ TINYINT UNSIGNED (0-255)

-- ❌ VARCHAR(255) for everything
-- ✅ VARCHAR(50) for names, CHAR(2) for country codes

-- ❌ TEXT for short descriptions
-- ✅ VARCHAR(500)

-- ❌ DATETIME for timestamps
-- ✅ TIMESTAMP (4 bytes vs 8 bytes, auto timezone conversion)

-- Use UNSIGNED for non-negative numbers
-- INT UNSIGNED: 0 to 4,294,967,295
-- BIGINT UNSIGNED: for very large IDs

-- 3. PARTITIONING — for very large tables
CREATE TABLE logs (
    id BIGINT AUTO_INCREMENT,
    message TEXT,
    created_at DATETIME NOT NULL,
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (YEAR(created_at)) (
    PARTITION p2023 VALUES LESS THAN (2024),
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION p2025 VALUES LESS THAN (2026),
    PARTITION p_future VALUES LESS THAN MAXVALUE
);

-- Drop old data efficiently
ALTER TABLE logs DROP PARTITION p2023;

-- 4. JSON COLUMNS (MySQL 5.7+)
CREATE TABLE products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200),
    attributes JSON,
    INDEX idx_brand ((CAST(attributes->>'$.brand' AS CHAR(50))))  -- generated column index
);

INSERT INTO products (name, attributes) VALUES
('Laptop', '{"brand": "Dell", "ram": 16, "storage": "512GB"}');

-- Query JSON
SELECT * FROM products
WHERE attributes->>'$.brand' = 'Dell'
  AND CAST(attributes->>'$.ram' AS UNSIGNED) >= 16;

-- 5. GENERATED/VIRTUAL COLUMNS
ALTER TABLE users ADD COLUMN
    full_name VARCHAR(200) AS (CONCAT(first_name, ' ', last_name)) STORED;

CREATE INDEX idx_full_name ON users(full_name);
```

---

### Q8: Explain MySQL Window Functions.

**Answer:**

```sql
-- Window functions perform calculations across rows related to current row
-- Available in MySQL 8.0+

-- 1. ROW_NUMBER, RANK, DENSE_RANK
SELECT
    name,
    department,
    salary,
    ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) AS row_num,
    RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS rank_num,
    DENSE_RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS dense_rank_num
FROM employees;

-- ROW_NUMBER: 1, 2, 3, 4 (always unique)
-- RANK:       1, 2, 2, 4 (ties skip ranks)
-- DENSE_RANK: 1, 2, 2, 3 (ties don't skip)

-- 2. Get top N per group (e.g., top 3 earners per department)
WITH ranked AS (
    SELECT *,
        ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) AS rn
    FROM employees
)
SELECT * FROM ranked WHERE rn <= 3;

-- 3. Running totals
SELECT
    date,
    amount,
    SUM(amount) OVER (ORDER BY date) AS running_total,
    SUM(amount) OVER (ORDER BY date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS weekly_sum
FROM daily_sales;

-- 4. LAG and LEAD — access previous/next rows
SELECT
    month,
    revenue,
    LAG(revenue, 1) OVER (ORDER BY month) AS prev_month_revenue,
    revenue - LAG(revenue, 1) OVER (ORDER BY month) AS month_over_month,
    LEAD(revenue, 1) OVER (ORDER BY month) AS next_month_revenue
FROM monthly_revenue;

-- 5. FIRST_VALUE, LAST_VALUE, NTH_VALUE
SELECT
    name,
    department,
    salary,
    FIRST_VALUE(name) OVER (PARTITION BY department ORDER BY salary DESC) AS highest_paid,
    LAST_VALUE(name) OVER (
        PARTITION BY department ORDER BY salary DESC
        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    ) AS lowest_paid
FROM employees;

-- 6. PERCENT_RANK and CUME_DIST
SELECT
    name,
    salary,
    PERCENT_RANK() OVER (ORDER BY salary) AS percentile,
    CUME_DIST() OVER (ORDER BY salary) AS cumulative_dist
FROM employees;

-- 7. Named windows (reuse)
SELECT
    name,
    department,
    salary,
    AVG(salary) OVER w AS dept_avg,
    MAX(salary) OVER w AS dept_max,
    salary - AVG(salary) OVER w AS diff_from_avg
FROM employees
WINDOW w AS (PARTITION BY department);
```

---

### Q9: How do you handle MySQL backups and disaster recovery?

**Answer:**

```bash
# 1. LOGICAL BACKUP — mysqldump
# Full backup
mysqldump -u root -p --all-databases --single-transaction --routines --triggers > full_backup.sql

# Single database
mysqldump -u root -p --single-transaction mydb > mydb_backup.sql

# Specific tables
mysqldump -u root -p mydb users orders > tables_backup.sql

# Restore
mysql -u root -p mydb < mydb_backup.sql

# 2. PHYSICAL BACKUP — MySQL Enterprise Backup or Percona XtraBackup
# xtrabackup --backup --target-dir=/backup/full
# xtrabackup --prepare --target-dir=/backup/full
# xtrabackup --copy-back --target-dir=/backup/full

# 3. POINT-IN-TIME RECOVERY using binary logs
# Enable binary logging in my.cnf:
# log_bin = mysql-bin
# binlog_format = ROW
# expire_logs_days = 14

# Restore to a point in time:
# 1. Restore last full backup
# 2. Apply binlogs up to the desired time:
# mysqlbinlog --stop-datetime="2025-06-15 10:30:00" mysql-bin.000001 | mysql -u root -p
```

```sql
-- 4. BACKUP VERIFICATION (critical!)
-- Always test restores on a staging server

-- 5. Binary log management
SHOW BINARY LOGS;
SHOW BINLOG EVENTS IN 'mysql-bin.000001' LIMIT 20;
PURGE BINARY LOGS BEFORE '2025-01-01 00:00:00';

-- 6. Check data integrity
CHECK TABLE users;
CHECKSUM TABLE users;
```

**Backup Strategy for Production:**
- **Daily**: Full logical backup (mysqldump with --single-transaction)
- **Continuous**: Binary log replication to backup server
- **Weekly**: Physical backup (XtraBackup)
- **Monthly**: Test restore procedure on staging
- Store backups in multiple locations (local + cloud)

---

### Q10: Explain MySQL Common Table Expressions (CTEs) and Recursive Queries.

**Answer:**

```sql
-- 1. BASIC CTE
WITH active_users AS (
    SELECT id, name, email
    FROM users
    WHERE is_active = 1
      AND last_login > DATE_SUB(NOW(), INTERVAL 30 DAY)
)
SELECT au.name, COUNT(o.id) AS order_count
FROM active_users au
JOIN orders o ON o.user_id = au.id
GROUP BY au.id, au.name;

-- 2. MULTIPLE CTEs
WITH
monthly_sales AS (
    SELECT
        DATE_FORMAT(created_at, '%Y-%m') AS month,
        SUM(total) AS revenue
    FROM orders
    WHERE created_at >= '2025-01-01'
    GROUP BY month
),
monthly_costs AS (
    SELECT
        DATE_FORMAT(date, '%Y-%m') AS month,
        SUM(amount) AS cost
    FROM expenses
    WHERE date >= '2025-01-01'
    GROUP BY month
)
SELECT
    ms.month,
    ms.revenue,
    mc.cost,
    ms.revenue - mc.cost AS profit
FROM monthly_sales ms
LEFT JOIN monthly_costs mc ON ms.month = mc.month
ORDER BY ms.month;

-- 3. RECURSIVE CTE — for hierarchical data
-- Employee hierarchy / org chart
CREATE TABLE employees (
    id INT PRIMARY KEY,
    name VARCHAR(100),
    manager_id INT,
    FOREIGN KEY (manager_id) REFERENCES employees(id)
);

WITH RECURSIVE org_chart AS (
    -- Base case: top-level managers (no manager)
    SELECT id, name, manager_id, 0 AS level, CAST(name AS CHAR(1000)) AS path
    FROM employees
    WHERE manager_id IS NULL

    UNION ALL

    -- Recursive case: employees with managers
    SELECT e.id, e.name, e.manager_id, oc.level + 1,
           CONCAT(oc.path, ' > ', e.name)
    FROM employees e
    JOIN org_chart oc ON e.manager_id = oc.id
)
SELECT * FROM org_chart ORDER BY path;

-- Result:
-- | id | name    | level | path                        |
-- |----|---------|-------|-----------------------------|
-- | 1  | CEO     | 0     | CEO                         |
-- | 2  | VP Eng  | 1     | CEO > VP Eng                |
-- | 4  | Dev Lead| 2     | CEO > VP Eng > Dev Lead     |
-- | 3  | VP Sales| 1     | CEO > VP Sales              |

-- 4. RECURSIVE CTE — Generate date series
WITH RECURSIVE date_series AS (
    SELECT DATE('2025-01-01') AS date
    UNION ALL
    SELECT DATE_ADD(date, INTERVAL 1 DAY)
    FROM date_series
    WHERE date < '2025-12-31'
)
SELECT ds.date, COALESCE(COUNT(o.id), 0) AS order_count
FROM date_series ds
LEFT JOIN orders o ON DATE(o.created_at) = ds.date
GROUP BY ds.date;
```

---

### Q11: How do you monitor and tune MySQL performance?

**Answer:**

```sql
-- 1. KEY PERFORMANCE METRICS

-- Buffer pool hit ratio (should be > 99%)
SELECT
    (1 - (
        (SELECT variable_value FROM performance_schema.global_status WHERE variable_name = 'Innodb_buffer_pool_reads') /
        (SELECT variable_value FROM performance_schema.global_status WHERE variable_name = 'Innodb_buffer_pool_read_requests')
    )) * 100 AS buffer_pool_hit_ratio;

-- Connection usage
SHOW GLOBAL STATUS LIKE 'Threads_connected';
SHOW GLOBAL STATUS LIKE 'Max_used_connections';
SHOW VARIABLES LIKE 'max_connections';

-- Query cache (removed in MySQL 8.0, use ProxySQL query cache instead)

-- 2. IMPORTANT my.cnf TUNING

-- InnoDB Buffer Pool (most important — set to 70-80% of RAM for dedicated server)
-- innodb_buffer_pool_size = 12G
-- innodb_buffer_pool_instances = 8

-- Redo log
-- innodb_log_file_size = 1G
-- innodb_log_buffer_size = 64M

-- I/O
-- innodb_io_capacity = 2000
-- innodb_io_capacity_max = 4000

-- Connections
-- max_connections = 500
-- wait_timeout = 300

-- Temp tables
-- tmp_table_size = 256M
-- max_heap_table_size = 256M

-- 3. PERFORMANCE SCHEMA
-- Enable performance schema monitoring
UPDATE performance_schema.setup_instruments
SET ENABLED = 'YES', TIMED = 'YES'
WHERE NAME LIKE 'statement/%';

-- Top queries by execution time
SELECT
    DIGEST_TEXT,
    COUNT_STAR AS exec_count,
    ROUND(AVG_TIMER_WAIT/1000000000, 2) AS avg_ms,
    ROUND(SUM_TIMER_WAIT/1000000000, 2) AS total_ms,
    SUM_ROWS_EXAMINED,
    SUM_ROWS_SENT,
    FIRST_SEEN,
    LAST_SEEN
FROM performance_schema.events_statements_summary_by_digest
ORDER BY SUM_TIMER_WAIT DESC
LIMIT 10;

-- 4. SHOW PROCESSLIST — see running queries
SHOW FULL PROCESSLIST;

-- Kill long-running query
KILL QUERY <process_id>;

-- 5. Table maintenance
ANALYZE TABLE users;   -- Update index statistics
OPTIMIZE TABLE users;  -- Reclaim space, defragment
```

---

### Q12: Explain the differences between DELETE, TRUNCATE, and DROP.

**Answer:**

| Feature | DELETE | TRUNCATE | DROP |
|---------|--------|----------|------|
| Type | DML | DDL | DDL |
| WHERE clause | Yes | No | No |
| Rollback | Yes | No* | No |
| Triggers | Fires | Doesn't fire | Doesn't fire |
| Auto-increment | Keeps value | Resets to 1 | N/A |
| Speed | Slow (row-by-row) | Fast | Fast |
| Space | Doesn't free | Frees | Frees |
| Foreign Keys | Checked | Fails if FK exists | CASCADE option |
| Logging | Full row logging | Minimal | Minimal |

```sql
DELETE FROM users WHERE id = 1;       -- Remove specific rows
DELETE FROM users;                     -- Remove all rows (slow, logged)
TRUNCATE TABLE users;                  -- Remove all rows (fast, resets AI)
DROP TABLE users;                      -- Remove entire table structure
```

---

### Q13: How do you handle database migrations safely in production?

**Answer:**

```sql
-- PRINCIPLE: Never break the running application during migration

-- SAFE: Adding a column with a default
ALTER TABLE users ADD COLUMN phone VARCHAR(20) DEFAULT NULL;

-- SAFE: Adding an index (use ALGORITHM=INPLACE for no downtime)
ALTER TABLE users ADD INDEX idx_email (email), ALGORITHM=INPLACE, LOCK=NONE;

-- DANGEROUS: Renaming a column (breaks existing queries)
-- Instead: Add new column → backfill → deploy code → drop old column

-- DANGEROUS: Changing column type
-- Instead: Add new column → dual-write → backfill → switch reads → drop old

-- ONLINE SCHEMA CHANGE for large tables (millions of rows)
-- Use pt-online-schema-change (Percona) or gh-ost (GitHub)
-- These create a shadow table, copy data, then swap

-- Migration checklist:
-- 1. Test migration on staging with production-size data
-- 2. Estimate lock time and I/O impact
-- 3. Schedule during low-traffic periods
-- 4. Have rollback plan ready
-- 5. Monitor replication lag during migration
-- 6. Use ALGORITHM=INPLACE when possible

-- Check if ALTER is online:
ALTER TABLE users ADD COLUMN age INT, ALGORITHM=INPLACE, LOCK=NONE;
-- If MySQL rejects it, it means the operation requires a table copy
```

---

### Q14: Explain MySQL Security Best Practices.

**Answer:**

```sql
-- 1. USER MANAGEMENT
-- Create users with minimal privileges
CREATE USER 'app_user'@'10.0.0.%' IDENTIFIED BY 'strong_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON mydb.* TO 'app_user'@'10.0.0.%';

-- Read-only user for reporting
CREATE USER 'report_user'@'%' IDENTIFIED BY 'password';
GRANT SELECT ON mydb.* TO 'report_user'@'%';

-- Never use root for application connections
-- Use different users for different purposes (app, admin, backup, monitoring)

-- 2. PASSWORD POLICIES
ALTER USER 'app_user'@'%' PASSWORD EXPIRE INTERVAL 90 DAY;
ALTER USER 'app_user'@'%' FAILED_LOGIN_ATTEMPTS 3 PASSWORD_LOCK_TIME 1;

-- 3. SSL/TLS
ALTER USER 'app_user'@'%' REQUIRE SSL;

-- 4. SQL INJECTION PREVENTION
-- Always use parameterized queries in application code
-- Never concatenate user input into SQL strings

-- Python example:
-- ❌ cursor.execute(f"SELECT * FROM users WHERE email = '{email}'")
-- ✅ cursor.execute("SELECT * FROM users WHERE email = %s", (email,))

-- 5. AUDIT
-- Enable audit log (MySQL Enterprise or audit plugin)
-- Monitor failed login attempts
SELECT * FROM performance_schema.host_cache;

-- 6. Network security
-- Bind to specific IP, not 0.0.0.0
-- bind-address = 10.0.0.5
-- Use firewall rules to restrict access
-- Disable remote root access
```

---

### Q15: Write complex SQL queries commonly asked in interviews.

**Answer:**

```sql
-- 1. Second highest salary
SELECT DISTINCT salary
FROM employees
ORDER BY salary DESC
LIMIT 1 OFFSET 1;

-- Nth highest salary (generic)
SELECT DISTINCT salary
FROM employees
ORDER BY salary DESC
LIMIT 1 OFFSET N-1;

-- Using window function
WITH ranked AS (
    SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS rnk
    FROM employees
)
SELECT DISTINCT salary FROM ranked WHERE rnk = 2;

-- 2. Employees earning more than their manager
SELECT e.name AS employee, e.salary, m.name AS manager, m.salary AS manager_salary
FROM employees e
JOIN employees m ON e.manager_id = m.id
WHERE e.salary > m.salary;

-- 3. Consecutive login days
WITH login_groups AS (
    SELECT
        user_id,
        login_date,
        DATE_SUB(login_date, INTERVAL ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY login_date) DAY) AS grp
    FROM (SELECT DISTINCT user_id, DATE(login_time) AS login_date FROM logins) t
)
SELECT user_id, MIN(login_date) AS streak_start, MAX(login_date) AS streak_end,
       COUNT(*) AS consecutive_days
FROM login_groups
GROUP BY user_id, grp
HAVING COUNT(*) >= 3;

-- 4. Year-over-year growth
WITH yearly AS (
    SELECT
        YEAR(order_date) AS year,
        SUM(amount) AS revenue
    FROM orders
    GROUP BY YEAR(order_date)
)
SELECT
    year,
    revenue,
    LAG(revenue) OVER (ORDER BY year) AS prev_year,
    ROUND((revenue - LAG(revenue) OVER (ORDER BY year)) / LAG(revenue) OVER (ORDER BY year) * 100, 2) AS yoy_growth_pct
FROM yearly;

-- 5. Find duplicate records
SELECT email, COUNT(*) AS cnt
FROM users
GROUP BY email
HAVING COUNT(*) > 1;

-- Delete duplicates, keep the one with lowest id
DELETE u1 FROM users u1
INNER JOIN users u2
WHERE u1.id > u2.id AND u1.email = u2.email;

-- 6. Pivot table (rows to columns)
SELECT
    user_id,
    SUM(CASE WHEN MONTH(order_date) = 1 THEN amount ELSE 0 END) AS jan,
    SUM(CASE WHEN MONTH(order_date) = 2 THEN amount ELSE 0 END) AS feb,
    SUM(CASE WHEN MONTH(order_date) = 3 THEN amount ELSE 0 END) AS mar
FROM orders
WHERE YEAR(order_date) = 2025
GROUP BY user_id;

-- 7. Running average
SELECT
    date,
    revenue,
    AVG(revenue) OVER (ORDER BY date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS seven_day_avg
FROM daily_revenue;

-- 8. Find gaps in sequential data
SELECT
    t1.id + 1 AS gap_start,
    MIN(t2.id) - 1 AS gap_end
FROM my_table t1
JOIN my_table t2 ON t2.id > t1.id
WHERE t1.id + 1 <> (SELECT MIN(id) FROM my_table WHERE id > t1.id)
GROUP BY t1.id;
```
