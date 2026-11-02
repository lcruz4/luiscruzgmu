import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addedLinks,
  forgetLinks,
  type KeepList,
  linkOpenList,
  markAdded,
} from '@/lib/giantKeepLinks';
import type {
  CartResponse,
  CheckoutQuestion,
  CheckoutReply,
  CheckoutResponse,
  GroceryLine,
  KeepCheck,
  QuestionResponse,
  Reply,
} from '@/types/giantOrder';

const LIST_KEY = ['giant-order', 'list'];
const QUESTION_KEY = ['giant-order', 'question'];
const CHECKOUT_KEY = ['giant-order', 'checkout'];

// Its message and reason are giant-cart serve's own `error` and `reason`, or
// the proxy's when serve can't be reached
export class GiantApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly reason?: string,
  ) {
    super(message);
  }
}

export const isUnreachable = (error: unknown) =>
  error instanceof GiantApiError && error.reason === 'unreachable';

export const RECONNECT_MS = 10_000;

const call = async (method: string, path: string, body?: unknown) => {
  const response = await fetch(`/api/giant-order-tool/${path}`, {
    method,
    headers:
      method === 'GET' ? undefined : { 'Content-Type': 'application/json' },
    body: method === 'GET' ? undefined : JSON.stringify(body ?? null),
  });
  const json = await response.json().catch(() => null);
  if (!response.ok) {
    throw new GiantApiError(
      response.status,
      typeof json?.error === 'string'
        ? json.error
        : `${method} ${path} failed: ${response.status}`,
      typeof json?.reason === 'string' ? json.reason : undefined,
    );
  }
  return json;
};

// Giant calls are never retried: DataDome extends its block on retries
const once = { retry: false };

export const useList = () =>
  useQuery<GroceryLine[]>({
    queryKey: LIST_KEY,
    queryFn: async () => (await call('GET', 'list')).lines,
    ...once,
    // Never touches Giant, so it's safe to keep checking until the Mac is back
    refetchInterval: (query) =>
      isUnreachable(query.state.error) ? RECONNECT_MS : false,
  });

// Can open Giant (matching, searches), so only asked while the list has lines
export const useQuestion = (enabled: boolean) =>
  useQuery<QuestionResponse>({
    queryKey: QUESTION_KEY,
    queryFn: () => call('GET', 'question'),
    enabled,
    ...once,
  });

export const useCheckout = (enabled: boolean) =>
  useQuery<CheckoutQuestion | null>({
    queryKey: CHECKOUT_KEY,
    queryFn: async () => (await call('GET', 'checkout')).question,
    enabled,
    ...once,
  });

const useListChange = () => {
  const queryClient = useQueryClient();
  return (lines: GroceryLine[]) => {
    queryClient.setQueryData(LIST_KEY, lines);
    queryClient.removeQueries({ queryKey: QUESTION_KEY });
  };
};

// The unchecked items of the Keep "Giant" list. Fetched on mount when
// `enabled`, else only on refetch; dropped on unmount so a later visit pulls
// fresh.
export const useKeepList = (enabled: boolean) =>
  useQuery<KeepList>({
    queryKey: ['giant-order', 'keep'],
    queryFn: () => call('GET', 'keep'),
    enabled,
    gcTime: 0,
    refetchOnWindowFocus: false,
    retry: false,
  });

// `text` is the list as pasted, one item per line. With `keep`, its lines are
// linked to the Keep items they came from, checked once the order is placed.
export const useSetList = () => {
  const onLines = useListChange();
  return useMutation({
    mutationFn: async ({
      text,
    }: {
      text: string;
      keep: KeepList | null;
    }): Promise<GroceryLine[]> => (await call('PUT', 'list', { text })).lines,
    onSuccess: (lines, { keep }) => {
      onLines(lines);
      linkOpenList(
        lines.map((line) => line.name),
        keep,
      );
    },
  });
};

export const useClearList = () => {
  const onLines = useListChange();
  return useMutation({
    mutationFn: async (): Promise<GroceryLine[]> =>
      (await call('DELETE', 'list')).lines,
    onSuccess: (lines) => {
      onLines(lines);
      linkOpenList([], null);
    },
  });
};

export const useAnswer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reply: Reply): Promise<QuestionResponse> =>
      call('POST', 'answer', reply),
    onSuccess: (data) => queryClient.setQueryData(QUESTION_KEY, data),
    // A rejected answer can leave a different question open
    onError: () => queryClient.invalidateQueries({ queryKey: QUESTION_KEY }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: LIST_KEY }),
  });
};

// The list is cleared once it's in the cart
export const useFillCart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dryRun: boolean): Promise<CartResponse> =>
      call('POST', 'cart', { dryRun }),
    onSuccess: ({ report }) => {
      if (report && !report.dryRun && !report.aborted) {
        markAdded(report.added.map((item) => item.input.name));
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: LIST_KEY }),
  });
};

export const useStartCheckout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<CheckoutQuestion> =>
      (await call('POST', 'checkout')).question,
    onSuccess: (question) => queryClient.setQueryData(CHECKOUT_KEY, question),
  });
};

export const useAnswerCheckout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reply: CheckoutReply): Promise<CheckoutResponse> =>
      call('POST', 'checkout/answer', reply),
    onSuccess: (data) =>
      queryClient.setQueryData(CHECKOUT_KEY, data.question ?? null),
    onError: () => queryClient.invalidateQueries({ queryKey: CHECKOUT_KEY }),
  });
};

// A reserved slot stays on the cart
export const useCancelCheckout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => call('DELETE', 'checkout'),
    onSuccess: () => queryClient.setQueryData(CHECKOUT_KEY, null),
  });
};

// Order placed: checks the ordered items in Keep. Null when none came from Keep.
export const useCheckKeep = () =>
  useMutation({
    mutationFn: async (): Promise<KeepCheck | null> => {
      const links = addedLinks();
      if (links.length === 0) return null;
      const result: KeepCheck = await call('POST', 'keep', { links });
      forgetLinks(links);
      return result;
    },
  });
