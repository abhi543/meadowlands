export type FeedingStrategy = 'budget_saver' | 'gourmet_breeder';

export type BarnItemCategory = 'crop' | 'forage' | 'artisan' | 'animal_product';

export interface BarnItem {
  id: string;
  name: string;
  icon: string;
  category: BarnItemCategory;
  quantity: number;
  baseValue: number;
  // Automation Protection
  isLockedForWorkers: boolean; // Default: false (true = workers cannot touch)
  customReserveThreshold?: number; // Optional per-item reserve floor override
}

export type BarnItemLockMap = Record<
  string,
  {
    isLockedForWorkers: boolean;
    customReserveThreshold?: number;
  }
>;
