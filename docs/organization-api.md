# Organization settings API

Organization settings use the authenticated organization at `/api/organization`.
The development proxy forwards these calls to the configured backend. The page
shows a retryable error if that service is unavailable; it does not substitute
sample data or claim to have saved locally.

| Method | Path | Request | Successful response |
| --- | --- | --- | --- |
| GET | `/api/organization` | None | `Organization` |
| PUT | `/api/organization` | JSON `OrganizationProfile` | Persisted `Organization` |
| DELETE | `/api/organization` | None | 204 |
| POST | `/api/organization/avatar` | Multipart field `avatar` containing an image file | JSON `{ "avatarUrl": "/uploads/avatar.png" }` |
| DELETE | `/api/organization/avatar` | None | 204 |

Types are exported from `src/api/client.ts`. The profile has `name`, `domain`,
`email`, `timezone`, `currency`, and `language`. An organization also includes
`id`, nullable `avatarUrl`, and `members`. Each member has `id`, `name`, `email`,
`role` (`admin`, `member`, or `viewer`), optional `avatar`, and `joinedAt`.
The member list is read from the server; profile saves do not overwrite it.

The backend must persist changes, authorize access to the current organization,
validate profile fields and uploaded images, and return an accessible, persistent
avatar URL. The frontend accepts PNG/JPEG/WebP files up to 5 MiB. Uploads report
real transfer progress, are cancelled on unmount, and never save local blob URLs.
Organization deletion requires typing the saved organization name and clicking
the confirmation button. Failed mutations keep the existing data and allow retry.

The component regression suite uses a stateful mocked API to verify values after
unmount/remount, and `src/api/organization.test.ts` tests the multipart transport.
