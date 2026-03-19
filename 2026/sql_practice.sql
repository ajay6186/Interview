-- ============================================
-- Create Database
-- ============================================
CREATE DATABASE IF NOT EXISTS interview_practice;
USE interview_practice;

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- 1. employees table
-- ============================================
DROP TABLE IF EXISTS employees;

CREATE TABLE employees (
    id INT PRIMARY KEY,
    name VARCHAR(50),
    department VARCHAR(50),
    salary INT
);

INSERT INTO employees (id, name, department, salary) VALUES
(1, 'Ajay',   'IT', 50000),
(2, 'Rahul',  'IT', 60000),
(3, 'Neha',   'HR', 40000),
(4, 'Simran', 'HR', 45000),
(5, 'Mohan',  'IT', 70000),
(6, 'Priya',  'IT', NULL);

-- ============================================
-- 2. orders table
-- ============================================
DROP TABLE IF EXISTS orders;

CREATE TABLE orders (
    id INT PRIMARY KEY,
    user_id INT,
    amount INT
);

INSERT INTO orders (id, user_id, amount) VALUES
(1,  101, 500),
(2,  101, 300),
(3,  101, 700),
(4,  101, 200),
(5,  101, 400),
(6,  101, 600),
(7,  102, 100),
(8,  102, 250),
(9,  102, 350),
(10, 103, 800),
(11, 103, 900),
(12, 103, 150),
(13, 103, 450),
(14, 103, 550),
(15, 103, 650),
(16, 103, 750),
(17, 104, 100),
(18, 104, 200);

-- ============================================
SET FOREIGN_KEY_CHECKS = 1;

-- PRACTICE QUERIES
-- ============================================

-- Step 1: FROM - See all data
SELECT * FROM employees;

-- Step 2: WHERE - Filter rows
SELECT * FROM employees WHERE salary > 30000;

-- Step 3: GROUP BY - Create groups
SELECT department, COUNT(*) AS emp_count FROM employees GROUP BY department;

-- Step 4: HAVING - Filter groups (count > 2)
SELECT department, COUNT(*) AS emp_count
FROM employees
GROUP BY department
HAVING COUNT(*) > 2;

-- Step 5: FULL QUERY - WHERE + GROUP BY + HAVING + ORDER BY
SELECT department, COUNT(*) AS emp_count
FROM employees
WHERE salary > 30000
GROUP BY department
HAVING COUNT(*) > 2
ORDER BY emp_count DESC;

-- WHERE vs HAVING comparison
SELECT department, COUNT(*) AS emp_count FROM employees WHERE salary > 50000 GROUP BY department;
SELECT department, COUNT(*) AS emp_count FROM employees GROUP BY department HAVING COUNT(*) > 2;

-- AVG with HAVING
SELECT department, AVG(salary) AS avg_salary
FROM employees
GROUP BY department
HAVING AVG(salary) > 50000;

-- COUNT(*) vs COUNT(column) - Priya has NULL salary
SELECT department, COUNT(*) AS count_all FROM employees GROUP BY department;
SELECT department, COUNT(salary) AS count_salary FROM employees GROUP BY department;

-- Orders: Users with more than 5 orders
SELECT user_id, COUNT(*) AS total_orders
FROM orders
GROUP BY user_id
HAVING COUNT(*) > 5
ORDER BY total_orders DESC;
