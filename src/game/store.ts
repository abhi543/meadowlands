import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  CROPS, ANIMALS, PRODUCTS, BUILDINGS, FARMHANDS, WORKERS,
  WATER_ZONES, FISH_SPECIES, ROD_TIERS, ROD_TIER_ORDER, OUTFITS,
  HOURLY_EVENTS, SMUGGLER_LOOT, CHEF_ORDER_TEMPLATES,
  HABITAT_UPGRADES, BREEDING_SLOT_UPGRADES,
  ORDER_TEMPLATES, xpForLevel, MAX_LEVEL,
  TIER_MAX_CYCLES, ANIMAL_BUY_PRICES, ANIMAL_MARKET_PRICES,
  livestockSellPriceForAnimal, randomMaxCycles,
  WORKER_REGISTRY, WORKER_MAX_LEVEL, WORKER_DIVISIONS,
  workerUpgradeCost, workerEffectiveInterval, workerDoubleProcChance,
  workerTripleProcUnlocked, workerGemProcUnlocked, workerAutoSellBonus,
  workerHopperBuffer, workerAutoSellPayout, calculateBulkUpgrade,
  type CropId, type AnimalSpecies, type Tier, type BuildingId, type FarmhandRole, type RecipeDef,
  type WaterZoneId, type FishSpeciesId, type RodTier, type OutfitId,
  type WorkerType, type HourlyEventType,
  type WorkerRole, type WorkerDivision, type BulkMode,
  BIOMES, LURES, TRAIL_ENCOUNTERS, type BiomeId, type LureTypeId,
  BREED_REGISTRY, defaultBreedId, type BreedDefinition,
  PARCEL_CONFIGS, PARCEL_ORDER, ESTATE_AURAS, getEstateAura,
  generateParcelDebris, generateFreightContract,
  type ParcelId, type ParcelState, type DebrisEntity, type FreightContract, type EstateAuraTier,
  FACILITY_FOOTPRINTS, FREIGHT_CONTRACT_TEMPLATES,
} from './data';

// ---- Runtime types ----

export interface PlotState {
  id: number;
  crop: CropId | null;
  plantedAt: number | null;
  ready: boolean;
}

export interface AnimalInstance {
  id: string;
  species: AnimalSpecies;
  tier: Tier;
  breedId: string;
  fed: boolean;
  fedAt: number | null;
  productReady: boolean;
  age: 'baby' | 'adult' | 'elder';
  maxCycles: number;
  cyclesRemaining: number;
  cyclesCompletedTotal: number;
}

export interface ProductionSlot {
  recipeId: string;
  recipeName: string;
  recipeEmoji: string;
  startedAt: number;
  durationSec: number;
  done: boolean;
}

export interface OrderState {
  id: string;
  requested: { itemId: string; qty: number; emoji: string; name: string }[];
  coinReward: number;
  xpReward: number;
  trashedAt: number | null;
}

export interface FarmhandInstance {
  id: string;
  role: FarmhandRole;
  level: number;
  xp: number;
  equippedOutfit: OutfitId | null;
}

// Fishery
export interface FisheryState {
  unlockedZones: WaterZoneId[];
  rodTier: RodTier;
  lastCatchTimestamps: Record<WaterZoneId, number>;
  fishCodex: Record<string, boolean>;
}

// Autonomous Workers (legacy — kept for migration)
export interface AutonomousWorkerInstance {
  id: string;
  type: WorkerType;
  gearTier: number;
  autoSell: boolean;
  lastProduceTime: number;
}

// Unified Master Worker (v2.0)
export interface UnifiedWorkerInstance {
  role: WorkerRole;
  isHired: boolean;
  level: number;           // 1–120
  autoSell: boolean;       // true = Auto-Sell Mode, false = Hoard Mode
  lastActionTimestamp: number;
  bufferCount: number;     // Level 40+ hopper buffer cycles
  stats: {
    totalCoinsEarned: number;
    totalItemsProduced: number;
    totalGemsEarned: number;
  };
}

// Hourly Events
export interface ActiveHourlyEvent {
  type: HourlyEventType;
  startedAt: number;
  chefOrder?: {
    requested: { itemId: string; qty: number; emoji: string; name: string }[];
    coinReward: number;
    xpReward: number;
    gemReward: number;
  };
  crowPlotIds?: number[];
  smugglerCrates?: number;
}

// Notifications
export interface NotificationItem {
  id: string;
  message: string;
  emoji: string;
  createdAt: number;
  type: 'xp' | 'coin' | 'gem' | 'discovery' | 'event' | 'info';
}

// Breeding
export interface ActiveBreeding {
  id: string;
  species: AnimalSpecies;
  parent1Id: string;
  parent2Id: string;
  startedAt: number;
  durationMs: number;
}

export interface ActiveExpedition {
  id: string;
  biomeId: BiomeId;
  farmhandId: string;
  lureId: LureTypeId;
  startedAt: number;
  durationMs: number;
  midpointResolved: boolean;
  pendingChoice: {
    prompt: string;
    safeLabel: string;
    riskyLabel: string;
  } | null;
  riskyChosen: boolean | null; // null = not yet chosen
}

export interface GameState {
  // Player
  coins: number;
  gems: number;
  xp: number;
  level: number;

  // Storage
  silo: Record<string, number>;
  barn: Record<string, number>;

  // Farm
  plots: PlotState[];
  unlockedPlots: number;

  // Animals
  animals: AnimalInstance[];
  animalCapacity: Record<AnimalSpecies, number>;

  // Production
  productionQueues: Record<BuildingId, ProductionSlot[]>;

  // Orders
  orders: OrderState[];

  // Farmhands
  farmhands: FarmhandInstance[];

  // Codex (discovered breeds)
  codex: Record<string, boolean>;

  // Fishery
  fishery: FisheryState;

  // Autonomous Workers (legacy)
  autonomousWorkers: AutonomousWorkerInstance[];

  // Unified Workers (v2.0)
  unifiedWorkers: Record<WorkerRole, UnifiedWorkerInstance>;

  // Hourly Events
  activeEvent: ActiveHourlyEvent | null;
  lastEventTriggerTime: number;

  // Notifications
  notifications: NotificationItem[];

  // Breeding
  breedingSlots: number;
  activeBreedings: ActiveBreeding[];

  // Wilderness Expeditions
  wilderness: {
    unlockedBiomes: Record<BiomeId, boolean>;
    activeExpeditions: ActiveExpedition[];
  };

  // Habitat Upgrades
  habitatUpgradeSteps: Record<AnimalSpecies, number>;

  // Territory Expansion
  parcels: Record<ParcelId, ParcelState>;
  activeFreightContract: FreightContract | null;
  freightContractRefreshAt: number; // timestamp when next contract auto-refreshes
  currentEstateAura: EstateAuraTier;

  // Time
  lastTick: number;

  // --- Actions ---
  plantCrop: (plotId: number, cropId: CropId) => void;
  harvestPlot: (plotId: number) => void;
  plantAllCrops: (cropId: CropId) => void;
  harvestAllPlots: () => void;
  feedAnimal: (animalId: string) => void;
  collectProduct: (animalId: string) => void;
  feedAllAnimals: () => void;
  collectAllProducts: () => void;
  buyAnimal: (species: AnimalSpecies, tier?: Tier) => void;
  sellAnimal: (animalId: string) => void;
  sellAllElderAnimals: () => void;
  startProduction: (buildingId: BuildingId, recipe: RecipeDef) => void;
  collectProduction: (buildingId: BuildingId, slotIndex: number) => void;
  startProductionAll: (buildingId: BuildingId, recipe: RecipeDef) => void;
  collectProductionAll: (buildingId: BuildingId) => void;
  fulfillOrder: (orderId: string) => void;
  trashOrder: (orderId: string) => void;
  sellItem: (itemId: string, qty: number) => void;
  sellAllOfItem: (itemId: string) => void;
  sellAllItems: () => void;
  buyFarmhand: (role: FarmhandRole) => void;
  addSilo: (itemId: string, qty: number) => void;
  addBarn: (itemId: string, qty: number) => void;

  // Fishery
  unlockFisheryZone: (zoneId: WaterZoneId) => void;
  upgradeFishingRod: () => void;

  // Autonomous Workers (legacy)
  hireAutonomousWorker: (type: WorkerType) => void;
  toggleWorkerAutoSell: (workerId: string) => void;
  upgradeWorkerGear: (workerId: string) => void;

  // Unified Workers (v2.0)
  hireUnifiedWorker: (role: WorkerRole) => void;
  upgradeUnifiedWorker: (role: WorkerRole, levelsToBuy: number) => void;
  toggleUnifiedWorkerMode: (role: WorkerRole) => void;
  bulkUpgradeUnifiedWorker: (role: WorkerRole, mode: BulkMode) => void;

  // Outfits
  equipOutfit: (farmhandId: string, outfitId: OutfitId | null) => void;

  // Events
  shooCrow: () => void;
  fulfillChefOrder: () => void;
  openSmugglerCrate: () => void;

  // Breeding
  breedAnimals: (parent1Id: string, parent2Id: string) => void;
  upgradeBreedingSlot: () => void;

  // Wilderness
  launchExpedition: (biomeId: BiomeId, farmhandId: string, lureId: LureTypeId) => void;
  resolveExpeditionChoice: (expeditionId: string, chooseRisky: boolean) => void;

  // Habitat
  upgradeHabitat: (species: AnimalSpecies) => void;

  // Territory Expansion
  unlockParcel: (parcelId: ParcelId) => void;
  startClearingDebris: (parcelId: ParcelId, debrisId: string) => void;
  acceptFreightContract: () => void;
  fulfillFreightContract: () => void;
  failFreightContract: () => void;
  refreshFreightContract: () => void;
  recalculateEstateAura: () => void;

  // Notifications
  addNotification: (message: string, emoji: string, type: NotificationItem['type']) => void;
  clearNotifications: () => void;

  tick: () => void;
  resetGame: () => void;
}

const GRID_SIZE = 12;

function generateOrders(count: number): OrderState[] {
  const orders: OrderState[] = [];
  const pool = [...ORDER_TEMPLATES];
  for (let i = 0; i < count; i++) {
    const template = pool[Math.floor(Math.random() * pool.length)];
    orders.push({
      id: `order_${Date.now()}_${i}`,
      ...template,
      trashedAt: null,
    });
  }
  return orders;
}

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const initialPlots: PlotState[] = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  crop: null,
  plantedAt: null,
  ready: false,
}));

const initialAnimals: AnimalInstance[] = [
  { id: 'a1', species: 'chicken', tier: 'common', breedId: 'chicken_common', fed: false, fedAt: null, productReady: false, age: 'adult', maxCycles: 15, cyclesRemaining: 15, cyclesCompletedTotal: 0 },
  { id: 'a2', species: 'chicken', tier: 'common', breedId: 'chicken_common', fed: false, fedAt: null, productReady: false, age: 'adult', maxCycles: 15, cyclesRemaining: 15, cyclesCompletedTotal: 0 },
  { id: 'a3', species: 'cow', tier: 'common', breedId: 'cow_common', fed: false, fedAt: null, productReady: false, age: 'adult', maxCycles: 12, cyclesRemaining: 12, cyclesCompletedTotal: 0 },
];

const initialOrders = generateOrders(6);

