// controllers/cart.controller.js

const Cart = require("../models/Cart");
const Product = require("../models/Product");
const mongoose = require("mongoose");

// --- Helper Function: Calculate Bill (Efficient Version) ---
async function calculateBill(items) {
    console.log("Calculating bill...");
    let total = 0;
    if (!items || items.length === 0) {
        console.log("Cart is empty, bill is 0.");
        return 0;
    }
    try {
        const productIds = items.map(item => item.productId).filter(id => id);
        if (productIds.length === 0) return 0;

        const products = await Product.find({ '_id': { $in: productIds } }).select('finPrice').lean();
        const productMap = products.reduce((map, prod) => {
            map[prod._id.toString()] = prod.finPrice;
            return map;
        }, {});

        items.forEach(item => {
            const price = productMap[item.productId?.toString()];
            if (typeof price === 'number' && typeof item.quantity === 'number' && item.quantity > 0) {
                total += price * item.quantity;
            } else {
                console.warn(`Skipping item in bill calculation: Product ID ${item.productId}, Price: ${price}, Quantity: ${item.quantity}`);
            }
        });
        console.log("Calculated bill:", total);
        return total;
    } catch (error) {
        console.error("Error calculating bill:", error);
        return 0;
    }
}
// --- (End of calculateBill) ---


// --- Get User's Cart ---
exports.getCart = async (req, res) => {
    console.log("--- Controller: getCart ---");
    try {
        const userIdFromToken = req.user?._id;
        if (!userIdFromToken) {
            console.error("getCart Error: User ID missing from req.user after verifyAuth.");
            return res.status(401).json({ message: "Unauthorized: User identification failed" });
        }
        console.log("Fetching cart for User ID:", userIdFromToken);

        const cart = await Cart.findOne({ userId: userIdFromToken })
            .populate({
                path: "items.productId",
                model: "Product",
                select: "title description imageUrl finPrice quantity",
            })
            .lean();

        if (!cart) {
            console.log("No cart found for user, returning empty structure.");
            return res.status(200).json({ userId: userIdFromToken, items: [], bill: 0 });
        }

        console.log("Cart found and populated successfully.");
        res.status(200).json(cart);

    } catch (error) {
        console.error("Error in getCart controller:", error);
        res.status(500).json({ message: "Failed to retrieve cart", error: error.message });
    }
};

// --- Add Item to Cart ---
// controllers/cart.controller.js

// ... (imports and calculateBill function remain the same as the corrected version) ...

exports.addToCart = async (req, res) => {
    console.log("--- Controller: addToCart (No Stock Check) ---");
    // --- quantity from body is ignored here, we always add 1 ---
    let { productId } = req.body;
    const userId = req.user?._id;
    const quantityToAdd = 1; // We always add 1 per click

    // --- Validation ---
    if (!userId) { return res.status(401).json({ message: "Unauthorized: User ID missing" }); }
    if (!productId) { return res.status(400).json({ message: "Product ID is required" }); }
    if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ message: "Invalid Product ID format" });
    }
    const validProductId = new mongoose.Types.ObjectId(productId);
    // --- End Validation ---

    try {
        // Find product just to ensure it exists (optional, could be removed if performance is critical)
        // If removed, ensure product details can still be populated later.
        const productExists = await Product.findById(validProductId).select('_id').lean();
        if (!productExists) {
            console.log(`Product not found for ID: ${validProductId}`);
            return res.status(404).json({ message: "Product not found" });
        }

        // Find user's cart
        let cart = await Cart.findOne({ userId: userId });

        if (cart) {
            // Cart exists: find item index
            console.log("Existing cart found.");
            const itemIndex = cart.items.findIndex((p) => p.productId.equals(validProductId));
            if (itemIndex > -1) {
                // Item exists: Increment quantity by quantityToAdd (which is 1)
                console.log(`Incrementing quantity for product ${validProductId} by ${quantityToAdd}`);
                cart.items[itemIndex].quantity += quantityToAdd;
            } else {
                // Item doesn't exist: Add new item with quantityToAdd (which is 1)
                console.log(`Adding new product ${validProductId} with quantity ${quantityToAdd}`);
                cart.items.push({ productId: validProductId, quantity: quantityToAdd });
            }
        } else {
            // Cart doesn't exist: Create a new one with quantityToAdd (which is 1)
            console.log("No existing cart found, creating new one.");
            cart = new Cart({ userId: userId, items: [{ productId: validProductId, quantity: quantityToAdd }] });
        }

        // --- !!! REMOVED STOCK CHECK !!! ---

        cart.bill = await calculateBill(cart.items); // Recalculate bill
        const savedCart = await cart.save();
        console.log("Cart saved successfully.");

        // Populate and respond
        const populatedCart = await Cart.findById(savedCart._id)
            .populate({
                path: "items.productId", model: "Product",
                // Select fields needed by frontend cart display
                select: "title imageUrl finPrice"
            })
            .lean();
        res.status(201).json(populatedCart || savedCart.toObject());

    } catch (err) {
        console.error("Error in addToCart controller:", err);
        res.status(500).json({ message: "Failed to add to cart", error: err.message });
    }
};

