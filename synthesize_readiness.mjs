import fs from 'fs';

const lines = fs.readFileSync('readiness_report.md', 'utf8').split('\n');
const actionable = [];

const excludePhrases = [
  "this section", "the purpose", "the blueprint", "it describes", "step 1", "step 2", "step 3", "step 4",
  "phase 2", "phase 3", "phase 4", "phase 5", "future", "optimization", "enhancement", "long-term", "introduction"
];

for (const line of lines) {
  if (!line.startsWith('| 1')) continue;
  
  const parts = line.split('|').map(s => s.trim());
  if (parts.length < 4) continue;
  
  const id = parts[1];
  const text = parts[2];
  const status = parts[3];
  
  const lowerText = text.toLowerCase();
  
  // Exclude short lines (fluff)
  if (text.split(' ').length <= 2) continue;
  
  // Exclude descriptive phrases
  let skip = false;
  for (const phrase of excludePhrases) {
    if (lowerText.includes(phrase)) {
      skip = true;
      break;
    }
  }
  if (skip) continue;
  
  // Check for actionable keywords
  const actionWords = ["must", "shall", "displays", "generates", "calculates", "extracts", "identifies", "dashboard", "report", "api", "export", "download", "send", "save", "button", "table", "chart", "view", "click", "upload", "validate", "compare", "detect"];
  let isActionable = false;
  for (const word of actionWords) {
    if (lowerText.includes(word)) {
      isActionable = true;
      break;
    }
  }
  
  if (isActionable) {
    actionable.push({ id, text, status });
  }
}

// Further deduplicate and group logically
let output = `# Blueprint V4 Readiness Report (Final)\n\n`;
output += `This report lists the remaining **mandatory, actionable work** required before beginning Blueprint V4. Enhancements, future ideas, and non-actionable documentation statements have been filtered out.\n\n`;

output += `| Requirement ID | Mandatory Remaining Feature / Work Item | Current Status |\n`;
output += `|----------------|-----------------------------------------|----------------|\n`;

for (const req of actionable) {
  output += `| ${req.id} | ${req.text} | ${req.status} |\n`;
}

fs.writeFileSync('Blueprint_V4_Readiness_Report_Final.md', output);
console.log('Filtered report generated with ' + actionable.length + ' items.');
