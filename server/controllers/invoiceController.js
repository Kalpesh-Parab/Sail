// server/controllers/invoiceController.js
import Invoice from '../models/Invoice.js';
import Inventory from '../models/Inventory.js';
import CompanyProfile from '../models/CompanyProfile.js';
import { sock, isWhatsappConnected } from '../utils/baileysBot.js';
import { generateInvoicePDF } from '../utils/pdfGenerator.js';

/**
 * 🟢 Helper Function: Calculates the Indian Financial Year (April 1 to March 31)
 * and sequence number.
 * - FY 2026-27: Starts at sequence 67 (66 offline invoices + 1).
 * - FY 2027-28+: Resets sequence back to 1.
 */
const getNextInvoiceDetails = async (targetDate) => {
  const date = targetDate ? new Date(targetDate) : new Date();
  const year = date.getFullYear();
  const month = date.getMonth(); // 0 = Jan, 3 = Apr, 11 = Dec

  // Indian FY starts on April 1st (month index 3)
  const startYear = month >= 3 ? year : year - 1;
  const endYear = startYear + 1;
  const invoicePrefix = `${startYear}-${String(endYear).slice(-2)}/`;

  // Count invoices created for this specific Financial Year prefix
  const countInCurrentFy = await Invoice.countDocuments({ invoicePrefix });

  // Apply offset of 66 for FY 2026-27 so the first invoice starts at #67
  let sequenceNumber = countInCurrentFy + 1;
  if (invoicePrefix === '2026-27/') {
    sequenceNumber += 66;
  }

  const invoiceNumber = `${invoicePrefix}${sequenceNumber}`;

  return { invoicePrefix, sequenceNumber, invoiceNumber };
};

// 1. WhatsApp Free PDF Sender (Using Baileys)
export const sendInvoiceWhatsAppFree = async (req, res) => {
  try {
    if (!sock || !isWhatsappConnected) {
      return res.status(503).json({
        success: false,
        message: 'WhatsApp Bot is offline. Please scan the QR code to pair.',
      });
    }

    const { id } = req.params;
    const { overrideMobile } = req.body || {};

    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res
        .status(404)
        .json({ success: false, message: 'Invoice not found.' });
    }

    const targetMobile = overrideMobile || invoice.customer?.mobile;
    if (!targetMobile) {
      return res
        .status(400)
        .json({ success: false, message: 'Mobile number is missing.' });
    }

    // Sanitize phone number (strips leading 0s and adds 91 country code)
    let cleanMobile = String(targetMobile).replace(/\D/g, '');
    if (cleanMobile.startsWith('0')) {
      cleanMobile = cleanMobile.substring(1);
    }
    if (cleanMobile.length === 10) {
      cleanMobile = `91${cleanMobile}`;
    }

    const recipientJid = `${cleanMobile}@s.whatsapp.net`;

    // Generate PDF Buffer
    const companyProfile = await CompanyProfile.findOne();
    const pdfBuffer = await generateInvoicePDF(invoice, companyProfile);

    const isPaid = Number(invoice.balanceAmount || 0) <= 0;
    const totalVal = Number(invoice.totalAmount || 0).toFixed(2);
    const caption =
      `*Shree Sai Tyres - Tax Invoice*\n` +
      `Invoice No: *${invoice.invoiceNumber || 'N/A'}*\n` +
      `Customer: *${invoice.customer?.name || 'Customer'}*\n` +
      `Total Amount: *Rs. ${totalVal}*\n` +
      `Status: *${isPaid ? 'PAID ✅' : 'PENDING ⏳'}*\n\n` +
      `Please find your invoice PDF attached below. Thank you for your business!`;

    // 15-Second Timeout Promise
    const sendPromise = sock.sendMessage(recipientJid, {
      document: pdfBuffer,
      mimetype: 'application/pdf',
      fileName: `Invoice_${invoice.sequenceNumber || '1'}.pdf`,
      caption: caption,
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(
              'WhatsApp socket delivery timed out. Check if number is valid.',
            ),
          ),
        15000,
      ),
    );

    await Promise.race([sendPromise, timeoutPromise]);

    return res.status(200).json({
      success: true,
      message: `PDF Invoice #${invoice.invoiceNumber} delivered to +${cleanMobile}!`,
    });
  } catch (error) {
    console.error('Baileys WhatsApp Delivery Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to send WhatsApp invoice.',
    });
  }
};

