import { FeedingStrategy } from './inventory';

export interface WranglerPolicyConfig {
  isEnabled: boolean;
  strategy: FeedingStrategy; // 'budget_saver' (cheapest) vs 'gourmet_breeder' (favorite first)
  globalReserveFloor: number; // Default: 10 (minimum stock retained in Barn)
}

export const DEFAULT_WRANGLER_POLICY: WranglerPolicyConfig = {
  isEnabled: true,
  strategy: 'budget_saver',
  globalReserveFloor: 10,
};
