"""
Meadowlands Hydrology & Water Engineering Manual Generator
Produces a publication-grade PDF documentation of the entire water system.
"""

import os
import sys
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas

# Palette definition
NAVY_DEEP = colors.HexColor('#0a2540')
OCEAN_BLUE = colors.HexColor('#0284c7')
SKY_LIGHT = colors.HexColor('#e0f2fe')
TEAL_MINT = colors.HexColor('#0d9488')
EMERALD_GREEN = colors.HexColor('#10b981')
AMBER_GOLD = colors.HexColor('#d97706')
ROSE_RED = colors.HexColor('#e11d48')
SLATE_DARK = colors.HexColor('#1e293b')
SLATE_MUTED = colors.HexColor('#475569')
SLATE_LIGHT = colors.HexColor('#f1f5f9')
BORDER_COLOR = colors.HexColor('#cbd5e1')
WHITE = colors.HexColor('#ffffff')

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(SLATE_MUTED)

        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(36, 11 * inch - 26, "MEADOWLANDS ESTATE • COMPLETE HYDROLOGY & WATER ENGINEERING MANUAL")
            self.setFont("Helvetica", 8)
            self.drawRightString(8.5 * inch - 36, 11 * inch - 26, "FLUID DYNAMICS & FAIL-SAFE MANUAL")
            self.setStrokeColor(BORDER_COLOR)
            self.setLineWidth(0.5)
            self.line(36, 11 * inch - 30, 8.5 * inch - 36, 11 * inch - 30)

        # Footer (all pages)
        self.setStrokeColor(BORDER_COLOR)
        self.setLineWidth(0.5)
        self.line(36, 32, 8.5 * inch - 36, 32)
        self.setFont("Helvetica", 8)
        self.drawString(36, 20, f"Confidential & Technical Reference • Meadowlands v2.5 Hydrology Suite")
        self.drawRightString(8.5 * inch - 36, 20, f"Page {self._pageNumber} of {page_count}")
        self.restoreState()


