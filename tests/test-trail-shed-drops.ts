import {
  PALEOSILT_EVENT_DECK,
  MANGROVE_EVENT_DECK,
  RED_QUARRY_EVENT_DECK,
  THERMAL_MUD_EVENT_DECK,
  GLACIAL_PERMAFROST_EVENT_DECK,
  executeEventAction,
} from '../src/game/frontierTrailEngine.ts';
import { BUILDINGS } from '../src/game/data.ts';

console.log('--- Testing Sanctuary Shed Drops Connection in Frontier Trail ---');

// 1. Verify that specialized actions now require the Sanctuary animal shed drops
console.log('Testing Paleo Silt deck requirements...');
const siltCard1 = PALEOSILT_EVENT_DECK[0];
const siltCard2 = PALEOSILT_EVENT_DECK[1];
if (siltCard1.actions.specialized.requiredItem?.id !== 'chitin_molt_plates') {
  throw new Error(`Expected chitin_molt_plates on siltCard1, got ${siltCard1.actions.specialized.requiredItem?.id}`);
}
if (siltCard2.actions.specialized.requiredItem?.id !== 'chitin_molt_plates') {
  throw new Error(`Expected chitin_molt_plates on siltCard2, got ${siltCard2.actions.specialized.requiredItem?.id}`);
}
console.log('✓ Paleo Silt correctly requires Chitin Molt Plates (Asaphid Trilobite shed)');

console.log('Testing Mangrove deck requirements...');
const mangroveCard1 = MANGROVE_EVENT_DECK[0];
const mangroveCard2 = MANGROVE_EVENT_DECK[1];
if (mangroveCard1.actions.specialized.requiredItem?.id !== 'prismatic_wing_membrane') {
  throw new Error(`Expected prismatic_wing_membrane on mangroveCard1, got ${mangroveCard1.actions.specialized.requiredItem?.id}`);
}
if (mangroveCard2.actions.specialized.requiredItem?.id !== 'primeval_humus') {
  throw new Error(`Expected primeval_humus on mangroveCard2, got ${mangroveCard2.actions.specialized.requiredItem?.id}`);
}
console.log('✓ Mangrove correctly requires Prismatic Wing Membranes (Meganeura) and Primeval Humus (Arthropleura)');

console.log('Testing Red Quarry deck requirements...');
const quarryCard = RED_QUARRY_EVENT_DECK[0];
if (quarryCard.actions.specialized.requiredItem?.id !== 'thermal_scutes') {
  throw new Error(`Expected thermal_scutes on quarryCard, got ${quarryCard.actions.specialized.requiredItem?.id}`);
}
console.log('✓ Sunken Red Quarry correctly requires Thermal Scutes (Dimetrodon shed)');

console.log('Testing Thermal Mud Crevasse deck requirements...');
const thermalCard = THERMAL_MUD_EVENT_DECK[0];
if (thermalCard.actions.specialized.requiredItem?.id !== 'serpent_slough') {
  throw new Error(`Expected serpent_slough on thermalCard, got ${thermalCard.actions.specialized.requiredItem?.id}`);
}
console.log('✓ Thermal Mud Crevasse correctly requires Serpent Slough (Titanoboa shed)');

console.log('Testing Glacial Permafrost deck requirements...');
const glacialCard = GLACIAL_PERMAFROST_EVENT_DECK[0];
if (glacialCard.actions.specialized.requiredItem?.id !== 'insulated_down_wool') {
  throw new Error(`Expected insulated_down_wool on glacialCard, got ${glacialCard.actions.specialized.requiredItem?.id}`);
}
console.log('✓ Glacial Permafrost correctly requires Insulated Down Wool (Woolly Mammoth shed)');

// 2. Test Execution of Event Action
const res = executeEventAction('specialized_tool', siltCard1, 1, 0);
console.log('Event action execution result:', res.success, res.message, res.addedFossils);
if (!res.message) throw new Error('Action execution returned empty message');

// 3. Test Workshop Recipes
const workshop = BUILDINGS.workshop;
const recipeIds = workshop.recipes.map(r => r.id);
if (!recipeIds.includes('make_amber_chisel') || !recipeIds.includes('make_excavation_pickaxe') || !recipeIds.includes('make_thermal_solvent')) {
  throw new Error(`Workshop missing tool recipes. Found: ${recipeIds.join(', ')}`);
}
console.log('✓ Workshop includes recipes for Amber Chisel, Excavation Pickaxe, and Thermal Solvent using shed drops');

console.log('ALL TESTS PASSED!');
