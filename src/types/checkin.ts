export type SportType = "badminton" | "pickleball";

export type AttendeeCategory =
  | "play"
  | "practice"
  | "waitlist_play"
  | "waitlist_practice"
  | "paused";

export type PaymentMethod = "cash" | "linepay" | "transfer";

export type PaymentStatus = "unpaid" | "paid";

export type CheckInEvent = {
  id: string;
  event_date: string;
  sport_type: SportType;
  title: string;
  venue: string;
  time_range: string;
  fee_amount: number;
  raw_text: string;
  notes: string;
  status: "active" | "closed";
  created_at: string;
  updated_at: string;
};

export type CheckInAttendee = {
  id: string;
  event_id: string;
  name: string;
  category: AttendeeCategory;
  list_number: number | null;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod | null;
  checked_in_at: string | null;
  is_walk_in: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type CheckInEventWithStats = CheckInEvent & {
  attendee_count: number;
  paid_count: number;
  unpaid_count: number;
};

export type CheckInEventDetail = CheckInEvent & {
  attendees: CheckInAttendee[];
};

export const CATEGORY_LABELS: Record<AttendeeCategory, string> = {
  play: "打球",
  practice: "練球",
  waitlist_play: "打球候補",
  waitlist_practice: "練球候補",
  paused: "暫停",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "現金",
  linepay: "Line Pay",
  transfer: "匯款",
};

export const SPORT_LABELS: Record<SportType, string> = {
  badminton: "羽球",
  pickleball: "匹克球",
};
