package com.retail.domain.auth;

import jakarta.validation.constraints.NotBlank;

/**
 * OAuth2 login request containing access token from client.
 */
public class OAuth2LoginRequest {

    @NotBlank(message = "Provider is required")
    private String provider; // "GOOGLE" or "FACEBOOK"

    @NotBlank(message = "Access token is required")
    private String accessToken; // OAuth2 access token from client

    // Constructors
    public OAuth2LoginRequest() {
    }

    public OAuth2LoginRequest(String provider, String accessToken) {
        this.provider = provider;
        this.accessToken = accessToken;
    }

    // Getters and setters
    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public String getAccessToken() {
        return accessToken;
    }

    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }
}
