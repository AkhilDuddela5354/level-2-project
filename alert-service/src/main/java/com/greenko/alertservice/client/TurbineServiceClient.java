package com.greenko.alertservice.client;

import com.greenko.alertservice.dto.TurbineDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

@FeignClient(name = "turbine-service", url = "http://turbine-service:8080")
public interface TurbineServiceClient {

    @GetMapping("/api/turbines/{id}")
    TurbineDto getTurbine(@PathVariable("id") String turbineId);

    @GetMapping("/api/turbines")
    List<TurbineDto> getAllTurbines();
}
