// User Types
export interface User {
  id: number;
  username: string;
  full_name: string;
  role: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface Token {
  access_token: string;
  token_type: string;
  user: User;
}

// Patient Types
export interface Patient {
  id: number;
  op_number: string;
  ip_number: string | null;
  registration_date: string;
  name: string;
  age: string;
  gender: string;
  complaint: string;
  house: string;
  street: string;
  place: string;
  phone: string;
  doctor_id: number;
  referred_by: string | null;
  room: string | null;
  is_ip: boolean;
  created_by: string;
  doctor_name?: string;
}

export interface PatientCreate {
  name: string;
  age: string;
  gender: 'Male' | 'Female' | 'Other';
  complaint: string;
  house: string;
  street: string;
  place: string;
  phone: string;
  doctor_id: number;
  referred_by?: string;
  room?: string;
  is_ip: boolean;
}

// Doctor Types
export interface Doctor {
  id?: number;
  code: string;
  name: string;
  address: string;
  qualification: string;
  phone: string;
  email: string;
  specialty: string;
  department: string;
  op_validity: number;
  booking_code: string;
  max_tokens: number;
  doctor_amount: number;
  hospital_amount: number;
  doctor_revisit: number;
  hospital_revisit: number;
  from_time: string;
  to_time: string;
  is_resigned: boolean;
  is_discontinued: boolean;
  resignation_date?: string;
}

export interface DoctorCreate {
  code: string;
  name: string;
  address: string;
  qualification: string;
  phone: string;
  email: string;
  specialty: string;
  department: string;
  op_validity: number;
  booking_code: string;
  max_tokens: number;
  doctor_amount: number;
  hospital_amount: number;
  doctor_revisit: number;
  hospital_revisit: number;
  from_time: string;
  to_time: string;
}

// Bill Types
export interface OPBillItem {
  particular: string;
  doctor: string;
  department: string;
  unit: number;
  rate: number;
  discount_percent: number;
  discount_amount: number;
  total: number;
}

export interface OPBillCreate {
  patient_id: number;
  bill_type: string;
  category: string;
  doctor_id: number;
  discount_type: string;
  items: Array<{
    particular: string;
    doctor: string;
    department: string;
    unit: number;
    rate: number;
    discount_percent: number;
  }>;
}

export interface OPBill {
  id: number;
  bill_number: string;
  bill_date: string;
  patient_id: number;
  patient?: Patient;
  bill_type: string;
  category: string;
  doctor_id: number;
  doctor?: Doctor;
  discount_type: string;
  total_amount: number;
  discount_amount: number;
  net_amount: number;
  created_by: string;
}

export interface IPBillItem {
  particular: string;
  department: string;
  amount: number;
  discount_percent: number;
  discount_amount: number;
  total: number;
}

export interface IPBillCreate {
  patient_id: number;
  is_credit: boolean;
  is_insurance: boolean;
  category: string;
  doctor_id: number;
  discount_type: string;
  room: string;
  admission_date: string;
  insurance_company?: string;
  third_party?: string;
  service_tax: number;
  education_cess: number;
  she_education_cess: number;
  items: Array<{
    particular: string;
    department: string;
    amount: number;
    discount_percent: number;
  }>;
}

export interface IPBill {
  id: number;
  bill_number: string;
  bill_date: string;
  patient_id: number;
  patient?: Patient;
  is_credit: boolean;
  is_insurance: boolean;
  category: string;
  doctor_id: number;
  doctor?: Doctor;
  discount_type: string;
  room: string;
  admission_date: string;
  insurance_company: string | null;
  third_party: string | null;
  total_amount: number;
  service_tax: number;
  education_cess: number;
  she_education_cess: number;
  net_amount: number;
  created_by: string;
}

// Dashboard Types
export interface DashboardStats {
  total_patients_today: number;
  total_op_bills_today: number;
  total_ip_bills_today: number;
  total_revenue_today: number;
}

// Report Types
export interface DailyOPReport {
  bills: OPBill[];
  total_amount: number;
  total_count: number;
}

export interface BillSummaryReport {
  op_bills: OPBill[];
  ip_bills: IPBill[];
  total_op_amount: number;
  total_ip_amount: number;
  total_amount: number;
}

export interface PatientListReport {
  patients: Patient[];
  total_count: number;
  ip_count: number;
  op_count: number;
}

// API Response Types
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T = any> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// Form Types
export interface OPRegistrationForm {
  name: string;
  age: string;
  gender: 'Male' | 'Female' | 'Other';
  complaint: string;
  house: string;
  street: string;
  place: string;
  phone: string;
  doctor_id: number;
  referred_by: string;
}

export interface IPRegistrationForm extends OPRegistrationForm {
  room: string;
  op_number?: string;
}

export interface OPBillForm {
  patient_id: number;
  op_number: string;
  ip_number: string;
  bill_type: 'Cash' | 'Card' | 'UPI' | 'Cheque' | 'Insurance';
  category: string;
  doctor_id: number;
  discount_type: string;
  items: OPBillItem[];
}

export interface IPBillForm {
  patient_id: number;
  ip_number: string;
  is_credit: boolean;
  is_insurance: boolean;
  category: string;
  doctor_id: number;
  discount_type: string;
  room: string;
  admission_date: string;
  insurance_company: string;
  third_party: string;
  service_tax: number;
  education_cess: number;
  she_education_cess: number;
  items: IPBillItem[];
}

// Search Types
export interface SearchParams {
  search?: string;
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  start_date?: string;
  end_date?: string;
  is_ip?: boolean;
  doctor_id?: number;
  status?: string;
}

// UI Types
export interface MenuItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
}

