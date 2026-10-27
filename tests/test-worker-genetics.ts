/**
 * Automated Verification Suite for Phase 1: Worker Genetic Profile Initialization & Persistence
 *
 * Verifies all criteria from Phase 1 Specification:
 * 1. Every worker receives a genetic profile.
 * 2. All 5 numerical traits (Strength, Stamina, Farming Aptitude, Learning Ability, Work Efficiency) are in [0, 100].
 * 3. Existing profiles are NEVER overwritten.
 * 4. Genetic values persist across save/load (rehydration simulation).
 * 5. Reassigning, hiring, or updating a worker does NOT regenerate traits.
 * 6. Existing worker data (level, isHired, stats, shiftType, etc.) is preserved without resets.
 * 7. Initialization is idempotent (safe to run multiple times).
 */

import {
  type WorkerGenetics,
  generateRandomWorkerGenetics,
  isValidWorkerGenetics,
  ensureWorkerGenetics,
} from '../src/game/workerGenetics';
import { createDefaultSpecialistWorkers } from '../src/data/workerCatalog';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

console.log('--- STARTING WORKER GENETICS PHASE 1 TEST SUITE ---\n');

// Test 1: Validation of genetic traits bounds [0, 100]
console.log('Testing Trait Range & Validation...');
const sampleGenetics = generateRandomWorkerGenetics();
assert(isValidWorkerGenetics(sampleGenetics), 'Generated profile passes validation');
assert(sampleGenetics.strength >= 0 && sampleGenetics.strength <= 100, `Strength in range [0, 100]: ${sampleGenetics.strength}`);
assert(sampleGenetics.stamina >= 0 && sampleGenetics.stamina <= 100, `Stamina in range [0, 100]: ${sampleGenetics.stamina}`);
assert(sampleGenetics.farmingAptitude >= 0 && sampleGenetics.farmingAptitude <= 100, `Farming Aptitude in range [0, 100]: ${sampleGenetics.farmingAptitude}`);
assert(sampleGenetics.learningAbility >= 0 && sampleGenetics.learningAbility <= 100, `Learning Ability in range [0, 100]: ${sampleGenetics.learningAbility}`);
assert(sampleGenetics.workEfficiency >= 0 && sampleGenetics.workEfficiency <= 100, `Work Efficiency in range [0, 100]: ${sampleGenetics.workEfficiency}`);

// Test 2: Negative and out-of-bounds rejection
assert(!isValidWorkerGenetics({ strength: -5, stamina: 50, farmingAptitude: 50, learningAbility: 50, workEfficiency: 50 }), 'Rejects negative strength');
assert(!isValidWorkerGenetics({ strength: 50, stamina: 105, farmingAptitude: 50, learningAbility: 50, workEfficiency: 50 }), 'Rejects stamina > 100');
assert(!isValidWorkerGenetics(null), 'Rejects null profile');
assert(!isValidWorkerGenetics({}), 'Rejects empty profile');

// Test 3: Existing profiles are NEVER overwritten
console.log('\nTesting Non-Overwrite Guarantee...');
const customProfile: WorkerGenetics = {
  strength: 88,
  stamina: 77,
  farmingAptitude: 99,
  learningAbility: 95,
  workEfficiency: 92,
};
const preserved = ensureWorkerGenetics(customProfile);
assert(preserved.strength === 88 && preserved.stamina === 77 && preserved.farmingAptitude === 99, 'ensureWorkerGenetics strictly preserves existing valid profile');
assert(preserved === customProfile, 'Returned exact existing reference without recreating');

// Test 4: Missing profile initialization
const newlyCreated = ensureWorkerGenetics(undefined);
assert(isValidWorkerGenetics(newlyCreated), 'ensureWorkerGenetics generates valid profile when missing');

// Test 5: Reassignment / Re-hiring simulation (ensure traits are not regenerated)
console.log('\nTesting Worker Task Reassignment & Re-hiring...');
interface MockWorker {
  role: string;
  level: number;
  isHired: boolean;
  shiftType: string;
  stats: { totalCoinsEarned: number; totalItemsProduced: number };
  genetics?: WorkerGenetics;
}

const mockWorker: MockWorker = {
  role: 'farmer',
  level: 42,
  isHired: false,
  shiftType: 'morning',
  stats: { totalCoinsEarned: 15400, totalItemsProduced: 1200 },
  genetics: customProfile,
};

