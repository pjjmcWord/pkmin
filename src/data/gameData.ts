// ============================================================
// GAME DATA - Pokémon Gen 1 inspired roguelite
// ============================================================

export type StatKey = "hp" | "atk" | "def" | "spa" | "spd" | "spe";
export type MoveCategory = "physical" | "special" | "status";
export type PokemonType = "normal" | "fire" | "water" | "grass" | "electric" | "ice" | "fighting" | "poison" | "ground" | "flying" | "psychic" | "bug" | "rock" | "ghost" | "dragon";

// ---- TYPE CHART ----
export const typeChart: Record<PokemonType, Record<PokemonType, number>> = {
  normal:   { normal:1, fire:1, water:1, grass:1, electric:1, ice:1, fighting:1, poison:1, ground:1, flying:1, psychic:1, bug:1, rock:0.5, ghost:0, dragon:1 },
  fire:     { normal:1, fire:0.5, water:0.5, grass:2, electric:1, ice:2, fighting:1, poison:1, ground:1, flying:1, psychic:1, bug:2, rock:0.5, ghost:1, dragon:0.5 },
  water:    { normal:1, fire:2, water:0.5, grass:0.5, electric:1, ice:1, fighting:1, poison:1, ground:2, flying:1, psychic:1, bug:1, rock:2, ghost:1, dragon:0.5 },
  grass:    { normal:1, fire:0.5, water:2, grass:0.5, electric:1, ice:1, fighting:1, poison:0.5, ground:2, flying:0.5, psychic:1, bug:0.5, rock:2, ghost:1, dragon:0.5 },
  electric: { normal:1, fire:1, water:2, grass:0.5, electric:0.5, ice:1, fighting:1, poison:1, ground:0, flying:2, psychic:1, bug:1, rock:1, ghost:1, dragon:0.5 },
  ice:      { normal:1, fire:0.5, water:0.5, grass:2, electric:1, ice:0.5, fighting:1, poison:1, ground:2, flying:2, psychic:1, bug:1, rock:1, ghost:1, dragon:2 },
  fighting: { normal:2, fire:1, water:1, grass:1, electric:1, ice:2, fighting:1, poison:0.5, ground:1, flying:0.5, psychic:0.5, bug:0.5, rock:2, ghost:0, dragon:1 },
  poison:   { normal:1, fire:1, water:1, grass:2, electric:1, ice:1, fighting:1, poison:0.5, ground:0.5, flying:1, psychic:1, bug:1, rock:0.5, ghost:0.5, dragon:1 },
  ground:   { normal:1, fire:2, water:1, grass:0.5, electric:2, ice:1, fighting:1, poison:2, ground:1, flying:0, psychic:1, bug:0.5, rock:2, ghost:1, dragon:1 },
  flying:   { normal:1, fire:1, water:1, grass:2, electric:0.5, ice:1, fighting:2, poison:1, ground:1, flying:1, psychic:1, bug:2, rock:0.5, ghost:1, dragon:1 },
  psychic:  { normal:1, fire:1, water:1, grass:1, electric:1, ice:1, fighting:2, poison:2, ground:1, flying:1, psychic:0.5, bug:1, rock:1, ghost:1, dragon:1 },
  bug:      { normal:1, fire:0.5, water:1, grass:2, electric:1, ice:1, fighting:0.5, poison:2, ground:1, flying:0.5, psychic:2, bug:1, rock:1, ghost:0.5, dragon:1 },
  rock:     { normal:1, fire:2, water:1, grass:1, electric:1, ice:2, fighting:0.5, poison:1, ground:0.5, flying:2, psychic:1, bug:2, rock:1, ghost:1, dragon:1 },
  ghost:    { normal:0, fire:1, water:1, grass:1, electric:1, ice:1, fighting:1, poison:1, ground:1, flying:1, psychic:2, bug:1, rock:1, ghost:2, dragon:1 },
  dragon:   { normal:1, fire:1, water:1, grass:1, electric:1, ice:1, fighting:1, poison:1, ground:1, flying:1, psychic:1, bug:1, rock:1, ghost:1, dragon:2 },
};

// ---- MOVES DATABASE ----
export interface Move {
  id: string;
  name: string;
  type: PokemonType;
  category: MoveCategory;
  basePower: number;
  accuracy: number;
  pp: number;
  priority?: number;
  effect?: string;
  description?: string;
}

