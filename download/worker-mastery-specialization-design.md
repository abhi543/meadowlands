# 🧑‍🌾 Worker Mastery & Specialization System — Detailed Design

## THE CORE IDEA

Currently workers have **3 linear gear tiers** that only affect **speed**. The new system adds:

1. **Mastery Levels** — workers level up through XP from production cycles, unlocking perks
2. **Specialization Branches** — at Mastery 5, each worker picks ONE of two paths ( irreversible)
3. **Synergy Bonuses** — certain worker combos unlock team effects
4. **Critical Production** — chance to produce double/triple output on a cycle
5. **Quality Tiers** — workers can produce higher-quality variants worth more

---

## 1. MASTERY LEVELS (Every Worker)

Workers earn **1 XP per production cycle**. Every 5 XP = 1 Mastery Level.

| Mastery Lv | XP Needed | Unlock                                           |
|------------|-----------|--------------------------------------------------|
| 1          | 0         | Base production (current behavior)               |
| 2          | 5         | +5% critical chance (double output on a cycle)   |
| 3          | 10        | Unlock Gear Tier 2                               |
| 4          | 15        | +10% critical chance (cumulative 15%)            |
| 5          | 20        | **SPECIALIZATION CHOICE** (pick Branch A or B)   |
| 6          | 25        | +15% critical chance (cumulative 30%)            |
| 7          | 30        | Unlock Gear Tier 3                               |
| 8          | 35        | +20% critical chance (cumulative 50%)            |
| 9          | 40        | **Specialization Tier 2 perk**                    |
| 10         | 50        | **MASTERY CAPSTONE** — unique ultimate perk       |

### Mastery Instance (add to AutonomousWorkerInstance)
```
AutonomousWorkerInstance {
  ...existing fields
  masteryXp: number            // earned from production cycles
  specialization: 'a' | 'b' | null   // null until Mastery 5
}
```

### Mastery Level Calculation
```typescript
function masteryLevel(xp: number): number {
  const thresholds = [0, 5, 10, 15, 20, 25, 30, 35, 40, 50];
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (xp >= thresholds[i]) return i + 1;
  }
  return 1;
}
```

### Critical Production Logic
```typescript
// On each production cycle:
const critChance = masteryLevel * 0.05;  // 5% per level, max 50%
const isCrit = Math.random() < critChance;
const producedQty = isCrit ? (def.producesQty || 1) * 2 : (def.producesQty || 1);
// Crit produces DOUBLE output for that cycle
// At Mastery 10, rare "SUPER CRIT" (5% chance) produces TRIPLE
if (masteryLevel >= 10 && Math.random() < 0.05) {
  producedQty = (def.producesQty || 1) * 3;
}
```

---

## 2. SPECIALIZATION BRANCHES (Mastery 5 — Choose One, Permanent)

Each worker type gets TWO distinct specialization paths. This is the **big new idea** — workers become uniquely yours.

### 🎣 Auto Fisherman

|                     | Branch A: **Deep Sea Angler**              | Branch B: **Fish Farm Breeder**             |
|---------------------|--------------------------------------------|---------------------------------------------|
| **Mastery 5 perk**  | +25% rare fish catch chance                | Fish auto-produced go to barn +1 extra      |
| **Mastery 9 perk**  | Can catch legendary fish (lanternfish)     | Auto-breeds: every 3rd cycle spawns a new common animal (chicken/cow) |
| **Mastery 10 capstone** | Ocean zone unlocked for free (no gems)  | Fish sell price +50% at market              |
| **Playstyle**       | Push fishing into high-value rare catches   | Convert fish into a livestock engine        |

### 🍯 Beekeeper

|                     | Branch A: **Royal Jelly Alchemist**        | Branch B: **Mead Brewer**                   |
|---------------------|--------------------------------------------|---------------------------------------------|
| **Mastery 5 perk**  | 20% chance: honey_comb → royal_jelly (rare, sells 5×) | honey_comb → mead (crafted product, sells 3×) |
| **Mastery 9 perk**  | royal_jelly can upgrade any animal tier by 1 | mead production speed doubled               |
| **Mastery 10 capstone** | royal_jelly → golden_jelly (legendary, sells 25×) | mead triggers "Drunk Harvest" — all crops instant grow for 30s |
| **Playstyle**       | High-value rare products for profit         | AoE buff engine for your farm               |

