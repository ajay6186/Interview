import sqlite3

# Create in-memory database
conn = sqlite3.connect(':memory:')
cursor = conn.cursor()

# ============================================
# 1. Create employees table
# ============================================
cursor.execute('''
    CREATE TABLE employees (
        id INTEGER PRIMARY KEY,
        name TEXT,
        department TEXT,
        salary INTEGER
    )
''')

# Insert test data
cursor.executemany('''
    INSERT INTO employees (id, name, department, salary) VALUES (?, ?, ?, ?)
''', [
    (1, 'Ajay',   'IT', 50000),
    (2, 'Rahul',  'IT', 60000),
    (3, 'Neha',   'HR', 40000),
    (4, 'Simran', 'HR', 45000),
    (5, 'Mohan',  'IT', 70000),
])

# ============================================
# 2. Create orders table (for backend example)
# ============================================
cursor.execute('''
    CREATE TABLE orders (
        id INTEGER PRIMARY KEY,
        user_id INTEGER,
        amount INTEGER
    )
''')

cursor.executemany('''
    INSERT INTO orders (id, user_id, amount) VALUES (?, ?, ?)
''', [
    (1,  101, 500),
    (2,  101, 300),
    (3,  101, 700),
    (4,  101, 200),
    (5,  101, 400),
    (6,  101, 600),  # user 101 -> 6 orders
    (7,  102, 100),
    (8,  102, 250),
    (9,  102, 350),  # user 102 -> 3 orders
    (10, 103, 800),
    (11, 103, 900),
    (12, 103, 150),
    (13, 103, 450),
    (14, 103, 550),
    (15, 103, 650),
    (16, 103, 750),  # user 103 -> 7 orders
    (17, 104, 100),
    (18, 104, 200),  # user 104 -> 2 orders
])

conn.commit()

# ============================================
# Helper to run and print queries
# ============================================
def run_query(title, sql):
    print(f"\n{'='*50}")
    print(f"  {title}")
    print(f"{'='*50}")
    print(f"SQL: {sql}\n")
    cursor.execute(sql)
    rows = cursor.fetchall()
    cols = [desc[0] for desc in cursor.description]
    print(f"  {cols}")
    for row in rows:
        print(f"  {list(row)}")
    if not rows:
        print("  (no results)")
    print()


# ============================================
# EXECUTION ORDER DEMO
# SQL writes:  SELECT -> FROM -> WHERE -> GROUP BY -> HAVING -> ORDER BY
# SQL runs:    FROM -> WHERE -> GROUP BY -> HAVING -> SELECT -> ORDER BY
# ============================================

print("\n" + "#"*60)
print("  SQL EXECUTION ORDER PRACTICE")
print("#"*60)

# Step 1: FROM - see all data
run_query(
    "Step 1: FROM - Load all rows",
    "SELECT * FROM employees"
)

# Step 2: WHERE - filter rows
run_query(
    "Step 2: WHERE - Filter rows (salary > 30000)",
    "SELECT * FROM employees WHERE salary > 30000"
)

# Step 3: GROUP BY - create groups
run_query(
    "Step 3: GROUP BY - Group by department",
    "SELECT department, COUNT(*) as emp_count FROM employees GROUP BY department"
)

# Step 4: HAVING - filter groups
run_query(
    "Step 4: HAVING - Keep groups with count > 2",
    "SELECT department, COUNT(*) as emp_count FROM employees GROUP BY department HAVING COUNT(*) > 2"
)

# Full query: WHERE + GROUP BY + HAVING + ORDER BY
run_query(
    "FULL QUERY: WHERE + GROUP BY + HAVING + ORDER BY",
    """SELECT department, COUNT(*) as emp_count
       FROM employees
       WHERE salary > 30000
       GROUP BY department
       HAVING COUNT(*) > 2
       ORDER BY emp_count DESC"""
)

# ============================================
# WHERE vs HAVING comparison
# ============================================
print("\n" + "#"*60)
print("  WHERE vs HAVING COMPARISON")
print("#"*60)

run_query(
    "WHERE filters ROWS (before grouping)",
    "SELECT department, COUNT(*) as emp_count FROM employees WHERE salary > 50000 GROUP BY department"
)

run_query(
    "HAVING filters GROUPS (after grouping)",
    "SELECT department, COUNT(*) as emp_count FROM employees GROUP BY department HAVING COUNT(*) > 2"
)

# ============================================
# AVG with HAVING
# ============================================
run_query(
    "AVG salary > 50000 per department (uses HAVING, not WHERE)",
    "SELECT department, AVG(salary) as avg_salary FROM employees GROUP BY department HAVING AVG(salary) > 50000"
)

# ============================================
# COUNT(*) vs COUNT(column)
# ============================================
print("\n" + "#"*60)
print("  COUNT(*) vs COUNT(column)")
print("#"*60)

# Add a row with NULL salary to show difference
cursor.execute("INSERT INTO employees (id, name, department, salary) VALUES (6, 'Priya', 'IT', NULL)")
conn.commit()

run_query(
    "COUNT(*) counts ALL rows (including NULL)",
    "SELECT department, COUNT(*) as count_all FROM employees GROUP BY department"
)

run_query(
    "COUNT(salary) counts only NON-NULL values",
    "SELECT department, COUNT(salary) as count_salary FROM employees GROUP BY department"
)

# ============================================
# Orders example (Backend/Django use case)
# ============================================
print("\n" + "#"*60)
print("  ORDERS TABLE - Backend Use Case")
print("#"*60)

run_query(
    "All orders",
    "SELECT * FROM orders"
)

run_query(
    "Orders per user",
    "SELECT user_id, COUNT(*) as total_orders FROM orders GROUP BY user_id"
)

run_query(
    "Users with more than 5 orders (sorted DESC)",
    """SELECT user_id, COUNT(*) as total_orders
       FROM orders
       GROUP BY user_id
       HAVING COUNT(*) > 5
       ORDER BY total_orders DESC"""
)

conn.close()

print("\n" + "#"*60)
print("  SUMMARY: SQL Execution Order")
print("#"*60)
print("""
  Written Order:        Execution Order:
  -------------         ----------------
  SELECT                1. FROM
  FROM                  2. WHERE       (filter rows)
  WHERE                 3. GROUP BY    (create groups)
  GROUP BY              4. HAVING      (filter groups)
  HAVING                5. SELECT      (pick columns)
  ORDER BY              6. ORDER BY    (sort result)

  KEY RULE:
  - WHERE  -> works on ROWS,   CANNOT use COUNT/SUM/AVG
  - HAVING -> works on GROUPS, CAN use COUNT/SUM/AVG
""")
