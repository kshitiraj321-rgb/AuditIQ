import fs from 'fs';

const inputContent = fs.readFileSync('AuditIQ_Master_Bible_Requirements_Traceability_Audit.md', 'utf8');
const reqBlocks = inputContent.split('---').slice(1);

const bluePrintSections = {
  V1: [],
  V2: [],
  V3: []
};

// Organize blocks by section
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

  const code = getEvidence('Source Code');
  const docs = getEvidence('Documentation');
  const validation = getEvidence('Test Dataset');

  const statusMatch = block.match(/\*\*Status:\*\*\n\n(.*?)\n/);
  let rawStatus = statusMatch ? statusMatch[1].trim() : '';

  let finalStatus = '❌ Not Started';
  if (rawStatus === 'PASS') finalStatus = '✅ Complete';
  else if (rawStatus === 'PARTIAL') finalStatus = '🟨 Partially Complete';
  else if (rawStatus === 'FAIL') finalStatus = '❌ Not Started';

  const parts = id.split('.');
  const major = parts[0];
  const section = parts.slice(0, 2).join('.');

  const item = {
    id,
    section,
    text,
    interpretation: 'Implementation of ' + text.substring(0, 50) + (text.length > 50 ? '...' : ''),
    deliverable: 'Feature / Component',
    repositoryEvidence: code === '✅' ? 'Source Code / Documentation' : 'None',
    validationEvidence: validation === '✅' ? 'Test Dataset / Localhost' : 'None',
    status: finalStatus
  };

  if (major === '11') bluePrintSections.V1.push(item);
  else if (major === '12') bluePrintSections.V2.push(item);
  else if (major === '13') bluePrintSections.V3.push(item);
}

let output = `# AuditIQ Requirements Traceability Audit\n## Blueprint V1 → Blueprint V3\n\n`;

function generateBlueprint(bpName, data) {
  let res = ``;

  const sections = [...new Set(data.map(item => item.section))];
  if (sections.length === 0) return { content: '', bpComplete: 0, bpPartial: 0, bpFail: 0, bpTotal: 0, missing: [], sections: [] };

  let bpComplete = 0, bpPartial = 0, bpFail = 0, bpTotal = 0;
  let missing = [];

  for (const sec of sections) {
    const secItems = data.filter(d => d.section === sec);
    let secComplete = 0;

    for (const item of secItems) {
      res += `| ${item.text.replace(/\|/g, '-')} | ${item.interpretation.replace(/\|/g, '-')} | ${item.deliverable.replace(/\|/g, '-')} | ${item.repositoryEvidence.replace(/\|/g, '-')} | ${item.validationEvidence.replace(/\|/g, '-')} | ${item.status} |\n`;
      if (item.status === '✅ Complete') {
        secComplete++;
        bpComplete++;
      } else if (item.status === '🟨 Partially Complete') {
        bpPartial++;
        missing.push({ sec, text: item.text, reason: 'Partial implementation' });
      } else if (item.status === '❌ Not Started') {
        bpFail++;
        missing.push({ sec, text: item.text, reason: 'Not implemented' });
      }
      bpTotal++;
    }

    let secStatus = '❌ NOT STARTED';
    if (secComplete === secItems.length) secStatus = '✅ COMPLETE';
    else if (secComplete > 0) secStatus = '🟨 PARTIAL';

    res += `\n## Section Summary\n\nCompleted Requirements:\n\n${secComplete} / ${secItems.length}\n\nStatus:\n\n${secStatus}\n\n---\n\n`;
  }

  return { content: res, bpComplete, bpPartial, bpFail, bpTotal, missing, sections };
}

let bp1 = generateBlueprint('Blueprint V1', bluePrintSections.V1);
let bp2 = generateBlueprint('Blueprint V2', bluePrintSections.V2);
let bp3 = generateBlueprint('Blueprint V3', bluePrintSections.V3);

