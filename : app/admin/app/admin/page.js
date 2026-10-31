'use client';
import { useEffect, useState } from 'react';
import { supabase, mediaUrl, CATEGORIES } from '../../lib/supabase';

const OK_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm'];
const ACCEPT = OK_TYPES.join(',');
const MAX = 50 * 1024 * 1024;
const PLATFORMS = ['email', 'whatsapp', 'facebook', 'behance', 'instagram', 'youtube'];
const HINT = { email: 'you@gmail.com', whatsapp: 'Phone with country code, digits only, or a wa.me link', facebook: 'https://facebook.com/…', behance: 'https://behance.net/…', instagram: 'https://instagram.com/…', youtube: 'https://youtube.com/@…' };

async function upload(file) {
  if (!file || !OK_TYPES.includes(file.type)) throw new Error('Unsupported type. Use JPG, PNG, WebP, MP4, MOV or WebM.');
  if (file.size > MAX) throw new Error('File too large (max 50 MB).');
  const ext = file.name.split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '');
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from('media').upload(path, file, { contentType: file.type, cacheControl: '31536000' });
  if (error) throw error;
  return { path, type: file.type.startsWith('video') ? 'video' : 'image' };
}

function normalizeUrl(platform, v) {
  v = v.trim();
  if (!v) return '';
  if (platform === 'whatsapp' && /^\+?[\d\s-]{7,}$/.test(v)) return 'https://wa.me/' + v.replace(/\D/g, '');
  if (platform === 'email' && v.includes('@') && !v.startsWith('mailto:')) return 'mailto:' + v;
  return v;
}

export default function Admin() {
  const [session, setSession] = useState(undefined);
  const [isAdmin, setIsAdmin] = useState(null);
  const [tab, setTab] = useState('portfolio');
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!session) { setIsAdmin(null); return; }
    supabase.from('admins').select('user_id').maybeSingle().then(({ data }) => setIsAdmin(!!data));
  }, [session]);

  if (session === undefined) return <div className="wrap" style={{ padding: 40 }}>Loading…</div>;
  if (!session) return <Login />;
  if (isAdmin === null) return <div className="wrap" style={{ padding: 40 }}>Checking access…</div>;
  if (!isAdmin) return (<div className="wrap" style={{ padding: 40 }}><p className="err">This account is not an authorized administrator.</p><button className="btn" onClick={() => supabase.auth.signOut()}>Log out</button></div>);
  return (
    <div className="wrap" style={{ padding: '24px 20px 80px' }}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h2>Admin</h2>
        <button className="btn ghost sm" onClick={() => supabase.auth.signOut()}>Log out</button>
      </div>
      <div className="tags">
        {[['portfolio', 'Portfolio'], ['social', 'Social Media Settings'], ['messages', 'Messages']].map(([k, l]) => (
          <button key={k} className={'tag' + (tab === k ? ' on' : '')} onClick={() => setTab(k)}>{l}</button>))}
      </div>
      {tab === 'portfolio' && <Portfolio />}
      {tab === 'social' && <Social />}
      {tab === 'messages' && <Messages />}
    </div>);
}

function Login() {
  const [err, setErr] = useState('');
  async function go(e) {
    e.preventDefault();
    const f = new FormData(e.target);
    const { error } = await supabase.auth.signInWithPassword({ email: f.get('email'), password: f.get('password') });
    if (error) setErr('Invalid email or password.');
  }
  return (
    <div className="wrap" style={{ padding: '80px 20px' }}>
      <form className="f" onSubmit={go}>
        <h2>Admin login</h2>
        <input name="email" type="email" placeholder="Email" required autoComplete="username" />
        <input name="password" type="password" placeholder="Password" required autoComplete="current-password" />
        <button className="btn">Log in</button>
        {err && <span className="err">{err}</span>}
      </form>
    </div>);
}

function Portfolio() {
  const [items, setItems] = useState([]);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const load = () => supabase.from('portfolio_items').select('*').order('created_at', { ascending: false }).then(({ data }) => setItems(data || []));
  useEffect(() => { load(); }, []);
  const run = async (fn) => { setBusy(true); setMsg(''); try { await fn(); await load(); setMsg('Saved.'); } catch (e) { setMsg('Error: ' + (e.message || e)); } setBusy(false); };

  const add = (e) => { e.preventDefault(); const form = e.target; const f = new FormData(form);
    run(async () => {
      const { path, type } = await upload(f.get('file'));
      const { error } = await supab
