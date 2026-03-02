package com.greenko.alertservice.service;

import com.greenko.alertservice.dto.TelemetryDataDto;
import com.greenko.alertservice.dto.TurbineDto;
import org.springframework.stereotype.Component;

@Component
public class AlertRules {

    /**
     * CRITICAL: Power output < 10% of capacity (when wind speed > 5 m/s)
     */
    public boolean isCriticalLowPower(TelemetryDataDto data, TurbineDto turbine) {
        if (data == null || turbine == null || turbine.getCapacity() == null || turbine.getCapacity() <= 0) {
            return false;
        }
        double threshold = turbine.getCapacity() * 0.10;
        Double windSpeed = data.getWindSpeed();
        Double powerOutput = data.getPowerOutput();
        return powerOutput != null && powerOutput < threshold
                && windSpeed != null && windSpeed > 5.0;
    }

    /**
     * CRITICAL: Excessive vibration > 15.0 mm/s
     */
    public boolean isCriticalVibration(TelemetryDataDto data) {
        return data != null && data.getVibration() != null && data.getVibration() > 15.0;
    }

    /**
     * WARNING: High temperature > 80.0 °C
     */
    public boolean isWarningTemperature(TelemetryDataDto data) {
        return data != null && data.getTemperature() != null && data.getTemperature() > 80.0;
    }

    /**
     * WARNING: High wind speed > 25.0 m/s
     */
    public boolean isWarningWindSpeed(TelemetryDataDto data) {
        return data != null && data.getWindSpeed() != null && data.getWindSpeed() > 25.0;
    }

    /**
     * INFO: Low efficiency < 70%
     */
    public boolean isInfoLowEfficiency(TelemetryDataDto data) {
        return data != null && data.getEfficiency() != null && data.getEfficiency() < 70.0;
    }
}
