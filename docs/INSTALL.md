# Installation Guide

## Prerequisites

- [Cursor IDE](https://cursor.com) version 0.50.0 or later.
- An internet connection — Opsphere is a **remote MCP** plugin; all tools run on `https://mcp-cursor.opsphere.io` (see [REMOTE-MCP-ARCHITECTURE.md](REMOTE-MCP-ARCHITECTURE.md)).

---

## Step 1 — Install the plugin

Install Opsphere from the Cursor Marketplace:

1. Open Cursor.
2. Go to **Settings → Extensions** (or the Marketplace tab).
3. Search for **Opsphere**.
4. Click **Install**.

After install, type **`/opsphere-welcome`** in chat for a quick start guide (or **`/opsphere-setup`** for full onboarding). The plugin does **not** run shell scripts on workspace open.

### Test locally (before marketplace install)

Cursor’s [plugin submission checklist](https://cursor.com/docs/reference/plugins) expects the plugin to be tested locally. From a clone of this repository:

```bash
git clone https://github.com/impactotecnologico/mcp-ops-plugin.git
cd mcp-ops-plugin
npm test   # optional: same validation as CI

mkdir -p ~/.cursor/plugins/local
cp -R . ~/.cursor/plugins/local/opsphere
```

Then in Cursor: **Reload Window** (`Cmd+Shift+P` → Reload Window) → **Settings → MCP** → connect **Opsphere** → type **`/opsphere-welcome`** in chat.

To remove the local copy: `rm -rf ~/.cursor/plugins/local/opsphere` and reload again.

## Step 2 — Connect your account

Once installed, Cursor will detect that Opsphere requires authentication and show a **Connect** button next to the MCP server in Settings → MCP.

1. Click **Connect** (or **Sign in to opsphere**).
2. A browser window opens with the Opsphere sign-in page.
3. **New user**: fill in your email and password in the **Sign up** tab and click **Create account**.
   **Returning user**: switch to the **Log in** tab, enter your credentials, and click **Log in**.
4. The browser window closes automatically. Cursor stores the token and connects.

> Authentication is handled entirely by Cursor — you never need to copy or paste a token.

---

## Step 3 — Verify the connection

Ask the agent:

> "Is example.com up?"

If the MCP connection is working, the agent will call `http_check` and return a result.
Network tools (`dns_lookup`, `http_check`, `cert_status`) work immediately — no integration setup needed.

If your plan includes **operational memory**, ask:

> "List tools starting with memory_"

You should see `memory_search`, `memory_store`, `memory_session_touch`, and `memory_invalidate`. If they are missing, memory is not enabled for your tenant yet — contact support or check your plan.

---

## Step 3.5 — Work context (recommended)

After your first connect, run:

> "Set up my Opsphere account"

or ask:

> "Help me tell Opsphere what I usually work with"

The agent will ask for a short description of your stack (projects, providers, environments). **Do not paste API keys here** — only free-form context. You can skip and configure it later.

---

## Step 4 — Configure your first integration

Say:

> "Configure my Datadog"

The agent will walk you through connecting your Datadog account step by step.
Repeat for any other provider you use (Vercel, GitHub, Cloudflare, Jira, Sentry, Bitbucket, AWS).

---

## Re-authentication

Tokens are valid for **24 hours**. When your session expires, Cursor will show the **Connect** button again — click it to open a new browser sign-in window. Your integrations and settings are preserved.

---

## Troubleshooting installation

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common issues.

---

## Codex / ChatGPT

Opsphere ships a **Codex plugin** manifest at `.codex-plugin/plugin.json` (version **1.0.1**, separate from Cursor). Both clients use the same gateway: `https://mcp-cursor.opsphere.io/mcp`.

### Codex CLI (recommended path)

From a clone of this repository:

```bash
./scripts/codex-mcp-config.sh
npx @openai/codex mcp login opsphere
```

The config script appends to `~/.codex/config.toml`:

- `http_headers.User-Agent = codex-mcp/1.0` (required for OAuth discovery with Codex CLI)
- `[mcp_servers.opsphere.oauth] client_id = "codex-mcp"` (preset client id for Codex CLI)

Verify:

```text
Call ops_my_usage
```

or `@configure-integration help me connect Datadog`.

### ChatGPT desktop (Git marketplace — end-user path)

Opsphere is **not** in the public OpenAI Plugins Directory yet (Fase 5). Users add the **Git marketplace** from the repo; the search bar at the top of Plugins only searches the public directory.

The plugin bundles a full `.mcp.json` (OAuth `client_id`, `User-Agent`, `oauth_resource`) — same metadata as `scripts/codex-mcp-config.sh`. Users do **not** need to edit `~/.codex/config.toml` for desktop.

1. **Settings → Security → Developer mode** (on).
2. Open **Plugins** → tab **Add marketplace** (not the search box).
3. Paste: `https://github.com/impactotecnologico/mcp-ops-plugin` → confirm.
4. A new marketplace tab **Opsphere** appears → select **Opsphere** → **Install**.
5. Complete OAuth in the browser if prompted (**on install** — there is no separate Connect button on the detail page).
6. **Try now** / open an Opsphere chat → ask e.g. *"What is my Opsphere plan?"* or use `@endpoint-health`.

**Connect vs Try now:** The detail page shows **Try now**, not Connect. OAuth is triggered at install (`authentication: ON_INSTALL`) or from MCP settings / `/mcp` if the session expired.

CLI equivalent (no local clone required):

```bash
npx @openai/codex plugin marketplace add impactotecnologico/mcp-ops-plugin --ref main
```

Then restart ChatGPT desktop and open the **Opsphere** marketplace tab.

Catalog file in repo: `.agents/plugins/marketplace.json` (`source: "./"` — plugin root is the repository root).

### ChatGPT desktop (local dev copy)

```bash
./scripts/codex-install.sh
```

Then: restart ChatGPT → **Plugins** → **Opsphere** → **Connect** (MCP OAuth).

Personal marketplace entry: `~/.agents/plugins/marketplace.json` → `./.codex/plugins/opsphere` (paths resolve from `$HOME`; run `npx @openai/codex plugin marketplace list` to confirm).

**Do not** use `"source": "github"` / `"repo": "org/name"` in `marketplace.json` — Codex only accepts `local`, `url`, or `"./"` (see bundled `openai-bundled` catalog). The in-app Plugin Creator may write an invalid schema; prefer `npx @openai/codex plugin marketplace add impactotecnologico/mcp-ops-plugin --ref main`.

### Re-authentication (Codex)

When the token expires (~24h), run `npx @openai/codex mcp login opsphere` again.

See [TROUBLESHOOTING.md#codex--chatgpt-cli](TROUBLESHOOTING.md#codex--chatgpt-cli) for 403, redirect_uri, and plan-gate errors.
