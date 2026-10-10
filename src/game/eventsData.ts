// ============================================================
// Project Meadowlands — Dynamic Long-Form Event Engine Data Registry
// 10 Systemic Master Events, Stages, Relics, and Balance Constants
// ============================================================

export type SystemicEventId =
  | 'royal_fleet'
  | 'barn_fire'
  | 'midnight_smuggler'
  | 'locust_swarm'
  | 'county_fair'
  | 'salmon_run'
  | 'carnival_circus'
  | 'alchemical_bloom'
  | 'artisan_masterclass'
  | 'ancient_ruins';

export type SystemicEventPhase = 'forecast' | 'active' | 'settlement';

export interface EventStageDef {
  stage: number;
  title: string;
  targetCount: number;
  itemCategoryDesc: string;
  requiredItemTypes?: string[];
  rewardDescription: string;
}

export interface GrandRewardDef {
  coins: number;
  gems: number;
  relicKey: string;
  relicName: string;
  relicEmoji: string;
  relicDescription: string;
}

export interface SystemicEventDef {
  id: SystemicEventId;
  name: string;
  emoji: string;
  badge: string;
  themeColor: string; // Tailwind color classes for glow & accents
  forecastDurationMs: number;
  activeDurationMs: number;
  cooldownMs: number;
  premise: string;
  mechanicalShift: string;
  objectiveSummary: string;
  stages: EventStageDef[];
  grandReward: GrandRewardDef;
}

