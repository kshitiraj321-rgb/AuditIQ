npx tsx validation/calibration_test.ts
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npx tsx validation/vendor_intelligence.test.ts
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npx tsx validation/department_intelligence.test.ts
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npx tsx validation/organization_intelligence.test.ts
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npx tsx validation/executive_intelligence.test.ts
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npx tsc --noEmit
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npx tsx validation/validate_predictive_engine.ts
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npx tsx validation/framework_hardening.test.ts
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
