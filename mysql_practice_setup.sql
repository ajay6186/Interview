-- ============================================================
-- MySQL Interview Practice Database
-- User: root | Password: root
-- Covers: Window Functions, CTEs, Joins, Indexes, Transactions,
--         JSON, Partitioning, Stored Procedures, Triggers, etc.
-- ============================================================

DROP DATABASE IF EXISTS interview_practice;
CREATE DATABASE interview_practice CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE interview_practice;

-- ============================================================
-- 1. COMPANY SCHEMA (Employees, Departments, Salaries)
--    Practice: Window Functions, GROUP BY, HAVING, Self Join,
--              Nth Highest Salary, Top N per Group
-- ============================================================

CREATE TABLE departments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    location VARCHAR(100),
    budget DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE employees (
    id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20),
    hire_date DATE NOT NULL,
    department_id INT,
    manager_id INT NULL,
    job_title VARCHAR(100),
    salary DECIMAL(10,2) NOT NULL,
    bonus DECIMAL(10,2) DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (manager_id) REFERENCES employees(id)
) ENGINE=InnoDB;

CREATE TABLE salary_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    old_salary DECIMAL(10,2),
    new_salary DECIMAL(10,2) NOT NULL,
    change_date DATE NOT NULL,
    reason VARCHAR(200),
    FOREIGN KEY (employee_id) REFERENCES employees(id)
) ENGINE=InnoDB;

-- Insert Departments
INSERT INTO departments (name, location, budget) VALUES
('Engineering', 'New York', 5000000),
('Marketing', 'San Francisco', 2000000),
('Sales', 'Chicago', 3000000),
('Human Resources', 'New York', 1500000),
('Finance', 'Boston', 2500000),
('Product', 'San Francisco', 3500000),
('Support', 'Austin', 1000000),
('Data Science', 'New York', 4000000);

-- Insert Employees (50+ records for meaningful practice)
INSERT INTO employees (first_name, last_name, email, hire_date, department_id, manager_id, job_title, salary, bonus) VALUES
-- Engineering (dept 1)
('Rajesh', 'Kumar', 'rajesh.kumar@company.com', '2018-03-15', 1, NULL, 'VP Engineering', 180000, 30000),
('Priya', 'Sharma', 'priya.sharma@company.com', '2019-06-20', 1, 1, 'Senior Engineer', 140000, 20000),
('Amit', 'Patel', 'amit.patel@company.com', '2019-08-10', 1, 1, 'Senior Engineer', 140000, 18000),
('Neha', 'Gupta', 'neha.gupta@company.com', '2020-01-05', 1, 2, 'Software Engineer', 110000, 12000),
('Vikram', 'Singh', 'vikram.singh@company.com', '2020-07-22', 1, 2, 'Software Engineer', 105000, 10000),
('Ananya', 'Reddy', 'ananya.reddy@company.com', '2021-02-14', 1, 3, 'Junior Engineer', 85000, 8000),
('Rohan', 'Mehta', 'rohan.mehta@company.com', '2021-09-01', 1, 3, 'Junior Engineer', 80000, 7000),
('Kavya', 'Nair', 'kavya.nair@company.com', '2022-03-10', 1, 2, 'DevOps Engineer', 125000, 15000),

-- Marketing (dept 2)
('Sonia', 'Verma', 'sonia.verma@company.com', '2018-05-10', 2, NULL, 'VP Marketing', 170000, 25000),
('Arjun', 'Desai', 'arjun.desai@company.com', '2019-11-15', 2, 9, 'Marketing Manager', 120000, 15000),
('Divya', 'Joshi', 'divya.joshi@company.com', '2020-04-20', 2, 10, 'Content Strategist', 90000, 10000),
('Karan', 'Malhotra', 'karan.malhotra@company.com', '2021-01-08', 2, 10, 'SEO Specialist', 85000, 8000),
('Meera', 'Iyer', 'meera.iyer@company.com', '2021-08-25', 2, 10, 'Social Media Manager', 88000, 9000),

-- Sales (dept 3)
('Suresh', 'Rao', 'suresh.rao@company.com', '2018-01-20', 3, NULL, 'VP Sales', 175000, 35000),
('Pooja', 'Agarwal', 'pooja.agarwal@company.com', '2019-03-12', 3, 14, 'Sales Manager', 130000, 20000),
('Rahul', 'Chopra', 'rahul.chopra@company.com', '2019-09-05', 3, 14, 'Sales Manager', 125000, 22000),
('Sneha', 'Bhat', 'sneha.bhat@company.com', '2020-06-18', 3, 15, 'Sales Executive', 95000, 15000),
('Arun', 'Pillai', 'arun.pillai@company.com', '2020-11-30', 3, 15, 'Sales Executive', 92000, 18000),
('Deepika', 'Saxena', 'deepika.saxena@company.com', '2021-05-14', 3, 16, 'Sales Executive', 88000, 12000),
('Nikhil', 'Thakur', 'nikhil.thakur@company.com', '2022-01-10', 3, 16, 'Junior Sales Rep', 70000, 8000),

