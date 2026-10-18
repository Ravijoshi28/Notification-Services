import Link from "next/link";
import ConsoleShell from "./console-shell";

export default function ComingSoon({ name, description, backendStatus }: { name: string; description: string; backendStatus: string }) {
  return <ConsoleShell><section className="soon-page"><span className="soon-mark" aria-hidden="true">⌁</span><p className="eyebrow">DELIVERY / ROADMAP</p><span className="pill">COMING SOON</span><h1 style={{ marginTop: 12 }}>{name}</h1><p>{description}</p><div className="alert" style={{ margin: "6px 0 18px" }}>{backendStatus}</div><Link className="button" href="/">Back to overview</Link></section></ConsoleShell>;
}
