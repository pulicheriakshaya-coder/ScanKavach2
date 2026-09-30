# Contributing to ScanKavach

Thank you for your interest in contributing to ScanKavach!

## Code Quality & Audit Rules
To maintain clinical safety and pass automated AST audits, all contributions must respect:
1. **No Function Over 40 Lines**: Keep all helper and React hook functions modular.
2. **No File Over 300 Lines**: Split large pages into a container and small dedicated components.
3. **Cyclomatic Complexity <= 10**: Avoid deeply nested conditionals.
4. **JSDoc Comments**: All exported functions must include JSDoc documentation describing inputs and return values.
5. **Strict Safety Vocabulary**:
   - Never write "you have", "diagnosed with", "confirmed", or "cured".
   - Never include pharmaceutical brand names, dosages, or home remedies.
   - Always display mandatory safety disclaimers alongside results.

## Submitting Pull Requests
1. Fork the repo and create a feature branch (`git checkout -b feature/clinical-triage`).
2. Run test suites and linters:
   ```bash
   npm run test
   npm run typecheck
   npm run build
   ```
3. Submit a pull request with clear description and reproduction steps.
