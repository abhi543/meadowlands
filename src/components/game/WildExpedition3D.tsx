'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { useGameStore } from '@/game/store';
import {
  playCashRegisterSound,
  playVictoryChime,
  playDefeatSound,
  playGoldRushFanfare,
  playRapidTapSound,
  playCrisisAlarm,
} from '@/lib/soundEffects';

// --- TYPES & INTERFACES ---
export type TileType = 'start' | 'empty' | 'chest' | 'hazard' | 'portal' | 'shrine';
export type HazardKind = 'wolf' | 'trap' | 'spores';

export interface TileData {
  x: number; // 0..3
  z: number; // 0..3
  type: TileType;
  hazardKind?: HazardKind;
  revealed: boolean;
  cleared: boolean;
  visited?: boolean;
  reward?: {
    coins: number;
    gems: number;
    geneTokens: number;
    relicFragments: number;
    seedName?: string;
  };
}

export interface SparkParticle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
}

export interface DepthConfig {
  depth: number;
  name: string;
  theme: string;
  mult: number;
  groundColor: number;
  pedestalColor: number;
  accentColor: number;
  twilightColor: number;
  hazardRiskPercent: number;
}

const DEPTH_CONFIGS: DepthConfig[] = [
  {
    depth: 1,
    name: 'Whispering Outpost',
    theme: 'Verdant Twilight Woods',
    mult: 1,
    groundColor: 0x2e6f40,
    pedestalColor: 0x1a4324,
    accentColor: 0x4ade80,
    twilightColor: 0x1e1b4b,
    hazardRiskPercent: 15,
  },
  {
    depth: 2,
    name: 'Foggy Ridge',
    theme: 'Misty Slate Highlands',
    mult: 2,
    groundColor: 0x475569,
    pedestalColor: 0x1e293b,
    accentColor: 0x38bdf8,
    twilightColor: 0x172554,
    hazardRiskPercent: 35,
  },
  {
    depth: 3,
    name: 'Cavern Depths',
    theme: 'Amethyst Subterrane',
    mult: 4,
    groundColor: 0x581c87,
    pedestalColor: 0x2e1065,
    accentColor: 0xc084fc,
    twilightColor: 0x2e0854,
    hazardRiskPercent: 55,
  },
  {
    depth: 4,
    name: 'Crystal Chasms',
    theme: 'Bioluminescent Abyss',
    mult: 8,
    groundColor: 0x0f766e,
    pedestalColor: 0x134e4a,
    accentColor: 0x2dd4bf,
    twilightColor: 0x042f2e,
    hazardRiskPercent: 75,
  },
  {
    depth: 5,
    name: 'Ancient Hollow',
    theme: 'Eldritch Golden Ruins',
    mult: 16,
    groundColor: 0x854d0e,
    pedestalColor: 0x451a03,
    accentColor: 0xfacc15,
    twilightColor: 0x3f1205,
    hazardRiskPercent: 95,
  },
];

const GRID_SIZE = 4;
const TILE_SPACING = 2.0;

function gridToWorld(x: number, z: number): [number, number] {
  return [(x - 1.5) * TILE_SPACING, (z - 1.5) * TILE_SPACING];
}

