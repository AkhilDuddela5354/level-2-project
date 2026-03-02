import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export type AlertSeverity = 'CRITICAL' | 'WARNING' | 'INFO';
export type AlertStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';

export interface Alert {
  id?: number;
  turbineId: string;
  turbineName?: string;
  severity: AlertSeverity;
  message: string;
  status: AlertStatus;
  acknowledgedAt?: string;
  createdAt?: string;
  resolvedAt?: string;
}

export interface AlertFilters {
  severity?: AlertSeverity;
  status?: AlertStatus;
  turbineId?: string;
}

@Injectable({ providedIn: 'root' })
export class AlertService {
  private apiUrl = '/api/alerts';

  constructor(private http: HttpClient) {}

  getAlerts(filters?: AlertFilters): Observable<Alert[]> {
    let params = new HttpParams();
    if (filters?.severity) params = params.set('severity', filters.severity);
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.turbineId) params = params.set('turbineId', filters.turbineId);
    return this.http.get<Alert[]>(this.apiUrl, { params });
  }

  getAlertById(id: number): Observable<Alert> {
    return this.http.get<Alert>(`${this.apiUrl}/${id}`);
  }

  getAlertsByTurbine(turbineId: string): Observable<Alert[]> {
    return this.http.get<Alert[]>(`${this.apiUrl}/turbine/${turbineId}`);
  }

  createAlert(alert: Alert): Observable<Alert> {
    return this.http.post<Alert>(this.apiUrl, alert);
  }

  acknowledgeAlert(id: number): Observable<Alert> {
    return this.http.patch<Alert>(`${this.apiUrl}/${id}/acknowledge`, {});
  }

  resolveAlert(id: number): Observable<Alert> {
    return this.http.patch<Alert>(`${this.apiUrl}/${id}/resolve`, {});
  }

  deleteAlert(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  scanForAnomalies(): Observable<Alert[]> {
    return this.http.post<Alert[]>(`${this.apiUrl}/scan`, {});
  }
}