-- Human Resources (dept 4)
('Lakshmi', 'Menon', 'lakshmi.menon@company.com', '2018-07-01', 4, NULL, 'HR Director', 160000, 20000),
('Sanjay', 'Kulkarni', 'sanjay.kulkarni@company.com', '2019-12-20', 4, 21, 'HR Manager', 110000, 12000),
('Ritu', 'Pandey', 'ritu.pandey@company.com', '2020-08-15', 4, 22, 'HR Specialist', 85000, 8000),
('Manish', 'Dubey', 'manish.dubey@company.com', '2021-04-10', 4, 22, 'Recruiter', 78000, 7000),

-- Finance (dept 5)
('Geeta', 'Krishnan', 'geeta.krishnan@company.com', '2018-09-12', 5, NULL, 'CFO', 200000, 40000),
('Vijay', 'Srinivasan', 'vijay.srinivasan@company.com', '2019-05-08', 5, 25, 'Finance Manager', 135000, 18000),
('Pallavi', 'Mishra', 'pallavi.mishra@company.com', '2020-02-28', 5, 26, 'Accountant', 95000, 10000),
('Harsh', 'Tiwari', 'harsh.tiwari@company.com', '2021-07-19', 5, 26, 'Junior Accountant', 72000, 6000),

-- Product (dept 6)
('Aditi', 'Chatterjee', 'aditi.chatterjee@company.com', '2018-11-25', 6, NULL, 'VP Product', 185000, 28000),
('Siddharth', 'Banerjee', 'siddharth.banerjee@company.com', '2019-07-14', 6, 29, 'Product Manager', 145000, 20000),
('Tanvi', 'Ghosh', 'tanvi.ghosh@company.com', '2020-05-03', 6, 30, 'Product Analyst', 100000, 12000),
('Dhruv', 'Sen', 'dhruv.sen@company.com', '2021-10-22', 6, 30, 'UX Designer', 105000, 11000),

-- Support (dept 7)
('Asha', 'Das', 'asha.das@company.com', '2019-02-18', 7, NULL, 'Support Lead', 110000, 12000),
('Prakash', 'Mukherjee', 'prakash.mukherjee@company.com', '2020-09-07', 7, 33, 'Support Engineer', 80000, 8000),
('Swati', 'Roy', 'swati.roy@company.com', '2021-03-16', 7, 33, 'Support Engineer', 78000, 7000),
('Vivek', 'Dutta', 'vivek.dutta@company.com', '2022-06-01', 7, 33, 'Junior Support', 65000, 5000),

-- Data Science (dept 8)
('Nandini', 'Kapoor', 'nandini.kapoor@company.com', '2019-01-07', 8, NULL, 'Head of Data', 190000, 30000),
('Akash', 'Bhatt', 'akash.bhatt@company.com', '2019-10-30', 8, 37, 'Senior Data Scientist', 155000, 22000),
('Ishita', 'Choudhury', 'ishita.choudhury@company.com', '2020-03-25', 8, 37, 'Data Scientist', 130000, 18000),
('Gaurav', 'Sethi', 'gaurav.sethi@company.com', '2021-06-12', 8, 38, 'ML Engineer', 140000, 20000),
('Ritika', 'Ahuja', 'ritika.ahuja@company.com', '2022-02-20', 8, 38, 'Data Analyst', 95000, 10000);

-- Insert Salary History
INSERT INTO salary_history (employee_id, old_salary, new_salary, change_date, reason) VALUES
(1, 150000, 165000, '2019-04-01', 'Annual Raise'),
(1, 165000, 180000, '2020-04-01', 'Promotion'),
(2, 110000, 125000, '2020-06-01', 'Annual Raise'),
(2, 125000, 140000, '2021-06-01', 'Promotion'),
(4, 90000, 100000, '2021-01-01', 'Annual Raise'),
(4, 100000, 110000, '2022-01-01', 'Performance Bonus'),
(14, 140000, 160000, '2019-07-01', 'Promotion'),
(14, 160000, 175000, '2020-07-01', 'Annual Raise'),
(25, 160000, 180000, '2019-09-01', 'Annual Raise'),
(25, 180000, 200000, '2021-01-01', 'Promotion'),
(38, 130000, 145000, '2020-10-01', 'Annual Raise'),
(38, 145000, 155000, '2021-10-01', 'Performance'),
(30, 120000, 135000, '2020-07-01', 'Annual Raise'),
(30, 135000, 145000, '2021-07-01', 'Promotion');

