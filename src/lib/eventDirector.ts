/**
 * High-Stakes "Adrenaline Rush" Sudden Event Engine
 * Unpredictable interval director, 10-event crisis/bounty matrix, and tab-sleep safety.
 */

export interface ActiveEventInstance {
  eventId: string;             // References 1 of the 10 systemic events
  type: 'CRISIS' | 'GOLD_RUSH';// Red alarm vs Gold bounty
  title: string;
  emoji: string;
  description: string;
  durationSeconds: number;     // Urgent countdown (30s to 75s)
  expiresAt: number;           // Absolute timestamp: Date.now() + duration * 1000
  resolved: boolean;
  requiredAction: {
    type: 'RESOURCE_SACRIFICE' | 'RAPID_TAP' | 'STAT_CHECK';
    targetCount?: number;      // e.g. 15 taps
    currentProgress: number;
    resourceCost?: {
      type: 'coins' | 'crops';
      amount: number;
      label: string;
    };
    actionPrompt: string;
    actionButtonText: string;
  };
  penaltyOnFail: {
    lossType: 'CROPS' | 'COINS' | 'WORKER_PAUSE';
    amountPercentage: number;  // e.g. 25% or flat amount
    description: string;
  };
  rewardOnSuccess: {
    coins: number;
    gems: number;
    xp: number;
    multiplier?: number;
    relicName?: string;
  };
}

export interface SuddenEventTemplate {
  eventId: string;
  type: 'CRISIS' | 'GOLD_RUSH';
  title: string;
  emoji: string;
  description: string;
  durationSeconds: number;
  minLevel: number; // Crisis events require playerLevel >= 3
  requiredAction: {
    type: 'RESOURCE_SACRIFICE' | 'RAPID_TAP' | 'STAT_CHECK';
    targetCount?: number;
    resourceCost?: {
      type: 'coins' | 'crops';
      amount: number;
      label: string;
    };
    actionPrompt: string;
    actionButtonText: string;
  };
  penaltyOnFail: {
    lossType: 'CROPS' | 'COINS' | 'WORKER_PAUSE';
    amountPercentage: number;
    description: string;
  };
  rewardOnSuccess: {
    coins: number;
    gems: number;
    xp: number;
    multiplier?: number;
    relicName?: string;
  };
}

