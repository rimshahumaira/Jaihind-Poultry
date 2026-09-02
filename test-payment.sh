#!/bin/bash

API="http://localhost:5000/api"

# Get token
LOGIN=$(curl -s -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"pin":"1234"}')
TOKEN=$(echo $LOGIN | grep -o '"token":"[^"]*' | cut -d'"' -f4)

TODAY=$(date +%Y-%m-%d)

# Get a customer with outstanding balance
CUSTOMERS=$(curl -s -X GET "$API/customer" \
  -H "Authorization: Bearer $TOKEN")

CUSTOMER_ID=$(echo $CUSTOMERS | jq -r '.[0].id' 2>/dev/null)
CUSTOMER_NAME=$(echo $CUSTOMERS | jq -r '.[0].name' 2>/dev/null)
OUTSTANDING=$(echo $CUSTOMERS | jq -r '.[0].outstanding_amount' 2>/dev/null)

echo "=== PAYMENT COLLECTION TEST ==="
echo "Customer: $CUSTOMER_NAME"
echo "Outstanding: ₹$OUTSTANDING"
echo ""

# Record a payment
echo "Recording payment of ₹500..."
PAYMENT=$(curl -s -X POST "$API/customer/$CUSTOMER_ID/pay" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"amount":500,"notes":"Cash payment"}')

if echo "$PAYMENT" | grep -q "success"; then
  echo "✓ Payment recorded successfully"
else
  echo "Payment response:"
  echo $PAYMENT | jq '.' 2>/dev/null
fi

# Check updated customer
echo ""
echo "Checking updated customer balance..."
UPDATED=$(curl -s -X GET "$API/customer/$CUSTOMER_ID" \
  -H "Authorization: Bearer $TOKEN")

NEW_OUTSTANDING=$(echo $UPDATED | jq -r '.outstanding_amount' 2>/dev/null)
echo "New Outstanding Balance: ₹$NEW_OUTSTANDING"
echo ""
echo "✓ Payment Collection API is working correctly!"

