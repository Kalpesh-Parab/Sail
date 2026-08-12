import Inventory from '../models/Inventory.js';

/**
 * @desc Get all inventory items with optional search query
 * @route GET /api/inventory
 */
export const getInventory = async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};

    if (search) {
      query.productName = { $regex: search, $options: 'i' };
    }

    const inventory = await Inventory.find(query).sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      count: inventory.length,
      inventory,
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching inventory',
      error: error.message,
    });
  }
};

/**
 * @desc Get single inventory item by ID
 * @route GET /api/inventory/:id
 */
export const getInventoryItemById = async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);
    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: 'Item not found' });
    }
    return res.status(200).json({ success: true, item });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc Update single product selling price or details
 * @route PUT /api/inventory/:id
 */
export const updateInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { sellingPrice, quantity, hsn, purchasePrice } = req.body;

    const updateFields = { sellingPrice, quantity, hsn };
    if (purchasePrice !== undefined) updateFields.purchasePrice = purchasePrice;

    const updatedItem = await Inventory.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true, runValidators: true },
    );

    if (!updatedItem) {
      return res
        .status(404)
        .json({ success: false, message: 'Item not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Inventory item updated successfully!',
      item: updatedItem,
    });
  } catch (error) {
    console.error('Error updating inventory item:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update inventory item',
      error: error.message,
    });
  }
};

/**
 * @desc Delete inventory item
 * @route DELETE /api/inventory/:id
 */
export const deleteInventoryItem = async (req, res) => {
  try {
    const deleted = await Inventory.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: 'Item not found' });
    }
    return res
      .status(200)
      .json({ success: true, message: 'Item deleted from inventory.' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