def build_pdf(output_path: str):
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=42,
        bottomMargin=42
    )

    styles = getSampleStyleSheet()

    # Custom typography styles
    title_style = ParagraphStyle(
        'DocTitle',
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=NAVY_DEEP,
        spaceAfter=4
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=OCEAN_BLUE,
        spaceAfter=12
    )
    h1_style = ParagraphStyle(
        'Heading1_Custom',
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=NAVY_DEEP,
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    )
    h2_style = ParagraphStyle(
        'Heading2_Custom',
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=OCEAN_BLUE,
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    )
    body_style = ParagraphStyle(
        'Body_Custom',
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=SLATE_DARK,
        spaceAfter=6
    )
    body_bold = ParagraphStyle(
        'Body_Bold_Custom',
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=13,
        textColor=SLATE_DARK
    )
    callout_style = ParagraphStyle(
        'Callout_Text',
        fontName='Helvetica-Oblique',
        fontSize=8.5,
        leading=12,
        textColor=NAVY_DEEP
    )
    table_cell = ParagraphStyle(
        'TableCell',
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=SLATE_DARK
    )
    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11,
        textColor=SLATE_DARK
    )
    table_header = ParagraphStyle(
        'TableHeader',
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=WHITE
    )

    story = []

    # ----------------------------------------------------
    # COVER / HEADER BANNER
    # ----------------------------------------------------
    banner_data = [
        [
            Paragraph("<b>MEADOWLANDS ESTATE WATER & HYDROLOGICAL ENGINEERING MANUAL</b>", title_style),
        ],
        [
            Paragraph("A Comprehensive Technical Guide to Mass-Conservation Fluid Dynamics, Reservoir Hierarchies, Automated 3-Stage Load Shedding, and Flood Mitigation", subtitle_style),
        ],
        [
            Paragraph(f"<b>System:</b> Hydrology Core v2.5.4 &bull; <b>Target:</b> Estate Agronomy, Bio-Lab & Staff Support &bull; <b>Published:</b> {datetime.now().strftime('%B %Y')}", body_style)
        ]
    ]
    banner_table = Table(banner_data, colWidths=[540])
    banner_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), SLATE_LIGHT),
        ('BOX', (0, 0), (-1, -1), 1, OCEAN_BLUE),
        ('PADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, -1), (-1, -1), 8),
    ]))
    story.append(banner_table)
    story.append(Spacer(1, 10))

    # Executive Overview
    story.append(Paragraph("1. Executive Summary & Core Physical Laws", h1_style))
    story.append(Paragraph(
        "The Meadowlands Hydrological Architecture is a fully closed-loop, physical fluid-dynamics simulation. "
        "Unlike generic idle farming mechanics where water is a simple consumable number, Meadowlands governs water through "
        "<b>Rigorous Mass Balance</b>: every liter of water originates from precipitation, deep subterranean artesian strata, or manual dew harvesting, "
        "and is tracked through storage buffers, gravitational conduits, soil saturation profiles, atmospheric evaporation, and percolation feedback.",
        body_style
    ))

    # Core Formula Callout
    formula_data = [
        [
            Paragraph(
                "<b>THE FUNDAMENTAL ESTATE WATER EQUATION:</b><br/>"
                "&Delta;Storage (Cistern + Tower + Aquifer) = [Precipitation + Subsoil Recharge + Dew Catchment] "
                "- [Furrow Discharge + Bio-Lab Cooling + Crew Hydration + Evapotranspiration + Seepage Loss]<br/>"
                "&bull; <i>Percolation Feedback:</i> 30% of all furrow discharge and excess rainwater percolates back down into the Subterranean Aquifer.<br/>"
                "&bull; <i>Moisture Scale:</i> 1% soil moisture across 1 arable plot is equivalent to precisely 2.5 Liters of water volume.",
                callout_style
            )
        ]
    ]
    formula_table = Table(formula_data, colWidths=[540])
    formula_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), SKY_LIGHT),
        ('BOX', (0, 0), (-1, -1), 1, TEAL_MINT),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(formula_table)
    story.append(Spacer(1, 10))

    # ----------------------------------------------------
    # SECTION 2: THE 3-RESERVOIR TRIAD
    # ----------------------------------------------------
    story.append(Paragraph("2. The Three Primary Reservoirs & Hydraulic Capacities", h1_style))
    story.append(Paragraph(
        "Water in Meadowlands is segmented across three specialized reservoirs, each operating at distinct hydrostatic pressures and geological elevations:",
        body_style
    ))

    res_data = [
        [
            Paragraph("Reservoir", table_header),
            Paragraph("Role & Natural Source", table_header),
            Paragraph("Base Capacity", table_header),
            Paragraph("Max Tier (T5)", table_header),
            Paragraph("Dynamics & Key Operations", table_header)
        ],
        [
            Paragraph("<b>🌧️ Rain Catchment Cistern</b>", table_cell_bold),
            Paragraph("Surface collection basin capturing atmospheric precipitation directly from rainfall & downpours.", table_cell),
            Paragraph("1,500 L", table_cell),
            Paragraph("75,000 L<br/><i>(Mega-Basin)</i>", table_cell),
            Paragraph("Inflow rate depends on weather condition (up to +120 L/min during storms). Transfers 100L batches to Gravity Tower via manual or worker lever.", table_cell)
        ],
        [
            Paragraph("<b>🗼 Elevated Gravity Tower</b>", table_cell_bold),
            Paragraph("Pressurized head-pressure tank on timber or steel framework supplying all furrow gates, labs, and crews.", table_cell),
            Paragraph("800 L", table_cell),
            Paragraph("50,000 L<br/><i>(Mega-Citadel)</i>", table_cell),
            Paragraph("Drives all estate water consumers. Governed by the Automated 3-Stage Load Shedding Ladder. Receives +15 L/s overflow surge when either Cistern or Aquifer reaches 100%.", table_cell)
        ],
        [
            Paragraph("<b>🚰 Deep Subsoil Aquifer</b>", table_cell_bold),
            Paragraph("Natural subterranean geological groundwater table situated beneath the estate subsoil.", table_cell),
            Paragraph("3,000 L", table_cell),
            Paragraph("80,000 L<br/><i>(Abyssal Titan)</i>", table_cell),
            Paragraph("Continuous natural artesian recharge (+8.0 L/min baseline). Receives +30% irrigation percolation. Supplies emergency float siphon valve during acute tower droughts.", table_cell)
        ],
    ]
    res_table = Table(res_data, colWidths=[110, 140, 65, 75, 150])
    res_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), NAVY_DEEP),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, SLATE_LIGHT]),
        ('PADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(res_table)
    story.append(Spacer(1, 10))

    # ----------------------------------------------------
    # SECTION 3: CANAL NETWORK ENGINEERING TIERS
    # ----------------------------------------------------
    story.append(Paragraph("3. Canal Network Progression & Engineering Physics", h1_style))
    story.append(Paragraph(
        "Water discharged from the Elevated Gravity Tower flows through the estate's canal network across unlocked arable plots (01–12). "
        "The physical efficiency of the canal depends on the installed engineering tier:",
        body_style
    ))

    canal_data = [
        [
            Paragraph("Tier & Name", table_header),
            Paragraph("Min Lvl", table_header),
            Paragraph("Coin Cost", table_header),
            Paragraph("Seepage Loss", table_header),
            Paragraph("Evap / Min", table_header),
            Paragraph("Saturation Cap & Protection", table_header)
        ],
        [
            Paragraph("<b>Tier 1: Hand-Dug Furrows</b>", table_cell_bold),
            Paragraph("Lv 1", table_cell),
            Paragraph("🪙 0", table_cell),
            Paragraph("<font color='#e11d48'><b>35% Seepage</b></font>", table_cell),
            Paragraph("3.0%", table_cell),
            Paragraph("100% (High risk of crop waterlogging & Root Rot if gates left open)", table_cell)
        ],
        [
            Paragraph("<b>Tier 2: Clay-Lined Trenches</b>", table_cell_bold),
            Paragraph("Lv 3", table_cell),
            Paragraph("🪙 18,500", table_cell),
            Paragraph("<font color='#10b981'><b>0% (Sealed)</b></font>", table_cell),
            Paragraph("3.0%", table_cell),
            Paragraph("100% (Impermeable compacted clay bed eliminates all subterranean seepage loss)", table_cell)
        ],
        [
            Paragraph("<b>Tier 3: Timber Flumes</b>", table_cell_bold),
            Paragraph("Lv 5", table_cell),
            Paragraph("🪙 65,000", table_cell),
            Paragraph("<font color='#10b981'><b>0% (Sealed)</b></font>", table_cell),
            Paragraph("1.5%", table_cell),
            Paragraph("<b>80% Ceiling (Root Rot Immune!)</b> - Elevated sluices baffle excessive flow", table_cell)
        ],
        [
            Paragraph("<b>Tier 4: Sub-Surface Conduit</b>", table_cell_bold),
            Paragraph("Lv 7", table_cell),
            Paragraph("🪙 180,000", table_cell),
            Paragraph("<font color='#10b981'><b>0% (Sealed)</b></font>", table_cell),
            Paragraph("1.0%", table_cell),
            Paragraph("<b>75% Ceiling</b> - Pressurized micro-drip delivery directly to plant roots", table_cell)
        ],
    ]
    canal_table = Table(canal_data, colWidths=[120, 45, 55, 75, 55, 190])
    canal_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), NAVY_DEEP),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, SLATE_LIGHT]),
        ('PADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(canal_table)
    story.append(Spacer(1, 14))

    # story.append(Spacer(1, 10))

    # ----------------------------------------------------
    # SECTION 4: SOIL MOISTURE ZONES & PHENOLOGY
    # ----------------------------------------------------
    story.append(Paragraph("4. Soil Moisture Zones, Phenology & Automatic Shutoff Limiter", h1_style))
    story.append(Paragraph(
        "Each arable plot features real-time soil moisture percentage (0% to 100%). Crop phenology and final harvest yield are directly modulated by the soil moisture zone:",
        body_style
    ))

    zone_data = [
        [
            Paragraph("Zone", table_header),
            Paragraph("Moisture Range", table_header),
            Paragraph("Crop Growth Velocity", table_header),
            Paragraph("Crop Quality & Yield Effect", table_header),
            Paragraph("Recommended Operational Action", table_header)
        ],
        [
            Paragraph("<b>🌵 Desiccated</b>", table_cell_bold),
            Paragraph("0% – 15%", table_cell),
            Paragraph("0.25x (Frozen growth)", table_cell),
            Paragraph("-50% harvest yield; high withering penalty", table_cell),
            Paragraph("Immediate emergency irrigation required! Open master sluice gates.", table_cell)
        ],
        [
            Paragraph("<b>⚠️ Parched</b>", table_cell_bold),
            Paragraph("16% – 40%", table_cell),
            Paragraph("0.70x (Sluggish growth)", table_cell),
            Paragraph("Normal quality; vulnerable to midday heatwaves", table_cell),
            Paragraph("Open sluice gates or pump cistern water to reach optimal zone.", table_cell)
        ],
        [
            Paragraph("<b>🌿 Optimal Range</b>", table_cell_bold),
            Paragraph("40.1% – 80%", table_cell),
            Paragraph("<b>1.25x – 1.40x (Peak Speed)</b>", table_cell),
            Paragraph("<b>+25% Crop Quality Bonus; +20% Bonus Yield</b>", table_cell),
            Paragraph("Ideal agronomic balance. Calibrate Automatic Shutoff Limiter to ~75%.", table_cell)
        ],
        [
            Paragraph("<b>💧 Saturated</b>", table_cell_bold),
            Paragraph("80.1% – 95%", table_cell),
            Paragraph("1.00x (Standard)", table_cell),
            Paragraph("Soil heavy; water film dampens respiration", table_cell),
            Paragraph("Lock sluice gates to allow natural morning thermodynamic evaporation.", table_cell)
        ],
        [
            Paragraph("<b>☠️ Waterlogged (Root Rot)</b>", table_cell_bold),
            Paragraph("95.1% – 100%", table_cell),
            Paragraph("0.10x (Severe decay)", table_cell),
            Paragraph("<b>Crop destruction within 3 minutes if unaddressed!</b>", table_cell),
            Paragraph("Open Emergency Spillway gate immediately and clear silt grates.", table_cell)
        ],
    ]
    zone_table = Table(zone_data, colWidths=[90, 75, 105, 135, 135])
    zone_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), NAVY_DEEP),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, SLATE_LIGHT]),
        ('PADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(zone_table)
    story.append(Spacer(1, 8))

    # Auto-Shutoff explanation
    story.append(Paragraph(
        "<b>The Automatic Saturation Limiter (Slider 50% – 95%):</b><br/>"
        "On the Water page, estate managers can configure the automatic shutoff threshold (default: 75%). "
        "During live gate irrigation, once the average moisture across all unlocked plots reaches this calibrated ceiling, "
        "the master sluice gate snaps shut automatically, preventing accidental soil flooding and crop root rot while offline.",
        body_style
    ))
    story.append(Spacer(1, 10))

    # ----------------------------------------------------
    # SECTION 5: ELEVATED TOWER 3-STAGE LOAD-SHEDDING & EMERGENCY SIPHON
    # ----------------------------------------------------
    story.append(Paragraph("5. The Automated 3-Stage Load-Shedding Ladder & Emergency Siphon", h1_style))
    story.append(Paragraph(
        "The Elevated Gravity Tower acts as the pressurized heart of the estate. To protect critical high-value biological assets "
        "(such as incubated specimens in the Amber Bio-Lab) during severe droughts or player offline absence, the estate incorporates "
        "an automated 3-stage hydraulic load-shedding ladder:",
        body_style
    ))

    stage_data = [
        [
            Paragraph("Stage & Trigger Level", table_header),
            Paragraph("Status & Operational State", table_header),
            Paragraph("Crop Furrow Drain", table_header),
            Paragraph("Amber Bio-Lab Cooling", table_header),
            Paragraph("Worker Bunkhouse Station", table_header)
        ],
        [
            Paragraph("<b>Stage 0: Nominal State</b><br/>Tower &gt; 200 Liters (&gt;25%)", table_cell_bold),
            Paragraph("<font color='#10b981'><b>Full Estate Operation</b></font><br/>All municipal and agronomic lines active.", table_cell),
            Paragraph("12.0 L/s (Full flow to open canal lines)", table_cell),
            Paragraph("0.05 L/s per active chamber", table_cell),
            Paragraph("0.015 L/s per active worker", table_cell)
        ],
        [
            Paragraph("<b>Stage 1: Crop Conservation</b><br/>80L – 200 Liters (10%–25%)", table_cell_bold),
            Paragraph("<font color='#d97706'><b>Agronomic Load Shedding</b></font><br/>Furrow gates forcibly isolated to preserve head.", table_cell),
            Paragraph("<font color='#e11d48'><b>FORCIBLY SHUT (0 L/s)</b></font><br/>Prevents tower drain to dirt.", table_cell),
            Paragraph("0.05 L/s per active chamber (Preserved)", table_cell),
            Paragraph("0.015 L/s per active worker (Preserved)", table_cell)
        ],
        [
            Paragraph("<b>Stage 2: Crew Rationing</b><br/>1L – 79 Liters (1%–10%)", table_cell_bold),
            Paragraph("<font color='#ea580c'><b>Staff Rationing Active</b></font><br/>Domestic consumption halved.", table_cell),
            Paragraph("0 L/s (Isolated)", table_cell),
            Paragraph("0.05 L/s per active chamber (Preserved)", table_cell),
            Paragraph("<font color='#d97706'><b>Halved to 0.0075 L/s</b></font><br/>Emergency canteen rations", table_cell)
        ],
        [
            Paragraph("<b>Stage 3: Cryo-Standby</b><br/>0 Liters (Total Depletion)", table_cell_bold),
            Paragraph("<font color='#e11d48'><b>Full Lockdown & Specimen Cryo-Lock</b></font><br/>Specimens frozen in stasis; 0% decay.", table_cell),
            Paragraph("0 L/s", table_cell),
            Paragraph("<font color='#0284c7'><b>0 L/s (CRYO-STANDBY)</b></font><br/>Bio-Lab specimens cannot die", table_cell),
            Paragraph("0 L/s (Suspended)", table_cell)
        ],
    ]
    stage_table = Table(stage_data, colWidths=[120, 110, 105, 105, 100])
    stage_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), NAVY_DEEP),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, SLATE_LIGHT]),
        ('PADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(stage_table)
    story.append(Spacer(1, 8))

    # Emergency Siphon Highlight Box
    siphon_box_data = [
        [
            Paragraph(
                "<b>🚰 THE AQUIFER SIPHON FEED VALVE (CONTINUOUS & EMERGENCY MODES):</b><br/>"
                "&bull; <b>Installation:</b> Crafted in the Workshop or installed directly via the Water Tab (Cost: 250 Coins).<br/>"
                "&bull; <b>Continuous Artesian Feed (Default):</b> Siphons clean groundwater from the Deep Aquifer at <b>+2.0 L/s</b> continuously whenever the Elevated Gravity Tower has headroom, maintaining 100% full capacity and constant pressurized head.<br/>"
                "&bull; <b>Emergency Reserve Mode (Toggleable):</b> For water conservation, can be switched to trigger only when the tower drops &le; 80L (refilling up to 200L).<br/>"
                "&bull; <b>Total Drought & Offline Immunity:</b> As long as the Aquifer contains water, the Gravity Tower is continuously replenished and specimens never enter Cryo-Standby!",
                callout_style
            )
        ]
    ]
    siphon_box_table = Table(siphon_box_data, colWidths=[540])
    siphon_box_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#ecfdf5')),
        ('BOX', (0, 0), (-1, -1), 1, EMERALD_GREEN),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(siphon_box_table)
    story.append(Spacer(1, 14))

    story.append(Spacer(1, 10))

    # ----------------------------------------------------
    # SECTION 6: ATMOSPHERIC WEATHER & FLASH FLOOD MITIGATION
    # ----------------------------------------------------
    story.append(Paragraph("6. Micro-Climate Profiles, Flash Floods & Emergency Spillway", h1_style))
    story.append(Paragraph(
        "Meadowlands features 8 dynamic meteorological conditions. Each weather pattern impacts precipitation inflow into the Cistern "
        "and thermodynamic evaporation from the arable furrows:",
        body_style
    ))

    weather_data = [
        [
            Paragraph("Weather Condition", table_header),
            Paragraph("Precipitation Inflow", table_header),
            Paragraph("Ambient Temp & Humidity", table_header),
            Paragraph("Evaporative Impact", table_header),
            Paragraph("Special Atmospheric Effect", table_header)
        ],
        [
            Paragraph("<b>☀️ Sunny / Clear</b>", table_cell_bold),
            Paragraph("0 L/min", table_cell),
            Paragraph("24°C • 45% RH", table_cell),
            Paragraph("Nominal (+2.2%/min)", table_cell),
            Paragraph("Standard baseline field conditions.", table_cell)
        ],
        [
            Paragraph("<b>🌧️ Light Rain</b>", table_cell_bold),
            Paragraph("+45 L/min", table_cell),
            Paragraph("18°C • 80% RH", table_cell),
            Paragraph("Low (+0.6%/min)", table_cell),
            Paragraph("Refills Rain Cistern continuously.", table_cell)
        ],
        [
            Paragraph("<b>⛈️ Downpour / Storm</b>", table_cell_bold),
            Paragraph("+120 L/min", table_cell),
            Paragraph("15°C • 95% RH", table_cell),
            Paragraph("Negligible (+0.1%/min)", table_cell),
            Paragraph("Rapid cistern refill; soil saturates quickly.", table_cell)
        ],
        [
            Paragraph("<b>🌈 Rainbow Event</b>", table_cell_bold),
            Paragraph("+25 L/min", table_cell),
            Paragraph("22°C • 60% RH", table_cell),
            Paragraph("<b>0.0% / min (FROZEN)</b>", table_cell),
            Paragraph("<b>Zero Evaporation across entire estate!</b> Perfect for crop hydration.", table_cell)
        ],
        [
            Paragraph("<b>🚨 Flash Flood Breach</b>", table_cell_bold),
            Paragraph("<font color='#e11d48'><b>+120 L/sec (Torrential)</b></font>", table_cell),
            Paragraph("14°C • 98% RH", table_cell),
            Paragraph("0% (Flooded)", table_cell),
            Paragraph("<b>180s Hazard Timer!</b> Water surges over canal banks unless Spillway opened.", table_cell)
        ],
    ]
    weather_table = Table(weather_data, colWidths=[105, 95, 100, 105, 135])
    weather_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), NAVY_DEEP),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, SLATE_LIGHT]),
        ('PADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(weather_table)
    story.append(Spacer(1, 8))

    # Spillway Callout
    spillway_data = [
        [
            Paragraph(
                "<b>🛡️ EMERGENCY FLOOD SPILLWAY PROTOCOL:</b><br/>"
                "When a sudden river breach triggers a <b>Flash Flood Hazard (180s countdown)</b>, torrential overflow threatens to submerge "
                "crops past 95% saturation, inflicting catastrophic Root Rot. Clicking <b>'Open Emergency Spillway'</b> engages the river bypass diversion gate, "
                "channeling 120 L/sec off-map and purging excess field water at -10%/sec until field equilibrium is restored.",
                callout_style
            )
        ]
    ]
    spillway_table = Table(spillway_data, colWidths=[540])
    spillway_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#fff1f2')),
        ('BOX', (0, 0), (-1, -1), 1, ROSE_RED),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(spillway_table)
    story.append(Spacer(1, 10))

    # ----------------------------------------------------
    # SECTION 7: WORKER SHIFTS & MANUAL ACTIONS
    # ----------------------------------------------------
    story.append(Paragraph("7. Autonomous Worker Shifts & Estate Operations", h1_style))
    story.append(Paragraph(
        "Hired farmhands automate critical water tasks during their scheduled day/night shifts, eliminating the need for constant micromanagement:",
        body_style
    ))

    worker_data = [
        [
            Paragraph("Shift & Worker Duty", table_header),
            Paragraph("Trigger Time / Condition", table_header),
            Paragraph("Automated Action Executed", table_header),
            Paragraph("Strategic Benefit", table_header)
        ],
        [
            Paragraph("<b>🌅 Morning Field Hand</b>", table_cell_bold),
            Paragraph("Daily at 06:00 AM or whenever Tower &lt; 200L", table_cell),
            Paragraph("Opens master sluice gates for early morning irrigation; pumps aquifer if tower drops below nominal.", table_cell),
            Paragraph("Crops enter peak morning photosaturation before midday evaporation intensifies.", table_cell)
        ],
        [
            Paragraph("<b>🌙 Night Watch Guard</b>", table_cell_bold),
            Paragraph("Night shift (22:00 – 05:00) or Cistern &lt; 50L", table_cell),
            Paragraph("De-silts canal grates, sweeps sediment, and harvests +20L condensed night dew into the cistern.", table_cell),
            Paragraph("Prevents debris blockages; secures baseline water reserves during extended droughts.", table_cell)
        ],
        [
            Paragraph("<b>🕸️ Deploy Dew Screens</b>", table_cell_bold),
            Paragraph("Manual player action (Available on Water Tab)", table_cell),
            Paragraph("Unfurls high-surface-area condensed moisture netting, capturing an immediate <b>+20 Liters</b> of fresh water.", table_cell),
            Paragraph("Crucial early-game lifeline when starting out with Tier 1 furrows and 0 rain.", table_cell)
        ],
    ]
    worker_table = Table(worker_data, colWidths=[120, 110, 160, 150])
    worker_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), NAVY_DEEP),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, SLATE_LIGHT]),
        ('PADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(worker_table)
    story.append(Spacer(1, 10))

    # ----------------------------------------------------
    # SECTION 8: QUICK OPERATIONAL CHECKLIST
    # ----------------------------------------------------
    story.append(Paragraph("8. Master Agronomist Operational Checklist", h1_style))
    checklist_data = [
        [
            Paragraph(
                "<b>STEP 1: INSTALL EMERGENCY SIPHON VALVE IMMEDIATELY</b><br/>"
                "Visit the Water tab and install the Emergency Siphon Float Valve for 250 coins. This guarantees your Gravity Tower will never run dry while the Aquifer holds reserves.<br/><br/>"
                "<b>STEP 2: CALIBRATE AUTO-SHUTOFF LIMITER TO 75%</b><br/>"
                "Set the soil saturation limiter slider to 75%. This allows your crops to enjoy the 1.40x growth speed bonus while eliminating all risk of waterlogging rot.<br/><br/>"
                "<b>STEP 3: UPGRADE CANALS TO TIER 2 BEFORE EXPANDING PLOTS</b><br/>"
                "Tier 1 Earthen Furrows lose 35% of all released water into uncultivated turf. Upgrading to Clay-Lined Trenches (Tier 2, 🪙18,500) permanently stops all seepage loss.<br/><br/>"
                "<b>STEP 4: TRIGGER OVERFLOW SURGE WITH FULL CISTERNS</b><br/>"
                "During heavy rainstorms, let your Rain Cistern reach 100% capacity. Once full, it triggers an instantaneous <b>+15 L/s Overflow Surge</b>, filling the Elevated Gravity Tower for free without spending coins on aquifer pumping!",
                callout_style
            )
        ]
    ]
    checklist_table = Table(checklist_data, colWidths=[540])
    checklist_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
        ('BOX', (0, 0), (-1, -1), 1.5, NAVY_DEEP),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(checklist_table)

    # Build the document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF successfully generated at: {output_path}")

if __name__ == '__main__':
    dest = sys.argv[1] if len(sys.argv) > 1 else 'Meadowlands_Water_System_Complete_Manual.pdf'
    build_pdf(dest)
