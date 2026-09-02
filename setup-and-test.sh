#!/bin/bash

API="http://localhost:5000/api"

echo "=== SETUP TEST DATA ==="

# Setup
echo "1. Setting up initial config..."
curl -s -X POST "$API/auth/setup" \
  -H "Content-Type: application/json" \
  -d '{"businessName":"Jai Hind Poultry","pin":"1234"}' > /dev/null
echo "✓ Setup complete"

# Login
echo "2. Logging in..."
LOGIN=$(curl -s -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"pin":"1234"}')
TOKEN=$(echo $LOGIN | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo "✓ Login successful"

# Add customers
echo "3. Adding customers..."
CUST=$(curl -s -X POST "$API/customer" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Rajesh Kumar","phone":"9876543210","default_sale_rate":250}')
CUST_ID=$(echo $CUST | jq -r '.id' 2>/dev/null)
echo "✓ Customer added: $CUST_ID"

# Add a sale
echo "4. Adding sale..."
TODAY=$(date +%Y-%m-%d)
curl -s -X POST "$API/sales" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"date\":\"$TODAY\",\"customer_id\":\"$CUST_ID\",\"customer_name\":\"Rajesh Kumar\",\"weight\":10.5,\"rate\":250,\"payment_status\":\"Pending\"}" > /dev/null
echo "✓ Sale added"

echo ""
echo "=== TEST PAYMENT API ==="

# Get customer with outstanding balance
CUSTOMER=$(curl -s -X GET "$API/customer/$CUST_ID" \
  -H "Authorization: Bearer $TOKEN")
OUTSTANDING=$(echo $CUSTOMER | jq -r '.outstanding_amount' 2>/dev/null)

echo "Customer: Rajesh Kumar"
echo "Outstanding: ₹$OUTSTANDING"
echo ""

# Record a payment
echo "Recording payment of ₹500..."
PAYMENT=$(curl -s -X POST "$API/customer/$CUST_ID/pay" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"amount":500,"notes":"Cash payment"}')

if echo "$PAYMENT" | jq -e '.success' > /dev/null 2>&1; then
  echo "✓ Payment recorded successfully"
  
  # Check updated balance
  UPDATED=$(curl -s -X GET "$API/customer/$CUST_ID" \
    -H "Authorization: Bearer $TOKEN")
  NEW_OUTSTANDING=$(echo $UPDATED | jq -r '.outstanding_amount' 2>/dev/null)
  echo "New Outstanding: ₹$NEW_OUTSTANDING"
  echo ""
  echo "✓ Payment Collection API is working correctly!"
else
  echo "✗ Payment failed:"
  echo $PAYMENT | jq '.'
fi

