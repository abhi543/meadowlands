import {
  WORKER_REGISTRY,
  WORKER_DIVISIONS,
  workerUpgradeCost,
  workerSpeedMultiplier,
  workerOverdrive,
  WORKER_MAX_LEVEL,
  type WorkerRole,
} from '../src/game/data';
import { CANISTER_RECIPES, type CanisterId } from '../src/game/gasBottlingEngine';
import {
  GAS_CANISTER_TO_TECH,
  TECH_TO_GAS_CANISTER,
  computeGasBatchSpecs,
} from '../src/game/store';
import { WORKER_UPKEEP_ROSTER } from '../src/data/workerUpkeep';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

console.log('--- STARTING GAS CHAMBER WORKFORCE TEST SUITE ---\n');

// 1. Division & Registry Verification
console.log('Testing Division & Registry...');
assert(Boolean(WORKER_DIVISIONS.refinery), 'refinery division exists in WORKER_DIVISIONS');
assert(WORKER_DIVISIONS.refinery.roles.length === 7, `refinery division has exactly 7 roles: ${WORKER_DIVISIONS.refinery.roles.length}`);

const expectedCanisters: CanisterId[] = [
  'co2_cylinder', 'oxygen_canister', 'nitrogen_dewar',
  'ethylene_cylinder', 'ozone_canister', 'sulfur_dioxide_flask', 'phosphine_bomb',
];

for (const cid of expectedCanisters) {
  const role = GAS_CANISTER_TO_TECH[cid];
  assert(Boolean(role), `Canister ${cid} maps to role: ${role}`);
  assert(TECH_TO_GAS_CANISTER[role] === cid, `Reverse mapping matches for ${role}`);

  const def = WORKER_REGISTRY[role];
  assert(Boolean(def), `Worker definition exists for ${role}`);
  assert(def.division === 'refinery', `${role} belongs to refinery division`);
  assert(def.unlockLevel > 0, `${role} unlock level: ${def.unlockLevel}`);
  assert(def.baseCost > 0, `${role} base cost: ${def.baseCost}`);
  assert(def.autoSellPayout > 0, `${role} autoSellPayout: ${def.autoSellPayout}`);

  // Upkeep Roster Check
  const upkeep = WORKER_UPKEEP_ROSTER[role];
  assert(Boolean(upkeep), `Upkeep profile registered for ${role}`);
  assert(upkeep.baseDailyWage > 0, `Base daily wage set for ${role}: ${upkeep.baseDailyWage}`);
}

// 2. Level Progression Math (Lv 1 to Lv 120)
console.log('\nTesting 120-Level Progression Math...');
const garethRole = GAS_CANISTER_TO_TECH['co2_cylinder'];
const costLv1 = workerUpgradeCost(garethRole, 1);
const costLv10 = workerUpgradeCost(garethRole, 10);
const costLv60 = workerUpgradeCost(garethRole, 60);
const costLv120 = workerUpgradeCost(garethRole, 120);

assert(costLv1 > 0, `Lv 1 -> 2 upgrade cost: ${costLv1}`);
assert(costLv10 > costLv1, `Lv 10 upgrade cost (${costLv10}) > Lv 1 (${costLv1})`);
assert(costLv60 > costLv10, `Lv 60 upgrade cost (${costLv60}) > Lv 10 (${costLv10})`);
assert(costLv120 === 0, `Lv 120 upgrade cost is 0 (max level capped)`);

// 3. Speed & Overdrive Progression
console.log('\nTesting Compression Speedup via Levels...');
const speedLv1 = workerSpeedMultiplier(1) * workerOverdrive(1);
const speedLv60 = workerSpeedMultiplier(60) * workerOverdrive(60);
const speedLv120 = workerSpeedMultiplier(120) * workerOverdrive(120);

assert(speedLv1 === 1.0, `Lv 1 speed factor is 1.0 (base)`);
assert(speedLv60 < speedLv1, `Lv 60 speed factor (${speedLv60.toFixed(3)}) is faster than Lv 1`);
assert(speedLv120 === 0.2, `Lv 120 speed factor is 0.20 (5x faster compression cycle)`);

// 4. Batch Specs Simulation with Generational Multiplier
console.log('\nTesting Batch Specs Calculation...');
const co2Recipe = CANISTER_RECIPES.co2_cylinder;
const baseSpecs = computeGasBatchSpecs(undefined, co2Recipe);
assert(baseSpecs.durationSec === co2Recipe.processingDurationSec, `Unassigned worker runs at base duration: ${baseSpecs.durationSec}s`);

// Mock hired level 1 worker (Gen 1)
const mockGen1 = {
  role: garethRole,
  isHired: true,
  level: 1,
  autoSell: false,
  isPaused: false,
  lastActionTimestamp: Date.now(),
  bufferCount: 0,
  stats: { totalCoinsEarned: 0, totalItemsProduced: 0, totalGemsEarned: 0 },
  moraleTier: 'content' as const,
  missedCycles: 0,
  shiftType: 'morning' as const,
  stamina: 100,
  generation: 1,
  genetics: { strength: 50, stamina: 50, farmingAptitude: 50, learningAbility: 50, workEfficiency: 50 },
};

const gen1Specs = computeGasBatchSpecs(mockGen1, co2Recipe);
assert(gen1Specs.durationSec === co2Recipe.processingDurationSec, `Gen 1 Lv 1 runs at base duration: ${gen1Specs.durationSec}s`);

// Mock hired level 120 worker (Gen 1)
const mockLv120Gen1 = { ...mockGen1, level: 120 };
const lv120Gen1Specs = computeGasBatchSpecs(mockLv120Gen1, co2Recipe);
const expectedDurationLv120 = Math.round(co2Recipe.processingDurationSec * 0.2);
assert(lv120Gen1Specs.durationSec === expectedDurationLv120, `Lv 120 Gen 1 runs at 5x speed (${lv120Gen1Specs.durationSec}s vs ${co2Recipe.processingDurationSec}s)`);

// Mock Gen 2 worker (retired once, 2x generational speed) at level 120
const mockLv120Gen2 = { ...mockGen1, level: 120, generation: 2 };
const lv120Gen2Specs = computeGasBatchSpecs(mockLv120Gen2, co2Recipe);
const expectedDurationGen2 = Math.round((co2Recipe.processingDurationSec * 0.2) / 2);
assert(lv120Gen2Specs.durationSec === expectedDurationGen2, `Lv 120 Gen 2 runs at 10x speed (${lv120Gen2Specs.durationSec}s vs ${co2Recipe.processingDurationSec}s)`);

console.log('\n🎉 ALL GAS CHAMBER WORKFORCE TESTS PASSED!');
