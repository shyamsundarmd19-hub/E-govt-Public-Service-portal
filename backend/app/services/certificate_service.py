import os
import io
import base64
import hashlib
import random
from datetime import datetime
from typing import Dict, Any, Optional

import qrcode
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image as RLImage, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

from app.core.config import settings

CERT_STORAGE_DIR = os.path.join(os.getcwd(), "generated_certificates")
os.makedirs(CERT_STORAGE_DIR, exist_ok=True)


def generate_qr_code_image(data_text: str) -> tuple[bytes, str]:
    """
    Generates a QR code image as raw bytes and as a Base64 data URL.
    """
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=8,
        border=2,
    )
    qr.add_data(data_text)
    qr.make(fit=True)

    img = qr.make_image(fill_color="#064e3b", back_color="white")  # Dark emerald on white
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    img_bytes = buffer.getvalue()
    b64_str = base64.b64encode(img_bytes).decode("utf-8")
    data_url = f"data:image/png;base64,{b64_str}"
    return img_bytes, data_url


def generate_certificate_pdf(
    certificate_number: str,
    applicant_name: str,
    service_name: str,
    department: str,
    application_number: str,
    hash_signature: str,
    qr_image_bytes: bytes,
    issued_at: datetime
) -> str:
    """
    Generates an official Government Certificate PDF using ReportLab in landscape mode.
    Returns the file path or URL to the generated PDF.
    """
    filename = f"{certificate_number.replace('/', '_')}.pdf"
    pdf_path = os.path.join(CERT_STORAGE_DIR, filename)

    # Document setup (Landscape letter)
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=landscape(letter),
        rightMargin=0.5 * inch,
        leftMargin=0.5 * inch,
        topMargin=0.5 * inch,
        bottomMargin=0.5 * inch,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    header_style = ParagraphStyle(
        "GovHeader",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#064e3b"),
        alignment=1,  # Center
    )
    
    sub_header_style = ParagraphStyle(
        "GovSubHeader",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#059669"),
        alignment=1,
    )

    title_style = ParagraphStyle(
        "CertTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=24,
        leading=28,
        textColor=colors.HexColor("#0f172a"),
        alignment=1,
    )

    body_style = ParagraphStyle(
        "CertBody",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=12,
        leading=18,
        textColor=colors.HexColor("#334155"),
        alignment=1,
    )

    meta_style = ParagraphStyle(
        "CertMeta",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#64748b"),
    )

    hash_style = ParagraphStyle(
        "CertHash",
        parent=styles["Normal"],
        fontName="Courier",
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#047857"),
    )

    story = []

    # Temporary write QR code to disk for ReportLab image inclusion
    qr_temp_path = os.path.join(CERT_STORAGE_DIR, f"qr_{certificate_number.replace('/', '_')}.png")
    with open(qr_temp_path, "wb") as f:
        f.write(qr_image_bytes)

    # Header
    story.append(Spacer(1, 0.1 * inch))
    story.append(Paragraph("GOVERNMENT OF DIGITAL STATE", header_style))
    story.append(Paragraph(f"DEPARTMENT OF {department.upper()} — CLOUDGOV DIGITAL SERVICES", sub_header_style))
    story.append(Spacer(1, 0.2 * inch))

    # Certificate Title
    story.append(Paragraph(f"CERTIFICATE OF {service_name.upper()}", title_style))
    story.append(Spacer(1, 0.25 * inch))

    # Body Content
    cert_text = (
        f"This is to officially certify that <b>{applicant_name}</b> has successfully met all regulatory "
        f"criteria, verified documentation, and statutory requisites for <b>{service_name}</b> under "
        f"the Electronic Governance Facilitation Act.<br/><br/>"
        f"This digitally issued instrument is valid and legally binding across all municipal, state, and "
        f"federal agencies without requiring manual physical endorsement."
    )
    story.append(Paragraph(cert_text, body_style))
    story.append(Spacer(1, 0.3 * inch))

    # Details and QR Code Table
    qr_elem = RLImage(qr_temp_path, width=1.5 * inch, height=1.5 * inch)
    
    details_html = (
        f"<b>Certificate No:</b> {certificate_number}<br/>"
        f"<b>Application Ref:</b> {application_number}<br/>"
        f"<b>Date of Issuance:</b> {issued_at.strftime('%d-%b-%Y %H:%M:%S UTC')}<br/>"
        f"<b>Issuing Authority:</b> Electronic Governance Directorate<br/>"
        f"<b>Cryptographic SHA-256 Hash:</b><br/>"
        f"<font face='Courier' color='#065f46'>{hash_signature[:32]}<br/>{hash_signature[32:]}</font>"
    )
    details_p = Paragraph(details_html, meta_style)

    table_data = [
        [details_p, qr_elem]
    ]
    t = Table(table_data, colWidths=[5.5 * inch, 2.0 * inch])
    t.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f0fdf4")),
        ('BOX', (0, 0), (-1, -1), 1.5, colors.HexColor("#10b981")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#d1fae5")),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('LEFTPADDING', (0, 0), (-1, -1), 14),
        ('RIGHTPADDING', (0, 0), (-1, -1), 14),
    ]))

    story.append(t)
    story.append(Spacer(1, 0.2 * inch))

    # Footer Notice
    footer_text = "Scan the QR Code to verify validity and authenticity on CloudGov National Registry."
    story.append(Paragraph(footer_text, ParagraphStyle("Footer", parent=meta_style, alignment=1)))

    doc.build(story)

    # Clean up temp QR file
    if os.path.exists(qr_temp_path):
        try:
            os.remove(qr_temp_path)
        except Exception:
            pass

    return f"/api/v1/verify/download-certificate/{certificate_number}"


class CertificateService:
    @staticmethod
    def issue_certificate_for_application(
        application_id: str,
        application_number: str,
        applicant_name: str,
        service_name: str,
        department: str
    ) -> Dict[str, Any]:
        """
        Orchestrates certificate issuance:
        1. Generates unique certificate number
        2. Computes SHA-256 cryptographic signature
        3. Generates QR Code pointing to verification endpoint
        4. Compiles high-grade PDF certificate via ReportLab
        """
        now = datetime.utcnow()
        dept_prefix = department[:3].upper() if department else "GOV"
        random_suffix = random.randint(100000, 999999)
        cert_number = f"CG-{dept_prefix}-{now.year}-{random_suffix}"

        # Cryptographic SHA-256 signature
        raw_payload = f"{cert_number}:{application_id}:{applicant_name}:{service_name}:{now.isoformat()}"
        hash_signature = hashlib.sha256(raw_payload.encode("utf-8")).hexdigest()

        # Public verification URL embedded in QR Code
        verify_url = f"/verify/certificate/{cert_number}"

        # Generate QR code
        qr_bytes, qr_data_url = generate_qr_code_image(verify_url)

        # Generate PDF certificate
        pdf_url = generate_certificate_pdf(
            certificate_number=cert_number,
            applicant_name=applicant_name,
            service_name=service_name,
            department=department,
            application_number=application_number,
            hash_signature=hash_signature,
            qr_image_bytes=qr_bytes,
            issued_at=now,
        )

        return {
            "certificate_number": cert_number,
            "hash_signature": hash_signature,
            "qr_code_url": qr_data_url,
            "pdf_url": pdf_url,
            "issued_at": now,
            "issuer_name": "Government of Digital State",
        }


certificate_service = CertificateService()
