export interface ReputationTier {
  level: number;
  requiredXp: number;
  perkTitle: string;
  perkDescription: string;
  perkEffectId: string;
}

export interface ClientData {
  id: string;
  name: string;
  title: string;
  avatar: string;
  currentXp: number;
  currentLevel: number;
  tiers: ReputationTier[];
}

export type FavorShopItemType = 'crisis_shield' | 'instant_overclock' | 'order_reroll' | 'barn_permit';

export interface FavorShopItem {
  id: string;
  title: string;
  description: string;
  costFavor: number;
  icon: string;
  type: FavorShopItemType;
  usesRemaining?: number;
}

export interface GlobalReputationState {
  spendableFavor: number;
  clients: Record<string, ClientData>;
  unlockedPerks: string[]; // List of perkEffectIds currently active
}

export const REPUTATION_XP_THRESHOLDS = [0, 100, 250, 500, 1000]; // Levels 1 through 5

export const CLIENT_TIERS_CONFIG: Record<string, ReputationTier[]> = {
  mayor_barnaby: [
    { level: 1, requiredXp: 0, perkTitle: 'Town Hall Trust', perkDescription: 'Civic recognition across Meadowlands.', perkEffectId: 'perk_barnaby_1' },
    { level: 2, requiredXp: 100, perkTitle: 'Commercial Subsidy', perkDescription: '+5% Order Board coin payouts farm-wide.', perkEffectId: 'perk_barnaby_2' },
    { level: 3, requiredXp: 250, perkTitle: 'Municipal Well Grant', perkDescription: 'Well pumping yields +2 Water and refuels 20% faster.', perkEffectId: 'perk_barnaby_3' },
    { level: 4, requiredXp: 500, perkTitle: 'Granary Expansion', perkDescription: '+25 storage capacity to both Silo and Barn.', perkEffectId: 'perk_barnaby_4' },
    { level: 5, requiredXp: 1000, perkTitle: 'Key to the City', perkDescription: '+15% all delivery coins and +1 free Daily Gem.', perkEffectId: 'perk_barnaby_5' },
  ],
  chef_antoine: [
    { level: 1, requiredXp: 0, perkTitle: 'Kitchen Whitelist', perkDescription: 'VIP kitchen demand notifications.', perkEffectId: 'perk_antoine_1' },
    { level: 2, requiredXp: 100, perkTitle: 'Artisan Agility', perkDescription: 'Bakery, Dairy & Mill crafting speeds boosted by +15%.', perkEffectId: 'perk_antoine_2' },
    { level: 3, requiredXp: 250, perkTitle: 'Sous-Chef Thrift', perkDescription: '15% chance to not consume ingredients when baking recipes.', perkEffectId: 'perk_antoine_3' },
    { level: 4, requiredXp: 500, perkTitle: 'Michelin Payouts', perkDescription: '+20% bonus coins on all dairy, pastry & meal deliveries.', perkEffectId: 'perk_antoine_4' },
    { level: 5, requiredXp: 1000, perkTitle: 'Grand Gastronome', perkDescription: 'Bakery & Dairy operate at +25% speed; grant +2 Gems weekly.', perkEffectId: 'perk_antoine_5' },
  ],
  captain_sterling: [
    { level: 1, requiredXp: 0, perkTitle: 'Harbor Pass', perkDescription: 'Recognized at coastal estuaries and deep docks.', perkEffectId: 'perk_sterling_1' },
    { level: 2, requiredXp: 100, perkTitle: 'Swift Current', perkDescription: 'Fishery fishing bite cooldowns reduced by 30%.', perkEffectId: 'perk_sterling_2' },
    { level: 3, requiredXp: 250, perkTitle: 'Fair Winds', perkDescription: 'Wild shortcut hazard failure chance reduced by 12%.', perkEffectId: 'perk_sterling_3' },
    { level: 4, requiredXp: 500, perkTitle: 'Smuggler Accord', perkDescription: 'Wilderness Outpost dispatch fees reduced by 20%.', perkEffectId: 'perk_sterling_4' },
    { level: 5, requiredXp: 1000, perkTitle: 'Naval Charter', perkDescription: 'Deliveries have a 25% chance to drop bonus Expansion Deeds or Nails.', perkEffectId: 'perk_sterling_5' },
  ],
  lady_guinevere: [
    { level: 1, requiredXp: 0, perkTitle: 'Aristocratic Court', perkDescription: 'High-society trade prestige.', perkEffectId: 'perk_guinevere_1' },
    { level: 2, requiredXp: 100, perkTitle: 'Silken Loom', perkDescription: 'Loom, Textiles, and Tailor Shop speeds boosted by +20%.', perkEffectId: 'perk_guinevere_2' },
    { level: 3, requiredXp: 250, perkTitle: 'Golden Shears', perkDescription: 'Pastoral animals produce +1 bonus yield 20% of the time.', perkEffectId: 'perk_guinevere_3' },
    { level: 4, requiredXp: 500, perkTitle: 'Couture Premiums', perkDescription: '+25% coins on luxury textile, wool, and garment orders.', perkEffectId: 'perk_guinevere_4' },
    { level: 5, requiredXp: 1000, perkTitle: 'Royal Benefactor', perkDescription: 'Livestock consume 15% less feed; permanent +10% farm XP boost.', perkEffectId: 'perk_guinevere_5' },
  ],
  old_man_jed: [
    { level: 1, requiredXp: 0, perkTitle: 'Frontier Handshake', perkDescription: 'Recognized across mountain and ridge outposts.', perkEffectId: 'perk_jed_1' },
    { level: 2, requiredXp: 100, perkTitle: 'Vein Striker', perkDescription: 'Prospector and quarry nodes yield +1 extra ore/gold.', perkEffectId: 'perk_jed_2' },
    { level: 3, requiredXp: 250, perkTitle: 'Trailblazer Route', perkDescription: 'Wild shortcut hazard damage halved; travel delays eliminated.', perkEffectId: 'perk_jed_3' },
    { level: 4, requiredXp: 500, perkTitle: 'Deep Forage', perkDescription: '+20% higher chance of discovering rare wild herbs and truffles.', perkEffectId: 'perk_jed_4' },
    { level: 5, requiredXp: 1000, perkTitle: 'Mountain Sovereign', perkDescription: 'All territory parcel expansion coin costs reduced by 20%.', perkEffectId: 'perk_jed_5' },
  ],
};

