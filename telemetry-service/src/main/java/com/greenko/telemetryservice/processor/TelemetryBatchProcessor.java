package com.greenko.telemetryservice.processor;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.*;
import java.util.stream.Collectors;

/**
 * Parallel Batch Processor for Wind Turbine Telemetry Data
 * 
 * Processes 10-second telemetry data into hourly aggregates using:
 * - ExecutorService for parallel processing across multiple turbine farms
 * - CompletableFuture for asynchronous batch processing
 * - Stream API for efficient data aggregation
 * 
 * Performance Target: Process 2,200+ turbines with 10-second intervals
 */
@Component
@Slf4j
public class TelemetryBatchProcessor {

    private final ExecutorService executorService;
    private final int THREAD_POOL_SIZE = 10;
    private final int BATCH_SIZE = 100;

    public TelemetryBatchProcessor() {
        this.executorService = Executors.newFixedThreadPool(
            THREAD_POOL_SIZE,
            new ThreadFactory() {
                private int counter = 0;
                @Override
                public Thread newThread(Runnable r) {
                    Thread thread = new Thread(r);
                    thread.setName("telemetry-processor-" + counter++);
                    return thread;
                }
            }
        );
        log.info("Initialized Telemetry Batch Processor with {} threads", THREAD_POOL_SIZE);
    }

    /**
     * Scheduled task to process telemetry data every hour
     * Runs at the start of each hour (0 minutes, 0 seconds)
     */
    @Scheduled(cron = "0 0 * * * *") // Every hour at :00:00
    public void processHourlyAggregation() {
        log.info("Starting hourly telemetry aggregation at {}", LocalDateTime.now());
        
        long startTime = System.currentTimeMillis();
        
        try {
            // Fetch all farms that need processing
            List<String> farmIds = getFarmIdsForProcessing();
            log.info("Processing telemetry for {} farms", farmIds.size());
            
            // Process farms in parallel
            List<CompletableFuture<AggregationResult>> futures = farmIds.stream()
                .map(farmId -> CompletableFuture.supplyAsync(
                    () -> processFarmTelemetry(farmId),
                    executorService
                ))
                .collect(Collectors.toList());
            
            // Wait for all tasks to complete
            CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
            
            // Collect results
            List<AggregationResult> results = futures.stream()
                .map(CompletableFuture::join)
                .collect(Collectors.toList());
            
            long totalRecordsProcessed = results.stream()
                .mapToLong(AggregationResult::getRecordsProcessed)
                .sum();
            
            long totalAnomalies = results.stream()
                .mapToLong(AggregationResult::getAnomaliesDetected)
                .sum();
            
            long duration = System.currentTimeMillis() - startTime;
            
            log.info("Hourly aggregation completed in {}ms", duration);
            log.info("Total records processed: {}", totalRecordsProcessed);
            log.info("Total anomalies detected: {}", totalAnomalies);
            log.info("Average processing time per farm: {}ms", duration / farmIds.size());
            
        } catch (Exception e) {
            log.error("Error during hourly aggregation", e);
        }
    }

    /**
     * Process telemetry data for a specific farm in parallel
     * 
     * @param farmId The farm identifier
     * @return Aggregation result with statistics
     */
    @Async
    public CompletableFuture<AggregationResult> processFarmAsync(String farmId) {
        return CompletableFuture.supplyAsync(
            () -> processFarmTelemetry(farmId),
            executorService
        );
    }

    /**
     * Core processing logic for a single farm
     * Aggregates 10-second telemetry data into hourly summaries
     */
    private AggregationResult processFarmTelemetry(String farmId) {
        long startTime = System.currentTimeMillis();
        log.debug("Processing farm: {} on thread {}", farmId, Thread.currentThread().getName());
        
        try {
            // TODO: Fetch raw telemetry data for the last hour
            // List<RawTelemetry> rawData = telemetryRepository.findByFarmIdAndTimestampBetween(
            //     farmId, oneHourAgo, now
            // );
            
            // Simulate processing (replace with actual logic)
            int recordsProcessed = simulateProcessing(farmId);
            
            // TODO: Compute aggregations
            // - Average power output
            // - Average wind speed
            // - Average efficiency
            // - Detect anomalies (threshold-based or ML)
            
            // TODO: Save hourly aggregate
            // HourlyAggregate aggregate = new HourlyAggregate();
            // aggregate.setFarmId(farmId);
            // aggregate.setTimestamp(LocalDateTime.now().truncatedTo(ChronoUnit.HOURS));
            // aggregate.setAvgPowerOutput(avgPower);
            // aggregate.setAvgWindSpeed(avgWind);
            // aggregate.setEfficiency(efficiency);
            // hourlyAggregateRepository.save(aggregate);
            
            int anomalies = detectAnomalies(farmId, recordsProcessed);
            
            long duration = System.currentTimeMillis() - startTime;
            log.debug("Completed farm {} in {}ms", farmId, duration);
            
            return new AggregationResult(farmId, recordsProcessed, anomalies, duration);
            
        } catch (Exception e) {
            log.error("Error processing farm {}", farmId, e);
            return new AggregationResult(farmId, 0, 0, 0);
        }
    }

