package com.retail.domain.user;

/**
 * User roles in the system
 */
public enum UserRole {
    /** Regular customer */
    CUSTOMER,

    /** Store staff member */
    STAFF,

    /** Store administrator */
    ADMIN,

    /** Store owner with full access */
    STORE_OWNER
}
