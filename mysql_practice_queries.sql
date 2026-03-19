-- ============================================================
-- MySQL Practice Queries — All Topics
-- Run these AFTER executing mysql_practice_setup.sql
-- ============================================================

USE interview_practice;

-- ============================================================
-- TOPIC 1: WINDOW FUNCTIONS
-- ============================================================

-- 1.1 ROW_NUMBER, RANK, DENSE_RANK
-- Find salary ranking within each department
SELECT
    e.first_name,
    e.last_name,
    d.name AS department,
    e.salary,
    ROW_NUMBER() OVER (PARTITION BY e.department_id ORDER BY e.salary DESC) AS row_num,
    RANK() OVER (PARTITION BY e.department_id ORDER BY e.salary DESC) AS rank_num,
    DENSE_RANK() OVER (PARTITION BY e.department_id ORDER BY e.salary DESC) AS dense_rank
FROM employees e
JOIN departments d ON e.department_id = d.id;

-- 1.2 Top 2 earners per department
WITH ranked AS (
    SELECT
        e.*,
        d.name AS department,
        DENSE_RANK() OVER (PARTITION BY e.department_id ORDER BY e.salary DESC) AS rnk
    FROM employees e
    JOIN departments d ON e.department_id = d.id
)
SELECT first_name, last_name, department, salary
FROM ranked
WHERE rnk <= 2;

-- 1.3 LAG and LEAD — Compare with previous/next employee salary
SELECT
    first_name,
    last_name,
    salary,
    LAG(salary, 1) OVER (ORDER BY salary) AS prev_salary,
    LEAD(salary, 1) OVER (ORDER BY salary) AS next_salary,
    salary - LAG(salary, 1) OVER (ORDER BY salary) AS diff_from_prev
FROM employees
ORDER BY salary;

-- 1.4 Running total of daily revenue
SELECT
    revenue_date,
    revenue,
    SUM(revenue) OVER (ORDER BY revenue_date) AS running_total,
    ROUND(AVG(revenue) OVER (ORDER BY revenue_date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW), 2) AS seven_day_avg
FROM daily_revenue;

-- 1.5 Percentage of total salary per department
SELECT
    first_name,
    last_name,
    d.name AS department,
    salary,
    SUM(salary) OVER (PARTITION BY department_id) AS dept_total,
    ROUND(salary * 100.0 / SUM(salary) OVER (PARTITION BY department_id), 2) AS pct_of_dept,
    ROUND(salary * 100.0 / SUM(salary) OVER (), 2) AS pct_of_company
FROM employees e
JOIN departments d ON e.department_id = d.id;

-- 1.6 NTILE — Divide employees into salary quartiles
SELECT
    first_name,
    last_name,
    salary,
    NTILE(4) OVER (ORDER BY salary) AS salary_quartile
FROM employees;

-- 1.7 FIRST_VALUE and LAST_VALUE
SELECT
    first_name,
    last_name,
    d.name AS department,
    salary,
    FIRST_VALUE(CONCAT(first_name, ' ', last_name)) OVER w AS highest_paid_in_dept,
    LAST_VALUE(CONCAT(first_name, ' ', last_name)) OVER (
        PARTITION BY department_id ORDER BY salary DESC
        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    ) AS lowest_paid_in_dept
FROM employees e
JOIN departments d ON e.department_id = d.id
WINDOW w AS (PARTITION BY department_id ORDER BY salary DESC);

-- 1.8 CUME_DIST and PERCENT_RANK
SELECT
    first_name,
    last_name,
    salary,
    ROUND(PERCENT_RANK() OVER (ORDER BY salary) * 100, 2) AS percentile,
    ROUND(CUME_DIST() OVER (ORDER BY salary) * 100, 2) AS cumulative_pct
FROM employees;


-- ============================================================
-- TOPIC 2: GROUP BY, HAVING, WHERE
-- ============================================================

-- 2.1 Department-wise employee count and avg salary (only depts with 3+ employees)
SELECT
    d.name AS department,
    COUNT(*) AS emp_count,
    ROUND(AVG(e.salary), 2) AS avg_salary,
    MAX(e.salary) AS max_salary,
    SUM(e.salary) AS total_payroll