-- ============================================================
-- 2. E-COMMERCE SCHEMA (Orders, Products, Customers)
--    Practice: Aggregations, Revenue Analysis, YoY Growth,
--              Running Totals, Moving Averages
-- ============================================================

CREATE TABLE customers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    city VARCHAR(50),
    state VARCHAR(50),
    country VARCHAR(50) DEFAULT 'India',
    registration_date DATE NOT NULL,
    is_premium TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    parent_id INT NULL,
    FOREIGN KEY (parent_id) REFERENCES categories(id)
) ENGINE=InnoDB;

CREATE TABLE products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    category_id INT,
    price DECIMAL(10,2) NOT NULL,
    cost_price DECIMAL(10,2) NOT NULL,
    stock_quantity INT DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    attributes JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
) ENGINE=InnoDB;

CREATE TABLE orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    order_date DATETIME NOT NULL,
    status ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned') DEFAULT 'pending',
    total_amount DECIMAL(12,2) NOT NULL,
    discount DECIMAL(10,2) DEFAULT 0,
    shipping_address VARCHAR(500),
    payment_method ENUM('credit_card', 'debit_card', 'upi', 'net_banking', 'cod') DEFAULT 'upi',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
) ENGINE=InnoDB;

CREATE TABLE order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB;

-- Insert Categories (Hierarchical for recursive CTE practice)
INSERT INTO categories (name, parent_id) VALUES
('Electronics', NULL),        -- 1
('Clothing', NULL),           -- 2
('Books', NULL),              -- 3
('Home & Kitchen', NULL),     -- 4
('Smartphones', 1),           -- 5
('Laptops', 1),               -- 6
('Accessories', 1),           -- 7
('Men', 2),                   -- 8
('Women', 2),                 -- 9
('Fiction', 3),               -- 10
('Non-Fiction', 3),           -- 11
('Technical', 3),             -- 12
('iPhone', 5),                -- 13
('Samsung', 5),               -- 14
('Gaming Laptops', 6),        -- 15
('Business Laptops', 6);      -- 16

-- Insert Products (with JSON attributes)
INSERT INTO products (name, category_id, price, cost_price, stock_quantity, attributes) VALUES
('iPhone 15 Pro', 13, 134900, 95000, 50, '{"brand": "Apple", "ram": "8GB", "storage": "256GB", "color": "Titanium"}'),
('iPhone 15', 13, 79900, 55000, 80, '{"brand": "Apple", "ram": "6GB", "storage": "128GB", "color": "Blue"}'),
('Samsung Galaxy S24', 14, 79999, 52000, 60, '{"brand": "Samsung", "ram": "8GB", "storage": "256GB", "color": "Black"}'),
('Samsung Galaxy A55', 14, 39999, 25000, 100, '{"brand": "Samsung", "ram": "8GB", "storage": "128GB", "color": "Blue"}'),
('MacBook Pro 14"', 6, 199900, 140000, 30, '{"brand": "Apple", "ram": "18GB", "storage": "512GB", "chip": "M3 Pro"}'),
('Dell XPS 15', 16, 149900, 100000, 25, '{"brand": "Dell", "ram": "16GB", "storage": "512GB"}'),
('ASUS ROG Strix', 15, 159900, 110000, 20, '{"brand": "ASUS", "ram": "16GB", "storage": "1TB", "gpu": "RTX 4060"}'),
('AirPods Pro', 7, 24900, 15000, 200, '{"brand": "Apple", "type": "earbuds", "anc": true}'),
('Cotton Shirt', 8, 1499, 500, 500, '{"brand": "Peter England", "size": ["S","M","L","XL"], "material": "cotton"}'),
('Formal Trousers', 8, 2499, 900, 300, '{"brand": "Van Heusen", "size": ["30","32","34","36"]}'),
('Summer Dress', 9, 1999, 700, 400, '{"brand": "Zara", "size": ["S","M","L"]}'),
('Python Crash Course', 12, 599, 200, 150, '{"author": "Eric Matthes", "pages": 544, "edition": 3}'),
('Atomic Habits', 11, 499, 180, 300, '{"author": "James Clear", "pages": 320}'),
('The Alchemist', 10, 350, 120, 250, '{"author": "Paulo Coelho", "pages": 208}'),
('Pressure Cooker', 4, 3499, 1800, 100, '{"brand": "Prestige", "capacity": "5L"}'),
('Wireless Charger', 7, 1999, 800, 350, '{"brand": "Belkin", "wattage": 15}');

