// Pre-seeded academic datasets for ThinkCode Lab Python Data Science & ML Practicals
// Stored locally in source so they work 100% offline with zero network requests.

export const SAMPLE_DATASETS = Object.freeze({
  'students.csv': `roll_no,name,gender,marks_python,marks_dbms,attendance,grade
101,Aarav Sharma,Male,85,78,92,A
102,Priya Patel,Female,92,88,96,A+
103,Rohan Verma,Male,67,72,81,B
104,Sneha Kulkarni,Female,74,69,85,B+
105,Aditya Joshi,Male,89,91,94,A+
106,Ananya Mehta,Female,58,62,75,C
107,Kunal Patil,Male,95,94,98,A+
108,Divya Nair,Female,81,85,89,A
109,Sameer Khan,Male,63,59,72,C
110,Pooja Desai,Female,88,84,91,A`,

  'iris.csv': `sepal_length,sepal_width,petal_length,petal_width,species
5.1,3.5,1.4,0.2,setosa
4.9,3.0,1.4,0.2,setosa
4.7,3.2,1.3,0.2,setosa
4.6,3.1,1.5,0.2,setosa
5.0,3.6,1.4,0.2,setosa
7.0,3.2,4.7,1.4,versicolor
6.4,3.2,4.5,1.5,versicolor
6.9,3.1,4.9,1.5,versicolor
5.5,2.3,4.0,1.3,versicolor
6.5,2.8,4.6,1.5,versicolor
6.3,3.3,6.0,2.5,virginica
5.8,2.7,5.1,1.9,virginica
7.1,3.0,5.9,2.1,virginica
6.3,2.9,5.6,1.8,virginica
6.5,3.0,5.8,2.2,virginica`,

  'sales.csv': `date,region,product,units_sold,unit_price,revenue
2026-01-15,North,Laptop,12,55000,660000
2026-01-18,West,Mouse,45,650,29250
2026-01-22,South,Keyboard,30,1200,36000
2026-01-25,East,Monitor,18,12500,225000
2026-02-05,North,Mouse,60,650,39000
2026-02-12,West,Laptop,15,55000,825000
2026-02-18,South,Monitor,22,12500,275000
2026-02-25,East,Keyboard,35,1200,42000
2026-03-04,North,Monitor,25,12500,312500
2026-03-10,West,Keyboard,50,1200,60000
2026-03-18,South,Laptop,20,55000,1100000
2026-03-24,East,Mouse,70,650,45500`
});

export function getSampleDataset(name) {
  return SAMPLE_DATASETS[name] || null;
}

export function listSampleDatasets() {
  return Object.keys(SAMPLE_DATASETS).map(name => {
    const content = SAMPLE_DATASETS[name];
    const lines = content.trim().split('\n');
    const rowCount = Math.max(0, lines.length - 1);
    const headers = (lines[0] || '').split(',').map(s => s.trim());
    return {
      name,
      rowCount,
      headers,
      sizeBytes: new TextEncoder().encode(content).length
    };
  });
}
