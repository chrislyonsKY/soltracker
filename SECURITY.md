# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.1.x   | Yes       |

## Reporting a Vulnerability

SolTracker is a static client-side application with no backend. It does not process sensitive user data. However, if you discover a security issue:

1. **Do not** open a public GitHub issue
2. Email the maintainer at the address listed in the repository
3. Include a description of the vulnerability and steps to reproduce

### Scope

- API key exposure in client-side code (keys should only be in localStorage)
- XSS vulnerabilities in rendered content
- Dependency vulnerabilities in npm packages

### Out of Scope

- NASA API rate limiting (by design)
- Mars tile service availability (third-party)
- Browser-specific rendering issues
