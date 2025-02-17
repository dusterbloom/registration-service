
I'll provide you with individual curl commands that you can run one by one from your local machine. Let's break it down into steps:

1. Create a new session:
```bash
curl -X POST http://localhost:3000/create-session \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+18005550123"}'
```

2. Send SMS verification (replace SESSION_ID with the one you got from step 1):
```bash
curl -X POST http://localhost:3000/send-verification \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "REPLACE_WITH_SESSION_ID",
    "transport": "MESSAGE_TRANSPORT_SMS"
  }'
```

3. Send voice verification if needed:
```bash
curl -X POST http://localhost:3000/send-verification \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "REPLACE_WITH_SESSION_ID",
    "transport": "MESSAGE_TRANSPORT_VOICE"
  }'
```

4. Check verification code:
```bash
curl -X POST http://localhost:3000/check-verification \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "REPLACE_WITH_SESSION_ID",
    "code": "123456"
  }'
```

To make it easier to use the session ID, you can store it in a variable:
```bash
# Store session ID from create session response
SESSION_ID=$(curl -s -X POST http://localhost:3000/create-session \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+18005550123"}' | jq -r .session_id)

# Use it in subsequent requests
curl -X POST http://localhost:3000/send-verification \
  -H "Content-Type: application/json" \
  -d "{
    \"sessionId\": \"$SESSION_ID\",
    \"transport\": \"MESSAGE_TRANSPORT_SMS\"
  }"
```

Note: Replace `localhost:3000` with your server's address if you're not running it locally.