FRONTEND (React + Vite) - University Alumni Mentorship Network

1. npm install
2. Start the backend first (http://localhost:5000), then:  npm run dev
3. Open http://localhost:5173

NEW in this version
- Admin login:  role = Admin, email admin@univ.edu, password admin123
  (change it at the top of src/pages/Login.jsx)
- Admin dashboard (/admin): stats, search, Add alumni, Delete alumni (with confirm)
- Reschedule session: alumni opens a mentorship > "Reschedule" on an upcoming session.
  Mentee's page re-fetches every 5s (and on tab focus) and shows a toast + "Updated" tag.

Backend routes the new screens need (see backend-additions.js):
  DELETE /api/alumni/:id        PATCH /api/sessions/:session_id   (body: { session_date })
POST /api/alumni is already used by Register.
