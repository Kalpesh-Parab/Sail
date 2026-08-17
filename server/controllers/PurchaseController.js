import { GoogleGenAI, Type } from '@google/genai';
import Purchase from '../models/Purchase.js';
import Inventory from '../models/Inventory.js';

// --- FUZZY MATCHING HELPERS ---

/**
 * Normalizes strings by lowercasing, stripping punctuation, and sorting words alphabetically.
 * Example: "BRIDGESTONE D 215.75 R15" -> "215 75 bridgestone d r15"
 */
const normalizeTokens = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .sort()
    .join(' ');
};

/**
 * Calculates similarity score between 0.0 and 1.0 (Jaccard Index on token sets)
 */
const getSimilarityScore = (str1, str2) => {
  const norm1 = normalizeTokens(str1);
  const norm2 = normalizeTokens(str2);

  if (norm1 === norm2) return 1.0;

  const set1 = new Set(norm1.split(' '));
  const set2 = new Set(norm2.split(' '));

  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return union.size === 0 ? 0 : intersection.size / union.size;
};

const invoiceResponseSchema = {
  type: Type.OBJECT,
  properties: {
    vendor: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        gst: { type: Type.STRING },
        address: { type: Type.STRING },
      },
      required: ['name'],
    },
    invoice: {
      type: Type.OBJECT,
      properties: {
        number: { type: Type.STRING },
        date: { type: Type.STRING },
        total: { type: Type.NUMBER },
      },
      required: ['number', 'date', 'total'],
    },
    products: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          productName: { type: Type.STRING },
          hsn: { type: Type.STRING },
          quantity: { type: Type.NUMBER },
          purchasePrice: { type: Type.NUMBER },
          amount: { type: Type.NUMBER },
        },
        required: ['productName', 'quantity', 'purchasePrice', 'amount'],
      },
    },
  },
  required: ['vendor', 'invoice', 'products'],
};

/**
 * @desc Fast check if invoice exists in DB before sending to AI
 * @route GET /api/purchases/check/:invoiceNumber
 */
export const checkInvoiceExists = async (req, res) => {
  try {
    const { invoiceNumber } = req.params;
    const existing = await Purchase.findOne({ invoiceNumber });

    if (existing) {
      return res.status(200).json({
        exists: true,
        isConfirmed: existing.isConfirmed,
        purchase: existing,
        message: existing.isConfirmed
          ? 'Invoice already added to inventory!'
          : 'Invoice was previously scanned and stored.',
      });
    }

    return res.status(200).json({ exists: false });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc Get all saved purchases
 * @route GET /api/purchases
 */
export const getPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, purchases });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc Parse invoice PDF using Gemini & enrich with similarity matches against existing Inventory
 * @route POST /api/purchases/upload
 */
