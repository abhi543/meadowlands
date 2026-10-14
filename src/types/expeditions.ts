import type { AnimalSpecies, Tier, BiomeId, LureTypeId } from '@/game/data';

export type ExpeditionPresetId = '1h' | '4h' | '8h' | '12h';

export interface ExpeditionPresetDef {
  id: ExpeditionPresetId;
  title: string;
  name: string;
  label: string;
  subtitle: string;
  emoji: string;
  durationMs: number;
  durationHours: number;
  minRationsRequired: number;
  minRations: number;
  maxRationsCapacity: number;
  dangerRating: string;
  dangerLevel: 1 | 2 | 3 | 4;
  description: string;
  rewardTierSummary: string;
  targetTiers: Tier[];
  tierPool: Tier[];
  beastChance: number;
  biomeMapping: BiomeId;
  guaranteedMaterials: string[];
  yieldRanges: Record<string, [number, number]>;
  coinRewardRange: [number, number];
  gemRewardRange: [number, number];
}

export interface FrontierMaterialDef {
  id: string;
  name: string;
  emoji: string;
  icon?: string;
  category: 'timber' | 'stone' | 'herb' | 'gem';
  description: string;
  baseSellValue: number;
}

export interface CratedBeast {
  id: string;
  species: AnimalSpecies;
  tier: Tier;
  name: string;
  breedId: string;
  avatar: string;
  emoji?: string;
  trait: string;
  traitDescription: string;
  statBonus: string;
  capturedAt: number;
  originPreset: ExpeditionPresetId;
  maxCycles?: number;
}

export interface ExpeditionSpoils {
  materials: Record<string, number>;
  cratedBeast?: CratedBeast | null;
  cratedBeasts?: CratedBeast[];
  leftoverRations: Record<string, number>;
  coins: number;
  gems: number;
  recalledEarly?: boolean;
  completionPct: number;
  claimed?: boolean;
}

export interface ActiveExpedition {
  id: string;
  presetId?: ExpeditionPresetId;
  biomeId?: BiomeId;
  farmhandId?: string;
  lureId?: LureTypeId;
  startedAt: number;
  durationMs: number;
  provisions: Record<string, number>;
  status: 'active' | 'completed' | 'recalled';
  completedAt?: number;
  midpointResolved?: boolean;
  pendingChoice?: {
    prompt: string;
    safeLabel: string;
    riskyLabel: string;
  } | null;
  riskyChosen?: boolean | null;
  spoils?: ExpeditionSpoils | null;
}

export interface WildernessState {
  unlockedBiomes: Record<BiomeId, boolean>;
  activeExpeditions: ActiveExpedition[];
  frontierCache: Record<string, number>; // Local outpost storage
  campHoldingPens: CratedBeast[]; // Temporary holding pens for captured animals
  stationedBeasts: CratedBeast[]; // Companions stationed at basecamp granting passive perks
  campRenown: number; // Wild Essence / Renown currency
  outpostLevel?: number;
}