### 🍇 Forager

|                     | Branch A: **Wildcraft Herbalist**          | Branch B: **Berry Wine Vintner**            |
|---------------------|--------------------------------------------|---------------------------------------------|
| **Mastery 5 perk**  | 20% chance: wild_berries → medicinal_herb (heals sick animals) | wild_berries → berry_wine (crafted product, sells 4×) |
| **Mastery 9 perk**  | medicinal_herb cures ALL animal ailments farm-wide | berry_wine production speed doubled        |
| **Mastery 10 capstone** | Find truffle on crit (legendary forage item) | berry_wine triggers "Vintage Boom" — all product sell prices +100% for 60s |
| **Playstyle**       | Farm support / animal health               | Profit explosion burst engine               |

###A: Merchant

|                     | Branch A: **Black Market Smuggler**        | Branch B: **Guild Trade Master**            |
|---------------------|--------------------------------------------|---------------------------------------------|
| **Mastery 5 perk**  | Sells up to 5 items per cycle (was 3)      | +20% sell price on all auto-sold items      |
| **Mastery 9 perk**  | 10% chance: sold item yields +1 gem        | Auto-sells silo items too (not just barn)   |
| **Mastery 10 capstone** | "Shadow Deal" — rare item sold at 10× price once per hour | "Trade Network" — all sell prices +50% permanently |
| **Playstyle**       | High-risk, high-reward rare sales          | Steady, reliable profit amplifier           |

### ⛏ Prospector

|                     | Branch A: **Deep Vein Miner**              | Branch B: **Gem Prospector**                |
|---------------------|--------------------------------------------|---------------------------------------------|
| **Mastery 5 perk**  | 20% chance: gold_nE_nugget → uncut_gem (sells 8×) | +1 gem found per 10 cycles                 |
| **Mastery 9 perk**  | uncut_gem can be cut → cut_gem (sells 20×) | Gems found also grant +50 coins each       |
| **Mastery 10 capstone** | "Mother Lode" — finds legendary ore (sells 100×) once per hour | "Gem Rush" — all gem income +100% permanently |
| **Playstyle**       | Chase legendary drops                      | Steady gem income engine                    |

---

## 3. SYNERGY BONUSES (Team Combos)

When certain worker combinations are active simultaneously, bonus effects trigger:

| Synergy Combo                    | Name                | Effect                                          |
|----------------------------------|---------------------|-------------------------------------------------|
| Beekeeper + Forager              | **Garden Alliance** | +15% production speed for both                  |
| Fisherman + Merchant             | **Dock Deal**       | Merchant sells fish first, +10% fish sell price |
| Prospector + Merchant            | **Gold Circuit**    | Merchant prioritizes gold_nugget, sells at +25% |
| Beekeeper + Forager + Merchant   | **Market Monopoly** | All crafted products (mead, wine, jelly) sell +50% |
| All 5 types hired                | **Full Crew**       | +10% speed to ALL workers                       |
| 3+ same type (e.g., 3 Beekeepers)| **Swarm**           | +20% crit chance for that worker type           |

### Synergy Detection Logic
```typescript
function getActiveSynergies(workers: AutonomousWorkerInstance[]): Synergy[] {
  const typeCounts: Record<WorkerType, number> = {};
  workers.forEach(w => { typeCounts[w.type] = (typeCounts[w.type] || 0) + 1; });

  const synergies: Synergy[] = [];
  if (typeCounts.beekeeper && typeCounts.forager) synergies.push(SYNERGIES.garden_alliance);
  if (typeCounts.fisherman && typeCounts.merchant) synergies.push(SYNERGIES.dock_deal);
  if (typeCounts.prospector && typeCounts.merchant) synergies.push(SYNERGIES.gold_circuit);
  if (typeCounts.beekeeper && typeCounts.forager && typeCounts.merchant) synergies.push(SYNERGIES.market_monopoly);
  if (Object.keys(typeCounts).length === 5) synergies.push(SYNERGIES.full_crew);
  for (const [type, count] of Object.entries(typeCounts)) {
    if (count >= 3) synergies.push({ ...SYNERGIES.swarm, affectedType: type });
  }
  return synergies;
}
```

