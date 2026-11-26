export const gamePath = (id: number) => `/projects/remorse-chess/${id}`;

export const playerPath = (id: number) =>
  `/projects/remorse-chess/players/${id}`;

// Only someone who opens this link can take the game's open seat
export const inviteUrl = (id: number, token: string) =>
  `${window.location.origin}${gamePath(id)}?invite=${token}`;

export const canShare = () => typeof navigator.share === 'function';

export const shareInvite = (id: number, token: string) =>
  navigator
    .share({
      title: 'Remorse Chess',
      text: 'Play me?',
      url: inviteUrl(id, token),
    })
    .catch(() => {});

// The share sheet where there is one, else the clipboard. True once copied.
export const shareOrCopyInvite = async (id: number, token: string) => {
  if (canShare()) {
    await shareInvite(id, token);
    return false;
  }
  try {
    await navigator.clipboard.writeText(inviteUrl(id, token));
    return true;
  } catch {
    return false;
  }
};
