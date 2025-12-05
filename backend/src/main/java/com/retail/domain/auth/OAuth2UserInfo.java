package com.retail.domain.auth;

import java.util.Map;

/**
 * OAuth2 user information from provider.
 */
public class OAuth2UserInfo {

    private String id;
    private String email;
    private String firstName;
    private String lastName;
    private String name;
    private String picture;
    private Map<String, Object> attributes;

    public OAuth2UserInfo() {
    }

    public OAuth2UserInfo(Map<String, Object> attributes) {
        this.attributes = attributes;
    }

    // Getters and setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPicture() {
        return picture;
    }

    public void setPicture(String picture) {
        this.picture = picture;
    }

    public Map<String, Object> getAttributes() {
        return attributes;
    }

    public void setAttributes(Map<String, Object> attributes) {
        this.attributes = attributes;
    }

    /**
     * Parse user info from provider-specific attributes.
     */
    public static OAuth2UserInfo fromGoogle(Map<String, Object> attributes) {
        OAuth2UserInfo userInfo = new OAuth2UserInfo(attributes);
        userInfo.setId((String) attributes.get("sub"));
        userInfo.setEmail((String) attributes.get("email"));
        userInfo.setName((String) attributes.get("name"));
        userInfo.setFirstName((String) attributes.get("given_name"));
        userInfo.setLastName((String) attributes.get("family_name"));
        userInfo.setPicture((String) attributes.get("picture"));
        return userInfo;
    }

    /**
     * Parse user info from Facebook attributes.
     */
    public static OAuth2UserInfo fromFacebook(Map<String, Object> attributes) {
        OAuth2UserInfo userInfo = new OAuth2UserInfo(attributes);
        userInfo.setId((String) attributes.get("id"));
        userInfo.setEmail((String) attributes.get("email"));
        userInfo.setName((String) attributes.get("name"));

        // Facebook doesn't always provide first/last names separately
        String name = (String) attributes.get("name");
        if (name != null && !name.isEmpty()) {
            String[] parts = name.split(" ", 2);
            userInfo.setFirstName(parts[0]);
            if (parts.length > 1) {
                userInfo.setLastName(parts[1]);
            } else {
                userInfo.setLastName("");
            }
        }

        // Facebook picture is nested in an object
        @SuppressWarnings("unchecked")
        Map<String, Object> picture = (Map<String, Object>) attributes.get("picture");
        if (picture != null) {
            @SuppressWarnings("unchecked")
            Map<String, Object> data = (Map<String, Object>) picture.get("data");
            if (data != null) {
                userInfo.setPicture((String) data.get("url"));
            }
        }

        return userInfo;
    }
}
