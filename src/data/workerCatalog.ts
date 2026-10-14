export type WorkerSpecialty = 'crop_tender' | 'artisan_crafter' | 'wild_hauler' | 'paddock_wrangler' | 'stable_master';

export type SpecialistWorkerId = 'worker_caravaner_orin' | 'worker_wrangler_tessa' | 'worker_stablemaster_elric';

export interface HireableWorkerTemplate {
  id: SpecialistWorkerId;
  name: string;
  title: string;
  specialty: WorkerSpecialty;
  avatar: string;
  hireCostCoins: number;
  dailyWageCoins: number;
  description: string;
  station: string;
  stationEmoji: string;
  perks: string[];
  themeColor: {
    border: string;
    bg: string;
    badge: string;
    accent: string;
  };
}

export const LIVESTOCK_WORKER_ROSTER: HireableWorkerTemplate[] = [
  {
    id: 'worker_caravaner_orin',
    name: 'Orin the Trailrunner',
    title: 'Wilderness Caravaner',
    specialty: 'wild_hauler',
    avatar: '🚜',
    hireCostCoins: 350,
    dailyWageCoins: 25,
    description: 'Drives a sturdy handcart between the Wild Camp and the farm.',
    station: 'Wild Camp & Expedition Outpost',
    stationEmoji: '🏕️',
    perks: [
      'Automatically collects crated beasts from Wild Camp Haul',
      'Transfers animals to matching quadrant pens without manual player clicks',
      '+1 extra expedition pack slot while hired',
      'Prevents wild capture overflow by placing excess crates into livestock reserve',
    ],
    themeColor: {
      border: 'border-amber-400 dark:border-amber-600',
      bg: 'from-amber-500/10 to-orange-500/10',
      badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
      accent: 'text-amber-600 dark:text-amber-400',
    },
  },
  {
    id: 'worker_wrangler_tessa',
    name: 'Tessa the Gentle',
    title: 'Paddock Wrangler',
    specialty: 'paddock_wrangler',
    avatar: '🌾',
    hireCostCoins: 450,
    dailyWageCoins: 30,
    description: 'Attends to the physical care and feed schedules of farm livestock.',
    station: 'Pasture Paddocks & Barns',
    stationEmoji: '🐄',
    perks: [
      'Automatically feeds animals using Barn grains when hunger timers reach 0',
      'Keeps animals in "Well-Fed" status (+10% breeding mutation luck bonus)',
      '-10% coin cost for animal overclocks',
    ],
    themeColor: {
      border: 'border-emerald-400 dark:border-emerald-600',
      bg: 'from-emerald-500/10 to-teal-500/10',
      badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
      accent: 'text-emerald-600 dark:text-emerald-400',
    },
  },
  {
    id: 'worker_stablemaster_elric',
    name: 'Master Elric',
    title: 'Incubator & Stable Master',
    specialty: 'stable_master',
    avatar: '🧬',
    hireCostCoins: 600,
    dailyWageCoins: 40,
    description: 'Geneticist who tends incubator chambers and monitors animal bloodlines.',
    station: 'Incubator Altar & Nursery',
    stationEmoji: '🥚',
    perks: [
      'Permanently cuts active egg incubation countdown timers by 20%',
      'Reduces post-breeding genetic rest cooldown on parent animals by 25%',
      'Automatically triggers egg hatch and reveal when incubation finishes',
      'Safely routes newborns to their designated rarity quadrant pen',
    ],
    themeColor: {
      border: 'border-indigo-400 dark:border-indigo-600',
      bg: 'from-indigo-500/10 to-purple-500/10',
      badge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300',
      accent: 'text-indigo-600 dark:text-indigo-400',
    },
  },
];

export interface SpecialistWorkerState {
  id: SpecialistWorkerId;
  isHired: boolean;
  isActive: boolean; // true = on duty, false = resting
  isStriking: boolean; // true if wage couldn't be paid
  hiredAt: number | null;
  unpaidWages: number;
  totalWagesPaid: number;
}

export function createDefaultSpecialistWorkers(): Record<SpecialistWorkerId, SpecialistWorkerState> {
  return {
    worker_caravaner_orin: {
      id: 'worker_caravaner_orin',
      isHired: false,
      isActive: true,
      isStriking: false,
      hiredAt: null,
      unpaidWages: 0,
      totalWagesPaid: 0,
    },
    worker_wrangler_tessa: {
      id: 'worker_wrangler_tessa',
      isHired: false,
      isActive: true,
      isStriking: false,
      hiredAt: null,
      unpaidWages: 0,
      totalWagesPaid: 0,
    },
    worker_stablemaster_elric: {
      id: 'worker_stablemaster_elric',
      isHired: false,
      isActive: true,
      isStriking: false,
      hiredAt: null,
      unpaidWages: 0,
      totalWagesPaid: 0,
    },
  };
}
