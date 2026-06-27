export { BattlePanel } from "./ui/BattlePanel";
export { combatMachine } from "./model/combatMachine";
export { useCombatStore } from "./model/combatStore";
export type { StartBattleConfig, BattleReward } from "./model/combatStore";
export {
  applyMove,
  availableMoves,
  canUseMove,
  chooseEnemyMove,
  computeDamage,
  createFighter,
  isDefeated,
  lomMultiplier,
  startTurn,
} from "./lib/combatEngine";
export { MOVES, MOVE_IDS } from "./lib/moves";
export type {
  ActionResult,
  CombatPhase,
  Difficulty,
  Fighter,
  LomType,
  Move,
  MoveId,
  Rng,
} from "./lib/types";
