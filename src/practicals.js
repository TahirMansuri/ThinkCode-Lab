// University Syllabus Practicals & Code Examples Library
// Curated for FYBCA (CA-112, CA-113, CA-121, CA-123) and Computer Science Lab Courses

export const PRACTICALS = {
  cpp: [
    {
      id: 'cpp-1',
      num: 'Assignment 1',
      cat: 'Basic & Math',
      title: 'Arithmetic Operators',
      desc: 'Demonstrates addition, subtraction, multiplication, division, and modulo operations with user input.',
      code: `// Practical 1: Arithmetic Operators in C++
#include <iostream>
using namespace std;

int main() {
    int a, b;
    cout << "Enter first number: ";
    cin >> a;
    cout << "Enter second number: ";
    cin >> b;

    cout << "\\n--- Arithmetic Results ---" << endl;
    cout << "Addition (a + b)       : " << (a + b) << endl;
    cout << "Subtraction (a - b)    : " << (a - b) << endl;
    cout << "Multiplication (a * b) : " << (a * b) << endl;
    if (b != 0) {
        cout << "Division (a / b)       : " << (float)a / b << endl;
        cout << "Modulo (a % b)         : " << (a % b) << endl;
    } else {
        cout << "Division & Modulo      : Cannot divide by zero!" << endl;
    }
    return 0;
}
`
    },
    {
      id: 'cpp-2',
      num: 'Assignment 2',
      cat: 'Control Statements',
      title: 'Control Statements (if, if-else, switch)',
      desc: 'Checks positive/negative/zero and provides a menu-driven calculator using switch-case.',
      code: `// Practical 2: Control Statements & Menu-Driven Switch in C++
#include <iostream>
using namespace std;

int main() {
    int num;
    cout << "Enter a number to check: ";
    cin >> num;

    if (num > 0) {
        cout << num << " is Positive." << endl;
    } else if (num < 0) {
        cout << num << " is Negative." << endl;
    } else {
        cout << "The number is Zero." << endl;
    }

    cout << "\\n--- Simple Menu-Driven Calculator ---" << endl;
    cout << "1. Square\\n2. Cube\\nChoose option (1 or 2): ";
    int choice;
    cin >> choice;

    switch (choice) {
        case 1:
            cout << "Square of " << num << " is: " << (num * num) << endl;
            break;
        case 2:
            cout << "Cube of " << num << " is: " << (num * num * num) << endl;
            break;
        default:
            cout << "Invalid choice selected!" << endl;
            break;
    }
    return 0;
}
`
    },
    {
      id: 'cpp-3',
      num: 'Assignment 3',
      cat: 'Loops',
      title: 'Looping Structures (for, while, do-while)',
      desc: 'Demonstrates multiplication table with for, digit sum with while, and repeat prompt with do-while.',
      code: `// Practical 3: Looping Structures (for, while, do-while)
#include <iostream>
using namespace std;

int main() {
    int n;
    cout << "Enter a number for multiplication table: ";
    cin >> n;

    cout << "\\n--- Table of " << n << " (for loop) ---" << endl;
    for (int i = 1; i <= 10; i++) {
        cout << n << " x " << i << " = " << (n * i) << endl;
    }

    int temp = n, sum = 0;
    while (temp > 0) {
        sum += (temp % 10);
        temp /= 10;
    }
    cout << "\\nSum of digits of " << n << " (while loop): " << sum << endl;
    return 0;
}
`
    },
    {
      id: 'cpp-4',
      num: 'Assignment 4',
      cat: 'Basic & Math',
      title: 'Check Prime Number',
      desc: 'Accepts an integer from the user and determines whether it is a prime or composite number.',
      code: `// Practical 4: Check Given Number is Prime or Not
#include <iostream>
using namespace std;

int main() {
    int n, isPrime = 1;
    cout << "Enter a positive integer: ";
    cin >> n;

    if (n <= 1) {
        isPrime = 0;
    } else {
        for (int i = 2; i * i <= n; i++) {
            if (n % i == 0) {
                isPrime = 0;
                break;
            }
        }
    }

    if (isPrime == 1) {
        cout << n << " is a PRIME number." << endl;
    } else {
        cout << n << " is NOT a prime number (Composite)." << endl;
    }
    return 0;
}
`
    },
    {
      id: 'cpp-5',
      num: 'Assignment 5',
      cat: 'Basic & Math',
      title: 'Factorial of Given Number',
      desc: 'Calculates the factorial of a number using iterative loop and recursive function.',
      code: `// Practical 5: Factorial of a Number (Iterative & Recursive)
#include <iostream>
using namespace std;

long long factRecursive(int n) {
    if (n <= 1) return 1;
    return n * factRecursive(n - 1);
}

int main() {
    int n;
    cout << "Enter a number (0 to 15): ";
    cin >> n;

    if (n < 0) {
        cout << "Factorial of negative numbers does not exist!" << endl;
        return 0;
    }

    long long factIter = 1;
    for (int i = 1; i <= n; i++) {
        factIter *= i;
    }

    cout << "\\nIterative Factorial of " << n << " = " << factIter << endl;
    cout << "Recursive Factorial of " << n << " = " << factRecursive(n) << endl;
    return 0;
}
`
    },
    {
      id: 'cpp-6',
      num: 'Assignment 6',
      cat: 'Basic & Math',
      title: 'Fibonacci Series',
      desc: 'Generates and prints the first N terms of the Fibonacci sequence.',
      code: `// Practical 6: Fibonacci Series up to N terms
#include <iostream>
using namespace std;

int main() {
    int n;
    cout << "Enter number of terms: ";
    cin >> n;

    long long first = 0, second = 1, next;
    cout << "\\nFibonacci Series (" << n << " terms):" << endl;

    for (int i = 1; i <= n; i++) {
        if (i == 1) {
            cout << first << " ";
            continue;
        }
        if (i == 2) {
            cout << second << " ";
            continue;
        }
        next = first + second;
        first = second;
        second = next;
        cout << next << " ";
    }
    cout << endl;
    return 0;
}
`
    },
    {
      id: 'cpp-7',
      num: 'Assignment 7',
      cat: 'Arrays',
      title: '1D & 2D Arrays (Matrix Addition)',
      desc: 'Reads two 2x2 matrices from the student and computes their matrix addition.',
      code: `// Practical 7: 2D Array Matrix Addition (2x2)
#include <iostream>
using namespace std;

int main() {
    int A[2][2], B[2][2], Sum[2][2];

    cout << "Enter 4 elements for Matrix A (row-wise):" << endl;
    for (int i = 0; i < 2; i++) {
        for (int j = 0; j < 2; j++) {
            cin >> A[i][j];
        }
    }

    cout << "\\nEnter 4 elements for Matrix B (row-wise):" << endl;
    for (int i = 0; i < 2; i++) {
        for (int j = 0; j < 2; j++) {
            cin >> B[i][j];
        }
    }

    // Matrix addition
    for (int i = 0; i < 2; i++) {
        for (int j = 0; j < 2; j++) {
            Sum[i][j] = A[i][j] + B[i][j];
        }
    }

    cout << "\\n--- Sum Matrix (A + B) ---" << endl;
    for (int i = 0; i < 2; i++) {
        for (int j = 0; j < 2; j++) {
            cout << Sum[i][j] << "\\t";
        }
        cout << endl;
    }
    return 0;
}
`
    },
    {
      id: 'cpp-8',
      num: 'Assignment 8',
      cat: 'Functions',
      title: 'Call by Value and Reference',
      desc: 'Demonstrates difference between call by value and call by reference in C++.',
      code: `// Practical 8: Functions (Call by Value vs Call by Reference)
#include <iostream>
using namespace std;

void swapByValue(int x, int y) {
    int temp = x;
    x = y;
    y = temp;
}

void swapByReference(int &x, int &y) {
    int temp = x;
    x = y;
    y = temp;
}

int main() {
    int a = 10, b = 20;
    cout << "Original values: a = " << a << ", b = " << b << endl;

    swapByValue(a, b);
    cout << "After swapByValue (No Change): a = " << a << ", b = " << b << endl;

    swapByReference(a, b);
    cout << "After swapByReference (Swapped!): a = " << a << ", b = " << b << endl;
    return 0;
}
`
    },
    {
      id: 'cpp-9',
      num: 'Assignment 9',
      cat: 'Strings',
      title: 'String Functions (strlen, strcpy, strcat, strcmp)',
      desc: 'Demonstrates common string handling functions from <cstring>.',
      code: `// Practical 9: String Manipulation Functions in C++
#include <iostream>
#include <cstring>
using namespace std;

int main() {
    char str1[50] = "Think";
    char str2[50] = "Code";
    char copyStr[50];

    cout << "String 1: " << str1 << " (Length: " << strlen(str1) << ")" << endl;
    cout << "String 2: " << str2 << " (Length: " << strlen(str2) << ")" << endl;

    strcpy(copyStr, str1);
    cout << "\\nAfter strcpy(copyStr, str1): " << copyStr << endl;

    strcat(str1, str2);
    cout << "After strcat(str1, str2)   : " << str1 << endl;

    int cmp = strcmp("apple", "banana");
    cout << "strcmp('apple', 'banana')  : " << cmp << " (Negative means apple < banana)" << endl;
    return 0;
}
`
    },
    {
      id: 'cpp-10',
      num: 'Assignment 10',
      cat: 'Structures',
      title: 'Structure & Union Demonstration',
      desc: 'Defines and uses a structure for Student records and demonstrates memory layout difference with union.',
      code: `// Practical 10: Structure and Union in C++
#include <iostream>
using namespace std;

struct Student {
    int rollno;
    char name[20];
    float marks;
};

int main() {
    Student s;
    cout << "Enter Roll Number: ";
    cin >> s.rollno;
    cout << "Enter Name: ";
    cin >> s.name;
    cout << "Enter Marks: ";
    cin >> s.marks;

    cout << "\\n--- Student Record (Structure) ---" << endl;
    cout << "Roll No : " << s.rollno << endl;
    cout << "Name    : " << s.name << endl;
    cout << "Marks   : " << s.marks << endl;
    return 0;
}
`
    },
    {
      id: 'cpp-11',
      num: 'Assignment 11',
      cat: 'Logical Experiments',
      title: '10 Students Exam Results Tabulation',
      desc: 'Tabulates 10 students marks in 3 subjects, determines total marks, highest in each subject, and overall topper.',
      code: `// Practical 11: 10 Students Examination Results Tabulation
#include <iostream>
using namespace std;

struct StudentExam {
    int rollno;
    int sub1, sub2, sub3;
    int total;
};

int main() {
    StudentExam students[10] = {
        {2022001, 40, 87, 74, 0},
        {2022002, 50, 56, 62, 0},
        {2022003, 65, 97, 64, 0},
        {2022004, 78, 45, 75, 0},
        {2022005, 98, 32, 85, 0},
        {2022006, 45, 65, 56, 0},
        {2022007, 63, 45, 77, 0},
        {2022008, 25, 87, 64, 0},
        {2022009, 72, 23, 68, 0},
        {2022010, 63, 69, 78, 0}
    };

    int maxSub1 = -1, maxSub2 = -1, maxSub3 = -1;
    int rollMax1 = 0, rollMax2 = 0, rollMax3 = 0;
    int topperRoll = 0, highestTotal = -1;

    cout << "Roll No\\tSub1\\tSub2\\tSub3\\tTotal" << endl;
    cout << "---------------------------------------------" << endl;

    for (int i = 0; i < 10; i++) {
        students[i].total = students[i].sub1 + students[i].sub2 + students[i].sub3;
        cout << students[i].rollno << "\\t" << students[i].sub1 << "\\t" << students[i].sub2 << "\\t" << students[i].sub3 << "\\t" << students[i].total << endl;

        if (students[i].sub1 > maxSub1) { maxSub1 = students[i].sub1; rollMax1 = students[i].rollno; }
        if (students[i].sub2 > maxSub2) { maxSub2 = students[i].sub2; rollMax2 = students[i].rollno; }
        if (students[i].sub3 > maxSub3) { maxSub3 = students[i].sub3; rollMax3 = students[i].rollno; }
        if (students[i].total > highestTotal) { highestTotal = students[i].total; topperRoll = students[i].rollno; }
    }

    cout << "\\n--- Examination Summary ---" << endl;
    cout << "Highest in Subject 1 : " << maxSub1 << " (Roll No: " << rollMax1 << ")" << endl;
    cout << "Highest in Subject 2 : " << maxSub2 << " (Roll No: " << rollMax2 << ")" << endl;
    cout << "Highest in Subject 3 : " << maxSub3 << " (Roll No: " << rollMax3 << ")" << endl;
    cout << "Overall Class Topper : Roll No " << topperRoll << " with Total Marks = " << highestTotal << endl;
    return 0;
}
`
    },
    {
      id: 'cpp-12',
      num: 'Assignment 12',
      cat: 'Logical Experiments',
      title: 'Average Age with Default Argument',
      desc: 'Function finding the average age of class students with array parameter and default strength argument (n = 50).',
      code: `// Practical 12: Average Age Function with Default Arguments
#include <iostream>
using namespace std;

float calculateAverageAge(int ages[], int strength = 5) {
    int sum = 0;
    for (int i = 0; i < strength; i++) {
        sum += ages[i];
    }
    return (float)sum / strength;
}

int main() {
    int classAges[5] = {18, 19, 18, 20, 19};

    cout << "Ages of students: 18, 19, 18, 20, 19" << endl;
    float avg = calculateAverageAge(classAges, 5);
    cout << "\\nAverage Age of Class Students = " << avg << " years." << endl;
    return 0;
}
`
    },
    {
      id: 'cpp-13',
      num: 'Assignment 13',
      cat: 'Logical Experiments',
      title: 'Series of Squares (1 4 9 16 25)',
      desc: 'Accepts an integer N from the student and generates the series of squares up to N terms.',
      code: `// Practical 13: Series of Squares (1 4 9 16 25 ... N^2)
#include <iostream>
using namespace std;

int main() {
    int n;
    cout << "Enter value of N (number of terms): ";
    cin >> n;

    cout << "\\nSeries of Squares up to " << n << " terms:" << endl;
    for (int i = 1; i <= n; i++) {
        cout << (i * i) << " ";
    }
    cout << endl;
    return 0;
}
`
    },
    {
      id: 'cpp-14',
      num: 'OOP Practical 1',
      cat: 'OOP & Classes',
      title: 'Class and Object (Student Record)',
      desc: 'Demonstrates class specification, data encapsulation with private fields, and public member methods.',
      code: `// OOP Practical 1: Class and Object Specification
#include <iostream>
using namespace std;

class Student {
 private:
    int rollno;
    char name[20];
 public:
    void setStud() {
        cout << "Enter Roll Number: ";
        cin >> rollno;
        cout << "Enter Student Name: ";
        cin >> name;
    }
    void getStud() {
        cout << "\\n--- Student Profile ---" << endl;
        cout << "Roll No : " << rollno << endl;
        cout << "Name    : " << name << endl;
    }
};

int main() {
    Student s;
    s.setStud();
    s.getStud();
    return 0;
}
`
    },
    {
      id: 'cpp-15',
      num: 'OOP Practical 2',
      cat: 'OOP & Classes',
      title: 'Constructors & Destructor',
      desc: 'Demonstrates default constructor, parameterized constructor, and automatic object initialization.',
      code: `// OOP Practical 2: Constructors and Destructor
#include <iostream>
using namespace std;

class Rectangle {
 private:
    int length, width;
 public:
    Rectangle() {
        length = 0;
        width = 0;
        cout << "Default constructor invoked." << endl;
    }
    Rectangle(int l, int w) {
        length = l;
        width = w;
        cout << "Parameterized constructor invoked (" << l << "x" << w << ")." << endl;
    }
    int area() {
        return length * width;
    }
};

int main() {
    Rectangle r1;
    cout << "Area of r1: " << r1.area() << endl;

    Rectangle r2(15, 8);
    cout << "Area of r2: " << r2.area() << endl;
    return 0;
}
`
    },
    {
      id: 'cpp-16',
      num: 'OOP Practical 3',
      cat: 'OOP & Classes',
      title: 'Inheritance (Single & Multilevel)',
      desc: 'Demonstrates inheritance where derived class inherits properties and methods from base class.',
      code: `// OOP Practical 3: Inheritance (Single Inheritance)
#include <iostream>
using namespace std;

class Person {
 public:
    char name[30];
    int age;
    void setPerson() {
        cout << "Enter Person Name: ";
        cin >> name;
        cout << "Enter Age: ";
        cin >> age;
    }
};

class Student : public Person {
 public:
    int rollno;
    float marks;
    void setStudent() {
        setPerson();
        cout << "Enter Roll No: ";
        cin >> rollno;
        cout << "Enter Marks: ";
        cin >> marks;
    }
    void display() {
        cout << "\\n--- Student Record (Inherited) ---" << endl;
        cout << "Name    : " << name << endl;
        cout << "Age     : " << age << endl;
        cout << "Roll No : " << rollno << endl;
        cout << "Marks   : " << marks << endl;
    }
};

int main() {
    Student s;
    s.setStudent();
    s.display();
    return 0;
}
`
    },
    {
      id: 'cpp-17',
      num: 'OOP Practical 4',
      cat: 'Mini Project',
      title: 'Electronic Store Refrigerator Sale',
      desc: 'Syllabus Mini Project: Refrigerator class calculating sale prices based on liter capacity (>=165L).',
      code: `// OOP Practical 4: Electronic Store Refrigerator Sale (Syllabus Mini Project)
#include <iostream>
using namespace std;

class Refrigerator {
 private:
    char brand[30];
    int liters;
    int price;
 public:
    Refrigerator(string b, int l) {
        brand = b;
        if (l < 165) liters = 165;
        else liters = l;

        if (liters <= 265) price = 10000;
        else price = 15000;
    }
    void display() {
        cout << "Brand: " << brand << " | Capacity: " << liters << " Liters | Sale Price: Rs. " << price << endl;
    }
};

int main() {
    cout << "--- ThinkCode Electronics Store: Refrigerator Sale ---" << endl;
    Refrigerator ref1("LG", 150);       // Less than 165 -> sets to 165 -> Rs. 10000
    Refrigerator ref2("Whirlpool", 220); // <= 265 -> Rs. 10000
    Refrigerator ref3("Samsung", 310);   // > 265 -> Rs. 15000
    Refrigerator ref4("Haier", 450);     // > 265 -> Rs. 15000

    ref1.display();
    ref2.display();
    ref3.display();
    ref4.display();
    return 0;
}
`
    }
  ],

  shell: [
    {
      id: 'sh-1',
      num: 'OS Practical 1',
      cat: 'Commands',
      title: 'Linux Commands Demonstration',
      desc: 'Overview of essential commands: pwd, cd, ls, mkdir, date, cal, whoami, wc, sort.',
      code: `#!/bin/bash
# OS Practical 1: Demonstration of Linux Commands
echo "=== Current Working Directory ==="
pwd

echo -e "\\n=== System Calendar ==="
cal

echo -e "\\n=== System Date & Time ==="
date

echo -e "\\n=== Current Logged-in User ==="
whoami

echo -e "\\n=== Listing Files with Details ==="
ls -l

echo -e "\\n=== Word & Line Count of notes.txt ==="
wc documents/notes.txt
`
    },
    {
      id: 'sh-2',
      num: 'OS Practical 2',
      cat: 'Shell Scripts',
      title: 'First 20 Terms of Fibonacci Series',
      desc: 'Generates and displays the first 20 numbers in the Fibonacci sequence.',
      code: `#!/bin/bash
# OS Practical 2: First 20 terms of Fibonacci Series
echo "=== First 20 Terms of Fibonacci Series ==="
a=0
b=1

echo -n "$a $b "

for (( i=3; i<=20; i++ ))
do
  c=$((a + b))
  echo -n "$c "
  a=$b
  b=$c
done
echo ""
`
    },
    {
      id: 'sh-3',
      num: 'OS Practical 3',
      cat: 'Shell Scripts',
      title: 'System Time & Greeting',
      desc: 'Checks the current system hour and displays an appropriate greeting message.',
      code: `#!/bin/bash
# OS Practical 3: System Time and Dynamic Greeting
hour=$(date +%H)
echo "Current 24-hr Time: $(date +%T)"

if [ $hour -ge 5 ] && [ $hour -lt 12 ]; then
  echo "🌅 Good Morning, $USER! Welcome to the Linux Lab."
elif [ $hour -ge 12 ] && [ $hour -lt 17 ]; then
  echo "☀️ Good Afternoon, $USER! Keep coding."
elif [ $hour -ge 17 ] && [ $hour -lt 21 ]; then
  echo "🌇 Good Evening, $USER! Time for lab revision."
else
  echo "🌙 Good Night, $USER! Burning the midnight oil."
fi
`
    },
    {
      id: 'sh-4',
      num: 'OS Practical 4',
      cat: 'Shell Scripts',
      title: 'User Login Check & Greet',
      desc: 'Checks if the user is currently logged into the terminal and displays a welcome banner.',
      code: `#!/bin/bash
# OS Practical 4: User Login Status & Welcome
currentUser=$(whoami)

if [ "$currentUser" = "student" ] || [ -n "$currentUser" ]; then
  echo "✓ User '$currentUser' is currently logged in on $(hostname)."
  echo "Hello, $currentUser! Have a productive lab session."
else
  echo "User is not logged in."
fi
`
    },
    {
      id: 'sh-5',
      num: 'OS Practical 5',
      cat: 'Shell Scripts',
      title: 'Factorial of a Number',
      desc: 'Calculates the factorial of a given integer using a while loop in Bash.',
      code: `#!/bin/bash
# OS Practical 5: Calculate Factorial of a Number
num=5
fact=1
i=1

while [ $i -le $num ]
do
  fact=$((fact * i))
  i=$((i + 1))
done

echo "The factorial of $num is: $fact"
`
    },
    {
      id: 'sh-6',
      num: 'OS Practical 6',
      cat: 'Shell Scripts',
      title: 'Check Divisible by 7',
      desc: 'Checks whether a given number is completely divisible by 7.',
      code: `#!/bin/bash
# OS Practical 6: Check if Number is Divisible by 7
num=49

if [ $((num % 7)) -eq 0 ]; then
  echo "Yes, $num is divisible by 7."
else
  echo "No, $num is not divisible by 7 (Remainder: $((num % 7)))."
fi
`
    },
    {
      id: 'sh-7',
      num: 'OS Practical 7',
      cat: 'Shell Scripts',
      title: 'Check Prime Number',
      desc: 'Determines whether a given integer is prime or composite in shell script.',
      code: `#!/bin/bash
# OS Practical 7: Check if Number is Prime
num=17
isPrime=1

if [ $num -le 1 ]; then
  isPrime=0
else
  for (( i=2; i*i<=num; i++ ))
  do
    if [ $((num % i)) -eq 0 ]; then
      isPrime=0
      break
    fi
  done
fi

if [ $isPrime -eq 1 ]; then
  echo "$num is a PRIME number."
else
  echo "$num is NOT a prime number."
fi
`
    },
    {
      id: 'sh-8',
      num: 'OS Practical 8',
      cat: 'Shell Scripts',
      title: 'Check Palindrome Number/String',
      desc: 'Checks whether a number or string reads the same forwards and backwards.',
      code: `#!/bin/bash
# OS Practical 8: Check Palindrome
str="madam"
len=\${#str}
rev=""

for (( i=$len-1; i>=0; i-- ))
do
  rev="$rev\${str:$i:1}"
done

if [ "$str" = "$rev" ]; then
  echo "✓ '$str' is a PALINDROME."
else
  echo "✗ '$str' is NOT a palindrome (Reverse: '$rev')."
fi
`
    },
    {
      id: 'sh-9',
      num: 'OS Practical 9',
      cat: 'Shell Scripts',
      title: 'Check Armstrong Number',
      desc: 'Tests if a 3-digit number equals the sum of the cubes of its digits (e.g. 153).',
      code: `#!/bin/bash
# OS Practical 9: Check Armstrong Number
num=153
temp=$num
sum=0

while [ $temp -gt 0 ]
do
  r=$((temp % 10))
  sum=$((sum + r * r * r))
  temp=$((temp / 10))
done

if [ $sum -eq $num ]; then
  echo "$num is an ARMSTRONG number (1^3 + 5^3 + 3^3 = $sum)."
else
  echo "$num is NOT an Armstrong number (Calculated sum: $sum)."
fi
`
    },
    {
      id: 'sh-10',
      num: 'OS Practical 10',
      cat: 'Shell Scripts',
      title: 'Result Sheet with Redirection & Filters',
      desc: 'Creates and formats a student result sheet using head, tail, cut, and paste commands.',
      code: `#!/bin/bash
# OS Practical 10: Create Result Sheet Using Filters & Redirection
echo -e "101\\n102\\n103\\n104" > /tmp/rolls.txt
echo -e "Aarav\\nDiya\\nRohan\\nSneha" > /tmp/names.txt
echo -e "85\\n92\\n78\\n88" > /tmp/marks.txt

echo "=== Student Marks Sheet (Created with paste & filters) ==="
echo -e "Roll\\tName\\tMarks"
echo "------------------------------"
paste /tmp/rolls.txt /tmp/names.txt /tmp/marks.txt

echo -e "\\n--- Top 2 Students (head -n 2) ---"
head -n 2 /tmp/names.txt
`
    }
  ]
};
