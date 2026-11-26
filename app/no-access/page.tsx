import { signOut } from "@/app/actions";

export default function NoAccess() {
  return (
    <div className="login-form-side" style={{ minHeight: "100vh" }}>
      <div className="login-form">
        <h1 style={{ fontSize: 28 }}>No dashboard access yet</h1>
        <p className="sub">Your login works, but it isn&apos;t linked to a consultancy yet. Ask your admin to finish setting up your account.</p>
        <form action={signOut}>
          <button className="primary" type="submit" style={{ width: "100%" }}>Log out</button>
        </form>
      </div>
    </div>
  );
}
