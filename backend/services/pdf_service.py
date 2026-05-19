"""
P3 — PDF Estimasi Resmi QHome-MAS
Menggunakan ReportLab untuk generate dokumen PDF berstruktur.
"""
import io
from datetime import datetime, timezone
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether
)

# ─── Palet Warna Qhomemart ────────────────────────────────────────────────────
QHOME_DARK   = colors.HexColor("#1A2332")
QHOME_ACCENT = colors.HexColor("#2A7BE4")
QHOME_LIGHT  = colors.HexColor("#F0F5FF")
QHOME_WARN   = colors.HexColor("#E8A020")
QHOME_MUTED  = colors.HexColor("#6B7A99")
WHITE        = colors.white


def _format_rupiah(amount: float) -> str:
    """Format angka ke Rupiah Indonesia."""
    if amount == 0:
        return "Konfirmasi Staf"
    return "Rp {:,.0f}".format(amount).replace(",", ".")


def _format_qty(qty_str: str) -> str:
    """Membulatkan angka desimal pada string quantity demi estetika cetak."""
    import re
    if not qty_str:
        return "-"
    
    def replace_decimal(match):
        num = float(match.group(1))
        if num.is_integer():
            return str(int(num))
        return "{:.2f}".format(num)
        
    return re.sub(r'(\d+\.\d+)', replace_decimal, qty_str)


