import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  CROPS, ANIMALS, PRODUCTS, BUILDINGS, FARMHANDS, WORKERS,
  WATER_ZONES, FISH_SPECIES, ROD_TIERS, ROD_TIER_ORDER, OUTFITS,
  HOURLY_EVENTS, SMUGGLER_LOOT, CHEF_ORDER_TEMPLATES,
  HABITAT_UPGRADES, BREEDING_SLOT_UPGRADES,
  ORDER_TEMPLATES, xpForLevel, MAX_LEVEL,
  TIER_MAX_CYCLES, ANIMAL_BUY_PRICES,
  type CropId, type AnimalSpecies, type Tier, type BuildingId, type FarmhandRole, type RecipeDef,
  type WaterZoneId, type FishSpeciesId, type RodTier, type OutfitId,
  type WorkerType, type HourlyEventType,
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
  fed: boolean;
  fedAt: number | null;
  productReady: boolean;
  age: 'baby' | 'adult' | 'elder';
  maxCycles: number;
  cyclesRemaining: number;
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

// Autonomous Workers
export interface AutonomousWorkerInstance {
  id: string;
  type: WorkerType;
  gearTier: number;
  autoSell: boolean;
  lastProduceTime: number;
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

  // Autonomous Workers
  autonomousWorkers: AutonomousWorkerInstance[];

  // Hourly Events
  activeEvent: ActiveHourlyEvent | null;
  lastEventTriggerTime: number;

  // Notifications
  notifications: NotificationItem[];

  // Breeding
  breedingSlots: number;
  activeBreedings: ActiveBreeding[];

  // Habitat Upgrades
  habitatUpgradeSteps: Record<AnimalSpecies, number>;

  // Time
  lastTick: number;

  // --- Actions ---
  plantCrop: (plotId: number, cropId: CropId) => void;
  harvestPlot: (plotId: number) => void;
  feedAnimal: (animalId: string) => void;
  collectProduct: (animalId: string) => void;
  buyAnimal: (species: AnimalSpecies, tier?: Tier) => void;
  startProduction: (buildingId: BuildingId, recipe: RecipeDef) => void;
  collectProduction: (buildingId: BuildingId, slotIndex: number) => void;
  fulfillOrder: (orderId: string) => void;
  trashOrder: (orderId: string) => void;
  sellItem: (itemId: string, qty: number) => void;
  buyFarmhand: (role: FarmhandRole) => void;
  addSilo: (itemId: string, qty: number) => void;
  addBarn: (itemId: string, qty: number) => void;

  // Fishery
  unlockFisheryZone: (zoneId: WaterZoneId) => void;
  upgradeFishingRod: () => void;

  // Autonomous Workers
  hireAutonomousWorker: (type: WorkerType) => void;
  toggleWorkerAutoSell: (workerId: string) => void;
  upgradeWorkerGear: (workerId: string) => void;

  // Outfits
  equipOutfit: (farmhandId: string, outfitId: OutfitId | null) => void;

  // Events
  shooCrow: () => void;
  fulfillChefOrder: () => void;
  openSmugglerCrate: () => void;

  // Breeding
  breedAnimals: (parent1Id: string, parent2Id: string) => void;
  upgradeBreedingSlot: () => void;

  // Habitat
  upgradeHabitat: (species: AnimalSpecies) => void;

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
  { id: 'a1', species: 'chicken', tier: 'common', fed: false, fedAt: null, productReady: false, age: 'adult', maxCycles: TIER_MAX_CYCLES.common, cyclesRemaining: TIER_MAX_CYCLES.common },
  { id: 'a2', species: 'chicken', tier: 'common', fed: false, fedAt: null, productReady: false, age: 'adult', maxCycles: TIER_MAX_CYCLES.common, cyclesRemaining: TIER_MAX_CYCLES.common },
  { id: 'a3', species: 'cow', tier: 'common', fed: false, fedAt: null, productReady: false, age: 'adult', maxCycles: TIER_MAX_CYCLES.common, cyclesRemaining: TIER_MAX_CYCLES.common },
];