---

## 4. QUALITY TIERS (Produced Item Variants)

Workers at higher mastery can produce **higher quality** variants of their items:

| Base Item      | ★ Common | ★★ Fine (Mastery 3+)    | ★★★ Exceptional (Mastery 7+) |
|----------------|----------|-------------------------|------------------------------|
| fish           | fish (sell 8) | fine_fish (sell 24) | exceptional_fish (sell 80)   |
| honey_comb     | honey_comb (sell 15) | fine_honey (sell 45) | royal_jelly (sell 150)       |
| wild_berries   | wild_berries (sell 5) | ripe_berries (sell 15) | wild_fruit_basket (sell 50)  |
| gold_nugget    | gold_nugget (sell 50) | uncut_gem (sell 200) | cut_gem (sell 500)           |

### Quality Roll Logic
```typescript
function rollQuality(masteryLevel: number): 'common' | 'fine' | 'exceptional' {
  if (masteryLevel >= 7 && Math.random() < 0.15) return 'exceptional';  // 15% at M7+
  if (masteryLevel >= 3 && Math.random() < 0.30) return 'fine';         // 30% at M3+
  return 'common';
}
```

---

## 5. FARMHAND MASTERY (Also Upgraded!)

Farmhands also get mastery, but their perks are **passive buff amplifiers**:

| Mastery Lv | Farmhand Perk                                                    |
|------------|------------------------------------------------------------------|
| 1          | Base perk (current)                                              |
| 2          | Perk effect +20%                                                 |
| 3          | Perk effect +40%                                                 |
| 4          | Perk effect +60%                                                 |
| 5          | **Specialization** — choose Enhanced Perk OR Secondary Perk      |
| 6-9        | Scaling continues to +120%                                       |
| 10         | **Capstone** — unique farmhand ultimate                          |

### Farmhand Specializations

| Farmhand   | Branch A: Enhanced Perk             | Branch B: Secondary Perk                    |
|------------|-------------------------------------|---------------------------------------------|
| Lumberjack | +30% lumber yield → +60% total     | +1 wood produced per cycle (quantity over quality) |
| Fisherman  | -50% catch time (was -33%)         | Auto-catch: free fish every 2 min (independent of fishery) |
| Farmer     | -40% crop grow (was -20%)          | Crops yield +1 when harvested (quantity boost) |
| Artisan    | -50% production time (was -25%)    | Artisan products sell for +25% more         |

### Farmhand Capstones (Mastery 10)

| Farmhand   | Capstone Perk                                              |
|------------|------------------------------------------------------------|
| Lumberjack | "Timber Tycoon" — all wood-type products sell at +100%     |
| Fisherman  | "Master Angler" — guaranteed rare catch every 10th cycle   |
| Farmer     | "Harvest King" — all crops mature in 50% time permanently  |
| Artisan    | "Craft Legend" — all crafted items have 20% chance to be ★★★ |

---

## 6. NEW DATA TYPES & SCHEMA

