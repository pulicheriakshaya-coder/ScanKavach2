# Accessibility Guidelines & WCAG Compliance

ScanKavach is designed to adhere to **WCAG 2.1 AA** standards across all workflows:

## 1. Core Accessibility Features
- **Language Synchronization**: The root `<html lang="...">` attribute automatically updates dynamically upon selecting English (`en`), Telugu (`te`), or Hindi (`hi`).
- **Skip Navigation Link**: A visible, focusable link at the top of the DOM enables keyboard users to immediately skip navigation bars and land on the main `<main id="main-content">` container.
- **Landmarks & Semantics**: Strictly structured with standard semantic HTML (`<header>`, `<aside>`, `<nav>`, `<main>`, `<h1>`). Only one `<h1>` per page view.
- **Color Independence**: Statuses and screening verdicts never rely on color alone. Each status badge features distinct text labels, border styles, and lucide iconography.
- **Contrast Ratios**: Exceeds 4.5:1 text-to-background contrast in both dark and light modes.
- **Keyboard Operability**: Full tab indexing and visible outline focus rings (`focus:ring-2 focus:ring-teal-500`).
- **Screen Reader Tables & Summaries**: Recharts visual graphs are accompanied by structured accessible tables or clear textual explanations.
- **Touch Target Sizing**: All interactive buttons, inputs, and toggles meet the minimum 44px by 44px clickable target size.