-- Insert Customers
INSERT INTO customers (name, email, city, state, registration_date, is_premium) VALUES
('Aarav Sharma', 'aarav@email.com', 'Mumbai', 'Maharashtra', '2022-01-15', 1),
('Bhavna Patel', 'bhavna@email.com', 'Ahmedabad', 'Gujarat', '2022-02-20', 0),
('Chirag Mehta', 'chirag@email.com', 'Bangalore', 'Karnataka', '2022-03-10', 1),
('Deepa Nair', 'deepa@email.com', 'Kochi', 'Kerala', '2022-04-05', 0),
('Esha Gupta', 'esha@email.com', 'Delhi', 'Delhi', '2022-05-22', 1),
('Farhan Khan', 'farhan@email.com', 'Hyderabad', 'Telangana', '2022-06-18', 0),
('Gauri Reddy', 'gauri@email.com', 'Chennai', 'Tamil Nadu', '2022-07-30', 1),
('Hemant Joshi', 'hemant@email.com', 'Pune', 'Maharashtra', '2022-08-14', 0),
('Isha Verma', 'isha@email.com', 'Jaipur', 'Rajasthan', '2022-09-25', 0),
('Jay Kulkarni', 'jay@email.com', 'Mumbai', 'Maharashtra', '2022-10-10', 1),
('Kriti Singh', 'kriti@email.com', 'Lucknow', 'Uttar Pradesh', '2023-01-05', 0),
('Lokesh Rao', 'lokesh@email.com', 'Bangalore', 'Karnataka', '2023-02-14', 1),
('Minal Desai', 'minal@email.com', 'Surat', 'Gujarat', '2023-03-20', 0),
('Naveen Pillai', 'naveen@email.com', 'Trivandrum', 'Kerala', '2023-04-12', 0),
('Omkar Bhat', 'omkar@email.com', 'Mangalore', 'Karnataka', '2023-05-28', 1);

-- Insert Orders (spanning 2023-2025 for time-series analysis)
INSERT INTO orders (customer_id, order_date, status, total_amount, discount, payment_method) VALUES
-- 2023 Q1
(1, '2023-01-10 10:30:00', 'delivered', 134900, 5000, 'credit_card'),
(2, '2023-01-15 14:20:00', 'delivered', 1499, 0, 'upi'),
(3, '2023-02-05 09:15:00', 'delivered', 199900, 10000, 'credit_card'),
(4, '2023-02-20 16:45:00', 'delivered', 599, 0, 'cod'),
(5, '2023-03-12 11:00:00', 'delivered', 79999, 3000, 'debit_card'),
-- 2023 Q2
(1, '2023-04-08 13:30:00', 'delivered', 24900, 0, 'upi'),
(6, '2023-04-22 10:00:00', 'delivered', 39999, 2000, 'net_banking'),
(7, '2023-05-15 15:45:00', 'delivered', 3998, 200, 'upi'),
(3, '2023-06-01 09:30:00', 'delivered', 159900, 8000, 'credit_card'),
(8, '2023-06-18 14:00:00', 'delivered', 2499, 0, 'cod'),
-- 2023 Q3
(2, '2023-07-10 11:20:00', 'delivered', 79900, 4000, 'credit_card'),
(9, '2023-07-25 16:30:00', 'delivered', 849, 0, 'upi'),
(5, '2023-08-14 10:45:00', 'delivered', 149900, 7000, 'debit_card'),
(10, '2023-08-30 13:15:00', 'delivered', 1999, 100, 'upi'),
(1, '2023-09-20 09:00:00', 'delivered', 39999, 1500, 'credit_card'),
-- 2023 Q4
(4, '2023-10-05 14:30:00', 'delivered', 134900, 5000, 'net_banking'),
(7, '2023-10-22 11:00:00', 'delivered', 24900, 0, 'upi'),
(3, '2023-11-10 15:20:00', 'delivered', 79900, 3000, 'credit_card'),
(6, '2023-11-28 10:30:00', 'cancelled', 199900, 0, 'credit_card'),
(8, '2023-12-15 13:45:00', 'delivered', 1499, 0, 'cod'),
-- 2024 Q1
(1, '2024-01-08 10:00:00', 'delivered', 79999, 4000, 'credit_card'),
(11, '2024-01-20 14:30:00', 'delivered', 599, 0, 'upi'),
(12, '2024-02-14 09:15:00', 'delivered', 134900, 6000, 'credit_card'),
(5, '2024-02-28 16:00:00', 'delivered', 39999, 1500, 'debit_card'),
(13, '2024-03-10 11:30:00', 'delivered', 1999, 0, 'upi'),
-- 2024 Q2
(3, '2024-04-05 13:00:00', 'delivered', 199900, 12000, 'credit_card'),
(14, '2024-04-18 10:45:00', 'delivered', 3499, 0, 'cod'),
(10, '2024-05-02 15:30:00', 'delivered', 24900, 0, 'upi'),
(1, '2024-05-20 09:30:00', 'delivered', 149900, 8000, 'credit_card'),
(7, '2024-06-08 14:15:00', 'delivered', 79900, 3500, 'debit_card'),
-- 2024 Q3
(15, '2024-07-12 11:00:00', 'delivered', 159900, 7000, 'credit_card'),
(2, '2024-07-28 16:30:00', 'delivered', 39999, 2000, 'upi'),
(9, '2024-08-15 10:20:00', 'delivered', 2499, 0, 'cod'),
(5, '2024-08-30 13:45:00', 'shipped', 134900, 5500, 'credit_card'),
(11, '2024-09-10 09:00:00', 'delivered', 79999, 3000, 'net_banking'),
-- 2024 Q4
(3, '2024-10-01 14:30:00', 'delivered', 199900, 15000, 'credit_card'),
(12, '2024-10-18 11:15:00', 'delivered', 1499, 0, 'upi'),
(4, '2024-11-05 15:00:00', 'delivered', 79900, 4000, 'debit_card'),
(8, '2024-11-22 10:30:00', 'returned', 39999, 0, 'upi'),
(1, '2024-12-10 13:00:00', 'delivered', 24900, 0, 'credit_card'),
-- 2025 Q1
(5, '2025-01-05 10:15:00', 'delivered', 134900, 7000, 'credit_card'),
(13, '2025-01-18 14:45:00', 'delivered', 79999, 3500, 'upi'),
(10, '2025-02-01 09:30:00', 'delivered', 199900, 10000, 'credit_card'),
(7, '2025-02-14 16:00:00', 'confirmed', 149900, 6000, 'debit_card'),
(14, '2025-03-05 11:20:00', 'pending', 39999, 1000, 'net_banking');

