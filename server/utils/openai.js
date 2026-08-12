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

  "products":[
    {
      "productName":"",
      "hsn":"",
      "quantity":0,
      "unit":"",
      "purchasePrice":0,
      "mrp":0,
      "amount":0
    }
  ],

  "warnings":[],

  "confidence":100
}

Rules:

1. Ignore Bank Details.

2. Ignore Declaration.

3. Ignore Authorised Signatory.

4. Product quantity should always be Number.

5. Product prices should always be Number.

6. Total should be Number.

7. If a value is unavailable, return an empty string.

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