exports.incrementProductQuantity = async (req, res) => {
    console.log("--- Controller: incrementProductQuantity ---");
    const { productId } = req.params;
    const userId = req.user?._id;

    // Validation...
    if (!userId || !mongoose.Types.ObjectId.isValid(productId)) { /* ... handle error ... */ }
    const validProductId = new mongoose.Types.ObjectId(productId);

    try {
        const cart = await Cart.findOne({ userId: userId });
        if (!cart) { /* ... handle error ... */ }

        const itemIndex = cart.items.findIndex((p) => p.productId.equals(validProductId));
        if (itemIndex > -1) {
            console.log(`Incrementing quantity for product ${validProductId}`);
            // --- Optional: Check stock before incrementing ---
            // const product = await Product.findById(validProductId).select('quantity').lean();
            // if (!product || product.quantity <= cart.items[itemIndex].quantity) {
            //     console.warn(`Cannot increment, available stock (${product?.quantity}) reached for product ${validProductId}.`);
            //     return res.status(400).json({ message: "Cannot increment quantity, maximum stock reached." });
            // }
            // --- End Stock Check ---

            cart.items[itemIndex].quantity += 1;
            console.log(`New quantity: ${cart.items[itemIndex].quantity}`);
            cart.bill = await calculateBill(cart.items);
            console.log(`New bill: ${cart.bill}`);
            const savedCart = await cart.save();
            console.log("Cart saved after increment.");

            const populatedCart = await Cart.findById(savedCart._id).populate(/*...*/).lean();
            return res.status(200).json(populatedCart || savedCart.toObject());
        } else {
            console.log(`Product ${validProductId} not found in cart for increment.`);
            return res.status(404).json({ message: "Product not found in cart" });
        }
    } catch (error) {
        console.error("Error in incrementProductQuantity:", error); // Log the specific error
        res.status(500).json({ message: "Failed to increment quantity", error: error.message });
    }
};

exports.decrementProductQuantity = async (req, res) => {
    console.log("--- Controller: decrementProductQuantity ---");
    const { productId } = req.params;
    const userId = req.user?._id;

    // Validation...
    if (!userId || !mongoose.Types.ObjectId.isValid(productId)) { /* ... handle error ... */ }
    const validProductId = new mongoose.Types.ObjectId(productId);

    try {
        const cart = await Cart.findOne({ userId: userId });
        if (!cart) { /* ... handle error ... */ }

        const itemIndex = cart.items.findIndex((p) => p.productId.equals(validProductId));
        if (itemIndex > -1) {
            console.log(`Decrementing quantity for product ${validProductId}`);
            if (cart.items[itemIndex].quantity > 1) {
                cart.items[itemIndex].quantity -= 1;
                console.log(`New quantity: ${cart.items[itemIndex].quantity}`);
            } else {
                console.log("Quantity is 1, removing item.");
                cart.items.splice(itemIndex, 1); // Remove item if quantity becomes 0
            }

            cart.bill = await calculateBill(cart.items);
            console.log(`New bill: ${cart.bill}`);
            const savedCart = await cart.save();
            console.log("Cart saved after decrement/removal.");

            const populatedCart = await Cart.findById(savedCart._id).populate(/*...*/).lean();
            return res.status(200).json(populatedCart || savedCart.toObject());
        } else {
            console.log(`Product ${validProductId} not found in cart for decrement.`);
            return res.status(404).json({ message: "Product not found in cart" });
        }
    } catch (error) {
        console.error("Error in decrementProductQuantity:", error); // Log the specific error
        res.status(500).json({ message: "Failed to decrement quantity", error: error.message });
    }
};

// --- Remove Product From Cart ---
exports.removeFromCart = async (req, res) => {
    console.log("--- Controller: removeFromCart ---");
    const { productId } = req.params;
    const userId = req.user?._id;

    if (!userId) { return res.status(401).json({ message: "Unauthorized" }); }
    if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ message: "Invalid Product ID format" });
    }
    const validProductId = new mongoose.Types.ObjectId(productId);

    try {
        console.log(`Removing product ${validProductId} for user ${userId}`);
        const updatedCartResult = await Cart.findOneAndUpdate(
            { userId: userId },
            { $pull: { items: { productId: validProductId } } },
            { new: true }
        );

        if (!updatedCartResult) {
            console.log("Cart not found for removal.");
            return res.status(200).json({ userId: userId, items: [], bill: 0 });
        }

        console.log("Item removed (or pull executed). Recalculating bill.");
        updatedCartResult.bill = await calculateBill(updatedCartResult.items);
        const savedCart = await updatedCartResult.save();
        console.log("Cart saved after removal.");

        const populatedCart = await Cart.findById(savedCart._id)
            .populate({ path: "items.productId", model: "Product", select: "title imageUrl finPrice quantity" })
            .lean();
        res.status(200).json(populatedCart || savedCart.toObject());

    } catch (error) {
        console.error("Error in removeFromCart:", error);
        res.status(500).json({ message: "Failed to remove item", error: error.message });
    }
};

// --- Clear Entire Cart ---
exports.clearCart = async (req, res) => {
    console.log("--- Controller: clearCart ---");
    const userId = req.user?._id;

    if (!userId) { return res.status(401).json({ message: "Unauthorized" }); }

    try {
        console.log(`Clearing cart for user ${userId}`);
        const updatedCart = await Cart.findOneAndUpdate(
            { userId: userId },
            { $set: { items: [], bill: 0 } },
            { new: true, upsert: false }
        );

        if (!updatedCart) {
            console.log("No cart found to clear for user.");
            return res.status(200).json({ userId: userId, items: [], bill: 0 });
        }

        console.log("Cart cleared successfully.");
        res.status(200).json(updatedCart.toObject());

    } catch (error) {
        console.error("Error in clearCart:", error);
        res.status(500).json({ message: "Failed to clear cart", error: error.message });
    }
};