export const parseInvoice = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: 'No PDF file uploaded.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res
        .status(500)
        .json({ success: false, message: 'GEMINI_API_KEY is missing.' });
    }

    const ai = new GoogleGenAI({ apiKey });

   const promptText = `
You are an expert GST Invoice Parser.
Extract all required invoice fields strictly following the schema.

Important Rules for Prices:
1. "purchasePrice" MUST ALWAYS BE THE TAX-INCLUSIVE UNIT PRICE:
   - If a column like "Rate (Incl. of Tax)", "Gross Rate", or "MRP" is present, extract that exact value.
   - If only an untaxed "Rate" or "Taxable Value" is present, calculate: purchasePrice = (Taxable Rate) * (1 + (CGST% + SGST%)/100).
2. "amount" MUST ALWAYS BE THE TOTAL TAX-INCLUSIVE AMOUNT for that line item (quantity * purchasePrice).
3. Ignore company bank details, terms, declarations, and authorized signatory.
4. Product quantity, purchasePrice, amount, and invoice total must be Numbers rounded to 2 decimal places.
5. Format dates as ISO strings (YYYY-MM-DD) or standard dates.
`;

    const aiRes = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [
        {
          inlineData: {
            mimeType: 'application/pdf',
            data: req.file.buffer.toString('base64'),
          },
        },
        promptText,
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: invoiceResponseSchema,
      },
    });

    const parsedData = JSON.parse(aiRes.text);

    // Fetch existing inventory to run similarity matching
    const existingInventory = await Inventory.find();

    // Enrich each parsed product with potential fuzzy matches from Inventory
    const enrichedProducts = parsedData.products.map((prod) => {
      const matches = existingInventory
        .map((inv) => ({
          inventoryId: inv._id,
          productName: inv.productName,
          similarity: getSimilarityScore(prod.productName, inv.productName),
        }))
        .filter((m) => m.similarity >= 0.55) // Minimum 55% similarity threshold
        .sort((a, b) => b.similarity - a.similarity);

      return {
        ...prod,
        // Best match or null
        matchedInventoryId: matches.length > 0 ? matches[0].inventoryId : null,
        similarMatches: matches,
      };
    });

    parsedData.products = enrichedProducts;

    let purchase = await Purchase.findOne({
      invoiceNumber: parsedData.invoice.number,
    });

    if (!purchase) {
      purchase = await Purchase.create({
        vendor: parsedData.vendor.name,
        invoiceNumber: parsedData.invoice.number,
        invoiceDate: new Date(parsedData.invoice.date),
        totalAmount: parsedData.invoice.total,
        products: parsedData.products,
        isConfirmed: false,
      });
    }

    return res
      .status(200)
      .json({ success: true, invoice: parsedData, purchase });
  } catch (error) {
    console.error('Error parsing PDF invoice:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc Confirm purchase & sync inventory safely with token-similarity fallback
 * @route POST /api/purchases/confirm
 */
export const confirmPurchase = async (req, res) => {
  try {
    const { invoiceNumber, products, vendor, invoiceDate, totalAmount } =
      req.body;

    let purchase = await Purchase.findOne({ invoiceNumber });

    if (!purchase) {
      purchase = new Purchase({
        vendor,
        invoiceNumber,
        invoiceDate,
        totalAmount,
        products,
        isConfirmed: false,
      });
    }

    // Load current inventory list for fallback similarity matching
    const currentInventory = await Inventory.find();

    // 1. STEP ONE: Update Inventory
    for (const prod of products) {
      const pName = prod.productName.trim();
      const newQty = Number(prod.quantity);
      const newPrice = Number(prod.purchasePrice);

      let item = null;

      // Rule A: If user explicitly selected an inventory item in UI dropdown
      if (prod.selectedInventoryId) {
        item = await Inventory.findById(prod.selectedInventoryId);
      }

      // Rule B: Case-insensitive regex match
      if (!item) {
        item = await Inventory.findOne({
          productName: { $regex: new RegExp(`^${pName}$`, 'i') },
        });
      }

      // Rule C: Token Similarity Fallback (Catches word-reordered products like "BRIDGESTONE 215.75" vs "215.75 BRIDGESTONE")
      if (!item) {
        let bestMatch = null;
        let highestScore = 0;

        for (const inv of currentInventory) {
          const score = getSimilarityScore(pName, inv.productName);
          if (score >= 0.8 && score > highestScore) {
            highestScore = score;
            bestMatch = inv;
          }
        }

        if (bestMatch) {
          item = await Inventory.findById(bestMatch._id);
        }
      }

      const purchaseRecord = {
        vendor,
        invoiceNumber,
        invoiceDate: new Date(invoiceDate),
        quantity: newQty,
        purchasePrice: newPrice,
      };

      if (!item) {
        // Create new product if no match was found anywhere
        item = new Inventory({
          productName: pName,
          hsn: prod.hsn || '',
          quantity: newQty,
          purchasePrice: newPrice,
          averagePurchasePrice: newPrice,
          sellingPrice: newPrice,
          lastPurchase: {
            vendor,
            invoiceNumber,
            invoiceDate: new Date(invoiceDate),
            purchasePrice: newPrice,
          },
          purchaseHistory: [purchaseRecord],
        });
      } else {
        // Calculate Weighted Average Purchase Price
        const currentTotalValue =
          item.quantity * (item.averagePurchasePrice || item.purchasePrice);
        const newTotalValue = currentTotalValue + newQty * newPrice;
        const totalQuantity = item.quantity + newQty;

        item.quantity = totalQuantity;
        item.purchasePrice = newPrice;
        item.averagePurchasePrice =
          totalQuantity > 0
            ? Math.round((newTotalValue / totalQuantity) * 100) / 100
            : newPrice;

        if (prod.hsn) item.hsn = prod.hsn;

        item.lastPurchase = {
          vendor,
          invoiceNumber,
          invoiceDate: new Date(invoiceDate),
          purchasePrice: newPrice,
        };

        item.purchaseHistory.push(purchaseRecord);
      }

      await item.save();
    }

    // 2. STEP TWO: Confirm Purchase State
    purchase.isConfirmed = true;
    purchase.confirmedAt = new Date();
    purchase.products = products;

    const savedPurchase = await purchase.save();

    return res.status(200).json({
      success: true,
      message: 'Purchase confirmed & inventory updated successfully!',
      purchase: savedPurchase,
    });
  } catch (error) {
    console.error('Error in confirmPurchase:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to confirm purchase or sync inventory.',
      error: error.message,
    });
  }
};

// Add these exports to server/controllers/purchaseController.js

/**
 * @desc Create Manual Purchase record
 * @route POST /api/purchases/manual
 */
export const addManualPurchase = async (req, res) => {
  try {
    const { vendor, invoiceNumber, invoiceDate, totalAmount, products } =
      req.body;

    if (!vendor || !invoiceNumber || !products || products.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          'Vendor, Invoice Number, and at least one product are required.',
      });
    }

    const existing = await Purchase.findOne({ invoiceNumber });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Invoice #${invoiceNumber} already exists.`,
      });
    }

    const purchase = await Purchase.create({
      vendor,
      invoiceNumber,
      invoiceDate: new Date(invoiceDate),
      totalAmount: Number(totalAmount),
      products,
      isConfirmed: false,
    });

    return res.status(201).json({ success: true, purchase });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Update existing purchase draft / details
 * @route PUT /api/purchases/:id
 */