```typescript
// --- Mastery ---
export const MASTERY_THRESHOLDS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 50];

export type SpecializationBranch = 'a' | '-b';

export interface MasteryDef {
  level: number;
  xpRequired: number;
  critChance: number;
  perk: string;
  isSpecialization?: boolean;
  isCapstone?: boolean;
}

// --- Specializations ---
export interface SpecializationDef {
  workerType: WorkerType;
  branch: SpecializationBranch;
  name: string;
  description: string;
  mastery5Perk: string;
  mastery9Perk: string;
  mastery10Capstone: string;
}

export const SPECIALIZATIONS: Record<WorkerType, { a: SpecializationDef; b: SpecializationDef }> = {
  fisherman: {
    a: { workerType: 'fisherman', branch: 'a', name: 'Deep Sea Angler', description: 'Chase rare catches in deep waters',
         mastery5Perk: '+25% rare fish chance', mastery9Perk: 'Can catch legendary fish', mastery10Capstone: 'Ocean zone free unlock' },
    b: { workerType: 'fisherman', branch: 'b', name: 'Fish Farm Breeder', description: 'Turn fish into livestock',
         mastery5Perk: 'Fish +1 extra per cycle', mastery9Perk: 'Every 3rd cycle spawns common animal', mastery10Capstone: 'Fish sell +50%' },
  },
  // ... etc for all 5 types
};

// --- Synergies ---
export interface SynergyDef {
  id: string;
  name: string;
  emoji: string;
  requiredTypes: WorkerType[];
  minCount?: number;               // for Swarm: 3+ of same type
  effect: string;
  speedBonus?: number;             // multiplier additive
  priceBonus?: number;             // sell price multiplier
  critBonus?: number;
}

export const SYNERGIES: Record<string, SynergyDef> = {
  garden_alliance: { id: 'garden_alliance', name: 'Garden Alliance', emoji: '🌿',
    requiredTypes: ['beekeeper', 'forager'], effect: '+15% speed for both', speedBonus: 0.15 },
  dock_deal:       { id: 'dock_deal', name: 'Dock Deal', emoji: '🤝',
    requiredTypes: ['fisherman', 'merchant'], effect: 'Fish sell +10%', priceBonus: 0.10 },
  gold_circuit:    { id: 'gold_circuit', name: 'Gold Circuit', emoji: '🔄',
    requiredTypes: ['prospector', 'merchant'], effect: 'Gold sell +25%', priceBonus: 0.25 },
  market_monopoly: { id: 'market_monopoly', name: 'Market Monopoly', emoji: '🏛',
    requiredTypes: ['beekeeper', 'forager', 'merchant'], effect: 'Crafted products sell +50%', priceBonus: 0.50 },
  full_crew:       { id: 'full_crew', name: 'Full Crew', emoji: '👥',
    requiredTypes: ['fisherman', 'beekeeper', 'forager', 'merchant', 'prospector'], effect: '+10% speed all', speedBonus: 0.10 },
  swarm:           { id: 'swarm', name: 'Swarm', emoji: '🐝',
    requiredTypes: [], minCount: 3, effect: '+20% crit chance for type', critBonus: 0.20 },
};

// --- Quality Tiers ---
export type ItemQuality = 'common' | 'fine' | 'exceptional';

export interface QualityVariantDef {
  base: string;        // base item ID
  fine: string;        // fine variant item ID
  exceptional: string; // exceptional variant item ID
  fineSell: number;
  exceptionalSell: number;
}
```

---

## 7. UPDATED STORE ACTIONS

```typescript
// Choose specialization at Mastery 5 (irreversible!)
chooseSpecialization: (workerId: string, branch: SpecializationBranch) => {
  const state = get();
  const worker = state.autonomousWorkers.find(w => w.id === workerId);
  if (!worker) return;
  if (masteryLevel(worker.masteryXp) < 5) return;  // must be Mastery 5
  if (worker.specialization !== null) return;        // already chosen
  const newWorkers = state.autonomousWorkers.map(w =>
    w.id === workerId ? { ...w, specialization: branch } : w
  );
  set({ autonomousWorkers: newWorkers });
},
```

### Updated Tick — Mastery XP + Criticals + Quality

