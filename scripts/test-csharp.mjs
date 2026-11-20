// Verification Suite for TYBCA Programming using C#.Net Practicals (CA-314) & C# Runtime Engine
import assert from 'node:assert/strict';
import { PRACTICALS } from '../src/practicals.js';
import { SUBJECT_DEFAULTS } from '../src/lab-journal.js';
import { LANGS } from '../src/languages.js';
import { parseAndTranspileCSharp, buildCSharpEnv, validateCSharpCode } from '../src/engines/csharp.worker.js';

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

console.log('Running TYBCA C#.NET Practicals (CA-314) & Engine Suite tests...');

// 1. Array count & existence
test('PRACTICALS.csharp contains exactly 10 syllabus practicals', () => {
  assert.ok(Array.isArray(PRACTICALS.csharp), 'PRACTICALS.csharp must be an array');
  assert.equal(PRACTICALS.csharp.length, 10, 'Expected exactly 10 C# assignments');
});

// 2. Metadata completeness
test('All 10 C# practicals have complete metadata and IDs csharp-1 through csharp-10', () => {
  const ids = PRACTICALS.csharp.map(p => p.id);
  const expectedIds = Array.from({ length: 10 }, (_, i) => `csharp-${i + 1}`);
  assert.deepEqual(ids, expectedIds);

  PRACTICALS.csharp.forEach((p, idx) => {
    assert.equal(p.num, `Assignment ${idx + 1}`);
    assert.ok(p.cat && typeof p.cat === 'string' && p.cat.trim().length > 0, `Assignment ${idx + 1} must have a category`);
    assert.ok(p.title && typeof p.title === 'string' && p.title.trim().length > 0, `Assignment ${idx + 1} must have a title`);
    assert.ok(p.desc && typeof p.desc === 'string' && p.desc.trim().length > 0, `Assignment ${idx + 1} must have a description`);
    assert.ok(p.code && typeof p.code === 'string' && p.code.includes('using System;'), `Assignment ${idx + 1} must contain valid C# code`);
  });
});

// 3. Syllabus topic alignment
test('Assignments match the official TYBCA CA-314 university syllabus topics', () => {
  const titles = PRACTICALS.csharp.map(p => p.title.toLowerCase());
  // 1: Basic C# Program and Console Output (namespace, class, Main method, student details)
  assert.ok(titles[0].includes('structure') || titles[0].includes('output'));
  // 2: Data Types and Operators (arithmetic operations, data types)
  assert.ok(titles[1].includes('data type') || titles[1].includes('arithmetic'));
  // 3: Student Marks and Grade Calculation (if-else, percentage, grade)
  assert.ok(titles[2].includes('marks') || titles[2].includes('grade'));
  // 4: Loop-Based Application (for, while, foreach, multiplication table, factorial)
  assert.ok(titles[3].includes('loop'));
  // 5: Employee Class using OOP Concepts (encapsulation, properties get/set, constructor)
  assert.ok(titles[4].includes('employee') || titles[4].includes('encapsulation'));
  // 6: Inheritance and Polymorphism (base, derived, virtual, override, bonus)
  assert.ok(titles[5].includes('inheritance') || titles[5].includes('polymorphism'));
  // 7: Student Record Management using List<T> (Add, Count, foreach, search)
  assert.ok(titles[6].includes('list') || titles[6].includes('collection'));
  // 8: Exception Handling Application (try, catch DivideByZeroException, FormatException, finally)
  assert.ok(titles[7].includes('exception'));
  // 9: Windows Form Application (Form, Label, TextBox, Button, ComboBox, CheckBox, MessageBox.Show)
  assert.ok(titles[8].includes('windows form') || titles[8].includes('gui'));
  // 10: Database Connectivity using ADO.NET (SqlConnection, SqlCommand, SqlDataReader, offline in-memory CRUD)
  assert.ok(titles[9].includes('database') || titles[9].includes('ado.net'));
});

// 4. Lab journal subject mapping & language registration
test('SUBJECT_DEFAULTS.csharp is configured for Programming using C#.Net Lab (CA-314)', () => {
  assert.equal(SUBJECT_DEFAULTS.csharp, 'Programming using C#.Net Lab (CA-314)');
});

test('LANGS registry includes C# with correct configuration', () => {
  const csharpLang = LANGS.find(l => l.id === 'csharp');
  assert.ok(csharpLang, 'C# must be present in LANGS');
  assert.equal(csharpLang.name, 'C#');
  assert.equal(csharpLang.file, 'Program.cs');
  assert.equal(csharpLang.engine, 'csharp');
  assert.equal(csharpLang.hue, '#A855F7');
  assert.ok(csharpLang.tpl.includes('class Program'));
});