def generate_estimation_pdf(
    session_id: str,
    brief: str,
    narrative: str,
    products: list,
    disclaimer: str,
    generated_at: str | None = None,
) -> bytes:
    """
    Hasilkan PDF Estimasi Resmi Qhomemart dan kembalikan sebagai bytes.

    Args:
        session_id: ID sesi untuk nomor referensi
        brief: Ringkasan permintaan klien
        narrative: Narasi profesional dari synthesizer
        products: List dict {name, price, qty, total}
        disclaimer: Teks disclaimer teknis
        generated_at: ISO timestamp dari synthesizer (opsional)

    Returns:
        Bytes dari file PDF yang dihasilkan
    """
    import re
    # Bersihkan seluruh tag <think> dari brief dan narrative demi kebersihan dokumen PDF
    brief = re.sub(r'<think>[\s\S]*?</think>', '', brief, flags=re.IGNORECASE).strip()
    narrative = re.sub(r'<think>[\s\S]*?</think>', '', narrative, flags=re.IGNORECASE).strip()

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
    )

    styles = getSampleStyleSheet()

    # ─── Custom Styles ──────────────────────────────────────────────────────
    style_brand = ParagraphStyle(
        "brand", fontSize=22, textColor=QHOME_DARK,
        fontName="Helvetica-Bold", alignment=TA_LEFT, spaceAfter=0,
    )
    style_tagline = ParagraphStyle(
        "tagline", fontSize=9, textColor=QHOME_MUTED,
        fontName="Helvetica", alignment=TA_LEFT, spaceAfter=4,
    )
    style_doc_title = ParagraphStyle(
        "doc_title", fontSize=14, textColor=WHITE,
        fontName="Helvetica-Bold", alignment=TA_CENTER, spaceAfter=0,
        leading=18,
    )
    style_meta = ParagraphStyle(
        "meta", fontSize=9, textColor=QHOME_MUTED,
        fontName="Helvetica", alignment=TA_LEFT, spaceAfter=2,
    )
    style_section = ParagraphStyle(
        "section", fontSize=11, textColor=QHOME_DARK,
        fontName="Helvetica-Bold", spaceBefore=14, spaceAfter=6,
    )
    style_body = ParagraphStyle(
        "body", fontSize=9.5, textColor=QHOME_DARK,
        fontName="Helvetica", leading=14, alignment=TA_JUSTIFY, spaceAfter=4,
    )
    style_disclaimer = ParagraphStyle(
        "disclaimer", fontSize=8.5, textColor=colors.HexColor("#7A6020"),
        fontName="Helvetica-Oblique", leading=13, alignment=TA_JUSTIFY,
    )
    style_footer = ParagraphStyle(
        "footer", fontSize=8, textColor=QHOME_MUTED,
        fontName="Helvetica", alignment=TA_CENTER,
    )

    # ─── Timestamp ──────────────────────────────────────────────────────────
    if generated_at:
        try:
            dt = datetime.fromisoformat(generated_at)
        except Exception:
            dt = datetime.now(timezone.utc)
    else:
        dt = datetime.now(timezone.utc)

    # Konversi ke WIB (UTC+7)
    from datetime import timedelta
    wib = dt + timedelta(hours=7)
    timestamp_str = wib.strftime("%d %B %Y, %H:%M WIB")
    ref_id = f"QH-{session_id[:8].upper()}"

    # ─── Build Story ────────────────────────────────────────────────────────
    story = []

    # ── Header Brand ──────────────────────────────────────────────────────
    header_data = [[
        Paragraph("<b>QHome</b>mart", style_brand),
        Paragraph(
            f"<b>ESTIMASI MATERIAL RESMI</b><br/><font size='9'>#{ref_id}</font>",
            ParagraphStyle("hdr_right", fontSize=12, textColor=QHOME_ACCENT,
                           fontName="Helvetica-Bold", alignment=TA_CENTER + 1)  # TA_RIGHT=2
        )
    ]]
    header_table = Table(header_data, colWidths=["60%", "40%"])
    header_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(header_table)
    story.append(Paragraph("Terlengkap · Terbesar · Termurah | Jl. Raya Janti Ringroad Timur No. 96, Banguntapan", style_tagline))
    story.append(HRFlowable(width="100%", thickness=1.5, color=QHOME_ACCENT, spaceAfter=10))

    # ── Meta Info ─────────────────────────────────────────────────────────
    meta_data = [
        ["Tanggal Estimasi:", timestamp_str, "Nomor Referensi:", ref_id],
        ["Disiapkan oleh:", "QHome-MAS Digital Office", "Status:", "Estimasi Awal (Belum Final)"],
    ]
    meta_table = Table(meta_data, colWidths=["25%", "35%", "20%", "20%"])
    meta_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 8.5),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (2, 0), (2, -1), "Helvetica-Bold"),
        ("TEXTCOLOR", (0, 0), (-1, -1), QHOME_MUTED),
        ("TEXTCOLOR", (1, 0), (1, -1), QHOME_DARK),
        ("TEXTCOLOR", (3, 0), (3, -1), QHOME_WARN),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 10))

    # ── Brief Klien ───────────────────────────────────────────────────────
    story.append(Paragraph("RINGKASAN PERMINTAAN KLIEN", style_section))
    brief_box = Table(
        [[Paragraph(brief, style_body)]],
        colWidths=["100%"],
    )
    brief_box.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), QHOME_LIGHT),
        ("BOX", (0, 0), (-1, -1), 0.5, QHOME_ACCENT),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(brief_box)
    story.append(Spacer(1, 8))

    # ── Narasi Analisis ───────────────────────────────────────────────────
    story.append(Paragraph("ANALISIS & REKOMENDASI TIM SPESIALIS", style_section))
    for para in narrative.split("\n\n"):
        para = para.strip()
        if para:
            story.append(Paragraph(para, style_body))
    story.append(Spacer(1, 10))

    # ── Tabel Produk ──────────────────────────────────────────────────────
    story.append(Paragraph("DAFTAR ESTIMASI MATERIAL", style_section))

    if products:
        tbl_header = ["No.", "Nama Produk", "Estimasi Qty", "Harga Satuan", "Total Estimasi"]
        tbl_data = [tbl_header]
        grand_total = 0

        for i, p in enumerate(products, 1):
            price = float(p.get("price", 0))
            total = float(p.get("total", 0))
            grand_total += total
            
            import re
            p_name = p.get("name", "-")
            is_sub = "substitusi" in p.get("qty", "").lower()
            is_limited = "[stok terbatas]" in p_name.lower()
            is_empty = "[stok habis]" in p_name.lower()
            
            clean_name = re.sub(r'\[.*?\]\s*', '', p_name)
            if is_sub:
                clean_name = f"{clean_name} (Substitusi)"
            elif is_limited:
                clean_name = f"{clean_name} (Menunggu Konfirmasi)"
            elif is_empty:
                clean_name = f"{clean_name} (Stok Kosong)"

            tbl_data.append([
                str(i),
                clean_name,
                _format_qty(p.get("qty", "-")),
                _format_rupiah(price),
                _format_rupiah(total),
            ])

        # Grand Total row
        tbl_data.append(["", "", "", "TOTAL ESTIMASI", _format_rupiah(grand_total)])

        col_widths = ["5%", "40%", "20%", "17%", "18%"]
        # Convert % to absolute
        page_w = A4[0] - 4 * cm
        col_w_abs = [page_w * float(c.rstrip("%")) / 100 for c in col_widths]

        prod_table = Table(tbl_data, colWidths=col_w_abs, repeatRows=1)
        prod_table.setStyle(TableStyle([
            # Header
            ("BACKGROUND", (0, 0), (-1, 0), QHOME_DARK),
            ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, 0), 9),
            ("ALIGN", (0, 0), (-1, 0), "CENTER"),
            ("TOPPADDING", (0, 0), (-1, 0), 8),
            ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
            # Body rows
            ("FONTNAME", (0, 1), (-1, -2), "Helvetica"),
            ("FONTSIZE", (0, 1), (-1, -2), 9),
            ("TEXTCOLOR", (0, 1), (-1, -2), QHOME_DARK),
            ("ALIGN", (0, 1), (0, -1), "CENTER"),
            ("ALIGN", (2, 1), (-1, -1), "RIGHT"),
            ("TOPPADDING", (0, 1), (-1, -2), 6),
            ("BOTTOMPADDING", (0, 1), (-1, -2), 6),
            # Alternating rows
            ("ROWBACKGROUNDS", (0, 1), (-1, -2), [WHITE, QHOME_LIGHT]),
            # Grand total row
            ("BACKGROUND", (0, -1), (-1, -1), QHOME_ACCENT),
            ("TEXTCOLOR", (0, -1), (-1, -1), WHITE),
            ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
            ("FONTSIZE", (0, -1), (-1, -1), 10),
            ("TOPPADDING", (0, -1), (-1, -1), 8),
            ("BOTTOMPADDING", (0, -1), (-1, -1), 8),
            # Grid
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#D0D9EE")),
        ]))
        story.append(prod_table)
    else:
        story.append(Paragraph("Tidak ada produk yang berhasil diestimasi untuk brief ini.", style_body))

    story.append(Spacer(1, 16))

    # ── Disclaimer (P6) ───────────────────────────────────────────────────
    disclaimer_box = Table(
        [[Paragraph(disclaimer, style_disclaimer)]],
        colWidths=["100%"],
    )
    disclaimer_box.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#FFF8E8")),
        ("BOX", (0, 0), (-1, -1), 0.8, QHOME_WARN),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(KeepTogether([
        Paragraph("DISCLAIMER TEKNIS", style_section),
        disclaimer_box,
    ]))

    story.append(Spacer(1, 20))
    story.append(HRFlowable(width="100%", thickness=0.5, color=QHOME_MUTED, spaceBefore=4))
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        "Dokumen ini digenerate otomatis oleh QHome-MAS Digital Office · qhomemart.com · (0274) XXX-XXXX",
        style_footer
    ))

    doc.build(story)
    buffer.seek(0)
    return buffer.read()