export const movesDb: Record<string, Move> = {
  tackle: { id:"tackle", name:"Placaje", type:"normal", category:"physical", basePower:40, accuracy:100, pp:35, description:"Un ataque básico con todo el cuerpo." },
  scratch: { id:"scratch", name:"Arañazo", type:"normal", category:"physical", basePower:40, accuracy:100, pp:35, description:"Araña al objetivo con afiladas garras." },
  vine_whip: { id:"vine_whip", name:"Látigo Cepa", type:"grass", category:"physical", basePower:45, accuracy:100, pp:25, description:"Azota con lianas delgadas." },
  ember: { id:"ember", name:"Ascuas", type:"fire", category:"special", basePower:40, accuracy:100, pp:25, effect:"burn_10", description:"Llama pequeña. Puede quemar." },
  water_gun: { id:"water_gun", name:"Pistola Agua", type:"water", category:"special", basePower:40, accuracy:100, pp:25, description:"Dispara agua con fuerza." },
  razor_leaf: { id:"razor_leaf", name:"Hoja Afilada", type:"grass", category:"physical", basePower:55, accuracy:95, pp:25, description:"Hojas que cortan. Alto crítico." },
  flamethrower: { id:"flamethrower", name:"Lanzallamas", type:"fire", category:"special", basePower:90, accuracy:100, pp:15, effect:"burn_20", description:"Llamarada potente. Puede quemar." },
  hydro_pump: { id:"hydro_pump", name:"Hidrobomba", type:"water", category:"special", basePower:110, accuracy:80, pp:5, description:"Potente chorro de agua." },
  solar_beam: { id:"solar_beam", name:"Rayo Solar", type:"grass", category:"special", basePower:120, accuracy:100, pp:10, description:"Rayo de energía solar devastador." },
  fire_spin: { id:"fire_spin", name:"Giro Fuego", type:"fire", category:"special", basePower:35, accuracy:85, pp:15, effect:"burn_30", description:"Torbellino de fuego. Alta probabilidad de quemar." },
  bubble: { id:"bubble", name:"Burbuja", type:"water", category:"special", basePower:40, accuracy:100, pp:30, description:"Lanza burbujas al rival." },
  bite: { id:"bite", name:"Mordisco", type:"normal", category:"physical", basePower:60, accuracy:100, pp:25, description:"Muerde con afilados colmillos." },
  quick_attack: { id:"quick_attack", name:"Ataque Rápido", type:"normal", category:"physical", basePower:40, accuracy:100, pp:30, priority:1, description:"Ataque veloz que va primero." },
  gust: { id:"gust", name:"Ráfaga", type:"flying", category:"special", basePower:40, accuracy:100, pp:35, description:"Genera un fuerte viento." },
  thunder_shock: { id:"thunder_shock", name:"Impactrueno", type:"electric", category:"special", basePower:40, accuracy:100, pp:30, effect:"paralyze_10", description:"Descarga eléctrica. Puede paralizar." },
  thunderbolt: { id:"thunderbolt", name:"Rayo", type:"electric", category:"special", basePower:90, accuracy:100, pp:15, effect:"paralyze_15", description:"Potente rayo eléctrico." },
  psychic_move: { id:"psychic_move", name:"Psíquico", type:"psychic", category:"special", basePower:90, accuracy:100, pp:10, description:"Fuerte ataque telequinético." },
  rock_throw: { id:"rock_throw", name:"Lanzarrocas", type:"rock", category:"physical", basePower:50, accuracy:90, pp:15, description:"Lanza rocas al rival." },
  poison_sting: { id:"poison_sting", name:"Picotazo Veneno", type:"poison", category:"physical", basePower:15, accuracy:100, pp:35, effect:"poison_30", description:"Aguijón venenoso." },
  string_shot: { id:"string_shot", name:"Disparo Demora", type:"bug", category:"status", basePower:0, accuracy:95, pp:40, effect:"lower_speed", description:"Lanza seda que reduce velocidad." },
  harden: { id:"harden", name:"Endurecimiento", type:"normal", category:"status", basePower:0, accuracy:100, pp:30, effect:"raise_def", description:"Fortalece el cuerpo. Sube defensa." },
  growl: { id:"growl", name:"Gruñido", type:"normal", category:"status", basePower:0, accuracy:100, pp:40, effect:"lower_atk", description:"Distracción que baja el ataque." },
  tail_whip: { id:"tail_whip", name:"Látigo Cola", type:"normal", category:"status", basePower:0, accuracy:100, pp:30, effect:"lower_def", description:"Agita la cola para bajar defensa." },
  leer: { id:"leer", name:"Malicioso", type:"normal", category:"status", basePower:0, accuracy:100, pp:30, effect:"lower_def", description:"Mirada intimidante que baja defensa." },
  slash: { id:"slash", name:"Cuchillada", type:"normal", category:"physical", basePower:70, accuracy:100, pp:20, description:"Ataque con garras. Alto crítico." },
  fire_blast: { id:"fire_blast", name:"Llamarada", type:"fire", category:"special", basePower:110, accuracy:85, pp:5, effect:"burn_30", description:"Explosión de fuego devastadora." },
  blaze_kick: { id:"blaze_kick", name:"Patada Ígnea", type:"fire", category:"physical", basePower:85, accuracy:90, pp:10, effect:"burn_15", description:"Patada envuelta en llamas." },
  aqua_tail: { id:"aqua_tail", name:"Cola Acuática", type:"water", category:"physical", basePower:90, accuracy:90, pp:10, description:"Golpea con la cola como si fuera una ola." },
  skull_bash: { id:"skull_bash", name:"Cabezazo", type:"normal", category:"physical", basePower:100, accuracy:80, pp:10, description:"Potente cabezazo." },
  petal_blizzard: { id:"petal_blizzard", name:"Tormenta Pétalos", type:"grass", category:"physical", basePower:90, accuracy:100, pp:15, description:"Torbellino de pétalos cortantes." },
  body_slam: { id:"body_slam", name:"Golpe Cuerpo", type:"normal", category:"physical", basePower:85, accuracy:100, pp:15, description:"Salta sobre el rival con todo el peso." },
  dragon_rage: { id:"dragon_rage", name:"Furia Dragón", type:"dragon", category:"special", basePower:60, accuracy:100, pp:10, description:"Ráfaga de energía dragontina." },
  struggle: { id:"struggle", name:"Forcejeo", type:"normal", category:"physical", basePower:50, accuracy:100, pp:99, description:"Ataque desesperado cuando no queda PP." },
};

