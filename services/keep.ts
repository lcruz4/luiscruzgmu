// keep-api (Google Keep), see its README for routes and shapes

const GIANT_TITLE = 'Giant';

export type KeepItem = {
  id: string;
  text: string;
  checked: boolean;
  indented: boolean;
};

type KeepNote = {
  id: string;
  type: 'note' | 'list';
  unchecked?: KeepItem[];
};

export class KeepApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

const call = async <T>(method: string, path: string, body?: unknown) => {
  const base = process.env.KEEP_API_URL;
  const apiKey = process.env.KEEP_API_KEY;
  if (!base || !apiKey) {
    throw new KeepApiError(503, 'KEEP_API_URL or KEEP_API_KEY is not set');
  }
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });
  const json = await response.json().catch(() => null);
  if (!response.ok) {
    throw new KeepApiError(
      response.status,
      typeof json?.error === 'string'
        ? `Keep: ${json.error}`
        : `Keep ${method} ${path} failed: ${response.status}`,
    );
  }
  return json as T;
};

export const getGiantList = async () => {
  const notes = await call<KeepNote[]>(
    'GET',
    `/keep?title=${encodeURIComponent(GIANT_TITLE)}`,
  );
  const note = notes.find((candidate) => candidate.type === 'list');
  if (!note) {
    throw new KeepApiError(404, `No "${GIANT_TITLE}" list in Keep`);
  }
  return { noteId: note.id, items: note.unchecked ?? [] };
};

export const checkItem = (noteId: string, itemId: string) =>
  call('PATCH', `/keep/${noteId}/${itemId}`, { checked: true });
