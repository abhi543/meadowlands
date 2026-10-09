# Meadowlands Worker System — Complete Reference

## 1. FARMHANDS (Manual Perk Workers)

| Role     | Emoji | Cost   | Perk                    | Description                              |
|----------|-------|--------|-------------------------|------------------------------------------|
| Lumberjack | 🪓 | 💰100 | +15% production speed   | Clears wood hazards; boosts lumber mill yield |
| Fisherman  | 🎣 | 💰100 | Free fish every 5 min   | Passive fish gathering at riverside docks   |
| Farmer     | 👨‍🌾 | 💰100 | -20% crop grow time     | Decreases field growth timers on adjacent plots |
| Artisan    | 🧑‍🎨 | 💰100 | -25% production time    | Speeds up production processing inside factories |

### Farmhand Instance Schema
```
FarmhandInstance {
  id: string
  role: FarmhandRole          // 'lumberjack' | 'fisherman' | 'farmer' | 'artisan'
  level: number               // starts at 1, earns XP
  xp: number                  // accumulated experience
  equippedOutfit: OutfitId | null  // optional outfit buff
}
```

### Outfits (Enhance Farmhand Perks)

| Outfit              | Emoji | Compatible Role | Buff                    |
|---------------------|-------|-----------------|-------------------------|
| Fisherman Slicker   | 🧥    | fisherman       | -33% catch time         |
| Farmer's Hat        | 🧢    | farmer          | -20% crop grow time     |
| Artisan Apron       | 🧥    | artisan         | -25% production time    |
| Lumberjack Vest     | 🧥    | lumberjack      | +15% lumber yield       |

---

## 2. AUTONOMOUS WORKERS (Auto-Producing Workers)

| Type          | Emoji | Produces             | Qty | Base Interval | Storage Destination |
|---------------|-------|----------------------|-----|---------------|---------------------|
| Auto Fisherman | 🎣   | fish                 | ×1  | 60s           | Barn                |
| Beekeeper     | 🍯    | honey_comb           | ×1  | 120s          | Silo                |
| Forager       | 🍇    | wild_berries         | ×1  | 90s           | Silo                |
| Merchant      | 💰    | *(auto-sells barn)*  | —   | 60s           | N/A (generates coins) |
| Prospector    | ⛏    | gold_nugget          | ×1  | 180s          | Silo                |

### Autonomous Worker Instance Schema
```
AutonomousWorkerInstance {
  id: string
  type: WorkerType            // 'fisherman' | 'beekeeper' | 'forager' | 'merchant' | 'prospector'
  gearTier: number            // 1-indexed (1, 2, or 3)
  autoSell: boolean           // if true, converts output to coins instead of storage
  lastProduceTime: number     // timestamp of last production cycle
}
```

---

## 3. GEAR UPGRADES (3 Tiers per Worker)

Gear upgrades reduce `speedMultiplier`, making workers produce faster.

### Auto Fisherman
| Tier | Gear Name     | Speed Multiplier | Effective Interval | Cost              |
|------|---------------|------------------|--------------------|-------------------|
| 1    | Basic Net     | 1.0×             | 60s                | Free              |
| 2    | Copper Net    | 0.8×             | 48s                | 500 coins         |
| 3    | Steel Net     | 0.6×             | 36s                | 2,000 coins + 2💎 |

### Beekeeper
| Tier | Gear Name     | Speed Multiplier | Effective Interval | Cost              |
|------|---------------|------------------|--------------------|-------------------|
| 1    | Basic Smoker  | 1.0×             | 120s               | Free              |
| 2    | Pro Smoker    | 0.75×            | 90s                | 800 coins         |
| 3    | Elite Smoker  | 0.5×             | 60s                | 3,000 coins + 3💎 |

### Forager
| Tier | Gear Name        | Speed Multiplier | Effective Interval | Cost              |
|------|------------------|------------------|--------------------|-------------------|
| 1    | Basic Basket     | 1.0×             | 90s                | Free              |
| 2    | Woven Basket     | 0.8×             | 72s                | 600 coins         |
| 3    | Enchanted Basket | 0.5×             | 45s                | 2,500 coins + 2💎 |

### Merchant
| Tier | Gear Name    | Speed Multiplier | Effective Interval | Cost              |
|------|--------------|------------------|--------------------|-------------------|
| 1    | Basic Cart   | 1.0×             | 60s                | Free              |
| 2    | Sturdy Cart  | 0.8×             | 48s                | 1,000 coins       |
| 3    | Golden Cart  | 0.5×             | 30s                | 5,000 coins + 5💎 |

### Prospector
| Tier | Gear Name    | Speed Multiplier | Effective Interval | Cost              |
|------|--------------|------------------|--------------------|-------------------|
| 1    | Basic Pick   | 1.0×             | 180s               | Free              |
| 2    | Iron Pick    | 0.75×            | 135s               | 1,500 coins       |
| 3    | Diamond Pick | 0.5×             | 90s                | 8,000 coins + 5💎 |

---

## 4. PRODUCTION CYCLE LOGIC (Tick Loop)

