# Security Policy

## Supported Versions

`main` and the latest tagged release are supported.

## Reporting a Vulnerability

Email: baditaflorin@gmail.com

Please include:

- A clear description of the issue.
- Steps to reproduce.
- Whether local volunteer data, peer sync, or build/deployment integrity is affected.

Do not open a public issue for an active vulnerability.

## Baseline

- No runtime secrets are needed.
- `.env*`, private keys, and certificates are gitignored.
- `gitleaks protect --staged` runs in the local pre-commit hook.
- The frontend must not contain API keys, tokens, passwords, or hidden credentials.
