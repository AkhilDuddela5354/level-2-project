import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TelemetryData {
  id?: number;
  turbineId: string;
  timestamp: string;
  powerOutput: number;
  windSpeed: number;
  temperature: number;
  vibration: number;
  rpm: number;
  efficiency: number;
  createdAt?: string;
}

export interface TelemetryStats {
  turbineId: string;
  avgPowerOutput: number;
  avgWindSpeed: number;
  avgTemperature: number;
  avgVibration: number;
  avgRpm: number;
  avgEfficiency: number;
  maxPowerOutput: number;
  minPowerOutput: number;
  dataPoints: number;
}

@Injectable({ providedIn: 'root' })
export class TelemetryService {
  private apiUrl = '/api/telemetry';

  constructor(private http: HttpClient) {}

  getLatestTelemetry(turbineId: string): Observable<TelemetryData> {
    return this.http.get<TelemetryData>(`${this.apiUrl}/${turbineId}/latest`);
  }

  getTelemetryHistory(turbineId: string, startTime?: string, endTime?: string): Observable<TelemetryData[]> {
    let url = `${this.apiUrl}/${turbineId}`;
    const params: string[] = [];
    if (startTime) params.push(`startTime=${startTime}`);
    if (endTime) params.push(`endTime=${endTime}`);
    if (params.length > 0) url += `?${params.join('&')}`;
    return this.http.get<TelemetryData[]>(url);
  }

  getRecentTelemetry(): Observable<TelemetryData[]> {
    return this.http.get<TelemetryData[]>(`${this.apiUrl}/recent`);
  }

  getStats(turbineId: string): Observable<TelemetryStats> {
    return this.http.get<TelemetryStats>(`${this.apiUrl}/${turbineId}/stats`);
  }

  ingestTelemetry(data: TelemetryData): Observable<TelemetryData> {
    return this.http.post<TelemetryData>(this.apiUrl, data);
  }
}
