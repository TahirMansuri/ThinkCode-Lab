// University Syllabus Practicals & Code Examples Library
// Curated for FYBCA & SYBCA Computer Science / BCA Syllabus Courses:
// - Python (CA-214 / CA-212)
// - C++ (CA-113 & CA-123)
// - Linux Operating System Shell (CA-123)
// - Web Design-I HTML (CA-115)
// - Web Design-II JavaScript (CA-125)
// - DBMS Oracle SQL (CA-223)
// - C Programming

export const PRACTICALS = {
  // ========================================================
  // PYTHON PRACTICALS (CA-214: Python Programming Lab)
  // ========================================================
  python: [
    {
      id: 'py-1',
      num: 'Assignment 1',
      cat: 'Basics & Operators',
      title: 'Arithmetic Operators & User Input',
      desc: 'Demonstrates standard data types, input(), print(), and arithmetic operators in Python.',
      code: `# Practical 1: Basic Input/Output and Arithmetic Operators
print("=== Arithmetic Operations in Python ===")
num1 = float(input("Enter first number: "))
num2 = float(input("Enter second number: "))

print(f"Addition ({num1} + {num2})       = {num1 + num2}")
print(f"Subtraction ({num1} - {num2})    = {num1 - num2}")
print(f"Multiplication ({num1} * {num2}) = {num1 * num2}")

if num2 != 0:
    print(f"Division ({num1} / {num2})       = {num1 / num2}")
    print(f"Floor Division ({num1} // {num2}) = {num1 // num2}")
    print(f"Modulus ({num1} % {num2})        = {num1 % num2}")
else:
    print("Division, Floor Div & Modulo: Cannot divide by zero!")

print(f"Exponent ({num1} ** {num2})     = {num1 ** num2}")
`
    },
    {
      id: 'py-2',
      num: 'Assignment 2',
      cat: 'Flow Control',
      title: 'Conditional Statements (if-elif-else)',
      desc: 'Demonstrates flow control by finding the largest of three numbers and student grade classification.',
      code: `# Practical 2: Conditional Statements (if, elif, else)
print("=== Student Grade Calculator ===")
marks = float(input("Enter student marks (0 to 100): "))

if marks < 0 or marks > 100:
    print("Invalid marks entered!")
elif marks >= 90:
    grade = "A+ (Outstanding)"
elif marks >= 75:
    grade = "A (Distinction)"
elif marks >= 60:
    grade = "B (First Class)"
elif marks >= 50:
    grade = "C (Second Class)"
elif marks >= 40:
    grade = "D (Pass Class)"
else:
    grade = "F (Fail)"

print(f"Marks: {marks} | Result Grade: {grade}")
`
    },
    {
      id: 'py-3',
      num: 'Assignment 3',
      cat: 'Loops & Math',
      title: 'Prime Numbers in Given Range',
      desc: 'Prints all prime numbers within a specified range using nested loops and break statement.',
      code: `# Practical 3: Prime Numbers in a Range
start = int(input("Enter lower range: "))
end = int(input("Enter upper range: "))

print(f"Prime numbers between {start} and {end} are:")
count = 0
for num in range(start, end + 1):
    if num > 1:
        is_prime = True
        for i in range(2, int(num ** 0.5) + 1):
            if num % i == 0:
                is_prime = False
                break
        if is_prime:
            print(num, end="  ")
            count += 1

print(f"\\nTotal prime numbers found: {count}")
`
    },
    {
      id: 'py-4',
      num: 'Assignment 4',
      cat: 'Loops & Math',
      title: 'Fibonacci Series',
      desc: 'Generates n terms of the Fibonacci sequence using while loop and multiple variable assignment.',
      code: `# Practical 4: Fibonacci Series in Python
n = int(input("Enter number of terms for Fibonacci series: "))

if n <= 0:
    print("Please enter a positive integer.")
elif n == 1:
    print("Fibonacci sequence: 0")
else:
    a, b = 0, 1
    count = 0
    print("Fibonacci sequence:")
    while count < n:
        print(a, end="  ")
        nth = a + b
        a = b
        b = nth
        count += 1
    print()
`
    },
    {
      id: 'py-5',
      num: 'Assignment 5',
      cat: 'Strings',
      title: 'String Slicing & Built-in Methods',
      desc: 'Demonstrates string indexing, slicing, and built-in methods (lower, upper, find, replace, count).',
      code: `# Practical 5: String Operations and Built-in Methods
text = "Python Programming in BCA Computer Science"

print("Original String    :", text)
print("Length of String   :", len(text))
print("First 6 characters :", text[:6])
print("Characters (7 to 18):", text[7:18])
print("Reverse of String  :", text[::-1])

print("\\n--- Built-in String Methods ---")
print("Uppercase          :", text.upper())
print("Lowercase          :", text.lower())
print("Count of 'o'       :", text.count('o'))
print("Index of 'BCA'     :", text.find('BCA'))
print("Replace 'BCA'->'FY':", text.replace("BCA", "FYBCA"))
print("Split into Words   :", text.split())
`
    },
    {
      id: 'py-6',
      num: 'Assignment 6',
      cat: 'Functions',
      title: 'Functions, Default Arguments & Scope',
      desc: 'Demonstrates function definitions (def), default arguments, returning values, and recursion.',
      code: `# Practical 6: Python Functions and Recursion
def calc_power(base, exp=2):
    """Calculates power with default exponent = 2."""
    return base ** exp

def factorial(n):
    """Recursive function to calculate factorial."""
    if n <= 1:
        return 1
    return n * factorial(n - 1)

print("calc_power(5)       =", calc_power(5))       # 5^2
print("calc_power(5, 3)    =", calc_power(5, 3))    # 5^3

num = 5
print(f"Factorial of {num}  =", factorial(num))

# Lambda (Anonymous) function demo
square = lambda x: x * x
print("Lambda square(7)   =", square(7))
`
    },
    {
      id: 'py-7',
      num: 'Assignment 7',
      cat: 'Data Structures',
      title: 'Python Lists Operations',
      desc: 'Creating, indexing, slicing, appending, inserting, sorting, and popping elements in a List.',
      code: `# Practical 7: Working with Lists in Python
fruits = ["Apple", "Banana", "Cherry", "Date"]
print("Initial list :", fruits)

# Adding elements
fruits.append("Elderberry")
fruits.insert(1, "Blueberry")
print("After adding :", fruits)

# Slicing and indexing
print("First item   :", fruits[0])
print("Last item    :", fruits[-1])
print("Middle slice :", fruits[2:4])

# Modifying and deleting
fruits.remove("Date")
popped_item = fruits.pop()
print(f"Popped item  : {popped_item}")
print("After removal:", fruits)

# Sorting
fruits.sort()
print("Sorted list  :", fruits)
`
    },
    {
      id: 'py-8',
      num: 'Assignment 8',
      cat: 'Data Structures',
      title: 'Python Dictionaries (Key-Value Pairs)',
      desc: 'Demonstrates creating, accessing, updating, deleting, and traversing dictionaries with keys() and values().',
      code: `# Practical 8: Dictionary Operations in Python
student = {
    "roll_no": 101,
    "name": "Aarav Sharma",
    "course": "BCA",
    "semester": 3,
    "marks": 87.5
}

print("=== Student Record ===")
for key, val in student.items():
    print(f"{key.capitalize():10} : {val}")

# Adding new key-value pair and updating
student["grade"] = "A"
student["marks"] = 91.0
print("\\nUpdated Marks:", student["marks"])

# Keys and Values
print("Dictionary Keys  :", list(student.keys()))
print("Dictionary Values:", list(student.values()))
`
    },
    {
      id: 'py-9',
      num: 'Assignment 9',
      cat: 'Data Structures',
      title: 'Python Tuples Operations',
      desc: 'Creating tuples, accessing elements, checking membership, concatenation, and tuple immutability.',
      code: `# Practical 9: Working with Tuples
tup = (10, 20, 30, 40, 20, 50, 20)

print("Tuple elements     :", tup)
print("Length of Tuple    :", len(tup))
print("Element at index 2 :", tup[2])
print("Count of 20        :", tup.count(20))
print("First index of 50  :", tup.index(50))

# Membership testing
print("Is 30 in tuple?    :", 30 in tup)
print("Is 99 in tuple?    :", 99 in tup)

# Tuple concatenation
tup2 = ("Red", "Green", "Blue")
combined = tup + tup2
print("Combined Tuple     :", combined)
`
    },
    {
      id: 'py-10',
      num: 'Assignment 10',
      cat: 'OOP Concepts',
      title: 'Classes, Objects & __init__ Constructor',
      desc: 'Defines a Student class with constructor, instance attributes, and member methods.',
      code: `# Practical 10: Classes and Objects in Python
class Student:
    # Class attribute
    college_name = "BCA Institute of Technology"

    def __init__(self, roll_no, name, marks):
        # Instance attributes
        self.roll_no = roll_no
        self.name = name
        self.marks = marks

    def display(self):
        print(f"Roll No : {self.roll_no}")
        print(f"Name    : {self.name}")
        print(f"Marks   : {self.marks}")
        print(f"College : {self.college_name}")
        print("-------------------------")

# Creating objects
s1 = Student(101, "Rohan Verma", 85.5)
s2 = Student(102, "Sneha Patil", 92.0)

print("=== Student Details ===")
s1.display()
s2.display()
`
    },
    {
      id: 'py-11',
      num: 'Assignment 11',
      cat: 'OOP Concepts',
      title: 'Inheritance & Method Overriding',
      desc: 'Demonstrates single inheritance, super() call, and method overriding in Python.',
      code: `# Practical 11: Inheritance and Method Overriding
class Person:
    def __init__(self, name, age):
        self.name = name
        self.age = age

    def show_info(self):
        print(f"Name: {self.name}, Age: {self.age}")

class Employee(Person):
    def __init__(self, name, age, emp_id, salary):
        super().__init__(name, age)
        self.emp_id = emp_id
        self.salary = salary

    # Method Overriding
    def show_info(self):
        super().show_info()
        print(f"Emp ID: {self.emp_id}, Salary: \${self.salary:,.2f}")

print("=== Employee Record (Inheritance Demo) ===")
emp = Employee("Pooja Desai", 24, "EMP-204", 45000)
emp.show_info()
`
    }
  ],

  // ========================================================
  // C++ PRACTICALS (CA-113 & CA-123)
  // ========================================================
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
        sum += temp % 10;
        temp /= 10;
    }
    cout << "\\nSum of digits of " << n << " (while loop): " << sum << endl;

    int counter = 1;
    cout << "\\nCounting 1 to 5 (do-while loop): ";
    do {
        cout << counter << " ";
        counter++;
    } while (counter <= 5);
    cout << endl;

    return 0;
}
`
    },
    {
      id: 'cpp-4',
      num: 'Assignment 4',
      cat: 'Loops & Math',
      title: 'Check Prime Number',
      desc: 'Determines whether a given positive integer is prime or composite.',
      code: `// Practical 4: Check Prime Number