-- Insert Order Items
INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price) VALUES
(1, 1, 1, 134900, 134900),
(2, 9, 1, 1499, 1499),
(3, 5, 1, 199900, 199900),
(4, 12, 1, 599, 599),
(5, 3, 1, 79999, 79999),
(6, 8, 1, 24900, 24900),
(7, 4, 1, 39999, 39999),
(8, 9, 1, 1499, 1499), (8, 10, 1, 2499, 2499),
(9, 7, 1, 159900, 159900),
(10, 10, 1, 2499, 2499),
(11, 2, 1, 79900, 79900),
(12, 12, 1, 599, 599), (12, 14, 1, 350, 350),
(13, 6, 1, 149900, 149900),
(14, 11, 1, 1999, 1999),
(15, 4, 1, 39999, 39999),
(16, 1, 1, 134900, 134900),
(17, 8, 1, 24900, 24900),
(18, 2, 1, 79900, 79900),
(19, 5, 1, 199900, 199900),
(20, 9, 1, 1499, 1499),
(21, 3, 1, 79999, 79999),
(22, 12, 1, 599, 599),
(23, 1, 1, 134900, 134900),
(24, 4, 1, 39999, 39999),
(25, 11, 1, 1999, 1999),
(26, 5, 1, 199900, 199900),
(27, 15, 1, 3499, 3499),
(28, 8, 1, 24900, 24900),
(29, 6, 1, 149900, 149900),
(30, 2, 1, 79900, 79900),
(31, 7, 1, 159900, 159900),
(32, 4, 1, 39999, 39999),
(33, 10, 1, 2499, 2499),
(34, 1, 1, 134900, 134900),
(35, 3, 1, 79999, 79999),
(36, 5, 1, 199900, 199900),
(37, 9, 1, 1499, 1499),
(38, 2, 1, 79900, 79900),
(39, 4, 1, 39999, 39999),
(40, 8, 1, 24900, 24900),
(41, 1, 1, 134900, 134900),
(42, 3, 1, 79999, 79999),
(43, 5, 1, 199900, 199900),
(44, 6, 1, 149900, 149900),
(45, 4, 1, 39999, 39999);

-- ============================================================
-- 3. USER LOGIN TABLE (for consecutive days / streak problems)
--    Practice: Gaps & Islands, Consecutive Days, CTEs
-- ============================================================

CREATE TABLE user_logins (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    login_date DATE NOT NULL,
    login_time DATETIME NOT NULL,
    ip_address VARCHAR(45),
    device VARCHAR(50),
    UNIQUE KEY unique_user_date (user_id, login_date)
) ENGINE=InnoDB;

