npx tsx validation/tests/calibration_test.ts
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npx tsx validation/tests/vendor_intelligence.test.ts
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npx tsx validation/tests/department_intelligence.test.ts
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npx tsx validation/tests/organization_intelligence.test.ts
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npx tsx validation/tests/executive_intelligence.test.ts
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npx tsc --noEmit
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npx tsx validation/tests/validate_predictive_engine.ts
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npx tsx validation/tests/framework_hardening.test.ts
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
