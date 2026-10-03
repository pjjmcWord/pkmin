// ============================================================
// GAME STATE STORE - React Context for state management
// ============================================================
import React, { createContext, useContext, useReducer, useState, ReactNode } from "react";
import {
  GameState, PokemonState,
  allSpecies, starterSpecies, movesDb, itemsDb, routesDb,
} from "../data/gameData";
import {
  SeededRNG, createPokemon, gainXp, spendSkillPoint, canSpendPoint,
  evolve, canEvolve, learnMove, canLearnMove, forgetMove,
  calculateDamage, calculateCatchRate, advanceRoute,
  addMoveXp, getPokemonName, getPokemonSpecies, getCurrentStage,
  getPermanentlyBlockedMoves, xpToNext, masteryXpNeeded, getEffectivePower,
} from "../core/engine";

// ---- INITIAL STATE ----
function createInitialState(): GameState {
  return {
    version: 1,
    screen: "title",
    trainer: { name: "", money: 1000 },
    party: [],
    box: [],
    inventory: { potion: 3, poke_ball: 5 },
    flags: {},
    rngSeed: Date.now(),
    battleLog: [],
    pendingBattle: undefined,
  };
}

// ---- ACTIONS ----
type Action =
  | { type: "SET_SCREEN"; screen: string }
  | { type: "SET_TRAINER_NAME"; name: string }
  | { type: "CHOOSE_STARTER"; speciesId: string }
  | { type: "SPEND_SKILL_POINT"; pokemonUid: string; nodeId: string }
  | { type: "EVOLVE"; pokemonUid: string }
  | { type: "LEARN_MOVE"; pokemonUid: string; moveId: string }
  | { type: "FORGET_MOVE"; pokemonUid: string; moveId: string }
  | { type: "START_ROUTE"; routeId: string }
  | { type: "ADVANCE_ROUTE" }
  | { type: "USE_ITEM"; itemId: string; targetUid?: string }
  | { type: "BUY_ITEM"; itemId: string }
  | { type: "REST_PARTY" }
  | { type: "ADD_TO_BOX"; pokemonUid: string }
  | { type: "LOAD_STATE"; state: GameState }
  | { type: "NEW_GAME" }
  | { type: "SET_BATTLE_LOG"; log: string[] }
  | { type: "SET_MONEY"; amount: number };

// ---- BATTLE STATE ----
export interface BattleState {
  active: boolean;
  isTrainer: boolean;
  playerPokemon: PokemonState | null;
  playerSpeciesId: string;
  enemyPokemon: PokemonState | null;
  enemySpeciesId: string;
  log: string[];
  phase: "choose_action" | "choose_move" | "choose_item" | "ended";
  result?: "win" | "lose" | "flee" | "catch";
  xpGained: number;
  moneyGained: number;
  caught: boolean;
}

export function createInitialBattle(): BattleState {
  return {
    active: false, isTrainer: false,
    playerPokemon: null, playerSpeciesId: "",
    enemyPokemon: null, enemySpeciesId: "",
    log: [], phase: "choose_action",
    xpGained: 0, moneyGained: 0, caught: false,
  };
}

