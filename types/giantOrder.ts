// Mirrors the giant-order-tool HTTP API (`giant-cart serve`, src/runner/httpApp.ts)

export type ProductImage = {
  small: string;
  medium: string;
  large: string;
  xlarge: string;
};

export type Product = {
  prodId: number;
  name: string;
  brand: string;
  size: string;
  price: number;
  regularPrice: number;
  sale: boolean;
  outOfStock: boolean;
  unitPrice: number | null;
  unitMeasure: string | null;
  image: ProductImage | null;
};

export type PickReply =
  | { kind: 'product'; prodId: number }
  | { kind: 'search' }
  | { kind: 'skip' };

export type Reply =
  | PickReply
  | { kind: 'text'; text: string }
  | { kind: 'confirm'; yes: boolean }
  | { kind: 'quantity'; quantity: number };

export type PickChoice = { name: string; value: PickReply; disabled?: string };

export type Question =
  | {
      kind: 'pick';
      lineId: number;
      message: string;
      choices: PickChoice[];
      remember: boolean;
      keywords: string | null;
    }
  | {
      kind: 'searchText';
      lineId: number;
      message: string;
      initial: string;
      remember: boolean;
    }
  | { kind: 'remember'; lineId: number; message: string; prodId: number }
  | { kind: 'quantity'; lineId: number; message: string }
  | { kind: 'total'; lineId: number; mergeIds: number[]; message: string };

export type LineStatus = 'match' | 'quantity' | 'resolved' | 'skipped';

export type GroceryLine = {
  id: number;
  position: number;
  name: string;
  quantity: number | null;
  prodId: number | null;
  status: LineStatus;
  question: Question | null;
};

export type ReviewItem = {
  name: string;
  quantity: number;
  prodId: number;
  product: Product;
};

export type Review = { items: ReviewItem[]; skipped: string[]; total: number };

export type QuestionResponse = {
  question: Question | null;
  // Set once every line is answered; null when the list is empty
  review?: Review | null;
};

type ReportInput = { name: string; quantity: number };

export type Report = {
  dryRun: boolean;
  added: {
    input: ReportInput;
    name: string;
    size: string;
    qtyBefore: number;
    qtyAfter: number;
    price: number;
  }[];
  outOfStock: { input: ReportInput; name: string; reason: string }[];
  failed: { input: ReportInput; error: string }[];
  cart: {
    itemCount: number;
    subTotal: number;
    minimum: number;
    belowMinimum: boolean;
  } | null;
  aborted: { reason: string; detail: string } | null;
};

export type CartResponse = { report: Report | null; summary: string };

export type CheckoutReply =
  | { kind: 'card'; capsId: number }
  | { kind: 'confirm'; yes: boolean }
  | { kind: 'day'; date: string }
  | { kind: 'time'; providerSlotId: string }
  | { kind: 'final'; choice: 'place' | 'time' | 'cancel' };

export type CheckoutChoice = { name: string; value: CheckoutReply };

export type Slot = {
  providerSlotId: string;
  date: string;
  timeStart: string;
  timeEnd: string;
  surcharge: number;
};

type DayQuestion = {
  kind: 'day';
  message: string;
  note: string | null;
  choices: CheckoutChoice[];
};

export type CheckoutQuestion =
  | { kind: 'card'; message: string; choices: CheckoutChoice[] }
  // Yes/no; "no" moves on to `otherwise`
  | {
      kind: 'offer';
      message: string;
      note: string;
      slot: Slot;
      otherwise: DayQuestion;
    }
  | DayQuestion
  | { kind: 'time'; message: string; choices: CheckoutChoice[] }
  // `details` is the order as it will be placed, one line per row
  | {
      kind: 'place';
      message: string;
      details: string;
      choices: CheckoutChoice[];
      amount: number;
    };

export type CheckoutResult =
  | {
      kind: 'placed';
      orderId: string;
      status: string;
      pickup: string;
      card: string;
      total: number;
      cutoffTime: string | null;
    }
  | { kind: 'cancelled'; reservedSlot: string | null };

export type CheckoutResponse =
  | { question: CheckoutQuestion | null; result?: undefined }
  | { question?: undefined; result: CheckoutResult };
