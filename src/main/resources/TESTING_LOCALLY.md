# Testing the registration service in dev mode

### Create a session with a phone number
```bash
registration-service % java -cp target/registration-service-2.37.4-SNAPSHOT.jar org.signal.registration.cli.RegistrationClient \
  --host=localhost \
  --port=50051 \
  --plaintext \
  create-session +18005550123
```

- Returns:
```bash
Created registration session d5305fbb5eba4a6fb65bec0b4bfc4178
```


### Use the session to request a verification code
```bash
registration-service % java -cp target/registration-service-2.37.4-SNAPSHOT.jar org.signal.registration.cli.RegistrationClient \
  --host=localhost \
  --port=50051 \
  --plaintext \
  send-verification-code d5305fbb5eba4a6fb65bec0b4bfc4178
```


- Returns:

```bash
Sent verification code - Receive session meta data 
session_metadata {
  session_id: "\3250_\273^\272Jo\266[\354\vK\374Ax"
  e164: 18005550123
  may_request_sms: true
  next_sms_seconds: 59
  may_request_voice_call: true
  next_voice_call_seconds: 59
  may_check_code: true
  expiration_seconds: 659
}
```

### Check and verify session


```bash
# Sent verification code
registration-service % java -cp target/registration-service-2.37.4-SNAPSHOT.jar org.signal.registration.cli.RegistrationClient \
  --host=localhost \
  --port=50051 \
  --plaintext \
  check-verification-code d5305fbb5eba4a6fb65bec0b4bfc4178 550123 # This are the last 6 digits of the initial user phone number
``` 

- Returns:
```bash
# Session verified
session_metadata {
  session_id: "\3250_\273^\272Jo\266[\354\vK\374Ax"
  verified: true
  e164: 18005550123
  expiration_seconds: 599
}
```
