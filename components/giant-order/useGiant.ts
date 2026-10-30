import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CartResponse,
  CheckoutQuestion,
  CheckoutReply,
  CheckoutResponse,
  GroceryLine,
  QuestionResponse,
  Reply,
} from '@/types/giantOrder';

const LIST_KEY = ['giant-order', 'list'];
const QUESTION_KEY = ['giant-order', 'question'];
const CHECKOUT_KEY = ['giant-order', 'checkout'];

// Its message is giant-cart serve's own `error`
export class GiantApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

const call = async (method: string, path: string, body?: unknown) => {
  const response = await fetch(`/api/giant-order/${path}`, {
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

// `text` is the list as pasted, one item per line
export const useSetList = () => {
  const onLines = useListChange();
  return useMutation({
    mutationFn: async (text: string): Promise<GroceryLine[]> =>
      (await call('PUT', 'list', { text })).lines,
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

// The list is cleared once it's in the cart
export const useFillCart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dryRun: boolean): Promise<CartResponse> =>
      call('POST', 'cart', { dryRun }),
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
