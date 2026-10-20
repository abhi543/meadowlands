import {
  simulateOverflowSurgeTick,
  ELEVATED_TOWER_CAPACITY,
} from '../src/game/hydraulicFailSafeEngine';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

console.log('--- RUNNING FULL-CAPACITY OVERFLOW SURGE TEST SUITE ---');

// Test 1: Sub-Capacity Inaction
console.log('\n[1. Sub-Capacity Inaction Test]');
{
  // Cistern at 99% (1485 / 1500), Aquifer at 50% (1500 / 3000), Tower at 200L
  const res1 = simulateOverflowSurgeTick({
    towerLiters: 200,
    towerCapacityLiters: 800,
    cisternLiters: 1485,
    cisternMaxLiters: 1500,
    aquiferLiters: 1500,
    aquiferCapacityLiters: 3000,
    deltaSeconds: 1,
    isOverflowSurgeActive: false,
    overflowSurgeSource: null,
  });

  assert(!res1.isOverflowSurgeActive, 'Cistern at 99% does NOT activate overflow surge');
  assert(res1.transferredLiters === 0, 'Zero liters transferred at 99% capacity');
  assert(res1.newTowerLiters === 200, 'Tower remains unchanged at 200L');

  // Aquifer at 99% (2970 / 3000), Cistern at 50% (750 / 1500)
  const res2 = simulateOverflowSurgeTick({
    towerLiters: 200,
    towerCapacityLiters: 800,
    cisternLiters: 750,
    cisternMaxLiters: 1500,
    aquiferLiters: 2970,
    aquiferCapacityLiters: 3000,
    deltaSeconds: 1,
    isOverflowSurgeActive: false,
    overflowSurgeSource: null,
  });

  assert(!res2.isOverflowSurgeActive, 'Aquifer at 99% does NOT activate overflow surge');
  assert(res2.transferredLiters === 0, 'Zero liters transferred at 99% capacity');
}

// Test 2: Instant Full Trigger
console.log('\n[2. Instant Full Trigger Test]');
{
  // Push Cistern to exactly 100% (1500 / 1500)
  const resCistern = simulateOverflowSurgeTick({
    towerLiters: 200,
    towerCapacityLiters: 800,
    cisternLiters: 1500,
    cisternMaxLiters: 1500,
    aquiferLiters: 2000,
    aquiferCapacityLiters: 3000,
    deltaSeconds: 1,
    isOverflowSurgeActive: false,
    overflowSurgeSource: null,
  });

  assert(resCistern.isOverflowSurgeActive, 'Cistern at 100% immediately activates overflow surge');
  assert(resCistern.overflowSurgeSource === 'cistern', 'Source correctly identified as cistern');
  assert(resCistern.justTriggered, 'justTriggered flag emitted');
  assert(resCistern.transferredLiters === 15, 'Transferred exactly 15L at 15L/s in 1 second');
  assert(resCistern.newTowerLiters === 215, 'Tower increased from 200L to 215L');
  assert(resCistern.newCisternLiters === 1485, 'Cistern decreased from 1500L to 1485L');

  // Push Aquifer to exactly 100% (3000 / 3000)
  const resAquifer = simulateOverflowSurgeTick({
    towerLiters: 200,
    towerCapacityLiters: 800,
    cisternLiters: 1000,
    cisternMaxLiters: 1500,
    aquiferLiters: 3000,
    aquiferCapacityLiters: 3000,
    deltaSeconds: 1,
    isOverflowSurgeActive: false,
    overflowSurgeSource: null,
  });

  assert(resAquifer.isOverflowSurgeActive, 'Aquifer at 100% immediately activates overflow surge');
  assert(resAquifer.overflowSurgeSource === 'aquifer', 'Source correctly identified as aquifer');
  assert(resAquifer.justTriggered, 'justTriggered flag emitted');
  assert(resAquifer.transferredLiters === 15, 'Transferred exactly 15L at 15L/s in 1 second');
  assert(resAquifer.newTowerLiters === 215, 'Tower increased from 200L to 215L');
  assert(resAquifer.newAquiferLiters === 2985, 'Aquifer decreased from 3000L to 2985L');
}

// Test 3: Continuous Fill
console.log('\n[3. Continuous Fill Test]');
{
  // Even though cistern dropped to 1485L (99%), because isOverflowSurgeActive is true,
  // it MUST continue pumping continuously until tower reaches 800L!
  let tower = 215;
  let cistern = 1485;
  let aquifer = 2000;
  let isActive = true;
  let source: 'cistern' | 'aquifer' | null = 'cistern';
  let ticks = 0;

  while (isActive && ticks < 100) {
    const tickRes = simulateOverflowSurgeTick({
      towerLiters: tower,
      towerCapacityLiters: 800,
      cisternLiters: cistern,
      cisternMaxLiters: 1500,
      aquiferLiters: aquifer,
      aquiferCapacityLiters: 3000,
      deltaSeconds: 1,
      isOverflowSurgeActive: isActive,
      overflowSurgeSource: source,
    });

    tower = tickRes.newTowerLiters;
    cistern = tickRes.newCisternLiters;
    aquifer = tickRes.newAquiferLiters;
    isActive = tickRes.isOverflowSurgeActive;
    source = tickRes.overflowSurgeSource;
    ticks++;
  }

  assert(tower === 800, `Tower filled continuously to exactly 800L (reached ${tower}L in ${ticks} ticks)`);
  assert(!isActive, 'Surge pump automatically disengaged upon reaching 800L');
  assert(source === null, 'Active source reset to null upon completion');
}

