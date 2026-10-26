import os
import sys
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_number(num_pages)
            super().showPage()
        super().save()

    def draw_page_number(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        
        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(40, 11 * inch - 30, "Meadowlands — Archived Dead Code Inventory")
            self.drawRightString(8.5 * inch - 40, 11 * inch - 30, "Branch: archive/dead-code-backup")
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.5)
            self.line(40, 11 * inch - 34, 8.5 * inch - 40, 11 * inch - 34)

        # Footer
        text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(8.5 * inch - 40, 25, text)
        self.drawString(40, 25, "Confidential — Meadowlands Engineering Repository Report")
        self.setStrokeColor(colors.HexColor("#E2E8F0"))
        self.setLineWidth(0.5)
        self.line(40, 35, 8.5 * inch - 40, 35)
        self.restoreState()

def create_pdf(output_path):
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=42,
        bottomMargin=42
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0F172A'),
        spaceAfter=4
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#475569'),
        spaceAfter=12
    )

    h2_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#0F172A'),
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#334155'),
        spaceAfter=6
    )

    body_bold = ParagraphStyle(
        'BodyBold',
        parent=body_style,
        fontName='Helvetica-Bold'
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.white,
        alignment=0
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor('#1E293B')
    )

    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=table_cell_style,
        fontName='Helvetica-Bold'
    )

    tag_style = ParagraphStyle(
        'TagStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7,
        leading=9,
        textColor=colors.HexColor('#047857')
    )

    elements = []

    # Title & Metadata Banner
    elements.append(Paragraph("🌿 MEADOWLANDS — ARCHIVED FEATURES INVENTORY", title_style))
    elements.append(Paragraph(
        "<b>Comprehensive Audit of Dead Code & Subsystems Moved to</b> <font color='#0284C7'><code>archive/dead-code-backup</code></font><br/>"
        f"<b>Generated:</b> {datetime.now().strftime('%B %d, %Y')} &nbsp;|&nbsp; "
        "<b>Repository:</b> <code>abhi543/meadowlands</code> &nbsp;|&nbsp; "
        "<b>Total Archived Code:</b> 22 Files &bull; 9,409 Lines Removed",
        subtitle_style
    ))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#059669"), spaceAfter=10))

    # Executive Summary Box
    summary_text = (
        "<b>Executive Summary:</b> In accordance with repository optimization goals, inactive, unreferenced, "
        "and deprecated subsystems were pruned from the active production branch (<code>main</code>) and consolidated into "
        "the dedicated archive branch <b><code>archive/dead-code-backup</code></b> (commit <code>dbe5b25</code>). "
        "This eliminated <b>9,409 lines</b> of dead code across 22 files, reducing bundle weight, improving build latency, "
        "and eliminating mechanics that created unnecessary friction (such as the 3-color soil battery penalties)."
    )
    elements.append(Paragraph(summary_text, body_style))
    elements.append(Spacer(1, 6))

    # Overview Table
    elements.append(Paragraph("📊 Summary Matrix of Archived Features", h2_style))
    
    table_data = [
        [
            Paragraph("Subsystem / Feature", table_header_style),
            Paragraph("Category", table_header_style),
            Paragraph("Files Affected", table_header_style),
            Paragraph("Lines", table_header_style),
            Paragraph("Archival Rationale", table_header_style)
        ],
        [
            Paragraph("<b>Wilderness 3D Exploration</b>", table_cell_bold),
            Paragraph("Mini-Game", table_cell_style),
            Paragraph("3 files (<code>WildExpedition3D.tsx</code>, etc.)", table_cell_style),
            Paragraph("<b>2,739</b>", table_cell_bold),
            Paragraph("Unreferenced 3D canvas; heavy Three.js bundle cost.", table_cell_style)
        ],
        [
            Paragraph("<b>Estate Dispatch Center</b>", table_cell_bold),
            Paragraph("Logistics", table_cell_style),
            Paragraph("1 file (<code>EstateDispatchCenterModal.tsx</code>)", table_cell_style),
            Paragraph("<b>1,820</b>", table_cell_bold),
            Paragraph("Legacy delivery mission UI superseded by unified dispatch.", table_cell_style)
        ],
        [
            Paragraph("<b>Sluice Gate Control Console</b>", table_cell_bold),
            Paragraph("Hydraulics", table_cell_style),
            Paragraph("1 file (<code>SluiceGateControlModal.tsx</code>)", table_cell_style),
            Paragraph("<b>1,052</b>", table_cell_bold),
            Paragraph("Redundant manual valve console; hydraulics automated.", table_cell_style)
        ],
        [
            Paragraph("<b>3-Color Soil Battery & Tired Soil</b>", table_cell_bold),
            Paragraph("Agronomy", table_cell_style),
            Paragraph("5 files (<code>soilEnergyEngine.ts</code>, Grid, etc.)", table_cell_style),
            Paragraph("<b>~780</b>", table_cell_bold),
            Paragraph("Depleted soil penalties, mini-bars & burnout removed.", table_cell_style)
        ],
        [
            Paragraph("<b>Estate Menagerie Showcase</b>", table_cell_bold),
            Paragraph("Sanctuary", table_cell_style),
            Paragraph("1 file (<code>EstateMenagerieModal.tsx</code>)", table_cell_style),
            Paragraph("<b>763</b>", table_cell_bold),
            Paragraph("Merged into unified Prehistoric Sanctuary Panel.", table_cell_style)
        ],
        [
            Paragraph("<b>Crisis Defense & Alert Suite</b>", table_cell_bold),
            Paragraph("Events", table_cell_style),
            Paragraph("4 files (<code>CrisisDefenseModal.tsx</code>, etc.)", table_cell_style),
            Paragraph("<b>727</b>", table_cell_bold),
            Paragraph("Unused standalone crisis modals & emergency clock widgets.", table_cell_style)
        ],
        [
            Paragraph("<b>High-Stakes Contract Deck</b>", table_cell_bold),
            Paragraph("Economy", table_cell_style),
            Paragraph("1 file (<code>HighStakesContractDeck.tsx</code>)", table_cell_style),
            Paragraph("<b>578</b>", table_cell_bold),
            Paragraph("Unreferenced futures contracts card interface.", table_cell_style)
        ],
        [
            Paragraph("<b>Developer Test Suites</b>", table_cell_bold),
            Paragraph("Dev / Test", table_cell_style),
            Paragraph("3 files (<code>server.ts</code>, <code>overflow.ts</code>)", table_cell_style),
            Paragraph("<b>568</b>", table_cell_bold),
            Paragraph("Stand-alone websocket and overflow scripts outside app.", table_cell_style)
        ],
        [
            Paragraph("<b>Hydrology Gauges & Offline Modal</b>", table_cell_bold),
            Paragraph("Hydraulics", table_cell_style),
            Paragraph("2 files (<code>EstateHydrologyGauge.tsx</code>, etc.)", table_cell_style),
            Paragraph("<b>448</b>", table_cell_bold),
            Paragraph("Duplicate analog dials & offline catchup prompt.", table_cell_style)
        ],
        [
            Paragraph("<b>Legacy Placeholder Stubs</b>", table_cell_bold),
            Paragraph("Routing", table_cell_style),
            Paragraph("2 files (<code>AnimalPanel.tsx</code>, <code>WildTab.tsx</code>)", table_cell_style),
            Paragraph("<b>16</b>", table_cell_bold),
            Paragraph("Obsolete empty stub components.", table_cell_style)
        ],
        [
            Paragraph("<b>TOTALS</b>", table_cell_bold),
            Paragraph("<b>All Systems</b>", table_cell_bold),
            Paragraph("<b>22 Files</b>", table_cell_bold),
            Paragraph("<b>9,409</b>", table_cell_bold),
            Paragraph("<b>Safely preserved on archive branch</b>", table_cell_bold)
        ]
    ]

    summary_table = Table(table_data, colWidths=[110, 60, 140, 45, 185])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0F172A')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -2), [colors.HexColor('#FFFFFF'), colors.HexColor('#F8FAFC')]),
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ]))
    elements.append(summary_table)
    elements.append(Spacer(1, 14))

    # Detailed Feature Breakdowns
    elements.append(Paragraph("🔍 Detailed Architectural Breakdown of Archived Features", h2_style))

    features = [
        {
            "title": "1. Wilderness 3D Exploration & Safari Expedition System",
            "files": ["src/components/game/WildExpedition3D.tsx (1,573 lines)", "src/components/game/WildernessPanel.tsx (1,153 lines)", "src/components/game/WildTab.tsx (13 lines)"],
            "total_lines": "2,739 lines",
            "status": "Archived",
            "desc": (
                "<b>Overview:</b> A complete interactive 3D safari and wildlife capture subsystem built with Three.js/Canvas. "
                "Players were able to deploy expeditions into procedural biomes (Taiga Forest, Volcanic Crag, Savannah) with dynamic "
                "fog-of-war, roving megafauna track scouting, tranquilizer dart ballistics, cage deployment traps, and captive specimen "
                "containment transport.<br/>"
                "<b>Reason for Removal:</b> Three.js rendering added substantial client-side bundle overhead. The gameplay was siloed "
                "away from core farmstead loop mechanics and was replaced by the streamlined Prehistoric Sanctuary expedition system."
            )
        },
        {
            "title": "2. Estate Task & Logistics Dispatch Center",
            "files": ["src/components/game/EstateDispatchCenterModal.tsx (1,820 lines)"],
            "total_lines": "1,820 lines",
            "status": "Archived",
            "desc": (
                "<b>Overview:</b> A large-scale logistics orchestration modal managing estate courier routes, bulk freight contracts, "
                "cross-sector wagon logistics, export tariffs, and worker priority dispatching.<br/>"
                "<b>Reason for Removal:</b> The modal was unreferenced in the main UI navigation. Task management was unified into "
                "the modern Master Worker (v2.0) automation system and the high-urgency Event Engine."
            )
        },
        {
            "title": "3. Sluice Gate Control Console & Canal Hydro-Valves",
            "files": ["src/components/game/SluiceGateControlModal.tsx (1,052 lines)"],
            "total_lines": "1,052 lines",
            "status": "Archived",
            "desc": (
                "<b>Overview:</b> An elaborate multi-canal manual hydraulics console with pressure wheels, weir gate actuators, "
                "canal spillway emergency overflow levers, and individual gate percentage regulators across 4 estate canals.<br/>"
                "<b>Reason for Removal:</b> Hydraulic simulation was refactored into the automated Gravity Tower and hydraulic "
                "fail-safe engine, rendering the manual 1,000-line mechanical valve modal redundant."
            )
        },
        {
            "title": "4. 3-Color Soil Battery & Tired Soil Mechanics",
            "files": [
                "src/game/soilEnergyEngine.ts (178 lines)",
                "src/components/game/FarmGrid.tsx (310 lines modified/pruned)",
                "src/game/store.ts (190 lines modified/pruned)",
                "src/components/game/GuidePanel.tsx (50 lines modified)",
                "src/lib/soundEffects.ts (52 lines removed)"
            ],
            "total_lines": "~780 lines pruned",
            "status": "Permanently Removed",
            "desc": (
                "<b>Overview:</b> The color-coded agronomy battery system featuring Green (Leaf/Stem), Yellow (Root/Bulb), and Red (Fruit/Flower) "
                "nutrient energy meters. Crops planted without matching battery channels were flagged as 'Tired Soil', suffering 2x growth "
                "duration and being clamped at 1x harvest yield. Heatwaves caused battery burnout, while torrential rain leached nutrients.<br/>"
                "<b>Reason for Removal:</b> Per user directive, the battery meters created excessive visual clutter (mini-bars over every plot) "
                "and punitive penalties that clashed with modern soil gas and dynamic moisture mechanics."
            )
        },
        {
            "title": "5. Estate Menagerie Showcase & Prehistoric Habitat Modal",
            "files": ["src/components/game/EstateMenagerieModal.tsx (763 lines)"],
            "total_lines": "763 lines",
            "status": "Archived",
            "desc": (
                "<b>Overview:</b> A dedicated sanctuary menagerie showcase displaying prehistoric creatures, habitat comfort ratings, "
                "paleo-temperature requirements, and global aura bonuses (e.g. Dimetrodon Geothermal Radiance, Mammoth Permafrost).<br/>"
                "<b>Reason for Removal:</b> All creature inspection, genetics, breeding, and habitat controls were consolidated into "
                "<code>PrehistoricSanctuaryPanel.tsx</code>, rendering this separate modal duplicate code."
            )
        },
        {
            "title": "6. Emergency Crisis Defense & Countdown Timer Suite",
            "files": [
                "src/components/events/CrisisDefenseModal.tsx (271 lines)",
                "src/components/events/EventEmergencyModal.tsx (249 lines)",
                "src/components/events/EventTickingClock.tsx (119 lines)",
                "src/components/events/EventEmergencyBanner.tsx (88 lines)"
            ],
            "total_lines": "727 lines",
            "status": "Archived",
            "desc": (
                "<b>Overview:</b> A standalone crisis triage and defense modal suite designed for sudden disasters (locust swarms, flash floods, "
                "plasma storms). Featured sandbag defenses, emergency triage actions, audio sirens, and an animated countdown clock.<br/>"
                "<b>Reason for Removal:</b> The event system was migrated to the non-intrusive Event Engine notification system and "
                "dynamic weather widget."
            )
        },
        {
            "title": "7. High-Stakes Agricultural Commodity Contract Deck",
            "files": ["src/components/game/HighStakesContractDeck.tsx (578 lines)"],
            "total_lines": "578 lines",
            "status": "Archived",
            "desc": (
                "<b>Overview:</b> A card-deck UI offering timed, high-reward futures contracts for bulk crop deliveries with severe forfeit "
                "penalties, fluctuating market multipliers, and merchant guild standing.<br/>"
                "<b>Reason for Removal:</b> Unused by the main interface; commercial contracts were merged into standard barn orders and artisan trade."
            )
        },
        {
            "title": "8. Developer WebSocket Telemetry & Flood Surge Test Harnesses",
            "files": [
                "scripts/test_overflow_surge.ts (234 lines)",
                "examples/websocket/frontend.tsx (196 lines)",
                "examples/websocket/server.ts (138 lines)"
            ],
            "total_lines": "568 lines",
            "status": "Archived",
            "desc": (
                "<b>Overview:</b> Experimental WebSocket server/client prototype for real-time telemetry streaming and an offline hydraulic "
                "surge stress-test script.<br/>"
                "<b>Reason for Removal:</b> These were standalone development artifacts located outside the core Next.js production build."
            )
        },
        {
            "title": "9. Analog Hydrology Telemetry & Offline Return Catchup",
            "files": [
                "src/components/game/EstateHydrologyGauge.tsx (251 lines)",
                "src/components/game/OfflineHydrologyReturnModal.tsx (197 lines)"
            ],
            "total_lines": "448 lines",
            "status": "Archived",
            "desc": (
                "<b>Overview:</b> Circular needle gauge dials displaying canal pressure and head levels, alongside an offline return dialog "
                "simulating water accumulation during inactivity.<br/>"
                "<b>Reason for Removal:</b> Modern hydrology telemetry was merged directly into the top bar header and canal inspection cards."
            )
        }
    ]

    for feat in features:
        card_content = []
        card_content.append(Paragraph(f"<b>{feat['title']}</b> &nbsp; [<i>{feat['total_lines']}</i>]", h2_style))
        card_content.append(Paragraph(feat['desc'], body_style))
        
        file_bullets = "<b>Archived Files:</b><br/>" + "".join([f"&bull; <code>{f}</code><br/>" for f in feat['files']])
        card_content.append(Paragraph(file_bullets, body_style))
        card_content.append(Spacer(1, 4))
        card_content.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#E2E8F0"), spaceAfter=8))
        elements.append(KeepTogether(card_content))

    # How to Restore Section
    restore_box = []
    restore_box.append(Paragraph("🔄 How to Access or Restore Any Feature", h2_style))
    restore_instructions = (
        "All 22 archived files and their complete historical implementations are preserved with full commit history.<br/>"
        "&bull; <b>To view the branch on GitHub:</b> <code>https://github.com/abhi543/meadowlands/tree/archive/dead-code-backup</code><br/>"
        "&bull; <b>To checkout the archive locally:</b> <code>git checkout archive/dead-code-backup</code><br/>"
        "&bull; <b>To cherry-pick a specific file back into main:</b><br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;<code>git checkout archive/dead-code-backup -- src/components/game/EstateDispatchCenterModal.tsx</code>"
    )
    restore_box.append(Paragraph(restore_instructions, body_style))
    elements.append(KeepTogether(restore_box))

    doc.build(elements, canvasmaker=NumberedCanvas)
    print(f"PDF successfully generated at: {output_path}")

if __name__ == '__main__':
    target = os.path.abspath(r"c:\python\python_marathon\generalist\apps\meadsland\archived_dead_code_features_report.pdf")
    create_pdf(target)
