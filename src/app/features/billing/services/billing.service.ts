import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { InvoiceResponse } from '../models/invoice.model';
import { AuthService } from '../../../core/services/auth.service';

@Injectable({
    providedIn: 'root'
})
export class BillingService {
    private apiUrl = `${environment.apiUrl}/billing`;

    constructor(
        private http: HttpClient,
        private authService: AuthService
    ) { }

    getInvoices(page: number = 1, limit: number = 10): Observable<InvoiceResponse> {
        const params = new HttpParams()
            .set('page', page.toString())
            .set('limit', limit.toString());
        const token = this.authService.token;
        let headers = new HttpHeaders();
        if (token) {
            headers = headers.set('Authorization', `Bearer ${token}`);
        }
        return this.http.get<InvoiceResponse>(`${this.apiUrl}/invoices`, {
            params: params,
            headers: headers
        });
    }

    downloadInvoiceFile(uuid: string, format: 'pdf' | 'xml'): Observable<Blob> {
        const params = new HttpParams().set('format', format);
        const token = this.authService.token;

        let headers = new HttpHeaders();
        if (token) {
            headers = headers.set('Authorization', `Bearer ${token}`);
        }

        return this.http.get(`${this.apiUrl}/invoices/${uuid}/download`, {
            params: params,
            headers: headers,
            responseType: 'blob'
        });
    }

    sendInvoiceEmail(uuid: string): Observable<any> {
        const token = this.authService.token;

        let headers = new HttpHeaders();
        if (token) {
            headers = headers.set('Authorization', `Bearer ${token}`);
        }

        return this.http.post(`${this.apiUrl}/invoices/${uuid}/email`, {}, { headers: headers });
    }

    createDraft(payload: any): Observable<Blob> {
        const token = this.authService.token;

        let headers = new HttpHeaders();
        if (token) {
            headers = headers.set('Authorization', `Bearer ${token}`);
        }

        return this.http.post(`${this.apiUrl}/drafts`, payload, {
            headers: headers,
            responseType: 'blob'
        });
    }

    createInvoice(payload: any): Observable<any> {
        // const token = this.authService.token;
        // let headers = new HttpHeaders();
        // if (token) {
        //     headers = headers.set('Authorization', `Bearer ${token}`);
        // }
        return this.http.post(`${this.apiUrl}/invoices`, payload/*, { headers }*/);
    }

    cancelInvoice(uuid: string, motive: string, substitutionUuid?: string): Observable<any> {
        const token = this.authService.token;

        let headers = new HttpHeaders();
        if (token) {
            headers = headers.set('Authorization', `Bearer ${token}`);
        }

        // Configurar el body para la petición DELETE
        const options = {
            headers: headers,
            body: {
                motive: motive,
                substitutionUuid: substitutionUuid
            }
        };

        return this.http.delete(`${this.apiUrl}/invoices/${uuid}`, options);
    }
}