// ---- ITEMS DATABASE ----
export interface Item {
  id: string;
  name: string;
  description: string;
  price: number;
  category: "pokeball" | "potion" | "status_heal" | "revive" | "hold" | "key";
  effect?: string;
  value?: number;
}

export const itemsDb: Record<string, Item> = {
  poke_ball: { id:"poke_ball", name:"Poké Ball", description:"Captura Pokémon salvajes.", price:200, category:"pokeball", effect:"catch", value:1 },
  great_ball: { id:"great_ball", name:"Super Ball", description:"Mejor tasa de captura.", price:600, category:"pokeball", effect:"catch", value:1.5 },
  potion: { id:"potion", name:"Poción", description:"Restaura 20 PS.", price:300, category:"potion", effect:"heal", value:20 },
  super_potion: { id:"super_potion", name:"Super Poción", description:"Restaura 50 PS.", price:700, category:"potion", effect:"heal", value:50 },
  hyper_potion: { id:"hyper_potion", name:"Hiper Poción", description:"Restaura 120 PS.", price:1500, category:"potion", effect:"heal", value:120 },
  revive: { id:"revive", name:"Revivir", description:"Revive un Pokémon debilitado al 50% PS.", price:1500, category:"revive", effect:"revive", value:50 },
  antidote: { id:"antidote", name:"Antídoto", description:"Cura el envenenamiento.", price:100, category:"status_heal", effect:"cure_poison" },
  paralyze_heal: { id:"paralyze_heal", name:"Anti-Paraliz.", description:"Cura la parálisis.", price:200, category:"status_heal", effect:"cure_paralysis" },
  burn_heal: { id:"burn_heal", name:"Antiquemadura", description:"Cura las quemaduras.", price:250, category:"status_heal", effect:"cure_burn" },
  muscle_band: { id:"muscle_band", name:"Cinta Muscular", description:"Aumenta ataque físico +10%.", price:3000, category:"hold", effect:"atk_boost", value:10 },
  wise_glasses: { id:"wise_glasses", name:"Gafas Inteligentes", description:"Aumenta ataque especial +10%.", price:3000, category:"hold", effect:"spa_boost", value:10 },
};

// ---- SKILL TREE TYPES ----
export interface SkillGrant {
  stats?: Partial<Record<StatKey, number>>;
  pathway?: string;
  flag?: string;
  masteryCap?: number;
}

export interface SkillNode {
  id: string;
  name: string;
  description?: string;
  requires?: string[];
  requiresPrev?: { stage: number; node: string }[];
  grants?: SkillGrant;
}

export interface SpeciesStage {
  id: string;
  name: string;
  pokedexId: number;
  types: PokemonType[];
  baseStats: Record<StatKey, number>;
  pointBudget: number;
  evolvesTo?: string;
  evolveLevel?: number;
  skillTree: SkillNode[];
}

export interface LearnRequirement {
  stage: number;
  node: string;
}

export interface LearnRule {
  moveId: string;
  fromStage: number;
  maxStage?: number;
  minLevel?: number;
  pathway?: string;
  requires?: LearnRequirement[];
}

export interface Species {
  id: string;
  name: string;
  stages: SpeciesStage[];
  learnRules: LearnRule[];
  catchRate: number;
  xpYield: number;
}

