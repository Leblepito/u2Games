export interface NpcDef {
  id: string;
  name: string;
  position: [number, number, number];
  rotation: number;
  interactionRadius: number;
  dialogueLines: string[];
  icon: string;
}

export const KANCHANABURI_NPCS: NpcDef[] = [
  {
    id: "pa_noi",
    name: "Pa Noi",
    position: [4, 0, 3],
    rotation: -Math.PI / 4,
    interactionRadius: 3,
    dialogueLines: [
      "Ah, you're awake. Your grandfather's egg... it stirred last night.",
      "Lung Sombat vanished three moons ago. But he left something for you.",
      "This egg holds the last of Arun's bloodline. Some say it's cursed.",
      "I say it's destiny. Come \u2014 let me teach you what I know.",
      "A patient rooster watches the hasty one. Remember that.",
    ],
    icon: "\uD83D\uDC74",
  },
];
