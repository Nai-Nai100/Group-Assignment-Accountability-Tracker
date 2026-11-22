# API contract

All requests and responses are JSON. Errors always have the shape `{ "error": "<message>" }`.

## Authentication (TMP-03, Issue #11)

There is no public sign-up route (RC-01). Accounts are created when someone joins a project by code (TMP-06).

### Token format
- JWT signed with HS256 using the server's `JWT_SECRET`.
- Payload: `{ "sub": "<userId>", "iat": <issued>, "exp": <expires> }`. Tokens expire **8 hours** after sign-in.
- The token holds no role. Roles are per project and are always looked up on the server from Membership (DD-05).
- Send it on every protected request as `Authorization: Bearer <token>`.
- The client keeps it in `sessionStorage`, so it is cleared when the tab closes or the user signs out.

### `POST /api/auth/signin`
Request:
```json
{ "email": "priya@university.edu", "password": "••••••••" }
```

| Status | Body | When |
|---|---|---|
| 200 | `{ "token": "<jwt>", "user": { "id": "...", "name": "...", "email": "..." } }` | Email and password match |
| 400 | `{ "error": "Email and password are required." }` | Either field is missing or not a string |
| 401 | `{ "error": "Email or password is incorrect." }` | Wrong password **or** unknown email (same message for both) |

### Protected routes
Any protected route returns `401 { "error": "Sign in required." }` when the token is missing, malformed, expired or tampered with.

### `GET /api/projects` (protected)
The signed-in user's projects with the role they hold on each.

```json
{ "projects": [ { "id": "...", "name": "Transit study", "course": "ENV 215", "role": "lead", "lead": { "name": "Priya" }, "memberCount": 4 } ] }
```

`role` is `lead` or `member`. The UI shows these as "Team lead" and "Team member". `course` is omitted when not set. `lead` is the team lead's name only (no email), or `null`; `memberCount` counts everyone on the project, lead included.

### Unknown routes
Any other path, including sign-up style routes such as `/api/auth/signup`, returns `404 { "error": "Not found." }`.
