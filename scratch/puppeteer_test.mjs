import puppeteer from 'puppeteer';
import path from 'path';

const TEST_CASES = [
  {
    name: "Quantity Mismatch",
    files: [
      "test-data/04_quantity_mismatch_po.pdf",
      "test-data/05_quantity_mismatch_grn.pdf",
      "test-data/06_quantity_mismatch_inv.pdf",
    ]
  },
  {
    name: "Price Variance",
    files: [
      "test-data/07_price_variance_po.pdf",
      "test-data/08_price_variance_grn.pdf",
      "test-data/09_price_variance_inv.pdf",
    ]
  },
  {
    name: "Missing Invoice",
    files: [
      "test-data/07_price_variance_po.pdf",
      "test-data/08_price_variance_grn.pdf"
    ]
  },
  {
    name: "Missing GRN",
    files: [
      "test-data/10_missing_grn_po.pdf",
      "test-data/11_missing_grn_inv.pdf",
    ]
  },
  {
    name: "Duplicate Invoice",
    files: [
      "test-data/12_duplicate_invoice_po.pdf",
      "test-data/13_duplicate_invoice_grn.pdf",
      "test-data/14_duplicate_invoice_inv.pdf",
    ]
  }
];

async function run() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  const results = [];

  for (const tc of TEST_CASES) {
    console.log(`Testing scenario: ${tc.name}`);
    await page.goto('http://localhost:3000/upload');
    await page.evaluate(() => window.sessionStorage.clear());

    // Set localStorage for Duplicate Invoice scenario
    if (tc.name === 'Duplicate Invoice') {
      await page.evaluate(() => {
        localStorage.setItem("auditiq_audited_invoices", JSON.stringify([
          { vendorName: "Summit Logistics & Warehousing Pvt. Ltd.", invoiceNumber: "INV-NS-2026-0005" }
        ]));
      });
    } else {
      await page.evaluate(() => {
        localStorage.removeItem("auditiq_audited_invoices");
      });
    }

    // Make file input visible and upload
    const fileInput = await page.$('input[type="file"]');
    
    // Convert to absolute paths
    const absolutePaths = tc.files.map(f => path.resolve(process.cwd(), f));
    await fileInput.uploadFile(...absolutePaths);

    // Wait for the selects to appear and auto-assign
    await page.waitForSelector('select', { timeout: 5000 }).catch(() => {});
    
    // Explicitly set the selects
    await page.evaluate((scenarioName) => {
      const selects = Array.from(document.querySelectorAll('select'));
      const getOptionValue = (select, keyword) => {
        const option = Array.from(select.options).find(opt => opt.text.includes(keyword));
        return option ? option.value : "";
      };

      const setReactValue = (select, value) => {
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, "value").set;
        nativeSetter.call(select, value);
        select.dispatchEvent(new Event('change', { bubbles: true }));
      };

      if (selects[0]) {
        setReactValue(selects[0], getOptionValue(selects[0], '_po.pdf'));
      }
      if (selects[1]) {
        if (scenarioName !== 'Missing GRN') {
          setReactValue(selects[1], getOptionValue(selects[1], '_grn.pdf'));
        } else {
          setReactValue(selects[1], "");
        }
      }
      if (selects[2]) {
        if (scenarioName !== 'Missing Invoice') {
          setReactValue(selects[2], getOptionValue(selects[2], '_inv.pdf'));
        } else {
          setReactValue(selects[2], "");
        }
      }
    }, tc.name);

    
    // Wait for AI analysis (the button says "Analyzing..." then navigates)
    await new Promise(r => setTimeout(r, 500)); // Give react state a tiny bit to settle
    const analyzeBtn = await page.$('button[type="button"]');
    // Check if it's disabled
    const disabled = await page.evaluate(el => el.disabled, analyzeBtn);
    if (disabled) {
       console.log("BUTTON DISABLED FOR " + tc.name);
       const html = await page.evaluate(() => document.querySelector('.space-y-4').innerHTML);
       console.log(html);
    }
    
    await page.click('button[type="button"]');
    
    try {
      await page.waitForNavigation({ timeout: 60000 });
      console.log(`Navigated to results for ${tc.name}`);
      
      // Extract data from the results page using window.sessionStorage
      const analysisJson = await page.evaluate(() => window.sessionStorage.getItem('auditIQAnalysis'));
      if (analysisJson) {
        const analysis = JSON.parse(analysisJson);
        results.push({
          scenario: tc.name,
          files: analysis.files,
          exceptions: analysis.exceptions.map(e => e.type),
          exposure: analysis.financialExposure.totalExposure,
          riskScore: analysis.risk.score,
          prioritizedQueue: analysis.prioritizedQueue?.map(p => ({
            type: p.exception.type,
            score: p.finalPriorityScore
          })) || [],
          extractedInvoice: analysis.extractedData?.vendorInvoice
        });
      } else {
        console.error(`No sessionStorage found for ${tc.name}`);
      }
    } catch (e) {
      console.error(`Failed to navigate or analyze ${tc.name}:`, e.message);
    }
  }

  await browser.close();
  
  console.log("FINAL REPORT:");
  console.log(JSON.stringify(results, null, 2));
}

run().catch(console.error);
