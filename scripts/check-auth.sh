#!/usr/bin/env bash
# Prints Opsphere quick-start guidance on workspace open.
# OAuth tokens are managed by Cursor via Connect (OAuth2 + PKCE) and are not
# accessible from a shell context, so we print a brief welcome
# that serves both new and returning users without being intrusive.

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Opsphere — DevOps Intelligence"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  First time? Ask the agent:"
echo "  → \"Set up my Opsphere account\""
echo ""
echo "  Already set up? Try:"
echo "  → \"Check my Vercel deploys\""
echo "  → \"Search Datadog logs for errors\""
echo "  → \"Configure my Datadog\""
echo "  → \"Is example.com up?\""
echo ""
