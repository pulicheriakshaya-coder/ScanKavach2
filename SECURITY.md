# Security Policy: ScanKavach

## Client-Side Security & Privacy Architecture

ScanKavach operates strictly in client-side execution mode:
- **No Medical Image Transmission**: All medical scans and images uploaded to ScanKavach are analyzed entirely in the browser using client-side WebGL/CPU inference. No medical images, feature vectors, or raw pixel data ever leave the device.
- **Client-Side Hashing & Session Storage**: User credentials for local authentication are hashed using Web Crypto PBKDF2 (SHA-256 with 100,000 iterations and cryptographic 16-byte salt). All user profile entries are stored locally within the browser's IndexedDB.
- **AI Assistant Privacy Boundary**: When utilizing the AI Assistant, only high-level statistical text summaries (score, verdict label, percentage area) are processed; no image pixels, thumbnails, file names, or patient identifying tokens are transmitted.

## Reporting a Vulnerability

If you discover a security or privacy vulnerability in ScanKavach:
1. Please do not open a public issue.
2. Report the vulnerability details via security disclosure to the maintainers.
3. Include reproduction steps, environment details, and impact evaluation.
We will respond promptly and coordinate a patch.