// Master Balance Registry matching Section 5 PRD Specification
export const SYSTEMIC_EVENTS: Record<SystemicEventId, SystemicEventDef> = {
  royal_fleet: {
    id: 'royal_fleet',
    name: 'The Royal Fleet Provision',
    emoji: '🚢',
    badge: 'Naval Trade Ladder',
    themeColor: 'from-amber-500 to-sky-600',
    forecastDurationMs: 15 * 60 * 1000, // 15 min
    activeDurationMs: 60 * 60 * 1000,   // 60 min
    cooldownMs: 4 * 60 * 60 * 1000,     // 4 hr
    premise: "The King's flagship docks at the coastal estuary requiring provision crates for an overseas expedition.",
    mechanicalShift: 'Order Board introduces a 4-stage global shipping crate ladder (Grains → Dairy → Baked Goods → Luxury Textiles).',
    objectiveSummary: 'Deliver provisions across all 4 stages to supply the Royal Navy before departure.',
    stages: [
      { stage: 1, title: 'Grain Reserves', targetCount: 15, itemCategoryDesc: 'Grains (Wheat, Corn)', requiredItemTypes: ['wheat', 'corn'], rewardDescription: '5,000 Coins + 2 Gems' },
      { stage: 2, title: 'Dairy Provisions', targetCount: 30, itemCategoryDesc: 'Dairy (Milk, Cheese, Butter)', requiredItemTypes: ['milk', 'cheese', 'rich_butter', 'alpine_cheese'], rewardDescription: '12,000 Coins + 5 Gems' },
      { stage: 3, title: 'Rations & Pastries', targetCount: 50, itemCategoryDesc: 'Baked Goods (Bread, Pie, Cake)', requiredItemTypes: ['bread', 'pie', 'savory_fish_pie', 'golden_cake'], rewardDescription: '25,000 Coins + 8 Gems' },
      { stage: 4, title: 'Fine Textiles', targetCount: 75, itemCategoryDesc: 'Luxury Textiles (Wool, Sweaters, Blankets)', requiredItemTypes: ['wool', 'yarn', 'sweater', 'quilted_blanket', 'silk', 'golden_shawl'], rewardDescription: '33,000 Coins + 15 Gems' },
    ],
    grandReward: {
      coins: 75000,
      gems: 30,
      relicKey: 'royalCrownCrestUntil',
      relicName: 'Royal Crown Crest',
      relicEmoji: '👑',
      relicDescription: '+15% all order delivery payouts active for 24 hours.',
    },
  },

  barn_fire: {
    id: 'barn_fire',
    name: 'Drought & Brushfire Crisis',
    emoji: '🔥',
    badge: 'Crisis Containment',
    themeColor: 'from-red-600 to-amber-500',
    forecastDurationMs: 5 * 60 * 1000,  // 5 min
    activeDurationMs: 25 * 60 * 1000,   // 25 min
    cooldownMs: 3 * 60 * 60 * 1000,     // 3 hr
    premise: 'Dry lightning ignites brushfires along the farm perimeter; intense heat cuts natural irrigation.',
    mechanicalShift: 'Crop timers pause on unwatered plots. Five randomized fire flare-up entities spawn across the map. Tap fires with well water to extinguish them.',
    objectiveSummary: 'Extinguish all 5 active brushfire flare-ups across the farmland.',
    stages: [
      { stage: 1, title: 'First Flare-Up', targetCount: 1, itemCategoryDesc: 'Quench fire flare-up', rewardDescription: '2,000 Coins' },
      { stage: 2, title: 'Perimeter Defense', targetCount: 3, itemCategoryDesc: 'Quench 3 fire flare-ups', rewardDescription: '6,000 Coins + 2 Gems' },
      { stage: 3, title: 'Final Containment', targetCount: 5, itemCategoryDesc: 'Extinguish all 5 fire flare-ups', rewardDescription: '12,000 Coins + 8 Gems' },
    ],
    grandReward: {
      coins: 20000,
      gems: 10,
      relicKey: 'mineralAshUntil',
      relicName: 'Mineral-Rich Ash Soil',
      relicEmoji: '🌋',
      relicDescription: 'All crops planted within the next 60 minutes grow at 3× speed.',
    },
  },

  midnight_smuggler: {
    id: 'midnight_smuggler',
    name: "Midnight Smuggler's Barge",
    emoji: '⛵',
    badge: 'Black-Market Contract',
    themeColor: 'from-indigo-900 to-purple-700',
    forecastDurationMs: 10 * 60 * 1000, // 10 min
    activeDurationMs: 40 * 60 * 1000,   // 40 min
    cooldownMs: 5 * 60 * 60 * 1000,     // 5 hr
    premise: 'A cloaked river barge docks quietly at the shadowed boundary of the estate with high-value clandestine demands.',
    mechanicalShift: 'Presents 3 unconventional black-market contracts demanding irregular high-tier goods (Starlight Milk, Truffle Oil, Patterned Wool).',
    objectiveSummary: 'Fulfill 3 high-tier black-market deliveries before the barge slips away into the mist.',
    stages: [
      { stage: 1, title: 'Clandestine Parcel', targetCount: 1, itemCategoryDesc: 'Deliver Truffle / Rare Goods', requiredItemTypes: ['truffle', 'truffle_white', 'truffle_oil'], rewardDescription: '8,000 Coins + 5 Gems' },
      { stage: 2, title: 'Shadow Cargo', targetCount: 2, itemCategoryDesc: 'Deliver Artisan Goods', requiredItemTypes: ['silk', 'quilted_blanket', 'alpine_cheese'], rewardDescription: '12,000 Coins + 8 Gems' },
      { stage: 3, title: 'Master Smuggler Pact', targetCount: 3, itemCategoryDesc: 'Deliver Exotic Goods (Starlight Milk / Gold)', requiredItemTypes: ['milk_starlight', 'gold_nugget', 'truffle_diamond'], rewardDescription: '15,000 Coins + 12 Gems' },
    ],
    grandReward: {
      coins: 35000,
      gems: 25,
      relicKey: 'smugglersCompass',
      relicName: "Smuggler's Compass",
      relicEmoji: '🧭',
      relicDescription: 'Permanently reduces all Wilderness Outpost expedition timers by 20%.',
    },
  },

  locust_swarm: {
    id: 'locust_swarm',
    name: 'Wild Locust Swarm',
    emoji: '🦗',
    badge: 'Field Defense',
    themeColor: 'from-yellow-700 to-lime-700',
    forecastDurationMs: 10 * 60 * 1000, // 10 min
    activeDurationMs: 20 * 60 * 1000,   // 20 min
    cooldownMs: 2 * 60 * 60 * 1000,     // 2 hr
    premise: 'A massive swarm of ravenous insects descends from the foothills, landing on mature crop plots.',
    mechanicalShift: 'Locust sprites land on mature crops, blocking harvests. Tap locusts to capture them into containment jars. Stationed beekeepers repel them.',
    objectiveSummary: 'Capture 30 locust swarms across the farmland.',
    stages: [
      { stage: 1, title: 'Initial Swarm Repel', targetCount: 10, itemCategoryDesc: 'Capture 10 locusts', rewardDescription: '3,000 Coins + 2 Gems' },
      { stage: 2, title: 'Mid-Field Containment', targetCount: 20, itemCategoryDesc: 'Capture 20 locusts', rewardDescription: '5,000 Coins + 2 Gems' },
      { stage: 3, title: 'Total Swarm Clearance', targetCount: 30, itemCategoryDesc: 'Capture 30 locusts', rewardDescription: '7,000 Coins + 4 Gems' },
    ],
    grandReward: {
      coins: 15000,
      gems: 8,
      relicKey: 'superFeedCharges',
      relicName: 'Super-Feed Mash (x5)',
      relicEmoji: '🥣',
      relicDescription: 'Grants livestock guaranteed double yield on their next 5 production cycles.',
    },
  },

  county_fair: {
    id: 'county_fair',
    name: 'The County Fair Grand Derby',
    emoji: '🎪',
    badge: 'Competitive Exhibition',
    themeColor: 'from-amber-400 to-rose-500',
    forecastDurationMs: 15 * 60 * 1000, // 15 min
    activeDurationMs: 90 * 60 * 1000,   // 90 min
    cooldownMs: 8 * 60 * 60 * 1000,     // 8 hr
    premise: 'The regional agricultural pavilion opens for competitive exhibition judging across all farm goods.',
    mechanicalShift: 'Submit harvested crops, dairy, and textiles into the pavilion. Scoring is rarity-weighted: Common (1pt), Uncommon (3pt), Rare (10pt), Legendary (25pt).',
    objectiveSummary: 'Reach milestone scoring tiers (100 pts → 300 pts → 600 pts) with premium farm produce.',
    stages: [
      { stage: 1, title: 'Blue Ribbon Entry', targetCount: 100, itemCategoryDesc: 'Reach 100 Exhibition Points', rewardDescription: '10,000 Coins + 5 Gems' },
      { stage: 2, title: 'Governor’s Choice', targetCount: 300, itemCategoryDesc: 'Reach 300 Exhibition Points', rewardDescription: '15,000 Coins + 10 Gems' },
      { stage: 3, title: 'Grand Championship', targetCount: 600, itemCategoryDesc: 'Reach 600 Exhibition Points', rewardDescription: '25,000 Coins + 25 Gems' },
    ],
    grandReward: {
      coins: 50000,
      gems: 40,
      relicKey: 'countyFairTrophy',
      relicName: 'County Fair Grand Trophy',
      relicEmoji: '🏆',
      relicDescription: 'Permanent farm monument generating 3 Gems every 24 hours.',
    },
  },

  salmon_run: {
    id: 'salmon_run',
    name: 'The Golden Salmon Migration',
    emoji: '🐟',
    badge: 'Riverfront Frenzy',
    themeColor: 'from-cyan-500 to-blue-700',
    forecastDurationMs: 10 * 60 * 1000, // 10 min
    activeDurationMs: 45 * 60 * 1000,   // 45 min
    cooldownMs: 3 * 60 * 60 * 1000,     // 3 hr
    premise: 'A seasonal migration floods the estate riverfront with glowing golden salmon and prized river catch.',
    mechanicalShift: 'The manual fishing dock has 0-second cooldown timers and 100% instant bites. Rare and Legendary fish spawn odds increase by +300%.',
    objectiveSummary: 'Catch 15 migration-tier fish at the riverfront.',
    stages: [
      { stage: 1, title: 'Riverfront Casts', targetCount: 5, itemCategoryDesc: 'Catch 5 migration fish', rewardDescription: '8,000 Coins + 3 Gems' },
      { stage: 2, title: 'Deep Channel Haul', targetCount: 10, itemCategoryDesc: 'Catch 10 migration fish', rewardDescription: '14,000 Coins + 5 Gems' },
      { stage: 3, title: 'Golden School Catch', targetCount: 15, itemCategoryDesc: 'Catch 15 migration fish', rewardDescription: '18,000 Coins + 7 Gems' },
    ],
    grandReward: {
      coins: 40000,
      gems: 15,
      relicKey: 'feastOfKingsUnlocked',
      relicName: 'Feast of Kings Recipe',
      relicEmoji: '👑',
      relicDescription: 'Exclusive luxury bakery dish that liquidates to visiting caravan merchants for 40,000 Coins per dish.',
    },
  },

  carnival_circus: {
    id: 'carnival_circus',
    name: 'The Travelling Carnival Menagerie',
    emoji: '🦁',
    badge: 'Animal Relief Supply',
    themeColor: 'from-pink-500 to-violet-700',
    forecastDurationMs: 15 * 60 * 1000, // 15 min
    activeDurationMs: 60 * 60 * 1000,   // 60 min
    cooldownMs: 6 * 60 * 60 * 1000,     // 6 hr
    premise: 'A traveling carnival train stops at the perimeter railway siding; their exotic animals urgently require feed.',
    mechanicalShift: 'Dedicated carnival feeding stall opens, requiring high volumes of milled feed, fruits, and grains on strict delivery schedules.',
    objectiveSummary: 'Supply feeds across 3 tiers (20 feeds → 50 feeds → 100 feeds) to rescue the circus caravan.',
    stages: [
      { stage: 1, title: 'Emergency Rations', targetCount: 20, itemCategoryDesc: 'Supply 20 Feeds (Feed, Wheat, Corn, Carrot)', requiredItemTypes: ['feed', 'wheat', 'corn', 'carrot'], rewardDescription: '5,000 Coins + 3 Gems' },
      { stage: 2, title: 'Caravan Sustenance', targetCount: 50, itemCategoryDesc: 'Supply 50 Feeds (Feed, Soybeans, Berries, Milk)', requiredItemTypes: ['feed', 'soybean', 'wild_berries', 'milk'], rewardDescription: '10,000 Coins + 7 Gems' },
      { stage: 3, title: 'Menagerie Bounty', targetCount: 100, itemCategoryDesc: 'Supply 100 Total Feeds', requiredItemTypes: ['feed', 'wheat', 'corn', 'carrot', 'strawberry', 'soybean', 'milk'], rewardDescription: '15,000 Coins + 10 Gems' },
    ],
    grandReward: {
      coins: 30000,
      gems: 20,
      relicKey: 'circusCub',
      relicName: 'Rescued Circus Cub',
      relicEmoji: '🐾',
      relicDescription: 'Exclusive companion animal that joins the sanctuary and provides permanent +10% farm experience boosts.',
    },
  },

  alchemical_bloom: {
    id: 'alchemical_bloom',
    name: 'The Luminescent Spore Fog',
    emoji: '🍄',
    badge: 'Alchemical Bloom',
    themeColor: 'from-emerald-400 to-teal-700',
    forecastDurationMs: 10 * 60 * 1000, // 10 min
    activeDurationMs: 30 * 60 * 1000,   // 30 min
    cooldownMs: 4 * 60 * 60 * 1000,     // 4 hr
    premise: 'Bioluminescent fungal fog drifts down from mountain caverns, saturating the soil with hyper-growth spores.',
    mechanicalShift: 'All crop growth times across all plots drop to a flat 30 seconds. Every harvest carries a 50% chance to drop glowing alchemical spores.',
    objectiveSummary: 'Harvest 40 crops during the luminescent fog.',
    stages: [
      { stage: 1, title: 'Fog Infiltration', targetCount: 15, itemCategoryDesc: 'Harvest 15 crops in fog', rewardDescription: '4,000 Coins + 3 Gems' },
      { stage: 2, title: 'Spore Saturation', targetCount: 28, itemCategoryDesc: 'Harvest 28 crops in fog', rewardDescription: '6,000 Coins + 4 Gems' },
      { stage: 3, title: 'Abundant Harvest', targetCount: 40, itemCategoryDesc: 'Harvest 40 crops in fog', rewardDescription: '8,000 Coins + 5 Gems' },
    ],
    grandReward: {
      coins: 18000,
      gems: 12,
      relicKey: 'glowingSpores',
      relicName: 'Glowing Spores (x8)',
      relicEmoji: '🧪',
      relicDescription: '8 units of instant-finish alchemical spores used to instantly complete factory production queues.',
    },
  },

  artisan_masterclass: {
    id: 'artisan_masterclass',
    name: 'Wandering Guild Craftsmen',
    emoji: '🛠️',
    badge: 'Industrial Hyper-Drive',
    themeColor: 'from-amber-600 to-orange-800',
    forecastDurationMs: 10 * 60 * 1000, // 10 min
    activeDurationMs: 45 * 60 * 1000,   // 45 min
    cooldownMs: 5 * 60 * 60 * 1000,     // 5 hr
    premise: 'A master baker, weaver, and cheesemaker visit the estate to oversee industrial workshop operations.',
    mechanicalShift: 'The Bakery, Loom, and Cheese Press operate at 4× production speed with zero ingredient waste.',
    objectiveSummary: 'Complete 20 artisan recipes in workshops while the guild masters are visiting.',
    stages: [
      { stage: 1, title: 'Apprentice Showcase', targetCount: 10, itemCategoryDesc: 'Craft 10 artisan recipes (Bread, Cheese, Sweaters, Pies)', rewardDescription: '10,000 Coins + 5 Gems' },
      { stage: 2, title: 'Master Guild Certification', targetCount: 20, itemCategoryDesc: 'Craft 20 artisan recipes total', rewardDescription: '15,000 Coins + 10 Gems' },
    ],
    grandReward: {
      coins: 25000,
      gems: 15,
      relicKey: 'masterArtisanLedger',
      relicName: "Master Artisan's Ledger",
      relicEmoji: '📜',
      relicDescription: 'Permanently reduces all machine crafting durations farm-wide by a flat 5%.',
    },
  },

  ancient_ruins: {
    id: 'ancient_ruins',
    name: 'Ancient Subterranean Excavation',
    emoji: '🏛️',
    badge: 'Archaeological Dig',
    themeColor: 'from-amber-700 to-stone-900',
    forecastDurationMs: 15 * 60 * 1000, // 15 min
    activeDurationMs: 60 * 60 * 1000,   // 60 min
    cooldownMs: 8 * 60 * 60 * 1000,     // 8 hr
    premise: 'Quarry blasting exposes a subterranean stone passageway leading into an ancient buried sun temple.',
    mechanicalShift: 'Unlocks a multi-chamber excavation dig site. Donate raw construction materials (Cotton, Wool, Gold Nuggets, Truffle, Ancient Coins) to clear the chambers.',
    objectiveSummary: 'Donate building supplies to clear Chamber 1 (25 items), Chamber 2 (60 items), and Chamber 3 (120 items).',
    stages: [
      { stage: 1, title: 'Antechamber Rubble', targetCount: 25, itemCategoryDesc: 'Donate 25 construction materials', requiredItemTypes: ['cotton', 'wool', 'honey_comb'], rewardDescription: '12,000 Coins + 5 Gems' },
      { stage: 2, title: 'Pillar Hall Clearance', targetCount: 60, itemCategoryDesc: 'Donate 60 construction materials', requiredItemTypes: ['cotton', 'wool', 'gold_nugget', 'yarn', 'silk'], rewardDescription: '20,000 Coins + 10 Gems' },
      { stage: 3, title: 'Sanctum Sanctorum', targetCount: 120, itemCategoryDesc: 'Donate 120 total construction materials', requiredItemTypes: ['cotton', 'wool', 'gold_nugget', 'yarn', 'silk', 'ancient_coin'], rewardDescription: '28,000 Coins + 20 Gems' },
    ],
    grandReward: {
      coins: 60000,
      gems: 35,
      relicKey: 'ancientSunRelic',
      relicName: 'Ancient Sun Relic',
      relicEmoji: '☀️',
      relicDescription: 'Permanent artifact monument providing a +15% multiplier to all player experience gains.',
    },
  },
};

