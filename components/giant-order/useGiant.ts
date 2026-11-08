import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import type {
  Cart,
  CartResponse,
  CheckoutQuestion,
  CheckoutReply,
  CheckoutResponse,
  DefaultChange,
  GroceryLine,
  ItemDefault,
  KeepCheck,
  KeepList,
  QuestionResponse,
  Reply,
  SearchProduct,
} from '@/types/giantOrder';

const LIST_KEY = ['giant-order', 'list'];
const QUESTION_KEY = ['giant-order', 'question'];
const CHECKOUT_KEY = ['giant-order', 'checkout'];
const KEEP_KEY = ['giant-order', 'keep'];
const CART_KEY = ['giant-order', 'cart'];
const DEFAULTS_KEY = ['giant-order', 'defaults'];

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

// giant-cart serve answers 503 `error` when it's up but can't drive Chrome
export const isUnreachable = (error: unknown) =>
  error instanceof GiantApiError &&
  (error.reason === 'unreachable' ||
    (error.status === 503 && error.reason === 'error'));

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
    queryKey: KEEP_KEY,
    queryFn: () => call('GET', 'keep'),
    enabled,
    gcTime: 0,
    refetchOnWindowFocus: false,
    retry: false,
  });

// Checks or unchecks one Keep item, showing the change right away
export const useSetKeepChecked = () => {
  const queryClient = useQueryClient();
  const setItem = (itemId: string, checked: boolean) =>
    queryClient.setQueryData<KeepList>(
      KEEP_KEY,
      (keep) =>
        keep && {
          ...keep,
          items: keep.items.map((item) =>
            item.id === itemId ? { ...item, checked } : item,
          ),
        },
    );
  return useMutation({
    mutationFn: (body: { noteId: string; itemId: string; checked: boolean }) =>
      call('PATCH', 'keep', body),
    onMutate: ({ itemId, checked }) => setItem(itemId, checked),
    onError: (_error, { itemId, checked }) => setItem(itemId, !checked),
  });
};

// `text` is a pasted list; `lines` one per Keep item, so giant-cart hands
// their ids back once the order is placed
type ListBody =
  | { text: string }
  | { lines: { text: string; keepItemId: string }[] };

export const useSetList = () => {
  const onLines = useListChange();
  return useMutation({
    mutationFn: async (body: ListBody): Promise<GroceryLine[]> =>
      (await call('PUT', 'list', body)).lines,
    onSuccess: onLines,
  });
};

export const useClearList = () => {
  const onLines = useListChange();
  return useMutation({
    mutationFn: async (): Promise<GroceryLine[]> =>
      (await call('DELETE', 'list')).lines,
    onSuccess: onLines,
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

// A review item's quantity or product; `remember` saves the product as the
// line name's default
export type LineEdit = {
  lineId: number;
  quantity?: number;
  prodId?: number;
  remember?: boolean;
};

export const useEditLine = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ lineId, ...change }: LineEdit): Promise<QuestionResponse> =>
      call('PATCH', `list/${lineId}`, change),
    onSuccess: (data) => queryClient.setQueryData(QUESTION_KEY, data),
    onError: () => queryClient.invalidateQueries({ queryKey: QUESTION_KEY }),
    // Lines can merge
    onSettled: () => queryClient.invalidateQueries({ queryKey: LIST_KEY }),
  });
};

// The list is cleared once it's in the cart
export const useFillCart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dryRun: boolean): Promise<CartResponse> =>
      call('POST', 'cart', { dryRun }),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: LIST_KEY });
      void queryClient.invalidateQueries({ queryKey: CART_KEY });
    },
  });
};

const CART_STORAGE_KEY = 'giant-order:cart';

const isCart = (value: unknown): value is Cart =>
  typeof value === 'object' &&
  value !== null &&
  'cartId' in value &&
  typeof value.cartId === 'string' &&
  'items' in value &&
  Array.isArray(value.items) &&
  'subTotal' in value &&
  typeof value.subTotal === 'number';

const readCart = () => {
  try {
    const parsed: unknown = JSON.parse(
      sessionStorage.getItem(CART_STORAGE_KEY) ?? 'null',
    );
    return isCart(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const fetchCart = async (): Promise<Cart> => {
  const cart: Cart = await call('GET', 'cart');
  try {
    sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch {
    // Blocked storage: the next page load just reads Giant again
  }
  return cart;
};

// Every read opens Giant, so it's read once per browser tab (kept in
// sessionStorage), then only on refetch or after a fill or placed order.
// Storage is read after mount so the server render matches.
export const useCart = () => {
  const queryClient = useQueryClient();
  const [restored, setRestored] = useState(false);
  useEffect(() => {
    const cached = readCart();
    if (cached && !queryClient.getQueryData(CART_KEY)) {
      queryClient.setQueryData(CART_KEY, cached);
    }
    setRestored(true);
  }, [queryClient]);
  return useQuery<Cart>({
    queryKey: CART_KEY,
    queryFn: fetchCart,
    enabled: restored,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    ...once,
  });
};

export const useSearch = (text: string) =>
  useQuery<SearchProduct[]>({
    queryKey: ['giant-order', 'search', text],
    queryFn: async () =>
      (await call('GET', `search?text=${encodeURIComponent(text)}`)).products,
    enabled: text.length > 0,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    ...once,
  });

export const useDefaults = () =>
  useQuery<ItemDefault[]>({
    queryKey: DEFAULTS_KEY,
    queryFn: async () => (await call('GET', 'defaults')).defaults,
    ...once,
    refetchInterval: (query) =>
      isUnreachable(query.state.error) ? RECONNECT_MS : false,
  });

const defaultPath = (alias: string) => `defaults/${encodeURIComponent(alias)}`;

// Only the fields in `change` are saved; a new alias needs a prodId
export const usePutDefault = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      alias,
      change,
    }: {
      alias: string;
      change: DefaultChange;
    }): Promise<ItemDefault> =>
      (await call('PUT', defaultPath(alias), change)).default,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: DEFAULTS_KEY }),
  });
};

export const useDeleteDefault = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (alias: string) => call('DELETE', defaultPath(alias)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: DEFAULTS_KEY }),
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
    onSuccess: (data) => {
      queryClient.setQueryData(CHECKOUT_KEY, data.question ?? null);
      if (data.result?.kind === 'placed') {
        void queryClient.invalidateQueries({ queryKey: CART_KEY });
      }
    },
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
    mutationFn: async (itemIds: string[]): Promise<KeepCheck | null> =>
      itemIds.length === 0 ? null : call('POST', 'keep', { itemIds }),
  });
