package com.greenko.telemetryservice.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

/**
 * Async and Scheduling Configuration for Parallel Processing
 * 
 * Enables:
 * - @Async annotation for asynchronous method execution
 * - @Scheduled annotation for periodic tasks
 * - Custom thread pool for parallel telemetry processing
 */
@Configuration
@EnableAsync
@EnableScheduling
public class AsyncConfig {

    /**
     * Task Executor for async processing
     * Configured for high-throughput telemetry data processing
     */
    @Bean(name = "taskExecutor")
    public Executor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        
        // Core pool size: Number of threads to keep alive
        executor.setCorePoolSize(10);
        
        // Max pool size: Maximum number of threads
        executor.setMaxPoolSize(20);
        
        // Queue capacity: Pending tasks before creating new threads
        executor.setQueueCapacity(500);
        
        // Thread name prefix for debugging
        executor.setThreadNamePrefix("async-telemetry-");
        
        // Wait for tasks to complete on shutdown
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(60);
        
        executor.initialize();
        return executor;
    }
}
