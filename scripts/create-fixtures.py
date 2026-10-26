# Optional fixture regeneration. Requires reportlab and Pillow; fixtures are committed.
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from PIL import Image,ImageDraw,ImageFont
Path('e2e').mkdir(exist_ok=True)
c=canvas.Canvas('e2e/sample-invoice.pdf',pagesize=A4);c.setTitle('InvoiceLens synthetic test invoice');c.setFont('Helvetica-Bold',24);c.drawString(55,775,'INVOICE');c.setFont('Helvetica',12)
for y,text in [(730,'Invoice Number: TEST-2026-001'),(705,'Invoice Date: 2026-10-26'),(660,'SYNTHETIC SAMPLE - NO REAL BUSINESS DATA'),(620,'Design review services'),(590,'Total Due: 1250.00')]:c.drawString(55,y,text)
c.showPage();c.setFont('Helvetica',14);c.drawString(55,775,'Second page - sample terms');c.drawString(55,730,'This is fictional test data.');c.save()
im=Image.new('RGB',(1200,1500),'white');d=ImageDraw.Draw(im);font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',32)
for y,text in [(100,'INVOICE'),(220,'Invoice Number: OCR-90210'),(300,'Invoice Date: 2026-10-26'),(420,'SYNTHETIC SAMPLE - FICTIONAL TEST DATA'),(650,'Total Due: 584.50')]:d.text((80,y),text,font=font,fill='black')
im.save('e2e/ocr-invoice.png')
