import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

# Register fonts
pdfmetrics.registerFont(TTFont('Arial', 'C:/Windows/Fonts/arial.ttf'))
pdfmetrics.registerFont(TTFont('Arial-Bold', 'C:/Windows/Fonts/arialbd.ttf'))
pdfmetrics.registerFont(TTFont('Arial-Italic', 'C:/Windows/Fonts/ariali.ttf'))

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
        self.setFont("Arial", 8)
        self.setFillColor(colors.HexColor('#64748b'))
        
        # Suppress headers/footers on cover page
        if self._pageNumber > 1:
            # Header
            self.drawString(54, letter[1] - 36, "MEADOWLANDS ESTATE — MASTER EVENTS & CRISES COMPENDIUM")
            self.setStrokeColor(colors.HexColor('#cbd5e1'))
            self.setLineWidth(0.5)
            self.line(54, letter[1] - 42, letter[0] - 54, letter[1] - 42)
            
            # Footer
            page_text = f"Page {self._pageNumber} of {page_count}"
            self.drawRightString(letter[0] - 54, 30, page_text)
            self.drawString(54, 30, "CONFIDENTIAL & PROPRIETARY — GAME MECHANICS FIELD CODEX")
            self.line(54, 40, letter[0] - 54, 40)
            
        self.restoreState()

