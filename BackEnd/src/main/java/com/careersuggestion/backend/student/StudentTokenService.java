package com.careersuggestion.backend.student;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class StudentTokenService {

    private static final long TOKEN_LIFETIME_MILLIS = 8 * 60 * 60 * 1000;
    private static final String HMAC_ALGORITHM = "HmacSHA256";
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final byte[] tokenSecret;

    public StudentTokenService(@Value("${app.student.token-secret:}") String configuredSecret) {
        tokenSecret = configuredSecret.isBlank()
                ? generateTokenSecret()
                : configuredSecret.getBytes(StandardCharsets.UTF_8);
        if (tokenSecret.length < 32) {
            throw new IllegalArgumentException("Student token secret must be at least 32 bytes.");
        }
    }

    public String issue(Long studentId) {
        long expiresAt = System.currentTimeMillis() + TOKEN_LIFETIME_MILLIS;
        String identity = Base64.getUrlEncoder().withoutPadding()
                .encodeToString(studentId.toString().getBytes(StandardCharsets.UTF_8));
        String payload = identity + "." + expiresAt;
        return payload + "." + sign(payload);
    }

    public Long studentId(String token) {
        if (token == null) {
            return null;
        }
        String[] parts = token.split("\\.", -1);
        if (parts.length != 3) {
            return null;
        }
        String payload = parts[0] + "." + parts[1];
        try {
            long expiresAt = Long.parseLong(parts[1]);
            boolean validSignature = MessageDigest.isEqual(
                    sign(payload).getBytes(StandardCharsets.US_ASCII),
                    parts[2].getBytes(StandardCharsets.US_ASCII));
            if (expiresAt <= System.currentTimeMillis() || !validSignature) {
                return null;
            }
            return Long.valueOf(new String(
                    Base64.getUrlDecoder().decode(parts[0]), StandardCharsets.UTF_8));
        } catch (IllegalArgumentException exception) {
            return null;
        }
    }

    private String sign(String payload) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(new SecretKeySpec(tokenSecret, HMAC_ALGORITHM));
            return Base64.getUrlEncoder().withoutPadding()
                    .encodeToString(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
        } catch (GeneralSecurityException exception) {
            throw new IllegalStateException("Unable to sign student session token.", exception);
        }
    }

    private static byte[] generateTokenSecret() {
        byte[] secret = new byte[32];
        SECURE_RANDOM.nextBytes(secret);
        return secret;
    }
}