export const SUDDEN_EVENT_TEMPLATES: Record<string, SuddenEventTemplate> = {
  // 1. Dry Brushfire Blitz (CRISIS)
  barn_fire: {
    eventId: 'barn_fire',
    type: 'CRISIS',
    title: 'Dry Brushfire Blitz!',
    emoji: '🔥',
    description: 'Dry lightning ignited raging flames heading straight for your crop fields! Douse the fire before it consumes the harvest!',
    durationSeconds: 45,
    minLevel: 3,
    requiredAction: {
      type: 'RAPID_TAP',
      targetCount: 15,
      actionPrompt: 'Rapidly tap to bucket-douse the fire lines!',
      actionButtonText: 'DOUSE FLAMES 💦',
    },
    penaltyOnFail: {
      lossType: 'CROPS',
      amountPercentage: 25,
      description: 'Brushfire scorched 25% of your growing crops!',
    },
    rewardOnSuccess: {
      coins: 4500,
      gems: 5,
      xp: 250,
      relicName: 'Mineral Ash Soil (+3x Growth for 1hr)',
    },
  },

  // 2. The Great Locust Swarm (CRISIS)
  locust_swarm: {
    eventId: 'locust_swarm',
    type: 'CRISIS',
    title: 'Great Locust Swarm!',
    emoji: '🦗',
    description: 'A ravenous swarm of locusts is blotting out the sun! Swat them away before they strip your fields bare!',
    durationSeconds: 40,
    minLevel: 3,
    requiredAction: {
      type: 'RAPID_TAP',
      targetCount: 16,
      actionPrompt: 'Rapidly tap to smoke out and repel the swarm!',
      actionButtonText: 'SWAT SWARM 💨',
    },
    penaltyOnFail: {
      lossType: 'CROPS',
      amountPercentage: 30,
      description: 'Locust swarm devoured 30% of your unharvested crops!',
    },
    rewardOnSuccess: {
      coins: 5200,
      gems: 6,
      xp: 300,
      relicName: 'Locust Sentry Charm',
    },
  },

  // 3. Ancient Quarry Cave-In (CRISIS)
  ancient_ruins: {
    eventId: 'ancient_ruins',
    type: 'CRISIS',
    title: 'Quarry Shaft Cave-In!',
    emoji: '⛏️',
    description: 'Underground vibrations threaten to collapse the mineral quarry! Reinforce the timber beams with emergency shoring!',
    durationSeconds: 50,
    minLevel: 4,
    requiredAction: {
      type: 'RAPID_TAP',
      targetCount: 18,
      actionPrompt: 'Rapidly hammer structural timber wedges into the cavern ceiling!',
      actionButtonText: 'SHORE UP BEAMS 🔨',
    },
    penaltyOnFail: {
      lossType: 'WORKER_PAUSE',
      amountPercentage: 100,
      description: 'Quarry collapsed! Autonomous workers panicked and paused for 3 minutes.',
    },
    rewardOnSuccess: {
      coins: 7000,
      gems: 8,
      xp: 350,
      relicName: 'Ancient Sun Relic (+15% XP)',
    },
  },

  // 4. Midnight Smuggler's Barge (GOLD RUSH)
  midnight_smuggler: {
    eventId: 'midnight_smuggler',
    type: 'GOLD_RUSH',
    title: "Smuggler's Midnight Heist!",
    emoji: '⛵',
    description: 'A cloaked black-market river barge docked at the estuary! Pay a secret tariff to secure their high-value contraband cache!',
    durationSeconds: 45,
    minLevel: 2,
    requiredAction: {
      type: 'RESOURCE_SACRIFICE',
      resourceCost: {
        type: 'coins',
        amount: 150,
        label: '150 Coins',
      },
      actionPrompt: 'Pay 150 Coins to secure the contraband crate before the barge slips away!',
      actionButtonText: 'PAY 150 COINS 💰',
    },
    penaltyOnFail: {
      lossType: 'COINS',
      amountPercentage: 0,
      description: 'The cloaked barge slipped away into the night mist.',
    },
    rewardOnSuccess: {
      coins: 12000,
      gems: 10,
      xp: 400,
      relicName: "Smuggler's Compass (-20% Wilderness Timers)",
    },
  },

  // 5. Royal Armada Emergency Charter (GOLD RUSH)
  royal_fleet: {
    eventId: 'royal_fleet',
    type: 'GOLD_RUSH',
    title: 'Royal Armada Provision Charter!',
    emoji: '🚢',
    description: "The King's flagship is departing on an overseas crusade! Subsidize emergency provision crates for an immense royal bounty!",
    durationSeconds: 60,
    minLevel: 3,
    requiredAction: {
      type: 'RESOURCE_SACRIFICE',
      resourceCost: {
        type: 'coins',
        amount: 250,
        label: '250 Coins',
      },
      actionPrompt: 'Dispatch royal provision crates (250 Coins) to the harbor before departure!',
      actionButtonText: 'SUPPLY CHARTER (250🪙)',
    },
    penaltyOnFail: {
      lossType: 'COINS',
      amountPercentage: 0,
      description: 'The Armada hoisted sails and departed without your charter.',
    },
    rewardOnSuccess: {
      coins: 24000,
      gems: 15,
      xp: 600,
      relicName: 'Royal Crown Crest (+15% Order Payouts)',
    },
  },

  // 6. Estuary Salmon Frenzy (GOLD RUSH)
  salmon_run: {
    eventId: 'salmon_run',
    type: 'GOLD_RUSH',
    title: 'Estuary Salmon Frenzy!',
    emoji: '🐟',
    description: 'A massive run of rare Golden-Scale Salmon is leaping upstream through your fishery! Scoop them before they reach open waters!',
    durationSeconds: 35,
    minLevel: 2,
    requiredAction: {
      type: 'RAPID_TAP',
      targetCount: 18,
      actionPrompt: 'Rapidly tap to cast landing nets and scoop leaping salmon!',
      actionButtonText: 'CAST NET 🎣',
    },
    penaltyOnFail: {
      lossType: 'COINS',
      amountPercentage: 0,
      description: 'The salmon school vanished into deep river rapids.',
    },
    rewardOnSuccess: {
      coins: 9500,
      gems: 7,
      xp: 320,
    },
  },

  // 7. County Fair Blue Ribbon Rush (GOLD RUSH)
  county_fair: {
    eventId: 'county_fair',
    type: 'GOLD_RUSH',
    title: 'County Fair Flash Judging!',
    emoji: '🎪',
    description: "The Grand Royal Agronomist has arrived unexpectedly! Polish and present your estate's finest harvest to claim the Blue Ribbon!",
    durationSeconds: 45,
    minLevel: 2,
    requiredAction: {
      type: 'RAPID_TAP',
      targetCount: 14,
      actionPrompt: 'Polish and arrange exhibition produce baskets before judging concludes!',
      actionButtonText: 'POLISH EXHIBIT 🧺',
    },
    penaltyOnFail: {
      lossType: 'COINS',
      amountPercentage: 0,
      description: 'Judging concluded and the commissioner awarded the ribbon elsewhere.',
    },
    rewardOnSuccess: {
      coins: 14000,
      gems: 8,
      xp: 450,
      relicName: 'County Fair Trophy (+3 Gems Daily)',
    },
  },

  // 8. Wandering Carnival Caravan (GOLD RUSH)
  carnival_circus: {
    eventId: 'carnival_circus',
    type: 'GOLD_RUSH',
    title: 'Carnival Circus Breakdown!',
    emoji: '🦁',
    description: 'The traveling grand circus caravan broke an axle at your farm crossroads! Help hoist the tent and feed the exotic animals!',
    durationSeconds: 40,
    minLevel: 2,
    requiredAction: {
      type: 'RAPID_TAP',
      targetCount: 15,
      actionPrompt: 'Heave ropes and hoist the main circus tent before evening showtime!',
      actionButtonText: 'HOIST ROPES 🎪',
    },
    penaltyOnFail: {
      lossType: 'COINS',
      amountPercentage: 0,
      description: 'The carnival repaired the wagon and rolled away to the capital.',
    },
    rewardOnSuccess: {
      coins: 11000,
      gems: 7,
      xp: 380,
      relicName: 'Circus Cub Companion (+10% Farm XP)',
    },
  },

  // 9. Wild Alchemical Spore Bloom (GOLD RUSH)
  alchemical_bloom: {
    eventId: 'alchemical_bloom',
    type: 'GOLD_RUSH',
    title: 'Alchemical Spore Bloom!',
    emoji: '🍄',
    description: 'Bioluminescent purple spore pods erupted across the soil! Catch the floating spores before they evaporate into vapor!',
    durationSeconds: 30,
    minLevel: 1,
    requiredAction: {
      type: 'RAPID_TAP',
      targetCount: 20,
      actionPrompt: 'Rapidly pluck floating alchemical spores from the air!',
      actionButtonText: 'CATCH SPORE ✨',
    },
    penaltyOnFail: {
      lossType: 'COINS',
      amountPercentage: 0,
      description: 'The delicate spores dissolved into purple morning mist.',
    },
    rewardOnSuccess: {
      coins: 8500,
      gems: 10,
      xp: 420,
      relicName: '+3 Instant-Finish Alchemical Spores',
    },
  },

  // 10. Master Craftsman Guild Inspection (GOLD RUSH)
  artisan_masterclass: {
    eventId: 'artisan_masterclass',
    type: 'GOLD_RUSH',
    title: 'Artisan Guild Flash Inspection!',
    emoji: '⚙️',
    description: 'The High Guildmasters are touring the region! Overclock your looms, hearths, and presses to win the Master Artisan Ledger!',
    durationSeconds: 45,
    minLevel: 3,
    requiredAction: {
      type: 'RAPID_TAP',
      targetCount: 16,
      actionPrompt: 'Work the gears and stoke the forge fires to showcase peak mastercrafting!',
      actionButtonText: 'OVERCLOCK GEARS 🔨',
    },
    penaltyOnFail: {
      lossType: 'COINS',
      amountPercentage: 0,
      description: 'The inspectors concluded their rounds and departed.',
    },
    rewardOnSuccess: {
      coins: 18000,
      gems: 12,
      xp: 550,
      relicName: 'Master Artisan Ledger (-5% Craft Times)',
    },
  },
};

