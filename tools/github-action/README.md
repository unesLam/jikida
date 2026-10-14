# Jikida Security Scan — GitHub Action

Scan your repository (or a live URL) for **leaked secrets, vulnerable dependencies and risky config** on every push or pull request. Findings appear in the GitHub **Security** tab and as inline PR annotations via SARIF.

No account needed for the offline repo scan.

## Quick start

```yaml
name: Security
on: [push, pull_request]

permissions:
  contents: read
  security-events: write   # lets the action upload SARIF to the Security tab

jobs:
  jikida:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: unesLam/jikida/tools/github-action@main
        with:
          target: "."          # repo scan of the checked-out tree
          fail-on: high        # fail the job on any high/critical finding
```

That's it — the action installs `@jikida/scan`, scans the repo, uploads SARIF, and fails the job if anything at or above `high` is found.

## Inputs

| Input          | Default | Description |
|----------------|---------|-------------|
| `target`       | `.`     | A path for the repo scan (`.`) or a URL for a live web scan (`https://example.com`). |
| `fail-on`      | *(none)*| Fail the job on a finding at or above this severity: `info` \| `low` \| `medium` \| `high` \| `critical`. Empty = never fail on findings. |
| `token`        | *(none)*| Optional `JIKIDA_TOKEN`. Not needed for the offline repo scan; enables the hosted grade for URL scans. |
| `version`      | `latest`| Version of `@jikida/scan` to run. |
| `upload-sarif` | `true`  | Upload SARIF to GitHub code scanning (needs `security-events: write`). |
| `extra-args`   | *(none)*| Extra CLI flags, e.g. `--crawl 10 --active` for URL scans. |

## Outputs

| Output          | Description |
|-----------------|-------------|
| `finding-count` | Number of findings (0 if clean). |
| `grade`         | Letter grade A–F, when available. |
| `sarif-file`    | Path to the generated SARIF file. |

## Examples

**Block a PR on secrets, gate at `high`:**

```yaml
      - uses: unesLam/jikida/tools/github-action@main
        with:
          fail-on: high
```

**Scan a deployed URL (with the hosted grade):**

```yaml
      - uses: unesLam/jikida/tools/github-action@main
        with:
          target: "https://staging.example.com"
          token: ${{ secrets.JIKIDA_TOKEN }}
          extra-args: "--crawl 10"
```

**Use the outputs in later steps:**

```yaml
      - id: scan
        uses: unesLam/jikida/tools/github-action@main
      - run: echo "Jikida found ${{ steps.scan.outputs.finding-count }} issue(s), grade ${{ steps.scan.outputs.grade }}"
```

## What it scans

- **Repo (offline, no account):** committed secrets (`.env`, keys, tokens), known-vulnerable dependencies (OSV/CVE cross-reference), typosquatted / malicious packages, unsafe `Dockerfile` and GitHub Actions workflow config.
- **URL (optional `token`):** the full Jikida web scan — headers, TLS, exposed paths, and the hosted grade.

## Exit codes (from the underlying CLI)

- `0` — clean (or no finding met `fail-on`)
- `1` — a finding at or above `fail-on` exists
- `2` — a runtime error

## Links

- CLI: [`@jikida/scan`](https://www.npmjs.com/package/@jikida/scan)
- Dashboard: https://app.jikida.io