export function WildExpedition3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Store bindings
  const {
    coins,
    gems,
    xp,
    level,
    barn,
    wildExpedition,
    addNotification,
  } = useGameStore();

  // Local Roguelite Expedition State
  const [depth, setDepth] = useState<number>(1);
  const [stamina, setStamina] = useState<number>(100);
  const [torchTime, setTorchTime] = useState<number>(65); // 65 seconds torch timer
  const [isExpeditionActive, setIsExpeditionActive] = useState<boolean>(false);
  const [playerCoord, setPlayerCoord] = useState<{ x: number; z: number }>({ x: 0, z: 0 });
  const [unbankedLoot, setUnbankedLoot] = useState<{
    coins: number;
    gems: number;
    geneTokens: number;
    relicFragments: number;
    seedName?: string;
    seedCount: number;
  }>({
    coins: 0,
    gems: 0,
    geneTokens: 0,
    relicFragments: 0,
    seedCount: 0,
  });

  const [activeHazardAlert, setActiveHazardAlert] = useState<{
    title: string;
    description: string;
    hazardKind: HazardKind;
    damage: number;
  } | null>(null);

  const [floatingCombatText, setFloatingCombatText] = useState<{
    id: string;
    text: string;
    color: string;
    emoji: string;
  }[]>([]);

  const [escapeBombs, setEscapeBombs] = useState<number>(2);
  const [fieldRations, setFieldRations] = useState<number>(2);
  const [runSummary, setRunSummary] = useState<{
    outcome: 'victory' | 'wipeout';
    depthReached: number;
    bankedCoins: number;
    bankedGems: number;
    bankedTokens: number;
    lostCoins?: number;
  } | null>(null);

  // References for Three.js state loop
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const playerGroupRef = useRef<THREE.Group | null>(null);
  const torchLightRef = useRef<THREE.PointLight | null>(null);
  const portalGroupRef = useRef<THREE.Group | null>(null);

  // Scene entities mapped by key "x,z"
  const tileMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const fogMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const chestGroupsRef = useRef<Map<string, { group: THREE.Group; lidGroup: THREE.Group; opened: boolean }>>(new Map());
  const hazardIndicatorsRef = useRef<Map<string, THREE.Group>>(new Map());
  const shrineMeshesRef = useRef<Map<string, THREE.Group>>(new Map());

  // Particles
  const sparksRef = useRef<SparkParticle[]>([]);
  const shakeRef = useRef<{ amount: number; duration: number }>({ amount: 0, duration: 0 });

  // Movement animation ref
  const movementRef = useRef<{
    isMoving: boolean;
    startX: number;
    startZ: number;
    targetX: number;
    targetZ: number;
    progress: number;
    duration: number;
  }>({
    isMoving: false,
    startX: 0,
    startZ: 0,
    targetX: 0,
    targetZ: 0,
    progress: 1,
    duration: 0.35,
  });

  // Current Grid data state ref for click handlers
  const gridDataRef = useRef<Map<string, TileData>>(new Map());
  const playerCoordRef = useRef<{ x: number; z: number }>({ x: 0, z: 0 });
  const staminaRef = useRef<number>(100);
  const isExpeditionActiveRef = useRef<boolean>(false);

  // Sync refs
  useEffect(() => {
    playerCoordRef.current = playerCoord;
  }, [playerCoord]);
  useEffect(() => {
    staminaRef.current = stamina;
  }, [stamina]);
  useEffect(() => {
    isExpeditionActiveRef.current = isExpeditionActive;
  }, [isExpeditionActive]);

  // Helper to trigger camera shake
  const triggerCameraShake = useCallback((magnitude = 0.35, timeSec = 0.5) => {
    shakeRef.current = { amount: magnitude, duration: timeSec };
  }, []);

  // Helper to add floating combat text
  const pushCombatText = useCallback((text: string, color: string, emoji: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setFloatingCombatText(prev => [...prev.slice(-3), { id, text, color, emoji }]);
    setTimeout(() => {
      setFloatingCombatText(prev => prev.filter(item => item.id !== id));
    }, 2000);
  }, []);

  // Procedural Generator for 4x4 Grid
  const generateGrid = useCallback((depthLevel: number): Map<string, TileData> => {
    const map = new Map<string, TileData>();
    const config = DEPTH_CONFIGS[depthLevel - 1] || DEPTH_CONFIGS[0];

    // Initialize all as empty
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let z = 0; z < GRID_SIZE; z++) {
        map.set(`${x},${z}`, {
          x,
          z,
          type: 'empty',
          revealed: false,
          cleared: false,
        });
      }
    }

    // Set Start at [0, 0]
    const startTile = map.get('0,0')!;
    startTile.type = 'start';
    startTile.revealed = true;
    startTile.cleared = true;

    // Set Descent Portal at [3, 3]
    const portalTile = map.get('3,3')!;
    portalTile.type = 'portal';

    // Collect available middle coords (exclude 0,0 and 3,3)
    const availableCoords: string[] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let z = 0; z < GRID_SIZE; z++) {
        if ((x === 0 && z === 0) || (x === 3 && z === 3)) continue;
        availableCoords.push(`${x},${z}`);
      }
    }

    // Shuffle coords
    for (let i = availableCoords.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availableCoords[i], availableCoords[j]] = [availableCoords[j], availableCoords[i]];
    }

    // Assign 3-4 Chests
    const chestCount = 3 + (Math.random() > 0.4 ? 1 : 0);
    for (let i = 0; i < chestCount && availableCoords.length > 0; i++) {
      const coord = availableCoords.pop()!;
      const tile = map.get(coord)!;
      tile.type = 'chest';
      tile.reward = {
        coins: Math.round((45 + Math.random() * 35) * config.mult),
        gems: depthLevel >= 2 ? Math.round(1 + Math.random() * (depthLevel - 1)) : 0,
        geneTokens: Math.round(1 * config.mult),
        relicFragments: depthLevel >= 3 ? Math.round(1 + Math.random()) : 0,
        seedName: depthLevel >= 2 ? 'ancient_sunflower' : undefined,
      };
    }

    // Assign 2-3 Hazards
    const hazardKinds: HazardKind[] = ['wolf', 'trap', 'spores'];
    const hazardCount = 2 + (depthLevel >= 3 ? 1 : 0);
    for (let i = 0; i < hazardCount && availableCoords.length > 0; i++) {
      const coord = availableCoords.pop()!;
      const tile = map.get(coord)!;
      tile.type = 'hazard';
      tile.hazardKind = hazardKinds[Math.floor(Math.random() * hazardKinds.length)];
    }

    // Assign 1 Shrine / Oasis
    if (availableCoords.length > 0) {
      const coord = availableCoords.pop()!;
      const tile = map.get(coord)!;
      tile.type = 'shrine';
    }

    // Reveal adjacent neighbors around start [0,0]
    [[0, 1], [1, 0], [1, 1]].forEach(([nx, nz]) => {
      const neighbor = map.get(`${nx},${nz}`);
      if (neighbor) neighbor.revealed = true;
    });

    return map;
  }, []);

  // Spawn spark explosion at coordinates
  const spawnSparkSparks = useCallback((worldX: number, worldZ: number) => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;
    const sparkGeo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
    const sparkMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xf59e0b,
      emissiveIntensity: 2.0,
      roughness: 0.1,
    });

    for (let i = 0; i < 28; i++) {
      const sparkMesh = new THREE.Mesh(sparkGeo, sparkMat.clone());
      sparkMesh.position.set(
        worldX + (Math.random() - 0.5) * 0.3,
        0.5 + Math.random() * 0.2,
        worldZ + (Math.random() - 0.5) * 0.3
      );
      scene.add(sparkMesh);

      const angle = Math.random() * Math.PI * 2;
      const speed = 1.8 + Math.random() * 2.5;
      const vy = 3.0 + Math.random() * 2.5;

      sparksRef.current.push({
        mesh: sparkMesh,
        vx: Math.cos(angle) * speed,
        vy,
        vz: Math.sin(angle) * speed,
        life: 0,
        maxLife: 0.8 + Math.random() * 0.5,
      });
    }
  }, []);

  // Update Fog of War: dissolve fog within distance 1 of player
  const updateFogOfWar = useCallback((px: number, pz: number) => {
    const grid = gridDataRef.current;
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        const nx = px + dx;
        const nz = pz + dz;
        if (nx >= 0 && nx < GRID_SIZE && nz >= 0 && nz < GRID_SIZE) {
          const key = `${nx},${nz}`;
          const tile = grid.get(key);
          if (tile && !tile.revealed) {
            tile.revealed = true;
          }
        }
      }
    }
  }, []);

  // BUILD OR REBUILD 3D SCENE MESHES FOR A GIVEN DEPTH
  const rebuildSceneForDepth = useCallback((depthLevel: number) => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;
    const config = DEPTH_CONFIGS[depthLevel - 1] || DEPTH_CONFIGS[0];

    // Clean up existing meshes
    tileMeshesRef.current.forEach(mesh => scene.remove(mesh));
    tileMeshesRef.current.clear();

    fogMeshesRef.current.forEach(mesh => scene.remove(mesh));
    fogMeshesRef.current.clear();

    chestGroupsRef.current.forEach(entry => scene.remove(entry.group));
    chestGroupsRef.current.clear();

    hazardIndicatorsRef.current.forEach(mesh => scene.remove(mesh));
    hazardIndicatorsRef.current.clear();

    shrineMeshesRef.current.forEach(mesh => scene.remove(mesh));
    shrineMeshesRef.current.clear();

    // Generate fresh grid data
    const grid = generateGrid(depthLevel);
    gridDataRef.current = grid;

    // Build Ground Pedestals & Tiles
    const groundGeo = new THREE.BoxGeometry(1.88, 0.35, 1.88);
    const subBaseGeo = new THREE.BoxGeometry(1.98, 0.2, 1.98);

    grid.forEach((tile, key) => {
      const [wx, wz] = gridToWorld(tile.x, tile.z);

      // Sub-base (darker foundation stone)
      const subMat = new THREE.MeshStandardMaterial({
        color: config.pedestalColor,
        roughness: 0.9,
        flatShading: true,
      });
      const subMesh = new THREE.Mesh(subBaseGeo, subMat);
      subMesh.position.set(wx, -0.1, wz);
      scene.add(subMesh);

      // Main ground surface tile
      const groundMat = new THREE.MeshStandardMaterial({
        color: config.groundColor,
        roughness: 0.7,
        flatShading: true,
      });
      const groundMesh = new THREE.Mesh(groundGeo, groundMat);
      groundMesh.position.set(wx, 0.15, wz);
      groundMesh.userData = { tileKey: key, x: tile.x, z: tile.z };
      scene.add(groundMesh);
      tileMeshesRef.current.set(key, groundMesh);

      // Create Fog block if not revealed
      const fogGeo = new THREE.BoxGeometry(1.92, 1.15, 1.92);
      const fogMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        roughness: 0.85,
        transparent: true,
        opacity: tile.revealed ? 0 : 0.94,
      });
      const fogMesh = new THREE.Mesh(fogGeo, fogMat);
      fogMesh.position.set(wx, 0.8, wz);
      fogMesh.visible = !tile.revealed;
      scene.add(fogMesh);
      fogMeshesRef.current.set(key, fogMesh);

      // --- TILE ENCOUNTERS 3D MODELS ---
      if (tile.type === 'chest') {
        // Low-poly Treasure Chest
        const chestGroup = new THREE.Group();
        chestGroup.position.set(wx, 0.32, wz);

        // Chest base box
        const chestBaseGeo = new THREE.BoxGeometry(0.62, 0.32, 0.44);
        const chestWoodMat = new THREE.MeshStandardMaterial({
          color: 0x78350f, // rich mahogany wood
          roughness: 0.6,
          flatShading: true,
        });
        const chestBase = new THREE.Mesh(chestBaseGeo, chestWoodMat);
        chestBase.position.y = 0.16;
        chestGroup.add(chestBase);

        // Gold band trim on base
        const bandGeo = new THREE.BoxGeometry(0.64, 0.08, 0.46);
        const goldBandMat = new THREE.MeshStandardMaterial({
          color: 0xf59e0b,
          metalness: 0.7,
          roughness: 0.3,
        });
        const bandMesh = new THREE.Mesh(bandGeo, goldBandMat);
        bandMesh.position.y = 0.16;
        chestGroup.add(bandMesh);

        // Hinged Lid Group pivoted at back edge
        const lidPivotGroup = new THREE.Group();
        lidPivotGroup.position.set(0, 0.32, -0.21);

        const lidGeo = new THREE.BoxGeometry(0.64, 0.18, 0.46);
        const lidMesh = new THREE.Mesh(lidGeo, chestWoodMat);
        lidMesh.position.set(0, 0.09, 0.22);
        lidPivotGroup.add(lidMesh);

        // Latch gold knob
        const latchGeo = new THREE.BoxGeometry(0.12, 0.1, 0.06);
        const latchMesh = new THREE.Mesh(latchGeo, goldBandMat);
        latchMesh.position.set(0, 0.06, 0.46);
        lidPivotGroup.add(latchMesh);

        chestGroup.add(lidPivotGroup);
        scene.add(chestGroup);

        chestGroupsRef.current.set(key, {
          group: chestGroup,
          lidGroup: lidPivotGroup,
          opened: false,
        });
      } else if (tile.type === 'hazard') {
        // Hazard Visual & Floating Pulsing Warning Diamond
        const hazardGroup = new THREE.Group();
        hazardGroup.position.set(wx, 0.32, wz);

        if (tile.hazardKind === 'wolf') {
          // Low-poly Shadow Wolf pawn
          const wolfMat = new THREE.MeshStandardMaterial({
            color: 0x1f2937,
            roughness: 0.9,
            flatShading: true,
          });
          const wolfBodyGeo = new THREE.BoxGeometry(0.5, 0.35, 0.7);
          const wolfBody = new THREE.Mesh(wolfBodyGeo, wolfMat);
          wolfBody.position.y = 0.25;
          hazardGroup.add(wolfBody);

          const wolfHeadGeo = new THREE.BoxGeometry(0.3, 0.25, 0.35);
          const wolfHead = new THREE.Mesh(wolfHeadGeo, wolfMat);
          wolfHead.position.set(0, 0.4, 0.4);
          hazardGroup.add(wolfHead);

          // Glowing red eyes
          const eyeGeo = new THREE.BoxGeometry(0.06, 0.06, 0.06);
          const eyeMat = new THREE.MeshStandardMaterial({
            color: 0xef4444,
            emissive: 0xff0000,
            emissiveIntensity: 2.0,
          });
          const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
          leftEye.position.set(-0.1, 0.45, 0.58);
          const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
          rightEye.position.set(0.1, 0.45, 0.58);
          hazardGroup.add(leftEye);
          hazardGroup.add(rightEye);
        } else if (tile.hazardKind === 'trap') {
          // Steel Bear Trap
          const trapMat = new THREE.MeshStandardMaterial({
            color: 0x475569,
            metalness: 0.8,
            roughness: 0.3,
            flatShading: true,
          });
          const trapBase = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.08, 8), trapMat);
          trapBase.position.y = 0.05;
          hazardGroup.add(trapBase);

          // Spikes
          for (let s = 0; s < 6; s++) {
            const spike = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.2, 4), trapMat);
            const ang = (s / 6) * Math.PI * 2;
            spike.position.set(Math.cos(ang) * 0.28, 0.16, Math.sin(ang) * 0.28);
            hazardGroup.add(spike);
          }
        } else {
          // Toxic Spore Fungi
          const stemMat = new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.8 });
          const capMat = new THREE.MeshStandardMaterial({
            color: 0xa855f7,
            emissive: 0x7e22ce,
            emissiveIntensity: 1.2,
            roughness: 0.4,
          });
          const mushroom = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.35, 6), stemMat);
          mushroom.position.y = 0.18;
          hazardGroup.add(mushroom);
          const cap = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.22, 7), capMat);
          cap.position.y = 0.38;
          hazardGroup.add(cap);
        }

        // Floating Warning Red Alert Indicator
        const alertIndicator = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.2, 0),
          new THREE.MeshStandardMaterial({
            color: 0xef4444,
            emissive: 0xdc2626,
            emissiveIntensity: 1.8,
            roughness: 0.2,
          })
        );
        alertIndicator.position.y = 1.1;
        hazardGroup.add(alertIndicator);

        scene.add(hazardGroup);
        hazardIndicatorsRef.current.set(key, hazardGroup);
      } else if (tile.type === 'shrine') {
        // Ancient Healing Shrine / Ration Oasis
        const shrineGroup = new THREE.Group();
        shrineGroup.position.set(wx, 0.32, wz);

        const pillarMat = new THREE.MeshStandardMaterial({
          color: 0x334155,
          roughness: 0.8,
          flatShading: true,
        });
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.6, 0.35), pillarMat);
        pillar.position.y = 0.3;
        shrineGroup.add(pillar);

        // Glowing Emerald Orb
        const orbMat = new THREE.MeshStandardMaterial({
          color: 0x10b981,
          emissive: 0x059669,
          emissiveIntensity: 2.2,
        });
        const orb = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), orbMat);
        orb.position.y = 0.75;
        shrineGroup.add(orb);

        scene.add(shrineGroup);
        shrineMeshesRef.current.set(key, shrineGroup);
      } else if (tile.type === 'start') {
        // Campfire stones & embers at [0,0]
        const campGroup = new THREE.Group();
        campGroup.position.set(wx, 0.32, wz);

        const firePitMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.9 });
        const pit = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.08, 6, 8), firePitMat);
        pit.rotation.x = Math.PI / 2;
        pit.position.y = 0.05;
        campGroup.add(pit);

        const emberMat = new THREE.MeshStandardMaterial({
          color: 0xf97316,
          emissive: 0xea580c,
          emissiveIntensity: 2.5,
        });
        const ember = new THREE.Mesh(new THREE.DodecahedronGeometry(0.12), emberMat);
        ember.position.y = 0.12;
        campGroup.add(ember);
        scene.add(campGroup);
      }
    });

    // Move player pawn to [0,0]
    setPlayerCoord({ x: 0, z: 0 });
    playerCoordRef.current = { x: 0, z: 0 };
    if (playerGroupRef.current) {
      const [wx, wz] = gridToWorld(0, 0);
      playerGroupRef.current.position.set(wx, 0.32, wz);
    }
    updateFogOfWar(0, 0);
  }, [generateGrid, updateFogOfWar]);

  // START NEW EXPEDITION
  const handleStartExpedition = useCallback(() => {
    setIsExpeditionActive(true);
    setDepth(1);
    setStamina(100);
    setTorchTime(65);
    setUnbankedLoot({
      coins: 0,
      gems: 0,
      geneTokens: 0,
      relicFragments: 0,
      seedCount: 0,
    });
    setEscapeBombs(2);
    setFieldRations(2);
    setRunSummary(null);
    setActiveHazardAlert(null);

    playGoldRushFanfare();
    addNotification('🏕️ Dispatched 3D Wild Expedition party into the depths!', '🧭', 'info');
    rebuildSceneForDepth(1);
  }, [addNotification, rebuildSceneForDepth]);

  // EXTRACT SAFELY & BANK 100% HAUL
  const handleExtractAndBank = useCallback(() => {
    if (!isExpeditionActive) return;

    playCashRegisterSound();
    playVictoryChime();

    const currentLoot = { ...unbankedLoot };

    // Deposit directly into main game store
    useGameStore.setState(state => {
      const newBarn = { ...state.barn };
      if (currentLoot.seedName && currentLoot.seedCount > 0) {
        newBarn[currentLoot.seedName] = (newBarn[currentLoot.seedName] || 0) + currentLoot.seedCount;
      }

      return {
        coins: state.coins + currentLoot.coins,
        gems: state.gems + currentLoot.gems,
        xp: state.xp + Math.max(50, Math.floor(currentLoot.coins * 0.5)),
        barn: newBarn,
        wildExpedition: {
          ...state.wildExpedition,
          isActive: false,
          currentNodeStatus: 'extracted',
          accumulatedLoot: {
            coins: 0,
            gems: 0,
            seeds: {},
            relicFragments: 0,
            geneTokens: 0,
            rareItems: {},
          },
          history: [
            `3D Wild Haul Extracted: +${currentLoot.coins} 🪙, +${currentLoot.gems} 💎, +${currentLoot.geneTokens} Tokens!`,
            ...state.wildExpedition.history,
          ].slice(0, 10),
        },
        isDirty: true,
      };
    });

    addNotification(
      `🏆 HAUL BANKED! Safe retreat secured +${currentLoot.coins} Coins, +${currentLoot.gems} Gems, +${currentLoot.geneTokens} Tokens!`,
      '🎉',
      'event'
    );

    setRunSummary({
      outcome: 'victory',
      depthReached: depth,
      bankedCoins: currentLoot.coins,
      bankedGems: currentLoot.gems,
      bankedTokens: currentLoot.geneTokens,
    });

    setIsExpeditionActive(false);
  }, [isExpeditionActive, unbankedLoot, depth, addNotification]);

  // WIPEOUT HANDLING
  const handleWipeout = useCallback(() => {
    playDefeatSound();
    const currentLoot = { ...unbankedLoot };
    const salvagedCoins = Math.floor(currentLoot.coins * 0.25);
    const lostCoins = currentLoot.coins - salvagedCoins;

    useGameStore.setState(state => ({
      coins: state.coins + salvagedCoins,
      wildExpedition: {
        ...state.wildExpedition,
        isActive: false,
        partyStamina: 0,
        currentNodeStatus: 'wipeout',
        workerCooldownUntil: Date.now() + 180000,
        accumulatedLoot: {
          coins: 0,
          gems: 0,
          seeds: {},
          relicFragments: 0,
          geneTokens: 0,
          rareItems: {},
        },
        history: [
          `3D Expedition WIPEOUT at Depth ${depth}! Forfeited ${lostCoins} unbanked coins.`,
          ...state.wildExpedition.history,
        ].slice(0, 10),
      },
      isDirty: true,
    }));

    addNotification(
      `💥 EXPEDITION WIPEOUT! Party collapsed. Salvaged ${salvagedCoins} coins (forfeited ${lostCoins}).`,
      '💀',
      'event'
    );

    setRunSummary({
      outcome: 'wipeout',
      depthReached: depth,
      bankedCoins: salvagedCoins,
      bankedGems: 0,
      bankedTokens: 0,
      lostCoins,
    });

    setIsExpeditionActive(false);
  }, [unbankedLoot, depth, addNotification]);

  // ADVANCE TO NEXT DEPTH TIER (PORTAL STEPPED ON)
  const handleDescentPortal = useCallback(() => {
    if (depth >= 5) {
      pushCombatText('MAX DEPTH REACHED! EXTRACT TO BANK!', '#facc15', '👑');
      handleExtractAndBank();
      return;
    }

    const nextDepth = depth + 1;
    playGoldRushFanfare();
    playRapidTapSound(4);

    const bonusCoins = 100 * nextDepth;
    setUnbankedLoot(prev => ({
      ...prev,
      coins: prev.coins + bonusCoins,
      geneTokens: prev.geneTokens + 2,
    }));

    pushCombatText(`DESCENDED TO DEPTH ${nextDepth}! (+${bonusCoins} 🪙)`, '#38bdf8', '🌀');
    addNotification(`🌀 Descended through ancient portal into Depth ${nextDepth}!`, '⚡', 'info');

    setDepth(nextDepth);
    setTorchTime(60); // replenish torch timer for next depth
    rebuildSceneForDepth(nextDepth);
  }, [depth, pushCombatText, handleExtractAndBank, addNotification, rebuildSceneForDepth]);

  // USE RATION
  const handleUseRation = useCallback(() => {
    if (fieldRations <= 0) return;
    setFieldRations(r => r - 1);
    setStamina(s => Math.min(100, s + 35));
    setTorchTime(t => Math.min(80, t + 25));
    playRapidTapSound(2);
    pushCombatText('+35 Stamina & +25s Torch!', '#4ade80', '🥖');
  }, [fieldRations, pushCombatText]);

  // USE ESCAPE BOMB (BYPASS HAZARD)
  const handleUseEscapeBomb = useCallback(() => {
    if (escapeBombs <= 0 || !activeHazardAlert) return;
    setEscapeBombs(b => b - 1);
    setActiveHazardAlert(null);
    playRapidTapSound(3);
    pushCombatText('Escape Bomb used! Hazard bypassed safely!', '#c084fc', '💣');
  }, [escapeBombs, activeHazardAlert, pushCombatText]);

  // ENDURE HAZARD DAMAGE
  const handleEndureHazard = useCallback(() => {
    if (!activeHazardAlert) return;
    const dmg = activeHazardAlert.damage;
    setActiveHazardAlert(null);
    triggerCameraShake(0.45, 0.6);
    playDefeatSound();

    setStamina(curr => {
      const nextStamina = Math.max(0, curr - dmg);
      pushCombatText(`-${dmg} Stamina!`, '#ef4444', '💥');
      if (nextStamina <= 0) {
        setTimeout(() => handleWipeout(), 300);
      }
      return nextStamina;
    });
  }, [activeHazardAlert, triggerCameraShake, pushCombatText, handleWipeout]);

  // PLAYER MOVEMENT & TILE RESOLUTION
  const handleMoveToTile = useCallback((tx: number, tz: number) => {
    if (!isExpeditionActiveRef.current) return;
    if (movementRef.current.isMoving) return;

    const currentP = playerCoordRef.current;
    const dx = Math.abs(tx - currentP.x);
    const dz = Math.abs(tz - currentP.z);

    // Only allow moving to adjacent tiles (Manhattan or Chebyshev <= 1)
    if (dx > 1 || dz > 1) {
      pushCombatText('Can only travel to adjacent tiles!', '#f87171', '⚠️');
      return;
    }

    const targetKey = `${tx},${tz}`;
    const targetTile = gridDataRef.current.get(targetKey);
    if (!targetTile) return;

    // Deduct step stamina (-3 stamina per move)
    setStamina(curr => {
      const nextStam = Math.max(0, curr - 3);
      if (nextStam <= 0) {
        setTimeout(() => handleWipeout(), 350);
      }
      return nextStam;
    });

    // Start hopping movement animation
    const [startWx, startWz] = gridToWorld(currentP.x, currentP.z);
    const [targetWx, targetWz] = gridToWorld(tx, tz);

    movementRef.current = {
      isMoving: true,
      startX: startWx,
      startZ: startWz,
      targetX: targetWx,
      targetZ: targetWz,
      progress: 0,
      duration: 0.32,
    };

    setPlayerCoord({ x: tx, z: tz });
    playerCoordRef.current = { x: tx, z: tz };
    targetTile.visited = true;

    // Dissolve fog around new location
    updateFogOfWar(tx, tz);

    // Resolve tile encounters after step finishes
    setTimeout(() => {
      if (targetTile.type === 'chest' && !targetTile.cleared) {
        targetTile.cleared = true;
        const chestEntry = chestGroupsRef.current.get(targetKey);
        if (chestEntry && !chestEntry.opened) {
          chestEntry.opened = true;
          // Animate lid open
          chestEntry.lidGroup.rotation.x = -Math.PI * 0.45;
          // Spawn particle spark explosion
          spawnSparkSparks(targetWx, targetWz);
          playRapidTapSound(3);
          playCashRegisterSound();

          const r = targetTile.reward || { coins: 50, gems: 1, geneTokens: 1, relicFragments: 0 };
          setUnbankedLoot(prev => ({
            ...prev,
            coins: prev.coins + r.coins,
            gems: prev.gems + r.gems,
            geneTokens: prev.geneTokens + r.geneTokens,
            relicFragments: prev.relicFragments + (r.relicFragments || 0),
            seedName: r.seedName || prev.seedName,
            seedCount: r.seedName ? prev.seedCount + 1 : prev.seedCount,
          }));

          pushCombatText(`+${r.coins} 🪙  +${r.gems} 💎  +${r.geneTokens} 🧬`, '#facc15', '📦');
        }
      } else if (targetTile.type === 'hazard' && !targetTile.cleared) {
        targetTile.cleared = true;
        playCrisisAlarm();
        triggerCameraShake(0.35, 0.5);

        const dmg = 20 + depth * 5;
        const hazardTitles = {
          wolf: 'Shadow Wolf Ambush',
          trap: 'Jagged Bear Trap',
          spores: 'Toxic Spore Cloud',
        };

        setActiveHazardAlert({
          title: hazardTitles[targetTile.hazardKind || 'wolf'],
          description: `Threat triggered! Takes ${dmg} stamina damage.`,
          hazardKind: targetTile.hazardKind || 'wolf',
          damage: dmg,
        });
      } else if (targetTile.type === 'portal') {
        handleDescentPortal();
      } else if (targetTile.type === 'shrine' && !targetTile.cleared) {
        targetTile.cleared = true;
        playRapidTapSound(2);
        setStamina(s => Math.min(100, s + 30));
        setFieldRations(r => r + 1);
        pushCombatText('+30 Stamina & +1 Ration Found!', '#4ade80', '🌿');
      }
    }, 320);
  }, [
    isExpeditionActiveRef,
    pushCombatText,
    handleWipeout,
    updateFogOfWar,
    spawnSparkSparks,
    triggerCameraShake,
    depth,
    handleDescentPortal,
  ]);

  // Real-time Torch Countdown Timer Loop
  useEffect(() => {
    if (!isExpeditionActive) return;

    const timer = setInterval(() => {
      setTorchTime(curr => {
        if (curr <= 1) {
          // Torch burnt out: darkness damages party stamina!
          setStamina(st => {
            const nextStam = Math.max(0, st - 6);
            if (nextStam <= 0) {
              handleWipeout();
            }
            return nextStam;
          });
          pushCombatText('Torch burnt out! Darkness drains party!', '#f43f5e', '🌑');
          return 0;
        }
        return curr - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isExpeditionActive, handleWipeout, pushCombatText]);

  // THREE.JS SCENE SETUP & RENDER LOOP
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 480;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090a16); // Twilight night sky
    scene.fog = new THREE.FogExp2(0x090a16, 0.038);
    sceneRef.current = scene;

    // 2. Camera (Fixed Isometric Perspective)
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(9.0, 13.5, 9.0);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = false;
    rendererRef.current = renderer;

    // 4. Lighting
    // Ambient twilight
    const ambientLight = new THREE.AmbientLight(0x1e1b4b, 1.3);
    scene.add(ambientLight);

    // Cool Moonlight Directional
    const moonLight = new THREE.DirectionalLight(0x6366f1, 0.85);
    moonLight.position.set(8, 14, 6);
    scene.add(moonLight);

    // Warm Sunbeam Rim
    const rimLight = new THREE.DirectionalLight(0xf59e0b, 0.4);
    rimLight.position.set(-6, 8, -6);
    scene.add(rimLight);

    // 5. Descent Portal Mesh Group at [3, 3]
    const portalGroup = new THREE.Group();
    const [portalWx, portalWz] = gridToWorld(3, 3);
    portalGroup.position.set(portalWx, 0.45, portalWz);

    // Outer Torus Ring
    const torusGeo = new THREE.TorusGeometry(0.72, 0.14, 8, 28);
    const torusMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x0284c7,
      emissiveIntensity: 1.6,
      roughness: 0.2,
      flatShading: true,
    });
    const torusMesh = new THREE.Mesh(torusGeo, torusMat);
    torusMesh.rotation.x = Math.PI / 4;
    portalGroup.add(torusMesh);

    // Inner Spinning Swirl Ring
    const innerTorusGeo = new THREE.TorusGeometry(0.48, 0.08, 6, 20);
    const innerTorusMat = new THREE.MeshStandardMaterial({
      color: 0xd946ef,
      emissive: 0xa21caf,
      emissiveIntensity: 2.0,
      roughness: 0.2,
    });
    const innerTorusMesh = new THREE.Mesh(innerTorusGeo, innerTorusMat);
    portalGroup.add(innerTorusMesh);

    // Portal Glow PointLight
    const portalLight = new THREE.PointLight(0x06b6d4, 2.2, 5.0);
    portalLight.position.y = 0.5;
    portalGroup.add(portalLight);

    scene.add(portalGroup);
    portalGroupRef.current = portalGroup;

    // 6. Player Pawn (Low-Poly Explorer with Staff & Torch)
    const playerGroup = new THREE.Group();
    const [pwx, pwz] = gridToWorld(0, 0);
    playerGroup.position.set(pwx, 0.32, pwz);

    // Cloak / Body Cone
    const cloakGeo = new THREE.ConeGeometry(0.35, 0.75, 7);
    const cloakMat = new THREE.MeshStandardMaterial({
      color: 0x15803d, // Woodland explorer cloak
      roughness: 0.8,
      flatShading: true,
    });
    const cloakMesh = new THREE.Mesh(cloakGeo, cloakMat);
    cloakMesh.position.y = 0.38;
    playerGroup.add(cloakMesh);

    // Cowl / Head
    const headGeo = new THREE.DodecahedronGeometry(0.18);
    const headMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      roughness: 0.9,
    });
    const headMesh = new THREE.Mesh(headGeo, headMat);
    headMesh.position.y = 0.82;
    playerGroup.add(headMesh);

    // Explorer Hat Brim
    const hatBrim = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.28, 0.05, 8),
      new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 })
    );
    hatBrim.position.y = 0.86;
    playerGroup.add(hatBrim);

    // Wooden Staff
    const staffGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.9, 5);
    const staffMat = new THREE.MeshStandardMaterial({ color: 0x573a19, roughness: 0.9 });
    const staffMesh = new THREE.Mesh(staffGeo, staffMat);
    staffMesh.position.set(0.3, 0.45, 0.2);
    staffMesh.rotation.z = -0.15;
    playerGroup.add(staffMesh);

    // Flame Ember at top of staff
    const flameGeo = new THREE.DodecahedronGeometry(0.12);
    const flameMat = new THREE.MeshStandardMaterial({
      color: 0xffedd5,
      emissive: 0xf97316,
      emissiveIntensity: 3.5,
    });
    const flameMesh = new THREE.Mesh(flameGeo, flameMat);
    flameMesh.position.set(0.36, 0.92, 0.2);
    playerGroup.add(flameMesh);

    // Torch Dynamic PointLight
    const torchLight = new THREE.PointLight(0xff9922, 2.8, 8.5, 1.8);
    torchLight.position.set(0.36, 1.0, 0.2);
    playerGroup.add(torchLight);
    torchLightRef.current = torchLight;

    scene.add(playerGroup);
    playerGroupRef.current = playerGroup;

    // Initial Scene build
    rebuildSceneForDepth(1);

    // 7. Raycaster for Tile Clicks & Hover
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const meshes = Array.from(tileMeshesRef.current.values());
      const intersects = raycaster.intersectObjects(meshes, false);

      if (intersects.length > 0) {
        const hitMesh = intersects[0].object as THREE.Mesh;
        const { x, z } = hitMesh.userData;
        if (x !== undefined && z !== undefined) {
          handleMoveToTile(x, z);
        }
      }
    };

    canvas.addEventListener('pointerdown', handlePointerDown);

    // 8. Resize Observer for dynamic responsiveness
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const cr = entry.contentRect;
        const newW = cr.width;
        const newH = cr.height;
        if (newW > 0 && newH > 0) {
          camera.aspect = newW / newH;
          camera.updateProjectionMatrix();
          renderer.setSize(newW, newH);
        }
      }
    });
    resizeObserver.observe(container);

    // 9. ANIMATION & RENDER LOOP
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const baseCamPos = new THREE.Vector3(9.0, 13.5, 9.0);

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const dt = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Torch Light dynamic flickering
      if (torchLightRef.current) {
        torchLightRef.current.intensity =
          2.4 + Math.sin(elapsed * 16) * 0.45 + (Math.sin(elapsed * 27) * 0.25);
        torchLightRef.current.position.y = 1.0 + Math.sin(elapsed * 8) * 0.03;
      }

      // Portal rotation
      if (portalGroupRef.current) {
        portalGroupRef.current.children[0].rotation.y += dt * 1.5;
        portalGroupRef.current.children[0].rotation.z += dt * 0.8;
        if (portalGroupRef.current.children[1]) {
          portalGroupRef.current.children[1].rotation.x += dt * 2.2;
        }
      }

      // Smooth hopping movement of player pawn
      const move = movementRef.current;
      if (move.isMoving && playerGroupRef.current) {
        move.progress = Math.min(1, move.progress + dt / move.duration);
        const t = move.progress;
        // Linear X & Z with parabolic Y arc hop
        const curX = THREE.MathUtils.lerp(move.startX, move.targetX, t);
        const curZ = THREE.MathUtils.lerp(move.startZ, move.targetZ, t);
        const hopY = 0.32 + Math.sin(t * Math.PI) * 0.45;

        playerGroupRef.current.position.set(curX, hopY, curZ);

        if (t >= 1) {
          move.isMoving = false;
        }
      }

      // Fog of War Dissolution Animation (scale to 0, fade opacity)
      fogMeshesRef.current.forEach((fogMesh, key) => {
        const tile = gridDataRef.current.get(key);
        if (tile && tile.revealed && fogMesh.visible) {
          fogMesh.scale.x = Math.max(0, fogMesh.scale.x - dt * 3.5);
          fogMesh.scale.y = Math.max(0, fogMesh.scale.y - dt * 3.5);
          fogMesh.scale.z = Math.max(0, fogMesh.scale.z - dt * 3.5);
          const mat = fogMesh.material as THREE.MeshStandardMaterial;
          mat.opacity = Math.max(0, mat.opacity - dt * 3.2);

          if (fogMesh.scale.x <= 0.01) {
            fogMesh.visible = false;
          }
        }
      });

      // Gold Spark Particles Physics Update
      for (let i = sparksRef.current.length - 1; i >= 0; i--) {
        const p = sparksRef.current[i];
        p.life += dt;
        p.vy -= 9.8 * dt; // gravity
        p.mesh.position.x += p.vx * dt;
        p.mesh.position.y += p.vy * dt;
        p.mesh.position.z += p.vz * dt;

        const progress = p.life / p.maxLife;
        const scale = Math.max(0, 1 - progress);
        p.mesh.scale.set(scale, scale, scale);

        if (p.life >= p.maxLife || p.mesh.position.y < 0.2) {
          scene.remove(p.mesh);
          p.mesh.geometry.dispose();
          sparksRef.current.splice(i, 1);
        }
      }

      // Floating Hazard Warning Indicator Bobbing
      hazardIndicatorsRef.current.forEach(group => {
        const indicator = group.children[group.children.length - 1];
        if (indicator) {
          indicator.rotation.y += dt * 2.5;
          indicator.position.y = 1.1 + Math.sin(elapsed * 6) * 0.12;
        }
      });

      // Camera Shake
      if (shakeRef.current.duration > 0) {
        shakeRef.current.duration -= dt;
        const amt = shakeRef.current.amount;
        camera.position.x = baseCamPos.x + Math.sin(elapsed * 45) * amt;
        camera.position.z = baseCamPos.z + Math.cos(elapsed * 38) * amt * 0.6;
        shakeRef.current.amount = Math.max(0, shakeRef.current.amount - dt * 0.8);
      } else {
        camera.position.copy(baseCamPos);
      }

      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    };

    animate();

    // CLEANUP
    return () => {
      cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      resizeObserver.disconnect();
      renderer.dispose();
    };
  }, [handleMoveToTile, rebuildSceneForDepth]);

  const currentConfig = DEPTH_CONFIGS[depth - 1] || DEPTH_CONFIGS[0];

  return (
    <div className="bg-stone-950 border-2 border-stone-800 rounded-2xl overflow-hidden shadow-2xl relative text-stone-100 font-sans">
      {/* --- TOP TACTICAL HUD HEADER --- */}
      <div className="p-3 bg-stone-900/95 border-b border-stone-800 backdrop-blur-md flex flex-wrap items-center justify-between gap-2.5 z-20">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl p-1.5 rounded-xl bg-amber-500/20 border border-amber-500/30">
            🏕️
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-sm tracking-wide text-white uppercase flex items-center gap-1.5">
                3D Wild Expedition
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Depth {depth} / 5
              </span>
            </div>
            <p className="text-[11px] text-stone-400 font-medium">
              {currentConfig.name} · <span className="text-amber-300 font-bold">{currentConfig.mult}x</span> Haul Multiplier
            </p>
          </div>
        </div>

        {/* Torch & Party Gauges */}
        <div className="flex items-center gap-3">
          {/* Torch Timer */}
          <div className="bg-stone-950/80 px-2.5 py-1.5 rounded-xl border border-stone-800 flex items-center gap-2">
            <span className={`text-base ${torchTime <= 15 ? 'animate-bounce text-rose-400' : 'text-amber-400'}`}>
              🔥
            </span>
            <div>
              <span className="block text-[9px] uppercase font-bold text-stone-400">Torch Fuel</span>
              <span className={`font-mono text-xs font-black ${torchTime <= 15 ? 'text-rose-400 animate-pulse' : 'text-amber-300'}`}>
                {torchTime}s Left
              </span>
            </div>
          </div>

          {/* Party Stamina */}
          <div className="bg-stone-950/80 px-2.5 py-1.5 rounded-xl border border-stone-800 min-w-[120px]">
            <div className="flex justify-between items-center text-[10px] font-bold mb-1">
              <span className="text-stone-300 flex items-center gap-1">⚡ Stamina</span>
              <span className="font-mono text-white">{stamina} / 100</span>
            </div>
            <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  stamina > 50
                    ? 'bg-emerald-400'
                    : stamina > 25
                    ? 'bg-amber-400'
                    : 'bg-rose-500 animate-pulse'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, stamina))}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* --- THREE.JS 3D CANVAS VIEWPORT --- */}
      <div ref={containerRef} className="relative w-full h-[460px] sm:h-[520px] bg-[#090a16] select-none">
        <canvas ref={canvasRef} className="w-full h-full block cursor-pointer" />

        {/* In-Canvas Floating Combat Text Overlay */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden flex flex-col items-center justify-center gap-2">
          {floatingCombatText.map(msg => (
            <div
              key={msg.id}
              className="px-3 py-1.5 rounded-xl bg-stone-900/90 border border-stone-700/80 shadow-2xl backdrop-blur-md text-xs font-black flex items-center gap-1.5 animate-in fade-in zoom-in slide-out-to-top duration-300"
              style={{ color: msg.color }}
            >
              <span>{msg.emoji}</span>
              <span>{msg.text}</span>
            </div>
          ))}
        </div>

        {/* In-Canvas Instructions Overlay */}
        {isExpeditionActive && (
          <div className="absolute top-2.5 left-2.5 bg-stone-900/75 backdrop-blur-md px-3 py-1.5 rounded-xl border border-stone-800/80 pointer-events-none text-[11px] text-stone-300 space-y-0.5">
            <p className="font-bold text-amber-300 flex items-center gap-1">
              <span>🧭</span> Tap any adjacent tile to explore
            </p>
            <p className="text-[10px] text-stone-400">
              Dissolve fog · Open chests 📦 · Avoid hazards 🐺 · Toroid Portal 🌀 at [3,3]
            </p>
          </div>
        )}

        {/* Hazard Alert Interstitial Modal in 3D View */}
        {activeHazardAlert && (
          <div className="absolute inset-0 bg-stone-950/70 backdrop-blur-md flex items-center justify-center p-4 z-30 animate-in fade-in">
            <div className="bg-stone-900 border-2 border-rose-600/80 rounded-2xl p-4 max-w-sm w-full shadow-2xl space-y-3">
              <div className="flex items-center gap-2.5">
                <span className="text-3xl animate-bounce">
                  {activeHazardAlert.hazardKind === 'wolf' ? '🐺' : activeHazardAlert.hazardKind === 'trap' ? '⛓️' : '🍄'}
                </span>
                <div>
                  <span className="text-[10px] font-black uppercase text-rose-300 bg-rose-950 px-2 py-0.5 rounded-full border border-rose-600/50">
                    Hazard Ambush!
                  </span>
                  <h4 className="font-black text-white text-sm">{activeHazardAlert.title}</h4>
                </div>
              </div>
              <p className="text-xs text-stone-300">
                {activeHazardAlert.description}
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={handleUseEscapeBomb}
                  disabled={escapeBombs <= 0}
                  className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 ${
                    escapeBombs > 0
                      ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-md active:scale-95'
                      : 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700'
                  }`}
                >
                  <span>💣</span>
                  <span>Use Escape ({escapeBombs})</span>
                </button>
                <button
                  onClick={handleEndureHazard}
                  className="py-2 px-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black transition-all shadow-md active:scale-95"
                >
                  <span>⚡</span>
                  <span>Endure (-{activeHazardAlert.damage}⚡)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Expedition Start Prompt if Inactive */}
        {!isExpeditionActive && !runSummary && (
          <div className="absolute inset-0 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-4 z-30">
            <div className="bg-stone-900 border-2 border-stone-800 rounded-2xl p-5 max-w-md w-full text-center space-y-4 shadow-2xl">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-3xl">
                🏕️
              </div>
              <div>
                <h3 className="font-black text-lg text-white">Low-Poly 3D Wild Expedition</h3>
                <p className="text-xs text-stone-400 mt-1 max-w-xs mx-auto">
                  Step into the isometric fog-of-war wilderness. Uncover chests, navigate regional hazards, and delve through depth portals!
                </p>
              </div>
              <button
                onClick={handleStartExpedition}
                className="w-full py-3 px-6 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-stone-950 font-black rounded-xl text-sm transition-all shadow-lg shadow-amber-500/25 active:scale-95"
              >
                🚀 DISPATCH 3D SEARCH PARTY
              </button>
            </div>
          </div>
        )}

        {/* Run End Summary Modal */}
        {runSummary && (
          <div className="absolute inset-0 bg-stone-950/85 backdrop-blur-md flex items-center justify-center p-4 z-30 animate-in fade-in">
            <div className="bg-stone-900 border-2 border-stone-800 rounded-2xl p-5 max-w-sm w-full text-center space-y-4 shadow-2xl">
              <span className="text-4xl">
                {runSummary.outcome === 'victory' ? '🏆' : '💀'}
              </span>
              <div>
                <h4 className="font-black text-lg text-white">
                  {runSummary.outcome === 'victory' ? 'Haul Successfully Banked!' : 'Expedition Wipeout!'}
                </h4>
                <p className="text-xs text-stone-400 mt-0.5">
                  Reached Depth {runSummary.depthReached} / 5
                </p>
              </div>

              <div className="p-3 bg-stone-950 rounded-xl border border-stone-800 text-xs space-y-1 text-left">
                <div className="flex justify-between">
                  <span className="text-stone-400">Coins Banked:</span>
                  <span className="font-bold text-amber-300">+{runSummary.bankedCoins} 🪙</span>
                </div>
                {runSummary.bankedGems > 0 && (
                  <div className="flex justify-between">
                    <span className="text-stone-400">Gems Banked:</span>
                    <span className="font-bold text-cyan-300">+{runSummary.bankedGems} 💎</span>
                  </div>
                )}
                {runSummary.bankedTokens > 0 && (
                  <div className="flex justify-between">
                    <span className="text-stone-400">Gene Tokens Banked:</span>
                    <span className="font-bold text-emerald-300">+{runSummary.bankedTokens} 🧬</span>
                  </div>
                )}
                {runSummary.lostCoins && runSummary.lostCoins > 0 && (
                  <div className="flex justify-between border-t border-stone-800 pt-1 text-rose-400">
                    <span>Unextracted Coins Lost (75%):</span>
                    <span className="font-bold">-{runSummary.lostCoins} 🪙</span>
                  </div>
                )}
              </div>

              <button
                onClick={handleStartExpedition}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black rounded-xl text-xs transition-all shadow-md active:scale-95"
              >
                🔄 LAUNCH ANOTHER RUN
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- BOTTOM HUD: LOOT BAG GRID & RETREAT ACTION BAR --- */}
      <div className="p-3 bg-stone-900 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Unbanked Loot Grid */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="text-left">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 block">
              🎒 Unbanked Haul
            </span>
            <div className="flex items-center gap-2 text-xs font-black mt-0.5">
              <span className="px-2 py-0.5 rounded-lg bg-stone-950 border border-stone-800 text-amber-200">
                🪙 {unbankedLoot.coins}
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-stone-950 border border-stone-800 text-cyan-300">
                💎 {unbankedLoot.gems}
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-stone-950 border border-stone-800 text-emerald-300">
                🧬 {unbankedLoot.geneTokens}
              </span>
              {unbankedLoot.relicFragments > 0 && (
                <span className="px-2 py-0.5 rounded-lg bg-stone-950 border border-stone-800 text-purple-300">
                  🏛️ {unbankedLoot.relicFragments}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tactical Supplies & High-Tension Extraction Button */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
          <button
            onClick={handleUseRation}
            disabled={fieldRations <= 0 || !isExpeditionActive}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
              fieldRations > 0 && isExpeditionActive
                ? 'bg-amber-600/30 hover:bg-amber-600/40 text-amber-200 border border-amber-500/50 active:scale-95'
                : 'bg-stone-950 text-stone-600 border border-stone-800 cursor-not-allowed'
            }`}
            title="Restores +35 Stamina & +25s Torch Fuel"
          >
            <span>🥖</span>
            <span>Ration ({fieldRations})</span>
          </button>

          {isExpeditionActive && (
            <button
              onClick={handleExtractAndBank}
              className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-stone-950 font-black rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/25 active:scale-95 flex items-center justify-center gap-1.5 animate-pulse"
            >
              <span>🏆</span>
              <span>EXTRACT & BANK HAUL</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
