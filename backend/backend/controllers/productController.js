const Product = require("../models/Product");
const cloudinary = require("../config/cloudinary");

// Get all products with pagination and filtering
exports.getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Build query
    const query = { isActive: true };

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Execute query with pagination
    const products = await Product.find(query)
      .populate("createdBy", "name email")
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: Number.parseInt(page),
      total,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching products",
      error: error.message,
    });
  }
};

// Get products created by the authenticated shop owner
exports.getMyProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search } = req.query;

    // Build query for products created by this user
    const query = {
      createdBy: req.user.userId,
      isActive: true,
    };

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: Number.parseInt(page),
      total,
    });
  } catch (error) {
    console.error("Error fetching my products:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching your products",
      error: error.message,
    });
  }
};

// Get single product by ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "createdBy",
      "name email"
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Increment view count
    product.views = (product.views || 0) + 1;
    await product.save();

    res.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching product",
      error: error.message,
    });
  }
};

// Create new product
exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      category,
      unit,
      price,
      discount = 0,
      stock,
      imageUrl,
      description,
    } = req.body;

    // Validate required fields
    if (!name || !category || !unit || !price || stock === undefined) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: name, category, unit, price, stock",
      });
    }

    // Validate price and stock are positive numbers
    if (price <= 0 || stock < 0) {
      return res.status(400).json({
        success: false,
        message: "Price must be positive and stock cannot be negative",
      });
    }

    // Validate discount is between 0 and 100
    if (discount < 0 || discount > 100) {
      return res.status(400).json({
        success: false,
        message: "Discount must be between 0 and 100",
      });
    }

    const product = new Product({
      name: name.trim(),
      category,
      unit,
      price: Number.parseFloat(price),
      discount: Number.parseFloat(discount),
      stock: Number.parseInt(stock),
      imageUrl: imageUrl || "",
      description: description || "",
      createdBy: req.user.userId,
    });

    await product.save();

    // Populate the createdBy field for response
    await product.populate("createdBy", "name email");

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error("Error creating product:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error creating product",
      error: error.message,
    });
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const updates = req.body;

    // Find the product
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Check if user owns this product
    if (product.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own products",
      });
    }

    // Validate updates
    if (updates.price !== undefined && updates.price <= 0) {
      return res.status(400).json({
        success: false,
        message: "Price must be positive",
      });
    }

    if (updates.stock !== undefined && updates.stock < 0) {
      return res.status(400).json({
        success: false,
        message: "Stock cannot be negative",
      });
    }

    if (
      updates.discount !== undefined &&
      (updates.discount < 0 || updates.discount > 100)
    ) {
      return res.status(400).json({
        success: false,
        message: "Discount must be between 0 and 100",
      });
    }

    // Update the product
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      {
        ...updates,
        updatedAt: new Date(),
      },
      {
        new: true,
        runValidators: true,
      }
    ).populate("createdBy", "name email");

    res.json({
      success: true,
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Error updating product:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error updating product",
      error: error.message,
    });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;

    // Find the product
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Check if user owns this product
    if (product.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own products",
      });
    }

    // Soft delete by setting isActive to false
    await Product.findByIdAndUpdate(productId, { isActive: false });

    res.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting product",
      error: error.message,
    });
  }
};

// Get products by category
exports.getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const products = await Product.find({
      category,
      isActive: true,
    })
      .populate("createdBy", "name")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments({ category, isActive: true });

    res.json({
      success: true,
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: Number.parseInt(page),
      total,
    });
  } catch (error) {
    console.error("Error fetching products by category:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching products by category",
      error: error.message,
    });
  }
};

// Search products
exports.searchProducts = async (req, res) => {
  try {
    const { q, category, minPrice, maxPrice, page = 1, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    // Build search query
    const query = {
      isActive: true,
      $or: [
        { name: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ],
    };

    if (category) {
      query.category = category;
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number.parseFloat(minPrice);
      if (maxPrice) query.price.$lte = Number.parseFloat(maxPrice);
    }

    const products = await Product.find(query)
      .populate("createdBy", "name")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: Number.parseInt(page),
      total,
      searchQuery: q,
    });
  } catch (error) {
    console.error("Error searching products:", error);
    res.status(500).json({
      success: false,
      message: "Error searching products",
      error: error.message,
    });
  }
};
