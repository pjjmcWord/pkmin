// ============================================================
// CORE ENGINE - Progression, Combat, Mastery, Route, Capture
// ============================================================
import {
  StatKey, PokemonType, Move, MoveCategory, Species, SpeciesStage,
  SkillNode, LearnRule, PokemonState, StageState, KnownMove, MoveMastery,
  movesDb, allSpecies, typeChart, itemsDb, routesDb, RouteDef,
} from "../data/gameData";

// ---- SEEDED RNG ----
export class SeededRNG {
  private seed: number;
  constructor(seed: number) { this.seed = seed; }
  next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) & 0xFFFFFFFF;
    return (this.seed >>> 0) / 0xFFFFFFFF;
  }
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  pick<T>(arr: T[]): T { return arr[this.nextInt(0, arr.length - 1)]; }
  weightedPick<T extends { weight: number }>(arr: T[]): T {
    const total = arr.reduce((s, e) => s + e.weight, 0);
    let r = this.next() * total;
    for (const e of arr) { r -= e.weight; if (r <= 0) return e; }
    return arr[arr.length - 1];
  }
  getSeed(): number { return this.seed; }
}

// ---- XP FORMULAS ----
export function xpToNext(level: number): number {
  return Math.floor(20 * Math.pow(level, 1.6));
}

export function masteryXpNeeded(rank: number): number {
  return 25 + rank * 20;
}

// ---- CREATE POKEMON ----
let uidCounter = 0;
export function createPokemon(speciesId: string, level: number): PokemonState {
  const species = allSpecies[speciesId];
  if (!species) throw new Error(`Species ${speciesId} not found`);
  const stage = species.stages[0];
  const pokemon: PokemonState = {
    uid: `pk_${++uidCounter}_${Date.now()}`,
    speciesId,
    stageIndex: 0,
    level,
    xp: 0,
    currentHp: 0,
    stats: { hp:0, atk:0, def:0, spa:0, spd:0, spe:0 },
    bonusStats: { hp:0, atk:0, def:0, spa:0, spd:0, spe:0 },
    stageStates: [{
      unlockedNodes: [],
      pendingPoints: 0,
      spentPoints: 0,
      locked: false,
    }],
    pathways: [],
    flags: [],
    moves: [],
    moveMastery: {},
    masteryCap: 10,
    heldItem: undefined,
  };
  recalcStats(pokemon, species);
  pokemon.currentHp = pokemon.stats.hp;
  return pokemon;
}

// ---- RECALC STATS ----
export function recalcStats(pokemon: PokemonState, species: Species): void {
  const stage = species.stages[pokemon.stageIndex];
  const level = pokemon.level;
  const baseStats = stage.baseStats;
  const bonus = pokemon.bonusStats;

  const hpBase = baseStats.hp + (bonus.hp || 0);
  pokemon.stats.hp = Math.floor(((2 * hpBase) * level) / 100) + level + 10;

  const statKeys: StatKey[] = ["atk","def","spa","spd","spe"];
  for (const k of statKeys) {
    const base = baseStats[k] + (bonus[k] || 0);
    pokemon.stats[k] = Math.floor(((2 * base) * level) / 100) + 5;
  }
}

// ---- GAIN XP ----
export function gainXp(pokemon: PokemonState, amount: number, species: Species): { leveled: boolean; messages: string[] } {
  const messages: string[] = [];
  let leveled = false;
  pokemon.xp += amount;

  while (pokemon.xp >= xpToNext(pokemon.level) && pokemon.level < 100) {
    pokemon.xp -= xpToNext(pokemon.level);
    pokemon.level++;
    leveled = true;
    messages.push(`${getPokemonName(pokemon, species)} subió a nivel ${pokemon.level}!`);

    const stageState = pokemon.stageStates[pokemon.stageIndex];
    const stage = species.stages[pokemon.stageIndex];
    if (stageState.spentPoints < stage.pointBudget) {
      stageState.pendingPoints++;
      messages.push(`+1 punto de habilidad (${stageState.pendingPoints} pendientes)`);
    } else {
      // Extra mastery XP instead
      addGlobalMasteryXp(pokemon, 3);
      messages.push(`Presupuesto de fase completo. +3 XP de maestría global.`);
    }
    recalcStats(pokemon, species);
    // Adjust HP proportionally
    if (pokemon.currentHp > 0) {
      pokemon.currentHp = Math.min(pokemon.currentHp + 5, pokemon.stats.hp);
    }
  }
  return { leveled, messages };
}

