---
name: opsphere-setup
description: Sign up or log in to Opsphere to connect your DevOps tools to Cursor
---

# Opsphere Account Setup

Guide the user through signing up or logging in to Opsphere. Walk through each step conversationally — do not dump all questions at once.

## Steps

### 1. Ask whether they are new or returning

Ask: "Do you already have an Opsphere account, or would you like to create one?"

---

### 2a. New user — Signup

1. Ask for their email address.
2. Ask them to choose a password (minimum 8 characters). Remind them not to reuse an important password.
3. Call the signup endpoint. Use stdin piping to keep the password out of shell history:

```bash
echo '{"email":"<EMAIL>","password":"<PASSWORD>"}' | curl -s -X POST https://mcp-gateway.opsphere.io/api/plugin/signup \
  -H "Content-Type: application/json" \
  --data-binary @-
```

4. Parse the JSON response:
   - **Success (201)**: response contains `accessToken`, `refreshToken`, and `user`.
   - **409 `email_already_registered`**: tell the user the email is already registered and offer to log in instead.
   - **400**: validation error — check email format or password length.
   - **429**: too many attempts — ask the user to wait a few minutes.
   - **500**: ask the user to try again; if it persists, contact support at hello@opsphere.io.

---

### 2b. Existing user — Login

1. Ask for their email and password.
2. Call the login endpoint:

```bash
echo '{"email":"<EMAIL>","password":"<PASSWORD>"}' | curl -s -X POST https://mcp-gateway.opsphere.io/api/plugin/login \
  -H "Content-Type: application/json" \
  --data-binary @-
```

3. Parse the JSON response (same format as signup).
   - **401 `invalid_credentials`**: wrong email or password — ask them to double-check.
   - **403 `account_suspended`**: trial has expired — direct them to https://opsphere.io/pricing.

---

### 3. After successful authentication

The response contains an `accessToken` (valid for 24 hours). Show it to the user and instruct:

> "Copy this token. When Cursor asks for the **opsphere-token** setting, paste it there.
> You can also set it in Cursor Settings → MCP → opsphere → token."

Tell the user:
> "Your 30-day free trial is active. You have access to tools for Datadog, Vercel,
> GitHub, Cloudflare, Jira, Sentry, Bitbucket, and AWS — plus DNS, HTTP, and TLS diagnostics
> that work immediately without any configuration."

Then ask: "Would you like to connect your first integration? I can guide you through setting up Datadog, Vercel, GitHub, or any other provider. Just say 'Configure my Datadog' or whichever you'd like to start with."

---

## Security notes

- Never display the password after the API call.
- Do not store the password anywhere.
- The `accessToken` is a JWT — it is safe to display (it is not a secret in the same sense as a password, but treat it like one).
- The `refreshToken` in the response should be stored securely by the user if they want seamless re-login. For MVP, they can re-run this command after 24 hours if their token expires.
- The gateway URL is always: `https://mcp-gateway.opsphere.io`