export const updatePurchase = async (req, res) => {
  try {
    const { id } = req.params;
    const { vendor, invoiceNumber, invoiceDate, totalAmount, products } =
      req.body;

    const purchase = await Purchase.findById(id);
    if (!purchase) {
      return res
        .status(404)
        .json({ success: false, message: 'Purchase not found.' });
    }

    if (purchase.isConfirmed) {
      return res.status(400).json({
        success: false,
        message: 'Confirmed purchases cannot be edited directly.',
      });
    }

    purchase.vendor = vendor || purchase.vendor;
    purchase.invoiceNumber = invoiceNumber || purchase.invoiceNumber;
    purchase.invoiceDate = invoiceDate
      ? new Date(invoiceDate)
      : purchase.invoiceDate;
    purchase.totalAmount = Number(totalAmount) || purchase.totalAmount;
    purchase.products = products || purchase.products;

    await purchase.save();
    return res.status(200).json({ success: true, purchase });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Delete purchase record and revert inventory stock if confirmed
 * @route DELETE /api/purchases/:id
 */
export const deletePurchase = async (req, res) => {
  try {
    const { id } = req.params;
    const purchase = await Purchase.findById(id);

    if (!purchase) {
      return res
        .status(404)
        .json({ success: false, message: 'Purchase not found.' });
    }

    // If confirmed, revert quantities from Inventory
    if (purchase.isConfirmed) {
      for (const prod of purchase.products) {
        await Inventory.findOneAndUpdate(
          {
            productName: {
              $regex: new RegExp(`^${prod.productName.trim()}$`, 'i'),
            },
          },
          { $inc: { quantity: -Number(prod.quantity) } },
        );
      }
    }

    await Purchase.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Purchase deleted and stock adjusted successfully.',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
