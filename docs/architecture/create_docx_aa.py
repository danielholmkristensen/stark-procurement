#!/usr/bin/env python3
"""
STARK Procurement Scope Document — Word Generator
Agentic Agency editorial style: sharp, precise, commanding
"""

from docx import Document
from docx.shared import Inches, Pt, RGBColor, Twips
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.enum.style import WD_STYLE_TYPE
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
import os

OUTPUT_PATH = "/Users/dhk/Projects/STARK_Procurement/app/docs/STARK_Procurement_Scope_Document_Kim_Christensen.docx"

# Agentic Agency Brand Colors - LIGHT THEME
AA_BLACK = RGBColor(0x00, 0x00, 0x00)
AA_CEMENT = RGBColor(0xE6, 0xE6, 0xE1)
AA_CEMENT_DARK = RGBColor(0xD0, 0xD0, 0xCB)
AA_DARK_GRAY = RGBColor(0x33, 0x33, 0x33)
AA_MID_GRAY = RGBColor(0x66, 0x66, 0x66)
AA_LIGHT_GRAY = RGBColor(0x99, 0x99, 0x99)


def set_cell_shading(cell, color_hex):
    """Set cell background color"""
    shading_elm = OxmlElement('w:shd')
    shading_elm.set(qn('w:fill'), color_hex)
    cell._tc.get_or_add_tcPr().append(shading_elm)


def add_section_break(doc):
    """Add elegant section break with spacing"""
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(24)
    p.paragraph_format.space_after = Pt(24)

    pPr = p._p.get_or_add_pPr()
    pBdr = OxmlElement('w:pBdr')
    bottom = OxmlElement('w:bottom')
    bottom.set(qn('w:val'), 'single')
    bottom.set(qn('w:sz'), '4')
    bottom.set(qn('w:space'), '1')
    bottom.set(qn('w:color'), 'CCCCCC')
    pBdr.append(bottom)
    pPr.append(pBdr)


def add_pull_quote(doc, text):
    """Add a visually distinct pull quote"""
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(18)
    p.paragraph_format.space_after = Pt(18)
    p.paragraph_format.left_indent = Inches(0.5)
    p.paragraph_format.right_indent = Inches(0.5)

    # Left border
    pPr = p._p.get_or_add_pPr()
    pBdr = OxmlElement('w:pBdr')
    left = OxmlElement('w:left')
    left.set(qn('w:val'), 'single')
    left.set(qn('w:sz'), '24')
    left.set(qn('w:space'), '12')
    left.set(qn('w:color'), '000000')
    pBdr.append(left)
    pPr.append(pBdr)

    run = p.add_run(text)
    run.font.size = Pt(13)
    run.font.italic = True
    run.font.color.rgb = AA_DARK_GRAY


def add_body(doc, text, space_after=8):
    """Add body paragraph with proper formatting"""
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = 1.15
    run = p.add_run(text)
    run.font.size = Pt(11)
    run.font.name = "Arial"
    run.font.color.rgb = AA_BLACK
    return p


def add_lead(doc, text):
    """Add lead paragraph - slightly larger, sets the tone"""
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(14)
    p.paragraph_format.line_spacing = 1.2
    run = p.add_run(text)
    run.font.size = Pt(12)
    run.font.name = "Arial"
    run.font.color.rgb = AA_DARK_GRAY
    return p


def add_kicker(doc, text):
    """Add a kicker - small caps label above heading"""
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(24)
    p.paragraph_format.space_after = Pt(4)
    run = p.add_run(text.upper())
    run.font.size = Pt(9)
    run.font.bold = True
    run.font.color.rgb = AA_MID_GRAY
    run.font.name = "Arial"
    # Letter spacing
    return p


def add_h1(doc, text):
    """Add H1 with proper styling"""
    h = doc.add_heading(text, level=1)
    h.paragraph_format.space_before = Pt(0)
    h.paragraph_format.space_after = Pt(12)
    for run in h.runs:
        run.font.color.rgb = AA_BLACK
        run.font.name = "Arial"
        run.font.size = Pt(26)
    return h


def add_h2(doc, text):
    """Add H2 with proper styling"""
    h = doc.add_heading(text, level=2)
    h.paragraph_format.space_before = Pt(18)
    h.paragraph_format.space_after = Pt(8)
    for run in h.runs:
        run.font.color.rgb = AA_BLACK
        run.font.name = "Arial"
        run.font.size = Pt(16)
    return h


