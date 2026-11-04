// Main-thread SQL metadata: schema list, starter queries, practice-query library.
export const SCHEMAS = [
  { id: 'SCOTT', desc: 'Classic Oracle practice schema: employees, departments, salary grades.', tables: 'DEPT · EMP · SALGRADE · BONUS' },
  { id: 'UNIVERSITY', desc: 'Students, courses and marks — typical college DBMS lab.', tables: 'DEPARTMENT · STUDENT · COURSE · ENROLLMENT' },
  { id: 'BANK', desc: 'Branches, customers, accounts and transactions.', tables: 'BRANCH · CUSTOMER · ACCOUNT · TXN' },
  { id: 'WORKSPACE', desc: 'Empty schema for your own CREATE TABLE, DML and DDL practice.', tables: 'no tables yet' }
];
export const STARTERS = {
  SCOTT: `-- Connected as SCOTT. Tap Queries for ready-made practice,
-- or open the Schema tab to browse tables.
SELECT e.ename, e.job, e.sal, d.dname
FROM emp e JOIN dept d ON d.deptno = e.deptno
WHERE e.sal > 2000
ORDER BY e.sal DESC;
`,
  UNIVERSITY: `-- Connected as UNIVERSITY
SELECT s.name, d.dept_name, s.cgpa
FROM student s JOIN department d ON d.dept_id = s.dept_id
ORDER BY s.cgpa DESC;
`,
  BANK: `-- Connected as BANK
SELECT c.name, a.acc_no, a.acc_type, a.balance
FROM account a JOIN customer c ON c.cust_id = a.cust_id
ORDER BY a.balance DESC;
`,
  WORKSPACE: `-- Connected as WORKSPACE (empty). Create something:
CREATE TABLE notes (id NUMBER PRIMARY KEY, title VARCHAR2(40));
INSERT INTO notes VALUES (1, 'Hello Oracle');
SELECT * FROM notes;
`
};
const S = 'SCOTT', U = 'UNIVERSITY', B = 'BANK';
export const QUERIES = [
  { cat: 'Select & projection', s: S, items: [
    ['All employees', 'SELECT * FROM emp;'],
    ['Columns with alias', 'SELECT ename AS employee, sal AS salary, sal * 12 AS annual_sal FROM emp;'],
    ['Distinct jobs', 'SELECT DISTINCT job FROM emp;'],
    ['String concatenation', `SELECT ename || ' works as ' || job AS info FROM emp;`],
    ['Expressions from DUAL', 'SELECT 2 * 10 + 5 AS result, SYSDATE AS today FROM dual;'] ] },
  { cat: 'Filtering (WHERE)', s: S, items: [
    ['AND / OR', `SELECT ename, job, sal FROM emp\nWHERE (job = 'CLERK' OR job = 'SALESMAN') AND sal > 1000;`],
    ['BETWEEN', 'SELECT ename, sal FROM emp WHERE sal BETWEEN 1500 AND 3000;'],
    ['IN list', 'SELECT ename, deptno FROM emp WHERE deptno IN (10, 30);'],
    ['LIKE pattern', `SELECT ename FROM emp WHERE ename LIKE 'S%' OR ename LIKE '%N';`],
    ['IS NULL', 'SELECT ename, comm FROM emp WHERE comm IS NULL;'],
    ['Date comparison', `SELECT ename, hiredate FROM emp\nWHERE hiredate > TO_DATE('01-JAN-1982', 'DD-MON-YYYY');`] ] },
  { cat: 'Sorting & top-N', s: S, items: [
    ['ORDER BY multiple columns', 'SELECT ename, deptno, sal FROM emp ORDER BY deptno, sal DESC;'],
    ['Top 3 salaries', 'SELECT ename, sal FROM emp ORDER BY sal DESC FETCH FIRST 3 ROWS ONLY;'],
    ['First 5 rows (ROWNUM)', 'SELECT * FROM emp WHERE ROWNUM <= 5;'] ] },
  { cat: 'Single-row functions', s: S, items: [
    ['String functions', `SELECT ename, UPPER(ename) AS up, INITCAP(job) AS job, LENGTH(ename) AS len,\n  SUBSTR(ename, 1, 3) AS first3, INSTR(ename, 'A') AS pos_a FROM emp;`],
    ['Number functions', 'SELECT sal, ROUND(sal / 7, 2) AS r, MOD(sal, 7) AS m, CEIL(sal / 7) AS c, FLOOR(sal / 7) AS f FROM emp;'],
    ['Date functions', `SELECT ename, TO_CHAR(hiredate, 'DD-MON-YYYY') AS hired,\n  ROUND(MONTHS_BETWEEN(SYSDATE, hiredate) / 12) AS years FROM emp;`],
    ['NVL and NVL2', `SELECT ename, sal, comm, NVL(comm, 0) AS comm0, sal + NVL(comm, 0) AS total,\n  NVL2(comm, 'Has comm', 'No comm') AS flag FROM emp;`],
    ['DECODE', `SELECT ename, deptno, DECODE(deptno, 10, 'HQ', 20, 'LAB', 30, 'FIELD', 'OTHER') AS site FROM emp;`],
    ['CASE expression', `SELECT ename, sal,\n  CASE WHEN sal >= 3000 THEN 'High' WHEN sal >= 1500 THEN 'Medium' ELSE 'Low' END AS band\nFROM emp;`] ] },
  { cat: 'Aggregates & grouping', s: S, items: [
    ['Summary statistics', 'SELECT COUNT(*) AS n, SUM(sal) AS total, ROUND(AVG(sal), 2) AS avg_sal, MIN(sal) AS lo, MAX(sal) AS hi FROM emp;'],
    ['GROUP BY department', 'SELECT deptno, COUNT(*) AS staff, SUM(sal) AS payroll FROM emp GROUP BY deptno ORDER BY deptno;'],
    ['HAVING', 'SELECT job, COUNT(*) AS n, ROUND(AVG(sal)) AS avg_sal FROM emp GROUP BY job HAVING COUNT(*) > 1;'],
    ['LISTAGG', `SELECT deptno, LISTAGG(ename, ', ') WITHIN GROUP (ORDER BY ename) AS staff FROM emp GROUP BY deptno;`] ] },
  { cat: 'Joins', s: S, items: [
    ['Inner join', 'SELECT e.ename, e.job, d.dname, d.loc FROM emp e JOIN dept d ON e.deptno = d.deptno;'],
    ['Left join (all departments)', 'SELECT d.dname, COUNT(e.empno) AS staff FROM dept d LEFT JOIN emp e ON e.deptno = d.deptno GROUP BY d.dname;'],
    ['Self join (manager)', 'SELECT e.ename AS employee, m.ename AS manager FROM emp e LEFT JOIN emp m ON e.mgr = m.empno;'],
    ['Non-equi join (grades)', 'SELECT e.ename, e.sal, s.grade FROM emp e JOIN salgrade s ON e.sal BETWEEN s.losal AND s.hisal ORDER BY s.grade DESC;'],
    ['Cross join', 'SELECT d.dname, s.grade FROM dept d CROSS JOIN salgrade s;'] ] },
  { cat: 'Subqueries', s: S, items: [
    ['Above average salary', 'SELECT ename, sal FROM emp WHERE sal > (SELECT AVG(sal) FROM emp);'],
    ['Highest paid per department', 'SELECT ename, deptno, sal FROM emp e WHERE sal = (SELECT MAX(sal) FROM emp WHERE deptno = e.deptno);'],
    ['IN subquery', 'SELECT dname FROM dept WHERE deptno IN (SELECT deptno FROM emp WHERE sal > 2500);'],
    ['NOT EXISTS', 'SELECT dname FROM dept d WHERE NOT EXISTS (SELECT 1 FROM emp e WHERE e.deptno = d.deptno);'],
    ['Second highest salary', 'SELECT MAX(sal) AS second_highest FROM emp WHERE sal < (SELECT MAX(sal) FROM emp);'] ] },
  { cat: 'Set operations', s: S, items: [
    ['UNION', 'SELECT deptno FROM emp UNION SELECT deptno FROM dept;'],
    ['INTERSECT', 'SELECT job FROM emp WHERE deptno = 10 INTERSECT SELECT job FROM emp WHERE deptno = 20;'],
    ['MINUS', 'SELECT deptno FROM dept MINUS SELECT deptno FROM emp;'] ] },
  { cat: 'Views, index & sequence', s: S, items: [
    ['Create a view', `CREATE OR REPLACE VIEW dept_summary AS\nSELECT d.dname, COUNT(e.empno) AS staff, NVL(SUM(e.sal), 0) AS payroll\nFROM dept d LEFT JOIN emp e ON e.deptno = d.deptno GROUP BY d.dname;\n\nSELECT * FROM dept_summary;`],
    ['Create an index', 'CREATE INDEX idx_emp_job ON emp(job);\nSELECT * FROM user_indexes;'],
    ['Sequence with INSERT', `CREATE SEQUENCE emp_seq START WITH 8000 INCREMENT BY 1;\nINSERT INTO emp (empno, ename, job, sal, deptno) VALUES (emp_seq.NEXTVAL, 'DEMO', 'CLERK', 1000, 10);\nSELECT emp_seq.CURRVAL AS last_id FROM dual;\nSELECT * FROM emp WHERE ename = 'DEMO';`] ] },
  { cat: 'DML & transactions', s: S, items: [
    ['INSERT a department', `INSERT INTO dept VALUES (50, 'MARKETING', 'MUMBAI');\nSELECT * FROM dept;`],
    ['UPDATE then ROLLBACK', 'UPDATE emp SET sal = sal * 1.10 WHERE deptno = 20;\nSELECT ename, sal FROM emp WHERE deptno = 20;\nROLLBACK;\nSELECT ename, sal FROM emp WHERE deptno = 20;'],
    ['SAVEPOINT', 'UPDATE emp SET comm = 100 WHERE deptno = 10;\nSAVEPOINT sp1;\nDELETE FROM emp WHERE deptno = 10;\nROLLBACK TO sp1;\nSELECT * FROM emp WHERE deptno = 10;\nCOMMIT;'] ] },
  { cat: 'University practice', s: U, items: [
    ['Students with department', 'SELECT s.roll_no, s.name, d.dept_name, s.cgpa FROM student s JOIN department d ON d.dept_id = s.dept_id ORDER BY s.cgpa DESC;'],
    ['Average CGPA per department', 'SELECT d.dept_name, COUNT(*) AS students, ROUND(AVG(s.cgpa), 2) AS avg_cgpa FROM student s JOIN department d ON d.dept_id = s.dept_id GROUP BY d.dept_name;'],
    ['Course enrolment & average marks', 'SELECT c.course_id, c.title, COUNT(e.roll_no) AS students, ROUND(AVG(e.marks), 1) AS avg_marks\nFROM course c LEFT JOIN enrollment e ON e.course_id = c.course_id GROUP BY c.course_id, c.title;'],
    ['Students with no enrolment', 'SELECT s.name FROM student s LEFT JOIN enrollment e ON e.roll_no = s.roll_no WHERE e.roll_no IS NULL;'],
    ['Topper per course', 'SELECT c.title, s.name, e.marks FROM enrollment e\nJOIN student s ON s.roll_no = e.roll_no JOIN course c ON c.course_id = e.course_id\nWHERE e.marks = (SELECT MAX(marks) FROM enrollment WHERE course_id = e.course_id);'],
    ['Grade report (CASE)', `SELECT s.name, c.title, e.marks,\n  CASE WHEN e.marks >= 90 THEN 'O' WHEN e.marks >= 80 THEN 'A' WHEN e.marks >= 70 THEN 'B' WHEN e.marks >= 60 THEN 'C' ELSE 'D' END AS grade\nFROM enrollment e JOIN student s ON s.roll_no = e.roll_no JOIN course c ON c.course_id = e.course_id;`],
    ['Age from date of birth', `SELECT name, TO_CHAR(dob, 'DD-MON-YYYY') AS dob, TRUNC(MONTHS_BETWEEN(SYSDATE, dob) / 12) AS age FROM student;`] ] },
  { cat: 'Bank practice', s: B, items: [
    ['Accounts with owner', 'SELECT a.acc_no, c.name, a.acc_type, a.balance FROM account a JOIN customer c ON c.cust_id = a.cust_id ORDER BY a.balance DESC;'],
    ['Total balance per branch', 'SELECT b.branch_name, COUNT(*) AS accounts, SUM(a.balance) AS total FROM account a JOIN branch b ON b.branch_id = a.branch_id GROUP BY b.branch_name;'],
    ['Customers with more than one account', 'SELECT c.name, COUNT(*) AS accounts FROM customer c JOIN account a ON a.cust_id = c.cust_id GROUP BY c.name HAVING COUNT(*) > 1;'],
    ['Deposits vs withdrawals', `SELECT acc_no,\n  SUM(CASE WHEN txn_type = 'D' THEN amount ELSE 0 END) AS deposits,\n  SUM(CASE WHEN txn_type = 'W' THEN amount ELSE 0 END) AS withdrawals\nFROM txn GROUP BY acc_no;`],
    ['Last 5 transactions', 'SELECT * FROM txn ORDER BY txn_date DESC FETCH FIRST 5 ROWS ONLY;'],
    ['Fund transfer (transaction)', 'UPDATE account SET balance = balance - 5000 WHERE acc_no = 1002;\nUPDATE account SET balance = balance + 5000 WHERE acc_no = 1001;\nSELECT acc_no, balance FROM account WHERE acc_no IN (1001, 1002);\nCOMMIT;'],
    ['Customers without phone', 'SELECT name, city FROM customer WHERE phone IS NULL;'] ] },
  { cat: 'DDL & constraints', items: [
    ['Create table with constraints', `CREATE TABLE student_lab (\n  roll_no   NUMBER(4) PRIMARY KEY,\n  name      VARCHAR2(30) NOT NULL,\n  email     VARCHAR2(40) UNIQUE,\n  marks     NUMBER(3) CHECK (marks BETWEEN 0 AND 100),\n  joined_on DATE DEFAULT SYSDATE\n);\nINSERT INTO student_lab (roll_no, name, email, marks) VALUES (1, 'Asha', 'asha@mail.com', 88);\nSELECT * FROM student_lab;`],
    ['Constraint violation demo', `CREATE TABLE demo_c (id NUMBER PRIMARY KEY, marks NUMBER CHECK (marks <= 100));\nINSERT INTO demo_c VALUES (1, 50);\nINSERT INTO demo_c VALUES (1, 60);`],
    ['ALTER TABLE', `ALTER TABLE student_lab ADD (city VARCHAR2(20));\nDESC student_lab;`],
    ['Rename and truncate', 'ALTER TABLE student_lab RENAME TO students_lab;\nTRUNCATE TABLE students_lab;\nSELECT COUNT(*) AS rows_left FROM students_lab;'],
    ['DROP TABLE', 'DROP TABLE student_lab;']] },
  { cat: 'Data dictionary', items: [
    ['Tables in this schema', 'SELECT table_name FROM user_tables;'],
    ['Columns of every table', 'SELECT table_name, column_id, column_name, data_type, nullable FROM user_tab_columns ORDER BY table_name, column_id;'],
    ['Views and indexes', 'SELECT * FROM user_views;\nSELECT * FROM user_indexes;'],
    ['Current user', 'SHOW USER;']] }
];
