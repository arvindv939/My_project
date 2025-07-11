const cron = require("node-cron");
const Order = require("./models/Order"); // Adjust path if needed

// This runs every 1 minute
cron.schedule("* * * * *", async () => {
  const now = new Date();
  const ORDERS = await Order.find({
    status: { $in: ["pending", "confirmed", "preparing", "ready"] },
  });

  ORDERS.forEach(async (order) => {
    let nextStatus;
    const createdAt = new Date(order.createdAt);
    const minsSinceCreated = Math.floor((now - createdAt) / 60000);

    // Example logic: progress every 3 mins
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
      // Optionally, send notification to user/shop owner here
    }
  });
});
