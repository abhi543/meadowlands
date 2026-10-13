import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { idbStorage, SAVE_KEY } from '@/lib/idbStorage';
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
  type CrisisType, type CrisisDef, CRISIS_DEFINITIONS,
  MUTATION_VARIANTS, type MutationVariantDef,
  MARKET_COMMODITIES, MARKET_NEWS_TEMPLATES, type MarketNewsTemplate,
  TIER_LABELS,
} from './data';
import {
  rollBreedingTier,
  INCUBATION_TIMES,
  type AnimalTier,
} from '@/utils/breedingLogic';
import {
  SYSTEMIC_EVENTS, FAIR_ITEM_SCORES, getEligibleRandomEvents,
  type SystemicEventId, type SystemicEventPhase, type SystemicEventDef,
} from './eventsData';
import {
  type OrderType, type ClientProfile, type DeliveryOrder,
  CLIENT_DEFINITIONS, REPUTATION_THRESHOLDS, getReputationInfo,
  generateDeliveryOrder, getItemBaseValue, ITEM_UNLOCK_LEVELS,
} from './deliveryData';
import { sendLocalEventPushNotification } from '@/lib/eventNotifications';
import {
  type ActiveEventInstance,
  createSuddenEventInstance,
  getNextSuddenEventDelay,
} from '@/lib/eventDirector';
import {
  playCrisisAlarm,
  playGoldRushFanfare,
  playRapidTapSound,
  playVictoryChime,
  playDefeatSound,
  playClockTickSound,
  playSirenSting,
  playCashRegisterSound,
} from '@/lib/soundEffects';
import {
  type OverclockTier,
  type OverclockEntityType,
  type EntityOverclockState,
  BASE_OVERCLOCK_COSTS,
  CURE_EXHAUSTION_FEES,
  getDecayedStreak,
  calculateOverclockCost,
  getTierConfig,
  createDefaultEntityOverclock,
} from '@/types/overclock';
import {
  type ReputationTier,
  type ClientData,
  type FavorShopItem,
  type GlobalReputationState,
  FAVOR_SHOP_CATALOG,
  createInitialGlobalReputation,
  createInitialClientData,
  getClientLevelFromXp,
  computeUnlockedPerks,
} from '@/types/reputation';

// ---- Dynamic Event Engine & Relics Types (v2.3) ----

export interface RelicsState {
  royalCrownCrestUntil: number | null; // +15% order coin payouts active for 24h
  mineralAshUntil: number | null;      // 3x crop growth speed active for 60m
  smugglersCompass: boolean;          // -20% wilderness outpost expedition timers permanent
  countyFairTrophy: boolean;          // permanent farm monument generating 3 gems/day
  lastCountyFairGemClaim: number | null;
  feastOfKingsUnlocked: boolean;       // luxury 40,000 coin dish in bakery/market
  circusCub: boolean;                 // exclusive companion granting +10% passive farm XP
  glowingSpores: number;              // count of instant-finish alchemical spores
  masterArtisanLedger: boolean;       // permanently reduces all machine craft times by -5%
  ancientSunRelic: boolean;           // permanent +15% player XP multiplier
  superFeedCharges: number;           // double yield production cycles count for livestock
}

export const DEFAULT_RELICS: RelicsState = {
  royalCrownCrestUntil: null,
  mineralAshUntil: null,
  smugglersCompass: false,
  countyFairTrophy: false,
  lastCountyFairGemClaim: null,
  feastOfKingsUnlocked: false,
  circusCub: false,
  glowingSpores: 0,
  masterArtisanLedger: false,
  ancientSunRelic: false,
  superFeedCharges: 0,
};

export interface SystemicEventState {
  id: SystemicEventId;
  phase: SystemicEventPhase; // 'forecast' | 'active' | 'settlement'
  forecastEndsAt: number;
  activeEndsAt: number;
  currentStage: number; // 1-indexed (1, 2, 3, 4)
  progress: number;
  target: number;
  claimedStages: number[];
  isCompleted: boolean;
  activeFirePositions?: number[];
  locustPlotIds?: number[];
  fairPoints?: number;
  smugglerContractsCompleted?: number;
  donatedMaterials?: number;
  lastNotifiedTMinus10?: boolean;
}

export const DEFAULT_EVENT_COOLDOWNS: Record<SystemicEventId, number> = {
  royal_fleet: 0,
  barn_fire: 0,
  midnight_smuggler: 0,
  locust_swarm: 0,
  county_fair: 0,
  salmon_run: 0,
  carnival_circus: 0,
  alchemical_bloom: 0,
  artisan_masterclass: 0,
  ancient_ruins: 0,
};

// ---- Runtime types ----

export interface PlotState {
  id: number;
  crop: CropId | null;
  plantedAt: number | null;
  ready: boolean;
  isWatered?: boolean;
  wateredUntil?: number | null;
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
  // Overclocking & Exhaustion (Step 4)
  isOverclocked?: boolean;
  overclockExpiresAt?: number | null;
  isExhausted?: boolean;
  exhaustedUntil?: number | null;
  // Mutation Breeding (Step 4)
  isMutated?: boolean;
  mutationVariant?: string;
  mutationBonus?: number;
}

export interface ProductionSlot {
  recipeId: string;
  recipeName: string;
  recipeEmoji: string;
  startedAt: number;
  durationSec: number;
  done: boolean;
}

export type OrderState = DeliveryOrder;

// --- Active Radar Crisis System Types (Step 1) ---
export interface CrisisEvent {
  id: string;
  type: CrisisType;
  title: string;
  emoji: string;
  description: string;
  timer: number;                  // Remaining duration in seconds
  expiresAt: number;              // Millisecond expiry timestamp
  targetIds: (string | number)[]; // Target animal IDs (predator) or plot IDs (blight)
  resolvedStatus: 'pending' | 'resolved' | 'failed';
  weatherType?: 'drought' | 'blizzard';
  shieldActive?: boolean;         // Active shield prevents 50% slow penalty
  infectionProgress?: number;     // 0-100% infection progress
  alarmTaps?: number;             // Rapid tap alarm progress
}

// --- Roguelite Wild Expedition Types (Step 2) ---
export interface RogueliteExpeditionState {
  isActive: boolean;
  currentDepth: number;           // 1 to 5
  maxDepth: number;               // 5
  partyStamina: number;           // 0 to 100
  maxStamina: number;             // 100
  rations: number;                // Provisions to restore stamina / pass checks
  retreatTools: number;           // Smoke bombs / escape ropes to negate hazards
  accumulatedLoot: {
    coins: number;
    gems: number;
    seeds: Record<string, number>;
    relicFragments: number;
    geneTokens: number;
    rareItems: Record<string, number>;
  };
  currentNodeStatus: 'ready' | 'exploring' | 'cleared' | 'hazard' | 'wipeout' | 'extracted';
  currentEncounter: {
    type: 'cache' | 'hazard' | 'sanctuary';
    title: string;
    emoji: string;
    description: string;
    hazardType?: 'ambush' | 'poison_mist' | 'cave_in';
    hazardChance: number;         // Depth 1: 15%, +20% per depth
    staminaCost: number;
    lootReward: {
      coins: number;
      gems: number;
      seeds?: string;
      relicFragments?: number;
      geneTokens?: number;
    };
  } | null;
  history: string[];
  workerCooldownUntil: number | null;
}

// --- Dynamic Commodity Market Types (Step 3) ---
export interface MarketTrendItem {
  multiplier: number;             // 0.6x to 2.2x
  trend: 'up' | 'down' | 'neutral';
  lastUpdated: number;
}

export interface MarketNewsTicker {
  headline: string;
  itemId: string;
  multiplier: number;
  expiresAt: number;
}

// --- Production Overclocking State (Step 4) ---
export interface BuildingOverclockState {
  isOverclocked: boolean;
  expiresAt: number | null;
  isExhausted: boolean;
  exhaustedUntil: number | null;
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
  offspringTier?: Tier;
  offspringBreedId?: string;
  isMutated?: boolean;
  mutationVariant?: string;
  mutationBonus?: number;
  notified?: boolean;
}

export interface HatchRevealData {
  animal: AnimalInstance;
  breedName: string;
  parent1BreedName: string;
  parent2BreedName: string;
  isNewCodex: boolean;
  gemReward: number;
  wasMutationUp: boolean;
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

  // Orders & Client Personas (Logistics Overhaul)
  orders: DeliveryOrder[];
  clientReputation: Record<string, { level: number; xp: number }>;
  globalReputation: GlobalReputationState;
  crisisShields: number;
  freeOverclocks: number;
  bonusStorageCapacity: number;

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
  hatchReveal: HatchRevealData | null;

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

  // Dynamic Long-Form Systemic Event Engine (v2.3)
  systemicEvent: SystemicEventState | null;
  systemicEventCooldowns: Record<SystemicEventId, number>;
  lastSystemicEventCompletedAt: number | null;
  nextSurpriseEventTime: number | null;
  surpriseEventAlert: { id: SystemicEventId; timestamp: number } | null;
  relics: RelicsState;

  // High-Stakes "Adrenaline Rush" Sudden Event Engine
  activeSuddenEvent: ActiveEventInstance | null;
  nextSuddenEventTime: number | null;
  workersPausedUntil: number | null;
  suddenEventFlash: 'CRISIS' | 'GOLD_RUSH' | null;
  isSuddenEventModalOpen: boolean;

  // Active Radar Crisis System (Step 1)
  activeCrisis: CrisisEvent | null;
  nextCrisisTime: number;
  isCrisisModalOpen: boolean;

  // Roguelite Wild Expeditions (Step 2)
  wildExpedition: RogueliteExpeditionState;

  // Dynamic Commodity Market (Step 3)
  marketTrends: Record<string, MarketTrendItem>;
  marketNextRefresh: number;
  marketNewsTicker: MarketNewsTicker | null;

  // Production Overclocking (Step 4 & Global System)
  buildingOverclocks: Record<BuildingId, BuildingOverclockState>;
  entityOverclocks: Record<string, EntityOverclockState>;

  // Water System & Farm Well (Soil Hydration & 2x Growth Boost)
  waterLevel: number;
  maxWaterLevel: number;
  wellLevel: number;
  lastWellAutoRefill: number | null;

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
  fulfillDeliveryOrder: (orderId: string, route?: 'safe' | 'wild') => { success: boolean; hazardEncountered?: boolean; message?: string };
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
  breedAnimals: (parent1Id: string, parent2Id: string) => boolean;
  speedUpBreeding: (breedingId: string) => boolean;
  claimHatchedAnimal: (breedingId: string) => AnimalInstance | null;
  clearHatchReveal: () => void;
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
  // Cloud Sync & Auth
  isDirty: boolean;
  isGuest: boolean;
  lastCloudSyncTimestamp: number | null;
  markDirty: () => void;
  markClean: () => void;
  claimAccountLinkReward: () => void;
  loadBackupSave: (payload: Partial<GameState>) => void;
  loadCloudSave: (payload: Partial<GameState>) => void;
  fastForwardOfflineTime: (elapsedMs: number) => void;

  // Dynamic Long-Form Event Actions (v2.3)
  triggerSystemicEvent: (id?: SystemicEventId) => void;
  advanceSystemicEventPhase: () => void;
  extinguishBrushfire: (plotIndex: number) => void;
  captureLocust: (plotIndex: number) => void;
  deliverFleetCrates: (items: { itemId: string; qty: number }[]) => boolean;
  deliverSmugglerContract: (items: { itemId: string; qty: number }[]) => boolean;
  submitCountyFairProduce: (items: { itemId: string; qty: number }[]) => number;
  catchMigrationFish: () => void;
  supplyCarnivalFeeds: (items: { itemId: string; qty: number }[]) => boolean;
  donateRuinsMaterials: (items: { itemId: string; qty: number }[]) => boolean;
  claimSystemicGrandReward: () => void;
  dismissSystemicEvent: () => void;
  claimCountyFairTrophy: () => boolean;
  useGlowingSpore: (buildingId: BuildingId, slotIndex: number) => boolean;
  applyGlowingSpore: (buildingId: BuildingId, slotIndex: number) => boolean;
  clearSurpriseEventAlert: () => void;

  // High-Stakes Sudden Event Engine Actions
  triggerSuddenEvent: (eventId?: string) => void;
  progressSuddenEventTap: () => void;
  paySuddenEventResource: () => boolean;
  resolveSuddenEventSuccess: () => void;
  resolveSuddenEventFailure: () => void;
  clearSuddenEventFlash: () => void;
  setSuddenEventModalOpen: (open: boolean) => void;
  adjustSuddenEventExpiry: (elapsedMs: number) => void;

  // Water System Actions
  pumpWell: () => void;
  upgradeWell: () => boolean;
  waterPlot: (plotId: number) => boolean;
  waterAllPlots: () => void;

  // Active Radar Crisis Actions (Step 1)
  triggerCrisis: (type?: CrisisType) => void;
  resolveCrisisDefense: (actionType: 'alarm' | 'dog' | 'quarantine' | 'shield', targetId?: string | number) => void;
  resolveCrisisFailure: () => void;
  clearCrisis: () => void;
  setCrisisModalOpen: (open: boolean) => void;

  // Roguelite Wild Expedition Actions (Step 2)
  startRogueliteExpedition: () => void;
  progressRogueliteNode: () => void;
  resolveRogueliteHazard: (useTool?: boolean) => void;
  extractRogueliteLoot: () => void;
  abandonRogueliteExpedition: () => void;
  craftRogueliteRations: () => void;
  buyRogueliteRetreatTool: () => void;

  // Dynamic Commodity Market Actions (Step 3)
  refreshMarketPrices: () => void;

  // Overclocking & Exhaustion Actions (Step 4 & Global System)
  toggleAnimalOverclock: (animalId: string) => void;
  cureAnimalExhaustion: (animalId: string) => void;
  toggleBuildingOverclock: (buildingId: BuildingId) => void;
  cureBuildingExhaustion: (buildingId: BuildingId) => void;
  overclockEntity: (entityId: string, entityType: OverclockEntityType, tier: OverclockTier, customBaseCost?: number) => boolean;
  cureEntityExhaustion: (entityId: string, entityType: OverclockEntityType) => boolean;
  clearEntityOverclock: (entityId: string) => void;

  // Town Favor Shop & VIP Utilities
  purchaseFavorItem: (itemId: string) => boolean;
  useOrderReroll: () => boolean;
  consumeOrderReroll: () => boolean;
  useInstantOverclock: (entityId: string, entityType: OverclockEntityType) => boolean;
  consumeInstantOverclock: (entityId: string, entityType: OverclockEntityType) => boolean;

  tick: () => void;
  resetGame: () => void;
}

const GRID_SIZE = 12;

export function isCropItem(itemId: string): boolean {
  return itemId in CROPS || itemId === 'feed' || itemId === 'cotton' || itemId === 'honey_comb' || itemId === 'wild_berries' || itemId === 'gold_nugget';
}

export const DEFAULT_CLIENT_REPUTATION: Record<string, { level: number; xp: number }> = {
  mayor_barnaby: { level: 1, xp: 0 },
  chef_antoine: { level: 1, xp: 0 },
  captain_sterling: { level: 1, xp: 0 },
  lady_guinevere: { level: 1, xp: 0 },
  old_man_jed: { level: 1, xp: 0 },
};

function generateOrders(count: number, playerLevel = 1): DeliveryOrder[] {
  const orders: DeliveryOrder[] = [];
  const clientKeys = Object.keys(CLIENT_DEFINITIONS);
  for (let i = 0; i < count; i++) {
    const clientKey = clientKeys[i % clientKeys.length];
    orders.push(generateDeliveryOrder(playerLevel, undefined, clientKey));
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
  isWatered: false,
  wateredUntil: null,
}));

const initialAnimals: AnimalInstance[] = [
  { id: 'a1', species: 'chicken', tier: 'common', breedId: 'chicken_common', fed: false, fedAt: null, productReady: false, age: 'adult', maxCycles: 15, cyclesRemaining: 15, cyclesCompletedTotal: 0 },
  { id: 'a2', species: 'chicken', tier: 'common', breedId: 'chicken_common', fed: false, fedAt: null, productReady: false, age: 'adult', maxCycles: 15, cyclesRemaining: 15, cyclesCompletedTotal: 0 },
  { id: 'a3', species: 'cow', tier: 'common', breedId: 'cow_common', fed: false, fedAt: null, productReady: false, age: 'adult', maxCycles: 12, cyclesRemaining: 12, cyclesCompletedTotal: 0 },
];

const initialOrders = generateOrders(6, 1);

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

function createDefaultWildExpedition(): RogueliteExpeditionState {
  return {
    isActive: false,
    currentDepth: 1,
    maxDepth: 5,
    partyStamina: 100,
    maxStamina: 100,
    rations: 3,
    retreatTools: 1,
    accumulatedLoot: {
      coins: 0,
      gems: 0,
      seeds: {},
      relicFragments: 0,
      geneTokens: 0,
      rareItems: {},
    },
    currentNodeStatus: 'ready',
    currentEncounter: null,
    history: ['Outpost ready. Assemble your exploration party.'],
    workerCooldownUntil: null,
  };
}

function createInitialMarketTrends(): Record<string, MarketTrendItem> {
  const trends: Record<string, MarketTrendItem> = {};
  for (const item of MARKET_COMMODITIES) {
    const mult = Number((0.75 + Math.random() * 0.7).toFixed(2));
    trends[item] = {
      multiplier: mult,
      trend: mult >= 1.05 ? 'up' : mult <= 0.95 ? 'down' : 'neutral',
      lastUpdated: Date.now(),
    };
  }
  return trends;
}

