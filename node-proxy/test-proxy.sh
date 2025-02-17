#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Base URL for the service
BASE_URL="http://localhost:3000"

echo -e "${BLUE}Testing Signal Registration Service Proxy${NC}\n"

# Test 1: Create Session - Success Case
echo -e "${BLUE}Test 1: Creating a new session with valid phone number${NC}"
CREATE_RESPONSE=$(curl -s -X POST "${BASE_URL}/create-session" \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+18005550123"}')
echo "Response: $CREATE_RESPONSE"
echo

# Extract session ID from the new format
SESSION_ID=$(echo $CREATE_RESPONSE | grep -o '"session_id":"[^"]*' | cut -d'"' -f4)
if [ ! -z "$SESSION_ID" ]; then
  echo -e "${GREEN}Successfully extracted session ID: $SESSION_ID${NC}\n"
else
  echo -e "${RED}Failed to get session ID${NC}\n"
  # Print the full response for debugging
  echo "Full response:"
  echo "$CREATE_RESPONSE" | json_pp
  exit 1
fi

# Test 2: Send Verification Code - SMS
echo -e "${BLUE}Test 2: Sending SMS verification code${NC}"
curl -s -X POST "${BASE_URL}/send-verification" \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\": \"${SESSION_ID}\", \"transport\": \"MESSAGE_TRANSPORT_SMS\"}" | json_pp
echo

# Test 3: Send Verification Code - Voice
echo -e "${BLUE}Test 3: Sending voice verification code${NC}"
curl -s -X POST "${BASE_URL}/send-verification" \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\": \"${SESSION_ID}\", \"transport\": \"MESSAGE_TRANSPORT_VOICE\"}" | json_pp
echo

# Wait for 2 seconds between requests
sleep 2

# Test 4: Check Verification Code
echo -e "${BLUE}Test 4: Checking verification code${NC}"
curl -s -X POST "${BASE_URL}/check-verification" \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\": \"${SESSION_ID}\", \"code\": \"123456\"}" | json_pp
echo

echo -e "${BLUE}=== Test Summary ===${NC}"
echo "✓ Create Session Test"
echo "✓ Send Verification Tests (SMS and Voice)"
echo "✓ Check Verification Test"
echo
echo -e "${GREEN}All test requests completed${NC}"