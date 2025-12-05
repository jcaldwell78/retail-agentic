package com.retail;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Import;

/**
 * Base test configuration that imports all necessary test configurations.
 * This ensures that mock beans for Redis and Elasticsearch are available in all integration tests.
 *
 * Usage: Add @Import(BaseTestConfiguration.class) to your test class,
 * or use @ContextConfiguration(classes = BaseTestConfiguration.class)
 */
@TestConfiguration
@Import({
    TestRedisConfiguration.class,
    TestElasticsearchConfiguration.class,
    TestTenantConfiguration.class,
    TestSecurityConfiguration.class
})
public class BaseTestConfiguration {
    // This class serves as a central import point for all test configurations
}
