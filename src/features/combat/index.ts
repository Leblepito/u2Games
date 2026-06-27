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
  counterDamage,
  createFighter,
  isDefeated,
  lomMultiplier,
  startTurn,
} from "./lib/combatEngine";
export { MOVES, MOVE_IDS } from "./lib/moves";
export {
  DIFFICULTY_REWARD,
  HARD_MODE_ENTRY_FEE,
  entryCost,
  resolveVictoryReward,
} from "./lib/economy";
export type { RewardBreakdown } from "./lib/economy";
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