FROM employees e
JOIN departments d ON e.department_id = d.id
WHERE e.is_active = 1
GROUP BY d.name
HAVING COUNT(*) >= 3
ORDER BY avg_salary DESC;

-- 2.2 Monthly order count and revenue (only months with revenue > 100000)
SELECT
    DATE_FORMAT(order_date, '%Y-%m') AS month,
    COUNT(*) AS order_count,
    SUM(total_amount) AS revenue,
    ROUND(AVG(total_amount), 2) AS avg_order_value
FROM orders
WHERE status != 'cancelled'
GROUP BY DATE_FORMAT(order_date, '%Y-%m')
HAVING SUM(total_amount) > 100000
ORDER BY month;

-- 2.3 Customer segmentation by order count
SELECT
    CASE
        WHEN order_count >= 5 THEN 'VIP'
        WHEN order_count >= 3 THEN 'Regular'
        ELSE 'New'
    END AS segment,
    COUNT(*) AS customer_count,
    ROUND(AVG(total_spent), 2) AS avg_spent
FROM (
    SELECT
        customer_id,
        COUNT(*) AS order_count,
        SUM(total_amount) AS total_spent
    FROM orders
    WHERE status = 'delivered'
    GROUP BY customer_id
) t
GROUP BY segment;

-- 2.4 WITH ROLLUP — Subtotals and grand total
SELECT
    COALESCE(d.name, '*** GRAND TOTAL ***') AS department,
    COUNT(*) AS emp_count,
    ROUND(AVG(e.salary), 2) AS avg_salary,
    SUM(e.salary) AS total_salary
FROM employees e
JOIN departments d ON e.department_id = d.id
GROUP BY d.name WITH ROLLUP;


-- ============================================================
-- TOPIC 3: JOINS (All Types)
-- ============================================================

-- 3.1 Self Join — Employees with their manager names
SELECT
    e.first_name AS employee,
    e.job_title,
    e.salary,
    CONCAT(m.first_name, ' ', m.last_name) AS manager_name,
    m.job_title AS manager_title
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.id;

-- 3.2 Self Join — Employees earning MORE than their manager
SELECT
    CONCAT(e.first_name, ' ', e.last_name) AS employee,
    e.salary AS emp_salary,
    CONCAT(m.first_name, ' ', m.last_name) AS manager,
    m.salary AS mgr_salary
FROM employees e
JOIN employees m ON e.manager_id = m.id
WHERE e.salary > m.salary;

-- 3.3 Anti Join — Customers who NEVER placed an order
SELECT c.name, c.email, c.registration_date
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
WHERE o.id IS NULL;

-- 3.4 Anti Join — Products never ordered
SELECT p.name, p.price, p.stock_quantity
FROM products p
LEFT JOIN order_items oi ON p.id = oi.product_id
WHERE oi.id IS NULL;

-- 3.5 Semi Join with EXISTS — Departments that have at least one employee earning > 150000
SELECT d.name
FROM departments d
WHERE EXISTS (
    SELECT 1 FROM employees e
    WHERE e.department_id = d.id AND e.salary > 150000
);

-- 3.6 Cross Join — All product-category combinations (use carefully!)
SELECT c1.name AS parent, c2.name AS child
FROM categories c1
CROSS JOIN categories c2
WHERE c1.parent_id IS NULL AND c2.parent_id = c1.id;


-- ============================================================
-- TOPIC 4: CTEs (Common Table Expressions)
-- ============================================================

-- 4.1 Basic CTE — Top customers by revenue
WITH customer_revenue AS (
    SELECT
        c.id,
        c.name,
        c.city,
        COUNT(o.id) AS order_count,
        SUM(o.total_amount) AS total_revenue,
        AVG(o.total_amount) AS avg_order_value
    FROM customers c
    JOIN orders o ON c.id = o.customer_id
    WHERE o.status = 'delivered'
    GROUP BY c.id, c.name, c.city
)
SELECT *,
    DENSE_RANK() OVER (ORDER BY total_revenue DESC) AS revenue_rank
FROM customer_revenue
ORDER BY total_revenue DESC;