INSERT INTO user_logins (user_id, login_date, login_time, ip_address, device) VALUES
-- User 1: Has a 7-day streak, then gap, then 3-day streak
(1, '2025-01-01', '2025-01-01 09:00:00', '192.168.1.1', 'mobile'),
(1, '2025-01-02', '2025-01-02 10:30:00', '192.168.1.1', 'desktop'),
(1, '2025-01-03', '2025-01-03 08:45:00', '192.168.1.2', 'mobile'),
(1, '2025-01-04', '2025-01-04 11:00:00', '192.168.1.1', 'desktop'),
(1, '2025-01-05', '2025-01-05 09:15:00', '192.168.1.1', 'mobile'),
(1, '2025-01-06', '2025-01-06 14:30:00', '192.168.1.3', 'tablet'),
(1, '2025-01-07', '2025-01-07 08:00:00', '192.168.1.1', 'mobile'),
-- gap: Jan 8-9
(1, '2025-01-10', '2025-01-10 10:00:00', '192.168.1.1', 'desktop'),
(1, '2025-01-11', '2025-01-11 09:30:00', '192.168.1.2', 'mobile'),
(1, '2025-01-12', '2025-01-12 11:45:00', '192.168.1.1', 'desktop'),

-- User 2: Sporadic logins
(2, '2025-01-01', '2025-01-01 12:00:00', '10.0.0.1', 'desktop'),
(2, '2025-01-03', '2025-01-03 13:00:00', '10.0.0.1', 'mobile'),
(2, '2025-01-04', '2025-01-04 14:00:00', '10.0.0.2', 'desktop'),
(2, '2025-01-08', '2025-01-08 10:00:00', '10.0.0.1', 'mobile'),
(2, '2025-01-09', '2025-01-09 11:00:00', '10.0.0.1', 'desktop'),
(2, '2025-01-10', '2025-01-10 09:00:00', '10.0.0.3', 'mobile'),
(2, '2025-01-11', '2025-01-11 08:30:00', '10.0.0.1', 'desktop'),
(2, '2025-01-12', '2025-01-12 10:15:00', '10.0.0.1', 'tablet'),

-- User 3: 10-day streak
(3, '2025-01-05', '2025-01-05 07:00:00', '172.16.0.1', 'mobile'),
(3, '2025-01-06', '2025-01-06 08:00:00', '172.16.0.1', 'desktop'),
(3, '2025-01-07', '2025-01-07 09:00:00', '172.16.0.2', 'mobile'),
(3, '2025-01-08', '2025-01-08 07:30:00', '172.16.0.1', 'mobile'),
(3, '2025-01-09', '2025-01-09 08:45:00', '172.16.0.1', 'desktop'),
(3, '2025-01-10', '2025-01-10 09:15:00', '172.16.0.3', 'tablet'),
(3, '2025-01-11', '2025-01-11 07:00:00', '172.16.0.1', 'mobile'),
(3, '2025-01-12', '2025-01-12 08:30:00', '172.16.0.1', 'desktop'),
(3, '2025-01-13', '2025-01-13 09:00:00', '172.16.0.2', 'mobile'),
(3, '2025-01-14', '2025-01-14 10:00:00', '172.16.0.1', 'desktop');

-- ============================================================
-- 4. DAILY REVENUE TABLE (for time-series / running totals)
--    Practice: Running Total, Moving Average, YoY Growth
-- ============================================================

CREATE TABLE daily_revenue (
    id INT PRIMARY KEY AUTO_INCREMENT,
    revenue_date DATE NOT NULL UNIQUE,
    revenue DECIMAL(12,2) NOT NULL,
    expenses DECIMAL(12,2) NOT NULL,
    orders_count INT NOT NULL
) ENGINE=InnoDB;

-- Generate daily data for Jan 2025
INSERT INTO daily_revenue (revenue_date, revenue, expenses, orders_count) VALUES
('2025-01-01', 45000, 15000, 12),
('2025-01-02', 52000, 18000, 15),
('2025-01-03', 38000, 14000, 10),
('2025-01-04', 61000, 22000, 18),
('2025-01-05', 73000, 25000, 22),
('2025-01-06', 55000, 19000, 16),
('2025-01-07', 48000, 17000, 14),
('2025-01-08', 67000, 23000, 20),
('2025-01-09', 42000, 16000, 11),
('2025-01-10', 89000, 30000, 28),
('2025-01-11', 95000, 32000, 30),
('2025-01-12', 78000, 26000, 24),
('2025-01-13', 63000, 21000, 19),
('2025-01-14', 71000, 24000, 21),
('2025-01-15', 58000, 20000, 17),
('2025-01-16', 84000, 28000, 26),
('2025-01-17', 91000, 31000, 29),
('2025-01-18', 76000, 25000, 23),
('2025-01-19', 69000, 23000, 20),
('2025-01-20', 82000, 27000, 25),
('2025-01-21', 54000, 18000, 15),
('2025-01-22', 97000, 33000, 31),
('2025-01-23', 88000, 29000, 27),
('2025-01-24', 65000, 22000, 19),
('2025-01-25', 103000, 35000, 33),
('2025-01-26', 110000, 37000, 35),
('2025-01-27', 72000, 24000, 21),
('2025-01-28', 86000, 29000, 27),
('2025-01-29', 93000, 31000, 29),
('2025-01-30', 79000, 26000, 24),
('2025-01-31', 115000, 38000, 36);

