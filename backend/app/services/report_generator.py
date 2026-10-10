import os
from pathlib import Path
from typing import Dict, Any
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from app.core.config import settings

class SituationReportGenerator:
    """
    Generates an official, publication-quality 1-page PDF Situation Report
    strictly grounded in computed geospatial and routing numbers.
    """
    
    @staticmethod
    def generate_pdf(analysis_result: Dict[str, Any], output_path: str) -> str:
        doc = SimpleDocTemplate(
            output_path,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )
        
        styles = getSampleStyleSheet()
        
        # Custom styles
        title_style = ParagraphStyle(
            "DocTitle",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=18,
            leading=22,
            textColor=colors.HexColor("#1e293b")
        )
        
        subtitle_style = ParagraphStyle(
            "DocSubtitle",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=10,
            leading=13,
            textColor=colors.HexColor("#64748b")
        )
        
        h2_style = ParagraphStyle(
            "SectionH2",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=11,
            leading=14,
            textColor=colors.HexColor("#0f172a"),
            spaceBefore=6,
            spaceAfter=4
        )
        
        body_style = ParagraphStyle(
            "BodyDark",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=8.5,
            leading=11.5,
            textColor=colors.HexColor("#334155")
        )
        
        attr_style = ParagraphStyle(
            "AttributionText",
            parent=styles["Normal"],
            fontName="Helvetica-Oblique",
            fontSize=6.5,
            leading=8.5,
            textColor=colors.HexColor("#64748b")
        )
        
        elements = []
        
        # Header banner
        elements.append(Paragraph("FLOODSIGHT AI — DISASTER SITUATION REPORT", title_style))
        elements.append(Paragraph(f"Event: {analysis_result['name']} | Date of Event: {analysis_result['event_date']} | Generated: {analysis_result['created_at'][:10]}", subtitle_style))
        elements.append(Spacer(1, 6))
        elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#2563eb"), spaceAfter=8))
        
        # Top Metrics Grid Table
        infra = analysis_result["infrastructure"]
        cut_off_count = analysis_result["cut_off_settlements_count"]
        area_km2 = analysis_result["total_flood_area_km2"]
        
        metrics_data = [
            [
                Paragraph("<b>Mapped Inundation Area</b>", body_style),
                Paragraph("<b>Exposed Road Network</b>", body_style),
                Paragraph("<b>Critical Bridges Hit</b>", body_style),
                Paragraph("<b>Newly Cut-Off Villages</b>", body_style)
            ],
            [
                Paragraph(f"<font size=14 color='#dc2626'><b>{area_km2} km²</b></font><br/>({analysis_result['total_flood_area_hectares']} ha)", body_style),
                Paragraph(f"<font size=14 color='#ea580c'><b>{infra['exposed_road_length_km']} km</b></font><br/>({infra['percentage_road_disrupted']}% of valley road)", body_style),
                Paragraph(f"<font size=14 color='#b91c1c'><b>{infra['exposed_bridges_count']} / {infra['total_bridges']}</b></font><br/>bridges exposed", body_style),
                Paragraph(f"<font size=14 color='#dc2626'><b>{cut_off_count} Settlements</b></font><br/>isolated from hospitals", body_style)
            ]
        ]
        
        metrics_table = Table(metrics_data, colWidths=[135, 135, 135, 135])
        metrics_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
            ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ]))
        elements.append(metrics_table)
        elements.append(Spacer(1, 8))
        
        # Section 1: Executive Summary & Observations
        elements.append(Paragraph("1. Spaceborne Remote Sensing Assessment", h2_style))
        elements.append(Paragraph(
            "Using Sentinel-1 SAR C-band microwave radar (same relative orbit track 019, 12-day repeat) and Sentinel-2 optical imagery, "
            "the system mapped active inundation and gravel-slurry debris deposition across the Trishuli/Bhote Koshi canyon. "
            "SAR successfully penetrated dense monsoon cloud cover. Topographic slope gating (Copernicus DEM &le; 15°) eliminated radar shadow false positives.",
            body_style
        ))
        elements.append(Spacer(1, 6))
        
        # Section 2: Isolated Settlements Table
        elements.append(Paragraph("2. Critical Settlement Connectivity & Isolation Status", h2_style))
        
        settlement_rows = [
            [
                Paragraph("<b>Settlement Name</b>", body_style),
                Paragraph("<b>Population Est.</b>", body_style),
                Paragraph("<b>Baseline Access</b>", body_style),
                Paragraph("<b>Post-Disaster Status</b>", body_style),
                Paragraph("<b>Alternative Route?</b>", body_style)
            ]
        ]
        
        for s in analysis_result["settlements"]:
            if s["status"] == "newly_cut_off":
                status_text = "<font color='#dc2626'><b>CUT OFF (No Road)</b></font>"
            elif s["status"] == "intact_access":
                status_text = "<font color='#16a34a'><b>Connected</b></font>"
            else:
                status_text = "<font color='#64748b'>Pre-existing Isolated</font>"
                
            alt_text = "Yes (Ridge Track)" if s["alternative_route_available"] else "None"
            
            settlement_rows.append([
                Paragraph(s["name"], body_style),
                Paragraph(str(s["population_est"]), body_style),
                Paragraph(f"{s['baseline_distance_km']} km to hosp", body_style),
                Paragraph(status_text, body_style),
                Paragraph(alt_text, body_style)
            ])
            
        settlement_table = Table(settlement_rows[:7], colWidths=[150, 80, 110, 110, 90])
        settlement_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ]))
        elements.append(settlement_table)
        elements.append(Spacer(1, 8))
        
        # Section 3: Limitations & Mandatory Caveats
        elements.append(Paragraph("3. Operational Limitations & Scientific Honesty", h2_style))
        elements.append(Paragraph(
            "• <b>Temporal Latency:</b> Sentinel-1 revisits occur every 12 days; satellite radar cannot provide real-time advance warnings for sudden glacier outburst events.<br/>"
            "• <b>Exposure vs Structural Collapse:</b> Road/bridge intersection marks physical inundation risk; structural viability requires on-site UAV/ground verification.<br/>"
            "• <b>Deep Shadow:</b> Narrow cliff facets facing away from the radar line-of-sight may obscure localized water.",
            body_style
        ))
        elements.append(Spacer(1, 10))
        
        # Footer: Mandatory Attributions
        elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#94a3b8"), spaceAfter=5))
        for attr in analysis_result["attributions"]:
            elements.append(Paragraph(attr, attr_style))
            
        doc.build(elements)
        return output_path