// Create default unified worker instances for all 13 roles
function createDefaultUnifiedWorkers(): Record<WorkerRole, UnifiedWorkerInstance> {
  const now = Date.now();
  const workers: Partial<Record<WorkerRole, UnifiedWorkerInstance>> = {};
  const allRoles: WorkerRole[] = [
    'farmer', 'lumberjack', 'fisherman', 'artisan',
    'auto_fisherman', 'beekeeper', 'forager', 'merchant', 'prospector',
    'alchemist', 'barn_overseer', 'cellar_ager', 'tinkerer',
  ];
  for (const role of allRoles) {
    workers[role] = {
      role,
      isHired: false,
      level: 1,
      autoSell: role === 'merchant', // merchant defaults to auto-sell
      lastActionTimestamp: now,
      bufferCount: 0,
      stats: { totalCoinsEarned: 0, totalItemsProduced: 0, totalGemsEarned: 0 },
    };
  }
  return workers as Record<WorkerRole, UnifiedWorkerInstance>;
}

const initialUnifiedWorkers = createDefaultUnifiedWorkers();

// Create initial parcel states
function createInitialParcels(): Record<ParcelId, ParcelState> {
  const parcels: Partial<Record<ParcelId, ParcelState>> = {};
  for (const parcelId of PARCEL_ORDER) {
    const config = PARCEL_CONFIGS[parcelId];
    parcels[parcelId] = {
      id: parcelId,
      isUnlocked: parcelId === 'parcel_core', // only core starts unlocked
      unlockedAt: parcelId === 'parcel_core' ? Date.now() : null,
      debris: parcelId === 'parcel_core' ? [] : generateParcelDebris(parcelId),
      placedBuildingId: null,
    };
  }
  return parcels as Record<ParcelId, ParcelState>;
}

const initialParcels = createInitialParcels();
const initialEstateAura = getEstateAura(1);

// Fish catch logic
function rollFishCatch(zoneId: WaterZoneId, rodTier: RodTier, fishCodex: Record<string, boolean>): { speciesId: FishSpeciesId; isNew: boolean } | null {
  const zone = WATER_ZONES[zoneId];
  const rod = ROD_TIERS[rodTier];

  const speciesList = zone.species.map(id => FISH_SPECIES[id]);
  const totalWeight = speciesList.reduce((sum, sp) => {
    let w = sp.dropWeight;
    if (sp.tier === 'rare') w *= (1 + rod.rareBoost);
    if (sp.tier === 'legendary') w *= (1 + rod.legendaryBoost);
    return sum + w;
  }, 0);

  let roll = Math.random() * totalWeight;
  for (const sp of speciesList) {
    let w = sp.dropWeight;
    if (sp.tier === 'rare') w *= (1 + rod.rareBoost);
    if (sp.tier === 'legendary') w *= (1 + rod.legendaryBoost);
    roll -= w;
    if (roll <= 0) {
      const codexKey = `fish_${sp.id}`;
      const isNew = !fishCodex[codexKey];
      return { speciesId: sp.id, isNew };
    }
  }
  return null;
}

// Smuggler loot roll
function rollSmugglerLoot(): { itemId: string; qty: number } {
  const totalWeight = SMUGGLER_LOOT.reduce((s, e) => s + e.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const entry of SMUGGLER_LOOT) {
    roll -= entry.weight;
    if (roll <= 0) return { itemId: entry.itemId, qty: entry.qty };
  }
  return { itemId: 'gems', qty: 1 };
}

// Chef order generator
function generateChefOrder() {
  const template = CHEF_ORDER_TEMPLATES[Math.floor(Math.random() * CHEF_ORDER_TEMPLATES.length)];
  return { ...template };
}