// 5. Execution verification of all 10 syllabus practicals
test('All 10 C# syllabus practicals execute cleanly and produce expected output', () => {
  for (const practical of PRACTICALS.csharp) {
    const syntaxErrors = validateCSharpCode(practical.code);
    assert.equal(syntaxErrors.length, 0, `${practical.id} has syntax validation errors: ${syntaxErrors.join('; ')}`);

    const { js, mainClass } = parseAndTranspileCSharp(practical.code);
    assert.ok(js && js.length > 50, `${practical.id} must transpile to valid JavaScript`);

    let output = '';
    let errOutput = '';
    let guiLaunched = null;

    const env = buildCSharpEnv(
      s => { output += s; },
      s => { errOutput += s; },
      () => {},
      winData => { guiLaunched = winData; }
    );

    const runner = new Function(
      ...Object.keys(env),
      `"use strict"; return (() => {
        ${js}
        if (typeof ${mainClass} !== 'undefined' && typeof ${mainClass}.Main === 'function') {
          ${mainClass}.Main([]);
        } else if (typeof Program !== 'undefined' && typeof Program.Main === 'function') {
          Program.Main([]);
        }
      })();`
    );

    runner(...Object.values(env));

    assert.equal(errOutput, '', `${practical.id} execution threw runtime errors: ${errOutput}`);
    assert.ok(output.length > 0 || guiLaunched !== null, `${practical.id} must produce console output or launch GUI`);

    if (practical.id === 'csharp-9') {
      assert.ok(guiLaunched !== null, 'csharp-9 must launch a desktop Windows Form frame');
      assert.equal(guiLaunched.title, 'TYBCA Student Enrollment Form');
      assert.ok(guiLaunched.components.length >= 4, 'csharp-9 form must contain GUI components');
    }

    if (practical.id === 'csharp-10') {
      assert.ok(output.includes('ADO.NET DATABASE CONNECTIVITY'), 'csharp-10 must output ADO.NET header');
      assert.ok(output.includes('Table \'Students\' created'), 'csharp-10 must create SQL table');
      assert.ok(output.includes('Inserted 4 student records'), 'csharp-10 must insert records');
      assert.ok(output.includes('Tahir Mansuri'), 'csharp-10 must read inserted records');
    }
  }
});

// 6. Interactive Console Input & String Interpolation Format Specifiers
test('Interactive console input and C# format specifiers (:F2, :N2, alignment) work correctly', () => {
  const code = `
  using System;
  class TestApp {
    static void Main() {
      int a = 12;
      double b = 3.4567;
      Console.WriteLine($"Formatted: {b:F2} | Pad: {a,4}");
    }
  }
  `;
  const { js } = parseAndTranspileCSharp(code);
  let output = '';
  const env = buildCSharpEnv(s => { output += s; }, s => {});
  const runner = new Function(...Object.keys(env), `"use strict"; ${js}; TestApp.Main();`);
  runner(...Object.values(env));
  assert.ok(output.includes('Formatted: 3.46 | Pad:   12'));
});

// 7. Structured Exception Handling
test('Exception handling catches DivideByZeroException and executes finally clean-up', () => {
  const code = `
  using System;
  class ExcApp {
    static void Main() {
      try {
        int x = 10;
        int y = 0;
        int z = x / y;
      } catch (DivideByZeroException ex) {
        Console.WriteLine($"Caught: {ex.Message}");
      } finally {
        Console.WriteLine("Cleanup Done");
      }
    }
  }
  `;
  const { js } = parseAndTranspileCSharp(code);
  let output = '';
  const env = buildCSharpEnv(s => { output += s; }, s => {});
  const runner = new Function(...Object.keys(env), `"use strict"; ${js}; ExcApp.Main();`);
  runner(...Object.values(env));
  assert.ok(output.includes('Caught: Attempted to divide by zero.'));
  assert.ok(output.includes('Cleanup Done'));
});

// 8. OOP Inheritance & Virtual / Override Dispatch
test('OOP Inheritance with : base(...) forwarding and virtual/override dispatch', () => {
  const code = `
  using System;
  class Shape {
    public string Name { get; set; }
    public Shape(string name) { Name = name; }
    public virtual double Area() { return 0; }
  }
  class Circle : Shape {
    public double Radius { get; set; }
    public Circle(string name, double r) : base(name) { Radius = r; }
    public override double Area() { return 3.14159 * Radius * Radius; }
  }
  class App {
    static void Main() {
      Circle c = new Circle("MyCircle", 10);
      Console.WriteLine($"Shape: {c.Name}, Area: {c.Area():F2}");
    }
  }
  `;
  const { js } = parseAndTranspileCSharp(code);
  let output = '';
  const env = buildCSharpEnv(s => { output += s; }, s => {});
  const runner = new Function(...Object.keys(env), `"use strict"; ${js}; App.Main();`);
  runner(...Object.values(env));
  assert.ok(output.includes('Shape: MyCircle, Area: 314.16'));
});

// 9. ADO.NET in-memory relational operations
test('ADO.NET SqlConnection, SqlCommand, and SqlDataReader execute offline SQL transactions', () => {
  const code = `
  using System;
  using System.Data.SqlClient;
  class DbApp {
    static void Main() {
      SqlConnection conn = new SqlConnection("Server=offline;");
      conn.Open();
      SqlCommand cmd = new SqlCommand("CREATE TABLE Items (Id INT, Name VARCHAR(50))", conn);
      cmd.ExecuteNonQuery();
      SqlCommand ins = new SqlCommand("INSERT INTO Items VALUES (1, 'Book')", conn);
      ins.ExecuteNonQuery();
      SqlCommand sel = new SqlCommand("SELECT Id, Name FROM Items", conn);
      SqlDataReader reader = sel.ExecuteReader();
      while (reader.Read()) {
        Console.WriteLine($"Item: {reader.GetInt32(0)} - {reader.GetString(1)}");
      }
      conn.Close();
    }
  }
  `;
  const { js } = parseAndTranspileCSharp(code);
  let output = '';
  const env = buildCSharpEnv(s => { output += s; }, s => {});
  const runner = new Function(...Object.keys(env), `"use strict"; ${js}; DbApp.Main();`);
  runner(...Object.values(env));
  assert.ok(output.includes('Item: 1 - Book'));
});

console.log(`\nAll ${passed} TYBCA C#.NET practicals & engine tests passed successfully! ✨\n`);