/**
 * Returns a randomized delay interval between 8 and 15 minutes (in milliseconds).
 */
export function getNextSuddenEventDelay(): number {
  const minMinutes = 8;
  const maxMinutes = 15;
  const minutes = minMinutes + Math.random() * (maxMinutes - minMinutes);
  return Math.round(minutes * 60 * 1000);
}

/**
 * Deterministically constructs an ActiveEventInstance from template.
 */
export function createSuddenEventInstance(
  templateId?: string,
  playerLevel = 1
): ActiveEventInstance {
  const allTemplates = Object.values(SUDDEN_EVENT_TEMPLATES);

  let selected: SuddenEventTemplate;

  if (templateId && SUDDEN_EVENT_TEMPLATES[templateId]) {
    selected = SUDDEN_EVENT_TEMPLATES[templateId];
  } else {
    // Filter candidates by level. Guard: Crisis events require playerLevel >= 3
    const eligible = allTemplates.filter((t) => {
      if (t.type === 'CRISIS' && playerLevel < 3) return false;
      return playerLevel >= t.minLevel;
    });

    const pool = eligible.length > 0 ? eligible : allTemplates.filter((t) => t.type === 'GOLD_RUSH');
    selected = pool[Math.floor(Math.random() * pool.length)];
  }

  const durationSec = selected.durationSeconds;

  return {
    eventId: selected.eventId,
    type: selected.type,
    title: selected.title,
    emoji: selected.emoji,
    description: selected.description,
    durationSeconds: durationSec,
    expiresAt: Date.now() + durationSec * 1000,
    resolved: false,
    requiredAction: {
      type: selected.requiredAction.type,
      targetCount: selected.requiredAction.targetCount,
      currentProgress: 0,
      resourceCost: selected.requiredAction.resourceCost,
      actionPrompt: selected.requiredAction.actionPrompt,
      actionButtonText: selected.requiredAction.actionButtonText,
    },
    penaltyOnFail: { ...selected.penaltyOnFail },
    rewardOnSuccess: { ...selected.rewardOnSuccess },
  };
}