// Test 4: Clean Cutoff
console.log('\n[4. Clean Cutoff Test]');
{
  // Tower at 795L (5L space left), 15L requested in 1 sec
  const cutoffRes = simulateOverflowSurgeTick({
    towerLiters: 795,
    towerCapacityLiters: 800,
    cisternLiters: 1000,
    cisternMaxLiters: 1500,
    aquiferLiters: 2000,
    aquiferCapacityLiters: 3000,
    deltaSeconds: 1,
    isOverflowSurgeActive: true,
    overflowSurgeSource: 'cistern',
  });

  assert(cutoffRes.newTowerLiters === 800, 'Tower capped cleanly at exactly 800L without overflow');
  assert(cutoffRes.transferredLiters === 5, 'Only 5L transferred to prevent exceeding 800L ceiling');
  assert(cutoffRes.newCisternLiters === 995, 'Source reservoir deducted by exactly 5L (zero volume wasted)');
  assert(!cutoffRes.isOverflowSurgeActive, 'Pump stopped immediately (isOverflowSurgeActive = false)');
  assert(cutoffRes.justCompleted, 'justCompleted flag emitted on clean cutoff');
}

// Test 5: Pre-Filled Suppression
console.log('\n[5. Pre-Filled Suppression Test]');
{
  // Tower already at 800L full, Cistern reaches 100%
  const suppCistern = simulateOverflowSurgeTick({
    towerLiters: 800,
    towerCapacityLiters: 800,
    cisternLiters: 1500,
    cisternMaxLiters: 1500,
    aquiferLiters: 2000,
    aquiferCapacityLiters: 3000,
    deltaSeconds: 1,
    isOverflowSurgeActive: false,
    overflowSurgeSource: null,
  });

  assert(!suppCistern.isOverflowSurgeActive, 'Pre-filled 800L tower suppresses Cistern surge trigger');
  assert(suppCistern.transferredLiters === 0, 'Zero transfer when tower is full');
  assert(suppCistern.newTowerLiters === 800, 'Tower remains at 800L');
  assert(suppCistern.newCisternLiters === 1500, 'Cistern remains at 1500L');

  // Tower already at 800L full, Aquifer reaches 100%
  const suppAquifer = simulateOverflowSurgeTick({
    towerLiters: 800,
    towerCapacityLiters: 800,
    cisternLiters: 1000,
    cisternMaxLiters: 1500,
    aquiferLiters: 3000,
    aquiferCapacityLiters: 3000,
    deltaSeconds: 1,
    isOverflowSurgeActive: false,
    overflowSurgeSource: null,
  });

  assert(!suppAquifer.isOverflowSurgeActive, 'Pre-filled 800L tower suppresses Aquifer surge trigger');
  assert(suppAquifer.transferredLiters === 0, 'Zero transfer when tower is full');
}

// Test 6: Simultaneous Full-Capacity Collision & Failover Resolution
console.log('\n[6. Simultaneous Full-Capacity Collision & Failover Resolution]');
{
  // Both Cistern (1500/1500) and Aquifer (3000/3000) are 100% full at the same time!
  const simRes = simulateOverflowSurgeTick({
    towerLiters: 200,
    towerCapacityLiters: 800,
    cisternLiters: 1500,
    cisternMaxLiters: 1500,
    aquiferLiters: 3000,
    aquiferCapacityLiters: 3000,
    deltaSeconds: 1,
    isOverflowSurgeActive: false,
    overflowSurgeSource: null,
  });

  assert(simRes.isOverflowSurgeActive, 'Surge triggers when both reservoirs are full');
  assert(simRes.overflowSurgeSource === 'cistern', 'Rain Catchment Cistern prioritized first over Deep Aquifer');

  // Now test failover: Cistern has only 10L left, Tower needs 600L
  const failoverRes = simulateOverflowSurgeTick({
    towerLiters: 200,
    towerCapacityLiters: 800,
    cisternLiters: 0, // Cistern emptied!
    cisternMaxLiters: 1500,
    aquiferLiters: 3000,
    aquiferCapacityLiters: 3000,
    deltaSeconds: 1,
    isOverflowSurgeActive: true,
    overflowSurgeSource: 'cistern',
  });

  assert(failoverRes.overflowSurgeSource === 'aquifer', 'Switches to Deep Aquifer when Cistern empties before Tower hits 800L');
  assert(failoverRes.transferredLiters === 15, 'Transfers from Aquifer seamlessly');
  assert(failoverRes.newTowerLiters === 215, 'Tower fills continuously across source failover');
}

console.log('\n🎉 ALL FULL-CAPACITY OVERFLOW SURGE UNIT TESTS PASSED WITH 100% SUCCESS!\n');
