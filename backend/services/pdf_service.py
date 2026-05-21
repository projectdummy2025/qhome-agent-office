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


def _create_qris_drawing(width: float = 120, height: float = 120) -> Drawing:
    """
    Menggambar barcode QRIS dummy secara vektor menggunakan objek ReportLab shapes.
    Sangat mandiri tanpa library eksternal, performa tinggi, dan aman.
    """
    from reportlab.graphics.shapes import Drawing, Rect, String
    
    d = Drawing(width, height)
    
    # Background Box dengan bayangan tipis/border
    d.add(Rect(0, 0, width, height, fillColor=colors.white, strokeColor=colors.HexColor("#CBD5E1"), strokeWidth=1, rx=8, ry=8))
    
    # QRIS Dark Header Strip
    d.add(Rect(0, height - 18, width, 18, fillColor=colors.HexColor("#1E293B"), strokeColor=None, rx=4, ry=4))
    
    # Teks "QRIS" putih elegan di header
    d.add(String(width / 2.0, height - 13, "QRIS RESMI", textAnchor="middle", fontName="Helvetica-Bold", fontSize=7.5, fillColor=colors.white))
    
    # Corner square markers for QR Code (Simulasi Posisi Penjajaran QR Code)
    marker_size = 18
    # Top-Left Marker
    d.add(Rect(8, height - 42, marker_size, marker_size, fillColor=colors.white, strokeColor=colors.black, strokeWidth=3))
    d.add(Rect(12, height - 38, 10, 10, fillColor=colors.black, strokeColor=None))
    
    # Top-Right Marker
    d.add(Rect(width - 26, height - 42, marker_size, marker_size, fillColor=colors.white, strokeColor=colors.black, strokeWidth=3))
    d.add(Rect(width - 22, height - 38, 10, 10, fillColor=colors.black, strokeColor=None))
    
    # Bottom-Left Marker
    d.add(Rect(8, 8, marker_size, marker_size, fillColor=colors.white, strokeColor=colors.black, strokeWidth=3))
    d.add(Rect(12, 12, 10, 10, fillColor=colors.black, strokeColor=None))
    
    # Bottom-Right Marker (Kecil/Alignment)
    d.add(Rect(width - 22, 10, 10, 10, fillColor=colors.white, strokeColor=colors.black, strokeWidth=2))
    d.add(Rect(width - 19, 13, 4, 4, fillColor=colors.black, strokeColor=None))
    
    # Simulated QR bits (Random squares & lines inside center areas)
    d.add(Rect(32, height - 40, 6, 6, fillColor=colors.black, strokeColor=None))
    d.add(Rect(44, height - 32, 10, 4, fillColor=colors.black, strokeColor=None))
    d.add(Rect(60, height - 42, 4, 10, fillColor=colors.black, strokeColor=None))
    d.add(Rect(72, height - 36, 6, 6, fillColor=colors.black, strokeColor=None))
    
    d.add(Rect(32, 32, 10, 10, fillColor=colors.black, strokeColor=None))
    d.add(Rect(50, 40, 6, 14, fillColor=colors.black, strokeColor=None))
    d.add(Rect(68, 28, 14, 6, fillColor=colors.black, strokeColor=None))
    d.add(Rect(36, 52, 18, 4, fillColor=colors.black, strokeColor=None))
    
    d.add(Rect(72, 10, 10, 6, fillColor=colors.black, strokeColor=None))
    d.add(Rect(58, 8, 6, 10, fillColor=colors.black, strokeColor=None))
    d.add(Rect(30, 14, 14, 4, fillColor=colors.black, strokeColor=None))
    
    # NMI Text di bagian bawah barcode
    d.add(String(width / 2.0, 2, "NMI: ID10202611775", textAnchor="middle", fontName="Helvetica", fontSize=5.5, fillColor=QHOME_MUTED))
    
    return d


