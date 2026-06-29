import fs from 'fs';

function extractManifest() {
    const text = fs.readFileSync('tmp_pdf_text.txt', 'utf8');
    const lines = text.split('\n');
    
    let currentSection = null;
    let requirements = [];
    let reqIndex = 1;
    
    // We are looking for: 11.1 - 11.10, 12.1 - 12.10, 19, 20, 21, 22, 23
    const sectionRegex = /^(11\.(?:[1-9]|10)|12\.(?:[1-9]|10)|19|20|21|22|23)(\.\d+)?(?!\.\d)(?:\s+.*)?$/;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (line.length === 0) continue;
        
        // Skip page headers, TOC, etc
        if (line.match(/^Page \d+/)) continue;
        
        let match = line.match(sectionRegex);
        if (match && !line.includes("—")) {
            // New section
            const secId = match[1] + (match[2] || '');
            currentSection = { id: secId, title: line };
            reqIndex = 1;
            continue;
        }

        if (currentSection) {
            // Stop processing if we hit something clearly outside scope
            if (line.startsWith("13.") || line.startsWith("24.") || line.startsWith("Part")) {
                currentSection = null;
                continue;
            }

            // Skip lines that are just single characters or clear noise
            if (line.length < 5 && !line.match(/^[a-zA-Z]/)) continue;

            let statements = [];
            
            if (line.startsWith("•") || line.startsWith("-")) {
                statements.push(line.replace(/^[•-]\s*/, '').trim());
            } else if (line.match(/^\d+\.\s/)) {
                statements.push(line.replace(/^\d+\.\s*/, '').trim());
            } else {
                const sentenceRegex = /.*?(?:[.!?](?=\s+[A-Z]|$)|\n|$)/g;
                let sents = line.match(sentenceRegex);
                if (sents) {
                    for (let s of sents) {
                        let cln = s.trim();
                        if (cln.length > 0) statements.push(cln);
                    }
                } else {
                    statements.push(line);
                }
            }

            for (let stmt of statements) {
                if (stmt.length > 5 && !stmt.startsWith("--- Page")) {
                    requirements.push({
                        id: `${currentSection.id}.${reqIndex++}`,
                        section: currentSection.id,
                        sectionTitle: currentSection.title,
                        text: stmt
                    });
                }
            }
        }
    }

    fs.writeFileSync('requirement_manifest.json', JSON.stringify(requirements, null, 2));
    console.log(`Extracted ${requirements.length} requirements.`);
}

extractManifest();