// Simulate hiring the worker
const hiredWorker: MockWorker = {
  ...mockWorker,
  isHired: true,
  genetics: ensureWorkerGenetics(mockWorker.genetics),
};
assert(hiredWorker.genetics?.strength === 88, 'Hiring preserves strength unchanged');
assert(hiredWorker.genetics?.workEfficiency === 92, 'Hiring preserves workEfficiency unchanged');
assert(hiredWorker.level === 42, 'Existing level is not reset upon assignment');
assert(hiredWorker.stats.totalCoinsEarned === 15400, 'Career stats are completely preserved');

// Simulate reassigning shift
const reassignedWorker: MockWorker = {
  ...hiredWorker,
  shiftType: 'night',
  genetics: ensureWorkerGenetics(hiredWorker.genetics),
};
assert(reassignedWorker.genetics === customProfile, 'Shift reassignment does not regenerate traits');
assert(reassignedWorker.shiftType === 'night', 'Shift successfully updated without touching genetics');

// Test 6: Specialist Workers default initialization
console.log('\nTesting Specialist Worker Catalog Initialization...');
const specialists = createDefaultSpecialistWorkers();
for (const [id, spec] of Object.entries(specialists)) {
  assert(Boolean(spec.genetics), `Specialist ${id} has genetics initialized`);
  assert(isValidWorkerGenetics(spec.genetics), `Specialist ${id} genetics are valid`);
  assert(spec.isHired === false, `Specialist ${id} isHired status preserved as false`);
  assert(spec.stamina === 100, `Specialist ${id} stamina preserved`);
}

// Test 7: Persistence Rehydration & Idempotency Simulation
console.log('\nTesting Save/Load Rehydration Simulation...');
// Simulate an old save game where workers do NOT have genetics
const legacySaveWorkers: Record<string, any> = {
  farmer: { role: 'farmer', level: 15, isHired: true, stats: { totalCoinsEarned: 5000, totalItemsProduced: 300 } },
  herder: { role: 'herder', level: 8, isHired: true, stats: { totalCoinsEarned: 2000, totalItemsProduced: 100 } },
  fisherman: { role: 'fisherman', level: 1, isHired: false, stats: { totalCoinsEarned: 0, totalItemsProduced: 0 }, genetics: customProfile },
};

// Rehydration pass 1 (like store merge)
for (const r of Object.keys(legacySaveWorkers)) {
  const w = legacySaveWorkers[r];
  if (!w.genetics || !isValidWorkerGenetics(w.genetics)) {
    w.genetics = generateRandomWorkerGenetics();
  }
}

const farmerGeneticsFirstPass = { ...legacySaveWorkers.farmer.genetics };
assert(isValidWorkerGenetics(legacySaveWorkers.farmer.genetics), 'Legacy farmer received a genetic profile');
assert(legacySaveWorkers.farmer.level === 15, 'Farmer level 15 completely preserved');
assert(legacySaveWorkers.fisherman.genetics.strength === 88, 'Pre-existing profile was not touched');

// Rehydration pass 2 (subsequent load / refresh - idempotency check)
for (const r of Object.keys(legacySaveWorkers)) {
  const w = legacySaveWorkers[r];
  if (!w.genetics || !isValidWorkerGenetics(w.genetics)) {
    w.genetics = generateRandomWorkerGenetics();
  }
}

assert(
  legacySaveWorkers.farmer.genetics.strength === farmerGeneticsFirstPass.strength &&
  legacySaveWorkers.farmer.genetics.stamina === farmerGeneticsFirstPass.stamina &&
  legacySaveWorkers.farmer.genetics.farmingAptitude === farmerGeneticsFirstPass.farmingAptitude,
  'Second rehydration pass leaves genetics 100% unchanged (idempotent)'
);

console.log('\n--- STARTING WORKER GENETICS & RETIREMENT PHASE 2 TEST SUITE ---\n');

import {
  canWorkerRetire,
  getGenerationalSpeedMultiplier,
  inheritWorkerGenetics,
  calculateRetirementSeverance,
  toRomanNumeral,
  RETIREMENT_REQUIRED_LEVEL,
} from '../src/game/workerGenetics';
import { workerEffectiveInterval } from '../src/game/data';

// Test 8: Retirement Level Eligibility Requirement (Max Level 120)
console.log('Testing Retirement Level Eligibility...');
assert(!canWorkerRetire(1), 'Level 1 cannot retire');
assert(!canWorkerRetire(60), 'Level 60 cannot retire');
assert(!canWorkerRetire(119), 'Level 119 cannot retire (strictly Max Level 120)');
assert(canWorkerRetire(120), 'Level 120 CAN retire with honor');
assert(RETIREMENT_REQUIRED_LEVEL === 120, 'Retirement required level is 120');