def generate_estimation_pdf(
    session_id: str,
    brief: str,
    narrative: str,
    products: list,
    disclaimer: str,
    generated_at: str | None = None,
    # Parameter Tambahan Transaksi B2B
    order_id: str | None = None,
    client_name: str | None = None,
    client_role: str | None = None,
    materials_total: float | None = None,
    shipping_cost: float | None = None,
    total_invoice: float | None = None,
    truck_type: str | None = None,
    delivery_date: str | None = None,
    distance_km: float | None = None,
    notes: str | None = None,
) -> bytes:
    """
    Hasilkan PDF Estimasi Resmi Qhomemart / Nota Belanja Resmi B2B.
    Mendukung skema checkout dengan QRIS vektor dan detail logistik.
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
    is_official_invoice = order_id is not None
    right_header_title = "NOTA BELANJA B2B" if is_official_invoice else "KOLABORASI DESAIN"
    right_header_subtitle = f"#{order_id}" if is_official_invoice else f"#{ref_id}"
    
    header_data = [[
        Paragraph("<b>QHome</b>mart", style_brand),
        Paragraph(
            f"<b>{right_header_title}</b><br/><font size='9'>{right_header_subtitle}</font>",
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
    status_text = "LUNAS (QRIS)" if is_official_invoice else "Estimasi Awal (Belum Final)"
    meta_data = [
        ["Tanggal Dokumen:", timestamp_str, "Nomor Referensi:", ref_id],
        ["Disiapkan oleh:", "QHome-MAS Digital Office", "Status Dokumen:", status_text],
    ]
    
    # Jika invoice resmi, tambahkan info Klien
    if is_official_invoice:
        meta_data.append(["Identitas Klien:", client_name or "Klien B2B", "Peran Klien:", client_role or "Mitra Profesional"])
        
    meta_table = Table(meta_data, colWidths=["25%", "35%", "20%", "20%"])
    meta_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 8.5),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (2, 0), (2, -1), "Helvetica-Bold"),
        ("TEXTCOLOR", (0, 0), (-1, -1), QHOME_MUTED),
        ("TEXTCOLOR", (1, 0), (1, -1), QHOME_DARK),
        ("TEXTCOLOR", (3, 0), (3, -1), QHOME_WARN if not is_official_invoice else colors.HexColor("#10B981")),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 10))

    # ── Rincian Logistik (Jika Invoice Resmi) ──────────────────────────────
    if is_official_invoice and truck_type:
        story.append(Paragraph("RINCIAN DISTRIBUSI & LOGISTIK B2B", style_section))
        logistics_data = [
            ["Jenis Armada:", truck_type, "Tanggal Pengiriman:", delivery_date or "-"],
            ["Jarak Pengiriman:", f"{distance_km} Km", "Biaya Pengiriman:", _format_rupiah(shipping_cost or 0)],
            ["Catatan Khusus:", notes or "-", "", ""]
        ]
        logistics_table = Table(logistics_data, colWidths=["25%", "35%", "20%", "20%"])
        logistics_table.setStyle(TableStyle([
            ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
            ("FONTSIZE", (0, 0), (-1, -1), 8.5),
            ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
            ("FONTNAME", (2, 0), (2, -1), "Helvetica-Bold"),
            ("TEXTCOLOR", (0, 0), (-1, -1), QHOME_MUTED),
            ("TEXTCOLOR", (1, 0), (1, -1), QHOME_DARK),
            ("TEXTCOLOR", (3, 0), (3, -1), QHOME_DARK),
            ("SPAN", (1, 2), (3, 2)), # Span catatan
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ]))
        story.append(logistics_table)
        story.append(Spacer(1, 8))

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
    list_title = "DAFTAR MATERIAL YANG DIORDER" if is_official_invoice else "DAFTAR KURASI SPESIFIKASI & GAYA"
    story.append(Paragraph(list_title, style_section))

    if products:
        tbl_header = ["No.", "Nama Produk", "Estimasi Qty", "Harga Satuan", "Total Investasi"]
        tbl_data = [tbl_header]
        grand_total = 0

        for i, p in enumerate(products, 1):
            price = float(p.get("price", 0))
            total = float(p.get("total", 0))
            grand_total += total
            
            p_name = p.get("name", "-")
            is_sub = "substitusi" in p.get("qty", "").lower()
            is_limited = "[stok terbatas]" in p_name.lower()
            is_empty = "[stok habis]" in p_name.lower()
            
            clean_name = re.sub(r'\[.*?\]\s*', '', p_name)
            if is_sub:
                clean_name = f"{clean_name} (Substitusi)"
            elif is_limited:
                clean_name = f"{clean_name} (Reservasi Khusus Staf Ahli)"
            elif is_empty:
                clean_name = f"{clean_name} (Alternatif Setara)"

            tbl_data.append([
                str(i),
                clean_name,
                _format_qty(p.get("qty", "-")),
                _format_rupiah(price),
                _format_rupiah(total),
            ])

        # Rincian Summary di bawah tabel
        if is_official_invoice:
            mat_total_val = materials_total if materials_total is not None else grand_total
            ship_cost_val = shipping_cost if shipping_cost is not None else 0
            grand_total_val = total_invoice if total_invoice is not None else (mat_total_val + ship_cost_val)
            
            tbl_data.append(["", "", "", "SUBTOTAL MATERIAL", _format_rupiah(mat_total_val)])
            tbl_data.append(["", "", "", "BIAYA LOGISTIK B2B", _format_rupiah(ship_cost_val)])
            tbl_data.append(["", "", "", "TOTAL INVOICE RESMI", _format_rupiah(grand_total_val)])
        else:
            tbl_data.append(["", "", "", "TOTAL INVESTASI RUANG", _format_rupiah(grand_total)])

        col_widths = ["5%", "40%", "20%", "17%", "18%"]
        page_w = A4[0] - 4 * cm
        col_w_abs = [page_w * float(c.rstrip("%")) / 100 for c in col_widths]

        prod_table = Table(tbl_data, colWidths=col_w_abs, repeatRows=1)
        
        # Base table styling
        t_style = [
            # Header
            ("BACKGROUND", (0, 0), (-1, 0), QHOME_DARK),
            ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, 0), 9),
            ("ALIGN", (0, 0), (-1, 0), "CENTER"),
            ("TOPPADDING", (0, 0), (-1, 0), 8),
            ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
            # Body rows
            ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
            ("FONTSIZE", (0, 1), (-1, -1), 9),
            ("TEXTCOLOR", (0, 1), (-1, -1), QHOME_DARK),
            ("ALIGN", (0, 1), (0, -1), "CENTER"),
            ("ALIGN", (2, 1), (-1, -1), "RIGHT"),
            ("TOPPADDING", (0, 1), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 1), (-1, -1), 6),
        ]
        
        num_prod_rows = len(products)
        t_style.append(("ROWBACKGROUNDS", (0, 1), (-1, num_prod_rows), [WHITE, QHOME_LIGHT]))
        
        if is_official_invoice:
            # Rincian summary (Subtotal & Ongkir) abu-abu terang
            t_style.extend([
                ("FONTNAME", (3, -3), (-1, -3), "Helvetica-Bold"),
                ("BACKGROUND", (3, -3), (-1, -3), colors.HexColor("#F8FAFC")),
                ("FONTNAME", (3, -2), (-1, -2), "Helvetica-Bold"),
                ("BACKGROUND", (3, -2), (-1, -2), colors.HexColor("#F8FAFC")),
                # Grand Total biru aksen mencolok
                ("BACKGROUND", (0, -1), (-1, -1), QHOME_ACCENT),
                ("TEXTCOLOR", (0, -1), (-1, -1), WHITE),
                ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
                ("FONTSIZE", (0, -1), (-1, -1), 10),
                ("TOPPADDING", (0, -1), (-1, -1), 8),
                ("BOTTOMPADDING", (0, -1), (-1, -1), 8),
            ])
        else:
            t_style.extend([
                ("BACKGROUND", (0, -1), (-1, -1), QHOME_ACCENT),
                ("TEXTCOLOR", (0, -1), (-1, -1), WHITE),
                ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
                ("FONTSIZE", (0, -1), (-1, -1), 10),
                ("TOPPADDING", (0, -1), (-1, -1), 8),
                ("BOTTOMPADDING", (0, -1), (-1, -1), 8),
            ])
            
        t_style.append(("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#D0D9EE")))
        
        prod_table.setStyle(TableStyle(t_style))
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
        Paragraph("DISCLAIMER TEKNIS & KETENTUAN", style_section),
        disclaimer_box,
    ]))

    story.append(Spacer(1, 14))

    # ── Informasi Rekening & Validasi Pembayaran ─────────────────────────────
    bank_style_label = ParagraphStyle(
        "bank_label", fontSize=8.5, textColor=QHOME_DARK,
        fontName="Helvetica-Bold", leading=11,
    )
    bank_style_val = ParagraphStyle(
        "bank_val", fontSize=8.5, textColor=QHOME_DARK,
        fontName="Helvetica", leading=11,
    )
    
    if is_official_invoice:
        qris_drawing = _create_qris_drawing()
        bank_data = [
            [
                Paragraph("<b>INSTRUKSI PEMBAYARAN B2B & TRANSFER</b>", bank_style_label),
                Paragraph("<b>SCAN QRIS RESMI PEMBAYARAN</b>", bank_style_label)
            ],
            [
                Paragraph(
                    "Pembayaran B2B wajib dilakukan ke rekening bank korporasi resmi <b>PT QHome Mart</b>:<br/>"
                    "<b>Bank Central Asia (BCA)</b> Cabang Yogyakarta<br/>"
                    "No. Rekening: <b>456-789-1011</b> a.n. <b>PT QHome Mart</b><br/><br/>"
                    "<i>Silakan scan barcode QRIS di samping kanan untuk melakukan simulasi pembayaran instan bernilai legal dari asisten digital Anda.</i>", 
                    bank_style_val
                ),
                qris_drawing
            ]
        ]
        bank_table = Table(bank_data, colWidths=["65%", "35%"])
        bank_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ("LINEBELOW", (0, 0), (-1, 0), 0.5, colors.HexColor("#E2E8F0")),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("ALIGN", (1, 1), (1, 1), "CENTER"),
            ("LEFTPADDING", (0, 0), (-1, -1), 12),
            ("RIGHTPADDING", (0, 0), (-1, -1), 12),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ]))
    else:
        bank_data = [
            [
                Paragraph("<b>INSTRUKSI PEMBAYARAN TRANSFER</b>", bank_style_label),
                Paragraph("<b>MASA BERLAKU PENAWARAN</b>", bank_style_label)
            ],
            [
                Paragraph(
                    "Pembayaran resmi melalui rekening resmi <b>PT QHome Mart</b>:<br/>"
                    "<b>Bank Central Asia (BCA)</b> Cabang Yogyakarta<br/>"
                    "No. Rekening: <b>456-789-1011</b> a.n. <b>PT QHome Mart</b>", 
                    bank_style_val
                ),
                Paragraph(
                    "Estimasi harga dan ketersediaan stok ini berlaku selama <b>14 (empat belas) hari kalender</b> "
                    "sejak tanggal dokumen ini diterbitkan. Setelah masa berlaku habis, koordinasi ulang ketersediaan material diperlukan.", 
                    bank_style_val
                )
            ]
        ]
        bank_table = Table(bank_data, colWidths=["50%", "50%"])
        bank_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ("LINEBELOW", (0, 0), (-1, 0), 0.5, colors.HexColor("#E2E8F0")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 12),
            ("RIGHTPADDING", (0, 0), (-1, -1), 12),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ]))

    # ── Kolom Tanda Tangan Resmi ──────────────────────────────────────────────
    sig_title_style = ParagraphStyle(
        "sig_title", fontSize=8.5, textColor=QHOME_MUTED,
        fontName="Helvetica-Bold", alignment=TA_CENTER,
    )
    sig_name_style = ParagraphStyle(
        "sig_name", fontSize=9, textColor=QHOME_DARK,
        fontName="Helvetica-Bold", alignment=TA_CENTER,
    )
    sig_sub_style = ParagraphStyle(
        "sig_sub", fontSize=8, textColor=QHOME_MUTED,
        fontName="Helvetica", alignment=TA_CENTER,
    )
    
    sig_data = [
        [
            Paragraph("Disiapkan Oleh,<br/><b>QHome-MAS Supervisor</b>", sig_title_style),
            Paragraph("Disetujui & Diterima Oleh,<br/><b>Klien / Pembeli</b>", sig_title_style)
        ],
        [
            Spacer(1, 35),
            Spacer(1, 35)
        ],
        [
            Paragraph("<b>TIM ESTIMATOR QHOME MART</b>", sig_name_style),
            Paragraph("<b>( ___________________________ )</b>", sig_name_style)
        ],
        [
            Paragraph("Divisi Perencanaan B2B & Proyek", sig_sub_style),
            Paragraph("Tanda Tangan & Nama Terang", sig_sub_style)
        ]
    ]
    
    sig_table = Table(sig_data, colWidths=["50%", "50%"])
    sig_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))

    story.append(KeepTogether([
        Paragraph("KETENTUAN PEMBAYARAN & ADMINISTRASI", style_section),
        bank_table,
        Spacer(1, 14),
        sig_table
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

