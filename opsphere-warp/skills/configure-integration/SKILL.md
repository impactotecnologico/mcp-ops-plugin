---
name: configure-integration
description: Configure an eligible Opsphere provider in the active workspace from Warp, respecting plan gates and secure credential entry.
---

# Configure an integration

Discover the live schemas for `ops_list_integrations`, `ops_configure_integration` and `ops_test_integration`. Call `ops_list_integrations` first and confirm the intended active workspace. Only proceed when that provider is eligible (`configure_cta` or `available_to_connect`); explain upgrade, beta or permission restrictions without collecting secrets.

Use secure credential entry if the client explicitly provides it. If Warp has no suitable secret-input surface, guide the user to their authorized configuration surface at https://admin.opsphere.io or Opsphere support. Do not ask for provider secrets in chat, files, shell history, work context or memory; do not assume every Hub member has admin access.

When secure input is available and the user authorizes setup, call `ops_configure_integration` with the provider's complete credential map as defined by its live schema. Never echo values. Then call `ops_test_integration` for that provider in the same workspace and report a redacted result.

Configuration does not enable premium modules or change plans. Do not switch workspace, remove existing credentials, or broaden permissions to make the test pass without explicit authorization.
