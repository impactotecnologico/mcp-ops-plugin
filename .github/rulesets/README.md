# Repository rulesets (R08)

`main-supply-chain-gate.json` is the canonical spec for the Git branch ruleset that blocks merges to `main` until **Supply chain policy** passes (`integration_id` 15368 = GitHub Actions for this org).

Apply or refresh after editing:

```sh
./scripts/github/apply-main-supply-chain-ruleset.sh
```

If a ruleset with the same name already exists, the script updates it via `PUT`.

Gateway (`mcp-ops-b`) also requires **Tool security source review**; this repository does not.
