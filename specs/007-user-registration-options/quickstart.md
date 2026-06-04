# Quickstart: Google OAuth & Magic Link Authentication

This guide outlines how to configure, test, and run the new Google OAuth and Magic Link authentication flows.

## 1. Setup & Configuration

### Supabase Settings
1. Open the Supabase Dashboard.
2. Go to **Authentication > Providers > Email**:
   - Turn **ON** the switch **"Confirm email"** (since the user explicitly requested a confirmation flow for manual email).
3. Go to **Authentication > Providers > Google**:
   - Enable the provider.
   - Enter your Google OAuth **Client ID** and **Client Secret** (obtained from the Google Cloud Console).
   - Copy the **Redirect URI** provided by Supabase and paste it into the Google Cloud Console.

### Google Cloud Console Settings
1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Navigate to **APIs & Services > Credentials**.
3. Create an **OAuth Client ID** for a **Web Application**:
   - Authorized Javascript origins: `http://localhost:3000` (for testing) and `https://aparovaenf.vercel.app` (for production).
   - Authorized redirect URIs: The callback URI copied from the Supabase Dashboard.

---

## 2. Testing Locally

### Testing Magic Links
1. Navigate to `/login` or `/signup`.
2. Enter your email and click **"Enviar link de acesso"**.
3. Because we are in development, check your email inbox (or Supabase local/cloud logs depending on configuration) for the email.
4. Click the link in the email. It should redirect you to `http://localhost:3000/api/auth/callback?code=...` and log you in.

### Testing Google OAuth
1. Click **"Continuar com o Google"** on the login or signup screen.
2. Log in using your Google account on the Google dialog.
3. Once authenticated, Google redirects back to Supabase, which redirects to your local/production callback URL, logging you in.
