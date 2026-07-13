# Security policy

## Scope and trust boundaries

Champions Builder is a static client-only application. It has no authentication, backend, database, privileged API or analytics. Runtime assets are same-origin and teams, favorites and custom sets are stored locally in the browser.

The main trust boundary is the offline data-generation pipeline. Smogon and Serebii payloads are untrusted input until they pass response limits, schema validation and `npm run audit:data`. Generated JSON and browser storage must never be interpolated into HTML without context-appropriate escaping.

## Reporting

Do not include private team exports, browser-storage dumps, tokens or credentials in a public issue. Report a suspected vulnerability privately through GitHub's security-advisory flow when available, or contact the repository owner through their GitHub profile.

Include the affected commit, reproduction steps, impact and whether the issue affects the live GitHub Pages build.

## Maintainer checks

- Keep GitHub Actions pinned to reviewed commit SHAs and grant only required permissions.
- Require the CI `verify` job before merging or deploying `main`.
- Review generated data diffs and never bypass schema/audit failures.
- Rotate/purge any credential accidentally committed and inspect repository history.
- Recheck the CSP and security headers after changing hosting or adding an external service.