export const FAVOR_SHOP_CATALOG: FavorShopItem[] = [
  {
    id: 'favor_crisis_shield',
    title: 'Emergency Crisis Shield',
    description: 'Auto-absorbs or repels the next sudden radar disaster (Predator Raids, Blight, Fire) with 0 losses.',
    costFavor: 40,
    icon: '🛡️',
    type: 'crisis_shield',
  },
  {
    id: 'favor_instant_overclock',
    title: 'Instant Overclock Voucher',
    description: 'Instantly grants 1 Free Tier 3 Overdrive (4.0x Speed + 1 Yield) with 0 coin cost and 0% burnout risk.',
    costFavor: 30,
    icon: '⚡',
    type: 'instant_overclock',
  },
  {
    id: 'favor_order_reroll',
    title: 'VIP Contract Reroll',
    description: 'Instantly replaces all delivery board contracts with fresh, high-value assignments without breach fees.',
    costFavor: 15,
    icon: '🎲',
    type: 'order_reroll',
  },
  {
    id: 'favor_barn_permit',
    title: 'Municipal Granary Permit',
    description: 'Permanently expands Silo and Barn storage capacity by +25 slots each across the estate.',
    costFavor: 80,
    icon: '📜',
    type: 'barn_permit',
  },
];

export function computeUnlockedPerks(clients: Record<string, ClientData>): string[] {
  const perks: string[] = [];
  for (const client of Object.values(clients)) {
    for (const tier of client.tiers) {
      if (client.currentLevel >= tier.level) {
        perks.push(tier.perkEffectId);
      }
    }
  }
  return perks;
}

export function getClientLevelFromXp(xp: number, tiers: ReputationTier[]) {
  let level = 1;
  for (let i = 0; i < tiers.length; i++) {
    if (xp >= tiers[i].requiredXp) {
      level = tiers[i].level;
    }
  }
  level = Math.min(5, Math.max(1, level));
  const currentTier = tiers.find(t => t.level === level) || tiers[0];
  const nextTier = tiers.find(t => t.level === level + 1) || null;
  const currentThreshold = currentTier.requiredXp;
  const nextThreshold = nextTier ? nextTier.requiredXp : currentTier.requiredXp;
  const currentLevelXp = xp - currentThreshold;
  const neededForNext = nextThreshold - currentThreshold;
  const progressPercent = nextTier ? Math.min(100, Math.floor((currentLevelXp / Math.max(1, neededForNext)) * 100)) : 100;

  return {
    level,
    currentTier,
    nextTier,
    currentLevelXp,
    neededForNext,
    progressPercent,
    isMaxLevel: !nextTier,
  };
}

export function createInitialClientData(id: string, name: string, title: string, avatar: string): ClientData {
  const tiers = CLIENT_TIERS_CONFIG[id] || CLIENT_TIERS_CONFIG.mayor_barnaby;
  return {
    id,
    name,
    title,
    avatar,
    currentXp: 0,
    currentLevel: 1,
    tiers,
  };
}

export function createInitialGlobalReputation(): GlobalReputationState {
  const clients: Record<string, ClientData> = {
    mayor_barnaby: createInitialClientData('mayor_barnaby', 'Mayor Barnaby', 'Town Mayor & Magistrate', '🎩'),
    chef_antoine: createInitialClientData('chef_antoine', 'Chef Antoine', 'Grand Hotel Head Chef', '👨‍🍳'),
    captain_sterling: createInitialClientData('captain_sterling', 'Captain Sterling', 'High-Seas Fleet Quartermaster', '⚓'),
    lady_guinevere: createInitialClientData('lady_guinevere', 'Lady Guinevere', 'Highborn Aristocrat & Weaver', '👒'),
    old_man_jed: createInitialClientData('old_man_jed', 'Old Man Jed', 'Frontier Outpost Veteran', '⛏️'),
  };

  return {
    spendableFavor: 0,
    clients,
    unlockedPerks: computeUnlockedPerks(clients),
  };
}
