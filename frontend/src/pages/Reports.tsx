import { useState, useEffect } from 'react'
import axios from 'axios'
import { Download, Filter, Calendar, Printer, FileText, BarChart3, Users, CreditCard, TrendingUp, Building, ArrowUpRight, TestTube } from 'lucide-react'
import toast from 'react-hot-toast'
import { format, isValid, parseISO } from 'date-fns'
import { appConfig } from '../config/appConfig';

interface Particular {
  id: number;
  name: string;
  created_at: string;
}

interface ReportData {
  total_amount?: number;
  total_op_amount?: number;
  total_ip_amount?: number;
  total_count?: number;
  particular_name?: string;
  op_details?: Array<{
    bill_number: string;
    patient_name: string;
    patient_age: string;
    patient_gender: string;
    bill_date: string;
    particular: string;
    department: string;
    quantity: number;
    rate: number;
    total_amount: number;
  }>;
  ip_details?: Array<{
    bill_number: string;
    patient_name: string;
    patient_age: string;
    patient_gender: string;
    bill_date: string;
    particular: string;
    department: string;
    quantity: number;
    rate: number;
    total_amount: number;
  }>;
  summary_by_date?: Array<{
    date: string;
    op_count: number;
    ip_count: number;
    total_amount: number;
  }>;
  grouped_by_patient?: Array<any>;
  op_bills?: Array<any>;
  ip_bills?: Array<any>;
}