-- ============================================================
-- 5. STUDENT TABLE (Simple practice for basics)
--    Practice: Nth highest, duplicates, basic aggregations
-- ============================================================

CREATE TABLE students (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    class VARCHAR(20),
    section CHAR(1),
    marks INT NOT NULL,
    subject VARCHAR(50),
    exam_date DATE
) ENGINE=InnoDB;

INSERT INTO students (name, class, section, marks, subject, exam_date) VALUES
('Aarav', '10th', 'A', 95, 'Math', '2025-01-15'),
('Bhavna', '10th', 'A', 88, 'Math', '2025-01-15'),
('Chirag', '10th', 'B', 92, 'Math', '2025-01-15'),
('Deepa', '10th', 'B', 95, 'Math', '2025-01-15'),
('Esha', '10th', 'A', 78, 'Math', '2025-01-15'),
('Farhan', '10th', 'B', 85, 'Math', '2025-01-15'),
('Gauri', '10th', 'A', 92, 'Math', '2025-01-15'),
('Hemant', '10th', 'B', 70, 'Math', '2025-01-15'),
('Isha', '10th', 'A', 88, 'Math', '2025-01-15'),
('Jay', '10th', 'B', 65, 'Math', '2025-01-15'),
('Aarav', '10th', 'A', 90, 'Science', '2025-01-16'),
('Bhavna', '10th', 'A', 82, 'Science', '2025-01-16'),
('Chirag', '10th', 'B', 96, 'Science', '2025-01-16'),
('Deepa', '10th', 'B', 88, 'Science', '2025-01-16'),
('Esha', '10th', 'A', 75, 'Science', '2025-01-16'),
('Farhan', '10th', 'B', 91, 'Science', '2025-01-16'),
('Gauri', '10th', 'A', 85, 'Science', '2025-01-16'),
('Hemant', '10th', 'B', 72, 'Science', '2025-01-16'),
('Isha', '10th', 'A', 93, 'Science', '2025-01-16'),
('Jay', '10th', 'B', 68, 'Science', '2025-01-16');

-- ============================================================
-- 6. INDEXES FOR PRACTICE
-- ============================================================

-- Composite index (leftmost prefix practice)
CREATE INDEX idx_emp_dept_salary ON employees(department_id, salary);
CREATE INDEX idx_emp_hire_date ON employees(hire_date);
CREATE INDEX idx_emp_name ON employees(last_name, first_name);

-- Covering index
CREATE INDEX idx_order_customer_status ON orders(customer_id, status, total_amount);
CREATE INDEX idx_order_date ON orders(order_date);

-- Index on JSON generated column
ALTER TABLE products ADD COLUMN brand VARCHAR(100)
    GENERATED ALWAYS AS (JSON_UNQUOTE(attributes->>'$.brand')) STORED;
CREATE INDEX idx_product_brand ON products(brand);

-- Full-text index
CREATE FULLTEXT INDEX idx_product_name ON products(name);

-- ============================================================
-- 7. STORED PROCEDURES
-- ============================================================

DELIMITER //

-- Procedure: Get Nth highest salary
CREATE PROCEDURE GetNthHighestSalary(IN n INT)
BEGIN
    SET @offset_val = n - 1;
    SET @sql = CONCAT('SELECT DISTINCT salary FROM employees ORDER BY salary DESC LIMIT 1 OFFSET ', @offset_val);
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END //

-- Procedure: Transfer money between departments (transaction practice)
CREATE PROCEDURE TransferBudget(
    IN from_dept_id INT,
    IN to_dept_id INT,
    IN amount DECIMAL(15,2),
    OUT result VARCHAR(100)
)
BEGIN
    DECLARE from_budget DECIMAL(15,2);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET result = 'ERROR: Transaction failed';
    END;

    START TRANSACTION;

    SELECT budget INTO from_budget
    FROM departments
    WHERE id = from_dept_id
    FOR UPDATE;

    IF from_budget < amount THEN
        ROLLBACK;
        SET result = 'ERROR: Insufficient budget';
    ELSE
        UPDATE departments SET budget = budget - amount WHERE id = from_dept_id;
        UPDATE departments SET budget = budget + amount WHERE id = to_dept_id;
        COMMIT;
        SET result = CONCAT('SUCCESS: Transferred ', amount);
    END IF;
END //

-- Procedure: Get employee hierarchy
CREATE PROCEDURE GetEmployeeHierarchy(IN emp_id INT)
BEGIN
    WITH RECURSIVE hierarchy AS (
        SELECT id, first_name, last_name, manager_id, job_title, 0 AS level
        FROM employees
        WHERE id = emp_id

        UNION ALL

        SELECT e.id, e.first_name, e.last_name, e.manager_id, e.job_title, h.level + 1
        FROM employees e
        JOIN hierarchy h ON e.manager_id = h.id
    )
    SELECT
        id,
        CONCAT(REPEAT('  ', level), first_name, ' ', last_name) AS name,
        job_title,
        level
    FROM hierarchy
    ORDER BY level, last_name;