// ---- SPECIES DATA ----
// Bulbasaur line
const bulbasaurLine: Species = {
  id: "bulbasaur_line",
  name: "Bulbasaur",
  catchRate: 45,
  xpYield: 64,
  stages: [
    {
      id: "bulbasaur", name: "Bulbasaur", pokedexId: 1, types: ["grass", "poison"],
      baseStats: { hp:45, atk:49, def:49, spa:65, spd:65, spe:45 },
      pointBudget: 12, evolvesTo: "ivysaur", evolveLevel: 16,
      skillTree: [
        { id:"resist", name:"Resistencia Natural", description:"+3 DEF, +3 SPD", grants:{ stats:{ def:3, spd:3 } } },
        { id:"growth", name:"Crecimiento", description:"+5 PS máximo", grants:{ stats:{ hp:5 } } },
        { id:"via_special", name:"Vía Especial", description:"Desbloquea movimientos especiales de planta.", grants:{ pathway:"especial" } },
        { id:"via_physical", name:"Vía Física", description:"Desbloquea movimientos físicos potenciados.", grants:{ pathway:"fisica" } },
        { id:"via_status", name:"Vía Estado", description:"Desbloquea movimientos de estado/soporte.", grants:{ pathway:"estado" } },
        { id:"solar_focus", name:"Foco Solar", requires:["via_special"], description:"+1 Maestría máx.", grants:{ masteryCap:1 } },
        { id:"thick_skin", name:"Piel Gruesa", requires:["resist"], description:"+4 DEF, +2 SPD", grants:{ stats:{ def:4, spd:2 } } },
        { id:"quick_growth", name:"Crecimiento Rápido", requires:["growth"], description:"+5 PS, +2 VEL", grants:{ stats:{ hp:5, spe:2 } } },
        { id:"poison_touch", name:"Toque Venenoso", requires:["via_physical"], description:"Flag: veneno_bonus", grants:{ flag:"poison_bonus" } },
        { id:"root_network", name:"Red de Raíces", requires:["via_status"], description:"Flag: red_raices", grants:{ flag:"root_network" } },
      ]
    },
    {
      id: "ivysaur", name: "Ivysaur", pokedexId: 2, types: ["grass", "poison"],
      baseStats: { hp:60, atk:62, def:63, spa:80, spd:80, spe:60 },
      pointBudget: 18, evolvesTo: "venusaur", evolveLevel: 32,
      skillTree: [
        { id:"canal_solar", name:"Canal Solar", requiresPrev:[{stage:0,node:"via_special"}], description:"Vía especial avanzada.", grants:{ pathway:"especial_plus" } },
        { id:"fuerza_natural", name:"Fuerza Natural", description:"+5 ATK", grants:{ stats:{ atk:5 } } },
        { id:"coraza_verde", name:"Coraza Verde", description:"+5 DEF, +5 SPD", grants:{ stats:{ def:5, spd:5 } } },
        { id:"velocidad_flora", name:"Velocidad Flora", description:"+5 VEL", grants:{ stats:{ spe:5 } } },
        { id:"maestria_solar", name:"Maestría Solar", requires:["canal_solar"], description:"+2 Maestría máx.", grants:{ masteryCap:2 } },
        { id:"foto_sintesis", name:"Fotosíntesis", requires:["canal_solar"], description:"Flag: fotosintesis", grants:{ flag:"photosynthesis" } },
        { id:"espinas", name:"Espinas", requires:["fuerza_natural"], description:"+3 ATK, Flag: espinas", grants:{ stats:{ atk:3 }, flag:"thorns" } },
        { id:"simbiosis", name:"Simbiosis", requires:["coraza_verde"], description:"+5 PS, +3 SPD", grants:{ stats:{ hp:5, spd:3 } } },
      ]
    },
    {
      id: "venusaur", name: "Venusaur", pokedexId: 3, types: ["grass", "poison"],
      baseStats: { hp:80, atk:82, def:83, spa:100, spd:100, spe:80 },
      pointBudget: 24,
      skillTree: [
        { id:"nucleo_solar", name:"Núcleo Solar", requiresPrev:[{stage:1,node:"canal_solar"}], description:"Flag: nucleo_solar_final", grants:{ flag:"solar_core" } },
        { id:"tormenta_petalos", name:"Tormenta Pétalos", requires:["nucleo_solar"], description:"+5 SPA, +5 VEL", grants:{ stats:{ spa:5, spe:5 } } },
        { id:"voluntad_bulbo", name:"Voluntad del Bulbo", description:"+10 PS, +5 SPD", grants:{ stats:{ hp:10, spd:5 } } },
        { id:"raices_profundas", name:"Raíces Profundas", description:"+8 DEF, +3 SPD", grants:{ stats:{ def:8, spd:3 } } },
        { id:"overgrow", name:"Sobrecrecimiento", requires:["nucleo_solar"], description:"+2 Maestría máx.", grants:{ masteryCap:2 } },
      ]
    }
  ],
  learnRules: [
    { moveId:"tackle", fromStage:0, minLevel:1 },
    { moveId:"vine_whip", fromStage:0, minLevel:4, requires:[{stage:0,node:"via_special"}] },
    { moveId:"poison_sting", fromStage:0, minLevel:7, requires:[{stage:0,node:"via_physical"}] },
    { moveId:"string_shot", fromStage:0, minLevel:5, requires:[{stage:0,node:"via_status"}] },
    { moveId:"razor_leaf", fromStage:1, minLevel:18, requires:[{stage:0,node:"via_special"},{stage:1,node:"canal_solar"}] },
    { moveId:"body_slam", fromStage:1, minLevel:20, requires:[{stage:0,node:"via_physical"}] },
    { moveId:"solar_beam", fromStage:2, minLevel:35, requires:[{stage:0,node:"via_special"},{stage:1,node:"canal_solar"},{stage:2,node:"nucleo_solar"}] },
    { moveId:"petal_blizzard", fromStage:2, minLevel:38, requires:[{stage:0,node:"via_special"},{stage:1,node:"canal_solar"},{stage:2,node:"nucleo_solar"}] },
  ]
};

