# ZTGuard – Adaptive Zero Trust Security Monitoring & Incident Response Prototype

> **Educational Prototype** — All security events are simulated for educational demonstration.
> No real attacks, real enterprise security infrastructure, or real Palo Alto products are involved.

Developed to demonstrate cybersecurity concepts from a Palo Alto Networks virtual internship program.

---

## Quick Start (Demo Mode — No Database Required)

The default configuration uses an **in-memory store** — no PostgreSQL installation needed.

### Prerequisites

- Node.js 18+ ([nodejs.org](https://nodejs.org))
- npm 9+

### 1. Start the backend

```bash
cd "e:\ZT Guard\backend"
npm install
npm run dev
```

The backend starts at **http://localhost:3001**

### 2. Start the frontend (new terminal)

```bash
cd "e:\ZT Guard\frontend"
npm install
npm run dev
```

The app opens at **http://localhost:5173**

---

## Demo Credentials

| Field    | Value               |
|----------|---------------------|
| Email    | demo@ztguard.edu    |
| Password | ZTGuard2024!        |

The login page has a **"Fill demo credentials"** button for convenience.

---

## Demo Verification Code

When prompted for additional verification (Scenario 2):

```
Code: 123456
```

---

## Running the Three Demo Scenarios

Navigate to **Security Lab** after logging in.

### Scenario 1 — Normal Access (LOW risk, score: 0)
Click **Normal Access**. Expected result: `ACCESS GRANTED`
- After the result, click **Enter Student Resource** to open the Active Session page.

### Scenario 2 — Suspicious Access (MEDIUM risk, score: 45)
Click **Suspicious Access**. Expected result: `VERIFICATION REQUIRED`
- Click **Complete Verification**, enter code `123456`, then `ACCESS GRANTED`.

### Scenario 3 — High-Risk Access (HIGH risk, score: 95)
Click **High-Risk Access**. Expected result: `ACCESS BLOCKED`
- An incident `INC-XXXX` is automatically created in the **SOC Incidents** page.

### Continuous Verification Demo
1. Run Scenario 1 → Enter Student Resource → Active Session page opens.
2. Click **Simulate Security Context Change**.
3. The system re-evaluates: device becomes unknown, 3 failed attempts → MEDIUM risk.
4. Click **Complete Verification** to restore access.

---

## Application Pages

| Route        | Page              | Purpose                                             |
|--------------|-------------------|-----------------------------------------------------|
| `/lab`       | Security Lab      | Main demo — three scenario cards + analysis flow    |
| `/session`   | Active Session    | Protected resource + continuous re-evaluation       |
| `/incidents` | SOC Incidents     | Master-detail incident management with timeline     |
| `/audit`     | Audit Log         | Chronological security event stream with filtering  |
| `/about`     | About             | Prototype explanation, risk engine docs, tech stack |

---

## Project Structure

```
e:\ZT Guard\
├── backend/
│   ├── src/
│   │   ├── database/
│   │   │   ├── schema.sql        # PostgreSQL schema
│   │   │   ├── db.js             # PostgreSQL connection pool
│   │   │   ├── memoryStore.js    # In-memory store (default/demo mode)
│   │   │   ├── init.js           # DB initializer script
│   │   │   └── seed.js           # PostgreSQL seed script
│   │   ├── engines/
│   │   │   ├── riskEngine.js     # Risk scoring engine (0-100)
│   │   │   ├── policyEngine.js   # Zero Trust policy decisions
│   │   │   └── engineTest.js     # Engine unit tests
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── accessController.js
│   │   │   ├── incidentController.js
│   │   │   └── auditController.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── access.js
│   │   │   ├── incidents.js
│   │   │   └── audit.js
│   │   ├── middleware/
│   │   │   └── auth.js           # JWT middleware
│   │   └── server.js             # Express entry point
│   ├── .env                      # Environment config
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   ├── SecurityLab.jsx   # Main demo page
    │   │   ├── ActiveSession.jsx
    │   │   ├── IncidentCenter.jsx
    │   │   ├── AuditLog.jsx
    │   │   └── AboutPage.jsx
    │   ├── components/
    │   │   ├── Layout.jsx
    │   │   ├── Navbar.jsx
    │   │   ├── CheckStep.jsx     # Analysis step indicator
    │   │   ├── DecisionBanner.jsx
    │   │   ├── RiskBadge.jsx
    │   │   ├── StatusBadge.jsx
    │   │   ├── RiskBreakdown.jsx # Expandable risk details
    │   │   └── VerificationModal.jsx
    │   ├── context/
    │   │   ├── AuthContext.jsx
    │   │   └── SessionContext.jsx
    │   ├── services/
    │   │   └── api.js            # All API calls
    │   ├── App.jsx               # Router
    │   ├── main.jsx
    │   └── index.css             # Design system tokens
    ├── vite.config.js
    └── package.json
```

---

## PostgreSQL Setup (Optional)

The app works fully without PostgreSQL using the default in-memory mode.
To switch to PostgreSQL:

### 1. Create the database

```sql
CREATE DATABASE ztguard;
```

### 2. Update `.env`

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ztguard
DB_USER=postgres
DB_PASSWORD=your_password
USE_IN_MEMORY=false
```

### 3. Initialize schema and seed

```bash
cd "e:\ZT Guard\backend"
node src/database/init.js
node src/database/seed.js
```

---

## Environment Variables (backend/.env)

| Variable       | Default                                    | Description                         |
|----------------|--------------------------------------------|-------------------------------------|
| `PORT`         | `3001`                                     | Backend server port                 |
| `JWT_SECRET`   | `ztguard_dev_secret_...`                   | JWT signing key                     |
| `USE_IN_MEMORY`| `true`                                     | Use in-memory store (no DB needed)  |
| `DB_HOST`      | `localhost`                                | PostgreSQL host                     |
| `DB_PORT`      | `5432`                                     | PostgreSQL port                     |
| `DB_NAME`      | `ztguard`                                  | Database name                       |
| `DB_USER`      | `postgres`                                 | Database user                       |
| `DB_PASSWORD`  | `postgres`                                 | Database password                   |
| `NODE_ENV`     | `development`                              | Environment                         |

---

## Risk Engine Explanation

The risk engine evaluates five independent security context signals and assigns a numeric score capped at 100.

| Signal                        | Points |
|-------------------------------|--------|
| Unknown / Untrusted Device    | +25    |
| Unusual Access Context        | +20    |
| 3–4 Failed Login Attempts     | +20    |
| 5+ Failed Login Attempts      | +30    |
| Sensitive Resource Requested  | +20    |

**Risk thresholds:**

| Score   | Level  | Decision                        |
|---------|--------|---------------------------------|
| 0–30    | LOW    | Access Granted                  |
| 31–60   | MEDIUM | Additional Verification Required |
| 61–100  | HIGH   | Access Blocked                  |

**Scenario scores (pre-verified):**
- Scenario 1 (Normal): 0 → LOW → Granted
- Scenario 2 (Suspicious): 25 + 20 = **45** → MEDIUM → Verification Required
- Scenario 3 (High Risk): 25 + 20 + 30 + 20 = **95** → HIGH → Blocked

---

## Zero Trust Policy Engine Explanation

The policy engine (`src/engines/policyEngine.js`) is a dedicated module that:

1. Receives the full access context as structured input
2. Calls the risk engine to compute a score
3. Maps the score to a risk level and access decision
4. Builds human-readable verification checks for the UI
5. Generates reasons and recommended actions
6. Flags whether an incident needs to be created
7. Returns a complete `PolicyDecision` object

It is the **single source of truth** for all access decisions. Controllers call it;  
they do not contain decision logic themselves.

Zero Trust principle applied: *"Never trust automatically. Continuously verify and evaluate risk."*

---

## Feature Checklist

- [x] User login with JWT authentication and password hashing
- [x] Three interactive demo scenarios (Normal / Suspicious / High-Risk)
- [x] Animated step-by-step analysis sequence (Identity → Device → Context → Risk → Policy)
- [x] Risk engine calculates score from 5 independent factors
- [x] LOW risk → Access Granted
- [x] MEDIUM risk → Additional Verification Required (demo code: 123456)
- [x] HIGH risk → Access Blocked with incident panel
- [x] Security incidents automatically created for HIGH risk events
- [x] SOC Incident Center with master-detail layout
- [x] Incident status transitions: OPEN → INVESTIGATING → RESOLVED
- [x] Incident timeline with timestamped entries
- [x] Security audit log with chronological event stream
- [x] Audit log filtering by risk level (All / Low / Medium / High)
- [x] Active Session page with session details
- [x] Continuous verification — context change re-evaluation mid-session
- [x] Protected resource access after grant
- [x] Data persistence within session (in-memory) / across restarts (PostgreSQL)
- [x] About page with risk engine and policy engine documentation
- [x] Responsive layout for laptop presentation
- [x] No placeholder buttons — every control performs its expected action

---

## API Reference

All routes are prefixed `/api/`. Authentication required except `/auth/login`.

| Method | Path                          | Description                        |
|--------|-------------------------------|------------------------------------|
| POST   | `/auth/login`                 | Login, returns JWT                 |
| GET    | `/auth/me`                    | Current user info                  |
| GET    | `/access/resources`           | List resources                     |
| POST   | `/access/evaluate`            | Run Zero Trust evaluation          |
| POST   | `/access/verify`              | Submit OTP verification code       |
| POST   | `/access/revaluate`           | Re-evaluate active session         |
| GET    | `/incidents`                  | List all incidents                 |
| GET    | `/incidents/:id`              | Get incident + timeline            |
| PATCH  | `/incidents/:id/status`       | Update incident status             |
| GET    | `/audit`                      | Audit events (`?filter=low/medium/high`) |
| GET    | `/health`                     | Health check                       |
