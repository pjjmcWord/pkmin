// ============================================================
// MAIN APP - All screens for the Pokémon Roguelite
// ============================================================
import React, { useState, useEffect, useCallback } from "react";
import {
  GameProvider, useGame, saveGame, loadGame, hasSave,
  starterSpecies, allSpecies, movesDb, itemsDb, routesDb,
  createPokemon, gainXp, calculateDamage, calculateCatchRate,
  addMoveXp, getPokemonName, getPokemonSpecies, getCurrentStage,
  canSpendPoint, canEvolve, canLearnMove, getPermanentlyBlockedMoves,
  SeededRNG, xpToNext, masteryXpNeeded, getEffectivePower,
  BattleState, createInitialBattle,
} from "./state/gameStore";
import {
  PokemonState, Species, getSpriteUrl, typeColors, PokemonType,
} from "./data/gameData";

// ============================================================
// UTILITY COMPONENTS
// ============================================================

function HpBar({ current, max }: { current: number; max: number }) {
  const pct = Math.max(0, Math.min(100, (current / max) * 100));
  const color = pct > 50 ? "bg-green-500" : pct > 20 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
      <div className={`${color} h-full transition-all duration-300`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function TypeBadge({ type }: { type: PokemonType }) {
  return (
    <span
      className="text-xs px-2 py-0.5 rounded text-white font-bold uppercase"
      style={{ backgroundColor: typeColors[type] }}
    >
      {type}
    </span>
  );
}

function PokemonSprite({ pokedexId, back = false, size = 96 }: { pokedexId: number; back?: boolean; size?: number }) {
  return (
    <img
      src={getSpriteUrl(pokedexId, back)}
      alt=""
      width={size}
      height={size}
      className="pixelated"
      style={{ imageRendering: "pixelated" }}
      onError={(e) => { (e.target as HTMLImageElement).src = ""; }}
    />
  );
}

function StatBar({ label, value, max = 200 }: { label: string; value: number; max?: number }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-8 text-gray-400">{label}</span>
      <div className="flex-1 bg-gray-700 rounded-full h-2">
        <div className="bg-blue-400 h-full rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 text-right text-gray-300">{value}</span>
    </div>
  );
}

// ============================================================
// TITLE SCREEN
// ============================================================
function TitleScreen() {
  const { dispatch } = useGame();
  const saved = hasSave();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 via-indigo-900 to-gray-900 text-white p-4">
      {/* Decorative pokemon sprites */}
      <div className="flex gap-4 mb-6 opacity-60">
        <img src={getSpriteUrl(1)} alt="" className="w-16 h-16" style={{ imageRendering: "pixelated" }} />
        <img src={getSpriteUrl(4)} alt="" className="w-16 h-16" style={{ imageRendering: "pixelated" }} />
        <img src={getSpriteUrl(7)} alt="" className="w-16 h-16" style={{ imageRendering: "pixelated" }} />
      </div>

      <div className="text-center mb-8">
        <h1 className="text-5xl md:text-6xl font-bold mb-3 bg-gradient-to-r from-yellow-400 via-red-500 to-blue-500 bg-clip-text text-transparent">
          PokéRogue
        </h1>
        <p className="text-gray-400 text-lg">JRPG Roguelite · Decisiones Irreversibles</p>
        <div className="mt-4 flex gap-2 justify-center flex-wrap">
          <span className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-400">⚔️ Combate por turnos</span>
          <span className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-400">🌳 Árbol de habilidades</span>
          <span className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-400">🔒 Evolución irreversible</span>
          <span className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-400">⭐ Maestría de movimientos</span>
        </div>
      </div>

      <div className="flex flex-col gap-4 w-64">
        <button
          onClick={() => dispatch({ type: "SET_SCREEN", screen: "character_create" })}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition pulse-glow"
        >
          🎮 Nueva Partida
        </button>
        {saved && (
          <button
            onClick={() => {
              const state = loadGame();
              if (state) dispatch({ type: "LOAD_STATE", state });
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition"
          >
            💾 Continuar
          </button>
        )}
      </div>

      <div className="mt-12 text-gray-500 text-sm text-center max-w-md space-y-1">
        <p>🔒 Cada evolución cierra permanentemente tu fase anterior.</p>
        <p>🌳 Planifica tus vías de movimiento con cuidado.</p>
        <p>⭐ La maestría persiste siempre, incluso tras evolucionar.</p>
      </div>

      <div className="mt-8 text-gray-600 text-xs">
        Inspirado en Pokémon Gen 1 · Mecánicas originales
      </div>
    </div>
  );
}

// ============================================================
// CHARACTER CREATION
// ============================================================
function CharacterCreateScreen() {
  const { dispatch } = useGame();
  const [name, setName] = useState("");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4">
      <h2 className="text-3xl font-bold mb-8">Crea tu Entrenador</h2>
      <div className="bg-gray-800 rounded-xl p-8 w-full max-w-md">
        <label className="block text-sm text-gray-400 mb-2">Nombre del entrenador</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Tu nombre..."
          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white mb-6 focus:outline-none focus:border-blue-500"
          maxLength={16}
        />
        <button
          onClick={() => {
            if (name.trim()) {
              dispatch({ type: "SET_TRAINER_NAME", name: name.trim() });
              dispatch({ type: "SET_SCREEN", screen: "starter_select" });
            }
          }}
          disabled={!name.trim()}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition"
        >
          Siguiente →
        </button>
      </div>
    </div>
  );
}

// ============================================================
// STARTER SELECT
// ============================================================
function StarterSelectScreen() {
  const { dispatch } = useGame();
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <h2 className="text-3xl font-bold text-center mb-2">Elige tu Inicial</h2>
      <p className="text-gray-400 text-center mb-8">Cada uno tiene un árbol de habilidades único</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {starterSpecies.map(species => {
          const stage = species.stages[0];
          return (
            <div
              key={species.id}
              onClick={() => setSelected(species.id)}
              className={`cursor-pointer rounded-xl p-6 border-2 transition-all ${
                selected === species.id
                  ? "border-yellow-400 bg-gray-800 scale-105"
                  : "border-gray-700 bg-gray-800 hover:border-gray-500"
              }`}
            >
              <div className="text-center mb-4">
                <PokemonSprite pokedexId={stage.pokedexId} size={120} />
                <h3 className="text-xl font-bold mt-2">{stage.name}</h3>
                <div className="flex gap-1 justify-center mt-1">
                  {stage.types.map(t => <TypeBadge key={t} type={t} />)}
                </div>
              </div>

              <div className="space-y-1 text-sm">
                <StatBar label="PS" value={stage.baseStats.hp} />
                <StatBar label="ATK" value={stage.baseStats.atk} />
                <StatBar label="DEF" value={stage.baseStats.def} />
                <StatBar label="SPA" value={stage.baseStats.spa} />
                <StatBar label="SPD" value={stage.baseStats.spd} />
                <StatBar label="VEL" value={stage.baseStats.spe} />
              </div>

              <div className="mt-4 text-xs text-gray-400">
                <p>Evoluciona a Nv.{stage.evolveLevel}</p>
                <p>Presupuesto árbol: {stage.pointBudget} pts</p>
                <p className="text-yellow-400 mt-1">
                  {species.id === "bulbasaur_line" && "Vía: Especial / Física / Estado"}
                  {species.id === "charmander_line" && "Vía: Especial / Estado"}
                  {species.id === "squirtle_line" && "Vía: Especial / Física / Estado"}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center mt-8">
        <button
          onClick={() => {
            if (selected) dispatch({ type: "CHOOSE_STARTER", speciesId: selected });
          }}
          disabled={!selected}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-lg transition"
        >
          ¡Elegir {selected ? starterSpecies.find(s => s.id === selected)?.stages[0].name : ""}!
        </button>
      </div>
    </div>
  );
}

// ============================================================
// CAMP SCREEN
// ============================================================
function CampScreen() {
  const { state, dispatch } = useGame();

  const menuItems = [
    { id: "party", label: "🎒 Equipo", desc: "Ver y gestionar tus Pokémon" },
    { id: "route_select", label: "🗺️ Ruta", desc: "Elegir siguiente ruta" },
    { id: "shop", label: "🏪 Tienda", desc: "Comprar objetos" },
    { id: "inventory", label: "📦 Inventario", desc: "Usar objetos" },
    { id: "heal", label: "💊 Curar Equipo", desc: "Restaurar PS y PP" },
    { id: "save", label: "💾 Guardar", desc: "Guardar partida" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-900 to-gray-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold">🏕️ Campamento</h2>
            <p className="text-gray-400 text-sm">Entrenador: {state.trainer.name}</p>
          </div>
          <div className="text-right">
            <p className="text-yellow-400 font-bold">💰 {state.trainer.money}₽</p>
            <p className="text-gray-400 text-sm">Equipo: {state.party.length}/6</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === "heal") {
                  dispatch({ type: "REST_PARTY" });
                } else if (item.id === "save") {
                  saveGame(state);
                  alert("¡Partida guardada!");
                } else {
                  dispatch({ type: "SET_SCREEN", screen: item.id });
                }
              }}
              className="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg p-4 text-left transition"
            >
              <p className="font-bold text-lg">{item.label}</p>
              <p className="text-gray-400 text-sm">{item.desc}</p>
            </button>
          ))}
        </div>

        <button
          onClick={() => dispatch({ type: "SET_SCREEN", screen: "title" })}
          className="mt-6 text-gray-500 hover:text-gray-300 text-sm"
        >
          ← Volver al título
        </button>
      </div>
    </div>
  );
}