// ---- SPEND SKILL POINT ----
export function canSpendPoint(pokemon: PokemonState, species: Species, nodeId: string): { ok: boolean; reason?: string } {
  const stageIndex = pokemon.stageIndex;
  const stage = species.stages[stageIndex];
  const stageState = pokemon.stageStates[stageIndex];

  if (stageState.locked) return { ok: false, reason: "Esta fase está bloqueada." };
  if (stageState.pendingPoints <= 0) return { ok: false, reason: "No tienes puntos pendientes." };
  if (stageState.spentPoints >= stage.pointBudget) return { ok: false, reason: "Presupuesto de fase agotado." };
  if (stageState.unlockedNodes.includes(nodeId)) return { ok: false, reason: "Ya desbloqueado." };

  const node = stage.skillTree.find(n => n.id === nodeId);
  if (!node) return { ok: false, reason: "Nodo no encontrado." };

  // Check local requirements
  if (node.requires) {
    for (const req of node.requires) {
      if (!stageState.unlockedNodes.includes(req)) {
        const reqNode = stage.skillTree.find(n => n.id === req);
        return { ok: false, reason: `Requiere: ${reqNode?.name || req}` };
      }
    }
  }

  // Check cross-stage requirements
  if (node.requiresPrev) {
    for (const req of node.requiresPrev) {
      const prevStage = pokemon.stageStates[req.stage];
      if (!prevStage) return { ok: false, reason: `Requiere fase ${req.stage} que no existe.` };
      if (!prevStage.unlockedNodes.includes(req.node)) {
        const prevSpecies = species.stages[req.stage];
        const reqNode = prevSpecies?.skillTree.find(n => n.id === req.node);
        return { ok: false, reason: `Requiere "${reqNode?.name || req.node}" en fase ${prevSpecies?.name || req.stage} (bloqueado permanentemente).` };
      }
    }
  }

  return { ok: true };
}

export function spendSkillPoint(pokemon: PokemonState, species: Species, nodeId: string): { ok: boolean; message?: string } {
  const check = canSpendPoint(pokemon, species, nodeId);
  if (!check.ok) return { ok: false, message: check.reason };

  const stageIndex = pokemon.stageIndex;
  const stage = species.stages[stageIndex];
  const stageState = pokemon.stageStates[stageIndex];
  const node = stage.skillTree.find(n => n.id === nodeId)!;

  stageState.unlockedNodes.push(nodeId);
  stageState.pendingPoints--;
  stageState.spentPoints++;

  // Apply grants
  if (node.grants) {
    if (node.grants.stats) {
      for (const [k, v] of Object.entries(node.grants.stats) as [string, number][]) {
        pokemon.bonusStats[k as StatKey] = (pokemon.bonusStats[k as StatKey] || 0) + (v as number);
      }
      recalcStats(pokemon, species);
    }
    if (node.grants.pathway) {
      if (!pokemon.pathways.includes(node.grants.pathway)) {
        pokemon.pathways.push(node.grants.pathway);
      }
    }
    if (node.grants.flag) {
      if (!pokemon.flags.includes(node.grants.flag)) {
        pokemon.flags.push(node.grants.flag);
      }
    }
    if (node.grants.masteryCap) {
      pokemon.masteryCap += node.grants.masteryCap;
    }
  }

  return { ok: true, message: `Desbloqueaste: ${node.name}` };
}

// ---- EVOLUTION ----
export function canEvolve(pokemon: PokemonState, species: Species): { ok: boolean; reason?: string } {
  const stage = species.stages[pokemon.stageIndex];
  if (!stage.evolvesTo) return { ok: false, reason: "No puede evolucionar más." };
  if (!stage.evolveLevel) return { ok: false, reason: "No tiene nivel de evolución." };
  if (pokemon.level < stage.evolveLevel) return { ok: false, reason: `Necesitas nivel ${stage.evolveLevel} (actual: ${pokemon.level}).` };
  if (pokemon.stageIndex >= species.stages.length - 1) return { ok: false, reason: "Ya está en la fase final." };
  return { ok: true };
}