function levelUpCheck(xp: number, level: number): { xp: number; level: number } {
  let newXp = xp;
  let newLevel = level;
  while (newLevel < MAX_LEVEL && newXp >= xpForLevel(newLevel)) {
    newXp -= xpForLevel(newLevel);
    newLevel++;
  }
  return { xp: newXp, level: newLevel };
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      coins: 100,
      gems: 10,
      xp: 0,
      level: 1,

      silo: { wheat: 5, corn: 3, carrot: 0, strawberry: 0, soybean: 0, pumpkin: 0, cotton: 0, feed: 3, honey_comb: 0, wild_berries: 0, gold_nugget: 0 },
      barn: { egg: 2, milk: 1, wool: 0, truffle: 0, fish: 0, bread: 0, cheese: 0, pie: 0, sweater: 0, truffle_oil: 0, yarn: 0, quilted_blanket: 0, savory_fish_pie: 0, crab_bisque: 0, honey: 0, silk: 0 },

      plots: initialPlots,
      unlockedPlots: GRID_SIZE,

      animals: initialAnimals,
      animalCapacity: { chicken: 6, cow: 4, sheep: 4, pig: 4 },

      productionQueues: {
        feed_mill: [],
        bakery: [],
        dairy: [],
        loom: [],
        press: [],
        tailor_shop: [],
        textiles: [],
      },

      orders: initialOrders,
      farmhands: [],
      codex: { 'chicken_common': true, 'cow_common': true },

      fishery: {
        unlockedZones: ['zone_pond' as WaterZoneId],
        rodTier: 'bamboo',
        lastCatchTimestamps: {
          zone_pond: Date.now(),
          zone_river: 0,
          zone_estuary: 0,
          zone_lake: 0,
          zone_ocean: 0,
        },
        fishCodex: {},
      },

      autonomousWorkers: [],
      unifiedWorkers: initialUnifiedWorkers,
      activeEvent: null,
      lastEventTriggerTime: Date.now(),

      notifications: [],

      breedingSlots: 1,
      activeBreedings: [],

      wilderness: {
        unlockedBiomes: { biome_woods: false, biome_ridge: false, biome_caves: false, biome_peaks: false },
        activeExpeditions: [],
      },

      habitatUpgradeSteps: { chicken: 0, cow: 0, sheep: 0, pig: 0 },

      parcels: initialParcels,
      activeFreightContract: null,
      freightContractRefreshAt: Date.now() + 24 * 60 * 60 * 1000, // First contract in 24h
      currentEstateAura: initialEstateAura,

      lastTick: Date.now(),

      // ---- Actions ----

      plantCrop: (plotId, cropId) => {
        const state = get();
        const plot = state.plots[plotId];
        if (!plot || plot.crop !== null) return;
        if (plotId >= state.unlockedPlots) return;
        const cropDef = CROPS[cropId];
        if (cropDef.seedCost > 0 && state.coins < cropDef.seedCost) return;
        if (cropDef.seedCost > 0) {
          set({ coins: state.coins - cropDef.seedCost });
        }
        const newPlots = [...state.plots];
        newPlots[plotId] = { id: plotId, crop: cropId, plantedAt: Date.now(), ready: false };
        set({ plots: newPlots });
      },

      harvestPlot: (plotId) => {
        const state = get();
        const plot = state.plots[plotId];
        if (!plot || !plot.crop || !plot.ready) return;
        const cropDef = CROPS[plot.crop];
        const newSilo = { ...state.silo, [plot.crop]: (state.silo[plot.crop] || 0) + cropDef.yieldCount };
        const newPlots = [...state.plots];
        newPlots[plotId] = { id: plotId, crop: null, plantedAt: null, ready: false };
        const { xp: newXp, level: newLevel } = levelUpCheck(state.xp + 3, state.level);
        set({ silo: newSilo, plots: newPlots, xp: newXp, level: newLevel });
      },

      plantAllCrops: (cropId) => {
        const state = get();
        const cropDef = CROPS[cropId];
        const now = Date.now();
        // Find all empty unlocked plots
        const emptyPlotIds: number[] = [];
        for (let i = 0; i < state.unlockedPlots; i++) {
          if (state.plots[i] && state.plots[i].crop === null) {
            emptyPlotIds.push(i);
          }
        }
        if (emptyPlotIds.length === 0) return;
        // Check if we can afford to plant all (each plot costs seedCost)
        const totalCost = emptyPlotIds.length * cropDef.seedCost;
        if (cropDef.seedCost > 0 && state.coins < totalCost) return;
        // Deduct cost and plant all
        const newPlots = [...state.plots];
        for (const pid of emptyPlotIds) {
          newPlots[pid] = { id: pid, crop: cropId, plantedAt: now, ready: false };
        }
        set({
          coins: state.coins - totalCost,
          plots: newPlots,
        });
      },

      harvestAllPlots: () => {
        const state = get();
        const now = Date.now();
        const newSilo = { ...state.silo };
        const newPlots = [...state.plots];
        let harvestedCount = 0;
        for (let i = 0; i < state.unlockedPlots; i++) {
          const plot = state.plots[i];
          if (plot && plot.crop && plot.ready) {
            const cropDef = CROPS[plot.crop];
            newSilo[plot.crop] = (newSilo[plot.crop] || 0) + cropDef.yieldCount;
            newPlots[i] = { id: i, crop: null, plantedAt: null, ready: false };
            harvestedCount++;
          }
        }
        if (harvestedCount === 0) return;
        const { xp: newXp, level: newLevel } = levelUpCheck(state.xp + 3 * harvestedCount, state.level);
        set({ silo: newSilo, plots: newPlots, xp: newXp, level: newLevel });
      },

      feedAnimal: (animalId) => {
        const state = get();
        const animal = state.animals.find(a => a.id === animalId);
        if (!animal || animal.fed || animal.productReady) return;
        const feedNeeded = ANIMALS[animal.species].feedPerCycle;
        if ((state.silo.feed || 0) < feedNeeded) return;
        const newSilo = { ...state.silo, feed: state.silo.feed - feedNeeded };
        const newAnimals = state.animals.map(a =>
          a.id === animalId ? { ...a, fed: true, fedAt: Date.now() } : a
        );
        set({ silo: newSilo, animals: newAnimals });
      },

      collectProduct: (animalId) => {
        const state = get();
        const animal = state.animals.find(a => a.id === animalId);
        if (!animal || !animal.productReady) return;
        if (animal.cyclesRemaining <= 0) return;

        // Use breed registry for breed-specific yields
        const breedDef = BREED_REGISTRY[animal.breedId];
        const speciesDef = ANIMALS[animal.species];
        const newBarn = { ...state.barn };
        let additionalCoins = 0;
        let additionalGems = 0;
        let additionalXp = 5;
        const newCodex = { ...state.codex };

        // 1. Primary Product Yield
        if (breedDef) {
          newBarn[breedDef.primaryProductKey] = (newBarn[breedDef.primaryProductKey] || 0) + breedDef.baseYieldAmount;
        } else {
          // Fallback to species default
          newBarn[speciesDef.product] = (newBarn[speciesDef.product] || 0) + speciesDef.productYield;
        }

        // 2. Secondary Bonus Drop Procs
        if (breedDef?.bonusDrop && Math.random() < breedDef.bonusDrop.chance) {
          if (breedDef.bonusDrop.itemKey) {
            newBarn[breedDef.bonusDrop.itemKey] = (newBarn[breedDef.bonusDrop.itemKey] || 0) + 1;
          }
          if (breedDef.bonusDrop.directCoins) {
            additionalCoins += breedDef.bonusDrop.directCoins;
          }
        }

        // 3. Gem Milestones (Legendary Perks)
        const totalCompleted = animal.cyclesCompletedTotal + 1;
        if (breedDef?.gemMilestoneEveryN && totalCompleted % breedDef.gemMilestoneEveryN === 0) {
          additionalGems += animal.species === 'pig' ? 2 : 1;
        }

        // 4. Codex Discovery Handling (first-time breed discovery)
        const codexKey = animal.breedId;
        if (!newCodex[codexKey]) {
          newCodex[codexKey] = true;
          if (breedDef) additionalGems += breedDef.codexGemReward;
        }

        // 5. Tier-based XP
        additionalXp = animal.tier === 'legendary' ? 25 : animal.tier === 'rare' ? 15 : animal.tier === 'uncommon' ? 8 : 5;

        const newCyclesRemaining = animal.cyclesRemaining - 1;
        const isElder = newCyclesRemaining <= 0;
        const newAnimals = state.animals.map(a =>
          a.id === animalId ? { ...a, fed: false, fedAt: null, productReady: false, cyclesRemaining: newCyclesRemaining, cyclesCompletedTotal: totalCompleted, age: isElder ? 'elder' : a.age } : a
        );
        const { xp: newXp, level: newLevel } = levelUpCheck(state.xp + additionalXp, state.level);
        set({ barn: newBarn, animals: newAnimals, xp: newXp, level: newLevel, coins: state.coins + additionalCoins, gems: state.gems + additionalGems, codex: newCodex });
      },

      feedAllAnimals: () => {
        const state = get();
        let feedAvailable = state.silo.feed || 0;
        if (feedAvailable <= 0) return;
        const newAnimals = state.animals.map(a => {
          // Skip if already fed, producing, or elder
          if (a.fed || a.productReady || a.age === 'elder') return a;
          const feedNeeded = ANIMALS[a.species].feedPerCycle;
          if (feedAvailable < feedNeeded) return a;
          feedAvailable -= feedNeeded;
          return { ...a, fed: true, fedAt: Date.now() };
        });
        const feedUsed = (state.silo.feed || 0) - feedAvailable;
        if (feedUsed === 0) return;
        set({
          silo: { ...state.silo, feed: feedAvailable },
          animals: newAnimals,
        });
      },

      collectAllProducts: () => {
        const state = get();
        const newBarn = { ...state.barn };
        let collectedCount = 0;
        let additionalCoins = 0;
        let additionalGems = 0;
        let additionalXp = 0;
        const newCodex = { ...state.codex };

        const newAnimals = state.animals.map(a => {
          if (!a.productReady || a.cyclesRemaining <= 0) return a;

          const breedDef = BREED_REGISTRY[a.breedId];
          const speciesDef = ANIMALS[a.species];

          // 1. Primary Product Yield
          if (breedDef) {
            newBarn[breedDef.primaryProductKey] = (newBarn[breedDef.primaryProductKey] || 0) + breedDef.baseYieldAmount;
          } else {
            newBarn[speciesDef.product] = (newBarn[speciesDef.product] || 0) + speciesDef.productYield;
          }

          // 2. Secondary Bonus Drop Procs
          if (breedDef?.bonusDrop && Math.random() < breedDef.bonusDrop.chance) {
            if (breedDef.bonusDrop.itemKey) {
              newBarn[breedDef.bonusDrop.itemKey] = (newBarn[breedDef.bonusDrop.itemKey] || 0) + 1;
            }
            if (breedDef.bonusDrop.directCoins) {
              additionalCoins += breedDef.bonusDrop.directCoins;
            }
          }

          // 3. Gem Milestones
          const totalCompleted = a.cyclesCompletedTotal + 1;
          if (breedDef?.gemMilestoneEveryN && totalCompleted % breedDef.gemMilestoneEveryN === 0) {
            additionalGems += a.species === 'pig' ? 2 : 1;
          }

          // 4. Codex Discovery
          const codexKey = a.breedId;
          if (!newCodex[codexKey]) {
            newCodex[codexKey] = true;
            if (breedDef) additionalGems += breedDef.codexGemReward;
          }

          // 5. Tier-based XP
          additionalXp += a.tier === 'legendary' ? 25 : a.tier === 'rare' ? 15 : a.tier === 'uncommon' ? 8 : 5;

          const newCyclesRemaining = a.cyclesRemaining - 1;
          const isElder = newCyclesRemaining <= 0;
          collectedCount++;
          return { ...a, fed: false, fedAt: null, productReady: false, cyclesRemaining: newCyclesRemaining, cyclesCompletedTotal: totalCompleted, age: isElder ? 'elder' : a.age };
        });
        if (collectedCount === 0) return;
        const { xp: newXp, level: newLevel } = levelUpCheck(state.xp + additionalXp, state.level);
        set({ barn: newBarn, animals: newAnimals, xp: newXp, level: newLevel, coins: state.coins + additionalCoins, gems: state.gems + additionalGems, codex: newCodex });
      },

      buyAnimal: (species, tier = 'common' as Tier) => {
        const state = get();
        const def = ANIMALS[species];
        const currentCount = state.animals.filter(a => a.species === species).length;
        if (currentCount >= (state.animalCapacity[species] || def.capacity)) return;
        const costs: Record<AnimalSpecies, number> = { chicken: 50, cow: 150, sheep: 200, pig: 300 };
        const tierMult: Record<Tier, number> = { common: 1, uncommon: 1.5, rare: 2.5, legendary: 5 };
        const cost = Math.floor(costs[species] * tierMult[tier]);
        if (state.coins < cost) return;

        // Use breed registry for max cycles
        const breedId = `${species}_${tier}`;
        const breedDef = BREED_REGISTRY[breedId];
        const maxCycles = breedDef ? breedDef.maxCycles : randomMaxCycles(tier);

        const newAnimal: AnimalInstance = {
          id: generateId(),
          species,
          tier,
          breedId,
          fed: false,
          fedAt: null,
          productReady: false,
          age: 'adult',
          maxCycles,
          cyclesRemaining: maxCycles,
          cyclesCompletedTotal: 0,
        };
        set({
          coins: state.coins - cost,
          animals: [...state.animals, newAnimal],
          codex: { ...state.codex, [breedId]: true },
        });
      },

      sellAnimal: (animalId) => {
        const state = get();
        const animal = state.animals.find(a => a.id === animalId);
        if (!animal || animal.age !== 'elder') return; // only elder animals can be sold

        // Use breed-specific elder market value from BREED_REGISTRY
        const breedDef = BREED_REGISTRY[animal.breedId];
        let sellPrice: number;
        if (breedDef) {
          // Proportional price based on cycles completed vs max
          const cyclesCompleted = animal.maxCycles - animal.cyclesRemaining;
          if (cyclesCompleted <= 0) sellPrice = 0;
          else if (animal.cyclesRemaining <= 0) sellPrice = breedDef.elderMarketValue;
          else sellPrice = Math.floor(breedDef.elderMarketValue * (cyclesCompleted / animal.maxCycles));
        } else {
          sellPrice = livestockSellPriceForAnimal(animal.species, animal.tier, animal.cyclesRemaining, animal.maxCycles);
        }

        const newAnimals = state.animals.filter(a => a.id !== animalId);
        set({
          animals: newAnimals,
          coins: state.coins + sellPrice,
        });
      },

      sellAllElderAnimals: () => {
        const state = get();
        const elders = state.animals.filter(a => a.age === 'elder');
        if (elders.length === 0) return;
        let totalCoins = 0;
        for (const animal of elders) {
          const breedDef = BREED_REGISTRY[animal.breedId];
          if (breedDef) {
            const cyclesCompleted = animal.maxCycles - animal.cyclesRemaining;
            if (cyclesCompleted <= 0) { /* no coins */ }
            else if (animal.cyclesRemaining <= 0) totalCoins += breedDef.elderMarketValue;
            else totalCoins += Math.floor(breedDef.elderMarketValue * (cyclesCompleted / animal.maxCycles));
          } else {
            totalCoins += livestockSellPriceForAnimal(animal.species, animal.tier, animal.cyclesRemaining, animal.maxCycles);
          }
        }
        const newAnimals = state.animals.filter(a => a.age !== 'elder');
        set({
          animals: newAnimals,
          coins: state.coins + totalCoins,
        });
      },

      startProduction: (buildingId, recipe) => {
        const state = get();
        const building = BUILDINGS[buildingId];
        if (!building) return;
        if (building.unlockLevel && state.level < building.unlockLevel) return;
        const queue = state.productionQueues[buildingId] || [];
        if (queue.filter(s => !s.done).length >= building.queueSlots) return;

        const newSilo = { ...state.silo };
        const newBarn = { ...state.barn };
        for (const input of recipe.inputs) {
          const isCrop = input.productId in CROPS || input.productId === 'feed' || input.productId === 'cotton' || input.productId === 'honey_comb' || input.productId === 'wild_berries' || input.productId === 'gold_nugget';
          const storage = isCrop ? newSilo : newBarn;
          if ((storage[input.productId] || 0) < input.qty) return;
          storage[input.productId] = (storage[input.productId] || 0) - input.qty;
        }

        const newSlot: ProductionSlot = {
          recipeId: recipe.id,
          recipeName: recipe.name,
          recipeEmoji: recipe.emoji,
          startedAt: Date.now(),
          durationSec: recipe.timeSec,
          done: false,
        };

        set({
          silo: newSilo,
          barn: newBarn,
          productionQueues: {
            ...state.productionQueues,
            [buildingId]: [...queue, newSlot],
          },
        });
      },

      collectProduction: (buildingId, slotIndex) => {
        const state = get();
        const queue = state.productionQueues[buildingId] || [];
        const slot = queue[slotIndex];
        if (!slot || !slot.done) return;

        let outputItem = '';
        let outputQty = 0;
        const building = BUILDINGS[buildingId];
        for (const recipe of building.recipes) {
          if (recipe.id === slot.recipeId) {
            outputItem = recipe.output.productId;
            outputQty = recipe.output.qty;
            break;
          }
        }
        if (!outputItem) return;

        const isCropOutput = outputItem in CROPS || outputItem === 'feed' || outputItem === 'cotton' || outputItem === 'honey_comb' || outputItem === 'wild_berries' || outputItem === 'gold_nugget';
        const newSilo = { ...state.silo };
        const newBarn = { ...state.barn };
        if (isCropOutput) {
          newSilo[outputItem] = (newSilo[outputItem] || 0) + outputQty;
        } else {
          newBarn[outputItem] = (newBarn[outputItem] || 0) + outputQty;
        }

        const newQueue = queue.filter((_, i) => i !== slotIndex);
        const { xp: newXp, level: newLevel } = levelUpCheck(state.xp + 8, state.level);
        set({
          silo: newSilo,
          barn: newBarn,
          productionQueues: {
            ...state.productionQueues,
            [buildingId]: newQueue,
          },
          xp: newXp,
          level: newLevel,
        });
      },

      startProductionAll: (buildingId, recipe) => {
        const state = get();
        const building = BUILDINGS[buildingId];
        if (!building) return;
        if (building.unlockLevel && state.level < building.unlockLevel) return;
        const queue = state.productionQueues[buildingId] || [];
        const freeSlots = building.queueSlots - queue.filter(s => !s.done).length;
        if (freeSlots <= 0) return;

        // Figure out how many times we can afford to craft this recipe
        const newSilo = { ...state.silo };
        const newBarn = { ...state.barn };
        let craftCount = 0;
        for (let i = 0; i < freeSlots; i++) {
          let canAfford = true;
          for (const input of recipe.inputs) {
            const isCrop = input.productId in CROPS || input.productId === 'feed' || input.productId === 'cotton' || input.productId === 'honey_comb' || input.productId === 'wild_berries' || input.productId === 'gold_nugget';
            const storage = isCrop ? newSilo : newBarn;
            if ((storage[input.productId] || 0) < input.qty) {
              canAfford = false;
              break;
            }
          }
          if (!canAfford) break;
          // Deduct inputs
          for (const input of recipe.inputs) {
            const isCrop = input.productId in CROPS || input.productId === 'feed' || input.productId === 'cotton' || input.productId === 'honey_comb' || input.productId === 'wild_berries' || input.productId === 'gold_nugget';
            const storage = isCrop ? newSilo : newBarn;
            storage[input.productId] = (storage[input.productId] || 0) - input.qty;
          }
          craftCount++;
        }
        if (craftCount === 0) return;

        // Queue all slots (stagger start times slightly so they don't all finish at once)
        const now = Date.now();
        const newSlots: ProductionSlot[] = [];
        for (let i = 0; i < craftCount; i++) {
          newSlots.push({
            recipeId: recipe.id,
            recipeName: recipe.name,
            recipeEmoji: recipe.emoji,
            startedAt: now + i * 100, // stagger by 100ms
            durationSec: recipe.timeSec,
            done: false,
          });
        }

        set({
          silo: newSilo,
          barn: newBarn,
          productionQueues: {
            ...state.productionQueues,
            [buildingId]: [...queue, ...newSlots],
          },
        });
      },

      collectProductionAll: (buildingId) => {
        const state = get();
        const building = BUILDINGS[buildingId];
        if (!building) return;
        const queue = state.productionQueues[buildingId] || [];

        const newSilo = { ...state.silo };
        const newBarn = { ...state.barn };
        let collectedCount = 0;
        const newQueue: ProductionSlot[] = [];

        for (const slot of queue) {
          if (slot.done) {
            let outputItem = '';
            let outputQty = 0;
            for (const recipe of building.recipes) {
              if (recipe.id === slot.recipeId) {
                outputItem = recipe.output.productId;
                outputQty = recipe.output.qty;
                break;
              }
            }
            if (outputItem) {
              const isCropOutput = outputItem in CROPS || outputItem === 'feed' || outputItem === 'cotton' || outputItem === 'honey_comb' || outputItem === 'wild_berries' || outputItem === 'gold_nugget';
              if (isCropOutput) {
                newSilo[outputItem] = (newSilo[outputItem] || 0) + outputQty;
              } else {
                newBarn[outputItem] = (newBarn[outputItem] || 0) + outputQty;
              }
              collectedCount++;
            }
          } else {
            newQueue.push(slot);
          }
        }

        if (collectedCount === 0) return;
        const { xp: newXp, level: newLevel } = levelUpCheck(state.xp + 8 * collectedCount, state.level);
        set({
          silo: newSilo,
          barn: newBarn,
          productionQueues: {
            ...state.productionQueues,
            [buildingId]: newQueue,
          },
          xp: newXp,
          level: newLevel,
        });
      },

      fulfillOrder: (orderId) => {
        const state = get();
        const order = state.orders.find(o => o.id === orderId);
        if (!order) return;

        const newSilo = { ...state.silo };
        const newBarn = { ...state.barn };
        for (const item of order.requested) {
          const isCrop = item.itemId in CROPS || item.itemId === 'feed' || item.itemId === 'cotton' || item.itemId === 'honey_comb' || item.itemId === 'wild_berries' || item.itemId === 'gold_nugget';
          const storage = isCrop ? newSilo : newBarn;
          if ((storage[item.itemId] || 0) < item.qty) return;
          storage[item.itemId] = (storage[item.itemId] || 0) - item.qty;
        }

        const { xp: newXp, level: newLevel } = levelUpCheck(state.xp + order.xpReward, state.level);

        const newTemplate = ORDER_TEMPLATES[Math.floor(Math.random() * ORDER_TEMPLATES.length)];
        const newOrders = state.orders.map(o =>
          o.id === orderId
            ? { id: generateId(), ...newTemplate, trashedAt: null }
            : o
        );

        set({
          silo: newSilo,
          barn: newBarn,
          coins: state.coins + order.coinReward,
          xp: newXp,
          level: newLevel,
          orders: newOrders,
        });
      },

      trashOrder: (orderId) => {
        const state = get();
        const newTemplate = ORDER_TEMPLATES[Math.floor(Math.random() * ORDER_TEMPLATES.length)];
        const newOrders = state.orders.map(o =>
          o.id === orderId
            ? { id: generateId(), ...newTemplate, trashedAt: null }
            : o
        );
        set({ orders: newOrders });
      },

      sellItem: (itemId, qty) => {
        const state = get();
        const isCrop = itemId in CROPS || itemId === 'feed' || itemId === 'cotton' || itemId === 'honey_comb' || itemId === 'wild_berries' || itemId === 'gold_nugget';
        const storage = isCrop ? state.silo : state.barn;
        const available = storage[itemId] || 0;
        if (available < qty) return;
        // Determine sell price
        let sellPrice = 1;
        if (itemId in CROPS) {
          const cropDef = CROPS[itemId as CropId];
          sellPrice = Math.max(1, Math.floor(cropDef.seedCost / 2) + 1);
        } else {
          const product = PRODUCTS[itemId as keyof typeof PRODUCTS];
          if (product) sellPrice = product.sellPrice;
        }
        if (isCrop) {
          set({ silo: { ...state.silo, [itemId]: available - qty }, coins: state.coins + sellPrice * qty });
        } else {
          set({ barn: { ...state.barn, [itemId]: available - qty }, coins: state.coins + sellPrice * qty });
        }
      },

      sellAllOfItem: (itemId) => {
        const state = get();
        const isCrop = itemId in CROPS || itemId === 'feed' || itemId === 'cotton' || itemId === 'honey_comb' || itemId === 'wild_berries' || itemId === 'gold_nugget';
        const storage = isCrop ? state.silo : state.barn;
        const qty = storage[itemId] || 0;
        if (qty <= 0) return;
        let sellPrice = 1;
        if (itemId in CROPS) {
          const cropDef = CROPS[itemId as CropId];
          sellPrice = Math.max(1, Math.floor(cropDef.seedCost / 2) + 1);
        } else {
          const product = PRODUCTS[itemId as keyof typeof PRODUCTS];
          if (product) sellPrice = product.sellPrice;
        }
        if (isCrop) {
          set({ silo: { ...state.silo, [itemId]: 0 }, coins: state.coins + sellPrice * qty });
        } else {
          set({ barn: { ...state.barn, [itemId]: 0 }, coins: state.coins + sellPrice * qty });
        }
      },

      sellAllItems: () => {
        const state = get();
        // Items excluded from shop (wheat, corn, feed are essential resources)
        const SHOP_HIDDEN = new Set(['wheat', 'corn', 'feed']);
        let totalCoins = 0;
        const newSilo = { ...state.silo };
        const newBarn = { ...state.barn };
        // Sell all silo items (crops + extras), skip hidden
        for (const [id, def] of Object.entries(CROPS)) {
          if (SHOP_HIDDEN.has(id)) continue;
          const qty = newSilo[id] || 0;
          if (qty > 0) {
            const sellPrice = Math.max(1, Math.floor(def.seedCost / 2) + 1);
            totalCoins += sellPrice * qty;
            newSilo[id] = 0;
          }
        }
        const siloExtras = ['cotton', 'honey_comb', 'wild_berries', 'gold_nugget'];
        for (const id of siloExtras) {
          const qty = newSilo[id] || 0;
          if (qty > 0) {
            const product = PRODUCTS[id as keyof typeof PRODUCTS];
            if (product) {
              totalCoins += product.sellPrice * qty;
              newSilo[id] = 0;
            }
          }
        }
        // Sell all barn items, skip hidden
        for (const [id, def] of Object.entries(PRODUCTS)) {
          if (SHOP_HIDDEN.has(id)) continue;
          const qty = newBarn[id] || 0;
          if (qty > 0) {
            totalCoins += def.sellPrice * qty;
            newBarn[id] = 0;
          }
        }
        if (totalCoins === 0) return;
        set({ silo: newSilo, barn: newBarn, coins: state.coins + totalCoins });
      },

      buyFarmhand: (role) => {
        const state = get();
        const cost = 100;
        if (state.coins < cost) return;
        const fh: FarmhandInstance = { id: generateId(), role, level: 1, xp: 0, equippedOutfit: null };
        set({ coins: state.coins - cost, farmhands: [...state.farmhands, fh] });
      },

      addSilo: (itemId, qty) => {
        const state = get();
        set({ silo: { ...state.silo, [itemId]: (state.silo[itemId] || 0) + qty } });
      },

      addBarn: (itemId, qty) => {
        const state = get();
        set({ barn: { ...state.barn, [itemId]: (state.barn[itemId] || 0) + qty } });
      },

      // Fishery
      unlockFisheryZone: (zoneId) => {
        const state = get();
        if (state.fishery.unlockedZones.includes(zoneId)) return;
        const zone = WATER_ZONES[zoneId];
        if (state.level < zone.unlockLevel) return;
        if (zone.unlockCostCoins && state.coins < zone.unlockCostCoins) return;
        if (zone.unlockCostGems && state.gems < zone.unlockCostGems) return;
        set({
          coins: zone.unlockCostCoins ? state.coins - zone.unlockCostCoins : state.coins,
          gems: zone.unlockCostGems ? state.gems - zone.unlockCostGems : state.gems,
          fishery: {
            ...state.fishery,
            unlockedZones: [...state.fishery.unlockedZones, zoneId],
            lastCatchTimestamps: { ...state.fishery.lastCatchTimestamps, [zoneId]: Date.now() },
          },
        });
      },

      upgradeFishingRod: () => {
        const state = get();
        const currentIdx = ROD_TIER_ORDER.indexOf(state.fishery.rodTier);
        if (currentIdx >= ROD_TIER_ORDER.length - 1) return;
        const nextTier = ROD_TIER_ORDER[currentIdx + 1];
        const nextDef = ROD_TIERS[nextTier];
        if (state.level < nextDef.unlockLevel) return;
        if (state.coins < nextDef.costCoins) return;
        set({
          coins: state.coins - nextDef.costCoins,
          fishery: { ...state.fishery, rodTier: nextTier },
        });
      },

      // Autonomous Workers
      hireAutonomousWorker: (type) => {
        const state = get();
        const def = WORKERS[type];
        const cost = 200;
        if (state.coins < cost) return;
        const worker: AutonomousWorkerInstance = {
          id: generateId(),
          type,
          gearTier: 1,
          autoSell: type === 'merchant',
          lastProduceTime: Date.now(),
        };
        set({ coins: state.coins - cost, autonomousWorkers: [...state.autonomousWorkers, worker] });
      },

      toggleWorkerAutoSell: (workerId) => {
        const state = get();
        const newWorkers = state.autonomousWorkers.map(w =>
          w.id === workerId ? { ...w, autoSell: !w.autoSell } : w
        );
        set({ autonomousWorkers: newWorkers });
      },

      upgradeWorkerGear: (workerId) => {
        const state = get();
        const worker = state.autonomousWorkers.find(w => w.id === workerId);
        if (!worker) return;
        const def = WORKERS[worker.type];
        if (worker.gearTier >= def.gearTiers.length) return;
        const nextGear = def.gearTiers[worker.gearTier]; // 0-indexed, gearTier is 1-indexed
        if (state.coins < nextGear.costCoins || state.gems < nextGear.costGems) return;
        const newWorkers = state.autonomousWorkers.map(w =>
          w.id === workerId ? { ...w, gearTier: w.gearTier + 1 } : w
        );
        set({
          coins: state.coins - nextGear.costCoins,
          gems: state.gems - nextGear.costGems,
          autonomousWorkers: newWorkers,
        });
      },

      // Unified Workers (v2.0)
      hireUnifiedWorker: (role) => {
        const state = get();
        const cfg = WORKER_REGISTRY[role];
        if (state.level < cfg.unlockLevel) return;
        if (state.coins < cfg.baseCost) return;
        const now = Date.now();
        const newWorkers = { ...state.unifiedWorkers };
        newWorkers[role] = {
          role,
          isHired: true,
          level: 1,
          autoSell: role === 'merchant',
          lastActionTimestamp: now,
          bufferCount: 0,
          stats: { totalCoinsEarned: 0, totalItemsProduced: 0, totalGemsEarned: 0 },
        };
        set({ coins: state.coins - cfg.baseCost, unifiedWorkers: newWorkers });
      },

      upgradeUnifiedWorker: (role, levelsToBuy) => {
        const state = get();
        const worker = state.unifiedWorkers[role];
        if (!worker || !worker.isHired) return;
        if (worker.level >= WORKER_MAX_LEVEL) return;
        const actualLevels = Math.min(levelsToBuy, WORKER_MAX_LEVEL - worker.level);
        if (actualLevels <= 0) return;
        // Calculate total cost
        let totalCost = 0;
        for (let i = 0; i < actualLevels; i++) {
          totalCost += workerUpgradeCost(role, worker.level + i);
        }
        if (state.coins < totalCost) return;
        const newWorkers = { ...state.unifiedWorkers };
        newWorkers[role] = { ...worker, level: worker.level + actualLevels };
        set({ coins: state.coins - totalCost, unifiedWorkers: newWorkers });
      },

      toggleUnifiedWorkerMode: (role) => {
        const state = get();
        const worker = state.unifiedWorkers[role];
        if (!worker || !worker.isHired) return;
        const newWorkers = { ...state.unifiedWorkers };
        newWorkers[role] = { ...worker, autoSell: !worker.autoSell };
        set({ unifiedWorkers: newWorkers });
      },

      bulkUpgradeUnifiedWorker: (role, mode) => {
        const state = get();
        const worker = state.unifiedWorkers[role];
        if (!worker || !worker.isHired) return;
        const result = calculateBulkUpgrade(role, worker.level, mode, state.coins);
        if (result.levelsToBuy <= 0) return;
        const newWorkers = { ...state.unifiedWorkers };
        newWorkers[role] = { ...worker, level: worker.level + result.levelsToBuy };
        set({ coins: state.coins - result.totalCost, unifiedWorkers: newWorkers });
      },

      // Outfits
      equipOutfit: (farmhandId, outfitId) => {
        const state = get();
        const newFarmhands = state.farmhands.map(fh =>
          fh.id === farmhandId ? { ...fh, equippedOutfit: outfitId } : fh
        );
        set({ farmhands: newFarmhands });
      },

      // Events
      shooCrow: () => {
        const state = get();
        if (!state.activeEvent || state.activeEvent.type !== 'crow_attack') return;
        set({ activeEvent: null });
      },

      fulfillChefOrder: () => {
        const state = get();
        if (!state.activeEvent || state.activeEvent.type !== 'vip_chef' || !state.activeEvent.chefOrder) return;
        const order = state.activeEvent.chefOrder;

        const newSilo = { ...state.silo };
        const newBarn = { ...state.barn };
        for (const item of order.requested) {
          const isCrop = item.itemId in CROPS || item.itemId === 'feed' || item.itemId === 'cotton' || item.itemId === 'honey_comb' || item.itemId === 'wild_berries' || item.itemId === 'gold_nugget';
          const storage = isCrop ? newSilo : newBarn;
          if ((storage[item.itemId] || 0) < item.qty) return;
          storage[item.itemId] = (storage[item.itemId] || 0) - item.qty;
        }

        const { xp: newXp, level: newLevel } = levelUpCheck(state.xp + order.xpReward, state.level);
        set({
          silo: newSilo,
          barn: newBarn,
          coins: state.coins + order.coinReward,
          gems: state.gems + order.gemReward,
          xp: newXp,
          level: newLevel,
          activeEvent: null,
        });
      },

      openSmugglerCrate: () => {
        const state = get();
        if (!state.activeEvent || state.activeEvent.type !== 'smuggler') return;
        if ((state.activeEvent.smugglerCrates || 0) <= 0) return;

        const loot = rollSmugglerLoot();
        const newSilo = { ...state.silo };
        const newBarn = { ...state.barn };
        let newCoins = state.coins;
        let newGems = state.gems;

        if (loot.itemId === 'gems') {
          newGems += loot.qty;
        } else {
          const product = PRODUCTS[loot.itemId as keyof typeof PRODUCTS];
          if (product) {
            const isCrop = loot.itemId in CROPS || loot.itemId === 'feed' || loot.itemId === 'cotton' || loot.itemId === 'honey_comb' || loot.itemId === 'wild_berries' || loot.itemId === 'gold_nugget';
            if (isCrop) {
              newSilo[loot.itemId] = (newSilo[loot.itemId] || 0) + loot.qty;
            } else {
              newBarn[loot.itemId] = (newBarn[loot.itemId] || 0) + loot.qty;
            }
          }
        }

        const newCrates = (state.activeEvent.smugglerCrates || 1) - 1;
        set({
          silo: newSilo,
          barn: newBarn,
          coins: newCoins,
          gems: newGems,
          activeEvent: newCrates <= 0 ? null : { ...state.activeEvent, smugglerCrates: newCrates },
        });
      },

      // Breeding
      breedAnimals: (parent1Id, parent2Id) => {
        const state = get();
        const parent1 = state.animals.find(a => a.id === parent1Id);
        const parent2 = state.animals.find(a => a.id === parent2Id);
        if (!parent1 || !parent2) return;
        if (parent1.species !== parent2.species) return;
        if (state.activeBreedings.length >= state.breedingSlots) return;

        // Determine offspring tier based on parent tiers
        const tierOrder: Tier[] = ['common', 'uncommon', 'rare', 'legendary'];
        const maxTierIdx = Math.max(tierOrder.indexOf(parent1.tier), tierOrder.indexOf(parent2.tier));
        let offspringTier: Tier;
        // 30% chance to breed UP a tier
        if (Math.random() < 0.3 && maxTierIdx < tierOrder.length - 1) {
          offspringTier = tierOrder[maxTierIdx + 1];
        } else {
          offspringTier = tierOrder[maxTierIdx];
        }
        const offspringBreedId = `${parent1.species}_${offspringTier}`;

        const breeding: ActiveBreeding = {
          id: generateId(),
          species: parent1.species,
          parent1Id,
          parent2Id,
          startedAt: Date.now(),
          durationMs: 120000, // 2 min
        };

        // Mark parents as unavailable (fed state)
        const newAnimals = state.animals.map(a => {
          if (a.id === parent1Id || a.id === parent2Id) {
            return { ...a, fed: true, fedAt: Date.now() };
          }
          return a;
        });

        set({
          animals: newAnimals,
          activeBreedings: [...state.activeBreedings, breeding],
          codex: { ...state.codex, [offspringBreedId]: true },
        });
      },

      upgradeBreedingSlot: () => {
        const state = get();
        const nextSlot = state.breedingSlots + 1;
        const upgrade = BREEDING_SLOT_UPGRADES.find(u => u.slotIndex === nextSlot);
        if (!upgrade) return;
        if (state.level < upgrade.unlockLevel) return;
        if (state.gems < upgrade.costGems) return;
        set({
          gems: state.gems - upgrade.costGems,
          breedingSlots: nextSlot,
        });
      },

      // Wilderness
      launchExpedition: (biomeId, farmhandId, lureId) => {
        const state = get();
        const biome = BIOMES[biomeId];
        if (!biome) return;
        // Check level unlock
        if (state.level < biome.unlockLevel) return;
        // Check dispatch fee
        if (state.coins < biome.dispatchFee) return;
        // Check farmhand exists and isn't already on an expedition
        const farmhand = state.farmhands.find(fh => fh.id === farmhandId);
        if (!farmhand) return;
        const isBusy = state.wilderness.activeExpeditions.some(e => e.farmhandId === farmhandId);
        if (isBusy) return;
        // Check lure exists in barn
        const lureDef = LURES[lureId];
        if (!lureDef) return;
        const lureQty = state.barn[lureDef.productId] || 0;
        if (lureQty < 1) return;

        const lure = LURES[lureId];
        const durationMs = Math.floor(biome.baseDurationMs * lure.timeMultiplier);

        const newExpedition: ActiveExpedition = {
          id: generateId(),
          biomeId,
          farmhandId,
          lureId,
          startedAt: Date.now(),
          durationMs,
          midpointResolved: false,
          pendingChoice: null,
          riskyChosen: null,
        };

        // Consume lure and dispatch fee
        const newBarn = { ...state.barn, [lureDef.productId]: lureQty - 1 };

        set({
          coins: state.coins - biome.dispatchFee,
          barn: newBarn,
          wilderness: {
            ...state.wilderness,
            activeExpeditions: [...state.wilderness.activeExpeditions, newExpedition],
          },
        });
      },

      resolveExpeditionChoice: (expeditionId, chooseRisky) => {
        const state = get();
        const expedition = state.wilderness.activeExpeditions.find(e => e.id === expeditionId);
        if (!expedition || !expedition.pendingChoice) return;
        
        const updatedExpeditions = state.wilderness.activeExpeditions.map(e => {
          if (e.id === expeditionId) {
            return { ...e, midpointResolved: true, pendingChoice: null, riskyChosen: chooseRisky };
          }
          return e;
        });
        
        set({
          wilderness: {
            ...state.wilderness,
            activeExpeditions: updatedExpeditions,
          },
        });
      },

      // Habitat
      upgradeHabitat: (species) => {
        const state = get();
        const currentStep = state.habitatUpgradeSteps[species] || 0;
        const nextUpgrade = HABITAT_UPGRADES.find(u => u.species === species && u.step === currentStep + 1);
        if (!nextUpgrade) return;
        if (state.coins < nextUpgrade.costCoins) return;
        set({
          coins: state.coins - nextUpgrade.costCoins,
          animalCapacity: { ...state.animalCapacity, [species]: (state.animalCapacity[species] || ANIMALS[species].capacity) + nextUpgrade.additionalCapacity },
          habitatUpgradeSteps: { ...state.habitatUpgradeSteps, [species]: currentStep + 1 },
        });
      },

      // ---- Territory Expansion Actions ----

      unlockParcel: (parcelId) => {
        const state = get();
        const target = state.parcels[parcelId];
        const config = PARCEL_CONFIGS[parcelId];
        if (!target || target.isUnlocked) return;
        if (state.level < config.levelReq || state.coins < config.coinCost) return;

        const newParcels = {
          ...state.parcels,
          [parcelId]: {
            ...target,
            isUnlocked: true,
            unlockedAt: Date.now(),
          },
        };

        set({
          coins: state.coins - config.coinCost,
          parcels: newParcels,
        });

        // Recalculate estate aura after unlocking
        const parcelsClaimed = Object.values(newParcels).filter(p => p.isUnlocked).length;
        set({ currentEstateAura: getEstateAura(parcelsClaimed) });
      },

      startClearingDebris: (parcelId, debrisId) => {
        const state = get();
        const parcel = state.parcels[parcelId];
        if (!parcel || !parcel.isUnlocked) return;

        const debris = parcel.debris.find(d => d.id === debrisId);
        if (!debris || debris.cleared || debris.clearingStartedAt) return;
        if (state.coins < debris.clearCost) return;

        const updatedDebris = parcel.debris.map(d =>
          d.id === debrisId ? { ...d, clearingStartedAt: Date.now() } : d
        );

        set({
          coins: state.coins - debris.clearCost,
          parcels: {
            ...state.parcels,
            [parcelId]: { ...parcel, debris: updatedDebris },
          },
        });
      },

      acceptFreightContract: () => {
        const state = get();
        const contract = state.activeFreightContract;
        if (!contract || contract.acceptedAt || contract.completed) return;
        if (state.coins < contract.entryDeposit) return;

        // Check if Shipping Basin is unlocked
        const portUnlocked = state.parcels.parcel_port_basin?.isUnlocked;
        if (!portUnlocked) return;

        // Find the matching template to get delivery window
        const template = FREIGHT_CONTRACT_TEMPLATES.find(t => t.title === contract.title);
        const deliveryWindowMs = template?.durationMs || 8 * 60 * 60 * 1000;

        set({
          coins: state.coins - contract.entryDeposit,
          activeFreightContract: {
            ...contract,
            acceptedAt: Date.now(),
            expiresAt: Date.now() + deliveryWindowMs, // Reset expiry to delivery window
          },
        });
      },

      fulfillFreightContract: () => {
        const state = get();
        const contract = state.activeFreightContract;
        if (!contract || !contract.acceptedAt || contract.completed) return;

        // Check if all requirements are met
        const newSilo = { ...state.silo };
        const newBarn = { ...state.barn };
        for (const req of contract.requirements) {
          const isCrop = req.itemId in CROPS || req.itemId === 'feed' || req.itemId === 'cotton' || req.itemId === 'honey_comb' || req.itemId === 'wild_berries' || req.itemId === 'gold_nugget';
          const storage = isCrop ? newSilo : newBarn;
          if ((storage[req.itemId] || 0) < req.qty) return; // Not enough items
          storage[req.itemId] = (storage[req.itemId] || 0) - req.qty;
        }

        // Contract fulfilled! Award rewards
        const { xp: newXp, level: newLevel } = levelUpCheck(state.xp + 50, state.level);
        set({
          silo: newSilo,
          barn: newBarn,
          coins: state.coins + contract.coinReward,
          gems: state.gems + contract.gemReward,
          xp: newXp,
          level: newLevel,
          activeFreightContract: null,
          freightContractRefreshAt: Date.now() + 24 * 60 * 60 * 1000, // Next contract in 24h
        });
      },

      failFreightContract: () => {
        const state = get();
        const contract = state.activeFreightContract;
        if (!contract || !contract.acceptedAt || contract.completed) return;
        // Cargo ship leaves — forfeit entry deposit (already deducted)
        set({
          activeFreightContract: null,
          freightContractRefreshAt: Date.now() + 24 * 60 * 60 * 1000,
        });
      },

      refreshFreightContract: () => {
        const state = get();
        if (state.gems < 10) return; // Costs 10 gems to refresh
        const newContract = generateFreightContract();
        set({
          gems: state.gems - 10,
          activeFreightContract: newContract,
          freightContractRefreshAt: Date.now() + 24 * 60 * 60 * 1000,
        });
      },

      recalculateEstateAura: () => {
        const state = get();
        const parcelsClaimed = Object.values(state.parcels).filter(p => p.isUnlocked).length;
        const newAura = getEstateAura(parcelsClaimed);
        if (newAura.parcelsClaimed !== state.currentEstateAura.parcelsClaimed) {
          set({ currentEstateAura: newAura });
        }
      },

      // Notifications
      addNotification: (message, emoji, type) => {
        const state = get();
        const notification: NotificationItem = {
          id: generateId(),
          message,
          emoji,
          createdAt: Date.now(),
          type,
        };
        const newNotifications = [notification, ...state.notifications].slice(0, 20);
        set({ notifications: newNotifications });
      },

      clearNotifications: () => {
        set({ notifications: [] });
      },

      tick: () => {
        const now = Date.now();
        const state = get();

        // Update plots (with rainstorm boost)
        const rainBoost = state.activeEvent?.type === 'rainstorm' ? 0.5 : 0;
        const newPlots = state.plots.map(p => {
          if (p.crop && p.plantedAt && !p.ready) {
            const elapsed = (now - p.plantedAt) / 1000;
            const effectiveElapsed = rainBoost > 0 ? elapsed * (1 + rainBoost) : elapsed;
            const growTime = CROPS[p.crop].growTimeSec;
            if (effectiveElapsed >= growTime) {
              return { ...p, ready: true };
            }
          }
          return p;
        });

        // Update animal production
        const newAnimals = state.animals.map(a => {
          if (a.fed && a.fedAt && !a.productReady) {
            const elapsed = (now - a.fedAt) / 1000;
            // Use breed-specific production time from BREED_REGISTRY if available
            const breedDef = BREED_REGISTRY[a.breedId];
            const prodTime = breedDef ? breedDef.baseIntervalMs / 1000 : ANIMALS[a.species].productionTimeSec;
            if (elapsed >= prodTime) {
              return { ...a, productReady: true };
            }
          }
          return a;
        });

        // Update production queues
        const newQueues: Record<BuildingId, ProductionSlot[]> = { ...state.productionQueues };
        for (const buildingId of Object.keys(BUILDINGS) as BuildingId[]) {
          const queue = state.productionQueues[buildingId] || [];
          newQueues[buildingId] = queue.map(slot => {
            if (!slot.done) {
              const elapsed = (now - slot.startedAt) / 1000;
              if (elapsed >= slot.durationSec) {
                return { ...slot, done: true };
              }
            }
            return slot;
          });
        }

        // Multi-zone fishery: iterate ALL unlocked zones in parallel
        let newBarn = { ...state.barn };
        let newSilo = { ...state.silo };
        let newGems = state.gems;
        let newCodex = { ...state.codex };
        let newFishCodex = { ...state.fishery.fishCodex };
        const newCatchTimestamps = { ...state.fishery.lastCatchTimestamps };

        // Only catch fish if at least one fisherman exists (farmhand, autonomous, or unified)
        const hasFisherman = state.farmhands.some(f => f.role === 'fisherman') || state.autonomousWorkers.some(w => w.type === 'fisherman') || (state.unifiedWorkers.fisherman?.isHired);

        const rod = ROD_TIERS[state.fishery.rodTier];
        if (hasFisherman) {
        for (const zoneId of state.fishery.unlockedZones) {
          const zone = WATER_ZONES[zoneId];
          const lastCatch = state.fishery.lastCatchTimestamps[zoneId] || 0;
          if (lastCatch === 0) continue;
          const interval = zone.baseIntervalMs * rod.speedMultiplier;
          // Outfit bonus
          const hasSlicker = state.farmhands.some(fh => fh.role === 'fisherman' && fh.equippedOutfit === 'fisherman_slicker');
          const effectiveInterval = hasSlicker ? interval * 0.67 : interval;

          if (now - lastCatch >= effectiveInterval) {
            const catchResult = rollFishCatch(zoneId, state.fishery.rodTier, newFishCodex);
            if (catchResult) {
              const fishDef = FISH_SPECIES[catchResult.speciesId];
              newBarn[fishDef.id] = (newBarn[fishDef.id] || 0) + 1;
              newBarn.fish = (newBarn.fish || 0) + 1;
              const codexKey = `fish_${catchResult.speciesId}`;
              newFishCodex[codexKey] = true;
              newCodex[codexKey] = true;
              if (catchResult.isNew) {
                newGems += fishDef.codexGems;
              }
              // Lanternfish gem bonus
              if (catchResult.speciesId === 'lanternfish') {
                newGems += 1;
              }
            }
            newCatchTimestamps[zoneId] = now;
          }
        }
        } // end if (hasFisherman)

        // Autonomous workers tick (legacy — kept for backward compat, but main logic is unified below)
        let newCoins = state.coins;
        const newWorkers = state.autonomousWorkers.map(w => {
          const def = WORKERS[w.type];
          const gear = def.gearTiers[w.gearTier - 1] || def.gearTiers[0];
          const interval = def.baseIntervalMs * gear.speedMultiplier;

          if (now - w.lastProduceTime >= interval) {
            if (w.type === 'merchant') {
              // Auto-sell: find something in barn to sell
              if (w.autoSell) {
                for (const [itemId, qty] of Object.entries(newBarn)) {
                  if (qty > 1) {
                    const product = PRODUCTS[itemId as keyof typeof PRODUCTS];
                    if (product && product.sellPrice > 0) {
                      const sellQty = Math.min(qty - 1, 3);
                      newBarn[itemId] = (newBarn[itemId] || 0) - sellQty;
                      newCoins += product.sellPrice * sellQty;
                      break;
                    }
                  }
                }
              }
            } else if (def.produces) {
              if (w.autoSell) {
                const product = PRODUCTS[def.produces as keyof typeof PRODUCTS];
                if (product) {
                  newCoins += product.sellPrice * (def.producesQty || 1);
                }
              } else {
                const isSilo = def.produces === 'honey_comb' || def.produces === 'wild_berries' || def.produces === 'gold_nugget' || def.produces === 'cotton';
                if (isSilo) {
                  newSilo[def.produces] = (newSilo[def.produces] || 0) + (def.producesQty || 1);
                } else {
                  newBarn[def.produces] = (newBarn[def.produces] || 0) + (def.producesQty || 1);
                }
              }
            }
            return { ...w, lastProduceTime: now };
          }
          return w;
        });

        // Unified Worker Tick (v2.0) — 13 workers, 120-level scaling
        let unifiedWorkersModified = false;
        const updatedUnifiedWorkers = { ...state.unifiedWorkers };
        for (const role of Object.keys(updatedUnifiedWorkers) as WorkerRole[]) {
          const worker = updatedUnifiedWorkers[role];
          if (!worker || !worker.isHired) continue;

          const cfg = WORKER_REGISTRY[role];
          const effectiveInterval = workerEffectiveInterval(role, worker.level);
          const elapsed = now - worker.lastActionTimestamp;

          if (elapsed >= effectiveInterval) {
            const cycles = Math.min(
              Math.floor(elapsed / effectiveInterval),
              1 + workerHopperBuffer(worker.level) // cap cycles by hopper buffer
            );
            unifiedWorkersModified = true;

            // Update timestamp (keep remainder)
            const newTimestamp = now - (elapsed % effectiveInterval);

            for (let c = 0; c < cycles; c++) {
              // ---- Double/Triple Proc ----
              let multiplier = 1;
              const doubleChance = workerDoubleProcChance(worker.level);
              if (Math.random() < doubleChance) {
                if (workerTripleProcUnlocked(worker.level) && Math.random() < 0.15) {
                  multiplier = 3; // Triple yield!
                } else {
                  multiplier = 2; // Double yield
                }
              }

              // ---- Level 60+ Gem Drop (5% per cycle) ----
              if (workerGemProcUnlocked(worker.level) && Math.random() < 0.05) {
                newGems += 1;
                worker.stats.totalGemsEarned += 1;
              }

              // ---- Dual-Channel Mode Routing ----
              if (worker.autoSell) {
                // AUTO-SELL MODE: Direct coin liquidation
                const payout = workerAutoSellPayout(role, worker.level);
                const earned = payout * multiplier;
                newCoins += earned;
                worker.stats.totalCoinsEarned += earned;
              } else {
                // HOARD MODE: Deposit items to storage
                if (role === 'merchant') {
                  // Merchant in hoard mode: sells silo crops at premium, keeps items
                  // Does nothing in hoard mode — items stay in storage for VIP orders
                } else if (role === 'barn_overseer') {
                  // Barn Overseer in hoard: auto-fills animal troughs
                  const feedNeeded = state.animals.filter(a => !a.fed && !a.productReady).length;
                  if (feedNeeded > 0 && (newSilo.feed || 0) > 0) {
                    const feedToUse = Math.min(feedNeeded, newSilo.feed);
                    newSilo.feed = (newSilo.feed || 0) - feedToUse;
                  }
                } else if (cfg.hoardItem) {
                  // Deposit hoard item to barn or silo
                  const qty = multiplier;
                  if (cfg.hoardIsSilo) {
                    newSilo[cfg.hoardItem] = (newSilo[cfg.hoardItem] || 0) + qty;
                  } else {
                    newBarn[cfg.hoardItem] = (newBarn[cfg.hoardItem] || 0) + qty;
                  }
                  worker.stats.totalItemsProduced += qty;
                }
              }
            }

            // Update the worker instance
            updatedUnifiedWorkers[role] = {
              ...worker,
              lastActionTimestamp: newTimestamp,
              stats: { ...worker.stats },
            };
          }
        }

        // Hourly events: trigger every 60 min
        let newActiveEvent = state.activeEvent;
        let newLastEventTriggerTime = state.lastEventTriggerTime;
        if (!state.activeEvent && now - state.lastEventTriggerTime >= 3600000) {
          const eventTypes: HourlyEventType[] = ['vip_chef', 'crow_attack', 'rainstorm', 'smuggler'];
          const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
          const eventDef = HOURLY_EVENTS[eventType];

          const newEvent: ActiveHourlyEvent = {
            type: eventType,
            startedAt: now,
          };

          if (eventType === 'vip_chef') {
            newEvent.chefOrder = generateChefOrder();
          } else if (eventType === 'crow_attack') {
            // Select 2-3 random growing plots
            const growingPlots = state.plots.filter(p => p.crop && !p.ready);
            const crowCount = Math.min(growingPlots.length, 2 + Math.floor(Math.random() * 2));
            newEvent.crowPlotIds = growingPlots.slice(0, crowCount).map(p => p.id);
          } else if (eventType === 'smuggler') {
            newEvent.smugglerCrates = 1 + Math.floor(Math.random() * 3);
          }

          newActiveEvent = newEvent;
          newLastEventTriggerTime = now;
        }

        // Check if active event has expired
        if (newActiveEvent) {
          const eventDef = HOURLY_EVENTS[newActiveEvent.type];
          if (now - newActiveEvent.startedAt >= eventDef.durationMs) {
            newActiveEvent = null;
          }
        }

        // Breeding completion
        const newActiveBreedings = state.activeBreedings.filter(b => {
          if (now - b.startedAt >= b.durationMs) {
            return false;
          }
          return true;
        });

        // Actually process completed breedings — use parent tiers for proper offspring tier roll
        const completedBreedings = state.activeBreedings.filter(b => now - b.startedAt >= b.durationMs);
        let breedingAnimals = [...newAnimals];
        for (const b of completedBreedings) {
          // Look up parent animals to determine offspring tier properly
          const parent1 = breedingAnimals.find(a => a.id === b.parent1Id);
          const parent2 = breedingAnimals.find(a => a.id === b.parent2Id);
          const tierOrder: Tier[] = ['common', 'uncommon', 'rare', 'legendary'];
          let offspringTier: Tier;
          if (parent1 && parent2) {
            const maxTierIdx = Math.max(tierOrder.indexOf(parent1.tier), tierOrder.indexOf(parent2.tier));
            if (Math.random() < 0.3 && maxTierIdx < tierOrder.length - 1) {
              offspringTier = tierOrder[maxTierIdx + 1];
            } else {
              offspringTier = tierOrder[maxTierIdx];
            }
          } else {
            // Fallback if parents not found
            offspringTier = Math.random() < 0.3 ? 'uncommon' : 'common';
          }
          const offspringBreedId = `${b.species}_${offspringTier}`;
          const breedDef = BREED_REGISTRY[offspringBreedId];
          const offspringMaxCycles = breedDef ? breedDef.maxCycles : randomMaxCycles(offspringTier);
          const newAnimal: AnimalInstance = {
            id: generateId(),
            species: b.species,
            tier: offspringTier,
            breedId: offspringBreedId,
            fed: false,
            fedAt: null,
            productReady: false,
            age: 'baby',
            maxCycles: offspringMaxCycles,
            cyclesRemaining: offspringMaxCycles,
            cyclesCompletedTotal: 0,
          };
          breedingAnimals.push(newAnimal);
          // Reset parents
          breedingAnimals = breedingAnimals.map(a => {
            if (a.id === b.parent1Id || a.id === b.parent2Id) {
              return { ...a, fed: false, fedAt: null };
            }
            return a;
          });
          newCodex[offspringBreedId] = true;
        }

    // --- Expedition Processing ---
    const currentWilderness = get().wilderness;
    let expeditionsToUpdate = [...currentWilderness.activeExpeditions];
    let animalsToAdd: AnimalInstance[] = [];
    let gemBonuses = 0;
    let codexUpdates: Record<string, boolean> = {};
    let notificationsToAdd: { message: string; emoji: string; type: string }[] = [];
    let coinsFromExpeditions = 0;
    const stateForExpedition = get();

    expeditionsToUpdate = expeditionsToUpdate.map(expedition => {
      const elapsed = now - expedition.startedAt;

      // 1. Trigger midpoint encounter
      if (elapsed >= expedition.durationMs * 0.5 && !expedition.midpointResolved && !expedition.pendingChoice) {
        const encounter = TRAIL_ENCOUNTERS[Math.floor(Math.random() * TRAIL_ENCOUNTERS.length)];
        return {
          ...expedition,
          pendingChoice: {
            prompt: encounter.prompt,
            safeLabel: encounter.safeLabel,
            riskyLabel: encounter.riskyLabel,
          },
        };
      }

      // 2. Resolve completed expedition
      if (elapsed >= expedition.durationMs && expedition.midpointResolved) {
        const biome = BIOMES[expedition.biomeId];
        const lure = LURES[expedition.lureId];
        
        // Determine outcome based on midpoint choice
        let success = true;
        let tierBoost = 0;
        
        if (expedition.riskyChosen) {
          // Risky path: 40% chance of failure
          if (Math.random() < 0.4) {
            success = false;
          } else {
            tierBoost = 0.15; // boost rare/legendary chances
          }
        }

        if (success) {
          // Weighted random selection from biome species pool
          const pool = biome.speciesPool;
          const totalWeight = pool.reduce((sum, p) => sum + p.weight, 0);
          let roll = Math.random() * totalWeight;
          let selected = pool[0];
          for (const p of pool) {
            roll -= p.weight;
            if (roll <= 0) { selected = p; break; }
          }

          // Apply lure rare/legendary boost - possibly upgrade tier
          const rareChance = lure.rareBoost + tierBoost;
          const legendaryChance = lure.legendaryBoost + (tierBoost * 0.5);
          if (selected.tier === 'common' && Math.random() < rareChance) {
            selected = { ...selected, tier: 'rare' };
          } else if (selected.tier === 'uncommon' && Math.random() < rareChance * 0.7) {
            selected = { ...selected, tier: 'rare' };
          }
          if (selected.tier === 'rare' && Math.random() < legendaryChance) {
            selected = { ...selected, tier: 'legendary' };
          }

          // Check habitat capacity
          const currentCount = stateForExpedition.animals.filter(a => a.species === selected.species).length;
          const maxCapacity = stateForExpedition.animalCapacity[selected.species] || ANIMALS[selected.species].capacity;

          if (currentCount < maxCapacity) {
            const breedId = `${selected.species}_${selected.tier}`;
            const breedDef = BREED_REGISTRY[breedId];
            const maxCycles = breedDef ? breedDef.maxCycles : randomMaxCycles(selected.tier);
            const newAnimal: AnimalInstance = {
              id: generateId(),
              species: selected.species,
              tier: selected.tier,
              breedId,
              fed: false,
              fedAt: null,
              productReady: false,
              age: 'adult',
              maxCycles,
              cyclesRemaining: maxCycles,
              cyclesCompletedTotal: 0,
            };
            animalsToAdd.push(newAnimal);

            // Codex + gems
            const codexKey = breedId;
            if (!stateForExpedition.codex[codexKey]) {
              codexUpdates[codexKey] = true;
              const gemBonus = breedDef ? breedDef.codexGemReward : (selected.tier === 'legendary' ? 50 : selected.tier === 'rare' ? 20 : 5);
              gemBonuses += gemBonus;
            }

            const animalName = ANIMALS[selected.species].name;
            notificationsToAdd.push({
              message: `Rescued ${selected.tier} ${animalName} from ${biome.name}!`,
              emoji: ANIMALS[selected.species].emoji,
              type: 'success',
            });
          } else {
            notificationsToAdd.push({
              message: `${ANIMALS[selected.species].name} habitat full — animal released to wild.`,
              emoji: '\u{1F4AB}',
              type: 'info',
            });
          }
        } else {
          // Failed risky path
          notificationsToAdd.push({
            message: `Expedition to ${biome.name} failed — lure was lost!`,
            emoji: '\u{1F4A8}',
            type: 'warning',
          });
        }

        // Mark as completed (return null to filter out)
        return null as any;
      }

      return expedition;
    }).filter(Boolean);

    // Apply expedition results
    if (animalsToAdd.length > 0 || gemBonuses > 0 || Object.keys(codexUpdates).length > 0 || notificationsToAdd.length > 0) {
      const currentState = get();
      // Unlock biomes based on level
      const unlockedBiomes = { ...currentState.wilderness.unlockedBiomes };
      for (const [biomeId, biome] of Object.entries(BIOMES)) {
        if (currentState.level >= biome.unlockLevel) {
          unlockedBiomes[biomeId as BiomeId] = true;
        }
      }
      
      set({
        animals: [...currentState.animals, ...animalsToAdd],
        gems: currentState.gems + gemBonuses,
        codex: { ...currentState.codex, ...codexUpdates },
        wilderness: {
          unlockedBiomes,
          activeExpeditions: expeditionsToUpdate,
        },
      });

      for (const n of notificationsToAdd) {
        currentState.addNotification(n.message, n.emoji, n.type as any);
      }
    } else {
      // Still need to update expedition state (midpoint choices, biome unlocks)
      const currentState = get();
      const unlockedBiomes = { ...currentState.wilderness.unlockedBiomes };
      for (const [biomeId, biome] of Object.entries(BIOMES)) {
        if (currentState.level >= biome.unlockLevel) {
          unlockedBiomes[biomeId as BiomeId] = true;
        }
      }
      
      if (expeditionsToUpdate !== currentWilderness.activeExpeditions || unlockedBiomes !== currentWilderness.unlockedBiomes) {
        set({
          wilderness: {
            unlockedBiomes,
            activeExpeditions: expeditionsToUpdate,
          },
        });
      }
    }

        // --- Territory Expansion Tick ---
        // 1. Process debris clearing timers
        let parcelsUpdated = { ...state.parcels };
        let parcelsChanged = false;
        for (const parcelId of Object.keys(parcelsUpdated) as ParcelId[]) {
          const parcel = parcelsUpdated[parcelId];
          const updatedDebris = parcel.debris.map(d => {
            if (d.clearingStartedAt && !d.cleared && (now - d.clearingStartedAt >= d.clearDurationMs)) {
              parcelsChanged = true;
              return { ...d, cleared: true, clearingStartedAt: null };
            }
            return d;
          });
          if (parcelsChanged) {
            parcelsUpdated[parcelId] = { ...parcel, debris: updatedDebris };
          }
        }

        // 2. Auto-generate freight contracts when refresh timer expires
        let updatedFreightContract = state.activeFreightContract;
        let updatedFreightRefreshAt = state.freightContractRefreshAt;
        if (!state.activeFreightContract && now >= state.freightContractRefreshAt) {
          const portUnlocked = state.parcels.parcel_port_basin?.isUnlocked;
          if (portUnlocked) {
            updatedFreightContract = generateFreightContract();
            updatedFreightRefreshAt = now + 24 * 60 * 60 * 1000;
          }
        }

        // 3. Check freight contract expiry (for accepted contracts past delivery window)
        if (updatedFreightContract && updatedFreightContract.acceptedAt && !updatedFreightContract.completed) {
          if (now > updatedFreightContract.expiresAt) {
            // Contract expired — auto-fail (cargo ship leaves)
            updatedFreightContract = null;
            updatedFreightRefreshAt = now + 24 * 60 * 60 * 1000;
          }
        }

        // 4. Recalculate estate aura if parcels changed
        let updatedEstateAura = state.currentEstateAura;
        if (parcelsChanged) {
          const parcelsClaimed = Object.values(parcelsUpdated).filter(p => p.isUnlocked).length;
          updatedEstateAura = getEstateAura(parcelsClaimed);
        }

        // Level up check
        const { xp: finalXp, level: finalLevel } = levelUpCheck(state.xp, state.level);

        set({
          plots: newPlots,
          animals: completedBreedings.length > 0 ? breedingAnimals : newAnimals,
          productionQueues: newQueues,
          barn: newBarn,
          silo: newSilo,
          coins: newCoins,
          gems: newGems,
          codex: newCodex,
          fishery: {
            ...state.fishery,
            lastCatchTimestamps: newCatchTimestamps,
            fishCodex: newFishCodex,
          },
          autonomousWorkers: newWorkers,
          unifiedWorkers: unifiedWorkersModified ? updatedUnifiedWorkers : state.unifiedWorkers,
          activeEvent: newActiveEvent,
          lastEventTriggerTime: newLastEventTriggerTime,
          activeBreedings: newActiveBreedings,
          parcels: parcelsChanged ? parcelsUpdated : state.parcels,
          activeFreightContract: updatedFreightContract,
          freightContractRefreshAt: updatedFreightRefreshAt,
          currentEstateAura: updatedEstateAura,
          xp: finalXp,
          level: finalLevel,
          lastTick: now,
        });
      },

      resetGame: () => {
        set({
          coins: 100, gems: 10, xp: 0, level: 1,
          silo: { wheat: 5, corn: 3, carrot: 0, strawberry: 0, soybean: 0, pumpkin: 0, cotton: 0, feed: 3, honey_comb: 0, wild_berries: 0, gold_nugget: 0 },
          barn: { egg: 2, milk: 1, wool: 0, truffle: 0, fish: 0, bread: 0, cheese: 0, pie: 0, sweater: 0, truffle_oil: 0, yarn: 0, quilted_blanket: 0, savory_fish_pie: 0, crab_bisque: 0, honey: 0, silk: 0 },
          plots: initialPlots, unlockedPlots: GRID_SIZE,
          animals: initialAnimals,
          animalCapacity: { chicken: 6, cow: 4, sheep: 4, pig: 4 },
          productionQueues: { feed_mill: [], bakery: [], dairy: [], loom: [], press: [], tailor_shop: [], textiles: [] },
          orders: generateOrders(6),
          farmhands: [], codex: { 'chicken_common': true, 'cow_common': true },
          fishery: {
            unlockedZones: ['zone_pond' as WaterZoneId],
            rodTier: 'bamboo',
            lastCatchTimestamps: { zone_pond: Date.now(), zone_river: 0, zone_estuary: 0, zone_lake: 0, zone_ocean: 0 },
            fishCodex: {},
          },
          autonomousWorkers: [],
          unifiedWorkers: initialUnifiedWorkers,
          activeEvent: null,
          lastEventTriggerTime: Date.now(),
          notifications: [],
          breedingSlots: 1,
          activeBreedings: [],
          wilderness: {
            unlockedBiomes: { biome_woods: false, biome_ridge: false, biome_caves: false, biome_peaks: false },
            activeExpeditions: [],
          },
          habitatUpgradeSteps: { chicken: 0, cow: 0, sheep: 0, pig: 0 },
          parcels: createInitialParcels(),
          activeFreightContract: null,
          freightContractRefreshAt: Date.now() + 24 * 60 * 60 * 1000,
          currentEstateAura: getEstateAura(1),
          lastTick: Date.now(),
        });
      },
    }),
    {
      name: 'meadowlands-save',
      partialize: (state) => ({
        coins: state.coins, gems: state.gems, xp: state.xp, level: state.level,
        silo: state.silo, barn: state.barn,
        plots: state.plots, unlockedPlots: state.unlockedPlots,
        animals: state.animals, animalCapacity: state.animalCapacity,
        productionQueues: state.productionQueues,
        orders: state.orders, farmhands: state.farmhands, codex: state.codex,
        fishery: state.fishery,
        autonomousWorkers: state.autonomousWorkers,
        unifiedWorkers: state.unifiedWorkers,
        activeEvent: state.activeEvent,
        lastEventTriggerTime: state.lastEventTriggerTime,
        notifications: state.notifications,
        breedingSlots: state.breedingSlots,
        activeBreedings: state.activeBreedings,
        wilderness: state.wilderness,
        habitatUpgradeSteps: state.habitatUpgradeSteps,
        parcels: state.parcels,
        activeFreightContract: state.activeFreightContract,
        freightContractRefreshAt: state.freightContractRefreshAt,
        currentEstateAura: state.currentEstateAura,
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<GameState>;
        const merged = { ...currentState, ...persisted };

        // Migration: if fishery doesn't exist, create it
        if (!merged.fishery) {
          merged.fishery = {
            unlockedZones: ['zone_pond'],
            rodTier: 'bamboo',
            lastCatchTimestamps: { zone_pond: Date.now(), zone_river: 0, zone_estuary: 0, zone_lake: 0, zone_ocean: 0 },
            fishCodex: {},
          };
        }

        // Migration: if lastFishTime exists (old format), migrate to per-zone timestamps
        if ((persisted as Record<string, unknown>).lastFishTime && merged.fishery) {
          if (!merged.fishery.lastCatchTimestamps.zone_pond || merged.fishery.lastCatchTimestamps.zone_pond === 0) {
            merged.fishery.lastCatchTimestamps.zone_pond = (persisted as Record<string, unknown>).lastFishTime as number;
          }
        }

        // Migration: add new building queues if missing
        if (!merged.productionQueues.tailor_shop) {
          merged.productionQueues = { ...merged.productionQueues, tailor_shop: [], textiles: [] };
        }
        if (!merged.productionQueues.textiles) {
          merged.productionQueues = { ...merged.productionQueues, textiles: [] };
        }

        // Migration: add missing state fields
        if (!merged.autonomousWorkers) merged.autonomousWorkers = [];
        if (!merged.unifiedWorkers) merged.unifiedWorkers = createDefaultUnifiedWorkers();
        if (!merged.activeEvent) merged.activeEvent = null;
        if (!merged.lastEventTriggerTime) merged.lastEventTriggerTime = Date.now();
        if (!merged.notifications) merged.notifications = [];
        if (!merged.breedingSlots) merged.breedingSlots = 1;
        if (!merged.activeBreedings) merged.activeBreedings = [];
        if (!merged.habitatUpgradeSteps) merged.habitatUpgradeSteps = { chicken: 0, cow: 0, sheep: 0, pig: 0 };

        // Migration: add new silo/barn keys
        if (!merged.silo.cotton) merged.silo = { ...merged.silo, cotton: 0, honey_comb: 0, wild_berries: 0, gold_nugget: 0 };
        if (!merged.barn.yarn) merged.barn = { ...merged.barn, yarn: 0, quilted_blanket: 0, savory_fish_pie: 0, crab_bisque: 0, honey: 0, silk: 0 };

        // Migration: animals with missing cycles fields
        if (merged.animals) {
          merged.animals = merged.animals.map((a: AnimalInstance) => {
            let updated = { ...a };
            if (updated.maxCycles === undefined) {
              const breedId = `${a.species}_${a.tier}`;
              const breedDef = BREED_REGISTRY[breedId];
              const mc = breedDef ? breedDef.maxCycles : randomMaxCycles(a.tier);
              updated = { ...updated, maxCycles: mc, cyclesRemaining: mc };
            }
            // Migration: add breedId if missing
            if (!updated.breedId) {
              updated = { ...updated, breedId: `${a.species}_${a.tier}` };
            }
            // Migration: add cyclesCompletedTotal if missing
            if (updated.cyclesCompletedTotal === undefined) {
              updated = { ...updated, cyclesCompletedTotal: 0 };
            }
            return updated;
          });
        }

        // Migration: add new barn keys for breed-specific products
        if (merged.barn) {
          const newBarnKeys = [
            'egg_blue', 'egg_obsidian', 'egg_golden', 'soft_down_feather', 'glossy_quill',
            'milk_rich_cream', 'milk_alpine', 'milk_starlight', 'churned_butter', 'yak_wool',
            'wool_patterned', 'wool_merino', 'wool_gilded', 'horn_shavings', 'lanolin_balm',
            'truffle_white', 'truffle_alba', 'truffle_diamond', 'ancient_coin', 'foraged_nut', 'ancient_hoard',
          ];
          let barnUpdated = false;
          for (const key of newBarnKeys) {
            if (merged.barn[key] === undefined) {
              merged.barn = { ...merged.barn, [key]: 0 };
              barnUpdated = true;
            }
          }
        }

        // Migration: wilderness state
        if (!merged.wilderness) {
          merged.wilderness = {
            unlockedBiomes: { biome_woods: false, biome_ridge: false, biome_caves: false, biome_peaks: false },
            activeExpeditions: [],
          };
        }

        // Migration: farmhands with missing equippedOutfit
        if (merged.farmhands) {
          merged.farmhands = merged.farmhands.map((fh: FarmhandInstance) => {
            if (fh.equippedOutfit === undefined) {
              return { ...fh, equippedOutfit: null };
            }
            return fh;
          });
        }

        // Migration: production slots with missing recipeName/recipeEmoji
        if (merged.productionQueues) {
          for (const buildingId of Object.keys(merged.productionQueues) as BuildingId[]) {
            merged.productionQueues[buildingId] = merged.productionQueues[buildingId].map((slot: ProductionSlot) => {
              if (!slot.recipeName || !slot.recipeEmoji) {
                const building = BUILDINGS[buildingId];
                const recipe = building?.recipes.find(r => r.id === slot.recipeId);
                return { ...slot, recipeName: recipe?.name || slot.recipeId, recipeEmoji: recipe?.emoji || '' };
              }
              return slot;
            });
          }
        }

        // Migration: territory expansion state
        if (!merged.parcels) {
          merged.parcels = createInitialParcels();
        }
        if ((merged as Record<string, unknown>).activeFreightContract === undefined) {
          merged.activeFreightContract = null;
        }
        if ((merged as Record<string, unknown>).freightContractRefreshAt === undefined) {
          merged.freightContractRefreshAt = Date.now() + 24 * 60 * 60 * 1000;
        }
        if (!merged.currentEstateAura) {
          const parcelsClaimed = Object.values(merged.parcels || {}).filter((p: any) => p?.isUnlocked).length;
          merged.currentEstateAura = getEstateAura(parcelsClaimed || 1);
        }

        return merged as GameState;
      },
    }
  )
);