#include <iostream>
using namespace std;

int main() {
    int n;
    bool isPrime = true;

    cout << "Enter a positive integer: ";
    cin >> n;

    if (n <= 1) {
        isPrime = false;
    } else {
        for (int i = 2; i * i <= n; ++i) {
            if (n % i == 0) {
                isPrime = false;
                break;
            }
        }
    }

    if (isPrime)
        cout << n << " is a PRIME number." << endl;
    else
        cout << n << " is NOT a prime number." << endl;

    return 0;
}
`
    },
    {
      id: 'cpp-5',
      num: 'Assignment 5',
      cat: 'Loops & Math',
      title: 'Factorial of a Number',
      desc: 'Calculates the factorial of a non-negative integer using iterative loop.',
      code: `// Practical 5: Factorial of a Number
#include <iostream>
using namespace std;

int main() {
    int n;
    long long fact = 1;

    cout << "Enter a positive number: ";
    cin >> n;

    if (n < 0) {
        cout << "Factorial is not defined for negative numbers." << endl;
    } else {
        for (int i = 1; i <= n; i++) {
            fact *= i;
        }
        cout << "Factorial of " << n << " (" << n << "!) = " << fact << endl;
    }

    return 0;
}
`
    },
    {
      id: 'cpp-6',
      num: 'Assignment 6',
      cat: 'Loops & Math',
      title: 'Fibonacci Series',
      desc: 'Prints n terms of the Fibonacci sequence using loop.',
      code: `// Practical 6: Fibonacci Series
#include <iostream>
using namespace std;

