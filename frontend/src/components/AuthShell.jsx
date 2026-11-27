export default function AuthShell({ children }) {
  return (
    <div className="auth-shell">
      <aside className="auth-aside">
        <div className="brand"><span className="brand-mark">A</span>Alumni Mentorship Network</div>
        <div>
          <h1>Learn from the people who stood where you stand.</h1>
          <p>Find an alumnus in your field, send a request, and keep every session and piece of feedback in one place.</p>
        </div>
        <ul>
          <li>Search alumni by company, role or skill</li>
          <li>Requests are tracked until the alumnus responds</li>
          <li>Rate each session to help the next student</li>
        </ul>
      </aside>
      <main className="auth-main"><div className="auth-card">{children}</div></main>
    </div>
  );
}
