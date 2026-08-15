// server/utils/pdfGenerator.js
import PDFDocument from 'pdfkit';

export const generateInvoicePDF = (invoice, companyProfile) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const buffers = [];

    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', (err) => reject(err));

    const isPaid = invoice.balanceAmount <= 0;

    // --- Header Section ---
    doc
      .fontSize(18)
      .font('Helvetica-Bold')
      .fillColor('#0f172a')
      .text(companyProfile?.businessName || 'SHREE SAI TYRES', 40, 40);

    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#475569')
      .text(
        companyProfile?.address ||
          'Main Road, Auto Market, District Maharashtra',
        40,
        65,
      )
      .text(
        `Phone: ${companyProfile?.mobile || 'N/A'} | Email: ${
          companyProfile?.email || 'N/A'
        }`,
      )
      .text(`GSTIN: ${companyProfile?.gstin || '27AAAAA0000A1Z5'}`);

    // Tax Invoice Title & Meta (Right aligned)
    doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .fillColor('#1e3a8a')
      .text('TAX INVOICE', 350, 40, { align: 'right' });

    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#334155')
      .text(`Invoice No: ${invoice.invoiceNumber || 'N/A'}`, 350, 60, {
        align: 'right',
      })
      .text(
        `Invoice Date: ${new Date(invoice.invoiceDate).toLocaleDateString(
          'en-IN',
        )}`,
        350,
        75,
        { align: 'right' },
      )
      .text(`Status: ${isPaid ? 'PAID' : 'PENDING / PARTIAL'}`, 350, 90, {
        align: 'right',
      });

    // Divider
    doc
      .moveTo(40, 115)
      .lineTo(555, 115)
      .strokeColor('#cbd5e1')
      .lineWidth(1)
      .stroke();

    // --- Billed To Section ---
    let y = 130;
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#0f172a')
      .text('Billed To:', 40, y);

    y += 15;
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#1e293b')
      .text(invoice.customer?.name || 'Customer Name', 40, y);

    y += 14;
    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#475569')
      .text(`Phone: ${invoice.customer?.mobile || 'N/A'}`, 40, y)
      .text(
        `GSTIN: ${invoice.customer?.gstin || 'URP (Unregistered)'}`,
        40,
        y + 12,
      )
      .text(
        `Address: ${invoice.customer?.shippingAddress || 'N/A'}`,
        40,
        y + 24,
      )
      .text(
        `Place of Supply: ${invoice.customer?.placeOfSupply || 'Maharashtra'}`,
        40,
        y + 36,
      );

    y += 55;

    // --- Items Table Header ---
    doc.rect(40, y, 515, 20).fill('#2563eb');

    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('#ffffff')
      .text('#', 45, y + 5, { width: 20 })
      .text('Item Description', 70, y + 5, { width: 150 })
      .text('HSN', 225, y + 5, { width: 50 })
      .text('Qty', 280, y + 5, { width: 45 })
      .text('Rate', 330, y + 5, { width: 55, align: 'right' })
      .text('Taxable', 390, y + 5, { width: 55, align: 'right' })
      .text('Tax', 450, y + 5, { width: 50, align: 'right' })
      .text('Total', 505, y + 5, { width: 45, align: 'right' });

    y += 22;

    // --- Items Table Rows ---
    doc.font('Helvetica').fontSize(8.5).fillColor('#1e293b');

    (invoice.items || []).forEach((item, index) => {
      const lineTaxable = (item.quantity || 0) * (item.sellingPrice || 0);
      const taxTotal =
        (item.cgstAmount || 0) +
        (item.sgstAmount || 0) +
        (item.igstAmount || 0);

      doc
        .text(`${index + 1}`, 45, y, { width: 20 })
        .text(item.productName || '', 70, y, { width: 150 })
        .text(item.hsn || '-', 225, y, { width: 50 })
        .text(`${item.quantity} ${item.unit || 'PCS'}`, 280, y, { width: 45 })
        .text(`Rs. ${Number(item.sellingPrice || 0).toFixed(2)}`, 330, y, {
          width: 55,
          align: 'right',
        })
        .text(`Rs. ${lineTaxable.toFixed(2)}`, 390, y, {
          width: 55,
          align: 'right',
        })
        .text(`Rs. ${taxTotal.toFixed(2)}`, 450, y, {
          width: 50,
          align: 'right',
        })
        .text(`Rs. ${Number(item.amount || 0).toFixed(2)}`, 505, y, {
          width: 45,
          align: 'right',
        });

      y += 18;

      doc
        .moveTo(40, y - 4)
        .lineTo(555, y - 4)
        .strokeColor('#f1f5f9')
        .lineWidth(0.5)
        .stroke();
    });

    y += 10;

    // --- Footer & Totals Section ---
    const startFooterY = y;

    // Bank Details & Terms (Left Side)
    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('#0f172a')
      .text('Bank Details for Payment', 40, startFooterY);

    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#475569')
      .text(
        `Account Name: ${
          companyProfile?.bankDetails?.accountName ||
          companyProfile?.businessName ||
          'N/A'
        }`,
        40,
        startFooterY + 14,
      )
      .text(
        `Bank: ${companyProfile?.bankDetails?.bankName || 'N/A'}`,
        40,
        startFooterY + 25,
      )
      .text(
        `Account No: ${companyProfile?.bankDetails?.accountNumber || 'N/A'}`,
        40,
        startFooterY + 36,
      )
      .text(
        `IFSC Code: ${companyProfile?.bankDetails?.ifscCode || 'N/A'}`,
        40,
        startFooterY + 47,
      );

    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('#0f172a')
      .text('Terms & Conditions', 40, startFooterY + 68);

    const terms = companyProfile?.termsAndConditions || [
      '1. Goods once sold will not be taken back.',
      '2. Subject to local jurisdiction.',
    ];

    let termsY = startFooterY + 82;
    terms.forEach((term) => {
      doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor('#64748b')
        .text(term, 40, termsY);
      termsY += 11;
    });

    // Totals Table (Right Side)
    const totalsX = 350;
    let totalsY = startFooterY;

    const renderTotalRow = (
      label,
      value,
      isBold = false,
      color = '#334155',
    ) => {
      const numVal = Number(value || 0);
      const formattedVal =
        numVal < 0
          ? `- Rs. ${Math.abs(numVal).toFixed(2)}`
          : `Rs. ${numVal.toFixed(2)}`;

      doc
        .fontSize(8.5)
        .font(isBold ? 'Helvetica-Bold' : 'Helvetica')
        .fillColor(color)
        .text(label, totalsX, totalsY, { width: 120 })
        .text(formattedVal, totalsX + 100, totalsY, {
          width: 105,
          align: 'right',
        });
      totalsY += 14;
    };

    renderTotalRow('Taxable Amount:', invoice.taxableAmount);
    if (invoice.totalCgst > 0) renderTotalRow('Total CGST:', invoice.totalCgst);
    if (invoice.totalSgst > 0) renderTotalRow('Total SGST:', invoice.totalSgst);
    if (invoice.totalIgst > 0) renderTotalRow('Total IGST:', invoice.totalIgst);
    renderTotalRow('Round Off:', invoice.roundOff);

    doc
      .moveTo(totalsX, totalsY - 2)
      .lineTo(555, totalsY - 2)
      .strokeColor('#0f172a')
      .lineWidth(1)
      .stroke();

    totalsY += 4;
    renderTotalRow('Grand Total:', invoice.totalAmount, true, '#0f172a');
    renderTotalRow('Amount Received:', invoice.amountReceived);
    renderTotalRow('Balance Due:', invoice.balanceAmount, true, '#b91c1c');

    // --- Signature Section ---
    const sigY = Math.max(termsY + 20, totalsY + 30);

    doc
      .moveTo(40, sigY + 25)
      .lineTo(160, sigY + 25)
      .strokeColor('#cbd5e1')
      .lineWidth(0.8)
      .stroke();

    doc
      .fontSize(8.5)
      .font('Helvetica')
      .fillColor('#475569')
      .text('Customer Signature', 40, sigY + 30, {
        width: 120,
        align: 'center',
      });

    doc
      .moveTo(435, sigY + 25)
      .lineTo(555, sigY + 25)
      .strokeColor('#cbd5e1')
      .lineWidth(0.8)
      .stroke();

    doc
      .fontSize(8.5)
      .font('Helvetica')
      .fillColor('#475569')
      .text(
        `For ${companyProfile?.businessName || 'SHREE SAI TYRES'}`,
        400,
        sigY + 10,
        { width: 155, align: 'right' },
      )
      .text('Authorized Signatory', 400, sigY + 30, {
        width: 155,
        align: 'right',
      });
    doc.end();
  });
};
