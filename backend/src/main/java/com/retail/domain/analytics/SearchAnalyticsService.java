package com.retail.domain.analytics;

import com.retail.security.tenant.TenantContext;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service for tracking and analyzing search behavior.
 * Helps understand what customers are searching for.
 */
@Service
public class SearchAnalyticsService {

    private final ReactiveMongoTemplate mongoTemplate;

    public SearchAnalyticsService(ReactiveMongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    /**
     * Track a search query.
     *
     * @param query Search query string
     * @param resultCount Number of results found
     * @param userId Optional user ID (null for anonymous)
     * @return Mono<SearchEvent> Saved search event
     */
    public Mono<SearchEvent> trackSearch(String query, int resultCount, String userId) {
        return TenantContext.getTenantId()
            .flatMap(tenantId -> {
                SearchEvent event = new SearchEvent(
                    null,
                    tenantId,
                    query,
                    resultCount,
                    userId,
                    Instant.now()
                );

                return mongoTemplate.save(event);
            });
    }

    /**
     * Track a search with no results (zero results).
     * These are important for understanding customer intent.
     *
     * @param query Search query with no results
     * @param userId Optional user ID
     * @return Mono<SearchEvent> Saved event
     */
    public Mono<SearchEvent> trackZeroResultSearch(String query, String userId) {
        return trackSearch(query, 0, userId);
    }

    /**
     * Get popular search queries.
     * Returns top N most frequent searches.
     *
     * @param limit Number of top queries to return
     * @param days Number of days to look back
     * @return Flux<PopularQuery> Top searches with counts
     */
    public Flux<PopularQuery> getPopularQueries(int limit, int days) {
        return TenantContext.getTenantId()
            .flatMapMany(tenantId -> {
                Instant since = Instant.now().minus(days, ChronoUnit.DAYS);

                Query query = new Query(
                    Criteria.where("tenantId").is(tenantId)
                        .and("timestamp").gte(since)
                        .and("resultCount").gt(0) // Only successful searches
                );

                return mongoTemplate.find(query, SearchEvent.class)
                    .collectList()
                    .flatMapMany(events -> {
                        // Group by query and count
                        Map<String, Long> queryCounts = events.stream()
                            .collect(Collectors.groupingBy(
                                SearchEvent::query,
                                Collectors.counting()
                            ));

                        // Convert to PopularQuery and sort by count
                        List<PopularQuery> popular = queryCounts.entrySet().stream()
                            .map(entry -> new PopularQuery(entry.getKey(), entry.getValue()))
                            .sorted((a, b) -> Long.compare(b.count(), a.count()))
                            .limit(limit)
                            .toList();

                        return Flux.fromIterable(popular);
                    });
            });
    }

    /**
     * Get queries with zero results.
     * Identifies gaps in product catalog.
     *
     * @param limit Number of queries to return
     * @param days Number of days to look back
     * @return Flux<PopularQuery> Zero-result queries with counts
     */
    public Flux<PopularQuery> getZeroResultQueries(int limit, int days) {
        return TenantContext.getTenantId()
            .flatMapMany(tenantId -> {
                Instant since = Instant.now().minus(days, ChronoUnit.DAYS);

                Query query = new Query(
                    Criteria.where("tenantId").is(tenantId)
                        .and("timestamp").gte(since)
                        .and("resultCount").is(0) // Only zero-result searches
                );

                return mongoTemplate.find(query, SearchEvent.class)
                    .collectList()
                    .flatMapMany(events -> {
                        // Group by query and count
                        Map<String, Long> queryCounts = events.stream()
                            .collect(Collectors.groupingBy(
                                SearchEvent::query,
                                Collectors.counting()
                            ));

                        // Convert to PopularQuery and sort by count
                        List<PopularQuery> zeroResults = queryCounts.entrySet().stream()
                            .map(entry -> new PopularQuery(entry.getKey(), entry.getValue()))
                            .sorted((a, b) -> Long.compare(b.count(), a.count()))
                            .limit(limit)
                            .toList();

                        return Flux.fromIterable(zeroResults);
                    });
            });
    }

    /**
     * Get search analytics summary.
     *
     * @param days Number of days to analyze
     * @return Mono<SearchSummary> Summary statistics
     */
    public Mono<SearchSummary> getSearchSummary(int days) {
        return TenantContext.getTenantId()
            .flatMap(tenantId -> {
                Instant since = Instant.now().minus(days, ChronoUnit.DAYS);

                Query query = new Query(
                    Criteria.where("tenantId").is(tenantId)
                        .and("timestamp").gte(since)
                );

                return mongoTemplate.find(query, SearchEvent.class)
                    .collectList()
                    .map(events -> {
                        long totalSearches = events.size();
                        long uniqueQueries = events.stream()
                            .map(SearchEvent::query)
                            .distinct()
                            .count();
                        long zeroResultSearches = events.stream()
                            .filter(e -> e.resultCount() == 0)
                            .count();
                        double avgResults = events.stream()
                            .mapToInt(SearchEvent::resultCount)
                            .average()
                            .orElse(0.0);

                        return new SearchSummary(
                            totalSearches,
                            uniqueQueries,
                            zeroResultSearches,
                            avgResults,
                            days
                        );
                    });
            });
    }

    /**
     * Get search trends over time.
     * Returns daily search counts.
     *
     * @param days Number of days to analyze
     * @return Flux<DailySearchCount> Daily search statistics
     */
    public Flux<DailySearchCount> getSearchTrends(int days) {
        return TenantContext.getTenantId()
            .flatMapMany(tenantId -> {
                Instant since = Instant.now().minus(days, ChronoUnit.DAYS);

                Query query = new Query(
                    Criteria.where("tenantId").is(tenantId)
                        .and("timestamp").gte(since)
                );

                return mongoTemplate.find(query, SearchEvent.class)
                    .collectList()
                    .flatMapMany(events -> {
                        // Group by day
                        Map<String, Long> dailyCounts = events.stream()
                            .collect(Collectors.groupingBy(
                                event -> event.timestamp().truncatedTo(ChronoUnit.DAYS).toString(),
                                Collectors.counting()
                            ));

                        List<DailySearchCount> trends = dailyCounts.entrySet().stream()
                            .map(entry -> new DailySearchCount(
                                Instant.parse(entry.getKey()),
                                entry.getValue()
                            ))
                            .sorted((a, b) -> a.date().compareTo(b.date()))
                            .toList();

                        return Flux.fromIterable(trends);
                    });
            });
    }

    /**
     * Search event record
     */
    public record SearchEvent(
        String id,
        String tenantId,
        String query,
        int resultCount,
        String userId,
        Instant timestamp
    ) {}

    /**
     * Popular query record
     */
    public record PopularQuery(
        String query,
        long count
    ) {}

    /**
     * Search summary statistics
     */
    public record SearchSummary(
        long totalSearches,
        long uniqueQueries,
        long zeroResultSearches,
        double avgResultsPerSearch,
        int daysAnalyzed
    ) {}

    /**
     * Daily search count
     */
    public record DailySearchCount(
        Instant date,
        long searchCount
    ) {}
}