// Charmander line
const charmanderLine: Species = {
  id: "charmander_line",
  name: "Charmander",
  catchRate: 45,
  xpYield: 62,
  stages: [
    {
      id: "charmander", name: "Charmander", pokedexId: 4, types: ["fire"],
      baseStats: { hp:39, atk:52, def:43, spa:60, spd:50, spe:65 },
      pointBudget: 12, evolvesTo: "charmeleon", evolveLevel: 16,
      skillTree: [
        { id:"resiste", name:"Resistencia Básica", description:"+2 DEF, +2 SPD", grants:{ stats:{ def:2, spd:2 } } },
        { id:"veloz", name:"Reflejos", description:"+3 VEL", grants:{ stats:{ spe:3 } } },
        { id:"via_especial", name:"Vía Especial", description:"Desbloquea movimientos especiales de fuego.", grants:{ pathway:"especial" } },
        { id:"via_estado", name:"Vía Estado", description:"Desbloquea movimientos de estado.", grants:{ pathway:"estado" } },
        { id:"focus_piro", name:"Enfoque Pirotécnico", requires:["via_especial"], description:"+1 Maestría máx.", grants:{ masteryCap:1 } },
        { id:"chispa_gen", name:"Chispa Germinada", requires:["via_especial"], description:"Flag: chispa_bonus", grants:{ flag:"spark_bonus" } },
        { id:"garras_afiladas", name:"Garras Afiladas", description:"+4 ATK", grants:{ stats:{ atk:4 } } },
        { id:"humo", name:"Cortina de Humo", requires:["via_estado"], description:"Flag: humo", grants:{ flag:"smoke_screen" } },
        { id:"cola_llama", name:"Cola de Llama", requires:["veloz"], description:"+3 VEL, +2 ATK", grants:{ stats:{ spe:3, atk:2 } } },
      ]
    },
    {
      id: "charmeleon", name: "Charmeleon", pokedexId: 5, types: ["fire"],
      baseStats: { hp:58, atk:64, def:58, spa:80, spd:65, spe:80 },
      pointBudget: 18, evolvesTo: "charizard", evolveLevel: 36,
      skillTree: [
        { id:"canal_pyro", name:"Canal Piro", requiresPrev:[{stage:0,node:"via_especial"}], description:"Vía especial avanzada.", grants:{ pathway:"especial_plus" } },
        { id:"fuerza_bruta", name:"Fuerza Bruta", description:"+4 ATK", grants:{ stats:{ atk:4 } } },
        { id:"piel_viva", name:"Piel Viva", description:"+4 DEF, +3 SPD", grants:{ stats:{ def:4, spd:3 } } },
        { id:"maestria_piro", name:"Maestría Piro", requires:["canal_pyro"], description:"+2 Maestría máx.", grants:{ masteryCap:2 } },
        { id:"slash_master", name:"Maestro Cuchilla", requires:["fuerza_bruta"], description:"+3 ATK, Flag: slash_bonus", grants:{ stats:{ atk:3 }, flag:"slash_bonus" } },
        { id:"velocidad_ignea", name:"Velocidad Ígnea", description:"+5 VEL", grants:{ stats:{ spe:5 } } },
      ]
    },
    {
      id: "charizard", name: "Charizard", pokedexId: 6, types: ["fire", "flying"],
      baseStats: { hp:78, atk:84, def:78, spa:109, spd:85, spe:100 },
      pointBudget: 24,
      skillTree: [
        { id:"nucleo_infernal", name:"Núcleo Infernal", requiresPrev:[{stage:1,node:"canal_pyro"}], description:"Flag: final_fire_core", grants:{ flag:"final_fire_core" } },
        { id:"ala_ardiente", name:"Ala Ardiente", requires:["nucleo_infernal"], description:"+5 VEL, +5 SPA", grants:{ stats:{ spe:5, spa:5 } } },
        { id:"voluntad_inquebrantable", name:"Voluntad Inquebrantable", description:"+10 PS, +5 SPD", grants:{ stats:{ hp:10, spd:5 } } },
        { id:"dragon_aura", name:"Aura Dragontina", description:"+3 ATK, Flag: dragon_aura", grants:{ stats:{ atk:3 }, flag:"dragon_aura" } },
        { id:"maestria_final", name:"Maestría Final", requires:["nucleo_infernal"], description:"+2 Maestría máx.", grants:{ masteryCap:2 } },
      ]
    }
  ],
  learnRules: [
    { moveId:"scratch", fromStage:0, minLevel:1 },
    { moveId:"ember", fromStage:0, minLevel:4, requires:[{stage:0,node:"via_especial"}] },
    { moveId:"growl", fromStage:0, minLevel:5, requires:[{stage:0,node:"via_estado"}] },
    { moveId:"slash", fromStage:1, minLevel:18, requires:[{stage:0,node:"via_especial"},{stage:1,node:"canal_pyro"}] },
    { moveId:"flamethrower", fromStage:1, minLevel:22, requires:[{stage:0,node:"via_especial"},{stage:1,node:"canal_pyro"}] },
    { moveId:"fire_blast", fromStage:2, minLevel:40, requires:[{stage:0,node:"via_especial"},{stage:1,node:"canal_pyro"},{stage:2,node:"nucleo_infernal"}] },
    { moveId:"blaze_kick", fromStage:2, minLevel:38, requires:[{stage:0,node:"via_especial"},{stage:1,node:"canal_pyro"},{stage:2,node:"nucleo_infernal"}] },
    { moveId:"dragon_rage", fromStage:2, minLevel:42 },
  ]
};

