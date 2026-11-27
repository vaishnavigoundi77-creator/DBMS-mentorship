const TONES = ['#1f5c48', '#8a5a2b', '#3d5a80', '#7a3e4e', '#58633a', '#5b4b7a'];

export function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] || '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

export default function Avatar({ name, size = '' }) {
  let h = 0;
  for (const c of name || '') h = (h * 31 + c.charCodeAt(0)) % TONES.length;
  return (
    <span className={`avatar ${size}`} style={{ background: TONES[h] }} aria-hidden="true">
      {initials(name)}
    </span>
  );
}