int main() {
    int n, t1 = 0, t2 = 1, nextTerm = 0;

    cout << "Enter the number of terms: ";
    cin >> n;

    cout << "Fibonacci Series: ";
    for (int i = 1; i <= n; ++i) {
        if (i == 1) {
            cout << t1 << " ";
            continue;
        }
        if (i == 2) {
            cout << t2 << " ";
            continue;
        }
        nextTerm = t1 + t2;
        t1 = t2;
        t2 = nextTerm;
        cout << nextTerm << " ";
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
      title: 'Arrays (1D & 2D Matrix)',
      desc: 'Finds min, max, sum in 1D array and performs 2D matrix display and diagonal sum.',
      code: `// Practical 7: Arrays (1D Array & 2D Matrix)
#include <iostream>
using namespace std;

int main() {
    int arr[5] = {23, 45, 12, 89, 34};
    int sum = 0, maxVal = arr[0], minVal = arr[0];

    for (int i = 0; i < 5; i++) {
        sum += arr[i];
        if (arr[i] > maxVal) maxVal = arr[i];
        if (arr[i] < minVal) minVal = arr[i];
    }

    cout << "=== 1D Array Analysis ===" << endl;
    cout << "Elements: 23, 45, 12, 89, 34" << endl;
    cout << "Sum     : " << sum << endl;
    cout << "Maximum : " << maxVal << endl;
    cout << "Minimum : " << minVal << endl;

    cout << "\\n=== 2D Matrix (2x2) ===" << endl;
    int mat[2][2] = {{1, 2}, {3, 4}};
    for (int r = 0; r < 2; r++) {
        for (int c = 0; c < 2; c++) {
            cout << mat[r][c] << "\\t";
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
      title: 'Functions: Call by Value, Reference & Recursion',
      desc: 'Demonstrates parameter passing mechanisms and recursive factorial function.',
      code: `// Practical 8: Functions (Call by Value, Reference, Recursion)
#include <iostream>
using namespace std;

void swapValue(int a, int b) {
    int t = a; a = b; b = t;
}

void swapReference(int &a, int &b) {
    int t = a; a = b; b = t;
}

int recursiveFactorial(int n) {
    if (n <= 1) return 1;
    return n * recursiveFactorial(n - 1);
}

int main() {
    int x = 10, y = 20;
    cout << "Original: x=" << x << ", y=" << y << endl;

    swapValue(x, y);
    cout << "After swapValue: x=" << x << ", y=" << y << " (Unchanged)" << endl;

    swapReference(x, y);
    cout << "After swapReference: x=" << x << ", y=" << y << " (Swapped!)" << endl;

    cout << "\\nRecursive Factorial of 5: " << recursiveFactorial(5) << endl;
    return 0;
}
`
    },
    {
      id: 'cpp-9',
      num: 'Assignment 9',
      cat: 'Strings',
      title: 'C++ Strings & String Functions',
      desc: 'Demonstrates C++ string operations: length, concatenation, comparison, and substring search.',
      code: `// Practical 9: C++ Strings & Functions
#include <iostream>
#include <string>
using namespace std;

int main() {
    string str1 = "Think";
    string str2 = "Code";

    // Concatenation
    string full = str1 + str2;
    cout << "Concatenated string: " << full << endl;
    cout << "Length of string: " << full.length() << endl;

    // Substring
    cout << "Substring (first 5 chars): " << full.substr(0, 5) << endl;

    // Comparison
    if (str1 == str2) {
        cout << "Strings are equal." << endl;
    } else {
        cout << "Strings are not equal." << endl;
    }

    // Append
    full.append(" Lab");
    cout << "After append: " << full << endl;

    return 0;
}
`
    },
    {
      id: 'cpp-10',
      num: 'Assignment 10',
      cat: 'Structures',
      title: 'Structures & Unions',
      desc: 'Demonstrates structure declaration, member access, memory usage, and union comparison.',
      code: `// Practical 10: Structures and Unions in C++
#include <iostream>
#include <cstring>
using namespace std;

struct Student {
    int rollNo;
    char name[30];
    float marks;
};

union DataHolder {
    int intVal;
    float floatVal;
    char charVal;
};

int main() {
    Student s1;
    s1.rollNo = 101;
    strcpy(s1.name, "Rahul Gupta");
    s1.marks = 88.5;

    cout << "=== Student Structure Record ===" << endl;
    cout << "Roll No: " << s1.rollNo << endl;
    cout << "Name   : " << s1.name << endl;
    cout << "Marks  : " << s1.marks << endl;
    cout << "Size of Structure: " << sizeof(s1) << " bytes" << endl;

    cout << "\\n=== Union Demo ===" << endl;
    DataHolder dh;
    dh.intVal = 65;
    cout << "As Integer: " << dh.intVal << endl;
    cout << "As Char   : " << dh.charVal << " (Shared memory!)" << endl;
    cout << "Size of Union: " << sizeof(dh) << " bytes" << endl;

    return 0;
}
`
    },
    {
      id: 'cpp-11',
      num: 'Logical Experiment',
      cat: 'OOP & Classes',
      title: 'Annual Exam Results (Student Class)',
      desc: 'Calculates total marks, percentage, and assigns grades for students using OOP class & methods.',
      code: `// Logical Experiment 11: Annual Examination Results
#include <iostream>
using namespace std;

class StudentResult {
private:
    int rollNo;
    char name[30];
    int sub1, sub2, sub3;
    float total, percentage;

public:
    void setData(int r, const char* n, int s1, int s2, int s3) {
        rollNo = r;
        int i = 0;
        while (n[i] != '\\0' && i < 29) { name[i] = n[i]; i++; }
        name[i] = '\\0';
        sub1 = s1; sub2 = s2; sub3 = s3;
        calculate();
    }

    void calculate() {
        total = sub1 + sub2 + sub3;
        percentage = (total / 300.0f) * 100.0f;
    }

    void display() {
        cout << rollNo << "\\t" << name << "\\t" 
             << total << "/300\\t" << percentage << "%\\t";
        if (percentage >= 70) cout << "Distinction";
        else if (percentage >= 60) cout << "First Class";
        else if (percentage >= 50) cout << "Second Class";
        else if (percentage >= 40) cout << "Pass";
        else cout << "Fail";
        cout << endl;
    }
};

int main() {
    StudentResult s1, s2;
    s1.setData(101, "Amit Kumar", 78, 85, 90);
    s2.setData(102, "Pooja Sharma", 65, 58, 70);

    cout << "Roll\\tName\\t\\tTotal\\tPercent\\tGrade" << endl;
    cout << "--------------------------------------------------------" << endl;
    s1.display();
    s2.display();
    return 0;
}
`
    },
    {
      id: 'cpp-12',
      num: 'Logical Experiment',
      cat: 'Pointers',
      title: 'Pointers & Dynamic Memory Management',
      desc: 'Demonstrates pointer variables, address operator, dereferencing, and pointer arithmetic.',
      code: `// Logical Experiment 12: Pointers & Pointer Operations
#include <iostream>
using namespace std;

int main() {
    int var = 25;
    int *ptr = &var;

    cout << "Value of var           : " << var << endl;
    cout << "Address of var (&var)  : " << &var << endl;
    cout << "Pointer value (ptr)    : " << ptr << endl;
    cout << "Value via pointer (*ptr): " << *ptr << endl;

    *ptr = 50; // Modify value through pointer
    cout << "New value of var       : " << var << endl;

    int arr[3] = {10, 20, 30};
    int *arrPtr = arr;
    cout << "\\n--- Pointer Arithmetic on Array ---" << endl;
    for (int i = 0; i < 3; i++) {
        cout << "*(arrPtr + " << i << ") = " << *(arrPtr + i) << endl;
    }

    return 0;
}
`
    }
  ],

  // ========================================================
  // LINUX SHELL PRACTICALS (CA-123: Linux Operating System)
  // ========================================================
  shell: [
    {
      id: 'sh-1',
      num: 'OS Practical 1',
      cat: 'Basic Commands',
      title: 'Working with Directory Commands',
      desc: 'Demonstrates pwd, ls, mkdir, cd, and rmdir commands for file system exploration.',
      code: `#!/bin/bash
# OS Practical 1: Working with Directory Commands
echo "=== 1. Current Working Directory (pwd) ==="
pwd

echo -e "\\n=== 2. Create Directory and Subdirectories (mkdir) ==="
mkdir -p demo_lab/fybca demo_lab/sybca
ls -la demo_lab

echo -e "\\n=== 3. Listing Directory Contents (ls) ==="
ls -l

echo -e "\\n=== 4. Removing a Directory (rmdir) ==="
rmdir demo_lab/sybca
ls demo_lab
`
    },
    {
      id: 'sh-2',
      num: 'OS Practical 2',
      cat: 'File Management',
      title: 'File Creation, Copy, Move & Count',
      desc: 'Demonstrates touch, cat, cp, mv, and wc commands on text files.',
      code: `#!/bin/bash
# OS Practical 2: File Creation and Manipulation
echo "Creating sample file with cat..."
cat << 'EOF' > student_notes.txt
Computer Science Lab
Linux Operating System
Course Code: CA-123
Shell Scripting Practicals
EOF

echo -e "\\n=== File Contents ==="
cat student_notes.txt

echo -e "\\n=== Word, Line and Character Count (wc) ==="
wc student_notes.txt

echo -e "\\n=== Copy File (cp) ==="
cp student_notes.txt backup_notes.txt
ls -l *_notes.txt

echo -e "\\n=== Move / Rename File (mv) ==="
mv backup_notes.txt archive.txt
ls -l archive.txt
`
    },
    {
      id: 'sh-3',
      num: 'OS Practical 3',
      cat: 'File Permissions',
      title: 'File Permissions with chmod',
      desc: 'Displays file permissions and changes read, write, execute rights using chmod.',
      code: `#!/bin/bash
# OS Practical 3: File Permissions using chmod
touch script_test.sh
echo 'echo "Hello from script"' > script_test.sh

echo "Initial permissions:"
ls -l script_test.sh

echo -e "\\nGranting Execute Permission (chmod +x)..."
chmod +x script_test.sh
ls -l script_test.sh

echo -e "\\nSetting Numeric Permissions (chmod 755)..."
chmod 755 script_test.sh
ls -l script_test.sh
`
    },
    {
      id: 'sh-4',
      num: 'OS Practical 4',
      cat: 'Shell Scripts',
      title: 'Greatest of Three Numbers',
      desc: 'Shell script using nested if-else to find the greatest among three integers.',
      code: `#!/bin/bash
# OS Practical 4: Greatest of Three Numbers
a=45
b=78
c=32

echo "Given numbers: a=$a, b=$b, c=$c"

if [ $a -ge $b ] && [ $a -ge $c ]; then
  echo "Greatest number is: $a"
elif [ $b -ge $a ] && [ $b -ge $c ]; then
  echo "Greatest number is: $b"
else
  echo "Greatest number is: $c"
fi
`
    },
    {
      id: 'sh-5',
      num: 'OS Practical 5',
      cat: 'Shell Scripts',
      title: 'Factorial of a Number',
      desc: 'Computes factorial of a number using while loop in shell script.',
      code: `#!/bin/bash
# OS Practical 5: Factorial of a Number
num=5
fact=1
temp=$num

while [ $temp -gt 1 ]
do
  fact=$((fact * temp))
  temp=$((temp - 1))
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
  ],

  // ========================================================
  // WEB DESIGN-I HTML PRACTICALS (CA-115)
  // ========================================================
  web: [
    {
      id: 'html-1',
      num: 'Assignment 1',
      cat: 'Basic Tags',
      title: 'Basic HTML Structure & Headings',
      desc: 'Demonstrates standard HTML document skeleton with doctype, head, body, and heading tags h1 to h6.',
      code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Practical 1: HTML Headings</title>
  <style>
    body { font-family: sans-serif; padding: 20px; line-height: 1.6; }
    h1 { color: #0284c7; }
  </style>
</head>
<body>
  <h1>Heading 1 - Main Title (BCA Web Design)</h1>
  <h2>Heading 2 - Section Title</h2>
  <h3>Heading 3 - Sub Section Title</h3>
  <h4>Heading 4 - Minor Heading</h4>
  <h5>Heading 5 - Sub Minor Heading</h5>
  <h6>Heading 6 - Smallest Heading</h6>
  <hr>
  <p>HTML documents consist of a head containing metadata and a body containing visible content.</p>
</body>
</html>
`
    },
    {
      id: 'html-2',
      num: 'Assignment 2',
      cat: 'Text Formatting',
      title: 'Text Formatting Tags',
      desc: 'Demonstrates bold, italic, underline, strike, sub, sup, mark, and small tags.',
      code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Practical 2: Text Formatting</title>
  <style>
    body { font-family: sans-serif; padding: 20px; }
    .box { background: #f8fafc; border: 1px solid #cbd5e1; padding: 15px; border-radius: 8px; }
  </style>
</head>
<body>
  <h2>Text Formatting Demonstration</h2>
  <div class="box">
    <p><b>Bold text</b> using &lt;b&gt; tag</p>
    <p><i>Italic text</i> using &lt;i&gt; tag</p>
    <p><u>Underlined text</u> using &lt;u&gt; tag</p>
    <p><mark>Highlighted / Marked text</mark> using &lt;mark&gt; tag</p>
    <p><del>Strikethrough / Deleted text</del> using &lt;del&gt; tag</p>
    <p>Chemical Formula for Water: H<sub>2</sub>O (Subscript)</p>
    <p>Mathematical Equation: (a + b)<sup>2</sup> = a<sup>2</sup> + 2ab + b<sup>2</sup> (Superscript)</p>
    <p><small>Small fine-print text</small> using &lt;small&gt; tag</p>
  </div>
</body>
</html>
`
    },
    {
      id: 'html-3',
      num: 'Assignment 3',
      cat: 'Media',
      title: 'Working with Images',
      desc: 'Demonstrates embedding images with src, alt, width, height, and border styling.',
      code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Practical 3: HTML Images</title>
  <style>
    body { font-family: sans-serif; padding: 20px; text-align: center; }
    .img-card { display: inline-block; padding: 15px; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    img { border-radius: 8px; max-width: 100%; height: auto; }
  </style>
</head>
<body>
  <h2>Displaying Images in HTML</h2>
  <div class="img-card">
    <img src="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500" alt="Coding Laptop" width="400" height="250">
    <p><b>Caption:</b> Modern Web Development with HTML5</p>
  </div>
</body>
</html>
`
    },
    {
      id: 'html-4',
      num: 'Assignment 4',
      cat: 'Animations',
      title: 'Marquee / Scrolling Text',
      desc: 'Demonstrates marquee tag with direction, behavior, and scrollamount attributes.',
      code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Practical 4: Marquee Demo</title>
  <style>
    body { font-family: sans-serif; padding: 20px; }
    .news-ticker { background: #0284c7; color: white; padding: 10px; font-weight: bold; border-radius: 6px; }
  </style>
</head>
<body>
  <h2>Scrolling Text Demonstration</h2>
  <div class="news-ticker">
    <marquee behavior="scroll" direction="left" scrollamount="6">
      📢 BCA Semester Examination Schedule has been announced! Download hall tickets from university portal.
    </marquee>
  </div>
  <br>
  <marquee behavior="alternate" direction="right" scrollamount="4" style="background: #f1f5f9; padding: 8px; border: 1px solid #cbd5e1;">
    ↔️ Bouncing Announcement Banner (Alternate Behavior)
  </marquee>
</body>
</html>
`
    },
    {
      id: 'html-5',
      num: 'Assignment 5',
      cat: 'Lists',
      title: 'Ordered, Unordered & Definition Lists',
      desc: 'Demonstrates ordered lists (ol), unordered lists (ul), nested lists, and definition lists (dl).',
      code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Practical 5: HTML Lists</title>
  <style>
    body { font-family: sans-serif; padding: 20px; }
    .col { float: left; width: 45%; margin-right: 5%; }
  </style>
</head>
<body>
  <h2>HTML Lists Demonstration</h2>
  <div class="col">
    <h3>Ordered List (Semester Subjects)</h3>
    <ol type="1">
      <li>C++ Programming</li>
      <li>Data Structures</li>
      <li>Database Management Systems</li>
      <li>Web Design-I</li>
    </ol>

    <h3>Unordered List (Web Technologies)</h3>
    <ul type="square">
      <li>HTML5</li>
      <li>CSS3</li>
      <li>JavaScript</li>
    </ul>
  </div>

  <div class="col">
    <h3>Definition List (Web Terms)</h3>
    <dl>
      <dt><b>HTML</b></dt>
      <dd>HyperText Markup Language used for structuring web pages.</dd>
      <dt><b>CSS</b></dt>
      <dd>Cascading Style Sheets used for styling document layout.</dd>
      <dt><b>URL</b></dt>
      <dd>Uniform Resource Locator indicating address of a web resource.</dd>
    </dl>
  </div>
</body>
</html>
`
    },
    {
      id: 'html-6',
      num: 'Assignment 6',
      cat: 'Links',
      title: 'Hyperlinks & Bookmark Anchors',
      desc: 'Demonstrates external links with target="_blank", internal bookmarks, and email mailto links.',
      code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Practical 6: Hyperlinks</title>
  <style>
    body { font-family: sans-serif; padding: 20px; }
    a { color: #0284c7; text-decoration: none; font-weight: bold; }
    a:hover { text-decoration: underline; }
    .section { height: 250px; padding: 20px; margin-top: 20px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <h2>Hyperlinks & Navigation</h2>
  <p>Jump to: <a href="#syllabus">Syllabus Section</a> | <a href="#contact">Contact Section</a></p>
  <p>External link: <a href="https://developer.mozilla.org" target="_blank">MDN Web Docs ↗</a></p>

  <div id="syllabus" class="section">
    <h3>📚 Syllabus Section</h3>
    <p>BCA Web Design-I covers HTML fundamentals, text formatting, forms, and tables.</p>
    <a href="#">Back to top ↑</a>
  </div>

  <div id="contact" class="section">
    <h3>✉️ Contact Section</h3>
    <p>Email: <a href="mailto:support@thinkcode.lab">support@thinkcode.lab</a></p>
    <a href="#">Back to top ↑</a>
  </div>
</body>
</html>
`
    },
    {
      id: 'html-7',
      num: 'Assignment 7',
      cat: 'Tables',
      title: 'College Timetable using HTML Table',
      desc: 'Creates a well-structured college timetable using table, tr, th, td, colspan, and rowspan.',
      code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Practical 7: College Timetable</title>
  <style>
    body { font-family: sans-serif; padding: 20px; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: center; }
    th { background: #0284c7; color: white; }
    .break { background: #fef08a; font-weight: bold; }
    .lab { background: #e0f2fe; }
  </style>
</head>
<body>
  <h2>FYBCA Semester-I Weekly Timetable</h2>
  <table>
    <tr>
      <th>Day / Time</th>
      <th>09:00 - 10:00</th>
      <th>10:00 - 11:00</th>
      <th>11:00 - 11:30</th>
      <th>11:30 - 01:30</th>
    </tr>
    <tr>
      <th>Monday</th>
      <td>C++ Theory</td>
      <td>Web Design-I</td>
      <td rowspan="5" class="break">R<br>E<br>C<br>E<br>S<br>S</td>
      <td class="lab">C++ Lab (Batch A)</td>
    </tr>
    <tr>
      <th>Tuesday</th>
      <td>DBMS</td>
      <td>Mathematics</td>
      <td class="lab">HTML Lab (Batch B)</td>
    </tr>
    <tr>
      <th>Wednesday</th>
      <td>Web Design-I</td>
      <td>C++ Theory</td>
      <td class="lab">DBMS Lab (Batch A)</td>
    </tr>
    <tr>
      <th>Thursday</th>
      <td>Mathematics</td>
      <td>Environmental Sci</td>
      <td class="lab">C++ Lab (Batch B)</td>
    </tr>
    <tr>
      <th>Friday</th>
      <td>DBMS</td>
      <td>C++ Theory</td>
      <td class="lab">Project Guidance</td>
    </tr>
  </table>
</body>
</html>
`
    },
    {
      id: 'html-8',
      num: 'Assignment 8',
      cat: 'Media',
      title: 'HTML Multimedia (Audio & Video)',
      desc: 'Demonstrates embedding audio and video players with controls, autoplay, and loop attributes.',
      code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Practical 8: Multimedia</title>
  <style>
    body { font-family: sans-serif; padding: 20px; }
    .media-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 20px; }
  </style>
</head>
<body>
  <h2>HTML5 Audio & Video Players</h2>

  <div class="media-card">
    <h3>🎵 Audio Player</h3>
    <audio controls>
      <source src="https://www.w3schools.com/html/horse.mp3" type="audio/mpeg">
      Your browser does not support the audio element.
    </audio>
  </div>

  <div class="media-card">
    <h3>🎬 Video Player</h3>
    <video width="480" height="270" controls poster="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500">
      <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4">
      Your browser does not support the video element.
    </video>
  </div>
</body>
</html>
`
    },
    {
      id: 'html-9',
      num: 'Assignment 9',
      cat: 'Forms',
      title: 'College Student Admission Form',
      desc: 'Creates a complete HTML form with text, email, number, radio, checkbox, select dropdown, and submit buttons.',
      code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Practical 9: Student Admission Form</title>
  <style>
    body { font-family: sans-serif; padding: 20px; background: #f1f5f9; }
    .form-container { max-width: 500px; margin: 0 auto; background: white; padding: 25px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .form-group { margin-bottom: 15px; }
    label { display: block; font-weight: bold; margin-bottom: 5px; }
    input[type=text], input[type=email], select, textarea { width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px; box-sizing: border-box; }
    .btn { background: #0284c7; color: white; padding: 10px 18px; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; }
  </style>
</head>
<body>
  <div class="form-container">
    <h2 style="text-align: center; color: #0284c7;">College Admission Form</h2>
    <form action="#" method="POST" onsubmit="event.preventDefault(); alert('Admission Form Submitted Successfully!');">
      <div class="form-group">
        <label for="name">Full Name:</label>
        <input type="text" id="name" placeholder="Enter full name" required>
      </div>

      <div class="form-group">
        <label for="email">Email Address:</label>
        <input type="email" id="email" placeholder="example@email.com" required>
      </div>

      <div class="form-group">
        <label>Gender:</label>
        <input type="radio" id="male" name="gender" value="Male" checked> <label for="male" style="display:inline;">Male</label>
        <input type="radio" id="female" name="gender" value="Female"> <label for="female" style="display:inline;">Female</label>
      </div>

      <div class="form-group">
        <label for="course">Select Course:</label>
        <select id="course">
          <option value="BCA">Bachelor of Computer Applications (BCA)</option>
          <option value="BSc-CS">B.Sc. Computer Science</option>
          <option value="BSc-IT">B.Sc. Information Technology</option>
        </select>
      </div>

      <div class="form-group">
        <label>Languages Known:</label>
        <input type="checkbox" id="lang1" value="English"> English
        <input type="checkbox" id="lang2" value="Hindi"> Hindi
        <input type="checkbox" id="lang3" value="Regional"> Gujarati / Marathi
      </div>

      <div class="form-group">
        <label for="address">Permanent Address:</label>
        <textarea id="address" rows="3" placeholder="Enter complete address"></textarea>
      </div>

      <button type="submit" class="btn">Submit Application</button>
      <button type="reset" class="btn" style="background:#64748b;">Reset</button>
    </form>
  </div>
</body>
</html>
`
    },
    {
      id: 'html-10',
      num: 'Assignment 10',
      cat: 'CSS & Styling',
      title: 'Styling HTML with CSS',
      desc: 'Demonstrates inline, internal CSS, color palettes, border radius, and flexbox layout.',
      code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Practical 10: CSS Styling</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 25px; background: #e2e8f0; }
    .card-container { display: flex; gap: 20px; justify-content: center; }
    .card { background: white; padding: 20px; border-radius: 12px; width: 220px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); text-align: center; border-top: 5px solid #0284c7; }
    .badge { display: inline-block; padding: 4px 10px; font-size: 12px; font-weight: bold; border-radius: 20px; background: #e0f2fe; color: #0369a1; }
  </style>
</head>
<body>
  <h2 style="text-align: center;">CSS Card Showcase</h2>
  <div class="card-container">
    <div class="card">
      <span class="badge">FYBCA</span>
      <h3>Semester 1</h3>
      <p>C++ & Web Design fundamentals.</p>
    </div>
    <div class="card" style="border-top-color: #10b981;">
      <span class="badge" style="background: #d1fae5; color: #047857;">SYBCA</span>
      <h3>Semester 3</h3>
      <p>Python Programming & DBMS Oracle SQL.</p>
    </div>
    <div class="card" style="border-top-color: #f59e0b;">
      <span class="badge" style="background: #fef3c7; color: #b45309;">TYBCA</span>
      <h3>Semester 5</h3>
      <p>Full-stack Web Dev & Cloud Computing.</p>
    </div>
  </div>
</body>
</html>
`
    }
  ],

  // ========================================================
  // WEB DESIGN-II JAVASCRIPT PRACTICALS (CA-125)
  // ========================================================
  js: [
    {
      id: 'js-1',
      num: 'Assignment 1',
      cat: 'Basics & Output',
      title: 'Embedding JavaScript & Output Methods',
      desc: 'Demonstrates console.log(), alert(), and document.write() output methods in JavaScript.',
      code: `// Practical 1: JavaScript Output Methods
console.log("=== JavaScript Output Methods ===");

let studentName = "Aarav Sharma";
let rollNo = 101;

console.log("Student Name:", studentName);
console.log("Roll Number :", rollNo);

// Arithmetic calculation in JS
let mark1 = 78, mark2 = 84, mark3 = 90;
let total = mark1 + mark2 + mark3;
let average = total / 3;

console.log("Marks Total  :", total);
console.log("Average Marks:", average.toFixed(2));
`
    },
    {
      id: 'js-2',
      num: 'Assignment 2',
      cat: 'Conditionals',
      title: 'Conditional Statements & Switch Case',
      desc: 'Checks odd/even, leap year, and evaluates day of week using switch-case in JavaScript.',
      code: `// Practical 2: Conditional Statements & Switch-Case
let num = 28;
if (num % 2 === 0) {
    console.log(num + " is an EVEN number.");
} else {
    console.log(num + " is an ODD number.");
}

// Day of week switch-case
let dayNumber = 3;
let dayName = "";

switch (dayNumber) {
    case 1: dayName = "Monday"; break;
    case 2: dayName = "Tuesday"; break;
    case 3: dayName = "Wednesday"; break;
    case 4: dayName = "Thursday"; break;
    case 5: dayName = "Friday"; break;
    case 6: dayName = "Saturday"; break;
    case 7: dayName = "Sunday"; break;
    default: dayName = "Invalid Day Number"; break;
}
console.log("Day " + dayNumber + " corresponds to: " + dayName);
`
    },
    {
      id: 'js-3',
      num: 'Assignment 3',
      cat: 'Loops',
      title: 'Looping Structures (for, while, do-while)',
      desc: 'Multiplication table with for loop, reverse of a number with while loop.',
      code: `// Practical 3: Looping Structures
let n = 7;
console.log("--- Multiplication Table of " + n + " ---");
for (let i = 1; i <= 10; i++) {
    console.log(n + " x " + i + " = " + (n * i));
}

// Reverse a number using while loop
let original = 12345;
let temp = original;
let rev = 0;

while (temp > 0) {
    let digit = temp % 10;
    rev = rev * 10 + digit;
    temp = Math.floor(temp / 10);
}
console.log("\\nOriginal Number:", original);
console.log("Reversed Number:", rev);
`
    },
    {
      id: 'js-4',
      num: 'Assignment 4',
      cat: 'Strings',
      title: 'String Object & String Methods',
      desc: 'Demonstrates length, toUpperCase, toLowerCase, indexOf, slice, replace, and split methods.',
      code: `// Practical 4: JavaScript String Methods
let str = "ThinkCode Lab Web Design";

console.log("Original String  :", str);
console.log("Length           :", str.length);
console.log("Uppercase        :", str.toUpperCase());
console.log("Lowercase        :", str.toLowerCase());
console.log("Index of 'Lab'   :", str.indexOf("Lab"));
console.log("Slice (0 to 9)   :", str.slice(0, 9));
console.log("Replace 'Web'->'JS':", str.replace("Web", "JavaScript"));
console.log("Split by Space   :", str.split(" "));
`
    },
    {
      id: 'js-5',
      num: 'Assignment 5',
      cat: 'Math & Date',
      title: 'Built-in Math & Date Objects',
      desc: 'Demonstrates Math functions (max, min, round, sqrt, random) and Date operations.',
      code: `// Practical 5: Math and Date Objects
console.log("=== Math Object Methods ===");
console.log("Math.PI         :", Math.PI);
console.log("Math.max(10,45) :", Math.max(10, 45, 23, 89));
console.log("Math.min(10,45) :", Math.min(10, 45, 23, 89));
console.log("Math.round(4.7) :", Math.round(4.7));
console.log("Math.sqrt(64)   :", Math.sqrt(64));
console.log("Random (1-100)  :", Math.floor(Math.random() * 100) + 1);

console.log("\\n=== Date Object Methods ===");
let now = new Date();
console.log("Full Date String:", now.toDateString());
console.log("Current Year    :", now.getFullYear());
console.log("Current Month   :", now.getMonth() + 1); // 0-indexed
console.log("Current Date    :", now.getDate());
`
    },
    {
      id: 'js-6',
      num: 'Assignment 6',
      cat: 'Functions',
      title: 'Functions & Arrow Functions',
      desc: 'Demonstrates function declarations, expressions, arrow functions, and default parameters.',
      code: `// Practical 6: JavaScript Functions
function calculateSimpleInterest(principal, rate, time = 1) {
    return (principal * rate * time) / 100;
}

// Arrow function syntax
const isPrime = (num) => {
    if (num <= 1) return false;
    for (let i = 2; i * i <= num; i++) {
        if (num % i === 0) return false;
    }
    return true;
};

let p = 10000, r = 7.5, t = 3;
let interest = calculateSimpleInterest(p, r, t);
console.log("Principal : " + p);
console.log("Rate      : " + r + "%");
console.log("Time      : " + t + " years");
console.log("Interest  : " + interest);
console.log("Total Amt : " + (p + interest));

console.log("\\nIs 29 Prime? :", isPrime(29));
console.log("Is 45 Prime? :", isPrime(45));
`
    },
    {
      id: 'js-7',
      num: 'Assignment 7',
      cat: 'Arrays',
      title: 'Array Methods (map, filter, reduce)',
      desc: 'Demonstrates modern array methods: push, pop, slice, map, filter, and reduce.',
      code: `// Practical 7: Array Methods in JavaScript
let scores = [45, 78, 92, 34, 60, 88, 55];
console.log("Initial Scores:", scores);

// Filter passing marks (>= 50)
let passed = scores.filter(s => s >= 50);
console.log("Passed Scores (>=50):", passed);

// Map: Add 5 grace marks
let curved = scores.map(s => s + 5);
console.log("Scores with Grace Marks (+5):", curved);

// Reduce: Total sum of scores
let totalScore = scores.reduce((acc, curr) => acc + curr, 0);
console.log("Total Sum of Scores:", totalScore);
console.log("Average Score:", (totalScore / scores.length).toFixed(2));
`
    }
  ],

  // ========================================================
  // DBMS ORACLE SQL PRACTICALS (CA-223)
  // ========================================================
  sql: [
    {
      id: 'sql-1',
      num: 'Assignment 1',
      cat: 'DDL & DML',
      title: 'CREATE TABLE & INSERT 10 Records',
      desc: 'Creates an EMPLOYEES table and inserts 10 sample records for DBMS practicals.',
      code: `-- Practical 1: CREATE TABLE and INSERT 10 Records
CREATE TABLE employees (
    emp_id INT PRIMARY KEY,
    emp_name VARCHAR(50) NOT NULL,
    designation VARCHAR(30),
    department VARCHAR(30),
    salary DECIMAL(10, 2),
    hire_date DATE
);

INSERT INTO employees VALUES (101, 'Amit Sharma', 'Manager', 'IT', 75000.00, '2020-01-15');
INSERT INTO employees VALUES (102, 'Priya Patel', 'Developer', 'IT', 52000.00, '2021-03-20');
INSERT INTO employees VALUES (103, 'Rohan Verma', 'Analyst', 'Finance', 48000.00, '2019-07-11');
INSERT INTO employees VALUES (104, 'Sneha Joshi', 'HR Executive', 'HR', 42000.00, '2022-02-01');
INSERT INTO employees VALUES (105, 'Vikas Singh', 'Developer', 'IT', 55000.00, '2021-08-16');
INSERT INTO employees VALUES (106, 'Ananya Sen', 'Accountant', 'Finance', 46000.00, '2020-11-25');
INSERT INTO employees VALUES (107, 'Rahul Nair', 'Tester', 'IT', 38000.00, '2023-01-10');
INSERT INTO employees VALUES (108, 'Neha Kulkarni', 'HR Manager', 'HR', 68000.00, '2018-05-19');
INSERT INTO employees VALUES (109, 'Karan Mehta', 'Analyst', 'Finance', 51000.00, '2022-09-05');
INSERT INTO employees VALUES (110, 'Pooja Reddy', 'Developer', 'IT', 53000.00, '2021-12-01');

SELECT * FROM employees;
`
    },
    {
      id: 'sql-2',
      num: 'Assignment 2',
      cat: 'DML Queries',
      title: 'UPDATE, DELETE and Basic SELECT',
      desc: 'Demonstrates updating salaries, deleting an employee, and querying remaining records.',
      code: `-- Practical 2: UPDATE, DELETE and SELECT Operations
-- 1. Give 10% salary hike to Developers in IT department
UPDATE employees
SET salary = salary * 1.10
WHERE designation = 'Developer' AND department = 'IT';

-- 2. Delete employee who resigned (Emp ID: 107)
DELETE FROM employees
WHERE emp_id = 107;

-- 3. Display updated employees list sorted by salary descending
SELECT emp_id, emp_name, designation, department, salary
FROM employees
ORDER BY salary DESC;
`
    },
    {
      id: 'sql-3',
      num: 'Assignment 3',
      cat: 'DDL Operations',
      title: 'ALTER TABLE Operations',
      desc: 'Demonstrates adding a new column, modifying datatypes, and renaming columns in SQL.',
      code: `-- Practical 3: ALTER TABLE Operations
-- 1. Add email column to employees table
ALTER TABLE employees ADD email VARCHAR(100);

-- 2. Populate email addresses for employees
UPDATE employees SET email = LOWER(REPLACE(emp_name, ' ', '.')) || '@thinkcode.org';

-- 3. Display table with new email column
SELECT emp_id, emp_name, department, email FROM employees;
`
    },
    {
      id: 'sql-4',
      num: 'Assignment 4',
      cat: 'Clauses & Filters',
      title: 'WHERE, LIKE, BETWEEN and IN Clauses',
      desc: 'Filtering records using relational operators, pattern matching (LIKE), and set membership.',
      code: `-- Practical 4: SQL Filtering with WHERE, BETWEEN, IN, LIKE
-- 1. Employees with salary between 45000 and 65000
SELECT emp_name, designation, salary 
FROM employees 
WHERE salary BETWEEN 45000 AND 65000;

-- 2. Employees working in either 'IT' or 'HR'
SELECT emp_name, department, designation 
FROM employees 
WHERE department IN ('IT', 'HR');

-- 3. Employees whose name starts with 'P'
SELECT emp_name, department, salary 
FROM employees 
WHERE emp_name LIKE 'P%';
`
    },
    {
      id: 'sql-5',
      num: 'Assignment 5',
      cat: 'Aggregate Functions',
      title: 'Aggregate Functions (SUM, AVG, MIN, MAX, COUNT)',
      desc: 'Computes overall and department-wise summary statistics on employee salaries.',
      code: `-- Practical 5: Aggregate Functions in SQL
SELECT 
    COUNT(*) AS total_employees,
    SUM(salary) AS total_payroll,
    AVG(salary) AS average_salary,
    MIN(salary) AS minimum_salary,
    MAX(salary) AS maximum_salary
FROM employees;
`
    },
    {
      id: 'sql-6',
      num: 'Assignment 6',
      cat: 'Grouping',
      title: 'GROUP BY and HAVING Clauses',
      desc: 'Groups employees by department and filters groups with employee count or salary thresholds.',
      code: `-- Practical 6: GROUP BY and HAVING Clauses
-- Department-wise summary: headcount and average salary
SELECT 
    department,
    COUNT(*) AS num_employees,
    AVG(salary) AS avg_salary,
    SUM(salary) AS total_expense
FROM employees
GROUP BY department
HAVING COUNT(*) >= 2
ORDER BY avg_salary DESC;
`
    },
    {
      id: 'sql-7',
      num: 'Assignment 7',
      cat: 'Joins',
      title: 'INNER JOIN and LEFT JOIN',
      desc: 'Demonstrates relational joins between EMPLOYEES and DEPARTMENTS tables.',
      code: `-- Practical 7: Relational JOINS in SQL
CREATE TABLE departments (
    dept_id INT PRIMARY KEY,
    dept_name VARCHAR(30),
    location VARCHAR(50)
);

INSERT INTO departments VALUES (1, 'IT', 'Tech Park, Floor 4');
INSERT INTO departments VALUES (2, 'Finance', 'Tower B, Floor 2');
INSERT INTO departments VALUES (3, 'HR', 'Admin Block, Floor 1');
INSERT INTO departments VALUES (4, 'Marketing', 'Tower A, Floor 3');

-- INNER JOIN between Employees and Departments
SELECT 
    e.emp_id, 
    e.emp_name, 
    e.designation, 
    d.dept_name, 
    d.location
FROM employees e
INNER JOIN departments d ON e.department = d.dept_name;
`
    },
    {
      id: 'sql-8',
      num: 'Assignment 8',
      cat: 'Subqueries',
      title: 'Nested Subqueries',
      desc: 'Finds employees earning above department average or matching company maximum salary.',
      code: `-- Practical 8: Subqueries / Nested Queries
-- 1. Find employees who earn more than the overall average salary
SELECT emp_name, department, salary
FROM employees
WHERE salary > (SELECT AVG(salary) FROM employees);

-- 2. Find employee with the highest salary
SELECT emp_name, designation, department, salary
FROM employees
WHERE salary = (SELECT MAX(salary) FROM employees);
`
    }
  ],

  // ========================================================
  // C PROGRAMMING PRACTICALS
  // ========================================================
  c: [
    {
      id: 'c-1',
      num: 'Assignment 1',
      cat: 'Basic & I/O',
      title: 'Hello World & Formatted I/O',
      desc: 'Demonstrates printf, scanf, format specifiers, and basic calculations in C.',
      code: `// Practical 1: Basic Input/Output in C
#include <stdio.h>

int main() {
    int a, b;
    printf("Enter two integers: ");
    scanf("%d %d", &a, &b);

    printf("Sum        = %d\\n", a + b);
    printf("Difference = %d\\n", a - b);
    printf("Product    = %d\\n", a * b);
    if (b != 0) {
        printf("Quotient   = %.2f\\n", (float)a / b);
        printf("Remainder  = %d\\n", a % b);
    } else {
        printf("Cannot divide by zero!\\n");
    }
    return 0;
}
`
    },
    {
      id: 'c-2',
      num: 'Assignment 2',
      cat: 'Control Statements',
      title: 'Check Even/Odd & Leap Year',
      desc: 'Uses if-else conditions to test even/odd and determine leap year.',
      code: `// Practical 2: If-Else & Leap Year Check
#include <stdio.h>

int main() {
    int year;
    printf("Enter a year: ");
    scanf("%d", &year);

    if ((year % 4 == 0 && year % 100 != 0) || (year % 400 == 0)) {
        printf("%d is a LEAP YEAR.\\n", year);
    } else {
        printf("%d is NOT a leap year.\\n", year);
    }
    return 0;
}
`
    },
    {
      id: 'c-3',
      num: 'Assignment 3',
      cat: 'Loops & Math',
      title: 'Factorial & Fibonacci in C',
      desc: 'Demonstrates for loop for factorial calculation and generating Fibonacci series.',
      code: `// Practical 3: Factorial and Fibonacci in C
#include <stdio.h>

int main() {
    int n, i;
    long long fact = 1;
    printf("Enter number for factorial: ");
    scanf("%d", &n);

    for (i = 1; i <= n; i++) {
        fact *= i;
    }
    printf("Factorial of %d = %lld\\n", n, fact);

    printf("\\nFibonacci series up to 8 terms: ");
    int t1 = 0, t2 = 1, next;
    for (i = 1; i <= 8; i++) {
        printf("%d ", t1);
        next = t1 + t2;
        t1 = t2;
        t2 = next;
    }
    printf("\\n");
    return 0;
}
`
    },
    {
      id: 'c-4',
      num: 'Assignment 4',
      cat: 'Arrays',
      title: '1D Array Min, Max & Average',
      desc: 'Reads n numbers into an array and finds the maximum, minimum, and average.',
      code: `// Practical 4: Array Operations in C
#include <stdio.h>

int main() {
    int arr[5] = {45, 12, 89, 32, 67};
    int i, sum = 0, max = arr[0], min = arr[0];

    for (i = 0; i < 5; i++) {
        sum += arr[i];
        if (arr[i] > max) max = arr[i];
        if (arr[i] < min) min = arr[i];
    }

    printf("Array Elements: 45, 12, 89, 32, 67\\n");
    printf("Maximum: %d\\n", max);
    printf("Minimum: %d\\n", min);
    printf("Sum    : %d\\n", sum);
    printf("Average: %.2f\\n", (float)sum / 5);
    return 0;
}
`
    }
  ]
};