// ---- REDUCER ----
function gameReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "SET_SCREEN":
      return { ...state, screen: action.screen };

    case "SET_TRAINER_NAME":
      return { ...state, trainer: { ...state.trainer, name: action.name } };

    case "CHOOSE_STARTER": {
      const starter = createPokemon(action.speciesId, 5);
      const species = allSpecies[action.speciesId];
      const firstRule = species.learnRules.find(r => r.minLevel === 1 || r.minLevel === undefined);
      if (firstRule) {
        starter.moves.push({ id: firstRule.moveId, pp: movesDb[firstRule.moveId].pp, maxPp: movesDb[firstRule.moveId].pp });
        starter.moveMastery[firstRule.moveId] = { rank: 0, xp: 0 };
      }
      return { ...state, party: [starter], screen: "camp" };
    }

    case "SPEND_SKILL_POINT": {
      const party = state.party.map(p => ({ ...p, stageStates: p.stageStates.map(s => ({ ...s, unlockedNodes: [...s.unlockedNodes], })), pathways: [...p.pathways], flags: [...p.flags], moves: [...p.moves], bonusStats: { ...p.bonusStats }, moveMastery: { ...p.moveMastery }, stats: { ...p.stats } }));
      const pkIdx = party.findIndex(p => p.uid === action.pokemonUid);
      if (pkIdx === -1) return state;
      const pk = party[pkIdx];
      const species = allSpecies[pk.speciesId];
      const result = spendSkillPoint(pk, species, action.nodeId);
      if (result.ok) {
        party[pkIdx] = pk;
        return { ...state, party };
      }
      return state;
    }

    case "EVOLVE": {
      const party = state.party.map(p => ({ ...p, stageStates: p.stageStates.map(s => ({ ...s, unlockedNodes: [...s.unlockedNodes] })), pathways: [...p.pathways], flags: [...p.flags], moves: [...p.moves], bonusStats: { ...p.bonusStats }, moveMastery: { ...p.moveMastery }, stats: { ...p.stats } }));
      const pkIdx = party.findIndex(p => p.uid === action.pokemonUid);
      if (pkIdx === -1) return state;
      const pk = party[pkIdx];
      const species = allSpecies[pk.speciesId];
      const result = evolve(pk, species);
      if (result.ok) {
        party[pkIdx] = pk;
        return { ...state, party };
      }
      return state;
    }

    case "LEARN_MOVE": {
      const party = state.party.map(p => ({ ...p, moves: [...p.moves], moveMastery: { ...p.moveMastery } }));
      const pkIdx = party.findIndex(p => p.uid === action.pokemonUid);
      if (pkIdx === -1) return state;
      const pk = party[pkIdx];
      const species = allSpecies[pk.speciesId];
      const result = learnMove(pk, species, action.moveId);
      if (result.ok) {
        party[pkIdx] = pk;
        return { ...state, party };
      }
      return state;
    }

    case "FORGET_MOVE": {
      const party = state.party.map(p => ({ ...p, moves: [...p.moves] }));
      const pkIdx = party.findIndex(p => p.uid === action.pokemonUid);
      if (pkIdx === -1) return state;
      forgetMove(party[pkIdx], action.moveId);
      return { ...state, party };
    }

    case "START_ROUTE": {
      return {
        ...state,
        route: { routeId: action.routeId, progress: 0, checkpoints: 0, seed: Date.now() },
        screen: "route",
      };
    }

    case "ADVANCE_ROUTE": {
      if (!state.route) return state;
      const rng = new SeededRNG(state.route.seed + state.route.progress);
      const routeDef = routesDb.find(r => r.id === state.route!.routeId)!;
      const event = advanceRoute(routeDef, rng, state.route.checkpoints);

      let progress = state.route.progress + rng.nextInt(8, 15);
      let checkpoints = state.route.checkpoints;
      const newInventory = { ...state.inventory };
      let newParty = state.party.map(p => ({ ...p }));
      let newMoney = state.trainer.money;
      let nextScreen = "route";
      let pendingBattle = undefined;

      if (progress >= 100) {
        progress = 0;
        checkpoints++;
      }

      if (event.type === "item" && event.data?.itemId) {
        newInventory[event.data.itemId] = (newInventory[event.data.itemId] || 0) + 1;
      } else if (event.type === "hazard" && event.data?.damage) {
        newParty = newParty.map(pk => ({
          ...pk,
          currentHp: Math.max(1, pk.currentHp - event.data.damage),
        }));
      } else if (event.type === "rest") {
        newParty = newParty.map(pk => ({
          ...pk,
          currentHp: Math.min(pk.stats.hp, pk.currentHp + Math.floor(pk.stats.hp * 0.3)),
        }));
      } else if (event.type === "wild_battle" || event.type === "trainer_battle") {
        nextScreen = "battle";
        pendingBattle = {
          enemySpeciesId: event.data.speciesId,
          enemyLevel: event.data.level,
          isTrainer: event.type === "trainer_battle",
          message: event.message,
        };
      }

      return {
        ...state,
        route: { ...state.route, progress, checkpoints, seed: state.route.seed + 1 },
        inventory: newInventory,
        party: newParty,
        trainer: { ...state.trainer, money: newMoney },
        screen: nextScreen,
        battleLog: [event.message],
        pendingBattle,
      };
    }

    case "USE_ITEM": {
      const newInventory = { ...state.inventory };
      const count = newInventory[action.itemId] || 0;
      if (count <= 0) return state;
      const item = itemsDb[action.itemId];
      if (!item) return state;

      if (item.category === "potion" && action.targetUid) {
        const party = state.party.map(pk => {
          if (pk.uid === action.targetUid) {
            return { ...pk, currentHp: Math.min(pk.stats.hp, pk.currentHp + (item.value || 20)) };
          }
          return pk;
        });
        newInventory[action.itemId] = count - 1;
        return { ...state, party, inventory: newInventory };
      }
      if (item.category === "revive" && action.targetUid) {
        const party = state.party.map(pk => {
          if (pk.uid === action.targetUid && pk.currentHp <= 0) {
            return { ...pk, currentHp: Math.floor(pk.stats.hp * 0.5) };
          }
          return pk;
        });
        newInventory[action.itemId] = count - 1;
        return { ...state, party, inventory: newInventory };
      }
      return state;
    }

    case "BUY_ITEM": {
      const item = itemsDb[action.itemId];
      if (!item || state.trainer.money < item.price) return state;
      const newInventory = { ...state.inventory };
      newInventory[action.itemId] = (newInventory[action.itemId] || 0) + 1;
      return {
        ...state,
        trainer: { ...state.trainer, money: state.trainer.money - item.price },
        inventory: newInventory,
      };
    }

    case "REST_PARTY": {
      const party = state.party.map(pk => ({
        ...pk,
        currentHp: pk.stats.hp,
        moves: pk.moves.map(m => ({ ...m, pp: m.maxPp })),
        status: undefined,
      }));
      return { ...state, party };
    }

    case "ADD_TO_BOX": {
      const pkIdx = state.party.findIndex(p => p.uid === action.pokemonUid);
      if (pkIdx === -1 || state.party.length <= 1) return state;
      const pk = state.party[pkIdx];
      const newParty = state.party.filter((_, i) => i !== pkIdx);
      return { ...state, party: newParty, box: [...state.box, pk] };
    }

    case "LOAD_STATE": {
      // Ensure loaded state goes to a valid screen
      const loadedState = { ...action.state };
      if (loadedState.screen === "battle") {
        loadedState.screen = "route";
        loadedState.pendingBattle = undefined;
      }
      if (!loadedState.pendingBattle) {
        loadedState.pendingBattle = undefined;
      }
      return loadedState;
    }

    case "NEW_GAME":
      return createInitialState();

    case "SET_BATTLE_LOG":
      return { ...state, battleLog: action.log };

    case "SET_MONEY":
      return { ...state, trainer: { ...state.trainer, money: action.amount } };

    default:
      return state;
  }
}

