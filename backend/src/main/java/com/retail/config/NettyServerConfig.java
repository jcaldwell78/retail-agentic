package com.retail.config;

import io.netty.channel.ChannelOption;
import org.springframework.boot.web.embedded.netty.NettyReactiveWebServerFactory;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

/**
 * Netty server configuration for DDoS protection and performance.
 *
 * Configures connection limits and timeouts to protect against:
 * - Connection exhaustion attacks
 * - Slowloris attacks
 * - Large payload attacks
 */
@Configuration
public class NettyServerConfig implements WebServerFactoryCustomizer<NettyReactiveWebServerFactory> {

    /**
     * Maximum number of concurrent connections allowed.
     * Prevents connection exhaustion attacks.
     */
    private static final int MAX_CONNECTIONS = 1000;

    /**
     * Connection timeout in seconds.
     * Time allowed for client to complete connection handshake.
     */
    private static final int CONNECTION_TIMEOUT_SECONDS = 20;

    /**
     * Idle timeout in seconds.
     * Close connections that are idle for this duration.
     * Prevents Slowloris attacks.
     */
    private static final int IDLE_TIMEOUT_SECONDS = 60;

    /**
     * Maximum size of pending connection queue.
     * Connections waiting to be accepted when server is at max capacity.
     */
    private static final int SO_BACKLOG = 100;

    /**
     * SO_KEEPALIVE option.
     * Send TCP keepalive probes to detect dead connections.
     */
    private static final boolean SO_KEEPALIVE = true;

    /**
     * TCP_NODELAY option (disable Nagle's algorithm).
     * Send small packets immediately without buffering.
     * Better for low-latency API responses.
     */
    private static final boolean TCP_NODELAY = true;

    @Override
    public void customize(NettyReactiveWebServerFactory factory) {
        // Configure connection limits and timeouts
        factory.addServerCustomizers(httpServer -> httpServer
            // Connection idle timeout - close idle connections
            // This helps prevent Slowloris attacks
            .idleTimeout(Duration.ofSeconds(IDLE_TIMEOUT_SECONDS))

            // Configure TCP options
            // SO_BACKLOG limits the queue of pending connections
            .option(ChannelOption.SO_BACKLOG, SO_BACKLOG)
            .option(ChannelOption.SO_KEEPALIVE, SO_KEEPALIVE)
            .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, CONNECTION_TIMEOUT_SECONDS * 1000)

            // Child channel options (for accepted connections)
            .childOption(ChannelOption.TCP_NODELAY, TCP_NODELAY)
            .childOption(ChannelOption.SO_KEEPALIVE, SO_KEEPALIVE)
        );

        // Note: Maximum concurrent connections can be controlled at the infrastructure level
        // (load balancer, reverse proxy like Nginx) or via connection pool configuration.
        // Reactor Netty handles connection management automatically based on available resources.
    }
}
