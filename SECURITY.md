# Security policy

## Reporting a vulnerability

Please report security problems privately, not in a public issue:

1. Go to the repository's **Security** tab.
2. Click **Report a vulnerability**.

This opens a private advisory that only the maintainers can see. Include what you found, where (file, screen or registry item), how to reproduce it, and what an attacker could do with it.

We aim to acknowledge reports within 5 working days and to agree a fix and disclosure date with you.

## Scope

Wirefront ships UI code that builders copy into their own apps, so these are in scope:

- Code in a screen or registry item that could enable XSS, open redirects, credential leaks or similar once installed in an app.
- The Wirefront site and the registry files it serves.
- The build and registry scripts in this repository.

Vulnerabilities in third-party dependencies should be reported to that project; tell us too if Wirefront is affected.

## Supported versions

Wirefront has no versioned releases yet. Fixes land on `main`.
