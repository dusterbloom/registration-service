const express = require('express');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

const app = express();
app.use(express.json());

// Configuration with defaults
const config = {
    host: process.env.GRPC_HOST || 'localhost',
    port: process.env.GRPC_PORT || '50051',
    usePlaintext: process.env.USE_PLAINTEXT === 'true' || true,
    trustedCertPath: process.env.TRUSTED_CERT_PATH || null,
    apiKey: process.env.API_KEY || null
};

// Load proto file
const PROTO_PATH = path.join(__dirname, 'registration_service.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});

const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
const registrationService = protoDescriptor.org.signal.registration.rpc.RegistrationService;

// Create gRPC client with proper credentials
function createGrpcClient() {
    let credentials;
    
    if (config.usePlaintext) {
        credentials = grpc.credentials.createInsecure();
    } else if (config.trustedCertPath) {
        const trustedCert = fs.readFileSync(config.trustedCertPath);
        credentials = grpc.credentials.createSsl(trustedCert);
    } else {
        credentials = grpc.credentials.createSsl();
    }

    return new registrationService(
        `${config.host}:${config.port}`,
        credentials
    );
}

const client = createGrpcClient();

// Helper for phone number formatting
function formatPhoneNumber(phoneNumber) {
    return phoneNumber.replace(/^\+/, '').replace(/\D/g, '');
}

// Helper to convert Buffer to hex string
function bufferToHexString(buffer) {
    if (buffer && buffer.type === 'Buffer' && Array.isArray(buffer.data)) {
        const bufferInstance = Buffer.from(buffer.data);
        return bufferInstance.toString('hex');
    } else if (Buffer.isBuffer(buffer)) {
        return buffer.toString('hex');
    }
    return buffer;
}

// Helper to format session metadata
function formatSessionMetadata(metadata) {
    if (!metadata) return null;
    
    const formatted = {...metadata};
    if (metadata.session_id) {
        formatted.session_id = bufferToHexString(metadata.session_id);
    }
    return formatted;
}

// Middleware for basic request validation
function validateRequest(requiredFields) {
    return (req, res, next) => {
        for (const field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({
                    error: `Missing required field: ${field}`
                });
            }
        }
        next();
    };
}

// Create Session endpoint
app.post('/create-session', 
    validateRequest(['phoneNumber']),
    (req, res) => {
        client.createSession({
            e164: formatPhoneNumber(req.body.phoneNumber)
        }, (error, response) => {
            if (error) {
                console.error('Error creating session:', error);
                res.status(500).json({ error: error.message });
                return;
            }
            
            const sessionId = bufferToHexString(response.session_metadata.session_id);
            const formattedResponse = {
                session_id: sessionId,
                metadata: response.session_metadata
            };
            
            res.json(formattedResponse);
        });
    }
);

// Get Session endpoint has been removed as it's not supported by the gRPC service

// Send verification code endpoint
app.post('/send-verification',
    validateRequest(['sessionId']), 
    (req, res) => {
        // Convert hex string session ID back to Buffer
        const sessionBuffer = Buffer.from(req.body.sessionId, 'hex');
        
        client.sendVerificationCode({
            session_id: sessionBuffer,
            transport: req.body.transport || 'MESSAGE_TRANSPORT_SMS',
            transport_config: req.body.transportConfig || {}
        }, (error, response) => {
            if (error) {
                console.error('Error sending verification:', error);
                res.status(500).json({ error: error.message });
                return;
            }
            
            const formattedResponse = {
                success: true,
                metadata: formatSessionMetadata(response.session_metadata)
            };
            
            res.json(formattedResponse);
        });
    }
);

// Check verification code endpoint
app.post('/check-verification',
    validateRequest(['sessionId', 'code']),
    (req, res) => {
        // Convert hex string session ID back to Buffer
        const sessionBuffer = Buffer.from(req.body.sessionId, 'hex');
        
        client.checkVerificationCode({
            session_id: sessionBuffer,
            verification_code: req.body.code
        }, (error, response) => {
            if (error) {
                console.error('Error checking verification:', error);
                res.status(500).json({ error: error.message });
                return;
            }
            
            const formattedResponse = {
                success: true,
                metadata: formatSessionMetadata(response.session_metadata)
            };
            
            res.json(formattedResponse);
        });
    }
);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    });
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
    console.log(`Proxy server running on ${HOST}:${PORT}`);
    console.log(`Connected to gRPC service at ${config.host}:${config.port}`);
    console.log(`Using plaintext connection: ${config.usePlaintext}`);
});