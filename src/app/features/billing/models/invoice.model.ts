export interface Customer {
  id: string;
  legalName: string;
  taxId: string;
  email: string;
  taxSystem: string;
}

export interface Invoice {
  id: string;
  uuid: string;
  series: string;
  folio: string;
  date: string;
  status: string;
  total: number;
  subtotal: number;
  currency: string;
  providerUsed: string;
  Customer: Customer;
}

export interface PaginationData {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

export interface InvoiceResponse {
  success: boolean;
  data: Invoice[];
  pagination: PaginationData;
}