-- 4.2 Multiple CTEs — Month-over-month growth
WITH monthly AS (
    SELECT
        DATE_FORMAT(order_date, '%Y-%m') AS month,
        SUM(total_amount) AS revenue
    FROM orders
    WHERE status != 'cancelled'
    GROUP BY DATE_FORMAT(order_date, '%Y-%m')
),
growth AS (
    SELECT
        month,
        revenue,
        LAG(revenue) OVER (ORDER BY month) AS prev_month_revenue
    FROM monthly
)
SELECT
    month,
    revenue,
    prev_month_revenue,
    CASE
        WHEN prev_month_revenue IS NOT NULL THEN
            ROUND((revenue - prev_month_revenue) / prev_month_revenue * 100, 2)
        ELSE NULL
    END AS growth_pct
FROM growth;

-- 4.3 Recursive CTE — Category hierarchy tree
WITH RECURSIVE category_tree AS (
    SELECT id, name, parent_id, 0 AS level,
           CAST(name AS CHAR(500)) AS path
    FROM categories
    WHERE parent_id IS NULL

    UNION ALL

    SELECT c.id, c.name, c.parent_id, ct.level + 1,
           CONCAT(ct.path, ' → ', c.name)
    FROM categories c
    JOIN category_tree ct ON c.parent_id = ct.id
)
SELECT
    CONCAT(REPEAT('  ', level), name) AS category,
    level,
    path
FROM category_tree
ORDER BY path;

-- 4.4 Recursive CTE — Employee org chart
WITH RECURSIVE org_chart AS (
    SELECT id, first_name, last_name, manager_id, job_title, department_id, 0 AS level
    FROM employees
    WHERE manager_id IS NULL

    UNION ALL

    SELECT e.id, e.first_name, e.last_name, e.manager_id, e.job_title, e.department_id, oc.level + 1
    FROM employees e
    JOIN org_chart oc ON e.manager_id = oc.id
)
SELECT
    CONCAT(REPEAT('│  ', level), '├─ ', first_name, ' ', last_name) AS org_tree,
    job_title,
    level
FROM org_chart
ORDER BY level, last_name;

-- 4.5 Recursive CTE — Generate date series (fill gaps)
WITH RECURSIVE date_series AS (
    SELECT DATE('2025-01-01') AS dt
    UNION ALL
    SELECT DATE_ADD(dt, INTERVAL 1 DAY)
    FROM date_series
    WHERE dt < '2025-01-31'
)
SELECT
    ds.dt AS date,
    COALESCE(dr.revenue, 0) AS revenue,
    COALESCE(dr.orders_count, 0) AS orders
FROM date_series ds
LEFT JOIN daily_revenue dr ON ds.dt = dr.revenue_date
ORDER BY ds.dt;


-- ============================================================
-- TOPIC 5: Nth HIGHEST SALARY (Multiple Methods)
-- ============================================================

-- Method 1: LIMIT OFFSET
SELECT DISTINCT salary
FROM employees
ORDER BY salary DESC
LIMIT 1 OFFSET 3;  -- 4th highest

-- Method 2: Subquery
SELECT DISTINCT salary
FROM employees e1
WHERE 4 = (
    SELECT COUNT(DISTINCT salary)
    FROM employees e2
    WHERE e2.salary >= e1.salary
);

-- Method 3: DENSE_RANK (best for interviews)
WITH ranked AS (
    SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS rnk
    FROM employees
)
SELECT DISTINCT salary FROM ranked WHERE rnk = 4;

-- Method 4: Using stored procedure
CALL GetNthHighestSalary(4);

-- Department-wise Nth highest
WITH dept_ranked AS (
    SELECT
        first_name, last_name, d.name AS department, salary,
        DENSE_RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) AS rnk
    FROM employees e
    JOIN departments d ON e.department_id = d.id
)
SELECT * FROM dept_ranked WHERE rnk = 2;  -- 2nd highest per dept


-- ============================================================
-- TOPIC 6: CONSECUTIVE DAYS / GAPS AND ISLANDS
-- ============================================================

-- 6.1 Find consecutive login streaks per user
WITH login_groups AS (
    SELECT
        user_id,
        login_date,
        DATE_SUB(login_date, INTERVAL ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY login_date) DAY) AS grp
    FROM user_logins
)
SELECT
    user_id,
    MIN(login_date) AS streak_start,
    MAX(login_date) AS streak_end,
    COUNT(*) AS streak_days
