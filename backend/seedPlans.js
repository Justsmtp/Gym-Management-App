const mongoose = require('mongoose');
require('dotenv').config();
const MembershipPlan = require('./models/MembershipPlan');

const seedPlans = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/gymdb');
    console.log('Connected to MongoDB');

    // Clear existing plans
    await MembershipPlan.deleteMany({});
    console.log('Cleared existing plans');

    // Create default plans
    const plans = [
      {
        name: 'Walk-in',
        displayName: 'Walk-in Membership Access',
        price: 5000,
        duration: 1,
        description: 'Single day access to gym facilities'
      },
      {
        name: 'Weekly',
        displayName: 'Weekly Membership Access',
        price: 6500,
        duration: 7,
        description: 'One week unlimited gym access'
      },
      {
        name: 'Deluxe',
        displayName: 'Deluxe Membership',
        price: 15500,
        duration: 30,
        description: 'Monthly access with full gym privileges'
      },
      {
        name: 'Bi-Monthly',
        displayName: 'Bi-Monthly Membership',
        price: 40000,
        duration: 90,
        description: 'Three months access with premium benefits'
      }
    ];

    await MembershipPlan.insertMany(plans);
    console.log('✅ Plans seeded successfully');
    
    // Display created plans
    const allPlans = await MembershipPlan.find();
    console.log('\nCreated plans:');
    allPlans.forEach(plan => {
      console.log(`- ${plan.displayName}: ₦${plan.price} (${plan.duration} days)`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
};

seedPlans();