// County Fair Item Scoring Table (Rarity-weighted: Common=1, Uncommon=3, Rare=10, Legendary=25)
export const FAIR_ITEM_SCORES: Record<string, { points: number; rarity: 'common' | 'uncommon' | 'rare' | 'legendary' }> = {
  // Common (1 pt)
  wheat: { points: 1, rarity: 'common' },
  corn: { points: 1, rarity: 'common' },
  egg: { points: 1, rarity: 'common' },
  milk: { points: 1, rarity: 'common' },
  feed: { points: 1, rarity: 'common' },
  carrot: { points: 1, rarity: 'common' },
  cotton: { points: 1, rarity: 'common' },

  // Uncommon (3 pts)
  strawberry: { points: 3, rarity: 'uncommon' },
  soybean: { points: 3, rarity: 'uncommon' },
  bread: { points: 3, rarity: 'uncommon' },
  wool: { points: 3, rarity: 'uncommon' },
  egg_blue: { points: 3, rarity: 'uncommon' },
  milk_rich_cream: { points: 3, rarity: 'uncommon' },
  honey: { points: 3, rarity: 'uncommon' },
  fish: { points: 3, rarity: 'uncommon' },
  wild_berries: { points: 3, rarity: 'uncommon' },

  // Rare (10 pts)
  pumpkin: { points: 10, rarity: 'rare' },
  cheese: { points: 10, rarity: 'rare' },
  pie: { points: 10, rarity: 'rare' },
  sweater: { points: 10, rarity: 'rare' },
  truffle: { points: 10, rarity: 'rare' },
  truffle_oil: { points: 10, rarity: 'rare' },
  egg_obsidian: { points: 10, rarity: 'rare' },
  milk_alpine: { points: 10, rarity: 'rare' },
  silk: { points: 10, rarity: 'rare' },
  quilted_blanket: { points: 10, rarity: 'rare' },
  savory_fish_pie: { points: 10, rarity: 'rare' },
  rich_butter: { points: 10, rarity: 'rare' },

  // Legendary (25 pts)
  gold_nugget: { points: 25, rarity: 'legendary' },
  egg_golden: { points: 25, rarity: 'legendary' },
  milk_starlight: { points: 25, rarity: 'legendary' },
  wool_gilded: { points: 25, rarity: 'legendary' },
  truffle_diamond: { points: 25, rarity: 'legendary' },
  golden_shawl: { points: 25, rarity: 'legendary' },
  golden_cake: { points: 25, rarity: 'legendary' },
  ancient_coin: { points: 25, rarity: 'legendary' },
};
