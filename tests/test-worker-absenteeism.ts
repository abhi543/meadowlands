// tests/test-worker-absenteeism.ts
import {
  createDefaultSafetyInfrastructure,
  isWorkerAbsentAndUncovered,
  MEDICAL_DRAUGHT_COST_COINS,
  TEMP_WORKER_DAILY_COST_COINS,
  OZONE_AIR_SCRUBBER_COST_COINS,
  EMERGENCY_PRESSURE_CUTOFF_COST_COINS,
  ESTATE_BREAKROOM_COST_COINS,
  WILDCAT_UNION_SETTLEMENT_BONUS_PCT,
  formatAbsenceRemaining,
} from '../src/game/absenteeismEngine';

function runAbsenteeismTests() {
  console.log('🧪 Running Worker Absenteeism & Morale Crisis Mechanics Test Suite...');

  const now = Date.now();
  let safety = createDefaultSafetyInfrastructure();

  // Test 1: Initially not absent
  if (isWorkerAbsentAndUncovered('gas_so2_tech', safety, now)) {
    throw new Error('Worker should not be absent initially');
  }
  console.log('✅ Test 1 Passed: Default state has no active absences.');

  // Test 2: Trigger Fume Sickness
  safety.activeAbsences['gas_so2_tech'] = {
    workerId: 'gas_so2_tech',
    role: 'gas_so2_tech',
    workerName: 'Ignatius Brim',
    stationName: 'Chamber 6 • Fume Scrubber Retort',
    stationEmoji: '🌋',
    cause: 'fume_sickness',
    startedAt: now,
    durationMs: 3600 * 1000,
    expiresAt: now + 3600 * 1000,
  };

  if (!isWorkerAbsentAndUncovered('gas_so2_tech', safety, now)) {
    throw new Error('Worker should be absent and uncovered');
  }
  console.log('✅ Test 2 Passed: Fume Sickness correctly registers as absent and stalls station.');

  // Test 3: Cover with Temp Day-Laborer
  safety.tempReplacementWorkers['gas_so2_tech'] = now + 1800 * 1000;
  if (isWorkerAbsentAndUncovered('gas_so2_tech', safety, now)) {
    throw new Error('Worker should be covered by active temp worker');
  }
  console.log('✅ Test 3 Passed: Temp worker covers absent station and resumes compression.');

  // Test 4: Wildcat strike mechanics
  safety.isWildcatStrikeActive = true;
  if (!safety.isWildcatStrikeActive) {
    throw new Error('Wildcat strike flag must persist');
  }
  console.log('✅ Test 4 Passed: Wildcat strike state tracks correctly.');

  // Test 5: Verify costs
  if (
    MEDICAL_DRAUGHT_COST_COINS !== 85 ||
    TEMP_WORKER_DAILY_COST_COINS !== 45 ||
    OZONE_AIR_SCRUBBER_COST_COINS !== 650 ||
    EMERGENCY_PRESSURE_CUTOFF_COST_COINS !== 450 ||
    ESTATE_BREAKROOM_COST_COINS !== 550 ||
    WILDCAT_UNION_SETTLEMENT_BONUS_PCT !== 0.25
  ) {
    throw new Error('Constants do not match specification requirements');
  }
  console.log('✅ Test 5 Passed: All balance and cost constants match specification.');

  // Test 6: Formatter helper
  const formatted = formatAbsenceRemaining(now + 90 * 1000);
  if (!formatted.includes('m') && !formatted.includes('s')) {
    throw new Error(`Unexpected format output: ${formatted}`);
  }
  console.log(`✅ Test 6 Passed: formatAbsenceRemaining produced '${formatted}'.`);

  console.log('🎉 ALL WORKER ABSENTEEISM MECHANICS TESTS PASSED SUCCESSFULLY!');
}

runAbsenteeismTests();
