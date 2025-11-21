package com.retail;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertNotNull;

/**
 * Basic smoke test for the application main class.
 */
class RetailApplicationTest {

    @Test
    void mainClassExists() {
        // Verify the main application class exists and can be instantiated
        RetailApplication app = new RetailApplication();
        assertNotNull(app);
    }

    @Test
    void mainMethodExists() throws NoSuchMethodException {
        // Verify the main method exists with correct signature
        assertNotNull(RetailApplication.class.getMethod("main", String[].class));
    }
}
