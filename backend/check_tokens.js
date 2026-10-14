const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const User = require('./src/models/User');
  const partners = await User.find({ role: { $in: ['vendor', 'rider'] } })
    .select('name email phone role pushToken partnerProfile')
    .lean();
  
  console.log('=== Partners and their Push Tokens ===');
  partners.forEach(u => {
    const token = u.pushToken || u.partnerProfile?.pushToken;
    console.log(JSON.stringify({
      name: u.name,
      email: u.email,
      role: u.role,
      hasToken: !!token,
      tokenPreview: token ? token.substring(0, 40) + '...' : 'NO TOKEN'
    }));
  });
  
  console.log('\nTotal partners:', partners.length);
  console.log('With tokens:', partners.filter(u => u.pushToken || u.partnerProfile?.pushToken).length);
  
  process.exit(0);
}).catch(err => { console.error(err.message); process.exit(1); });
