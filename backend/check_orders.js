const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const Order = require('./src/models/Order');
  const User = require('./src/models/User');
  
  // Get recent orders
  const orders = await Order.find({}).sort({ createdAt: -1 }).limit(5).lean();
  
  console.log('=== Recent 5 Orders ===');
  orders.forEach(o => {
    console.log(JSON.stringify({
      orderId: o.orderId,
      status: o.status,
      homeChefOwner: o.homeChefOwner,
      homeChefName: o.homeChefName,
      chef: o.chef,
      homeChefId: o.homeChefId,
      riderId: o.riderId,
      riderName: o.riderName,
    }, null, 2));
    console.log('---');
  });
  
  // Check if homeChefOwner matches any vendor _id
  for (const order of orders) {
    if (order.homeChefOwner) {
      const vendor = await User.findOne({
        role: { $in: ['vendor', 'homechefs'] },
        $or: [
          { _id: /^[a-f\d]{24}$/i.test(String(order.homeChefOwner)) ? order.homeChefOwner : null }.filter ? null : { _id: order.homeChefOwner },
          { email: String(order.homeChefOwner).includes('@') ? order.homeChefOwner : 'x@x.x' },
          { name: order.homeChefOwner },
          { 'partnerProfile.kitchenName': order.homeChefOwner },
        ].filter(Boolean),
      }).lean();
      console.log(`Order ${order.orderId} -> vendor found: ${vendor ? vendor.name + ' | token: ' + !!(vendor.pushToken || vendor.partnerProfile?.pushToken) : 'NOT FOUND'}`);
    }
  }
  
  process.exit(0);
}).catch(err => { console.error(err.message); process.exit(1); });
