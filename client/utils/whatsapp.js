// client/utils/whatsapp.js

export const sendInvoiceOnWhatsApp = (invoice, companyName = 'Shree Sai Tyres') => {
  if (!invoice || !invoice.customer?.mobile) {
    alert('Customer phone number is missing.');
    return;
  }

  // 1. Sanitize Phone Number to International standard (e.g., +91 9834172273 -> 919834172273)
  let cleanMobile = invoice.customer.mobile.replace(/\D/g, '');
  if (cleanMobile.length === 10) {
    cleanMobile = `91${cleanMobile}`; // Add India country code if 10 digits
  }

  // 2. Build Formatted Text Message
  const isPaid = invoice.balanceAmount <= 0;
  const itemsList = invoice.items
    .map((it) => `• ${it.productName} (x${it.quantity}) - ₹${it.amount.toFixed(2)}`)
    .join('%0A');

  const textMessage = 
    `*TAX INVOICE - ${companyName}*%0A` +
    `----------------------------------------%0A` +
    `*Invoice No:* ${invoice.invoiceNumber}%0A` +
    `*Date:* ${new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}%0A` +
    `*Customer Name:* ${invoice.customer.name}%0A%0A` +
    `*Items:*%0A${itemsList}%0A%0A` +
    `*Grand Total:* ₹${invoice.totalAmount.toFixed(2)}%0A` +
    `*Amount Paid:* ₹${invoice.amountReceived.toFixed(2)}%0A` +
    `*Balance Due:* ₹${invoice.balanceAmount.toFixed(2)}%0A` +
    `*Status:* ${isPaid ? 'PAID ✅' : 'PENDING ⏳'}%0A` +
    `----------------------------------------%0A` +
    `Thank you for doing business with us!`;

  // 3. Open WhatsApp Direct Deep Link
  const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanMobile}&text=${textMessage}`;
  window.open(whatsappUrl, '_blank');
};