const Reports = () => {
  const [activeReport, setActiveReport] = useState('daily-op')
  const [isLoading, setIsLoading] = useState(false)
  const [reportData, setReportData] = useState<ReportData | any[] | null>(null)

  // Common filters
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [doctorId] = useState('')

  // Particulars report filters
  const [particularName, setParticularName] = useState('')
  const [particularId, setParticularId] = useState<number>(0)
  const [includeOp, setIncludeOp] = useState(true)
  const [includeIp, setIncludeIp] = useState(true)
  const [groupByPatient, setGroupByPatient] = useState(false)

  const [particulars, setParticulars] = useState<Particular[]>([])
  const [particularsLoaded, setParticularsLoaded] = useState(false)

  const reportTypes = [
    {
      id: 'daily-op',
      label: 'Daily OP Report',
      icon: FileText,
      color: 'from-blue-500 to-cyan-500',
      description: 'Daily outpatient billing summary'
    },
    {
      id: 'bill-summary',
      label: 'Revenue Report',
      icon: BarChart3,
      color: 'from-green-500 to-emerald-500',
      description: 'Complete billing revenue overview'
    },
    {
      id: 'patient-list',
      label: 'Patient List',
      icon: Users,
      color: 'from-purple-500 to-indigo-500',
      description: 'Registered patient records'
    },
    {
      id: 'particulars-report',
      label: 'Particulars Report',
      icon: TestTube,
      color: 'from-teal-500 to-cyan-500',
      description: 'Report by medical particulars (X-RAY, ECG, etc.)'
    }
  ]

  // Safe date formatting function
  const formatSafeDate = (dateString: string | null | undefined, formatStr: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) return 'N/A';
      return format(date, formatStr);
    } catch {
      return 'N/A';
    }
  };

  const fetchParticulars = async () => {
    try {
      const response = await axios.get('/settings/particulars', {
        params: { active_only: false }
      })
      const fetchedParticulars = response.data;
      setParticulars(fetchedParticulars);
      setParticularsLoaded(true);

      // Always set default particular if none is selected
      if (fetchedParticulars.length > 0) {
        setParticularName(fetchedParticulars[0].name);
        setParticularId(fetchedParticulars[0].id);
      }
    } catch (error) {
      console.error('Error fetching particulars:', error);
      toast.error('Failed to load particulars');
      setParticularsLoaded(true); // Still set loaded to true even if error
    }
  }

  const fetchReport = async () => {
    setIsLoading(true)
    setReportData(null) // Clear previous data before fetching new
    
    try {
      let endpoint = '';
      let params: any = {};

      switch (activeReport) {
        case 'daily-op':
          endpoint = '/reports/daily-op';
          params = { report_date: startDate };
          break;

        case 'bill-summary':
          endpoint = '/reports/bill-summary';
          params = { start_date: startDate, end_date: endDate };
          break;

        case 'patient-list':
          endpoint = '/reports/patient-list';
          params = { start_date: startDate, end_date: endDate };
          break;

        case 'particulars-report':
          endpoint = '/reports/particulars-report';
          params = {
            particular_id: particularId,
            start_date: startDate,
            end_date: endDate,
            include_op: includeOp,
            include_ip: includeIp,
            group_by_patient: groupByPatient
          };
          
          // Don't fetch if no particular is selected
          if (particularId === 0) {
            toast.error('Please select a particular first');
            setIsLoading(false);
            return;
          }
          break;

        default:
          endpoint = '/reports/daily-op';
      }

      console.log(`Fetching ${endpoint} with params1:`, params); // Debug log
      
      const response = await axios.get(endpoint, { params });
      console.log('API Response:', response.data); // Debug log
      
      setReportData(response.data);
      
      // Show success toast only if we have data
      if (response.data && (
        (Array.isArray(response.data) && response.data.length > 0) ||
        (!Array.isArray(response.data) && Object.keys(response.data).length > 0)
      )) {
        toast.success('Report loaded successfully');
      }
    } catch (error: any) {
      console.error('Failed to fetch report:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch report');
      setReportData(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchParticulars();
  }, []);

  useEffect(() => {
    // Only fetch report if particulars are loaded (for particulars-report)
    // or immediately for other reports
    if (activeReport === 'particulars-report' && !particularsLoaded) {
      return; // Wait for particulars to load
    }
    
    // For particulars report, only fetch if we have a valid particularId
    if (activeReport === 'particulars-report' && particularId === 0) {
      return;
    }
    
    fetchReport();
  }, [activeReport, startDate, endDate, doctorId, particularId, includeOp, includeIp, groupByPatient, particularsLoaded]);

  const getTotalRevenue = () => {
    if (!reportData) return 0

    if (activeReport === 'daily-op') {
      return Array.isArray(reportData)
        ? reportData.reduce((sum: number, bill: any) => sum + (parseFloat(bill.net_amount) || 0), 0)
        : 0
    } else if (activeReport === 'bill-summary') {
      const data = reportData as ReportData;
      return parseFloat(data.total_amount?.toString() || '0')
    } else if (activeReport === 'particulars-report') {
      const data = reportData as ReportData;
      // Calculate from details if total_amount is 0
      if (parseFloat(data.total_amount?.toString() || '0') > 0) {
        return parseFloat(data.total_amount?.toString() || '0')
      }
      // Fallback: calculate from details
      const opTotal = (data.op_details || []).reduce((sum, item) => sum + (parseFloat(item.total_amount?.toString()) || 0), 0);
      const ipTotal = (data.ip_details || []).reduce((sum, item) => sum + (parseFloat(item.total_amount?.toString()) || 0), 0);
      return opTotal + ipTotal;
    }
    return 0
  }

  const getRecordCount = () => {
    if (!reportData) return 0

    if (activeReport === 'patient-list') {
      if (Array.isArray(reportData)) {
        return reportData.length;
      }
    } else if (activeReport === 'daily-op') {
      if (Array.isArray(reportData)) {
        return reportData.length;
      }
    } else if (activeReport === 'bill-summary') {
      const data = reportData as ReportData;
      return (data.op_bills?.length || 0) + (data.ip_bills?.length || 0)
    } else if (activeReport === 'particulars-report') {
      const data = reportData as ReportData;
      return (data.op_details?.length || 0) + (data.ip_details?.length || 0)
    }
    return 0
  }

  const handlePrint = () => {
    let title
    let totalBills = getRecordCount()
    let totalRevenue = getTotalRevenue().toFixed(2)
    switch (activeReport) {
      case 'daily-op':
        title = 'OP Report'
        break

      case 'bill-summary':
        title = 'IP/OP Bill Summary Report'
        break

      case 'patient-list':
        title = 'Patient List'
        break

      case 'particulars-report':
        title = (reportData as ReportData)?.particular_name || particularName || 'Particulars Summary Report'
        break

      default:
        title = ''
    }

    // Create complete HTML document for printing
    let printHTML = `
<!DOCTYPE html>
<html>
  <head>
    <title>Daily OP Report - ${startDate + '-' + endDate || 'Report'}</title>
    <meta charset="UTF-8">
    <style>
      @media print {
        body { 
          margin: 0; 
          padding: 0;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        @page { 
          margin: 15mm;
          margin-top: 0;
          margin-bottom: 0;
          size: auto;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .no-print { display: none !important; }
        .print-break { page-break-inside: avoid; }
      }
      
      @media screen {
        body { 
          background-color: #f3f4f6;
          padding: 20px;
        }
        .print-container {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          background-color: white;
          border-radius: 8px;
          text-align: center;
          justify-items: center;
          width:50%
        }
      }
      
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        color: #374151;
        line-height: 1.4;
      }
      
      .report-header {
        text-align: center;
        margin-top: 50px;
        margin-bottom: 30px;
        padding-bottom: 20px;
        border-bottom: 2px solid #e5e7eb;
      }
      
      .report-header h1 {
        font-size: 28px;
        font-weight: bold;
        color: #111827;
        margin: 0 0 8px 0;
      }
      
      .report-header .subtitle {
        font-size: 16px;
        color: #6b7280;
      }
      
      .report-period {
        font-size: 18px;
        font-weight: 600;
        color: #374151;
        margin: 15px 0;
      }
      
      .op-summary-stats {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 20px;
        margin-bottom: 30px;
      }
      
      .revenue-report-stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 20px;
        margin-bottom: 30px;
      }
      
      .stat-card {
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 20px;
        text-align: center;
      }
      
      .stat-card.blue {
        background-color: #f0f9ff;
        border-color: #bae6fd;
      }
      
      .stat-card.green {
        background-color: #f0fdf4;
        border-color: #bbf7d0;
      }
      
      .stat-card.yellow {
        background-color: #fefce8;
        border-color: #fef08a;
      }
      
      .stat-card.purple {
        background-color: #faf5ff;
        border-color: #e9d5ff;
      }
      
      .stat-label {
        font-size: 14px;
        color: #6b7280;
        margin-bottom: 8px;
      }
      
      .stat-value {
        font-size: 24px;
        font-weight: bold;
        color: #111827;
      }
      
      .data-table {
        width: 100%;
        border-collapse: collapse;
        margin: 25px 0;
        font-size: 14px;
      }
      
      .data-table th {
        background-color: #f9fafb;
        padding: 12px;
        text-align: left;
        color: #4b5563;
        font-weight: 600;
        border-bottom: 2px solid #e5e7eb;
        border-top: 1px solid #e5e7eb;
      }
      
      .data-table td {
        padding: 12px;
        border-bottom: 1px solid #e5e7eb;
      }
      
      .data-table tbody tr:last-child td {
        border-bottom: none;
      }
      
      .amount-column {
        text-align: right;
      }
      
      .bill-type {
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;
      }
      
      .bill-type.cash {
        background-color: #d1fae5;
        color: #065f46;
      }
      
      .bill-type.insurance {
        background-color: #ede9fe;
        color: #5b21b6;
      }
      
      .report-footer {
        margin-top: 40px;
        padding-top: 20px;
        border-top: 2px solid #e5e7eb;
        font-size: 14px;
        color: #6b7280;
      }
      
      .footer-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 20px;
      }
      
      .footer-item {
        display: flex;
        flex-direction: column;
      }
      
      .footer-label {
        color: #4b5563;
        font-size: 13px;
        margin-bottom: 4px;
      }
      
      .footer-value {
        font-weight: 600;
        font-size: 16px;
      }
      
      .total-revenue {
        font-weight: bold;
        color: #059669;
        font-size: 20px;
      }
      
      .generated-info {
        margin-top: 20px;
        padding-top: 10px;
        border-top: 1px solid #e5e7eb;
        font-size: 12px;
        text-align: center;
      }
      
      .section-title {
        font-size: 18px;
        font-weight: bold;
        color: #374151;
        margin-bottom: 15px;
        padding-bottom: 8px;
        border-bottom: 1px solid #e5e7eb;
      }
      
      .filter-info {
        background-color: #f9fafb;
        border-radius: 6px;
        padding: 15px;
        margin-bottom: 20px;
        font-size: 14px;
      }
        
      .filter-grid {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
      }

      .filter-item {
        display: flex;
        gap: 6px;
        white-space: nowrap;
      }
      
      .filter-label {
        color: #4b5563;
        font-size: 13px;
        margin-bottom: 2px;
      }
      
      .filter-value {
        font-weight: 500;
      }

      .space-y-6 > * + * {
        margin-top: 24px;
      }

      .flex {
        display: flex;
      }

      .items-center {
        align-items: center;
      }

      .justify-between {
        justify-content: space-between;
      }

      .mt-2 {
        margin-top: 8px;
      }

      .ml-2 {
        margin-left: 8px;
      }

      .space-x-4 > * + * {
        margin-left: 16px;
      }

      .text-sm {
        font-size: 14px;
      }

      .text-gray-600 {
        color: #6b7280;
      }

      .font-semibold {
        font-weight: 600;
      }

      .text-blue-700 {
        color: #1d4ed8;
      }

      .text-purple-700 {
        color: #7c3aed;
      }

      .p-4 {
        padding: 16px;
      }

      .bg-purple-100 {
        background-color: #f3e8ff;
        border-color: #e9d5ff;
      }

      .rounded-xl {
        border-radius: 12px;
      }

      .overflow-x-auto {
        overflow-x: auto;
      }

      .border-gray-200 {
        border-color: #e5e7eb;
      }

      .font-medium {
        font-weight: 500;
      }

      .max-w-xs {
        max-width: 320px;
      }

      .truncate {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .bg-gray-50 {
        background-color: #f9fafb;
      }
    </style>
  </head>
  <body>
    <div class="print-container">
      <!-- Report Header -->
      <div class="report-header">
        <h1>${appConfig.hospitalName}</h1>
        <div class="subtitle">${appConfig.address}</div>
        <div class="subtitle">Phone: ${appConfig.phone}</div>
        <h2>${title}</h2>
        <div class="report-period">
          Generated for period: ${startDate ? new Date(startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'} - ${endDate ? new Date(endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
        </div>
      </div>
      
      <!-- Filter Information -->
      <div class="filter-info">
        <div class="filter-grid">
          <div class="filter-item">
            <span class="filter-label">Start Date:</span>
            <span class="filter-value">${startDate || 'N/A'}</span>
          </div>
          <div class="filter-item">
            <span class="filter-label">End Date:</span>
            <span class="filter-value">${endDate || 'N/A'}</span>
          </div>
          <div class="filter-item">
            <span class="filter-label">Report Type:</span>
            <span class="filter-value">${title}</span>
          </div>          
        </div>
      </div>`;

    if (activeReport === 'daily-op' && Array.isArray(reportData)) {
      printHTML += `
            <!-- OP Summary Statistics -->
                <div class="section-title">Summary Overview</div>
                <div class="op-summary-stats">
                  <div class="stat-card blue">
                    <div class="stat-label">Total Bills</div>
                    <div class="stat-value">${totalBills || 0}</div>
                  </div>
                  <div class="stat-card green">
                    <div class="stat-label">Total Revenue</div>
                    <div class="stat-value">₹${totalRevenue}</div>
                  </div>
                </div>
                <div class="overflow-x-auto rounded-xl border border-gray-200">
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th>Bill No</th>
                        <th>Patient</th>
                        <th>Doctor</th>
                        <th>Bill Type</th>
                        <th>Total</th>
                        <th>Discount</th>
                        <th>Net Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${reportData.map((bill: any) => `
                        <tr>
                          <td><div class="font-medium">${bill.bill_number || 'N/A'}</div></td>
                          <td><div class="font-medium">${bill.patient?.name || 'N/A'}</div></td>
                          <td><div class="font-medium">${bill.doctor?.name || 'N/A'}</div></td>
                          <td><span class="bill-type ${bill.bill_type === 'Cash' ? 'cash' : 'insurance'}">${bill.bill_type || 'N/A'}</span></td>
                          <td>₹${parseFloat(bill.total_amount || 0).toFixed(2)}</td>
                          <td>₹${parseFloat(bill.discount_amount || 0).toFixed(2)}</td>
                          <td>₹${parseFloat(bill.net_amount || 0).toFixed(2)}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>`;
    }
    else if (activeReport === 'bill-summary') {
      const data = reportData as ReportData;
      printHTML += `
            <!-- OP Summary Statistics -->
                <div class="section-title">Summary Overview</div>
                <div class="revenue-report-stats">
                  <div class="stat-card blue">
                    <div class="stat-label">Total OP Revenue</div>
                    <div class="stat-value">₹${parseFloat(data.total_op_amount?.toString() || '0').toFixed(2)}</div>
                  </div>
                  <div class="stat-card purple">
                    <div class="stat-label">Total IP Revenue</div>
                    <div class="stat-value">₹${parseFloat(data.total_ip_amount?.toString() || '0').toFixed(2)}</div>
                  </div>
                  <div class="stat-card green">
                    <div class="stat-label">Total Revenue</div>
                    <div class="stat-value">₹${parseFloat(data.total_amount?.toString() || '0').toFixed(2)}</div>
                  </div>
                </div>`;
    }
    else if (activeReport === 'patient-list' && Array.isArray(reportData)) {
      // Process patient list data - check if it's bill data or patient data
      const patientsList = reportData[0]?.patient
        ? reportData.map((bill: any) => ({
          ...bill.patient,
          type: bill.patient?.is_ip ? 'INPATIENT' : 'OUTPATIENT',
          registration_date: bill.patient?.registration_date,
          address: [bill.patient?.house, bill.patient?.street, bill.patient?.place].filter(Boolean).join(', ')
        }))
        : reportData.map((patient: any) => ({
          ...patient,
          type: patient.is_ip ? 'INPATIENT' : 'OUTPATIENT',
          registration_date: patient.registration_date,
          address: [patient.house, patient.street, patient.place].filter(Boolean).join(', ')
        }));

      const opPatients = patientsList.filter((p: any) => !p.is_ip).length;
      const ipPatients = patientsList.filter((p: any) => p.is_ip).length;

      printHTML += `
    <div class="space-y-6">
      <!-- Summary Card -->
      <div class="stat-card purple">
        <div class="flex items-center justify-between">
          <div>
            <p class="stat-label">Total Patients</p>
            <p class="stat-value">${patientsList.length || 0}</p>
            <div class="flex space-x-4 mt-2">
              <div>
                <span class="text-sm text-gray-600">OP Patients:</span>
                <span class="ml-2 font-semibold text-blue-700">${opPatients}</span>
              </div>
              <div>
                <span class="text-sm text-gray-600">IP Patients:</span>
                <span class="ml-2 font-semibold text-purple-700">${ipPatients}</span>
              </div>
            </div>
          </div>
          <div class="p-4 bg-purple-100 rounded-xl">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-users text-purple-600" aria-hidden="true">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
              <path d="M16 3.128a4 4 0 0 1 0 7.744"></path>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
              <circle cx="9" cy="7" r="4"></circle>
            </svg>
          </div>
        </div>
      </div>

      <!-- Patients Table -->
      <div class="overflow-x-auto rounded-xl border border-gray-200">
        <table class="data-table">
          <thead>
            <tr>
              <th>Patient ID</th>
              <th>Name</th>
              <th>Age/Gender</th>
              <th>Contact</th>
              <th>Address</th>
              <th>Registered On</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            ${patientsList.map((patient: any) => `
              <tr class="${patient.is_ip ? 'bg-gray-50' : ''}">
                <td><div class="font-medium">${patient.is_ip ? (patient.ip_number || patient.id) : (patient.op_number || patient.id)}</div></td>
                <td><div class="font-medium">${patient.name || 'N/A'}</div></td>
                <td>
                  <div>${patient.age || 'N/A'}</div>
                  <div class="text-sm text-gray-600">${patient.gender || 'N/A'}</div>
                </td>
                <td><div>${patient.phone || 'N/A'}</div></td>
                <td><div class="max-w-xs truncate">${patient.address || 'N/A'}</div></td>
                <td>
                  <div>${patient.registration_date ? new Date(patient.registration_date).toLocaleDateString('en-IN') : 'N/A'}</div>
                  <div class="text-sm text-gray-600">${patient.registration_date ? new Date(patient.registration_date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</div>
                </td>
                <td>
                  <span class="bill-type ${patient.is_ip ? 'insurance' : 'cash'}">
                    ${patient.is_ip ? 'INPATIENT' : 'OUTPATIENT'}
                  </span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
    }
    else if (activeReport === 'particulars-report') {
      const data = reportData as ReportData;
      printHTML += `
      <div class="section-title">Particulars Report - ${data.particular_name || particularName}</div>
      <div class="op-summary-stats">
        <div class="stat-card blue">
          <div class="stat-label">Total Count</div>
          <div class="stat-value">${data.total_count || 0}</div>
        </div>
        <div class="stat-card green">
          <div class="stat-label">Total Revenue</div>
          <div class="stat-value">₹${parseFloat(data.total_amount?.toString() || '0').toFixed(2)}</div>
        </div>
      </div>`;
    }

    printHTML += `<div class="generated-info">
          Report generated on ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} at ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  </body>
</html>`;

    // Create a hidden iframe for printing
    const iframe = document.createElement('iframe');
    iframe.name = 'print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    iframe.style.visibility = 'hidden';

    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;

    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(printHTML);
      iframeDoc.close();

      // Wait for content to load
      iframe.onload = () => {
        // Focus the iframe for better print dialog behavior
        iframe.contentWindow?.focus();

        // Auto-print (optional - you can remove this if you want manual print button)
        setTimeout(() => {
          iframe.contentWindow?.print();
        }, 1000);
      };
    } else {
      console.error('Could not access iframe document');
      alert('Could not prepare print document. Please try again.');
    }
  };

  const handleExport = () => {
    if (!reportData) return

    const dataStr = JSON.stringify(reportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${activeReport}-${format(new Date(), 'yyyy-MM-dd')}.json`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Report exported successfully')
  }

  const renderParticularsReport = () => {
    if (!reportData) return null

    const data = reportData as ReportData;
    // Use the selected particular name from state
    const displayParticularName = data.particular_name || particularName;

    // Calculate total count correctly
    const totalCount = (data.op_details?.length || 0) + (data.ip_details?.length || 0);
    
    // Calculate total revenue from all details     yyyyyyyyyyyyy
    const totalRevenue = getTotalRevenue();
    // [
    //   ...(data.op_details || []),
    //   ...(data.ip_details || [])
    // ].reduce((sum, item) => sum + (parseFloat(item.total_amount?.toString()) || 0), 0);

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-6 border border-teal-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Particular</p>
                <p className="text-xl font-bold text-gray-900 truncate">{displayParticularName}</p>
              </div>
              <div className="p-3 bg-teal-100 rounded-lg">
                <TestTube className="text-teal-600" size={24} />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Count</p>
                <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <BarChart3 className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">OP Count</p>
                <p className="text-2xl font-bold text-gray-900">{data.op_details?.length || 0}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <FileText className="text-green-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">IP Count</p>
                <p className="text-2xl font-bold text-gray-900">{data.ip_details?.length || 0}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Building className="text-purple-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Total Revenue Card */}
        <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl p-6 border border-green-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Total Revenue from {data.particular_name || particularName}</p>
              <p className="text-3xl font-bold text-green-800">
                ₹{totalRevenue.toFixed(2)}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Period: {format(new Date(startDate), 'dd/MM/yyyy')} - {format(new Date(endDate), 'dd/MM/yyyy')}
              </p>
            </div>
            <div className="p-4 bg-green-200 rounded-xl">
              <CreditCard className="text-green-700" size={32} />
            </div>
          </div>
        </div>

        {/* Summary by Date */}
        {data.summary_by_date && data.summary_by_date.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <Calendar className="mr-2 text-blue-600" size={20} />
              Summary by Date
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">OP Count</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">IP Count</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.summary_by_date.map((item: any, index: number) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">
                        {item.date ? formatSafeDate(item.date, 'dd/MM/yyyy') : 'N/A'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          {item.op_count || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                          {item.ip_count || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-bold text-green-700">
                        ₹{parseFloat(item.total_amount?.toString() || '0').toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Detailed Data Table */}
        {((data.op_details && data.op_details.length > 0) || (data.ip_details && data.ip_details.length > 0)) && (
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <div className="bg-gradient-to-r from-teal-50 to-teal-100 p-4 border-b border-teal-200">
              <h3 className="text-lg font-bold text-gray-900">
                Detailed Records ({totalCount})
              </h3>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Bill No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Patient</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Particular</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Qty</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.op_details?.map((item: any, index: number) => (
                  <tr key={`op-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-blue-50'}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{item.bill_number}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">OP</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{item.patient_name}</div>
                      <div className="text-sm text-gray-600">{item.patient_age} • {item.patient_gender}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatSafeDate(item.bill_date, 'dd/MM/yyyy')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {particulars.filter(par => par.id === Number(item.particular))[0]?.name}
                      </div>
                      <div className="text-sm text-gray-600">{item.department}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap">₹{parseFloat(item.rate?.toString() || '0').toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-green-700">₹{parseFloat(item.total?.toString() || '0').toFixed(2)}</td>
                  </tr>
                ))}

                {data.ip_details?.map((item: any, index: number) => (
                  <tr key={`ip-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-purple-50'}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{item.bill_number}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">IP</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{item.patient_name}</div>
                      <div className="text-sm text-gray-600">{item.patient_age} • {item.patient_gender}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatSafeDate(item.bill_date, 'dd/MM/yyyy')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {particulars.filter(par => par.id === item.particular)[0]?.name}
                      </div>
                      <div className="text-sm text-gray-600">{item.department}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap">₹{parseFloat(item.rate?.toString() || '0').toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-green-700">₹{parseFloat(item.total?.toString() || '0').toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )
  }

  const renderReportContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-96">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading report data...</p>
        </div>
      )
    }

    if (!reportData) {
      return (
        <div className="text-center py-16 bg-gradient-to-b from-gray-50 to-white rounded-xl">
          <FileText className="w-20 h-20 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Data Available</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            {getRecordCount() === 0 ?
              'No records found for the selected filters. Try adjusting your date range or criteria.' :
              'Select a report type and apply filters to view data.'
            }
          </p>
        </div>
      )
    }

    switch (activeReport) {
      case 'daily-op':
        // Check if reportData is in the correct format for daily-op
        if (!Array.isArray(reportData) || (reportData.length > 0 && !reportData[0]?.bill_number)) {
          return (
            <div className="text-center py-16 bg-gradient-to-b from-gray-50 to-white rounded-xl">
              <FileText className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Invalid Data Format</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Daily OP report data is not in the expected format. Please try refreshing.
              </p>
            </div>
          );
        }

        return (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Bills</p>
                    <p className="text-2xl font-bold text-gray-900">{getRecordCount()}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <FileText className="text-blue-600" size={24} />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <ArrowUpRight className="text-green-500 mr-1" size={16} />
                  <span className="text-green-600">Daily report</span>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">₹{getTotalRevenue().toFixed(2)}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <CreditCard className="text-green-600" size={24} />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <TrendingUp className="text-green-500 mr-1" size={16} />
                  <span className="text-green-600">Today's collection</span>
                </div>
              </div>

              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl p-6 border border-yellow-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Cash Bills</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {Array.isArray(reportData) ? reportData.filter((b: any) => b.bill_type === 'Cash').length : 0}
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <CreditCard className="text-yellow-600" size={24} />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Insurance Bills</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {Array.isArray(reportData) ? reportData.filter((b: any) => b.bill_type === 'Insurance').length : 0}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Building className="text-purple-600" size={24} />
                  </div>
                </div>
              </div>
            </div>

            {/* Data Table */}
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Bill No
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Doctor
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Bill Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Discount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Net Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Array.isArray(reportData) && reportData.map((bill: any, index: number) => (
                    <tr key={bill.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{bill.bill_number}</div>
                        <div className="text-sm text-gray-600">{formatSafeDate(bill.bill_date, 'HH:mm')}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{bill.patient?.name || 'N/A'}</div>
                        <div className="text-sm text-gray-600">{bill.patient?.phone || ''}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{bill.doctor?.name || 'N/A'}</div>
                        <div className="text-sm text-gray-600">{bill.doctor?.specialty || ''}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${bill.bill_type === 'Cash' ? 'bg-green-100 text-green-800' :
                          bill.bill_type === 'Insurance' ? 'bg-blue-100 text-blue-800' :
                            bill.bill_type === 'Card' ? 'bg-purple-100 text-purple-800' :
                              'bg-gray-100 text-gray-800'
                          }`}>
                          {bill.bill_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">₹{parseFloat(bill.total_amount || 0).toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-red-600 font-medium">
                        ₹{parseFloat(bill.discount_amount || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-green-700">₹{parseFloat(bill.net_amount || 0).toFixed(2)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )

      case 'bill-summary':
        const summaryData = reportData as ReportData;
        return (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">OP Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">₹{parseFloat(summaryData.total_op_amount?.toString() || '0').toFixed(2)}</p>
                    <p className="text-sm text-gray-600 mt-1">{summaryData.op_bills?.length || 0} bills</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <FileText className="text-blue-600" size={24} />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">IP Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">₹{parseFloat(summaryData.total_ip_amount?.toString() || '0').toFixed(2)}</p>
                    <p className="text-sm text-gray-600 mt-1">{summaryData.ip_bills?.length || 0} bills</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Building className="text-purple-600" size={24} />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Revenue</p>
                    <p className="text-3xl font-bold text-green-700">₹{parseFloat(summaryData.total_amount?.toString() || '0').toFixed(2)}</p>
                    <p className="text-sm text-green-600 mt-1">Combined total</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <TrendingUp className="text-green-600" size={24} />
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Table */}
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Bill No
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Net Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {[
                    ...(summaryData.op_bills || []),
                    ...(summaryData.ip_bills || [])
                  ].map((bill: any, index: number) => (
                    <tr key={bill.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{bill.bill_number}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full flex items-center w-16 justify-center ${bill.bill_number?.startsWith('OP')
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                          }`}>
                          {bill.bill_number?.startsWith('OP') ? 'OP' : 'IP'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{bill.patient?.name || 'N/A'}</div>
                        <div className="text-sm text-gray-600">{bill.patient?.phone || ''}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-900">{formatSafeDate(bill.bill_date, 'dd/MM/yyyy')}</div>
                        <div className="text-sm text-gray-600">{formatSafeDate(bill.bill_date, 'HH:mm')}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-green-700">₹{parseFloat(bill.net_amount || 0).toFixed(2)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )

      case 'patient-list':
        // Check if reportData has the correct structure for patient list
        if (!Array.isArray(reportData)) {
          return (
            <div className="text-center py-16 bg-gradient-to-b from-gray-50 to-white rounded-xl">
              <Users className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Invalid Data Format</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Patient list data is not in the expected format. Please try refreshing.
              </p>
            </div>
          );
        }

        // Process the data based on its structure
        const patientsList = reportData[0]?.patient
          ? reportData.map((bill: any) => ({
            ...bill.patient,
            doctor_name: bill.doctor?.name,
            bill_date: bill.bill_date,
            bill_number: bill.bill_number,
            bill_type: bill.bill_type
          }))
          : reportData;

        return (
          <div className="space-y-6">
            {/* Summary Card */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Patients</p>
                  <p className="text-3xl font-bold text-gray-900">{patientsList.length}</p>
                  <div className="flex space-x-4 mt-2">
                    <div>
                      <span className="text-sm text-gray-600">OP Patients:</span>
                      <span className="ml-2 font-semibold text-blue-700">
                        {patientsList.filter((p: any) => !p.is_ip).length}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">IP Patients:</span>
                      <span className="ml-2 font-semibold text-purple-700">
                        {patientsList.filter((p: any) => p.is_ip).length}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-purple-100 rounded-xl">
                  <Users className="text-purple-600" size={32} />
                </div>
              </div>
            </div>

            {/* Data Table */}
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Patient ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Age/Gender
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Address
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Registered On
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Type
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {patientsList.map((patient: any, index: number) => (
                    <tr key={patient.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          {patient.is_ip ? patient.ip_number : patient.op_number}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{patient.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-900">{patient.age}</div>
                        <div className="text-sm text-gray-600">{patient.gender}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-900">{patient.phone}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-900 max-w-xs truncate">
                          {[patient.house, patient.street, patient.place].filter(Boolean).join(', ')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-900">{formatSafeDate(patient.registration_date, 'dd/MM/yyyy')}</div>
                        <div className="text-sm text-gray-600">{formatSafeDate(patient.registration_date, 'HH:mm')}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${patient.is_ip
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                          }`}>
                          {patient.is_ip ? 'INPATIENT' : 'OUTPATIENT'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )

      case 'particulars-report':
        return renderParticularsReport()

      default:
        return null
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center">
              <BarChart3 className="mr-3" size={32} />
              Analytics & Reports
            </h1>
            <p className="text-blue-100 mt-2 text-lg">Comprehensive hospital analytics and reporting</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-blue-100 text-sm">Last Updated</p>
              <p className="text-white font-medium">{format(new Date(), 'dd/MM/yyyy hh:mm a')}</p>
            </div>
          </div>
        </div>

        {/* Report Type Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {reportTypes.map((report) => {
            const Icon = report.icon
            const isActive = activeReport === report.id

            return (
              <button
                key={report.id}
                onClick={() => {
                  setActiveReport(report.id);
                  // Reset particulars filters when switching to particulars report
                  if (report.id === 'particulars-report' && particulars.length > 0 && particularId === 0) {
                    setParticularName(particulars[0].name);
                    setParticularId(particulars[0].id);
                  }
                }}
                className={`rounded-2xl p-5 text-left transition-all transform hover:-translate-y-1 ${isActive
                  ? `${report.color} text-white shadow-xl`
                  : 'bg-white/10 backdrop-blur-sm text-white/90 hover:bg-white/20'
                  }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl ${isActive ? 'bg-white/20' : 'bg-white/10'}`}>
                    <Icon size={24} />
                  </div>
                  {isActive && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </div>
                <h3 className="text-lg font-bold mb-1">{report.label}</h3>
                <p className="text-sm opacity-90">{report.description}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <Filter className="mr-3 text-blue-600" size={24} />
            Report Filters & Controls
          </h2>
        </div>

        <div className="p-6 space-y-8">
          {/* Filters Section */}
          {activeReport !== 'daily-op' && (
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
              <div className="flex items-center mb-6">
                <div className="p-3 bg-blue-100 rounded-lg mr-4">
                  <Filter className="text-blue-600" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Filter Report Data</h3>
                  <p className="text-gray-600">Customize date range and parameters</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-900">
                    Start Date *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-900">
                    End Date *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Particulars Report Filters */}
              {activeReport === 'particulars-report' && (
                <div className="mt-6 space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-900">
                      Particular Name *
                    </label>
                    <div className="relative">
                      <select
                        value={particularId}
                        onChange={(e) => {
                          const selectedId = parseInt(e.target.value);
                          const selectedParticular = particulars.find(p => p.id === selectedId);
                          setParticularId(selectedId);
                          if (selectedParticular) {
                            setParticularName(selectedParticular.name);
                          }
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none bg-white"
                      >
                        {particulars.map((particular) => (
                          <option key={particular.id} value={particular.id}>
                            {particular.name}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      Select from: X-RAY, ECG, BLOOD TEST, USG, CT SCAN, MRI, etc.
                    </p>
                  </div>

                  {/* Checkboxes */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <label className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <input
                        type="checkbox"
                        checked={includeOp}
                        onChange={(e) => setIncludeOp(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-900">Include OP Bills</span>
                    </label>

                    <label className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <input
                        type="checkbox"
                        checked={includeIp}
                        onChange={(e) => setIncludeIp(e.target.checked)}
                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                      />
                      <span className="text-sm font-medium text-gray-900">Include IP Bills</span>
                    </label>

                    <label className="flex items-center space-x-3 p-3 bg-teal-50 rounded-lg border border-teal-200">
                      <input
                        type="checkbox"
                        checked={groupByPatient}
                        onChange={(e) => setGroupByPatient(e.target.checked)}
                        className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                      />
                      <span className="text-sm font-medium text-gray-900">Group by Patient</span>
                    </label>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={fetchReport}
                  disabled={isLoading || (activeReport === 'particulars-report' && particularId === 0)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md flex items-center"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Loading...
                    </>
                  ) : (
                    <>
                      <Filter size={20} className="mr-2" />
                      Apply Filters
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Report Header */}
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {reportTypes.find(r => r.id === activeReport)?.label}
              </h3>
              {activeReport === 'daily-op' && (
                <p className="text-gray-600">
                  Generated for the day: {format(new Date(), 'dd MMM yyyy')}
                </p>
              )}
              {activeReport !== 'daily-op' && (
                <p className="text-gray-600">
                  Generated for period: {format(new Date(startDate), 'dd MMM yyyy')} - {format(new Date(endDate), 'dd MMM yyyy')}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleExport}
                disabled={!reportData || isLoading}
                className="px-5 py-2.5 border border-green-300 text-green-700 font-medium rounded-xl hover:bg-green-50 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download size={18} className="mr-2" />
                Export Report
              </button>

              <button
                onClick={handlePrint}
                disabled={!reportData || isLoading}
                className="px-5 py-2.5 border border-blue-300 text-blue-700 font-medium rounded-xl hover:bg-blue-50 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Printer size={18} className="mr-2" />
                Print Report
              </button>
            </div>
          </div>

          {/* Report Content */}
          <div className="border border-gray-200 rounded-2xl overflow-hidden">
            {renderReportContent()}
          </div>

          {/* Report Summary */}
          {reportData && (
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Report Type</p>
                  <p className="text-lg font-bold text-gray-900">
                    {reportTypes.find(r => r.id === activeReport)?.label}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Total Records</p>
                  <p className="text-2xl font-bold text-gray-900">{getRecordCount()}</p>
                </div>

                {(activeReport === 'daily-op' || activeReport === 'bill-summary' || activeReport === 'particulars-report') && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Total Revenue</p>
                    <p className="text-3xl font-bold text-green-700">₹{getTotalRevenue().toFixed(2)}</p>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-300">
                <p className="text-sm text-gray-600">
                  Report generated on {format(new Date(), 'dd MMMM yyyy')} at {format(new Date(), 'hh:mm a')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Reports