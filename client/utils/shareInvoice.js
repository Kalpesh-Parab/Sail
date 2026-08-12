// client/utils/shareInvoice.js
import axios from 'axios';

export const sharePdfViaNativeWhatsApp = async (invoice) => {
  try {
    // 1. Fetch PDF binary blob from backend
    const res = await axios.get(`/api/invoices/${invoice._id}/pdf`, {
      responseType: 'blob',
    });

    const pdfFile = new File(
      [res.data],
      `Invoice_${invoice.invoiceNumber.replace('/', '-')}.pdf`,
      { type: 'application/pdf' }
    );

    // 2. Check if browser supports Web Share API with File attachments
    if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
      await navigator.share({
        files: [pdfFile],
        title: `Invoice #${invoice.invoiceNumber}`,
        text: `Tax Invoice from Shree Sai Tyres for ${invoice.customer?.name}`,
      });
    } else {
      // Fallback: Open wa.me link with hosted PDF download link
      const publicPdfUrl = `${window.location.origin}/api/invoices/${invoice._id}/pdf`;
      let cleanMobile = invoice.customer.mobile.replace(/\D/g, '');
      if (cleanMobile.length === 10) cleanMobile = `91${cleanMobile}`;

      const msg = `Hello ${invoice.customer.name}, view/download your Tax Invoice #${invoice.invoiceNumber} here: ${publicPdfUrl}`;
      window.open(`https://api.whatsapp.com/send?phone=${cleanMobile}&text=${encodeURIComponent(msg)}`, '_blank');
    }
  } catch (err) {
    console.error('Sharing failed:', err);
    alert('Failed to generate PDF for sharing.');
  }
};