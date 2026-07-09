import fs from 'fs';

const inputContent = fs.readFileSync('AuditIQ_Master_Bible_Requirements_Traceability_Audit.md', 'utf8');
const reqBlocks = inputContent.split('---').slice(1);

const missingRequirements = [];

for (const block of reqBlocks) {
  const idMatch = block.match(/\*\*Requirement ([\d\.]+)\*\*/);
  if (!idMatch) continue;
  const id = idMatch[1];
  
  const textMatch = block.match(/\*\*Requirement [\d\.]+\*\*\n\n([\s\S]*?)\n\n\*\*Status:\*\*/);
  const text = textMatch ? textMatch[1].replace(/\n/g, ' ').trim() : '';

  const traceMatch = block.match(/\*\*Traceability Chain:\*\*\n(.*)/);
  let trace = traceMatch ? traceMatch[1] : '';

  const getEvidence = (label) => {
    const regex = new RegExp(`${label} \\((.*?)\\)`);
    const match = trace.match(regex);
    return match ? match[1] : '❌';
  };
  
  const statusMatch = block.match(/\*\*Status:\*\*\n\n(.*?)\n/);
  let rawStatus = statusMatch ? statusMatch[1].trim() : '';
  
  // We only care about mandatory work (FAIL or PARTIAL) from Blueprints 1, 2, 3
  const major = id.split('.')[0];
  if (['11', '12', '13'].includes(major) && (rawStatus === 'FAIL' || rawStatus === 'PARTIAL')) {
    missingRequirements.push({ id, text, status: rawStatus });
  }
}

let output = `# Blueprint V4 Readiness Report\n\n`;
output += `This report lists the remaining mandatory work required before beginning Blueprint V4, based on the traceability audit of Blueprints V1, V2, and V3.\n\n`;
output += `## Mandatory Remaining Work\n\n`;

if (missingRequirements.length === 0) {
  output += `✅ All mandatory requirements from Blueprints V1-V3 have been implemented. AuditIQ is ready for Blueprint V4.\n`;
} else {
  output += `| Requirement ID | Requirement Details | Current Status |\n`;
  output += `|----------------|---------------------|----------------|\n`;
  for (const req of missingRequirements) {
    const statusLabel = req.status === 'PARTIAL' ? '🟨 Partially Complete' : '❌ Not Started';
    output += `| ${req.id} | ${req.text} | ${statusLabel} |\n`;
  }
}

fs.writeFileSync('readiness_report.md', output);
console.log('Readiness report generated at readiness_report.md');
