// services/orderAutomation.js
const cron = require("node-cron");
const Order = require("../models/Order"); // Make sure path is correct

let running = false;
let cronJob = null;

function start() {
  if (running) return;
  running = true;

  cronJob = cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();
      const ORDERS = await Order.find({
        status: { $in: ["pending", "confirmed", "preparing", "ready"] },
      });

      await Promise.all(
        ORDERS.map(async (order) => {
          let nextStatus;
          const createdAt = new Date(order.createdAt);
          const minsSinceCreated = Math.floor((now - createdAt) / 60000);

          // Example logic
          switch (order.status) {
            case "pending":
              if (minsSinceCreated >= 3) nextStatus = "confirmed";
              break;
            case "confirmed":
              if (minsSinceCreated >= 6) nextStatus = "preparing";
              break;
            case "preparing":
              if (minsSinceCreated >= 10) nextStatus = "ready";
              break;
            case "ready":
              if (minsSinceCreated >= 15) nextStatus = "delivered";
              break;
            default:
              break;
          }

          if (nextStatus) {
            order.status = nextStatus;
            await order.save();
            // Optionally: send notification here
          }
        })
      );
    } catch (err) {
      console.error("Order automation error:", err);
    }
  });

  console.log("✅ Order automation started");
}

function stop() {
  running = false;
  if (cronJob) cronJob.stop();
  console.log("⏹️ Order automation stopped");
}

function getStatus() {
  return {
    running,
    interval: "every 1 min",
    job: !!cronJob,
  };
}

// For manual trigger (useful for your /api/automation/trigger endpoint)
async function triggerManually() {
  // Paste the main automation body here or call the logic function
  const now = new Date();
  const ORDERS = await Order.find({
    status: { $in: ["pending", "confirmed", "preparing", "ready"] },
  });

  await Promise.all(
    ORDERS.map(async (order) => {
      let nextStatus;
      const createdAt = new Date(order.createdAt);
      const minsSinceCreated = Math.floor((now - createdAt) / 60000);

      switch (order.status) {
        case "pending":
          if (minsSinceCreated >= 3) nextStatus = "confirmed";
          break;
        case "confirmed":
          if (minsSinceCreated >= 6) nextStatus = "preparing";
          break;
        case "preparing":
          if (minsSinceCreated >= 10) nextStatus = "ready";
          break;
        case "ready":
          if (minsSinceCreated >= 15) nextStatus = "delivered";
          break;
        default:
          break;
      }

      if (nextStatus) {
        order.status = nextStatus;
        await order.save();
      }
    })
  );
}

module.exports = {
  start,
  stop,
  getStatus,
  triggerManually,
};