function createDefaultBuildingOverclocks(): Record<BuildingId, BuildingOverclockState> {
  return {
    feed_mill: { isOverclocked: false, expiresAt: null, isExhausted: false, exhaustedUntil: null },
    bakery: { isOverclocked: false, expiresAt: null, isExhausted: false, exhaustedUntil: null },
    dairy: { isOverclocked: false, expiresAt: null, isExhausted: false, exhaustedUntil: null },
    loom: { isOverclocked: false, expiresAt: null, isExhausted: false, exhaustedUntil: null },
    press: { isOverclocked: false, expiresAt: null, isExhausted: false, exhaustedUntil: null },
    textiles: { isOverclocked: false, expiresAt: null, isExhausted: false, exhaustedUntil: null },
    tailor_shop: { isOverclocked: false, expiresAt: null, isExhausted: false, exhaustedUntil: null },
  };
}


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
function generateChefOrder(playerLevel = 1) {
  const eligibleTemplates = CHEF_ORDER_TEMPLATES.filter(t =>
    t.requested.every(it => (ITEM_UNLOCK_LEVELS[it.itemId] || 1) <= playerLevel)
  );
  const pool = eligibleTemplates.length > 0 ? eligibleTemplates : CHEF_ORDER_TEMPLATES;
  const template = pool[Math.floor(Math.random() * pool.length)];
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
      animalCapacity: { chicken: 16, cow: 16, sheep: 16, pig: 16 },

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
      clientReputation: DEFAULT_CLIENT_REPUTATION,
      globalReputation: createInitialGlobalReputation(),
      crisisShields: 0,
      freeOverclocks: 0,
      bonusStorageCapacity: 0,
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
      hatchReveal: null,

      wilderness: {
        unlockedBiomes: { biome_woods: false, biome_ridge: false, biome_caves: false, biome_peaks: false },
        activeExpeditions: [],
      },

      habitatUpgradeSteps: { chicken: 0, cow: 0, sheep: 0, pig: 0 },

      parcels: initialParcels,
      activeFreightContract: null,
      freightContractRefreshAt: Date.now() + 24 * 60 * 60 * 1000, // First contract in 24h
      currentEstateAura: initialEstateAura,

      // Dynamic Long-Form Systemic Event Engine & Relics (v2.3)
      systemicEvent: null,
      systemicEventCooldowns: DEFAULT_EVENT_COOLDOWNS,
      lastSystemicEventCompletedAt: null,
      nextSurpriseEventTime: null,
      surpriseEventAlert: null,
      relics: DEFAULT_RELICS,

      // High-Stakes Sudden Event Engine
      activeSuddenEvent: null,
      nextSuddenEventTime: null,
      workersPausedUntil: null,
      suddenEventFlash: null,
      isSuddenEventModalOpen: false,

      // Active Radar Crisis System (Step 1)
      activeCrisis: null,
      nextCrisisTime: Date.now() + 45000,
      isCrisisModalOpen: false,

      // Roguelite Wild Expeditions (Step 2)
      wildExpedition: createDefaultWildExpedition(),

      // Dynamic Commodity Market (Step 3)
      marketTrends: createInitialMarketTrends(),
      marketNextRefresh: Date.now() + 180000,
      marketNewsTicker: {
        headline: 'East Port Egg Shortage: Eggs selling at 200% for the next 2 minutes!',
        itemId: 'egg',
        multiplier: 2.0,
        expiresAt: Date.now() + 120000,
      },

      // Production Overclocking (Step 4 & Global System)
      buildingOverclocks: createDefaultBuildingOverclocks(),
      entityOverclocks: {},

      // Water System & Farm Well (Soil Hydration & 2x Growth Boost)
      waterLevel: 10,
      maxWaterLevel: 10,
      wellLevel: 1,
      lastWellAutoRefill: null,

      lastTick: Date.now(),

      // Cloud Sync & Auth
      isDirty: false,
      isGuest: true,
      lastCloudSyncTimestamp: null,

      // ---- Actions ----

      plantCrop: (plotId, cropId) => {
        const state = get();
        const plot = state.plots[plotId];
        if (!plot || plot.crop !== null) return;
        if (plotId >= state.unlockedPlots) return;

        const plotOverclock = state.entityOverclocks?.[`plot_${plotId}`];
        if (plotOverclock?.isExhausted && plotOverclock?.exhaustedUntil && Date.now() < plotOverclock.exhaustedUntil) {
          state.addNotification(`Plot #${plotId + 1} soil is exhausted! Revitalize soil or wait for recovery.`, '⚠️', 'info');
          return;
        }

        const cropDef = CROPS[cropId];
        if (cropDef.seedCost > 0 && state.coins < cropDef.seedCost) return;
        if (cropDef.seedCost > 0) {
          set({ coins: state.coins - cropDef.seedCost });
        }
        const newPlots = [...state.plots];
        newPlots[plotId] = {
          id: plotId,
          crop: cropId,
          plantedAt: Date.now(),
          ready: false,
          isWatered: plot.isWatered || false,
          wateredUntil: plot.wateredUntil || null,
        };
        set({ plots: newPlots });
      },

      harvestPlot: (plotId) => {
        const state = get();
        const plot = state.plots[plotId];
        if (!plot || !plot.crop || !plot.ready) return;
        const cropDef = CROPS[plot.crop];

        const plotOverclock = state.entityOverclocks?.[`plot_${plotId}`];
        const bonusYield = (plotOverclock?.isOverclocked && plotOverclock.bonusYield) ? plotOverclock.bonusYield : 0;
        const totalYield = cropDef.yieldCount + bonusYield;
        const newSilo = { ...state.silo, [plot.crop]: (state.silo[plot.crop] || 0) + totalYield };
        const newPlots = [...state.plots];
        // Harvest resets soil hydration so next crops require fresh watering
        newPlots[plotId] = {
          id: plotId,
          crop: null,
          plantedAt: null,
          ready: false,
          isWatered: false,
          wateredUntil: null,
        };

        let updatedOverclocks = state.entityOverclocks;
        if (plotOverclock?.isOverclocked) {
          const rollBurnout = Math.random() < plotOverclock.burnoutChance;
          const now = Date.now();
          updatedOverclocks = {
            ...state.entityOverclocks,
            [`plot_${plotId}`]: {
              ...plotOverclock,
              isOverclocked: false,
              activeTier: null,
              speedMultiplier: 1.0,
              bonusYield: 0,
              isExhausted: rollBurnout,
              exhaustedUntil: rollBurnout ? now + 180000 : null,
            },
          };
          if (rollBurnout) {
            playDefeatSound();
            state.addNotification(`⚠️ Soil Exhaustion: Plot #${plotId + 1} burned out & exhausted for 180s! Apply Soil Revitalizer or rest.`, '🛑', 'event');
          } else if (bonusYield > 0) {
            state.addNotification(`💥 Overdrive Harvest! +${bonusYield} Bonus ${cropDef.name} Yield!`, '⭐', 'info');
          }
        }

        // Alchemical Bloom Event Integration
        let newSystemicEvent = state.systemicEvent;
        let newRelics = { ...state.relics };
        if (state.systemicEvent?.id === 'alchemical_bloom' && state.systemicEvent.phase === 'active') {
          const newProg = state.systemicEvent.progress + 1;
          const isDone = newProg >= state.systemicEvent.target;
          newSystemicEvent = {
            ...state.systemicEvent,
            progress: newProg,
            isCompleted: isDone,
            phase: isDone ? 'settlement' : 'active',
          };
          if (Math.random() < 0.5) {
            newRelics.glowingSpores += 1;
            state.addNotification('✨ Harvested a Glowing Alchemical Spore!', '🍄', 'info');
          }
        }

        const xpMultiplier = (state.relics.ancientSunRelic ? 1.15 : 1.0) * (state.relics.circusCub ? 1.10 : 1.0);
        const { xp: newXp, level: newLevel } = levelUpCheck(state.xp + Math.round(3 * xpMultiplier), state.level);
        set({
          silo: newSilo,
          plots: newPlots,
          entityOverclocks: updatedOverclocks,
          xp: newXp,
          level: newLevel,
          systemicEvent: newSystemicEvent,
          relics: newRelics,
        });
      },

      plantAllCrops: (cropId) => {
        const state = get();
        const cropDef = CROPS[cropId];
        const now = Date.now();
        // Find all empty unlocked plots that are NOT exhausted
        const emptyPlotIds: number[] = [];
        for (let i = 0; i < state.unlockedPlots; i++) {
          const pOverclock = state.entityOverclocks?.[`plot_${i}`];
          const isExhausted = Boolean(pOverclock?.isExhausted && pOverclock?.exhaustedUntil && now < pOverclock.exhaustedUntil);
          if (state.plots[i] && state.plots[i].crop === null && !isExhausted) {
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
          newPlots[pid] = {
            id: pid,
            crop: cropId,
            plantedAt: now,
            ready: false,
            isWatered: state.plots[pid]?.isWatered || false,
            wateredUntil: state.plots[pid]?.wateredUntil || null,
          };
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
        let updatedOverclocks = { ...state.entityOverclocks };
        let harvestedCount = 0;
        let anyBurnout = false;
        let totalBonusYield = 0;

        for (let i = 0; i < state.unlockedPlots; i++) {
          const plot = state.plots[i];
          if (plot && plot.crop && plot.ready) {
            const cropDef = CROPS[plot.crop];
            const plotOverclock = updatedOverclocks[`plot_${i}`];
            const bonus = (plotOverclock?.isOverclocked && plotOverclock.bonusYield) ? plotOverclock.bonusYield : 0;
            totalBonusYield += bonus;
            newSilo[plot.crop] = (newSilo[plot.crop] || 0) + cropDef.yieldCount + bonus;
            newPlots[i] = {
              id: i,
              crop: null,
              plantedAt: null,
              ready: false,
              isWatered: false,
              wateredUntil: null,
            };
            if (plotOverclock?.isOverclocked) {
              const rollBurnout = Math.random() < plotOverclock.burnoutChance;
              if (rollBurnout) anyBurnout = true;
              updatedOverclocks[`plot_${i}`] = {
                ...plotOverclock,
                isOverclocked: false,
                activeTier: null,
                speedMultiplier: 1.0,
                bonusYield: 0,
                isExhausted: rollBurnout,
                exhaustedUntil: rollBurnout ? now + 180000 : null,
              };
            }
            harvestedCount++;
          }
        }
        if (harvestedCount === 0) return;
        if (anyBurnout) {
          playDefeatSound();
          state.addNotification('⚠️ Soil Exhaustion: One or more plots burned out from overdrive! Revitalize soil or rest.', '🛑', 'event');
        } else if (totalBonusYield > 0) {
          state.addNotification(`💥 Overdrive Harvest! +${totalBonusYield} Bonus Harvest Yields Collected!`, '⭐', 'info');
        }

        // Alchemical Bloom Event Integration
        let newSystemicEvent = state.systemicEvent;
        let newRelics = { ...state.relics };
        if (state.systemicEvent?.id === 'alchemical_bloom' && state.systemicEvent.phase === 'active') {
          const newProg = state.systemicEvent.progress + harvestedCount;
          const isDone = newProg >= state.systemicEvent.target;
          newSystemicEvent = {
            ...state.systemicEvent,
            progress: newProg,
            isCompleted: isDone,
            phase: isDone ? 'settlement' : 'active',
          };
          let sporesFound = 0;
          for (let s = 0; s < harvestedCount; s++) {
            if (Math.random() < 0.5) sporesFound++;
          }
          if (sporesFound > 0) {
            newRelics.glowingSpores += sporesFound;
            state.addNotification(`✨ Harvested ${sporesFound} Glowing Alchemical Spores!`, '🍄', 'info');
          }
        }

        const xpMultiplier = (state.relics.ancientSunRelic ? 1.15 : 1.0) * (state.relics.circusCub ? 1.10 : 1.0);
        const { xp: newXp, level: newLevel } = levelUpCheck(state.xp + Math.round(3 * harvestedCount * xpMultiplier), state.level);
        set({
          silo: newSilo,
          plots: newPlots,
          xp: newXp,
          level: newLevel,
          systemicEvent: newSystemicEvent,
          relics: newRelics,
        });
      },

      feedAnimal: (animalId) => {
        const state = get();
        const animal = state.animals.find(a => a.id === animalId);
        if (!animal || animal.fed || animal.productReady) return;

        const aOverclock = state.entityOverclocks?.[`animal_${animalId}`];
        const isExhausted = Boolean(
          (aOverclock?.isExhausted && aOverclock?.exhaustedUntil && Date.now() < aOverclock.exhaustedUntil) ||
          (animal.isExhausted && animal.exhaustedUntil && Date.now() < animal.exhaustedUntil)
        );
        if (isExhausted) {
          state.addNotification('Animal is exhausted! Call Vet or wait for recovery.', '⚠️', 'info');
          return;
        }

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

        // 1. Primary Product Yield + Overclock Bonus
        const aOverclock = state.entityOverclocks?.[`animal_${animalId}`];
        const bonusYield = (aOverclock?.isOverclocked && aOverclock.bonusYield) ? aOverclock.bonusYield : 0;

        if (breedDef) {
          newBarn[breedDef.primaryProductKey] = (newBarn[breedDef.primaryProductKey] || 0) + breedDef.baseYieldAmount + bonusYield;
        } else {
          // Fallback to species default
          newBarn[speciesDef.product] = (newBarn[speciesDef.product] || 0) + speciesDef.productYield + bonusYield;
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

        // Overclock Burnout Roll & Reset
        let updatedOverclocks = state.entityOverclocks;
        let rolledBurnout = false;
        if (aOverclock?.isOverclocked) {
          rolledBurnout = Math.random() < aOverclock.burnoutChance;
          const now = Date.now();
          updatedOverclocks = {
            ...state.entityOverclocks,
            [`animal_${animalId}`]: {
              ...aOverclock,
              isOverclocked: false,
              activeTier: null,
              speedMultiplier: 1.0,
              bonusYield: 0,
              isExhausted: rolledBurnout,
              exhaustedUntil: rolledBurnout ? now + 180000 : null,
            },
          };
          if (rolledBurnout) {
            playDefeatSound();
            state.addNotification(`⚠️ Animal Burnout: ${breedDef?.name || speciesDef.name} is exhausted for 180s! Call Vet or rest.`, '🛑', 'event');
          } else if (bonusYield > 0) {
            state.addNotification(`💥 Overdrive Yield! +${bonusYield} Bonus Product Collected!`, '⭐', 'info');
          }
        }

        const newCyclesRemaining = animal.cyclesRemaining - 1;
        const isElder = newCyclesRemaining <= 0;
        const nowTime = Date.now();
        const newAnimals = state.animals.map(a =>
          a.id === animalId ? {
            ...a,
            fed: false,
            fedAt: null,
            productReady: false,
            cyclesRemaining: newCyclesRemaining,
            cyclesCompletedTotal: totalCompleted,
            age: isElder ? 'elder' : a.age,
            isOverclocked: false,
            overclockExpiresAt: null,
            isExhausted: rolledBurnout ? true : a.isExhausted,
            exhaustedUntil: rolledBurnout ? nowTime + 180000 : a.exhaustedUntil,
          } : a
        );
        const { xp: newXp, level: newLevel } = levelUpCheck(state.xp + additionalXp, state.level);
        set({
          barn: newBarn,
          animals: newAnimals,
          entityOverclocks: updatedOverclocks,
          xp: newXp,
          level: newLevel,
          coins: state.coins + additionalCoins,
          gems: state.gems + additionalGems,
          codex: newCodex,
        });
      },

      feedAllAnimals: () => {
        const state = get();
        let feedAvailable = state.silo.feed || 0;
        if (feedAvailable <= 0) return;
        const now = Date.now();
        const newAnimals = state.animals.map(a => {
          // Skip if already fed, producing, elder, or exhausted
          const aOverclock = state.entityOverclocks?.[`animal_${a.id}`];
          const isExhausted = Boolean(
            (aOverclock?.isExhausted && aOverclock?.exhaustedUntil && now < aOverclock.exhaustedUntil) ||
            (a.isExhausted && a.exhaustedUntil && now < a.exhaustedUntil)
          );
          if (a.fed || a.productReady || a.age === 'elder' || isExhausted) return a;
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
        let updatedOverclocks = { ...state.entityOverclocks };
        let anyBurnout = false;
        let totalBonusYield = 0;
        const now = Date.now();

        const newAnimals = state.animals.map(a => {
          if (!a.productReady || a.cyclesRemaining <= 0) return a;

          const breedDef = BREED_REGISTRY[a.breedId];
          const speciesDef = ANIMALS[a.species];
          const aOverclock = updatedOverclocks[`animal_${a.id}`];
          const bonusYield = (aOverclock?.isOverclocked && aOverclock.bonusYield) ? aOverclock.bonusYield : 0;
          totalBonusYield += bonusYield;

          // 1. Primary Product Yield + Overclock Bonus
          if (breedDef) {
            newBarn[breedDef.primaryProductKey] = (newBarn[breedDef.primaryProductKey] || 0) + breedDef.baseYieldAmount + bonusYield;
          } else {
            newBarn[speciesDef.product] = (newBarn[speciesDef.product] || 0) + speciesDef.productYield + bonusYield;
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

          // Burnout roll
          let rolledBurnout = false;
          if (aOverclock?.isOverclocked) {
            rolledBurnout = Math.random() < aOverclock.burnoutChance;
            if (rolledBurnout) anyBurnout = true;
            updatedOverclocks[`animal_${a.id}`] = {
              ...aOverclock,
              isOverclocked: false,
              activeTier: null,
              speedMultiplier: 1.0,
              bonusYield: 0,
              isExhausted: rolledBurnout,
              exhaustedUntil: rolledBurnout ? now + 180000 : null,
            };
          }

          const newCyclesRemaining = a.cyclesRemaining - 1;
          const isElder = newCyclesRemaining <= 0;
          collectedCount++;
          return {
            ...a,
            fed: false,
            fedAt: null,
            productReady: false,
            cyclesRemaining: newCyclesRemaining,
            cyclesCompletedTotal: totalCompleted,
            age: isElder ? 'elder' : a.age,
            isOverclocked: false,
            overclockExpiresAt: null,
            isExhausted: rolledBurnout ? true : a.isExhausted,
            exhaustedUntil: rolledBurnout ? now + 180000 : a.exhaustedUntil,
          };
        });
        if (collectedCount === 0) return;
        if (anyBurnout) {
          playDefeatSound();
          state.addNotification('⚠️ Animal Burnout: One or more animals exhausted from overdrive! Call Vet or rest.', '🛑', 'event');
        } else if (totalBonusYield > 0) {
          state.addNotification(`💥 Overdrive Yield! +${totalBonusYield} Bonus Livestock Products Collected!`, '⭐', 'info');
        }
        const { xp: newXp, level: newLevel } = levelUpCheck(state.xp + additionalXp, state.level);
        set({
          barn: newBarn,
          animals: newAnimals,
          entityOverclocks: updatedOverclocks,
          xp: newXp,
          level: newLevel,
          coins: state.coins + additionalCoins,
          gems: state.gems + additionalGems,
          codex: newCodex,
        });
      },

      buyAnimal: (species, tier = 'common' as Tier) => {
        const state = get();
        const tierCount = state.animals.filter(a => a.tier === tier).length;
        if (tierCount >= 4 || state.animals.length >= 16) {
          state.addNotification(`The ${TIER_LABELS[tier]} sector is at full capacity (4/4)! Breed to fill higher tiers.`, '⚠️', 'info');
          return;
        }
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

        const bOverclock = state.entityOverclocks?.[`building_${buildingId}`] || state.buildingOverclocks?.[buildingId];
        if (bOverclock?.isExhausted && bOverclock?.exhaustedUntil && Date.now() < bOverclock.exhaustedUntil) {
          state.addNotification(`${building.name} is exhausted/overheated! Service machine or wait.`, '⚠️', 'info');
          return;
        }

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

        const bOverclock = state.entityOverclocks?.[`building_${buildingId}`] || state.buildingOverclocks?.[buildingId];
        const isOverclocked = Boolean(bOverclock?.isOverclocked && (!bOverclock.expiresAt || Date.now() < bOverclock.expiresAt));
        const bonusYield = isOverclocked && bOverclock?.bonusYield ? bOverclock.bonusYield : 0;
        const totalOutput = outputQty + bonusYield;

        const isCropOutput = outputItem in CROPS || outputItem === 'feed' || outputItem === 'cotton' || outputItem === 'honey_comb' || outputItem === 'wild_berries' || outputItem === 'gold_nugget';
        const newSilo = { ...state.silo };
        const newBarn = { ...state.barn };
        if (isCropOutput) {
          newSilo[outputItem] = (newSilo[outputItem] || 0) + totalOutput;
        } else {
          newBarn[outputItem] = (newBarn[outputItem] || 0) + totalOutput;
        }

        let updatedOverclocks = state.entityOverclocks;
        let updatedBuildingOverclocks = state.buildingOverclocks;
        if (isOverclocked && bOverclock) {
          const rollBurnout = Math.random() < bOverclock.burnoutChance;
          const now = Date.now();
          if (rollBurnout) {
            playDefeatSound();
            state.addNotification(`⚠️ Machine Burnout: ${building.name} overheated & exhausted for 180s! Call Mechanic or rest.`, '🛑', 'event');
            updatedOverclocks = {
              ...state.entityOverclocks,
              [`building_${buildingId}`]: {
                ...bOverclock,
                isOverclocked: false,
                activeTier: null,
                speedMultiplier: 1.0,
                bonusYield: 0,
                isExhausted: true,
                exhaustedUntil: now + 180000,
              },
            };
            updatedBuildingOverclocks = {
              ...state.buildingOverclocks,
              [buildingId]: {
                isOverclocked: false,
                expiresAt: null,
                isExhausted: true,
                exhaustedUntil: now + 180000,
              },
            };
          } else if (bonusYield > 0) {
            state.addNotification(`💥 Overdrive Craft! +${bonusYield} Bonus ${outputItem} produced!`, '⭐', 'info');
          }
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
          entityOverclocks: updatedOverclocks,
          buildingOverclocks: updatedBuildingOverclocks,
          xp: newXp,
          level: newLevel,
        });
      },

      startProductionAll: (buildingId, recipe) => {
        const state = get();
        const building = BUILDINGS[buildingId];
        if (!building) return;
        if (building.unlockLevel && state.level < building.unlockLevel) return;

        const bOverclock = state.entityOverclocks?.[`building_${buildingId}`] || state.buildingOverclocks?.[buildingId];
        if (bOverclock?.isExhausted && bOverclock?.exhaustedUntil && Date.now() < bOverclock.exhaustedUntil) {
          state.addNotification(`${building.name} is exhausted/overheated! Service machine or wait.`, '⚠️', 'info');
          return;
        }

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

      fulfillDeliveryOrder: (orderId: string, route: 'safe' | 'wild' = 'safe') => {
        const state = get();
        const order = state.orders.find(o => o.id === orderId);
        if (!order) return { success: false, message: 'Order not found' };

        const newSilo = { ...state.silo };
        const newBarn = { ...state.barn };
        const required = order.requiredItems || (order.requested?.map(r => ({ itemId: r.itemId, quantity: r.qty, name: r.name, icon: r.emoji })) || []);

        for (const item of required) {
          const isCrop = isCropItem(item.itemId);
          const storage = isCrop ? newSilo : newBarn;
          if ((storage[item.itemId] || 0) < item.quantity) {
            return { success: false, message: `Need ${item.quantity} ${item.name}` };
          }
          storage[item.itemId] = (storage[item.itemId] || 0) - item.quantity;
        }

        const baseCoins = order.rewards?.coins || order.coinReward || 20;
        let baseGems = order.rewards?.gems || order.bonusGems || 0;
        const repGain = order.rewards?.reputationPoints || 15;
        let specialItemWon = order.rewards?.specialItem || (order.relicFragmentReward ? 'Relic Fragment' : undefined);

        // Client Perks multipliers:
        const clientRep = state.clientReputation || DEFAULT_CLIENT_REPUTATION;
        const mayorLevel = clientRep.mayor_barnaby?.level || 1;
        const mayorMult = mayorLevel >= 5 ? 1.15 : (mayorLevel >= 2 ? 1.05 : 1.0);

        const chefLevel = clientRep.chef_antoine?.level || 1;
        const chefMult = (chefLevel >= 4 && order.clientId === 'chef_antoine') ? 1.20 : 1.0;

        const ladyLevel = clientRep.lady_guinevere?.level || 1;
        const ladyMult = (ladyLevel >= 4 && order.clientId === 'lady_guinevere') ? 1.25 : 1.0;

        const crownBonus = (state.relics.royalCrownCrestUntil && state.relics.royalCrownCrestUntil > Date.now()) ? 1.15 : 1.0;
        let finalCoins = Math.round(baseCoins * crownBonus * mayorMult * chefMult * ladyMult);

        // Route Logistics Check
        let hazardEncountered = false;
        let routeNotice = '';
        if (route === 'wild') {
          const captainLevel = clientRep.captain_sterling?.level || 1;
          const captainReduc = captainLevel >= 3 ? 0.12 : 0;
          const riskRate = Math.max(0.08, 0.25 - captainReduc);

          if (Math.random() < riskRate) {
            hazardEncountered = true;
            const jedLevel = clientRep.old_man_jed?.level || 1;
            const tollPercent = jedLevel >= 3 ? 0.08 : 0.15;
            const lossCoins = Math.floor(finalCoins * tollPercent);
            finalCoins = Math.max(1, finalCoins - lossCoins);
            routeNotice = `⚠️ Road Ambush: Convoy surrendered ${lossCoins} coins in transit toll.`;
            playDefeatSound();
          } else {
            const wildBounty = Math.round(finalCoins * 0.25);
            finalCoins += wildBounty;
            if (Math.random() < 0.40 && !specialItemWon) {
              specialItemWon = 'Plank';
            }
            routeNotice = `🌲 Wild Shortcut Conquered! +${wildBounty} Hazard Bonus Coins secured!`;
            playGoldRushFanfare();
          }
        }

        // Reputation progression (Dual-Track Progression: Lifetime XP + Spendable Favor)
        const cKey = order.clientId || 'mayor_barnaby';
        const cDef = CLIENT_DEFINITIONS[cKey] || CLIENT_DEFINITIONS.mayor_barnaby;
        const cState = clientRep[cKey] || { level: 1, xp: 0 };
        const newXpTotal = cState.xp + repGain;
        const repInfo = getReputationInfo(newXpTotal, cDef);

        const updatedClientRep = {
          ...clientRep,
          [cKey]: {
            level: repInfo.level,
            xp: newXpTotal,
          },
        };

        const currentGlobalRep = state.globalReputation || createInitialGlobalReputation();
        const existingClientData = currentGlobalRep.clients[cKey] || createInitialClientData(cKey, cDef.name, cDef.title, cDef.avatar);
        const updatedGlobalClientXp = existingClientData.currentXp + repGain;
        const clientLvlInfo = getClientLevelFromXp(updatedGlobalClientXp, existingClientData.tiers);

        const updatedClients = {
          ...currentGlobalRep.clients,
          [cKey]: {
            ...existingClientData,
            currentXp: updatedGlobalClientXp,
            currentLevel: clientLvlInfo.level,
          },
        };
        const updatedUnlockedPerks = computeUnlockedPerks(updatedClients);
        const updatedGlobalRep: GlobalReputationState = {
          spendableFavor: (currentGlobalRep.spendableFavor || 0) + repGain,
          clients: updatedClients,
          unlockedPerks: updatedUnlockedPerks,
        };

        if (clientLvlInfo.level > existingClientData.currentLevel || repInfo.level > cState.level) {
          playVictoryChime();
          state.addNotification(
            `⭐ CLIENT PROMOTION! ${cDef.name} reached Reputation Level ${clientLvlInfo.level}! Perk Unlocked: ${clientLvlInfo.currentTier.perkTitle}!`,
            cDef.avatar,
            'event'
          );
        }

        // Naval charter perk from Captain Sterling Lv 5
        const sterlingLevel = clientRep.captain_sterling?.level || 1;
        if (sterlingLevel >= 5 && Math.random() < 0.25 && !specialItemWon) {
          specialItemWon = Math.random() < 0.5 ? 'Expansion Deed' : 'Nail';
        }

        const xpBonus = (state.relics.ancientSunRelic ? 1.15 : 1.0) * (state.relics.circusCub ? 1.10 : 1.0);
        const { xp: newXp, level: newLevel } = levelUpCheck(state.xp + Math.round((order.rewards?.xp || order.xpReward || 15) * xpBonus), state.level);

        const newOrders = state.orders.map(o => o.id === orderId ? generateDeliveryOrder(newLevel) : o);

        playCashRegisterSound();
        state.addNotification(
          `🚚 Delivery Complete: +${finalCoins} Coins, +${repGain} Rep & Favor! ${routeNotice}${specialItemWon ? ` Found ${specialItemWon}!` : ''}`,
          '📦',
          'event'
        );

        set({
          silo: newSilo,
          barn: newBarn,
          coins: state.coins + finalCoins,
          gems: state.gems + baseGems,
          xp: newXp,
          level: newLevel,
          clientReputation: updatedClientRep,
          globalReputation: updatedGlobalRep,
          orders: newOrders,
          isDirty: true,
        });

        return { success: true, hazardEncountered, message: routeNotice };
      },

      fulfillOrder: (orderId) => {
        get().fulfillDeliveryOrder(orderId, 'safe');
      },

      trashOrder: (orderId) => {
        const state = get();
        const order = state.orders.find(o => o.id === orderId);
        let newCoins = state.coins;
        if (order && (order.type === 'rush' || order.type === 'futures' || order.isRushOrder)) {
          const fee = order.penaltyCoins || order.breachFee || Math.max(15, Math.round((order.rewards?.coins || order.coinReward || 50) * 0.10));
          newCoins = Math.max(0, newCoins - fee);
          playDefeatSound();
          state.addNotification(`⚠️ Contract Cancelled: Paid breach cancellation fee of ${fee} coins.`, '📉', 'event');
        }
        const newOrders = state.orders.map(o => o.id === orderId ? generateDeliveryOrder(state.level) : o);
        set({ coins: newCoins, orders: newOrders, isDirty: true });
      },

      sellItem: (itemId, qty) => {
        const state = get();
        const isCrop = isCropItem(itemId);
        const storage = isCrop ? state.silo : state.barn;
        const available = storage[itemId] || 0;
        if (available < qty) return;
        // Determine sell price with dynamic market multiplier & 60% liquidation rate
        let basePrice = 1;
        if (itemId in CROPS) {
          const cropDef = CROPS[itemId as CropId];
          basePrice = Math.max(1, Math.floor(cropDef.seedCost / 2) + 1);
        } else {
          const product = PRODUCTS[itemId as keyof typeof PRODUCTS];
          if (product) basePrice = product.sellPrice;
        }
        const marketMult = state.marketTrends?.[itemId]?.multiplier || 1.0;
        const sellPrice = Math.max(1, Math.round(basePrice * marketMult * 0.60));

        playCashRegisterSound();

        if (isCrop) {
          set({ silo: { ...state.silo, [itemId]: available - qty }, coins: state.coins + sellPrice * qty, isDirty: true });
        } else {
          set({ barn: { ...state.barn, [itemId]: available - qty }, coins: state.coins + sellPrice * qty, isDirty: true });
        }
      },

      sellAllOfItem: (itemId) => {
        const state = get();
        const isCrop = isCropItem(itemId);
        const storage = isCrop ? state.silo : state.barn;
        const qty = storage[itemId] || 0;
        if (qty <= 0) return;
        let basePrice = 1;
        if (itemId in CROPS) {
          const cropDef = CROPS[itemId as CropId];
          basePrice = Math.max(1, Math.floor(cropDef.seedCost / 2) + 1);
        } else {
          const product = PRODUCTS[itemId as keyof typeof PRODUCTS];
          if (product) basePrice = product.sellPrice;
        }
        const marketMult = state.marketTrends?.[itemId]?.multiplier || 1.0;
        const sellPrice = Math.max(1, Math.round(basePrice * marketMult * 0.60));

        playCashRegisterSound();

        if (isCrop) {
          set({ silo: { ...state.silo, [itemId]: 0 }, coins: state.coins + sellPrice * qty, isDirty: true });
        } else {
          set({ barn: { ...state.barn, [itemId]: 0 }, coins: state.coins + sellPrice * qty, isDirty: true });
        }
      },

      sellAllItems: () => {
        const state = get();
        // Items excluded from shop (wheat, corn, feed are essential resources)
        const SHOP_HIDDEN = new Set(['wheat', 'corn', 'feed']);
        let totalCoins = 0;
        const newSilo = { ...state.silo };
        const newBarn = { ...state.barn };
        // Sell all silo items (crops + extras), skip hidden, 60% liquidation rate
        for (const [id, def] of Object.entries(CROPS)) {
          if (SHOP_HIDDEN.has(id)) continue;
          const qty = newSilo[id] || 0;
          if (qty > 0) {
            const basePrice = Math.max(1, Math.floor(def.seedCost / 2) + 1);
            const marketMult = state.marketTrends?.[id]?.multiplier || 1.0;
            const sellPrice = Math.max(1, Math.round(basePrice * marketMult * 0.60));
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
              const marketMult = state.marketTrends?.[id]?.multiplier || 1.0;
              const sellPrice = Math.max(1, Math.round(product.sellPrice * marketMult * 0.60));
              totalCoins += sellPrice * qty;
              newSilo[id] = 0;
            }
          }
        }
        // Sell all barn items, skip hidden, 60% liquidation rate
        for (const [id, def] of Object.entries(PRODUCTS)) {
          if (SHOP_HIDDEN.has(id)) continue;
          const qty = newBarn[id] || 0;
          if (qty > 0) {
            const marketMult = state.marketTrends?.[id]?.multiplier || 1.0;
            const sellPrice = Math.max(1, Math.round(def.sellPrice * marketMult * 0.60));
            totalCoins += sellPrice * qty;
            newBarn[id] = 0;
          }
        }
        if (totalCoins === 0) return;
        playCashRegisterSound();
        set({ silo: newSilo, barn: newBarn, coins: state.coins + totalCoins, isDirty: true });
      },

      buyFarmhand: (role) => {
        const state = get();
        const cost = 100;
        if (state.coins < cost) return;
        const fh: FarmhandInstance = { id: generateId(), role, level: 1, xp: 0, equippedOutfit: null };
        let newFishery = state.fishery;
        if (role === 'fisherman') {
          const now = Date.now();
          const newTimestamps = { ...state.fishery.lastCatchTimestamps };
          for (const zoneId of state.fishery.unlockedZones) {
            if (!newTimestamps[zoneId] || newTimestamps[zoneId] === 0) {
              newTimestamps[zoneId] = now;
            }
          }
          newFishery = { ...state.fishery, lastCatchTimestamps: newTimestamps };
        }
        set({ coins: state.coins - cost, farmhands: [...state.farmhands, fh], fishery: newFishery });
        state.addNotification('Fisherman hired! Automatically catching fish in unlocked waters.', '🎣', 'info');
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
        let newFishery = state.fishery;
        if (role === 'fisherman' || role === 'auto_fisherman') {
          const newTimestamps = { ...state.fishery.lastCatchTimestamps };
          for (const zoneId of state.fishery.unlockedZones) {
            if (!newTimestamps[zoneId] || newTimestamps[zoneId] === 0) {
              newTimestamps[zoneId] = now;
            }
          }
          newFishery = { ...state.fishery, lastCatchTimestamps: newTimestamps };
        }
        set({ coins: state.coins - cfg.baseCost, unifiedWorkers: newWorkers, fishery: newFishery });
        state.addNotification(`${cfg.name} hired!`, cfg.emoji, 'info');
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
        if (!parent1 || !parent2) return false;
        if (parent1.species !== parent2.species) return false;
        if (state.activeBreedings.length >= state.breedingSlots) return false;

        // Check if all 16 sanctuary spaces are already filled or occupied by incubating eggs
        const totalAnimals = state.animals.length;
        const totalPending = state.activeBreedings.length;
        if (totalAnimals + totalPending >= 16) {
          playDefeatSound();
          state.addNotification('All 16 sanctuary spaces (Common, Uncommon, Rare, Legendary) are full or reserved by incubating eggs!', '⚠️', 'info');
          return false;
        }

        // Roll tier based on parent tiers using probability engine
        let offspringTier = rollBreedingTier(parent1.tier, parent2.tier);

        // 5% Mutation Chance for rare apex mutant tier variant
        const isMutantRoll = Math.random() < 0.05;
        const mutantDef = isMutantRoll ? MUTATION_VARIANTS[parent1.species] : null;

        let finalTier: Tier = mutantDef ? 'legendary' : offspringTier;

        // Check per-tier capacities: each tier (common, uncommon, rare, legendary) has 4 slots (16 total).
        // If the rolled tier is already full (current animals in tier + pending incubating eggs in tier >= 4),
        // auto-promote to the next tier with open space so the player can keep breeding until ALL 16 spaces are filled!
        const tierOrder: Tier[] = ['common', 'uncommon', 'rare', 'legendary'];
        const getTierOccupancy = (t: Tier) => {
          const countInSanctuary = state.animals.filter(a => a.tier === t).length;
          const pendingInIncubator = state.activeBreedings.filter(b => b.offspringTier === t).length;
          return countInSanctuary + pendingInIncubator;
        };

        if (getTierOccupancy(finalTier) >= 4) {
          // Find next tier in order with space (< 4)
          let promotedTier: Tier | null = null;
          const startIdx = tierOrder.indexOf(finalTier);
          for (let i = startIdx + 1; i < tierOrder.length; i++) {
            if (getTierOccupancy(tierOrder[i]) < 4) {
              promotedTier = tierOrder[i];
              break;
            }
          }
          // If no higher tier is open, check any other open tier
          if (!promotedTier) {
            for (let i = 0; i < tierOrder.length; i++) {
              if (getTierOccupancy(tierOrder[i]) < 4) {
                promotedTier = tierOrder[i];
                break;
              }
            }
          }
          if (promotedTier) {
            finalTier = promotedTier;
            offspringTier = promotedTier;
          }
        }

        const offspringBreedId = mutantDef ? mutantDef.id : `${parent1.species}_${finalTier}`;
        const durationSec = INCUBATION_TIMES[finalTier] || 120;
        const durationMs = durationSec * 1000;

        const breeding: ActiveBreeding = {
          id: generateId(),
          species: parent1.species,
          parent1Id,
          parent2Id,
          startedAt: Date.now(),
          durationMs,
          offspringTier: finalTier,
          offspringBreedId,
          isMutated: Boolean(mutantDef),
          mutationVariant: mutantDef ? mutantDef.name : undefined,
          mutationBonus: mutantDef ? mutantDef.speedBonus : undefined,
          notified: false,
        };

        // Mark parents as unavailable (fed state)
        const newAnimals = state.animals.map(a => {
          if (a.id === parent1Id || a.id === parent2Id) {
            return { ...a, fed: true, fedAt: Date.now() };
          }
          return a;
        });

        playClockTickSound(true);
        set({
          animals: newAnimals,
          activeBreedings: [...state.activeBreedings, breeding],
        });
        return true;
      },

      speedUpBreeding: (breedingId: string) => {
        const state = get();
        const breeding = state.activeBreedings.find(b => b.id === breedingId);
        if (!breeding) return false;
        const elapsed = Date.now() - breeding.startedAt;
        const remainingSec = Math.max(0, Math.ceil((breeding.durationMs - elapsed) / 1000));
        if (remainingSec <= 0) return false;

        const costCoins = Math.max(5, Math.ceil(remainingSec * 0.5));
        if (state.coins < costCoins) {
          playDefeatSound();
          state.addNotification(`Not enough coins for incubator speedup! Need 🪙${costCoins}.`, '⚠️', 'info');
          return false;
        }

        const updatedBreedings = state.activeBreedings.map(b => {
          if (b.id === breedingId) {
            return { ...b, startedAt: Date.now() - b.durationMs };
          }
          return b;
        });

        playCashRegisterSound();
        set({
          coins: state.coins - costCoins,
          activeBreedings: updatedBreedings,
        });

        state.addNotification('⚡ Incubator speedup successful! Egg is ready to hatch!', '✨', 'event');
        return true;
      },

      claimHatchedAnimal: (breedingId: string) => {
        const state = get();
        const breeding = state.activeBreedings.find(b => b.id === breedingId);
        if (!breeding) return null;
        const elapsed = Date.now() - breeding.startedAt;
        if (elapsed < breeding.durationMs) return null;

        // Check total animal sanctuary capacity (16 slots across all 4 tiers)
        if (state.animals.length >= 16) {
          playDefeatSound();
          state.addNotification(
            'Cannot hatch egg! All 16 animal sanctuary spaces across Common, Uncommon, Rare, and Legendary are full (16/16).',
            '⚠️',
            'info'
          );
          return null;
        }

        const tierOrder: Tier[] = ['common', 'uncommon', 'rare', 'legendary'];
        let offspringTier: Tier = breeding.offspringTier || 'common';

        // Check if the target tier is already at 4/4 capacity
        const currentTierCount = state.animals.filter(a => a.tier === offspringTier).length;
        if (currentTierCount >= 4) {
          // Promote to the next available tier that has an open slot (< 4)
          const openTier = tierOrder.find(t => state.animals.filter(a => a.tier === t).length < 4);
          if (openTier) {
            offspringTier = openTier;
          }
        }

        const parent1 = state.animals.find(a => a.id === breeding.parent1Id);
        const parent2 = state.animals.find(a => a.id === breeding.parent2Id);

        const parent1BreedName = parent1 ? (BREED_REGISTRY[parent1.breedId]?.name || TIER_LABELS[parent1.tier]) : 'Parent 1';
        const parent2BreedName = parent2 ? (BREED_REGISTRY[parent2.breedId]?.name || TIER_LABELS[parent2.tier]) : 'Parent 2';

        const p1TierIdx = parent1 ? tierOrder.indexOf(parent1.tier) : 0;
        const p2TierIdx = parent2 ? tierOrder.indexOf(parent2.tier) : 0;
        const maxParentTierIdx = Math.max(p1TierIdx, p2TierIdx);
        const offspringTierIdx = tierOrder.indexOf(offspringTier);
        const wasMutationUp = offspringTierIdx > maxParentTierIdx;

        const breedId = breeding.isMutated && breeding.offspringBreedId
          ? breeding.offspringBreedId
          : `${breeding.species}_${offspringTier}`;
        const breedDef = BREED_REGISTRY[breedId];
        const breedName = breedDef?.name || TIER_LABELS[offspringTier];
        const maxCycles = breeding.isMutated ? 25 : (breedDef ? breedDef.maxCycles : randomMaxCycles(offspringTier));

        const newAnimal: AnimalInstance = {
          id: generateId(),
          species: breeding.species,
          tier: offspringTier,
          breedId,
          fed: false,
          fedAt: null,
          productReady: false,
          age: 'baby',
          maxCycles,
          cyclesRemaining: maxCycles,
          cyclesCompletedTotal: 0,
          isMutated: breeding.isMutated,
          mutationVariant: breeding.mutationVariant,
          mutationBonus: breeding.mutationBonus,
        };

        const isNewCodex = !state.codex[breedId];
        let gemReward = isNewCodex && breedDef ? (breedDef.codexGemReward || 0) : 0;
        if (breeding.isMutated && !state.codex[`mutant_${breedId}`]) {
          gemReward += 5;
        }

        const updatedCodex = {
          ...state.codex,
          [breedId]: true,
          ...(breeding.isMutated ? { [`mutant_${breedId}`]: true } : {}),
        };

        // Reset parents
        const updatedAnimals = state.animals.map(a => {
          if (a.id === breeding.parent1Id || a.id === breeding.parent2Id) {
            return { ...a, fed: false, fedAt: null };
          }
          return a;
        });

        // Remove breeding from activeBreedings
        const updatedBreedings = state.activeBreedings.filter(b => b.id !== breedingId);

        if (offspringTier === 'legendary' || breeding.isMutated) {
          playGoldRushFanfare();
        } else {
          playVictoryChime();
        }

        const revealData: HatchRevealData = {
          animal: newAnimal,
          breedName,
          parent1BreedName,
          parent2BreedName,
          isNewCodex,
          gemReward,
          wasMutationUp,
        };

        const updatedCapacity = {
          ...state.animalCapacity,
          [breeding.species]: Math.max(state.animalCapacity[breeding.species] || 16, 16),
        };

        set({
          animals: [...updatedAnimals, newAnimal],
          activeBreedings: updatedBreedings,
          animalCapacity: updatedCapacity,
          codex: updatedCodex,
          gems: state.gems + gemReward,
          hatchReveal: revealData,
        });

        return newAnimal;
      },

      clearHatchReveal: () => {
        set({ hatchReveal: null });
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

        // Systemic event physics modifiers (v2.3)
        const isAlchemicalBloom = state.systemicEvent?.id === 'alchemical_bloom' && state.systemicEvent.phase === 'active';
        const isBarnFireActive = state.systemicEvent?.id === 'barn_fire' && state.systemicEvent.phase === 'active';
        const firePlotIds = state.systemicEvent?.activeFirePositions || [];
        const isAshSoilActive = Boolean(state.relics?.mineralAshUntil && state.relics.mineralAshUntil > now);
        const ashMultiplier = isAshSoilActive ? 3.0 : 1.0;

        // Flash Weather hazard 50% slow-down penalty (Step 1)
        const isFlashWeatherSlow = Boolean(
          state.activeCrisis &&
          state.activeCrisis.type === 'flash_weather' &&
          state.activeCrisis.resolvedStatus === 'pending' &&
          !state.activeCrisis.shieldActive
        );
        const weatherMultiplier = isFlashWeatherSlow ? 0.5 : 1.0;

        // Update plots
        const rainBoost = state.activeEvent?.type === 'rainstorm' ? 0.5 : 0;
        const newPlots = state.plots.map(p => {
          if (p.crop && p.plantedAt && !p.ready) {
            // Under barn_fire, unwatered/burning plots are frozen
            if (isBarnFireActive && firePlotIds.includes(p.id)) {
              return p;
            }
            const plotOverclock = state.entityOverclocks?.[`plot_${p.id}`];
            const isPlotExhausted = Boolean(plotOverclock?.isExhausted && plotOverclock?.exhaustedUntil && now < plotOverclock.exhaustedUntil);
            if (isPlotExhausted) {
              return p; // Growth halted during soil exhaustion
            }
            const plotMultiplier = (plotOverclock?.isOverclocked && !p.ready) ? plotOverclock.speedMultiplier : 1.0;
            const elapsed = (now - p.plantedAt) / 1000;
            const waterBoost = p.isWatered ? 2.0 : 1.0;
            const effectiveElapsed = (rainBoost > 0 ? elapsed * (1 + rainBoost) : elapsed) * ashMultiplier * waterBoost * weatherMultiplier * plotMultiplier;
            const cropBaseSec = CROPS[p.crop].growTimeSec;
            // Under alchemical_bloom: All crop growth times drop to a flat 30 seconds
            const growTime = isAlchemicalBloom ? Math.min(30, cropBaseSec) : cropBaseSec;
            if (effectiveElapsed >= growTime) {
              return { ...p, ready: true };
            }
          }
          return p;
        });

        // Update animal production (with Overclocking & Mutation modifiers)
        const newAnimals = state.animals.map(a => {
          if (a.fed && a.fedAt && !a.productReady) {
            const aOverclock = state.entityOverclocks?.[`animal_${a.id}`];
            const isAnimalExhausted = Boolean(
              (aOverclock?.isExhausted && aOverclock?.exhaustedUntil && now < aOverclock.exhaustedUntil) ||
              (a.isExhausted && a.exhaustedUntil && now < a.exhaustedUntil)
            );
            if (isAnimalExhausted) {
              return a; // Production halted during exhaustion
            }
            const isOverclocked = Boolean(
              (aOverclock?.isOverclocked && (!aOverclock.expiresAt || now < aOverclock.expiresAt)) ||
              (a.isOverclocked && a.overclockExpiresAt && now < a.overclockExpiresAt)
            );
            const overclockMultiplier = aOverclock?.isOverclocked ? aOverclock.speedMultiplier : (isOverclocked ? 3.0 : 1.0);
            const mutationMultiplier = a.isMutated ? (a.mutationBonus || 1.5) : 1.0;
            const elapsed = ((now - a.fedAt) / 1000) * overclockMultiplier * mutationMultiplier * weatherMultiplier;
            // Use breed-specific production time from BREED_REGISTRY if available
            const breedDef = BREED_REGISTRY[a.breedId];
            const prodTime = breedDef ? breedDef.baseIntervalMs / 1000 : ANIMALS[a.species].productionTimeSec;
            if (elapsed >= prodTime) {
              return {
                ...a,
                productReady: true,
              };
            }
          }
          return a;
        });

        // Update production queues (with Artisan Masterclass, Master Ledger, and Overclocking modifiers)
        const isArtisanMasterclass = state.systemicEvent?.id === 'artisan_masterclass' && state.systemicEvent.phase === 'active';
        const masterLedgerMultiplier = state.relics?.masterArtisanLedger ? 1.0526 : 1.0;
        const newQueues: Record<BuildingId, ProductionSlot[]> = { ...state.productionQueues };
        for (const buildingId of Object.keys(BUILDINGS) as BuildingId[]) {
          const queue = state.productionQueues[buildingId] || [];
          const bOverclock = state.buildingOverclocks?.[buildingId];
          const isBuildingOverclocked = Boolean(bOverclock?.isOverclocked && bOverclock?.expiresAt && now < bOverclock.expiresAt);
          const isBuildingExhausted = Boolean(bOverclock?.isExhausted && bOverclock?.exhaustedUntil && now < bOverclock.exhaustedUntil);
          if (isBuildingExhausted) {
            newQueues[buildingId] = queue;
            continue; // Halted while exhausted
          }
          const overclockMultiplier = isBuildingOverclocked ? 3.0 : 1.0;
          const isArtisanWorkshop = buildingId === 'bakery' || buildingId === 'loom' || buildingId === 'press';
          const speedMultiplier = (isArtisanMasterclass && isArtisanWorkshop ? 4.0 : 1.0) * masterLedgerMultiplier * overclockMultiplier;

          newQueues[buildingId] = queue.map(slot => {
            if (!slot.done) {
              const elapsed = ((now - slot.startedAt) / 1000) * speedMultiplier;
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
        const hasFisherman = state.farmhands.some(f => f.role === 'fisherman') || state.autonomousWorkers.some(w => w.type === 'fisherman') || Boolean(state.unifiedWorkers?.fisherman?.isHired) || Boolean(state.unifiedWorkers?.auto_fisherman?.isHired);

        const rod = ROD_TIERS[state.fishery.rodTier];
        if (hasFisherman) {
        for (const zoneId of state.fishery.unlockedZones) {
          const zone = WATER_ZONES[zoneId];
          const lastCatch = state.fishery.lastCatchTimestamps[zoneId] || 0;
          if (lastCatch === 0) continue;

          const fOverclock = state.entityOverclocks?.[`fishery_${zoneId}`];
          const isFisheryExhausted = Boolean(fOverclock?.isExhausted && fOverclock?.exhaustedUntil && now < fOverclock.exhaustedUntil);
          if (isFisheryExhausted) {
            continue; // Halted while reel is jammed/exhausted
          }
          const isFisheryOverclocked = Boolean(fOverclock?.isOverclocked && (!fOverclock.expiresAt || now < fOverclock.expiresAt));
          const fMultiplier = isFisheryOverclocked ? fOverclock.speedMultiplier : 1.0;

          const interval = (zone.baseIntervalMs * rod.speedMultiplier) / fMultiplier;
          // Outfit bonus
          const hasSlicker = state.farmhands.some(fh => fh.role === 'fisherman' && fh.equippedOutfit === 'fisherman_slicker');
          const effectiveInterval = hasSlicker ? interval * 0.67 : interval;

          if (now - lastCatch >= effectiveInterval) {
            const catchResult = rollFishCatch(zoneId, state.fishery.rodTier, newFishCodex);
            if (catchResult) {
              const fishDef = FISH_SPECIES[catchResult.speciesId];
              const bonusQty = (isFisheryOverclocked && fOverclock?.bonusYield) ? fOverclock.bonusYield : 0;
              const catchQty = 1 + bonusQty;
              newBarn[fishDef.id] = (newBarn[fishDef.id] || 0) + catchQty;
              newBarn.fish = (newBarn.fish || 0) + catchQty;
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

              // Roll burnout on catch cycle completion
              if (isFisheryOverclocked && Math.random() < fOverclock.burnoutChance) {
                playDefeatSound();
                state.addNotification(`⚠️ Reel Jam: ${zone.name} fishing gear overheated & exhausted for 180s! Service reel or rest.`, '⚙️', 'event');
                if (state.entityOverclocks[`fishery_${zoneId}`]) {
                  state.entityOverclocks[`fishery_${zoneId}`] = {
                    ...fOverclock,
                    isOverclocked: false,
                    activeTier: null,
                    speedMultiplier: 1.0,
                    bonusYield: 0,
                    isExhausted: true,
                    exhaustedUntil: now + 180000,
                  };
                }
              }
            }
            newCatchTimestamps[zoneId] = now;
          }
        }
        } // end if (hasFisherman)

        // Check if workers are paused due to sudden crisis penalty
        const areWorkersPaused = Boolean(state.workersPausedUntil && now < state.workersPausedUntil);

        // Autonomous workers tick (legacy — kept for backward compat, but main logic is unified below)
        let newCoins = state.coins;
        const newWorkers = areWorkersPaused ? state.autonomousWorkers : state.autonomousWorkers.map(w => {
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
        let updatedWorkerOverclocks = state.entityOverclocks;
        if (!areWorkersPaused) {
          for (const role of Object.keys(updatedUnifiedWorkers) as WorkerRole[]) {
            const worker = updatedUnifiedWorkers[role];
            if (!worker || !worker.isHired) continue;

            const wOverclock = state.entityOverclocks?.[`worker_${role}`];
            const isWorkerExhausted = Boolean(wOverclock?.isExhausted && wOverclock?.exhaustedUntil && now < wOverclock.exhaustedUntil);
            if (isWorkerExhausted) {
              continue; // Worker resting during fatigue exhaustion
            }
            const isWorkerOverclocked = Boolean(wOverclock?.isOverclocked && (!wOverclock.expiresAt || now < wOverclock.expiresAt));
            const wMultiplier = isWorkerOverclocked ? wOverclock.speedMultiplier : 1.0;

            const cfg = WORKER_REGISTRY[role];
            const effectiveInterval = workerEffectiveInterval(role, worker.level) / wMultiplier;
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
                // ---- Double/Triple Proc + Overclock Bonus ----
                let multiplier = 1;
                const doubleChance = workerDoubleProcChance(worker.level);
                if (Math.random() < doubleChance) {
                  if (workerTripleProcUnlocked(worker.level) && Math.random() < 0.15) {
                    multiplier = 3; // Triple yield!
                  } else {
                    multiplier = 2; // Double yield
                  }
                }
                if (isWorkerOverclocked && wOverclock?.bonusYield) {
                  multiplier += wOverclock.bonusYield;
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

              // Roll burnout on cycle finish
              if (isWorkerOverclocked && Math.random() < wOverclock.burnoutChance) {
                playDefeatSound();
                state.addNotification(`⚠️ Worker Fatigue: ${cfg.name} worked to exhaustion for 180s! Administer Energy Restorative or rest.`, '⚡', 'event');
                updatedWorkerOverclocks = {
                  ...updatedWorkerOverclocks,
                  [`worker_${role}`]: {
                    ...wOverclock,
                    isOverclocked: false,
                    activeTier: null,
                    speedMultiplier: 1.0,
                    bonusYield: 0,
                    isExhausted: true,
                    exhaustedUntil: now + 180000,
                  },
                };
              }

              // Update the worker instance
              updatedUnifiedWorkers[role] = {
                ...worker,
                lastActionTimestamp: newTimestamp,
                stats: { ...worker.stats },
              };
            }
          }
        } // end if (!areWorkersPaused)

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
            newEvent.chefOrder = generateChefOrder(state.level);
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

        // --- Dynamic Long-Form Systemic Event Engine Lifecycle (v2.3) ---
        let currentSystemicEvent = state.systemicEvent;
        let updatedCooldowns = { ...state.systemicEventCooldowns };

        if (currentSystemicEvent) {
          const eventDef = SYSTEMIC_EVENTS[currentSystemicEvent.id];

          // 1. Forecast -> Active Transition
          if (currentSystemicEvent.phase === 'forecast' && now >= currentSystemicEvent.forecastEndsAt) {
            let firePositions: number[] = [];
            let locustPositions: number[] = [];

            if (currentSystemicEvent.id === 'barn_fire') {
              const visiblePlots = state.plots.slice(0, state.unlockedPlots).map(p => p.id);
              firePositions = [...visiblePlots].sort(() => Math.random() - 0.5).slice(0, Math.min(5, visiblePlots.length));
            } else if (currentSystemicEvent.id === 'locust_swarm') {
              const cropPlots = state.plots.slice(0, state.unlockedPlots).filter(p => p.crop).map(p => p.id);
              locustPositions = cropPlots.slice(0, 6);
            }

            currentSystemicEvent = {
              ...currentSystemicEvent,
              phase: 'active',
              activeFirePositions: firePositions,
              locustPlotIds: locustPositions,
            };

            sendLocalEventPushNotification(
              `⚡ ${eventDef.name} is now ACTIVE!`,
              eventDef.mechanicalShift
            );
          }
          // 2. Active T-10m Urgency Reminder
          else if (
            currentSystemicEvent.phase === 'active' &&
            !currentSystemicEvent.lastNotifiedTMinus10 &&
            currentSystemicEvent.activeEndsAt - now <= 10 * 60 * 1000 &&
            currentSystemicEvent.activeEndsAt - now > 0
          ) {
            currentSystemicEvent = {
              ...currentSystemicEvent,
              lastNotifiedTMinus10: true,
            };
            sendLocalEventPushNotification(
              `⏳ Only 10 minutes left for ${eventDef.name}!`,
              `Deliver provisions and wrap up objectives before time runs out!`
            );
          }
          // 3. Active -> Settlement Transition on Expiration
          else if (currentSystemicEvent.phase === 'active' && now >= currentSystemicEvent.activeEndsAt) {
            currentSystemicEvent = {
              ...currentSystemicEvent,
              phase: 'settlement',
            };
          }
        }

        // Surprise Random Event Trigger Engine (Autonomous & Unpredictable)
        let newNextSurpriseEventTime = state.nextSurpriseEventTime;
        let newSurpriseAlert = state.surpriseEventAlert;

        if (!currentSystemicEvent) {
          if (!newNextSurpriseEventTime) {
            // Unscheduled: schedule surprise event in 2 to 5 minutes
            newNextSurpriseEventTime = now + 120_000 + Math.floor(Math.random() * 180_000);
          } else if (now >= newNextSurpriseEventTime) {
            // Surprise strike! Pick an eligible event matching farm level and cooldowns
            const eligibleIds = getEligibleRandomEvents(state.level, updatedCooldowns, now);
            const pickedId = eligibleIds[Math.floor(Math.random() * eligibleIds.length)];
            const def = SYSTEMIC_EVENTS[pickedId];

            currentSystemicEvent = {
              id: pickedId,
              phase: 'forecast',
              forecastEndsAt: now + def.forecastDurationMs,
              activeEndsAt: now + def.forecastDurationMs + def.activeDurationMs,
              currentStage: 1,
              progress: 0,
              target: def.stages[0].targetCount,
              claimedStages: [],
              isCompleted: false,
              activeFirePositions: [],
              locustPlotIds: [],
              fairPoints: 0,
              smugglerContractsCompleted: 0,
              donatedMaterials: 0,
            };

            newNextSurpriseEventTime = null;
            newSurpriseAlert = { id: pickedId, timestamp: now };

            state.addNotification(`⚡ SURPRISE EVENT: ${def.name} approaches!`, def.emoji, 'event');
            sendLocalEventPushNotification(`⚡ Horizon Alert: ${def.name}`, def.premise);
          }
        }

        // High-Stakes Sudden Event Engine Tick Logic (8-15 min window, high-urgency alarms)
        let currentSuddenEvent = state.activeSuddenEvent;
        let newSuddenEventTime = state.nextSuddenEventTime;
        let newSuddenFlash = state.suddenEventFlash;
        let newSuddenModalOpen = state.isSuddenEventModalOpen;
        let updatedWorkersPaused = state.workersPausedUntil;

        // 1. Check expiration of active event (Consequence Resolution)
        if (currentSuddenEvent && !currentSuddenEvent.resolved && now >= currentSuddenEvent.expiresAt) {
          const penalty = currentSuddenEvent.penaltyOnFail;
          if (penalty.lossType === 'CROPS') {
            const cropPlots = newPlots.filter(p => p.crop !== null);
            const countToRemove = Math.max(1, Math.floor(cropPlots.length * (penalty.amountPercentage / 100)));
            let removed = 0;
            for (let i = 0; i < newPlots.length && removed < countToRemove; i++) {
              if (newPlots[i].crop !== null) {
                newPlots[i] = { ...newPlots[i], crop: null, plantedAt: null, ready: false };
                removed++;
              }
            }
          } else if (penalty.lossType === 'COINS') {
            const loss = Math.floor(newCoins * (penalty.amountPercentage / 100));
            newCoins = Math.max(0, newCoins - loss);
          } else if (penalty.lossType === 'WORKER_PAUSE') {
            updatedWorkersPaused = now + 180_000; // 3 min pause
          }

          playDefeatSound();
          state.addNotification(`💥 Time Expired! ${penalty.description}`, '⚠️', 'event');

          currentSuddenEvent = null;
          newSuddenModalOpen = false;
          newSuddenFlash = null;
          newSuddenEventTime = now + getNextSuddenEventDelay();
        }
        // 2. Schedule or trigger sudden events within 8-15 min active playtime window
        else if (!currentSuddenEvent) {
          if (!newSuddenEventTime) {
            newSuddenEventTime = now + getNextSuddenEventDelay();
          } else if (now >= newSuddenEventTime) {
            const instance = createSuddenEventInstance(undefined, state.level);
            currentSuddenEvent = instance;
            newSuddenFlash = instance.type;
            newSuddenModalOpen = true;
            newSuddenEventTime = now + instance.durationSeconds * 1000 + getNextSuddenEventDelay();

            if (instance.type === 'CRISIS') {
              playCrisisAlarm();
            } else {
              playGoldRushFanfare();
            }

            state.addNotification(
              instance.type === 'CRISIS'
                ? `🚨 CRISIS: ${instance.title} - ${instance.durationSeconds}s remaining!`
                : `⚡ GOLD RUSH: ${instance.title} - ${instance.durationSeconds}s bounty!`,
              instance.emoji,
              'event'
            );
          }
        }

        // Breeding incubation progress check & notification
        let hasNewReadyEgg = false;
        const newActiveBreedings = state.activeBreedings.map(b => {
          if (now - b.startedAt >= b.durationMs && !b.notified) {
            hasNewReadyEgg = true;
            return { ...b, notified: true };
          }
          return b;
        });
        if (hasNewReadyEgg) {
          state.addNotification('🥚 An incubator egg is ready to hatch! Visit your Incubator to reveal it!', '✨', 'discovery');
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

        // Auto-refill well if wellLevel >= 5 (refills 1 water every 5 seconds)
        let newWaterLevel = state.waterLevel;
        let newLastWellAutoRefill = state.lastWellAutoRefill;
        if (state.wellLevel >= 5 && state.waterLevel < state.maxWaterLevel) {
          const lastRefill = state.lastWellAutoRefill || now;
          if (now - lastRefill >= 5000) {
            newWaterLevel = Math.min(state.maxWaterLevel, state.waterLevel + 1);
            newLastWellAutoRefill = now;
          }
        }

        // Active Radar Crisis System Tick (Step 1)
        let currentCrisis = state.activeCrisis;
        let newCrisisTime = state.nextCrisisTime;
        const baseInterval = 180;
        const crisisFrequencySec = Math.max(45, baseInterval - (state.level * 3));

        if (currentCrisis && currentCrisis.resolvedStatus === 'pending') {
          const remainingSec = Math.max(0, Math.ceil((currentCrisis.expiresAt - now) / 1000));
          if (now >= currentCrisis.expiresAt) {
            state.resolveCrisisFailure();
            currentCrisis = null;
            newCrisisTime = now + crisisFrequencySec * 1000;
          } else {
            currentCrisis = {
              ...currentCrisis,
              timer: remainingSec,
              infectionProgress: currentCrisis.type === 'crop_blight'
                ? Math.min(100, Math.floor(((45 - remainingSec) / 45) * 100))
                : undefined,
            };
          }
        } else if (!currentCrisis) {
          if (!newCrisisTime) {
            newCrisisTime = now + crisisFrequencySec * 1000;
          } else if (now >= newCrisisTime) {
            state.triggerCrisis();
            currentCrisis = get().activeCrisis;
            newCrisisTime = now + crisisFrequencySec * 1000;
          }
        }

        // Check VIP rush & advance futures orders countdown and sanitize any overlevel orders
        let ordersModified = false;
        const updatedOrders = state.orders.map(order => {
          const reqItems = order.requiredItems || (order.requested?.map((r: any) => ({ itemId: r.itemId })) || []);
          const hasOverlevelItem = reqItems.some((it: any) => (ITEM_UNLOCK_LEVELS[it.itemId] || 1) > state.level);
          if (hasOverlevelItem) {
            ordersModified = true;
            return generateDeliveryOrder(state.level, undefined, order.clientId);
          }
          const isTimed = order.type === 'rush' || order.type === 'futures' || order.isRushOrder;
          const expiryTime = order.expiresAt || order.rushExpiresAt;
          if (isTimed && expiryTime && now >= expiryTime) {
            ordersModified = true;
            const fee = order.penaltyCoins || order.breachFee || Math.max(15, Math.round((order.rewards?.coins || order.coinReward || 50) * 0.10));
            newCoins = Math.max(0, newCoins - fee);
            playDefeatSound();
            state.addNotification(`⚠️ ${order.type === 'futures' ? 'Advance Futures' : 'VIP Rush'} Contract expired! Paid breach fee of ${fee} coins.`, '📉', 'event');
            return generateDeliveryOrder(state.level, undefined, order.clientId);
          }
          return order;
        });

        // Dynamic Commodity Market refresh tick (Step 3 - every 3 min)
        let updatedMarketTrends = state.marketTrends;
        let updatedMarketRefresh = state.marketNextRefresh;
        let updatedNewsTicker = state.marketNewsTicker;
        if (!updatedMarketRefresh || now >= updatedMarketRefresh) {
          state.refreshMarketPrices();
          updatedMarketTrends = get().marketTrends;
          updatedMarketRefresh = get().marketNextRefresh;
          updatedNewsTicker = get().marketNewsTicker;
        }

        // Roguelite party stamina passive rest (Step 2)
        let updatedExpedition = state.wildExpedition;
        if (!updatedExpedition.isActive && updatedExpedition.partyStamina < 100) {
          updatedExpedition = {
            ...updatedExpedition,
            partyStamina: Math.min(100, Number((updatedExpedition.partyStamina + 0.2).toFixed(1))),
          };
        }

        // Level up check
        const { xp: finalXp, level: finalLevel } = levelUpCheck(state.xp, state.level);

        set({
          plots: newPlots,
          animals: newAnimals,
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
          systemicEvent: currentSystemicEvent,
          systemicEventCooldowns: updatedCooldowns,
          nextSurpriseEventTime: newNextSurpriseEventTime,
          surpriseEventAlert: newSurpriseAlert,
          activeSuddenEvent: currentSuddenEvent,
          nextSuddenEventTime: newSuddenEventTime,
          suddenEventFlash: newSuddenFlash,
          isSuddenEventModalOpen: newSuddenModalOpen,
          workersPausedUntil: updatedWorkersPaused,
          waterLevel: newWaterLevel,
          lastWellAutoRefill: newLastWellAutoRefill,
          orders: ordersModified ? updatedOrders : state.orders,
          activeCrisis: currentCrisis,
          nextCrisisTime: newCrisisTime,
          wildExpedition: updatedExpedition,
          marketTrends: updatedMarketTrends,
          marketNextRefresh: updatedMarketRefresh,
          marketNewsTicker: updatedNewsTicker,
          xp: finalXp,
          level: finalLevel,
          entityOverclocks: updatedWorkerOverclocks,
          lastTick: now,
        });
      },

      // Cloud Sync & Auth Actions
      markDirty: () => {
        set({ isDirty: true });
      },

      markClean: () => {
        set({ isDirty: false, lastCloudSyncTimestamp: Date.now() });
      },

      claimAccountLinkReward: () => {
        const state = get();
        if (!state.isGuest) return;
        set({
          gems: state.gems + 50,
          isGuest: false,
          isDirty: true,
        });
        state.addNotification('Homestead Protected! Claimed +50 Gems bonus.', '💎', 'info');
      },

      loadBackupSave: (payload) => {
        const state = get();
        set({
          ...state,
          ...payload,
          isDirty: false,
          lastTick: Date.now(),
        });
        get().addNotification('Local backup loaded successfully! Farm restored.', '💾', 'info');
      },

      loadCloudSave: (payload) => {
        get().loadBackupSave(payload);
      },

      fastForwardOfflineTime: (elapsedMs) => {
        if (elapsedMs <= 0) return;
        const now = Date.now();
        const state = get();

        // 1. Advance plots
        const auraMultiplier = state.currentEstateAura?.effectDetail?.type === 'growth_speed'
          ? state.currentEstateAura.effectDetail.value
          : 1.0;
        const newPlots = state.plots.map(p => {
          if (p.crop && p.plantedAt && !p.ready) {
            const cropDef = CROPS[p.crop];
            const growMs = cropDef.growTimeSec * 1000 * auraMultiplier;
            if (now - p.plantedAt >= growMs) {
              return { ...p, ready: true };
            }
          }
          return p;
        });

        // 2. Advance animals
        const newAnimals = state.animals.map(a => {
          if (a.fed && a.fedAt && !a.productReady) {
            const def = ANIMALS[a.species];
            const cycleMs = def.productionTimeSec * 1000;
            if (now - a.fedAt >= cycleMs) {
              return { ...a, productReady: true, fed: false, fedAt: null };
            }
          }
          return a;
        });

        // 3. Advance production queues
        const newQueues = { ...state.productionQueues };
        for (const bId of Object.keys(newQueues) as BuildingId[]) {
          newQueues[bId] = newQueues[bId].map(slot => {
            if (!slot.done && now - slot.startedAt >= slot.durationSec * 1000) {
              return { ...slot, done: true };
            }
            return slot;
          });
        }

        set({
          plots: newPlots,
          animals: newAnimals,
          productionQueues: newQueues,
          lastTick: now,
          isDirty: true,
        });
      },

      // ---- Dynamic Systemic Event Actions (v2.3) ----
      triggerSystemicEvent: (id) => {
        const state = get();
        const now = Date.now();
        const allEventIds = Object.keys(SYSTEMIC_EVENTS) as SystemicEventId[];
        let targetId = id;
        if (!targetId) {
          const eligible = allEventIds.filter(eid => (state.systemicEventCooldowns[eid] || 0) <= now);
          targetId = eligible.length > 0
            ? eligible[Math.floor(Math.random() * eligible.length)]
            : allEventIds[Math.floor(Math.random() * allEventIds.length)];
        }
        const def = SYSTEMIC_EVENTS[targetId];
        const newEvent: SystemicEventState = {
          id: targetId,
          phase: 'forecast',
          forecastEndsAt: now + def.forecastDurationMs,
          activeEndsAt: now + def.forecastDurationMs + def.activeDurationMs,
          currentStage: 1,
          progress: 0,
          target: def.stages[0].targetCount,
          claimedStages: [],
          isCompleted: false,
          activeFirePositions: [],
          locustPlotIds: [],
          fairPoints: 0,
          smugglerContractsCompleted: 0,
          donatedMaterials: 0,
        };

        state.addNotification(`⚠️ Approaching: ${def.name} in ${Math.round(def.forecastDurationMs / 60000)}m!`, def.emoji, 'event');
        sendLocalEventPushNotification(`⚠️ Forewarning: ${def.name}`, def.premise);
        set({ systemicEvent: newEvent, isDirty: true });
      },

      advanceSystemicEventPhase: () => {
        const state = get();
        if (!state.systemicEvent) return;
        const now = Date.now();
        const def = SYSTEMIC_EVENTS[state.systemicEvent.id];

        if (state.systemicEvent.phase === 'forecast') {
          let firePositions: number[] = [];
          let locustPositions: number[] = [];
          if (state.systemicEvent.id === 'barn_fire') {
            const visiblePlots = state.plots.slice(0, state.unlockedPlots).map(p => p.id);
            firePositions = [...visiblePlots].sort(() => Math.random() - 0.5).slice(0, Math.min(5, visiblePlots.length));
          } else if (state.systemicEvent.id === 'locust_swarm') {
            const cropPlots = state.plots.slice(0, state.unlockedPlots).filter(p => p.crop).map(p => p.id);
            locustPositions = cropPlots.slice(0, 6);
          }

          set({
            systemicEvent: {
              ...state.systemicEvent,
              phase: 'active',
              activeEndsAt: now + def.activeDurationMs,
              activeFirePositions: firePositions,
              locustPlotIds: locustPositions,
            },
            isDirty: true,
          });
          state.addNotification(`⚡ ${def.name} is now ACTIVE!`, def.emoji, 'event');
          sendLocalEventPushNotification(`⚡ ${def.name} Active!`, def.mechanicalShift);
        } else if (state.systemicEvent.phase === 'active') {
          set({
            systemicEvent: {
              ...state.systemicEvent,
              phase: 'settlement',
            },
            isDirty: true,
          });
        }
      },

      extinguishBrushfire: (plotIndex) => {
        const state = get();
        if (!state.systemicEvent || state.systemicEvent.id !== 'barn_fire' || state.systemicEvent.phase !== 'active') return;
        const currentFires = state.systemicEvent.activeFirePositions || [];
        if (!currentFires.includes(plotIndex)) return;

        const nextFires = currentFires.filter(p => p !== plotIndex);
        const newProgress = state.systemicEvent.progress + 1;
        const isDone = newProgress >= 5 || nextFires.length === 0;

        set({
          systemicEvent: {
            ...state.systemicEvent,
            activeFirePositions: nextFires,
            progress: newProgress,
            isCompleted: isDone,
            phase: isDone ? 'settlement' : 'active',
          },
          isDirty: true,
        });
        state.addNotification(`💧 Extinguished brushfire flare-up! (${newProgress}/5)`, '🪣', 'info');
      },

      captureLocust: (plotIndex) => {
        const state = get();
        if (!state.systemicEvent || state.systemicEvent.id !== 'locust_swarm' || state.systemicEvent.phase !== 'active') return;
        const currentLocusts = state.systemicEvent.locustPlotIds || [];
        const nextLocusts = currentLocusts.filter(p => p !== plotIndex);
        const newProgress = state.systemicEvent.progress + 1;
        const isDone = newProgress >= 30;

        if (!isDone && nextLocusts.length < 3) {
          const matureCropPlotIds = state.plots.slice(0, state.unlockedPlots).filter(p => p.crop && !nextLocusts.includes(p.id)).map(p => p.id);
          if (matureCropPlotIds.length > 0) {
            nextLocusts.push(matureCropPlotIds[Math.floor(Math.random() * matureCropPlotIds.length)]);
          }
        }

        set({
          systemicEvent: {
            ...state.systemicEvent,
            locustPlotIds: nextLocusts,
            progress: newProgress,
            isCompleted: isDone,
            phase: isDone ? 'settlement' : 'active',
          },
          isDirty: true,
        });
        state.addNotification(`🦗 Captured locust into containment jar! (${newProgress}/30)`, '🫙', 'info');
      },

      deliverFleetCrates: (items) => {
        const state = get();
        if (!state.systemicEvent || state.systemicEvent.id !== 'royal_fleet' || state.systemicEvent.phase !== 'active') return false;
        const def = SYSTEMIC_EVENTS.royal_fleet;
        const currentStageDef = def.stages[state.systemicEvent.currentStage - 1];
        if (!currentStageDef) return false;

        const newSilo = { ...state.silo };
        const newBarn = { ...state.barn };
        let totalItemsDelivered = 0;

        for (const item of items) {
          const isCrop = item.itemId in CROPS || item.itemId === 'feed' || item.itemId === 'cotton' || item.itemId === 'honey_comb' || item.itemId === 'wild_berries' || item.itemId === 'gold_nugget';
          const storage = isCrop ? newSilo : newBarn;
          if ((storage[item.itemId] || 0) < item.qty) return false;
          storage[item.itemId] = (storage[item.itemId] || 0) - item.qty;
          totalItemsDelivered += item.qty;
        }

        if (totalItemsDelivered === 0) return false;

        let newProgress = state.systemicEvent.progress + totalItemsDelivered;
        let nextStage = state.systemicEvent.currentStage;
        let isDone = false;

        if (newProgress >= currentStageDef.targetCount) {
          if (nextStage < def.stages.length) {
            nextStage += 1;
            state.addNotification(`⚓ Royal Shipping Ladder Stage ${nextStage} Unlocked!`, '🚢', 'info');
          } else {
            isDone = true;
            state.addNotification(`👑 Royal Fleet fully provisioned! Ready for grand payoff.`, '🏆', 'info');
          }
        }

        set({
          silo: newSilo,
          barn: newBarn,
          systemicEvent: {
            ...state.systemicEvent,
            progress: newProgress,
            currentStage: nextStage,
            target: def.stages[nextStage - 1]?.targetCount || currentStageDef.targetCount,
            isCompleted: isDone,
            phase: isDone ? 'settlement' : 'active',
          },
          isDirty: true,
        });
        return true;
      },

      deliverSmugglerContract: (items) => {
        const state = get();
        if (!state.systemicEvent || state.systemicEvent.id !== 'midnight_smuggler' || state.systemicEvent.phase !== 'active') return false;
        const newSilo = { ...state.silo };
        const newBarn = { ...state.barn };

        for (const item of items) {
          const isCrop = item.itemId in CROPS || item.itemId === 'feed' || item.itemId === 'cotton' || item.itemId === 'honey_comb' || item.itemId === 'wild_berries' || item.itemId === 'gold_nugget';
          const storage = isCrop ? newSilo : newBarn;
          if ((storage[item.itemId] || 0) < item.qty) return false;
          storage[item.itemId] = (storage[item.itemId] || 0) - item.qty;
        }

        const newProgress = state.systemicEvent.progress + 1;
        const isDone = newProgress >= 3;

        set({
          silo: newSilo,
          barn: newBarn,
          systemicEvent: {
            ...state.systemicEvent,
            progress: newProgress,
            smugglerContractsCompleted: newProgress,
            isCompleted: isDone,
            phase: isDone ? 'settlement' : 'active',
          },
          isDirty: true,
        });
        state.addNotification(`⛵ Smuggler trade contract fulfilled! (${newProgress}/3)`, '📦', 'info');
        return true;
      },

      submitCountyFairProduce: (items) => {
        const state = get();
        if (!state.systemicEvent || state.systemicEvent.id !== 'county_fair' || state.systemicEvent.phase !== 'active') return 0;
        const newSilo = { ...state.silo };
        const newBarn = { ...state.barn };
        let pointsEarned = 0;

        for (const item of items) {
          const isCrop = item.itemId in CROPS || item.itemId === 'feed' || item.itemId === 'cotton' || item.itemId === 'honey_comb' || item.itemId === 'wild_berries' || item.itemId === 'gold_nugget';
          const storage = isCrop ? newSilo : newBarn;
          if ((storage[item.itemId] || 0) < item.qty) continue;
          storage[item.itemId] = (storage[item.itemId] || 0) - item.qty;

          const scoreDef = FAIR_ITEM_SCORES[item.itemId] || { points: 1, rarity: 'common' };
          pointsEarned += scoreDef.points * item.qty;
        }

        if (pointsEarned === 0) return 0;

        const newPoints = (state.systemicEvent.fairPoints || 0) + pointsEarned;
        const isDone = newPoints >= 600;

        set({
          silo: newSilo,
          barn: newBarn,
          systemicEvent: {
            ...state.systemicEvent,
            fairPoints: newPoints,
            progress: newPoints,
            isCompleted: isDone,
            phase: isDone ? 'settlement' : 'active',
          },
          isDirty: true,
        });
        state.addNotification(`🎪 Submitted exhibition produce for +${pointsEarned} pts! (Total: ${newPoints}/600)`, '🏅', 'info');
        return pointsEarned;
      },

      catchMigrationFish: () => {
        const state = get();
        if (!state.systemicEvent || state.systemicEvent.id !== 'salmon_run' || state.systemicEvent.phase !== 'active') return;
        const newProgress = state.systemicEvent.progress + 1;
        const isDone = newProgress >= 15;
        const newBarn = { ...state.barn, fish: (state.barn.fish || 0) + 1 };

        let bonusGems = 0;
        if (Math.random() < 0.25) {
          bonusGems = 1;
        }

        set({
          barn: newBarn,
          gems: state.gems + bonusGems,
          systemicEvent: {
            ...state.systemicEvent,
            progress: newProgress,
            isCompleted: isDone,
            phase: isDone ? 'settlement' : 'active',
          },
          isDirty: true,
        });
        state.addNotification(
          bonusGems > 0
            ? `🐟 Hooked a Golden Migration Salmon & salvaged an antique lockbox (+1 💎)! (${newProgress}/15)`
            : `🐟 Hooked a Golden Migration Salmon! (${newProgress}/15)`,
          '🎣',
          'info'
        );
      },

      supplyCarnivalFeeds: (items) => {
        const state = get();
        if (!state.systemicEvent || state.systemicEvent.id !== 'carnival_circus' || state.systemicEvent.phase !== 'active') return false;
        const newSilo = { ...state.silo };
        const newBarn = { ...state.barn };
        let totalCount = 0;

        for (const item of items) {
          const isCrop = item.itemId in CROPS || item.itemId === 'feed' || item.itemId === 'cotton' || item.itemId === 'honey_comb' || item.itemId === 'wild_berries' || item.itemId === 'gold_nugget';
          const storage = isCrop ? newSilo : newBarn;
          if ((storage[item.itemId] || 0) < item.qty) return false;
          storage[item.itemId] = (storage[item.itemId] || 0) - item.qty;
          totalCount += item.qty;
        }

        if (totalCount === 0) return false;

        const newProgress = state.systemicEvent.progress + totalCount;
        const isDone = newProgress >= 100;
        let nextStage = state.systemicEvent.currentStage;
        if (newProgress >= 50) nextStage = 3;
        else if (newProgress >= 20) nextStage = 2;

        set({
          silo: newSilo,
          barn: newBarn,
          systemicEvent: {
            ...state.systemicEvent,
            progress: newProgress,
            currentStage: nextStage,
            target: nextStage === 3 ? 100 : nextStage === 2 ? 50 : 20,
            isCompleted: isDone,
            phase: isDone ? 'settlement' : 'active',
          },
          isDirty: true,
        });
        state.addNotification(`🦁 Supplied ${totalCount} animal feeds to carnival menagerie! (${newProgress}/100)`, '🥩', 'info');
        return true;
      },

      donateRuinsMaterials: (items) => {
        const state = get();
        if (!state.systemicEvent || state.systemicEvent.id !== 'ancient_ruins' || state.systemicEvent.phase !== 'active') return false;
        const newSilo = { ...state.silo };
        const newBarn = { ...state.barn };
        let totalCount = 0;

        for (const item of items) {
          const isCrop = item.itemId in CROPS || item.itemId === 'feed' || item.itemId === 'cotton' || item.itemId === 'honey_comb' || item.itemId === 'wild_berries' || item.itemId === 'gold_nugget';
          const storage = isCrop ? newSilo : newBarn;
          if ((storage[item.itemId] || 0) < item.qty) return false;
          storage[item.itemId] = (storage[item.itemId] || 0) - item.qty;
          totalCount += item.qty;
        }

        if (totalCount === 0) return false;

        const newProgress = state.systemicEvent.progress + totalCount;
        const isDone = newProgress >= 120;
        let nextStage = state.systemicEvent.currentStage;
        if (newProgress >= 60) nextStage = 3;
        else if (newProgress >= 25) nextStage = 2;

        set({
          silo: newSilo,
          barn: newBarn,
          systemicEvent: {
            ...state.systemicEvent,
            progress: newProgress,
            currentStage: nextStage,
            target: nextStage === 3 ? 120 : nextStage === 2 ? 60 : 25,
            isCompleted: isDone,
            phase: isDone ? 'settlement' : 'active',
          },
          isDirty: true,
        });
        state.addNotification(`🏛️ Donated ${totalCount} materials to temple excavation! (${newProgress}/120)`, '⛏️', 'info');
        return true;
      },

      claimSystemicGrandReward: () => {
        const state = get();
        if (!state.systemicEvent) return;
        const def = SYSTEMIC_EVENTS[state.systemicEvent.id];
        const now = Date.now();
        const newRelics = { ...state.relics };

        if (state.systemicEvent.id === 'royal_fleet') {
          newRelics.royalCrownCrestUntil = now + 24 * 60 * 60 * 1000;
        } else if (state.systemicEvent.id === 'barn_fire') {
          newRelics.mineralAshUntil = now + 60 * 60 * 1000;
        } else if (state.systemicEvent.id === 'midnight_smuggler') {
          newRelics.smugglersCompass = true;
        } else if (state.systemicEvent.id === 'locust_swarm') {
          newRelics.superFeedCharges += 5;
        } else if (state.systemicEvent.id === 'county_fair') {
          newRelics.countyFairTrophy = true;
        } else if (state.systemicEvent.id === 'salmon_run') {
          newRelics.feastOfKingsUnlocked = true;
        } else if (state.systemicEvent.id === 'carnival_circus') {
          newRelics.circusCub = true;
        } else if (state.systemicEvent.id === 'alchemical_bloom') {
          newRelics.glowingSpores += 8;
        } else if (state.systemicEvent.id === 'artisan_masterclass') {
          newRelics.masterArtisanLedger = true;
        } else if (state.systemicEvent.id === 'ancient_ruins') {
          newRelics.ancientSunRelic = true;
        }

        const newCooldowns = {
          ...state.systemicEventCooldowns,
          [def.id]: now + def.cooldownMs,
        };

        set({
          coins: state.coins + def.grandReward.coins,
          gems: state.gems + def.grandReward.gems,
          relics: newRelics,
          systemicEvent: null,
          systemicEventCooldowns: newCooldowns,
          lastSystemicEventCompletedAt: now,
          isDirty: true,
        });

        state.addNotification(
          `🏆 GRAND BOUNTY CLAIMED: +${def.grandReward.coins.toLocaleString()} Coins, +${def.grandReward.gems} Gems & ${def.grandReward.relicName}!`,
          def.grandReward.relicEmoji,
          'info'
        );
      },

      dismissSystemicEvent: () => {
        const state = get();
        if (!state.systemicEvent) return;
        const def = SYSTEMIC_EVENTS[state.systemicEvent.id];
        const now = Date.now();
        set({
          systemicEvent: null,
          systemicEventCooldowns: {
            ...state.systemicEventCooldowns,
            [def.id]: now + def.cooldownMs,
          },
          lastSystemicEventCompletedAt: now,
          nextSurpriseEventTime: now + 120_000 + Math.floor(Math.random() * 240_000), // Random surprise in 2-6 min
          surpriseEventAlert: null,
          isDirty: true,
        });
      },

      clearSurpriseEventAlert: () => {
        set({ surpriseEventAlert: null });
      },

      claimCountyFairTrophy: () => {
        const state = get();
        if (!state.relics.countyFairTrophy) return false;
        const now = Date.now();
        if (state.relics.lastCountyFairGemClaim && now - state.relics.lastCountyFairGemClaim < 24 * 60 * 60 * 1000) {
          return false;
        }
        set({
          gems: state.gems + 3,
          relics: {
            ...state.relics,
            lastCountyFairGemClaim: now,
          },
          isDirty: true,
        });
        state.addNotification('🏆 Claimed +3 Daily Gems from the County Fair Trophy!', '💎', 'info');
        return true;
      },

      useGlowingSpore: (buildingId, slotIndex) => {
        return get().applyGlowingSpore(buildingId, slotIndex);
      },

      applyGlowingSpore: (buildingId, slotIndex) => {
        const state = get();
        if (state.relics.glowingSpores <= 0) return false;
        const queue = state.productionQueues[buildingId] || [];
        if (!queue[slotIndex] || queue[slotIndex].done) return false;

        const newQueue = [...queue];
        newQueue[slotIndex] = { ...newQueue[slotIndex], done: true };

        set({
          relics: {
            ...state.relics,
            glowingSpores: state.relics.glowingSpores - 1,
          },
          productionQueues: {
            ...state.productionQueues,
            [buildingId]: newQueue,
          },
          isDirty: true,
        });
        state.addNotification('🧪 Alchemical Spore instantly finished production queue!', '✨', 'info');
        return true;
      },

      // High-Stakes Sudden Event Engine Actions
      triggerSuddenEvent: (eventId) => {
        const state = get();
        if (state.activeSuddenEvent) return;
        const instance = createSuddenEventInstance(eventId, state.level);
        if (instance.type === 'CRISIS') {
          playCrisisAlarm();
        } else {
          playGoldRushFanfare();
        }
        state.addNotification(
          instance.type === 'CRISIS'
            ? `🚨 CRISIS: ${instance.title} - ${instance.durationSeconds}s remaining!`
            : `⚡ GOLD RUSH: ${instance.title} - ${instance.durationSeconds}s bounty!`,
          instance.emoji,
          'event'
        );
        set({
          activeSuddenEvent: instance,
          suddenEventFlash: instance.type,
          isSuddenEventModalOpen: true,
          nextSuddenEventTime: Date.now() + instance.durationSeconds * 1000 + getNextSuddenEventDelay(),
          isDirty: true,
        });
      },

      progressSuddenEventTap: () => {
        const state = get();
        if (!state.activeSuddenEvent || state.activeSuddenEvent.resolved) return;
        if (state.activeSuddenEvent.requiredAction.type !== 'RAPID_TAP') return;

        const target = state.activeSuddenEvent.requiredAction.targetCount || 10;
        const newProgress = state.activeSuddenEvent.requiredAction.currentProgress + 1;
        playRapidTapSound(newProgress);

        if (newProgress >= target) {
          get().resolveSuddenEventSuccess();
        } else {
          set({
            activeSuddenEvent: {
              ...state.activeSuddenEvent,
              requiredAction: {
                ...state.activeSuddenEvent.requiredAction,
                currentProgress: newProgress,
              },
            },
            isDirty: true,
          });
        }
      },

      paySuddenEventResource: () => {
        const state = get();
        if (!state.activeSuddenEvent || state.activeSuddenEvent.resolved) return false;
        const cost = state.activeSuddenEvent.requiredAction.resourceCost;
        if (!cost) return false;

        if (cost.type === 'coins') {
          if (state.coins < cost.amount) return false;
          set({ coins: state.coins - cost.amount, isDirty: true });
        } else if (cost.type === 'crops') {
          const available = state.silo.wheat || 0;
          if (available < cost.amount) return false;
          set({
            silo: { ...state.silo, wheat: available - cost.amount },
            isDirty: true,
          });
        }

        get().resolveSuddenEventSuccess();
        return true;
      },

      resolveSuddenEventSuccess: () => {
        const state = get();
        if (!state.activeSuddenEvent || state.activeSuddenEvent.resolved) return;
        const reward = state.activeSuddenEvent.rewardOnSuccess;
        const { xp: newXp, level: newLevel } = levelUpCheck(state.xp + reward.xp, state.level);

        playVictoryChime();
        state.addNotification(
          `🎉 EVENT CLEARED! Claimed +${reward.coins.toLocaleString()} Coins, +${reward.gems} Gems, +${reward.xp} XP!`,
          '🏆',
          'event'
        );

        // Relic activation if applicable
        let newRelics = { ...state.relics };
        const eId = state.activeSuddenEvent.eventId;
        if (eId === 'barn_fire') {
          newRelics.mineralAshUntil = Date.now() + 60 * 60 * 1000;
        } else if (eId === 'royal_fleet') {
          newRelics.royalCrownCrestUntil = Date.now() + 24 * 60 * 60 * 1000;
        } else if (eId === 'midnight_smuggler') {
          newRelics.smugglersCompass = true;
        } else if (eId === 'county_fair') {
          newRelics.countyFairTrophy = true;
        } else if (eId === 'carnival_circus') {
          newRelics.circusCub = true;
        } else if (eId === 'alchemical_bloom') {
          newRelics.glowingSpores += 3;
        } else if (eId === 'artisan_masterclass') {
          newRelics.masterArtisanLedger = true;
        } else if (eId === 'ancient_ruins') {
          newRelics.ancientSunRelic = true;
        }

        set({
          coins: state.coins + reward.coins,
          gems: state.gems + reward.gems,
          xp: newXp,
          level: newLevel,
          relics: newRelics,
          activeSuddenEvent: null,
          isSuddenEventModalOpen: false,
          suddenEventFlash: null,
          nextSuddenEventTime: Date.now() + getNextSuddenEventDelay(),
          isDirty: true,
        });
      },

      resolveSuddenEventFailure: () => {
        const state = get();
        if (!state.activeSuddenEvent || state.activeSuddenEvent.resolved) return;
        playDefeatSound();

        const penalty = state.activeSuddenEvent.penaltyOnFail;
        let newCoins = state.coins;
        let newPlots = [...state.plots];
        let newWorkersPausedUntil = state.workersPausedUntil;

        if (penalty.lossType === 'CROPS') {
          const cropPlots = newPlots.filter(p => p.crop !== null);
          const countToRemove = Math.max(1, Math.floor(cropPlots.length * (penalty.amountPercentage / 100)));
          let removed = 0;
          for (let i = 0; i < newPlots.length && removed < countToRemove; i++) {
            if (newPlots[i].crop !== null) {
              newPlots[i] = { ...newPlots[i], crop: null, plantedAt: null, ready: false };
              removed++;
            }
          }
        } else if (penalty.lossType === 'COINS') {
          const loss = Math.floor(newCoins * (penalty.amountPercentage / 100));
          newCoins = Math.max(0, newCoins - loss);
        } else if (penalty.lossType === 'WORKER_PAUSE') {
          newWorkersPausedUntil = Date.now() + 180_000;
        }

        state.addNotification(`💥 Time Expired! ${penalty.description}`, '⚠️', 'event');

        set({
          coins: newCoins,
          plots: newPlots,
          workersPausedUntil: newWorkersPausedUntil,
          activeSuddenEvent: null,
          isSuddenEventModalOpen: false,
          suddenEventFlash: null,
          nextSuddenEventTime: Date.now() + getNextSuddenEventDelay(),
          isDirty: true,
        });
      },

      clearSuddenEventFlash: () => set({ suddenEventFlash: null }),
      setSuddenEventModalOpen: (open) => set({ isSuddenEventModalOpen: open }),

      adjustSuddenEventExpiry: (elapsedMs) => {
        if (elapsedMs <= 0) return;
        const state = get();
        let updatedActive = state.activeSuddenEvent;
        let updatedNext = state.nextSuddenEventTime;
        let updatedWorkers = state.workersPausedUntil;

        if (updatedActive && !updatedActive.resolved) {
          updatedActive = {
            ...updatedActive,
            expiresAt: updatedActive.expiresAt + elapsedMs,
          };
        }
        if (updatedNext) {
          updatedNext = updatedNext + elapsedMs;
        }
        if (updatedWorkers && updatedWorkers > Date.now()) {
          updatedWorkers = updatedWorkers + elapsedMs;
        }
        set({
          activeSuddenEvent: updatedActive,
          nextSuddenEventTime: updatedNext,
          workersPausedUntil: updatedWorkers,
        });
      },

      // Water System & Farm Well Actions
      pumpWell: () => {
        const state = get();
        if (state.waterLevel >= state.maxWaterLevel) return;
        set({
          waterLevel: Math.min(state.maxWaterLevel, state.waterLevel + 1),
          isDirty: true,
        });
      },

      upgradeWell: () => {
        const state = get();
        const cost = state.wellLevel * 150;
        if (state.coins < cost) return false;

        const newWellLevel = state.wellLevel + 1;
        const newMaxWater = state.maxWaterLevel + 5;

        set({
          coins: state.coins - cost,
          wellLevel: newWellLevel,
          maxWaterLevel: newMaxWater,
          waterLevel: newMaxWater,
          isDirty: true,
        });

        state.addNotification(
          newWellLevel >= 5
            ? `💧 Upgraded Well to Lv.${newWellLevel}! Auto-Refill unlocked (+1 water/5s)!`
            : `💧 Upgraded Well to Lv.${newWellLevel}! Max capacity: ${newMaxWater} 💧`,
          '⛲',
          'info'
        );

        return true;
      },

      waterPlot: (plotId) => {
        const state = get();
        if (state.waterLevel <= 0) return false;
        const plot = state.plots[plotId];
        if (!plot || plot.isWatered) return false;

        const newPlots = [...state.plots];
        let newPlantedAt = plot.plantedAt;

        // Halve remaining growth duration of the planted crop:
        // readyAt = Date.now() + (readyAt - Date.now()) / 2
        if (plot.crop && plot.plantedAt && !plot.ready) {
          const cropDef = CROPS[plot.crop];
          const totalMs = cropDef.growTimeSec * 1000;
          const now = Date.now();
          const elapsedMs = now - plot.plantedAt;
          const remainingMs = Math.max(0, totalMs - elapsedMs);
          const newRemainingMs = remainingMs / 2;
          newPlantedAt = now - (totalMs - newRemainingMs);
        }

        newPlots[plotId] = {
          ...plot,
          isWatered: true,
          wateredUntil: Date.now() + 60000,
          plantedAt: newPlantedAt,
        };

        set({
          waterLevel: state.waterLevel - 1,
          plots: newPlots,
          isDirty: true,
        });

        return true;
      },

      waterAllPlots: () => {
        const state = get();
        if (state.waterLevel <= 0) return;
        let currentWater = state.waterLevel;
        const newPlots = [...state.plots];
        let wateredCount = 0;
        const now = Date.now();

        for (let i = 0; i < state.unlockedPlots && currentWater > 0; i++) {
          const plot = newPlots[i];
          if (plot && !plot.isWatered) {
            let newPlantedAt = plot.plantedAt;
            if (plot.crop && plot.plantedAt && !plot.ready) {
              const cropDef = CROPS[plot.crop];
              const totalMs = cropDef.growTimeSec * 1000;
              const elapsedMs = now - plot.plantedAt;
              const remainingMs = Math.max(0, totalMs - elapsedMs);
              newPlantedAt = now - (totalMs - (remainingMs / 2));
            }
            newPlots[i] = {
              ...plot,
              isWatered: true,
              wateredUntil: now + 60000,
              plantedAt: newPlantedAt,
            };
            currentWater--;
            wateredCount++;
          }
        }

        if (wateredCount > 0) {
          set({
            waterLevel: currentWater,
            plots: newPlots,
            isDirty: true,
          });
        }
      },

      // Active Radar Crisis Actions (Step 1)
      triggerCrisis: (overrideType) => {
        const state = get();
        if (state.activeCrisis && state.activeCrisis.resolvedStatus === 'pending') return;

        const types: CrisisType[] = ['predator_raid', 'crop_blight', 'flash_weather'];
        const chosenType = overrideType || types[Math.floor(Math.random() * types.length)];
        const def = CRISIS_DEFINITIONS[chosenType];

        // Emergency Crisis Shield Intercept Check
        if ((state.crisisShields || 0) > 0) {
          const remainingShields = state.crisisShields - 1;
          set({
            crisisShields: remainingShields,
            nextCrisisTime: Date.now() + 180000,
            isDirty: true,
          });
          playVictoryChime();
          state.addNotification(
            `🛡️ Emergency Crisis Shield activated! Incoming ${def.title} was intercepted and repelled! (${remainingShields} shield${remainingShields === 1 ? '' : 's'} remaining)`,
            '🛡️',
            'event'
          );
          return;
        }

        let targetIds: (string | number)[] = [];
        let weatherType: 'drought' | 'blizzard' | undefined = undefined;

        if (chosenType === 'predator_raid') {
          const animalIds = state.animals.map(a => a.id);
          targetIds = [...animalIds].sort(() => Math.random() - 0.5).slice(0, Math.min(2, animalIds.length));
        } else if (chosenType === 'crop_blight') {
          const cropPlotIds = state.plots.slice(0, state.unlockedPlots).filter(p => p.crop !== null).map(p => p.id);
          const pool = cropPlotIds.length > 0 ? cropPlotIds : state.plots.slice(0, state.unlockedPlots).map(p => p.id);
          targetIds = [...pool].sort(() => Math.random() - 0.5).slice(0, Math.min(2, pool.length));
        } else if (chosenType === 'flash_weather') {
          weatherType = Math.random() < 0.5 ? 'drought' : 'blizzard';
        }

        const newCrisis: CrisisEvent = {
          id: `crisis_${Date.now()}`,
          type: chosenType,
          title: chosenType === 'flash_weather' ? `Flash ${weatherType === 'drought' ? 'Drought' : 'Blizzard'}` : def.title,
          emoji: chosenType === 'flash_weather' ? (weatherType === 'drought' ? '☀️' : '❄️') : def.emoji,
          description: def.description,
          timer: def.durationSec,
          expiresAt: Date.now() + def.durationSec * 1000,
          targetIds,
          resolvedStatus: 'pending',
          weatherType,
          shieldActive: false,
          infectionProgress: 0,
          alarmTaps: 0,
        };

        playSirenSting();
        state.addNotification(`🚨 RADAR ALERT: ${newCrisis.title}! 45s countdown active!`, newCrisis.emoji, 'event');

        set({
          activeCrisis: newCrisis,
          isCrisisModalOpen: true,
          suddenEventFlash: 'CRISIS',
          isDirty: true,
        });
      },

      resolveCrisisDefense: (actionType, targetId) => {
        const state = get();
        if (!state.activeCrisis || state.activeCrisis.resolvedStatus !== 'pending') return;

        const crisis = state.activeCrisis;

        if (crisis.type === 'predator_raid') {
          if (actionType === 'alarm') {
            const currentTaps = (crisis.alarmTaps || 0) + 1;
            playRapidTapSound(currentTaps);
            if (currentTaps >= 4) {
              playCashRegisterSound();
              playVictoryChime();
              state.addNotification('🦊 Alarm scared away the predators! Farm animals safe and sound!', '🎉', 'event');
              set({
                activeCrisis: { ...crisis, resolvedStatus: 'resolved', alarmTaps: currentTaps },
                coins: state.coins + 30,
                xp: state.xp + 45,
                isCrisisModalOpen: false,
                isDirty: true,
              });
            } else {
              set({
                activeCrisis: { ...crisis, alarmTaps: currentTaps },
                isDirty: true,
              });
            }
          } else if (actionType === 'dog') {
            const cost = 20;
            if (state.coins < cost) {
              state.addNotification('Need 20 coins to deploy guard dog!', '⚠️', 'event');
              return;
            }
            playCashRegisterSound();
            playVictoryChime();
            state.addNotification('🐕 Guard dog deployed! Predator raid repelled instantly!', '🛡️', 'event');
            set({
              coins: state.coins - cost,
              xp: state.xp + 60,
              activeCrisis: { ...crisis, resolvedStatus: 'resolved' },
              isCrisisModalOpen: false,
              isDirty: true,
            });
          }
        } else if (crisis.type === 'crop_blight') {
          if (actionType === 'quarantine') {
            const cost = 20;
            if (state.coins < cost) {
              state.addNotification('Need 20 coins to quarantine blight!', '⚠️', 'event');
              return;
            }
            const remainingTargetIds = targetId !== undefined
              ? crisis.targetIds.filter(id => id !== targetId)
              : crisis.targetIds.slice(1);

            playRapidTapSound(2);
            if (remainingTargetIds.length === 0) {
              playCashRegisterSound();
              playVictoryChime();
              state.addNotification('🌾 All infected plots quarantined and cured!', '✨', 'event');
              set({
                coins: state.coins - cost,
                xp: state.xp + 50,
                activeCrisis: { ...crisis, targetIds: [], resolvedStatus: 'resolved' },
                isCrisisModalOpen: false,
                isDirty: true,
              });
            } else {
              state.addNotification('Plot quarantined! 1 remaining.', '🛡️', 'event');
              set({
                coins: state.coins - cost,
                activeCrisis: { ...crisis, targetIds: remainingTargetIds },
                isDirty: true,
              });
            }
          }
        } else if (crisis.type === 'flash_weather') {
          if (actionType === 'shield') {
            const cost = 25;
            if (state.coins < cost) {
              state.addNotification('Need 25 coins for Emergency Shield booster!', '⚠️', 'event');
              return;
            }
            playCashRegisterSound();
            playVictoryChime();
            state.addNotification('🛡️ Emergency Shield activated! Weather slowdown neutralized!', '⚡', 'event');
            set({
              coins: state.coins - cost,
              xp: state.xp + 50,
              activeCrisis: { ...crisis, shieldActive: true },
              isDirty: true,
            });
          }
        }
      },

      resolveCrisisFailure: () => {
        const state = get();
        if (!state.activeCrisis || state.activeCrisis.resolvedStatus !== 'pending') return;

        const crisis = state.activeCrisis;
        playDefeatSound();

        if (crisis.type === 'predator_raid') {
          const newAnimals = state.animals.map(a => {
            if (crisis.targetIds.includes(a.id)) {
              return { ...a, fed: false, fedAt: null, productReady: false };
            }
            return a;
          });
          const newBarn = { ...state.barn };
          let stolenCount = 0;
          for (const [k, v] of Object.entries(newBarn)) {
            if (v > 0) {
              const loss = Math.ceil(v * 0.2);
              newBarn[k] = Math.max(0, v - loss);
              stolenCount += loss;
            }
          }
          state.addNotification(`🦊 Predator raid breached defenses! Stole ${stolenCount} goods & disrupted animal cycles!`, '💔', 'event');
          set({
            animals: newAnimals,
            barn: newBarn,
            activeCrisis: { ...crisis, resolvedStatus: 'failed' },
            isCrisisModalOpen: false,
            isDirty: true,
          });
        } else if (crisis.type === 'crop_blight') {
          const newPlots = [...state.plots];
          for (const pid of crisis.targetIds) {
            const plotIdNum = Number(pid);
            if (newPlots[plotIdNum]) {
              newPlots[plotIdNum] = { ...newPlots[plotIdNum], crop: null, plantedAt: null, ready: false };
            }
          }
          state.addNotification('🌾 Crop blight ruined infected plots!', '💥', 'event');
          set({
            plots: newPlots,
            activeCrisis: { ...crisis, resolvedStatus: 'failed' },
            isCrisisModalOpen: false,
            isDirty: true,
          });
        } else if (crisis.type === 'flash_weather') {
          state.addNotification('⛈️ Severe weather event concluded.', '⛅', 'event');
          set({
            activeCrisis: { ...crisis, resolvedStatus: 'failed' },
            isCrisisModalOpen: false,
            isDirty: true,
          });
        }
      },

      clearCrisis: () => {
        const state = get();
        const baseInterval = 180;
        const crisisFreqSec = Math.max(45, baseInterval - (state.level * 3));
        set({
          activeCrisis: null,
          isCrisisModalOpen: false,
          nextCrisisTime: Date.now() + crisisFreqSec * 1000,
          isDirty: true,
        });
      },

      setCrisisModalOpen: (open) => set({ isCrisisModalOpen: open }),

      // Roguelite Wild Expedition Actions (Step 2)
      startRogueliteExpedition: () => {
        const state = get();
        if (state.wildExpedition.isActive) return;
        if (state.wildExpedition.workerCooldownUntil && Date.now() < state.wildExpedition.workerCooldownUntil) {
          state.addNotification('Party resting from wipeout exhaustion!', '⏳', 'info');
          return;
        }

        let newStamina = state.wildExpedition.partyStamina;
        let newRations = state.wildExpedition.rations;
        if (newStamina < 20) {
          if (newRations > 0) {
            newRations -= 1;
            newStamina = 100;
          } else {
            state.addNotification('Not enough Stamina! Craft rations to proceed.', '⚠️', 'info');
            return;
          }
        } else {
          newStamina -= 15;
        }

        set({
          wildExpedition: {
            ...state.wildExpedition,
            isActive: true,
            currentDepth: 1,
            partyStamina: newStamina,
            rations: newRations,
            accumulatedLoot: {
              coins: 0,
              gems: 0,
              seeds: {},
              relicFragments: 0,
              geneTokens: 0,
              rareItems: {},
            },
            currentNodeStatus: 'ready',
            currentEncounter: null,
            history: ['Party dispatched to Depth 1: Whispering Outpost.'],
          },
          isDirty: true,
        });
      },

      progressRogueliteNode: () => {
        const state = get();
        const exp = state.wildExpedition;
        if (!exp.isActive) return;

        const depth = exp.currentDepth;
        const hazardRate = 0.15 + (depth - 1) * 0.20;
        const multiplier = Math.pow(2, depth - 1);

        const isHazardRoll = Math.random() < hazardRate;
        const encounterType = isHazardRoll ? 'hazard' : 'cache';

        const hazards: ('ambush' | 'poison_mist' | 'cave_in')[] = ['ambush', 'poison_mist', 'cave_in'];
        const chosenHazard = hazards[Math.floor(Math.random() * hazards.length)];

        const hazardNames = {
          ambush: 'Predator Ambush',
          poison_mist: 'Toxic Spore Mist',
          cave_in: 'Crag Cave-In Tremor',
        };

        const hazardDescriptions = {
          ambush: 'Wild beasts ambush your vanguard! High hazard threat.',
          poison_mist: 'Choking poison spores drain stamina rapidly.',
          cave_in: 'Falling rocks and boulders block the subterranean tunnel.',
        };

        const encounter = {
          type: encounterType as 'hazard' | 'cache',
          title: encounterType === 'hazard' ? hazardNames[chosenHazard] : `Hidden Cache (Depth ${depth})`,
          emoji: encounterType === 'hazard' ? (chosenHazard === 'ambush' ? '🐺' : chosenHazard === 'poison_mist' ? '🍄' : '🪨') : '🎁',
          description: encounterType === 'hazard' ? hazardDescriptions[chosenHazard] : 'Loot cache discovered amidst the thickets!',
          hazardType: encounterType === 'hazard' ? chosenHazard : undefined,
          hazardChance: Math.round(hazardRate * 100),
          staminaCost: 15 + depth * 3,
          lootReward: {
            coins: 60 * multiplier,
            gems: depth >= 2 ? 1 * (depth - 1) : 0,
            seeds: 'ancient_sunflower',
            relicFragments: depth >= 3 ? 1 * (depth - 2) : 0,
            geneTokens: 1 * multiplier,
          },
        };

        playRapidTapSound(1);

        set({
          wildExpedition: {
            ...exp,
            currentNodeStatus: encounterType === 'hazard' ? 'hazard' : 'cleared',
            currentEncounter: encounter,
            partyStamina: Math.max(0, exp.partyStamina - (encounterType === 'cache' ? 8 : 4)),
            accumulatedLoot: encounterType === 'cache' ? {
              ...exp.accumulatedLoot,
              coins: exp.accumulatedLoot.coins + encounter.lootReward.coins,
              gems: exp.accumulatedLoot.gems + encounter.lootReward.gems,
              geneTokens: exp.accumulatedLoot.geneTokens + (encounter.lootReward.geneTokens || 0),
              relicFragments: exp.accumulatedLoot.relicFragments + (encounter.lootReward.relicFragments || 0),
            } : exp.accumulatedLoot,
            history: [
              `Depth ${depth}: ${encounter.title} (${Math.round(hazardRate * 100)}% hazard risk)`,
              ...exp.history,
            ].slice(0, 10),
          },
          isDirty: true,
        });
      },

      resolveRogueliteHazard: (useTool) => {
        const state = get();
        const exp = state.wildExpedition;
        if (!exp.isActive || !exp.currentEncounter || exp.currentNodeStatus !== 'hazard') return;

        const encounter = exp.currentEncounter;
        const depth = exp.currentDepth;

        if (useTool && (exp.retreatTools > 0 || exp.rations > 0)) {
          const newTools = exp.retreatTools > 0 ? exp.retreatTools - 1 : exp.retreatTools;
          const newRations = exp.retreatTools > 0 ? exp.rations : exp.rations - 1;
          playCashRegisterSound();
          state.addNotification('Used Retreat Tool! Safely bypassed hazard and took the loot!', '🛡️', 'info');

          set({
            wildExpedition: {
              ...exp,
              retreatTools: newTools,
              rations: newRations,
              currentNodeStatus: 'cleared',
              accumulatedLoot: {
                ...exp.accumulatedLoot,
                coins: exp.accumulatedLoot.coins + encounter.lootReward.coins,
                gems: exp.accumulatedLoot.gems + encounter.lootReward.gems,
                geneTokens: exp.accumulatedLoot.geneTokens + (encounter.lootReward.geneTokens || 0),
                relicFragments: exp.accumulatedLoot.relicFragments + (encounter.lootReward.relicFragments || 0),
              },
              history: [`Tool bypassed ${encounter.title}! Loot secured!`, ...exp.history].slice(0, 10),
            },
            isDirty: true,
          });
          return;
        }

        const staminaDmg = 25 + depth * 5;
        const newStamina = Math.max(0, exp.partyStamina - staminaDmg);

        if (newStamina <= 0) {
          playDefeatSound();
          const salvagedCoins = Math.floor(exp.accumulatedLoot.coins * 0.25);
          const forfeitedCoins = exp.accumulatedLoot.coins - salvagedCoins;
          state.addNotification(`💀 EXPEDITION WIPEOUT! Lost 75% unextracted loot (-${forfeitedCoins} coins). Workers on cooldown!`, '💥', 'event');

          set({
            coins: state.coins + salvagedCoins,
            wildExpedition: {
              ...exp,
              isActive: false,
              partyStamina: 0,
              currentNodeStatus: 'wipeout',
              workerCooldownUntil: Date.now() + 180000,
              accumulatedLoot: { coins: 0, gems: 0, seeds: {}, relicFragments: 0, geneTokens: 0, rareItems: {} },
              history: [`WIPEOUT at Depth ${depth}! 75% loot forfeited.`, ...exp.history].slice(0, 10),
            },
            isDirty: true,
          });
        } else {
          playRapidTapSound(2);
          state.addNotification(`Endured hazard (-${staminaDmg} stamina)! Loot claimed!`, '⚡', 'info');
          set({
            wildExpedition: {
              ...exp,
              partyStamina: newStamina,
              currentNodeStatus: 'cleared',
              accumulatedLoot: {
                ...exp.accumulatedLoot,
                coins: exp.accumulatedLoot.coins + encounter.lootReward.coins,
                gems: exp.accumulatedLoot.gems + encounter.lootReward.gems,
                geneTokens: exp.accumulatedLoot.geneTokens + (encounter.lootReward.geneTokens || 0),
                relicFragments: exp.accumulatedLoot.relicFragments + (encounter.lootReward.relicFragments || 0),
              },
              history: [`Survived ${encounter.title} (-${staminaDmg} stamina).`, ...exp.history].slice(0, 10),
            },
            isDirty: true,
          });
        }
      },

      extractRogueliteLoot: () => {
        const state = get();
        const exp = state.wildExpedition;
        if (!exp.isActive) return;

        const loot = exp.accumulatedLoot;
        playCashRegisterSound();
        playVictoryChime();

        state.addNotification(
          `🏕️ EXPEDITION EXTRACTED SAFELY! Banked 100% loot: +${loot.coins} Coins, +${loot.gems} Gems, +${loot.geneTokens} Gene Tokens!`,
          '🏆',
          'event'
        );

        set({
          coins: state.coins + loot.coins,
          gems: state.gems + loot.gems,
          xp: state.xp + Math.max(50, Math.floor(loot.coins * 0.5)),
          wildExpedition: {
            ...exp,
            isActive: false,
            currentNodeStatus: 'extracted',
            accumulatedLoot: { coins: 0, gems: 0, seeds: {}, relicFragments: 0, geneTokens: 0, rareItems: {} },
            history: [`Safe extraction at Depth ${exp.currentDepth}. Banked 100% loot!`, ...exp.history].slice(0, 10),
          },
          isDirty: true,
        });
      },

      abandonRogueliteExpedition: () => {
        const state = get();
        set({
          wildExpedition: {
            ...state.wildExpedition,
            isActive: false,
            currentNodeStatus: 'ready',
            accumulatedLoot: { coins: 0, gems: 0, seeds: {}, relicFragments: 0, geneTokens: 0, rareItems: {} },
          },
          isDirty: true,
        });
      },

      craftRogueliteRations: () => {
        const state = get();
        if (state.coins < 20) {
          state.addNotification('Need 20 coins for rations!', '⚠️', 'info');
          return;
        }
        playCashRegisterSound();
        set({
          coins: state.coins - 20,
          wildExpedition: {
            ...state.wildExpedition,
            rations: state.wildExpedition.rations + 2,
            partyStamina: Math.min(100, state.wildExpedition.partyStamina + 40),
          },
          isDirty: true,
        });
        state.addNotification('Prepared +2 Rations and restored +40 Stamina!', '🥖', 'info');
      },

      buyRogueliteRetreatTool: () => {
        const state = get();
        if (state.coins < 30) {
          state.addNotification('Need 30 coins for Retreat Tool!', '⚠️', 'info');
          return;
        }
        playCashRegisterSound();
        set({
          coins: state.coins - 30,
          wildExpedition: {
            ...state.wildExpedition,
            retreatTools: state.wildExpedition.retreatTools + 1,
          },
          isDirty: true,
        });
        state.addNotification('Acquired +1 Retreat Tool (Smoke Bomb)!', '💣', 'info');
      },

      // Dynamic Commodity Market Actions (Step 3)
      refreshMarketPrices: () => {
        const trends: Record<string, MarketTrendItem> = {};
        for (const item of MARKET_COMMODITIES) {
          const mult = Number((0.6 + Math.random() * 1.6).toFixed(2));
          trends[item] = {
            multiplier: mult,
            trend: mult >= 1.05 ? 'up' : mult <= 0.95 ? 'down' : 'neutral',
            lastUpdated: Date.now(),
          };
        }

        const news = MARKET_NEWS_TEMPLATES[Math.floor(Math.random() * MARKET_NEWS_TEMPLATES.length)];
        const featuredMult = Number((news.minMult + Math.random() * (news.maxMult - news.minMult)).toFixed(2));
        trends[news.itemId] = {
          multiplier: featuredMult,
          trend: featuredMult >= 1.05 ? 'up' : 'down',
          lastUpdated: Date.now(),
        };

        const ticker: MarketNewsTicker = {
          headline: news.headline,
          itemId: news.itemId,
          multiplier: featuredMult,
          expiresAt: Date.now() + 180000,
        };

        set({
          marketTrends: trends,
          marketNextRefresh: Date.now() + 180000,
          marketNewsTicker: ticker,
          isDirty: true,
        });
      },

      // Overclocking & Mutation Actions (Step 4)
      overclockEntity: (entityId, entityType, tier, customBaseCost) => {
        const state = get();
        const baseCost = customBaseCost ?? BASE_OVERCLOCK_COSTS[entityType] ?? 30;
        const current = state.entityOverclocks[entityId] || createDefaultEntityOverclock();
        const now = Date.now();

        if (current.isExhausted && current.exhaustedUntil && now < current.exhaustedUntil) {
          state.addNotification('Entity is exhausted/overheated! Pay service fee or wait.', '⚠️', 'info');
          return false;
        }

        const streak = getDecayedStreak(current.lastOverclockAt, current.streakCount, now);
        const cost = calculateOverclockCost(baseCost, tier, streak);

        if (state.coins < cost) {
          state.addNotification(`Need ${cost} 🪙 for Overclock!`, '⚠️', 'info');
          return false;
        }

        const tierConfig = getTierConfig(tier, baseCost, streak);
        playRapidTapSound(tier === 3 ? 4 : tier === 2 ? 3 : 2);

        // Timed entities (building, fishery, worker) run for 60 seconds of boosted rate
        // Plots & animals run until harvested / collected
        const durationMs = (entityType === 'building' || entityType === 'fishery' || entityType === 'worker') ? 60000 : null;
        const expiresAt = durationMs ? now + durationMs : null;

        const updatedOverclocks = {
          ...state.entityOverclocks,
          [entityId]: {
            ...current,
            isOverclocked: true,
            activeTier: tier,
            speedMultiplier: tierConfig.speedMultiplier,
            bonusYield: tierConfig.bonusYield,
            burnoutChance: tierConfig.burnoutChance,
            expiresAt,
            isExhausted: false,
            exhaustedUntil: null,
            streakCount: streak + 1,
            lastOverclockAt: now,
          },
        };

        let updatedBuildingOverclocks = state.buildingOverclocks;
        if (entityType === 'building') {
          const bId = entityId.replace('building_', '') as BuildingId;
          updatedBuildingOverclocks = {
            ...state.buildingOverclocks,
            [bId]: {
              isOverclocked: true,
              expiresAt,
              isExhausted: false,
              exhaustedUntil: null,
              speedMultiplier: tierConfig.speedMultiplier,
            },
          };
        }

        let updatedAnimals = state.animals;
        if (entityType === 'animal') {
          const aId = entityId.replace('animal_', '');
          updatedAnimals = state.animals.map(a => a.id === aId ? {
            ...a,
            isOverclocked: true,
            overclockExpiresAt: expiresAt,
            isExhausted: false,
            exhaustedUntil: null,
          } : a);
        }

        set({
          coins: state.coins - cost,
          entityOverclocks: updatedOverclocks,
          buildingOverclocks: updatedBuildingOverclocks,
          animals: updatedAnimals,
          isDirty: true,
        });

        const bonusMsg = tierConfig.bonusYield > 0 ? ` (+${tierConfig.bonusYield} yield!)` : '';
        const riskMsg = tierConfig.burnoutChance > 0 ? ` (${Math.round(tierConfig.burnoutChance * 100)}% burnout risk)` : ' (0% risk)';
        state.addNotification(`⚡ ${tierConfig.label} Activated! ${tierConfig.speedMultiplier}x speed${bonusMsg}${riskMsg}.`, '🔥', 'info');
        return true;
      },

      cureEntityExhaustion: (entityId, entityType) => {
        const state = get();
        const feeInfo = CURE_EXHAUSTION_FEES[entityType] || { cost: 25, title: 'Service', emoji: '🔧' };
        if (state.coins < feeInfo.cost) {
          state.addNotification(`Need ${feeInfo.cost} 🪙 for ${feeInfo.title}!`, '⚠️', 'info');
          return false;
        }

        playCashRegisterSound();
        const current = state.entityOverclocks[entityId] || createDefaultEntityOverclock();
        const updatedOverclocks = {
          ...state.entityOverclocks,
          [entityId]: {
            ...current,
            isOverclocked: false,
            activeTier: null,
            speedMultiplier: 1.0,
            bonusYield: 0,
            burnoutChance: 0.0,
            expiresAt: null,
            isExhausted: false,
            exhaustedUntil: null,
          },
        };

        let updatedBuildingOverclocks = state.buildingOverclocks;
        if (entityType === 'building') {
          const bId = entityId.replace('building_', '') as BuildingId;
          updatedBuildingOverclocks = {
            ...state.buildingOverclocks,
            [bId]: {
              isOverclocked: false,
              expiresAt: null,
              isExhausted: false,
              exhaustedUntil: null,
            },
          };
        }

        let updatedAnimals = state.animals;
        if (entityType === 'animal') {
          const aId = entityId.replace('animal_', '');
          updatedAnimals = state.animals.map(a => a.id === aId ? {
            ...a,
            isOverclocked: false,
            overclockExpiresAt: null,
            isExhausted: false,
            exhaustedUntil: null,
          } : a);
        }

        set({
          coins: state.coins - feeInfo.cost,
          entityOverclocks: updatedOverclocks,
          buildingOverclocks: updatedBuildingOverclocks,
          animals: updatedAnimals,
          isDirty: true,
        });

        state.addNotification(`${feeInfo.emoji} ${feeInfo.title} complete! Ready for production.`, '✨', 'info');
        return true;
      },

      clearEntityOverclock: (entityId) => {
        const state = get();
        if (!state.entityOverclocks[entityId]) return;
        const current = state.entityOverclocks[entityId];
        set({
          entityOverclocks: {
            ...state.entityOverclocks,
            [entityId]: {
              ...current,
              isOverclocked: false,
              activeTier: null,
              speedMultiplier: 1.0,
              bonusYield: 0,
              burnoutChance: 0.0,
              expiresAt: null,
            },
          },
          isDirty: true,
        });
      },

      toggleAnimalOverclock: (animalId) => {
        const state = get();
        const key = `animal_${animalId}`;
        const current = state.entityOverclocks[key];
        if (current?.isOverclocked) {
          state.clearEntityOverclock(key);
        } else {
          state.overclockEntity(key, 'animal', 2);
        }
      },

      cureAnimalExhaustion: (animalId) => {
        const state = get();
        state.cureEntityExhaustion(`animal_${animalId}`, 'animal');
      },

      toggleBuildingOverclock: (buildingId) => {
        const state = get();
        const key = `building_${buildingId}`;
        const current = state.entityOverclocks[key];
        if (current?.isOverclocked) {
          state.clearEntityOverclock(key);
        } else {
          state.overclockEntity(key, 'building', 2);
        }
      },

      cureBuildingExhaustion: (buildingId) => {
        const state = get();
        state.cureEntityExhaustion(`building_${buildingId}`, 'building');
      },

      // Town Favor Shop & VIP Utility Actions
      purchaseFavorItem: (itemId: string) => {
        const state = get();
        const item = FAVOR_SHOP_CATALOG.find(i => i.id === itemId);
        if (!item) return false;

        const favor = state.globalReputation?.spendableFavor || 0;
        if (favor < item.costFavor) {
          state.addNotification(`Need ${item.costFavor} Favor Tokens! Fulfill delivery contracts to earn more.`, '⚠️', 'info');
          return false;
        }

        const remainingFavor = favor - item.costFavor;
        const updatedGlobalRep: GlobalReputationState = {
          ...state.globalReputation,
          spendableFavor: remainingFavor,
        };

        if (item.type === 'crisis_shield') {
          const newShields = (state.crisisShields || 0) + 1;
          set({
            globalReputation: updatedGlobalRep,
            crisisShields: newShields,
            isDirty: true,
          });
          playVictoryChime();
          state.addNotification(`🛡️ Purchased Emergency Crisis Shield! Absorbs the next incoming disaster automatically. Total shields: ${newShields}`, '🛡️', 'event');
          return true;
        }

        if (item.type === 'instant_overclock') {
          const newVouchers = (state.freeOverclocks || 0) + 1;
          set({
            globalReputation: updatedGlobalRep,
            freeOverclocks: newVouchers,
            isDirty: true,
          });
          playVictoryChime();
          state.addNotification(`⚡ Purchased Instant Overclock Voucher! Free Tier 3 Overdrive with 0% burnout risk. Total vouchers: ${newVouchers}`, '⚡', 'event');
          return true;
        }

        if (item.type === 'order_reroll') {
          const newOrders = generateOrders(6, state.level);
          set({
            globalReputation: updatedGlobalRep,
            orders: newOrders,
            isDirty: true,
          });
          playVictoryChime();
          state.addNotification(`🎲 Purchased VIP Contract Reroll! Refreshed delivery board with 6 fresh contracts!`, '🎲', 'event');
          return true;
        }

        if (item.type === 'barn_permit') {
          const newBonus = (state.bonusStorageCapacity || 0) + 25;
          set({
            globalReputation: updatedGlobalRep,
            bonusStorageCapacity: newBonus,
            isDirty: true,
          });
          playVictoryChime();
          state.addNotification(`📜 Municipal Granary Permit activated! Silo & Barn capacity permanently increased by +25 slots! (Total bonus: +${newBonus})`, '📜', 'event');
          return true;
        }

        return false;
      },

      useOrderReroll: () => {
        return get().consumeOrderReroll();
      },

      consumeOrderReroll: () => {
        const state = get();
        return state.purchaseFavorItem('favor_order_reroll');
      },

      useInstantOverclock: (entityId, entityType) => {
        return get().consumeInstantOverclock(entityId, entityType);
      },

      consumeInstantOverclock: (entityId, entityType) => {
        const state = get();
        if ((state.freeOverclocks || 0) <= 0) {
          state.addNotification('No Instant Overclock Vouchers remaining! Purchase from the Favor Shop.', '⚡', 'info');
          return false;
        }

        const current = state.entityOverclocks[entityId] || createDefaultEntityOverclock();
        const now = Date.now();
        playRapidTapSound(4);
        playGoldRushFanfare();

        // Tier 3 overdrive benefits with 0 cost, 0 burnout risk
        const durationMs = (entityType === 'building' || entityType === 'fishery' || entityType === 'worker') ? 60000 : null;
        const expiresAt = durationMs ? now + durationMs : null;

        const updatedOverclocks = {
          ...state.entityOverclocks,
          [entityId]: {
            ...current,
            isOverclocked: true,
            activeTier: 3 as OverclockTier,
            speedMultiplier: 4.0,
            bonusYield: 1,
            burnoutChance: 0,
            expiresAt,
            isExhausted: false,
            exhaustedUntil: null,
            streakCount: current.streakCount + 1,
            lastOverclockAt: now,
          },
        };

        let updatedBuildingOverclocks = state.buildingOverclocks;
        if (entityType === 'building') {
          const bId = entityId.replace('building_', '') as BuildingId;
          updatedBuildingOverclocks = {
            ...state.buildingOverclocks,
            [bId]: {
              isOverclocked: true,
              expiresAt,
              isExhausted: false,
              exhaustedUntil: null,
              speedMultiplier: 4.0,
            },
          };
        }

        let updatedAnimals = state.animals;
        if (entityType === 'animal') {
          const aId = entityId.replace('animal_', '');
          updatedAnimals = state.animals.map(a => a.id === aId ? {
            ...a,
            isOverclocked: true,
            overclockExpiresAt: expiresAt,
            isExhausted: false,
            exhaustedUntil: null,
          } : a);
        }

        const newVoucherCount = state.freeOverclocks - 1;
        set({
          freeOverclocks: newVoucherCount,
          entityOverclocks: updatedOverclocks,
          buildingOverclocks: updatedBuildingOverclocks,
          animals: updatedAnimals,
          isDirty: true,
        });

        state.addNotification(`⚡ Free VIP Overdrive applied! 4.0x Speed + 1 Yield with 0% Burnout! (${newVoucherCount} voucher${newVoucherCount === 1 ? '' : 's'} remaining)`, '⚡', 'event');
        return true;
      },

      resetGame: () => {
        set({
          coins: 100, gems: 10, xp: 0, level: 1,
          silo: { wheat: 5, corn: 3, carrot: 0, strawberry: 0, soybean: 0, pumpkin: 0, cotton: 0, feed: 3, honey_comb: 0, wild_berries: 0, gold_nugget: 0 },
          barn: { egg: 2, milk: 1, wool: 0, truffle: 0, fish: 0, bread: 0, cheese: 0, pie: 0, sweater: 0, truffle_oil: 0, yarn: 0, quilted_blanket: 0, savory_fish_pie: 0, crab_bisque: 0, honey: 0, silk: 0 },
          plots: initialPlots, unlockedPlots: GRID_SIZE,
          animals: initialAnimals,
          animalCapacity: { chicken: 16, cow: 16, sheep: 16, pig: 16 },
          productionQueues: { feed_mill: [], bakery: [], dairy: [], loom: [], press: [], tailor_shop: [], textiles: [] },
          orders: generateOrders(6, 1),
          clientReputation: DEFAULT_CLIENT_REPUTATION,
          globalReputation: createInitialGlobalReputation(),
          crisisShields: 0,
          freeOverclocks: 0,
          bonusStorageCapacity: 0,
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
          // Dynamic Long-Form Systemic Event Engine & Relics (v2.3)
          systemicEvent: null,
          systemicEventCooldowns: DEFAULT_EVENT_COOLDOWNS,
          lastSystemicEventCompletedAt: null,
          nextSurpriseEventTime: null,
          surpriseEventAlert: null,
          relics: DEFAULT_RELICS,
          // High-Stakes Sudden Event Engine
          activeSuddenEvent: null,
          nextSuddenEventTime: null,
          workersPausedUntil: null,
          suddenEventFlash: null,
          isSuddenEventModalOpen: false,
          // Active Radar Crisis System (Step 1)
          activeCrisis: null,
          nextCrisisTime: Date.now() + 60000,
          isCrisisModalOpen: false,
          // Roguelite Wild Expeditions (Step 2)
          wildExpedition: createDefaultWildExpedition(),
          // Dynamic Commodity Market (Step 3)
          marketTrends: createInitialMarketTrends(),
          marketNextRefresh: Date.now() + 180000,
          marketNewsTicker: {
            headline: 'East Port Egg Shortage: Eggs selling at 200% for the next 2 minutes!',
            itemId: 'egg',
            multiplier: 2.0,
            expiresAt: Date.now() + 120000,
          },
          // Production Overclocking (Step 4 & Global System)
          buildingOverclocks: createDefaultBuildingOverclocks(),
          entityOverclocks: {},
          // Water System & Farm Well
          waterLevel: 10,
          maxWaterLevel: 10,
          wellLevel: 1,
          lastWellAutoRefill: null,
          lastTick: Date.now(),
          isDirty: false,
          isGuest: true,
          lastCloudSyncTimestamp: null,
        });
      },
    }),
    {
      name: SAVE_KEY,
      storage: createJSONStorage(() => idbStorage),
      partialize: (state) => ({
        coins: state.coins, gems: state.gems, xp: state.xp, level: state.level,
        silo: state.silo, barn: state.barn,
        plots: state.plots, unlockedPlots: state.unlockedPlots,
        animals: state.animals, animalCapacity: state.animalCapacity,
        productionQueues: state.productionQueues,
        orders: state.orders, clientReputation: state.clientReputation, farmhands: state.farmhands, codex: state.codex,
        fishery: state.fishery,
        autonomousWorkers: state.autonomousWorkers,
        unifiedWorkers: state.unifiedWorkers,
        activeEvent: state.activeEvent,
        lastEventTriggerTime: state.lastEventTriggerTime,
        systemicEvent: state.systemicEvent,
        systemicEventCooldowns: state.systemicEventCooldowns,
        lastSystemicEventCompletedAt: state.lastSystemicEventCompletedAt,
        nextSurpriseEventTime: state.nextSurpriseEventTime,
        activeSuddenEvent: state.activeSuddenEvent,
        nextSuddenEventTimeState: state.nextSuddenEventTime,
        workersPausedUntil: state.workersPausedUntil,
        relics: state.relics,
        notifications: state.notifications,
        breedingSlots: state.breedingSlots,
        activeBreedings: state.activeBreedings,
        wilderness: state.wilderness,
        habitatUpgradeSteps: state.habitatUpgradeSteps,
        parcels: state.parcels,
        activeFreightContract: state.activeFreightContract,
        freightContractRefreshAt: state.freightContractRefreshAt,
        currentEstateAura: state.currentEstateAura,
        waterLevel: state.waterLevel,
        maxWaterLevel: state.maxWaterLevel,
        wellLevel: state.wellLevel,
        isGuest: state.isGuest,
        lastCloudSyncTimestamp: state.lastCloudSyncTimestamp,
        // Thrill & Crisis systems
        activeCrisis: state.activeCrisis,
        nextCrisisTime: state.nextCrisisTime,
        wildExpedition: state.wildExpedition,
        marketTrends: state.marketTrends,
        marketNextRefresh: state.marketNextRefresh,
        marketNewsTicker: state.marketNewsTicker,
        buildingOverclocks: state.buildingOverclocks,
        globalReputation: state.globalReputation,
        crisisShields: state.crisisShields,
        freeOverclocks: state.freeOverclocks,
        bonusStorageCapacity: state.bonusStorageCapacity,
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

        // Migration: auth and cloud sync state
        if (merged.isGuest === undefined) merged.isGuest = true;
        if (merged.lastCloudSyncTimestamp === undefined) merged.lastCloudSyncTimestamp = null;
        merged.isDirty = false;

        // Migration: dynamic long-form event engine and relics (v2.3)
        if (!merged.systemicEvent) merged.systemicEvent = null;
        if (!merged.systemicEventCooldowns) merged.systemicEventCooldowns = DEFAULT_EVENT_COOLDOWNS;
        if (merged.lastSystemicEventCompletedAt === undefined) merged.lastSystemicEventCompletedAt = null;
        if (!merged.relics) merged.relics = DEFAULT_RELICS;

        // Migration: high-stakes sudden event engine
        if (merged.activeSuddenEvent === undefined) merged.activeSuddenEvent = null;
        if (merged.nextSuddenEventTime === undefined) merged.nextSuddenEventTime = null;
        if (merged.workersPausedUntil === undefined) merged.workersPausedUntil = null;
        if (merged.suddenEventFlash === undefined) merged.suddenEventFlash = null;
        if (merged.isSuddenEventModalOpen === undefined) merged.isSuddenEventModalOpen = false;

        // Migration: water system & farm well
        if (merged.waterLevel === undefined) merged.waterLevel = 10;
        if (merged.maxWaterLevel === undefined) merged.maxWaterLevel = 10;
        if (merged.wellLevel === undefined) merged.wellLevel = 1;
        if (merged.lastWellAutoRefill === undefined) merged.lastWellAutoRefill = null;

        // Migration: Step 1-4 Thrill & Crisis System
        if (merged.activeCrisis === undefined) merged.activeCrisis = null;
        if (merged.nextCrisisTime === undefined) merged.nextCrisisTime = Date.now() + 180000;
        if (merged.isCrisisModalOpen === undefined) merged.isCrisisModalOpen = false;
        if (!merged.wildExpedition) merged.wildExpedition = createDefaultWildExpedition();
        if (!merged.marketTrends) merged.marketTrends = createInitialMarketTrends();
        if (!merged.marketNextRefresh) merged.marketNextRefresh = Date.now() + 180000;
        if (!merged.marketNewsTicker) merged.marketNewsTicker = null;
        if (!merged.buildingOverclocks) merged.buildingOverclocks = createDefaultBuildingOverclocks();
        if (!merged.entityOverclocks) merged.entityOverclocks = {};
        if (!merged.clientReputation) merged.clientReputation = DEFAULT_CLIENT_REPUTATION;

        // Migration: Global Reputation & Favor Shop
        if (!merged.globalReputation) {
          merged.globalReputation = createInitialGlobalReputation();
          if (merged.clientReputation) {
            for (const [cId, cRep] of Object.entries(merged.clientReputation)) {
              if (merged.globalReputation.clients[cId]) {
                merged.globalReputation.clients[cId].currentXp = cRep.xp || 0;
                merged.globalReputation.clients[cId].currentLevel = cRep.level || 1;
              }
            }
            merged.globalReputation.unlockedPerks = computeUnlockedPerks(merged.globalReputation.clients);
          }
        }
        if (merged.crisisShields === undefined) merged.crisisShields = 0;
        if (merged.freeOverclocks === undefined) merged.freeOverclocks = 0;
        if (merged.bonusStorageCapacity === undefined) merged.bonusStorageCapacity = 0;

        const currentLvl = merged.level || 1;
        if (!merged.orders || merged.orders.length === 0 || !(merged.orders[0] as DeliveryOrder).type) {
          merged.orders = generateOrders(6, currentLvl);
        } else {
          // Sanitize any existing orders that contain items higher than player's level
          merged.orders = merged.orders.map((order: DeliveryOrder) => {
            const reqItems = order.requiredItems || (order.requested?.map((r: any) => ({ itemId: r.itemId })) || []);
            const hasOverlevelItem = reqItems.some((it: any) => (ITEM_UNLOCK_LEVELS[it.itemId] || 1) > currentLvl);
            const invalidContractType = currentLvl < 2 && order.type !== 'standard';
            if (hasOverlevelItem || invalidContractType) {
              return generateDeliveryOrder(currentLvl, undefined, order.clientId);
            }
            return order;
          });
        }

        return merged as GameState;
      },
    }
  )
);