// Squirtle line
const squirtleLine: Species = {
  id: "squirtle_line",
  name: "Squirtle",
  catchRate: 45,
  xpYield: 63,
  stages: [
    {
      id: "squirtle", name: "Squirtle", pokedexId: 7, types: ["water"],
      baseStats: { hp:44, atk:48, def:65, spa:50, spd:64, spe:43 },
      pointBudget: 12, evolvesTo: "wartortle", evolveLevel: 16,
      skillTree: [
        { id:"caparazon", name:"Caparazón", description:"+4 DEF", grants:{ stats:{ def:4 } } },
        { id:"corriente", name:"Corriente", description:"+3 VEL", grants:{ stats:{ spe:3 } } },
        { id:"via_especial", name:"Vía Especial", description:"Desbloquea movimientos especiales de agua.", grants:{ pathway:"especial" } },
        { id:"via_fisica", name:"Vía Física", description:"Desbloquea movimientos físicos de agua.", grants:{ pathway:"fisica" } },
        { id:"via_estado", name:"Vía Estado", description:"Desbloquea movimientos de estado.", grants:{ pathway:"estado" } },
        { id:"presion_hidraulica", name:"Presión Hidráulica", requires:["via_especial"], description:"+1 Maestría máx.", grants:{ masteryCap:1 } },
        { id:"tortuga_resistente", name:"Tortuga Resistente", requires:["caparazon"], description:"+3 DEF, +3 SPD", grants:{ stats:{ def:3, spd:3 } } },
        { id:"retirada", name:"Retirada", requires:["via_estado"], description:"Flag: retirada", grants:{ flag:"withdraw" } },
        { id:"mordisco_marino", name:"Mordisco Marino", requires:["via_fisica"], description:"Flag: mordisco_mar", grants:{ flag:"sea_bite" } },
      ]
    },
    {
      id: "wartortle", name: "Wartortle", pokedexId: 8, types: ["water"],
      baseStats: { hp:59, atk:63, def:80, spa:65, spd:80, spe:58 },
      pointBudget: 18, evolvesTo: "blastoise", evolveLevel: 36,
      skillTree: [
        { id:"canal_hidro", name:"Canal Hidro", requiresPrev:[{stage:0,node:"via_especial"}], description:"Vía especial avanzada.", grants:{ pathway:"especial_plus" } },
        { id:"mandibula_ferrea", name:"Mandíbula Férrea", description:"+5 ATK", grants:{ stats:{ atk:5 } } },
        { id:"caparazon_reforzado", name:"Caparazón Reforzado", description:"+5 DEF, +5 SPD", grants:{ stats:{ def:5, spd:5 } } },
        { id:"maestria_hidro", name:"Maestría Hidro", requires:["canal_hidro"], description:"+2 Maestría máx.", grants:{ masteryCap:2 } },
        { id:"cola_poder", name:"Cola Poderosa", description:"+4 ATK, +2 VEL", grants:{ stats:{ atk:4, spe:2 } } },
      ]
    },
    {
      id: "blastoise", name: "Blastoise", pokedexId: 9, types: ["water"],
      baseStats: { hp:79, atk:83, def:100, spa:85, spd:105, spe:78 },
      pointBudget: 24,
      skillTree: [
        { id:"cañones_h2o", name:"Cañones H2O", requiresPrev:[{stage:1,node:"canal_hidro"}], description:"Flag: cañones_h2o", grants:{ flag:"hydro_cannons" } },
        { id:"artilleria", name:"Artillería", requires:["cañones_h2o"], description:"+5 SPA, +3 ATK", grants:{ stats:{ spa:5, atk:3 } } },
        { id:"fortaleza_total", name:"Fortaleza Total", description:"+10 PS, +5 DEF", grants:{ stats:{ hp:10, def:5 } } },
        { id:"maestria_oceanica", name:"Maestría Oceánica", requires:["cañones_h2o"], description:"+2 Maestría máx.", grants:{ masteryCap:2 } },
      ]
    }
  ],
  learnRules: [
    { moveId:"tackle", fromStage:0, minLevel:1 },
    { moveId:"water_gun", fromStage:0, minLevel:4, requires:[{stage:0,node:"via_especial"}] },
    { moveId:"tail_whip", fromStage:0, minLevel:5, requires:[{stage:0,node:"via_estado"}] },
    { moveId:"bite", fromStage:0, minLevel:7, requires:[{stage:0,node:"via_fisica"}] },
    { moveId:"hydro_pump", fromStage:1, minLevel:22, requires:[{stage:0,node:"via_especial"},{stage:1,node:"canal_hidro"}] },
    { moveId:"skull_bash", fromStage:2, minLevel:40, requires:[{stage:0,node:"via_especial"},{stage:1,node:"canal_hidro"},{stage:2,node:"cañones_h2o"}] },
    { moveId:"aqua_tail", fromStage:2, minLevel:38, requires:[{stage:0,node:"via_fisica"}] },
  ]
};

