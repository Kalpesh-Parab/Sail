import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const extractInvoice = async (invoiceText) => {
  const prompt = `
You are an expert GST Invoice Parser.

Your task is to extract invoice information from the given text.

Return ONLY valid JSON.
Do not explain.
Do not wrap inside markdown.

Schema:
{
  "vendor": {
    "name": "",
    "gst": "",
    "address": ""
  },
  "invoice": {
    "number": "",
    "date": "",
    "total": 0
  },
  "products": [
    {
      "productName": "",
      "hsn": "",
      "quantity": 0,
      "unit": "",
      "purchasePrice": 0,
      "mrp": 0,
      "amount": 0
    }
  ],
  "warnings": [],
  "confidence": 100
}

Rules:
1. Ignore Bank Details, Declaration, and Authorised Signatory.
2. purchasePrice MUST ALWAYS BE THE TAX-INCLUSIVE UNIT PRICE (Rate Incl. of Tax):
   - If a column like "Rate (Incl. of Tax)", "Gross Rate", or "MRP/Incl Rate" exists, extract that directly as purchasePrice.
   - If only untaxed "Rate" or "Taxable Value" is present, calculate: purchasePrice = (Taxable Rate) * (1 + GST_Rate% / 100).
3. "amount" should reflect the total tax-inclusive line item amount (quantity * purchasePrice).
4. Product quantity, purchasePrice, mrp, and amount must always be Numbers (rounded to 2 decimal places).
5. Total should be Number (the final gross payable total invoice amount).
6. If a string value is unavailable, return an empty string.

Invoice Text:
${invoiceText}
`;

  try {
    const response = await client.responses.create({
      model: 'gpt-4.1',
      input: prompt,
    });

    const output = response.output_text;
    return JSON.parse(output);
  } catch (error) {
    console.error(error);
    throw new Error('Unable to parse invoice.');
  }
};

export default extractInvoice;