export const EXPEDITION_PRESETS: Record<ExpeditionPresetId, ExpeditionPresetDef> = {
  '1h': {
    id: '1h',
    title: 'Meadow Outskirts',
    name: 'Meadow Outskirts',
    label: '1h Meadow',
    subtitle: 'Sunlit grassy knolls and gentle trails',
    emoji: '🌾',
    durationMs: 3_600_000, // 1 hour
    durationHours: 1,
    minRationsRequired: 2,
    minRations: 2,
    maxRationsCapacity: 10,
    dangerRating: 'Low (★☆☆☆)',
    dangerLevel: 1,
    description: 'A relaxed exploratory trek through golden meadow valleys. Low peril, steady supply of wild timber and gentle critters.',
    rewardTierSummary: 'Common Beasts · Scrap Timber · Wild Herbs',
    targetTiers: ['common'],
    tierPool: ['common'],
    beastChance: 0.85,
    biomeMapping: 'biome_woods',
    guaranteedMaterials: ['scrap_timber', 'wild_herbs'],
    yieldRanges: { scrap_timber: [3, 7], wild_herbs: [2, 5] },
    coinRewardRange: [400, 800],
    gemRewardRange: [1, 2],
  },
  '4h': {
    id: '4h',
    title: 'River & Deep Woods',
    name: 'River & Deep Woods',
    label: '4h Woods',
    subtitle: 'Cascading riverbeds and misty old-growth pines',
    emoji: '🌲',
    durationMs: 14_400_000, // 4 hours
    durationHours: 4,
    minRationsRequired: 4,
    minRations: 4,
    maxRationsCapacity: 10,
    dangerRating: 'Moderate (★★☆☆)',
    dangerLevel: 2,
    description: 'Following roaring forest currents deep into primeval timberland. Demands moderate provisions for river crossings.',
    rewardTierSummary: 'Uncommon Beasts · River Pearls · Scrap Timber',
    targetTiers: ['uncommon', 'common'],
    tierPool: ['uncommon', 'common'],
    beastChance: 0.90,
    biomeMapping: 'biome_woods',
    guaranteedMaterials: ['river_pearl', 'scrap_timber', 'wild_herbs'],
    yieldRanges: { scrap_timber: [6, 12], wild_herbs: [4, 8], river_pearl: [2, 5] },
    coinRewardRange: [1800, 3200],
    gemRewardRange: [3, 5],
  },
  '8h': {
    id: '8h',
    title: 'Mountain Ridge',
    name: 'Mountain Ridge',
    label: '8h Ridge',
    subtitle: 'Windswept crags and sheer alpine switchbacks',
    emoji: '⛰️',
    durationMs: 28_800_000, // 8 hours
    durationHours: 8,
    minRationsRequired: 6,
    minRations: 6,
    maxRationsCapacity: 10,
    dangerRating: 'High (★★★☆)',
    dangerLevel: 3,
    description: 'Endurance trek above the clouds through treacherous scree and freezing gorges. Unearths ancient slate and rare fauna.',
    rewardTierSummary: 'Rare Beasts · Mountain Slate · Fossil Bark',
    targetTiers: ['rare', 'uncommon'],
    tierPool: ['rare', 'uncommon'],
    beastChance: 0.95,
    biomeMapping: 'biome_ridge',
    guaranteedMaterials: ['mountain_slate', 'fossil_bark', 'river_pearl'],
    yieldRanges: { mountain_slate: [5, 10], fossil_bark: [3, 7], river_pearl: [3, 6] },
    coinRewardRange: [5000, 9000],
    gemRewardRange: [7, 12],
  },
  '12h': {
    id: '12h',
    title: 'Forgotten Shrine',
    name: 'Forgotten Shrine',
    label: '12h Shrine',
    subtitle: 'Ancient monoliths enveloped in ether and celestial glow',
    emoji: '⛩️',
    durationMs: 43_200_000, // 12 hours
    durationHours: 12,
    minRationsRequired: 8,
    minRations: 8,
    maxRationsCapacity: 10,
    dangerRating: 'Extreme (★★★★)',
    dangerLevel: 4,
    description: 'An odyssey to the heart of the forgotten civilization. Requires rich gourmet rations to withstand supernatural storms.',
    rewardTierSummary: 'Legendary Beasts · Mythical Ore · Ancient Relics',
    targetTiers: ['legendary', 'rare'],
    tierPool: ['legendary', 'rare'],
    beastChance: 1.0,
    biomeMapping: 'biome_peaks',
    guaranteedMaterials: ['mythical_ore', 'fossil_bark', 'mountain_slate'],
    yieldRanges: { mythical_ore: [3, 6], fossil_bark: [5, 10], mountain_slate: [6, 12] },
    coinRewardRange: [14000, 25000],
    gemRewardRange: [18, 30],
  },
};

