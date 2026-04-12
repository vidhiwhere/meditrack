#!/bin/bash

# Lumia Authentication Testing Script
# This script tests all authentication endpoints

BASE_URL="http://localhost:3000/api"

echo "================================================"
echo "     Lumia Authentication Testing"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Register Patient
echo -e "${YELLOW}Test 1: Register a Patient User${NC}"
REGISTER_RESPONSE=$(curl -s -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@test.com",
    "phone": "9876543210",
    "password": "testpass123",
    "confirmPassword": "testpass123",
    "role": "patient",
    "firstName": "John",
    "lastName": "Doe"
  }')

echo "Response:"
echo $REGISTER_RESPONSE | jq '.'
PATIENT_EMAIL="patient@test.com"
echo ""

# Test 2: Register Doctor
echo -e "${YELLOW}Test 2: Register a Doctor User${NC}"
DOCTOR_RESPONSE=$(curl -s -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor@test.com",
    "phone": "9876543211",
    "password": "doctorpass123",
    "confirmPassword": "doctorpass123",
    "role": "doctor",
    "firstName": "Jane",
    "lastName": "Smith"
  }')

echo "Response:"
echo $DOCTOR_RESPONSE | jq '.'
DOCTOR_EMAIL="doctor@test.com"
echo ""

# Test 3: Login as Patient
echo -e "${YELLOW}Test 3: Login as Patient${NC}"
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@test.com",
    "password": "testpass123"
  }')

echo "Response:"
echo $LOGIN_RESPONSE | jq '.'

# Extract tokens
ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.accessToken')
REFRESH_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.refreshToken')

echo ""
echo -e "${GREEN}Access Token: ${ACCESS_TOKEN:0:20}...${NC}"
echo -e "${GREEN}Refresh Token: ${REFRESH_TOKEN:0:20}...${NC}"
echo ""

# Test 4: Get Current User
echo -e "${YELLOW}Test 4: Get Current User Profile${NC}"
curl -s -X GET $BASE_URL/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
echo ""

# Test 5: Update Profile
echo -e "${YELLOW}Test 5: Update User Profile (Language to Hindi)${NC}"
curl -s -X PUT $BASE_URL/auth/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "language": "hi"
  }' | jq '.'
echo ""

# Test 6: Refresh Token
echo -e "${YELLOW}Test 6: Refresh Access Token${NC}"
REFRESH_RESPONSE=$(curl -s -X POST $BASE_URL/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{
    \"refreshToken\": \"$REFRESH_TOKEN\"
  }")

echo "Response:"
echo $REFRESH_RESPONSE | jq '.'

NEW_ACCESS_TOKEN=$(echo $REFRESH_RESPONSE | jq -r '.accessToken')
echo ""
echo -e "${GREEN}New Access Token: ${NEW_ACCESS_TOKEN:0:20}...${NC}"
echo ""

# Test 7: Change Password
echo -e "${YELLOW}Test 7: Change Password${NC}"
curl -s -X POST $BASE_URL/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "currentPassword": "testpass123",
    "newPassword": "newpass456",
    "confirmPassword": "newpass456"
  }' | jq '.'
echo ""

# Test 8: Login with New Password
echo -e "${YELLOW}Test 8: Login with New Password${NC}"
curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@test.com",
    "password": "newpass456"
  }' | jq '.'
echo ""

# Test 9: Test Invalid Credentials
echo -e "${YELLOW}Test 9: Test Invalid Credentials (Should Fail)${NC}"
curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@test.com",
    "password": "wrongpassword"
  }' | jq '.'
echo ""

# Test 10: Test Duplicate Registration (Should Fail)
echo -e "${YELLOW}Test 10: Test Duplicate Registration (Should Fail)${NC}"
curl -s -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@test.com",
    "phone": "9876543212",
    "password": "testpass123",
    "confirmPassword": "testpass123",
    "role": "patient",
    "firstName": "Duplicate",
    "lastName": "User"
  }' | jq '.'
echo ""

# Test 11: Test Missing Email (Should Fail)
echo -e "${YELLOW}Test 11: Test Missing Email (Should Fail)${NC}"
curl -s -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "9876543220",
    "password": "testpass123",
    "confirmPassword": "testpass123",
    "role": "patient",
    "firstName": "Test",
    "lastName": "User"
  }' | jq '.'
echo ""

# Test 12: Test Invalid Role (Should Fail)
echo -e "${YELLOW}Test 12: Test Invalid Role (Should Fail)${NC}"
curl -s -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid@test.com",
    "phone": "9876543221",
    "password": "testpass123",
    "confirmPassword": "testpass123",
    "role": "superuser",
    "firstName": "Test",
    "lastName": "User"
  }' | jq '.'
echo ""

# Test 13: Logout
echo -e "${YELLOW}Test 13: Logout${NC}"
curl -s -X POST $BASE_URL/auth/logout \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
echo ""

echo -e "${GREEN}================================================"
echo "     Auth Testing Complete!"
echo "================================================${NC}"

