# Hub Retention Schedule (No DPA Changes)

Last updated: 2026-02-27
Owner: Engineering + Operations
Scope: Pitch Hub and Client Hub operational data handled by AgentFlow systems

## 1. Purpose

This schedule defines default retention windows for hub-related data artifacts and the current enforcement approach.

## 2. Retention Table

| Data artifact | Purpose | Default retention | Enforcement |
| --- | --- | --- | --- |
| Access recovery token records (`access_recovery_token`) | One-time `/my-access` recovery links | 20 minute token lifetime; cleanup removes expired/used records older than 14 days | Automated cleanup in middleware (`pruneAccessRecoveryTokens`) |
| Email verification codes (`portal_verification`) | Portal email login challenge/attempt control | Code lifetime 10 minutes | Expiry enforced at verification check; stale records retained for operational troubleshooting |
| Remembered device records (`portal_device`) | "Remember this device" portal login shortcut | Device token lifetime 90 days | Expiry enforced at verification check; stale records retained for operational troubleshooting |
| Portal login events (`hub_event`, event type `portal.login`) | Security/audit visibility for client logins | 12 months default target | Manual review and periodic cleanup policy (Phase 2 technical automation) |
| Hub message records (`hub_message`) | Client/staff communication record | Customer relationship lifecycle + contractual/legal needs | Managed by hub lifecycle/delete actions |
| Hub status updates (`hub_status_update`) | Project reporting history | Customer relationship lifecycle + contractual/legal needs | Managed by hub lifecycle/delete actions |
| Hub files metadata (`hub_document`) | File catalog and visibility controls | Customer relationship lifecycle + contractual/legal needs | Managed by hub lifecycle/delete actions |

## 3. Legal Basis Summary

- Contract performance: deliver hub services and collaboration features.
- Legitimate interests: platform security, abuse prevention, and support operations.
- Legal obligations: retain required records where law applies.

## 4. Current Technical Enforcement

1. Access recovery tokens:
- One-time consumption is atomic.
- Expired/used tokens are periodically pruned with a 14-day retention buffer.

2. Portal verification and device records:
- Expiry is enforced on every login/verify request.
- Additional scheduled cleanup can be added without UX change.

3. Hub lifecycle delete:
- Hub delete flows remove hub-scoped operational data access.

## 5. Operational Review Cadence

1. Monthly:
- Review record growth for `access_recovery_token`, `portal_verification`, and `portal_device`.
- Confirm cleanup logs are present and healthy.

2. Quarterly:
- Reconfirm retention windows with legal/commercial requirements.
- Update this document if contractual obligations change.

## 6. Change Control

Any retention change must update:

1. This file (`docs/HUB_RETENTION_SCHEDULE.md`)
2. `docs/CURRENT_STATE.md` (if behavior changes)
3. `progress/STATUS.md`
4. Release checklist (`docs/HUB_LEGAL_RELEASE_CHECKLIST.md`)