```typescript
// Inside the production cycle, after a worker produces:
const mLevel = masteryLevel(w.masteryXp);

// 1. Award 1 mastery XP
const newXp = w.masteryXp + 1;

// 2. Critical roll
const critChance = mLevel * 0.05;
const isCrit = Math.random() < critChance;
let qty = def.producesQty || 1;
if (isCrit) qty *= 2;

// 3. Super crit at Mastery 10
if (mLevel >= 10 && Math.random() < 0.05) qty = (def.producesQty || 1) * 3;

// 4. Quality roll (Mastery 3+ and 7+)
const quality = rollQuality(mLevel);
// Map produced item to quality variant

// 5. Synergy bonuses
const activeSynergies = getActiveSynergies(state.autonomousWorkers);
const speedBonus = 1 + activeSynergies.reduce((sum, s) => sum + (s.speedBonus || 0), 0);
const priceBonus = 1 + activeSynergies.reduce((sum, s) => sum + (s.priceBonus || 0), 0);
const effectiveInterval = (def.baseIntervalMs * gear.speedMultiplier) / speedBonus;

// Return updated worker with new XP
return { ...w, masteryXp: newXp, lastProduceTime: now };
```

---

## 8. UI ADDITIONS

### Worker Card Updates
```
┌─────────────────────────────────────────────┐
│ 🍯 Beekeeper                     Mastery 7  │
│ "Elite Smoker" (Tier 3)                    │
│ ████████████████░░░░ 80% (next in 12s)     │
│ ⚡ Crit: 35%  |  Quality: ★★★ 15% chance   │
│                                             │
│ Specialization: 🧪 Royal Jelly Alchemist    │
│  ✦ M5: 20% chance → royal_jelly            │
│  ✦ M9: royal_jelly upgrades animal tier    │
│  ⭐ M10: golden_jelly (legendary)          │
│                                             │
│ XP: ████████░░░░ 35/50  (Mastery 7 → 8)    │
│                                             │
│ [Auto-sell OFF]  [⬆ Elite Smoker (owned)]  │
└─────────────────────────────────────────────┘
```

### Specialization Choice Modal (at Mastery 5)
```
┌─────────────────────────────────────────────┐
│  🎣 Choose Specialization                   │
│  This choice is PERMANENT!                  │
│                                             │
│  ┌─── Branch A ────────────────────────┐    │
│  │ 🌊 Deep Sea Angler                  │    │
│  │ +25% rare fish chance               │    │
│  │ → M9: Legendary fish access         │    │
│  │ → M10: Free ocean zone              │    │
│  └──────────────────────────────────────┘    │
│                                             │
│  ┌─── Branch B ────────────────────────┐    │
│  │ 🐟 Fish Farm Breeder                │    │
│  │ Fish +1 extra per cycle             │    │
│  │ → M9: Spawns common animals         │    │
│  │ → M10: Fish sell +50%              │    │
│  └──────────────────────────────────────┘    │
│                                             │
│  [Choose A]              [Choose B]         │
└─────────────────────────────────────────────┘
```

### Synergy Banner (auto-detected, shown at top of Workers tab)
```
┌─────────────────────────────────────────────┐
│ 🔗 Active Synergies                        │
│  🌿 Garden Alliance — +15% speed            │
│  🤝 Dock Deal — Fish sell +10%             │
│  👥 Full Crew — +10% speed ALL             │
└─────────────────────────────────────────────┘
```

---

## 9. FULL IMPLEMENTATION CHECKLIST

- [ ] Add `masteryXp` and `specialization` to AutonomousWorkerInstance schema
- [ ] Add `masteryXp` and `specialization` to FarmhandInstance schema
- [ ] Add `MASTERY_THRESHOLDS`, `SPECIALIZATIONS`, `SYNERGIES`, `QUALITY_VARIANTS` to data.ts
- [ ] Implement `masteryLevel()`, `rollQuality()`, `getActiveSynergies()` functions
- [ ] Add `chooseSpecialization()` store action
- [ ] Update tick loop: mastery XP, critical rolls, quality rolls, synergy bonuses
- [ ] Update AutonomousWorkerPanel: mastery bar, specialization display, crit/quality stats
- [ ] Build SpecializationChoiceModal component
- [ ] Build SynergyBanner component
- [ ] Add migration for existing workers (masteryXp: 0, specialization: null)
- [ ] Add new quality variant items to PRODUCTS table
- [ ] Test: verify Mastery 5 triggers specialization prompt
- [ ] Test: verify synergies activate/deactivate correctly
- [ ] Test: verify quality variants go to correct storage
