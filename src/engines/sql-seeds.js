// Schema seed scripts (worker-side only). Order matters: parents before children (foreign keys are ON).
export const SEEDS = {
  SCOTT: `
CREATE TABLE dept(deptno INTEGER PRIMARY KEY, dname VARCHAR2(14), loc VARCHAR2(13));
INSERT INTO dept VALUES (10,'ACCOUNTING','NEW YORK'),(20,'RESEARCH','DALLAS'),(30,'SALES','CHICAGO'),(40,'OPERATIONS','BOSTON');
CREATE TABLE emp(empno INTEGER PRIMARY KEY, ename VARCHAR2(10), job VARCHAR2(9), mgr INTEGER, hiredate DATE, sal NUMBER(7,2), comm NUMBER(7,2), deptno INTEGER REFERENCES dept(deptno));
INSERT INTO emp VALUES
(7369,'SMITH','CLERK',7902,'1980-12-17',800,NULL,20),(7499,'ALLEN','SALESMAN',7698,'1981-02-20',1600,300,30),
(7521,'WARD','SALESMAN',7698,'1981-02-22',1250,500,30),(7566,'JONES','MANAGER',7839,'1981-04-02',2975,NULL,20),
(7654,'MARTIN','SALESMAN',7698,'1981-09-28',1250,1400,30),(7698,'BLAKE','MANAGER',7839,'1981-05-01',2850,NULL,30),
(7782,'CLARK','MANAGER',7839,'1981-06-09',2450,NULL,10),(7788,'SCOTT','ANALYST',7566,'1987-04-19',3000,NULL,20),
(7839,'KING','PRESIDENT',NULL,'1981-11-17',5000,NULL,10),(7844,'TURNER','SALESMAN',7698,'1981-09-08',1500,0,30),
(7876,'ADAMS','CLERK',7788,'1987-05-23',1100,NULL,20),(7900,'JAMES','CLERK',7698,'1981-12-03',950,NULL,30),
(7902,'FORD','ANALYST',7566,'1981-12-03',3000,NULL,20),(7934,'MILLER','CLERK',7782,'1982-01-23',1300,NULL,10);
CREATE TABLE salgrade(grade INTEGER PRIMARY KEY, losal NUMBER, hisal NUMBER);
INSERT INTO salgrade VALUES (1,700,1200),(2,1201,1400),(3,1401,2000),(4,2001,3000),(5,3001,9999);
CREATE TABLE bonus(ename VARCHAR2(10), job VARCHAR2(9), sal NUMBER, comm NUMBER);`,

  UNIVERSITY: `
CREATE TABLE department(dept_id INTEGER PRIMARY KEY, dept_name VARCHAR2(30) NOT NULL, hod VARCHAR2(30));
INSERT INTO department VALUES (1,'Computer Science','Dr. Mehta'),(2,'Information Technology','Dr. Iyer'),(3,'Electronics','Dr. Khan');
CREATE TABLE student(roll_no INTEGER PRIMARY KEY, name VARCHAR2(30) NOT NULL, dept_id INTEGER REFERENCES department(dept_id), city VARCHAR2(20), dob DATE, cgpa NUMBER(3,2));
INSERT INTO student VALUES (101,'Aarav Patil',1,'Nashik','2003-05-14',8.6),(102,'Diya Sharma',1,'Pune','2002-11-02',9.1),
(103,'Rohan Deshmukh',2,'Nashik','2003-01-23',7.4),(104,'Sneha Kulkarni',2,'Mumbai','2002-08-30',8.2),
(105,'Imran Shaikh',3,'Pune','2003-03-17',6.9),(106,'Priya Nair',1,'Mumbai','2003-07-09',9.4),
(107,'Karan Joshi',3,'Nashik','2002-12-25',7.8),(108,'Meera Iyer',2,'Pune','2003-09-12',8.0);
CREATE TABLE course(course_id VARCHAR2(8) PRIMARY KEY, title VARCHAR2(40) NOT NULL, credits NUMBER(1), dept_id INTEGER REFERENCES department(dept_id));
INSERT INTO course VALUES ('CS101','Database Systems',4,1),('CS102','Data Structures',4,1),('CS103','Operating Systems',3,1),('IT201','Web Technology',3,2),('EC301','Digital Electronics',3,3);
CREATE TABLE enrollment(roll_no INTEGER REFERENCES student(roll_no), course_id VARCHAR2(8) REFERENCES course(course_id), marks NUMBER(3), PRIMARY KEY(roll_no, course_id));
INSERT INTO enrollment VALUES (101,'CS101',82),(101,'CS102',76),(102,'CS101',91),(102,'CS102',88),(102,'CS103',79),(103,'IT201',64),(103,'CS101',58),
(104,'IT201',85),(105,'EC301',49),(106,'CS101',95),(106,'CS103',90),(107,'EC301',72),(107,'CS102',66);`,

  BANK: `
CREATE TABLE branch(branch_id INTEGER PRIMARY KEY, branch_name VARCHAR2(30) NOT NULL, city VARCHAR2(20));
INSERT INTO branch VALUES (1,'Nashik Main','Nashik'),(2,'Pune Camp','Pune'),(3,'Mumbai Fort','Mumbai');
CREATE TABLE customer(cust_id INTEGER PRIMARY KEY, name VARCHAR2(30) NOT NULL, city VARCHAR2(20), phone VARCHAR2(12));
INSERT INTO customer VALUES (1,'Ramesh Pawar','Nashik','9822001122'),(2,'Anita Rao','Pune','9822003344'),(3,'Suresh Mehta','Mumbai','9822005566'),
(4,'Kavita Joshi','Nashik','9822007788'),(5,'Farhan Khan','Pune','9822009900'),(6,'Neha Gupta','Mumbai',NULL);
CREATE TABLE account(acc_no INTEGER PRIMARY KEY, cust_id INTEGER REFERENCES customer(cust_id), branch_id INTEGER REFERENCES branch(branch_id),
  acc_type VARCHAR2(10) CHECK (acc_type IN ('SAVINGS','CURRENT','FIXED')), balance NUMBER(12,2) DEFAULT 0, opened_on DATE);
INSERT INTO account VALUES (1001,1,1,'SAVINGS',54000,'2019-04-12'),(1002,1,1,'CURRENT',120000,'2020-08-01'),(1003,2,2,'SAVINGS',23500,'2021-01-15'),
(1004,3,3,'SAVINGS',87250,'2018-11-30'),(1005,4,1,'SAVINGS',15000,'2022-06-20'),(1006,5,2,'CURRENT',310000,'2017-03-05'),
(1007,6,3,'SAVINGS',4200,'2023-02-11'),(1008,3,3,'FIXED',500000,'2020-12-01');
CREATE TABLE txn(txn_id INTEGER PRIMARY KEY, acc_no INTEGER REFERENCES account(acc_no), txn_type CHAR(1) CHECK (txn_type IN ('D','W')), amount NUMBER(12,2), txn_date DATE);
INSERT INTO txn VALUES (1,1001,'D',10000,'2024-01-05'),(2,1001,'W',2500,'2024-01-09'),(3,1002,'D',50000,'2024-01-11'),(4,1003,'W',3000,'2024-02-01'),
(5,1004,'D',20000,'2024-02-03'),(6,1005,'W',1000,'2024-02-14'),(7,1006,'D',75000,'2024-02-20'),(8,1006,'W',25000,'2024-03-02'),
(9,1007,'D',1200,'2024-03-05'),(10,1001,'W',4000,'2024-03-18'),(11,1004,'W',7500,'2024-03-21'),(12,1008,'D',100000,'2024-03-30');`,

  WORKSPACE: ''
};
