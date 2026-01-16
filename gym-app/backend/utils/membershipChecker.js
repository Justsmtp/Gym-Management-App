// backend/utils/membershipChecker.js
const User = require('../models/User');

/**
 * Check and update membership status based on expiry date
 * @param {Object} user - User document or user ID
 * @returns {Object} Updated user with current status
 */
const checkAndUpdateMembershipStatus = async (user) => {
  try {
    // If user is just an ID, fetch the full user
    if (typeof user === 'string') {
      user = await User.findById(user);
    }

    if (!user) {
      return null;
    }

    // Skip admin users
    if (user.isAdmin) {
      return user;
    }

    const now = new Date();
    let statusChanged = false;

    // Check if membership has expired
    if (user.membershipEndDate) {
      const endDate = new Date(user.membershipEndDate);
      
      if (endDate < now) {
        // Membership expired
        if (user.status !== 'expired') {
          console.log(`⏰ Membership expired for ${user.email}`);
          user.status = 'expired';
          user.paymentStatus = 'overdue';
          user.isActive = false;
          statusChanged = true;
        }
      } else {
        // Membership still active
        if (user.status === 'expired' || user.status === 'pending') {
          console.log(`✅ Reactivating membership for ${user.email}`);
          user.status = 'active';
          user.paymentStatus = 'active';
          user.isActive = true;
          statusChanged = true;
        }
      }
    }

    // Save if status changed
    if (statusChanged) {
      await user.save();
      console.log(`✅ Updated status for ${user.email}: ${user.status}`);
    }

    return user;
  } catch (error) {
    console.error('❌ Error checking membership status:', error.message);
    return user;
  }
};

/**
 * Check and update multiple users' membership status
 * @param {Array} users - Array of user documents
 * @returns {Array} Updated users
 */
const checkMultipleMemberships = async (users) => {
  const updatedUsers = [];
  
  for (const user of users) {
    const updated = await checkAndUpdateMembershipStatus(user);
    if (updated) {
      updatedUsers.push(updated);
    }
  }
  
  return updatedUsers;
};

/**
 * Run bulk membership status check (for scheduled jobs)
 * Updates all users whose memberships have expired
 */
const runBulkMembershipCheck = async () => {
  try {
    console.log('🔍 Running bulk membership status check...');
    
    const now = new Date();
    
    // Find all active users with expired memberships
    const expiredUsers = await User.find({
      isAdmin: false,
      status: 'active',
      membershipEndDate: { $lt: now }
    });

    console.log(`📊 Found ${expiredUsers.length} expired memberships`);

    let updated = 0;
    for (const user of expiredUsers) {
      user.status = 'expired';
      user.paymentStatus = 'overdue';
      user.isActive = false;
      await user.save();
      updated++;
    }

    // Find all expired users whose memberships were renewed
    const renewedUsers = await User.find({
      isAdmin: false,
      status: 'expired',
      membershipEndDate: { $gte: now }
    });

    console.log(`📊 Found ${renewedUsers.length} renewed memberships`);

    for (const user of renewedUsers) {
      user.status = 'active';
      user.paymentStatus = 'active';
      user.isActive = true;
      await user.save();
      updated++;
    }

    console.log(`✅ Bulk check complete. Updated ${updated} users.`);

    return {
      success: true,
      expired: expiredUsers.length,
      renewed: renewedUsers.length,
      totalUpdated: updated
    };
  } catch (error) {
    console.error('❌ Bulk membership check error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  checkAndUpdateMembershipStatus,
  checkMultipleMemberships,
  runBulkMembershipCheck
};
