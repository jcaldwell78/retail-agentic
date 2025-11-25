package com.retail.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.elasticsearch.client.ClientConfiguration;
import org.springframework.data.elasticsearch.client.elc.ReactiveElasticsearchConfiguration;
import org.springframework.data.elasticsearch.repository.config.EnableReactiveElasticsearchRepositories;

/**
 * Elasticsearch configuration for reactive search.
 * Configures connection and repositories.
 */
@Configuration
@EnableReactiveElasticsearchRepositories(basePackages = "com.retail.infrastructure.search")
public class ElasticsearchConfig extends ReactiveElasticsearchConfiguration {

    @Value("${spring.elasticsearch.uris:localhost:9200}")
    private String elasticsearchUris;

    @Value("${spring.elasticsearch.username:}")
    private String username;

    @Value("${spring.elasticsearch.password:}")
    private String password;

    @Override
    public ClientConfiguration clientConfiguration() {
        ClientConfiguration.MaybeSecureClientConfigurationBuilder builder = ClientConfiguration.builder()
                .connectedTo(elasticsearchUris.split(","));

        // Add authentication if provided
        if (!username.isEmpty() && !password.isEmpty()) {
            builder.withBasicAuth(username, password);
        }

        return builder.build();
    }
}
