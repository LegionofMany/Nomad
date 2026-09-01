import URLInput from './components/URLInput.jsx';
import AdminPanel from './components/AdminPanel.jsx';

const ENABLE_ADMIN_PANEL = import.meta.env.VITE_ENABLE_ADMIN_PANEL === 'true';

export default function App() {
  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">Blockpages411 Defensive Web3 Security</p>
        <h1>URL + Drainer Script Auditor</h1>
        <p>Scan URLs for cloned pages, suspicious JavaScript, fake airdrops, wallet requests, Permit-style approvals, downloaded payloads, and known bad addresses.</p>
      </section>
      <URLInput />
      {ENABLE_ADMIN_PANEL ? <AdminPanel /> : null}
    </main>
  );
}