// ============================================================
// PARTY SCREEN
// ============================================================
function PartyScreen() {
  const { state, dispatch } = useGame();
  const [selectedPk, setSelectedPk] = useState<PokemonState | null>(null);
  const [showBox, setShowBox] = useState(false);

  if (selectedPk) {
    return <PokemonDetail pokemon={selectedPk} onBack={() => setSelectedPk(null)} />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">🎒 Tu Equipo ({state.party.length}/6)</h2>
          <div className="flex gap-3">
            <button
              onClick={() => setShowBox(!showBox)}
              className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-sm"
            >
              📦 Caja ({state.box.length})
            </button>
            <button onClick={() => dispatch({ type: "SET_SCREEN", screen: "camp" })} className="text-gray-400 hover:text-white">
              ← Campamento
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {state.party.map(pk => {
            const species = allSpecies[pk.speciesId];
            const stage = species.stages[pk.stageIndex];
            return (
              <div
                key={pk.uid}
                onClick={() => setSelectedPk(pk)}
                className="bg-gray-800 rounded-xl p-4 cursor-pointer hover:bg-gray-750 border border-gray-700 hover:border-gray-500 transition card-hover"
              >
                <div className="flex items-center gap-4">
                  <PokemonSprite pokedexId={stage.pokedexId} size={64} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{stage.name}</span>
                      <span className="text-gray-400 text-sm">Nv.{pk.level}</span>
                    </div>
                    <div className="flex gap-1 mt-1">
                      {stage.types.map(t => <TypeBadge key={t} type={t} />)}
                    </div>
                    <div className="mt-2">
                      <HpBar current={pk.currentHp} max={pk.stats.hp} />
                      <p className="text-xs text-gray-400 mt-1">{pk.currentHp}/{pk.stats.hp} PS</p>
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Movimientos: {pk.moves.map(m => movesDb[m.id]?.name).join(", ") || "Ninguno"}
                </div>
                {state.party.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`¿Mover a ${stage.name} a la caja?`)) {
                        dispatch({ type: "ADD_TO_BOX", pokemonUid: pk.uid });
                      }
                    }}
                    className="mt-2 text-xs text-gray-500 hover:text-gray-300"
                  >
                    📦 Mover a caja
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Box */}
        {showBox && state.box.length > 0 && (
          <div className="mt-6 bg-gray-800 rounded-xl p-4">
            <h3 className="font-bold mb-3">📦 Caja de Pokémon</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {state.box.map((pk, idx) => {
                const species = allSpecies[pk.speciesId];
                const stage = species.stages[pk.stageIndex];
                return (
                  <div key={pk.uid} className="bg-gray-700 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <PokemonSprite pokedexId={stage.pokedexId} size={40} />
                      <div>
                        <p className="text-sm font-bold">{stage.name}</p>
                        <p className="text-xs text-gray-400">Nv.{pk.level}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (state.party.length >= 6) {
                          alert("Equipo lleno (6/6). Mueve un Pokémon a la caja primero.");
                          return;
                        }
                        // Swap from box to party
                        const newParty = [...state.party, pk];
                        const newBox = state.box.filter((_, i) => i !== idx);
                        dispatch({ type: "LOAD_STATE", state: { ...state, party: newParty, box: newBox } });
                      }}
                      className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-xs py-1 rounded"
                      disabled={state.party.length >= 6}
                    >
                      Añadir al equipo
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// POKEMON DETAIL SCREEN
// ============================================================
function PokemonDetail({ pokemon: pokemonSnapshot, onBack }: { pokemon: PokemonState; onBack: () => void }) {
  const { state, dispatch } = useGame();
  // Always read fresh data from state
  const pokemon = state.party.find(p => p.uid === pokemonSnapshot.uid) || pokemonSnapshot;
  const species = allSpecies[pokemon.speciesId];
  const stage = species.stages[pokemon.stageIndex];
  const stageState = pokemon.stageStates[pokemon.stageIndex];
  const [tab, setTab] = useState<"stats" | "tree" | "moves" | "evolve">("stats");

  const blockedMoves = getPermanentlyBlockedMoves(pokemon, species);
  const evolveCheck = canEvolve(pokemon, species);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        <button onClick={onBack} className="text-gray-400 hover:text-white mb-4">← Volver al equipo</button>

        {/* Header */}
        <div className="bg-gray-800 rounded-xl p-6 mb-4 flex items-center gap-6">
          <PokemonSprite pokedexId={stage.pokedexId} size={120} />
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{stage.name}</h2>
            <div className="flex gap-1 mt-1">
              {stage.types.map(t => <TypeBadge key={t} type={t} />)}
            </div>
            <p className="text-gray-400 mt-2">Nivel {pokemon.level} · XP: {pokemon.xp}/{xpToNext(pokemon.level)}</p>
            <div className="mt-2 max-w-xs">
              <HpBar current={pokemon.currentHp} max={pokemon.stats.hp} />
              <p className="text-xs text-gray-400">{pokemon.currentHp}/{pokemon.stats.hp} PS</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {[
            { id: "stats", label: "📊 Stats" },
            { id: "tree", label: "🌳 Árbol" },
            { id: "moves", label: "⚔️ Movimientos" },
            { id: "evolve", label: "✨ Evolución" },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
                tab === t.id ? "bg-blue-600" : "bg-gray-800 hover:bg-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {tab === "stats" && (
          <div className="bg-gray-800 rounded-xl p-6">
            <h3 className="font-bold mb-4">Estadísticas Base</h3>
            <div className="space-y-2">
              <StatBar label="PS" value={pokemon.stats.hp} />
              <StatBar label="ATK" value={pokemon.stats.atk} />
              <StatBar label="DEF" value={pokemon.stats.def} />
              <StatBar label="SPA" value={pokemon.stats.spa} />
              <StatBar label="SPD" value={pokemon.stats.spd} />
              <StatBar label="VEL" value={pokemon.stats.spe} />
            </div>
            <div className="mt-4 text-sm text-gray-400">
              <p>Maestría máx: {pokemon.masteryCap}</p>
              <p>Vías: {pokemon.pathways.length > 0 ? pokemon.pathways.join(", ") : "Ninguna"}</p>
              <p>Flags: {pokemon.flags.length > 0 ? pokemon.flags.join(", ") : "Ninguno"}</p>
            </div>
          </div>
        )}

        {tab === "tree" && (
          <SkillTreeView pokemon={pokemon} species={species} dispatch={dispatch} />
        )}

        {tab === "moves" && (
          <MovesView pokemon={pokemon} species={species} dispatch={dispatch} />
        )}

        {tab === "evolve" && (
          <EvolveView pokemon={pokemon} species={species} blockedMoves={blockedMoves} evolveCheck={evolveCheck} dispatch={dispatch} />
        )}
      </div>
    </div>
  );
}

// ============================================================
// SKILL TREE VIEW
// ============================================================
function SkillTreeView({ pokemon, species, dispatch }: { pokemon: PokemonState; species: Species; dispatch: any }) {
  const stage = species.stages[pokemon.stageIndex];
  const stageState = pokemon.stageStates[pokemon.stageIndex];

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold">Árbol de Habilidades - {stage.name}</h3>
        <div className="text-sm">
          <span className="text-yellow-400 font-bold">{stageState.pendingPoints}</span>
          <span className="text-gray-400"> pts disponibles</span>
          <span className="text-gray-500 ml-2">({stageState.spentPoints}/{stage.pointBudget} gastados)</span>
        </div>
      </div>

      {stageState.locked && (
        <div className="bg-red-900/50 border border-red-700 rounded-lg p-3 mb-4 text-red-300 text-sm">
          🔒 Esta fase está BLOQUEADA. No puedes gastar más puntos aquí.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {stage.skillTree.map(node => {
          const unlocked = stageState.unlockedNodes.includes(node.id);
          const canBuy = !unlocked && !stageState.locked && canSpendPoint(pokemon, species, node.id).ok;
          const checkResult = canSpendPoint(pokemon, species, node.id);

          return (
            <div
              key={node.id}
              className={`rounded-lg p-4 border transition ${
                unlocked
                  ? "bg-green-900/30 border-green-600"
                  : canBuy
                  ? "bg-gray-700 border-blue-500 hover:border-blue-400 cursor-pointer"
                  : "bg-gray-800 border-gray-700 opacity-60"
              }`}
              onClick={() => {
                if (canBuy) {
                  if (node.grants?.pathway) {
                    if (confirm(`¿Desbloquear "${node.name}"?\n\nEsto desbloquea la vía "${node.grants.pathway}" permanentemente.\nSi no lo haces antes de evolucionar, ciertos movimientos futuros quedarán bloqueados.\n\n¿Continuar?`)) {
                      dispatch({ type: "SPEND_SKILL_POINT", pokemonUid: pokemon.uid, nodeId: node.id });
                    }
                  } else {
                    dispatch({ type: "SPEND_SKILL_POINT", pokemonUid: pokemon.uid, nodeId: node.id });
                  }
                }
              }}
            >
              <div className="flex justify-between items-start">
                <span className="font-bold text-sm">{node.name}</span>
                {unlocked && <span className="text-green-400 text-xs">✓</span>}
              </div>
              {node.description && <p className="text-xs text-gray-400 mt-1">{node.description}</p>}
              {node.grants?.pathway && (
                <p className="text-xs text-purple-400 mt-1">🔑 Vía: {node.grants.pathway}</p>
              )}
              {node.grants?.flag && (
                <p className="text-xs text-orange-400 mt-1">🚩 Flag: {node.grants.flag}</p>
              )}
              {node.grants?.masteryCap && (
                <p className="text-xs text-cyan-400 mt-1">⭐ +{node.grants.masteryCap} Maestría máx</p>
              )}
              {!unlocked && !canBuy && !stageState.locked && checkResult.reason && (
                <p className="text-xs text-red-400 mt-1">⚠️ {checkResult.reason}</p>
              )}
              {node.requiresPrev && (
                <p className="text-xs text-yellow-500 mt-1">
                  ⚡ Requiere de fase anterior: {node.requiresPrev.map(r => {
                    const prevStage = species.stages[r.stage];
                    const prevNode = prevStage?.skillTree.find(n => n.id === r.node);
                    return prevNode?.name || r.node;
                  }).join(", ")}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Show previous locked stages */}
      {pokemon.stageStates.filter((s, i) => i < pokemon.stageIndex && s.locked).length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm text-gray-500 mb-2">Fases anteriores (bloqueadas):</h4>
          <div className="flex gap-2 flex-wrap">
            {pokemon.stageStates.map((ss, i) => {
              if (i >= pokemon.stageIndex) return null;
              const prevStage = species.stages[i];
              return (
                <div key={i} className="bg-gray-800 border border-red-900 rounded-lg px-3 py-2 text-xs">
                  <span className="text-red-400">🔒 {prevStage.name}</span>
                  <span className="text-gray-500 ml-2">{ss.unlockedNodes.length} nodos desbloqueados</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// MOVES VIEW
// ============================================================
function MovesView({ pokemon, species, dispatch }: { pokemon: PokemonState; species: Species; dispatch: any }) {
  const [showLearn, setShowLearn] = useState(false);

  const availableMoves = species.learnRules.filter(rule => {
    if (pokemon.moves.find(m => m.id === rule.moveId)) return false;
    return true;
  });

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold">Movimientos ({pokemon.moves.length}/4)</h3>
        <button
          onClick={() => setShowLearn(!showLearn)}
          className="bg-blue-600 hover:bg-blue-700 text-sm px-3 py-1 rounded"
        >
          {showLearn ? "Cerrar" : "Aprender movimiento"}
        </button>
      </div>

      {/* Current moves */}
      <div className="space-y-3 mb-6">
        {pokemon.moves.map(km => {
          const move = movesDb[km.id];
          if (!move) return null;
          const mastery = pokemon.moveMastery[km.id] || { rank: 0, xp: 0 };
          const effPower = getEffectivePower(move, mastery.rank);

          return (
            <div key={km.id} className="bg-gray-700 rounded-lg p-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-bold">{move.name}</span>
                  <span className="ml-2">
                    <TypeBadge type={move.type} />
                  </span>
                  <span className="ml-2 text-xs text-gray-400">{move.category}</span>
                </div>
                <span className="text-xs text-gray-400">PP: {km.pp}/{km.maxPp}</span>
              </div>
              <div className="mt-2 text-xs text-gray-400">
                <span>Poder: {move.basePower} → <span className="text-green-400">{effPower}</span></span>
                <span className="ml-4">Precisión: {move.accuracy}%</span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xs text-yellow-400">⭐ Rango {mastery.rank}/{pokemon.masteryCap}</span>
                <div className="flex-1 bg-gray-600 rounded-full h-1.5">
                  <div
                    className="bg-yellow-400 h-full rounded-full"
                    style={{ width: `${(mastery.xp / masteryXpNeeded(mastery.rank)) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500">{mastery.xp}/{masteryXpNeeded(mastery.rank)} XP</span>
              </div>
              {move.effect && <p className="text-xs text-purple-300 mt-1">Efecto: {move.effect}</p>}
              <button
                onClick={() => {
                  if (confirm(`¿Olvidar ${move.name}? La maestría se mantiene.`)) {
                    dispatch({ type: "FORGET_MOVE", pokemonUid: pokemon.uid, moveId: km.id });
                  }
                }}
                className="mt-2 text-xs text-red-400 hover:text-red-300"
              >
                Olvidar
              </button>
            </div>
          );
        })}
        {pokemon.moves.length === 0 && <p className="text-gray-500 text-sm">No conoce ningún movimiento.</p>}
      </div>

      {/* Learn new moves */}
      {showLearn && (
        <div className="border-t border-gray-700 pt-4">
          <h4 className="font-bold mb-3 text-sm">Movimientos disponibles:</h4>
          <div className="space-y-2">
            {availableMoves.map(rule => {
              const move = movesDb[rule.moveId];
              if (!move) return null;
              const check = canLearnMove(pokemon, species, rule.moveId);
              const isBlocked = check.reason?.includes("BLOQUEADO PERMANENTEMENTE");

              return (
                <div key={rule.moveId} className={`rounded-lg p-3 ${isBlocked ? "bg-red-900/20 border border-red-800" : "bg-gray-700"}`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-bold text-sm">{move.name}</span>
                      <span className="ml-2"><TypeBadge type={move.type} /></span>
                      <span className="ml-2 text-xs text-gray-400">Poder: {move.basePower}</span>
                    </div>
                    {check.ok && pokemon.moves.length < 4 && (
                      <button
                        onClick={() => dispatch({ type: "LEARN_MOVE", pokemonUid: pokemon.uid, moveId: rule.moveId })}
                        className="bg-green-600 hover:bg-green-700 text-xs px-2 py-1 rounded"
                      >
                        Aprender
                      </button>
                    )}
                    {check.ok && pokemon.moves.length >= 4 && (
                      <span className="text-xs text-yellow-400">Equipo lleno (4/4)</span>
                    )}
                  </div>
                  {!check.ok && (
                    <p className={`text-xs mt-1 ${isBlocked ? "text-red-400 font-bold" : "text-gray-400"}`}>
                      {isBlocked ? "🔒 " : "⚠️ "}{check.reason}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// EVOLVE VIEW
// ============================================================
function EvolveView({ pokemon, species, blockedMoves, evolveCheck, dispatch }: {
  pokemon: PokemonState; species: Species; blockedMoves: string[];
  evolveCheck: { ok: boolean; reason?: string }; dispatch: any;
}) {
  const stage = species.stages[pokemon.stageIndex];
  const nextStage = pokemon.stageIndex < species.stages.length - 1 ? species.stages[pokemon.stageIndex + 1] : null;
  const stageState = pokemon.stageStates[pokemon.stageIndex];

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <h3 className="font-bold mb-4">✨ Evolución</h3>

      {nextStage ? (
        <div>
          <div className="flex items-center gap-4 mb-4">
            <div className="text-center">
              <PokemonSprite pokedexId={stage.pokedexId} size={80} />
              <p className="text-sm mt-1">{stage.name}</p>
            </div>
            <span className="text-2xl">→</span>
            <div className="text-center">
              <PokemonSprite pokedexId={nextStage.pokedexId} size={80} />
              <p className="text-sm mt-1">{nextStage.name}</p>
            </div>
          </div>

          <div className="text-sm text-gray-400 space-y-1 mb-4">
            <p>Nivel requerido: {stage.evolveLevel} (actual: {pokemon.level})</p>
            <p>Puntos sin gastar en esta fase: {stageState.pendingPoints}</p>
            {stageState.pendingPoints > 0 && (
              <p className="text-yellow-400">Se convertirán en {stageState.pendingPoints * 3} XP de maestría global.</p>
            )}
          </div>

          {blockedMoves.length > 0 && (
            <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 mb-4">
              <p className="text-red-300 text-sm font-bold">⚠️ Movimientos que quedarán bloqueados permanentemente:</p>
              <ul className="text-xs text-red-400 mt-1 list-disc list-inside">
                {blockedMoves.map(mId => (
                  <li key={mId}>{movesDb[mId]?.name || mId}</li>
                ))}
              </ul>
            </div>
          )}

          {evolveCheck.ok ? (
            <button
              onClick={() => {
                const msg = `¿Evolucionar a ${nextStage.name}?\n\nLa fase actual (${stage.name}) se bloqueará permanentemente.\n${stageState.pendingPoints > 0 ? `${stageState.pendingPoints} puntos → ${stageState.pendingPoints * 3} XP maestría.\n` : ""}${blockedMoves.length > 0 ? `${blockedMoves.length} movimientos quedarán bloqueados.\n` : ""}\n¿Continuar?`;
                if (confirm(msg)) {
                  dispatch({ type: "EVOLVE", pokemonUid: pokemon.uid });
                }
              }}
              className="bg-purple-600 hover:bg-purple-700 font-bold py-3 px-6 rounded-lg transition"
            >
              ✨ ¡Evolucionar!
            </button>
          ) : (
            <p className="text-gray-500 text-sm">{evolveCheck.reason}</p>
          )}
        </div>
      ) : (
        <p className="text-gray-500">Este Pokémon ya está en su forma final.</p>
      )}
    </div>
  );
}

// ============================================================
// ROUTE SELECT SCREEN
// ============================================================
function RouteSelectScreen() {
  const { state, dispatch } = useGame();

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">🗺️ Elegir Ruta</h2>
          <button onClick={() => dispatch({ type: "SET_SCREEN", screen: "camp" })} className="text-gray-400 hover:text-white">
            ← Campamento
          </button>
        </div>

        <div className="space-y-4">
          {routesDb.map(route => {
            const avgLevel = state.party.reduce((s, p) => s + p.level, 0) / state.party.length;
            const recommended = avgLevel >= route.minLevel && avgLevel <= route.maxLevel + 5;
            return (
              <div
                key={route.id}
                className={`bg-gray-800 rounded-xl p-5 border ${recommended ? "border-green-700" : "border-gray-700"}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg">{route.name}</h3>
                    <p className="text-gray-400 text-sm">{route.description}</p>
                    <p className="text-xs text-gray-500 mt-1">Niveles: {route.minLevel}-{route.maxLevel}</p>
                  </div>
                  <button
                    onClick={() => dispatch({ type: "START_ROUTE", routeId: route.id })}
                    className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm font-bold"
                  >
                    Viajar
                  </button>
                </div>
                {!recommended && (
                  <p className="text-yellow-400 text-xs mt-2">⚠️ Nivel recomendado: {route.minLevel}-{route.maxLevel} (tu equipo: ~Nv.{Math.round(avgLevel)})</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ROUTE SCREEN
// ============================================================
function RouteScreen() {
  const { state, dispatch } = useGame();
  const [log, setLog] = useState<string[]>([]);

  const route = state.route;
  if (!route) return null;
  const routeDef = routesDb.find(r => r.id === route.routeId);
  if (!routeDef) return null;

  const handleAdvance = () => {
    dispatch({ type: "ADVANCE_ROUTE" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-800 to-gray-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold">{routeDef.name}</h2>
            <p className="text-gray-400 text-sm">Checkpoint: {route.checkpoints}</p>
          </div>
          <button
            onClick={() => dispatch({ type: "SET_SCREEN", screen: "camp" })}
            className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-sm"
          >
            🏕️ Volver al campamento
          </button>
        </div>

        {/* Progress bar */}
        <div className="bg-gray-800 rounded-xl p-4 mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span>Progreso</span>
            <span>{route.progress}/100</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-500"
              style={{ width: `${route.progress}%` }}
            />
          </div>
        </div>

        {/* Event log */}
        {state.battleLog.length > 0 && (
          <div className="bg-gray-800 rounded-xl p-4 mb-4">
            <h3 className="text-sm font-bold text-gray-400 mb-2">Último evento:</h3>
            {state.battleLog.map((msg, i) => (
              <p key={i} className="text-sm">{msg}</p>
            ))}
          </div>
        )}

        {/* Party status */}
        <div className="bg-gray-800 rounded-xl p-4 mb-4">
          <h3 className="text-sm font-bold text-gray-400 mb-2">Equipo:</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {state.party.map(pk => {
              const species = allSpecies[pk.speciesId];
              const stage = species.stages[pk.stageIndex];
              return (
                <div key={pk.uid} className="flex items-center gap-2 bg-gray-700 rounded-lg p-2">
                  <PokemonSprite pokedexId={stage.pokedexId} size={32} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate">{stage.name} Nv.{pk.level}</p>
                    <HpBar current={pk.currentHp} max={pk.stats.hp} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Advance button */}
        <button
          onClick={handleAdvance}
          className="w-full bg-blue-600 hover:bg-blue-700 font-bold py-4 rounded-xl text-lg transition"
        >
          🚶 Avanzar por la ruta
        </button>
      </div>
    </div>
  );
}

// ============================================================
// BATTLE SCREEN
// ============================================================
function BattleScreen() {
  const { state, battle, setBattle, dispatch, rng } = useGame();
  const [initialized, setInitialized] = useState(false);

  // Initialize battle from pendingBattle data
  useEffect(() => {
    if (!initialized && state.pendingBattle) {
      const { enemySpeciesId, enemyLevel, isTrainer, message } = state.pendingBattle;

      const enemy = createPokemon(enemySpeciesId, enemyLevel);
      const enemySpecies = allSpecies[enemySpeciesId];
      // Give enemy a move
      const firstRule = enemySpecies.learnRules.find(r => r.minLevel === 1 || r.minLevel === undefined);
      if (firstRule) {
        enemy.moves.push({ id: firstRule.moveId, pp: movesDb[firstRule.moveId].pp, maxPp: movesDb[firstRule.moveId].pp });
        enemy.moveMastery[firstRule.moveId] = { rank: 0, xp: 0 };
      }
      // Maybe give a second move
      const secondRule = enemySpecies.learnRules.find(r => r.minLevel && r.minLevel <= enemyLevel && r !== firstRule);
      if (secondRule && enemy.moves.length < 4) {
        enemy.moves.push({ id: secondRule.moveId, pp: movesDb[secondRule.moveId].pp, maxPp: movesDb[secondRule.moveId].pp });
        enemy.moveMastery[secondRule.moveId] = { rank: 0, xp: 0 };
      }

      const playerPk = state.party.find(p => p.currentHp > 0);
      if (!playerPk) return;

      setBattle({
        active: true,
        isTrainer,
        playerPokemon: { ...playerPk, moves: playerPk.moves.map(m => ({ ...m })), moveMastery: { ...playerPk.moveMastery } },
        playerSpeciesId: playerPk.speciesId,
        enemyPokemon: enemy,
        enemySpeciesId,
        log: [message || "¡Comienza el combate!"],
        phase: "choose_action",
        xpGained: 0,
        moneyGained: 0,
        caught: false,
      });
      setInitialized(true);
    }
  }, [initialized, state.pendingBattle]);

  if (!battle.active || !battle.playerPokemon || !battle.enemyPokemon) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p>Cargando combate...</p>
      </div>
    );
  }

  const playerSpecies = allSpecies[battle.playerSpeciesId];
  const enemySpecies = allSpecies[battle.enemySpeciesId];
  const playerStage = playerSpecies.stages[battle.playerPokemon.stageIndex];
  const enemyStage = enemySpecies.stages[battle.enemyPokemon.stageIndex];

  const handleAttack = (moveId: string) => {
    const move = movesDb[moveId];
    if (!move || !battle.playerPokemon || !battle.enemyPokemon) return;

    const newLog = [...battle.log];
    const playerPk = { ...battle.playerPokemon, moves: battle.playerPokemon.moves.map(m => ({ ...m })) };
    const enemyPk = { ...battle.enemyPokemon };
    const battleRng = new SeededRNG(Date.now());

    // Find move and reduce PP (struggle doesn't consume PP)
    const moveIdx = playerPk.moves.findIndex(m => m.id === moveId);
    if (moveIdx >= 0 && playerPk.moves[moveIdx].pp > 0) {
      playerPk.moves[moveIdx].pp--;
    }
    // Struggle self-damage
    if (moveId === "struggle") {
      playerPk.currentHp = Math.max(1, playerPk.currentHp - Math.floor(playerPk.stats.hp * 0.1));
    }

    // Player attacks
    newLog.push(`${playerStage.name} usó ${move.name}!`);

    if (move.category !== "status") {
      const dmgResult = calculateDamage(playerPk, enemyPk, move, playerSpecies, enemySpecies, battleRng);
      enemyPk.currentHp = Math.max(0, enemyPk.currentHp - dmgResult.damage);
      newLog.push(`Hizo ${dmgResult.damage} de daño!`);
      if (dmgResult.message) newLog.push(dmgResult.message);

      // Add mastery XP (not for struggle)
      if (moveId !== "struggle") {
        let masteryXp = 3;
        if (dmgResult.effectiveness >= 2) masteryXp += 2;
        if (dmgResult.critical) masteryXp += 2;
        if (enemyPk.currentHp <= 0) masteryXp += 5;
        addMoveXp(playerPk, moveId, masteryXp);
      }
    } else {
      // Status move
      newLog.push(move.description || "Efecto de estado aplicado.");
      if (moveId !== "struggle") addMoveXp(playerPk, moveId, 2);
    }

    // Check if enemy fainted
    if (enemyPk.currentHp <= 0) {
      newLog.push(`¡${enemyStage.name} se debilitó!`);
      const xpGain = Math.floor(enemySpecies.xpYield * enemyPk.level / 7);
      newLog.push(`+${xpGain} XP`);
      const moneyGain = enemyPk.level * 15 + (battle.isTrainer ? 100 : 0);
      newLog.push(`+${moneyGain}₽`);

      setBattle({
        ...battle,
        playerPokemon: playerPk,
        enemyPokemon: enemyPk,
        log: newLog,
        phase: "ended",
        result: "win",
        xpGained: xpGain,
        moneyGained: moneyGain,
      });
      return;
    }

    // Enemy turn
    const enemyMove = enemyPk.moves.length > 0 ? enemyPk.moves[battleRng.nextInt(0, enemyPk.moves.length - 1)] : null;
    if (enemyMove && movesDb[enemyMove.id]) {
      const eMove = movesDb[enemyMove.id];
      newLog.push(`${enemyStage.name} usó ${eMove.name}!`);

      if (eMove.category !== "status") {
        const eDmg = calculateDamage(enemyPk, playerPk, eMove, enemySpecies, playerSpecies, battleRng);
        playerPk.currentHp = Math.max(0, playerPk.currentHp - eDmg.damage);
        newLog.push(`Hizo ${eDmg.damage} de daño!`);
        if (eDmg.message) newLog.push(eDmg.message);
      } else {
        newLog.push(eMove.description || "Efecto de estado.");
      }
    } else {
      newLog.push(`${enemyStage.name} no puede atacar.`);
    }

    // Check if player fainted
    if (playerPk.currentHp <= 0) {
      newLog.push(`¡${playerStage.name} se debilitó!`);
      // Check if any party member alive
      const aliveParty = state.party.filter(p => p.uid !== playerPk.uid && p.currentHp > 0);
      if (aliveParty.length === 0) {
        newLog.push("¡Todo tu equipo se debilitó!");
        setBattle({ ...battle, playerPokemon: playerPk, enemyPokemon: enemyPk, log: newLog, phase: "ended", result: "lose" });
      } else {
        newLog.push("Elige otro Pokémon.");
        setBattle({ ...battle, playerPokemon: playerPk, enemyPokemon: enemyPk, log: newLog, phase: "choose_action" });
      }
      return;
    }

    setBattle({ ...battle, playerPokemon: playerPk, enemyPokemon: enemyPk, log: newLog, phase: "choose_action" });
  };

  const handleCatch = () => {
    if (!battle.playerPokemon || !battle.enemyPokemon || battle.isTrainer) return;
    const balls = state.inventory.poke_ball || 0;
    if (balls <= 0) return;

    const newLog = [...battle.log, "¡Lanzaste una Poké Ball!"];
    const battleRng = new SeededRNG(Date.now() + 999);
    const caught = calculateCatchRate(battle.enemyPokemon, enemySpecies, 1, 1, battleRng);

    if (caught) {
      newLog.push(`¡${enemyStage.name} fue capturado!`);
      setBattle({ ...battle, log: newLog, phase: "ended", result: "catch", caught: true });
    } else {
      newLog.push("¡Casi! Pero escapó de la ball.");
      // Enemy attacks
      const enemyMove = battle.enemyPokemon.moves.length > 0 ? battle.enemyPokemon.moves[0] : null;
      if (enemyMove && movesDb[enemyMove.id]) {
        const eMove = movesDb[enemyMove.id];
        newLog.push(`${enemyStage.name} usó ${eMove.name}!`);
        if (eMove.category !== "status") {
          const eDmg = calculateDamage(battle.enemyPokemon, battle.playerPokemon, eMove, enemySpecies, playerSpecies, battleRng);
          const newPlayerPk = { ...battle.playerPokemon, currentHp: Math.max(0, battle.playerPokemon.currentHp - eDmg.damage) };
          newLog.push(`Hizo ${eDmg.damage} de daño!`);
          setBattle({ ...battle, playerPokemon: newPlayerPk, log: newLog });
        }
      }
    }
  };

  const handleFlee = () => {
    const battleRng = new SeededRNG(Date.now() + 777);
    const newLog = [...battle.log];
    if (battleRng.next() > 0.3) {
      newLog.push("¡Huiste con éxito!");
      setBattle({ ...battle, log: newLog, phase: "ended", result: "flee" });
    } else {
      newLog.push("¡No pudiste huir!");
      setBattle({ ...battle, log: newLog });
    }
  };

  const handleEndBattle = () => {
    // Clear pending battle
    const newState = { ...state, pendingBattle: undefined };

    // Apply results to game state
    if (battle.result === "win" && battle.playerPokemon) {
      // Update party pokemon with battle results
      const party = newState.party.map(pk => {
        if (pk.uid === battle.playerPokemon!.uid) {
          const updated = { ...battle.playerPokemon! };
          gainXp(updated, battle.xpGained, playerSpecies);
          updated.moveMastery = { ...battle.playerPokemon!.moveMastery };
          return updated;
        }
        return pk;
      });
      dispatch({ type: "LOAD_STATE", state: { ...newState, party, trainer: { ...newState.trainer, money: newState.trainer.money + battle.moneyGained } } });
    } else if (battle.result === "catch" && battle.enemyPokemon) {
      const caughtPk = { ...battle.enemyPokemon };
      // Reset pending points for caught pokemon (no historical points)
      caughtPk.stageStates = caughtPk.stageStates.map(s => ({ ...s, pendingPoints: 0 }));
      if (newState.party.length < 6) {
        dispatch({ type: "LOAD_STATE", state: { ...newState, party: [...newState.party, caughtPk], inventory: { ...newState.inventory, poke_ball: (newState.inventory.poke_ball || 0) - 1 } } });
      } else {
        dispatch({ type: "LOAD_STATE", state: { ...newState, box: [...newState.box, caughtPk], inventory: { ...newState.inventory, poke_ball: (newState.inventory.poke_ball || 0) - 1 } } });
      }
    } else if (battle.result === "lose") {
      // Lose half money
      const lostMoney = Math.floor(newState.trainer.money / 2);
      dispatch({ type: "LOAD_STATE", state: { ...newState, trainer: { ...newState.trainer, money: newState.trainer.money - lostMoney }, party: newState.party.map(pk => ({ ...pk, currentHp: Math.max(1, Math.floor(pk.stats.hp * 0.2)) })) } });
    } else if (battle.playerPokemon) {
      // Flee or other - just update HP
      const party = newState.party.map(pk => {
        if (pk.uid === battle.playerPokemon!.uid) return { ...battle.playerPokemon! };
        return pk;
      });
      dispatch({ type: "LOAD_STATE", state: { ...newState, party } });
    } else {
      dispatch({ type: "LOAD_STATE", state: newState });
    }

    setBattle(createInitialBattle());
    dispatch({ type: "SET_SCREEN", screen: "route" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-900 to-gray-900 text-white p-4">
      <div className="max-w-2xl mx-auto">
        {/* Battle field */}
        <div className="bg-gray-800 rounded-xl p-6 mb-4">
          {/* Enemy */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold">{enemyStage.name}</span>
                <span className="text-gray-400 text-sm">Nv.{battle.enemyPokemon.level}</span>
              </div>
              <div className="flex gap-1 mt-1">
                {enemyStage.types.map(t => <TypeBadge key={t} type={t} />)}
              </div>
              <div className="mt-2 max-w-48">
                <HpBar current={battle.enemyPokemon.currentHp} max={battle.enemyPokemon.stats.hp} />
                <p className="text-xs text-gray-400">{battle.enemyPokemon.currentHp}/{battle.enemyPokemon.stats.hp}</p>
              </div>
            </div>
            <PokemonSprite pokedexId={enemyStage.pokedexId} size={96} />
          </div>

          {/* Player */}
          <div className="flex justify-between items-end">
            <PokemonSprite pokedexId={playerStage.pokedexId} back size={96} />
            <div className="flex-1 text-right">
              <div className="flex items-center gap-2 justify-end">
                <span className="font-bold">{playerStage.name}</span>
                <span className="text-gray-400 text-sm">Nv.{battle.playerPokemon.level}</span>
              </div>
              <div className="flex gap-1 mt-1 justify-end">
                {playerStage.types.map(t => <TypeBadge key={t} type={t} />)}
              </div>
              <div className="mt-2 max-w-48 ml-auto">
                <HpBar current={battle.playerPokemon.currentHp} max={battle.playerPokemon.stats.hp} />
                <p className="text-xs text-gray-400">{battle.playerPokemon.currentHp}/{battle.playerPokemon.stats.hp}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Battle log */}
        <div className="bg-gray-800 rounded-xl p-4 mb-4 max-h-40 overflow-y-auto">
          {battle.log.slice(-6).map((msg, i) => (
            <p key={i} className="text-sm py-0.5">{msg}</p>
          ))}
        </div>

        {/* Actions */}
        {battle.phase === "ended" ? (
          <button
            onClick={handleEndBattle}
            className="w-full bg-blue-600 hover:bg-blue-700 font-bold py-3 rounded-xl"
          >
            Continuar
          </button>
        ) : (
          <div className="space-y-3">
            {/* Moves */}
            <div className="grid grid-cols-2 gap-2">
              {battle.playerPokemon.moves.map(km => {
                const move = movesDb[km.id];
                if (!move) return null;
                const mastery = battle.playerPokemon!.moveMastery[km.id];
                return (
                  <button
                    key={km.id}
                    onClick={() => handleAttack(km.id)}
                    disabled={km.pp <= 0}
                    className={`rounded-lg p-3 text-left border transition ${
                      km.pp > 0 ? "bg-gray-700 border-gray-600 hover:border-blue-500" : "bg-gray-800 border-gray-700 opacity-50"
                    }`}
                  >
                    <div className="flex justify-between">
                      <span className="font-bold text-sm">{move.name}</span>
                      <span className="text-xs text-gray-400">{km.pp}/{km.maxPp}</span>
                    </div>
                    <div className="flex gap-1 mt-1">
                      <TypeBadge type={move.type} />
                      {move.basePower > 0 && <span className="text-xs text-gray-400">Pow:{getEffectivePower(move, mastery?.rank || 0)}</span>}
                    </div>
                    {mastery && mastery.rank > 0 && (
                      <span className="text-xs text-yellow-400">⭐{mastery.rank}</span>
                    )}
                  </button>
                );
              })}
              {/* Struggle when all PP depleted */}
              {battle.playerPokemon.moves.every(m => m.pp <= 0) && (
                <button
                  onClick={() => handleAttack("struggle")}
                  className="rounded-lg p-3 text-left border border-red-700 bg-red-900/30 hover:bg-red-900/50 col-span-2"
                >
                  <div className="flex justify-between">
                    <span className="font-bold text-sm text-red-300">⚠️ Forcejeo</span>
                    <span className="text-xs text-gray-400">∞ PP</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Ataque desesperado (50 poder)</p>
                </button>
              )}
            </div>

            {/* Other actions */}
            <div className="flex gap-2 flex-wrap">
              {!battle.isTrainer && (
                <button
                  onClick={handleCatch}
                  disabled={(state.inventory.poke_ball || 0) <= 0}
                  className="flex-1 min-w-[100px] bg-red-700 hover:bg-red-600 disabled:bg-gray-700 disabled:opacity-50 py-2 rounded-lg text-sm font-bold"
                >
                  🔴 Capturar ({state.inventory.poke_ball || 0})
                </button>
              )}
              {state.party.filter(p => p.currentHp > 0 && p.uid !== battle.playerPokemon?.uid).length > 0 && (
                <button
                  onClick={() => {
                    // Find next alive pokemon
                    const nextAlive = state.party.find(p => p.currentHp > 0 && p.uid !== battle.playerPokemon?.uid);
                    if (nextAlive) {
                      const newLog = [...battle.log, `¡Ven, ${allSpecies[nextAlive.speciesId].stages[nextAlive.stageIndex].name}!`];
                      setBattle({
                        ...battle,
                        playerPokemon: { ...nextAlive, moves: nextAlive.moves.map(m => ({ ...m })), moveMastery: { ...nextAlive.moveMastery } },
                        playerSpeciesId: nextAlive.speciesId,
                        log: newLog,
                      });
                    }
                  }}
                  className="flex-1 min-w-[100px] bg-indigo-700 hover:bg-indigo-600 py-2 rounded-lg text-sm font-bold"
                >
                  🔄 Cambiar
                </button>
              )}
              <button
                onClick={handleFlee}
                className="flex-1 min-w-[100px] bg-gray-700 hover:bg-gray-600 py-2 rounded-lg text-sm font-bold"
              >
                🏃 Huir
              </button>
            </div>
          </div>
        )}

        {/* End of battle results */}
        {battle.phase === "ended" && (
          <div className="bg-gray-800 rounded-xl p-4 mt-4 animate-fade-in">
            <h3 className="font-bold text-lg mb-2">
              {battle.result === "win" && "🎉 ¡Victoria!"}
              {battle.result === "lose" && "💀 Derrota..."}
              {battle.result === "catch" && "🔴 ¡Capturado!"}
              {battle.result === "flee" && "🏃 Huiste."}
            </h3>
            {battle.result === "win" && (
              <div className="text-sm space-y-1">
                <p className="text-green-400">+{battle.xpGained} XP</p>
                <p className="text-yellow-400">+{battle.moneyGained}₽</p>
              </div>
            )}
            {battle.result === "catch" && (
              <p className="text-sm text-green-400">
                {allSpecies[battle.enemySpeciesId]?.stages[0].name} se unió a tu equipo!
              </p>
            )}
            {battle.result === "lose" && (
              <p className="text-sm text-red-400">Perdiste {Math.floor(state.trainer.money / 2)}₽</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// SHOP SCREEN
// ============================================================
function ShopScreen() {
  const { state, dispatch } = useGame();
  const shopItems = ["poke_ball", "great_ball", "potion", "super_potion", "hyper_potion", "revive", "antidote", "burn_heal"];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">🏪 Tienda</h2>
          <div>
            <span className="text-yellow-400 font-bold">💰 {state.trainer.money}₽</span>
            <button onClick={() => dispatch({ type: "SET_SCREEN", screen: "camp" })} className="ml-4 text-gray-400 hover:text-white">← Volver</button>
          </div>
        </div>

        <div className="space-y-2">
          {shopItems.map(itemId => {
            const item = itemsDb[itemId];
            if (!item) return null;
            const canBuy = state.trainer.money >= item.price;
            return (
              <div key={itemId} className="bg-gray-800 rounded-lg p-4 flex justify-between items-center">
                <div>
                  <p className="font-bold">{item.name}</p>
                  <p className="text-xs text-gray-400">{item.description}</p>
                  <p className="text-xs text-gray-500">Tienes: {state.inventory[itemId] || 0}</p>
                </div>
                <button
                  onClick={() => dispatch({ type: "BUY_ITEM", itemId })}
                  disabled={!canBuy}
                  className={`px-4 py-2 rounded-lg text-sm font-bold ${canBuy ? "bg-green-600 hover:bg-green-700" : "bg-gray-700 opacity-50 cursor-not-allowed"}`}
                >
                  {item.price}₽
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// INVENTORY SCREEN
// ============================================================
function InventoryScreen() {
  const { state, dispatch } = useGame();
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);

  const usableItems = Object.entries(state.inventory).filter(([_, count]) => count > 0);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">📦 Inventario</h2>
          <button onClick={() => dispatch({ type: "SET_SCREEN", screen: "camp" })} className="text-gray-400 hover:text-white">← Volver</button>
        </div>

        {usableItems.length === 0 ? (
          <p className="text-gray-500">Tu inventario está vacío.</p>
        ) : (
          <div className="space-y-2">
            {usableItems.map(([itemId, count]) => {
              const item = itemsDb[itemId];
              if (!item) return null;
              const isUsable = item.category === "potion" || item.category === "revive" || item.category === "status_heal";

              return (
                <div key={itemId} className="bg-gray-800 rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <p className="font-bold">{item.name} x{count}</p>
                    <p className="text-xs text-gray-400">{item.description}</p>
                  </div>
                  {isUsable && (
                    <button
                      onClick={() => {
                        if (selectedTarget) {
                          dispatch({ type: "USE_ITEM", itemId, targetUid: selectedTarget });
                          setSelectedTarget(null);
                        } else {
                          setSelectedTarget(state.party[0]?.uid || null);
                        }
                      }}
                      className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
                    >
                      Usar
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {selectedTarget && (
          <div className="mt-4 bg-gray-800 rounded-xl p-4">
            <h3 className="font-bold mb-2 text-sm">Selecciona objetivo:</h3>
            <div className="space-y-2">
              {state.party.map(pk => {
                const species = allSpecies[pk.speciesId];
                const stage = species.stages[pk.stageIndex];
                return (
                  <button
                    key={pk.uid}
                    onClick={() => {
                      const item = Object.entries(state.inventory).find(([id, c]) => c > 0 && itemsDb[id] && (itemsDb[id].category === "potion" || itemsDb[id].category === "revive" || itemsDb[id].category === "status_heal"));
                      if (item) {
                        dispatch({ type: "USE_ITEM", itemId: item[0], targetUid: pk.uid });
                        setSelectedTarget(null);
                      }
                    }}
                    className="w-full bg-gray-700 hover:bg-gray-600 rounded-lg p-2 flex items-center gap-3 text-left"
                  >
                    <PokemonSprite pokedexId={stage.pokedexId} size={32} />
                    <div>
                      <p className="text-sm font-bold">{stage.name} Nv.{pk.level}</p>
                      <p className="text-xs text-gray-400">{pk.currentHp}/{pk.stats.hp} PS</p>
                    </div>
                  </button>
                );
              })}
            </div>
            <button onClick={() => setSelectedTarget(null)} className="mt-2 text-gray-400 text-sm">Cancelar</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
function GameRouter() {
  const { state } = useGame();

  switch (state.screen) {
    case "title": return <TitleScreen />;
    case "character_create": return <CharacterCreateScreen />;
    case "starter_select": return <StarterSelectScreen />;
    case "camp": return <CampScreen />;
    case "party": return <PartyScreen />;
    case "route_select": return <RouteSelectScreen />;
    case "route": return <RouteScreen />;
    case "battle": return <BattleScreen />;
    case "shop": return <ShopScreen />;
    case "inventory": return <InventoryScreen />;
    default: return <TitleScreen />;
  }
}

export default function App() {
  return (
    <GameProvider>
      <div className="font-sans">
        <GameRouter />
      </div>
    </GameProvider>
  );
}