export interface QuickAction {
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number }>;
  color: string;
  action: () => void;
}

export interface TableColumn<T = any> {
  key: keyof T | string;
  label: string;
  render?: (value: any, item: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

// Error Types
export interface ApiError {
  detail: string;
  status_code: number;
  errors?: Record<string, string[]>;
}

export interface ValidationError {
  field: string;
  message: string;
}

// Component Props Types
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'info' | 'warning' | 'danger';
}

export interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  value?: any;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  options?: Array<{ value: any; label: string }>;
  rows?: number;
}

// Print Types
export interface PrintableBill {
  bill_number: string;
  bill_date: string;
  bill_time: string;
  patient: {
    name: string;
    age: string;
    gender: string;
    address: string;
    phone: string;
  };
  doctor?: {
    name: string;
    specialty: string;
  };
  items: Array<{
    particular: string;
    quantity: number;
    rate: number;
    amount: number;
    discount: number;
    total: number;
  }>;
  totals: {
    subtotal: number;
    discount: number;
    tax: number;
    net_amount: number;
  };
  payment_type: string;
  created_by: string;
}

// Statistics Types
export interface DailyStatistics {
  date: string;
  op_registrations: number;
  ip_registrations: number;
  op_bills: number;
  ip_bills: number;
  revenue: number;
}

export interface MonthlyStatistics {
  month: string;
  total_patients: number;
  total_bills: number;
  total_revenue: number;
  average_bill_amount: number;
}

// Filter Types
export interface DateRangeFilter {
  start_date: string;
  end_date: string;
}

export interface DoctorFilter {
  doctor_id?: number;
  department?: string;
  specialty?: string;
}

export interface BillFilter extends DateRangeFilter {
  bill_type?: string;
  category?: string;
  min_amount?: number;
  max_amount?: number;
}

// Export Types
export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf' | 'json';
  include_fields?: string[];
  date_range?: DateRangeFilter;
  filters?: Record<string, any>;
}

export interface Visit {
  id: number;
  visit_date: string;
  patient_id: number;
  doctor_id: number;
  diagnosis: string;
  prescription: string;
  notes: string;
  created_by: string;
  patient?: Patient;
  doctor?: Doctor;
}

export interface VisitCreate {
  patient_id: number;
  doctor_id: number;
  diagnosis: string;
  prescription: string;
  notes: string;
}

// Rename OPBill/Bill types to match your import:
export type Bill = OPBill;
export type BillCreate = OPBillCreate;

export interface Payment {
  id: number;
  payment_date: string;
  bill_id: number;
  amount: number;
  payment_method: string;
  reference_number: string;
  notes: string;
  created_by: string;
  bill?: OPBill;
}

export interface PaymentCreate {
  bill_id: number;
  amount: number;
  payment_method: string;
  reference_number: string;
  notes: string;
}

export interface PatientSearchResult {
  patients: Patient[];
  total: number;
  page: number;
  page_size: number;
}

export interface DailySummary {
  date: string;
  total_patients: number;
  total_visits: number;
  total_bills: number;
  total_revenue: number;
  total_payments: number;
}

export interface PaymentCollectionReport {
  date: string;
  cash: number;
  card: number;
  upi: number;
  insurance: number;
  total: number;
}

export interface PatientStatistics {
  total_patients: number;
  op_patients: number;
  ip_patients: number;
  new_patients_today: number;
  average_visits_per_patient: number;
}