FROM login_groups
GROUP BY user_id, grp
HAVING COUNT(*) >= 3
ORDER BY user_id, streak_start;

-- 6.2 Find the longest streak per user
WITH login_groups AS (
    SELECT
        user_id,
        login_date,
        DATE_SUB(login_date, INTERVAL ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY login_date) DAY) AS grp
    FROM user_logins
),
streaks AS (
    SELECT
        user_id,
        MIN(login_date) AS streak_start,
        MAX(login_date) AS streak_end,
        COUNT(*) AS streak_days
    FROM login_groups
    GROUP BY user_id, grp
),
ranked_streaks AS (
    SELECT *, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY streak_days DESC) AS rn
    FROM streaks
)
SELECT user_id, streak_start, streak_end, streak_days
FROM ranked_streaks
WHERE rn = 1;


-- ============================================================
-- TOPIC 7: YEAR-OVER-YEAR (YoY) ANALYSIS
-- ============================================================

-- Quarterly revenue comparison
WITH quarterly AS (
    SELECT
        YEAR(order_date) AS yr,
        QUARTER(order_date) AS qtr,
        SUM(total_amount) AS revenue
    FROM orders
    WHERE status != 'cancelled'
    GROUP BY YEAR(order_date), QUARTER(order_date)
)
SELECT
    yr,
    qtr,
    revenue,
    LAG(revenue) OVER (PARTITION BY qtr ORDER BY yr) AS prev_year_same_qtr,
    ROUND(
        (revenue - LAG(revenue) OVER (PARTITION BY qtr ORDER BY yr)) /
        LAG(revenue) OVER (PARTITION BY qtr ORDER BY yr) * 100, 2
    ) AS yoy_growth_pct
FROM quarterly
ORDER BY yr, qtr;


-- ============================================================
-- TOPIC 8: DUPLICATE DETECTION & REMOVAL
-- ============================================================

-- 8.1 Find duplicate marks in students
SELECT name, subject, marks, COUNT(*) AS cnt
FROM students
GROUP BY name, subject, marks
HAVING COUNT(*) > 1;

-- 8.2 Find students with same marks in different subjects
SELECT s1.name, s1.subject AS sub1, s2.subject AS sub2, s1.marks
FROM students s1
JOIN students s2 ON s1.name = s2.name AND s1.marks = s2.marks AND s1.subject < s2.subject;

-- 8.3 Delete duplicates keeping lowest ID (example pattern)
-- DELETE s1 FROM students s1
-- INNER JOIN students s2
-- WHERE s1.id > s2.id AND s1.name = s2.name AND s1.subject = s2.subject;


-- ============================================================
-- TOPIC 9: PIVOT / UNPIVOT
-- ============================================================

-- 9.1 Pivot: Student marks by subject (rows → columns)
SELECT
    name,
    MAX(CASE WHEN subject = 'Math' THEN marks END) AS math_marks,
    MAX(CASE WHEN subject = 'Science' THEN marks END) AS science_marks,
    SUM(marks) AS total_marks,
    ROUND(AVG(marks), 2) AS avg_marks
FROM students
GROUP BY name
ORDER BY total_marks DESC;

-- 9.2 Pivot: Orders by payment method per month
SELECT
    DATE_FORMAT(order_date, '%Y-%m') AS month,
    COUNT(CASE WHEN payment_method = 'credit_card' THEN 1 END) AS credit_card,
    COUNT(CASE WHEN payment_method = 'debit_card' THEN 1 END) AS debit_card,
    COUNT(CASE WHEN payment_method = 'upi' THEN 1 END) AS upi,
    COUNT(CASE WHEN payment_method = 'net_banking' THEN 1 END) AS net_banking,
    COUNT(CASE WHEN payment_method = 'cod' THEN 1 END) AS cod
FROM orders
GROUP BY DATE_FORMAT(order_date, '%Y-%m')
ORDER BY month;


-- ============================================================
-- TOPIC 10: JSON QUERIES (MySQL 8.0+)
-- ============================================================

-- 10.1 Query JSON attributes
SELECT
    name,
    price,
    attributes->>'$.brand' AS brand,
    attributes->>'$.ram' AS ram,
    attributes->>'$.storage' AS storage