def build_pdf(filename):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Arial-Bold',
        fontSize=26,
        leading=32,
        textColor=colors.HexColor('#0f172a'),
        alignment=0,
        spaceAfter=8
    )

    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Arial',
        fontSize=13,
        leading=18,
        textColor=colors.HexColor('#0284c7'),
        spaceAfter=15
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Arial-Bold',
        fontSize=17,
        leading=22,
        textColor=colors.HexColor('#0f172a'),
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Normal'],
        fontName='Arial-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#0369a1'),
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    h3_style = ParagraphStyle(
        'Heading3_Custom',
        parent=styles['Normal'],
        fontName='Arial-Bold',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#1e293b'),
        spaceBefore=6,
        spaceAfter=2,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Arial',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#334155'),
        spaceAfter=4
    )

    body_bold = ParagraphStyle(
        'Body_Bold_Custom',
        parent=styles['Normal'],
        fontName='Arial-Bold',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#0f172a'),
        spaceAfter=4
    )

    italic_style = ParagraphStyle(
        'Body_Italic_Custom',
        parent=styles['Normal'],
        fontName='Arial-Italic',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#475569'),
        spaceAfter=4
    )

    tag_style = ParagraphStyle(
        'Tag_Custom',
        parent=styles['Normal'],
        fontName='Arial-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#ffffff')
    )

    table_header = ParagraphStyle(
        'TH_Custom',
        parent=styles['Normal'],
        fontName='Arial-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#ffffff')
    )

    table_cell = ParagraphStyle(
        'TC_Custom',
        parent=styles['Normal'],
        fontName='Arial',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#1e293b')
    )

    table_cell_bold = ParagraphStyle(
        'TCB_Custom',
        parent=styles['Normal'],
        fontName='Arial-Bold',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#0f172a')
    )

    story = []

    # ====================================================
    # COVER / HEADER BANNER
    # ====================================================
    story.append(Paragraph("MEADOWLANDS ESTATE & SANCTUARY", subtitle_style))
    story.append(Paragraph("Master Events & Crises Compendium", title_style))
    story.append(Paragraph("Comprehensive Technical Reference Manual for All In-Game Systemic Events, Seasonal Operations, Radar Crises, Hourly Hazards, and Permanent Relic Monuments", body_style))
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#0284c7'), spaceAfter=15))

    # Executive Summary Card
    exec_summary_text = (
        "<b>DOCUMENT PURPOSE & ARCHITECTURAL SUMMARY:</b><br/>"
        "This compendium outlines the complete operational data registry for all events engineered into Project Meadowlands. "
        "The game employs a multi-tiered event hierarchy comprising: (1) <b>10 Long-Form Systemic Master Events</b> with multi-phase forecasting, "
        "community staging ladders, and grand permanent relics; (2) <b>4 Hourly Environmental Events</b> delivering weather buffs and wandering merchants; "
        "(3) <b>3 Active Radar Crises</b> with tactical containment defense; and (4) <b>10 High-Stakes Sudden Events</b> featuring rapid actions and bounties.<br/><br/>"
        "<i>Note on Player Experience Preferences:</i> Following executive tuning, intrusive auto-popping modals, edge alarms, and automated penalty expirations "
        "have been decoupled from the default game loop, allowing players to engage with systemic estate events peacefully via the top telemetry banner and event ledger."
    )
    exec_table = Table([[Paragraph(exec_summary_text, body_style)]], colWidths=[504])
    exec_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f0f9ff')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#bae6fd')),
        ('PADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(exec_table)
    story.append(Spacer(1, 15))

    # Systemic Architecture Matrix Table
    story.append(Paragraph("Summary Matrix: Event Classifications in Meadowlands", h2_style))
    arch_data = [
        [Paragraph("Event Category", table_header), Paragraph("Cycle Frequency", table_header), Paragraph("Duration", table_header), Paragraph("Key Mechanics", table_header), Paragraph("Primary Yields", table_header)],
        [
            Paragraph("<b>Long-Form Systemic Events</b>", table_cell),
            Paragraph("2h to 8h Cooldown", table_cell),
            Paragraph("20m to 90m Active<br/>(10m-15m Forecast)", table_cell),
            Paragraph("Staged shipping ladders, community pavilions, multi-tier donations", table_cell),
            Paragraph("Grand Relics, Millions in Coins, Massive Gems, Permanent Monoliths", table_cell)
        ],
        [
            Paragraph("<b>Hourly Estate Events</b>", table_cell),
            Paragraph("Hourly Rotation", table_cell),
            Paragraph("3m to 15m", table_cell),
            Paragraph("VIP culinary catering, crop pest shooing, rainfall irrigation boosts", table_cell),
            Paragraph("Bonus Coins, Rapid XP, Crop Growth Multipliers, Contraband", table_cell)
        ],
        [
            Paragraph("<b>Radar Crises</b>", table_cell),
            Paragraph("Tactical Radar Check", table_cell),
            Paragraph("45 Seconds", table_cell),
            Paragraph("Predator raids, virulent plot blight, flash droughts and blizzards", table_cell),
            Paragraph("Emergency Shield Repulsion, Guard Dog Defense, Quarantine", table_cell)
        ],
        [
            Paragraph("<b>Sudden Adrenaline Bounties</b>", table_cell),
            Paragraph("Playtime Windows", table_cell),
            Paragraph("30s to 75s", table_cell),
            Paragraph("Rapid tap action, resource liquidation, high-urgency rescue", table_cell),
            Paragraph("Instant Relics, Emergency Gold Rushes, Factory Spores", table_cell)
        ],
    ]
    arch_table = Table(arch_data, colWidths=[110, 80, 85, 125, 104])
    arch_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0f172a')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor('#ffffff'), colors.HexColor('#f8fafc')]),
        ('PADDING', (0, 0), (-1, -1), 5),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(arch_table)
    story.append(Spacer(1, 15))

    # ====================================================
    # SECTION 1: THE 10 SYSTEMIC MASTER EVENTS
    # ====================================================
    story.append(PageBreak())
    story.append(Paragraph("Section 1: The 10 Systemic Master Events", h1_style))
    story.append(Paragraph("Long-form systemic events are grand macroeconomic shifts that transform farm logistics. Each event features a forecast phase, multi-stage delivery ladders, and exclusive permanent relic trophies.", body_style))
    story.append(Spacer(1, 8))

    systemic_events = [
        {
            "id": "royal_fleet",
            "name": "The Royal Fleet Provision",
            "emoji": "[Naval Trade Ladder]",
            "level": 8,
            "forecast": "15 Minutes",
            "active": "60 Minutes",
            "cooldown": "4 Hours",
            "premise": "The King's flagship docks at the coastal estuary requiring provision crates for an overseas expedition.",
            "mechanics": "Order Board introduces a 4-stage global shipping crate ladder (Grains -> Dairy -> Baked Goods -> Luxury Textiles).",
            "stages": [
                ("Stage 1: Grain Reserves", "15 Units (Wheat, Corn)", "5,000 Coins + 2 Gems"),
                ("Stage 2: Dairy Provisions", "30 Units (Milk, Cheese, Butter, Alpine Cheese)", "12,000 Coins + 5 Gems"),
                ("Stage 3: Rations & Pastries", "50 Units (Bread, Pie, Savory Fish Pie, Golden Cake)", "25,000 Coins + 8 Gems"),
                ("Stage 4: Fine Textiles", "75 Units (Wool, Sweaters, Blankets, Silk, Golden Shawl)", "33,000 Coins + 15 Gems")
            ],
            "grand_reward": "75,000 Coins, 30 Gems, and Royal Crown Crest Relic (+15% all order delivery payouts active for 24 hours)."
        },
        {
            "id": "barn_fire",
            "name": "Drought & Brushfire Crisis",
            "emoji": "[Crisis Containment]",
            "level": 2,
            "forecast": "5 Minutes",
            "active": "25 Minutes",
            "cooldown": "3 Hours",
            "premise": "Dry lightning ignites brushfires along the farm perimeter; intense heat cuts natural irrigation.",
            "mechanics": "Crop timers pause on unwatered plots. Five randomized fire flare-up entities spawn across the map. Tap fires with well water to extinguish them.",
            "stages": [
                ("Stage 1: First Flare-Up", "1 Flare-Up Quenched", "2,000 Coins"),
                ("Stage 2: Perimeter Defense", "3 Flare-Ups Quenched", "6,000 Coins + 2 Gems"),
                ("Stage 3: Final Containment", "5 Flare-Ups Quenched (All)", "12,000 Coins + 8 Gems")
            ],
            "grand_reward": "20,000 Coins, 10 Gems, and Mineral-Rich Ash Soil Relic (All crops planted within 60 minutes grow at 3x speed)."
        },
        {
            "id": "midnight_smuggler",
            "name": "Midnight Smuggler's Barge",
            "emoji": "[Black-Market Contract]",
            "level": 6,
            "forecast": "10 Minutes",
            "active": "40 Minutes",
            "cooldown": "5 Hours",
            "premise": "A cloaked river barge docks quietly at the shadowed boundary of the estate with high-value clandestine demands.",
            "mechanics": "Presents 3 unconventional black-market contracts demanding irregular high-tier goods (Starlight Milk, Truffle Oil, Patterned Wool).",
            "stages": [
                ("Stage 1: Clandestine Parcel", "1 Delivery (Truffle, White Truffle, Truffle Oil)", "8,000 Coins + 5 Gems"),
                ("Stage 2: Shadow Cargo", "2 Deliveries (Silk, Quilted Blanket, Alpine Cheese)", "12,000 Coins + 8 Gems"),
                ("Stage 3: Master Smuggler Pact", "3 Deliveries (Starlight Milk, Gold Nugget, Diamond Truffle)", "15,000 Coins + 12 Gems")
            ],
            "grand_reward": "35,000 Coins, 25 Gems, and Smuggler's Compass Relic (Permanently reduces all Wilderness Outpost expedition timers by 20%)."
        },
        {
            "id": "locust_swarm",
            "name": "Wild Locust Swarm",
            "emoji": "[Field Defense]",
            "level": 2,
            "forecast": "10 Minutes",
            "active": "20 Minutes",
            "cooldown": "2 Hours",
            "premise": "A massive swarm of ravenous insects descends from the foothills, landing on mature crop plots.",
            "mechanics": "Locust sprites land on mature crops, blocking harvests. Tap locusts to capture them into containment jars. Stationed beekeepers repel them.",
            "stages": [
                ("Stage 1: Initial Swarm Repel", "10 Locusts Captured", "3,000 Coins + 2 Gems"),
                ("Stage 2: Mid-Field Containment", "20 Locusts Captured", "5,000 Coins + 2 Gems"),
                ("Stage 3: Total Swarm Clearance", "30 Locusts Captured", "7,000 Coins + 4 Gems")
            ],
            "grand_reward": "15,000 Coins, 8 Gems, and Super-Feed Mash (x5) (Grants livestock guaranteed double yield on their next 5 production cycles)."
        },
        {
            "id": "county_fair",
            "name": "The County Fair Grand Derby",
            "emoji": "[Competitive Exhibition]",
            "level": 5,
            "forecast": "15 Minutes",
            "active": "90 Minutes",
            "cooldown": "8 Hours",
            "premise": "The regional agricultural pavilion opens for competitive exhibition judging across all farm goods.",
            "mechanics": "Submit harvested crops, dairy, and textiles into the pavilion. Scoring is rarity-weighted: Common (1pt), Uncommon (3pt), Rare (10pt), Legendary (25pt).",
            "stages": [
                ("Stage 1: Blue Ribbon Entry", "100 Exhibition Points", "10,000 Coins + 5 Gems"),
                ("Stage 2: Governor's Choice", "300 Exhibition Points", "15,000 Coins + 10 Gems"),
                ("Stage 3: Grand Championship", "600 Exhibition Points", "25,000 Coins + 25 Gems")
            ],
            "grand_reward": "50,000 Coins, 40 Gems, and County Fair Grand Trophy (Permanent farm monument generating 3 Gems every 24 hours)."
        },
        {
            "id": "salmon_run",
            "name": "The Golden Salmon Migration",
            "emoji": "[Riverfront Frenzy]",
            "level": 3,
            "forecast": "10 Minutes",
            "active": "45 Minutes",
            "cooldown": "3 Hours",
            "premise": "A seasonal migration floods the estate riverfront with glowing golden salmon and prized river catch.",
            "mechanics": "The manual fishing dock has 0-second cooldown timers and 100% instant bites. Rare and Legendary fish spawn odds increase by +300%.",
            "stages": [
                ("Stage 1: Riverfront Casts", "5 Migration Fish", "8,000 Coins + 3 Gems"),
                ("Stage 2: Deep Channel Haul", "10 Migration Fish", "14,000 Coins + 5 Gems"),
                ("Stage 3: Golden School Catch", "15 Migration Fish", "18,000 Coins + 7 Gems")
            ],
            "grand_reward": "40,000 Coins, 15 Gems, and Feast of Kings Recipe (Exclusive luxury bakery dish that liquidates to visiting caravan merchants for 40,000 Coins per dish)."
        },
        {
            "id": "carnival_circus",
            "name": "The Travelling Carnival Menagerie",
            "emoji": "[Animal Relief Supply]",
            "level": 4,
            "forecast": "15 Minutes",
            "active": "60 Minutes",
            "cooldown": "6 Hours",
            "premise": "A traveling carnival train stops at the perimeter railway siding; their exotic animals urgently require feed.",
            "mechanics": "Dedicated carnival feeding stall opens, requiring high volumes of milled feed, fruits, and grains on strict delivery schedules.",
            "stages": [
                ("Stage 1: Emergency Rations", "20 Feeds (Feed, Wheat, Corn, Carrot)", "5,000 Coins + 3 Gems"),
                ("Stage 2: Caravan Sustenance", "50 Feeds (Feed, Soybeans, Berries, Milk)", "10,000 Coins + 7 Gems"),
                ("Stage 3: Menagerie Bounty", "100 Total Feeds", "15,000 Coins + 10 Gems")
            ],
            "grand_reward": "30,000 Coins, 20 Gems, and Rescued Circus Cub (Exclusive companion animal joining the sanctuary, granting permanent +10% farm XP boosts)."
        },
        {
            "id": "alchemical_bloom",
            "name": "The Luminescent Spore Fog",
            "emoji": "[Alchemical Bloom]",
            "level": 1,
            "forecast": "10 Minutes",
            "active": "30 Minutes",
            "cooldown": "4 Hours",
            "premise": "Bioluminescent fungal fog drifts down from mountain caverns, saturating the soil with hyper-growth spores.",
            "mechanics": "All crop growth times across all plots drop to a flat 30 seconds. Every harvest carries a 50% chance to drop glowing alchemical spores.",
            "stages": [
                ("Stage 1: Fog Infiltration", "15 Crops Harvested in Fog", "4,000 Coins + 3 Gems"),
                ("Stage 2: Spore Saturation", "28 Crops Harvested in Fog", "6,000 Coins + 4 Gems"),
                ("Stage 3: Abundant Harvest", "40 Crops Harvested in Fog", "8,000 Coins + 5 Gems")
            ],
            "grand_reward": "18,000 Coins, 12 Gems, and Glowing Spores (x8) (Instant-finish alchemical spores used to instantly complete factory production queues)."
        },
        {
            "id": "artisan_masterclass",
            "name": "Wandering Guild Craftsmen",
            "emoji": "[Industrial Hyper-Drive]",
            "level": 7,
            "forecast": "10 Minutes",
            "active": "45 Minutes",
            "cooldown": "5 Hours",
            "premise": "A master baker, weaver, and cheesemaker visit the estate to oversee industrial workshop operations.",
            "mechanics": "The Bakery, Loom, and Cheese Press operate at 4x production speed with zero ingredient waste.",
            "stages": [
                ("Stage 1: Apprentice Showcase", "10 Artisan Recipes (Bread, Cheese, Sweaters, Pies)", "10,000 Coins + 5 Gems"),
                ("Stage 2: Master Guild Certification", "20 Artisan Recipes Total", "15,000 Coins + 10 Gems")
            ],
            "grand_reward": "25,000 Coins, 15 Gems, and Master Artisan's Ledger (Permanently reduces all machine crafting durations farm-wide by a flat 5%)."
        },
        {
            "id": "ancient_ruins",
            "name": "Ancient Subterranean Excavation",
            "emoji": "[Archaeological Dig]",
            "level": 9,
            "forecast": "15 Minutes",
            "active": "60 Minutes",
            "cooldown": "8 Hours",
            "premise": "Quarry blasting exposes a subterranean stone passageway leading into an ancient buried sun temple.",
            "mechanics": "Unlocks a multi-chamber excavation dig site. Donate raw construction materials (Cotton, Wool, Gold Nuggets, Truffle, Ancient Coins) to clear the chambers.",
            "stages": [
                ("Stage 1: Antechamber Rubble", "25 Materials (Cotton, Wool, Honeycomb)", "12,000 Coins + 5 Gems"),
                ("Stage 2: Pillar Hall Clearance", "60 Materials (Cotton, Wool, Gold Nugget, Yarn, Silk)", "20,000 Coins + 10 Gems"),
                ("Stage 3: Sanctum Sanctorum", "120 Total Materials (+ Ancient Coins)", "28,000 Coins + 20 Gems")
            ],
            "grand_reward": "60,000 Coins, 35 Gems, and Ancient Sun Relic (Permanent artifact monument providing a +15% multiplier to all player experience gains)."
        }
    ]

    for ev in systemic_events:
        card_content = []
        card_content.append(Paragraph(f"<b>{ev['name']}</b> &nbsp;|&nbsp; <i>{ev['emoji']}</i> &nbsp;&bull;&nbsp; Unlock Level: {ev['level']}", h2_style))
        card_content.append(Paragraph(f"<b>Schedule Telemetry:</b> Forecast: {ev['forecast']} &nbsp;|&nbsp; Active Duration: {ev['active']} &nbsp;|&nbsp; Cooldown: {ev['cooldown']}", italic_style))
        card_content.append(Paragraph(f"<b>Premise:</b> {ev['premise']}", body_style))
        card_content.append(Paragraph(f"<b>Mechanical Shift:</b> {ev['mechanics']}", body_style))
        
        # Stages Table
        stg_data = [[Paragraph("Objective Stage", table_header), Paragraph("Target Requirement", table_header), Paragraph("Stage Clear Bounty", table_header)]]
        for s in ev['stages']:
            stg_data.append([
                Paragraph(f"<b>{s[0]}</b>", table_cell),
                Paragraph(s[1], table_cell),
                Paragraph(s[2], table_cell_bold)
            ])
        stg_table = Table(stg_data, colWidths=[140, 200, 154])
        stg_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0284c7')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor('#ffffff'), colors.HexColor('#f8fafc')]),
            ('PADDING', (0, 0), (-1, -1), 4),
        ]))
        card_content.append(stg_table)
        card_content.append(Spacer(1, 4))
        card_content.append(Paragraph(f"<b>Grand Completion Reward:</b> {ev['grand_reward']}", body_bold))

        # Wrap in a card block
        event_card = Table([[card_content]], colWidths=[504])
        event_card.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#ffffff')),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#cbd5e1')),
            ('PADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(KeepTogether([event_card]))
        story.append(Spacer(1, 10))

    # ====================================================
    # SECTION 2: HOURLY ESTATE & WEATHER EVENTS
    # ====================================================
    story.append(PageBreak())
    story.append(Paragraph("Section 2: Hourly Estate & Environmental Events", h1_style))
    story.append(Paragraph("Hourly events represent dynamic local phenomena that activate on fixed intervals to offer immediate bonuses, emergency pest control, and wandering black-market trades.", body_style))
    story.append(Spacer(1, 8))

    hourly_events = [
        {
            "name": "VIP Chef Visit",
            "badge": "Gourmet Catering",
            "duration": "10 Minutes (600s)",
            "description": "A prestigious high-society executive chef visits the farmstead seeking bespoke organic ingredients for a banquet.",
            "mechanics": "The chef posts an exclusive multi-ingredient order directly on the top banner. Ingredients are pulled from the Silo and Barn.",
            "rewards": "High coin payouts (typically 1.5x to 2x market rates), substantial bonus XP (+50 to +200 XP), and guaranteed Gem caches."
        },
        {
            "name": "Crow Attack!",
            "badge": "Field Pestilence",
            "duration": "3 Minutes (180s)",
            "description": "A flock of hungry black crows descends upon your planted plots, threatening to peck away mature and growing crops.",
            "mechanics": "Affects 2 to 6 specific plot IDs across your estate. Clicking the 'Shoo Crows!' banner action or tapping the affected plots immediately scares away the birds.",
            "rewards": "Prevents crop loss. Grants +15 XP and bonus satisfaction per cleared flock."
        },
        {
            "name": "Rainstorm",
            "badge": "Natural Irrigation",
            "duration": "15 Minutes (900s)",
            "description": "A steady, soothing rain shower falls over the entire Meadowlands valley, nourishing all crops and soil beds.",
            "mechanics": "Passive estate aura: all crops grow 50% faster for the full 15-minute duration. Automatically replenishes moisture levels across all open field plots.",
            "rewards": "Accelerated harvest throughput and reduced well-water extraction demands."
        },
        {
            "name": "Smuggler Crate",
            "badge": "Estuary Contraband",
            "duration": "15 Minutes (900s)",
            "description": "A secretive smuggler's rowboat docks along the canal inlet and leaves behind a locked wooden cargo crate.",
            "mechanics": "Interactive top banner item: players can crack open the contraband crate for instant randomized high-tier supplies.",
            "rewards": "Randomized loot table: includes rare seeds (Carrot, Strawberry), Gold Nuggets, Building Materials (Nails, Planks, Slabs), and bonus Coins."
        }
    ]

    for he in hourly_events:
        h_content = []
        h_content.append(Paragraph(f"<b>{he['name']}</b> &nbsp;|&nbsp; <i>[{he['badge']}]</i> &nbsp;&bull;&nbsp; Duration: {he['duration']}", h2_style))
        h_content.append(Paragraph(f"<b>Overview:</b> {he['description']}", body_style))
        h_content.append(Paragraph(f"<b>Gameplay Mechanics:</b> {he['mechanics']}", body_style))
        h_content.append(Paragraph(f"<b>Rewards & Impact:</b> {he['rewards']}", body_bold))

        h_card = Table([[h_content]], colWidths=[504])
        h_card.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#94a3b8')),
            ('PADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(KeepTogether([h_card]))
        story.append(Spacer(1, 10))

    # ====================================================
    # SECTION 3: EMERGENCY RADAR CRISES
    # ====================================================
    story.append(PageBreak())
    story.append(Paragraph("Section 3: Emergency Radar Crises", h1_style))
    story.append(Paragraph("Radar Crises are high-threat perimeter hazards detected by the estate's warning stations. Players historically engaged in 45-second rapid defensive actions to neutralize potential livestock theft, crop blight, or extreme weather damage.", body_style))
    story.append(Spacer(1, 8))

    radar_crises = [
        {
            "title": "Predator Raid",
            "badge": "Livestock Defense",
            "timer": "45 Seconds",
            "threat": "Forest predators (foxes, wolves) stalk coops and pastures, targeting 1 to 2 random domestic animals.",
            "actions": "1. Sound Alarm: Rapid-tap alarm clapper 4 times.<br/>2. Guard Dog: Deploy trained guard dog for 20 Coins to immediately repel the pack.<br/>3. Emergency Crisis Shield: Auto-intercepts the raid if shields are stocked in the inventory.",
            "fail_penalty": "Animals panic, losing their active production progress and postponing subsequent yield timers.",
            "success_reward": "+30 Coins, +45 XP, and full protection of livestock rosters."
        },
        {
            "title": "Crop Blight Outbreak",
            "badge": "Agricultural Quarantine",
            "timer": "45 Seconds",
            "threat": "Virulent spore outbreak strikes 1 to 2 planted crop plots, slowly spreading infection progress toward 100%.",
            "actions": "1. Spray Fungicide: Apply organic fungicide to each infected plot individually.<br/>2. Burn Infected Crops: Remove crops to halt spread to adjacent plots.<br/>3. Emergency Crisis Shield: Neutralizes the biological spore cloud upon perimeter contact.",
            "fail_penalty": "Infected crops wither into dead vegetation, requiring field clearing and replanting.",
            "success_reward": "+25 Coins, +50 XP, and pristine crop quality preservation."
        },
        {
            "title": "Flash Weather Hazard (Drought / Blizzard)",
            "badge": "Atmospheric Anomaly",
            "timer": "45 Seconds",
            "threat": "Extreme atmospheric anomaly (Flash Drought or Sudden Ice Blizzard) hits the estate, cutting crop and animal growth rates by 50%.",
            "actions": "1. Sluice Emergency Purge: Activate emergency canal water flush.<br/>2. Thermal Greenhouse Cloaking: Deploy thermal tarping over active fields.<br/>3. Crisis Shield: Establishes a localized atmospheric dome over the perimeter.",
            "fail_penalty": "All farm and machine production speeds suffer a 50% penalty for the hazard duration.",
            "success_reward": "+35 Coins, +60 XP, and uninterrupted estate operating rhythm."
        }
    ]

    for rc in radar_crises:
        rc_content = []
        rc_content.append(Paragraph(f"<b>{rc['title']}</b> &nbsp;|&nbsp; <i>[{rc['badge']}]</i> &nbsp;&bull;&nbsp; Countdown Window: {rc['timer']}", h2_style))
        rc_content.append(Paragraph(f"<b>Threat Analysis:</b> {rc['threat']}", body_style))
        rc_content.append(Paragraph(f"<b>Containment Countermeasures:</b><br/>{rc['actions']}", body_style))
        rc_content.append(Paragraph(f"<b>Failure Consequence (If Unresolved):</b> {rc['fail_penalty']}", body_style))
        rc_content.append(Paragraph(f"<b>Defense Bounty:</b> {rc['success_reward']}", body_bold))

        rc_card = Table([[rc_content]], colWidths=[504])
        rc_card.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#fff7ed')),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#fdba74')),
            ('PADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(KeepTogether([rc_card]))
        story.append(Spacer(1, 10))

    # ====================================================
    # SECTION 4: HIGH-STAKES SUDDEN EVENTS MATRIX
    # ====================================================
    story.append(PageBreak())
    story.append(Paragraph("Section 4: High-Stakes Sudden Events Matrix", h1_style))
    story.append(Paragraph("Sudden Events are fast-paced adrenaline moments classified into Crisis alarms (requiring rapid rescue action) and Gold Rush bounties (offering lucrative flash payouts).", body_style))
    story.append(Spacer(1, 8))

    sudden_data = [
        [Paragraph("Event Name", table_header), Paragraph("Type", table_header), Paragraph("Timer", table_header), Paragraph("Required Action", table_header), Paragraph("Rewards on Success", table_header), Paragraph("Failure Penalty", table_header)],
        [
            Paragraph("<b>Dry Brushfire Blitz</b>", table_cell),
            Paragraph("CRISIS", table_cell_bold),
            Paragraph("45s", table_cell),
            Paragraph("Rapid Tap: 15 Bucket Douses", table_cell),
            Paragraph("4,500 Coins, 5 Gems, 250 XP, Mineral Ash", table_cell),
            Paragraph("-25% Growing Crops", table_cell)
        ],
        [
            Paragraph("<b>Great Locust Swarm</b>", table_cell),
            Paragraph("CRISIS", table_cell_bold),
            Paragraph("40s", table_cell),
            Paragraph("Rapid Tap: 16 Swats", table_cell),
            Paragraph("5,200 Coins, 6 Gems, 300 XP, Sentry Charm", table_cell),
            Paragraph("-30% Unharvested Crops", table_cell)
        ],
        [
            Paragraph("<b>Quarry Shaft Cave-In</b>", table_cell),
            Paragraph("CRISIS", table_cell_bold),
            Paragraph("50s", table_cell),
            Paragraph("Rapid Tap: 18 Shoring Wedges", table_cell),
            Paragraph("7,000 Coins, 8 Gems, 350 XP, Sun Relic", table_cell),
            Paragraph("Workers Paused 3 min", table_cell)
        ],
        [
            Paragraph("<b>Smuggler's Midnight Heist</b>", table_cell),
            Paragraph("GOLD RUSH", table_cell_bold),
            Paragraph("45s", table_cell),
            Paragraph("Pay 150 Coins Tariff", table_cell),
            Paragraph("12,000 Coins, 10 Gems, 400 XP, Compass", table_cell),
            Paragraph("None (Barge departs)", table_cell)
        ],
        [
            Paragraph("<b>Royal Armada Charter</b>", table_cell),
            Paragraph("GOLD RUSH", table_cell_bold),
            Paragraph("60s", table_cell),
            Paragraph("Supply 250 Coins Crates", table_cell),
            Paragraph("24,000 Coins, 15 Gems, 600 XP, Royal Crest", table_cell),
            Paragraph("None (Armada sails)", table_cell)
        ],
        [
            Paragraph("<b>Estuary Salmon Frenzy</b>", table_cell),
            Paragraph("GOLD RUSH", table_cell_bold),
            Paragraph("35s", table_cell),
            Paragraph("Rapid Tap: 18 Landing Nets", table_cell),
            Paragraph("9,500 Coins, 7 Gems, 320 XP", table_cell),
            Paragraph("None (School vanishes)", table_cell)
        ],
        [
            Paragraph("<b>County Fair Flash Judging</b>", table_cell),
            Paragraph("GOLD RUSH", table_cell_bold),
            Paragraph("45s", table_cell),
            Paragraph("Rapid Tap: 14 Exhibit Polishes", table_cell),
            Paragraph("14,000 Coins, 8 Gems, 450 XP, Trophy", table_cell),
            Paragraph("None (Ribbon lost)", table_cell)
        ],
        [
            Paragraph("<b>Carnival Circus Breakdown</b>", table_cell),
            Paragraph("GOLD RUSH", table_cell_bold),
            Paragraph("40s", table_cell),
            Paragraph("Rapid Tap: 15 Rope Heaves", table_cell),
            Paragraph("11,000 Coins, 7 Gems, 380 XP, Circus Cub", table_cell),
            Paragraph("None (Caravan leaves)", table_cell)
        ],
        [
            Paragraph("<b>Alchemical Spore Bloom</b>", table_cell),
            Paragraph("GOLD RUSH", table_cell_bold),
            Paragraph("30s", table_cell),
            Paragraph("Rapid Tap: 20 Spore Plucks", table_cell),
            Paragraph("8,500 Coins, 10 Gems, 420 XP, +3 Spores", table_cell),
            Paragraph("None (Spores mist)", table_cell)
        ],
        [
            Paragraph("<b>Artisan Guild Inspection</b>", table_cell),
            Paragraph("GOLD RUSH", table_cell_bold),
            Paragraph("45s", table_cell),
            Paragraph("Rapid Tap: 16 Gear Works", table_cell),
            Paragraph("18,000 Coins, 12 Gems, 550 XP, Ledger", table_cell),
            Paragraph("None (Inspectors depart)", table_cell)
        ],
    ]
    sudden_table = Table(sudden_data, colWidths=[95, 55, 30, 114, 110, 100])
    sudden_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0f172a')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor('#ffffff'), colors.HexColor('#f8fafc')]),
        ('PADDING', (0, 0), (-1, -1), 4),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(sudden_table)
    story.append(Spacer(1, 15))

    # ====================================================
    # SECTION 5: MASTER EVENT RELICS & MONUMENTS
    # ====================================================
    story.append(PageBreak())
    story.append(Paragraph("Section 5: Master Event Relics & Monuments Compendium", h1_style))
    story.append(Paragraph("Completing the grand climactic stages of systemic events unlocks permanent relics, recipes, and companion animals. These provide persistent multiplicative bonuses across your entire agricultural enterprise.", body_style))
    story.append(Spacer(1, 8))

    relics_data = [
        [Paragraph("Relic / Monument", table_header), Paragraph("Originating Event", table_header), Paragraph("Duration / Type", table_header), Paragraph("Macro Passive Buff & Effect", table_header)],
        [
            Paragraph("<b>Royal Crown Crest</b>", table_cell),
            Paragraph("The Royal Fleet Provision", table_cell),
            Paragraph("24-Hour Buff", table_cell),
            Paragraph("+15% coin payout across all delivery orders on the order board.", table_cell)
        ],
        [
            Paragraph("<b>Mineral-Rich Ash Soil</b>", table_cell),
            Paragraph("Drought & Brushfire Crisis", table_cell),
            Paragraph("60-Minute Buff", table_cell),
            Paragraph("All crops planted during the buff window grow at 3x speed.", table_cell)
        ],
        [
            Paragraph("<b>Smuggler's Compass</b>", table_cell),
            Paragraph("Midnight Smuggler's Barge", table_cell),
            Paragraph("Permanent Relic", table_cell),
            Paragraph("Reduces all Wilderness Outpost exploration timers by 20% forever.", table_cell)
        ],
        [
            Paragraph("<b>Super-Feed Mash (x5)</b>", table_cell),
            Paragraph("Wild Locust Swarm", table_cell),
            Paragraph("5 Inventory Charges", table_cell),
            Paragraph("Guarantees double output yields on the next 5 livestock production cycles.", table_cell)
        ],
        [
            Paragraph("<b>County Fair Grand Trophy</b>", table_cell),
            Paragraph("County Fair Grand Derby", table_cell),
            Paragraph("Permanent Monolith", table_cell),
            Paragraph("Standing monument on farm: generates 3 premium Gems every 24 hours.", table_cell)
        ],
        [
            Paragraph("<b>Feast of Kings Recipe</b>", table_cell),
            Paragraph("Golden Salmon Migration", table_cell),
            Paragraph("Permanent Craft Recipe", table_cell),
            Paragraph("Exclusive luxury bakery dish that liquidates to merchants for 40,000 Coins.", table_cell)
        ],
        [
            Paragraph("<b>Rescued Circus Cub</b>", table_cell),
            Paragraph("Travelling Carnival Menagerie", table_cell),
            Paragraph("Companion Animal", table_cell),
            Paragraph("Permanent companion animal providing +10% farm experience multipliers.", table_cell)
        ],
        [
            Paragraph("<b>Glowing Spores (x8)</b>", table_cell),
            Paragraph("Luminescent Spore Fog", table_cell),
            Paragraph("Consumable Reagent", table_cell),
            Paragraph("8 units of instant-finish alchemical spores to instantly complete crafting queues.", table_cell)
        ],
        [
            Paragraph("<b>Master Artisan's Ledger</b>", table_cell),
            Paragraph("Wandering Guild Craftsmen", table_cell),
            Paragraph("Permanent Relic", table_cell),
            Paragraph("Permanently reduces all machine crafting durations farm-wide by a flat 5%.", table_cell)
        ],
        [
            Paragraph("<b>Ancient Sun Relic</b>", table_cell),
            Paragraph("Subterranean Excavation", table_cell),
            Paragraph("Permanent Relic", table_cell),
            Paragraph("Permanent sun monument granting a flat +15% multiplier to all player XP gains.", table_cell)
        ],
    ]
    relics_table = Table(relics_data, colWidths=[120, 110, 85, 189])
    relics_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0284c7')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor('#ffffff'), colors.HexColor('#f8fafc')]),
        ('PADDING', (0, 0), (-1, -1), 5),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(relics_table)
    story.append(Spacer(1, 20))

    # Concluding Verification Box
    conclusion_text = (
        "<b>OPERATIONAL DISPATCH NOTE:</b><br/>"
        "All data points, stage targets, scoring weights, cooldowns, and reward multipliers in this compendium "
        "correspond exactly to the production codebase in <code>src/game/eventsData.ts</code>, <code>src/lib/eventDirector.ts</code>, "
        "and <code>src/game/data.ts</code>. Players can consult this manual to optimize crop stocking, production queues, and "
        "Wilderness expedition dispatching for upcoming seasonal event cycles."
    )
    conc_table = Table([[Paragraph(conclusion_text, italic_style)]], colWidths=[504])
    conc_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f1f5f9')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#94a3b8')),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(conc_table)

    # Build PDF
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated {filename}")

if __name__ == '__main__':
    target_path = sys.argv[1] if len(sys.argv) > 1 else 'Meadowlands_Complete_Events_Guide.pdf'
    build_pdf(target_path)
