const { spawn } = require("child_process");
const path = require("path");

console.log("🚀 Starting GreenMart Backend Server...\n");

// Change to backend directory and start server
const backendPath = path.join(__dirname, "..", "backend");
const serverProcess = spawn("node", ["server.js"], {
  cwd: backendPath,
  stdio: "inherit",
});

serverProcess.on("error", (error) => {
  console.error("❌ Failed to start server:", error.message);
  process.exit(1);
});

serverProcess.on("close", (code) => {
  if (code !== 0) {
    console.error(`❌ Server process exited with code ${code}`);
    process.exit(1);
  }
});

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down server...");
  serverProcess.kill("SIGINT");
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Shutting down server...");
  serverProcess.kill("SIGTERM");
});
