"use server";

import { revalidatePath } from "next/cache";
import {
  mergeAttendeesDedupe,
  parseRegistrationText,
  type ParsedAttendee,
} from "@/lib/checkin-parser";
import { createClient } from "@/lib/supabase/server";
import type {
  AttendeeCategory,
  CheckInAttendee,
  CheckInEventDetail,
  CheckInEventWithStats,
  PaymentMethod,
  SportType,
} from "@/types/checkin";

function revalidateCheckIn(eventId?: string) {
  revalidatePath("/checkin");
  if (eventId) revalidatePath(`/checkin/${eventId}`);
}

export async function getCheckInEvents(): Promise<CheckInEventWithStats[]> {
  const supabase = await createClient();

  const { data: events, error } = await supabase
    .from("check_in_events")
    .select("*")
    .order("event_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  if (!events?.length) return [];

  const ids = events.map((e) => e.id);
  const { data: attendees, error: attError } = await supabase
    .from("check_in_attendees")
    .select("event_id, payment_status")
    .in("event_id", ids);

  if (attError) throw new Error(attError.message);

  const stats = new Map<string, { total: number; paid: number }>();
  for (const row of attendees ?? []) {
    const cur = stats.get(row.event_id) ?? { total: 0, paid: 0 };
    cur.total += 1;
    if (row.payment_status === "paid") cur.paid += 1;
    stats.set(row.event_id, cur);
  }

  return events.map((event) => {
    const s = stats.get(event.id) ?? { total: 0, paid: 0 };
    return {
      ...event,
      attendee_count: s.total,
      paid_count: s.paid,
      unpaid_count: s.total - s.paid,
    };
  });
}

export async function getCheckInEvent(
  eventId: string,
): Promise<CheckInEventDetail | null> {
  const supabase = await createClient();

  const { data: event, error } = await supabase
    .from("check_in_events")
    .select("*")
    .eq("id", eventId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!event) return null;

  const { data: attendees, error: attError } = await supabase
    .from("check_in_attendees")
    .select("*")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true })
    .order("list_number", { ascending: true, nullsFirst: false });

  if (attError) throw new Error(attError.message);

  return {
    ...event,
    attendees: (attendees ?? []) as CheckInAttendee[],
  };
}

export async function createCheckInFromPaste(
  rawText: string,
  sportType: SportType,
  options?: {
    eventDate?: string;
    title?: string;
    feeAmount?: number;
    extraAttendees?: ParsedAttendee[];
  },
): Promise<string> {
  const parsed = parseRegistrationText(rawText, sportType);
  const attendees = mergeAttendeesDedupe(
    parsed.attendees,
    options?.extraAttendees ?? [],
  );
  const eventDate = options?.eventDate || parsed.eventDate;

  if (!eventDate) {
    throw new Error("請選擇活動日期");
  }

  if (attendees.length === 0) {
    throw new Error("無法從貼文解析出名單，請確認格式或手動新增人員");
  }

  const supabase = await createClient();

  const { data: event, error: eventError } = await supabase
    .from("check_in_events")
    .insert({
      event_date: eventDate,
      sport_type: parsed.sportType,
      title: options?.title?.trim() || parsed.title || `${eventDate} 報到`,
      venue: parsed.venue,
      time_range: parsed.timeRange,
      fee_amount: options?.feeAmount ?? parsed.feeAmount,
      raw_text: rawText,
      notes: parsed.notes,
    })
    .select("id")
    .single();

  if (eventError) throw new Error(eventError.message);

  const rows = attendees.map((a, index) => ({
    event_id: event.id,
    name: a.name,
    category: a.category,
    list_number: a.listNumber,
    sort_order: index,
  }));

  const { error: attError } = await supabase
    .from("check_in_attendees")
    .insert(rows);

  if (attError) throw new Error(attError.message);

  revalidateCheckIn(event.id);
  return event.id;
}

export async function addWalkInAttendee(
  eventId: string,
  name: string,
  category: AttendeeCategory = "play",
): Promise<CheckInAttendee> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("請輸入姓名");

  const supabase = await createClient();
  const { data: last } = await supabase
    .from("check_in_attendees")
    .select("sort_order")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from("check_in_attendees")
    .insert({
      event_id: eventId,
      name: trimmed,
      category,
      is_walk_in: true,
      sort_order: (last?.sort_order ?? -1) + 1,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidateCheckIn(eventId);
  return data as CheckInAttendee;
}

export async function markAttendeePaid(
  attendeeId: string,
  method: PaymentMethod,
): Promise<void> {
  const supabase = await createClient();

  const { data: attendee, error: fetchError } = await supabase
    .from("check_in_attendees")
    .select("event_id")
    .eq("id", attendeeId)
    .single();

  if (fetchError) throw new Error(fetchError.message);

  const { error } = await supabase
    .from("check_in_attendees")
    .update({
      payment_status: "paid",
      payment_method: method,
      checked_in_at: new Date().toISOString(),
    })
    .eq("id", attendeeId);

  if (error) throw new Error(error.message);
  revalidateCheckIn(attendee.event_id);
}

export async function resetAttendeePayment(attendeeId: string): Promise<void> {
  const supabase = await createClient();

  const { data: attendee, error: fetchError } = await supabase
    .from("check_in_attendees")
    .select("event_id")
    .eq("id", attendeeId)
    .single();

  if (fetchError) throw new Error(fetchError.message);

  const { error } = await supabase
    .from("check_in_attendees")
    .update({
      payment_status: "unpaid",
      payment_method: null,
      checked_in_at: null,
    })
    .eq("id", attendeeId);

  if (error) throw new Error(error.message);
  revalidateCheckIn(attendee.event_id);
}

export async function deleteCheckInEvent(eventId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("check_in_events")
    .delete()
    .eq("id", eventId);
  if (error) throw new Error(error.message);
  revalidateCheckIn();
}

export async function deleteAttendee(attendeeId: string): Promise<void> {
  const supabase = await createClient();

  const { data: attendee, error: fetchError } = await supabase
    .from("check_in_attendees")
    .select("event_id")
    .eq("id", attendeeId)
    .single();

  if (fetchError) throw new Error(fetchError.message);

  const { error } = await supabase
    .from("check_in_attendees")
    .delete()
    .eq("id", attendeeId);

  if (error) throw new Error(error.message);
  revalidateCheckIn(attendee.event_id);
}