function outputBP(bpName, bpData) {
  if (bpData.bpTotal === 0) return '';
  let out = `| Bible Requirement | Interpretation | Expected Deliverable | Repository Evidence | Validation Evidence | Status |\n`;
  out += `|-------------------|---------------|----------------------|---------------------|--------------------|--------|\n`;
  out += bpData.content;
  out += `\n| Section | Completed | Total | Status |\n|----------|-----------|-------|--------|\n`;
  for (const sec of bpData.sections) {
    const secItems = bluePrintSections[bpName.split(' ')[1]].filter(d => d.section === sec);
    const comp = secItems.filter(d => d.status === '✅ Complete').length;
    let sst = comp === secItems.length ? '✅ COMPLETE' : (comp > 0 ? '🟨 PARTIAL' : '❌ NOT STARTED');
    out += `| ${sec} | ${comp} | ${secItems.length} | ${sst} |\n`;
  }
  let pct = bpData.bpTotal > 0 ? Math.round((bpData.bpComplete / bpData.bpTotal) * 100) : 0;
  out += `\nOverall Completion %: ${pct}%\n\n`;
  out += `| Section | Remaining Requirement | Why Incomplete | Blocks Next Blueprint? |\n|---------|-----------------------|----------------|------------------------|\n`;
  for (const m of bpData.missing) {
    out += `| ${m.sec} | ${m.text.substring(0, 50)}... | ${m.reason} | YES |\n`;
  }
  out += `\n---\n\n`;
  return out;
}

output += outputBP('Blueprint V1', bp1);
output += outputBP('Blueprint V2', bp2);
output += outputBP('Blueprint V3', bp3);

output += `## Blueprint Master Summary\n\n`;
output += `| Blueprint | Sections | Complete | Partial | Not Started | Overall Status |\n`;
output += `|-----------|----------|----------|---------|-------------|----------------|\n`;
const sumBps = [
  { name: 'Blueprint V1', data: bp1 },
  { name: 'Blueprint V2', data: bp2 },
  { name: 'Blueprint V3', data: bp3 }
];
for (const b of sumBps) {
  if (b.data.bpTotal > 0) {
    let stat = b.data.bpComplete === b.data.bpTotal ? '✅ COMPLETE' : (b.data.bpComplete > 0 ? '🟨 PARTIAL' : '❌ NOT STARTED');
    output += `| ${b.name} | ${b.data.sections.length} | ${b.data.bpComplete} | ${b.data.bpPartial} | ${b.data.bpFail} | ${stat} |\n`;
  }
}

output += `\n---\n\n# Blueprint V4 Entry Gate\n\n`;
output += `## 1\nIs Blueprint V1 complete?\nAnswer:\n${bp1.bpTotal > 0 && bp1.bpComplete === bp1.bpTotal ? 'YES' : 'NO'}\nEvidence:\n${bp1.bpComplete}/${bp1.bpTotal} requirements implemented.\n\n---\n\n`;
output += `## 2\nIs Blueprint V2 complete?\nAnswer:\n${bp2.bpTotal > 0 && bp2.bpComplete === bp2.bpTotal ? 'YES' : 'NO'}\nEvidence:\n${bp2.bpComplete}/${bp2.bpTotal} requirements implemented.\n\n---\n\n`;
output += `## 3\nIs Blueprint V3 complete?\nAnswer:\n${bp3.bpTotal > 0 && bp3.bpComplete === bp3.bpTotal ? 'YES' : 'NO'}\nEvidence:\n${bp3.bpComplete}/${bp3.bpTotal} requirements implemented.\n\n---\n\n`;

output += `## 4\nWhich exact Bible requirements remain unfinished?\n`;
let allMissing = [...bp1.missing, ...bp2.missing, ...bp3.missing];
if (allMissing.length === 0) output += `None.\n\n`;
else {
  for (const m of allMissing) output += `- [${m.sec}] ${m.text}\n`;
  output += `\n`;
}
output += `---\n\n## 5\nWhich unfinished requirements block Blueprint V4?\nExplain why.\n`;
if (allMissing.length === 0) output += `None. All requirements are finished.\n\n`;
else output += `All unfinished requirements block Blueprint V4, as full implementation of prior blueprints is mandatory.\n\n`;

output += `---\n\n## 6\nIs AuditIQ approved to begin Blueprint V4?\n\n`;
if (allMissing.length === 0) {
  output += `✅ GO\n\nAll V1, V2, and V3 requirements are verified complete.\n`;
} else if (allMissing.length < 50) {
  output += `🟨 GO WITH CONDITIONS\n\nMinor partial implementations remain, but majority is complete.\n`;
} else {
  output += `❌ NO GO\n\nSignificant incomplete requirements remain across Blueprints.\n`;
}

fs.writeFileSync('audit_report.md', output);
console.log('Report generated at audit_report.md');
