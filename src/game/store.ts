import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  CROPS, ANIMALS, PRODUCTS, BUILDINGS, FARMHANDS,
  ORDER_TEMPLATES, xpForLevel, MAX_LEVEL,
  type CropId, type AnimalSpecies, type Tier, type BuildingId, type FarmhandRole, type RecipeDef,
} from './data';

// ---- Runtime types ----

export interface PlotState {
  id: number;
  crop: CropId | null;
  plantedAt: number | null;   // epoch ms
  ready: boolean;
}

export interface AnimalInstance {
  id: string;
  species: AnimalSpecies;
  tier: Tier;
  fed: boolean;
  fedAt: number | null;       // epoch ms when fed
  productReady: boolean;
  age: 'baby' | 'adult' | 'elder';
}

export interface ProductionSlot {
  recipeId: string;
  startedAt: number;          // epoch ms
  durationSec: number;
  done: boolean;
}

export interface OrderState {
  id: string;
  requested: { itemId: string; qty: number; emoji: string; name: string }[];
  coinReward: number;
  xpReward: number;
  trashedAt: number | null;   // epoch ms
}

export interface FarmhandInstance {
  id: string;
  role: FarmhandRole;
  level: number;
  xp: number;
}

export interface GameState {
  // Player
  coins: number;
  gems: number;
  xp: number;
  level: number;

  // Storage
  silo: Record<string, number>;   // crops + feed
  barn: Record<string, number>;   // animal products + manufactured

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

  // Time
  lastTick: number;
  lastFishTime: number;  // epoch ms — last time fisherman caught fish

  // --- Actions ---
  plantCrop: (plotId: number, cropId: CropId) => void;
  harvestPlot: (plotId: number) => void;
  feedAnimal: (animalId: string) => void;
  collectProduct: (animalId: string) => void;
  buyAnimal: (species: AnimalSpecies) => void;
  startProduction: (buildingId: BuildingId, recipe: RecipeDef) => void;
  collectProduction: (buildingId: BuildingId, slotIndex: number) => void;
  fulfillOrder: (orderId: string) => void;
  trashOrder: (orderId: string) => void;
  sellItem: (itemId: string, qty: number) => void;
  buyFarmhand: (role: FarmhandRole) => void;
  addSilo: (itemId: string, qty: number) => void;
  addBarn: (itemId: string, qty: number) => void;
  tick: () => void;
  resetGame: () => void;
}

const GRID_SIZE = 12; // initial unlocked plots

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
  { id: 'a1', species: 'chicken', tier: 'common', fed: false, fedAt: null, productReady: false, age: 'adult' },
  { id: 'a2', species: 'chicken', tier: 'common', fed: false, fedAt: null, productReady: false, age: 'adult' },
  { id: 'a3', species: 'cow', tier: 'common', fed: false, fedAt: null, productReady: false, age: 'adult' },
];