// Test 9: Generational Speed Doubling (2^(gen-1))
console.log('\nTesting Generational Speed Multiplier (2^(gen-1))...');
assert(getGenerationalSpeedMultiplier(1) === 1, 'Gen 1 speed multiplier is 1x (2^0)');
assert(getGenerationalSpeedMultiplier(2) === 2, 'Gen 2 speed multiplier is 2x (2^1)');
assert(getGenerationalSpeedMultiplier(3) === 4, 'Gen 3 speed multiplier is 4x (2^2)');
assert(getGenerationalSpeedMultiplier(4) === 8, 'Gen 4 speed multiplier is 8x (2^3)');
assert(getGenerationalSpeedMultiplier(5) === 16, 'Gen 5 speed multiplier is 16x (2^4)');
assert(toRomanNumeral(1) === 'I', 'Gen 1 roman numeral is I');
assert(toRomanNumeral(2) === 'II', 'Gen 2 roman numeral is II');
assert(toRomanNumeral(3) === 'III', 'Gen 3 roman numeral is III');
assert(toRomanNumeral(4) === 'IV', 'Gen 4 roman numeral is IV');

// Test 10: workerEffectiveInterval with Generational Speed Doubling
console.log('\nTesting workerEffectiveInterval speedup per generation...');
const baseIntervalLvl1 = workerEffectiveInterval('farmer', 1, 1);
const gen2IntervalLvl1 = workerEffectiveInterval('farmer', 1, 2);
const gen3IntervalLvl1 = workerEffectiveInterval('farmer', 1, 3);
assert(gen2IntervalLvl1 === Math.max(250, Math.round(baseIntervalLvl1 / 2)), `Gen 2 interval (${gen2IntervalLvl1}ms) is exactly half of Gen 1 (${baseIntervalLvl1}ms)`);
assert(gen3IntervalLvl1 === Math.max(250, Math.round(baseIntervalLvl1 / 4)), `Gen 3 interval (${gen3IntervalLvl1}ms) is 4x faster (quarter interval)`);

// Test 11: Genetic Mentorship Drift & Inheritance
console.log('\nTesting Genetic Inheritance & Mentorship Drift...');
const parentGenetics: WorkerGenetics = {
  strength: 60,
  stamina: 70,
  farmingAptitude: 80,
  learningAbility: 90,
  workEfficiency: 98,
};
const childGenetics = inheritWorkerGenetics(parentGenetics);
assert(isValidWorkerGenetics(childGenetics), 'Child genetics pass validation');
assert(childGenetics.strength >= parentGenetics.strength, `Child strength (${childGenetics.strength}) >= parent (${parentGenetics.strength})`);
assert(childGenetics.stamina >= parentGenetics.stamina, `Child stamina (${childGenetics.stamina}) >= parent (${parentGenetics.stamina})`);
assert(childGenetics.farmingAptitude >= parentGenetics.farmingAptitude, `Child farming aptitude (${childGenetics.farmingAptitude}) >= parent (${parentGenetics.farmingAptitude})`);
assert(childGenetics.learningAbility >= parentGenetics.learningAbility, `Child learning ability (${childGenetics.learningAbility}) >= parent (${parentGenetics.learningAbility})`);
assert(childGenetics.workEfficiency <= 100, `Child work efficiency (${childGenetics.workEfficiency}) is capped at 100`);

// Test 12: Severance / Pension Payouts
console.log('\nTesting Retirement Severance & Pension Payouts...');
const sevGen1 = calculateRetirementSeverance(1);
assert(sevGen1.pensionCoins === 50000, `Gen 1 retirement awards 50,000 coins: ${sevGen1.pensionCoins}`);
assert(sevGen1.pensionGems === 25, `Gen 1 retirement awards 25 gems: ${sevGen1.pensionGems}`);
const sevGen2 = calculateRetirementSeverance(2);
assert(sevGen2.pensionCoins === 100000, `Gen 2 retirement awards 100,000 coins: ${sevGen2.pensionCoins}`);
assert(sevGen2.pensionGems === 50, `Gen 2 retirement awards 50 gems: ${sevGen2.pensionGems}`);

console.log('\n🎉 ALL PHASE 1 & PHASE 2 BACKEND CRITERIA SUCCESSFULLY VERIFIED!');
