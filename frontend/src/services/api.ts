import axios from 'axios';
import {
  type Patient, type PatientCreate, type PatientSearchResult,
  type Doctor, type DoctorCreate,
  type Visit, type VisitCreate,
  type Bill, type BillCreate,
  type Payment, type PaymentCreate,
  type DailySummary, type PaymentCollectionReport, type PatientStatistics
} from '../types/index';

// Use environment variable instead of hardcoded URL
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Health Check
export const healthCheck = () => api.get('/health');
export const getSystemInfo = () => api.get('/info');

// Patient API
export const patientAPI = {
  getAll: (params?: { skip?: number; limit?: number; category?: string; status?: string }) => 
    api.get<Patient[]>('/patients', { params }),
  
  search: (query: string) => 
    api.get<PatientSearchResult[]>(`/patients/search?q=${query}`),
  
  getById: (patientId: string) => 
    api.get<Patient>(`/patients/${patientId}`),
  
  create: (data: PatientCreate) => 
    api.post<Patient>('/patients', data),
  
  update: (patientId: string, data: Partial<PatientCreate>) => 
    api.put<Patient>(`/patients/${patientId}`, data),
  
  delete: (patientId: string) => 
    api.delete(`/patients/${patientId}`),
};

// Doctor API
export const doctorAPI = {
  getAll: (params?: { skip?: number; limit?: number; department?: string; is_active?: boolean }) => 
    api.get<Doctor[]>('/doctors', { params }),
  
  search: (query: string) => 
    api.get<Doctor[]>(`/doctors/search?q=${query}`),
  
  getByCode: (doctorCode: string) => 
    api.get<Doctor>(`/doctors/${doctorCode}`),
  
  create: (data: DoctorCreate) => 
    api.post<Doctor>('/doctors', data),
  
  update: (doctorCode: string, data: Partial<DoctorCreate>) => 
    api.put<Doctor>(`/doctors/${doctorCode}`, data),
  
  delete: (doctorCode: string) => 
    api.delete(`/doctors/${doctorCode}`),
};

// Visit API
export const visitAPI = {
  getAll: (params?: { 
    skip?: number; 
    limit?: number; 
    visit_type?: string; 
    date_from?: string; 
    date_to?: string; 
    status?: string 
  }) => api.get<Visit[]>('/visits', { params }),
  
  create: (data: VisitCreate) => 
    api.post<Visit>('/visits', data),
  
  getById: (visitId: string) => 
    api.get<Visit>(`/visits/${visitId}`),
  
  getByPatientId: (patientId: number) => 
    api.get<Visit[]>(`/visits/patient/${patientId}`),
  
  updateStatus: (visitId: string, status: string) => 
    api.put(`/visits/${visitId}/status/${status}`),
};

// Bill API
export const billAPI = {
  getAll: (params?: { 
    skip?: number; 
    limit?: number; 
    bill_type?: string; 
    date_from?: string; 
    date_to?: string; 
    payment_status?: string 
  }) => api.get<Bill[]>('/bills', { params }),
  
  create: (data: BillCreate) => 
    api.post<Bill>('/bills', data),
  
  getByNumber: (billNumber: string) => 
    api.get<Bill>(`/bills/${billNumber}`),
  
  getByPatientId: (patientId: number) => 
    api.get<Bill[]>(`/bills/patient/${patientId}`),
  
  addPayment: (billNumber: string, data: PaymentCreate) => 
    api.post<Payment>(`/bills/${billNumber}/payment`, data),
  
  cancel: (billNumber: string) => 
    api.put(`/bills/${billNumber}/cancel`),
};

// Reports API
export const reportAPI = {
  getDailySummary: (date?: string) => 
    api.get<DailySummary>(`/reports/daily-summary${date ? `?report_date=${date}` : ''}`),
  
  getPaymentCollection: (dateFrom?: string, dateTo?: string) => 
    api.get<PaymentCollectionReport>(`/reports/payment-collection?date_from=${dateFrom || ''}&date_to=${dateTo || ''}`),
  
  getPatientStatistics: (dateFrom?: string, dateTo?: string) => 
    api.get<PatientStatistics>(`/reports/patient-statistics?date_from=${dateFrom || ''}&date_to=${dateTo || ''}`),
  
  getDoctorPerformance: (dateFrom?: string, dateTo?: string) => 
    api.get<any>(`/reports/doctor-performance?date_from=${dateFrom || ''}&date_to=${dateTo || ''}`),
};

// Add to your existing api.ts
// Settings API
export const settingsAPI = {
  // Departments
  getDepartments: (params?: { 
    is_active?: boolean; 
    search?: string 
  }) => api.get<any[]>('/settings/departments', { params }),
  
  createDepartment: (data: any) => 
    api.post('/settings/departments', data),
  
  updateDepartment: (departmentId: number, data: any) => 
    api.put(`/settings/departments/${departmentId}`, data),
  
  deleteDepartment: (departmentId: number) => 
    api.delete(`/settings/departments/${departmentId}`),
  
  updateDepartmentStatus: (departmentId: number, isActive: boolean) => 
    api.patch(`/settings/departments/${departmentId}/status`, { is_active: isActive }),

  // Particulars
  getParticulars: (params?: { 
    department_id?: number;
    is_active?: boolean;
    search?: string;
    min_amount?: number;
    max_amount?: number;
  }) => api.get<any[]>('/settings/particulars', { params }),
  
  createParticular: (data: any) => 
    api.post('/settings/particulars', data),
  
  updateParticular: (particularId: number, data: any) => 
    api.put(`/settings/particulars/${particularId}`, data),
  
  deleteParticular: (particularId: number) => 
    api.delete(`/settings/particulars/${particularId}`),
  
  updateParticularStatus: (particularId: number, isActive: boolean) => 
    api.patch(`/settings/particulars/${particularId}/status`, { is_active: isActive }),

  // Stats
  getSettingsStats: () => 
    api.get('/settings/stats'),
};

export default api;