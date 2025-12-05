package com.retail.domain.user;

/**
 * User account status
 */
public enum UserStatus {
    /** Account is active and can be used */
    ACTIVE,

    /** Account is temporarily suspended */
    SUSPENDED,

    /** Account is permanently inactive */
    INACTIVE
}