export function evolve(pokemon: PokemonState, species: Species): { ok: boolean; message?: string; blockedMoves?: string[] } {
  const check = canEvolve(pokemon, species);
  if (!check.ok) return { ok: false, message: check.reason };

  // Lock current stage
  const currentStageState = pokemon.stageStates[pokemon.stageIndex];
  currentStageState.locked = true;

  // Convert pending points to mastery XP
  const unusedPoints = currentStageState.pendingPoints;
  if (unusedPoints > 0) {
    addGlobalMasteryXp(pokemon, unusedPoints * 3);
    currentStageState.pendingPoints = 0;
  }

  // Advance stage
  pokemon.stageIndex++;
  const newStageState: StageState = {
    unlockedNodes: [],
    pendingPoints: 0,
    spentPoints: 0,
    locked: false,
  };
  pokemon.stageStates.push(newStageState);

  // Recalc stats with new base
  recalcStats(pokemon, species);
  pokemon.currentHp = pokemon.stats.hp; // Full heal on evolution

  // Check which moves are now permanently blocked
  const blockedMoves = getPermanentlyBlockedMoves(pokemon, species);

  const newStage = species.stages[pokemon.stageIndex];
  return { ok: true, message: `¡Evolucionó a ${newStage.name}!`, blockedMoves };
}

export function getPermanentlyBlockedMoves(pokemon: PokemonState, species: Species): string[] {
  const blocked: string[] = [];
  for (const rule of species.learnRules) {
    if (rule.requires) {
      for (const req of rule.requires) {
        const stageState = pokemon.stageStates[req.stage];
        if (stageState && stageState.locked && !stageState.unlockedNodes.includes(req.node)) {
          blocked.push(rule.moveId);
          break;
        }
      }
    }
  }
  return [...new Set(blocked)];
}

// ---- MOVE LEARNING ----
export function canLearnMove(pokemon: PokemonState, species: Species, moveId: string): { ok: boolean; reason?: string } {
  const rule = species.learnRules.find(r => r.moveId === moveId);
  if (!rule) return { ok: false, reason: "Este Pokémon no puede aprender este movimiento." };
  if (pokemon.stageIndex < rule.fromStage) return { ok: false, reason: `Requiere fase ${rule.fromStage + 1}.` };
  if (rule.maxStage !== undefined && pokemon.stageIndex > rule.maxStage) return { ok: false, reason: `Ya no se puede aprender en esta fase.` };
  if (rule.minLevel && pokemon.level < rule.minLevel) return { ok: false, reason: `Requiere nivel ${rule.minLevel}.` };

  // Check pathway requirement
  if (rule.pathway && !pokemon.pathways.includes(rule.pathway)) {
    return { ok: false, reason: `Requiere vía: ${rule.pathway}` };
  }

  // Check cross-stage requirements
  if (rule.requires) {
    for (const req of rule.requires) {
      const stageState = pokemon.stageStates[req.stage];
      if (!stageState) return { ok: false, reason: `Fase ${req.stage} no disponible.` };
      if (stageState.locked && !stageState.unlockedNodes.includes(req.node)) {
        const stage = species.stages[req.stage];
        const node = stage?.skillTree.find(n => n.id === req.node);
        return { ok: false, reason: `BLOQUEADO PERMANENTEMENTE. Requiere "${node?.name || req.node}" en ${stage?.name || "fase anterior"}, pero esa fase ya está cerrada.` };
      }
      if (!stageState.unlockedNodes.includes(req.node)) {
        const stage = species.stages[req.stage];
        const node = stage?.skillTree.find(n => n.id === req.node);
        return { ok: false, reason: `Requiere "${node?.name || req.node}" en ${stage?.name}.` };
      }
    }
  }

  // Check if already known
  if (pokemon.moves.find((m: KnownMove) => m.id === moveId)) return { ok: false, reason: "Ya conoce este movimiento." };

  return { ok: true };
}

export function learnMove(pokemon: PokemonState, species: Species, moveId: string): { ok: boolean; message?: string; replacedMove?: string } {
  const check = canLearnMove(pokemon, species, moveId);
  if (!check.ok) return { ok: false, message: check.reason };

  const move = movesDb[moveId];
  if (!move) return { ok: false, message: "Movimiento no encontrado." };

  let replacedMove: string | undefined;
  if (pokemon.moves.length >= 4) {
    // Remove last move
    const removed = pokemon.moves.pop()!;
    replacedMove = removed.id;
  }

  pokemon.moves.push({
    id: moveId,
    pp: move.pp,
    maxPp: move.pp,
  });

  // Initialize mastery if not exists
  if (!pokemon.moveMastery[moveId]) {
    pokemon.moveMastery[moveId] = { rank: 0, xp: 0 };
  }

  return { ok: true, message: `Aprendió ${move.name}!`, replacedMove };
}