export const FRONTIER_MATERIALS: Record<string, FrontierMaterialDef> = {
  scrap_timber: {
    id: 'scrap_timber',
    name: 'Scrap Timber',
    emoji: '🪵',
    category: 'timber',
    description: 'Dense wild hardwood logs gathered along frontier glades.',
    baseSellValue: 120,
  },
  wild_herbs: {
    id: 'wild_herbs',
    name: 'Wild Mountain Herbs',
    emoji: '🌿',
    category: 'herb',
    description: 'Fragrant aromatic herbs dried in alpine sunshine.',
    baseSellValue: 180,
  },
  river_pearl: {
    id: 'river_pearl',
    name: 'River Pearl & Pebble',
    emoji: '🦪',
    category: 'gem',
    description: 'Polished river pebbles and freshwater iridescent pearls.',
    baseSellValue: 350,
  },
  mountain_slate: {
    id: 'mountain_slate',
    name: 'Highland Mountain Slate',
    emoji: '🪨',
    category: 'stone',
    description: 'Sturdy building slate carved from jagged mountain ridges.',
    baseSellValue: 450,
  },
  fossil_bark: {
    id: 'fossil_bark',
    name: 'Ancient Fossil Bark',
    emoji: '🍂',
    category: 'timber',
    description: 'Petrified ironwood bark holding millenia of natural history.',
    baseSellValue: 750,
  },
  mythical_ore: {
    id: 'mythical_ore',
    name: 'Mythical Crystal Ore',
    emoji: '🔮',
    category: 'gem',
    description: 'Pure glowing crystalline mineral harvested from the forgotten shrine.',
    baseSellValue: 1800,
  },
};

export function createDefaultWilderness(): WildernessState {
  return {
    unlockedBiomes: { biome_woods: true, biome_ridge: false, biome_caves: false, biome_peaks: false },
    activeExpeditions: [],
    frontierCache: {
      scrap_timber: 3,
      wild_herbs: 2,
    },
    campHoldingPens: [],
    stationedBeasts: [],
    campRenown: 0,
  };
}

export function generateCratedBeast(presetId: ExpeditionPresetId, allowedTiers: Tier[]): CratedBeast {
  const speciesList: AnimalSpecies[] = ['chicken', 'cow', 'sheep', 'pig'];
  const species = speciesList[Math.floor(Math.random() * speciesList.length)];
  const tier = allowedTiers[Math.floor(Math.random() * allowedTiers.length)];
  const breedId = `${species}_${tier}`;

  const speciesEmojis: Record<AnimalSpecies, Record<Tier, string>> = {
    chicken: { common: '🐔', uncommon: '🐓', rare: '🪶', legendary: '🦚' },
    cow: { common: '🐄', uncommon: '🐂', rare: '🐃', legendary: '✨' },
    sheep: { common: '🐑', uncommon: '🐏', rare: '🧶', legendary: '🌟' },
    pig: { common: '🐖', uncommon: '🐗', rare: '🍄', legendary: '🔥' },
  };

  const traitOptions = [
    { trait: 'Surefooted Scout', description: '+15% caravan travel speed on future treks', bonus: '+15% Speed' },
    { trait: 'Keen Forager', description: '+2 bonus raw materials gathered per expedition', bonus: '+2 Materials' },
    { trait: 'Starlight Resonator', description: '+2 bonus gems found in ancient ruins', bonus: '+2 Gems' },
    { trait: 'Gentle Guardian', description: 'Protects caravan supplies against mountain hazards', bonus: 'Hazard Ward' },
    { trait: 'Ancient Vitality', description: 'Yields double Wild Essence when released to nature', bonus: '2x Essence' },
  ];
  const trait = traitOptions[Math.floor(Math.random() * traitOptions.length)];

  const prefixMap: Record<Tier, string[]> = {
    common: ['Meadow', 'Woodland', 'Wild', 'Grassland'],
    uncommon: ['River', 'Highland', 'Deepwood', 'Amber'],
    rare: ['Alpine', 'Crag', 'Timber', 'Golden'],
    legendary: ['Solar', 'Starlight', 'Celestial', 'Prismatic'],
  };
  const prefixes = prefixMap[tier] || ['Wild'];
  const pfx = prefixes[Math.floor(Math.random() * prefixes.length)];

  const speciesLabels: Record<AnimalSpecies, string> = {
    chicken: 'Hare & Fowl',
    cow: 'Aurochs Beast',
    sheep: 'Ram of the Crag',
    pig: 'Wild Boar',
  };

  const name = `${pfx} ${speciesLabels[species]}`;

  return {
    id: `beast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    species,
    tier,
    name,
    breedId,
    avatar: speciesEmojis[species][tier],
    emoji: speciesEmojis[species][tier],
    maxCycles: 20,
    trait: trait.trait,
    traitDescription: trait.description,
    statBonus: trait.bonus,
    capturedAt: Date.now(),
    originPreset: presetId,
  };
}
