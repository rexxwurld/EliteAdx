// createUsers.js — delete after running, don't commit
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

const usersToCreate = [
  {
    name: 'Your Name',
    email: 'admin@eliteadx.com',
    password: 'AdminPass123!',
    role: 'admin',
  },
  {
    name: 'SokaBet',
    email: 'sokabet@eliteadx.com',
    password: 'AdvertiserPass123!',
    role: 'advertiser',
  },
  {
    name: 'PredictionSite',
    email: 'predictionsite@eliteadx.com',
    password: 'PublisherPass123!',
    role: 'publisher',
  },
];

async function createUsers() {
  await mongoose.connect(process.env.MONGO_URI);

  for (const userData of usersToCreate) {
    const existing = await User.findOne({ email: userData.email });
    if (existing) {
      console.log(`Skipped (already exists): ${userData.email}`);
      continue;
    }

    const user = await User.create(userData);
    console.log(`Created: ${user.email} — role: ${user.role}`);
  }

  process.exit(0);
}

createUsers().catch((err) => {
  console.error('Error creating users:', err);
  process.exit(1);
});