// ---- WILD POKEMON SPECIES ----
const pidgeySpecies: Species = {
  id: "pidgey", name: "Pidgey", catchRate: 255, xpYield: 50,
  stages: [{
    id:"pidgey", name:"Pidgey", pokedexId:16, types:["normal","flying"],
    baseStats:{ hp:40, atk:45, def:40, spa:35, spd:35, spe:56 },
    pointBudget:8, skillTree:[
      { id:"p_alas", name:"Alas Rápidas", grants:{ stats:{ spe:3 } } },
      { id:"p_plumas", name:"Plumas Duras", grants:{ stats:{ def:3 } } },
    ]
  }],
  learnRules: [
    { moveId:"tackle", fromStage:0, minLevel:1 },
    { moveId:"gust", fromStage:0, minLevel:5 },
  ]
};

const rattataSpecies: Species = {
  id: "rattata", name: "Rattata", catchRate: 255, xpYield: 51,
  stages: [{
    id:"rattata", name:"Rattata", pokedexId:19, types:["normal"],
    baseStats:{ hp:30, atk:56, def:35, spa:25, spd:35, spe:72 },
    pointBudget:8, skillTree:[
      { id:"r_dientes", name:"Dientes Afilados", grants:{ stats:{ atk:3 } } },
      { id:"r_veloz", name:"Velocidad Rata", grants:{ stats:{ spe:4 } } },
    ]
  }],
  learnRules: [
    { moveId:"tackle", fromStage:0, minLevel:1 },
    { moveId:"bite", fromStage:0, minLevel:4 },
    { moveId:"quick_attack", fromStage:0, minLevel:7 },
  ]
};

const caterpieSpecies: Species = {
  id: "caterpie", name: "Caterpie", catchRate: 255, xpYield: 39,
  stages: [{
    id:"caterpie", name:"Caterpie", pokedexId:10, types:["bug"],
    baseStats:{ hp:45, atk:30, def:35, spa:20, spd:20, spe:45 },
    pointBudget:6, skillTree:[
      { id:"c_seda", name:"Seda Pegajosa", grants:{ stats:{ def:2 } } },
    ]
  }],
  learnRules: [
    { moveId:"tackle", fromStage:0, minLevel:1 },
    { moveId:"string_shot", fromStage:0, minLevel:1 },
  ]
};

const pikachuSpecies: Species = {
  id: "pikachu", name: "Pikachu", catchRate: 190, xpYield: 102,
  stages: [{
    id:"pikachu", name:"Pikachu", pokedexId:25, types:["electric"],
    baseStats:{ hp:35, atk:55, def:40, spa:50, spd:50, spe:90 },
    pointBudget:10, skillTree:[
      { id:"pk_rayo", name:"Chispa Interior", grants:{ stats:{ spa:3 } } },
      { id:"pk_veloz", name:"Velocidad Eléctrica", grants:{ stats:{ spe:4 } } },
    ]
  }],
  learnRules: [
    { moveId:"quick_attack", fromStage:0, minLevel:1 },
    { moveId:"thunder_shock", fromStage:0, minLevel:4 },
    { moveId:"thunderbolt", fromStage:0, minLevel:15 },
  ]
};

const geodudeSpecies: Species = {
  id: "geodude", name: "Geodude", catchRate: 255, xpYield: 60,
  stages: [{
    id:"geodude", name:"Geodude", pokedexId:74, types:["rock","ground"],
    baseStats:{ hp:40, atk:80, def:100, spa:30, spd:30, spe:20 },
    pointBudget:8, skillTree:[
      { id:"g_roca", name:"Piel de Roca", grants:{ stats:{ def:4 } } },
      { id:"g_puño", name:"Puño Pétreo", grants:{ stats:{ atk:4 } } },
    ]
  }],
  learnRules: [
    { moveId:"tackle", fromStage:0, minLevel:1 },
    { moveId:"rock_throw", fromStage:0, minLevel:5 },
  ]
};

const zubatSpecies: Species = {
  id: "zubat", name: "Zubat", catchRate: 255, xpYield: 49,
  stages: [{
    id:"zubat", name:"Zubat", pokedexId:41, types:["poison","flying"],
    baseStats:{ hp:40, atk:45, def:35, spa:30, spd:40, spe:55 },
    pointBudget:8, skillTree:[
      { id:"z_eco", name:"Ecolocación", grants:{ stats:{ spe:3 } } },
      { id:"z_veneno", name:"Colmillo Tóxico", grants:{ stats:{ atk:3 } } },
    ]
  }],
  learnRules: [
    { moveId:"bite", fromStage:0, minLevel:1 },
    { moveId:"poison_sting", fromStage:0, minLevel:5 },
  ]
};

// ---- ROUTES ----
export interface RouteEvent {
  type: "wild_battle" | "trainer_battle" | "item" | "shop" | "hazard" | "rest" | "checkpoint";
  weight: number;
  minLevel?: number;
  maxLevel?: number;
  possiblePokemon?: string[];
}

export interface RouteDef {
  id: string;
  name: string;
  description: string;
  minLevel: number;
  maxLevel: number;
  events: RouteEvent[];
}

