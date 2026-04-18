export function normalizeLobbyName(value: string): string {
  return value.trim().slice(0, 20);
}

export function isLobbyNameValid(value: string): boolean {
  return value.trim().length >= 2;
}
