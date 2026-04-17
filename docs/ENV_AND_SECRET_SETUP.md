# Environment and Secret Setup

## Rotate leaked keys first
The previously pasted Supabase keys must be rotated before use.

## Frontend env
Create `.env` with:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ROTATED_ANON_KEY
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
APP_URL=http://localhost:3000
SUPABASE_SERVICE_ROLE_KEY=YOUR_ROTATED_SERVICE_ROLE_KEY
```

## Important rules
- `VITE_*` values are available to the browser
- `SUPABASE_SERVICE_ROLE_KEY` must be used only on the server
- never commit real keys

## Supabase dashboard tasks
1. Create the project
2. Enable Google provider in Authentication
3. Add your local/callback URLs
4. Run SQL files in `supabase/sql/` in order
5. Copy fresh keys into `.env`
