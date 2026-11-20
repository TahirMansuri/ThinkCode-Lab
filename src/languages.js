// Minimal initial code segments for 1-tap "New File" action
export const BLANK_TEMPLATES = {
  python: `print("Welcome")\n`,
  c: `#include <stdio.h>\n\nint main() {\n  \n  return 0;\n}\n`,
  cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n  \n  return 0;\n}\n`,
  java: `import java.util.Scanner;\n\npublic class Main {\n  public static void main(String[] args) {\n    \n  }\n}\n`,
  csharp: `using System;\n\nclass Program {\n  static void Main(string[] args) {\n    \n  }\n}\n`,
  php: `<?php\n\necho "Welcome";\n\n?>\n`,
  js: `console.log("Welcome");\n`,
  web: `<!DOCTYPE html>\n<html>\n<head>\n  <meta charset="UTF-8">\n  <title>My Web Page</title>\n</head>\n<body>\n  \n</body>\n</html>\n`,
  shell: `#!/bin/bash\n\necho "Welcome"\n`,
  sql: `-- SQL Query\nSELECT 'Welcome' AS message FROM dual;\n`
};

export const BLANK_PHP_HTML = `<!DOCTYPE html>\n<html>\n<head>\n  <meta charset="UTF-8">\n  <title>PHP Web Form</title>\n</head>\n<body>\n  \n</body>\n</html>\n`;

// Language registry: identity colour, engine binding, starter template. status 'soon' = engine pack planned.
export const LANGS = [
  { id: 'python', name: 'Python', file: 'main.py', engine: 'python', hue: '#5DA9E9', input: null, blank: BLANK_TEMPLATES.python,
    tpl: `# Python 3.12 — runs offline on your device
name = input("Your name: ")
print(f"Hello, {name}!")

squares = [n * n for n in range(1, 6)]
print("Squares:", squares)
` },
  { id: 'js', name: 'JavaScript', file: 'main.js', engine: 'js', hue: '#F4D35E', input: null, blank: BLANK_TEMPLATES.js,
    tpl: `// JavaScript — console.log() and prompt() are supported
const name = prompt("Your name?") ?? "friend";
console.log(\`Hello, \${name}!\`);

const fib = n => (n < 2 ? n : fib(n - 1) + fib(n - 2));
console.log([...Array(10).keys()].map(fib));
` },
  { id: 'sql', name: 'Oracle SQL', file: 'query.sql', engine: 'sql', hue: '#3DD6C0', input: null, sample: true, blank: BLANK_TEMPLATES.sql,
    tpl: `-- Tap "Sample data" to load EMP and DEPT, then run this.
-- Oracle-style: NVL, DUAL, SYSDATE, ROWNUM, MINUS, TO_CHAR, DESC
SELECT d.dname, COUNT(*) AS staff, ROUND(AVG(e.sal), 2) AS avg_sal
FROM emp e JOIN dept d ON d.deptno = e.deptno
GROUP BY d.dname
ORDER BY avg_sal DESC;

SELECT ename, NVL(comm, 0) AS comm FROM emp WHERE ROWNUM <= 5;
SELECT TO_CHAR(SYSDATE, 'DD-MON-YYYY') AS today FROM dual;
` },
  { id: 'web', name: 'HTML / CSS', file: 'index.html', engine: 'web', hue: '#FF7A59', input: null, blank: BLANK_TEMPLATES.web,
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
  { id: 'shell', name: 'Linux Shell', file: 'script.sh', engine: 'shell', hue: '#9EE493', input: 'prompt', blank: BLANK_TEMPLATES.shell,
    tpl: `#!/bin/bash
# Offline Linux shell — files persist on this device
echo "Hello, $USER!"
mkdir -p lab && cd lab
for i in 1 2 3; do echo "line $i" >> notes.txt; done
cat notes.txt | grep -n 2
ls -l
` },
  { id: 'php', name: 'PHP', file: 'index.php', engine: 'php', hue: '#8892BF', input: null, blank: BLANK_TEMPLATES.php,
    tpl: `<?php

?>
`, stdin: '' },
  { id: 'c', name: 'C', file: 'main.c', engine: 'c', hue: '#64748B', input: null, blank: BLANK_TEMPLATES.c,
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
  { id: 'cpp', name: 'C++', file: 'main.cpp', engine: 'cpp', hue: '#8B5CF6', input: null, blank: BLANK_TEMPLATES.cpp,
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
  { id: 'java', name: 'Java', file: 'Main.java', engine: 'java', hue: '#F28482', input: null, blank: BLANK_TEMPLATES.java,
    tpl: `// Java (JDK) — runs 100% offline on your device
import java.util.Scanner;

public class Main {
  public static void main(String[] args) {
    Scanner sc = new Scanner(System.in);

    System.out.print("Enter your name: ");
    String name = sc.nextLine();

    System.out.print("Enter your roll number: ");
    int roll = sc.nextInt();

    System.out.println("\\nHello, " + name + "! (Roll: " + roll + ")");
    System.out.println("Java interactive in-console input is working!");
  }
}
` },
  { id: 'csharp', name: 'C#', file: 'Program.cs', engine: 'csharp', hue: '#A855F7', input: null, blank: BLANK_TEMPLATES.csharp,
    tpl: `// C# (.NET) — runs 100% offline on your device
using System;

class Program {
  static void Main(string[] args) {
    Console.Write("Enter your name: ");
    string name = Console.ReadLine();

    Console.Write("Enter your roll number: ");
    int roll = int.Parse(Console.ReadLine());

    Console.WriteLine($"\\nHello, {name}! (Roll: {roll})");
    Console.WriteLine("C# (.NET) interactive in-console input is working!");
  }
}
` }
];