END //

DELIMITER ;

-- ============================================================
-- 8. STORED FUNCTIONS
-- ============================================================

DELIMITER //

CREATE FUNCTION CalculateBonus(emp_salary DECIMAL(10,2), years_of_service INT)
RETURNS DECIMAL(10,2)
DETERMINISTIC
BEGIN
    DECLARE bonus DECIMAL(10,2);

    IF years_of_service >= 7 THEN
        SET bonus = emp_salary * 0.20;
    ELSEIF years_of_service >= 5 THEN
        SET bonus = emp_salary * 0.15;
    ELSEIF years_of_service >= 3 THEN
        SET bonus = emp_salary * 0.10;
    ELSE
        SET bonus = emp_salary * 0.05;
    END IF;

    RETURN bonus;
END //

DELIMITER ;

-- ============================================================
-- 9. TRIGGERS
-- ============================================================

DELIMITER //

-- Trigger: Auto-log salary changes
CREATE TRIGGER trg_salary_change
BEFORE UPDATE ON employees
FOR EACH ROW
BEGIN
    IF OLD.salary != NEW.salary THEN
        INSERT INTO salary_history (employee_id, old_salary, new_salary, change_date, reason)
        VALUES (OLD.id, OLD.salary, NEW.salary, CURDATE(), 'Salary Update');
    END IF;
END //

-- Trigger: Update stock after order
CREATE TRIGGER trg_update_stock
AFTER INSERT ON order_items
FOR EACH ROW
BEGIN
    UPDATE products
    SET stock_quantity = stock_quantity - NEW.quantity
    WHERE id = NEW.product_id;
END //

DELIMITER ;

-- ============================================================
-- 10. VIEWS
-- ============================================================

-- View: Department summary
CREATE VIEW vw_department_summary AS
SELECT
    d.id AS dept_id,
    d.name AS department,
    d.location,
    COUNT(e.id) AS employee_count,
    ROUND(AVG(e.salary), 2) AS avg_salary,
    MAX(e.salary) AS max_salary,
    MIN(e.salary) AS min_salary,
    SUM(e.salary) AS total_salary
FROM departments d
LEFT JOIN employees e ON d.id = e.department_id AND e.is_active = 1
GROUP BY d.id, d.name, d.location;

-- View: Monthly revenue
CREATE VIEW vw_monthly_revenue AS
SELECT
    DATE_FORMAT(order_date, '%Y-%m') AS month,
    COUNT(*) AS total_orders,
    COUNT(CASE WHEN status = 'delivered' THEN 1 END) AS delivered_orders,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) AS cancelled_orders,
    SUM(CASE WHEN status != 'cancelled' THEN total_amount ELSE 0 END) AS revenue,
    SUM(discount) AS total_discount,
    ROUND(AVG(CASE WHEN status != 'cancelled' THEN total_amount END), 2) AS avg_order_value
FROM orders
GROUP BY DATE_FORMAT(order_date, '%Y-%m');

-- ============================================================
-- 11. EVENT (Scheduled Job)
-- ============================================================

-- Enable event scheduler
-- SET GLOBAL event_scheduler = ON;

-- Example: Auto-deactivate old unconfirmed orders (every day)
-- CREATE EVENT evt_cancel_old_orders
-- ON SCHEDULE EVERY 1 DAY
-- STARTS CURRENT_TIMESTAMP
-- DO
-- BEGIN
--     UPDATE orders
--     SET status = 'cancelled'
--     WHERE status = 'pending'
--       AND created_at < DATE_SUB(NOW(), INTERVAL 7 DAY);
-- END;

-- ============================================================
-- VERIFICATION: Check all tables
-- ============================================================
SELECT 'departments' AS table_name, COUNT(*) AS row_count FROM departments
UNION ALL SELECT 'employees', COUNT(*) FROM employees
UNION ALL SELECT 'salary_history', COUNT(*) FROM salary_history
UNION ALL SELECT 'customers', COUNT(*) FROM customers
UNION ALL SELECT 'categories', COUNT(*) FROM categories
UNION ALL SELECT 'products', COUNT(*) FROM products
UNION ALL SELECT 'orders', COUNT(*) FROM orders
UNION ALL SELECT 'order_items', COUNT(*) FROM order_items
UNION ALL SELECT 'user_logins', COUNT(*) FROM user_logins
UNION ALL SELECT 'daily_revenue', COUNT(*) FROM daily_revenue
UNION ALL SELECT 'students', COUNT(*) FROM students;