FROM products
WHERE attributes IS NOT NULL
  AND attributes->>'$.brand' = 'Apple';

-- 10.2 JSON_TABLE — Extract JSON array into rows
SELECT p.name, sizes.size
FROM products p,
JSON_TABLE(
    p.attributes->'$.size',
    '$[*]' COLUMNS (size VARCHAR(10) PATH '$')
) AS sizes
WHERE p.attributes->'$.size' IS NOT NULL;

-- 10.3 JSON aggregation
SELECT
    attributes->>'$.brand' AS brand,
    COUNT(*) AS product_count,
    ROUND(AVG(price), 2) AS avg_price
FROM products
WHERE attributes->>'$.brand' IS NOT NULL
GROUP BY attributes->>'$.brand';


-- ============================================================
-- TOPIC 11: SUBQUERIES (Correlated & Non-Correlated)
-- ============================================================

-- 11.1 Non-correlated: Employees earning above company average
SELECT first_name, last_name, salary
FROM employees
WHERE salary > (SELECT AVG(salary) FROM employees);

-- 11.2 Correlated: Employees earning above their DEPARTMENT average
SELECT e.first_name, e.last_name, e.salary, d.name AS department
FROM employees e
JOIN departments d ON e.department_id = d.id
WHERE e.salary > (
    SELECT AVG(e2.salary)
    FROM employees e2
    WHERE e2.department_id = e.department_id
);

-- 11.3 EXISTS vs IN performance comparison
-- EXISTS (better for large outer table)
SELECT c.name
FROM customers c
WHERE EXISTS (
    SELECT 1 FROM orders o WHERE o.customer_id = c.id AND o.total_amount > 100000
);

-- IN (better when subquery returns small result set)
SELECT c.name
FROM customers c
WHERE c.id IN (
    SELECT customer_id FROM orders WHERE total_amount > 100000
);


-- ============================================================
-- TOPIC 12: TRANSACTIONS PRACTICE
-- ============================================================

-- 12.1 Basic transaction
START TRANSACTION;
    UPDATE departments SET budget = budget - 100000 WHERE id = 1;
    UPDATE departments SET budget = budget + 100000 WHERE id = 2;
COMMIT;

-- 12.2 Transaction with savepoint
START TRANSACTION;
    UPDATE employees SET salary = salary * 1.1 WHERE department_id = 1;
    SAVEPOINT sp1;
    UPDATE employees SET salary = salary * 1.1 WHERE department_id = 2;
    -- Oops, rollback only dept 2
    ROLLBACK TO SAVEPOINT sp1;
COMMIT;

-- 12.3 Using stored procedure with transaction
SET @result = '';
CALL TransferBudget(1, 2, 500000, @result);
SELECT @result;

-- 12.4 Check isolation level
SELECT @@transaction_isolation;

-- 12.5 FOR UPDATE (row locking)
-- Session 1:
START TRANSACTION;
SELECT * FROM employees WHERE id = 1 FOR UPDATE;
-- This locks row id=1, other sessions wait
-- UPDATE employees SET salary = 200000 WHERE id = 1;
-- COMMIT;


-- ============================================================
-- TOPIC 13: EXPLAIN & QUERY OPTIMIZATION
-- ============================================================

-- 13.1 Basic EXPLAIN
EXPLAIN SELECT * FROM employees WHERE department_id = 1 AND salary > 100000;

-- 13.2 EXPLAIN with JOIN
EXPLAIN SELECT e.first_name, d.name, o.total_amount
FROM employees e
JOIN departments d ON e.department_id = d.id
LEFT JOIN orders o ON o.customer_id = e.id;

-- 13.3 EXPLAIN ANALYZE (MySQL 8.0.18+)
EXPLAIN ANALYZE
SELECT d.name, AVG(e.salary)
FROM departments d
JOIN employees e ON d.id = e.department_id
GROUP BY d.name
HAVING AVG(e.salary) > 100000;

-- 13.4 Check index usage
SHOW INDEX FROM employees;
SHOW INDEX FROM orders;

-- 13.5 Slow query: Full table scan (bad)
EXPLAIN SELECT * FROM orders WHERE YEAR(order_date) = 2024;

