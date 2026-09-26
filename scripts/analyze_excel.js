const XLSX = require('xlsx');

try {
  const workbook = XLSX.readFile('Madni_Education_StudentData_Dummy.xlsx');
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  console.log('Headers:', JSON.stringify(jsonData[0]));
  console.log('Sample Data:', JSON.stringify(jsonData[1]));
} catch (err) {
  console.error('Error reading Excel:', err.message);
}
