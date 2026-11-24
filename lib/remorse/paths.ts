export const gamePath = (id: number) => `/projects/remorse-chess/${id}`;

export const playerPath = (id: number) =>
  `/projects/remorse-chess/players/${id}`;

// Only someone who opens this link can take the game's open seat
export const inviteUrl = (id: number, token: string) =>
  `${window.location.origin}${gamePath(id)}?invite=${token}`;
