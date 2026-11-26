"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_CLIENT_COOKIE } from "@/lib/context";
import { STATUSES, type Status } from "@/lib/format";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// Agency admin only: choose which client to view. RLS still decides what is visible.
export async function switchClient(formData: FormData) {
  const id = String(formData.get("client") ?? "");
  (await cookies()).set(ADMIN_CLIENT_COOKIE, id, { httpOnly: true, sameSite: "lax", path: "/", secure: true });
  redirect("/");
}

// Staff/owner updates a lead's sales status. The database only lets them change
// status / lost_reason / assigned_to, only on their own client's leads, and logs every change.
export async function updateStatus(leadId: string, status: Status, lostReason?: string) {
  if (!STATUSES.includes(status)) return { error: "Unknown status" };
  const supabase = await createClient();
  const { error, count } = await supabase
    .from("leads")
    .update({ status, lost_reason: status === "lost" ? lostReason?.trim() || null : null }, { count: "exact" })
    .eq("id", leadId);
  if (error) return { error: "Could not update status. Try again." };
  if (!count) return { error: "You can't change this lead." };
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
  revalidatePath("/");
  return { ok: true };
}
