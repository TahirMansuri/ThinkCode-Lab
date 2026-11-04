// Language registry: identity colour, engine binding, starter template. status 'soon' = engine pack planned.
export const LANGS = [
  { id: 'python', name: 'Python', file: 'main.py', engine: 'python', hue: '#5DA9E9', input: null,
    tpl: `# Python 3.12 — runs offline on your device
name = input("Your name: ")
print(f"Hello, {name}!")

squares = [n * n for n in range(1, 6)]
print("Squares:", squares)
` },
  { id: 'js', name: 'JavaScript', file: 'main.js', engine: 'js', hue: '#F4D35E', input: null,
    tpl: `// JavaScript — console.log() and prompt() are supported
const name = prompt("Your name?") ?? "friend";
console.log(\`Hello, \${name}!\`);

const fib = n => (n < 2 ? n : fib(n - 1) + fib(n - 2));
console.log([...Array(10).keys()].map(fib));
` },
  { id: 'sql', name: 'Oracle SQL', file: 'query.sql', engine: 'sql', hue: '#3DD6C0', input: null, sample: true,
    tpl: `-- Tap "Sample data" to load EMP and DEPT, then run this.
-- Oracle-style: NVL, DUAL, SYSDATE, ROWNUM, MINUS, TO_CHAR, DESC
SELECT d.dname, COUNT(*) AS staff, ROUND(AVG(e.sal), 2) AS avg_sal
FROM emp e JOIN dept d ON d.deptno = e.deptno
GROUP BY d.dname
ORDER BY avg_sal DESC;

SELECT ename, NVL(comm, 0) AS comm FROM emp WHERE ROWNUM <= 5;
SELECT TO_CHAR(SYSDATE, 'DD-MON-YYYY') AS today FROM dual;
` },
  { id: 'web', name: 'HTML / CSS', file: 'index.html', engine: 'web', hue: '#FF7A59', input: null,
    tpl: `<!doctype html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body { font-family: system-ui; display: grid; place-items: center; min-height: 90vh; background: #10202c; color: #e7eef4; }
  button { font: inherit; padding: .7em 1.4em; border: 0; border-radius: 999px; background: #ffb04a; cursor: pointer; }
</style>
</head>
<body>
  <div style="text-align:center">
    <h1>Hello, web!</h1>
    <button onclick="this.textContent = 'Clicked ' + (++n) + '×'">Click me</button>
  </div>
  <script>let n = 0; console.log('page ready');</script>
</body>
</html>
` },
  { id: 'shell', name: 'Linux Shell', file: 'script.sh', engine: 'shell', hue: '#9EE493', input: 'prompt',
    tpl: `#!/bin/bash
# Offline Linux shell — files persist on this device
echo "Hello, $USER!"
mkdir -p lab && cd lab
for i in 1 2 3; do echo "line $i" >> notes.txt; done
cat notes.txt | grep -n 2
ls -l
` },
  { id: 'php', name: 'PHP', file: 'index.php', engine: 'php', hue: '#8892BF', input: null,
    tpl: `<?php

?>
`, stdin: '' },
  { id: 'c', name: 'C', file: 'main.c', engine: 'c', hue: '#64748B', input: null,
    tpl: `// C (C99) — runs 100% offline on your device
#include <stdio.h>

int factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}

int main() {
    int num;
    printf("Enter a number: ");
    scanf("%d", &num);
    printf("Factorial of %d is %d\\n", num, factorial(num));
    return 0;
}
` },
  { id: 'cpp', name: 'C++', file: 'main.cpp', engine: 'cpp', hue: '#8B5CF6', input: null,
    tpl: `// C++ — runs 100% offline on your device
#include <iostream>
using namespace std;

int main() {
    string name;
    int roll;

    cout << "Enter your name: ";
    cin >> name;

    cout << "Enter your roll number: ";
    cin >> roll;

    cout << "\\nHello, " << name << "! (Roll: " << roll << ")" << endl;
    cout << "C++ interactive in-console input is working!" << endl;
    return 0;
}
` },
  { id: 'java', name: 'Java', file: 'Main.java', engine: null, hue: '#F28482', soon: 'Phase 4 — JVM offline pack' }
];