const initialOrders = generateOrders(6);

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
      activeEvent: null,
      lastEventTriggerTime: Date.now(),

      notifications: [],

      breedingSlots: 1,
      activeBreedings: [],

      habitatUpgradeSteps: { chicken: 0, cow: 0, sheep: 0, pig: 0 },

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
        const def = ANIMALS[animal.species];
        const newBarn = { ...state.barn, [def.product]: (state.barn[def.product] || 0) + def.productYield };
        const newCyclesRemaining = animal.cyclesRemaining - 1;
        const isElder = newCyclesRemaining <= 0;
        const newAnimals = state.animals.map(a =>
          a.id === animalId ? { ...a, fed: false, fedAt: null, productReady: false, cyclesRemaining: newCyclesRemaining, age: isElder ? 'elder' : a.age } : a
        );
        const { xp: newXp, level: newLevel } = levelUpCheck(state.xp + 5, state.level);
        set({ barn: newBarn, animals: newAnimals, xp: newXp, level: newLevel });
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
        const newAnimal: AnimalInstance = {
          id: generateId(),
          species,
          tier,
          fed: false,
          fedAt: null,
          productReady: false,
          age: 'adult',
          maxCycles: TIER_MAX_CYCLES[tier],
          cyclesRemaining: TIER_MAX_CYCLES[tier],
        };
        set({
          coins: state.coins - cost,
          animals: [...state.animals, newAnimal],
          codex: { ...state.codex, [`${species}_${tier}`]: true },
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
        const product = PRODUCTS[itemId as keyof typeof PRODUCTS];
        if (!product) return;
        const isCrop = itemId in CROPS || itemId === 'feed' || itemId === 'cotton' || itemId === 'honey_comb' || itemId === 'wild_berries' || itemId === 'gold_nugget';
        const storage = isCrop ? state.silo : state.barn;
        if ((storage[itemId] || 0) < qty) return;

        if (isCrop) {
          set({ silo: { ...state.silo, [itemId]: state.silo[itemId] - qty }, coins: state.coins + product.sellPrice * qty });
        } else {
          set({ barn: { ...state.barn, [itemId]: state.barn[itemId] - qty }, coins: state.coins + product.sellPrice * qty });
        }
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

        // Determine offspring tier
        let offspringTier: Tier = parent1.tier;
        const tierOrder: Tier[] = ['common', 'uncommon', 'rare', 'legendary'];
        const maxTierIdx = Math.max(tierOrder.indexOf(parent1.tier), tierOrder.indexOf(parent2.tier));
        // 30% chance to breed up a tier
        if (Math.random() < 0.3 && maxTierIdx < tierOrder.length - 1) {
          offspringTier = tierOrder[maxTierIdx + 1];
        } else {
          offspringTier = tierOrder[maxTierIdx];
        }

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
          codex: { ...state.codex, [`${parent1.species}_${offspringTier}`]: true },
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
            const prodTime = ANIMALS[a.species].productionTimeSec;
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

        // Only catch fish if at least one fisherman exists (farmhand or autonomous)
        const hasFisherman = state.farmhands.some(f => f.role === 'fisherman') || state.autonomousWorkers.some(w => w.type === 'fisherman');

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

        // Autonomous workers tick
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
            // Breeding complete — add offspring
            const tierOrder: Tier[] = ['common', 'uncommon', 'rare', 'legendary'];
            // Pick a random tier based on parents
            const offspringTier: Tier = Math.random() < 0.3 ? 'uncommon' : 'common';
            const newAnimal: AnimalInstance = {
              id: generateId(),
              species: b.species,
              tier: offspringTier,
              fed: false,
              fedAt: null,
              productReady: false,
              age: 'baby',
              maxCycles: TIER_MAX_CYCLES[offspringTier],
              cyclesRemaining: TIER_MAX_CYCLES[offspringTier],
            };
            // Add to animals — we need to set state, but in a filter we can't
            // We'll handle this outside the filter
            return false;
          }
          return true;
        });

        // Actually process completed breedings
        const completedBreedings = state.activeBreedings.filter(b => now - b.startedAt >= b.durationMs);
        let breedingAnimals = [...newAnimals];
        for (const b of completedBreedings) {
          const offspringTier: Tier = Math.random() < 0.3 ? 'uncommon' : 'common';
          const newAnimal: AnimalInstance = {
            id: generateId(),
            species: b.species,
            tier: offspringTier,
            fed: false,
            fedAt: null,
            productReady: false,
            age: 'baby',
            maxCycles: TIER_MAX_CYCLES[offspringTier],
            cyclesRemaining: TIER_MAX_CYCLES[offspringTier],
          };
          breedingAnimals.push(newAnimal);
          // Reset parents
          breedingAnimals = breedingAnimals.map(a => {
            if (a.id === b.parent1Id || a.id === b.parent2Id) {
              return { ...a, fed: false, fedAt: null };
            }
            return a;
          });
          newCodex[`${b.species}_${offspringTier}`] = true;
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
          activeEvent: newActiveEvent,
          lastEventTriggerTime: newLastEventTriggerTime,
          activeBreedings: newActiveBreedings,
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
          activeEvent: null,
          lastEventTriggerTime: Date.now(),
          notifications: [],
          breedingSlots: 1,
          activeBreedings: [],
          habitatUpgradeSteps: { chicken: 0, cow: 0, sheep: 0, pig: 0 },
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
        activeEvent: state.activeEvent,
        lastEventTriggerTime: state.lastEventTriggerTime,
        notifications: state.notifications,
        breedingSlots: state.breedingSlots,
        activeBreedings: state.activeBreedings,
        habitatUpgradeSteps: state.habitatUpgradeSteps,
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
            if (a.maxCycles === undefined) {
              return { ...a, maxCycles: TIER_MAX_CYCLES[a.tier], cyclesRemaining: TIER_MAX_CYCLES[a.tier] };
            }
            return a;
          });
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

        return merged as GameState;
      },
    }
  )
);