-- 13.6 Optimized version (uses index)
EXPLAIN SELECT * FROM orders
WHERE order_date >= '2024-01-01' AND order_date < '2025-01-01';


-- ============================================================
-- TOPIC 14: STORED PROCEDURE & FUNCTION USAGE
-- ============================================================

-- 14.1 Call hierarchy procedure
CALL GetEmployeeHierarchy(1);   -- Starting from Rajesh (VP Eng)
CALL GetEmployeeHierarchy(14);  -- Starting from Suresh (VP Sales)

-- 14.2 Use custom function
SELECT
    first_name,
    last_name,
    salary,
    TIMESTAMPDIFF(YEAR, hire_date, CURDATE()) AS years_of_service,
    CalculateBonus(salary, TIMESTAMPDIFF(YEAR, hire_date, CURDATE())) AS calculated_bonus
FROM employees
ORDER BY calculated_bonus DESC;


-- ============================================================
-- TOPIC 15: PRACTICAL INTERVIEW QUERIES
-- ============================================================

-- 15.1 Find the second most expensive product per category
WITH ranked AS (
    SELECT
        p.name,
        c.name AS category,
        p.price,
        DENSE_RANK() OVER (PARTITION BY p.category_id ORDER BY p.price DESC) AS rnk
    FROM products p
    JOIN categories c ON p.category_id = c.id
)
SELECT name, category, price FROM ranked WHERE rnk = 2;

-- 15.2 Customers who ordered in every quarter of 2024
SELECT c.name
FROM customers c
JOIN orders o ON c.id = o.customer_id
WHERE YEAR(o.order_date) = 2024 AND o.status = 'delivered'
GROUP BY c.id, c.name
HAVING COUNT(DISTINCT QUARTER(o.order_date)) = 4;

-- 15.3 Products that were ordered but are now out of stock
SELECT p.name, p.stock_quantity, COUNT(oi.id) AS times_ordered
FROM products p
JOIN order_items oi ON p.id = oi.product_id
WHERE p.stock_quantity = 0
GROUP BY p.id, p.name, p.stock_quantity;

-- 15.4 Revenue contribution by product category
WITH category_revenue AS (
    SELECT
        c.name AS category,
        SUM(oi.total_price) AS revenue
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    JOIN categories c ON p.category_id = c.id
    GROUP BY c.name
)
SELECT
    category,
    revenue,
    ROUND(revenue * 100.0 / SUM(revenue) OVER (), 2) AS revenue_pct,
    SUM(revenue) OVER (ORDER BY revenue DESC) AS cumulative_revenue
FROM category_revenue
ORDER BY revenue DESC;

-- 15.5 Find employees who never got a salary raise
SELECT e.first_name, e.last_name, e.salary, e.hire_date
FROM employees e
LEFT JOIN salary_history sh ON e.id = sh.employee_id
WHERE sh.id IS NULL;

-- 15.6 Moving 7-day average revenue
SELECT
    revenue_date,
    revenue,
    ROUND(AVG(revenue) OVER (
        ORDER BY revenue_date
        ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ), 2) AS moving_7day_avg,
    CASE
        WHEN revenue > AVG(revenue) OVER (
            ORDER BY revenue_date
            ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
        ) THEN 'Above Average'
        ELSE 'Below Average'
    END AS performance
FROM daily_revenue;

-- 15.7 Gap analysis — Find missing order dates
WITH RECURSIVE all_dates AS (
    SELECT DATE('2025-01-01') AS dt
    UNION ALL
    SELECT DATE_ADD(dt, INTERVAL 1 DAY) FROM all_dates WHERE dt < '2025-01-31'
)
SELECT ad.dt AS missing_date
FROM all_dates ad
LEFT JOIN orders o ON DATE(o.order_date) = ad.dt
WHERE o.id IS NULL;


-- ============================================================
-- QUICK REFERENCE: SQL EXECUTION ORDER
-- ============================================================
-- 1. FROM / JOIN
-- 2. WHERE
-- 3. GROUP BY
-- 4. HAVING
-- 5. SELECT
-- 6. DISTINCT
-- 7. ORDER BY
-- 8. LIMIT / OFFSET
-- ============================================================
