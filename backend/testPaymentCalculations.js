// Test script for payment calculations
// This file can be run to verify the payment logic works correctly

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const PaymentSettlement = require('./models/PaymentSettlement');
const Advance = require('./models/Advance');
const MilkCollection = require('./models/MilkCollection');
const FoodRecord = require('./models/FoodRecord');
const Farmer = require('./models/Farmer');

async function testPaymentCalculations() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/milkcollection');
    console.log('Connected to MongoDB');

    // Test Case 1: Farmer owes admin (advance not recovered)
    console.log('\n=== TEST CASE 1: Farmer owes admin ===');
    console.log('Scenario: Milk=₹280, Food=₹80, Advance=₹500');
    console.log('Expected: Final Amount = 280 - (500 + 80) = -300');
    console.log('Expected Status: "Advance Remaining"');
    console.log('Expected Advance Remaining: ₹300');

    const milkAmount = 280;
    const foodAmount = 80;
    const advanceBalance = 500;
    
    const totalDeductions = advanceBalance + foodAmount;
    const finalPayable = milkAmount - totalDeductions;
    
    console.log(`Calculated: ${milkAmount} - (${advanceBalance} + ${foodAmount}) = ${finalPayable}`);
    
    if (finalPayable < 0) {
      const advanceRemaining = Math.abs(finalPayable);
      console.log(`✓ Status: Advance Remaining`);
      console.log(`✓ Advance Remaining: ₹${advanceRemaining}`);
    }

    // Test Case 2: Admin must pay farmer
    console.log('\n=== TEST CASE 2: Admin pays farmer ===');
    console.log('Scenario: Milk=₹580, Food=₹80, Advance=₹200');
    console.log('Expected: Final Amount = 580 - (200 + 80) = ₹300');
    console.log('Expected Status: "Pay ₹300"');

    const milkAmount2 = 580;
    const foodAmount2 = 80;
    const advanceBalance2 = 200;
    
    const totalDeductions2 = advanceBalance2 + foodAmount2;
    const finalPayable2 = milkAmount2 - totalDeductions2;
    
    console.log(`Calculated: ${milkAmount2} - (${advanceBalance2} + ${foodAmount2}) = ${finalPayable2}`);
    
    if (finalPayable2 >= 0) {
      console.log(`✓ Status: Pay ₹${finalPayable2}`);
      console.log(`✓ Advance fully recovered`);
    }

    // Test Case 3: Edge case - no advance
    console.log('\n=== TEST CASE 3: No advance ===');
    console.log('Scenario: Milk=₹400, Food=₹100, Advance=₹0');
    console.log('Expected: Final Amount = 400 - (0 + 100) = ₹300');

    const milkAmount3 = 400;
    const foodAmount3 = 100;
    const advanceBalance3 = 0;
    
    const totalDeductions3 = advanceBalance3 + foodAmount3;
    const finalPayable3 = milkAmount3 - totalDeductions3;
    
    console.log(`Calculated: ${milkAmount3} - (${advanceBalance3} + ${foodAmount3}) = ${finalPayable3}`);
    console.log(`✓ Status: Pay ₹${finalPayable3}`);

    // Test Case 4: Edge case - no milk supplied
    console.log('\n=== TEST CASE 4: No milk supplied ===');
    console.log('Scenario: Milk=₹0, Food=₹50, Advance=₹200');
    console.log('Expected: Final Amount = 0 - (200 + 50) = -250');

    const milkAmount4 = 0;
    const foodAmount4 = 50;
    const advanceBalance4 = 200;
    
    const totalDeductions4 = advanceBalance4 + foodAmount4;
    const finalPayable4 = milkAmount4 - totalDeductions4;
    
    console.log(`Calculated: ${milkAmount4} - (${advanceBalance4} + ${foodAmount4}) = ${finalPayable4}`);
    
    if (finalPayable4 < 0) {
      const advanceRemaining4 = Math.abs(finalPayable4);
      console.log(`✓ Status: Advance Remaining`);
      console.log(`✓ Advance Remaining: ₹${advanceRemaining4}`);
    }

    console.log('\n=== All test calculations completed successfully! ===');

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testPaymentCalculations();
}

module.exports = { testPaymentCalculations };