export function forgetMove(pokemon: PokemonState, moveId: string): boolean {
  const idx = pokemon.moves.findIndex((m: KnownMove) => m.id === moveId);
  if (idx === -1) return false;
  pokemon.moves.splice(idx, 1);
  // Mastery persists in moveMastery
  return true;
}

// ---- MASTERY ----
export function addMoveXp(pokemon: PokemonState, moveId: string, amount: number): { rankUp: boolean; newRank: number } {
  if (!pokemon.moveMastery[moveId]) {
    pokemon.moveMastery[moveId] = { rank: 0, xp: 0 };
  }
  const mastery = pokemon.moveMastery[moveId];
  mastery.xp += amount;
  let rankUp = false;

  while (mastery.rank < pokemon.masteryCap && mastery.xp >= masteryXpNeeded(mastery.rank)) {
    mastery.xp -= masteryXpNeeded(mastery.rank);
    mastery.rank++;
    rankUp = true;
  }

  return { rankUp, newRank: mastery.rank };
}

export function addGlobalMasteryXp(pokemon: PokemonState, amount: number): void {
  for (const moveId of Object.keys(pokemon.moveMastery)) {
    addMoveXp(pokemon, moveId, Math.ceil(amount / Math.max(1, Object.keys(pokemon.moveMastery).length)));
  }
}

export function getEffectivePower(move: Move, masteryRank: number): number {
  return Math.floor(move.basePower * (1 + masteryRank * 0.04));
}

export function getCritChance(masteryRank: number): number {
  return 0.0625 + masteryRank * 0.004;
}

// ---- DAMAGE CALCULATION ----
export function calculateDamage(
  attacker: PokemonState,
  defender: PokemonState,
  move: Move,
  attackerSpecies: Species,
  defenderSpecies: Species,
  rng: SeededRNG
): { damage: number; effectiveness: number; critical: boolean; message: string } {
  if (move.category === "status") return { damage: 0, effectiveness: 1, critical: false, message: "" };

  const attackerStage = attackerSpecies.stages[attacker.stageIndex];
  const defenderStage = defenderSpecies.stages[defender.stageIndex];
  const mastery = attacker.moveMastery[move.id];
  const masteryRank = mastery ? mastery.rank : 0;
  const effectivePower = getEffectivePower(move, masteryRank);

  const atkStat = move.category === "physical" ? attacker.stats.atk : attacker.stats.spa;
  const defStat = move.category === "physical" ? defender.stats.def : defender.stats.spd;

  // Base damage
  let damage = Math.floor((((2 * attacker.level / 5 + 2) * effectivePower * atkStat / defStat) / 50) + 2);

  // STAB
  if (attackerStage.types.includes(move.type)) {
    damage = Math.floor(damage * 1.5);
  }

  // Type effectiveness
  let effectiveness = 1;
  for (const defType of defenderStage.types) {
    effectiveness *= typeChart[move.type]?.[defType] ?? 1;
  }
  damage = Math.floor(damage * effectiveness);

  // Critical
  const critChance = getCritChance(masteryRank);
  const critical = rng.next() < critChance;
  if (critical) {
    damage = Math.floor(damage * 1.5);
  }

  // Random factor 0.85 - 1.00
  const randomFactor = 0.85 + rng.next() * 0.15;
  damage = Math.floor(damage * randomFactor);

  // Minimum 1 if damaging
  damage = Math.max(1, damage);

  let message = "";
  if (effectiveness === 0) { damage = 0; message = "No afecta al rival..."; }
  else if (effectiveness >= 2) message = "¡Es súper eficaz!";
  else if (effectiveness > 0 && effectiveness < 1) message = "No es muy eficaz...";
  if (critical) message += " ¡Golpe crítico!";

  return { damage, effectiveness, critical, message };
}

// ---- CAPTURE ----
export function calculateCatchRate(
  wildPokemon: PokemonState,
  species: Species,
  ballModifier: number,
  statusModifier: number,
  rng: SeededRNG
): boolean {
  const catchRate = species.catchRate;
  const maxHp = wildPokemon.stats.hp;
  const currentHp = wildPokemon.currentHp;

  const rate = ((3 * maxHp - 2 * currentHp) * catchRate * ballModifier * statusModifier) / (3 * maxHp);
  const normalizedRate = Math.min(1, Math.max(0.1, rate / 255));

  return rng.next() < normalizedRate;
}

// ---- ROUTE ADVANCEMENT ----
export interface RouteEventResult {
  type: string;
  data?: any;
  message: string;
}