    /**
     * Process multiple farms in parallel batches
     */
    public void processBatch(List<String> farmIds) {
        log.info("Processing batch of {} farms", farmIds.size());
        
        // Split into batches
        List<List<String>> batches = partitionList(farmIds, BATCH_SIZE);
        
        for (int i = 0; i < batches.size(); i++) {
            List<String> batch = batches.get(i);
            log.info("Processing batch {}/{} with {} farms", i + 1, batches.size(), batch.size());
            
            // Process batch in parallel
            List<CompletableFuture<AggregationResult>> futures = batch.stream()
                .map(this::processFarmAsync)
                .collect(Collectors.toList());
            
            // Wait for batch completion
            CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
        }
        
        log.info("Batch processing completed");
    }

    /**
     * Simulate telemetry data processing
     * Replace with actual database queries and calculations
     */
    private int simulateProcessing(String farmId) {
        try {
            // Simulate processing time (10-100ms)
            Thread.sleep(ThreadLocalRandom.current().nextInt(10, 100));
            // Simulate 360 records (10-second intervals for 1 hour)
            return 360;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return 0;
        }
    }

    /**
     * Anomaly detection logic
     * Uses threshold-based rules (can be replaced with ML model)
     */
    private int detectAnomalies(String farmId, int recordsProcessed) {
        // Simulate anomaly detection
        // TODO: Implement actual rules:
        // - Power output below threshold for wind speed
        // - Efficiency drop > 20%
        // - Vibration levels excessive
        // - Temperature out of range
        return ThreadLocalRandom.current().nextInt(0, 5);
    }

    /**
     * Fetch list of farm IDs to process
     * Replace with actual database query
     */
    private List<String> getFarmIdsForProcessing() {
        // TODO: Query from database
        // return farmRepository.findAllFarmIds();
        
        // Simulate 50 farms for now
        return List.of("FARM-001", "FARM-002", "FARM-003", "FARM-004", "FARM-005",
                      "FARM-006", "FARM-007", "FARM-008", "FARM-009", "FARM-010");
    }

    /**
     * Utility: Partition list into batches
     */
    private <T> List<List<T>> partitionList(List<T> list, int batchSize) {
        return list.stream()
            .collect(Collectors.groupingBy(item -> list.indexOf(item) / batchSize))
            .values()
            .stream()
            .collect(Collectors.toList());
    }

    /**
     * Graceful shutdown
     */
    public void shutdown() {
        log.info("Shutting down Telemetry Batch Processor");
        executorService.shutdown();
        try {
            if (!executorService.awaitTermination(60, TimeUnit.SECONDS)) {
                executorService.shutdownNow();
            }
        } catch (InterruptedException e) {
            executorService.shutdownNow();
            Thread.currentThread().interrupt();
        }
    }

    /**
     * Result DTO for aggregation processing
     */
    public static class AggregationResult {
        private final String farmId;
        private final long recordsProcessed;
        private final long anomaliesDetected;
        private final long processingTimeMs;

        public AggregationResult(String farmId, long recordsProcessed, long anomaliesDetected, long processingTimeMs) {
            this.farmId = farmId;
            this.recordsProcessed = recordsProcessed;
            this.anomaliesDetected = anomaliesDetected;
            this.processingTimeMs = processingTimeMs;
        }

        public String getFarmId() { return farmId; }
        public long getRecordsProcessed() { return recordsProcessed; }
        public long getAnomaliesDetected() { return anomaliesDetected; }
        public long getProcessingTimeMs() { return processingTimeMs; }
    }
}
