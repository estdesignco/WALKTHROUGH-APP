# Test Credentials

## App password gate
- Password: `DesignReady2026!`
  - Prompted on first load — value stored in `frontend/.env` as `REACT_APP_PASSWORD`. Enter and press Enter.

## Canva OAuth (for Canva connect flow)
- Client ID: `OC-AZ5ixiAhK2Eq`
- Redirect URI is computed dynamically from the incoming Request — do NOT hardcode.
- Register `https://<preview-host>/api/canva/callback` in Canva developer console → Authentication tab.

## Notes
- No per-user accounts; the app password is the only auth.
- Vendor portal credentials are stored encrypted in Mongo (`vendor_portals` collection, Fernet with `VENDOR_ENCRYPTION_KEY`). Do not hardcode.
