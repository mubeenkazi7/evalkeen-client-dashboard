import Nav from "@/components/Nav";
import { requireClient } from "@/lib/context";
import { signOut, switchClient } from "@/app/actions";

export const dynamic = "force-dynamic";

function initials(s: string) {
  return s.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("") || "?";
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, client, clients } = await requireClient();
  const displayName = profile.full_name || user.email || "User";
  const words = client.name.split(" ");
  const short = words[0];
  const rest = words.slice(1).join(" ");

  return (
    <div className="shell">
      <aside className="side">
        <div className="brand">
          <div className="logo">{client.logo_url ? <img src={client.logo_url} alt="" /> : initials(short)[0]}</div>
          <div style={{ minWidth: 0 }}>
            <div className="brand-name">{short}</div>
            <div className="brand-sub">{rest ? `${rest} · ` : ""}Lead desk</div>
          </div>
        </div>
        <Nav />
        <div className="side-foot">
          {profile.role === "agency_admin" && clients.length > 1 ? (
            <form action={switchClient} className="switcher">
              <label htmlFor="client">Viewing client</label>
              <select id="client" name="client" defaultValue={client.id}>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <button type="submit" className="logout" style={{ minHeight: 36 }}>Switch</button>
            </form>
          ) : null}
          <div className="user">
            <div className="avatar">{initials(displayName)}</div>
            <div style={{ minWidth: 0 }}>
              <div className="user-name">{displayName}</div>
              <div className="user-role">{profile.role === "agency_admin" ? "Agency admin" : profile.role}</div>
            </div>
          </div>
          <form action={signOut}>
            <button type="submit" className="logout">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
              Log out
            </button>
          </form>
          <div className="powered">Powered by <b>evalkeen</b></div>
        </div>
      </aside>
      <main className="main">
        <div className="wrap">{children}</div>
      </main>
    </div>
  );
}