// ---- CONTEXT ----
interface GameContextType {
  state: GameState;
  battle: BattleState;
  setBattle: React.Dispatch<React.SetStateAction<BattleState>>;
  dispatch: React.Dispatch<Action>;
  rng: SeededRNG;
}

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, null, createInitialState);
  const [battle, setBattle] = useState<BattleState>(createInitialBattle);
  const rng = new SeededRNG(state.rngSeed);

  return (
    <GameContext.Provider value={{ state, battle, setBattle, dispatch, rng }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}

// ---- SAVE / LOAD ----
export function saveGame(state: GameState): void {
  try {
    localStorage.setItem("pokerogue_save", JSON.stringify(state));
  } catch (e) {
    console.error("Save failed:", e);
  }
}

export function loadGame(): GameState | null {
  try {
    const data = localStorage.getItem("pokerogue_save");
    if (data) return JSON.parse(data) as GameState;
  } catch (e) {
    console.error("Load failed:", e);
  }
  return null;
}

export function hasSave(): boolean {
  return !!localStorage.getItem("pokerogue_save");
}

export { starterSpecies, allSpecies, movesDb, itemsDb, routesDb };
export { createPokemon, gainXp, spendSkillPoint, canSpendPoint, evolve, canEvolve,
  learnMove, canLearnMove, forgetMove, calculateDamage, calculateCatchRate,
  advanceRoute, addMoveXp, getPokemonName, getPokemonSpecies, getCurrentStage,
  SeededRNG, xpToNext, masteryXpNeeded, getEffectivePower, getPermanentlyBlockedMoves,
};
