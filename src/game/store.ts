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
  type HydrologyState,
  type CanalTier,
  createDefaultHydrologyState,
  stepHydrologySimulation,
  simulateOfflineHydrology,
  rollCropQuality,
  getMoistureZone,
  canOpenGates,
  CANAL_TIER_CONFIGS,
  LITERS_PER_PERCENT_MOISTURE_PER_PLOT,
  ELEVATED_TOWER_CAPACITY,
  AQUIFER_CAPACITY,
  getCisternCapacity,
  CISTERN_STORAGE_TIERS,
  AQUIFER_STORAGE_TIERS,
  type StorageTierConfig,
  resolveWeatherProfileId,
  WEATHER_PROFILES,
  type WeatherProfileId,
  evaluateCropPhenology,
  type CropPhenologyResult,
  createDefaultWeatherState,
  getAvailableHydrologyWater,
  deductHydrologyWater,
} from '@/game/hydrologyEngine';
import {
  simulateSiphonTick,
  resolveOfflineHydrologyCatchUp,
  type OfflineHydrologyResolutionResult,
  getTowerLoadSheddingStage,
  STAGE_THRESHOLDS,
  TOWER_STORAGE_TIERS,
  type TowerStorageTierConfig,
} from '@/game/hydraulicFailSafeEngine';
import {
  type PlotSoilBattery,
  DEFAULT_SOIL_BATTERY,
  isBatteryChargedForCrop,
  consumeOrRestoreSoilBattery,
  rechargeSoilBatteryFull,
} from '@/game/soilEnergyEngine';
import {
  type ZoneEcosystemData,
  createDefaultZoneEcosystem,
  isZoneFishingPaused,
  calculatePondEvaporationLitersPerMin,
  calculateClimateSensitivity,
  calculateActiveSpawnInterval,
  calculateActiveCatchIntervalMs,
  ZONE_ECOSYSTEM_CONFIGS,
  POND_HYDROLOGY,
  type ZoneUpgradeTier,
  getZoneUpgradeDef,
  getZoneStockCap,
  getZoneBaseCatchIntervalSec,
  getZoneBaseSpawnTickSec,
  getZoneMaxStationSlots,
  type FisheryCrewPolicy,
  type ZoneCrewAllocation,
  type DockMasterAssignmentResult,
  computeDockMasterAssignments,
} from './aquaticEcosystem';
import {
  rollBreedingTier,
  INCUBATION_TIMES,
  type AnimalTier,
} from '@/utils/breedingLogic';
import {
  type ExpeditionPresetId,
  type ExpeditionPresetDef,
  type FrontierMaterialDef,
  type CratedBeast,
  type ExpeditionSpoils,
  type ActiveExpedition,
  type WildernessState,
  EXPEDITION_PRESETS,
  FRONTIER_MATERIALS,
  createDefaultWilderness,
  generateCratedBeast,
} from '@/types/expeditions';
export type {
  ExpeditionPresetId,
  ExpeditionPresetDef,
  FrontierMaterialDef,
  CratedBeast,
  ExpeditionSpoils,
  ActiveExpedition,
  WildernessState,
};
import {
  SYSTEMIC_EVENTS, FAIR_ITEM_SCORES, getEligibleRandomEvents,
  type SystemicEventId, type SystemicEventPhase, type SystemicEventDef,
} from './eventsData';
import {
  type OrderType, type ClientProfile, type DeliveryOrder,
  CLIENT_DEFINITIONS, REPUTATION_THRESHOLDS, getReputationInfo,
  generateDeliveryOrder, getItemBaseValue, ITEM_UNLOCK_LEVELS,
} from './deliveryData';
import { calculateMasterSettlement, type ContractEconomicTier } from './pricingEngine';
import {
  validateCaravanCargo,
  calculateCaravanSettlement,
  getBulkVolumeTierInfo,
} from './caravanLogistics';
import {
  type PrehistoricSpeciesId,
  type PrehistoricEra,
  type FrontierBiomeStrataId,
  type EnclosureTypeId,
  type PrehistoricSpeciesDef,
  type FrontierEventCard,
  type EventActionType,
  type AmberBioLabState,
  type PrehistoricSanctuaryState,
  type FrontierTrailRun,
  type FrontierRucksack,
  PREHISTORIC_SPECIES_REGISTRY,
  FRONTIER_STRATA_REGISTRY,
  FRONTIER_STRATA_SEQUENCE,
  createDefaultAmberBioLab,
  createDefaultSanctuary,
  AMBER_BIO_LAB_CONSTRUCTION_COSTS,
} from '@/types/prehistoric';
import {
  startNewFrontierRun,
  calculateNodeTraversalCost,
  executeEventAction,
  extractRucksack,
  drawFrontierEvent,
} from './frontierTrailEngine';
import {
  type FreshnessTier,
  type PerishableBatch,
  isItemPerishable,
  PERISHABLE_DEFINITIONS,
  calculateFreshnessPercent,
  getFreshnessTier,
} from './freshnessEngine';
import {
  type ContractFactionId,
  type HighStakesContract,
  type HighStakesManifestSlot,
  FACTION_REGISTRY,
  generateHighStakesContract,
  calculateScrapLiquidationValue,
} from './highStakesContractEngine';
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
  playTillSoilSound,
  playFloodWashSound,
  playBioDressingSound,
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
import {
  type SpecialistWorkerId,
  type SpecialistWorkerState,
  LIVESTOCK_WORKER_ROSTER,
  createDefaultSpecialistWorkers,
} from '@/data/workerCatalog';
import {
  type FeedingStrategy,
  type BarnItemLockMap,
} from '@/types/inventory';
import {
  type WranglerPolicyConfig,
  DEFAULT_WRANGLER_POLICY,
} from '@/types/workers';
import {
  ITEM_CATALOG_META,
  SPECIES_FAVORITE_CROPS,
} from '@/utils/barnInventory';
import {
  type FoodCategory,
  type MoraleTier,
  type StaffUpkeepTelemetry,
  COMMISSARY_FOOD_ITEMS,
  WORKER_UPKEEP_ROSTER,
  getGuildTaxRate,
  getMoraleSpeedMultiplier,
  calculateStaffUpkeep,
  processUpkeepSettlement,
} from '@/data/workerUpkeep';
import {
  type ShiftType,
  type CircadianClockInfo,
  type WorkerScheduleTelemetry,
  type BunkhouseTierMeta,
  DAY_CYCLE_MS,
  DAY_CYCLE_SEC,
  OVERTIME_DURATION_MS,
  SHIFT_ADJUST_DURATION_MS,
  SHIFT_DEFINITIONS,
  SEC_PER_IN_GAME_HOUR,
  BUNKHOUSE_TIERS,
  getCircadianClock,
  getWorkerScheduleTelemetry,
  getDefaultWorkerShift,
  hasWorkerReachedClockOut,
  processSingleWorkerClockOut,
  processOfflineShiftCycles,
} from './shiftEngine';
import {
  type WorkerHydrationState,
  type HydrationTelemetry,
  getClimateHeatMultiplier,
  calculateMicroTickWaterConsumption,
  evaluateHydrationTelemetry,
  deductWorkerHydration,
  executeNightWatchHydrationAutomation,
  CANTEEN_DEFAULT_CAPACITY_LITERS,
} from './hydrationEngine';
import {
  PLOT_SOIL_TIERS,
  getSoilTier,
  getPlotUnlockCost,
  MAX_FARM_PLOTS,
  BASE_UNLOCKED_PLOTS,
  MAX_PLOT_SOIL_LEVEL,
  type PlotSoilTierInfo,
} from './plotUpgrades';
export {
  PLOT_SOIL_TIERS,
  getSoilTier,
  getPlotUnlockCost,
  MAX_FARM_PLOTS,
  BASE_UNLOCKED_PLOTS,
  MAX_PLOT_SOIL_LEVEL,
  type PlotSoilTierInfo,
};
import {
  calculateGrievanceDossier,
  DESERTION_DURATION_SEC,
  APPRECIATED_DURATION_MS,
  type StrikeGrievanceDossier,
} from './strikeResolution';
export {
  calculateGrievanceDossier,
  DESERTION_DURATION_SEC,
  APPRECIATED_DURATION_MS,
  type StrikeGrievanceDossier,
};


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
  level?: number;
  // Closed-Loop Hydrological Estate Simulation
  moistureLevel?: number; // 0.0% to 100.0%
  desiccatedSeconds?: number;
  isWithered?: boolean;
  waterloggedSeconds?: number;
  hasRootRot?: boolean;
  quality?: 'standard' | 'silver' | 'gold' | 'prismatic';
  // Climate-Driven Crop Phenology & Thermal Taxonomy
  phenologyBadgeEmoji?: string;
  phenologyBadgeText?: string;
  isFrostbitten?: boolean;
  isHeatWilted?: boolean;
  isDormant?: boolean;
  // Flash Flood & Alluvial Silt Mechanics
  alluvialSiltCyclesRemaining?: number;
  wasFloodedToMax?: boolean;
  // Hardcore Crop Rotation & Soil Health
  lastHarvestedCrop?: CropId | null;
  isMonoculture?: boolean;
  // Soil Battery Energy System (Module 1: Agronomy)
  soilBattery?: PlotSoilBattery;
  plantedInDepletedSoil?: boolean;
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
  // Track B: Breeding Status (Decoupled & Independent)
  breedingCooldownExpiresAt?: number | null;
  breedingCooldownSec?: number;
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
  zoneEcosystem?: Record<WaterZoneId, ZoneEcosystemData>;
  pondWaterVolume?: number; // 0..3000 Liters (default 3000)
  crew?: {
    policy: FisheryCrewPolicy;
    pinnedWorkers: Record<WaterZoneId, number>;
  };
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
  isPaused?: boolean;      // true = Paused by player
  lastActionTimestamp: number;
  bufferCount: number;     // Level 40+ hopper buffer cycles
  stats: {
    totalCoinsEarned: number;
    totalItemsProduced: number;
    totalGemsEarned: number;
  };
  moraleTier?: MoraleTier;
  missedCycles?: number;
  lastFedAt?: number;
  lastPaidAt?: number;
  shiftType?: ShiftType;
  shiftAdjustingUntil?: number | null;
  overtimeUntil?: number | null;
  lastOvertimeDay?: number;
  isExhausted?: boolean;
  exhaustedUntil?: number | null;
  wellRested?: boolean;
  stamina?: number;
  lastClockOutDay?: number;
  strikeStartedAt?: number | null;
  desertionDeadline?: number | null;
  appreciatedUntil?: number | null;
  sabbaticalGrantedAt?: number | null;
  sabbaticalLockedDebtCoins?: number | null;
  sabbaticalLockedFoodUnits?: number | null;
  sabbaticalRemainingDesertionSec?: number | null;
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

// Notifications & Estate Dispatch Architecture
export type NotificationCategory = 'hazards' | 'hydrology' | 'waters_crew' | 'history';
export type NotificationPriority = 'critical' | 'warning' | 'info';

export interface NotificationActionShortcut {
  id: string;
  label: string;
  icon?: string;
  actionType:
    | 'open_spillway'
    | 'close_spillway'
    | 'toggle_sluice'
    | 'open_sluice_console'
    | 'pump_aquifer'
    | 'transfer_cistern'
    | 'desilt_canals'
    | 'deploy_dew_screens'
    | 'clear_sediment'
    | 'clear_withered'
    | 'water_all'
    | 'refill_canteen'
    | 'brew_cold_drink'
    | 'refill_pond'
    | 'arbitrate_strike'
    | 'view_workers'
    | 'view_fishery'
    | 'view_farm'
    | 'view_barn'
    | 'open_defense_modal'
    | 'dismiss';
  payload?: any;
}

export interface NotificationItem {
  id: string;
  message: string;
  emoji: string;
  createdAt: number;
  type: 'xp' | 'coin' | 'gem' | 'discovery' | 'event' | 'info';
  category?: NotificationCategory;
  priority?: NotificationPriority;
  shortcut?: NotificationActionShortcut;
  resolved?: boolean;
  targetId?: string | number;
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
  storedInReserve?: boolean;
}

export interface WorkshopLoadoutState {
  equippedTool: 'hardened_chitin_trowel' | null;
  sluiceGateSealsInstalled: number; // 0 to 3
  aquiferCasingsInstalled: number; // 0 to 4
  prismaticLensMounted: boolean;
  thermalCoreActive?: boolean;
  emergencySiphonInstalled?: boolean;
}

export function createDefaultWorkshopLoadout(): WorkshopLoadoutState {
  return {
    equippedTool: null,
    sluiceGateSealsInstalled: 0,
    aquiferCasingsInstalled: 0,
    prismaticLensMounted: false,
    thermalCoreActive: false,
    emergencySiphonInstalled: false,
  };
}

export interface GameState {
  // Player
  coins: number;
  gems: number;
  xp: number;
  level: number;

  // Workshop Active Installations & Tool Loadout
  workshopLoadout: WorkshopLoadoutState;

  // Storage
  silo: Record<string, number>;
  barn: Record<string, number>;

  // Farm
  plots: PlotState[];
  unlockedPlots: number;

  // Animals & Livestock Reserve
  animals: AnimalInstance[];
  animalCapacity: Record<AnimalSpecies, number>;
  livestockReserve: AnimalInstance[];

  // Production
  productionQueues: Record<BuildingId, ProductionSlot[]>;

  // Orders & Client Personas (Logistics Overhaul)
  orders: DeliveryOrder[];
  tradeStreak: number;
  lastTradeStreakTimestamp: number | null;
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
  isAllWorkersPaused?: boolean;

  // Specialist Workers (Livestock, Expeditions & Genetics)
  specialistWorkers: Record<SpecialistWorkerId, SpecialistWorkerState>;
  lastSpecialistWageTime: number;

  // Worker Commissary & Payroll Vault (Staged Coins & Food Survival System)
  payrollVaultCoins: number;
  staffPantry: Record<string, number>;
  lastSettlementTimestamp: number;

  // Diurnal Labor Cycle & Bunkhouse Accommodations (v3.0)
  farmEpochStart: number;
  bunkhouse: {
    level: number;
    capacity: number;
    // Worker Hydration & Thirst Mechanics (v3.5)
    canteenLiters?: number;
    canteenCapacityLiters?: number;
    coldInfusedDrinks?: number;
    autoRefillFromTower?: boolean;
    nightWatchAutomation?: boolean;
    totalWaterConsumedLiters?: number;
  };

  // Worker Feeding Automation & Barn Lock Policies
  wranglerPolicy: WranglerPolicyConfig;
  barnItemLocks: BarnItemLockMap;

  // Hourly Events
  activeEvent: ActiveHourlyEvent | null;
  lastEventTriggerTime: number;

  // Notifications
  notifications: NotificationItem[];

  // Breeding
  breedingSlots: number;
  activeBreedings: ActiveBreeding[];
  hatchReveal: HatchRevealData | null;

  // Wilderness Expeditions & Isolated Outpost
  wilderness: WildernessState;
  stagingWagonProvisions: Record<string, number>;

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

  // Closed-Loop Hydrological Estate Simulation
  hydrology: HydrologyState;
  isSluiceModalOpen: boolean;

  // Prehistoric Sanctuary, Amber Bio-Lab & Frontier Trail Procedural Engine
  amberBioLab: AmberBioLabState;
  prehistoricSanctuary: PrehistoricSanctuaryState;
  activeTrailRun: FrontierTrailRun | null;

  // Unified Estate Menagerie & Fauna Codex State
  domesticTroughs: Record<AnimalSpecies, { foodUnits: number; maxUnits: number; isPaused?: boolean }>;
  totalFaunaHarvests: number;
  faunaHarvestStats: Record<string, number>;
  isMenagerieModalOpen: boolean;

  // Time
  lastTick: number;

  // --- Actions ---
  plantCrop: (plotId: number, cropId: CropId) => void;
  harvestPlot: (plotId: number) => void;
  plantAllCrops: (cropId: CropId) => void;
  harvestAllPlots: () => void;
  applyCompostToProps: (plotId: number) => boolean;
  applyCompostToAllPlots: () => void;
  tillUnderCrop: (plotId: number) => boolean;
  flushPlotBed: (plotId: number) => boolean;
  applyUniversalBioDressing: (plotId: number) => boolean;
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
  dispatchBulkCaravan: (orderIds: string[], route?: 'safe' | 'wild') => {
    success: boolean;
    ordersCount: number;
    netCoins: number;
    message: string;
    hazardEncountered?: boolean;
    rareDropsWon: string[];
  };
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
  upgradeWaterZoneTier: (zoneId: WaterZoneId) => boolean;
  refillPondFromTower: () => boolean;
  manualCatchFish: (zoneId: WaterZoneId) => boolean;
  setSustainableRotation: (enabled: boolean) => void;
  setCatchHandlingPolicy: (policy: 'auto-sell-common' | 'hoard-all') => void;
  pinWorkerToZone: (zoneId: WaterZoneId) => boolean;
  unpinWorkerFromZone: (zoneId: WaterZoneId) => boolean;

  // Autonomous Workers (legacy)
  hireAutonomousWorker: (type: WorkerType) => void;
  toggleWorkerAutoSell: (workerId: string) => void;
  upgradeWorkerGear: (workerId: string) => void;

  // Unified Workers (v2.0)
  hireUnifiedWorker: (role: WorkerRole) => void;
  upgradeUnifiedWorker: (role: WorkerRole, levelsToBuy: number) => void;
  toggleUnifiedWorkerMode: (role: WorkerRole) => void;
  togglePauseUnifiedWorker: (role: WorkerRole) => void;
  togglePauseAllWorkers: (pause?: boolean) => void;
  bulkUpgradeUnifiedWorker: (role: WorkerRole, mode: BulkMode) => void;

  // Specialist Workers (Livestock, Expeditions & Genetics)
  hireSpecialistWorker: (workerId: SpecialistWorkerId) => boolean;
  toggleSpecialistDuty: (workerId: SpecialistWorkerId) => void;
  dismissSpecialistWorker: (workerId: SpecialistWorkerId) => void;
  paySpecialistBackPay: (workerId: SpecialistWorkerId) => boolean;

  // Worker Commissary & Payroll Vault Handlers
  depositToPayrollVault: (amount: number) => boolean;
  withdrawFromPayrollVault: (amount: number) => boolean;
  transferToStaffPantry: (itemId: string, quantity: number) => boolean;
  returnFromStaffPantry: (itemId: string, quantity: number) => boolean;
  processSettlementCycle: () => void;

  // Diurnal Shift & Bunkhouse Actions (v3.0)
  assignWorkerShift: (roleOrId: string, shift: ShiftType) => void;
  callEmergencyOvertime: (roleOrId: string) => { success: boolean; message: string };
  upgradeBunkhouse: () => { success: boolean; message: string };
  expandBunkhouseCapacity: () => { success: boolean; message: string };

  // Worker Hydration Metabolism & Thirst Actions (v3.5)
  refillStaffCanteen: (liters?: number) => { success: boolean; message: string };
  stockColdBeverage: (qty?: number) => { success: boolean; message: string };
  toggleNightWatchWaterAutomation: () => void;
  toggleCanteenAutoRefill: () => void;

  // Wrangler Feed Policy & Automation Controls
  updateWranglerPolicy: (policy: Partial<WranglerPolicyConfig>) => void;
  toggleBarnItemLock: (itemId: string) => void;
  setBarnItemCustomReserve: (itemId: string, threshold?: number) => void;

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

  // Livestock Reserve Management
  moveToPasture: (animalId: string) => boolean;
  moveToReserve: (animalId: string) => boolean;
  sellReserveAnimal: (animalId: string) => void;

  // Wilderness Expeditions & Outpost Storage
  launchExpedition: (biomeId: BiomeId, farmhandId: string, lureId: LureTypeId) => void;
  resolveExpeditionChoice: (expeditionId: string, chooseRisky: boolean) => void;
  packWagonItem: (itemId: string, qty: number) => boolean;
  unpackWagonItem: (itemId: string, qty: number) => boolean;
  clearWagonStaging: () => void;
  launchLongExpedition: (presetId: ExpeditionPresetId, provisions: Record<string, number>, farmhandId?: string) => boolean;
  recallExpeditionEarly: (expeditionId: string) => boolean;
  claimExpeditionSpoils: (expeditionId: string) => void;
  shipFrontierMaterialToBarn: (materialId: string, qty?: number) => void;
  shipAllFrontierMaterialsToBarn: () => void;
  transferCratedBeastToPasture: (beastId: string) => { success: boolean; message: string };
  stationCratedBeastAtOutpost: (beastId: string) => void;
  unstationBeastFromOutpost: (beastId: string) => void;
  releaseCratedBeastToWild: (beastId: string) => number;
  returnLeftoverRationsToBarn: (expeditionId: string) => void;

  // Prehistoric Frontier Trail Procedural Engine & Amber Bio-Lab Actions
  startTrailRun: () => void;
  resolveTrailEventAction: (actionType: EventActionType) => void;
  advanceTrailNode: () => void;
  bankAndExtractTrailLoot: () => void;
  startSpecimenIncubation: (chamberId: number, speciesId: PrehistoricSpeciesId) => boolean;
  collectRevivedSpecimen: (chamberId: number) => boolean;
  depositEnclosureFeed: (enclosureId: EnclosureTypeId, qty: number) => boolean;
  collectEnclosureHarvest: (enclosureId: EnclosureTypeId) => number;

  // Unified Estate Menagerie & Fauna Codex Operations
  setMenagerieModalOpen: (open: boolean) => void;
  refillDomesticTrough: (species: AnimalSpecies, qty?: number) => boolean;
  collectDomesticHarvest: (species: AnimalSpecies) => number;
  refillAllFaunaTroughs: () => { refilledDomestic: number; refilledPrehistoric: number };
  collectAllFaunaHarvests: () => { collectedDomestic: number; collectedPrehistoric: number };

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

  // Notifications & Estate Dispatch
  isDispatchModalOpen: boolean;
  setDispatchModalOpen: (open: boolean) => void;
  addNotification: (
    message: string,
    emoji: string,
    type: NotificationItem['type'],
    category?: NotificationCategory,
    priority?: NotificationPriority,
    shortcut?: NotificationActionShortcut,
    targetId?: string | number
  ) => void;
  dismissNotification: (id: string) => void;
  resolveNotification: (id: string) => void;
  clearNotifications: (category?: NotificationCategory) => void;
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
  upgradePlotLevel: (plotId: number) => boolean;
  upgradeAllPlots: () => boolean;
  unlockNextPlot: () => boolean;

  // Closed-Loop Hydrological Actions
  setSluiceModalOpen: (open: boolean) => void;
  toggleSluiceGates: (open?: boolean) => void;
  setAutoShutoffMoisture: (thresholdPct: number) => void;
  pumpAquiferToTower: (liters?: number) => boolean;
  transferCisternToTower: (liters?: number) => boolean;
  clearSedimentInLine: () => void;
  clearWitheredCrop: (plotId: number) => boolean;
  deSiltCanals: () => void;
  deployDewScreens: () => boolean;
  setHydrologyWeather: (weather: WeatherProfileId | 'clear' | 'light_rain' | 'downpour') => void;
  toggleEmergencySpillway: () => void;
  openEmergencySpillway: () => void;
  closeEmergencySpillway: () => void;
  toggleSiphonMode: () => void;
  cycleSiphonSourcePreference: () => void;
  setSiphonSourcePreference: (preference: 'smart_highest' | 'cistern' | 'aquifer') => void;
  setHydrologyReservoirLevel: (reservoir: 'cistern' | 'aquifer' | 'tower', liters: number) => void;

  // High-Capacity Water Storage Progression Actions
  upgradeTowerStorageTier: () => boolean;
  upgradeCisternStorageTier: () => boolean;
  upgradeAquiferStorageTier: () => boolean;
  setTowerStorageTier: (tier: number) => void;
  setCisternStorageTier: (tier: number) => void;
  setAquiferStorageTier: (tier: number) => void;
  upgradeCanalTier: () => boolean;
  setCanalTier: (tier: CanalTier) => void;

  // Worker Strike Resolution & Sabbatical Actions
  resolveWorkerStrikeAccord: (workerId: string) => boolean;
  grantWorkerSabbatical: (workerId: string) => boolean;
  terminateWorkerWithSeverance: (workerId: string) => boolean;
  recallWorkerFromSabbatical: (workerId: string) => boolean;

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

  // Workshop Active Installations & Gear Loadout
  equipWorkshopTool: (toolId: 'hardened_chitin_trowel') => boolean;
  unequipWorkshopTool: () => void;
  installSluiceGateSeal: () => boolean;
  reinforceAquiferCasing: () => boolean;
  mountPrismaticLens: () => boolean;
  unmountPrismaticLens: () => void;
  mountThermalCore: () => boolean;
  unmountThermalCore: () => void;
  installEmergencySiphonValve: (allowCoinPurchase?: boolean) => boolean;
  buySiphonValve: (costCoins?: number) => boolean;

  // Elevated Gravity Tower Fail-Safe & Offline Protection
  offlineHydrologyReport: OfflineHydrologyResolutionResult | null;
  dismissOfflineHydrologyReport: () => void;

  // Game Manager & Offline Progress System
  isOfflineMode: boolean;
  offlineStartTime: number | null;
  lastOfflineSummary: OfflineActivitySummary | null;
  offlineHistory: OfflineActivitySummary[];
  toggleOfflineMode: () => void;
  setOfflineMode: (offline: boolean) => void;
  simulateOfflineAbsence: (seconds: number) => OfflineActivitySummary;
  dismissOfflineSummary: () => void;

  // Hardcore Survival Mode
  isHardcoreMode: boolean;

  // High-Stakes Contracts & Perishable Logistics System
  highStakesContracts: HighStakesContract[];
  factionReputation: Record<ContractFactionId, number>;
  perishableBatches: Record<string, PerishableBatch[]>;
  crownSeedLockUntil: number;
  guildHazardCyclesRemaining: number;
  mercantileCooldownUntil: number;

  loadContractEscrow: (contractId: string, slotId: string, quantity?: number) => { success: boolean; message: string };
  siphonTowerWaterToEscrow: (contractId: string, liters?: number) => { success: boolean; message: string; stageTriggered?: number };
  finalizeContractShipment: (contractId: string) => { success: boolean; message: string };
  forfeitContract: (contractId: string) => { scrapCoins: number };
  registerHarvestFreshness: (itemId: string, quantity: number) => void;

  tick: () => void;
  resetGame: () => void;
}

export interface OfflineActivitySummary {
  id: string;
  timestamp: number;
  durationSeconds: number;
  cropsMatured: { crop: string; count: number }[];
  totalCropsMaturedCount: number;
  animalProductsReady: { species: string; count: number; product: string }[];
  totalAnimalProductsCount: number;
  productionFinished: { building: string; recipe: string; count: number }[];
  totalProductionFinishedCount: number;
  waterDrainedLiters: number;
  waterSiphonedLiters: number;
  initialTowerLiters: number;
  finalTowerLiters: number;
  initialAquiferLiters: number;
  finalAquiferLiters: number;
  loadSheddingStage: number;
  cropConservationTriggered: boolean;
  specimensPreservedCount: number;
  coinsEarned: number;
  xpEarned: number;
  workersProtected: boolean;
  notes: string[];
}

const GRID_SIZE = 12;

export function isCropItem(itemId: string): boolean {
  if (itemId in CROPS || itemId === 'feed' || itemId === 'cotton' || itemId === 'honey_comb' || itemId === 'wild_berries' || itemId === 'gold_nugget') {
    return true;
  }
  if (itemId.endsWith('_silver') || itemId.endsWith('_gold') || itemId.endsWith('_prismatic')) {
    const base = itemId.replace(/_(silver|gold|prismatic)$/, '');
    if (base in CROPS) return true;
  }
  return false;
}

export function getStorageAvailableStock(
  silo: Record<string, number>,
  barn: Record<string, number>,
  itemId: string
): number {
  if (isCropItem(itemId)) {
    return (silo[itemId] || 0) + (itemId === 'honey_comb' ? (barn.honey_comb || 0) : 0);
  }
  if (itemId === 'fish') {
    let speciesCount = 0;
    for (const sp of Object.keys(FISH_SPECIES)) {
      speciesCount += (barn[sp] || 0);
    }
    return Math.max(barn.fish || 0, speciesCount);
  }
  return barn[itemId] || 0;
}

export function deductStorageStock(
  silo: Record<string, number>,
  barn: Record<string, number>,
  itemId: string,
  qty: number
): boolean {
  if (isCropItem(itemId)) {
    const have = (silo[itemId] || 0) + (itemId === 'honey_comb' ? (barn.honey_comb || 0) : 0);
    if (have < qty) return false;
    silo[itemId] = (silo[itemId] || 0) - qty;
    return true;
  }
  if (itemId === 'fish') {
    let speciesCount = 0;
    for (const sp of Object.keys(FISH_SPECIES)) {
      speciesCount += (barn[sp] || 0);
    }
    const totalFish = Math.max(barn.fish || 0, speciesCount);
    if (totalFish < qty) return false;

    // Deduct from barn.fish
    if ((barn.fish || 0) >= qty) {
      barn.fish = (barn.fish || 0) - qty;
    } else {
      barn.fish = 0;
    }
    // Deduct from species inventory starting from common ones
    let remaining = qty;
    for (const sp of Object.keys(FISH_SPECIES)) {
      if (remaining <= 0) break;
      const spQty = barn[sp] || 0;
      if (spQty > 0) {
        const take = Math.min(remaining, spQty);
        barn[sp] = spQty - take;
        remaining -= take;
      }
    }
    return true;
  }
  if (itemId in FISH_SPECIES) {
    const spQty = barn[itemId] || 0;
    if (spQty < qty) return false;
    barn[itemId] = spQty - qty;
    barn.fish = Math.max(0, (barn.fish || 0) - qty);
    return true;
  }
  const have = barn[itemId] || 0;
  if (have < qty) return false;
  barn[itemId] = have - qty;
  return true;
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

const initialPlots: PlotState[] = Array.from({ length: MAX_FARM_PLOTS }, (_, i) => ({
  id: i,
  crop: null,
  plantedAt: null,
  ready: false,
  isWatered: true,
  wateredUntil: null,
  level: 1,
  moistureLevel: 65.0,
  desiccatedSeconds: 0,
  waterloggedSeconds: 0,
  isWithered: false,
  hasRootRot: false,
  soilBattery: { green: true, yellow: true, red: true },
  plantedInDepletedSoil: false,
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
    'farmer', 'herder', 'lumberjack', 'fisherman', 'artisan',
    'feed_miller_wheat', 'feed_miller_corn', 'feed_miller_carrot', 'feed_miller_soy',
    'auto_fisherman', 'beekeeper', 'forager', 'merchant', 'prospector',
    'alchemist', 'barn_overseer', 'cellar_ager', 'tinkerer',
  ];
  for (const role of allRoles) {
    workers[role] = {
      role,
      isHired: false,
      level: 1,
      autoSell: role === 'merchant', // merchant defaults to auto-sell
      isPaused: false,
      lastActionTimestamp: now,
      bufferCount: 0,
      stats: { totalCoinsEarned: 0, totalItemsProduced: 0, totalGemsEarned: 0 },
      moraleTier: 'content',
      missedCycles: 0,
      shiftType: getDefaultWorkerShift(role),
      stamina: 100,
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
    animal_feed: { isOverclocked: false, expiresAt: null, isExhausted: false, exhaustedUntil: null },
    feed_mill: { isOverclocked: false, expiresAt: null, isExhausted: false, exhaustedUntil: null },
    bakery: { isOverclocked: false, expiresAt: null, isExhausted: false, exhaustedUntil: null },
    dairy: { isOverclocked: false, expiresAt: null, isExhausted: false, exhaustedUntil: null },
    loom: { isOverclocked: false, expiresAt: null, isExhausted: false, exhaustedUntil: null },
    press: { isOverclocked: false, expiresAt: null, isExhausted: false, exhaustedUntil: null },
    textiles: { isOverclocked: false, expiresAt: null, isExhausted: false, exhaustedUntil: null },
    tailor_shop: { isOverclocked: false, expiresAt: null, isExhausted: false, exhaustedUntil: null },
    workshop: { isOverclocked: false, expiresAt: null, isExhausted: false, exhaustedUntil: null },
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

      workshopLoadout: createDefaultWorkshopLoadout(),
      offlineHydrologyReport: null,

      // Game Manager & Offline Progress System
      isOfflineMode: false,
      offlineStartTime: null,
      lastOfflineSummary: null,
      offlineHistory: [],

      // Hardcore Survival Mode disabled
      isHardcoreMode: false,

      silo: { wheat: 5, corn: 3, carrot: 0, strawberry: 0, soybean: 0, pumpkin: 0, cotton: 0, feed: 3, honey_comb: 0, wild_berries: 0, gold_nugget: 0 },
      barn: { egg: 2, milk: 1, wool: 0, truffle: 0, fish: 0, bread: 0, cheese: 0, pie: 0, sweater: 0, truffle_oil: 0, yarn: 0, quilted_blanket: 0, savory_fish_pie: 0, crab_bisque: 0, honey: 0, silk: 0, chitin_molt_plates: 4, mineral_slab: 4, fired_hardwood: 2, tempered_glass: 2, emergency_siphon_valve: 1 },

      plots: initialPlots,
      unlockedPlots: GRID_SIZE,

      animals: initialAnimals,
      animalCapacity: { chicken: 50, cow: 50, sheep: 50, pig: 50 },
      livestockReserve: [],

      productionQueues: {
        animal_feed: [],
        feed_mill: [],
        bakery: [],
        dairy: [],
        loom: [],
        press: [],
        tailor_shop: [],
        textiles: [],
        workshop: [],
      },

      orders: initialOrders,
      tradeStreak: 0,
      lastTradeStreakTimestamp: null,
      clientReputation: DEFAULT_CLIENT_REPUTATION,
      globalReputation: createInitialGlobalReputation(),
      crisisShields: 0,
      freeOverclocks: 0,
      bonusStorageCapacity: 0,

      // High-Stakes Contracts & Perishable Logistics System
      highStakesContracts: [
        generateHighStakesContract('royal_crown', 5),
        generateHighStakesContract('paleo_guild', 5),
        generateHighStakesContract('mercantile_caravan', 5),
      ],
      factionReputation: {
        royal_crown: 25,
        paleo_guild: 30,
        mercantile_caravan: 40,
      },
      perishableBatches: {},
      crownSeedLockUntil: 0,
      guildHazardCyclesRemaining: 0,
      mercantileCooldownUntil: 0,

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
        zoneEcosystem: createDefaultZoneEcosystem(),
        pondWaterVolume: 3000,
        crew: {
          policy: {
            sustainableRotation: true,
            catchHandling: 'auto-sell-common',
          },
          pinnedWorkers: {
            zone_pond: 0,
            zone_river: 0,
            zone_estuary: 0,
            zone_lake: 0,
            zone_ocean: 0,
          },
        },
      },

      autonomousWorkers: [],
      unifiedWorkers: initialUnifiedWorkers,
      isAllWorkersPaused: false,
      activeEvent: null,
      lastEventTriggerTime: Date.now(),

      isDispatchModalOpen: false,
      notifications: [],

      breedingSlots: 1,
      activeBreedings: [],
      hatchReveal: null,

      wilderness: createDefaultWilderness(),
      stagingWagonProvisions: {},

      // Prehistoric Sanctuary, Amber Bio-Lab & Frontier Trail
      amberBioLab: createDefaultAmberBioLab(),
      prehistoricSanctuary: createDefaultSanctuary(),
      activeTrailRun: null,

      // Unified Estate Menagerie & Fauna Codex State
      domesticTroughs: {
        chicken: { foodUnits: 65, maxUnits: 100 },
        cow: { foodUnits: 55, maxUnits: 100 },
        sheep: { foodUnits: 45, maxUnits: 100 },
        pig: { foodUnits: 35, maxUnits: 100 },
      },
      totalFaunaHarvests: 0,
      faunaHarvestStats: {},
      isMenagerieModalOpen: false,

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

      // Closed-Loop Hydrological Estate Simulation
      hydrology: createDefaultHydrologyState(1),
      isSluiceModalOpen: false,

      // Specialist Workers (Livestock, Expeditions & Genetics)
      specialistWorkers: createDefaultSpecialistWorkers(),
      lastSpecialistWageTime: Date.now(),

      // Worker Commissary & Payroll Vault
      payrollVaultCoins: 0,
      staffPantry: {},
      lastSettlementTimestamp: Date.now(),

      // Diurnal Labor Cycle & Bunkhouse Accommodations (v3.0)
      farmEpochStart: Date.now() - (Date.now() % DAY_CYCLE_MS),
      bunkhouse: {
        level: 1,
        capacity: 8,
        canteenLiters: 60,
        canteenCapacityLiters: 100,
        coldInfusedDrinks: 0,
        autoRefillFromTower: true,
        nightWatchAutomation: true,
        totalWaterConsumedLiters: 0,
      },

      // Wrangler Feeding Automation & Barn Lock Policies
      wranglerPolicy: DEFAULT_WRANGLER_POLICY,
      barnItemLocks: {},

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
        const isMonoculture = Boolean(state.isHardcoreMode && plot.lastHarvestedCrop && plot.lastHarvestedCrop === cropId);
        if (isMonoculture) {
          state.addNotification(`⚠️ Monoculture Exhaustion: Planting ${cropDef.name} consecutively without crop rotation depleted soil micronutrients (+35% grow time)!`, '🥀', 'info');
        }

        // Soil Battery Energy Check (Depleted Soil Penalty)
        const isCharged = isBatteryChargedForCrop(plot.soilBattery, cropId);
        const plantedInDepletedSoil = !isCharged;
        if (plantedInDepletedSoil) {
          state.addNotification(`⚠️ Tired Soil: Planted ${cropDef.name} without matching energy! Growth duration is doubled and harvest capped at 1x.`, '🥀', 'info');
        }

        const pLevel = plot.level || 1;
        const soilTier = getSoilTier(pLevel);
        const newPlots = [...state.plots];
        newPlots[plotId] = {
          ...plot,
          id: plotId,
          crop: cropId,
          plantedAt: Date.now(),
          ready: false,
          isWatered: soilTier.autoHydrate || plot.isWatered || false,
          wateredUntil: plot.wateredUntil || null,
          level: pLevel,
          alluvialSiltCyclesRemaining: plot.alluvialSiltCyclesRemaining,
          moistureLevel: plot.moistureLevel !== undefined ? plot.moistureLevel : 60.0,
          isMonoculture,
          soilBattery: plot.soilBattery || { green: true, yellow: true, red: true },
          plantedInDepletedSoil,
        };
        set({ plots: newPlots });
      },

      harvestPlot: (plotId) => {
        const state = get();
        const plot = state.plots[plotId];
        if (!plot || !plot.crop || !plot.ready) return;

        if (plot.isWithered) {
          state.clearWitheredCrop(plotId);
          return;
        }

        const cropDef = CROPS[plot.crop];
        const pLevel = plot.level || 1;
        const soilTier = getSoilTier(pLevel);
        const plotOverclock = state.entityOverclocks?.[`plot_${plotId}`];
        const bonusYield = (plotOverclock?.isOverclocked && plotOverclock.bonusYield) ? plotOverclock.bonusYield : 0;
        const isDoubleProc = Math.random() < soilTier.doubleProcChance;

        // Climate-Driven Crop Phenology & Weather Hazard modifiers
        const activeWeatherId: WeatherProfileId = resolveWeatherProfileId(state.hydrology?.weatherCondition);
        const pheno = evaluateCropPhenology({
          cropId: plot.crop,
          weather: activeWeatherId,
          moistureLevel: plot.moistureLevel ?? 60.0,
          isProtectedByGreenhouse: false,
        });

        const bonusPrismatic = (pheno.bonusPrismaticChance || 0) + (state.hydrology?.isRainbowActive ? 0.10 : 0) - (plot.isMonoculture ? 0.25 : 0);
        const hasSiltFertilizer = Boolean(plot.alluvialSiltCyclesRemaining && plot.alluvialSiltCyclesRemaining > 0);
        const qualityRoll = rollCropQuality(Boolean(plot.hasRootRot), plot.moistureLevel ?? 60.0, Math.max(0, bonusPrismatic + (hasSiltFertilizer ? 0.15 : 0)));
        const isDepletedPenalty = Boolean(plot.plantedInDepletedSoil);
        const baseTotalYield = isDepletedPenalty
          ? 1 // Depleted soil penalty: drops to 1x harvest
          : (cropDef.yieldCount + bonusYield + soilTier.bonusYield + pheno.extraQuantity);
        const qualityAdjusted = isDepletedPenalty
          ? 1
          : Math.max(1, Math.round(baseTotalYield * qualityRoll.yieldMultiplier * pheno.yieldMultiplier));
        const totalYield = (isDoubleProc && !isDepletedPenalty) ? qualityAdjusted * 2 : qualityAdjusted;

        // Soil Battery Energy Update (Consumption or Restorative Legume Recharge)
        const batteryRes = consumeOrRestoreSoilBattery(plot.soilBattery, plot.crop);
        const newBattery = batteryRes.newBattery;

        // Deposit into dedicated quality-tier slot in Silo if silver/gold/prismatic
        const harvestItemKey = qualityRoll.quality !== 'standard' ? `${plot.crop}_${qualityRoll.quality}` : plot.crop;
        const newSilo = { ...state.silo, [harvestItemKey]: (state.silo[harvestItemKey] || 0) + totalYield };
        state.registerHarvestFreshness(plot.crop, totalYield);
        if (harvestItemKey !== plot.crop) {
          state.registerHarvestFreshness(harvestItemKey, totalYield);
        }
        const newPlots = [...state.plots];
        const nextSiltCycles = (plot.alluvialSiltCyclesRemaining && plot.alluvialSiltCyclesRemaining > 0) ? plot.alluvialSiltCyclesRemaining - 1 : undefined;
        // Harvest resets soil crop while preserving moisture, saving lastHarvestedCrop for rotation tracking
        newPlots[plotId] = {
          id: plotId,
          crop: null,
          plantedAt: null,
          ready: false,
          isWatered: soilTier.autoHydrate ? true : (plot.moistureLevel ? plot.moistureLevel >= 40 : false),
          wateredUntil: null,
          level: pLevel,
          moistureLevel: plot.moistureLevel !== undefined ? plot.moistureLevel : 60.0,
          desiccatedSeconds: 0,
          waterloggedSeconds: 0,
          isWithered: false,
          hasRootRot: false,
          alluvialSiltCyclesRemaining: nextSiltCycles,
          phenologyBadgeEmoji: undefined,
          phenologyBadgeText: undefined,
          isFrostbitten: false,
          isHeatWilted: false,
          isDormant: false,
          lastHarvestedCrop: plot.crop,
          isMonoculture: false,
          soilBattery: newBattery,
          plantedInDepletedSoil: false,
        };

        if (isDepletedPenalty) {
          state.addNotification(`⚠️ Tired Soil: Harvest reduced to only 1x crop (Slowed Growth) due to depleted soil battery! Add compost or plant restorative peas to recharge.`, '⚠️', 'info');
        } else if (batteryRes.action === 'restored') {
          state.addNotification(`🫛 Restorative Legume Harvest! Recharged 🟢 Leaf & Stem Soil Energy to 100% full!`, '🌱', 'discovery');
        } else if (qualityRoll.quality !== 'standard') {
          const qName = qualityRoll.quality.charAt(0).toUpperCase() + qualityRoll.quality.slice(1);
          state.addNotification(`${qualityRoll.badgeEmoji} ${qualityRoll.badgeText} Harvest! +${totalYield} ${qName} ${cropDef.name} deposited into Silo!`, qualityRoll.badgeEmoji, 'event');
        } else if (plot.hasRootRot) {
          state.addNotification(`🪱 Root Rot Penalty: ${cropDef.name} yield halved (+${totalYield})!`, '🪱', 'info');
        } else if (pheno.yieldMultiplier < 1.0) {
          state.addNotification(`🌨️ Hazard Lodging: Severe weather reduced harvest yield by ${Math.round((1 - pheno.yieldMultiplier) * 100)}%!`, '🧊', 'event');
        } else if (pheno.extraQuantity > 0) {
          state.addNotification(`🎃 Vine Swell: Muggy air produced +${pheno.extraQuantity} extra fruit!`, '🎃', 'info');
        } else if (isDoubleProc) {
          state.addNotification(`🌋 Volcanic Double Yield proc! +${totalYield} ${cropDef.name}!`, '✨', 'info');
        }

        if (pheno.priceMultiplier > 1.0) {
          state.addNotification(`❄️ Cold-Sweetened Starch Conversion: +${Math.round((pheno.priceMultiplier - 1.0) * 100)}% market value bonus!`, '❄️', 'info');
        }

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
        const earnedXp = Math.round((3 + soilTier.bonusXp) * xpMultiplier);
        const { xp: newXp, level: newLevel } = levelUpCheck(state.xp + earnedXp, state.level);
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
        let monocultureCount = 0;
        let depletedPlantedCount = 0;
        for (const pid of emptyPlotIds) {
          const currentPlot = state.plots[pid];
          const pLevel = currentPlot?.level || 1;
          const soilTier = getSoilTier(pLevel);
          const isMonoculture = Boolean(state.isHardcoreMode && currentPlot?.lastHarvestedCrop && currentPlot?.lastHarvestedCrop === cropId);
          if (isMonoculture) monocultureCount++;

          const isCharged = isBatteryChargedForCrop(currentPlot?.soilBattery, cropId);
          const plantedInDepletedSoil = !isCharged;
          if (plantedInDepletedSoil) depletedPlantedCount++;

          newPlots[pid] = {
            ...currentPlot,
            id: pid,
            crop: cropId,
            plantedAt: now,
            ready: false,
            isWatered: soilTier.autoHydrate || currentPlot?.isWatered || false,
            wateredUntil: currentPlot?.wateredUntil || null,
            level: pLevel,
            alluvialSiltCyclesRemaining: currentPlot?.alluvialSiltCyclesRemaining,
            moistureLevel: currentPlot?.moistureLevel !== undefined ? currentPlot?.moistureLevel : 60.0,
            isMonoculture,
            soilBattery: currentPlot?.soilBattery || { green: true, yellow: true, red: true },
            plantedInDepletedSoil,
          };
        }
        if (monocultureCount > 0) {
          state.addNotification(`⚠️ Monoculture Exhaustion: ${monocultureCount} plot(s) planted with ${cropDef.name} consecutively (+35% grow time)!`, '🥀', 'info');
        }
        if (depletedPlantedCount > 0) {
          state.addNotification(`⚠️ Tired Soil: Planted ${depletedPlantedCount} plot(s) without matching fuel! Slowed growth & 1x harvest.`, '🥀', 'info');
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

        let qualityCropsCount = 0;

        for (let i = 0; i < state.unlockedPlots; i++) {
          const plot = state.plots[i];
          if (plot && plot.crop && plot.ready) {
            if (plot.isWithered) {
              newPlots[i] = {
                id: i,
                crop: null,
                plantedAt: null,
                ready: false,
                isWatered: false,
                wateredUntil: null,
                level: plot.level || 1,
                moistureLevel: plot.moistureLevel !== undefined ? plot.moistureLevel : 50.0,
                desiccatedSeconds: 0,
                waterloggedSeconds: 0,
                isWithered: false,
                hasRootRot: false,
              };
              continue;
            }

            const cropDef = CROPS[plot.crop];
            const plotOverclock = updatedOverclocks[`plot_${i}`];
            const bonus = (plotOverclock?.isOverclocked && plotOverclock.bonusYield) ? plotOverclock.bonusYield : 0;
            const pLevel = plot.level || 1;
            const soilTier = getSoilTier(pLevel);
            const isDoubleProc = Math.random() < soilTier.doubleProcChance;

            // Climate-Driven Crop Phenology & Weather Hazard modifiers
            const activeWeatherId: WeatherProfileId = resolveWeatherProfileId(state.hydrology?.weatherCondition);
            const pheno = evaluateCropPhenology({
              cropId: plot.crop,
              weather: activeWeatherId,
              moistureLevel: plot.moistureLevel ?? 60.0,
              isProtectedByGreenhouse: false,
            });

            const bonusPrismatic = (pheno.bonusPrismaticChance || 0) + (state.hydrology?.isRainbowActive ? 0.10 : 0);
            const hasSiltFertilizer = Boolean(plot.alluvialSiltCyclesRemaining && plot.alluvialSiltCyclesRemaining > 0);
            const qualityRoll = rollCropQuality(Boolean(plot.hasRootRot), plot.moistureLevel ?? 60.0, bonusPrismatic + (hasSiltFertilizer ? 0.15 : 0));
            if (qualityRoll.quality !== 'standard') qualityCropsCount++;

            const isDepletedPenalty = Boolean(plot.plantedInDepletedSoil);
            const singleYield = isDepletedPenalty
              ? 1
              : (cropDef.yieldCount + bonus + soilTier.bonusYield + pheno.extraQuantity);
            const qualityAdjusted = isDepletedPenalty
              ? 1
              : Math.max(1, Math.round(singleYield * qualityRoll.yieldMultiplier * pheno.yieldMultiplier));
            const plotYield = (isDoubleProc && !isDepletedPenalty) ? qualityAdjusted * 2 : qualityAdjusted;
            totalBonusYield += (!isDepletedPenalty ? (bonus + soilTier.bonusYield) : 0);

            // Soil battery energy update
            const batteryRes = consumeOrRestoreSoilBattery(plot.soilBattery, plot.crop);
            const newBattery = batteryRes.newBattery;

            const harvestItemKey = qualityRoll.quality !== 'standard' ? `${plot.crop}_${qualityRoll.quality}` : plot.crop;
            newSilo[harvestItemKey] = (newSilo[harvestItemKey] || 0) + plotYield;
            state.registerHarvestFreshness(plot.crop, plotYield);
            if (harvestItemKey !== plot.crop) {
              state.registerHarvestFreshness(harvestItemKey, plotYield);
            }
            const nextSiltCycles = (plot.alluvialSiltCyclesRemaining && plot.alluvialSiltCyclesRemaining > 0) ? plot.alluvialSiltCyclesRemaining - 1 : undefined;
            newPlots[i] = {
              id: i,
              crop: null,
              plantedAt: null,
              ready: false,
              isWatered: soilTier.autoHydrate ? true : (plot.moistureLevel ? plot.moistureLevel >= 40 : false),
              wateredUntil: null,
              level: pLevel,
              moistureLevel: plot.moistureLevel !== undefined ? plot.moistureLevel : 60.0,
              desiccatedSeconds: 0,
              waterloggedSeconds: 0,
              isWithered: false,
              hasRootRot: false,
              alluvialSiltCyclesRemaining: nextSiltCycles,
              phenologyBadgeEmoji: undefined,
              phenologyBadgeText: undefined,
              isFrostbitten: false,
              isHeatWilted: false,
              isDormant: false,
              lastHarvestedCrop: plot.crop,
              isMonoculture: false,
              soilBattery: newBattery,
              plantedInDepletedSoil: false,
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
        if (qualityCropsCount > 0) {
          state.addNotification(`✨ Harvested ${qualityCropsCount} premium quality crops (Silver/Gold/Prismatic) from optimal capillary soil!`, '🌈', 'event');
        }
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

      applyCompostToProps: (plotId: number) => {
        const state = get();
        const plot = state.plots[plotId];
        if (!plot || plotId >= state.unlockedPlots) return false;

        const isFullyCharged = plot.soilBattery?.green && plot.soilBattery?.yellow && plot.soilBattery?.red;
        if (isFullyCharged && !plot.plantedInDepletedSoil) {
          state.addNotification(`Plot #${plotId + 1} soil energy is already at 100% full!`, 'ℹ️', 'info');
          return false;
        }

        // Deduct compost or manure from barn if available; otherwise allow emergency coin bailout
        const newBarn = { ...state.barn };
        let costMethod = 'Free Recharge';
        if ((newBarn.organic_compost || 0) > 0) {
          newBarn.organic_compost -= 1;
          costMethod = '1x Organic Compost';
        } else if ((newBarn.compost || 0) > 0) {
          newBarn.compost -= 1;
          costMethod = '1x Compost';
        } else if ((newBarn.manure || 0) > 0) {
          newBarn.manure -= 1;
          costMethod = '1x Manure';
        } else if (state.coins >= 5) {
          set({ coins: state.coins - 5 });
          costMethod = '🪙 5 Coins';
        }

        const newPlots = [...state.plots];
        newPlots[plotId] = {
          ...plot,
          soilBattery: rechargeSoilBatteryFull(),
          plantedInDepletedSoil: false, // Compost instantly revitalizes tired crops too!
        };

        set({
          barn: newBarn,
          plots: newPlots,
        });

        state.addNotification(`✨ Organic Compost Applied to Plot #${plotId + 1}! Battery refilled to 100% (${costMethod}).`, '🌱', 'discovery');
        return true;
      },

      applyCompostToAllPlots: () => {
        const state = get();
        const newPlots = [...state.plots];
        let rechargedCount = 0;
        const newBarn = { ...state.barn };
        let coinsSpent = 0;

        for (let i = 0; i < state.unlockedPlots; i++) {
          const plot = state.plots[i];
          if (!plot) continue;
          const isFull = plot.soilBattery?.green && plot.soilBattery?.yellow && plot.soilBattery?.red && !plot.plantedInDepletedSoil;
          if (!isFull) {
            if ((newBarn.organic_compost || 0) > 0) {
              newBarn.organic_compost -= 1;
            } else if ((newBarn.compost || 0) > 0) {
              newBarn.compost -= 1;
            } else if ((newBarn.manure || 0) > 0) {
              newBarn.manure -= 1;
            } else if (state.coins - coinsSpent >= 5) {
              coinsSpent += 5;
            }
            newPlots[i] = {
              ...plot,
              soilBattery: rechargeSoilBatteryFull(),
              plantedInDepletedSoil: false,
            };
            rechargedCount++;
          }
        }

        if (rechargedCount === 0) {
          state.addNotification('All plots already have 100% full soil energy!', 'ℹ️', 'info');
          return;
        }

        set({
          plots: newPlots,
          barn: newBarn,
          coins: state.coins - coinsSpent,
        });
        state.addNotification(`✨ Soil Restored: Recharged ${rechargedCount} plots to 100% battery!`, '🌱', 'discovery');
      },

      tillUnderCrop: (plotId: number) => {
        const state = get();
        const plot = state.plots[plotId];
        if (!plot || plotId >= state.unlockedPlots || !plot.crop) return false;

        const pLevel = plot.level || 1;
        const soilTier = getSoilTier(pLevel);

        // Blight Cleansing (Green Manure Effect):
        // If plot has active crop blight, cleanse the infection completely
        let updatedActiveCrisis = state.activeCrisis;
        if (state.activeCrisis?.type === 'crop_blight') {
          const newTargetIds = state.activeCrisis.targetIds.filter(
            id => id !== plotId && id !== String(plotId)
          );
          if (newTargetIds.length === 0) {
            updatedActiveCrisis = null;
          } else {
            updatedActiveCrisis = {
              ...state.activeCrisis,
              targetIds: newTargetIds,
            };
          }
        }

        const newPlots = [...state.plots];
        newPlots[plotId] = {
          ...plot,
          crop: null,
          plantedAt: null,
          ready: false,
          isWatered: soilTier.autoHydrate ? true : (plot.moistureLevel ? plot.moistureLevel >= 40 : false),
          wateredUntil: null,
          level: pLevel,
          moistureLevel: plot.moistureLevel !== undefined ? plot.moistureLevel : 60.0,
          desiccatedSeconds: 0,
          waterloggedSeconds: 0,
          isWithered: false,
          hasRootRot: false,
          isMonoculture: false,
          plantedInDepletedSoil: false,
          phenologyBadgeEmoji: undefined,
          phenologyBadgeText: undefined,
          isFrostbitten: false,
          isHeatWilted: false,
          isDormant: false,
          soilBattery: plot.crop === 'peas'
            ? { ...(plot.soilBattery || { green: true, yellow: true, red: true }), green: true }
            : (plot.soilBattery || { green: true, yellow: true, red: true }),
        };

        set({
          plots: newPlots,
          activeCrisis: updatedActiveCrisis,
          isDirty: true,
        });

        if (plot.crop === 'peas') {
          state.addNotification(`🌱 Plot #${plotId + 1}: Restorative Peas tilled under as green manure! Recharged 🟢 Leaf Fuel to 100% full!`, '🚜', 'discovery');
        } else {
          state.addNotification(`🌱 Plot #${plotId + 1}: Crop tilled under as green manure! Blight cleansed & bed prepped for restorative planting.`, '🚜', 'discovery');
        }
        return true;
      },

      flushPlotBed: (plotId: number) => {
        const state = get();
        const plot = state.plots[plotId];
        if (!plot || plotId >= state.unlockedPlots || plot.crop !== null) return false;

        const isDepleted = !plot.soilBattery?.green || !plot.soilBattery?.yellow || !plot.soilBattery?.red;
        if (!isDepleted && !plot.plantedInDepletedSoil) {
          state.addNotification(`Plot #${plotId + 1} already has 100% full nutrient reserves!`, 'ℹ️', 'info');
          return false;
        }

        const currentTowerLiters = state.hydrology?.towerLiters || 0;
        if (currentTowerLiters < 15) {
          state.addNotification(`⚠️ Elevated Gravity Tower needs at least 15L to flush bed (Current: ${Math.round(currentTowerLiters)}L)!`, '⚠️', 'event');
          return false;
        }

        const isLoadSheddingWarning = currentTowerLiters < 200;
        const newTowerLiters = Math.max(0, Math.round((currentTowerLiters - 15) * 10) / 10);

        const newPlots = [...state.plots];
        newPlots[plotId] = {
          ...plot,
          soilBattery: rechargeSoilBatteryFull(),
          plantedInDepletedSoil: false,
          moistureLevel: Math.max(80, plot.moistureLevel !== undefined ? plot.moistureLevel : 80),
          isWatered: true,
          desiccatedSeconds: 0,
          isWithered: false,
          hasRootRot: false,
          isMonoculture: false,
        };

        playFloodWashSound();

        set({
          hydrology: {
            ...state.hydrology,
            towerLiters: newTowerLiters,
          },
          plots: newPlots,
          isDirty: true,
        });

        if (isLoadSheddingWarning) {
          state.addNotification(`🌊 Soil Flushed — Nutrients Restored! (⚠️ 15L drawn from Tower during Load-Shedding Stage 1, ${newTowerLiters}L remaining)`, '🌊', 'discovery');
        } else {
          state.addNotification(`🌊 Soil Flushed — Nutrients Restored! Deducted 15L from Elevated Gravity Tower (Tower remaining: ${newTowerLiters}L).`, '🌊', 'discovery');
        }
        return true;
      },

      applyUniversalBioDressing: (plotId: number) => {
        const state = get();
        const plot = state.plots[plotId];
        if (!plot || plotId >= state.unlockedPlots) return false;

        let doses = state.barn?.universal_bio_dressing || 0;
        const newBarn = { ...state.barn };
        let purchaseMethod = '';

        if (doses <= 0) {
          const favor = state.globalReputation?.spendableFavor || 0;
          if (favor >= 10) {
            set({
              globalReputation: {
                ...state.globalReputation,
                spendableFavor: favor - 10,
              },
            });
            doses = 3;
            newBarn.universal_bio_dressing = 2; // used 1, kept 2
            purchaseMethod = ' (Purchased pack of 3 for 10 Favor)';
          } else if (state.coins >= 25) {
            set({ coins: state.coins - 25 });
            doses = 3;
            newBarn.universal_bio_dressing = 2; // used 1, kept 2
            purchaseMethod = ' (Emergency relief buy: 3-pack for 🪙 25 Coins)';
          } else {
            state.addNotification('Need at least 1 dose of Universal Bio-Dressing (or 10 Favor / 25 Coins)!', 'ℹ️', 'info');
            return false;
          }
        } else {
          newBarn.universal_bio_dressing = doses - 1;
        }

        let updatedActiveCrisis = state.activeCrisis;
        if (state.activeCrisis?.type === 'crop_blight') {
          const newTargetIds = state.activeCrisis.targetIds.filter(
            id => id !== plotId && id !== String(plotId)
          );
          if (newTargetIds.length === 0) {
            updatedActiveCrisis = null;
          } else {
            updatedActiveCrisis = {
              ...state.activeCrisis,
              targetIds: newTargetIds,
            };
          }
        }

        const newPlots = [...state.plots];
        newPlots[plotId] = {
          ...plot,
          soilBattery: rechargeSoilBatteryFull(),
          plantedInDepletedSoil: false,
          isMonoculture: false,
          isWithered: false,
          hasRootRot: false,
          isFrostbitten: false,
          isHeatWilted: false,
          desiccatedSeconds: 0,
          waterloggedSeconds: 0,
          moistureLevel: Math.max(85, plot.moistureLevel !== undefined ? plot.moistureLevel : 85),
          isWatered: true,
        };

        playBioDressingSound();

        set({
          barn: newBarn,
          plots: newPlots,
          activeCrisis: updatedActiveCrisis,
          isDirty: true,
        });

        state.addNotification(`✨ Universal Bio-Dressing applied to Plot #${plotId + 1}! All 3 nutrient lights recharged to 100% Solid Full & soil health cleansed.${purchaseMethod} (${newBarn.universal_bio_dressing} doses left)`, '🧪', 'discovery');
        return true;
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
          state.registerHarvestFreshness(breedDef.primaryProductKey, breedDef.baseYieldAmount + bonusYield);
        } else {
          // Fallback to species default
          newBarn[speciesDef.product] = (newBarn[speciesDef.product] || 0) + speciesDef.productYield + bonusYield;
          state.registerHarvestFreshness(speciesDef.product, speciesDef.productYield + bonusYield);
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
            state.registerHarvestFreshness(breedDef.primaryProductKey, breedDef.baseYieldAmount + bonusYield);
          } else {
            newBarn[speciesDef.product] = (newBarn[speciesDef.product] || 0) + speciesDef.productYield + bonusYield;
            state.registerHarvestFreshness(speciesDef.product, speciesDef.productYield + bonusYield);
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
        const maxTierCap = tier === 'common' ? 50 : 4;
        const totalPastureCap = 62;
        if (tierCount >= maxTierCap || state.animals.length >= totalPastureCap) {
          state.addNotification(`The ${TIER_LABELS[tier]} sector is at full capacity (${tierCount}/${maxTierCap})!`, '⚠️', 'info');
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
        if ((newBarn as Record<string, number>).honey_comb) {
          newSilo.honey_comb = (newSilo.honey_comb || 0) + ((newBarn as Record<string, number>).honey_comb || 0);
          delete (newBarn as Record<string, number>).honey_comb;
        }
        for (const input of recipe.inputs) {
          if (getStorageAvailableStock(newSilo, newBarn, input.productId) < input.qty) return;
        }
        for (const input of recipe.inputs) {
          deductStorageStock(newSilo, newBarn, input.productId, input.qty);
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
        for (const recipe of building?.recipes || []) {
          if (recipe.id === slot.recipeId) {
            outputItem = recipe.output.productId;
            outputQty = recipe.output.qty;
            break;
          }
        }
        if (!outputItem) {
          for (const b of Object.values(BUILDINGS)) {
            const found = b.recipes.find(r => r.id === slot.recipeId);
            if (found) {
              outputItem = found.output.productId;
              outputQty = found.output.qty;
              break;
            }
          }
        }
        if (!outputItem) return;

        const bOverclock = state.entityOverclocks?.[`building_${buildingId}`] || state.buildingOverclocks?.[buildingId];
        const isOverclocked = Boolean(bOverclock?.isOverclocked && (!bOverclock.expiresAt || Date.now() < bOverclock.expiresAt));
        const bonusYield = isOverclocked && bOverclock?.bonusYield ? bOverclock.bonusYield : 0;
        const isBarnabyActive = Boolean(
          state.specialistWorkers?.worker_feedmaster_barnaby?.isHired &&
          state.specialistWorkers?.worker_feedmaster_barnaby?.isActive &&
          !state.specialistWorkers?.worker_feedmaster_barnaby?.isStriking
        );
        const barnabyBonus = (isBarnabyActive && outputItem === 'feed') ? 1 : 0;
        const totalOutput = outputQty + bonusYield + barnabyBonus;

        const isCropOutput = isCropItem(outputItem);
        const newSilo = { ...state.silo };
        const newBarn = { ...state.barn };
        if (isCropOutput) {
          newSilo[outputItem] = (newSilo[outputItem] || 0) + totalOutput;
        } else {
          newBarn[outputItem] = (newBarn[outputItem] || 0) + totalOutput;
        }
        state.registerHarvestFreshness(outputItem, totalOutput);

        let updatedOverclocks = state.entityOverclocks;
        let updatedBuildingOverclocks = state.buildingOverclocks;
        let updatedHydrology = state.hydrology;

        // Workshop Upgrade Enhancements
        if (outputItem === 'subsoil_aquifer_casing') {
          if (updatedHydrology) {
            updatedHydrology = {
              ...updatedHydrology,
              aquiferCapacityLiters: Math.max(updatedHydrology.aquiferCapacityLiters || 3000, 3500),
            };
          }
          state.addNotification('🏗️ Subsoil Aquifer Casing installed! Deep groundwater aquifer boosted to 3,500L.', '💧', 'info');
        } else if (outputItem === 'reinforced_sluice_seal') {
          if (updatedHydrology) {
            updatedHydrology = {
              ...updatedHydrology,
              hasReinforcedSluiceSeal: true,
            };
          }
          state.addNotification('🛡️ Sluice Gate Seal ready! Canal leakage eliminated (-20% gravity tower drainage).', '🔧', 'info');
        } else if (outputItem === 'hardened_chitin_trowel') {
          state.addNotification('⛏️ Hardened Chitin Trowel equipped! Field hands perform tilling, planting, and clearing 30% faster.', '✨', 'info');
        } else if (outputItem === 'prismatic_light_lens') {
          state.addNotification('🔍 Prismatic Light Lens calibrated! Nighttime crop growth stalls completely eliminated.', '🌈', 'info');
        } else if (outputItem === 'thermal_retaining_core') {
          state.addNotification('🔥 Thermal Retaining Core activated! Frost-immunity range expanded across outer plots.', '💎', 'info');
        }

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
          hydrology: updatedHydrology,
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
        if ((newBarn as Record<string, number>).honey_comb) {
          newSilo.honey_comb = (newSilo.honey_comb || 0) + ((newBarn as Record<string, number>).honey_comb || 0);
          delete (newBarn as Record<string, number>).honey_comb;
        }
        let craftCount = 0;
        for (let i = 0; i < freeSlots; i++) {
          let canAfford = true;
          for (const input of recipe.inputs) {
            if (getStorageAvailableStock(newSilo, newBarn, input.productId) < input.qty) {
              canAfford = false;
              break;
            }
          }
          if (!canAfford) break;
          // Deduct inputs
          for (const input of recipe.inputs) {
            deductStorageStock(newSilo, newBarn, input.productId, input.qty);
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
        let updatedHydrology = state.hydrology;
        const newQueue: ProductionSlot[] = [];

        for (const slot of queue) {
          if (slot.done) {
            let outputItem = '';
            let outputQty = 0;
            for (const recipe of building?.recipes || []) {
              if (recipe.id === slot.recipeId) {
                outputItem = recipe.output.productId;
                outputQty = recipe.output.qty;
                break;
              }
            }
            if (!outputItem) {
              for (const b of Object.values(BUILDINGS)) {
                const found = b.recipes.find(r => r.id === slot.recipeId);
                if (found) {
                  outputItem = found.output.productId;
                  outputQty = found.output.qty;
                  break;
                }
              }
            }
            if (outputItem) {
              const isBarnabyActive = Boolean(
                state.specialistWorkers?.worker_feedmaster_barnaby?.isHired &&
                state.specialistWorkers?.worker_feedmaster_barnaby?.isActive &&
                !state.specialistWorkers?.worker_feedmaster_barnaby?.isStriking
              );
              const barnabyBonus = (isBarnabyActive && outputItem === 'feed') ? 1 : 0;
              const finalOutput = outputQty + barnabyBonus;
              const isCropOutput = outputItem in CROPS || outputItem === 'feed' || outputItem === 'cotton' || outputItem === 'honey_comb' || outputItem === 'wild_berries' || outputItem === 'gold_nugget';
              if (isCropOutput) {
                newSilo[outputItem] = (newSilo[outputItem] || 0) + finalOutput;
              } else {
                newBarn[outputItem] = (newBarn[outputItem] || 0) + finalOutput;
              }
              state.registerHarvestFreshness(outputItem, finalOutput);
              if (outputItem === 'subsoil_aquifer_casing' && updatedHydrology) {
                updatedHydrology = {
                  ...updatedHydrology,
                  aquiferCapacityLiters: Math.max(updatedHydrology.aquiferCapacityLiters || 3000, 3500),
                };
              } else if (outputItem === 'reinforced_sluice_seal' && updatedHydrology) {
                updatedHydrology = {
                  ...updatedHydrology,
                  hasReinforcedSluiceSeal: true,
                };
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
          hydrology: updatedHydrology,
          xp: newXp,
          level: newLevel,
        });
      },

      fulfillDeliveryOrder: (orderId: string, route: 'safe' | 'wild' = 'safe') => {
        const state = get();
        const order = state.orders.find(o => o.id === orderId);
        if (!order) return { success: false, message: 'Order not found' };

        // Hydrology Pressurized Water Validation
        const availableWater = getAvailableHydrologyWater(state.hydrology);
        if (order.waterRequired && order.waterRequired > 0) {
          if (availableWater < order.waterRequired) {
            return {
              success: false,
              message: `Need ${order.waterRequired}L Pressurized Water (have ${availableWater}L in Hydrology storage)`,
            };
          }
        }
        const updatedHydrology = order.waterRequired && state.hydrology
          ? deductHydrologyWater(state.hydrology, order.waterRequired)
          : state.hydrology;

        const newSilo = { ...state.silo };
        const newBarn = { ...state.barn };
        const required = order.requiredItems || (order.requested?.map(r => ({ itemId: r.itemId, quantity: r.qty, name: r.name, icon: r.emoji })) || []);

        for (const item of required) {
          if (getStorageAvailableStock(newSilo, newBarn, item.itemId) < item.quantity) {
            return { success: false, message: `Need ${item.quantity} ${item.name}` };
          }
        }
        for (const item of required) {
          deductStorageStock(newSilo, newBarn, item.itemId, item.quantity);
        }

        const now = Date.now();
        // Daily Trade Velocity Streak (resets if inactive > 45 mins)
        const streakValid = Boolean(state.lastTradeStreakTimestamp && (now - state.lastTradeStreakTimestamp <= 45 * 60 * 1000));
        const currentStreak = streakValid ? (state.tradeStreak || 0) : 0;
        const isRush = Boolean(
          (order.type === 'rush' || order.isRushOrder) &&
          ((order.expiresAt && order.expiresAt > now) || (order.rushExpiresAt && order.rushExpiresAt > now))
        );

        // Daily payroll burn rate for coverage calculation
        const telemetry = calculateStaffUpkeep(state.unifiedWorkers, state.specialistWorkers, state.payrollVaultCoins, state.staffPantry);
        const dailyBurnRate = telemetry.baseDailyPayroll;

        // Perishable Batches & Pristine Freshness Validation
        let pristineBonusAwarded = 0;
        const updatedBatches = { ...(state.perishableBatches || {}) };
        let hasPerishables = false;
        let allPristine = true;

        for (const item of required) {
          if (isItemPerishable(item.itemId)) {
            hasPerishables = true;
            const batches = updatedBatches[item.itemId] || [];
            const def = PERISHABLE_DEFINITIONS[item.itemId];
            const maxLife = def?.baseDecayDurationSec || 900;
            const pristineCount = batches
              .filter(b => calculateFreshnessPercent(b.harvestedAt, b.maxLifetimeSec || maxLife, now) >= 85)
              .reduce((sum, b) => sum + b.quantity, 0);

            if (pristineCount < item.quantity) {
              allPristine = false;
            }

            // Deduct from perishable batches
            let remainingNeeded = item.quantity;
            const remainingBatches: PerishableBatch[] = [];
            for (const b of batches) {
              if (remainingNeeded <= 0) {
                remainingBatches.push(b);
              } else if (b.quantity <= remainingNeeded) {
                remainingNeeded -= b.quantity;
              } else {
                remainingBatches.push({ ...b, quantity: b.quantity - remainingNeeded });
                remainingNeeded = 0;
              }
            }
            updatedBatches[item.itemId] = remainingBatches;
          }
        }

        const contractTier = order.contractTier || 'tier1_local';
        const settlement = calculateMasterSettlement(
          required,
          contractTier,
          currentStreak,
          isRush,
          dailyBurnRate,
          order.waterRequired || 0,
          order.isHighStakes || false
        );

        const baseCoins = settlement.finalCoinPayout;
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

        if (hasPerishables && allPristine && order.rewards?.pristineBonusCoins) {
          pristineBonusAwarded = order.rewards.pristineBonusCoins;
          finalCoins += pristineBonusAwarded;
        }

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

        if (order.isHighStakes) {
          routeNotice += ' 👑 High-Stakes Bounty Secured!';
        }
        if (pristineBonusAwarded > 0) {
          routeNotice += ` ✨ Pristine Freshness Bonus (+${pristineBonusAwarded}c)!`;
        }
        if (order.waterRequired) {
          routeNotice += ` 💧 Hydrology Provision (+${order.waterRequired}L)!`;
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
          hydrology: updatedHydrology,
          perishableBatches: updatedBatches,
          coins: state.coins + finalCoins,
          gems: state.gems + baseGems,
          xp: newXp,
          level: newLevel,
          clientReputation: updatedClientRep,
          globalReputation: updatedGlobalRep,
          orders: newOrders,
          tradeStreak: currentStreak + 1,
          lastTradeStreakTimestamp: now,
          isDirty: true,
        });

        return { success: true, hazardEncountered, message: routeNotice };
      },

      dispatchBulkCaravan: (orderIds: string[], route: 'safe' | 'wild' = 'safe') => {
        const state = get();
        if (!orderIds || orderIds.length === 0) {
          return { success: false, ordersCount: 0, netCoins: 0, message: 'No orders selected for caravan dispatch', rareDropsWon: [] };
        }

        const orderIdSet = new Set(orderIds);
        const matchedOrders = state.orders.filter(o => orderIdSet.has(o.id));
        if (matchedOrders.length === 0) {
          return { success: false, ordersCount: 0, netCoins: 0, message: 'Selected orders not found on order board', rareDropsWon: [] };
        }

        // Aggregate Inventory & Hydrology Validation (Anti-cannibalization)
        const cargoValidation = validateCaravanCargo(
          matchedOrders,
          state.silo,
          state.barn,
          getAvailableHydrologyWater(state.hydrology)
        );
        if (!cargoValidation.isValidCargo) {
          const firstDeficit = cargoValidation.conflictingItems[0];
          const errReason = firstDeficit
            ? `Insufficient stock for ${firstDeficit.name} (have ${firstDeficit.availableStock}, need ${firstDeficit.totalRequired})`
            : 'Combined cargo exceeds available barn/silo/water stock';
          return { success: false, ordersCount: 0, netCoins: 0, message: errReason, rareDropsWon: [] };
        }

        const now = Date.now();
        // Trade Velocity Streak (resets if inactive > 45 mins)
        const streakValid = Boolean(state.lastTradeStreakTimestamp && (now - state.lastTradeStreakTimestamp <= 45 * 60 * 1000));
        const currentStreak = streakValid ? (state.tradeStreak || 0) : 0;

        // Daily payroll burn rate for coverage calculation
        const telemetry = calculateStaffUpkeep(state.unifiedWorkers, state.specialistWorkers, state.payrollVaultCoins, state.staffPantry);
        const dailyBurnRate = telemetry.baseDailyPayroll;

        const settlement = calculateCaravanSettlement({
          orders: matchedOrders,
          currentStreak,
          now,
          clientReputation: state.clientReputation,
          relics: state.relics,
          dailyPayrollRate: dailyBurnRate,
        });

        // Deduct aggregated requirements from Silo and Barn
        const newSilo = { ...state.silo };
        const newBarn = { ...state.barn };
        for (const demand of cargoValidation.demands) {
          if (demand.storageType === 'silo') {
            newSilo[demand.itemId] = Math.max(0, (newSilo[demand.itemId] || 0) - demand.totalRequired);
          } else {
            newBarn[demand.itemId] = Math.max(0, (newBarn[demand.itemId] || 0) - demand.totalRequired);
          }
        }

        let finalCoins = settlement.totalNetProceeds;
        let hazardEncountered = false;
        let routeNotice = '';

        if (route === 'wild') {
          const clientRep = state.clientReputation || DEFAULT_CLIENT_REPUTATION;
          const captainLevel = clientRep.captain_sterling?.level || 1;
          const captainReduc = captainLevel >= 3 ? 0.12 : 0;
          const riskRate = Math.max(0.08, 0.25 - captainReduc);

          if (Math.random() < riskRate) {
            hazardEncountered = true;
            const jedLevel = clientRep.old_man_jed?.level || 1;
            const tollPercent = jedLevel >= 3 ? 0.08 : 0.15;
            const lossCoins = Math.floor(finalCoins * tollPercent);
            finalCoins = Math.max(1, finalCoins - lossCoins);
            routeNotice = `⚠️ Road Ambush: Caravan paid ${lossCoins}c toll on the mountain pass.`;
            playDefeatSound();
          } else {
            const wildBounty = Math.round(finalCoins * 0.25);
            finalCoins += wildBounty;
            routeNotice = `🌲 Wild Shortcut Conquered! +${wildBounty}c Hazard Logistics Bonus!`;
            playGoldRushFanfare();
          }
        }

        // Grant rare frontier drops if any
        const rareDropsWon: string[] = [];
        for (const drop of settlement.rareFrontierDrops) {
          newBarn[drop.itemId] = (newBarn[drop.itemId] || 0) + drop.qty;
          rareDropsWon.push(`${drop.qty}x ${drop.name}`);
        }

        // Update Client Reputation for each contributing client
        let updatedClientRep = { ...(state.clientReputation || DEFAULT_CLIENT_REPUTATION) };
        let updatedGlobalRep = state.globalReputation || createInitialGlobalReputation();
        let clientsMap = { ...updatedGlobalRep.clients };
        let addedSpendableFavor = 0;

        for (const [cKey, repGain] of Object.entries(settlement.clientRepGains)) {
          const cDef = CLIENT_DEFINITIONS[cKey] || CLIENT_DEFINITIONS.mayor_barnaby;
          const cState = updatedClientRep[cKey] || { level: 1, xp: 0 };
          const newXpTotal = cState.xp + repGain;
          const repInfo = getReputationInfo(newXpTotal, cDef);

          updatedClientRep[cKey] = {
            level: repInfo.level,
            xp: newXpTotal,
          };

          const existingClientData = clientsMap[cKey] || createInitialClientData(cKey, cDef.name, cDef.title, cDef.avatar);
          const updatedGlobalClientXp = existingClientData.currentXp + repGain;
          const clientLvlInfo = getClientLevelFromXp(updatedGlobalClientXp, existingClientData.tiers);

          clientsMap[cKey] = {
            ...existingClientData,
            currentXp: updatedGlobalClientXp,
            currentLevel: clientLvlInfo.level,
          };
          addedSpendableFavor += repGain;

          if (clientLvlInfo.level > existingClientData.currentLevel || repInfo.level > cState.level) {
            playVictoryChime();
            state.addNotification(
              `⭐ CLIENT PROMOTION! ${cDef.name} reached Reputation Level ${clientLvlInfo.level}! Perk Unlocked: ${clientLvlInfo.currentTier.perkTitle}!`,
              cDef.avatar,
              'event'
            );
          }
        }

        const updatedUnlockedPerks = computeUnlockedPerks(clientsMap);
        updatedGlobalRep = {
          ...updatedGlobalRep,
          spendableFavor: (updatedGlobalRep.spendableFavor || 0) + addedSpendableFavor,
          clients: clientsMap,
          unlockedPerks: updatedUnlockedPerks,
        };

        // Captain Sterling charter perk
        const sterlingLevel = updatedClientRep.captain_sterling?.level || 1;
        if (sterlingLevel >= 5 && Math.random() < 0.35) {
          const bonusItem = Math.random() < 0.5 ? 'Expansion Deed' : 'Nail';
          rareDropsWon.push(`1x ${bonusItem} (Naval Charter)`);
          newBarn[bonusItem === 'Expansion Deed' ? 'expansion_deed' : 'nail'] =
            (newBarn[bonusItem === 'Expansion Deed' ? 'expansion_deed' : 'nail'] || 0) + 1;
        }

        // XP & Leveling
        const xpBonus = (state.relics.ancientSunRelic ? 1.15 : 1.0) * (state.relics.circusCub ? 1.10 : 1.0);
        const { xp: newXp, level: newLevel } = levelUpCheck(
          state.xp + Math.round(settlement.totalXp * xpBonus),
          state.level
        );

        // Replace all fulfilled orders with fresh contracts
        const newOrders = state.orders.map(o => (orderIdSet.has(o.id) ? generateDeliveryOrder(newLevel) : o));

        playGoldRushFanfare();
        const dropText = rareDropsWon.length > 0 ? ` 🎁 Frontier Rare Drops: ${rareDropsWon.join(', ')}!` : '';
        const streakText = settlement.streakLeapAchieved ? ` ⚡ ${settlement.streakLeapNotice}` : ` Streak: ${settlement.advancedStreak}!`;

        state.addNotification(
          `🚚 CARAVAN DISPATCHED: ${matchedOrders.length} Contracts Hauled! +${finalCoins} Coins (+${settlement.totalBonusGoldEarned} bonus), +${settlement.totalXp} XP.${streakText}${dropText} ${routeNotice}`,
          '🚚',
          'event'
        );

        const totalWaterDemanded = matchedOrders.reduce((sum, o) => sum + (o.waterRequired || 0), 0);
        const updatedHydrology = totalWaterDemanded > 0 && state.hydrology
          ? deductHydrologyWater(state.hydrology, totalWaterDemanded)
          : state.hydrology;

        set({
          silo: newSilo,
          barn: newBarn,
          hydrology: updatedHydrology,
          coins: state.coins + finalCoins,
          gems: state.gems + settlement.totalGems,
          xp: newXp,
          level: newLevel,
          clientReputation: updatedClientRep,
          globalReputation: updatedGlobalRep,
          orders: newOrders,
          tradeStreak: settlement.advancedStreak,
          lastTradeStreakTimestamp: now,
          isDirty: true,
        });

        return {
          success: true,
          ordersCount: matchedOrders.length,
          netCoins: finalCoins,
          message: `Caravan hauled ${matchedOrders.length} contracts for ${finalCoins} coins!`,
          hazardEncountered,
          rareDropsWon,
        };
      },

      fulfillOrder: (orderId) => {
        get().fulfillDeliveryOrder(orderId, 'safe');
      },

      trashOrder: (orderId) => {
        const state = get();
        const order = state.orders.find(o => o.id === orderId);
        let newCoins = state.coins;
        if (order && (order.type === 'rush' || order.type === 'futures' || order.isRushOrder)) {
          const breachPercent = state.isHardcoreMode ? 0.20 : 0.10;
          const minFee = state.isHardcoreMode ? 25 : 15;
          const fee = order.penaltyCoins || order.breachFee || Math.max(minFee, Math.round((order.rewards?.coins || order.coinReward || 50) * breachPercent));
          newCoins = Math.max(0, newCoins - fee);
          playDefeatSound();
          state.addNotification(`⚠️ Contract Cancelled: Paid breach cancellation fee of ${fee} coins.`, '📉', 'event');
        }
        const newOrders = state.orders.map(o => o.id === orderId ? generateDeliveryOrder(state.level) : o);
        set({ coins: newCoins, orders: newOrders, isDirty: true });
      },

      registerHarvestFreshness: (itemId: string, quantity: number) => {
        if (!isItemPerishable(itemId) || quantity <= 0) return;
        const state = get();
        const def = PERISHABLE_DEFINITIONS[itemId];
        const maxLifetime = def?.baseDecayDurationSec || 900;
        const newBatch: PerishableBatch = {
          id: `batch_${itemId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          itemId,
          quantity,
          harvestedAt: Date.now(),
          maxLifetimeSec: maxLifetime,
        };
        const currentBatches = state.perishableBatches?.[itemId] || [];
        set({
          perishableBatches: {
            ...state.perishableBatches,
            [itemId]: [...currentBatches, newBatch],
          },
          isDirty: true,
        });
      },

      loadContractEscrow: (contractId: string, slotId: string, quantity?: number) => {
        const state = get();
        const contract = state.highStakesContracts?.find(c => c.id === contractId);
        if (!contract || contract.status !== 'active') {
          return { success: false, message: 'Contract is not currently active.' };
        }
        const slot = contract.manifest.find(s => s.slotId === slotId);
        if (!slot) return { success: false, message: 'Manifest slot not found.' };

        const needed = slot.requiredQuantity - slot.escrowQuantity;
        if (needed <= 0) return { success: false, message: 'Manifest slot is already 100% loaded.' };

        const qtyToLoad = Math.min(needed, quantity && quantity > 0 ? quantity : needed);

        // If water slot, siphon from tower
        if (slot.isWaterSlot || slot.itemId === 'gravity_tower_water') {
          return get().siphonTowerWaterToEscrow(contractId, qtyToLoad);
        }

        const isCrop = slot.itemId in state.silo;
        const currentStock = isCrop ? (state.silo[slot.itemId] || 0) : (state.barn[slot.itemId] || 0);

        if (currentStock < 1) {
          return { success: false, message: `You have 0x ${slot.name} available in storage.` };
        }

        // Freshness Validation Check (Requirement 1 & Verification 1)
        if (slot.minFreshness && isItemPerishable(slot.itemId)) {
          const batches = state.perishableBatches?.[slot.itemId] || [];
          const now = Date.now();
          const def = PERISHABLE_DEFINITIONS[slot.itemId];
          const maxLifetime = def?.baseDecayDurationSec || 900;

          // Find available units in batches matching required freshness
          let eligibleUnits = 0;
          let bestFreshnessPct = 0;
          for (const b of batches) {
            const pct = calculateFreshnessPercent(b.harvestedAt, b.maxLifetimeSec || maxLifetime, now);
            if (pct > bestFreshnessPct) bestFreshnessPct = pct;
            const tier = getFreshnessTier(pct);
            if (slot.minFreshness === 'pristine' && tier === 'pristine') {
              eligibleUnits += b.quantity;
            } else if (slot.minFreshness === 'standard' && (tier === 'pristine' || tier === 'standard')) {
              eligibleUnits += b.quantity;
            }
          }

          // If no batches exist yet (e.g. unbatched stock), evaluate baseline
          if (batches.length === 0) {
            if (slot.minFreshness === 'pristine') {
              return {
                success: false,
                message: `Rejected by Client Inspector: Requires ★ Pristine freshness (≥85%), but current inventory stock is Standard (70%). Harvest or bake fresh items!`,
              };
            }
            eligibleUnits = currentStock;
          } else if (eligibleUnits < 1) {
            const currentTier = getFreshnessTier(bestFreshnessPct);
            return {
              success: false,
              message: `Rejected by Client: Requires ${slot.minFreshness === 'pristine' ? '★ Pristine (≥85%)' : 'Standard (≥40%)'}, but your available stock is ${currentTier.toUpperCase()} (${bestFreshnessPct}%). Harvest or bake fresh stock!`,
            };
          }
        }

        const actualLoad = Math.min(qtyToLoad, currentStock);

        // Deduct from silo or barn
        const newSilo = { ...state.silo };
        const newBarn = { ...state.barn };
        if (isCrop) {
          newSilo[slot.itemId] = Math.max(0, (newSilo[slot.itemId] || 0) - actualLoad);
        } else {
          newBarn[slot.itemId] = Math.max(0, (newBarn[slot.itemId] || 0) - actualLoad);
        }

        // Deduct from perishable batches
        const newBatches = { ...(state.perishableBatches || {}) };
        if (newBatches[slot.itemId]) {
          let remainingToDeduct = actualLoad;
          const updatedList: PerishableBatch[] = [];
          for (const b of newBatches[slot.itemId]) {
            if (remainingToDeduct <= 0) {
              updatedList.push(b);
            } else if (b.quantity <= remainingToDeduct) {
              remainingToDeduct -= b.quantity;
            } else {
              updatedList.push({ ...b, quantity: b.quantity - remainingToDeduct });
              remainingToDeduct = 0;
            }
          }
          newBatches[slot.itemId] = updatedList;
        }

        // Update contract manifest
        const updatedContracts = state.highStakesContracts.map(c => {
          if (c.id !== contractId) return c;
          return {
            ...c,
            manifest: c.manifest.map(m => {
              if (m.slotId !== slotId) return m;
              return { ...m, escrowQuantity: m.escrowQuantity + actualLoad };
            }),
          };
        });

        playCashRegisterSound();

        set({
          silo: newSilo,
          barn: newBarn,
          perishableBatches: newBatches,
          highStakesContracts: updatedContracts,
          isDirty: true,
        });

        state.addNotification(
          `📦 Escrow Loaded: +${actualLoad}x ${slot.name} secured in shipping crate (${slot.escrowQuantity + actualLoad}/${slot.requiredQuantity}).`,
          '📦',
          'info'
        );

        return {
          success: true,
          message: `Loaded ${actualLoad}x ${slot.name} into shipping crate.`,
        };
      },

      siphonTowerWaterToEscrow: (contractId: string, litersToSiphon?: number) => {
        const state = get();
        const contract = state.highStakesContracts?.find(c => c.id === contractId);
        if (!contract || contract.status !== 'active') {
          return { success: false, message: 'Contract is not active.' };
        }
        const slot = contract.manifest.find(s => s.isWaterSlot || s.itemId === 'gravity_tower_water');
        if (!slot) return { success: false, message: 'No water requirement in this contract.' };

        const needed = slot.requiredQuantity - slot.escrowQuantity;
        if (needed <= 0) return { success: false, message: 'Water requirement is already fully escrowed.' };

        const available = state.hydrology?.towerLiters || 0;
        if (available <= 0) {
          return { success: false, message: 'Elevated Gravity Tower is completely dry (0L)! Coordinate aquifer pumping first.' };
        }

        const requested = litersToSiphon && litersToSiphon > 0 ? litersToSiphon : needed;
        const actualDraw = Math.min(requested, needed, available);

        const newTowerLiters = Math.max(0, Math.round((available - actualDraw) * 10) / 10);
        const stage = getTowerLoadSheddingStage(newTowerLiters, state.hydrology?.towerCapacityLiters || 800);

        const updatedContracts = state.highStakesContracts.map(c => {
          if (c.id !== contractId) return c;
          return {
            ...c,
            manifest: c.manifest.map(m => {
              if (m.slotId !== slot.slotId) return m;
              return { ...m, escrowQuantity: m.escrowQuantity + actualDraw };
            }),
          };
        });

        playCashRegisterSound();

        set({
          hydrology: {
            ...state.hydrology,
            towerLiters: newTowerLiters,
          },
          highStakesContracts: updatedContracts,
          isDirty: true,
        });

        let warningMsg = '';
        if (stage === 1) {
          warningMsg = ' ⚠️ Stage 1 Crop Conservation triggered (≤200L)!';
          state.addNotification(`⚠️ Hydraulic Siphon Alert: Gravity Tower volume dropped to ${newTowerLiters}L. Crop Conservation Stage 1 engaged!`, '⚠️', 'event');
        } else if (stage === 2) {
          warningMsg = ' 🚨 CRITICAL: Stage 2 Crew Rationing triggered (≤80L)!';
          state.addNotification(`🚨 Emergency Siphon Alert: Gravity Tower volume collapsed to ${newTowerLiters}L. Stage 2 Crew Rationing active!`, '🚨', 'event');
        } else {
          state.addNotification(`💧 Hydraulic Siphon: ${actualDraw}L drawn from Gravity Tower into export crate (${slot.escrowQuantity + actualDraw}/${slot.requiredQuantity}L).`, '💧', 'info');
        }

        return {
          success: true,
          message: `Siphoned ${actualDraw}L water from Gravity Tower into export crate.${warningMsg}`,
          stageTriggered: stage,
        };
      },

      finalizeContractShipment: (contractId: string) => {
        const state = get();
        const contract = state.highStakesContracts?.find(c => c.id === contractId);
        if (!contract || contract.status !== 'active') {
          return { success: false, message: 'Contract is not active.' };
        }
        const isComplete = contract.manifest.every(s => s.escrowQuantity >= s.requiredQuantity);
        if (!isComplete) {
          return { success: false, message: 'Cannot finalize shipment: Escrow manifest is not 100% loaded.' };
        }

        const totalCoins = contract.rewards.coins + (contract.rewards.pristineBonusCoins || 0);
        const totalXp = contract.rewards.xp;
        const repGain = contract.rewards.reputation;

        const newFactionRep = { ...(state.factionReputation || { royal_crown: 25, paleo_guild: 30, mercantile_caravan: 40 }) };
        newFactionRep[contract.factionId] = (newFactionRep[contract.factionId] || 0) + repGain;

        // Credit bonus items into barn or silo
        const newBarn = { ...state.barn };
        const newSilo = { ...state.silo };
        let newGems = state.gems;

        if (contract.rewards.bonusItems) {
          for (const item of contract.rewards.bonusItems) {
            if (item.itemId === 'gem') {
              newGems += item.quantity;
            } else if (item.itemId in newSilo) {
              newSilo[item.itemId] = (newSilo[item.itemId] || 0) + item.quantity;
            } else {
              newBarn[item.itemId] = (newBarn[item.itemId] || 0) + item.quantity;
            }
          }
        }

        // Replace completed contract with a new active contract
        const newContract = generateHighStakesContract(contract.factionId, state.level);
        const updatedContracts = state.highStakesContracts.map(c => c.id === contractId ? newContract : c);

        const { xp: nextXp, level: nextLevel } = levelUpCheck(state.xp + totalXp, state.level);

        playVictoryChime();

        set({
          coins: state.coins + totalCoins,
          xp: nextXp,
          level: nextLevel,
          gems: newGems,
          barn: newBarn,
          silo: newSilo,
          factionReputation: newFactionRep,
          highStakesContracts: updatedContracts,
          isDirty: true,
        });

        state.addNotification(
          `🚢 High-Stakes Shipment Delivered! Awarded +${totalCoins} Coins, +${totalXp} XP, and +${repGain} ${FACTION_REGISTRY[contract.factionId].name} Standing!`,
          '🚢',
          'discovery'
        );

        return {
          success: true,
          message: `Shipment successfully delivered to ${FACTION_REGISTRY[contract.factionId].name}!`,
        };
      },

      forfeitContract: (contractId: string) => {
        const state = get();
        const contract = state.highStakesContracts?.find(c => c.id === contractId);
        if (!contract) return { scrapCoins: 0 };

        const scrapCoins = calculateScrapLiquidationValue(contract);
        const repLoss = contract.penalties.reputationLoss;

        const newFactionRep = { ...(state.factionReputation || { royal_crown: 25, paleo_guild: 30, mercantile_caravan: 40 }) };
        newFactionRep[contract.factionId] = Math.max(-100, (newFactionRep[contract.factionId] || 0) - repLoss);

        let newCrownSeedLock = state.crownSeedLockUntil || 0;
        let newGuildCycles = state.guildHazardCyclesRemaining || 0;
        let newMercantileCooldown = state.mercantileCooldownUntil || 0;
        const now = Date.now();

        playDefeatSound();

        if (contract.factionId === 'royal_crown') {
          newCrownSeedLock = now + 2 * 3600 * 1000; // 2 hours
          state.addNotification(
            `👑 Imperial Sanction Applied: -15 Crown Standing and Crown Premium Seeds locked for 2 hours! Liquidated cargo returned ${scrapCoins} scrap coins (10%).`,
            '👑',
            'event'
          );
        } else if (contract.factionId === 'paleo_guild') {
          newGuildCycles = 3; // 3 cycles
          state.addNotification(
            `🦖 Guild Trust Deficit: -20 Guild Trust and Frontier Trail hazard rates increased by +25% for 3 cycles! Liquidated cargo returned ${scrapCoins} scrap coins.`,
            '🦖',
            'event'
          );
        } else {
          newMercantileCooldown = now + 20 * 60 * 1000; // 20 minutes
          state.addNotification(
            `🚚 Mercantile Rescission: -5 Standing. Order slot placed on 20-minute cooldown penalty. Returned ${scrapCoins} scrap coins.`,
            '🚚',
            'event'
          );
        }

        // Replace contract with fresh one
        const replacement = generateHighStakesContract(contract.factionId, state.level);
        const updatedContracts = state.highStakesContracts.map(c => c.id === contractId ? replacement : c);

        set({
          coins: state.coins + scrapCoins,
          factionReputation: newFactionRep,
          crownSeedLockUntil: newCrownSeedLock,
          guildHazardCyclesRemaining: newGuildCycles,
          mercantileCooldownUntil: newMercantileCooldown,
          highStakesContracts: updatedContracts,
          isDirty: true,
        });

        return { scrapCoins };
      },

      sellItem: (itemId, qty) => {
        const state = get();
        const isCrop = isCropItem(itemId);
        const storage = isCrop ? state.silo : state.barn;
        const available = storage[itemId] || 0;
        if (available < qty) return;
        // Determine sell price with dynamic market multiplier & liquidation rate (40% in Hardcore, 60% Standard)
        let basePrice = 1;
        if (itemId in CROPS) {
          const cropDef = CROPS[itemId as CropId];
          basePrice = Math.max(1, Math.floor(cropDef.seedCost / 2) + 1);
        } else {
          const product = PRODUCTS[itemId as keyof typeof PRODUCTS];
          if (product) basePrice = product.sellPrice;
        }
        const marketMult = state.marketTrends?.[itemId]?.multiplier || 1.0;
        const liquidationRate = state.isHardcoreMode ? 0.40 : 0.60;
        const sellPrice = Math.max(1, Math.round(basePrice * marketMult * liquidationRate));

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
        const liquidationRate = state.isHardcoreMode ? 0.40 : 0.60;
        const sellPrice = Math.max(1, Math.round(basePrice * marketMult * liquidationRate));

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
        const liquidationRate = state.isHardcoreMode ? 0.40 : 0.60;
        // Sell all silo items (crops, quality crops, extras), skip hidden, 40%-60% liquidation rate
        for (const [id, qty] of Object.entries(newSilo)) {
          if (SHOP_HIDDEN.has(id)) continue;
          if (qty > 0) {
            let basePrice = 1;
            if (id in CROPS) {
              const def = CROPS[id as CropId];
              basePrice = Math.max(1, Math.floor(def.seedCost / 2) + 1);
            } else if (id in PRODUCTS) {
              basePrice = PRODUCTS[id as keyof typeof PRODUCTS].sellPrice;
            } else {
              basePrice = 5;
            }
            const marketMult = state.marketTrends?.[id]?.multiplier || 1.0;
            const sellPrice = Math.max(1, Math.round(basePrice * marketMult * liquidationRate));
            totalCoins += sellPrice * qty;
            newSilo[id] = 0;
          }
        }
        // Sell all barn items, skip hidden, 40%-60% liquidation rate
        for (const [id, def] of Object.entries(PRODUCTS)) {
          if (SHOP_HIDDEN.has(id)) continue;
          const qty = newBarn[id] || 0;
          if (qty > 0) {
            const marketMult = state.marketTrends?.[id]?.multiplier || 1.0;
            const sellPrice = Math.max(1, Math.round(def.sellPrice * marketMult * liquidationRate));
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
        let newUnifiedWorkers = state.unifiedWorkers;
        if (role === 'herder') {
          if (!state.unifiedWorkers?.herder?.isHired) {
            newUnifiedWorkers = {
              ...state.unifiedWorkers,
              herder: {
                ...state.unifiedWorkers.herder,
                isHired: true,
                lastActionTimestamp: Date.now(),
              },
            };
          }
        }
        set({
          coins: state.coins - cost,
          farmhands: [...state.farmhands, fh],
          fishery: newFishery,
          unifiedWorkers: newUnifiedWorkers,
        });
        if (role === 'herder') {
          state.addNotification('Livestock Herder hired! Auto-feeding animals and collecting yields.', '🤠', 'info');
        } else if (role === 'fisherman') {
          state.addNotification('Fisherman hired! Automatically catching fish in unlocked waters.', '🎣', 'info');
        } else {
          state.addNotification(`${FARMHANDS[role]?.name || role} hired!`, FARMHANDS[role]?.emoji || '👷', 'info');
        }
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
        const currentEco = state.fishery.zoneEcosystem || createDefaultZoneEcosystem();
        const cfg = ZONE_ECOSYSTEM_CONFIGS[zoneId];
        set({
          coins: zone.unlockCostCoins ? state.coins - zone.unlockCostCoins : state.coins,
          gems: zone.unlockCostGems ? state.gems - zone.unlockCostGems : state.gems,
          fishery: {
            ...state.fishery,
            unlockedZones: [...state.fishery.unlockedZones, zoneId],
            lastCatchTimestamps: { ...state.fishery.lastCatchTimestamps, [zoneId]: Date.now() },
            zoneEcosystem: {
              ...currentEco,
              [zoneId]: currentEco[zoneId] || {
                currentStock: cfg.stockCap,
                maxStock: cfg.stockCap,
                spawnProgressSec: 0,
                isDepleted: false,
              },
            },
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

      upgradeWaterZoneTier: (zoneId) => {
        const state = get();
        if (!state.fishery.unlockedZones.includes(zoneId)) return false;
        const currentEcosystem = state.fishery.zoneEcosystem || createDefaultZoneEcosystem();
        const eco = currentEcosystem[zoneId] || {
          currentStock: 30,
          maxStock: 30,
          spawnProgressSec: 0,
          isDepleted: false,
          tier: 1,
        };

        const currentTier = (eco.tier || 1) as ZoneUpgradeTier;
        if (currentTier >= 5) {
          state.addNotification(`★ Max Tier: ${WATER_ZONES[zoneId].name} has already attained Maximum Tier 5 Mastery!`, '🌟', 'info');
          return false;
        }

        const nextTier = (currentTier + 1) as ZoneUpgradeTier;
        const nextDef = getZoneUpgradeDef(zoneId, nextTier);

        if (state.coins < nextDef.costCoins) {
          playDefeatSound();
          state.addNotification(`Need ${nextDef.costCoins.toLocaleString()} 🪙 to upgrade ${WATER_ZONES[zoneId].name} to Tier ${nextTier}!`, '⚠️', 'info');
          return false;
        }

        // Tower water deduction for Pond Tier 3 if applicable
        let currentHydro = state.hydrology;
        if (nextDef.towerLitersCost && currentHydro?.towerLiters) {
          const newTower = Math.max(0, currentHydro.towerLiters - nextDef.towerLitersCost);
          currentHydro = { ...currentHydro, towerLiters: Math.round(newTower * 10) / 10 };
        }

        // Capacity Preservation: increment currentStock by newly added capacity so player does not wait for refill
        const oldMaxStock = getZoneStockCap(zoneId, currentTier);
        const newMaxStock = nextDef.stockCap;
        const capacityGain = Math.max(0, newMaxStock - oldMaxStock);
        const newCurrentStock = Math.min(newMaxStock, (eco.currentStock || 0) + capacityGain);
        const isDepletedNow = isZoneFishingPaused(newCurrentStock, newMaxStock, eco.isDepleted);

        const updatedEcosystem = {
          ...currentEcosystem,
          [zoneId]: {
            ...eco,
            tier: nextTier,
            maxStock: newMaxStock,
            currentStock: newCurrentStock,
            isDepleted: isDepletedNow,
          },
        };

        set({
          coins: state.coins - nextDef.costCoins,
          hydrology: currentHydro,
          fishery: {
            ...state.fishery,
            zoneEcosystem: updatedEcosystem,
          },
          isDirty: true,
        });

        playRapidTapSound(3);
        state.addNotification(
          `🎉 Water Zone Upgraded: ${WATER_ZONES[zoneId].name} reached Tier ${nextTier} (${nextDef.name})! Cap: ${newMaxStock} Fish (+${capacityGain}), Catch: ${nextDef.catchIntervalSec.toFixed(1)}s.`,
          '🏆',
          'discovery'
        );
        return true;
      },

      setSustainableRotation: (enabled) => {
        const state = get();
        const currentCrew = state.fishery.crew || {
          policy: { sustainableRotation: true, catchHandling: 'auto-sell-common' as const },
          pinnedWorkers: { zone_pond: 0, zone_river: 0, zone_estuary: 0, zone_lake: 0, zone_ocean: 0 },
        };
        set({
          fishery: {
            ...state.fishery,
            crew: {
              ...currentCrew,
              policy: {
                ...currentCrew.policy,
                sustainableRotation: enabled,
              },
            },
          },
          isDirty: true,
        });
        if (enabled) {
          state.addNotification('🌿 Sustainable Rotation ACTIVE: Auto-assigned anglers will evacuate any zone at ≤20% stock capacity.', '🌊', 'info');
        } else {
          state.addNotification('⚡ Full Deplete ACTIVE: Auto-assigned anglers will fish waters down to 0% stock.', '🔥', 'info');
        }
      },

      setCatchHandlingPolicy: (policy) => {
        const state = get();
        const currentCrew = state.fishery.crew || {
          policy: { sustainableRotation: true, catchHandling: 'auto-sell-common' as const },
          pinnedWorkers: { zone_pond: 0, zone_river: 0, zone_estuary: 0, zone_lake: 0, zone_ocean: 0 },
        };
        set({
          fishery: {
            ...state.fishery,
            crew: {
              ...currentCrew,
              policy: {
                ...currentCrew.policy,
                catchHandling: policy,
              },
            },
          },
          isDirty: true,
        });
        if (policy === 'auto-sell-common') {
          state.addNotification('💰 Catch Policy: Common fish automatically sold for instant coins. Rare/Legendary kept in Barn.', '🪙', 'info');
        } else {
          state.addNotification('📦 Catch Policy: Hoard All. All fish species are stored in Barn.', '🐟', 'info');
        }
      },

      pinWorkerToZone: (zoneId) => {
        const state = get();
        if (!state.fishery.unlockedZones.includes(zoneId)) return false;
        const currentCrew = state.fishery.crew || {
          policy: { sustainableRotation: true, catchHandling: 'auto-sell-common' as const },
          pinnedWorkers: { zone_pond: 0, zone_river: 0, zone_estuary: 0, zone_lake: 0, zone_ocean: 0 },
        };

        const totalWorkforce = state.farmhands.filter(f => f.role === 'fisherman').length +
          (state.unifiedWorkers?.fisherman?.isHired ? 1 : 0) +
          (state.unifiedWorkers?.auto_fisherman?.isHired ? 1 : 0) +
          state.autonomousWorkers.filter(w => w.type === 'fisherman').length;

        const currentPinnedTotal = Object.values(currentCrew.pinnedWorkers).reduce((a, b) => a + b, 0);
        if (currentPinnedTotal >= totalWorkforce) {
          playDefeatSound();
          state.addNotification(`⚠️ No Free Fishermen: All ${totalWorkforce} hired anglers are already pinned! Hire another fisherman or unpin a worker first.`, '⚓', 'info');
          return false;
        }

        const eco = (state.fishery.zoneEcosystem || createDefaultZoneEcosystem())[zoneId];
        const tier = (eco?.tier || 1) as ZoneUpgradeTier;
        const maxSlots = getZoneMaxStationSlots(zoneId, tier);
        const zonePinned = currentCrew.pinnedWorkers[zoneId] || 0;

        if (zonePinned >= maxSlots) {
          playDefeatSound();
          state.addNotification(`⚠️ Station Full: ${WATER_ZONES[zoneId].name} maxes out at ${maxSlots} angler slots (Tier ${tier})! Upgrade zone tier to expand station slots.`, '⚓', 'info');
          return false;
        }

        const newPinned = {
          ...currentCrew.pinnedWorkers,
          [zoneId]: zonePinned + 1,
        };

        set({
          fishery: {
            ...state.fishery,
            crew: {
              ...currentCrew,
              pinnedWorkers: newPinned,
            },
          },
          isDirty: true,
        });

        playRapidTapSound(2);
        state.addNotification(`📌 Angler Pinned: Stationed 1 angler permanently at ${WATER_ZONES[zoneId].name} (${zonePinned + 1}/${maxSlots} slots pinned).`, '🎣', 'info');
        return true;
      },

      unpinWorkerFromZone: (zoneId) => {
        const state = get();
        const currentCrew = state.fishery.crew || {
          policy: { sustainableRotation: true, catchHandling: 'auto-sell-common' as const },
          pinnedWorkers: { zone_pond: 0, zone_river: 0, zone_estuary: 0, zone_lake: 0, zone_ocean: 0 },
        };
        const zonePinned = currentCrew.pinnedWorkers[zoneId] || 0;
        if (zonePinned <= 0) return false;

        const newPinned = {
          ...currentCrew.pinnedWorkers,
          [zoneId]: zonePinned - 1,
        };

        set({
          fishery: {
            ...state.fishery,
            crew: {
              ...currentCrew,
              pinnedWorkers: newPinned,
            },
          },
          isDirty: true,
        });

        playRapidTapSound(1);
        state.addNotification(`↩️ Angler Unpinned: 1 angler returned to the Dock Master's auto-routing pool.`, '⚓', 'info');
        return true;
      },

      refillPondFromTower: () => {
        const state = get();
        const currentHydro = state.hydrology || createDefaultHydrologyState(state.level);
        const currentFishery = state.fishery;
        const currentPondVolume = currentFishery.pondWaterVolume !== undefined
          ? currentFishery.pondWaterVolume
          : POND_HYDROLOGY.INITIAL_VOLUME_LITERS;

        if (currentHydro.towerLiters < POND_HYDROLOGY.REFILL_DEDUCTION_LITERS) {
          state.addNotification('🚰 Tower Depleted: Elevated Gravity Tower needs at least 100L to refill pond!', '🗼', 'info');
          return false;
        }

        if (currentPondVolume >= POND_HYDROLOGY.MAX_CAPACITY_LITERS) {
          state.addNotification('🌊 Pond Full: Farmstead Pond is already at maximum capacity (3,000L)!', '🌧️', 'info');
          return false;
        }

        // Atomic deduction from tower
        const newTowerLiters = Math.max(0, currentHydro.towerLiters - POND_HYDROLOGY.REFILL_DEDUCTION_LITERS);
        const newPondVolume = Math.min(POND_HYDROLOGY.MAX_CAPACITY_LITERS, currentPondVolume + POND_HYDROLOGY.REFILL_DEDUCTION_LITERS);

        // Oxygenated Shock Bonus: adding cold aerated water from the gravity tower immediately grants +5 fish to recovering stock (capped at stockCap = 30)
        const currentEcosystem = currentFishery.zoneEcosystem || createDefaultZoneEcosystem();
        const pondEco = currentEcosystem.zone_pond || {
          currentStock: 30,
          maxStock: 30,
          spawnProgressSec: 0,
          isDepleted: false,
        };
        const newPondStock = Math.min(pondEco.maxStock, pondEco.currentStock + POND_HYDROLOGY.OXYGENATED_SHOCK_BONUS_FISH);
        const updatedEcosystem = {
          ...currentEcosystem,
          zone_pond: {
            ...pondEco,
            currentStock: newPondStock,
            isDepleted: isZoneFishingPaused(newPondStock, pondEco.maxStock, pondEco.isDepleted),
          },
        };

        set({
          hydrology: {
            ...currentHydro,
            towerLiters: Math.round(newTowerLiters * 10) / 10,
          },
          fishery: {
            ...currentFishery,
            pondWaterVolume: Math.round(newPondVolume * 10) / 10,
            zoneEcosystem: updatedEcosystem,
          },
          isDirty: true,
        });

        playRapidTapSound(1);
        state.addNotification(
          `⛲ Aerated Top-off: Transferred 100L from Gravity Tower to Farmstead Pond! (+5 Fish Oxygenated Shock Bonus 🐟, Vol: ${Math.round(newPondVolume)}L)`,
          '💧',
          'discovery'
        );
        return true;
      },

      manualCatchFish: (zoneId) => {
        const state = get();
        if (!state.fishery.unlockedZones.includes(zoneId)) return false;
        const zone = WATER_ZONES[zoneId];
        const currentAtmosphere = state.hydrology?.weatherState;
        const currentTemp = currentAtmosphere?.temperatureC !== undefined ? currentAtmosphere.temperatureC : 27;

        // Check if frozen
        const climate = calculateClimateSensitivity(zoneId, currentTemp);
        if (climate.isFrozen) {
          playDefeatSound();
          state.addNotification(`🧊 Surface Bed Frozen: Cannot fish while ${zone.name} is iced over (<2°C)!`, '❄️', 'info');
          return false;
        }

        // Check stock
        const currentEcosystem = state.fishery.zoneEcosystem || createDefaultZoneEcosystem();
        const cfg = ZONE_ECOSYSTEM_CONFIGS[zoneId];
        const eco = currentEcosystem[zoneId] || {
          currentStock: cfg.stockCap,
          maxStock: cfg.stockCap,
          spawnProgressSec: 0,
          isDepleted: false,
        };

        if (isZoneFishingPaused(eco.currentStock, eco.maxStock, eco.isDepleted)) {
          playDefeatSound();
          if (eco.isDepleted && eco.currentStock < eco.maxStock) {
            state.addNotification(
              `⏳ Restocking: ${zone.name} is resting until stock fully recovers to 100% capacity (${eco.currentStock}/${eco.maxStock} fish).`,
              '🐟',
              'info'
            );
          } else {
            state.addNotification(`⚠️ Depleted: ${zone.name} fish population is exhausted! Awaiting biological recharge.`, '🎣', 'info');
          }
          return false;
        }

        // Perform catch
        const newFishCodex = { ...state.fishery.fishCodex };
        const newCodex = { ...state.codex };
        const catchResult = rollFishCatch(zoneId, state.fishery.rodTier, newFishCodex);

        if (!catchResult) {
          state.addNotification(`🎣 Cast Line: The line came back empty this time. Try again!`, '🐟', 'info');
          return false;
        }

        const fishDef = FISH_SPECIES[catchResult.speciesId];
        const newBarn = { ...state.barn };
        newBarn[fishDef.id] = (newBarn[fishDef.id] || 0) + 1;
        newBarn.fish = (newBarn.fish || 0) + 1;

        const codexKey = `fish_${catchResult.speciesId}`;
        newFishCodex[codexKey] = true;
        newCodex[codexKey] = true;

        let addedGems = 0;
        if (catchResult.isNew) {
          addedGems += fishDef.codexGems;
        }
        if (catchResult.speciesId === 'lanternfish') {
          addedGems += 1;
        }

        // Decrement stock by 1
        const nextStock = Math.max(0, eco.currentStock - 1);
        const isDepletedNow = isZoneFishingPaused(nextStock, eco.maxStock, eco.isDepleted);

        const updatedEcosystem = {
          ...currentEcosystem,
          [zoneId]: {
            ...eco,
            currentStock: nextStock,
            isDepleted: isDepletedNow,
          },
        };

        const newTimestamps = {
          ...state.fishery.lastCatchTimestamps,
          [zoneId]: Date.now(),
        };

        // Earn XP
        const xpEarned = 10;
        const { xp: finalXp, level: finalLevel } = levelUpCheck(state.xp + xpEarned, state.level);

        set({
          barn: newBarn,
          gems: state.gems + addedGems,
          xp: finalXp,
          level: finalLevel,
          codex: newCodex,
          fishery: {
            ...state.fishery,
            lastCatchTimestamps: newTimestamps,
            fishCodex: newFishCodex,
            zoneEcosystem: updatedEcosystem,
          },
          isDirty: true,
        });

        playRapidTapSound(2);
        if (isDepletedNow) {
          state.addNotification(
            `🎣 Hand Catch: Reeled in ${fishDef.name} ${fishDef.emoji}! (${zone.name} reached 0/${eco.maxStock} fish, recharging naturally)`,
            fishDef.emoji,
            'info'
          );
        } else {
          state.addNotification(
            `🎣 Hand Catch: Reeled in ${fishDef.name} ${fishDef.emoji}! (${nextStock}/${eco.maxStock} fish remaining in ${zone.name})`,
            fishDef.emoji,
            'info'
          );
        }
        return true;
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
          isPaused: false,
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

      togglePauseUnifiedWorker: (role) => {
        const state = get();
        const worker = state.unifiedWorkers[role];
        if (!worker || !worker.isHired) return;
        const newPaused = !worker.isPaused;
        const newWorkers = { ...state.unifiedWorkers };
        newWorkers[role] = {
          ...worker,
          isPaused: newPaused,
          lastActionTimestamp: Date.now(),
        };
        const cfg = WORKER_REGISTRY[role];
        // If all hired unified workers are paused, sync global pause flag
        const hiredList = Object.values(newWorkers).filter(w => w.isHired);
        const allPaused = hiredList.length > 0 && hiredList.every(w => w.isPaused);
        set({
          unifiedWorkers: newWorkers,
          isAllWorkersPaused: allPaused ? true : (newPaused ? state.isAllWorkersPaused : false),
        });
        state.addNotification(
          `${cfg.name} is now ${newPaused ? '⏸️ Paused' : '▶️ Resumed'}.`,
          newPaused ? '⏸️' : '▶️',
          'info'
        );
      },

      togglePauseAllWorkers: (pause) => {
        const state = get();
        const willPause = pause !== undefined ? pause : !state.isAllWorkersPaused;
        const now = Date.now();
        const newUnified = { ...state.unifiedWorkers };
        for (const role of Object.keys(newUnified) as WorkerRole[]) {
          if (newUnified[role]?.isHired) {
            newUnified[role] = {
              ...newUnified[role],
              isPaused: willPause,
              lastActionTimestamp: now,
            };
          }
        }

        let newSpecialists = state.specialistWorkers;
        if (state.specialistWorkers) {
          newSpecialists = { ...state.specialistWorkers };
          for (const key of Object.keys(newSpecialists) as SpecialistWorkerId[]) {
            if (newSpecialists[key]?.isHired) {
              newSpecialists[key] = {
                ...newSpecialists[key],
                isActive: !willPause,
              };
            }
          }
        }

        set({
          isAllWorkersPaused: willPause,
          unifiedWorkers: newUnified,
          specialistWorkers: newSpecialists,
        });

        state.addNotification(
          willPause ? '⏸️ All Workers Paused (Operations Halted)' : '▶️ All Workers Resumed (Workforce Active)',
          willPause ? '⏸️' : '▶️',
          'info'
        );
      },

      // Specialist Livestock & Expedition Staff (Hauler, Wrangler, Stable Master)
      hireSpecialistWorker: (workerId) => {
        const state = get();
        const template = LIVESTOCK_WORKER_ROSTER.find(t => t.id === workerId);
        if (!template) return false;
        if (state.coins < template.hireCostCoins) {
          state.addNotification(`Need 🪙${template.hireCostCoins} to contract ${template.name}!`, '⚠️', 'info');
          return false;
        }

        const now = Date.now();
        const currentWorkers = state.specialistWorkers || createDefaultSpecialistWorkers();
        const updated = {
          ...currentWorkers,
          [workerId]: {
            id: workerId,
            isHired: true,
            isActive: true,
            isStriking: false,
            hiredAt: now,
            unpaidWages: 0,
            totalWagesPaid: 0,
          },
        };

        playCashRegisterSound();
        playVictoryChime();

        set({
          coins: state.coins - template.hireCostCoins,
          specialistWorkers: updated,
        });

        state.addNotification(
          `🎉 Contracted ${template.name} (${template.title})! Stationed at ${template.station}.`,
          template.avatar,
          'discovery'
        );
        return true;
      },

      toggleSpecialistDuty: (workerId) => {
        const state = get();
        const currentWorkers = state.specialistWorkers || createDefaultSpecialistWorkers();
        const worker = currentWorkers[workerId];
        if (!worker || !worker.isHired) return;
        const template = LIVESTOCK_WORKER_ROSTER.find(t => t.id === workerId);

        const newActive = !worker.isActive;
        const updated = {
          ...currentWorkers,
          [workerId]: {
            ...worker,
            isActive: newActive,
          },
        };

        playRapidTapSound(1);
        set({ specialistWorkers: updated });

        state.addNotification(
          `${template?.name || 'Worker'} is now ${newActive ? '🟢 On Duty' : '⏸️ Resting'}.`,
          newActive ? '🟢' : '⏸️',
          'info'
        );
      },

      dismissSpecialistWorker: (workerId) => {
        const state = get();
        const currentWorkers = state.specialistWorkers || createDefaultSpecialistWorkers();
        const worker = currentWorkers[workerId];
        if (!worker || !worker.isHired) return;
        const template = LIVESTOCK_WORKER_ROSTER.find(t => t.id === workerId);

        const updated = {
          ...currentWorkers,
          [workerId]: {
            id: workerId,
            isHired: false,
            isActive: false,
            isStriking: false,
            hiredAt: null,
            unpaidWages: 0,
            totalWagesPaid: worker.totalWagesPaid || 0,
          },
        };

        set({ specialistWorkers: updated });
        state.addNotification(`${template?.name || 'Worker'} has been dismissed from farm contract.`, '👋', 'info');
      },

      paySpecialistBackPay: (workerId) => {
        const state = get();
        const currentWorkers = state.specialistWorkers || createDefaultSpecialistWorkers();
        const worker = currentWorkers[workerId];
        if (!worker || !worker.isHired) return false;
        const backpay = worker.unpaidWages || 0;
        if (backpay <= 0) return false;
        if (state.coins < backpay) {
          state.addNotification(`Need 🪙${backpay} to settle back pay for ${workerId}!`, '⚠️', 'info');
          return false;
        }
        const template = LIVESTOCK_WORKER_ROSTER.find(t => t.id === workerId);

        const updated = {
          ...currentWorkers,
          [workerId]: {
            ...worker,
            isStriking: false,
            unpaidWages: 0,
            totalWagesPaid: (worker.totalWagesPaid || 0) + backpay,
          },
        };

        playCashRegisterSound();
        set({
          coins: state.coins - backpay,
          specialistWorkers: updated,
        });

        state.addNotification(`💰 Settled back pay of 🪙${backpay}! ${template?.name || 'Worker'} returned to Active Duty!`, '🎉', 'coin');
        return true;
      },

      // Worker Commissary & Payroll Vault Handlers (Staged Coins & Food Survival System)
      depositToPayrollVault: (amount: number) => {
        const state = get();
        const num = Math.floor(amount);
        if (num <= 0 || state.coins < num) return false;
        playCashRegisterSound();
        set({
          coins: state.coins - num,
          payrollVaultCoins: (state.payrollVaultCoins || 0) + num,
        });
        state.addNotification(`🪙 Deposited ${num.toLocaleString()} coins into Payroll Vault.`, '💰', 'coin');
        return true;
      },

      withdrawFromPayrollVault: (amount: number) => {
        const state = get();
        const currentStaged = state.payrollVaultCoins || 0;
        const num = Math.floor(amount);
        if (num <= 0 || currentStaged < num) return false;
        playCashRegisterSound();
        set({
          coins: state.coins + num,
          payrollVaultCoins: currentStaged - num,
        });
        state.addNotification(`🪙 Withdrew ${num.toLocaleString()} coins from Payroll Vault to purse.`, '👛', 'coin');
        return true;
      },

      transferToStaffPantry: (itemId: string, quantity: number) => {
        const state = get();
        const qty = Math.floor(quantity);
        const foodMeta = COMMISSARY_FOOD_ITEMS[itemId];
        if (!foodMeta || qty <= 0) return false;

        const siloAvail = foodMeta.category === 'crop' ? (state.silo[itemId] || 0) : 0;
        const barnAvail = state.barn[itemId] || 0;
        const totalAvail = siloAvail + barnAvail;
        if (totalAvail < qty) return false;

        const updatedSilo = { ...state.silo };
        const updatedBarn = { ...state.barn };
        let remainingToTake = qty;

        if (siloAvail > 0) {
          const takeSilo = Math.min(siloAvail, remainingToTake);
          updatedSilo[itemId] = siloAvail - takeSilo;
          if (updatedSilo[itemId] === 0) delete updatedSilo[itemId];
          remainingToTake -= takeSilo;
        }

        if (remainingToTake > 0 && barnAvail > 0) {
          const takeBarn = Math.min(barnAvail, remainingToTake);
          updatedBarn[itemId] = barnAvail - takeBarn;
          if (updatedBarn[itemId] === 0) delete updatedBarn[itemId];
          remainingToTake -= takeBarn;
        }

        const updatedPantry = { ...state.staffPantry };
        updatedPantry[itemId] = (updatedPantry[itemId] || 0) + qty;

        playRapidTapSound(1);
        set({
          silo: updatedSilo,
          barn: updatedBarn,
          staffPantry: updatedPantry,
        });
        state.addNotification(`🍲 Staged ${qty}x ${foodMeta.name} into Staff Pantry.`, foodMeta.icon, 'info');
        return true;
      },

      returnFromStaffPantry: (itemId: string, quantity: number) => {
        const state = get();
        const qty = Math.floor(quantity);
        const foodMeta = COMMISSARY_FOOD_ITEMS[itemId];
        const currentPantry = state.staffPantry[itemId] || 0;
        if (!foodMeta || qty <= 0 || currentPantry < qty) return false;

        const updatedPantry = { ...state.staffPantry };
        updatedPantry[itemId] = currentPantry - qty;
        if (updatedPantry[itemId] === 0) delete updatedPantry[itemId];

        // Return standard crop to silo, all others (including quality crops and prepared dishes) to barn
        if (foodMeta.category === 'crop' && itemId in CROPS) {
          const updatedSilo = { ...state.silo, [itemId]: (state.silo[itemId] || 0) + qty };
          set({ silo: updatedSilo, staffPantry: updatedPantry });
        } else {
          const updatedBarn = { ...state.barn, [itemId]: (state.barn[itemId] || 0) + qty };
          set({ barn: updatedBarn, staffPantry: updatedPantry });
        }
        playRapidTapSound(1);
        state.addNotification(`📦 Returned ${qty}x ${foodMeta.name} to storage.`, foodMeta.icon, 'info');
        return true;
      },

      processSettlementCycle: () => {
        const state = get();
        const res = processUpkeepSettlement({
          unifiedWorkers: state.unifiedWorkers,
          specialistWorkers: state.specialistWorkers,
          payrollVaultCoins: state.payrollVaultCoins || 0,
          staffPantry: state.staffPantry || {},
        });

        set({
          payrollVaultCoins: res.payrollVaultCoins,
          staffPantry: res.staffPantry,
          unifiedWorkers: res.updatedUnifiedWorkers,
          specialistWorkers: res.updatedSpecialistWorkers,
          lastSettlementTimestamp: Date.now(),
        });

        if (res.desertedWorkers.length > 0) {
          state.addNotification(`🚨 Desertion Notice: ${res.desertedWorkers.join(', ')} left the farm after 4 unpaid cycles!`, '⚠️', 'event');
        } else if (res.strikeCount > 0) {
          state.addNotification(`⚠️ Strike Alert: ${res.strikeCount} workers halted operations due to staging shortfall!`, '🛑', 'event');
        } else if (res.grumblingCount > 0) {
          state.addNotification(`🟡 Grumbling Alert: ${res.grumblingCount} workers running at 50% speed from supply shortage.`, '⚠️', 'event');
        } else if (res.paidCount > 0) {
          state.addNotification(`✅ Settlement Cleared: Paid & fed ${res.paidCount} staff from Payroll Vault & Pantry! (${res.inspiredCount} inspired)`, '🎉', 'coin');
        }
      },

      // Diurnal Shift & Bunkhouse Actions (v3.0)
      assignWorkerShift: (roleOrId: string, shift: ShiftType) => {
        const state = get();
        const now = Date.now();
        const clock = getCircadianClock(now, state.farmEpochStart);
        const shiftDef = SHIFT_DEFINITIONS[shift];

        if (state.unifiedWorkers?.[roleOrId as WorkerRole]) {
          const w = state.unifiedWorkers[roleOrId as WorkerRole];
          if (!w.isHired) return;
          const updatedWorkers = {
            ...state.unifiedWorkers,
            [roleOrId]: {
              ...w,
              shiftType: shift,
              shiftAdjustingUntil: now + SHIFT_ADJUST_DURATION_MS,
            },
          };
          playRapidTapSound(1);
          set({ unifiedWorkers: updatedWorkers });
          state.addNotification(
            `🔄 Shift Reassigned: ${WORKER_REGISTRY[roleOrId as WorkerRole]?.name || roleOrId} assigned to ${shiftDef.name}. 1-day adjustment rest initiated.`,
            shiftDef.icon,
            'info'
          );
        } else if (state.specialistWorkers?.[roleOrId as SpecialistWorkerId]) {
          const sp = state.specialistWorkers[roleOrId as SpecialistWorkerId];
          if (!sp.isHired) return;
          const updatedSpecialists = {
            ...state.specialistWorkers,
            [roleOrId]: {
              ...sp,
              shiftType: shift,
              shiftAdjustingUntil: now + SHIFT_ADJUST_DURATION_MS,
            },
          };
          playRapidTapSound(1);
          set({ specialistWorkers: updatedSpecialists });
          const template = LIVESTOCK_WORKER_ROSTER.find(r => r.id === roleOrId);
          state.addNotification(
            `🔄 Shift Reassigned: ${template?.name || roleOrId} assigned to ${shiftDef.name}. 1-day adjustment rest initiated.`,
            shiftDef.icon,
            'info'
          );
        }
      },

      callEmergencyOvertime: (roleOrId: string) => {
        const state = get();
        const now = Date.now();
        const clock = getCircadianClock(now, state.farmEpochStart);
        const config = WORKER_UPKEEP_ROSTER[roleOrId];
        const baseWage = config?.baseDailyWage || 15;
        const workerName = config?.name || roleOrId;

        // Check if unified worker
        const isUnified = Boolean(state.unifiedWorkers?.[roleOrId as WorkerRole]);
        const workerObj = isUnified
          ? state.unifiedWorkers[roleOrId as WorkerRole]
          : state.specialistWorkers?.[roleOrId as SpecialistWorkerId];

        if (!workerObj || !workerObj.isHired) {
          return { success: false, message: 'Worker is not hired.' };
        }
        if (('isStriking' in workerObj && workerObj.isStriking) || workerObj.moraleTier === 'striking' || workerObj.moraleTier === 'deserted') {
          return { success: false, message: `${workerName} is currently on strike and refuses overtime requests!` };
        }
        if (workerObj.isExhausted || (workerObj.exhaustedUntil && now < workerObj.exhaustedUntil)) {
          return { success: false, message: `${workerName} is completely exhausted and refuses all overtime until rested!` };
        }
        if (workerObj.overtimeUntil && now < workerObj.overtimeUntil) {
          return { success: false, message: `${workerName} is already working an emergency overtime shift!` };
        }

        // Overtime wage: 1.5x hourly equivalent for 4 hours = 0.75 * baseDailyWage
        const activeCount = Object.values(state.unifiedWorkers || {}).filter(w => w.isHired).length +
          Object.values(state.specialistWorkers || {}).filter(w => w.isHired).length;
        const taxRate = getGuildTaxRate(activeCount);
        const overtimeWage = Math.max(1, Math.round(baseWage * 0.75 * (1 + taxRate)));

        let newVaultCoins = state.payrollVaultCoins || 0;
        let newPurseCoins = state.coins;
        let deductedFrom = 'Payroll Vault';

        if (newVaultCoins >= overtimeWage) {
          newVaultCoins -= overtimeWage;
        } else if (newPurseCoins >= overtimeWage) {
          newPurseCoins -= overtimeWage;
          deductedFrom = 'Farmer Purse';
        } else {
          return {
            success: false,
            message: `Need 🪙${overtimeWage} coins in Payroll Vault or Purse to fund emergency overtime!`,
          };
        }

        // Pantry snack deduction
        const updatedPantry = { ...(state.staffPantry || {}) };
        let snackDeducted: string | null = null;
        for (const [fId, qty] of Object.entries(updatedPantry)) {
          if (qty > 0) {
            updatedPantry[fId] = qty - 1;
            if (updatedPantry[fId] === 0) delete updatedPantry[fId];
            snackDeducted = COMMISSARY_FOOD_ITEMS[fId]?.name || fId;
            break;
          }
        }

        // Consecutive overtime check
        const wasOvertimeYesterday = workerObj.lastOvertimeDay === clock.currentDay - 1;
        let becameExhausted = false;
        let exhaustedUntilTime: number | null = null;

        if (wasOvertimeYesterday) {
          becameExhausted = true;
          exhaustedUntilTime = now + (16 * SEC_PER_IN_GAME_HOUR * 1000); // 16 in-game hours = 20 real minutes
        }

        const updatedWorkerData = {
          ...workerObj,
          overtimeUntil: now + OVERTIME_DURATION_MS,
          lastOvertimeDay: clock.currentDay,
          isExhausted: becameExhausted,
          exhaustedUntil: exhaustedUntilTime,
          wellRested: false, // overtime interrupts sleep and forfeits buff
        };

        playCashRegisterSound();

        if (isUnified) {
          set({
            payrollVaultCoins: newVaultCoins,
            coins: newPurseCoins,
            staffPantry: updatedPantry,
            unifiedWorkers: {
              ...state.unifiedWorkers,
              [roleOrId]: updatedWorkerData,
            },
          });
        } else {
          set({
            payrollVaultCoins: newVaultCoins,
            coins: newPurseCoins,
            staffPantry: updatedPantry,
            specialistWorkers: {
              ...state.specialistWorkers,
              [roleOrId]: updatedWorkerData,
            },
          });
        }

        const snackText = snackDeducted ? ` consumed 1x ${snackDeducted} from Pantry` : '';
        state.addNotification(
          `☕ Emergency Overtime: Called ${workerName} into field for 4h shift (-🪙${overtimeWage} from ${deductedFrom}${snackText})!`,
          '☕',
          'info'
        );

        if (becameExhausted) {
          state.addNotification(
            `⚠️ Fatigue Warning: ${workerName} called 2 days in a row and is now Exhausted (-40% speed, refusing future overtime until full sleep)!`,
            '😫',
            'event'
          );
        }

        return {
          success: true,
          message: `Called ${workerName} for emergency overtime! Paid 🪙${overtimeWage} from ${deductedFrom}.`,
        };
      },

      upgradeBunkhouse: () => {
        const state = get();
        const currentLevel = state.bunkhouse?.level || 1;
        if (currentLevel >= 3) {
          return { success: false, message: 'Bunkhouse is already at maximum Master Lodgings level!' };
        }

        const nextTier = BUNKHOUSE_TIERS[currentLevel + 1];
        if (!nextTier) return { success: false, message: 'Invalid bunkhouse tier.' };

        if (state.coins < nextTier.coinCost) {
          return {
            success: false,
            message: `Need 🪙${nextTier.coinCost.toLocaleString()} coins to upgrade Bunkhouse to Level ${currentLevel + 1}!`,
          };
        }

        // Material requirement check
        let updatedBarn = { ...state.barn };
        if (nextTier.materialCostItem && nextTier.materialCostQty) {
          const avail = updatedBarn[nextTier.materialCostItem] || 0;
          if (avail < nextTier.materialCostQty) {
            const matName = ITEM_CATALOG_META[nextTier.materialCostItem]?.name || nextTier.materialCostItem;
            return {
              success: false,
              message: `Need ${nextTier.materialCostQty}x ${matName} in Barn to upgrade Bunkhouse (have ${avail})!`,
            };
          }
          updatedBarn[nextTier.materialCostItem] = avail - nextTier.materialCostQty;
          if (updatedBarn[nextTier.materialCostItem] === 0) delete updatedBarn[nextTier.materialCostItem];
        }

        playCashRegisterSound();
        set({
          coins: state.coins - nextTier.coinCost,
          barn: updatedBarn,
          bunkhouse: {
            ...state.bunkhouse,
            level: currentLevel + 1,
            capacity: Math.max(state.bunkhouse?.capacity || 8, (currentLevel + 1) * 6),
          },
        });

        state.addNotification(
          `🛏️ Bunkhouse Upgraded to Level ${currentLevel + 1} (${nextTier.name})! ${nextTier.perkDescription}`,
          '✨',
          'discovery'
        );

        return {
          success: true,
          message: `Upgraded Bunkhouse to Level ${currentLevel + 1} (${nextTier.name})!`,
        };
      },

      expandBunkhouseCapacity: () => {
        const state = get();
        const currentCap = state.bunkhouse?.capacity || 8;
        const cost = Math.round(currentCap * 250);

        if (state.coins < cost) {
          return {
            success: false,
            message: `Need 🪙${cost.toLocaleString()} coins to expand Bunkhouse capacity!`,
          };
        }

        playCashRegisterSound();
        set({
          coins: state.coins - cost,
          bunkhouse: {
            ...state.bunkhouse,
            capacity: currentCap + 2,
          },
        });

        state.addNotification(
          `🛏️ Bunkhouse Expanded: +2 Beds added! Total Capacity is now ${currentCap + 2} beds.`,
          '🛏️',
          'info'
        );

        return {
          success: true,
          message: `Added +2 beds to Bunkhouse! New capacity: ${currentCap + 2}`,
        };
      },

      // Worker Hydration Metabolism & Thirst Actions (v3.5)
      refillStaffCanteen: (liters = 50) => {
        const state = get();
        const currentHydro = state.hydrology || createDefaultHydrologyState(state.level);
        const currentBunk = state.bunkhouse || { level: 1, capacity: 8 };
        const cap = currentBunk.canteenCapacityLiters || CANTEEN_DEFAULT_CAPACITY_LITERS;
        const currentLiters = currentBunk.canteenLiters || 0;
        const space = cap - currentLiters;

        if (space <= 0) {
          state.addNotification('🚰 Canteen Cooler is already full to the brim!', '🥛', 'info');
          return { success: false, message: 'Canteen is already at maximum capacity!' };
        }
        if (currentHydro.towerLiters <= 0) {
          state.addNotification('🗼 Elevated Gravity Tower is empty (0L)! Pump water to the tower first.', '⚠️', 'info');
          return { success: false, message: 'Elevated Gravity Tower has no clean water available!' };
        }

        const transfer = Math.min(liters, space, currentHydro.towerLiters);
        const newTower = Math.max(0, currentHydro.towerLiters - transfer);
        const newCanteen = Math.min(cap, currentLiters + transfer);

        set({
          hydrology: {
            ...currentHydro,
            towerLiters: Math.round(newTower * 10) / 10,
          },
          bunkhouse: {
            ...currentBunk,
            canteenLiters: Math.round(newCanteen * 10) / 10,
          },
          isDirty: true,
        });

        playRapidTapSound(2);
        state.addNotification(`🚰 Canteen Refilled: Transferred +${Math.round(transfer)}L from Elevated Tower to Staff Canteen!`, '🥛', 'info');
        return { success: true, message: `Refilled +${Math.round(transfer)}L into Staff Canteen!` };
      },

      stockColdBeverage: (qty = 5) => {
        const state = get();
        const teaInBarn = state.barn.citrus_tea || 0;
        if (teaInBarn <= 0) {
          state.addNotification('🍵 No Citrus Herb Tea in Barn! Brew chilled tea in Bakery/Kitchen first.', '⚠️', 'info');
          return { success: false, message: 'No Citrus Herb Tea in Barn. Brew it in the Bakery!' };
        }

        const toStock = Math.min(qty, teaInBarn);
        const currentBunk = state.bunkhouse || { level: 1, capacity: 8 };
        const currentDrinks = currentBunk.coldInfusedDrinks || 0;

        const newBarn = { ...state.barn };
        newBarn.citrus_tea = teaInBarn - toStock;
        if (newBarn.citrus_tea <= 0) delete newBarn.citrus_tea;

        set({
          barn: newBarn,
          bunkhouse: {
            ...currentBunk,
            coldInfusedDrinks: currentDrinks + toStock,
          },
          isDirty: true,
        });

        playRapidTapSound(1);
        state.addNotification(`🧊 Cold Cooler Stocked: Added +${toStock} Citrus Herb Teas! Active staff gain Cold-Infused (+15% Velocity & Heatwave Immunity)!`, '🧊', 'event');
        return { success: true, message: `Stocked +${toStock} Citrus Teas in Cold Cooler!` };
      },

      toggleNightWatchWaterAutomation: () => {
        const state = get();
        const currentBunk = state.bunkhouse || { level: 1, capacity: 8 };
        const currentVal = currentBunk.nightWatchAutomation ?? true;
        set({
          bunkhouse: {
            ...currentBunk,
            nightWatchAutomation: !currentVal,
          },
          isDirty: true,
        });
        state.addNotification(
          !currentVal
            ? '🌙 Night Watch Automation ENABLED: Off-shift staff will replenish canteen cooler from cistern/aquifer.'
            : '🌙 Night Watch Automation DISABLED.',
          '🌙',
          'info'
        );
      },

      toggleCanteenAutoRefill: () => {
        const state = get();
        const currentBunk = state.bunkhouse || { level: 1, capacity: 8 };
        const currentVal = currentBunk.autoRefillFromTower ?? true;
        set({
          bunkhouse: {
            ...currentBunk,
            autoRefillFromTower: !currentVal,
          },
          isDirty: true,
        });
        state.addNotification(
          !currentVal
            ? '🗼 Gravity Tower Auto-Refill ENABLED: Staff Canteen will top off automatically from the tower.'
            : '🗼 Gravity Tower Auto-Refill DISABLED.',
          '🗼',
          'info'
        );
      },

      // Wrangler Feed Policy & Automation Controls
      updateWranglerPolicy: (policyUpdate) => {
        const state = get();
        const current = state.wranglerPolicy || DEFAULT_WRANGLER_POLICY;
        set({ wranglerPolicy: { ...current, ...policyUpdate } });
      },

      toggleBarnItemLock: (itemId) => {
        const state = get();
        const currentLocks = { ...(state.barnItemLocks || {}) };
        const itemLock = currentLocks[itemId] || { isLockedForWorkers: false };
        const nextLocked = !itemLock.isLockedForWorkers;
        currentLocks[itemId] = { ...itemLock, isLockedForWorkers: nextLocked };
        set({ barnItemLocks: currentLocks });

        const itemMeta = ITEM_CATALOG_META[itemId];
        const itemName = itemMeta?.name || itemId;
        state.addNotification(
          nextLocked
            ? `🔒 ${itemName} locked: Caretakers will NOT consume this item!`
            : `🔓 ${itemName} unlocked: Eligible for automated caretaker feeding.`,
          nextLocked ? '🔒' : '🔓',
          'info'
        );
      },

      setBarnItemCustomReserve: (itemId, threshold) => {
        const state = get();
        const currentLocks = { ...(state.barnItemLocks || {}) };
        const itemLock = currentLocks[itemId] || { isLockedForWorkers: false };
        currentLocks[itemId] = { ...itemLock, customReserveThreshold: threshold };
        set({ barnItemLocks: currentLocks });
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
        const parent1 = state.animals.find(a => a.id === parent1Id) || (state.livestockReserve || []).find(a => a.id === parent1Id);
        const parent2 = state.animals.find(a => a.id === parent2Id) || (state.livestockReserve || []).find(a => a.id === parent2Id);
        if (!parent1 || !parent2) return false;
        if (parent1.species !== parent2.species) return false;
        if (state.activeBreedings.length >= state.breedingSlots) return false;

        const now = Date.now();
        // Check breeding cooldown on parents
        if (parent1.breedingCooldownExpiresAt && parent1.breedingCooldownExpiresAt > now) {
          state.addNotification('Parent 1 is resting from breeding!', '⏳', 'info');
          return false;
        }
        if (parent2.breedingCooldownExpiresAt && parent2.breedingCooldownExpiresAt > now) {
          state.addNotification('Parent 2 is resting from breeding!', '⏳', 'info');
          return false;
        }

        const isTessaActive = Boolean(
          state.specialistWorkers?.worker_wrangler_tessa?.isHired &&
          state.specialistWorkers?.worker_wrangler_tessa?.isActive &&
          !state.specialistWorkers?.worker_wrangler_tessa?.isStriking
        );
        const isElricActive = Boolean(
          state.specialistWorkers?.worker_stablemaster_elric?.isHired &&
          state.specialistWorkers?.worker_stablemaster_elric?.isActive &&
          !state.specialistWorkers?.worker_stablemaster_elric?.isStriking
        );

        // Roll tier based on parent tiers using probability engine (+10% mutation chance if Tessa is active!)
        const bonusMutation = isTessaActive ? 10 : 0;
        const offspringTier = rollBreedingTier(parent1.tier, parent2.tier, bonusMutation);

        // 5% Mutation Chance for rare apex mutant tier variant (increased to 8% if Elric is active)
        const mutantChance = isElricActive ? 0.08 : 0.05;
        const isMutantRoll = Math.random() < mutantChance;
        const mutantDef = isMutantRoll ? MUTATION_VARIANTS[parent1.species] : null;

        const finalTier: Tier = mutantDef ? 'legendary' : offspringTier;

        const offspringBreedId = mutantDef ? mutantDef.id : `${parent1.species}_${finalTier}`;
        let durationSec = INCUBATION_TIMES[finalTier] || 120;
        if (isElricActive) {
          durationSec = Math.max(10, Math.round(durationSec * 0.8)); // 20% timer cut from Master Elric
        }
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

        // Decoupled Pipeline: Parents stay in pens and continue production/feeding unhindered.
        // Genetic rest cooldown: 60s base, reduced by 25% (45s) if Elric is active!
        const cooldownSec = isElricActive ? 45 : 60;
        const cooldownUntil = now + cooldownSec * 1000;

        const newAnimals = state.animals.map(a => {
          if (a.id === parent1Id || a.id === parent2Id) {
            return { ...a, breedingCooldownExpiresAt: cooldownUntil };
          }
          return a;
        });

        const newReserve = (state.livestockReserve || []).map(a => {
          if (a.id === parent1Id || a.id === parent2Id) {
            return { ...a, breedingCooldownExpiresAt: cooldownUntil };
          }
          return a;
        });

        playClockTickSound(true);
        set({
          animals: newAnimals,
          livestockReserve: newReserve,
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

        const tierOrder: Tier[] = ['common', 'uncommon', 'rare', 'legendary'];
        const offspringTier: Tier = breeding.offspringTier || 'common';

        // Check if active pasture for this tier is full (>= 50 slots for common, >= 4 for others)
        const currentTierCount = state.animals.filter(a => a.tier === offspringTier).length;
        const maxTierCap = offspringTier === 'common' ? 50 : 4;
        const storedInReserve = currentTierCount >= maxTierCap;

        const parent1 = state.animals.find(a => a.id === breeding.parent1Id) || (state.livestockReserve || []).find(a => a.id === breeding.parent1Id);
        const parent2 = state.animals.find(a => a.id === breeding.parent2Id) || (state.livestockReserve || []).find(a => a.id === breeding.parent2Id);

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

        // Place animal in active pasture or store in livestock reserve if pasture is full
        const finalAnimals = storedInReserve ? state.animals : [...state.animals, newAnimal];
        const finalReserve = storedInReserve ? [...(state.livestockReserve || []), newAnimal] : (state.livestockReserve || []);

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
          storedInReserve,
        };

        const updatedCapacity = {
          ...state.animalCapacity,
          [breeding.species]: Math.max(state.animalCapacity[breeding.species] || 16, 16),
        };

        set({
          animals: finalAnimals,
          livestockReserve: finalReserve,
          activeBreedings: updatedBreedings,
          animalCapacity: updatedCapacity,
          codex: updatedCodex,
          gems: state.gems + gemReward,
          hatchReveal: revealData,
        });

        if (storedInReserve) {
          state.addNotification(`📦 ${TIER_LABELS[offspringTier]} Pasture is full (4/4)! Stored new ${breedName} in your Livestock Reserve for future use.`, '📦', 'event');
        } else {
          state.addNotification(`✨ New ${breedName} placed in ${TIER_LABELS[offspringTier]} Pasture!`, '🐣', 'event');
        }

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

      // Livestock Reserve Management
      moveToPasture: (animalId: string) => {
        const state = get();
        const animal = (state.livestockReserve || []).find(a => a.id === animalId);
        if (!animal) return false;

        const currentTierCount = state.animals.filter(a => a.tier === animal.tier).length;
        const maxTierCap = animal.tier === 'common' ? 50 : 4;
        if (currentTierCount >= maxTierCap) {
          playDefeatSound();
          state.addNotification(
            `Cannot move to pasture: ${TIER_LABELS[animal.tier]} Pasture is at max capacity (${currentTierCount}/${maxTierCap}). Move an active animal to reserve or sell an elder first.`,
            '⚠️',
            'info'
          );
          return false;
        }

        const updatedReserve = (state.livestockReserve || []).filter(a => a.id !== animalId);
        const updatedAnimals = [...state.animals, animal];

        playVictoryChime();
        set({
          animals: updatedAnimals,
          livestockReserve: updatedReserve,
        });

        const breedName = BREED_REGISTRY[animal.breedId]?.name || TIER_LABELS[animal.tier];
        state.addNotification(`🐾 Deployed ${breedName} from Livestock Reserve into ${TIER_LABELS[animal.tier]} Pasture!`, '✅', 'event');
        return true;
      },

      moveToReserve: (animalId: string) => {
        const state = get();
        const animal = state.animals.find(a => a.id === animalId);
        if (!animal) return false;



        const updatedAnimals = state.animals.filter(a => a.id !== animalId);
        const updatedReserve = [...(state.livestockReserve || []), animal];

        playCashRegisterSound();
        set({
          animals: updatedAnimals,
          livestockReserve: updatedReserve,
        });

        const breedName = BREED_REGISTRY[animal.breedId]?.name || TIER_LABELS[animal.tier];
        state.addNotification(`📦 Moved ${breedName} to your Livestock Reserve holding barn.`, '📦', 'info');
        return true;
      },

      sellReserveAnimal: (animalId: string) => {
        const state = get();
        const animal = (state.livestockReserve || []).find(a => a.id === animalId);
        if (!animal) return;

        const breedDef = BREED_REGISTRY[animal.breedId];
        let sellPrice: number;
        if (breedDef && animal.age === 'elder') {
          sellPrice = breedDef.elderMarketValue;
        } else {
          sellPrice = livestockSellPriceForAnimal(animal.species, animal.tier, animal.cyclesRemaining, animal.maxCycles);
        }

        const updatedReserve = (state.livestockReserve || []).filter(a => a.id !== animalId);

        playCashRegisterSound();
        set({
          coins: state.coins + sellPrice,
          livestockReserve: updatedReserve,
        });

        const breedName = breedDef?.name || TIER_LABELS[animal.tier];
        state.addNotification(`💰 Sold ${breedName} from Livestock Reserve for 🪙${sellPrice}!`, '💰', 'coin');
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
          presetId: '1h',
          biomeId,
          farmhandId,
          lureId,
          startedAt: Date.now(),
          durationMs,
          provisions: {},
          status: 'active',
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
      
      packWagonItem: (itemId: string, qty: number) => {
        if (qty <= 0) return false;
        const state = get();
        const isCrop = isCropItem(itemId);
        const storage = isCrop ? state.silo : state.barn;
        const available = storage[itemId] || 0;
        if (available < qty) return false;

        const currentStaged = state.stagingWagonProvisions || {};
        const currentItemStaged = currentStaged[itemId] || 0;

        if (isCrop) {
          set({
            silo: { ...state.silo, [itemId]: available - qty },
            stagingWagonProvisions: { ...currentStaged, [itemId]: currentItemStaged + qty },
            isDirty: true,
          });
        } else {
          set({
            barn: { ...state.barn, [itemId]: available - qty },
            stagingWagonProvisions: { ...currentStaged, [itemId]: currentItemStaged + qty },
            isDirty: true,
          });
        }
        playRapidTapSound(1);
        return true;
      },

      unpackWagonItem: (itemId: string, qty: number) => {
        if (qty <= 0) return false;
        const state = get();
        const currentStaged = state.stagingWagonProvisions || {};
        const stagedQty = currentStaged[itemId] || 0;
        if (stagedQty <= 0) return false;

        const returnQty = Math.min(qty, stagedQty);
        const nextStagedQty = stagedQty - returnQty;
        const updatedStaged = { ...currentStaged };
        if (nextStagedQty <= 0) {
          delete updatedStaged[itemId];
        } else {
          updatedStaged[itemId] = nextStagedQty;
        }

        const isCrop = isCropItem(itemId);
        if (isCrop) {
          set({
            silo: { ...state.silo, [itemId]: (state.silo[itemId] || 0) + returnQty },
            stagingWagonProvisions: updatedStaged,
            isDirty: true,
          });
        } else {
          set({
            barn: { ...state.barn, [itemId]: (state.barn[itemId] || 0) + returnQty },
            stagingWagonProvisions: updatedStaged,
            isDirty: true,
          });
        }
        playRapidTapSound(1);
        return true;
      },

      clearWagonStaging: () => {
        const state = get();
        const staged = state.stagingWagonProvisions || {};
        const entries = Object.entries(staged);
        if (entries.length === 0) return;

        const newSilo = { ...state.silo };
        const newBarn = { ...state.barn };

        for (const [itemId, qty] of entries) {
          if (qty <= 0) continue;
          if (isCropItem(itemId)) {
            newSilo[itemId] = (newSilo[itemId] || 0) + qty;
          } else {
            newBarn[itemId] = (newBarn[itemId] || 0) + qty;
          }
        }

        set({
          silo: newSilo,
          barn: newBarn,
          stagingWagonProvisions: {},
          isDirty: true,
        });
      },

      launchLongExpedition: (presetId: ExpeditionPresetId, provisions: Record<string, number>, farmhandId?: string) => {
        const state = get();
        const preset = EXPEDITION_PRESETS[presetId];
        if (!preset) return false;

        const totalRations = Object.values(provisions).reduce((sum, q) => sum + q, 0);
        if (totalRations < preset.minRations) {
          state.addNotification(`Need at least ${preset.minRations} rations packed in wagon!`, '⚠️', 'info');
          return false;
        }

        // Relic: Smuggler's compass grants -20% expedition duration
        const compassMultiplier = state.relics?.smugglersCompass ? 0.8 : 1.0;
        // Stationed beast swift_runner trait gives +15% speed (-15% duration)
        const hasSwiftRunner = (state.wilderness.stationedBeasts || []).some(b => b.trait?.toLowerCase().includes('scout'));
        const beastSpeedMultiplier = hasSwiftRunner ? 0.85 : 1.0;
        const effectiveDurationMs = Math.round(preset.durationMs * compassMultiplier * beastSpeedMultiplier);

        const newExpedition: ActiveExpedition = {
          id: generateId(),
          presetId,
          startedAt: Date.now(),
          durationMs: effectiveDurationMs,
          provisions: { ...provisions },
          farmhandId,
          status: 'active',
        };

        const currentWild = state.wilderness || createDefaultWilderness();
        const updatedWild: WildernessState = {
          ...currentWild,
          activeExpeditions: [...(currentWild.activeExpeditions || []), newExpedition],
        };

        playGoldRushFanfare();
        state.addNotification(`🧭 Supply Wagon departed for ${preset.name}! (${preset.label} trek started)`, '🚚', 'discovery');

        set({
          wilderness: updatedWild,
          stagingWagonProvisions: {},
          isDirty: true,
        });
        return true;
      },

      recallExpeditionEarly: (expeditionId: string) => {
        const state = get();
        const exp = (state.wilderness.activeExpeditions || []).find(e => e.id === expeditionId);
        if (!exp || exp.status !== 'active') return false;

        const now = Date.now();
        const elapsed = Math.max(1000, now - exp.startedAt);
        const progressRatio = Math.min(0.95, Math.max(0.1, elapsed / exp.durationMs));

        const preset = EXPEDITION_PRESETS[exp.presetId || '1h'];

        // Calculate partial materials proportional to progress
        const materials: Record<string, number> = {};
        if (preset) {
          for (const [matId, [min, max]] of Object.entries(preset.yieldRanges)) {
            const fullQty = Math.floor(min + Math.random() * (max - min + 1));
            const partialQty = Math.max(1, Math.floor(fullQty * progressRatio));
            materials[matId] = partialQty;
          }
        }

        // Beast capture chance scaled by progress
        const cratedBeasts: CratedBeast[] = [];
        if (preset && Math.random() <= (preset.beastChance * progressRatio)) {
          cratedBeasts.push(generateCratedBeast(exp.presetId || '1h', preset.tierPool));
        }

        // Return unconsumed rations (more rations returned if recalled early!)
        const leftoverRations: Record<string, number> = {};
        for (const [itemId, qty] of Object.entries(exp.provisions || {})) {
          const unconsumedRatio = Math.max(0.2, 1 - (progressRatio * 0.8));
          const unused = Math.max(1, Math.floor(qty * unconsumedRatio));
          leftoverRations[itemId] = unused;
        }

        const spoils: ExpeditionSpoils = {
          materials,
          cratedBeast: cratedBeasts[0] || null,
          cratedBeasts,
          leftoverRations,
          coins: Math.round(progressRatio * (preset ? (preset.coinRewardRange[0] + preset.coinRewardRange[1]) / 2 : 500)),
          gems: Math.round(progressRatio * (preset ? preset.gemRewardRange[0] : 1)),
          recalledEarly: true,
          completionPct: Math.round(progressRatio * 100),
          claimed: false,
        };

        // Deposit materials into frontier cache & crated beasts into camp holding pens
        const currentWild = state.wilderness;
        const newFrontierCache = { ...(currentWild.frontierCache || {}) };
        for (const [mId, mQty] of Object.entries(materials)) {
          newFrontierCache[mId] = (newFrontierCache[mId] || 0) + mQty;
        }
        const newHoldingPens = [...(currentWild.campHoldingPens || []), ...cratedBeasts];

        const updatedExpeditions = currentWild.activeExpeditions.map(e => {
          if (e.id === expeditionId) {
            return {
              ...e,
              status: 'recalled' as const,
              spoils,
            };
          }
          return e;
        });

        playCrisisAlarm();
        state.addNotification(`📯 Recall Horn sounded! Wagon turned back. Salvaged partial spoils & unconsumed rations.`, '📯', 'event');

        set({
          wilderness: {
            ...currentWild,
            activeExpeditions: updatedExpeditions,
            frontierCache: newFrontierCache,
            campHoldingPens: newHoldingPens,
          },
          isDirty: true,
        });
        return true;
      },

      claimExpeditionSpoils: (expeditionId: string) => {
        const state = get();
        const currentWild = state.wilderness;
        const updatedExpeditions = (currentWild.activeExpeditions || []).filter(e => e.id !== expeditionId);
        set({
          wilderness: {
            ...currentWild,
            activeExpeditions: updatedExpeditions,
          },
          isDirty: true,
        });
        playVictoryChime();
      },

      shipFrontierMaterialToBarn: (materialId: string, qty?: number) => {
        const state = get();
        const cache = state.wilderness.frontierCache || {};
        const available = cache[materialId] || 0;
        if (available <= 0) return;

        const shipAmount = qty ? Math.min(qty, available) : available;
        const nextCache = { ...cache };
        if (shipAmount >= available) {
          delete nextCache[materialId];
        } else {
          nextCache[materialId] = available - shipAmount;
        }

        const matDef = FRONTIER_MATERIALS[materialId];
        const matName = matDef?.name || materialId;

        playCashRegisterSound();
        state.addNotification(`🚚 Shipped ${shipAmount}x ${matName} from Frontier Cache to Home Barn!`, matDef?.emoji || '📦', 'info');

        set({
          wilderness: {
            ...state.wilderness,
            frontierCache: nextCache,
          },
          barn: {
            ...state.barn,
            [materialId]: (state.barn[materialId] || 0) + shipAmount,
          },
          isDirty: true,
        });
      },

      shipAllFrontierMaterialsToBarn: () => {
        const state = get();
        const cache = state.wilderness.frontierCache || {};
        const entries = Object.entries(cache);
        if (entries.length === 0) return;

        const newBarn = { ...state.barn };
        let totalCount = 0;
        for (const [matId, qty] of entries) {
          if (qty > 0) {
            newBarn[matId] = (newBarn[matId] || 0) + qty;
            totalCount += qty;
          }
        }

        playCashRegisterSound();
        state.addNotification(`🚚 Shipped all ${totalCount} items from Frontier Cache to Home Barn!`, '📦', 'event');

        set({
          wilderness: {
            ...state.wilderness,
            frontierCache: {},
          },
          barn: newBarn,
          isDirty: true,
        });
      },

      transferCratedBeastToPasture: (beastId: string) => {
        const state = get();
        const wild = state.wilderness;
        const beast = (wild.campHoldingPens || []).find(b => b.id === beastId);
        if (!beast) {
          return { success: false, message: 'Beast not found in Holding Pens.' };
        }

        // Check destination pasture capacity gate
        const currentCount = state.animals.filter(a => a.species === beast.species).length;
        const maxCap = state.animalCapacity[beast.species] || ANIMALS[beast.species].capacity;

        if (currentCount >= maxCap) {
          playDefeatSound();
          const msg = `⚠️ Cannot transfer: ${ANIMALS[beast.species].name} Pasture is at max capacity (${currentCount}/${maxCap})! Upgrade the ${ANIMALS[beast.species].name} sector first.`;
          state.addNotification(msg, '⚠️', 'info');
          return { success: false, message: msg };
        }

        // Convert crated beast to AnimalInstance
        const newAnimal: AnimalInstance = {
          id: generateId(),
          species: beast.species,
          tier: beast.tier,
          breedId: beast.breedId,
          fed: false,
          fedAt: null,
          productReady: false,
          age: 'adult',
          maxCycles: beast.maxCycles || 20,
          cyclesRemaining: beast.maxCycles || 20,
          cyclesCompletedTotal: 0,
        };

        const newHoldingPens = (wild.campHoldingPens || []).filter(b => b.id !== beastId);
        const updatedCodex = { ...state.codex, [beast.breedId]: true };

        playVictoryChime();
        const successMsg = `🎉 Transferred ${beast.name} from Camp Holding Pens to ${ANIMALS[beast.species].name} Pasture!`;
        state.addNotification(successMsg, beast.emoji || beast.avatar || '🐾', 'discovery');

        set({
          animals: [...state.animals, newAnimal],
          codex: updatedCodex,
          wilderness: {
            ...wild,
            campHoldingPens: newHoldingPens,
          },
          isDirty: true,
        });

        return { success: true, message: successMsg };
      },

      stationCratedBeastAtOutpost: (beastId: string) => {
        const state = get();
        const wild = state.wilderness;
        const beast = (wild.campHoldingPens || []).find(b => b.id === beastId);
        if (!beast) return;

        const newHoldingPens = (wild.campHoldingPens || []).filter(b => b.id !== beastId);
        const newStationed = [...(wild.stationedBeasts || []), beast];

        playVictoryChime();
        state.addNotification(`🏕️ Stationed ${beast.name} at Basecamp! Providing passive expedition perks.`, beast.emoji || beast.avatar || '🐾', 'event');

        set({
          wilderness: {
            ...wild,
            campHoldingPens: newHoldingPens,
            stationedBeasts: newStationed,
          },
          isDirty: true,
        });
      },

      unstationBeastFromOutpost: (beastId: string) => {
        const state = get();
        const wild = state.wilderness;
        const beast = (wild.stationedBeasts || []).find(b => b.id === beastId);
        if (!beast) return;

        const newStationed = (wild.stationedBeasts || []).filter(b => b.id !== beastId);
        const newHoldingPens = [...(wild.campHoldingPens || []), beast];

        set({
          wilderness: {
            ...wild,
            stationedBeasts: newStationed,
            campHoldingPens: newHoldingPens,
          },
          isDirty: true,
        });
      },

      releaseCratedBeastToWild: (beastId: string) => {
        const state = get();
        const wild = state.wilderness;
        const beast = (wild.campHoldingPens || []).find(b => b.id === beastId);
        if (!beast) return 0;

        const baseRenown: Record<Tier, number> = {
          common: 50,
          uncommon: 150,
          rare: 400,
          legendary: 1200,
        };
        let renown = baseRenown[beast.tier] || 50;
        if (beast.trait?.toLowerCase().includes('vitality')) {
          renown *= 2;
        }

        const newHoldingPens = (wild.campHoldingPens || []).filter(b => b.id !== beastId);
        const updatedRenown = (wild.campRenown || 0) + renown;

        playGoldRushFanfare();
        state.addNotification(`🌿 Released ${beast.name} into the wild! Gained +${renown} Camp Renown.`, '🌿', 'coin');

        set({
          wilderness: {
            ...wild,
            campHoldingPens: newHoldingPens,
            campRenown: updatedRenown,
          },
          isDirty: true,
        });

        return renown;
      },

      returnLeftoverRationsToBarn: (expeditionId: string) => {
        const state = get();
        const wild = state.wilderness;
        const exp = (wild.activeExpeditions || []).find(e => e.id === expeditionId);
        if (!exp || !exp.spoils?.leftoverRations) return;

        const leftovers = exp.spoils.leftoverRations;
        const entries = Object.entries(leftovers);
        if (entries.length === 0) return;

        const newSilo = { ...state.silo };
        const newBarn = { ...state.barn };
        let count = 0;

        for (const [itemId, qty] of entries) {
          if (qty > 0) {
            count += qty;
            if (isCropItem(itemId)) {
              newSilo[itemId] = (newSilo[itemId] || 0) + qty;
            } else {
              newBarn[itemId] = (newBarn[itemId] || 0) + qty;
            }
          }
        }

        const updatedExpeditions = wild.activeExpeditions.map(e => {
          if (e.id === expeditionId && e.spoils) {
            return {
              ...e,
              spoils: {
                ...e.spoils,
                leftoverRations: {},
              },
            };
          }
          return e;
        });

        playCashRegisterSound();
        state.addNotification(`🍞 Returned ${count} leftover rations safely to home storage!`, '🍞', 'info');

        set({
          silo: newSilo,
          barn: newBarn,
          wilderness: {
            ...wild,
            activeExpeditions: updatedExpeditions,
          },
          isDirty: true,
        });
      },

      // --- Prehistoric Frontier Trail Procedural Engine ---
      startTrailRun: () => {
        const state = get();
        if (state.activeTrailRun && !state.activeTrailRun.isCompleted && !state.activeTrailRun.isFailed) {
          state.addNotification('An expedition trail run is already active!', '🧭', 'info');
          return;
        }
        const newRun = startNewFrontierRun();
        playGoldRushFanfare();
        state.addNotification('🧭 Frontier Trail Expedition begun! Strata: Paleo Silt Beds.', '🧭', 'event');
        set({
          activeTrailRun: newRun,
          isDirty: true,
        });
      },

      resolveTrailEventAction: (actionType: EventActionType) => {
        const state = get();
        const run = state.activeTrailRun;
        if (!run || run.isCompleted || run.isFailed || !run.currentEventCard || run.resolvedEventChoice) {
          return;
        }

        const card = run.currentEventCard;
        const branch = actionType === 'specialized_tool' ? card.actions.specialized : actionType === 'hydrological_resource' ? card.actions.hydrological : card.actions.cautious;

        // Verify item requirement
        if (branch.requiredItem) {
          const req = branch.requiredItem;
          const available = (state.barn[req.id] || 0) + (state.silo[req.id] || 0);
          if (available < req.qty) {
            playDefeatSound();
            state.addNotification(`Missing required item: ${req.qty}x ${req.name}!`, '⚠️', 'info');
            return;
          }
        }

        // Verify Elevated Gravity Tower water requirement
        if (branch.requiredTowerWaterLiters && branch.requiredTowerWaterLiters > 0) {
          const availableTower = state.hydrology?.towerLiters || 0;
          if (availableTower < branch.requiredTowerWaterLiters) {
            playDefeatSound();
            state.addNotification(`Insufficient Elevated Gravity Tower water! Requires ${branch.requiredTowerWaterLiters}L (Tower has ${availableTower}L)`, '🚰', 'info');
            return;
          }
        }

        // Deduct item requirement
        const newBarn = { ...state.barn };
        const newSilo = { ...state.silo };
        if (branch.requiredItem) {
          const req = branch.requiredItem;
          let remaining = req.qty;
          if (newBarn[req.id]) {
            const take = Math.min(newBarn[req.id], remaining);
            newBarn[req.id] -= take;
            remaining -= take;
          }
          if (remaining > 0 && newSilo[req.id]) {
            const take = Math.min(newSilo[req.id], remaining);
            newSilo[req.id] -= take;
            remaining -= take;
          }
        }

        // Deduct Elevated Gravity Tower water
        let updatedHydrology = { ...state.hydrology };
        if (branch.requiredTowerWaterLiters && branch.requiredTowerWaterLiters > 0) {
          updatedHydrology = {
            ...updatedHydrology,
            towerLiters: Math.max(0, updatedHydrology.towerLiters - branch.requiredTowerWaterLiters),
          };
        }

        // Execute procedural resolution
        const guildHazardPenalty = (state.guildHazardCyclesRemaining || 0) > 0 ? 0.25 : 0;
        const outcome = executeEventAction(actionType, card, run.currentNodeIndex, guildHazardPenalty);
        const newGuildHazardCycles = guildHazardPenalty > 0 ? Math.max(0, (state.guildHazardCyclesRemaining || 0) - 1) : 0;

        // Update Morale
        const newMorale = Math.max(0, Math.min(100, run.morale + outcome.moraleChange));

        // Update Rucksack
        const newRucksack = { ...run.rucksack, fossils: { ...run.rucksack.fossils }, preservedEmbryos: { ...run.rucksack.preservedEmbryos } };
        for (const fId of outcome.addedFossils) {
          newRucksack.fossils[fId] = (newRucksack.fossils[fId] || 0) + 1;
        }
        newRucksack.amberSpecimens += outcome.addedAmber;
        newRucksack.mineralSlabs += outcome.addedSlabs;
        newRucksack.coins += outcome.addedCoins;
        for (const eId of outcome.addedEmbryos) {
          newRucksack.preservedEmbryos[eId] = (newRucksack.preservedEmbryos[eId] || 0) + 1;
        }

        const newHistory = [
          ...run.nodeHistory,
          {
            node: run.currentNodeIndex,
            strataId: run.activeStrataId,
            eventTitle: card.title,
            actionTaken: actionType,
            success: outcome.success,
          },
        ];

        // Check if morale hit 0 -> EXPEDITION FAILURE
        if (newMorale <= 0) {
          playCrisisAlarm();
          const extraction = extractRucksack(newRucksack, true);
          for (const [fId, qty] of Object.entries(extraction.savedFossils)) {
            newBarn[fId] = (newBarn[fId] || 0) + qty;
          }
          if (extraction.savedAmber > 0) newBarn.amber_specimen = (newBarn.amber_specimen || 0) + extraction.savedAmber;
          if (extraction.savedSlabs > 0) newBarn.mineral_slab = (newBarn.mineral_slab || 0) + extraction.savedSlabs;

          state.addNotification(extraction.lostMaterialsText || 'Expedition Failed: Morale broke! Salvaged half the mineral haul; fragile embryos died.', '💀', 'event');

          set({
            barn: newBarn,
            silo: newSilo,
            coins: state.coins + extraction.savedCoins,
            hydrology: updatedHydrology,
            guildHazardCyclesRemaining: newGuildHazardCycles,
            activeTrailRun: {
              ...run,
              morale: 0,
              isFailed: true,
              resolvedEventChoice: actionType,
              eventOutcomeMessage: outcome.message,
              nodeHistory: newHistory,
              rucksack: newRucksack,
            },
            isDirty: true,
          });
          return;
        }

        if (outcome.success) {
          playVictoryChime();
        } else {
          playDefeatSound();
        }

        set({
          barn: newBarn,
          silo: newSilo,
          hydrology: updatedHydrology,
          guildHazardCyclesRemaining: newGuildHazardCycles,
          activeTrailRun: {
            ...run,
            morale: newMorale,
            resolvedEventChoice: actionType,
            eventOutcomeMessage: outcome.message,
            nodeHistory: newHistory,
            rucksack: newRucksack,
          },
          isDirty: true,
        });
      },

      advanceTrailNode: () => {
        const state = get();
        const run = state.activeTrailRun;
        if (!run || run.isCompleted || run.isFailed || !run.resolvedEventChoice) return;

        if (run.currentNodeIndex >= 5) {
          state.bankAndExtractTrailLoot();
          return;
        }

        const traversalCost = calculateNodeTraversalCost(state.hydrology?.weatherCondition);
        const newMorale = Math.max(0, run.morale - traversalCost);

        if (newMorale <= 0) {
          playCrisisAlarm();
          const extraction = extractRucksack(run.rucksack, true);
          const newBarn = { ...state.barn };
          for (const [fId, qty] of Object.entries(extraction.savedFossils)) {
            newBarn[fId] = (newBarn[fId] || 0) + qty;
          }
          if (extraction.savedAmber > 0) newBarn.amber_specimen = (newBarn.amber_specimen || 0) + extraction.savedAmber;
          if (extraction.savedSlabs > 0) newBarn.mineral_slab = (newBarn.mineral_slab || 0) + extraction.savedSlabs;

          state.addNotification('Expedition Failed: Trail traversal depleted remaining stamina. 50% cached haul lost.', '💀', 'event');
          set({
            barn: newBarn,
            coins: state.coins + extraction.savedCoins,
            activeTrailRun: {
              ...run,
              morale: 0,
              isFailed: true,
            },
            isDirty: true,
          });
          return;
        }

        const nextNode = run.currentNodeIndex + 1;
        const nextStrata = FRONTIER_STRATA_SEQUENCE[nextNode - 1];
        const nextCard = drawFrontierEvent(nextStrata, nextNode);

        playGoldRushFanfare();
        state.addNotification(`🧭 Stepped deeper into Strata ${nextNode}/5: ${FRONTIER_STRATA_REGISTRY[nextStrata]?.name || nextStrata} (-${traversalCost} Morale)`, '🧭', 'info');

        set({
          activeTrailRun: {
            ...run,
            currentNodeIndex: nextNode,
            activeStrataId: nextStrata,
            morale: newMorale,
            currentEventCard: nextCard,
            resolvedEventChoice: null,
            eventOutcomeMessage: null,
          },
          isDirty: true,
        });
      },

      bankAndExtractTrailLoot: () => {
        const state = get();
        const run = state.activeTrailRun;
        if (!run || run.isExtracted) return;

        const extraction = extractRucksack(run.rucksack, false);
        const newBarn = { ...state.barn };
        let totalItems = 0;

        for (const [fId, qty] of Object.entries(extraction.savedFossils)) {
          newBarn[fId] = (newBarn[fId] || 0) + qty;
          totalItems += qty;
        }
        if (extraction.savedAmber > 0) {
          newBarn.amber_specimen = (newBarn.amber_specimen || 0) + extraction.savedAmber;
          totalItems += extraction.savedAmber;
        }
        if (extraction.savedSlabs > 0) {
          newBarn.mineral_slab = (newBarn.mineral_slab || 0) + extraction.savedSlabs;
          totalItems += extraction.savedSlabs;
        }
        for (const [eId, qty] of Object.entries(extraction.savedEmbryos)) {
          newBarn[`embryo_${eId}`] = (newBarn[`embryo_${eId}`] || 0) + qty;
          totalItems += qty;
        }

        playVictoryChime();
        state.addNotification(`⛺ Expedition Banked! Deposited ${totalItems} fossils & minerals + ${extraction.savedCoins} coins to estate vault!`, '🎉', 'discovery');

        set({
          barn: newBarn,
          coins: state.coins + extraction.savedCoins,
          activeTrailRun: {
            ...run,
            isCompleted: true,
            isExtracted: true,
          },
          isDirty: true,
        });
      },

      // --- Amber Bio-Lab Closed-Loop Incubation Actions ---
      startSpecimenIncubation: (chamberId: number, speciesId: PrehistoricSpeciesId) => {
        const state = get();
        const spec = PREHISTORIC_SPECIES_REGISTRY[speciesId];
        if (!spec) return false;

        const bioLab = state.amberBioLab || createDefaultAmberBioLab();
        const chamber = bioLab.chambers.find(c => c.chamberId === chamberId);
        if (!chamber || chamber.status !== 'EMPTY') {
          state.addNotification('Chamber is currently occupied or unavailable!', '⚠️', 'info');
          return false;
        }

        const fossilQty = (state.barn[spec.fossilItemId] || 0);
        if (fossilQty <= 0) {
          state.addNotification(`Missing required specimen core: ${spec.fossilName}!`, '⚠️', 'info');
          return false;
        }

        const towerWater = state.hydrology?.towerLiters || 0;
        if (towerWater < spec.incubationTowerWaterLiters) {
          state.addNotification(`Elevated Gravity Tower has insufficient water! Requires ${spec.incubationTowerWaterLiters}L (Tower has ${towerWater}L)`, '🚰', 'info');
          return false;
        }

        const newBarn = { ...state.barn };
        newBarn[spec.fossilItemId] = fossilQty - 1;

        const updatedHydrology = {
          ...state.hydrology,
          towerLiters: Math.max(0, state.hydrology.towerLiters - spec.incubationTowerWaterLiters),
        };

        const updatedChambers = bioLab.chambers.map(c => {
          if (c.chamberId === chamberId) {
            return {
              ...c,
              status: 'INCUBATING' as const,
              speciesId,
              startedAt: Date.now(),
              durationSec: spec.incubationTimeSec,
              progressPct: 0,
              towerWaterReservedLiters: spec.incubationTowerWaterLiters,
              uncooledSecElapsed: 0,
            };
          }
          return c;
        });

        playVictoryChime();
        state.addNotification(`🧬 Incubation Chamber #${chamberId} initiated for ${spec.name}! Closed-loop cooling engaged (${spec.incubationTowerWaterLiters}L pumped).`, '🧬', 'discovery');

        set({
          barn: newBarn,
          hydrology: updatedHydrology,
          amberBioLab: {
            ...bioLab,
            chambers: updatedChambers,
          },
          isDirty: true,
        });
        return true;
      },

      collectRevivedSpecimen: (chamberId: number) => {
        const state = get();
        const bioLab = state.amberBioLab || createDefaultAmberBioLab();
        const chamber = bioLab.chambers.find(c => c.chamberId === chamberId);
        if (!chamber || chamber.status !== 'READY_TO_REVIVE' || !chamber.speciesId) {
          return false;
        }

        const spec = PREHISTORIC_SPECIES_REGISTRY[chamber.speciesId];
        const sanctuary = state.prehistoricSanctuary || createDefaultSanctuary();
        const enclosure = sanctuary.enclosures[spec.enclosureType];

        const updatedEnclosure = {
          ...enclosure,
          specimenCount: (enclosure?.specimenCount || 0) + 1,
          isStarving: false,
        };

        const updatedChambers = bioLab.chambers.map(c => {
          if (c.chamberId === chamberId) {
            return {
              ...c,
              status: 'EMPTY' as const,
              speciesId: undefined,
              startedAt: undefined,
              progressPct: 0,
              towerWaterReservedLiters: 0,
              uncooledSecElapsed: 0,
            };
          }
          return c;
        });

        playGoldRushFanfare();
        state.addNotification(`🌟 ${spec.name} successfully synthesized and relocated to ${spec.enclosureName}! Estate passive [${spec.estatePassiveTitle}] active!`, spec.emoji, 'discovery');

        set({
          amberBioLab: {
            ...bioLab,
            chambers: updatedChambers,
            totalSpecimensRevived: (bioLab.totalSpecimensRevived || 0) + 1,
          },
          prehistoricSanctuary: {
            ...sanctuary,
            enclosures: {
              ...sanctuary.enclosures,
              [spec.enclosureType]: updatedEnclosure,
            },
          },
          isDirty: true,
        });
        return true;
      },

      // --- Prehistoric Sanctuary Operations ---
      depositEnclosureFeed: (enclosureId: EnclosureTypeId, qty: number) => {
        const state = get();
        const sanctuary = state.prehistoricSanctuary || createDefaultSanctuary();
        const enclosure = sanctuary.enclosures[enclosureId];
        if (!enclosure) return false;

        const spec = PREHISTORIC_SPECIES_REGISTRY[enclosure.speciesId];
        const dietId = spec.dietProductId;
        const available = (state.barn[dietId] || 0) + (state.silo[dietId] || 0);

        if (available <= 0) {
          state.addNotification(`No ${spec.dietName} available in barn or silo!`, '⚠️', 'info');
          return false;
        }

        const depositAmount = Math.min(qty, available, enclosure.maxTroughLiters - enclosure.troughFoodLiters);
        if (depositAmount <= 0) {
          state.addNotification('Trough is already full!', '🥣', 'info');
          return false;
        }

        const newBarn = { ...state.barn };
        const newSilo = { ...state.silo };
        let remaining = depositAmount;
        if (newBarn[dietId]) {
          const take = Math.min(newBarn[dietId], remaining);
          newBarn[dietId] -= take;
          remaining -= take;
        }
        if (remaining > 0 && newSilo[dietId]) {
          const take = Math.min(newSilo[dietId], remaining);
          newSilo[dietId] -= take;
          remaining -= take;
        }

        const updatedEnclosures = {
          ...sanctuary.enclosures,
          [enclosureId]: {
            ...enclosure,
            troughFoodLiters: Math.min(enclosure.maxTroughLiters, enclosure.troughFoodLiters + depositAmount),
            isStarving: false,
            lastFedTimestamp: Date.now(),
          },
        };

        playCashRegisterSound();
        state.addNotification(`🥣 Deposited ${depositAmount} units of ${spec.dietName} into ${enclosure.name}!`, spec.dietEmoji, 'event');

        set({
          barn: newBarn,
          silo: newSilo,
          prehistoricSanctuary: {
            ...sanctuary,
            enclosures: updatedEnclosures,
          },
          isDirty: true,
        });
        return true;
      },

      collectEnclosureHarvest: (enclosureId: EnclosureTypeId) => {
        const state = get();
        const sanctuary = state.prehistoricSanctuary || createDefaultSanctuary();
        const enclosure = sanctuary.enclosures[enclosureId];
        if (!enclosure || enclosure.harvestReadyCount <= 0) return 0;

        const spec = PREHISTORIC_SPECIES_REGISTRY[enclosure.speciesId];
        const harvestCount = enclosure.harvestReadyCount;

        const newBarn = { ...state.barn };
        newBarn[spec.harvestProductId] = (newBarn[spec.harvestProductId] || 0) + harvestCount;

        const updatedEnclosures = {
          ...sanctuary.enclosures,
          [enclosureId]: {
            ...enclosure,
            harvestReadyCount: 0,
          },
        };

        playVictoryChime();
        state.addNotification(`✨ Harvested ${harvestCount}x ${spec.harvestName} from ${spec.name}!`, spec.harvestEmoji, 'discovery');

        const newTotalFaunaHarvests = (state.totalFaunaHarvests || 0) + harvestCount;
        const newFaunaHarvestStats = {
          ...(state.faunaHarvestStats || {}),
          [spec.harvestProductId]: ((state.faunaHarvestStats || {})[spec.harvestProductId] || 0) + harvestCount,
        };

        set({
          barn: newBarn,
          prehistoricSanctuary: {
            ...sanctuary,
            enclosures: updatedEnclosures,
          },
          totalFaunaHarvests: newTotalFaunaHarvests,
          faunaHarvestStats: newFaunaHarvestStats,
          isDirty: true,
        });
        return harvestCount;
      },

      // --- Unified Estate Menagerie & Fauna Codex Operations ---
      setMenagerieModalOpen: (open: boolean) => set({ isMenagerieModalOpen: open }),

      refillDomesticTrough: (species: AnimalSpecies, qty?: number) => {
        const state = get();
        const currentTroughs = state.domesticTroughs || {
          chicken: { foodUnits: 65, maxUnits: 100 },
          cow: { foodUnits: 55, maxUnits: 100 },
          sheep: { foodUnits: 45, maxUnits: 100 },
          pig: { foodUnits: 35, maxUnits: 100 },
        };
        const trough = currentTroughs[species] || { foodUnits: 0, maxUnits: 100 };
        const capacitySpace = trough.maxUnits - trough.foodUnits;
        if (capacitySpace <= 0) {
          state.addNotification(`${species.toUpperCase()} trough is already full!`, '🥣', 'info');
          return false;
        }

        const dietCandidates: Record<AnimalSpecies, string[]> = {
          chicken: ['feed', 'wheat'],
          cow: ['feed', 'wheat'],
          sheep: ['feed', 'wheat'],
          pig: ['feed', 'carrot', 'soybean', 'corn'],
        };

        const candidates = dietCandidates[species] || ['feed', 'wheat'];
        const targetAmount = qty ? Math.min(qty, capacitySpace) : capacitySpace;

        const newBarn = { ...state.barn };
        const newSilo = { ...state.silo };
        let depositAmount = 0;

        for (const dietId of candidates) {
          const availInSilo = newSilo[dietId] || 0;
          const availInBarn = newBarn[dietId] || 0;
          const totalAvail = availInSilo + availInBarn;
          if (totalAvail > 0) {
            const needed = targetAmount - depositAmount;
            const take = Math.min(needed, totalAvail);
            let rem = take;
            if (newSilo[dietId] && newSilo[dietId] > 0) {
              const fromSilo = Math.min(newSilo[dietId], rem);
              newSilo[dietId] -= fromSilo;
              rem -= fromSilo;
            }
            if (rem > 0 && newBarn[dietId] && newBarn[dietId] > 0) {
              const fromBarn = Math.min(newBarn[dietId], rem);
              newBarn[dietId] -= fromBarn;
              rem -= fromBarn;
            }
            depositAmount += take;
            if (depositAmount >= targetAmount) break;
          }
        }

        if (depositAmount <= 0) {
          state.addNotification(`No suitable feed or crops available for ${species} in barn or silo!`, '⚠️', 'info');
          return false;
        }

        const now = Date.now();
        const updatedTroughs = {
          ...currentTroughs,
          [species]: {
            ...trough,
            foodUnits: Math.min(trough.maxUnits, trough.foodUnits + depositAmount),
            isPaused: false,
          },
        };

        // Also feed any unfed animals of this species immediately
        const updatedAnimals = state.animals.map(a => {
          if (a.species === species && !a.fed && !a.productReady && a.age !== 'elder') {
            return { ...a, fed: true, fedAt: now };
          }
          return a;
        });

        playCashRegisterSound();
        state.addNotification(`🥣 Refilled ${species} trough with ${depositAmount} units! Animals actively feeding.`, '🌾', 'event');

        set({
          silo: newSilo,
          barn: newBarn,
          domesticTroughs: updatedTroughs,
          animals: updatedAnimals,
          isDirty: true,
        });
        return true;
      },

      collectDomesticHarvest: (species: AnimalSpecies) => {
        const state = get();
        const readyAnimals = state.animals.filter(a => a.species === species && a.productReady);
        if (readyAnimals.length <= 0) return 0;

        const newBarn = { ...state.barn };
        const newCodex = { ...state.codex };
        let collectedCount = 0;
        let additionalCoins = 0;
        let additionalGems = 0;
        let additionalXp = 0;
        const now = Date.now();

        const currentTroughs = state.domesticTroughs || {
          chicken: { foodUnits: 65, maxUnits: 100 },
          cow: { foodUnits: 55, maxUnits: 100 },
          sheep: { foodUnits: 45, maxUnits: 100 },
          pig: { foodUnits: 35, maxUnits: 100 },
        };
        const trough = currentTroughs[species] || { foodUnits: 0, maxUnits: 100 };
        const feedCostPerAnimal = ANIMALS[species]?.feedPerCycle || 1;
        let remainingTrough = trough.foodUnits;

        const updatedAnimals = state.animals.map(a => {
          if (a.species === species && a.productReady) {
            collectedCount++;
            const breedDef = BREED_REGISTRY[a.breedId];
            const speciesDef = ANIMALS[a.species];
            const aOverclock = state.entityOverclocks?.[`animal_${a.id}`];
            const bonusYield = (aOverclock?.isOverclocked && aOverclock.bonusYield) ? aOverclock.bonusYield : 0;

            if (breedDef) {
              newBarn[breedDef.primaryProductKey] = (newBarn[breedDef.primaryProductKey] || 0) + breedDef.baseYieldAmount + bonusYield;
            } else {
              newBarn[speciesDef.product] = (newBarn[speciesDef.product] || 0) + speciesDef.productYield + bonusYield;
            }

            if (breedDef?.bonusDrop && Math.random() < breedDef.bonusDrop.chance) {
              if (breedDef.bonusDrop.itemKey) {
                newBarn[breedDef.bonusDrop.itemKey] = (newBarn[breedDef.bonusDrop.itemKey] || 0) + 1;
              }
              if (breedDef.bonusDrop.directCoins) {
                additionalCoins += breedDef.bonusDrop.directCoins;
              }
            }

            const totalCompleted = a.cyclesCompletedTotal + 1;
            if (breedDef?.gemMilestoneEveryN && totalCompleted % breedDef.gemMilestoneEveryN === 0) {
              additionalGems += a.species === 'pig' ? 2 : 1;
            }

            const codexKey = a.breedId;
            if (!newCodex[codexKey]) {
              newCodex[codexKey] = true;
              if (breedDef) additionalGems += breedDef.codexGemReward;
            }

            additionalXp += a.tier === 'legendary' ? 25 : a.tier === 'rare' ? 15 : a.tier === 'uncommon' ? 8 : 5;

            const newCyclesRemaining = a.cyclesRemaining - 1;
            const isElder = newCyclesRemaining <= 0;

            // Auto-refeed from trough if trough has food
            let willAutoRefeed = false;
            if (!isElder && remainingTrough >= feedCostPerAnimal) {
              remainingTrough -= feedCostPerAnimal;
              willAutoRefeed = true;
            }

            return {
              ...a,
              fed: willAutoRefeed,
              fedAt: willAutoRefeed ? now : null,
              productReady: false,
              cyclesRemaining: newCyclesRemaining,
              cyclesCompletedTotal: totalCompleted,
              age: isElder ? ('elder' as const) : a.age,
              isOverclocked: false,
              overclockExpiresAt: null,
            };
          }
          return a;
        });

        const newTotalFaunaHarvests = (state.totalFaunaHarvests || 0) + collectedCount;
        const mainDropId = ANIMALS[species]?.product || 'egg';
        const newFaunaHarvestStats = {
          ...(state.faunaHarvestStats || {}),
          [mainDropId]: ((state.faunaHarvestStats || {})[mainDropId] || 0) + collectedCount,
        };

        const updatedTroughs = {
          ...currentTroughs,
          [species]: {
            ...trough,
            foodUnits: Math.max(0, remainingTrough),
          },
        };

        const { xp: newXp, level: newLevel } = levelUpCheck(state.xp + additionalXp, state.level);

        playVictoryChime();
        state.addNotification(`✨ Harvested ${collectedCount} outputs from ${species}! Deposited to barn.`, ANIMALS[species]?.productEmoji || '📦', 'discovery');

        set({
          barn: newBarn,
          animals: updatedAnimals,
          domesticTroughs: updatedTroughs,
          totalFaunaHarvests: newTotalFaunaHarvests,
          faunaHarvestStats: newFaunaHarvestStats,
          xp: newXp,
          level: newLevel,
          coins: state.coins + additionalCoins,
          gems: state.gems + additionalGems,
          codex: newCodex,
          isDirty: true,
        });
        return collectedCount;
      },

      refillAllFaunaTroughs: () => {
        const state = get();
        let refilledDomestic = 0;
        let refilledPrehistoric = 0;

        const speciesList: AnimalSpecies[] = ['chicken', 'cow', 'sheep', 'pig'];
        for (const sp of speciesList) {
          const trough = state.domesticTroughs?.[sp] || { foodUnits: 0, maxUnits: 100 };
          if (trough.foodUnits < trough.maxUnits) {
            const ok = get().refillDomesticTrough(sp);
            if (ok) refilledDomestic++;
          }
        }

        const sanctuary = state.prehistoricSanctuary || createDefaultSanctuary();
        for (const enc of Object.values(sanctuary.enclosures || {})) {
          if (enc.troughFoodLiters < enc.maxTroughLiters) {
            const ok = get().depositEnclosureFeed(enc.enclosureId, enc.maxTroughLiters - enc.troughFoodLiters);
            if (ok) refilledPrehistoric++;
          }
        }

        return { refilledDomestic, refilledPrehistoric };
      },

      collectAllFaunaHarvests: () => {
        let collectedDomestic = 0;
        let collectedPrehistoric = 0;

        const speciesList: AnimalSpecies[] = ['chicken', 'cow', 'sheep', 'pig'];
        for (const sp of speciesList) {
          const c = get().collectDomesticHarvest(sp);
          collectedDomestic += c;
        }

        const sanctuary = get().prehistoricSanctuary || createDefaultSanctuary();
        for (const enc of Object.values(sanctuary.enclosures || {})) {
          if (enc.harvestReadyCount > 0) {
            const c = get().collectEnclosureHarvest(enc.enclosureId);
            collectedPrehistoric += c;
          }
        }

        return { collectedDomestic, collectedPrehistoric };
      },

      // ---- Workshop Active Installations & Tool Loadout Actions ----

      equipWorkshopTool: (toolId: 'hardened_chitin_trowel') => {
        const state = get();
        const loadout = state.workshopLoadout || createDefaultWorkshopLoadout();
        const have = state.barn[toolId] || 0;
        if (have <= 0) return false;

        const newBarn = { ...state.barn };
        if (loadout.equippedTool) {
          newBarn[loadout.equippedTool] = (newBarn[loadout.equippedTool] || 0) + 1;
        }
        newBarn[toolId] = Math.max(0, have - 1);

        playVictoryChime();
        state.addNotification('🗡️ Hardened Chitin Trowel equipped! +30% Tilling, Planting & Harvest Speed active across all plots.', '⛏️✨', 'discovery');

        set({
          barn: newBarn,
          workshopLoadout: {
            ...loadout,
            equippedTool: toolId,
          },
          isDirty: true,
        });
        return true;
      },

      unequipWorkshopTool: () => {
        const state = get();
        const loadout = state.workshopLoadout || createDefaultWorkshopLoadout();
        if (!loadout.equippedTool) return;

        const tool = loadout.equippedTool;
        const newBarn = { ...state.barn };
        newBarn[tool] = (newBarn[tool] || 0) + 1;

        state.addNotification('📦 Unequipped tool returned to Barn inventory.', '🛡️', 'info');

        set({
          barn: newBarn,
          workshopLoadout: {
            ...loadout,
            equippedTool: null,
          },
          isDirty: true,
        });
      },

      installSluiceGateSeal: () => {
        const state = get();
        const loadout = state.workshopLoadout || createDefaultWorkshopLoadout();
        if (loadout.sluiceGateSealsInstalled >= 3) return false;
        const have = state.barn.reinforced_sluice_seal || 0;
        if (have <= 0) return false;

        const newBarn = { ...state.barn };
        newBarn.reinforced_sluice_seal = Math.max(0, have - 1);
        const newCount = loadout.sluiceGateSealsInstalled + 1;

        playVictoryChime();
        state.addNotification(`🚰 Installed Sluice Gate Seal (${newCount}/3)! Canal drainage loss reduced by -${newCount * 20}%.`, '🛡️🔧', 'discovery');

        const updatedHydrology = state.hydrology
          ? {
              ...state.hydrology,
              hasReinforcedSluiceSeal: true,
              sluiceSealsCount: newCount,
            }
          : state.hydrology;

        set({
          barn: newBarn,
          hydrology: updatedHydrology,
          workshopLoadout: {
            ...loadout,
            sluiceGateSealsInstalled: newCount,
          },
          isDirty: true,
        });
        return true;
      },

      reinforceAquiferCasing: () => {
        const state = get();
        const loadout = state.workshopLoadout || createDefaultWorkshopLoadout();
        if (loadout.aquiferCasingsInstalled >= 4) return false;
        const have = state.barn.subsoil_aquifer_casing || 0;
        if (have <= 0) return false;

        const newBarn = { ...state.barn };
        newBarn.subsoil_aquifer_casing = Math.max(0, have - 1);
        const newTier = loadout.aquiferCasingsInstalled + 1;
        const newCapacity = 3000 + (newTier * 500);

        playVictoryChime();
        state.addNotification(`🪨 Subsoil Aquifer Casing Tier ${newTier}/4 installed! Deep groundwater capacity expanded to ${newCapacity.toLocaleString()}L (+500L).`, '🏗️💧', 'discovery');

        const updatedHydrology = state.hydrology
          ? {
              ...state.hydrology,
              aquiferCapacityLiters: newCapacity,
            }
          : state.hydrology;

        set({
          barn: newBarn,
          hydrology: updatedHydrology,
          workshopLoadout: {
            ...loadout,
            aquiferCasingsInstalled: newTier,
          },
          isDirty: true,
        });
        return true;
      },

      mountPrismaticLens: () => {
        const state = get();
        const loadout = state.workshopLoadout || createDefaultWorkshopLoadout();
        if (loadout.prismaticLensMounted) return false;
        const have = state.barn.prismatic_light_lens || 0;
        if (have <= 0) return false;

        const newBarn = { ...state.barn };
        newBarn.prismatic_light_lens = Math.max(0, have - 1);

        playVictoryChime();
        state.addNotification('☀️ Prismatic Light Canopy mounted! Nighttime growth penalties completely neutralized across all 12 plots.', '🔍🌈', 'discovery');

        set({
          barn: newBarn,
          workshopLoadout: {
            ...loadout,
            prismaticLensMounted: true,
          },
          isDirty: true,
        });
        return true;
      },

      unmountPrismaticLens: () => {
        const state = get();
        const loadout = state.workshopLoadout || createDefaultWorkshopLoadout();
        if (!loadout.prismaticLensMounted) return;

        const newBarn = { ...state.barn };
        newBarn.prismatic_light_lens = (newBarn.prismatic_light_lens || 0) + 1;

        state.addNotification('📦 Prismatic Light Lens unmounted and returned to Barn inventory.', '🔍🌈', 'info');

        set({
          barn: newBarn,
          workshopLoadout: {
            ...loadout,
            prismaticLensMounted: false,
          },
          isDirty: true,
        });
      },

      mountThermalCore: () => {
        const state = get();
        const loadout = state.workshopLoadout || createDefaultWorkshopLoadout();
        if (loadout.thermalCoreActive) return false;
        const have = state.barn.thermal_retaining_core || 0;
        if (have <= 0) return false;

        const newBarn = { ...state.barn };
        newBarn.thermal_retaining_core = Math.max(0, have - 1);

        playVictoryChime();
        state.addNotification('🔥 Thermal Retaining Core activated! Micro-climate geothermal frost protection active.', '🔥💎', 'discovery');

        set({
          barn: newBarn,
          workshopLoadout: {
            ...loadout,
            thermalCoreActive: true,
          },
          isDirty: true,
        });
        return true;
      },

      unmountThermalCore: () => {
        const state = get();
        const loadout = state.workshopLoadout || createDefaultWorkshopLoadout();
        if (!loadout.thermalCoreActive) return;

        const newBarn = { ...state.barn };
        newBarn.thermal_retaining_core = (newBarn.thermal_retaining_core || 0) + 1;

        state.addNotification('📦 Thermal Retaining Core unmounted and returned to Barn inventory.', '🔥💎', 'info');

        set({
          barn: newBarn,
          workshopLoadout: {
            ...loadout,
            thermalCoreActive: false,
          },
          isDirty: true,
        });
      },

      installEmergencySiphonValve: (allowCoinPurchase = true) => {
        const state = get();
        const loadout = state.workshopLoadout || createDefaultWorkshopLoadout();
        if (loadout.emergencySiphonInstalled) return false;
        const have = state.barn.emergency_siphon_valve || 0;

        let newBarn = { ...state.barn };
        let newCoins = state.coins;

        if (have > 0) {
          newBarn.emergency_siphon_valve = Math.max(0, have - 1);
        } else if (allowCoinPurchase) {
          const cost = Math.min(250, state.coins);
          newCoins = Math.max(0, state.coins - cost);
        } else {
          return false;
        }

        playVictoryChime();
        state.addNotification('🚰 Emergency Aquifer Siphon Valve installed! Automatic hydraulic transfer will protect tower from dropping below 80L.', '🛡️💧', 'discovery');

        set({
          coins: newCoins,
          barn: newBarn,
          workshopLoadout: {
            ...loadout,
            emergencySiphonInstalled: true,
          },
          isDirty: true,
        });
        return true;
      },

      buySiphonValve: (costCoins = 250) => {
        const state = get();
        const effectiveCost = Math.min(costCoins, state.coins);
        const newBarn = { ...state.barn };
        newBarn.emergency_siphon_valve = (newBarn.emergency_siphon_valve || 0) + 1;

        playVictoryChime();
        state.addNotification('🚰 Purchased Emergency Siphon Float Valve! Ready for installation at the Gravity Tower or Workshop.', '💧', 'discovery');

        set({
          coins: Math.max(0, state.coins - effectiveCost),
          barn: newBarn,
          isDirty: true,
        });
        return true;
      },

      dismissOfflineHydrologyReport: () => {
        set({ offlineHydrologyReport: null, isDirty: true });
      },

      // Game Manager & Offline Caretaker System Actions
      toggleOfflineMode: () => {
        const state = get();
        if (!state.isOfflineMode) {
          set({
            isOfflineMode: true,
            offlineStartTime: Date.now(),
            isDirty: true,
          });
          get().addNotification('🌙 Game Manager: Entered Offline Caretaker Mode. Estate is automated.', '🎮', 'info');
        } else {
          const now = Date.now();
          const start = state.offlineStartTime || (now - 60000);
          const elapsedSec = Math.max(1, Math.round((now - start) / 1000));
          get().simulateOfflineAbsence(elapsedSec);
          set({
            isOfflineMode: false,
            offlineStartTime: null,
            isDirty: true,
          });
          get().addNotification('🟢 Game Manager: Returned Online! Offline report compiled.', '🎮', 'info');
        }
      },

      setOfflineMode: (offline: boolean) => {
        const state = get();
        if (state.isOfflineMode === offline) return;
        get().toggleOfflineMode();
      },

      dismissOfflineSummary: () => {
        set({ lastOfflineSummary: null, isDirty: true });
      },

      simulateOfflineAbsence: (elapsedSeconds: number) => {
        const state = get();
        const now = Date.now();
        const elapsedMs = Math.max(1000, elapsedSeconds * 1000);

        // 1. Advance plots
        const auraMultiplier = state.currentEstateAura?.effectDetail?.type === 'growth_speed'
          ? state.currentEstateAura.effectDetail.value
          : 1.0;
        const cropMaturedMap: Record<string, number> = {};
        let totalCropsMatured = 0;

        const newPlots = state.plots.map(p => {
          if (p.crop && p.plantedAt && !p.ready) {
            const cropDef = CROPS[p.crop];
            const pLevel = p.level || 1;
            const soilTier = getSoilTier(pLevel);
            const soilSpeedMultiplier = 1 + (soilTier.speedBonusPct / 100);
            const waterBoost = (p.isWatered || soilTier.autoHydrate) ? 2.0 : 1.0;
            const growMs = (cropDef.growTimeSec * 1000 * auraMultiplier) / (soilSpeedMultiplier * waterBoost);
            if ((now - p.plantedAt >= growMs) || (elapsedMs >= growMs)) {
              cropMaturedMap[p.crop] = (cropMaturedMap[p.crop] || 0) + 1;
              totalCropsMatured++;
              return { ...p, ready: true };
            }
          }
          return p;
        });

        // 2. Advance animals
        const animalProductMap: Record<string, { count: number; product: string }> = {};
        let totalAnimalProducts = 0;

        const newAnimals = state.animals.map(a => {
          if (a.fed && a.fedAt && !a.productReady) {
            const def = ANIMALS[a.species];
            const cycleMs = def.productionTimeSec * 1000;
            if ((now - a.fedAt >= cycleMs) || (elapsedMs >= cycleMs)) {
              const prodName = def.product;
              animalProductMap[a.species] = {
                count: (animalProductMap[a.species]?.count || 0) + 1,
                product: prodName,
              };
              totalAnimalProducts++;
              return { ...a, productReady: true, fed: false, fedAt: null };
            }
          }
          return a;
        });

        // 3. Advance production queues
        const prodFinishedMap: Record<string, { building: string; count: number }> = {};
        let totalProdFinished = 0;
        const newQueues = { ...state.productionQueues };
        for (const bId of Object.keys(newQueues) as BuildingId[]) {
          newQueues[bId] = newQueues[bId].map(slot => {
            if (!slot.done && ((now - slot.startedAt >= slot.durationSec * 1000) || (elapsedMs >= slot.durationSec * 1000))) {
              prodFinishedMap[slot.recipeId] = {
                building: bId,
                count: (prodFinishedMap[slot.recipeId]?.count || 0) + 1,
              };
              totalProdFinished++;
              return { ...slot, done: true };
            }
            return slot;
          });
        }

        // 4. Hydrology & Siphon Catch-Up
        const currentHydro = state.hydrology || createDefaultHydrologyState(state.level);
        const loadout = state.workshopLoadout || createDefaultWorkshopLoadout();
        const activeChambers = (state.amberBioLab?.chambers || []).filter(c => c.status === 'INCUBATING' || (c.status as string) === 'CRYO_STANDBY').length;
        const activeWorkers = Object.values(state.unifiedWorkers || {}).filter(w => w.isHired && !w.isPaused).length;

        const catchup = resolveOfflineHydrologyCatchUp({
          initialTowerLiters: currentHydro.towerLiters,
          initialAquiferLiters: currentHydro.aquiferLiters,
          initialCisternLiters: currentHydro.cisternLiters,
          cisternMaxLiters: currentHydro.cisternMaxLiters || 1200,
          aquiferCapacityLiters: currentHydro.aquiferCapacityLiters || 3000,
          elapsedOfflineSeconds: elapsedSeconds,
          isSluiceOpen: currentHydro.sluiceGatesOpen,
          sluiceDischargeRateLps: currentHydro.liveDischargeLitersPerSec || 1.5,
          activeBioLabChambersCount: activeChambers,
          activeWorkerCount: activeWorkers,
          hasEmergencySiphon: Boolean(loadout.emergencySiphonInstalled),
          hasInsulationSleeves: Boolean(state.amberBioLab?.cryoInsulationInstalled),
          siphonMode: currentHydro.siphonMode || 'continuous',
          siphonSourcePreference: currentHydro.siphonSourcePreference || 'smart_highest',
        });

        const updatedHydro = {
          ...currentHydro,
          towerLiters: catchup.finalTowerLiters,
          aquiferLiters: catchup.finalAquiferLiters,
          cisternLiters: catchup.finalCisternLiters !== undefined ? catchup.finalCisternLiters : currentHydro.cisternLiters,
          totalSiphonedLiters: (currentHydro.totalSiphonedLiters || 0) + catchup.totalSiphonedLiters,
          loadSheddingStage: catchup.stageReached,
          isCropConservationActive: catchup.stageReached >= 1,
          isCrewRationingActive: catchup.stageReached >= 2,
          isCryoStandbyActive: catchup.isCryoStandbyActive,
          sluiceGatesOpen: catchup.stageReached >= 1 ? false : currentHydro.sluiceGatesOpen,
        };

        // Notes and log assembly
        const notes: string[] = [];
        if (totalCropsMatured > 0) {
          notes.push(`🌾 ${totalCropsMatured} crop plot(s) reached full maturity and are ready to harvest.`);
        } else {
          notes.push(`🌾 Field moisture levels safely preserved across all plots.`);
        }

        if (totalAnimalProducts > 0) {
          notes.push(`🥛 ${totalAnimalProducts} livestock production cycle(s) completed cleanly.`);
        }

        if (totalProdFinished > 0) {
          notes.push(`⚙️ ${totalProdFinished} workshop artisan recipe(s) completed.`);
        }

        if (catchup.totalSiphonedLiters > 0) {
          notes.push(`🚰 Emergency Siphon Valve engaged: +${catchup.totalSiphonedLiters}L transferred from Deep Aquifer.`);
        }

        if (catchup.stageReached >= 1) {
          notes.push(`🛡️ Stage ${catchup.stageReached} Load-Shedding active: Sluice gates auto-secured to eliminate root rot risk.`);
        }

        if (activeChambers > 0) {
          notes.push(`🦖 ${activeChambers} Amber Bio-Lab specimen chamber(s) secured under Cryo-Standby preservation.`);
        }

        const summary: OfflineActivitySummary = {
          id: `offline_${Date.now()}`,
          timestamp: now,
          durationSeconds: elapsedSeconds,
          cropsMatured: Object.entries(cropMaturedMap).map(([crop, count]) => ({ crop, count })),
          totalCropsMaturedCount: totalCropsMatured,
          animalProductsReady: Object.entries(animalProductMap).map(([species, val]) => ({ species, count: val.count, product: val.product })),
          totalAnimalProductsCount: totalAnimalProducts,
          productionFinished: Object.entries(prodFinishedMap).map(([recipe, val]) => ({ recipe, building: val.building, count: val.count })),
          totalProductionFinishedCount: totalProdFinished,
          waterDrainedLiters: Math.max(0, Math.round(currentHydro.towerLiters - catchup.finalTowerLiters)),
          waterSiphonedLiters: catchup.totalSiphonedLiters,
          initialTowerLiters: catchup.initialTowerLiters,
          finalTowerLiters: catchup.finalTowerLiters,
          initialAquiferLiters: catchup.initialAquiferLiters,
          finalAquiferLiters: catchup.finalAquiferLiters,
          loadSheddingStage: catchup.stageReached,
          cropConservationTriggered: catchup.stageReached >= 1,
          specimensPreservedCount: activeChambers,
          coinsEarned: 0,
          xpEarned: 0,
          workersProtected: true,
          notes,
        };

        const newHistory = [summary, ...(state.offlineHistory || [])].slice(0, 10);

        set({
          plots: newPlots,
          animals: newAnimals,
          productionQueues: newQueues,
          hydrology: updatedHydro,
          offlineHydrologyReport: catchup,
          lastOfflineSummary: summary,
          offlineHistory: newHistory,
          lastTick: now,
          isDirty: true,
        });

        return summary;
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

      // Notifications & Estate Dispatch Center
      setDispatchModalOpen: (open) => {
        set({ isDispatchModalOpen: open });
      },

      addNotification: (message, emoji, type, category, priority, shortcut, targetId) => {
        const state = get();
        // Intelligent auto-classification if not explicitly provided
        let resolvedCategory: NotificationCategory = category || 'history';
        let resolvedPriority: NotificationPriority = priority || 'info';

        if (!category || !priority) {
          const lower = message.toLowerCase();
          // Hazards: Flash Floods, Root Rot, Crop Wilting, Heat Stasis, Lightning strikes, Crises
          if (
            lower.includes('flood') ||
            lower.includes('root rot') ||
            lower.includes('wilt') ||
            lower.includes('heat') ||
            lower.includes('lightning') ||
            lower.includes('convective') ||
            lower.includes('ash') ||
            lower.includes('crisis') ||
            lower.includes('lodging') ||
            lower.includes('fire') ||
            lower.includes('burnout') ||
            lower.includes('exhausted')
          ) {
            resolvedCategory = 'hazards';
            if (
              lower.includes('crisis') ||
              lower.includes('flood') ||
              lower.includes('root rot') ||
              lower.includes('incinerat') ||
              lower.includes('fire')
            ) {
              resolvedPriority = 'critical';
            } else {
              resolvedPriority = 'warning';
            }
          }
          // Hydrology: Sluice gate, Cistern, Tower, Aquifer, Canal, Evaporat, Silt, Dew
          else if (
            lower.includes('sluice') ||
            lower.includes('cistern') ||
            lower.includes('tower') ||
            lower.includes('aquifer') ||
            lower.includes('canal') ||
            lower.includes('evaporat') ||
            lower.includes('irrigation') ||
            lower.includes('dew') ||
            lower.includes('percolat') ||
            lower.includes('sediment') ||
            lower.includes('spillway')
          ) {
            resolvedCategory = 'hydrology';
            if (lower.includes('dry') || lower.includes('ran dry') || lower.includes('0l') || lower.includes('breached')) {
              resolvedPriority = 'critical';
            } else if (lower.includes('clog') || lower.includes('sediment') || lower.includes('closed') || lower.includes('low')) {
              resolvedPriority = 'warning';
            } else {
              resolvedPriority = 'info';
            }
          }
          // Waters & Crew: Fishery, Restock, Worker, Dehydration, Fatigue, Shift, Strike, Desertion, Wage, Canteen, Bunkhouse
          else if (
            lower.includes('fisher') ||
            lower.includes('angler') ||
            lower.includes('fish') ||
            lower.includes('restock') ||
            lower.includes('deplet') ||
            lower.includes('worker') ||
            lower.includes('dehydrat') ||
            lower.includes('fatigue') ||
            lower.includes('canteen') ||
            lower.includes('shift') ||
            lower.includes('handoff') ||
            lower.includes('strike') ||
            lower.includes('grievance') ||
            lower.includes('desertion') ||
            lower.includes('bunkhouse') ||
            lower.includes('herder') ||
            lower.includes('overtime') ||
            lower.includes('wage')
          ) {
            resolvedCategory = 'waters_crew';
            if (lower.includes('strike') || lower.includes('desert') || lower.includes('dehydrat') || lower.includes('dispute')) {
              resolvedPriority = 'critical';
            } else if (lower.includes('deplet') || lower.includes('restock') || lower.includes('grumbling') || lower.includes('exhaust')) {
              resolvedPriority = 'warning';
            } else {
              resolvedPriority = 'info';
            }
          } else {
            resolvedCategory = 'history';
            resolvedPriority = type === 'event' ? 'warning' : 'info';
          }
        }

        const notification: NotificationItem = {
          id: generateId(),
          message,
          emoji,
          createdAt: Date.now(),
          type,
          category: resolvedCategory,
          priority: resolvedPriority,
          shortcut,
          targetId,
          resolved: false,
        };
        // Retain up to 150 items for rich chronological audit trail
        const newNotifications = [notification, ...state.notifications].slice(0, 150);
        set({ notifications: newNotifications });
      },

      dismissNotification: (id: string) => {
        const state = get();
        set({ notifications: state.notifications.filter(n => n.id !== id) });
      },

      resolveNotification: (id: string) => {
        const state = get();
        set({
          notifications: state.notifications.map(n =>
            n.id === id ? { ...n, resolved: true } : n
          ),
        });
      },

      clearNotifications: (category?: NotificationCategory) => {
        const state = get();
        if (!category) {
          // Clear all except unresolved critical items
          set({
            notifications: state.notifications.filter(n => n.priority === 'critical' && !n.resolved),
          });
        } else {
          set({
            notifications: state.notifications.filter(
              n => n.category !== category || (n.priority === 'critical' && !n.resolved)
            ),
          });
        }
      },

      tick: () => {
        const now = Date.now();
        const state = get();

        // If Game Manager is in Offline Mode, pause live active ticking
        if (state.isOfflineMode) {
          return;
        }

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

        // Closed-Loop Hydrological Estate Simulation Step
        const deltaSeconds = state.lastTick ? Math.min(30, Math.max(0.1, (now - state.lastTick) / 1000)) : 1;
        const currentClock = getCircadianClock(now, state.farmEpochStart || now);

        // Worker hydrology shift duty checks
        const fieldHandWorker = state.unifiedWorkers?.farmer;
        const hasFieldHandMorningDuty = Boolean(
          fieldHandWorker?.isHired &&
          !fieldHandWorker?.isPaused &&
          !state.isAllWorkersPaused &&
          fieldHandWorker?.moraleTier !== 'striking' &&
          fieldHandWorker?.moraleTier !== 'deserted'
        );

        const hasNightWatchDuty = Boolean(
          Object.values(state.unifiedWorkers || {}).some(w => w.isHired && (w.shiftType === 'night') && !w.isPaused && !state.isAllWorkersPaused && w.moraleTier !== 'striking') ||
          Object.values(state.specialistWorkers || {}).some(sp => sp.isHired && (sp.shiftType === 'night') && sp.isActive && !state.isAllWorkersPaused && !sp.isStriking)
        );

        const currentHydrology = state.hydrology || createDefaultHydrologyState(state.level);
        const workshopLoadout = state.workshopLoadout || createDefaultWorkshopLoadout();
        const sealsInstalled = Math.min(3, Math.max(0, workshopLoadout.sluiceGateSealsInstalled ?? (currentHydrology.hasReinforcedSluiceSeal ? 1 : 0)));
        const casingsInstalled = Math.min(4, Math.max(0, workshopLoadout.aquiferCasingsInstalled ?? ((state.barn?.subsoil_aquifer_casing || 0) > 0 ? 1 : 0)));
        const targetAquifer = 3000 + (casingsInstalled * 500);

        // Offline Absence Mathematical Catch-Up Resolver (> 5 minutes / 300s)
        let offlineHydrologyReportToSet: OfflineHydrologyResolutionResult | null = null;
        if (state.lastTick && (now - state.lastTick >= 300000)) {
          const elapsedOfflineSeconds = Math.round((now - state.lastTick) / 1000);
          const activeChambers = (state.amberBioLab?.chambers || []).filter(c => c.status === 'INCUBATING' || (c.status as string) === 'CRYO_STANDBY').length;
          const activeWorkers = Object.values(state.unifiedWorkers || {}).filter(w => w.isHired && !w.isPaused).length;

          const offlineCatchup = resolveOfflineHydrologyCatchUp({
            initialTowerLiters: currentHydrology.towerLiters,
            initialAquiferLiters: currentHydrology.aquiferLiters,
            initialCisternLiters: currentHydrology.cisternLiters,
            cisternMaxLiters: currentHydrology.cisternMaxLiters || 1200,
            aquiferCapacityLiters: currentHydrology.aquiferCapacityLiters || 3000,
            elapsedOfflineSeconds,
            isSluiceOpen: currentHydrology.sluiceGatesOpen,
            sluiceDischargeRateLps: currentHydrology.liveDischargeLitersPerSec || 1.5,
            activeBioLabChambersCount: activeChambers,
            activeWorkerCount: activeWorkers,
            hasEmergencySiphon: Boolean(workshopLoadout.emergencySiphonInstalled),
            hasInsulationSleeves: Boolean(state.amberBioLab?.cryoInsulationInstalled),
            siphonMode: currentHydrology.siphonMode || 'continuous',
            siphonSourcePreference: currentHydrology.siphonSourcePreference || 'smart_highest',
            towerCapacityLiters: currentHydrology.towerCapacityLiters || 800,
          });

          offlineHydrologyReportToSet = offlineCatchup;
          currentHydrology.towerLiters = offlineCatchup.finalTowerLiters;
          currentHydrology.aquiferLiters = offlineCatchup.finalAquiferLiters;
          if (offlineCatchup.finalCisternLiters !== undefined) {
            currentHydrology.cisternLiters = offlineCatchup.finalCisternLiters;
          }
          currentHydrology.totalSiphonedLiters = (currentHydrology.totalSiphonedLiters || 0) + offlineCatchup.totalSiphonedLiters;
          currentHydrology.loadSheddingStage = offlineCatchup.stageReached;
          currentHydrology.isCropConservationActive = offlineCatchup.stageReached >= 1;
          currentHydrology.isCrewRationingActive = offlineCatchup.stageReached >= 2;
          currentHydrology.isCryoStandbyActive = offlineCatchup.isCryoStandbyActive;
          if (offlineCatchup.stageReached >= 1) {
            currentHydrology.sluiceGatesOpen = false;
          }
        }

        const effectiveHydrology = {
          ...currentHydrology,
          hasReinforcedSluiceSeal: sealsInstalled > 0,
          sluiceSealsCount: sealsInstalled,
          aquiferCapacityLiters: Math.max(currentHydrology.aquiferCapacityLiters || 3000, targetAquifer),
        };

        // Real-Time Siphon Float Valve simulation (Smart Dual-Intake Manifold)
        const hasEmergencySiphon = Boolean(workshopLoadout.emergencySiphonInstalled);
        const siphonSim = simulateSiphonTick({
          towerLiters: effectiveHydrology.towerLiters,
          towerCapacityLiters: effectiveHydrology.towerCapacityLiters || 800,
          aquiferLiters: effectiveHydrology.aquiferLiters,
          aquiferCapacityLiters: effectiveHydrology.aquiferCapacityLiters || 3000,
          cisternLiters: effectiveHydrology.cisternLiters,
          cisternMaxLiters: effectiveHydrology.cisternMaxLiters || 1200,
          deltaSeconds,
          hasEmergencySiphon,
          siphonMode: effectiveHydrology.siphonMode || 'continuous',
          siphonSourcePreference: effectiveHydrology.siphonSourcePreference || 'smart_highest',
        });
        effectiveHydrology.towerLiters = siphonSim.newTowerLiters;
        effectiveHydrology.aquiferLiters = siphonSim.newAquiferLiters;
        effectiveHydrology.cisternLiters = siphonSim.newCisternLiters;
        effectiveHydrology.isSiphonActive = siphonSim.isSiphonActive;
        effectiveHydrology.siphonActiveSource = siphonSim.siphonActiveSource;
        effectiveHydrology.siphonSourceBreakdown = siphonSim.siphonSourceBreakdown;
        if (siphonSim.siphonedLiters > 0) {
          effectiveHydrology.totalSiphonedLiters = (effectiveHydrology.totalSiphonedLiters || 0) + siphonSim.siphonedLiters;
        }

        const hydroSimResult = stepHydrologySimulation({
          hydrology: effectiveHydrology,
          plots: state.plots,
          unlockedPlots: state.unlockedPlots,
          farmLevel: state.level,
          cycleElapsedSeconds: currentClock.cycleElapsedSeconds,
          currentDay: currentClock.currentDay,
          deltaSeconds,
          isRainstormActive: state.activeEvent?.type === 'rainstorm',
          hasFieldHandMorningDuty,
          hasNightWatchDuty,
          isHardcoreMode: Boolean(state.isHardcoreMode),
        });

        const loadSheddingStage = getTowerLoadSheddingStage(hydroSimResult.updatedHydrology.towerLiters);
        hydroSimResult.updatedHydrology.loadSheddingStage = loadSheddingStage;
        hydroSimResult.updatedHydrology.isCropConservationActive = loadSheddingStage >= 1;
        hydroSimResult.updatedHydrology.isCrewRationingActive = loadSheddingStage >= 2;
        hydroSimResult.updatedHydrology.isCryoStandbyActive = loadSheddingStage >= 3;
        hydroSimResult.updatedHydrology.isSiphonActive = effectiveHydrology.isSiphonActive;
        hydroSimResult.updatedHydrology.totalSiphonedLiters = effectiveHydrology.totalSiphonedLiters;

        if (hydroSimResult.notifications && hydroSimResult.notifications.length > 0) {
          for (const notif of hydroSimResult.notifications) {
            state.addNotification(notif.text, notif.icon, notif.type);
          }
        }

        // Prehistoric Sanctuary Macro-Simulation Estate Buffs
        const sanctuaryBuffs = state.prehistoricSanctuary || createDefaultSanctuary();
        const hasDimetrodon = Boolean(sanctuaryBuffs.enclosures?.enclosure_geothermal_basin?.specimenCount > 0 && !sanctuaryBuffs.enclosures?.enclosure_geothermal_basin?.isStarving);
        const hasMeganeura = Boolean(sanctuaryBuffs.enclosures?.enclosure_canopy_terrarium?.specimenCount > 0 && !sanctuaryBuffs.enclosures?.enclosure_canopy_terrarium?.isStarving);
        const hasTrilobite = Boolean(sanctuaryBuffs.enclosures?.enclosure_silt_terrarium?.specimenCount > 0 && !sanctuaryBuffs.enclosures?.enclosure_silt_terrarium?.isStarving);
        const hasArthropleura = Boolean(sanctuaryBuffs.enclosures?.enclosure_sylvan_floor?.specimenCount > 0 && !sanctuaryBuffs.enclosures?.enclosure_sylvan_floor?.isStarving);

        const meganeuraSpeedMultiplier = hasMeganeura ? 1.25 : 1.0;
        const trilobiteSpeedMultiplier = hasTrilobite ? 1.15 : 1.0;

        // Update plots with Hydrology & Atmospheric Crop Phenology Dynamics
        const rainBoost = state.activeEvent?.type === 'rainstorm' ? 0.5 : 0;
        const activeWeatherId: WeatherProfileId = resolveWeatherProfileId(hydroSimResult.updatedHydrology.weatherCondition);

        const newPlots = hydroSimResult.updatedPlots.map((p: any) => {
          if (p.crop && p.plantedAt && !p.ready) {
            // Under barn_fire, unwatered/burning plots are frozen
            if (isBarnFireActive && firePlotIds.includes(p.id)) {
              return p;
            }
            // Fail-Safe Stage 1+ Crop Conservation Mode (Tower <= 200L)
            // Canal gates are auto-closed to protect remaining tower reserve.
            // Dry/unwatered plots (moisture <= 15%) pause cleanly in place without withering.
            // If the plot is watered or has active moisture (> 15%), the crop consumes that water and grows normally!
            if (loadSheddingStage >= 1 && !p.isWatered && (p.moistureLevel ?? 0) <= 15) {
              return {
                ...p,
                plantedAt: p.plantedAt + (deltaSeconds * 1000), // freeze dry plots cleanly without resetting
                desiccatedSeconds: 0,
                isWithered: false,
                phenologyBadgeEmoji: '🛡️💧',
                phenologyBadgeText: 'Crop Conservation (Tower ≤ 200L)',
              };
            }
            const plotOverclock = state.entityOverclocks?.[`plot_${p.id}`];
            const isPlotExhausted = Boolean(plotOverclock?.isExhausted && plotOverclock?.exhaustedUntil && now < plotOverclock.exhaustedUntil);
            if (isPlotExhausted) {
              return p; // Growth halted during soil exhaustion
            }
            if (p.isWithered) {
              return p; // Growth halted if crop withered from prolonged desiccation
            }

            // Direct Atmospheric Crop Phenology evaluation
            let pheno = evaluateCropPhenology({
              cropId: p.crop,
              weather: activeWeatherId,
              moistureLevel: p.moistureLevel !== undefined ? p.moistureLevel : 60.0,
              isProtectedByGreenhouse: false,
            });

            // Dimetrodon Geothermal Radiance or Thermal Retaining Core: Frost Immunity!
            const hasThermalCore = Boolean(workshopLoadout.thermalCoreActive || (state.barn?.thermal_retaining_core || 0) > 0);
            if ((hasDimetrodon || hasThermalCore) && pheno.isFrostbitten) {
              pheno = {
                ...pheno,
                isFrostbitten: false,
                badgeEmoji: hasThermalCore ? '🔥💎' : '🔥🛡️',
                badgeText: hasThermalCore ? 'Thermal Retaining Core (Frost Immunity)' : 'Geothermal Radiance (Frost Immunity)',
                growthSpeedMultiplier: Math.max(1.0, pheno.growthSpeedMultiplier),
              };
            }

            // Growth halted if crop is thermal-wilted, frostbitten, or in winter dormancy
            if (pheno.isWilted || pheno.isFrostbitten || pheno.isDormant) {
              return {
                ...p,
                phenologyBadgeEmoji: pheno.badgeEmoji,
                phenologyBadgeText: pheno.badgeText,
                isFrostbitten: pheno.isFrostbitten,
                isHeatWilted: pheno.isWilted,
                isDormant: pheno.isDormant,
              };
            }

            const pLevel = p.level || 1;
            const soilTier = getSoilTier(pLevel);
            const soilSpeedMultiplier = 1 + (soilTier.speedBonusPct / 100);
            const plotMultiplier = (plotOverclock?.isOverclocked && !p.ready) ? plotOverclock.speedMultiplier : 1.0;
            const elapsed = (now - p.plantedAt) / 1000;
            const waterBoost = (p.isWatered || soilTier.autoHydrate) ? 2.0 : 1.0;

            // Soil Moisture Zone Multipliers (0x Desiccated, 0.6x Parched, 1.15x Optimal Sweet Spot)
            const mZone = getMoistureZone(p.moistureLevel !== undefined ? p.moistureLevel : 60.0);
            const moistureSpeedMultiplier = mZone.growthSpeedMultiplier;
            const phenoSpeedMultiplier = pheno.growthSpeedMultiplier;
            const siltSpeedMultiplier = (p.alluvialSiltCyclesRemaining && p.alluvialSiltCyclesRemaining > 0) ? 1.20 : 1.0;

            // Prismatic Light Lens: completely eliminates nighttime crop growth slowdown and grants +25% ambient boost
            const hasLightLens = Boolean(workshopLoadout.prismaticLensMounted || (state.barn?.prismatic_light_lens || 0) > 0);
            const isNight = currentClock.currentPeriod === 'night';
            const nightFactor = isNight ? (hasLightLens ? 1.0 : 0.70) : 1.0;
            const lightLensMultiplier = hasLightLens ? 1.25 : 1.0;

            // Hardened Chitin Trowel: +30% faster planting, tilling, and crop development
            const hasChitinTrowel = Boolean(workshopLoadout.equippedTool === 'hardened_chitin_trowel' || (state.barn?.hardened_chitin_trowel || 0) > 0);
            const trowelCropSpeedMultiplier = hasChitinTrowel ? 1.30 : 1.0;

            // Monoculture nutrient exhaustion penalty (+35% grow duration = 0.74x effective speed)
            const monocultureMultiplier = (state.isHardcoreMode && p.isMonoculture) ? 0.74 : 1.0;

            // Soil Battery Depletion penalty: Growth duration doubles (0.50x effective speed)
            const soilBatterySpeedMultiplier = p.plantedInDepletedSoil ? 0.50 : 1.0;

            const effectiveElapsed = (rainBoost > 0 ? elapsed * (1 + rainBoost) : elapsed) * ashMultiplier * waterBoost * weatherMultiplier * plotMultiplier * soilSpeedMultiplier * moistureSpeedMultiplier * phenoSpeedMultiplier * siltSpeedMultiplier * meganeuraSpeedMultiplier * trilobiteSpeedMultiplier * lightLensMultiplier * nightFactor * trowelCropSpeedMultiplier * monocultureMultiplier * soilBatterySpeedMultiplier;
            const cropBaseSec = CROPS[p.crop].growTimeSec;
            // Under alchemical_bloom: All crop growth times drop to a flat 30 seconds
            const growTime = isAlchemicalBloom ? Math.min(30, cropBaseSec) : cropBaseSec;
            const badgeEmoji = p.plantedInDepletedSoil ? '🥀⚡' : (p.isMonoculture ? '🥀⚠️' : pheno.badgeEmoji);
            const badgeText = p.plantedInDepletedSoil ? 'Tired Soil (-50% Speed & 1x Harvest)' : (p.isMonoculture ? 'Monoculture Exhaustion (-26% Speed)' : pheno.badgeText);
            if (effectiveElapsed >= growTime) {
              return {
                ...p,
                ready: true,
                phenologyBadgeEmoji: badgeEmoji,
                phenologyBadgeText: badgeText,
                isFrostbitten: false,
                isHeatWilted: false,
                isDormant: false,
              };
            }

            return {
              ...p,
              phenologyBadgeEmoji: badgeEmoji,
              phenologyBadgeText: badgeText,
              isFrostbitten: false,
              isHeatWilted: false,
              isDormant: false,
            };
          }
          return p;
        });

        // Update animal production and domestic troughs
        const currentDomesticTroughs = state.domesticTroughs || {
          chicken: { foodUnits: 65, maxUnits: 100 },
          cow: { foodUnits: 55, maxUnits: 100 },
          sheep: { foodUnits: 45, maxUnits: 100 },
          pig: { foodUnits: 35, maxUnits: 100 },
        };
        const updatedDomesticTroughs = { ...currentDomesticTroughs };
        const dSpeciesList: AnimalSpecies[] = ['chicken', 'cow', 'sheep', 'pig'];
        const isExtremeWeather = activeWeatherId === 'supercell_deluge' || activeWeatherId === 'plasma_firestorm' || activeWeatherId === 'polar_vortex' || activeWeatherId === 'hyper_cyclone' || activeWeatherId === 'alchemical_monsoon' || activeWeatherId === 'haboob_sandstorm' || Boolean(hydroSimResult.updatedHydrology.isFlashFloodActive) || (state.isHardcoreMode && (activeWeatherId === 'heatwave' || activeWeatherId === 'monsoon' || activeWeatherId === 'cyclone' || activeWeatherId === 'drought'));
        for (const sp of dSpeciesList) {
          const activeProducers = state.animals.filter(a => a.species === sp && a.fed && !a.productReady).length;
          if (activeProducers > 0) {
            const tr = updatedDomesticTroughs[sp] || { foodUnits: 0, maxUnits: 100 };
            const drain = (state.isHardcoreMode && isExtremeWeather ? 0.10 : state.isHardcoreMode ? 0.08 : 0.05) * activeProducers;
            updatedDomesticTroughs[sp] = {
              ...tr,
              foodUnits: Math.max(0, tr.foodUnits - drain),
              isPaused: tr.foodUnits <= 0,
            };
            if (state.isHardcoreMode && tr.foodUnits <= 0 && Math.random() < 0.02) {
              state.addNotification(`⚠️ Barn Feed Shortage: ${sp.toUpperCase()} trough is dry! Animals are stressed.`, '⚠️', 'info');
            }
          }
        }

        // Update animal production (with Overclocking, Mutation & Trough modifiers)
        let newAnimals = state.animals.map(a => {
          if (a.fed && a.fedAt && !a.productReady) {
            const aOverclock = state.entityOverclocks?.[`animal_${a.id}`];
            const isAnimalExhausted = Boolean(
              (aOverclock?.isExhausted && aOverclock?.exhaustedUntil && now < aOverclock.exhaustedUntil) ||
              (a.isExhausted && a.exhaustedUntil && now < a.exhaustedUntil)
            );
            if (isAnimalExhausted) {
              return a; // Production halted during exhaustion
            }

            // Trough Comfort Buff: full communal troughs grant +25% speed bonus!
            // When trough is empty, animals still produce at normal speed (or -15% in hardcore mode)
            const tr = updatedDomesticTroughs[a.species];
            const hasTroughFood = tr && tr.foodUnits > 0;
            const troughSpeedMultiplier = hasTroughFood ? 1.25 : (state.isHardcoreMode ? 0.85 : 1.0);

            const isOverclocked = Boolean(
              (aOverclock?.isOverclocked && (!aOverclock.expiresAt || now < aOverclock.expiresAt)) ||
              (a.isOverclocked && a.overclockExpiresAt && now < a.overclockExpiresAt)
            );
            const overclockMultiplier = aOverclock?.isOverclocked ? aOverclock.speedMultiplier : (isOverclocked ? 3.0 : 1.0);
            const mutationMultiplier = a.isMutated ? (a.mutationBonus || 1.5) : 1.0;

            // Sanitize fedAt: if fedAt was previously pushed into the future by the bug, clamp it to now
            const safeFedAt = Math.min(a.fedAt, now);
            const elapsed = ((now - safeFedAt) / 1000) * overclockMultiplier * mutationMultiplier * weatherMultiplier * troughSpeedMultiplier;

            // Use breed-specific production time from BREED_REGISTRY if available
            const breedDef = BREED_REGISTRY[a.breedId];
            const prodTime = breedDef ? breedDef.baseIntervalMs / 1000 : ANIMALS[a.species].productionTimeSec;
            if (elapsed >= prodTime) {
              return {
                ...a,
                productReady: true,
                fedAt: safeFedAt,
              };
            }
            if (safeFedAt !== a.fedAt) {
              return {
                ...a,
                fedAt: safeFedAt,
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
          const isBarnabyActive = Boolean(
            state.specialistWorkers?.worker_feedmaster_barnaby?.isHired &&
            state.specialistWorkers?.worker_feedmaster_barnaby?.isActive &&
            !state.specialistWorkers?.worker_feedmaster_barnaby?.isStriking
          );
          const barnabySpeed = (isBarnabyActive && (buildingId === 'animal_feed' || buildingId === 'feed_mill')) ? 1.3 : 1.0;
          // Arthropleura Composting Engine: Doubles Feed Mill processing velocity (+100% throughput)
          const arthropleuraSpeed = (hasArthropleura && buildingId === 'feed_mill') ? 2.0 : 1.0;
          const speedMultiplier = (isArtisanMasterclass && isArtisanWorkshop ? 4.0 : 1.0) * masterLedgerMultiplier * overclockMultiplier * barnabySpeed * arthropleuraSpeed;

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
        let newCoins = state.coins;
        let newXp = state.xp;
        let newBarn = { ...state.barn };
        let newSilo = { ...state.silo };
        if ((newBarn as Record<string, number>).honey_comb) {
          const stranded = (newBarn as Record<string, number>).honey_comb || 0;
          if (stranded > 0) {
            newSilo.honey_comb = (newSilo.honey_comb || 0) + stranded;
          }
          delete (newBarn as Record<string, number>).honey_comb;
        }
        let newGems = state.gems;
        let newCodex = { ...state.codex };
        let newFishCodex = { ...state.fishery.fishCodex };
        const newCatchTimestamps = { ...state.fishery.lastCatchTimestamps };
        // Check if workers are paused due to user master pause or sudden crisis penalty
        const areWorkersPaused = Boolean(state.isAllWorkersPaused || (state.workersPausedUntil && now < state.workersPausedUntil));

        // Only catch fish if at least one active fisherman exists (farmhand, autonomous, or unpaused unified)
        const hasFisherman = !areWorkersPaused && (
          state.farmhands.some(f => f.role === 'fisherman') ||
          state.autonomousWorkers.some(w => w.type === 'fisherman') ||
          (Boolean(state.unifiedWorkers?.fisherman?.isHired) && !state.unifiedWorkers?.fisherman?.isPaused) ||
          (Boolean(state.unifiedWorkers?.auto_fisherman?.isHired) && !state.unifiedWorkers?.auto_fisherman?.isPaused)
        );

        // --- Dynamic Aquatic Ecosystem Tick ---
        const currentAtmosphere = hydroSimResult.updatedHydrology.weatherState;
        const currentTemp = currentAtmosphere?.temperatureC !== undefined ? currentAtmosphere.temperatureC : 27;
        const currentHumidity = currentAtmosphere?.relativeHumidityPct !== undefined ? currentAtmosphere.relativeHumidityPct : 40;

        let currentPondVolume = state.fishery.pondWaterVolume !== undefined
          ? state.fishery.pondWaterVolume
          : POND_HYDROLOGY.INITIAL_VOLUME_LITERS;

        // Evaporative loss on Farmstead Pond
        const pondEvapRateLPerMin = calculatePondEvaporationLitersPerMin(currentTemp, currentHumidity);
        const pondEvapLossLiters = (pondEvapRateLPerMin / 60) * deltaSeconds;
        currentPondVolume = Math.max(0, currentPondVolume - pondEvapLossLiters);

        // Natural spawning recharge for all unlocked zones
        const currentEcosystem = { ...(state.fishery.zoneEcosystem || createDefaultZoneEcosystem()) };
        for (const zoneId of state.fishery.unlockedZones) {
          const cfg = ZONE_ECOSYSTEM_CONFIGS[zoneId];
          const eco = currentEcosystem[zoneId] || {
            currentStock: cfg.stockCap,
            maxStock: cfg.stockCap,
            spawnProgressSec: 0,
            isDepleted: false,
            tier: 1,
          };

          const zTier = (eco.tier || 1) as ZoneUpgradeTier;
          const targetMaxStock = getZoneStockCap(zoneId, zTier);
          let curStock = eco.currentStock;
          let spawnSec = eco.spawnProgressSec;

          if (curStock < targetMaxStock) {
            const { activeSpawnTickSec, isFrozen } = calculateActiveSpawnInterval(
              zoneId,
              currentTemp,
              zoneId === 'zone_pond' ? currentPondVolume : undefined,
              zTier
            );

            if (!isFrozen && activeSpawnTickSec < Infinity && activeSpawnTickSec > 0) {
              spawnSec += deltaSeconds;
              while (spawnSec >= activeSpawnTickSec && curStock < targetMaxStock) {
                curStock += 1;
                spawnSec -= activeSpawnTickSec;
              }
              if (curStock >= targetMaxStock) {
                curStock = targetMaxStock;
                spawnSec = 0;
              }
            }
          }

          const isNowDepleted = isZoneFishingPaused(curStock, targetMaxStock, eco.isDepleted);

          // If zone just reached 100% full recovery from depleted state, notify player
          if (eco.isDepleted && !isNowDepleted && curStock >= targetMaxStock) {
            state.addNotification(
              `🐟 Restocked: ${WATER_ZONES[zoneId].name} is now 100% full (${curStock}/${targetMaxStock} fish)! Fishing resumed.`,
              '🌊',
              'discovery'
            );
          }

          currentEcosystem[zoneId] = {
            currentStock: curStock,
            maxStock: targetMaxStock,
            spawnProgressSec: spawnSec,
            isDepleted: isNowDepleted,
            tier: zTier,
          };
        }

        const rod = ROD_TIERS[state.fishery.rodTier];
        // Calculate total active fisherman workforce
        const totalWorkforce = areWorkersPaused ? 0 : (
          state.farmhands.filter(f => f.role === 'fisherman').length +
          (state.unifiedWorkers?.fisherman?.isHired && !state.unifiedWorkers?.fisherman?.isPaused ? 1 : 0) +
          (state.unifiedWorkers?.auto_fisherman?.isHired && !state.unifiedWorkers?.auto_fisherman?.isPaused ? 1 : 0) +
          state.autonomousWorkers.filter(w => w.type === 'fisherman').length
        );

        if (totalWorkforce > 0) {
          const crewPolicy = state.fishery.crew?.policy || { sustainableRotation: true, catchHandling: 'auto-sell-common' as const };
          const pinnedWorkers = state.fishery.crew?.pinnedWorkers || { zone_pond: 0, zone_river: 0, zone_estuary: 0, zone_lake: 0, zone_ocean: 0 };

          const crewAssignments = computeDockMasterAssignments({
            unlockedZones: state.fishery.unlockedZones,
            totalWorkforce,
            pinnedWorkers,
            zoneEcosystem: currentEcosystem,
            sustainableRotation: crewPolicy.sustainableRotation,
          });

          for (const zoneId of state.fishery.unlockedZones) {
            const zone = WATER_ZONES[zoneId];
            const alloc = crewAssignments.zoneAssignments[zoneId];
            if (!alloc || alloc.totalAssigned <= 0) {
              continue; // No fishermen stationed at this zone
            }

            const lastCatch = state.fishery.lastCatchTimestamps[zoneId] || 0;
            if (lastCatch === 0) continue;

            const fOverclock = state.entityOverclocks?.[`fishery_${zoneId}`];
            const isFisheryExhausted = Boolean(fOverclock?.isExhausted && fOverclock?.exhaustedUntil && now < fOverclock.exhaustedUntil);
            if (isFisheryExhausted) {
              continue; // Halted while reel is jammed/exhausted
            }

            const zoneEco = currentEcosystem[zoneId];
            if (!zoneEco) continue;

            // Pinned workers vs auto-assigned worker eligibility:
            // Pinned workers do NOT evacuate at 20%; they fish down to 0 stock and wait for spawn
            // Auto-assigned workers respect low-stock protection (<=20%) and restocking lockout
            const hasPinned = alloc.pinned > 0;
            if (!hasPinned) {
              if (alloc.isPausedRestocking || alloc.isProtectedLowStock) {
                continue;
              }
            } else {
              if (zoneEco.currentStock <= 0) {
                continue; // Waiting for spawn!
              }
            }

            // Check if frozen
            const climate = calculateClimateSensitivity(zoneId, currentTemp);
            if (climate.isFrozen) {
              continue; // Halted while surface bed is iced over
            }

            const isFisheryOverclocked = Boolean(fOverclock?.isOverclocked && (!fOverclock.expiresAt || now < fOverclock.expiresAt));
            const fMultiplier = isFisheryOverclocked ? fOverclock.speedMultiplier : 1.0;

            const hasSlicker = state.farmhands.some(fh => fh.role === 'fisherman' && fh.equippedOutfit === 'fisherman_slicker');
            const zTier = (zoneEco?.tier || 1) as ZoneUpgradeTier;
            const baseInterval = calculateActiveCatchIntervalMs({
              zoneId,
              rodSpeedMultiplier: rod.speedMultiplier,
              hasSlicker,
              overclockMultiplier: fMultiplier,
              waterVolume: zoneId === 'zone_pond' ? currentPondVolume : undefined,
              tier: zTier,
            });

            // Effective interval scaled by total assigned anglers stationed at this water body
            const effectiveInterval = Math.max(800, Math.round(baseInterval / alloc.totalAssigned));

            if (now - lastCatch >= effectiveInterval) {
              const catchResult = rollFishCatch(zoneId, state.fishery.rodTier, newFishCodex);
              if (catchResult && zoneEco.currentStock > 0) {
                const fishDef = FISH_SPECIES[catchResult.speciesId];
                const bonusQty = (isFisheryOverclocked && fOverclock?.bonusYield) ? fOverclock.bonusYield : 0;
                const catchQty = 1 + bonusQty;

                // Dock Master Catch Policy Handling
                const isAutoSellCommon = crewPolicy.catchHandling === 'auto-sell-common' && fishDef.tier === 'common';
                if (isAutoSellCommon) {
                  const saleEarnings = fishDef.sellPrice * catchQty;
                  newCoins += saleEarnings;
                } else {
                  newBarn[fishDef.id] = (newBarn[fishDef.id] || 0) + catchQty;
                  newBarn.fish = (newBarn.fish || 0) + catchQty;
                }

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

                // Decrement stock
                const remainingStock = Math.max(0, zoneEco.currentStock - 1);
                const isDepletedNow = isZoneFishingPaused(remainingStock, zoneEco.maxStock, zoneEco.isDepleted);
                currentEcosystem[zoneId] = {
                  ...zoneEco,
                  currentStock: remainingStock,
                  isDepleted: isDepletedNow,
                };

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
        } // end if (totalWorkforce > 0)

        // Autonomous workers tick (legacy — kept for backward compat, but main logic is unified below)
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

        // --- Diurnal Labor Cycle & Circadian Clock Setup ---
        const clock = getCircadianClock(now, state.farmEpochStart || now);
        let updatedSpecialistWorkers = state.specialistWorkers ? { ...state.specialistWorkers } : createDefaultSpecialistWorkers();
        let newPayrollVaultCoins = state.payrollVaultCoins || 0;
        let newStaffPantry = state.staffPantry ? { ...state.staffPantry } : {};

        // Offline Catch-Up (process sequential 30-min shifts for elapsed time)
        if (state.lastTick && now - state.lastTick >= DAY_CYCLE_MS) {
          const elapsedCycles = Math.min(Math.floor((now - state.lastTick) / DAY_CYCLE_MS), 24);
          const offlineRes = processOfflineShiftCycles({
            unifiedWorkers: state.unifiedWorkers,
            specialistWorkers: updatedSpecialistWorkers,
            payrollVaultCoins: newPayrollVaultCoins,
            staffPantry: newStaffPantry,
            elapsedCycles,
          });
          newPayrollVaultCoins = offlineRes.payrollVaultCoins;
          newStaffPantry = offlineRes.staffPantry;
          Object.assign(state.unifiedWorkers, offlineRes.updatedUnifiedWorkers);
          Object.assign(updatedSpecialistWorkers, offlineRes.updatedSpecialistWorkers);
          if (offlineRes.desertedWorkers.length > 0) {
            state.addNotification(`🚨 Desertion Notice: ${offlineRes.desertedWorkers.join(', ')} deserted during extended absence!`, '⚠️', 'event');
          } else if (offlineRes.settledShiftsCount > 0) {
            state.addNotification(`🌅 Offline Shifts: Settled ${offlineRes.settledShiftsCount} shifts across ${elapsedCycles} elapsed days from Vault & Pantry!`, '📋', 'info');
          }
        }

        // --- Worker Hydration Metabolism & Thirst Dynamics (v3.5) ---
        const ambientTemp = hydroSimResult.updatedHydrology.weatherState?.temperatureC ?? 22;
        const currentCanteenLiters = state.bunkhouse?.canteenLiters ?? 60;
        const currentCanteenCap = state.bunkhouse?.canteenCapacityLiters ?? CANTEEN_DEFAULT_CAPACITY_LITERS;
        const currentTowerLiters = hydroSimResult.updatedHydrology.towerLiters;
        const currentColdDrinks = state.bunkhouse?.coldInfusedDrinks ?? 0;
        const hasColdBeverage = currentColdDrinks > 0;

        // Count active workers currently on duty across unified, specialist, and fishery crews
        let activeDutyWorkerCount = 0;
        if (!areWorkersPaused) {
          for (const role of Object.keys(state.unifiedWorkers || {}) as WorkerRole[]) {
            const w = state.unifiedWorkers[role];
            if (w?.isHired && !w.isPaused && w.moraleTier !== 'striking' && w.moraleTier !== 'deserted') {
              const testSched = getWorkerScheduleTelemetry({
                worker: w,
                roleOrId: role,
                baseDailyWage: WORKER_UPKEEP_ROSTER[role]?.baseDailyWage || 15,
                timestamp: now,
                epochStart: state.farmEpochStart || now,
                bunkhouseLevel: state.bunkhouse?.level || 1,
              });
              if (testSched.isOnDuty) activeDutyWorkerCount++;
            }
          }
          for (const sp of Object.values(updatedSpecialistWorkers)) {
            if (sp?.isHired && sp.isActive && !sp.isStriking && sp.moraleTier !== 'deserted') {
              activeDutyWorkerCount++;
            }
          }
          const fisheryPinned = state.fishery?.crew?.pinnedWorkers
            ? Object.values(state.fishery.crew.pinnedWorkers).reduce((a, b) => a + b, 0)
            : 0;
          activeDutyWorkerCount += fisheryPinned;
        }

        // Evaluate overall estate worker hydration state
        const hydrationTelemetry = evaluateHydrationTelemetry({
          temperatureC: ambientTemp,
          canteenLiters: currentCanteenLiters,
          towerLiters: currentTowerLiters,
          hasColdBeverage,
        });

        let newCanteenLiters = currentCanteenLiters;
        let newTowerLiters = currentTowerLiters;
        let totalWaterConsumed = state.bunkhouse?.totalWaterConsumedLiters ?? 0;
        let newColdDrinks = currentColdDrinks;

        // Micro-tick water deduction under physical mass conservation
        if (activeDutyWorkerCount > 0 && deltaSeconds > 0) {
          const waterNeeded = calculateMicroTickWaterConsumption(
            activeDutyWorkerCount,
            deltaSeconds,
            ambientTemp
          );

          if (waterNeeded > 0) {
            const deductRes = deductWorkerHydration({
              amountLiters: waterNeeded,
              currentCanteenLiters: newCanteenLiters,
              currentTowerLiters: newTowerLiters,
            });
            newCanteenLiters = deductRes.newCanteenLiters;
            newTowerLiters = deductRes.newTowerLiters;
            totalWaterConsumed += deductRes.deductedLiters;
            hydroSimResult.updatedHydrology.towerLiters = newTowerLiters;
          }

          // Consume cold beverage portions while active (1 drink per 600s shift per active worker)
          if (hasColdBeverage) {
            const drinkDrain = (activeDutyWorkerCount / 600) * deltaSeconds;
            newColdDrinks = Math.max(0, newColdDrinks - drinkDrain);
          }
        }

        // Auto-refill Canteen Cooler from Elevated Gravity Tower if enabled and below 30% capacity
        const isCanteenAutoRefill = state.bunkhouse?.autoRefillFromTower ?? true;
        if (isCanteenAutoRefill && newCanteenLiters < currentCanteenCap * 0.3 && newTowerLiters > 0) {
          const refillNeeded = currentCanteenCap - newCanteenLiters;
          const transferFromTower = Math.min(refillNeeded, newTowerLiters);
          newCanteenLiters += transferFromTower;
          newTowerLiters -= transferFromTower;
          hydroSimResult.updatedHydrology.towerLiters = newTowerLiters;
        }

        // Night Watch Replenishment Automation (off-shift draw from Cistern or Aquifer)
        const isNightWatchAuto = state.bunkhouse?.nightWatchAutomation ?? true;
        const isNightClock = clock.currentPeriod === 'night';
        if (isNightWatchAuto && isNightClock && newCanteenLiters < currentCanteenCap) {
          const nwRes = executeNightWatchHydrationAutomation({
            canteenLiters: newCanteenLiters,
            canteenCapacity: currentCanteenCap,
            cisternLiters: hydroSimResult.updatedHydrology.cisternLiters,
            aquiferLiters: hydroSimResult.updatedHydrology.aquiferLiters,
            deltaSeconds,
            isNightShift: true,
          });
          if (nwRes.pumpedLiters > 0) {
            newCanteenLiters = nwRes.newCanteenLiters;
            hydroSimResult.updatedHydrology.cisternLiters = nwRes.newCisternLiters;
            hydroSimResult.updatedHydrology.aquiferLiters = nwRes.newAquiferLiters;
          }
        }

        // Unified Worker Tick (v2.0) — 13 workers, 120-level scaling
        let unifiedWorkersModified = false;
        const updatedUnifiedWorkers = { ...state.unifiedWorkers };
        let updatedWorkerOverclocks = state.entityOverclocks;
        if (!areWorkersPaused) {
          for (const role of Object.keys(updatedUnifiedWorkers) as WorkerRole[]) {
            const worker = updatedUnifiedWorkers[role];
            const hasLegacyFarmhand = role === 'herder' && state.farmhands.some(fh => fh.role === 'herder');
            if (!worker || (!worker.isHired && !hasLegacyFarmhand)) continue;
            if (worker.isPaused) {
              worker.lastActionTimestamp = now;
              continue;
            }
            if (hasLegacyFarmhand && !worker.isHired) {
              worker.isHired = true;
            }

            const wOverclock = state.entityOverclocks?.[`worker_${role}`];
            const isWorkerExhausted = Boolean(wOverclock?.isExhausted && wOverclock?.exhaustedUntil && now < wOverclock.exhaustedUntil);
            if (isWorkerExhausted) {
              continue; // Worker resting during fatigue exhaustion
            }
            const isWorkerOverclocked = Boolean(wOverclock?.isOverclocked && (!wOverclock.expiresAt || now < wOverclock.expiresAt));
            const wMultiplier = isWorkerOverclocked ? wOverclock.speedMultiplier : 1.0;

            const morale = worker.moraleTier || 'content';
            if (morale === 'striking' || morale === 'deserted') {
              worker.lastActionTimestamp = now;
              continue; // 0% efficiency, complete halt during strike
            }
            const moraleMultiplier = getMoraleSpeedMultiplier(morale);

            const cfg = WORKER_REGISTRY[role];
            const schedule = getWorkerScheduleTelemetry({
              worker,
              roleOrId: role,
              baseDailyWage: WORKER_UPKEEP_ROSTER[role]?.baseDailyWage || 15,
              timestamp: now,
              epochStart: state.farmEpochStart || now,
              bunkhouseLevel: state.bunkhouse?.level || 1,
              hydrationState: hydrationTelemetry.state,
            });

            // Update real-time stamina
            worker.stamina = schedule.stamina;

            // Bunkhouse stamina recovery & well-rested perk
            if (schedule.phase === 'sleeping' && schedule.stamina >= 100 && (state.bunkhouse?.level || 1) >= 2) {
              worker.wellRested = true;
            }

            // Scheduled Clock-Out Settlement at the end of the 8-hour shift
            if (hasWorkerReachedClockOut(schedule.shiftType, clock.cycleElapsedSeconds) && worker.lastClockOutDay !== clock.currentDay) {
              const clockOutRes = processSingleWorkerClockOut({
                workerName: cfg.name,
                roleOrId: role,
                currentMissedCycles: worker.missedCycles || 0,
                currentMoraleTier: worker.moraleTier,
                payrollVaultCoins: newPayrollVaultCoins,
                staffPantry: newStaffPantry,
                activeWorkersCount: Object.values(updatedUnifiedWorkers).filter(w => w.isHired).length,
                wageMultiplier: (state.isHardcoreMode && isExtremeWeather) ? 2.0 : 1.0,
                isHardcoreMode: Boolean(state.isHardcoreMode),
              });
              newPayrollVaultCoins = clockOutRes.newPayrollCoins;
              newStaffPantry = clockOutRes.newStaffPantry;
              worker.missedCycles = clockOutRes.newMissedCycles;
              worker.moraleTier = clockOutRes.newMoraleTier;
              worker.lastClockOutDay = clock.currentDay;
              worker.wellRested = false; // completed shift consumes the rest buff
              unifiedWorkersModified = true;

              if (clockOutRes.isStriking) {
                if (!worker.strikeStartedAt) {
                  worker.strikeStartedAt = now;
                  worker.desertionDeadline = now + DESERTION_DURATION_SEC * 1000;
                }
              }

              if (clockOutRes.notificationMessage && (clockOutRes.isStriking || clockOutRes.newMoraleTier === 'grumbling' || Math.random() < 0.1)) {
                state.addNotification(clockOutRes.notificationMessage, clockOutRes.isStriking ? '🛑' : '🪙', 'coin');
              }
            }

            // Desertion Hard Deadline Check (2 Real-World Hours on Strike)
            // Suppressed when tower is in Stage 2 or 3 (loadSheddingStage >= 2 / <= 80L) — workers never abandon the farm during water emergencies!
            if (worker.moraleTier === 'striking') {
              if (loadSheddingStage >= 2) {
                // Suppress abandonment during emergency water rationing & lockdown
                if (worker.desertionDeadline) {
                  worker.desertionDeadline = now + DESERTION_DURATION_SEC * 1000;
                }
              } else if (!worker.strikeStartedAt) {
                worker.strikeStartedAt = now;
                worker.desertionDeadline = now + DESERTION_DURATION_SEC * 1000;
                unifiedWorkersModified = true;
              } else if (worker.desertionDeadline && now >= worker.desertionDeadline) {
                worker.isHired = false;
                worker.moraleTier = 'deserted';
                worker.strikeStartedAt = null;
                worker.desertionDeadline = null;
                worker.level = 1;
                unifiedWorkersModified = true;
                playDefeatSound();
                state.addNotification(`🪧 Worker Desertion: ${cfg.name} waited 2 hours with unresolved grievances and has permanently abandoned the farm! 🚪`, '🚪', 'event');
                continue;
              }
            }

            // Chores immediately pause the moment the worker transitions into off-duty rest!
            if (!schedule.isOnDuty) {
              worker.lastActionTimestamp = now;
              continue;
            }

            const shiftSpeedMultiplier = schedule.speedMultiplier;
            // Outfit bonus for herder
            const hasHerderOutfit = role === 'herder' && state.farmhands.some(fh => fh.role === 'herder' && fh.equippedOutfit === 'herders_chaps');
            const outfitSpeed = hasHerderOutfit ? 0.7 : 1.0;
            // Hardened Chitin Trowel: equips field hands to perform plot tilling, planting, and clearing 30% faster
            const hasChitinTrowel = Boolean(
              state.workshopLoadout?.equippedTool === 'hardened_chitin_trowel' ||
              (state.barn?.hardened_chitin_trowel || 0) > 0
            );
            const trowelSpeed = (hasChitinTrowel && role === 'farmer') ? 0.70 : 1.0;
            // Load-Shedding Crew Rationing & Dehydration speed penalty (-30% in Stage 2, -50% in Stage 3)
            const towerWorkerSpeedPenalty = loadSheddingStage === 3 ? 0.50 : (loadSheddingStage === 2 ? 0.70 : 1.0);
            const effectiveInterval = ((workerEffectiveInterval(role, worker.level) * outfitSpeed * trowelSpeed) / (wMultiplier * moraleMultiplier * shiftSpeedMultiplier)) / towerWorkerSpeedPenalty;
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
                if (role === 'herder') {
                  // Herder: Auto-feed hungry animals using silo feed & auto-collect animal products!
                  // 1. Auto-feed pass
                  let feedAvail = newSilo.feed || 0;
                  if (feedAvail > 0) {
                    newAnimals = newAnimals.map(a => {
                      const aOverclock = state.entityOverclocks?.[`animal_${a.id}`];
                      const isAnimalExhausted = Boolean(
                        (aOverclock?.isExhausted && aOverclock?.exhaustedUntil && now < aOverclock.exhaustedUntil) ||
                        (a.isExhausted && a.exhaustedUntil && now < a.exhaustedUntil)
                      );
                      if (a.fed || a.productReady || a.age === 'elder' || isAnimalExhausted) return a;
                      const feedNeeded = ANIMALS[a.species].feedPerCycle;
                      if (feedAvail < feedNeeded) return a;
                      feedAvail -= feedNeeded;
                      worker.stats.totalItemsProduced += 1;
                      return { ...a, fed: true, fedAt: now };
                    });
                    newSilo.feed = feedAvail;
                  }

                  // 2. Auto-collect pass
                  newAnimals = newAnimals.map(a => {
                    if (!a.productReady || a.cyclesRemaining <= 0) return a;

                    const breedDef = BREED_REGISTRY[a.breedId];
                    const speciesDef = ANIMALS[a.species];
                    const aOverclock = state.entityOverclocks?.[`animal_${a.id}`];
                    const bonusYield = (aOverclock?.isOverclocked && aOverclock.bonusYield) ? aOverclock.bonusYield : 0;
                    const prodKey = breedDef ? breedDef.primaryProductKey : speciesDef.product;
                    const baseAmt = (breedDef ? breedDef.baseYieldAmount : speciesDef.productYield) + bonusYield;
                    const totalYield = baseAmt * multiplier;

                    if (worker.autoSell) {
                      const prodDef = PRODUCTS[prodKey as keyof typeof PRODUCTS];
                      const price = prodDef?.sellPrice || 10;
                      const earned = price * totalYield;
                      newCoins += earned;
                      worker.stats.totalCoinsEarned += earned;
                    } else {
                      newBarn[prodKey] = (newBarn[prodKey] || 0) + totalYield;
                      worker.stats.totalItemsProduced += totalYield;
                    }

                    // Secondary bonus drops
                    if (breedDef?.bonusDrop && Math.random() < breedDef.bonusDrop.chance) {
                      if (breedDef.bonusDrop.itemKey) {
                        newBarn[breedDef.bonusDrop.itemKey] = (newBarn[breedDef.bonusDrop.itemKey] || 0) + 1;
                      }
                      if (breedDef.bonusDrop.directCoins) {
                        newCoins += breedDef.bonusDrop.directCoins;
                      }
                    }

                    // Gem milestones
                    const totalCompleted = a.cyclesCompletedTotal + 1;
                    if (breedDef?.gemMilestoneEveryN && totalCompleted % breedDef.gemMilestoneEveryN === 0) {
                      const gemAmt = a.species === 'pig' ? 2 : 1;
                      newGems += gemAmt;
                      worker.stats.totalGemsEarned += gemAmt;
                    }

                    // Codex discovery
                    if (!newCodex[a.breedId]) {
                      newCodex[a.breedId] = true;
                      if (breedDef) newGems += breedDef.codexGemReward;
                    }

                    // Tier-based XP
                    newXp += a.tier === 'legendary' ? 25 : a.tier === 'rare' ? 15 : a.tier === 'uncommon' ? 8 : 5;

                    const newCyclesRemaining = a.cyclesRemaining - 1;
                    const isElder = newCyclesRemaining <= 0;

                    return {
                      ...a,
                      fed: false,
                      fedAt: null,
                      productReady: false,
                      cyclesRemaining: newCyclesRemaining,
                      cyclesCompletedTotal: totalCompleted,
                      age: isElder ? 'elder' : a.age,
                    };
                  });

                  if (worker.autoSell) {
                    const payout = workerAutoSellPayout(role, worker.level) * multiplier;
                    newCoins += payout;
                    worker.stats.totalCoinsEarned += payout;
                  }
                } else if (worker.autoSell) {
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
                    // Barn Overseer in hoard: auto-fills animal troughs & feeds hungry livestock
                    let feedAvail = newSilo.feed || 0;
                    if (feedAvail > 0) {
                      newAnimals = newAnimals.map(a => {
                        const aOverclock = state.entityOverclocks?.[`animal_${a.id}`];
                        const isAnimalExhausted = Boolean(
                          (aOverclock?.isExhausted && aOverclock?.exhaustedUntil && now < aOverclock.exhaustedUntil) ||
                          (a.isExhausted && a.exhaustedUntil && now < a.exhaustedUntil)
                        );
                        if (a.fed || a.productReady || a.age === 'elder' || isAnimalExhausted) return a;
                        const feedNeeded = ANIMALS[a.species].feedPerCycle;
                        if (feedAvail < feedNeeded) return a;
                        feedAvail -= feedNeeded;
                        return { ...a, fed: true, fedAt: now };
                      });
                      newSilo.feed = feedAvail;
                    }
                  } else if (cfg.hoardItem) {
                    // Deposit hoard item to barn or silo
                    let qty = multiplier;

                    // Specialized bonus for feed millers when raw crops are available
                    const barnLocks = state.barnItemLocks || {};
                    const isWheatLocked = barnLocks['wheat']?.isLockedForWorkers;
                    const isCornLocked = barnLocks['corn']?.isLockedForWorkers;
                    const isCarrotLocked = barnLocks['carrot']?.isLockedForWorkers;
                    const isSoyLocked = barnLocks['soybean']?.isLockedForWorkers;

                    if (role === 'feed_miller_wheat' && !isWheatLocked && (newSilo.wheat || 0) > 2) {
                      newSilo.wheat -= 1;
                      qty += multiplier * 2;
                    } else if (role === 'feed_miller_corn' && !isCornLocked && (newSilo.corn || 0) > 2) {
                      newSilo.corn -= 1;
                      qty += multiplier * 3;
                    } else if (role === 'feed_miller_carrot' && !isCarrotLocked && (newSilo.carrot || 0) > 2) {
                      newSilo.carrot -= 1;
                      qty += multiplier * 3;
                    } else if (role === 'feed_miller_soy' && !isSoyLocked && (newSilo.soybean || 0) > 2) {
                      newSilo.soybean -= 1;
                      qty += multiplier * 4;
                    }

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
            newSurpriseAlert = null;

            state.addNotification(`⚡ SURPRISE EVENT: ${def.name} approaches!`, def.emoji, 'event');
            sendLocalEventPushNotification(`⚡ Horizon Alert: ${def.name}`, def.premise);
          }
        }

        // High-Stakes Sudden Events disabled per user request (no intrusive popping modals or penalties)
        let currentSuddenEvent: ActiveEventInstance | null = null;
        let newSuddenEventTime: number | null = null;
        let newSuddenFlash: any = null;
        let newSuddenModalOpen = false;
        let updatedWorkersPaused = state.workersPausedUntil;

        // --- Specialist Workers Diurnal Labor Telemetry & Clock-Out Settlement ---
        for (const spId of Object.keys(updatedSpecialistWorkers) as SpecialistWorkerId[]) {
          const sp = updatedSpecialistWorkers[spId];
          if (!sp || !sp.isHired) continue;

          const spSchedule = getWorkerScheduleTelemetry({
            worker: sp,
            roleOrId: spId,
            baseDailyWage: WORKER_UPKEEP_ROSTER[spId]?.baseDailyWage || 20,
            timestamp: now,
            epochStart: state.farmEpochStart || now,
            bunkhouseLevel: state.bunkhouse?.level || 1,
          });

          sp.stamina = spSchedule.stamina;
          if (spSchedule.phase === 'sleeping' && spSchedule.stamina >= 100 && (state.bunkhouse?.level || 1) >= 2) {
            sp.wellRested = true;
          }

          if (hasWorkerReachedClockOut(spSchedule.shiftType, clock.cycleElapsedSeconds) && sp.lastClockOutDay !== clock.currentDay) {
            const spClockOutRes = processSingleWorkerClockOut({
              workerName: WORKER_UPKEEP_ROSTER[spId]?.name || spId,
              roleOrId: spId,
              currentMissedCycles: sp.missedCycles || 0,
              currentMoraleTier: sp.moraleTier,
              payrollVaultCoins: newPayrollVaultCoins,
              staffPantry: newStaffPantry,
              activeWorkersCount: Object.values(updatedSpecialistWorkers).filter(w => w.isHired).length,
              wageMultiplier: (state.isHardcoreMode && isExtremeWeather) ? 2.0 : 1.0,
              isHardcoreMode: Boolean(state.isHardcoreMode),
            });
            newPayrollVaultCoins = spClockOutRes.newPayrollCoins;
            newStaffPantry = spClockOutRes.newStaffPantry;
            sp.missedCycles = spClockOutRes.newMissedCycles;
            sp.moraleTier = spClockOutRes.newMoraleTier;
            sp.isStriking = spClockOutRes.isStriking;
            sp.lastClockOutDay = clock.currentDay;
            sp.wellRested = false;

            if (spClockOutRes.isStriking) {
              if (!sp.strikeStartedAt) {
                sp.strikeStartedAt = now;
                sp.desertionDeadline = now + DESERTION_DURATION_SEC * 1000;
              }
            }

            if (spClockOutRes.notificationMessage && (spClockOutRes.isStriking || spClockOutRes.newMoraleTier === 'grumbling' || Math.random() < 0.1)) {
              state.addNotification(spClockOutRes.notificationMessage, spClockOutRes.isStriking ? '🛑' : '🪙', 'coin');
            }
          }

          // Desertion Hard Deadline Check for Specialists
          if (sp.moraleTier === 'striking') {
            if (!sp.strikeStartedAt) {
              sp.strikeStartedAt = now;
              sp.desertionDeadline = now + DESERTION_DURATION_SEC * 1000;
            } else if (sp.desertionDeadline && now >= sp.desertionDeadline) {
              sp.isHired = false;
              sp.isActive = false;
              sp.isStriking = false;
              sp.moraleTier = 'deserted';
              sp.strikeStartedAt = null;
              sp.desertionDeadline = null;
              sp.unpaidWages = 0;
              playDefeatSound();
              state.addNotification(`🪧 Worker Desertion: ${WORKER_UPKEEP_ROSTER[spId]?.name || spId} waited 2 hours with unresolved grievances and has permanently departed! 🚪`, '🚪', 'event');
            }
          }
        }

        // --- Paddock Wrangler (Tessa) Auto-Feed Pass ---
        const isTessaActive = Boolean(
          !areWorkersPaused &&
          updatedSpecialistWorkers.worker_wrangler_tessa?.isHired &&
          updatedSpecialistWorkers.worker_wrangler_tessa?.isActive &&
          !updatedSpecialistWorkers.worker_wrangler_tessa?.isStriking &&
          getWorkerScheduleTelemetry({
            worker: updatedSpecialistWorkers.worker_wrangler_tessa,
            roleOrId: 'worker_wrangler_tessa',
            baseDailyWage: 20,
            timestamp: now,
            epochStart: state.farmEpochStart || now,
            bunkhouseLevel: state.bunkhouse?.level || 1,
          }).isOnDuty
        );

        const currentWranglerPolicy = state.wranglerPolicy || DEFAULT_WRANGLER_POLICY;
        const currentBarnLocks = state.barnItemLocks || {};

        if (isTessaActive && currentWranglerPolicy.isEnabled) {
          const eligibleFeedIds = Object.keys(ITEM_CATALOG_META).filter(k => ITEM_CATALOG_META[k].isEdibleFeed);

          newAnimals = newAnimals.map(a => {
            const aOverclock = state.entityOverclocks?.[`animal_${a.id}`];
            const isAnimalExhausted = Boolean(
              (aOverclock?.isExhausted && aOverclock?.exhaustedUntil && now < aOverclock.exhaustedUntil) ||
              (a.isExhausted && a.exhaustedUntil && now < a.exhaustedUntil)
            );
            if (a.fed || a.productReady || a.age === 'elder' || isAnimalExhausted) return a;

            // Find valid feed items that are not locked and have surplus over reserve floor
            const validCandidates = eligibleFeedIds.filter(fId => {
              if (currentBarnLocks[fId]?.isLockedForWorkers) return false;
              const customFloor = currentBarnLocks[fId]?.customReserveThreshold;
              const floor = customFloor !== undefined ? customFloor : (fId === 'feed' ? 0 : currentWranglerPolicy.globalReserveFloor);
              const currentStock = (newSilo[fId] || 0) + (newBarn[fId] || 0);
              return currentStock > floor;
            });

            if (validCandidates.length === 0) return a;

            // Sort candidate feed items based on policy strategy
            validCandidates.sort((candA, candB) => {
              const metaA = ITEM_CATALOG_META[candA];
              const metaB = ITEM_CATALOG_META[candB];

              if (currentWranglerPolicy.strategy === 'budget_saver') {
                // Cheapest first
                if (metaA.baseValue !== metaB.baseValue) {
                  return metaA.baseValue - metaB.baseValue;
                }
                const stockA = (newSilo[candA] || 0) + (newBarn[candA] || 0);
                const stockB = (newSilo[candB] || 0) + (newBarn[candB] || 0);
                return stockB - stockA; // higher surplus first
              } else {
                // gourmet_breeder: favorite crops of species first!
                const favs = SPECIES_FAVORITE_CROPS[a.species] || [];
                const isFavA = favs.includes(candA);
                const isFavB = favs.includes(candB);

                if (isFavA && !isFavB) return -1;
                if (!isFavA && isFavB) return 1;

                if (isFavA && isFavB) {
                  // Prefer higher nutritional richness among favorites
                  return metaB.baseValue - metaA.baseValue;
                }

                // If neither is favorite, fall back to cheapest
                return metaA.baseValue - metaB.baseValue;
              }
            });

            const chosenFeedId = validCandidates[0];
            if ((newSilo[chosenFeedId] || 0) > 0) {
              newSilo[chosenFeedId] -= 1;
            } else if ((newBarn[chosenFeedId] || 0) > 0) {
              newBarn[chosenFeedId] -= 1;
            }

            return {
              ...a,
              fed: true,
              fedAt: now,
            };
          });
        }

        // --- Incubator & Stable Master (Elric) Auto-Hatch Pass ---
        const isElricActive = Boolean(
          !areWorkersPaused &&
          updatedSpecialistWorkers.worker_stablemaster_elric?.isHired &&
          updatedSpecialistWorkers.worker_stablemaster_elric?.isActive &&
          !updatedSpecialistWorkers.worker_stablemaster_elric?.isStriking &&
          getWorkerScheduleTelemetry({
            worker: updatedSpecialistWorkers.worker_stablemaster_elric,
            roleOrId: 'worker_stablemaster_elric',
            baseDailyWage: 25,
            timestamp: now,
            epochStart: state.farmEpochStart || now,
            bunkhouseLevel: state.bunkhouse?.level || 1,
          }).isOnDuty
        );

        let finalActiveBreedings = state.activeBreedings;
        if (isElricActive) {
          const readyBreedings = state.activeBreedings.filter(b => now - b.startedAt >= b.durationMs);
          if (readyBreedings.length > 0) {
            readyBreedings.forEach(rb => {
              state.claimHatchedAnimal(rb.id);
            });
            finalActiveBreedings = get().activeBreedings;
          }
        } else {
          let hasNewReadyEgg = false;
          finalActiveBreedings = state.activeBreedings.map(b => {
            if (now - b.startedAt >= b.durationMs && !b.notified) {
              hasNewReadyEgg = true;
              return { ...b, notified: true };
            }
            return b;
          });
          if (hasNewReadyEgg) {
            state.addNotification('🥚 An incubator egg is ready to hatch! Visit your Incubator to reveal it!', '✨', 'discovery');
          }
        }

        // --- Wilderness Caravaner (Orin) Auto-Haul from Reserve to Paddocks ---
        const isOrinActive = Boolean(
          !areWorkersPaused &&
          updatedSpecialistWorkers.worker_caravaner_orin?.isHired &&
          updatedSpecialistWorkers.worker_caravaner_orin?.isActive &&
          !updatedSpecialistWorkers.worker_caravaner_orin?.isStriking &&
          getWorkerScheduleTelemetry({
            worker: updatedSpecialistWorkers.worker_caravaner_orin,
            roleOrId: 'worker_caravaner_orin',
            baseDailyWage: 30,
            timestamp: now,
            epochStart: state.farmEpochStart || now,
            bunkhouseLevel: state.bunkhouse?.level || 1,
          }).isOnDuty
        );

        let finalReserve = [...(state.livestockReserve || [])];
        if (isOrinActive && finalReserve.length > 0) {
          const nextReserve: AnimalInstance[] = [];
          let movedCount = 0;

          for (const animal of finalReserve) {
            const currentCount = newAnimals.filter(a => a.species === animal.species).length;
            const maxCap = state.animalCapacity[animal.species] || ANIMALS[animal.species].capacity;
            const currentTierCount = newAnimals.filter(a => a.tier === animal.tier).length;
            const maxTierCap = animal.tier === 'common' ? 50 : 4;

            if (currentCount < maxCap && currentTierCount < maxTierCap) {
              newAnimals.push(animal);
              movedCount++;
            } else {
              nextReserve.push(animal);
            }
          }

          if (movedCount > 0) {
            finalReserve = nextReserve;
            state.addNotification(`🚜 Orin wheeled ${movedCount} crated beast(s) from Reserve to matching Pasture paddocks!`, '🚜', 'discovery');
          }
        }

    // --- Prehistoric Amber Bio-Lab & Sanctuary Closed-Loop Simulation Tick ---
    const currentBioLab = get().amberBioLab || createDefaultAmberBioLab();
    const currentSanctuary = get().prehistoricSanctuary || createDefaultSanctuary();
    const towerLiters = get().hydrology?.towerLiters || 0;
    let notificationsToAdd: { message: string; emoji: string; type: string }[] = [];

    // 1. Amber Bio-Lab Closed-Loop Incubation Chamber Tick (Cryo-Standby Preservation Lock)
    const cryoGraceSec = currentBioLab.cryoInsulationInstalled ? 172800 : 86400; // 48h or 24h
    const updatedChambers = (currentBioLab.chambers || []).map(ch => {
      if (ch.status === 'INCUBATING') {
        if (towerLiters <= 0) {
          // Elevated Gravity Tower ran dry (0L)! Enters CRYO_STANDBY with full preservation guarantee
          notificationsToAdd.push({
            message: `❄️ Amber Bio-Lab Cryo-Standby Engaged: Chamber #${ch.chamberId} cooling loop locked! Incubation paused safely (Grace buffer: ${currentBioLab.cryoInsulationInstalled ? '48' : '24'}h).`,
            emoji: '❄️🛡️',
            type: 'alert',
          });
          return {
            ...ch,
            status: 'CRYO_STANDBY' as const,
            uncooledSecElapsed: (ch.uncooledSecElapsed || 0) + 1,
          };
        } else {
          // Healthy closed-loop cooling: advance progress
          const deltaPct = (1 / Math.max(1, ch.durationSec)) * 100;
          const nextPct = Math.min(100, ch.progressPct + deltaPct);
          if (nextPct >= 100) {
            const spec = ch.speciesId ? PREHISTORIC_SPECIES_REGISTRY[ch.speciesId] : null;
            notificationsToAdd.push({
              message: `🌟 Incubation Chamber #${ch.chamberId} completed! ${spec?.name || 'Ancient specimen'} is ready to revive into Sanctuary.`,
              emoji: spec?.emoji || '🧬',
              type: 'discovery',
            });
            return {
              ...ch,
              status: 'READY_TO_REVIVE' as const,
              progressPct: 100,
            };
          }
          return {
            ...ch,
            progressPct: nextPct,
          };
        }
      } else if (ch.status === 'CRYO_STANDBY' || (ch.status as string) === 'SUSPENDED_UNCOOLED') {
        if (towerLiters > 0) {
          // Gravity Tower replenished! Cooling resumed
          return {
            ...ch,
            status: 'INCUBATING' as const,
          };
        } else {
          const newElapsed = (ch.uncooledSecElapsed || 0) + 1;
          // Specimen integrity 100% preserved within grace buffer (24h or 48h)
          if (newElapsed >= cryoGraceSec) {
            notificationsToAdd.push({
              message: `💀 Critical Bio-Lab Failure: Chamber #${ch.chamberId} specimen decayed after exceeding ${currentBioLab.cryoInsulationInstalled ? '48' : '24'}-hour grace buffer!`,
              emoji: '💀',
              type: 'alert',
            });
            return {
              ...ch,
              status: 'DECAYED' as const,
              uncooledSecElapsed: newElapsed,
            };
          }
          return {
            ...ch,
            status: 'CRYO_STANDBY' as const,
            uncooledSecElapsed: newElapsed,
          };
        }
      }
      return ch;
    });

    // 2. Prehistoric Sanctuary Habitat Enclosures Tick
    const updatedEnclosures = { ...(currentSanctuary.enclosures || {}) };
    for (const [encKey, enc] of Object.entries(updatedEnclosures)) {
      if (enc.specimenCount > 0) {
        const spec = PREHISTORIC_SPECIES_REGISTRY[enc.speciesId];
        // Food trough consumption: -0.05 liters per second per living specimen
        const newTrough = Math.max(0, enc.troughFoodLiters - 0.05 * enc.specimenCount);
        const isStarving = newTrough <= 0;

        let nextHarvestProgress = enc.harvestProgressSec;
        let nextHarvestReady = enc.harvestReadyCount;

        if (!isStarving && spec) {
          nextHarvestProgress += 1;
          if (nextHarvestProgress >= spec.harvestPeriodSec) {
            nextHarvestReady += 1;
            nextHarvestProgress = 0;
            notificationsToAdd.push({
              message: `✨ ${spec.name} in ${enc.name} shed new ${spec.harvestName}! Ready to collect.`,
              emoji: spec.harvestEmoji,
              type: 'event',
            });
          }
        }

        updatedEnclosures[encKey as EnclosureTypeId] = {
          ...enc,
          troughFoodLiters: newTrough,
          isStarving,
          harvestProgressSec: nextHarvestProgress,
          harvestReadyCount: nextHarvestReady,
        };
      }
    }

    set({
      amberBioLab: {
        ...currentBioLab,
        chambers: updatedChambers,
      },
      prehistoricSanctuary: {
        ...currentSanctuary,
        enclosures: updatedEnclosures,
      },
    });

    for (const n of notificationsToAdd) {
      get().addNotification(n.message, n.emoji, n.type as any);
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

        // Active Radar Crisis System disabled per user request (no intrusive popping modals or crop/animal penalties)
        let currentCrisis: CrisisEvent | null = null;
        let newCrisisTime: number = state.nextCrisisTime || (now + 86400000);

        // Check VIP rush, high-stakes & advance futures orders countdown and sanitize any overlevel orders
        let ordersModified = false;
        let clientRepModified = false;
        const currentClientRep = { ...(state.clientReputation || DEFAULT_CLIENT_REPUTATION) };

        const updatedOrders = state.orders.map(order => {
          const reqItems = order.requiredItems || (order.requested?.map((r: any) => ({ itemId: r.itemId })) || []);
          const hasOverlevelItem = reqItems.some((it: any) => (ITEM_UNLOCK_LEVELS[it.itemId] || 1) > state.level);
          if (hasOverlevelItem) {
            ordersModified = true;
            return generateDeliveryOrder(state.level, undefined, order.clientId);
          }
          const isTimed = order.type === 'rush' || order.type === 'futures' || order.isRushOrder || order.isHighStakes;
          const expiryTime = order.expiresAt || order.rushExpiresAt;
          if (isTimed && expiryTime && now >= expiryTime) {
            ordersModified = true;
            const isHighStakes = order.isHighStakes;
            const breachPercent = isHighStakes ? 0.20 : (state.isHardcoreMode ? 0.20 : 0.10);
            const minFee = isHighStakes ? 80 : (state.isHardcoreMode ? 25 : 15);
            const fee = order.penaltyCoins || order.breachFee || Math.max(minFee, Math.round((order.rewards?.coins || order.coinReward || 50) * breachPercent));
            newCoins = Math.max(0, newCoins - fee);

            let repLostText = '';
            if (isHighStakes && order.clientId && currentClientRep[order.clientId]) {
              clientRepModified = true;
              const repPenalty = order.penaltyReputation || 15;
              currentClientRep[order.clientId] = {
                ...currentClientRep[order.clientId],
                xp: Math.max(0, (currentClientRep[order.clientId].xp || 0) - repPenalty),
              };
              repLostText = ` & -${repPenalty} ${CLIENT_DEFINITIONS[order.clientId]?.name || 'Client'} Rep`;
            }

            playDefeatSound();
            state.addNotification(
              `⚠️ ${isHighStakes ? '👑 High-Stakes Contract' : (order.type === 'futures' ? 'Advance Futures' : 'VIP Rush')} expired! Paid breach fee of ${fee} coins${repLostText}.`,
              '📉',
              'event'
            );
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
        const { xp: finalXp, level: finalLevel } = levelUpCheck(newXp, state.level);

        set({
          plots: newPlots,
          animals: newAnimals,
          domesticTroughs: updatedDomesticTroughs,
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
            zoneEcosystem: currentEcosystem,
            pondWaterVolume: Math.round(currentPondVolume * 10) / 10,
          },
          autonomousWorkers: newWorkers,
          unifiedWorkers: unifiedWorkersModified ? updatedUnifiedWorkers : state.unifiedWorkers,
          activeEvent: newActiveEvent,
          lastEventTriggerTime: newLastEventTriggerTime,
          activeBreedings: finalActiveBreedings,
          livestockReserve: finalReserve,
          specialistWorkers: updatedSpecialistWorkers,
          payrollVaultCoins: newPayrollVaultCoins,
          staffPantry: newStaffPantry,
          lastSettlementTimestamp: state.lastSettlementTimestamp || now,
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
          clientReputation: clientRepModified ? currentClientRep : state.clientReputation,
          activeCrisis: currentCrisis,
          nextCrisisTime: newCrisisTime,
          wildExpedition: updatedExpedition,
          marketTrends: updatedMarketTrends,
          marketNextRefresh: updatedMarketRefresh,
          marketNewsTicker: updatedNewsTicker,
          xp: finalXp,
          level: finalLevel,
          entityOverclocks: updatedWorkerOverclocks,
          hydrology: hydroSimResult.updatedHydrology,
          ...(offlineHydrologyReportToSet ? { offlineHydrologyReport: offlineHydrologyReportToSet } : {}),
          bunkhouse: {
            ...state.bunkhouse,
            canteenLiters: Math.round(newCanteenLiters * 10) / 10,
            canteenCapacityLiters: currentCanteenCap,
            coldInfusedDrinks: Math.round(newColdDrinks * 10) / 10,
            totalWaterConsumedLiters: Math.round(totalWaterConsumed * 10) / 10,
          },
          notifications: state.notifications.filter(
            n => !n.message.includes('Population Depleted') && !n.message.includes('fish stock emptied')
          ),
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
            const pLevel = p.level || 1;
            const soilTier = getSoilTier(pLevel);
            const soilSpeedMultiplier = 1 + (soilTier.speedBonusPct / 100);
            const waterBoost = (p.isWatered || soilTier.autoHydrate) ? 2.0 : 1.0;
            const growMs = (cropDef.growTimeSec * 1000 * auraMultiplier) / (soilSpeedMultiplier * waterBoost);
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

        // 4. Advance Closed-Loop Hydrological Estate Simulation
        const lastTickTime = state.lastTick || (now - elapsedMs);
        const startClock = getCircadianClock(lastTickTime, state.farmEpochStart || lastTickTime);
        const hydroOffline = simulateOfflineHydrology({
          hydrology: state.hydrology || createDefaultHydrologyState(state.level),
          plots: newPlots,
          unlockedPlots: state.unlockedPlots,
          farmLevel: state.level,
          startCycleElapsedSeconds: startClock.cycleElapsedSeconds,
          startDay: startClock.currentDay,
          totalElapsedSeconds: elapsedMs / 1000,
        });

        let offlineHydrologyReport: OfflineHydrologyResolutionResult | null = null;
        if (elapsedMs >= 300000) {
          const elapsedSec = Math.round(elapsedMs / 1000);
          const loadout = state.workshopLoadout || createDefaultWorkshopLoadout();
          const activeChambers = (state.amberBioLab?.chambers || []).filter(c => c.status === 'INCUBATING' || (c.status as string) === 'CRYO_STANDBY').length;
          const activeWorkers = Object.values(state.unifiedWorkers || {}).filter(w => w.isHired && !w.isPaused).length;
          const currentHydro = state.hydrology || createDefaultHydrologyState(state.level);

          offlineHydrologyReport = resolveOfflineHydrologyCatchUp({
            initialTowerLiters: currentHydro.towerLiters,
            initialAquiferLiters: currentHydro.aquiferLiters,
            initialCisternLiters: currentHydro.cisternLiters,
            cisternMaxLiters: currentHydro.cisternMaxLiters || 1200,
            aquiferCapacityLiters: currentHydro.aquiferCapacityLiters || 3000,
            elapsedOfflineSeconds: elapsedSec,
            isSluiceOpen: currentHydro.sluiceGatesOpen,
            sluiceDischargeRateLps: currentHydro.liveDischargeLitersPerSec || 1.5,
            activeBioLabChambersCount: activeChambers,
            activeWorkerCount: activeWorkers,
            hasEmergencySiphon: Boolean(loadout.emergencySiphonInstalled),
            hasInsulationSleeves: Boolean(state.amberBioLab?.cryoInsulationInstalled),
            siphonMode: currentHydro.siphonMode || 'continuous',
            siphonSourcePreference: currentHydro.siphonSourcePreference || 'smart_highest',
            towerCapacityLiters: currentHydro.towerCapacityLiters || 800,
          });

          hydroOffline.updatedHydrology.towerLiters = offlineHydrologyReport.finalTowerLiters;
          hydroOffline.updatedHydrology.aquiferLiters = offlineHydrologyReport.finalAquiferLiters;
          if (offlineHydrologyReport.finalCisternLiters !== undefined) {
            hydroOffline.updatedHydrology.cisternLiters = offlineHydrologyReport.finalCisternLiters;
          }
          hydroOffline.updatedHydrology.totalSiphonedLiters = (hydroOffline.updatedHydrology.totalSiphonedLiters || 0) + offlineHydrologyReport.totalSiphonedLiters;
          hydroOffline.updatedHydrology.loadSheddingStage = offlineHydrologyReport.stageReached;
          hydroOffline.updatedHydrology.isCropConservationActive = offlineHydrologyReport.stageReached >= 1;
          hydroOffline.updatedHydrology.isCrewRationingActive = offlineHydrologyReport.stageReached >= 2;
          hydroOffline.updatedHydrology.isCryoStandbyActive = offlineHydrologyReport.isCryoStandbyActive;
          if (offlineHydrologyReport.stageReached >= 1) {
            hydroOffline.updatedHydrology.sluiceGatesOpen = false;
          }
        }

        // High-Stakes Contracts Expiration & Auto-Liquidation Check
        let updatedContracts = state.highStakesContracts || [];
        let contractsChanged = false;
        let contractLiquidatedCoins = 0;
        const currentRep = { ...(state.factionReputation || { royal_crown: 25, paleo_guild: 30, mercantile_caravan: 40 }) };
        let newCrownSeedLock = state.crownSeedLockUntil || 0;
        let newGuildCycles = state.guildHazardCyclesRemaining || 0;
        let newMercantileCooldown = state.mercantileCooldownUntil || 0;

        if (updatedContracts.length > 0) {
          updatedContracts = updatedContracts.map(c => {
            if (c.status === 'active' && now >= c.expiresAt) {
              contractsChanged = true;
              const hasEscrowItems = c.manifest.some(s => s.escrowQuantity > 0);
              if (hasEscrowItems) {
                const scrapCoins = calculateScrapLiquidationValue(c);
                contractLiquidatedCoins += scrapCoins;
                currentRep[c.factionId] = Math.max(-100, (currentRep[c.factionId] || 0) - c.penalties.reputationLoss);
                if (c.factionId === 'royal_crown') {
                  newCrownSeedLock = now + 2 * 3600 * 1000;
                } else if (c.factionId === 'paleo_guild') {
                  newGuildCycles = 3;
                } else {
                  newMercantileCooldown = now + 20 * 60 * 1000;
                }
                state.addNotification(
                  `⌛ Contract Expired: Shipping deadline missed for ${c.title}! Escrowed goods liquidated for ${scrapCoins} scrap coins (10%) and ${FACTION_REGISTRY[c.factionId].name} trust was damaged!`,
                  '⌛',
                  'event'
                );
              } else {
                state.addNotification(
                  `⌛ Procurement Rotation: Procurement deadline elapsed for ${c.title}. Replacement contract arrived.`,
                  '⌛',
                  'info'
                );
              }
              return generateHighStakesContract(c.factionId, state.level);
            }
            return c;
          });
        }

        // Perishable Batches Spoilage Check
        const updatedBatches = { ...(state.perishableBatches || {}) };
        const updatedSilo = { ...state.silo };
        const updatedBarn = { ...state.barn };
        let batchesChanged = false;

        for (const [itemId, batchList] of Object.entries(updatedBatches)) {
          if (!batchList || batchList.length === 0) continue;
          const def = PERISHABLE_DEFINITIONS[itemId];
          const maxLifetime = def?.baseDecayDurationSec || 900;
          const remainingBatches: PerishableBatch[] = [];
          let spoiledQty = 0;

          for (const b of batchList) {
            const pct = calculateFreshnessPercent(b.harvestedAt, b.maxLifetimeSec || maxLifetime, now);
            if (pct <= 0) {
              spoiledQty += b.quantity;
              batchesChanged = true;
            } else {
              remainingBatches.push(b);
            }
          }

          if (spoiledQty > 0) {
            updatedBatches[itemId] = remainingBatches;
            if (itemId in updatedSilo) {
              updatedSilo[itemId] = Math.max(0, (updatedSilo[itemId] || 0) - spoiledQty);
            } else {
              updatedBarn[itemId] = Math.max(0, (updatedBarn[itemId] || 0) - spoiledQty);
            }
            state.addNotification(
              `🥀 Spoilage Alert: ${spoiledQty}x ${def?.name || itemId} spoiled and converted into organic rot!`,
              '🥀',
              'event'
            );
          }
        }

        set({
          plots: hydroOffline.updatedPlots,
          hydrology: hydroOffline.updatedHydrology,
          animals: newAnimals,
          productionQueues: newQueues,
          ...(contractsChanged ? {
            highStakesContracts: updatedContracts,
            factionReputation: currentRep,
            crownSeedLockUntil: newCrownSeedLock,
            guildHazardCyclesRemaining: newGuildCycles,
            mercantileCooldownUntil: newMercantileCooldown,
            coins: state.coins + contractLiquidatedCoins,
          } : {}),
          ...(batchesChanged ? {
            perishableBatches: updatedBatches,
            silo: updatedSilo,
            barn: updatedBarn,
          } : {}),
          ...(offlineHydrologyReport ? { offlineHydrologyReport } : {}),
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
          suddenEventFlash: null,
          isSuddenEventModalOpen: false,
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
          moistureLevel: Math.min(80.0, Math.max(50.0, (plot.moistureLevel ?? 40.0) + 30.0)),
          desiccatedSeconds: 0,
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
              moistureLevel: Math.min(80.0, Math.max(50.0, (plot.moistureLevel ?? 40.0) + 30.0)),
              desiccatedSeconds: 0,
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

      upgradePlotLevel: (plotId: number) => {
        const state = get();
        const plot = state.plots[plotId];
        if (!plot || plotId >= state.unlockedPlots) return false;
        const currentLvl = plot.level || 1;
        if (currentLvl >= MAX_PLOT_SOIL_LEVEL) {
          state.addNotification(`Plot #${plotId + 1} is already at Maximum Tier (Celestial Soil)! ✨`, '⭐', 'info');
          return false;
        }
        const nextLvl = currentLvl + 1;
        const nextTier = getSoilTier(nextLvl);
        if (state.coins < nextTier.upgradeCostCoins) {
          state.addNotification(`Insufficient coins! Upgrading Plot #${plotId + 1} to Level ${nextLvl} (${nextTier.name}) requires 🪙${nextTier.upgradeCostCoins}.`, '💰', 'info');
          return false;
        }

        const newPlots = [...state.plots];
        newPlots[plotId] = {
          ...plot,
          level: nextLvl,
          isWatered: nextTier.autoHydrate ? true : plot.isWatered,
        };

        playCashRegisterSound();
        state.addNotification(`🌟 Upgraded Plot #${plotId + 1} to Level ${nextLvl} (${nextTier.name})! ${nextTier.description}`, '✨', 'event');
        set({
          coins: state.coins - nextTier.upgradeCostCoins,
          plots: newPlots,
          isDirty: true,
        });
        return true;
      },

      upgradeAllPlots: () => {
        const state = get();
        const visiblePlots = state.plots.slice(0, state.unlockedPlots);
        const minLvl = Math.min(...visiblePlots.map(p => p.level || 1));
        if (minLvl >= MAX_PLOT_SOIL_LEVEL) {
          state.addNotification('All plots are already at Maximum Tier (Level 5)! 🌟', '⭐', 'info');
          return false;
        }
        const targetPlots = visiblePlots.filter(p => (p.level || 1) === minLvl);
        const nextLvl = minLvl + 1;
        const nextTier = getSoilTier(nextLvl);
        const totalCost = targetPlots.length * nextTier.upgradeCostCoins;

        if (state.coins < totalCost) {
          state.addNotification(`Need 🪙${totalCost} to upgrade ${targetPlots.length} plots to Level ${nextLvl} (${nextTier.name})!`, '💰', 'info');
          return false;
        }

        const newPlots = state.plots.map(p => {
          if (p.id < state.unlockedPlots && (p.level || 1) === minLvl) {
            return {
              ...p,
              level: nextLvl,
              isWatered: nextTier.autoHydrate ? true : p.isWatered,
            };
          }
          return p;
        });

        playCashRegisterSound();
        state.addNotification(`🎉 Batch Upgraded ${targetPlots.length} plots to Level ${nextLvl} (${nextTier.name})!`, '✨', 'event');
        set({
          coins: state.coins - totalCost,
          plots: newPlots,
          isDirty: true,
        });
        return true;
      },

      unlockNextPlot: () => {
        const state = get();
        if (state.unlockedPlots >= state.plots.length || state.unlockedPlots >= MAX_FARM_PLOTS) {
          state.addNotification(`Maximum farm plots (${MAX_FARM_PLOTS}) already unlocked! 🌾`, '⭐', 'info');
          return false;
        }
        const cost = getPlotUnlockCost(state.unlockedPlots);
        if (state.coins < cost) {
          state.addNotification(`Need 🪙${cost} to unlock Plot #${state.unlockedPlots + 1}!`, '💰', 'info');
          return false;
        }

        const newUnlocked = state.unlockedPlots + 1;
        playCashRegisterSound();
        state.addNotification(`🔓 Unlocked Plot #${newUnlocked}! Farm expanded to ${newUnlocked} plots!`, '🌾', 'event');
        set({
          coins: state.coins - cost,
          unlockedPlots: newUnlocked,
          isDirty: true,
        });
        return true;
      },

      // Closed-Loop Hydrological Actions
      setSluiceModalOpen: (open: boolean) => {
        set({ isSluiceModalOpen: open });
      },

      toggleSluiceGates: (open?: boolean) => {
        const state = get();
        const currentHydro = state.hydrology || createDefaultHydrologyState(state.level);
        const newOpen = open !== undefined ? open : !currentHydro.sluiceGatesOpen;

        if (newOpen) {
          const check = canOpenGates(currentHydro, state.plots, state.unlockedPlots);
          if (!check.canOpen) {
            state.addNotification(`🛑 Sluice Gates Locked: ${check.reason}`, '🔒', 'info');
            return;
          }
          state.addNotification(`🌊 Master Sluice Gates Opened! Gravity discharge feeding Plots 01–${state.unlockedPlots}.`, '🌊', 'info');
        } else {
          state.addNotification('🛑 Sluice Gates Closed: Canal flow secured.', '🔒', 'info');
        }

        set({
          hydrology: {
            ...currentHydro,
            sluiceGatesOpen: newOpen,
          },
          isDirty: true,
        });
      },

      setAutoShutoffMoisture: (thresholdPct: number) => {
        const state = get();
        const clamped = Math.max(50, Math.min(95, Math.round(thresholdPct)));
        const currentHydro = state.hydrology || createDefaultHydrologyState(state.level);
        set({
          hydrology: {
            ...currentHydro,
            autoShutoffMoisture: clamped,
          },
          isDirty: true,
        });
        state.addNotification(`⚙️ Sluice Regulator Calibrated: Auto-shutoff target set to ${clamped}% moisture.`, '🎯', 'info');
      },

      pumpAquiferToTower: (liters = 200) => {
        const state = get();
        const currentHydro = state.hydrology || createDefaultHydrologyState(state.level);
        const towerSpace = currentHydro.towerCapacityLiters - currentHydro.towerLiters;

        if (towerSpace <= 0) {
          state.addNotification('🗼 Elevated Gravity Tower is already at maximum capacity (800L)!', '🗼', 'info');
          return false;
        }
        if (currentHydro.aquiferLiters <= 0) {
          state.addNotification('🚰 Aquifer Depleted: Ground water table is dry (0L)!', '⚠️', 'info');
          return false;
        }

        const pumpMultiplier = currentHydro.isAquiferStressed || currentHydro.hasSedimentInLine ? 0.5 : 1.0;
        const requested = liters * pumpMultiplier;
        const transferAmount = Math.min(requested, currentHydro.aquiferLiters, towerSpace);
        if (transferAmount <= 0) return false;

        // Atomic deduction from Deep Aquifer source reservoir (Bug 5)
        const newAquifer = Math.max(0, currentHydro.aquiferLiters - transferAmount);
        const newTower = Math.min(currentHydro.towerCapacityLiters, currentHydro.towerLiters + transferAmount);

        set({
          hydrology: {
            ...currentHydro,
            aquiferLiters: Math.round(newAquifer * 10) / 10,
            towerLiters: Math.round(newTower * 10) / 10,
          },
          isDirty: true,
        });

        playRapidTapSound(1);
        state.addNotification(`⛲ Deep Pump Activated: Transferred +${Math.round(transferAmount)}L from Aquifer to Elevated Tower!`, '⛲', 'info');
        return true;
      },

      transferCisternToTower: (liters = 200) => {
        const state = get();
        const currentHydro = state.hydrology || createDefaultHydrologyState(state.level);
        const towerSpace = currentHydro.towerCapacityLiters - currentHydro.towerLiters;

        if (towerSpace <= 0) {
          state.addNotification('🗼 Elevated Gravity Tower is already at maximum capacity (800L)!', '🗼', 'info');
          return false;
        }
        if (currentHydro.cisternLiters <= 0) {
          state.addNotification('🌧️ Rain Catchment Cistern is empty (0L)! Wait for rainstorm or night dew.', '💧', 'info');
          return false;
        }

        const transferAmount = Math.min(liters, currentHydro.cisternLiters, towerSpace);
        if (transferAmount <= 0) return false;

        // Atomic deduction from Rain Cistern source reservoir (Bug 5)
        const newCistern = Math.max(0, currentHydro.cisternLiters - transferAmount);
        const newTower = Math.min(currentHydro.towerCapacityLiters, currentHydro.towerLiters + transferAmount);

        set({
          hydrology: {
            ...currentHydro,
            cisternLiters: Math.round(newCistern * 10) / 10,
            towerLiters: Math.round(newTower * 10) / 10,
          },
          isDirty: true,
        });

        playRapidTapSound(1);
        state.addNotification(`💧 Cistern Transfer: Shifted +${Math.round(transferAmount)}L rain reserve to Elevated Tower!`, '💧', 'info');
        return true;
      },

      clearSedimentInLine: () => {
        const state = get();
        const currentHydro = state.hydrology || createDefaultHydrologyState(state.level);
        set({
          hydrology: {
            ...currentHydro,
            hasSedimentInLine: false,
          },
          isDirty: true,
        });
        state.addNotification('🧹 Intake Line Cleared: Pump sediment purged. Full extraction velocity restored!', '🚰', 'info');
      },

      clearWitheredCrop: (plotId: number) => {
        const state = get();
        const plot = state.plots[plotId];
        if (!plot) return false;

        const newPlots = [...state.plots];
        const pLevel = plot.level || 1;
        const soilTier = getSoilTier(pLevel);

        newPlots[plotId] = {
          id: plotId,
          crop: null,
          plantedAt: null,
          ready: false,
          isWatered: soilTier.autoHydrate ? true : false,
          wateredUntil: null,
          level: pLevel,
          moistureLevel: plot.moistureLevel !== undefined ? plot.moistureLevel : 50.0,
          desiccatedSeconds: 0,
          waterloggedSeconds: 0,
          isWithered: false,
          hasRootRot: false,
        };

        set({ plots: newPlots, isDirty: true });
        state.addNotification(`🌾 Plot #${plotId + 1} Cleared: Removed withered crop debris with a hoe. Bed prepared for planting!`, '🧹', 'info');
        return true;
      },

      deSiltCanals: () => {
        const state = get();
        const currentHydro = state.hydrology || createDefaultHydrologyState(state.level);
        set({
          hydrology: {
            ...currentHydro,
            isCloggedWithDebris: false,
          },
          isDirty: true,
        });
        state.addNotification('🧹 Canal Grates De-Silted: Silt and leaf litter removed. Gravity channels fully restored!', '🌊', 'info');
      },

      deployDewScreens: () => {
        const state = get();
        const currentHydro = state.hydrology || createDefaultHydrologyState(state.level);
        const maxCistern = currentHydro.cisternMaxLiters || getCisternCapacity(state.level);
        const newCistern = Math.min(maxCistern, currentHydro.cisternLiters + 20);

        set({
          hydrology: {
            ...currentHydro,
            cisternLiters: Math.round(newCistern * 10) / 10,
            dewHarvestedToday: true,
          },
          isDirty: true,
        });
        state.addNotification('🌙 Condensation Screens Deployed: Captured +20L of pure night dew into rain cistern!', '💧', 'info');
        return true;
      },

      setHydrologyWeather: (weather: WeatherProfileId | 'clear' | 'light_rain' | 'downpour') => {
        const state = get();
        const profileId = resolveWeatherProfileId(weather);
        const profileDef = WEATHER_PROFILES[profileId] || WEATHER_PROFILES.sunny;
        const currentHydro = state.hydrology || createDefaultHydrologyState(state.level);
        const newAtmosphere = createDefaultWeatherState(profileId);
        set({
          hydrology: {
            ...currentHydro,
            weatherCondition: profileId,
            weatherState: newAtmosphere,
            isRainbowActive: profileId === 'sunshower',
            // CRITICAL: Weather change MUST NEVER alter manual sluice gate state (Bug 3)
            sluiceGatesOpen: currentHydro.sluiceGatesOpen,
          },
          isDirty: true,
        });
        state.addNotification(`Atmospheric Conditions Shifted: ${profileDef.emoji} ${profileDef.name} active.`, profileDef.emoji, 'info');
      },

      toggleEmergencySpillway: () => {
        const state = get();
        const currentHydro = state.hydrology || createDefaultHydrologyState(state.level);
        const newSpillwayOpen = !currentHydro.isSpillwayOpen;
        set({
          hydrology: {
            ...currentHydro,
            isSpillwayOpen: newSpillwayOpen,
            spillwayDivertingLitersPerSec: newSpillwayOpen ? 120 : 0,
          },
          isDirty: true,
        });
        if (newSpillwayOpen) {
          state.addNotification('🚨 Emergency Spillway Opened! Diverting 120 L/sec runoff to off-map creek (-10%/sec field purge).', '🚨', 'event');
        } else {
          state.addNotification('🛑 Emergency Spillway Closed: Off-map runoff diversion secured.', '🛑', 'info');
        }
      },

      openEmergencySpillway: () => {
        const state = get();
        const currentHydro = state.hydrology || createDefaultHydrologyState(state.level);
        if (currentHydro.isSpillwayOpen) return;
        set({
          hydrology: {
            ...currentHydro,
            isSpillwayOpen: true,
            spillwayDivertingLitersPerSec: 120,
          },
          isDirty: true,
        });
        state.addNotification('🚨 Emergency Spillway Opened! Diverting 120 L/sec runoff to off-map creek (-10%/sec field purge).', '🚨', 'event');
      },

      closeEmergencySpillway: () => {
        const state = get();
        const currentHydro = state.hydrology || createDefaultHydrologyState(state.level);
        if (!currentHydro.isSpillwayOpen) return;
        set({
          hydrology: {
            ...currentHydro,
            isSpillwayOpen: false,
            spillwayDivertingLitersPerSec: 0,
          },
          isDirty: true,
        });
        state.addNotification('🛑 Emergency Spillway Closed: Off-map runoff diversion secured.', '🛑', 'info');
      },

      toggleSiphonMode: () => {
        const state = get();
        const currentHydro = state.hydrology || createDefaultHydrologyState(state.level);
        const newMode = currentHydro.siphonMode === 'emergency' ? 'continuous' : 'emergency';
        set({
          hydrology: {
            ...currentHydro,
            siphonMode: newMode,
          },
          isDirty: true,
        });
        if (newMode === 'continuous') {
          state.addNotification('⚡ Siphon Valve: Continuous Artesian Inflow Engaged (+2.0 L/s maintaining full tower pressure)!', '🚰', 'discovery');
        } else {
          state.addNotification('🛡️ Siphon Valve: Emergency Reserve Mode Active (activates only when tower ≤ 80L).', '🛡️', 'info');
        }
      },

      cycleSiphonSourcePreference: () => {
        const state = get();
        const currentHydro = state.hydrology || createDefaultHydrologyState(state.level);
        const currentPref = currentHydro.siphonSourcePreference || 'smart_highest';
        const nextPref: 'smart_highest' | 'cistern' | 'aquifer' =
          currentPref === 'smart_highest'
            ? 'cistern'
            : currentPref === 'cistern'
            ? 'aquifer'
            : 'smart_highest';

        set({
          hydrology: {
            ...currentHydro,
            siphonSourcePreference: nextPref,
          },
          isDirty: true,
        });

        if (nextPref === 'smart_highest') {
          state.addNotification('🔄 Siphon Manifold: Smart Auto Mode (Draws from whichever reservoir has higher water level %)!', '💧', 'discovery');
        } else if (nextPref === 'cistern') {
          state.addNotification('🌧️ Siphon Manifold: Rain Cistern Priority (Prioritizes surface rain catchment).', '🌧️', 'info');
        } else {
          state.addNotification('🚰 Siphon Manifold: Deep Aquifer Priority (Prioritizes deep subterranean aquifer).', '🚰', 'info');
        }
      },

      setSiphonSourcePreference: (preference: 'smart_highest' | 'cistern' | 'aquifer') => {
        const state = get();
        const currentHydro = state.hydrology || createDefaultHydrologyState(state.level);
        set({
          hydrology: {
            ...currentHydro,
            siphonSourcePreference: preference,
          },
          isDirty: true,
        });
      },

      setHydrologyReservoirLevel: (reservoir: 'cistern' | 'aquifer' | 'tower', liters: number) => {
        const state = get();
        const currentHydro = state.hydrology || createDefaultHydrologyState(state.level);
        const updated = { ...currentHydro };
        if (reservoir === 'cistern') {
          updated.cisternLiters = Math.max(0, Math.min(updated.cisternMaxLiters, Math.round(liters * 10) / 10));
        } else if (reservoir === 'aquifer') {
          updated.aquiferLiters = Math.max(0, Math.min(updated.aquiferCapacityLiters, Math.round(liters * 10) / 10));
        } else if (reservoir === 'tower') {
          updated.towerLiters = Math.max(0, Math.min(updated.towerCapacityLiters, Math.round(liters * 10) / 10));
        }
        set({ hydrology: updated, isDirty: true });
      },

      upgradeTowerStorageTier: () => {
        const state = get();
        const currentHydro = state.hydrology || createDefaultHydrologyState(state.level);
        const currentTier = currentHydro.towerTier || 1;
        const nextTier = currentTier + 1;
        const nextConfig = TOWER_STORAGE_TIERS[nextTier];
        if (!nextConfig) {
          state.addNotification('Elevated Gravity Tower is already at maximum Tier 5 (50,000L Mega-Citadel)!', '🏰', 'info');
          return false;
        }
        if (state.coins < nextConfig.costCoins) {
          state.addNotification(`Insufficient coins! Upgrading to ${nextConfig.name} requires 🪙${nextConfig.costCoins.toLocaleString()}.`, '⚠️', 'info');
          return false;
        }
        if (state.level < nextConfig.minLevel) {
          state.addNotification(`Farm level too low! Requires Farm Level ${nextConfig.minLevel}.`, '🔒', 'info');
          return false;
        }
        set({
          coins: state.coins - nextConfig.costCoins,
          hydrology: {
            ...currentHydro,
            towerTier: nextTier,
            towerCapacityLiters: nextConfig.capacityLiters,
          },
          isDirty: true,
        });
        state.addNotification(`🏗️ Reservoir Upgraded! Elevated Gravity Tower expanded to ${nextConfig.name} (${nextConfig.capacityLiters.toLocaleString()}L, +${nextConfig.surgeLps} L/s surge throughput).`, nextConfig.icon, 'event');
        return true;
      },

      upgradeCisternStorageTier: () => {
        const state = get();
        const currentHydro = state.hydrology || createDefaultHydrologyState(state.level);
        const currentTier = currentHydro.cisternTier || 1;
        const nextTier = currentTier + 1;
        const nextConfig = CISTERN_STORAGE_TIERS[nextTier];
        if (!nextConfig) {
          state.addNotification('Rain Catchment Cistern is already at maximum Tier 5 (75,000L Mega-Basin)!', '🌊', 'info');
          return false;
        }
        if (state.coins < nextConfig.costCoins) {
          state.addNotification(`Insufficient coins! Upgrading to ${nextConfig.name} requires 🪙${nextConfig.costCoins.toLocaleString()}.`, '⚠️', 'info');
          return false;
        }
        if (state.level < nextConfig.minLevel) {
          state.addNotification(`Farm level too low! Requires Farm Level ${nextConfig.minLevel}.`, '🔒', 'info');
          return false;
        }
        set({
          coins: state.coins - nextConfig.costCoins,
          hydrology: {
            ...currentHydro,
            cisternTier: nextTier,
            cisternMaxLiters: nextConfig.capacityLiters,
          },
          isDirty: true,
        });
        state.addNotification(`🏗️ Basin Upgraded! Rain Catchment Cistern expanded to ${nextConfig.name} (${nextConfig.capacityLiters.toLocaleString()}L capacity).`, nextConfig.icon, 'event');
        return true;
      },

      upgradeAquiferStorageTier: () => {
        const state = get();
        const currentHydro = state.hydrology || createDefaultHydrologyState(state.level);
        const currentTier = currentHydro.aquiferTier || 1;
        const nextTier = currentTier + 1;
        const nextConfig = AQUIFER_STORAGE_TIERS[nextTier];
        if (!nextConfig) {
          state.addNotification('Deep Groundwater Aquifer is already at maximum Tier 5 (80,000L Abyssal Reserve)!', '💎', 'info');
          return false;
        }
        if (state.coins < nextConfig.costCoins) {
          state.addNotification(`Insufficient coins! Upgrading to ${nextConfig.name} requires 🪙${nextConfig.costCoins.toLocaleString()}.`, '⚠️', 'info');
          return false;
        }
        if (state.level < nextConfig.minLevel) {
          state.addNotification(`Farm level too low! Requires Farm Level ${nextConfig.minLevel}.`, '🔒', 'info');
          return false;
        }
        set({
          coins: state.coins - nextConfig.costCoins,
          hydrology: {
            ...currentHydro,
            aquiferTier: nextTier,
            aquiferCapacityLiters: nextConfig.capacityLiters,
          },
          isDirty: true,
        });
        state.addNotification(`🏗️ Aquifer Upgraded! Deep Groundwater Aquifer expanded to ${nextConfig.name} (${nextConfig.capacityLiters.toLocaleString()}L capacity).`, nextConfig.icon, 'event');
        return true;
      },

      setTowerStorageTier: (tier: number) => {
        const state = get();
        const config = TOWER_STORAGE_TIERS[tier];
        if (!config) return;
        const currentHydro = state.hydrology || createDefaultHydrologyState(state.level);
        set({
          hydrology: {
            ...currentHydro,
            towerTier: tier,
            towerCapacityLiters: config.capacityLiters,
            towerLiters: Math.min(currentHydro.towerLiters, config.capacityLiters),
          },
          isDirty: true,
        });
        state.addNotification(`Gravity Tower storage tier calibrated to ${config.badge}.`, config.icon, 'info');
      },

      setCisternStorageTier: (tier: number) => {
        const state = get();
        const config = CISTERN_STORAGE_TIERS[tier];
        if (!config) return;
        const currentHydro = state.hydrology || createDefaultHydrologyState(state.level);
        set({
          hydrology: {
            ...currentHydro,
            cisternTier: tier,
            cisternMaxLiters: config.capacityLiters,
            cisternLiters: Math.min(currentHydro.cisternLiters, config.capacityLiters),
          },
          isDirty: true,
        });
        state.addNotification(`Rain Catchment Cistern storage tier calibrated to ${config.badge}.`, config.icon, 'info');
      },

      setAquiferStorageTier: (tier: number) => {
        const state = get();
        const config = AQUIFER_STORAGE_TIERS[tier];
        if (!config) return;
        const currentHydro = state.hydrology || createDefaultHydrologyState(state.level);
        set({
          hydrology: {
            ...currentHydro,
            aquiferTier: tier,
            aquiferCapacityLiters: config.capacityLiters,
            aquiferLiters: Math.min(currentHydro.aquiferLiters, config.capacityLiters),
          },
          isDirty: true,
        });
        state.addNotification(`Deep Groundwater Aquifer storage tier calibrated to ${config.badge}.`, config.icon, 'info');
      },

      upgradeCanalTier: () => {
        const state = get();
        const currentHydro = state.hydrology || createDefaultHydrologyState(state.level);
        const currentTier = (currentHydro.canalTier || 1) as CanalTier;
        const nextTier = (currentTier + 1) as CanalTier;
        const nextConfig = CANAL_TIER_CONFIGS[nextTier];
        if (!nextConfig) {
          state.addNotification('Irrigation Canal network is already at maximum Tier 4 (Pressurized Brass Sprinkler Lattice)!', '⚙️', 'info');
          return false;
        }
        if (state.coins < nextConfig.costCoins) {
          state.addNotification(`Insufficient coins! Upgrading to ${nextConfig.name} requires 🪙${nextConfig.costCoins.toLocaleString()}.`, '⚠️', 'info');
          return false;
        }
        if (state.level < nextConfig.minLevel) {
          state.addNotification(`Farm level too low! Requires Farm Level ${nextConfig.minLevel}.`, '🔒', 'info');
          return false;
        }
        set({
          coins: state.coins - nextConfig.costCoins,
          hydrology: {
            ...currentHydro,
            canalTier: nextTier,
          },
          isDirty: true,
        });
        state.addNotification(`🏗️ Canal Infrastructure Upgraded! Network modernized to ${nextConfig.name} (0% seepage loss, ${nextConfig.badge}).`, nextConfig.icon, 'event');
        return true;
      },

      setCanalTier: (tier: CanalTier) => {
        const state = get();
        const config = CANAL_TIER_CONFIGS[tier];
        if (!config) return;
        const currentHydro = state.hydrology || createDefaultHydrologyState(state.level);
        set({
          hydrology: {
            ...currentHydro,
            canalTier: tier,
          },
          isDirty: true,
        });
        state.addNotification(`Canal infrastructure tier calibrated to ${config.badge}.`, config.icon, 'info');
      },

      resolveWorkerStrikeAccord: (workerId: string) => {
        const state = get();
        const isSpecialist = Boolean(state.specialistWorkers?.[workerId as SpecialistWorkerId]);
        const workerObj = isSpecialist
          ? state.specialistWorkers?.[workerId as SpecialistWorkerId]
          : state.unifiedWorkers?.[workerId as WorkerRole];

        if (!workerObj || !workerObj.isHired) return false;

        const dossier = calculateGrievanceDossier({
          workerId,
          workerObj,
          coins: state.coins,
          payrollVaultCoins: state.payrollVaultCoins || 0,
          staffPantry: state.staffPantry || {},
          silo: state.silo || {},
          barn: state.barn || {},
        });

        if (!dossier.canSignAccord) {
          state.addNotification(`Cannot sign accord! Need 🪙${dossier.totalSettleCoins} and ${dossier.rationsDemandedTotal}x ${dossier.dietaryCategoryLabel}.`, '⚠️', 'info');
          return false;
        }

        // 1. Deduct currency: Vault first, remainder from main wallet
        let remainingToDeduct = dossier.totalSettleCoins;
        let newVault = state.payrollVaultCoins || 0;
        let newCoins = state.coins;

        const vaultDeduct = Math.min(newVault, remainingToDeduct);
        newVault -= vaultDeduct;
        remainingToDeduct -= vaultDeduct;

        if (remainingToDeduct > 0) {
          newCoins -= remainingToDeduct;
        }

        // 2. Deduct food rations: Staff Pantry first, remainder from Silo (crops) or Barn (dairy/protein/meal)
        let rationsNeeded = dossier.rationsDemandedTotal;
        const newPantry = { ...state.staffPantry };
        const newSilo = { ...state.silo };
        const newBarn = { ...state.barn };

        for (const fItem of dossier.availableFoodItems) {
          if (rationsNeeded <= 0) break;
          const inPantry = newPantry[fItem.id] || 0;
          if (inPantry > 0) {
            const take = Math.min(inPantry, rationsNeeded);
            newPantry[fItem.id] -= take;
            if (newPantry[fItem.id] === 0) delete newPantry[fItem.id];
            rationsNeeded -= take;
          }
          if (rationsNeeded <= 0) break;
          if (dossier.dietaryCategory === 'crop') {
            const inSilo = newSilo[fItem.id] || 0;
            if (inSilo > 0) {
              const take = Math.min(inSilo, rationsNeeded);
              newSilo[fItem.id] -= take;
              rationsNeeded -= take;
            }
          } else {
            const inBarn = newBarn[fItem.id] || 0;
            if (inBarn > 0) {
              const take = Math.min(inBarn, rationsNeeded);
              newBarn[fItem.id] -= take;
              rationsNeeded -= take;
            }
          }
        }

        const now = Date.now();
        // 3. Update worker state
        if (isSpecialist) {
          const sId = workerId as SpecialistWorkerId;
          const currentSp = state.specialistWorkers[sId];
          set({
            coins: newCoins,
            payrollVaultCoins: newVault,
            staffPantry: newPantry,
            silo: newSilo,
            barn: newBarn,
            specialistWorkers: {
              ...state.specialistWorkers,
              [sId]: {
                ...currentSp,
                isStriking: false,
                moraleTier: 'content',
                missedCycles: 0,
                strikeStartedAt: null,
                desertionDeadline: null,
                sabbaticalGrantedAt: null,
                sabbaticalLockedDebtCoins: null,
                sabbaticalLockedFoodUnits: null,
                sabbaticalRemainingDesertionSec: null,
                appreciatedUntil: now + APPRECIATED_DURATION_MS,
              },
            },
            isDirty: true,
          });
        } else {
          const r = workerId as WorkerRole;
          const currentW = state.unifiedWorkers[r];
          set({
            coins: newCoins,
            payrollVaultCoins: newVault,
            staffPantry: newPantry,
            silo: newSilo,
            barn: newBarn,
            unifiedWorkers: {
              ...state.unifiedWorkers,
              [r]: {
                ...currentW,
                moraleTier: 'content',
                missedCycles: 0,
                strikeStartedAt: null,
                desertionDeadline: null,
                sabbaticalGrantedAt: null,
                sabbaticalLockedDebtCoins: null,
                sabbaticalLockedFoodUnits: null,
                sabbaticalRemainingDesertionSec: null,
                appreciatedUntil: now + APPRECIATED_DURATION_MS,
              },
            },
            isDirty: true,
          });
        }

        playVictoryChime();
        state.addNotification(`🤝 Full Accord Signed! ${dossier.workerName} returned to active duty with +10% Appreciated Staff speed boost!`, '🤝', 'event');
        return true;
      },

      grantWorkerSabbatical: (workerId: string) => {
        const state = get();
        const isSpecialist = Boolean(state.specialistWorkers?.[workerId as SpecialistWorkerId]);
        const workerObj = isSpecialist
          ? state.specialistWorkers?.[workerId as SpecialistWorkerId]
          : state.unifiedWorkers?.[workerId as WorkerRole];

        if (!workerObj || !workerObj.isHired) return false;

        const dossier = calculateGrievanceDossier({
          workerId,
          workerObj,
          coins: state.coins,
          payrollVaultCoins: state.payrollVaultCoins || 0,
          staffPantry: state.staffPantry || {},
          silo: state.silo || {},
          barn: state.barn || {},
        });

        const now = Date.now();
        if (isSpecialist) {
          const sId = workerId as SpecialistWorkerId;
          const currentSp = state.specialistWorkers[sId];
          set({
            specialistWorkers: {
              ...state.specialistWorkers,
              [sId]: {
                ...currentSp,
                isStriking: false,
                moraleTier: 'sabbatical',
                sabbaticalGrantedAt: now,
                sabbaticalLockedDebtCoins: dossier.totalSettleCoins,
                sabbaticalLockedFoodUnits: dossier.rationsDemandedTotal,
                sabbaticalRemainingDesertionSec: dossier.desertionRemainingSeconds,
                desertionDeadline: null,
              },
            },
            isDirty: true,
          });
        } else {
          const r = workerId as WorkerRole;
          const currentW = state.unifiedWorkers[r];
          set({
            unifiedWorkers: {
              ...state.unifiedWorkers,
              [r]: {
                ...currentW,
                moraleTier: 'sabbatical',
                sabbaticalGrantedAt: now,
                sabbaticalLockedDebtCoins: dossier.totalSettleCoins,
                sabbaticalLockedFoodUnits: dossier.rationsDemandedTotal,
                sabbaticalRemainingDesertionSec: dossier.desertionRemainingSeconds,
                desertionDeadline: null,
              },
            },
            isDirty: true,
          });
        }

        playClockTickSound();
        state.addNotification(`🛑 Unpaid Sabbatical: ${dossier.workerName} is on furlough at the village inn. Daily wages and food burn frozen to 0! Desertion timer paused.`, '🛑', 'event');
        return true;
      },

      terminateWorkerWithSeverance: (workerId: string) => {
        const state = get();
        const isSpecialist = Boolean(state.specialistWorkers?.[workerId as SpecialistWorkerId]);
        const workerObj = isSpecialist
          ? state.specialistWorkers?.[workerId as SpecialistWorkerId]
          : state.unifiedWorkers?.[workerId as WorkerRole];

        if (!workerObj || !workerObj.isHired) return false;

        const dossier = calculateGrievanceDossier({
          workerId,
          workerObj,
          coins: state.coins,
          payrollVaultCoins: state.payrollVaultCoins || 0,
          staffPantry: state.staffPantry || {},
          silo: state.silo || {},
          barn: state.barn || {},
        });

        if (state.coins < dossier.severanceFeeCoins) {
          state.addNotification(`Need 🪙${dossier.severanceFeeCoins} to pay Guild Severance fine!`, '💰', 'info');
          return false;
        }

        if (isSpecialist) {
          const sId = workerId as SpecialistWorkerId;
          const currentSp = state.specialistWorkers[sId];
          set({
            coins: state.coins - dossier.severanceFeeCoins,
            specialistWorkers: {
              ...state.specialistWorkers,
              [sId]: {
                ...currentSp,
                isHired: false,
                isActive: false,
                isStriking: false,
                unpaidWages: 0,
                moraleTier: 'content',
                missedCycles: 0,
                strikeStartedAt: null,
                desertionDeadline: null,
                sabbaticalGrantedAt: null,
                sabbaticalLockedDebtCoins: null,
                sabbaticalLockedFoodUnits: null,
                sabbaticalRemainingDesertionSec: null,
              },
            },
            isDirty: true,
          });
        } else {
          const r = workerId as WorkerRole;
          const currentW = state.unifiedWorkers[r];
          set({
            coins: state.coins - dossier.severanceFeeCoins,
            unifiedWorkers: {
              ...state.unifiedWorkers,
              [r]: {
                ...currentW,
                isHired: false,
                level: 1,
                isPaused: false,
                moraleTier: 'content',
                missedCycles: 0,
                strikeStartedAt: null,
                desertionDeadline: null,
                sabbaticalGrantedAt: null,
                sabbaticalLockedDebtCoins: null,
                sabbaticalLockedFoodUnits: null,
                sabbaticalRemainingDesertionSec: null,
              },
            },
            isDirty: true,
          });
        }

        playCashRegisterSound();
        state.addNotification(`📜 Contract Severed: Paid 🪙${dossier.severanceFeeCoins} severance to Labor Guild. All debt forgiven and bunkhouse capacity freed!`, '📜', 'event');
        return true;
      },

      recallWorkerFromSabbatical: (workerId: string) => {
        return get().resolveWorkerStrikeAccord(workerId);
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

        set({
          activeCrisis: newCrisis,
          isCrisisModalOpen: false,
          suddenEventFlash: null,
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
        let cost = calculateOverclockCost(baseCost, tier, streak);

        const isTessaActive = Boolean(
          state.specialistWorkers?.worker_wrangler_tessa?.isHired &&
          state.specialistWorkers?.worker_wrangler_tessa?.isActive &&
          !state.specialistWorkers?.worker_wrangler_tessa?.isStriking
        );
        if (entityType === 'animal' && isTessaActive) {
          cost = Math.max(1, Math.round(cost * 0.9)); // Tessa 10% animal overclock discount
        }

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

        // Boost Button Integration: The ⚡ Boost 1★ button instantly refills up to the newly expanded stockCap
        let updatedFishery = state.fishery;
        if (entityType === 'fishery') {
          const zId = entityId.replace('fishery_', '') as WaterZoneId;
          const currentEcosystem = state.fishery.zoneEcosystem || createDefaultZoneEcosystem();
          const eco = currentEcosystem[zId];
          if (eco) {
            const zTier = (eco.tier || 1) as ZoneUpgradeTier;
            const expandedCap = getZoneStockCap(zId, zTier);
            updatedFishery = {
              ...state.fishery,
              zoneEcosystem: {
                ...currentEcosystem,
                [zId]: {
                  ...eco,
                  currentStock: expandedCap,
                  maxStock: expandedCap,
                  isDepleted: false,
                  spawnProgressSec: 0,
                },
              },
            };
          }
        }

        set({
          coins: state.coins - cost,
          entityOverclocks: updatedOverclocks,
          buildingOverclocks: updatedBuildingOverclocks,
          animals: updatedAnimals,
          fishery: updatedFishery,
          isDirty: true,
        });

        const bonusMsg = tierConfig.bonusYield > 0 ? ` (+${tierConfig.bonusYield} yield!)` : '';
        const riskMsg = tierConfig.burnoutChance > 0 ? ` (${Math.round(tierConfig.burnoutChance * 100)}% burnout risk)` : ' (0% risk)';
        const boostRefillNote = entityType === 'fishery' ? ' (⚡ Full fish stock instantly refilled!)' : '';
        state.addNotification(`⚡ ${tierConfig.label} Activated! ${tierConfig.speedMultiplier}x speed${bonusMsg}${riskMsg}.${boostRefillNote}`, '🔥', 'info');
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
          if (item.type === 'universal_bio_dressing' && state.coins >= 25) {
            const newBarn = { ...state.barn };
            newBarn.universal_bio_dressing = (newBarn.universal_bio_dressing || 0) + 3;
            set({
              coins: state.coins - 25,
              barn: newBarn,
              isDirty: true,
            });
            playVictoryChime();
            state.addNotification(`🧪 Emergency Relief Buy: Purchased Universal Bio-Dressing (Pack of 3) for 🪙 25 Coins! Doses available: ${newBarn.universal_bio_dressing}`, '🧪', 'event');
            return true;
          }
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

        if (item.type === 'siphon_valve') {
          const newBarn = { ...state.barn };
          newBarn.emergency_siphon_valve = (newBarn.emergency_siphon_valve || 0) + 1;
          set({
            globalReputation: updatedGlobalRep,
            barn: newBarn,
            isDirty: true,
          });
          playVictoryChime();
          state.addNotification(`🚰 Purchased Emergency Siphon Float Valve! Ready for installation in Gravity Tower / Sluice Gate console.`, '🚰', 'event');
          return true;
        }

        if (item.type === 'universal_bio_dressing') {
          const newBarn = { ...state.barn };
          newBarn.universal_bio_dressing = (newBarn.universal_bio_dressing || 0) + 3;
          set({
            globalReputation: updatedGlobalRep,
            barn: newBarn,
            isDirty: true,
          });
          playVictoryChime();
          state.addNotification(`🧪 Purchased Universal Bio-Dressing (Pack of 3)! Restores exhausted plots to 100% full nutrient capacity instantly. Doses available: ${newBarn.universal_bio_dressing}`, '🧪', 'event');
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
          workshopLoadout: createDefaultWorkshopLoadout(),
          offlineHydrologyReport: null,
          silo: { wheat: 5, corn: 3, carrot: 0, strawberry: 0, soybean: 0, pumpkin: 0, cotton: 0, feed: 3, honey_comb: 0, wild_berries: 0, gold_nugget: 0 },
          barn: { egg: 2, milk: 1, wool: 0, truffle: 0, fish: 0, bread: 0, cheese: 0, pie: 0, sweater: 0, truffle_oil: 0, yarn: 0, quilted_blanket: 0, savory_fish_pie: 0, crab_bisque: 0, honey: 0, silk: 0 },
          plots: initialPlots, unlockedPlots: GRID_SIZE,
          animals: initialAnimals,
          animalCapacity: { chicken: 50, cow: 50, sheep: 50, pig: 50 },
          livestockReserve: [],
          productionQueues: { animal_feed: [], feed_mill: [], bakery: [], dairy: [], loom: [], press: [], tailor_shop: [], textiles: [], workshop: [] },
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
            zoneEcosystem: createDefaultZoneEcosystem(),
            pondWaterVolume: 3000,
          },
          autonomousWorkers: [],
          unifiedWorkers: initialUnifiedWorkers,
          isAllWorkersPaused: false,
          specialistWorkers: createDefaultSpecialistWorkers(),
          lastSpecialistWageTime: Date.now(),
          wranglerPolicy: DEFAULT_WRANGLER_POLICY,
          barnItemLocks: {},
          activeEvent: null,
          lastEventTriggerTime: Date.now(),
          notifications: [],
          breedingSlots: 1,
          activeBreedings: [],
          wilderness: createDefaultWilderness(),
          stagingWagonProvisions: {},
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
        isAllWorkersPaused: state.isAllWorkersPaused,
        specialistWorkers: state.specialistWorkers,
        lastSpecialistWageTime: state.lastSpecialistWageTime,
        wranglerPolicy: state.wranglerPolicy,
        barnItemLocks: state.barnItemLocks,
        livestockReserve: state.livestockReserve,
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
        stagingWagonProvisions: state.stagingWagonProvisions,
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
        // Worker Commissary & Dual-Roster Upkeep persistence
        payrollVaultCoins: state.payrollVaultCoins,
        staffPantry: state.staffPantry,
        lastSettlementTimestamp: state.lastSettlementTimestamp,
        farmEpochStart: state.farmEpochStart,
        bunkhouse: state.bunkhouse,
        workshopLoadout: state.workshopLoadout,
        hydrology: state.hydrology,
        amberBioLab: state.amberBioLab,
        prehistoricSanctuary: state.prehistoricSanctuary,
        isOfflineMode: state.isOfflineMode,
        offlineStartTime: state.offlineStartTime,
        lastOfflineSummary: state.lastOfflineSummary,
        offlineHistory: state.offlineHistory,
        isHardcoreMode: state.isHardcoreMode,
        highStakesContracts: state.highStakesContracts,
        factionReputation: state.factionReputation,
        perishableBatches: state.perishableBatches,
        crownSeedLockUntil: state.crownSeedLockUntil,
        guildHazardCyclesRemaining: state.guildHazardCyclesRemaining,
        mercantileCooldownUntil: state.mercantileCooldownUntil,
        lastTick: state.lastTick,
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<GameState>;
        const merged = { ...currentState, ...persisted };
        // Hardcore, Game Manager Dispatch, and Offline Modes disabled
        merged.isHardcoreMode = false;
        merged.isOfflineMode = false;
        merged.isDispatchModalOpen = false;

        if (!merged.highStakesContracts || merged.highStakesContracts.length === 0) {
          merged.highStakesContracts = [
            generateHighStakesContract('royal_crown', merged.level || 5),
            generateHighStakesContract('paleo_guild', merged.level || 5),
            generateHighStakesContract('mercantile_caravan', merged.level || 5),
          ];
        }
        if (!merged.factionReputation) {
          merged.factionReputation = {
            royal_crown: 25,
            paleo_guild: 30,
            mercantile_caravan: 40,
          };
        }
        if (!merged.perishableBatches) merged.perishableBatches = {};
        if (merged.crownSeedLockUntil === undefined) merged.crownSeedLockUntil = 0;
        if (merged.guildHazardCyclesRemaining === undefined) merged.guildHazardCyclesRemaining = 0;
        if (merged.mercantileCooldownUntil === undefined) merged.mercantileCooldownUntil = 0;

        // Migration: if fishery doesn't exist, create it
        if (!merged.fishery) {
          merged.fishery = {
            unlockedZones: ['zone_pond'],
            rodTier: 'bamboo',
            lastCatchTimestamps: { zone_pond: Date.now(), zone_river: 0, zone_estuary: 0, zone_lake: 0, zone_ocean: 0 },
            fishCodex: {},
            zoneEcosystem: createDefaultZoneEcosystem(),
            pondWaterVolume: 3000,
          };
        } else {
          if (!merged.fishery.zoneEcosystem) {
            merged.fishery.zoneEcosystem = createDefaultZoneEcosystem();
          } else {
            // Reconcile depleted flags and upgrade tiers: ensure tier is set and capacity matches
            for (const key of Object.keys(merged.fishery.zoneEcosystem) as WaterZoneId[]) {
              const eco = merged.fishery.zoneEcosystem[key];
              if (eco) {
                if (!eco.tier) eco.tier = 1;
                const expectedCap = getZoneStockCap(key, eco.tier);
                eco.maxStock = expectedCap;
                eco.isDepleted = isZoneFishingPaused(eco.currentStock, eco.maxStock, eco.isDepleted);
              }
            }
          }

          if (!merged.fishery.crew) {
            merged.fishery.crew = {
              policy: {
                sustainableRotation: true,
                catchHandling: 'auto-sell-common',
              },
              pinnedWorkers: {
                zone_pond: 0,
                zone_river: 0,
                zone_estuary: 0,
                zone_lake: 0,
                zone_ocean: 0,
              },
            };
          }
          if (merged.fishery.pondWaterVolume === undefined) {
            merged.fishery.pondWaterVolume = 3000;
          }
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
        if (!merged.productionQueues.workshop) {
          merged.productionQueues = { ...merged.productionQueues, workshop: [] };
        }
        if (merged.buildingOverclocks && !merged.buildingOverclocks.workshop) {
          merged.buildingOverclocks = {
            ...merged.buildingOverclocks,
            workshop: { isOverclocked: false, expiresAt: null, isExhausted: false, exhaustedUntil: null },
          };
        }
        if (!merged.workshopLoadout) {
          merged.workshopLoadout = createDefaultWorkshopLoadout();
        }

        // Migration: add missing state fields
        if (!merged.autonomousWorkers) merged.autonomousWorkers = [];
        if (!merged.unifiedWorkers) {
          merged.unifiedWorkers = createDefaultUnifiedWorkers();
        } else {
          const defaultWorkers = createDefaultUnifiedWorkers();
          for (const r of Object.keys(defaultWorkers) as WorkerRole[]) {
            if (!merged.unifiedWorkers[r]) {
              merged.unifiedWorkers[r] = defaultWorkers[r];
            } else {
              // Resilience Auto-Recovery: if worker has any level progress or accumulated stats, preserve hired state!
              const currentW = merged.unifiedWorkers[r];
              if (currentW.level > 1 || (currentW.stats?.totalItemsProduced || 0) > 0 || (currentW.stats?.totalCoinsEarned || 0) > 0) {
                currentW.isHired = true;
                if (currentW.moraleTier === 'deserted') {
                  currentW.moraleTier = 'content';
                  currentW.missedCycles = 0;
                }
              }
              if (currentW.isPaused === undefined) currentW.isPaused = false;
              if (currentW.moraleTier === undefined) currentW.moraleTier = 'content';
              if (currentW.missedCycles === undefined) currentW.missedCycles = 0;
              currentW.shiftType = 'morning';
              if (currentW.stamina === undefined) currentW.stamina = 100;
            }
          }
        }
        if (merged.isAllWorkersPaused === undefined) merged.isAllWorkersPaused = false;

        if (!merged.specialistWorkers) {
          merged.specialistWorkers = createDefaultSpecialistWorkers();
        } else {
          const defaultSpecialists = createDefaultSpecialistWorkers();
          for (const sId of Object.keys(defaultSpecialists) as SpecialistWorkerId[]) {
            if (!merged.specialistWorkers[sId]) {
              merged.specialistWorkers[sId] = defaultSpecialists[sId];
            } else {
              const currentSp = merged.specialistWorkers[sId];
              if ((currentSp.totalWagesPaid || 0) > 0 || currentSp.isStriking) {
                currentSp.isHired = true;
                if (currentSp.moraleTier === 'deserted') {
                  currentSp.moraleTier = 'content';
                  currentSp.missedCycles = 0;
                  currentSp.isStriking = false;
                }
              }
              if (currentSp.moraleTier === undefined) {
                currentSp.moraleTier = currentSp.isStriking ? 'striking' : 'content';
              }
              if (currentSp.missedCycles === undefined) currentSp.missedCycles = 0;
              currentSp.shiftType = 'morning';
              if (currentSp.stamina === undefined) currentSp.stamina = 100;
            }
          }
        }
        // Ensure plots array is hydrated with levels and capacity
        if (!merged.plots || !Array.isArray(merged.plots)) {
          merged.plots = initialPlots;
        } else {
          for (const p of merged.plots) {
            if (!p.level) p.level = 1;
          }
          if (merged.plots.length < MAX_FARM_PLOTS) {
            for (let i = merged.plots.length; i < MAX_FARM_PLOTS; i++) {
              merged.plots.push({
                id: i,
                crop: null,
                plantedAt: null,
                ready: false,
                isWatered: false,
                wateredUntil: null,
                level: 1,
              });
            }
          }
        }
        if (merged.unlockedPlots === undefined || merged.unlockedPlots < BASE_UNLOCKED_PLOTS) {
          merged.unlockedPlots = BASE_UNLOCKED_PLOTS;
        }

        if (merged.farmEpochStart === undefined) merged.farmEpochStart = Date.now() - (Date.now() % DAY_CYCLE_MS);
        if (!merged.bunkhouse) {
          merged.bunkhouse = {
            level: 1,
            capacity: 8,
            canteenLiters: 60,
            canteenCapacityLiters: 100,
            coldInfusedDrinks: 0,
            autoRefillFromTower: true,
            nightWatchAutomation: true,
            totalWaterConsumedLiters: 0,
          };
        } else {
          if (merged.bunkhouse.canteenLiters === undefined) merged.bunkhouse.canteenLiters = 60;
          if (merged.bunkhouse.canteenCapacityLiters === undefined) merged.bunkhouse.canteenCapacityLiters = 100;
          if (merged.bunkhouse.coldInfusedDrinks === undefined) merged.bunkhouse.coldInfusedDrinks = 0;
          if (merged.bunkhouse.autoRefillFromTower === undefined) merged.bunkhouse.autoRefillFromTower = true;
          if (merged.bunkhouse.nightWatchAutomation === undefined) merged.bunkhouse.nightWatchAutomation = true;
          if (merged.bunkhouse.totalWaterConsumedLiters === undefined) merged.bunkhouse.totalWaterConsumedLiters = 0;
        }

        // Upkeep & Pantry Auto-Recovery: Restore missing funds/food if previously lost
        if (merged.payrollVaultCoins === undefined || merged.payrollVaultCoins === null) {
          merged.payrollVaultCoins = 0;
        }
        if (!merged.staffPantry) {
          merged.staffPantry = {};
        }

        // If the player has active hired staff but vault or pantry was wiped, grant emergency restoration stipend
        const anyStaffHired = (merged.unifiedWorkers && Object.values(merged.unifiedWorkers).some(w => w?.isHired)) ||
                             (merged.specialistWorkers && Object.values(merged.specialistWorkers).some(sp => sp?.isHired));
        if (anyStaffHired) {
          if (merged.payrollVaultCoins < 200) {
            merged.payrollVaultCoins = Math.max(500, merged.payrollVaultCoins);
          }
          if (Object.keys(merged.staffPantry).length === 0) {
            merged.staffPantry = { bread: 10, cheese: 10, apple_pie: 5, stew: 5, vegetable_soup: 5 };
          }
        }

        if (!merged.lastSettlementTimestamp) merged.lastSettlementTimestamp = Date.now();
        if (!merged.lastSpecialistWageTime) merged.lastSpecialistWageTime = Date.now();
        if (!merged.lastTick) merged.lastTick = Date.now();
        if (!merged.wranglerPolicy) merged.wranglerPolicy = DEFAULT_WRANGLER_POLICY;
        if (!merged.barnItemLocks) merged.barnItemLocks = {};
        if (!merged.livestockReserve) merged.livestockReserve = [];
        if (!merged.activeEvent) merged.activeEvent = null;
        if (!merged.lastEventTriggerTime) merged.lastEventTriggerTime = Date.now();
        if (!merged.notifications) merged.notifications = [];
        if (!merged.breedingSlots) merged.breedingSlots = 1;
        if (!merged.activeBreedings) merged.activeBreedings = [];
        if (!merged.habitatUpgradeSteps) merged.habitatUpgradeSteps = { chicken: 0, cow: 0, sheep: 0, pig: 0 };

        // Migration: add new silo/barn keys
        if (!merged.silo.cotton) merged.silo = { ...merged.silo, cotton: 0, honey_comb: 0, wild_berries: 0, gold_nugget: 0 };
        if (!merged.barn.yarn) merged.barn = { ...merged.barn, yarn: 0, quilted_blanket: 0, savory_fish_pie: 0, crab_bisque: 0, honey: 0, silk: 0 };

        // Migration: move any stranded honeycomb from barn to silo
        if (merged.barn && (merged.barn as Record<string, number>).honey_comb) {
          const stranded = (merged.barn as Record<string, number>).honey_comb || 0;
          if (stranded > 0) {
            merged.silo = {
              ...merged.silo,
              honey_comb: (merged.silo.honey_comb || 0) + stranded,
            };
          }
          const updatedBarn = { ...merged.barn };
          delete (updatedBarn as Record<string, number>).honey_comb;
          merged.barn = updatedBarn;
        }

        // Migration: add new tradeStreak fields
        if (merged.tradeStreak === undefined) merged.tradeStreak = 0;
        if (merged.lastTradeStreakTimestamp === undefined) merged.lastTradeStreakTimestamp = null;

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
          merged.wilderness = createDefaultWilderness();
        } else {
          if (!merged.wilderness.frontierCache) merged.wilderness.frontierCache = {};
          if (!merged.wilderness.campHoldingPens) merged.wilderness.campHoldingPens = [];
          if (!merged.wilderness.stationedBeasts) merged.wilderness.stationedBeasts = [];
          if (merged.wilderness.campRenown === undefined) merged.wilderness.campRenown = 0;
          if (merged.wilderness.outpostLevel === undefined) merged.wilderness.outpostLevel = 1;
        }
        if (!merged.stagingWagonProvisions) merged.stagingWagonProvisions = {};

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
          if (!merged.productionQueues.animal_feed) {
            merged.productionQueues.animal_feed = [];
          }
          for (const buildingId of Object.keys(merged.productionQueues) as BuildingId[]) {
            if (!BUILDINGS[buildingId]) continue;
            merged.productionQueues[buildingId] = (merged.productionQueues[buildingId] || []).map((slot: ProductionSlot) => {
              if (!slot.recipeName || !slot.recipeEmoji) {
                const building = BUILDINGS[buildingId];
                let recipe = building?.recipes.find(r => r.id === slot.recipeId);
                if (!recipe) {
                  for (const b of Object.values(BUILDINGS)) {
                    recipe = b.recipes.find(r => r.id === slot.recipeId);
                    if (recipe) break;
                  }
                }
                return { ...slot, recipeName: recipe?.name || slot.recipeId, recipeEmoji: recipe?.emoji || '' };
              }
              return slot;
            });
          }
        }
        if (merged.buildingOverclocks && !merged.buildingOverclocks.animal_feed) {
          merged.buildingOverclocks.animal_feed = { isOverclocked: false, expiresAt: null, isExhausted: false, exhaustedUntil: null };
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

        // Migration: high-stakes sudden event engine disabled per user request
        merged.activeSuddenEvent = null;
        merged.nextSuddenEventTime = null;
        merged.workersPausedUntil = null;
        merged.suddenEventFlash = null;
        merged.isSuddenEventModalOpen = false;
        merged.surpriseEventAlert = null;

        // Migration: water system & farm well
        if (merged.waterLevel === undefined) merged.waterLevel = 10;
        if (merged.maxWaterLevel === undefined) merged.maxWaterLevel = 10;
        if (merged.wellLevel === undefined) merged.wellLevel = 1;
        if (merged.lastWellAutoRefill === undefined) merged.lastWellAutoRefill = null;

        // Migration: Step 1-4 Thrill & Crisis System disabled per user request
        merged.activeCrisis = null;
        merged.nextCrisisTime = Date.now() + 86400000;
        merged.isCrisisModalOpen = false;
        if (!merged.wildExpedition) merged.wildExpedition = createDefaultWildExpedition();
        if (!merged.marketTrends) merged.marketTrends = createInitialMarketTrends();
        if (!merged.marketNextRefresh) merged.marketNextRefresh = Date.now() + 180000;
        if (!merged.marketNewsTicker) merged.marketNewsTicker = null;
        if (!merged.buildingOverclocks) merged.buildingOverclocks = createDefaultBuildingOverclocks();
        if (!merged.entityOverclocks) merged.entityOverclocks = {};
        if (!merged.clientReputation) merged.clientReputation = DEFAULT_CLIENT_REPUTATION;

        // Migration: animalCapacity baseline upgrade to 50
        if (merged.animalCapacity) {
          merged.animalCapacity = {
            chicken: Math.max(merged.animalCapacity.chicken || 50, 50),
            cow: Math.max(merged.animalCapacity.cow || 50, 50),
            sheep: Math.max(merged.animalCapacity.sheep || 50, 50),
            pig: Math.max(merged.animalCapacity.pig || 50, 50),
          };
        } else {
          merged.animalCapacity = { chicken: 50, cow: 50, sheep: 50, pig: 50 };
        }

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

        if (!merged.workshopLoadout) {
          merged.workshopLoadout = createDefaultWorkshopLoadout();
        } else {
          if (merged.workshopLoadout.emergencySiphonInstalled === undefined) {
            merged.workshopLoadout.emergencySiphonInstalled = false;
          }
        }
        if (!merged.workshopLoadout.emergencySiphonInstalled && !merged.barn?.emergency_siphon_valve) {
          if (!merged.barn) merged.barn = {} as any;
          merged.barn.emergency_siphon_valve = 1;
        }
        if (merged.offlineHydrologyReport === undefined) {
          merged.offlineHydrologyReport = null;
        }

        return merged as GameState;
      },
    }
  )
);