```
Every tick():
  For each autonomous worker:
    1. effectiveInterval = baseIntervalMs × gear.speedMultiplier
    2. elapsed = now - worker.lastProduceTime

    IF elapsed < effectiveInterval → SKIP (not ready)

    IF elapsed >= effectiveInterval → PRODUCE:
      ┌─ CASE: Merchant + autoSell ON
      │   └─ Scan barn for first item with qty > 1
      │      └─ Sell min(qty - 1, 3) items → add coins
      │      └─ Always keeps at least 1 of each item
      │      └─ Sells only ONE item type per cycle
      │
      ├─ CASE: Producer + autoSell ON
      │   └─ Look up sellPrice from PRODUCTS table
      │   └─ Add sellPrice × producesQty directly to coins
      │   └─ Item never enters storage
      │
      └─ CASE: Producer + autoSell OFF
          └─ Determine storage: silo or barn
             ├─ Silo items: honey_comb, wild_berries, gold_nugget, cotton
             └─ Barn items: fish, everything else
          └─ Add producesQty to appropriate storage

    3. Reset lastProduceTime = now
```

### Key Behaviors
- **Multiple workers of same type stack** (2 Beekeepers = 2 honey combs per cycle)
- **Merchant auto-sells only 1 item type per cycle**, up to 3 units (keeps 1 reserve)
- **Auto-sell on producers** bypasses storage entirely — items convert straight to coins
- **Merchant defaults to autoSell = ON** when hired; all others default to OFF

---

## 5. FISHERY CROSS-REFERENCE

The Fishery system requires at least one fisherman to function:

```
hasFisherman = farmhands.some(f => f.role === 'fisherman')
            || autonomousWorkers.some(w => w.type === 'fisherman')
```

- **Both farmhand and autonomous fishermen** count toward enabling fishery
- **Fisherman Slicker outfit** (-33% catch time) only applies to **farmhand fishermen**, not autonomous ones
- Without any fisherman, the fishery panel shows: "Hire a Fisherman (Workers tab) to start catching!"

---

## 6. STORE ACTIONS

| Action                  | Parameters          | Effect                                              |
|-------------------------|---------------------|-----------------------------------------------------|
| buyFarmhand             | (role)              | Costs 💰100, creates FarmhandInstance at Lv.1       |
| hireAutonomousWorker    | (type)              | Costs 💰200, creates AutonomousWorkerInstance at Tier 1 |
| toggleWorkerAutoSell    | (workerId)          | Flips autoSell boolean on matching worker            |
| upgradeWorkerGear       | (workerId)          | Deducts coins+gems, increments gearTier by 1        |
| equipOutfit             | (farmhandId, outfitId or null) | Sets or clears outfit on farmhand         |

---

## 7. UI LAYOUT

```
Workers Tab
├── FarmhandPanel (🧑‍🌾 Farmhands)
│   ├── Fisherman status bar (if fishermen hired)
│   │   └─ "{count} Fishermen active — Fishing in {zones} zones with {rod}"
│   └── 4 role cards in 2-column grid
│       ├── Emoji + Name + Description + Perk
│       ├── Hired instances: Lv.{n} badge + outfit equip/unequip buttons
│       └── "Recruit 💰100" button (disabled if can't afford)
│
├── ── divider ──
│
└── AutonomousWorkerPanel (👷 Workers)
    ├── Outfit Bonuses section (slicker status for fisherman farmhands)
    └── 5 worker type cards in 2-column grid
        ├── Emoji + Name + Description + "Produces every Xs: item"
        ├── Hired instances:
        │   ├── Gear name + "Tier {n}" label
        │   ├── Progress bar (fills from 0% to 100% over interval)
        │   ├── Auto-sell ON/OFF toggle (merchant only)
        │   └── "⬆ {NextGearName}" upgrade button (if available + affordable)
        └── "Hire 💰200" button (disabled if can't afford)
```

---

## 8. PERSISTENCE & MIGRATION

- **Storage key**: `meadowlands-save` (Zustand persist middleware, localStorage)
- **Persisted fields**: `farmhands[]`, `autonomousWorkers[]`
- **Migration rules**:
  - If `autonomousWorkers` missing → initialize to `[]`
  - If farmhand `equippedOutfit` missing → set to `null`
- **Reset**: Both arrays reset to `[]`

---

## 9. SOURCE FILES

| File                                           | Contains                                           |
|------------------------------------------------|----------------------------------------------------|
| src/game/data.ts (lines 223-430)               | Types, constants, FARMHANDS, OUTFITS, WORKERS defs |
| src/game/store.ts (lines 55-78)                | FarmhandInstance, AutonomousWorkerInstance schemas  |
| src/game/store.ts (lines 912-1012)             | Actions: buyFarmhand, hireWorker, upgrade, equip    |
| src/game/store.ts (lines 1328-1369)            | Tick: autonomous worker production cycle            |
| src/components/game/FarmhandPanel.tsx           | Farmhand UI (role cards, recruit, outfit equip)     |
| src/components/game/AutonomousWorkerPanel.tsx   | Worker UI (type cards, hire, gear upgrade, progress)|
