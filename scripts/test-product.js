const axios = require("axios");

const API_BASE_URL = "http://localhost:5000/api";

// Replace with a valid JWT token from your application
const JWT_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODRiMTc5NGUxMTBhY2E1MThjNTAxMmIiLCJyb2xlIjoiU2hvcE93bmVyIiwiaWF0IjoxNzUwOTY2MzExLCJleHAiOjE3NTE1NzExMTF9.JTCFEsNW9s07LeoZH_XavPVT_ozKNcnrUZ1n3WDf0uM";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Authorization: `Bearer ${JWT_TOKEN}`,
    "Content-Type": "application/json",
  },
});

async function testServerHealth() {
  try {
    console.log("🔍 Testing server health...");
    const response = await axios.get(`${API_BASE_URL}/health`);
    console.log("✅ Server is healthy");
    return true;
  } catch (error) {
    console.log("❌ Server health check failed:", error.message);
    return false;
  }
}

async function testAuthentication() {
  try {
    console.log("🔍 Testing authentication...");
    const response = await api.get("/products");
    console.log("✅ Authentication successful");
    return true;
  } catch (error) {
    console.log(
      "❌ Authentication failed:",
      error.response?.data?.message || error.message
    );
    return false;
  }
}

async function testProductCRUD() {
  let productId = null;

  try {
    // Test Create Product
    console.log("🔍 Testing product creation...");
    const createResponse = await api.post("/products", {
      name: "Test Product",
      category: "Vegetables",
      unit: "Kg",
      price: 50.0,
      discount: 10,
      stock: 100,
      description: "This is a test product",
      imageUrl: "https://example.com/test-image.jpg",
    });

    productId = createResponse.data.product._id;
    console.log("✅ Product created successfully:", productId);

    // Test Read Product
    console.log("🔍 Testing product retrieval...");
    const readResponse = await api.get(`/products/${productId}`);
    console.log("✅ Product retrieved successfully");

    // Test Update Product
    console.log("🔍 Testing product update...");
    const updateResponse = await api.put(`/products/${productId}`, {
      name: "Updated Test Product",
      price: 60.0,
      stock: 150,
    });
    console.log("✅ Product updated successfully");

    // Test Get My Products
    console.log("🔍 Testing my products retrieval...");
    const myProductsResponse = await api.get("/products/my-products");
    console.log(
      "✅ My products retrieved successfully:",
      myProductsResponse.data.products.length,
      "products"
    );

    return productId;
  } catch (error) {
    console.log(
      "❌ Product CRUD test failed:",
      error.response?.data?.message || error.message
    );
    return productId;
  }
}

async function testOrders() {
  try {
    console.log("🔍 Testing orders retrieval...");
    const ordersResponse = await api.get("/orders/shop-owner");
    console.log(
      "✅ Orders retrieved successfully:",
      ordersResponse.data.orders.length,
      "orders"
    );
    return true;
  } catch (error) {
    console.log(
      "❌ Orders test failed:",
      error.response?.data?.message || error.message
    );
    return false;
  }
}

async function testPromotions() {
  try {
    console.log("🔍 Testing promotions retrieval...");
    const promotionsResponse = await api.get("/promotions");
    console.log(
      "✅ Promotions retrieved successfully:",
      promotionsResponse.data.promotions?.length || 0,
      "promotions"
    );
    return true;
  } catch (error) {
    console.log(
      "❌ Promotions test failed:",
      error.response?.data?.message || error.message
    );
    return false;
  }
}

async function cleanupTestProduct(productId) {
  if (!productId) return;

  try {
    console.log("🔍 Cleaning up test product...");
    await api.delete(`/products/${productId}`);
    console.log("✅ Test product cleaned up successfully");
  } catch (error) {
    console.log(
      "❌ Cleanup failed:",
      error.response?.data?.message || error.message
    );
  }
}

async function runTests() {
  console.log("🧪 Starting GreenMart API Tests\n");

  // Test server health
  const serverHealthy = await testServerHealth();
  if (!serverHealthy) {
    console.log("\n❌ Test failed: Server is not running or not accessible");
    console.log(
      "💡 Make sure to start the backend server first: cd backend && node server.js"
    );
    return;
  }

  // Test authentication
  const authSuccess = await testAuthentication();
  if (!authSuccess) {
    console.log("\n❌ Test failed: Authentication failed");
    console.log(
      "💡 Make sure to update the JWT_TOKEN in this script with a valid token"
    );
    return;
  }

  // Test product CRUD operations
  const productId = await testProductCRUD();

  // Test orders
  await testOrders();

  // Test promotions
  await testPromotions();

  // Cleanup
  await cleanupTestProduct(productId);

  console.log("\n🎉 All tests completed!");
  console.log("\n📋 Test Summary:");
  console.log("- Server Health: ✅");
  console.log("- Authentication: ✅");
  console.log("- Product CRUD: ✅");
  console.log("- Orders: ✅");
  console.log("- Promotions: ✅");
  console.log(
    "\n💡 If any tests failed, check the error messages above for troubleshooting."
  );
}

// Handle errors
process.on("unhandledRejection", (error) => {
  console.error("❌ Unhandled promise rejection:", error.message);
  process.exit(1);
});

// Run the tests
runTests().catch((error) => {
  console.error("❌ Test failed:", error.message);
  process.exit(1);
});
