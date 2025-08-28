# Frontend Feature Flag System with Persistent Database Integration

## Purpose

Enable admin users to toggle frontend features (test flags) in real time, with changes persisted to a database for reliability, audit, and multi-admin control. This allows for instant rollback of risky features and coordinated feature rollout.

---

## 1. Architecture Overview

- **Feature Flag Config**: Centralized TypeScript config listing all available flags, their defaults, and descriptions.
- **Flag State Storage**: Persistent backend (e.g., PostgreSQL, MongoDB, Firebase) holds current flag states. Frontend fetches and updates via API.
- **Flag Context**: React context/provider supplies flag values to all components.
- **Admin UI**: Page/modal for admins to view, toggle, and audit flag changes.
- **Audit Logging**: All flag changes are logged (who, when, what changed).
- **Security**: Only admins can view/change flags; all API calls are authenticated.

---

## 2. Data Model & API

### Database Table Example (SQL)

```sql
CREATE TABLE feature_flags (
  flag_name VARCHAR PRIMARY KEY,
  value BOOLEAN NOT NULL,
  description TEXT,
  status VARCHAR(32) DEFAULT 'active', -- e.g. active, deprecated, experimental
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_by VARCHAR NOT NULL
);

CREATE TABLE feature_flag_audit (
  id SERIAL PRIMARY KEY,
  flag_name VARCHAR NOT NULL,
  old_value BOOLEAN,
  new_value BOOLEAN,
  changed_by VARCHAR NOT NULL,
  changed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  reason TEXT, -- optional: why the change was made
  details JSONB -- optional: extra info (e.g. IP, request id)
);
```

### REST API Endpoints

- `GET /api/feature-flags` → returns all flags and states
- `POST /api/feature-flags/:flagName` → updates a flag (admin only)
- `GET /api/feature-flags/audit` → returns audit log

---

## 3. Frontend Integration

### Flag Definition (TypeScript)

```ts
// src/featureFlags.ts
export const FEATURE_FLAGS = {
  newCheckoutFlow: { default: false, description: "Enable new checkout UI" },
  debugMode: { default: false, description: "Show debug info to admins" },
  // ...
};
```

### Flag Context Provider

```tsx
// src/FeatureFlagProvider.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { FEATURE_FLAGS } from "./featureFlags";

const FeatureFlagContext = createContext({
  flags: {},
  refresh: () => {},
  updateFlag: (name, value) => {},
});

export const useFeatureFlags = () => useContext(FeatureFlagContext);

export const FeatureFlagProvider = ({ children }) => {
  const [flags, setFlags] = useState({});

  useEffect(() => {
    fetch("/api/feature-flags")
      .then((res) => res.json())
      .then((data) => setFlags(data));
  }, []);

  const refresh = () => {
    fetch("/api/feature-flags")
      .then((res) => res.json())
      .then((data) => setFlags(data));
  };

  const updateFlag = (name, value) => {
    fetch(`/api/feature-flags/${name}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
    }).then(refresh);
  };

  return (
    <FeatureFlagContext.Provider value={{ flags, refresh, updateFlag }}>
      {children}
    </FeatureFlagContext.Provider>
  );
};
```

### Usage in Components

```tsx
const { flags } = useFeatureFlags();
if (flags.newCheckoutFlow) {
  // render new UI
} else {
  // render old UI
}
```

### Admin UI Example

```tsx
// src/components/AdminFeatureFlags.tsx
import { useFeatureFlags } from "../FeatureFlagProvider";
import { FEATURE_FLAGS } from "../featureFlags";

export function AdminFeatureFlags() {
  const { flags, updateFlag } = useFeatureFlags();
  return (
    <div>
      <h2>Feature Flags</h2>
      {Object.entries(FEATURE_FLAGS).map(([name, meta]) => (
        <div key={name}>
          <span>
            {name}: {meta.description}
          </span>
          <input
            type="checkbox"
            checked={!!flags[name]}
            onChange={(e) => updateFlag(name, e.target.checked)}
          />
        </div>
      ))}
    </div>
  );
}
```

---

## 4. Backend Integration

- On flag update, backend updates `feature_flags` table and inserts an audit row.
- Backend enforces admin-only access for flag changes.
- Backend can cache flag states for performance, but must allow instant refresh.

---

## 5. Rollback & Audit

- Admins can toggle flags off to instantly disable features.
- Audit log tracks all changes for accountability.
- Optionally, allow reverting to previous flag states from audit log.

---

## 6. Best Practices

- Document each flag (purpose, risk, default).
- Use flags for risky/new features, not permanent config.
- Clean up unused flags regularly.
- Only expose flag controls to admins.
- Use optimistic UI updates for fast feedback.
- Test flag toggling in staging before production.

---

## 7. Example Workflow

1. Developer adds a new flag to `FEATURE_FLAGS` and gates new code with it.
2. Admin sees the new flag in the admin UI and can enable/disable it.
3. When a bug is found, admin disables the flag, instantly rolling back the feature.
4. All changes are logged in the audit table for review.

---

## 8. Security & Reliability

- Authenticate all API calls for flag changes.
- Validate flag names and values on backend.
- Use transactions for flag and audit updates.
- Optionally, notify team on flag changes (Slack/email integration).

---

## 9. Extending Further

- Add flag targeting (e.g., enable for specific users/groups).
- Add flag rollout (percentage-based, canary releases).
- Integrate with CI/CD for automated flag management.

---

## 10. References

- [LaunchDarkly](https://launchdarkly.com/) (commercial feature flag service)
- [Unleash](https://www.getunleash.io/) (open source)
- [Martin Fowler: Feature Toggles](https://martinfowler.com/articles/feature-toggles.html)

---

This document provides a full plan for integrating frontend feature flags with a persistent database, enabling safe, auditable, and admin-controlled feature rollout and rollback.
