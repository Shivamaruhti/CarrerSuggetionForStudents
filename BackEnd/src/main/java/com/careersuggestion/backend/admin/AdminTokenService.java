package com.careersuggestion.backend.admin;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AdminTokenService {

    private static final long TOKEN_LIFETIME_MILLIS = 8 * 60 * 60 * 1000;
    private static final String HMAC_ALGORITHM = "HmacSHA256";
    private static final int TOKEN_SECRET_LENGTH = 32;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final String adminId;
    private final String adminPassword;
    private final byte[] tokenSecret;

    public AdminTokenService(
            @Value("${app.admin.id:}") String adminId,
            @Value("${app.admin.password:}") String adminPassword,
            @Value("${app.admin.token-secret:}") String tokenSecret) {
        this.adminId = adminId;
        this.adminPassword = adminPassword;
        this.tokenSecret = tokenSecret.isBlank()
                ? generateTokenSecret()
                : tokenSecret.getBytes(StandardCharsets.UTF_8);
    }

    public String authenticate(String suppliedId, String suppliedPassword) {
        if (!isConfigured()) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE, "Admin login is not configured.");
        }

        boolean validId = matches(adminId, suppliedId);
        boolean validPassword = matches(adminPassword, suppliedPassword);
        if (!validId || !validPassword) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid admin credentials.");
        }

        long expiresAt = System.currentTimeMillis() + TOKEN_LIFETIME_MILLIS;
        String identity = Base64.getUrlEncoder().withoutPadding()
                .encodeToString(adminId.getBytes(StandardCharsets.UTF_8));
        String payload = identity + "." + expiresAt;
        return payload + "." + sign(payload);
    }

    public boolean isValid(String token) {
        if (!isConfigured() || token == null) {
            return false;
        }

        String[] parts = token.split("\\.", -1);
        if (parts.length != 3) {
            return false;
        }

        String payload = parts[0] + "." + parts[1];
        try {
            String tokenAdminId = new String(
                    Base64.getUrlDecoder().decode(parts[0]), StandardCharsets.UTF_8);
            long expiresAt = Long.parseLong(parts[1]);
            return matches(adminId, tokenAdminId)
                    && expiresAt > System.currentTimeMillis()
                    && MessageDigest.isEqual(
                            sign(payload).getBytes(StandardCharsets.US_ASCII),
                            parts[2].getBytes(StandardCharsets.US_ASCII));
        } catch (IllegalArgumentException exception) {
            return false;
        }
    }

    private boolean isConfigured() {
        return !adminId.isBlank() && !adminPassword.isBlank()
                && tokenSecret.length >= TOKEN_SECRET_LENGTH;
    }

    private static byte[] generateTokenSecret() {
        byte[] secret = new byte[TOKEN_SECRET_LENGTH];
        SECURE_RANDOM.nextBytes(secret);
        return secret;
    }

    private static boolean matches(String expected, String supplied) {
        if (supplied == null) {
            return false;
        }
        return MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.UTF_8),
                supplied.getBytes(StandardCharsets.UTF_8));
    }

    private String sign(String payload) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(new SecretKeySpec(tokenSecret, HMAC_ALGORITHM));
            byte[] signature = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(signature);
        } catch (GeneralSecurityException exception) {
            throw new IllegalStateException("Unable to sign admin session token.", exception);
        }
    }
}