export const routesDb: RouteDef[] = [
  {
    id: "ruta_1", name: "Ruta 1 - Pradera Verde", description: "Una ruta tranquila para principiantes.",
    minLevel: 3, maxLevel: 8,
    events: [
      { type:"wild_battle", weight:50, minLevel:3, maxLevel:6, possiblePokemon:["pidgey","caterpie","rattata"] },
      { type:"item", weight:20 },
      { type:"shop", weight:10 },
      { type:"hazard", weight:10 },
      { type:"rest", weight:5 },
      { type:"checkpoint", weight:5 },
    ]
  },
  {
    id: "ruta_2", name: "Ruta 2 - Bosque Sombrío", description: "Un bosque denso con Pokémon más fuertes.",
    minLevel: 6, maxLevel: 14,
    events: [
      { type:"wild_battle", weight:45, minLevel:7, maxLevel:12, possiblePokemon:["pidgey","rattata","caterpie","zubat"] },
      { type:"trainer_battle", weight:15, minLevel:8, maxLevel:12, possiblePokemon:["pidgey","rattata"] },
      { type:"item", weight:15 },
      { type:"shop", weight:10 },
      { type:"hazard", weight:10 },
      { type:"rest", weight:5 },
      { type:"checkpoint", weight:10 },
    ]
  },
  {
    id: "ruta_3", name: "Ruta 3 - Cueva Oscura", description: "Una cueva con Pokémon de roca y veneno.",
    minLevel: 10, maxLevel: 20,
    events: [
      { type:"wild_battle", weight:45, minLevel:12, maxLevel:18, possiblePokemon:["zubat","geodude","pikachu"] },
      { type:"trainer_battle", weight:15, minLevel:13, maxLevel:18, possiblePokemon:["zubat","geodude"] },
      { type:"item", weight:15 },
      { type:"shop", weight:10 },
      { type:"hazard", weight:10 },
      { type:"rest", weight:5 },
      { type:"checkpoint", weight:10 },
    ]
  },
  {
    id: "ruta_4", name: "Ruta 4 - Monte Celeste", description: "La cima del monte. Solo para entrenadores fuertes.",
    minLevel: 18, maxLevel: 30,
    events: [
      { type:"wild_battle", weight:40, minLevel:20, maxLevel:28, possiblePokemon:["pikachu","geodude","zubat"] },
      { type:"trainer_battle", weight:20, minLevel:22, maxLevel:28, possiblePokemon:["pikachu","geodude"] },
      { type:"item", weight:12 },
      { type:"shop", weight:10 },
      { type:"hazard", weight:10 },
      { type:"rest", weight:5 },
      { type:"checkpoint", weight:13 },
    ]
  },
];

// ---- ALL SPECIES INDEX ----
export const allSpecies: Record<string, Species> = {
  bulbasaur_line: bulbasaurLine,
  charmander_line: charmanderLine,
  squirtle_line: squirtleLine,
  pidgey: pidgeySpecies,
  rattata: rattataSpecies,
  caterpie: caterpieSpecies,
  pikachu: pikachuSpecies,
  geodude: geodudeSpecies,
  zubat: zubatSpecies,
};

export const starterSpecies = [bulbasaurLine, charmanderLine, squirtleLine];

// ---- POKEMON STATE TYPES ----
export interface StageState {
  unlockedNodes: string[];
  pendingPoints: number;
  spentPoints: number;
  locked: boolean;
}

export interface KnownMove {
  id: string;
  pp: number;
  maxPp: number;
}

export interface MoveMastery {
  rank: number;
  xp: number;
}

export interface PokemonState {
  uid: string;
  speciesId: string;
  stageIndex: number;
  level: number;
  xp: number;
  currentHp: number;
  stats: Record<StatKey, number>;
  bonusStats: Record<StatKey, number>;
  stageStates: StageState[];
  pathways: string[];
  flags: string[];
  moves: KnownMove[];
  moveMastery: Record<string, MoveMastery>;
  masteryCap: number;
  heldItem?: string;
  status?: string;
}

// ---- TRAINER / GAME STATE TYPES ----
export interface TrainerState {
  name: string;
  money: number;
  classBonus?: string;
}

export interface RouteState {
  routeId: string;
  progress: number;
  checkpoints: number;
  seed: number;
}

export interface GameState {
  version: number;
  screen: string;
  trainer: TrainerState;
  party: PokemonState[];
  box: PokemonState[];
  inventory: Record<string, number>;
  route?: RouteState;
  flags: Record<string, boolean>;
  rngSeed: number;
  battleLog: string[];
  pendingBattle?: {
    enemySpeciesId: string;
    enemyLevel: number;
    isTrainer: boolean;
    message: string;
  };
}

// ---- HELPER: Get sprite URL ----
export function getSpriteUrl(pokedexId: number, back = false): string {
  if (back) {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/${pokedexId}.png`;
  }
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokedexId}.png`;
}

// ---- HELPER: Type colors ----
export const typeColors: Record<PokemonType, string> = {
  normal: "#A8A878", fire: "#F08030", water: "#6890F0", grass: "#78C850",
  electric: "#F8D030", ice: "#98D8D8", fighting: "#C03028", poison: "#A040A0",
  ground: "#E0C068", flying: "#A890F0", psychic: "#F85888", bug: "#A8B820",
  rock: "#B8A038", ghost: "#705898", dragon: "#7038F8",
};