def add_h3(doc, text):
    """Add H3 with proper styling"""
    h = doc.add_heading(text, level=3)
    h.paragraph_format.space_before = Pt(14)
    h.paragraph_format.space_after = Pt(6)
    for run in h.runs:
        run.font.color.rgb = AA_DARK_GRAY
        run.font.name = "Arial"
        run.font.size = Pt(13)
    return h


def add_bullet_list(doc, items, indent=0.25):
    """Add a clean bullet list"""
    for item in items:
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.left_indent = Inches(indent)

        # Handle bold prefix with colon
        if ": " in item and not item.startswith(" "):
            parts = item.split(": ", 1)
            run = p.runs[0] if p.runs else p.add_run()
            run.clear()
            bold_run = p.add_run(parts[0] + ": ")
            bold_run.bold = True
            bold_run.font.size = Pt(11)
            bold_run.font.name = "Arial"
            reg_run = p.add_run(parts[1])
            reg_run.font.size = Pt(11)
            reg_run.font.name = "Arial"
        else:
            for run in p.runs:
                run.font.size = Pt(11)
                run.font.name = "Arial"


def create_document():
    """Create the editorial-quality Word document"""
    doc = Document()

    # Default style
    style = doc.styles['Normal']
    style.font.name = 'Arial'
    style.font.size = Pt(11)
    style.font.color.rgb = AA_BLACK
    style.paragraph_format.line_spacing = 1.15

    # ═══════════════════════════════════════════════════════════════════════════
    # TITLE PAGE
    # ═══════════════════════════════════════════════════════════════════════════

    for _ in range(5):
        doc.add_paragraph()

    # Title
    title = doc.add_paragraph()
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = title.add_run("STARK PROCUREMENT")
    run.bold = True
    run.font.size = Pt(42)
    run.font.color.rgb = AA_BLACK
    run.font.name = "Arial"

    # Subtitle
    sub = doc.add_paragraph()
    sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    sub.paragraph_format.space_before = Pt(8)
    run = sub.add_run("Scope Definition")
    run.font.size = Pt(18)
    run.font.color.rgb = AA_MID_GRAY
    run.font.name = "Arial"

    # Recipient line
    doc.add_paragraph()
    recip = doc.add_paragraph()
    recip.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = recip.add_run("Prepared for Kim Christensen")
    run.font.size = Pt(12)
    run.font.color.rgb = AA_LIGHT_GRAY
    run.font.name = "Arial"

    # Date
    date_p = doc.add_paragraph()
    date_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = date_p.add_run("March 2026")
    run.font.size = Pt(12)
    run.font.color.rgb = AA_LIGHT_GRAY
    run.font.name = "Arial"

    # Footer area
    for _ in range(8):
        doc.add_paragraph()

    vendor = doc.add_paragraph()
    vendor.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = vendor.add_run("Agentic Agency")
    run.font.size = Pt(11)
    run.font.color.rgb = AA_MID_GRAY
    run.font.name = "Arial"

    tagline = doc.add_paragraph()
    tagline.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = tagline.add_run("Engineering > Prompting")
    run.italic = True
    run.font.size = Pt(10)
    run.font.color.rgb = AA_LIGHT_GRAY
    run.font.name = "Arial"

    doc.add_page_break()

    # ═══════════════════════════════════════════════════════════════════════════
    # AGENTIC ENGINEERING
    # ═══════════════════════════════════════════════════════════════════════════

    add_kicker(doc, "Our Approach")
    add_h1(doc, "Agentic Engineering")

    add_lead(doc,
        "This is not AI-assisted development. This is not an engineer with a chatbot. "
        "This is something fundamentally different."
    )

    add_body(doc,
        "Agentic Engineering inverts the relationship between human and machine. "
        "AI agents autonomously execute engineering tasks—writing code, running tests, "
        "debugging failures, documenting decisions—while humans provide direction, "
        "constraints, and quality review."
    )

    add_pull_quote(doc, "Agents do the work. Humans set the direction.")

    add_body(doc,
        "The result: production-grade software delivered in compressed timelines. "
        "Not prototypes. Not demos. Working systems with proper architecture, "
        "comprehensive testing, and maintainable code."
    )

    add_section_break(doc)

    # ═══════════════════════════════════════════════════════════════════════════
    # THE LANDSCAPE
    # ═══════════════════════════════════════════════════════════════════════════

    add_kicker(doc, "Context")
    add_h1(doc, "The Landscape")

    add_lead(doc,
        "Software delivery approaches sit on a spectrum. Understanding where each falls—"
        "and where Agentic Engineering differs—clarifies what we offer."
    )

    add_h2(doc, "Low-Code Platforms")
    add_body(doc,
        "Visual, drag-and-drop interfaces that abstract away code. "
        "Fast for standardized applications. Limited for anything beyond the template. "
        "Vendor lock-in. Ongoing licensing. Hidden complexity that surfaces at scale."
    )

    add_h2(doc, "Vibecoding")
    add_body(doc,
        "Prompt-driven code generation without engineering judgment. "
        "The developer \"vibes\" with AI, accepting output with minimal review. "
        "Fast initial results. Inconsistent quality. Security vulnerabilities. "
        "Technical debt that compounds. Produces artifacts, not systems."
    )

    add_h2(doc, "Traditional Development")
    add_body(doc,
        "Skilled engineers, established methodologies, deliberate architecture. "
        "High quality when done well. Time-intensive. Expensive. "
        "Dependent on scarce talent. Often burdened by process overhead."
    )

    add_h2(doc, "Agentic Engineering")
    add_body(doc,
        "AI agents execute autonomously within boundaries set by experienced engineers. "
        "Human judgment shapes every deliverable. Agents work in parallel, around the clock, "
        "with full persistence of context across sessions. Quality enforced through "
        "test-gated tasks—not hoped for, but guaranteed."
    )

    add_section_break(doc)

    # ═══════════════════════════════════════════════════════════════════════════
    # ADAPT
    # ═══════════════════════════════════════════════════════════════════════════

    add_kicker(doc, "Methodology")
    add_h1(doc, "ADAPT")

    add_lead(doc,
        "Agentic Development with Artifact Persistence & Testing. "
        "Our methodology for delivering engineered systems at speed."
    )

    items = [
        "Agentic: AI agents work autonomously on well-defined tasks. Human engineers set direction, review output, make architectural decisions.",
        "Development: Real engineering—production-grade code with proper error handling, type safety, and maintainability.",
        "Artifact: Every decision, lesson, and context persisted in structured knowledge stores. Nothing lost between sessions.",
        "Persistence: Session continuity through shared context. The next session picks up exactly where this one ends.",
        "Testing: Test-gated task completion. No task marked done until tests pass. Quality enforced, not hoped for."
    ]
    add_bullet_list(doc, items)

    add_section_break(doc)

    # ═══════════════════════════════════════════════════════════════════════════
    # PRICING
    # ═══════════════════════════════════════════════════════════════════════════

    add_kicker(doc, "Commercial Model")
    add_h1(doc, "Fixed Price. No Surprises.")

    add_lead(doc,
        "We deliver at a fixed price per engagement. Not hourly rates. "
        "Not time-and-materials. A commitment to a defined scope at a defined price."
    )

    add_body(doc,
        "The price for this engagement reflects a strategic decision. "
        "Agentic Engineering is a delivery model many have not experienced. "
        "We believe the best demonstration is results that speak for themselves."
    )

    add_pull_quote(doc,
        "This is not a race to the bottom. This is a one-time showcase opportunity—"
        "an investment in demonstrating capability."
    )

    add_body(doc,
        "What you receive: the same quality, rigor, and professionalism as our standard engagements. "
        "No shortcuts. No reduced scope. Our best work."
    )

    add_section_break(doc)

    # ═══════════════════════════════════════════════════════════════════════════
    # GUARANTEES
    # ═══════════════════════════════════════════════════════════════════════════

    add_kicker(doc, "Commitment")
    add_h1(doc, "Our Guarantees")

    add_lead(doc, "We don't ask you to trust our judgment of quality. We ask you to define it.")

    add_h2(doc, "Code Quality")
    add_body(doc,
        "Show us what you consider great code—or beautiful code. "
        "From your codebase, from open source, from a book. "
        "We study it, understand its patterns, and adhere to that standard."
    )

    add_h2(doc, "Documentation")
    add_body(doc,
        "Show us architecture documents or technical writing that impressed you. "
        "Regardless of context or industry. We adapt to that standard. "
        "Stripe's API docs. AWS Well-Architected. Whatever made you say \"this is how it should be done.\""
    )

    add_h2(doc, "Delivery Walkthrough")
    add_body(doc,
        "At completion: a full one-hour walkthrough with your technical team. "
        "We demonstrate strict adherence to agreed parameters. "
        "Every screen. Every integration. Every business rule. Working against real data."
    )

    add_section_break(doc)

    # ═══════════════════════════════════════════════════════════════════════════
    # PARTNERSHIP
    # ═══════════════════════════════════════════════════════════════════════════

    add_kicker(doc, "Vision")
    add_h1(doc, "Partnership")

    add_lead(doc, "We are not looking for a transaction. We are looking for a partnership.")

    add_body(doc,
        "STARK Group's digital transformation spans multiple systems, teams, and years. "
        "We believe Agentic Engineering can serve that journey—not just for procurement, "
        "but across the portfolio. This engagement is an opportunity for both parties to evaluate fit."
    )

    add_pull_quote(doc,
        "Success: you complete this project confident in our capability, "
        "proud of the system, and wanting to continue."
    )

    doc.add_page_break()

    # ═══════════════════════════════════════════════════════════════════════════
    # SCOPE DEFINITION
    # ═══════════════════════════════════════════════════════════════════════════

    add_kicker(doc, "Scope Definition")
    add_h1(doc, "STARK Procurement")

    meta = doc.add_paragraph()
    meta.paragraph_format.space_after = Pt(16)
    run = meta.add_run("Version 1.0  •  March 2026  •  For Discussion")
    run.font.size = Pt(10)
    run.font.color.rgb = AA_LIGHT_GRAY
    run.font.name = "Arial"

    add_section_break(doc)

    # EXECUTIVE SUMMARY
    add_h2(doc, "Executive Summary")

    add_h3(doc, "What We Build")
    add_body(doc,
        "A Procurement System handling the complete Purchase-to-Pay workflow for STARK Group Denmark."
    )

    flow = doc.add_paragraph()
    flow.alignment = WD_ALIGN_PARAGRAPH.CENTER
    flow.paragraph_format.space_before = Pt(12)
    flow.paragraph_format.space_after = Pt(12)
    run = flow.add_run("PR Ingestion → PO Generation → Supplier Communication → Invoice Matching → Approval")
    run.bold = True
    run.font.size = Pt(11)
    run.font.name = "Arial"

    add_h3(doc, "What We Do Not Build")
    not_building = [
        "Warehouse Management (NYCE team)",
        "Financial Accounting (SAP Finance team)",
        "E-commerce Platform (ECom team)",
        "Demand Planning (Relex team)",
        "Contract Management (Icertis team)"
    ]
    add_bullet_list(doc, not_building)

    add_h3(doc, "Scale")

    scale_table = doc.add_table(rows=6, cols=2)
    scale_table.style = 'Table Grid'
    scale_data = [
        ("Metric", "Annual Volume"),
        ("Purchase Orders", "750,000"),
        ("PO Value", "€1.1B"),
        ("Suppliers", "10,000"),
        ("Branches", "84"),
        ("System Users", "30 procurement staff"),
    ]
    for row_idx, (col1, col2) in enumerate(scale_data):
        scale_table.rows[row_idx].cells[0].text = col1
        scale_table.rows[row_idx].cells[1].text = col2
        for cell in scale_table.rows[row_idx].cells:
            for p in cell.paragraphs:
                for run in p.runs:
                    run.font.size = Pt(10)
                    run.font.name = "Arial"
        if row_idx == 0:
            for cell in scale_table.rows[row_idx].cells:
                set_cell_shading(cell, "E6E6E1")
                for p in cell.paragraphs:
                    for run in p.runs:
                        run.bold = True

    doc.add_paragraph()
    add_section_break(doc)

    # USERS & ROLES
    add_h2(doc, "Users & Roles")

    add_h3(doc, "Population")
    users_table = doc.add_table(rows=4, cols=3)
    users_table.style = 'Table Grid'
    users_data = [
        ("Role", "Count", "Primary Function"),
        ("Buyer", "~20", "PR review, PO creation, bundling, invoice matching"),
        ("Approver", "~8", "PO approval, invoice approval, exception handling"),
        ("Admin", "~2", "System configuration, user support, reporting"),
    ]
    for row_idx, row_data in enumerate(users_data):
        for col_idx, cell_data in enumerate(row_data):
            users_table.rows[row_idx].cells[col_idx].text = cell_data
            for p in users_table.rows[row_idx].cells[col_idx].paragraphs:
                for run in p.runs:
                    run.font.size = Pt(10)
                    run.font.name = "Arial"
        if row_idx == 0:
            for cell in users_table.rows[row_idx].cells:
                set_cell_shading(cell, "E6E6E1")
                for p in cell.paragraphs:
                    for run in p.runs:
                        run.bold = True

    doc.add_paragraph()

    add_h3(doc, "Role Definitions")
    roles = [
        "Buyer: Day-to-day operations. Reviews PRs, creates POs, matches invoices, resolves discrepancies within tolerance. Cannot approve above personal authority limit.",
        "Approver: Decision authority for high-value transactions. Approves POs and invoices above threshold. Handles escalations. May perform Buyer functions.",
        "Admin: System configuration. Manages thresholds, supplier preferences, authority limits, delegations. No transactional authority beyond Approver role."
    ]
    add_bullet_list(doc, roles)

    add_section_break(doc)

    # DOMAIN STRUCTURE
    add_h2(doc, "Scope Structure")

    add_body(doc, "Five mutually exclusive domains. For each: IN (we deliver), OUT (others own), BOUNDARY (handoff point).")

    domains = [
        "User Interface: 16 screens, components, interactions",
        "Business Logic: Rules, calculations, workflows",
        "Data Layer: Storage, queries, synchronization",
        "Integrations: Kafka consumers/producers, REST fallback, events",
        "Operations: Infrastructure, deployment, monitoring"
    ]
    add_bullet_list(doc, domains)

    add_section_break(doc)

    # SCREENS
    add_h2(doc, "User Interface")

    add_h3(doc, "16 Screens — In Scope")

    screens_table = doc.add_table(rows=17, cols=3)
    screens_table.style = 'Table Grid'
    screens_data = [
        ("ID", "Name", "Purpose"),
        ("A1", "PR Inbox", "Incoming purchase requests"),
        ("A2", "PR Detail", "Individual PR with line items"),
        ("B1", "PO List", "Purchase orders overview"),
        ("B2", "PO Detail", "Individual PO with full details"),
        ("B3", "PO Kanban", "Visual pipeline view"),
        ("C1", "Bundling Workspace", "Group PRs into optimized POs"),
        ("D1", "Invoice List", "Supplier invoices overview"),
        ("D2", "Invoice Detail", "Individual invoice with matching"),
        ("D3", "Match Results", "PO vs Invoice comparison"),
        ("D4", "Discrepancy Queue", "Invoices requiring resolution"),
        ("E1", "Approval Queue", "Items awaiting approval"),
        ("E2", "Approval History", "Decision audit trail"),
        ("F1", "Supplier List", "Supplier master data"),
        ("F2", "Supplier Detail", "Individual supplier profile"),
        ("G1", "Dashboard", "Morning briefing, KPIs, action items"),
        ("H1", "Settings", "User preferences, thresholds"),
    ]
    for row_idx, row_data in enumerate(screens_data):
        for col_idx, cell_data in enumerate(row_data):
            screens_table.rows[row_idx].cells[col_idx].text = cell_data
            for p in screens_table.rows[row_idx].cells[col_idx].paragraphs:
                for run in p.runs:
                    run.font.size = Pt(10)
                    run.font.name = "Arial"
        if row_idx == 0:
            for cell in screens_table.rows[row_idx].cells:
                set_cell_shading(cell, "E6E6E1")
                for p in cell.paragraphs:
                    for run in p.runs:
                        run.bold = True

    doc.add_paragraph()
    add_section_break(doc)

    # INTEGRATIONS
    add_h2(doc, "Integrations")

    add_body(doc,
        "Kafka-native architecture. Per-source inbound topics. Per-channel outbound topics. "
        "REST fallback for non-Kafka sources. Customer provisions topics; we deliver specs and code."
    )

    add_h3(doc, "Inbound Sources")
    inbound = [
        "Relex: stark.procurement.inbound.prs.relex",
        "ECom: stark.procurement.inbound.prs.ecom",
        "SalesApp: stark.procurement.inbound.prs.salesapp",
        "Aspect4: stark.procurement.inbound.pos.aspect4"
    ]
    add_bullet_list(doc, inbound)

    add_h3(doc, "Outbound Channels")
    outbound = [
        "EDI: stark.procurement.outbound.pos.edi",
        "Email: stark.procurement.outbound.pos.email",
        "Finance: stark.procurement.outbound.finance.invoices"
    ]
    add_bullet_list(doc, outbound)

    add_section_break(doc)

    # EXCLUSIONS
    add_h2(doc, "Explicit Exclusions")

    add_h3(doc, "Not Delivered in This Phase")
    exclusions = [
        "Stock Transfer Orders — Requires NYCE WMS (Phase 2)",
        "3-Way Invoice Match — Requires goods receipt from NYCE (Phase 2)",
        "SAP Finance Integration — Direct API (Phase 2)",
        "Supplier Portal — Enhancement (Phase 3)",
        "Mobile Native App — Enhancement (Phase 3)",
        "Advanced Analytics/BI — Separate project (BI team)"
    ]
    add_bullet_list(doc, exclusions)

    add_h3(doc, "Dependencies Assumed Ready")
    deps = [
        "Relex PR feed — Automated replenishment",
        "ECom PR feed — Drop-shipment PRs",
        "Stark Output — EDI/Email delivery to suppliers",
        "SSO/IAM — User authentication",
        "STARK Kafka cluster — Topic provisioning",
        "Supplier Master Data — Via MDM"
    ]
    add_bullet_list(doc, deps)

    add_section_break(doc)

    # ACCEPTANCE
    add_h2(doc, "Acceptance Criteria")

    add_h3(doc, "Per Screen")
    screen_criteria = [
        "Renders correctly on desktop (1280px+) and tablet (768px+)",
        "All data loads from backend API",
        "Loading, error, and empty states implemented",
        "Keyboard navigation functional",
        "WCAG 2.1 AA compliance (basic)",
        "No console errors; TypeScript strict mode passes"
    ]
    add_bullet_list(doc, screen_criteria)

    add_h3(doc, "Per Integration")
    int_criteria = [
        "API documented (OpenAPI)",
        "Request validation implemented",
        "Rate limiting configured",
        "Authentication required",
        "Audit logging enabled",
        "Retry logic for transient failures"
    ]
    add_bullet_list(doc, int_criteria)

    add_section_break(doc)

    # SIGN-OFF
    add_h2(doc, "Sign-Off")

    add_body(doc, "Before final delivery, both parties confirm:")

    signoff_table = doc.add_table(rows=9, cols=3)
    signoff_table.style = 'Table Grid'
    signoff_data = [
        ("Item", "Vendor", "STARK"),
        ("All IN SCOPE items delivered", "☐", "☐"),
        ("All BOUNDARY interfaces documented", "☐", "☐"),
        ("All OUT OF SCOPE items acknowledged", "☐", "☐"),
        ("All exclusions agreed", "☐", "☐"),
        ("Acceptance criteria met", "☐", "☐"),
        ("Source code transferred", "☐", "☐"),
        ("Documentation complete", "☐", "☐"),
        ("Training delivered", "☐", "☐"),
    ]
    for row_idx, row_data in enumerate(signoff_data):
        for col_idx, cell_data in enumerate(row_data):
            signoff_table.rows[row_idx].cells[col_idx].text = cell_data
            for p in signoff_table.rows[row_idx].cells[col_idx].paragraphs:
                for run in p.runs:
                    run.font.size = Pt(10)
                    run.font.name = "Arial"
        if row_idx == 0:
            for cell in signoff_table.rows[row_idx].cells:
                set_cell_shading(cell, "E6E6E1")
                for p in cell.paragraphs:
                    for run in p.runs:
                        run.bold = True

    doc.add_paragraph()
    doc.add_paragraph()

    # CLOSING
    closing = doc.add_paragraph()
    closing.alignment = WD_ALIGN_PARAGRAPH.CENTER
    closing.paragraph_format.space_before = Pt(36)
    run = closing.add_run("—")
    run.font.size = Pt(14)
    run.font.color.rgb = AA_LIGHT_GRAY

    doc.add_paragraph()

    end = doc.add_paragraph()
    end.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = end.add_run("Agentic Agency")
    run.font.size = Pt(10)
    run.font.color.rgb = AA_MID_GRAY
    run.font.name = "Arial"

    tagline_end = doc.add_paragraph()
    tagline_end.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = tagline_end.add_run("Engineering > Prompting")
    run.italic = True
    run.font.size = Pt(9)
    run.font.color.rgb = AA_LIGHT_GRAY
    run.font.name = "Arial"

    # Save
    doc.save(OUTPUT_PATH)
    print(f"Document saved to: {OUTPUT_PATH}")
    return OUTPUT_PATH


if __name__ == "__main__":
    create_document()
