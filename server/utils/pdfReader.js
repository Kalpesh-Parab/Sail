import fs from 'fs';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

const readPdf = async (filePath) => {
  try {
    const buffer = fs.readFileSync(filePath);

    const pdf = await pdfjsLib.getDocument({
      data: new Uint8Array(buffer),
    }).promise;

    let extractedText = '';

    for (let page = 1; page <= pdf.numPages; page++) {
      const currentPage = await pdf.getPage(page);

      const textContent = await currentPage.getTextContent();

      const pageText = textContent.items.map((item) => item.str).join(' ');

      extractedText += `${pageText}\n`;
    }

    return extractedText.trim();
  } catch (error) {
    console.error(error);

    throw new Error('Unable to read PDF.');
  }
};

export default readPdf;
