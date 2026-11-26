import Link from "next/link";

export default function NotFound() {
  return (
    <div className="login-form-side" style={{ minHeight: "100vh" }}>
      <div className="login-form">
        <h1 style={{ fontSize: 28 }}>Not found</h1>
        <p className="sub">This page doesn&apos;t exist, or you don&apos;t have access to it.</p>
        <Link href="/" className="back">← Back to overview</Link>
      </div>
    </div>
  );
}