const initialOrders = generateOrders(6);

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      coins: 100,
      gems: 10,
      xp: 0,
      level: 1,

      silo: { wheat: 5, corn: 3, carrot: 0, strawberry: 0, soybean: 0, pumpkin: 0, feed: 3 },
      barn: { egg: 2, milk: 1, wool: 0, truffle: 0, fish: 0, bread: 0, cheese: 0, pie: 0, sweater: 0, truffle_oil: 0 },

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
      },

      orders: initialOrders,
      farmhands: [],
      codex: { 'chicken_common': true, 'cow_common': true },

      lastTick: Date.now(),
      lastFishTime: Date.now(),

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
        set({ silo: newSilo, plots: newPlots, xp: state.xp + 3 });
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
        const def = ANIMALS[animal.species];
        const newBarn = { ...state.barn, [def.product]: (state.barn[def.product] || 0) + def.productYield };
        const newAnimals = state.animals.map(a =>
          a.id === animalId ? { ...a, fed: false, fedAt: null, productReady: false } : a
        );
        set({ barn: newBarn, animals: newAnimals, xp: state.xp + 5 });
      },

      buyAnimal: (species) => {
        const state = get();
        const def = ANIMALS[species];
        const currentCount = state.animals.filter(a => a.species === species).length;
        if (currentCount >= (state.animalCapacity[species] || def.capacity)) return;
        const costs: Record<AnimalSpecies, number> = { chicken: 50, cow: 150, sheep: 200, pig: 300 };
        if (state.coins < costs[species]) return;
        const newAnimal: AnimalInstance = {
          id: generateId(),
          species,
          tier: 'common',
          fed: false,
          fedAt: null,
          productReady: false,
          age: 'adult',
        };
        set({
          coins: state.coins - costs[species],
          animals: [...state.animals, newAnimal],
        });
      },

      startProduction: (buildingId, recipe) => {
        const state = get();
        const building = BUILDINGS[buildingId];
        const queue = state.productionQueues[buildingId] || [];
        if (queue.filter(s => !s.done).length >= building.queueSlots) return;

        // Check inputs
        const newSilo = { ...state.silo };
        const newBarn = { ...state.barn };
        for (const input of recipe.inputs) {
          const isCrop = input.productId in CROPS || input.productId === 'feed';
          const storage = isCrop ? newSilo : newBarn;
          if ((storage[input.productId] || 0) < input.qty) return;
          storage[input.productId] = (storage[input.productId] || 0) - input.qty;
        }

        const newSlot: ProductionSlot = {
          recipeId: recipe.id,
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

        // Find the recipe output
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

        const isCropOutput = outputItem in CROPS || outputItem === 'feed';
        const newSilo = { ...state.silo };
        const newBarn = { ...state.barn };
        if (isCropOutput) {
          newSilo[outputItem] = (newSilo[outputItem] || 0) + outputQty;
        } else {
          newBarn[outputItem] = (newBarn[outputItem] || 0) + outputQty;
        }

        const newQueue = queue.filter((_, i) => i !== slotIndex);
        set({
          silo: newSilo,
          barn: newBarn,
          productionQueues: {
            ...state.productionQueues,
            [buildingId]: newQueue,
          },
          xp: state.xp + 8,
        });
      },

      fulfillOrder: (orderId) => {
        const state = get();
        const order = state.orders.find(o => o.id === orderId);
        if (!order) return;

        // Check we have all items
        const newSilo = { ...state.silo };
        const newBarn = { ...state.barn };
        for (const item of order.requested) {
          const isCrop = item.itemId in CROPS || item.itemId === 'feed';
          const storage = isCrop ? newSilo : newBarn;
          if ((storage[item.itemId] || 0) < item.qty) return;
          storage[item.itemId] = (storage[item.itemId] || 0) - item.qty;
        }

        let newXp = state.xp + order.xpReward;
        let newLevel = state.level;
        // Level up check
        while (newLevel < MAX_LEVEL && newXp >= xpForLevel(newLevel)) {
          newXp -= xpForLevel(newLevel);
          newLevel++;
        }

        // Replace the fulfilled order
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
        const isCrop = itemId in CROPS || itemId === 'feed';
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
        const fh: FarmhandInstance = { id: generateId(), role, level: 1, xp: 0 };
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

      tick: () => {
        const now = Date.now();
        const state = get();

        // Update plots
        const newPlots = state.plots.map(p => {
          if (p.crop && p.plantedAt && !p.ready) {
            const elapsed = (now - p.plantedAt) / 1000;
            const growTime = CROPS[p.crop].growTimeSec;
            if (elapsed >= growTime) {
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

        // Fisherman passive fish: every 30s per fisherman
        const fishermanCount = state.farmhands.filter(f => f.role === 'fisherman').length;
        let newBarn = state.barn;
        let newLastFishTime = state.lastFishTime;
        if (fishermanCount > 0) {
          const fishInterval = 30000; // 30 seconds per catch
          if (now - state.lastFishTime >= fishInterval) {
            newBarn = { ...state.barn, fish: (state.barn.fish || 0) + fishermanCount };
            newLastFishTime = now;
          }
        }

        set({
          plots: newPlots,
          animals: newAnimals,
          productionQueues: newQueues,
          barn: newBarn,
          lastFishTime: newLastFishTime,
          lastTick: now,
        });
      },

      resetGame: () => {
        set({
          coins: 100, gems: 10, xp: 0, level: 1,
          silo: { wheat: 5, corn: 3, carrot: 0, strawberry: 0, soybean: 0, pumpkin: 0, feed: 3 },
          barn: { egg: 2, milk: 1, wool: 0, truffle: 0, fish: 0, bread: 0, cheese: 0, pie: 0, sweater: 0, truffle_oil: 0 },
          plots: initialPlots, unlockedPlots: GRID_SIZE,
          animals: initialAnimals,
          animalCapacity: { chicken: 6, cow: 4, sheep: 4, pig: 4 },
          productionQueues: { feed_mill: [], bakery: [], dairy: [], loom: [], press: [] },
          orders: generateOrders(6),
          farmhands: [], codex: { 'chicken_common': true, 'cow_common': true },
          lastTick: Date.now(),
          lastFishTime: Date.now(),
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
        lastFishTime: state.lastFishTime,
      }),
    }
  )
);
