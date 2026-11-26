import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type Client = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  timezone: string;
  status_owner: "dashboard" | "crm";
};

export type Profile = {
  id: string;
  client_id: string | null;
  full_name: string | null;
  role: "owner" | "staff" | "agency_admin";
};

export const ADMIN_CLIENT_COOKIE = "ek_client";

// Who is logged in, and which client's data they are looking at.
// Owners and staff always see their own client. The agency admin can switch between clients.
export const getContext = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, client_id, full_name, role")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  if (!profile) {
    return { supabase, user, profile: null, client: null, clients: [] as Client[] };
  }

  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, slug, logo_url, timezone, status_owner")
    .eq("is_active", true)
    .order("name")
    .returns<Client[]>();

  let clientId = profile.client_id;
  if (profile.role === "agency_admin") {
    const picked = (await cookies()).get(ADMIN_CLIENT_COOKIE)?.value;
    clientId = clients?.find((c) => c.id === picked)?.id ?? clients?.[0]?.id ?? null;
  }
  const client = clients?.find((c) => c.id === clientId) ?? null;

  return { supabase, user, profile, client, clients: clients ?? [] };
});

export async function requireClient() {
  const ctx = await getContext();
  if (!ctx.profile || !ctx.client) redirect("/no-access");
  return ctx as typeof ctx & { profile: Profile; client: Client };
}
