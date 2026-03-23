# STARK Procurement — Draw.io Architecture Diagrams

> **Purpose:** On-brand architecture diagrams for PowerPoint and stakeholder presentations
> **Visual Identity:** Based on `Stark Procurement.pptx` template
> **Created:** 2026-03-23

---

## Quick Start

1. Open any `.drawio` file in [draw.io](https://app.diagrams.net/) or VS Code with Draw.io extension
2. Export as PNG/SVG for PowerPoint (File → Export As → PNG, 300 DPI recommended)
3. Place in PowerPoint using the same background colors as defined below

---

## Brand Colors

| Color Name | Hex Code | Usage |
|------------|----------|-------|
| **STARK Navy** | `#00326E` | Primary brand, headers, core elements |
| **STARK Orange** | `#F5821E` | Accents, action items, urgency |
| **Light Lavender** | `#B9BDD7` | Secondary fills, external systems |
| **Light Orange** | `#F7AD64` | Secondary accents, toggle-ready |
| **Blue** | `#0A5AC8` | Containers, processing elements |
| **Light Blue** | `#90BEEB` | Backgrounds, Kafka/infrastructure |
| **Background Light** | `#E8EEF7` | Section backgrounds |
| **Warning Background** | `#FFE6CC` | Alert sections, pain points |
| **White** | `#FFFFFF` | Text backgrounds, contrast |
| **Black** | `#000000` | Body text |

---

## Typography

- **Font Family:** Arial (all text)
- **Title:** 24px, Bold, STARK Navy
- **Section Headers:** 14px, Bold
- **Body Text:** 11-12px, Regular
- **Labels:** 10px

---

## Diagram Files

| # | File | Description | Recommended Use |
|---|------|-------------|-----------------|
| 01 | `01-system-context.drawio` | C4 Level 1: System boundaries | Executive overview, kickoff |
| 02 | `02-container-diagram.drawio` | C4 Level 2: Internal containers | Technical architecture |
| 03 | `03-process-flow.drawio` | End-to-end PR→Payment flow | Process documentation |
| 04 | `04-kafka-integration.drawio` | Kafka topic topology | Integration discussions |
| 05 | `05-approval-workflow.drawio` | Authority, delegation, escalation | Business rules review |
| 06 | `06-data-model.drawio` | Entity relationships (ER) | Data design review |
| 07 | `07-screen-navigation.drawio` | 16 screens navigation map | UX discussions |
| 08 | `08-user-journey.drawio` | Buyer's morning workflow | User research, UX |

---

## Color Semantics

### Element Types

| Element | Fill Color | Stroke Color | Font Color |
|---------|------------|--------------|------------|
| **Internal System** | STARK Navy | STARK Navy | White |
| **Container** | Blue | Navy | White |
| **External System (Ready)** | Light Lavender | Navy | Navy |
| **External System (Future)** | Light Orange | Orange | Navy |
| **Decision Point** | Light Orange | Orange | Navy |
| **Approval/Action** | Orange | Navy | White |
| **Audit/Support** | Light Lavender | Navy | Navy |
| **Error/DLQ** | Warning Background | Orange | Navy |

### Status Indicators

| Status | Color | When to Use |
|--------|-------|-------------|
| Success/Approved | STARK Navy | Completed, active, approved |
| Attention/Warning | Orange | Needs review, escalation |
| Future/Toggle-Ready | Light Orange | Planned, not yet active |
| External/Dependency | Light Lavender | External systems, caches |

---

## Export Settings for PowerPoint

1. **File → Export As → PNG**
2. **Settings:**
   - DPI: 300 (for print quality)
   - Border: 10px
   - Background: Transparent or White
3. **In PowerPoint:**
   - Use slide background: White or Light Lavender
   - Maintain aspect ratio when resizing
   - Add STARK logo in header if needed

---

## Editing Guidelines

### Adding New Elements

1. Use existing shapes as templates (copy/paste)
2. Maintain consistent corner radius (rounded=1)
3. Use standard stroke widths: 1px (light), 2px (normal), 3px (emphasis)
4. Keep spacing uniform (10px grid)

### Creating New Diagrams

1. Copy an existing diagram as template
2. Update title and content
3. Maintain legend in consistent position (bottom-left or bottom-right)
4. Test export before finalizing

---

## Corresponding Mermaid Diagrams

These Draw.io diagrams are visual equivalents of the Mermaid diagrams in:
- `docs/SCOPE_DEFINITION.md` (inline)
- `docs/architecture/ARCHITECTURE_DIAGRAMS.md` (reference)

Use Draw.io for PowerPoint; use Mermaid for GitHub/Markdown viewing.

---

*Visual identity based on STARK Group brand guidelines via `Stark Procurement.pptx` template.*
