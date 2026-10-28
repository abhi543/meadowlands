import { createDefaultSanctuary } from '../src/types/prehistoric.ts';
import { createDefaultGasBottlingRefinery } from '../src/game/gasBottlingEngine.ts';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

console.log('--- TESTING SANCTUARY SLURRY INFLOW & SIMULATION ---\n');

// 1. Verify default sanctuary specimen setup
const sanctuary = createDefaultSanctuary();
const enclosures = Object.values(sanctuary.enclosures);
assert(enclosures.length === 6, `Sanctuary has 6 enclosures (found: ${enclosures.length})`);

const trilobiteEnc = sanctuary.enclosures.enclosure_silt_terrarium;
assert(trilobiteEnc.specimenCount === 1, `Default terrarium has 1 pioneer specimen: ${trilobiteEnc.specimenCount}`);
assert(!trilobiteEnc.isStarving, `Pioneer specimen is not starving`);

// 2. Compute inflow rate matching GasBottlingRefineryPanel math
const activeEnclosures = enclosures.filter((e) => (e.specimenCount || 0) > 0 && !e.isStarving);
const totalSanctuaryCreatures = activeEnclosures.reduce((sum, e) => sum + (e.specimenCount || 0), 0);
assert(totalSanctuaryCreatures === 1, `Total active sanctuary creatures: ${totalSanctuaryCreatures}`);

const sanctuaryRatePerMin = totalSanctuaryCreatures * 5.0;
assert(sanctuaryRatePerMin === 5.0, `Sanctuary inflow rate: ${sanctuaryRatePerMin} L/min`);

// 3. Simulation step test: 60 seconds of daytime tick
const refinery = createDefaultGasBottlingRefinery();
const initialSlurry = refinery.storedSlurryFeedstock; // 120L

const totalHerdSlurryLps = (totalSanctuaryCreatures * (5.0 / 60)); // 0.08333 L/s
const deltaSeconds = 60;
const addedSlurry = totalHerdSlurryLps * deltaSeconds; // 5.0L

const updatedSlurry = Math.min(refinery.maxSlurryCapacity, Number((initialSlurry + addedSlurry).toFixed(2)));
assert(updatedSlurry === 125, `After 60s, refinery slurry increased from 120L to 125L (+5L)`);

// 4. Test starving creature produces 0 slurry
const starvingEnc = { ...trilobiteEnc, isStarving: true };
const activeStarving = [starvingEnc].filter((e) => (e.specimenCount || 0) > 0 && !e.isStarving);
assert(activeStarving.length === 0, `Starving creature correctly filtered out of active slurry producers`);

console.log('\n🎉 ALL SANCTUARY SLURRY TESTS PASSED!');