export function advanceRoute(
  route: RouteDef,
  rng: SeededRNG,
  checkpoints: number
): RouteEventResult {
  const event = rng.weightedPick(route.events);

  switch (event.type) {
    case "wild_battle": {
      const possibleMons = event.possiblePokemon || ["rattata"];
      const speciesId = rng.pick(possibleMons);
      const level = rng.nextInt(event.minLevel || route.minLevel, event.maxLevel || route.maxLevel);
      return {
        type: "wild_battle",
        data: { speciesId, level },
        message: `¡Un ${allSpecies[speciesId]?.name || speciesId} salvaje apareció! (Nv.${level})`,
      };
    }
    case "trainer_battle": {
      const possibleMons = event.possiblePokemon || ["rattata"];
      const speciesId = rng.pick(possibleMons);
      const level = rng.nextInt(event.minLevel || route.minLevel, event.maxLevel || route.maxLevel);
      return {
        type: "trainer_battle",
        data: { speciesId, level },
        message: `¡Un entrenador te desafía! Usa un ${allSpecies[speciesId]?.name || speciesId} Nv.${level}`,
      };
    }
    case "item": {
      const items = ["potion", "poke_ball", "antidote", "super_potion"];
      const itemId = rng.pick(items);
      return {
        type: "item",
        data: { itemId },
        message: `¡Encontraste un/a ${itemsDb[itemId]?.name || itemId}!`,
      };
    }
    case "shop": {
      return {
        type: "shop",
        data: {},
        message: "¡Encontraste una tienda ambulante!",
      };
    }
    case "hazard": {
      const damage = rng.nextInt(5, 15);
      return {
        type: "hazard",
        data: { damage },
        message: `¡Peligro! Tu equipo sufre ${damage} de daño por el terreno.`,
      };
    }
    case "rest": {
      return {
        type: "rest",
        data: {},
        message: "Encontraste un lugar seguro para descansar. Tu equipo se cura parcialmente.",
      };
    }
    case "checkpoint": {
      return {
        type: "checkpoint",
        data: { checkpoint: checkpoints + 1 },
        message: "¡Checkpoint alcanzado! Tu progreso se guarda automáticamente.",
      };
    }
    default:
      return { type: "unknown", message: "Algo extraño sucedió..." };
  }
}

// ---- HELPER: Get Pokemon Name ----
export function getPokemonName(pokemon: PokemonState, species: Species): string {
  return species.stages[pokemon.stageIndex].name;
}

export function getPokemonSpecies(pokemon: PokemonState): Species {
  return allSpecies[pokemon.speciesId];
}

export function getCurrentStage(pokemon: PokemonState, species: Species): SpeciesStage {
  return species.stages[pokemon.stageIndex];
}

// ---- VALIDATE SPECIES ----
export function validateSpecies(species: Species): string[] {
  const errors: string[] = [];
  for (let i = 0; i < species.stages.length; i++) {
    const stage = species.stages[i];
    if (stage.pointBudget <= 0) errors.push(`${stage.name}: pointBudget debe ser positivo`);
    const nodeIds = new Set<string>();
    for (const node of stage.skillTree) {
      if (nodeIds.has(node.id)) errors.push(`${stage.name}: nodo duplicado ${node.id}`);
      nodeIds.add(node.id);
      if (node.requires) {
        for (const req of node.requires) {
          if (!stage.skillTree.find(n => n.id === req)) {
            errors.push(`${stage.name}: nodo ${node.id} requiere ${req} que no existe`);
          }
        }
      }
      if (node.requiresPrev) {
        for (const req of node.requiresPrev) {
          if (req.stage >= i) errors.push(`${stage.name}: requiresPrev debe apuntar a fases anteriores`);
          const prevStage = species.stages[req.stage];
          if (prevStage && !prevStage.skillTree.find(n => n.id === req.node)) {
            errors.push(`${stage.name}: requiresPrev ${req.node} no existe en fase ${req.stage}`);
          }
        }
      }
    }
    if (stage.evolvesTo && i < species.stages.length - 1) {
      if (species.stages[i + 1].id !== stage.evolvesTo) {
        errors.push(`${stage.name}: evolvesTo no coincide con siguiente etapa`);
      }
    }
  }
  for (const rule of species.learnRules) {
    if (!movesDb[rule.moveId]) errors.push(`learnRule: ${rule.moveId} no existe en movesDb`);
  }
  return errors;
}