// 2. Stream PDF Direct Download Route
export const getInvoicePdf = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).send('Invoice not found');

    const companyProfile = await CompanyProfile.findOne();
    const pdfBuffer = await generateInvoicePDF(invoice, companyProfile);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename=Invoice_${invoice.sequenceNumber}.pdf`,
    );
    return res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF Stream Error:', error);
    return res.status(500).send('Error generating PDF stream');
  }
};

// 3. Create Invoice (With Dynamic FY & Offset Logic)
export const createInvoice = async (req, res) => {
  try {
    const {
      customer,
      items,
      paymentTerms = 30,
      invoiceDate,
      amountReceived = 0,
      notes = '',
    } = req.body;

    if (!customer || !customer.name) {
      return res.status(400).json({
        success: false,
        message: 'Customer details with a valid name are required.',
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invoice must contain at least one item.',
      });
    }

    for (const item of items) {
      const invItem = await Inventory.findById(item.inventoryId);
      if (!invItem) {
        return res.status(400).json({
          success: false,
          message: `Product "${item.productName}" was not found in inventory.`,
        });
      }
      if (item.quantity > invItem.quantity) {
        return res.status(400).json({
          success: false,
          message: `Requested quantity for "${item.productName}" (${item.quantity}) exceeds available stock (${invItem.quantity}).`,
        });
      }
    }

    const parsedInvoiceDate = invoiceDate ? new Date(invoiceDate) : new Date();

    // 🟢 DYNAMIC FINANCIAL YEAR & SEQUENCE CALCULATION
    const { invoicePrefix, sequenceNumber, invoiceNumber } =
      await getNextInvoiceDetails(parsedInvoiceDate);

    const isIntraState = customer.placeOfSupply === 'Maharashtra';

    let taxableAmount = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;

    const formattedItems = items.map((item) => {
      const lineTaxable = (item.quantity || 0) * (item.sellingPrice || 0);
      taxableAmount += lineTaxable;

      let cgst = 0;
      let sgst = 0;
      let igst = 0;

      if (isIntraState) {
        cgst = Math.round(lineTaxable * 0.09 * 100) / 100;
        sgst = Math.round(lineTaxable * 0.09 * 100) / 100;
        totalCgst += cgst;
        totalSgst += sgst;
      } else {
        igst = Math.round(lineTaxable * 0.18 * 100) / 100;
        totalIgst += igst;
      }

      const totalLine = lineTaxable + cgst + sgst + igst;

      return {
        inventoryId: item.inventoryId,
        productName: item.productName,
        hsn: item.hsn || '',
        quantity: Number(item.quantity),
        unit: item.unit || 'PCS',
        sellingPrice: Number(item.sellingPrice),
        taxRate: Number(item.taxRate || 18),
        cgstAmount: cgst,
        sgstAmount: sgst,
        igstAmount: igst,
        amount: totalLine,
      };
    });

    const rawTotal = taxableAmount + totalCgst + totalSgst + totalIgst;
    const totalAmount = Math.round(rawTotal);
    const roundOff = Math.round((totalAmount - rawTotal) * 100) / 100;

    const received = Math.max(0, Number(amountReceived) || 0);
    const balanceAmount = Math.max(0, totalAmount - received);

    const dueDate = new Date(parsedInvoiceDate);
    dueDate.setDate(dueDate.getDate() + Number(paymentTerms));

    const invoice = new Invoice({
      invoicePrefix,
      sequenceNumber,
      invoiceNumber,
      invoiceDate: parsedInvoiceDate,
      dueDate,
      paymentTerms: Number(paymentTerms),
      customer,
      items: formattedItems,
      taxableAmount: Math.round(taxableAmount * 100) / 100,
      totalCgst: Math.round(totalCgst * 100) / 100,
      totalSgst: Math.round(totalSgst * 100) / 100,
      totalIgst: Math.round(totalIgst * 100) / 100,
      roundOff,
      totalAmount,
      amountReceived: received,
      balanceAmount,
      notes,
    });

    await invoice.save();

    for (const item of items) {
      await Inventory.findByIdAndUpdate(item.inventoryId, {
        $inc: { quantity: -item.quantity },
      });
    }

    return res.status(201).json({ success: true, invoice });
  } catch (error) {
    console.error('Create Invoice Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Get All Invoices
export const getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, invoices });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Get Single Invoice by ID
export const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res
        .status(404)
        .json({ success: false, message: 'Invoice not found' });
    }
    return res.status(200).json({ success: true, invoice });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Update Invoice
export const updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      customer,
      items,
      paymentTerms = 30,
      invoiceDate,
      amountReceived = 0,
      notes = '',
    } = req.body;

    const existingInvoice = await Invoice.findById(id);
    if (!existingInvoice) {
      return res
        .status(404)
        .json({ success: false, message: 'Invoice not found' });
    }

    for (const oldItem of existingInvoice.items) {
      if (oldItem.inventoryId) {
        await Inventory.findByIdAndUpdate(oldItem.inventoryId, {
          $inc: { quantity: oldItem.quantity },
        });
      }
    }

    for (const item of items) {
      const invItem = await Inventory.findById(item.inventoryId);
      if (!invItem) {
        return res.status(400).json({
          success: false,
          message: `Product "${item.productName}" not found in inventory.`,
        });
      }
      if (item.quantity > invItem.quantity) {
        return res.status(400).json({
          success: false,
          message: `Requested quantity for "${item.productName}" (${item.quantity}) exceeds available stock (${invItem.quantity}).`,
        });
      }
    }

    const isIntraState = customer.placeOfSupply === 'Maharashtra';
    let taxableAmount = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;

    const formattedItems = items.map((item) => {
      const lineTaxable = (item.quantity || 0) * (item.sellingPrice || 0);
      taxableAmount += lineTaxable;

      let cgst = 0,
        sgst = 0,
        igst = 0;

      if (isIntraState) {
        cgst = Math.round(lineTaxable * 0.09 * 100) / 100;
        sgst = Math.round(lineTaxable * 0.09 * 100) / 100;
        totalCgst += cgst;
        totalSgst += sgst;
      } else {
        igst = Math.round(lineTaxable * 0.18 * 100) / 100;
        totalIgst += igst;
      }

      return {
        inventoryId: item.inventoryId,
        productName: item.productName,
        hsn: item.hsn || '',
        quantity: Number(item.quantity),
        unit: item.unit || 'PCS',
        sellingPrice: Number(item.sellingPrice),
        taxRate: Number(item.taxRate || 18),
        cgstAmount: cgst,
        sgstAmount: sgst,
        igstAmount: igst,
        amount: lineTaxable + cgst + sgst + igst,
      };
    });

    const rawTotal = taxableAmount + totalCgst + totalSgst + totalIgst;
    const totalAmount = Math.round(rawTotal);
    const roundOff = Math.round((totalAmount - rawTotal) * 100) / 100;

    const received = Math.max(0, Number(amountReceived) || 0);
    const balanceAmount = Math.max(0, totalAmount - received);

    const parsedInvoiceDate = invoiceDate
      ? new Date(invoiceDate)
      : existingInvoice.invoiceDate;
    const dueDate = new Date(parsedInvoiceDate);
    dueDate.setDate(dueDate.getDate() + Number(paymentTerms));

    existingInvoice.customer = customer;
    existingInvoice.items = formattedItems;
    existingInvoice.paymentTerms = Number(paymentTerms);
    existingInvoice.invoiceDate = parsedInvoiceDate;
    existingInvoice.dueDate = dueDate;
    existingInvoice.taxableAmount = Math.round(taxableAmount * 100) / 100;
    existingInvoice.totalCgst = Math.round(totalCgst * 100) / 100;
    existingInvoice.totalSgst = Math.round(totalSgst * 100) / 100;
    existingInvoice.totalIgst = Math.round(totalIgst * 100) / 100;
    existingInvoice.roundOff = roundOff;
    existingInvoice.totalAmount = totalAmount;
    existingInvoice.amountReceived = received;
    existingInvoice.balanceAmount = balanceAmount;
    existingInvoice.notes = notes;

    await existingInvoice.save();

    for (const item of items) {
      await Inventory.findByIdAndUpdate(item.inventoryId, {
        $inc: { quantity: -item.quantity },
      });
    }

    return res.status(200).json({ success: true, invoice: existingInvoice });
  } catch (error) {
    console.error('Update Invoice Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Delete Invoice
export const deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res
        .status(404)
        .json({ success: false, message: 'Invoice not found' });
    }

    for (const item of invoice.items) {
      if (item.inventoryId) {
        await Inventory.findByIdAndUpdate(item.inventoryId, {
          $inc: { quantity: item.quantity },
        });
      }
    }

    await Invoice.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Invoice deleted and inventory stock restored successfully.',
    });
  } catch (error) {
    console.error('Delete Invoice Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
