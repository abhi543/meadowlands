# Dynamic Gas Ecosystem (CO₂, O₂, N) — Agronomy & Environmental Design Guide

## 1. System Overview & Core Philosophy
The Dynamic Gas Ecosystem expands the agronomy and environmental simulation of Meadowlands by tracking three distinct atmospheric soil gases—**Carbon Dioxide (CO₂)**, **Oxygen (O₂)**, and **Nitrogen (N)**—per plot as real-time 0%–100% percentages. 

Rather than treating farming as static timer loops, each gas interacts dynamically with:
- **Active Weather & Microclimates** (Precipitation, storms, droughts, heatwaves, gales)
- **Spatial Infrastructure & Animal Proximity** (Pastures, compost heaps, fermentation barrels)
- **Soil Hydrology & Pore Saturation** (Capillary loam, waterlogging, irrigation rates)
- **Crop Lifecycle & Crop Rotation** (Vegetative canopy, heavy feeders vs. nitrogen-fixing legumes, root aeration)

This converts simple sowing into a multi-layered tactical optimization puzzle where spatial planning and crop sequencing directly dictate growth velocity and harvest yields.

---

## 2. Core Gas Specifications & Rulebook

### A. Carbon Dioxide (CO₂: 0%–100%) — "The Canopy Speed Engine"
- **Primary Function:** Governs photosynthetic velocity and crop maturation speed.
- **Baseline / Ambient Value:** 25% (unmodified open-air baseline).
- **Sources of Increase (+):**
  - **Proximity to Livestock Pens / Sanctuary Habitats (within 3 tiles):** `+40%` (Animal respiration and microbial metabolic emissions).
  - **Proximity to Active Compost Heaps / Fermentation Barrels:** `+25%` (Organic decomposition output).
  - **Sunny / Heatwave Weather Conditions:** `+15%` (Thermal convective activity).
  - **Vegetative Canopy Cover (Mature / Advanced crop on plot):** `+10%` (Microclimate boundary layer trapping CO₂).
- **Sources of Decrease (-):**
  - **High Gale / Windstorm Weather Events:** `-30%` (Vigorous turbulent dispersion of boundary-layer CO₂).
  - **Isolated / Remote Plots (Far from buildings or tree lines):** `-15%` (Continuous wind exposure).
  - **Barren / Fallow Empty Dirt:** `-10%` (Absence of vegetative respiration).
- **Gameplay Thresholds & Rules:**
  - **>60% (Optimal Boost — "Boosted Velocity"):** For every 2% CO₂ above 60%, crop growth speed increases by `+1%` (e.g., 80% CO₂ grants `+10%` speed; capped at `+40%` speed boost at 100% CO₂).
  - **20%–59% (Standard):** Baseline growth duration (1.0x nominal speed).
  - **<20% (Thin Air Penalty):** Growth velocity throttled; crops take `+20%` longer to reach maturity.

---

### B. Oxygen (O₂: 0%–100%) — "The Soil Breath & Drainage Meter"
- **Primary Function:** Controls root-zone respiration, soil pore aeration, and waterlogging/flooding prevention.
- **Target Optimal Range:** 45%–75% (Aerated Capillary Loam).
- **Sources of Increase (+):**
  - **Manual Tilling with Trowel / Hoe Tool:** Instantly restores soil Oxygen to `60%`.
  - **Harvesting Root Crops (Carrots / Turnips):** `+20%` root-extraction aeration bonus.
  - **Drainage Furrows / Trenches Connected to Plot:** `+25%` passive air retention.
  - **Heatwave / Drought Weather:** `+15%` (Sub-surface evaporation clears pore space for gas exchange).
- **Sources of Decrease (-):**
  - **Torrential Rain / Downpour Weather:** `-10%` every 10 seconds of active deluge (Flooding hazard).
  - **Excessive / Unthrottled Canal Irrigation:** `-30%` (Saturated soil blocks atmospheric diffusion).
  - **Repeated Planting Without Tilling (Soil Compaction):** `-15%` compaction drain per cycle.
- **Gameplay Thresholds & Rules:**
  - **45%–75% (Optimal Range):** Normal nutrient uptake and standard 1.0x water consumption.
  - **<20% (CRITICAL FAILURE — "Root Anoxia / Suffocation"):**
    - Crop growth timer **completely freezes/pauses**.
    - Displays active alert: `🫧 Root Suffocation`.
    - **Resolution:** Must open drainage spillway, till the bed with a hoe, or flush the bed.
  - **>85% (Warning — "Parched / Over-Aerated Ground"):**
    - Soil is excessively loose and dry.
    - Crop water consumption doubles (**2x water drain**).

---

### C. Nitrogen (N: 0%–100%) — "The Soil Yield Battery"
- **Primary Function:** Dictates final harvest yield multiplier and plant biological vigor.
- **Target Optimal Range:** 70%–100% (High Fertility).
- **Sources of Increase (+):**
  - **Harvesting Restorative Legumes (Peas / Soybeans / Clover):** `+50% N` fixed into soil at harvest.
  - **Applying Animal Manure / Organic Compost:** Instantly refills Nitrogen to `100% N`.
  - **Applying Universal Bio-Dressing / Prehistoric Humus:** Instantly refills Nitrogen to `100% N`.
  - **Fallow Cover Crop (leaving clover or resting bed per cycle):** `+15% N`.
- **Sources of Decrease (-):**
  - **Harvesting Heavy Feeders (Wheat, Corn, Cotton):** `-35% N` depleted per harvest.
  - **Monoculture Repeat Penalty:** Additional `-10% N` per consecutive same-crop planting.
  - **Bare Fallow Soil in Heavy Rain (Leaching):** `-15% N` leached away by runoff.
- **Gameplay Thresholds & Rules:**
  - **70%–100% (High Fertility):** Full **3x** Harvest Yield.
  - **35%–69% (Moderate Fertility):** Standard **2x** Harvest Yield.
  - **<35% (CRITICAL DEFICIT — Exhausted Soil):**
    - Harvest drops to penalty **1x Yield**.
    - Crop growth timer duration doubles (**2x grow time**).
    - 50% risk of weed infestation blocking the final harvest.

---

## 3. UI Display & Hover Mechanics

1. **Centralized Gas Console & Metric Progress Bars:**
   - Real-time percentage bars for CO₂, O₂, and N with three distinct color bands:
     - 🟢 **Green Bar:** Metric is in the optimal / buffed range (CO₂ > 60%, O₂ 45%–75%, N 70%–100%).
     - 🟡 **Yellow Bar:** Metric is in the moderate / warning range (CO₂ 20%–59%, O₂ 20%–44% or 76%–85%, N 35%–69%).
     - 🔴 **Red / Flashing Bar:** Metric is in the critical failure / penalty range (CO₂ < 20%, O₂ < 20% or > 85%, N < 35%).
   - Dynamic arrows indicating real-time drift: `▲▲` (Rapid gain), `▲` (Gain), `●` (Stable), `▼` (Drain), `▼▼` (Deluge/Leaching drain).
2. **Interactive Hover Inspection:**
   - Hovering any farm plot immediately focuses the console on that specific bed (`🔎 Plot #X Gas Metrics`), displaying live percentage numbers, active modifiers, and net outputs.
3. **Pre-Plant Stamp Feedback:**
   - Hovering seed packets in the crop selector displays a predictive forecast banner:
     - Example: `CO₂: 80% ▲ (+10% Speed) | O₂: 65% (Optimal) | N: 85% (3x Yield)`
     - Alert: `⚠️ WARNING: O₂ at 15% (Roots Choking) — Drain water or till before planting!`
