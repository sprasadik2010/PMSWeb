import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { 
  X, Search, Building, CalendarClock, User, Loader2, Users, 
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Plus, 
  Printer, CheckCircle2, Receipt, Trash2 
} from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import type { AxiosError } from 'axios'

interface BillItem {
  particular: string
  doctor: string
  doctor_id: number
  department: string
  unit: number
  rate: number
  amount: number
  discount_percent: number
  discount_amount: number
  total: number
}

interface Doctor {
  id: number
  name: string
  code: string
  booking_code: string
  department: string
}

interface Patient {
  id: number
  patient_number: string
  name: string
  age: string
  gender: 'Male' | 'Female' | 'Other'
  complaint: string
  phone: string
  house: string
  street: string
  place: string
  email: string
  doctor_id: number
  doctor_name: string
  referred_by: string
  registration_date: string
  is_ip: boolean
}

interface PreviousBill {
  id: number
  bill_number: string
  bill_date: string
  total_amount: number
  discount_amount: number
  net_amount: number
  category: string
  patient_id: number
  doctor_id: number
}

interface BillDetails {
  bill: PreviousBill
  items: Array<{
    particular: string
    doctor: string
    doctor_id: number
    department: string
    unit: number
    rate: number
    amount: number
    discount_percent: number
    discount_amount: number
    total: number
  }>
}

interface Department {
  id: number;
  name: string;
  created_at: string;
}

interface Particular {
  id: number;
  name: string;
  opdefault: boolean;
  ipdefault: boolean;
  sortorder: number;
  created_at: string;
}

const OPBillEntry = () => {
  const navigate = useNavigate()
  const [currentTime] = useState(new Date())

  // Use useRef to store bill number that persists across re-renders
  const billNumberRef = useRef<string>('')

  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)

  // Previous bills states
  const [previousBills, setPreviousBills] = useState<PreviousBill[]>([])
  const [currentBillIndex, setCurrentBillIndex] = useState<number>(-1)
  const [isLoadingBills, setIsLoadingBills] = useState(false)
  const [showPreviousBills, setShowPreviousBills] = useState(false)
  const [isLoadingBillDetails, setIsLoadingBillDetails] = useState(false)

  
  const [particulars, setParticulars] = useState<Particular[]>([])
  const [departments, setDepartments] = useState<Department[]>([])

  const [patientFormData, setPatientFormData] = useState({
    name: '',
    age: '',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    complaint: '',
    house: '',
    street: '',
    place: '',
    phone: '',
    email: '',
    doctor_id: 0,
    referred_by: ''
  })

  // Bill Form Data
  const [billFormData, setBillFormData] = useState({
    bill_type: 'Cash',
    category: 'General',
    payment_mode: 'Cash'
  })

  // Initialize with at least one item so the form is never locked or empty
  const [billItems, setBillItems] = useState<BillItem[]>([
    {
      particular: '',
      doctor: '',
      doctor_id: 0,
      department: 'OPD',
      unit: 1,
      rate: 0,
      amount: 0,
      discount_percent: 0,
      discount_amount: 0,
      total: 0
    }
  ])

  // Initialize bill number on component mount
  useEffect(() => {
    // Generate initial bill number only once
    if (!billNumberRef.current) {
      billNumberRef.current = generateBillNumber()
    }
  }, [])

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    setIsLoading(true)
    try {
      const [doctorsData, , particularsData] = await Promise.all([
        fetchDoctors(),
        fetchDepartments(),
        fetchParticulars()
      ])
      
      const docs = doctorsData || []
      const parts = particularsData || []
      initializeBillItemsWithData(docs, parts)
    } catch (error) {
      console.error('Failed to load initial data:', error)
      toast.error('Failed to load initial data')
      initializeBillItemsWithData([], [])
    } finally {
      setIsLoading(false)
    }
  }
  
  const fetchDepartments = async () => {
    try {
      const response = await axios.get('/settings/departments', {
        params: { active_only: false }
      })
      setDepartments(response.data || [])
      return response.data || []
    } catch (error) {
      console.error('Error fetching departments:', error)
      toast.error('Failed to load departments')
      return []
    }
  }
  
  const fetchParticulars = async () => {
    try {
      const response = await axios.get('/settings/particulars', {
        params: { active_only: false }
      })
      setParticulars(response.data || [])
      return response.data || []
    } catch (error) {
      console.error('Error fetching particulars:', error)
      toast.error('Failed to load particulars')
      return []
    }
  }

  const initializeBillItemsWithData = (currentDoctors: Doctor[], currentParticulars: Particular[]) => {
    const defaultDoctorId = currentDoctors[0]?.id || 0
    const defaultDoctor = currentDoctors.find(dr => dr.id === defaultDoctorId)
    
    // Filter to only get OP default particulars
    const initialBillItems = currentParticulars
      .filter(par => par.opdefault === true)
      .sort((a, b) => (a.sortorder || 0) - (b.sortorder || 0))
      .map(par => ({
        particular: par.id.toString(),
        doctor: defaultDoctor?.booking_code || '',
        doctor_id: defaultDoctorId,
        department: defaultDoctor?.department || 'OPD',
        unit: 1,
        rate: 0,
        amount: 0,
        discount_percent: 0,
        discount_amount: 0,
        total: 0
      }))

    // If no opdefault particulars found, fallback to first particular or blank item
    if (initialBillItems.length === 0 && currentParticulars.length > 0) {
      initialBillItems.push({
        particular: currentParticulars[0].id.toString(),
        doctor: defaultDoctor?.booking_code || '',
        doctor_id: defaultDoctorId,
        department: defaultDoctor?.department || 'OPD',
        unit: 1,
        rate: 0,
        amount: 0,
        discount_percent: 0,
        discount_amount: 0,
        total: 0
      })
    } else if (initialBillItems.length === 0) {
      initialBillItems.push({
        particular: '',
        doctor: defaultDoctor?.booking_code || '',
        doctor_id: defaultDoctorId,
        department: defaultDoctor?.department || 'OPD',
        unit: 1,
        rate: 0,
        amount: 0,
        discount_percent: 0,
        discount_amount: 0,
        total: 0
      })
    }

    setBillItems(initialBillItems)

    // Also set default doctor in patient form
    if (currentDoctors.length > 0) {
      setPatientFormData(prev => ({ ...prev, doctor_id: currentDoctors[0].id }))
    }
  }

  // Update consultation item when patient's doctor changes - FIXED VERSION
  useEffect(() => {
    if (patientFormData.doctor_id > 0 && billItems.length > 0 && doctors.length > 0) {
      const doctor = doctors.find(dr => dr.id === patientFormData.doctor_id);
      if (doctor && billItems[0].particular === 'Consultation') {
        // Only update if the doctor_id is different
        if (billItems[0].doctor_id !== patientFormData.doctor_id) {
          const updatedItems = [...billItems];
          updatedItems[0] = {
            ...updatedItems[0],
            doctor: doctor.booking_code,
            doctor_id: patientFormData.doctor_id,
            department: doctor.department || 'OPD'
          };
          setBillItems(updatedItems);
        }
      }
    }
  }, [patientFormData.doctor_id, doctors]) // Removed billItems from dependencies

  const fetchDoctors = async () => {
    try {
      const response = await axios.get('/doctors')
      // Add department to doctors if not present (mock data for demo)
      const doctorsWithDept = response.data.map((doctor: Doctor) => ({
        ...doctor,
        department: doctor.department || 'OPD' // Default to OPD if no department
      }))
      setDoctors(doctorsWithDept)
      return doctorsWithDept
    } catch (error) {
      toast.error('Failed to load doctors')
      return []
    }
  }

  const searchPatients = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter search term')
      return
    }

    setIsSearching(true)
    try {
      const response = await axios.get(`/patients/search/op/${encodeURIComponent(searchQuery)}`)
      const opPatients = response.data
      setPatients(opPatients)
      setShowSearchResults(true)
      
      if (opPatients.length === 0) {
        toast.success('No OP patients found matching your search')
      } else {
        toast.success(`Found ${opPatients.length} OP patients`)
      }
    } catch (error) {
      const axiosError = error as AxiosError

      if (axiosError.response) {
        toast.error(`OP search failed: ${axiosError.response.status}`)
      } else if (axiosError.request) {
        toast.error('Network error - unable to connect to server')
      } else {
        toast.error('OP search failed: ' + axiosError.message)
      }

      setPatients([])
      setShowSearchResults(false)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectPatient = async (patient: Patient) => {
    setSelectedPatient(patient)

    // Populate patient form
    setPatientFormData({
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      complaint: patient.complaint,
      house: patient.house,
      street: patient.street,
      place: patient.place,
      phone: patient.phone,
      email: patient.email || '',
      doctor_id: patient.doctor_id,
      referred_by: patient.referred_by || ''
    })

    // Update consultation bill item with patient's doctor
    if (patient.doctor_id > 0 && doctors.length > 0) {
      const doctor = doctors.find(dr => dr.id === patient.doctor_id);
      if (doctor) {
        setBillItems(prev => prev.map((item, index) =>
          index === 0 && item.particular === 'Consultation'
            ? {
              ...item,
              doctor: doctor.booking_code,
              doctor_id: doctor.id,
              department: doctor.department || 'OPD'
            }
            : item
        ))
      }
    }

    // Reset previous bills navigation
    setPreviousBills([])
    setCurrentBillIndex(-1)
    setShowPreviousBills(false)

    // Load previous bills for this patient
    await fetchPreviousBills(patient.id)

    setShowSearchResults(false)
    setSearchQuery('')
    toast.success(`Patient ${patient.name} selected`)
  }

  const fetchPreviousBills = async (patientId: number) => {
    setIsLoadingBills(true)
    try {
      const response = await axios.get(`/bills/op/${patientId}`)
      // Sort bills by date (newest first)
      const sortedBills = response.data.sort((a: any, b: any) =>
        new Date(b.bill_date).getTime() - new Date(a.bill_date).getTime()
      )
      setPreviousBills(sortedBills)

      if (sortedBills.length > 0) {
        setShowPreviousBills(true)
        // Don't load any bill by default - start with blank form
        setCurrentBillIndex(-1)
        toast(`Found ${sortedBills.length} previous bill(s) for this patient`, {
          icon: 'ℹ️',
          duration: 3000
        })
      }
    } catch (error) {
      console.error('Failed to load previous bills:', error)
      // Don't show error toast if there are no bills
    } finally {
      setIsLoadingBills(false)
    }
  }

  const handleLoadPreviousBill = async (index: number) => {
    if (index < 0 || index >= previousBills.length) return

    const bill = previousBills[index]

    // Show confirmation before loading bill
    const confirmLoad = window.confirm(
      `Load bill ${bill.bill_number} from ${format(new Date(bill.bill_date), 'dd/MM/yyyy')}?\n` +
      `This will replace your current bill items.`
    )

    if (!confirmLoad) return

    try {
      setIsLoadingBillDetails(true)

      // Fetch complete bill details with items using your API
      const response = await axios.get(`/bills/op/details/${bill.id}`)
      const billDetails: BillDetails = response.data

      // Update current bill index
      setCurrentBillIndex(index)

      // Populate form with loaded bill data
      populateFormWithBill(billDetails)

      toast.success(`Bill ${bill.bill_number} loaded successfully`)
    } catch (error: any) {
      console.error('Error loading bill details:', error)
      toast.error('Failed to load bill details')
      setCurrentBillIndex(-1)
    } finally {
      setIsLoadingBillDetails(false)
    }
  }

  const populateFormWithBill = (billDetails: BillDetails) => {
    const { bill, items } = billDetails

    // Update bill form data
    setBillFormData({
      bill_type: 'Cash',
      category: bill.category || 'General',
      payment_mode: 'Cash'
    })

    // Update patient form data with doctor from bill
    if (selectedPatient) {
      setPatientFormData(prev => ({
        ...prev,
        doctor_id: bill.doctor_id || prev.doctor_id
      }))
    }

    // Update bill items
    const mappedItems: BillItem[] = items.map(item => ({
      particular: item.particular,
      doctor: item.doctor,
      doctor_id: item.doctor_id,
      department: item.department,
      unit: item.unit,
      rate: item.rate,
      amount: item.amount,
      discount_percent: item.discount_percent,
      discount_amount: item.discount_amount,
      total: item.total
    }))

    // If no items, keep default items
    setBillItems(mappedItems.length > 0 ? mappedItems : [
      {
        particular: particulars.length > 0 ? String(particulars[0].id) : '',
        doctor: doctors.find(dr => dr.id === patientFormData.doctor_id)?.booking_code ?? '',
        doctor_id: patientFormData.doctor_id,
        department: 'OPD',
        unit: 1,
        rate: 0,
        amount: 0,
        discount_percent: 0,
        discount_amount: 0,
        total: 0
      }
    ])
  }

  const handleNextBill = () => {
    if (currentBillIndex < previousBills.length - 1) {
      handleLoadPreviousBill(currentBillIndex + 1)
    }
  }

  const handlePrevBill = () => {
    if (currentBillIndex > 0) {
      handleLoadPreviousBill(currentBillIndex - 1)
    }
  }

  const handleClearCurrentBill = () => {
    setCurrentBillIndex(-1)
    // Reset bill form to default (keeping patient selected)
    setBillFormData({
      bill_type: 'Cash',
      category: 'General',
      payment_mode: 'Cash'
    })

    // Reset to default consultation item
    const defaultDoctorId = selectedPatient?.doctor_id || patientFormData.doctor_id;
    const defaultDoctor = doctors.find(dr => dr.id === defaultDoctorId);
    const defaultParticularId = particulars.length > 0 ? String(particulars[0].id) : '';

    setBillItems(prev => prev.map((item, index) =>
      index === 0
        ? {
          ...item,
          particular: defaultParticularId,
          doctor: defaultDoctor?.booking_code || '',
          doctor_id: defaultDoctorId || 0,
          department: defaultDoctor?.department || 'OPD',
          unit: 1,
          rate: 0,
          amount: 0,
          discount_percent: 0,
          discount_amount: 0,
          total: 0
        }
        : {
          particular: defaultParticularId,
          doctor: defaultDoctor?.booking_code || '',
          doctor_id: defaultDoctorId || 0,
          department: defaultDoctor?.department || 'OPD',
          unit: 1,
          rate: 0,
          amount: 0,
          discount_percent: 0,
          discount_amount: 0,
          total: 0
        }
    ))

    toast('Ready to create new bill', {
      icon: '📝',
      duration: 2000
    })
  }

  const generateBillNumber = () => {
    const now = new Date()
    const dateStr = format(now, 'yyyyMMdd')
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `OP${dateStr}-${random}`
  }

  const handleBillItemChange = (index: number, field: keyof BillItem, value: any) => {
    const newItems = [...billItems]
    newItems[index] = { ...newItems[index], [field]: value }

    if (field === 'rate' || field === 'unit') {
      const item = newItems[index]
      const amount = item.unit * item.rate
      const discount = amount * (item.discount_percent / 100)
      newItems[index].amount = amount
      newItems[index].discount_amount = discount
      newItems[index].total = amount - discount
    }

    if (field === 'discount_percent') {
      const item = newItems[index]
      const discount = item.amount * (item.discount_percent / 100)
      newItems[index].discount_amount = discount
      newItems[index].total = item.amount - discount
    }

    setBillItems(newItems)
  }

  const addBillItem = useCallback(() => {
    if (particulars.length === 0) {
      toast.error('Particulars not loaded yet')
      return
    }
    
    // Get the main doctor from patient form or selected patient
    const mainDoctorId = selectedPatient?.doctor_id || patientFormData.doctor_id;
    const mainDoctor = doctors.find(dr => dr.id === mainDoctorId);
    
    // Always use the first particular
    const defaultParticularId = particulars.length > 0 ? String(particulars[0].id) : ''
    
    // Add new item with default values
    const newItem: BillItem = { 
      particular: defaultParticularId,
      doctor: mainDoctor?.booking_code || '', 
      doctor_id: mainDoctorId || 0, 
      department: mainDoctor?.department || 'OPD', 
      unit: 1, 
      rate: 0, 
      amount: 0, 
      discount_percent: 0, 
      discount_amount: 0, 
      total: 0 
    };
    
    setBillItems(prev => [...prev, newItem]);
  }, [selectedPatient, patientFormData.doctor_id, doctors, particulars])
  
  const removeBillItem = (index: number) => {
    if (billItems.length > 1) {
      const newItems = billItems.filter((_, i) => i !== index)
      setBillItems(newItems)
    }
  }

  const calculateTotals = () => {
    const totalAmount = billItems.reduce((sum, item) => sum + item.amount, 0)
    const totalDiscount = billItems.reduce((sum, item) => sum + item.discount_amount, 0)
    const netAmount = totalAmount - totalDiscount

    return { totalAmount, totalDiscount, netAmount }
  }

  const handlePrintBill = () => {
    if (billItems.length === 0) {
      toast.error('No bill items to print')
      return
    }
    
    // Calculate totals
    const { totalAmount, totalDiscount, netAmount } = calculateTotals();

    // Create complete HTML document for printing
    const printHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Bill - ${patientFormData.name || 'Patient'}</title>
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
                /* Add these to remove header/footer */
                margin-top: 0;
                margin-bottom: 0;
                size: auto;
                /* Also try these vendor prefixes */
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .no-print { display: none !important; }
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
              }
            }
            
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              color: #374151;
              line-height: 1.5;
            }
            
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #e5e7eb;
            }
            
            .header h1 {
              font-size: 24px;
              font-weight: bold;
              color: #111827;
              margin: 0 0 8px 0;
            }
            
            .header .subtitle {
              font-size: 14px;
              color: #6b7280;
            }
            
            .patient-info {
              background-color: #f9fafb;
              border-radius: 6px;
              padding: 16px;
              margin-bottom: 24px;
            }
            
            .patient-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 12px;
              font-size: 14px;
            }
            
            .patient-item {
              display: flex;
              flex-direction: column;
            }
            
            .patient-label {
              color: #4b5563;
              font-size: 12px;
              margin-bottom: 2px;
            }
            
            .patient-value {
              font-weight: 500;
            }
            
            .bill-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 14px;
              margin-top: 8px;
            }
            
            .bill-table th {
              background-color: #f9fafb;
              padding: 12px;
              text-align: left;
              color: #4b5563;
              font-weight: 600;
              border-bottom: 2px solid #e5e7eb;
            }
            
            .bill-table td {
              padding: 12px;
              border-bottom: 1px solid #e5e7eb;
            }
            
            .bill-table tbody tr:last-child td {
              border-bottom: none;
            }
            
            .amount-column {
              text-align: right;
            }
            
            .totals-section {
              margin-top: 30px;
              padding: 20px;
              background-color: #f9fafb;
              border-radius: 6px;
            }
            
            .totals-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 16px;
              font-size: 15px;
            }
            
            .total-item {
              display: flex;
              flex-direction: column;
              align-items: flex-end;
            }
            
            .total-label {
              color: #4b5563;
              font-size: 14px;
              margin-bottom: 4px;
            }
            
            .total-value {
              font-weight: 600;
              font-size: 16px;
            }
            
            .net-total {
              font-weight: bold;
              color: #059669;
              font-size: 18px;
            }
            
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              font-size: 12px;
              color: #6b7280;
            }
            
            .footer-content {
              display: flex;
              justify-content: space-between;
            }
            
            .col-span-2 { grid-column: span 2; }
            .col-span-4 { grid-column: span 4; }
            
            .section-title {
              font-size: 16px;
              font-weight: bold;
              color: #374151;
              margin-bottom: 12px;
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            <!-- Header -->
            <div class="header">
              <h1>CITY NURSING HOME</h1>
              <div class="subtitle">NORTH KOTACHERY</div>
              <div class="subtitle">Phone: 202842, 202574, 2218153</div>
            </div>
            
            <!-- Patient Information -->
            <div class="patient-info">
              <div class="patient-grid">
                <!-- Name -->
                <div class="patient-item">
                  <span class="patient-label">Name:</span>
                  <span class="patient-value">${patientFormData.name || 'N/A'}</span>
                </div>
                
                <!-- Age/Gender -->
                <div class="patient-item">
                  <span class="patient-label">Age/Gender:</span>
                  <span class="patient-value">
                    ${patientFormData.age || 'N/A'} • ${patientFormData.gender || 'Not specified'}
                  </span>
                </div>
                
                <!-- Patient Number -->
                <div class="patient-item">
                  <span class="patient-label">Patient No:</span>
                  <span class="patient-value">
                    ${selectedPatient?.patient_number || 'New'}
                  </span>
                </div>
                
                <!-- Phone -->
                <div class="patient-item">
                  <span class="patient-label">Phone:</span>
                  <span class="patient-value">${patientFormData.phone || 'N/A'}</span>
                </div>
                
                <!-- Doctor -->
                <div class="patient-item">
                  <span class="patient-label">Doctor:</span>
                  <span class="patient-value">
                    ${patientFormData.doctor_id ? doctors.find(d => d.id === patientFormData.doctor_id)?.name || 'Not assigned' : 'Not assigned'}
                  </span>
                </div>
                
                <!-- Referred By -->
                <div class="patient-item">
                  <span class="patient-label">Referred By:</span>
                  <span class="patient-value">${patientFormData.referred_by || 'N/A'}</span>
                </div>
                
                <!-- Address -->
                <div class="patient-item col-span-2">
                  <span class="patient-label">Address:</span>
                  <span class="patient-value">
                    ${[patientFormData.house, patientFormData.street, patientFormData.place].filter(Boolean).join(', ') || 'Not provided'}
                  </span>
                </div>
                
                <!-- Complaint -->
                <div class="patient-item col-span-4">
                  <span class="patient-label">Complaint:</span>
                  <span class="patient-value">${patientFormData.complaint || 'Not specified'}</span>
                </div>
              </div>
            </div>
            
            <!-- Bill Items -->
            ${billItems.length > 0 ? `
              <div style="margin-top: 24px;">
                <div class="section-title">Bill Items</div>
                <table class="bill-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Particular</th>
                      <th>Doctor</th>
                      <th>Department</th>
                      <th>Unit</th>
                      <th>Rate</th>
                      <th class="amount-column">Amount</th>
                      <th>Dis%</th>
                      <th class="amount-column">Disc Amt</th>
                      <th class="amount-column">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${billItems.map((bi, index) => {
                      const particularName = particulars.find(p => String(p.id) === bi.particular)?.name || bi.particular
                      const displayAmount = typeof bi.amount === 'number'
                        ? bi.amount.toFixed(2)
                        : typeof bi.amount === 'string'
                          ? (parseFloat(bi.amount) || 0).toFixed(2)
                          : '0.00';

                      const displayRate = typeof bi.rate === 'number'
                        ? bi.rate.toFixed(2)
                        : typeof bi.rate === 'string'
                          ? (parseFloat(bi.rate) || 0).toFixed(2)
                          : '0.00';

                      const displayDiscount = typeof bi.discount_amount === 'number'
                        ? bi.discount_amount.toFixed(2)
                        : typeof bi.discount_amount === 'string'
                          ? (parseFloat(bi.discount_amount) || 0).toFixed(2)
                          : '0.00';

                      const displayTotal = typeof bi.total === 'number'
                        ? bi.total.toFixed(2)
                        : typeof bi.total === 'string'
                          ? (parseFloat(bi.total) || 0).toFixed(2)
                          : '0.00';

                      return `
                        <tr>
                          <td>${index + 1}</td>
                          <td>${particularName}</td>
                          <td>${bi.doctor || ''}</td>
                          <td>${bi.department || ''}</td>
                          <td>${bi.unit || 1}</td>
                          <td>${displayRate}</td>
                          <td class="amount-column">${displayAmount}</td>
                          <td>${bi.discount_percent || 0}%</td>
                          <td class="amount-column">${displayDiscount}</td>
                          <td class="amount-column">${displayTotal}</td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            ` : `
              <div style="text-align: center; padding: 40px 20px; color: #6b7280; font-style: italic;">
                No bill items to display
              </div>
            `}
            
            <!-- Totals Section -->
            <div class="totals-section">
              <div class="totals-grid">
                <div></div>
                <div class="total-item">
                  <span class="total-label">Total Amount:</span>
                  <span class="total-value">₹${totalAmount.toFixed(2)}</span>
                </div>
                <div class="total-item">
                  <span class="total-label">Total Discount:</span>
                  <span class="total-value" style="color: #dc2626;">-₹${totalDiscount.toFixed(2)}</span>
                </div>
                <div></div>
                <div class="total-item">
                  <span class="total-label">Net Amount:</span>
                  <span class="total-value net-total">₹${netAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            <!-- Bill Details -->
            <div style="margin-top: 24px; padding: 16px; background-color: #f0f9ff; border-radius: 6px;">
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; font-size: 14px;">
                <div>
                  <span style="color: #4b5563;">Bill Type:</span>
                  <span style="font-weight: 500; margin-left: 8px;">${billFormData.bill_type}</span>
                </div>
                <div>
                  <span style="color: #4b5563;">Category:</span>
                  <span style="font-weight: 500; margin-left: 8px;">${billFormData.category}</span>
                </div>
                <div>
                  <span style="color: #4b5563;">Payment Mode:</span>
                  <span style="font-weight: 500; margin-left: 8px;">${billFormData.payment_mode}</span>
                </div>
              </div>
            </div>
            
            <!-- Footer -->
            <div class="footer">
              <div class="footer-content">
                <div>
                  <!-- Use persistent bill number instead of generating new one -->
                  <div>Bill Number: ${billNumberRef.current}</div>
                  <div style="margin-top: 4px;">Printed: ${new Date().toLocaleDateString()}</div>
                  <div style="margin-top: 4px;">Time: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <div style="text-align: right;">
                  <div>Thank you for your visit</div>
                  <div style="margin-top: 4px;">Page 1 of 1</div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Print Button (only visible on screen) -->
          <div class="no-print" style="margin-top: 20px; text-align: center;">
            <button onclick="window.print()" style="
              background-color: #3b82f6;
              color: white;
              padding: 10px 24px;
              border: none;
              border-radius: 6px;
              font-weight: 500;
              cursor: pointer;
              font-size: 14px;
            ">
              Print Bill
            </button>
            <button onclick="window.close()" style="
              background-color: #6b7280;
              color: white;
              padding: 10px 24px;
              border: none;
              border-radius: 6px;
              font-weight: 500;
              cursor: pointer;
              font-size: 14px;
              margin-left: 12px;
            ">
              Close
            </button>
          </div>
          
          <script>
            // Close window after printing (if in iframe)
            window.onafterprint = function() {
              if (window.frameElement) {
                setTimeout(function() {
                  window.frameElement.remove();
                }, 100);
              }
            };
          </script>
        </body>
      </html>
    `;

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

  const handleSaveBill = async () => {
    // Validate bill items have valid particulars
    const hasInvalidParticulars = billItems.some(item => 
      !item.particular || item.particular === '' || item.particular === 'undefined'
    );
    
    if (hasInvalidParticulars) {
      toast.error('Please ensure all bill items have valid particulars selected');
      return;
    }

    // If selected patient exists, update it, otherwise create new
    if (!selectedPatient && (!patientFormData.name || !patientFormData.age || !patientFormData.gender ||
      !patientFormData.complaint || !patientFormData.phone || !patientFormData.doctor_id)) {
      toast.error('Please fill all required patient details')
      return
    }

    // Validate Bill
    const { netAmount } = calculateTotals()
    if (netAmount <= 0) {
      toast.error('Total amount must be greater than 0')
      return
    }

    setIsLoading(true)

    try {
      let patientId = selectedPatient?.id
      let patientNumber = selectedPatient?.patient_number

      // If no selected patient, create new
      if (!selectedPatient) {
        const patientData = {
          ...patientFormData,
          patient_number: `OP-${format(new Date(), 'yyyyMM')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
          registration_date: format(new Date(), 'yyyy-MM-dd'),
          registration_time: format(currentTime, 'HH:mm:ss'),
          is_ip: false
        }

        const patientResponse = await axios.post('/patients', patientData)
        patientId = patientResponse.data.id
        patientNumber = patientResponse.data.patient_number
      }

      // Create Bill - use persistent bill number
      const billData = {
        patient_id: patientId,
        patient_number: patientNumber,
        bill_number: billNumberRef.current, // Use persistent bill number
        bill_type: billFormData.bill_type,
        category: billFormData.category,
        payment_mode: billFormData.payment_mode,
        doctor_id: patientFormData.doctor_id,
        items: billItems.map(item => ({
          particular: item.particular,
          doctor: item.doctor,
          department: item.department,
          unit: item.unit,
          rate: item.rate,
          discount_percent: item.discount_percent
        }))
      }

      await axios.post('/bills/op', billData)

      toast.success(`OP Bill created successfully! 
        Patient: ${patientNumber}
        Bill: ${billData.bill_number}
        Amount: ₹${netAmount.toFixed(2)}`)

      handleResetForms()

    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to save bill')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetForms = () => {
    // Generate new bill number when resetting forms
    billNumberRef.current = generateBillNumber()
    
    setSelectedPatient(null)
    setPreviousBills([])
    setCurrentBillIndex(-1)
    setShowPreviousBills(false)
    
    setPatientFormData({
      name: '',
      age: '',
      gender: 'Male',
      complaint: '',
      house: '',
      street: '',
      place: '',
      phone: '',
      email: '',
      doctor_id: doctors[0]?.id || 0,
      referred_by: ''
    })
    
    setBillFormData({
      bill_type: 'Cash',
      category: 'General',
      payment_mode: 'Cash'
    })
    
    // Reset bill items with default consultation
    const defaultDoctorId = doctors[0]?.id || 0;
    const defaultDoctor = doctors.find(dr => dr.id === defaultDoctorId);
    
    // Use the first particular from particulars array
    const defaultParticularId = particulars.length > 0 ? String(particulars[0].id) : ''
    
    setBillItems([
      { 
        particular: defaultParticularId,
        doctor: defaultDoctor?.booking_code || '', 
        doctor_id: defaultDoctorId, 
        department: defaultDoctor?.department || 'OPD', 
        unit: 1, 
        rate: 0, 
        amount: 0, 
        discount_percent: 0, 
        discount_amount: 0, 
        total: 0 
      }
    ])
    
    setSearchQuery('')
    setShowSearchResults(false)
  }

  const { totalAmount, totalDiscount, netAmount } = calculateTotals()

  return (
    <div className="min-h-screen bg-gray-50/70 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-cyan-700 text-white px-4 sm:px-6 py-3.5 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20 shrink-0">
              <Building size={22} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight">Outpatient Billing</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-400/20 text-cyan-200 border border-cyan-400/30">
                  OPD
                </span>
              </div>
              <div className="text-xs text-blue-100/90 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span>Bill #: <strong className="font-mono text-white">{billNumberRef.current || 'Generating...'}</strong></span>
                <span className="hidden sm:inline opacity-50">•</span>
                <span>{format(new Date(), 'dd/MM/yyyy HH:mm')}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isLoading && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 text-xs text-blue-100 border border-white/15">
                <Loader2 size={13} className="animate-spin" />
                <span className="hidden sm:inline">Syncing...</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="p-2 sm:px-3 sm:py-1.5 bg-white/15 hover:bg-white/25 rounded-lg text-sm cursor-pointer transition-colors flex items-center gap-1.5 border border-white/20"
              title="Close and return to dashboard"
            >
              <X size={18} />
              <span className="hidden sm:inline text-xs font-semibold">Exit</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-3 sm:p-5 max-w-7xl mx-auto space-y-4">
        {/* Search Patient Section */}
        {!selectedPatient && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-blue-50/70 to-indigo-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-900 font-semibold text-sm">
                  <Search size={18} className="text-blue-600" />
                  <span>Search Registered OP Patient</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSearchResults(!showSearchResults)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 cursor-pointer"
                >
                  {showSearchResults ? 'Collapse' : 'Expand'}
                  {showSearchResults ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>
            </div>

            <div className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={17} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchPatients()}
                    className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                    placeholder="Search by name, phone, address, complaint, referred by..."
                  />
                </div>
                <button
                  type="button"
                  onClick={searchPatients}
                  disabled={isSearching}
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all"
                >
                  {isSearching ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
                  <span>Search</span>
                </button>
              </div>

              {/* Search Results */}
              {showSearchResults && patients.length > 0 && (
                <div className="mt-3 border border-gray-200 rounded-xl max-h-60 overflow-y-auto">
                  {/* Mobile Search Cards */}
                  <div className="lg:hidden divide-y divide-gray-100 p-2 space-y-2">
                    {patients.map(patient => (
                      <div key={patient.id} className="p-2.5 bg-gray-50 rounded-lg space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded font-mono font-bold">
                            {patient.patient_number}
                          </span>
                          <button
                            onClick={() => handleSelectPatient(patient)}
                            className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-md hover:bg-blue-700 cursor-pointer"
                          >
                            Select
                          </button>
                        </div>
                        <div className="font-medium text-gray-900 text-sm">{patient.name}</div>
                        <div className="text-xs text-gray-500 flex items-center justify-between">
                          <span>{patient.age}y • {patient.gender}</span>
                          <span>{patient.phone}</span>
                        </div>
                        {patient.complaint && (
                          <div className="text-xs text-gray-600 italic bg-white p-1 rounded border border-gray-100">
                            {patient.complaint}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Desktop Search Table */}
                  <div className="hidden lg:block">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-3 py-2 text-left">OP No.</th>
                          <th className="px-3 py-2 text-left">Name</th>
                          <th className="px-3 py-2 text-left">Phone</th>
                          <th className="px-3 py-2 text-left">Complaint</th>
                          <th className="px-3 py-2 text-left">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {patients.map(patient => (
                          <tr key={patient.id} className="border-t hover:bg-blue-50">
                            <td className="px-3 py-2">
                              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                {patient.patient_number}
                              </span>
                            </td>
                            <td className="px-3 py-2">
                              <div className="font-medium">{patient.name}</div>
                              <div className="text-xs text-gray-500">{patient.age} • {patient.gender}</div>
                            </td>
                            <td className="px-3 py-2">{patient.phone}</td>
                            <td className="px-3 py-2">
                              <div className="text-xs truncate max-w-xs">{patient.complaint}</div>
                            </td>
                            <td className="px-3 py-2">
                              <button
                                onClick={() => handleSelectPatient(patient)}
                                className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                              >
                                Select
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {showSearchResults && patients.length === 0 && !isSearching && (
                <div className="mt-3 text-center py-4 text-gray-500">
                  <Users className="mx-auto mb-2" size={24} />
                  <p>No OP patients found. Try a different search.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Selected Patient Info */}
        {selectedPatient && (
          <div className="bg-white rounded-xl shadow-sm border border-emerald-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-900 font-semibold text-sm">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                    <User size={14} />
                  </div>
                  <span>Selected Outpatient</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-mono font-bold border border-emerald-200">
                    OP: {selectedPatient.patient_number}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedPatient(null)}
                    className="text-xs text-gray-500 hover:text-red-600 hover:underline font-medium cursor-pointer"
                  >
                    Change Patient
                  </button>
                </div>
              </div>
            </div>
            <div className="p-3 sm:p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Patient Name</div>
                  <div className="font-bold text-gray-900 mt-0.5">{selectedPatient.name}</div>
                </div>
                <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Age / Gender</div>
                  <div className="font-semibold text-gray-800 mt-0.5">{selectedPatient.age} yrs • {selectedPatient.gender}</div>
                </div>
                <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Contact Phone</div>
                  <div className="font-semibold text-gray-800 mt-0.5">{selectedPatient.phone || 'N/A'}</div>
                </div>
                <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Consulting Doctor</div>
                  <div className="font-semibold text-gray-800 mt-0.5">{selectedPatient.doctor_name || 'N/A'}</div>
                </div>
                <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100 col-span-1 sm:col-span-2">
                  <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Address</div>
                  <div className="font-medium text-gray-800 mt-0.5">
                    {[selectedPatient.house, selectedPatient.street, selectedPatient.place].filter(Boolean).join(', ') || 'N/A'}
                  </div>
                </div>
                <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100 col-span-1 sm:col-span-2">
                  <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Chief Complaint</div>
                  <div className="font-medium text-gray-800 mt-0.5">{selectedPatient.complaint || 'General Checkup'}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Previous Bills Navigation - Only show if patient has previous bills */}
        {selectedPatient && previousBills.length > 0 && (
          <div className="bg-white rounded-lg shadow border border-blue-200">
            <div className="p-3 border-b border-blue-200 bg-blue-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CalendarClock className="mr-2 text-blue-600" size={18} />
                  <h2 className="font-semibold text-gray-900">
                    Previous Bills ({previousBills.length})
                  </h2>
                  {isLoadingBills && (
                    <Loader2 className="ml-2 animate-spin" size={16} />
                  )}
                </div>
                <button
                  onClick={() => setShowPreviousBills(!showPreviousBills)}
                  className="text-sm text-blue-600 flex items-center"
                >
                  {showPreviousBills ? 'Hide' : 'Show'}
                  {showPreviousBills ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>
            </div>

            {showPreviousBills && (
              <div className="p-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm text-gray-600">
                    {currentBillIndex === -1 ? (
                      <span className="text-green-600 font-medium">
                        Creating new bill
                      </span>
                    ) : (
                      <span className="text-blue-600 font-medium">
                        Viewing: {previousBills[currentBillIndex].bill_number}
                        {isLoadingBillDetails && (
                          <Loader2 className="ml-2 inline animate-spin" size={14} />
                        )}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handlePrevBill}
                      disabled={currentBillIndex <= 0 || isLoadingBillDetails}
                      className="px-2 py-1 border border-gray-300 rounded disabled:opacity-50"
                    >
                      <ChevronLeft size={16} />
                    </button>

                    <div className="text-sm">
                      {currentBillIndex === -1 ? 'New' : `${currentBillIndex + 1} of ${previousBills.length}`}
                    </div>

                    <button
                      onClick={handleNextBill}
                      disabled={currentBillIndex >= previousBills.length - 1 || isLoadingBillDetails}
                      className="px-2 py-1 border border-gray-300 rounded disabled:opacity-50"
                    >
                      <ChevronRight size={16} />
                    </button>

                    {currentBillIndex !== -1 && (
                      <button
                        onClick={handleClearCurrentBill}
                        disabled={isLoadingBillDetails}
                        className="ml-2 px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 disabled:opacity-50"
                      >
                        New Bill
                      </button>
                    )}
                  </div>
                </div>

                {/* Previous Bills List */}
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  {/* Mobile Previous Bills Cards */}
                  <div className="lg:hidden p-2.5 space-y-2 bg-gray-50/50">
                    {previousBills.map((bill, index) => (
                      <div
                        key={bill.id}
                        className={`p-3 rounded-lg border text-xs space-y-2 ${
                          currentBillIndex === index
                            ? 'bg-blue-50 border-blue-300 shadow-sm'
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-blue-700">{bill.bill_number}</span>
                          <span className="text-gray-500">{format(new Date(bill.bill_date), 'dd/MM/yyyy')}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-[11px] font-semibold">
                            {bill.category}
                          </span>
                          <span className="font-bold text-gray-900 text-sm">
                            ₹{bill.net_amount.toFixed(2)}
                          </span>
                        </div>
                        <button
                          onClick={() => handleLoadPreviousBill(index)}
                          disabled={isLoadingBillDetails}
                          className={`w-full py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer disabled:opacity-50 ${
                            currentBillIndex === index
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {currentBillIndex === index ? 'Currently Viewing' : 'View Bill Details'}
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Previous Bills Table */}
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left">Bill No.</th>
                          <th className="px-3 py-2 text-left">Date</th>
                          <th className="px-3 py-2 text-left">Category</th>
                          <th className="px-3 py-2 text-left">Amount</th>
                          <th className="px-3 py-2 text-left">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previousBills.map((bill, index) => (
                          <tr
                            key={bill.id}
                            className={`border-t hover:bg-blue-50 ${currentBillIndex === index ? 'bg-blue-100' : ''
                              }`}
                          >
                            <td className="px-3 py-2">
                              <span className={`font-medium ${currentBillIndex === index ? 'text-blue-700' : 'text-gray-800'
                                }`}>
                                {bill.bill_number}
                              </span>
                            </td>
                            <td className="px-3 py-2">
                              {format(new Date(bill.bill_date), 'dd/MM/yyyy')}
                            </td>
                            <td className="px-3 py-2">
                              <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                                {bill.category}
                              </span>
                            </td>
                            <td className="px-3 py-2 font-bold">
                              ₹{bill.net_amount.toFixed(2)}
                            </td>
                            <td className="px-3 py-2">
                              <button
                                onClick={() => handleLoadPreviousBill(index)}
                                disabled={isLoadingBillDetails}
                                className={`px-3 py-1 text-xs rounded disabled:opacity-50 ${currentBillIndex === index
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  }`}
                              >
                                {currentBillIndex === index ? 'Viewing' : 'View'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Patient Details Section (Only for new patients) */}
        {!selectedPatient && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-blue-50/70 to-indigo-50/40">
              <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                <User size={16} className="text-blue-600" />
                <span>New Patient Registration & Info</span>
              </h2>
            </div>

            <div className="p-3 sm:p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {/* Row 1 */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Patient Name *</label>
                  <input
                    type="text"
                    value={patientFormData.name}
                    onChange={(e) => setPatientFormData({ ...patientFormData, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="Full name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Age (Years) *</label>
                  <input
                    type="text"
                    value={patientFormData.age}
                    onChange={(e) => setPatientFormData({ ...patientFormData, age: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="e.g. 32"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Gender *</label>
                  <select
                    value={patientFormData.gender}
                    onChange={(e) => setPatientFormData({ ...patientFormData, gender: e.target.value as any })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    value={patientFormData.phone}
                    onChange={(e) => setPatientFormData({ ...patientFormData, phone: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="10-digit mobile"
                  />
                </div>

                {/* Row 2 */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">House / Apt No.</label>
                  <input
                    type="text"
                    value={patientFormData.house}
                    onChange={(e) => setPatientFormData({ ...patientFormData, house: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="House / Flat #"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Street / Landmark</label>
                  <input
                    type="text"
                    value={patientFormData.street}
                    onChange={(e) => setPatientFormData({ ...patientFormData, street: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="Street name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Place / City *</label>
                  <input
                    type="text"
                    value={patientFormData.place}
                    onChange={(e) => setPatientFormData({ ...patientFormData, place: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="City / Village"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={patientFormData.email}
                    onChange={(e) => setPatientFormData({ ...patientFormData, email: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="Email (optional)"
                  />
                </div>

                {/* Row 3 */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Consulting Doctor *</label>
                  <select
                    value={patientFormData.doctor_id}
                    onChange={(e) => setPatientFormData({ ...patientFormData, doctor_id: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                  >
                    {doctors.map(doctor => (
                      <option key={doctor.id} value={doctor.id}>{doctor.name.replace('Dr.', '').trim()}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Referred By</label>
                  <input
                    type="text"
                    value={patientFormData.referred_by}
                    onChange={(e) => setPatientFormData({ ...patientFormData, referred_by: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="Referral source"
                  />
                </div>

                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Chief Complaint *</label>
                  <input
                    type="text"
                    value={patientFormData.complaint}
                    onChange={(e) => setPatientFormData({ ...patientFormData, complaint: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="e.g. Fever, Headache, Routine OP Checkup"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bill Entry Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-emerald-50/70 to-teal-50/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                <Receipt size={16} className="text-emerald-600" />
                <span>Bill Particulars & Charges</span>
              </h2>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-1.5 text-xs bg-white px-2.5 py-1.5 rounded-lg border border-gray-200 shadow-2xs">
                  <span className="text-gray-500 font-medium">Type:</span>
                  <select
                    value={billFormData.bill_type}
                    onChange={(e) => setBillFormData({ ...billFormData, bill_type: e.target.value })}
                    className="font-bold text-gray-800 bg-transparent focus:outline-none cursor-pointer"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Credit">Credit</option>
                    <option value="Insurance">Insurance</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5 text-xs bg-white px-2.5 py-1.5 rounded-lg border border-gray-200 shadow-2xs">
                  <span className="text-gray-500 font-medium">Category:</span>
                  <select
                    value={billFormData.category}
                    onChange={(e) => setBillFormData({ ...billFormData, category: e.target.value })}
                    className="font-bold text-gray-800 bg-transparent focus:outline-none cursor-pointer"
                  >
                    <option value="General">General</option>
                    <option value="ICU">ICU</option>
                    <option value="Surgery">Surgery</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5 text-xs bg-white px-2.5 py-1.5 rounded-lg border border-gray-200 shadow-2xs">
                  <span className="text-gray-500 font-medium">Payment:</span>
                  <select
                    value={billFormData.payment_mode}
                    onChange={(e) => setBillFormData({ ...billFormData, payment_mode: e.target.value })}
                    className="font-bold text-emerald-700 bg-transparent focus:outline-none cursor-pointer"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="UPI">UPI</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3">

{/* Bill Items Responsive Cards / Table */}
{/* Mobile Bill Items Cards */}
<div className="lg:hidden space-y-3 mb-3">
  {billItems.map((item, index) => {
    const mainDoctorId = selectedPatient?.doctor_id || patientFormData.doctor_id;
    const mainDoctor = doctors.find(dr => dr.id === mainDoctorId);
    const bookingCode = mainDoctor?.code || '';
    const department = departments.find(dp => dp.id === Number(mainDoctor?.department))?.name || 'OPD';

    return (
      <div key={index} className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="font-bold text-xs text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
            Item #{index + 1}
          </span>
          <div className="flex items-center gap-2">
            <span className="font-bold text-green-700 text-sm">
              ₹{item.total.toFixed(2)}
            </span>
            {billItems.length > 1 && (
              <button
                type="button"
                onClick={() => removeBillItem(index)}
                className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 border border-red-200 cursor-pointer transition-colors"
                title="Remove charge item"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>

        <div>
          <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Particular</label>
          <div className="relative">
            <select
              value={item.particular}
              onChange={(e) => handleBillItemChange(index, 'particular', e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs bg-white appearance-none pr-6"
            >
              {particulars.map((particular, idx) => (
                <option key={idx} value={particular.id}>
                  {particular.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Unit</label>
            <input
              type="text"
              value={item.unit}
              onChange={(e) => handleBillItemChange(index, 'unit', parseInt(e.target.value) || 0)}
              className="w-full px-2 py-1 border border-gray-300 rounded-lg text-xs text-center bg-white"
              min="1"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Rate (₹)</label>
            <input
              type="text"
              value={item.rate}
              onChange={(e) => handleBillItemChange(index, 'rate', parseFloat(e.target.value) || 0)}
              className="w-full px-2 py-1 border border-gray-300 rounded-lg text-xs text-center bg-white"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Amount</label>
            <div className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs text-center font-medium">
              ₹{item.amount.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Disc %</label>
            <input
              type="text"
              value={item.discount_percent}
              onChange={(e) => handleBillItemChange(index, 'discount_percent', parseFloat(e.target.value) || 0)}
              className="w-full px-2 py-1 border border-gray-300 rounded-lg text-xs text-center bg-white"
              max="100"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Disc (₹)</label>
            <div className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs text-center text-red-600 font-medium">
              ₹{item.discount_amount.toFixed(2)}
            </div>
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Doctor/Dept</label>
            <div className="px-2 py-1 bg-gray-100 border border-gray-200 rounded-lg text-[10px] text-center text-gray-700 truncate">
              {bookingCode || department}
            </div>
          </div>
        </div>
      </div>
    );
  })}
</div>

{/* Desktop Bill Items Table */}
<div className="hidden lg:block overflow-x-auto">
  <table className="w-full border border-gray-200 text-sm">
    <thead className="bg-gray-100">
      <tr>
        <th className="px-2 py-2 border text-center">#</th>
        <th className="px-2 py-2 border text-left">Particular</th>
        <th className="px-2 py-2 border text-left">Doctor</th>
        <th className="px-2 py-2 border text-left">Department</th>
        <th className="px-2 py-2 border text-center">Unit</th>
        <th className="px-2 py-2 border text-center">Rate</th>
        <th className="px-2 py-2 border text-center">Amount</th>
        <th className="px-2 py-2 border text-center">Dis%</th>
        <th className="px-2 py-2 border text-center">Disc Amt</th>
        <th className="px-2 py-2 border text-center">Total</th>
        <th className="px-2 py-2 border text-center">Action</th>
      </tr>
    </thead>
    <tbody>
      {billItems.map((item, index) => {
        // Get the main doctor from patient form or selected patient
        const mainDoctorId = selectedPatient?.doctor_id || patientFormData.doctor_id;
        const mainDoctor = doctors.find(dr => dr.id === mainDoctorId);
        const bookingCode = mainDoctor?.code || '';
        const department = departments.find(dp => dp.id === Number(mainDoctor?.department))?.name || 'OPD';
        
        return (
          <tr key={index} className="hover:bg-gray-50">
            <td className="px-2 py-1.5 border text-center">{index + 1}</td>
            
            {/* Particular Cell - Always visible dropdown */}
            <td className="px-2 py-1.5 border">
              <div className="relative">
                <select
                  value={item.particular}
                  onChange={(e) => handleBillItemChange(index, 'particular', e.target.value)}
                  className="w-full px-1 py-0.5 border border-gray-300 rounded text-xs appearance-none pr-6"
                >
                  {particulars.map((particular, idx) => (
                    <option key={idx} value={particular.id}>
                      {particular.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={12} />
              </div>
            </td>
            
            {/* Doctor Cell - Readonly booking code from main doctor */}
            <td className="px-2 py-1.5 border">
              <div className="px-1 py-0.5 min-h-[28px] flex items-center">
                <span className="font-medium">{bookingCode}</span>
              </div>
            </td>
            
            {/* Department Cell - Readonly department from main doctor */}
            <td className="px-2 py-1.5 border">
              <div className="px-1 py-0.5 min-h-[28px] flex items-center">
                <span className="font-medium">{department}</span>
              </div>
            </td>
            
            <td className="px-2 py-1.5 border">
              <input
                type="text"
                value={item.unit}
                onChange={(e) => handleBillItemChange(index, 'unit', parseInt(e.target.value) || 0)}
                className="w-full px-1 py-0.5 border border-gray-300 rounded text-xs text-center"
                min="1"
              />
            </td>
            <td className="px-2 py-1.5 border">
              <input
                type="text"
                value={item.rate}
                onChange={(e) => handleBillItemChange(index, 'rate', parseFloat(e.target.value) || 0)}
                className="w-full px-1 py-0.5 border border-gray-300 rounded text-xs text-center"
              />
            </td>
            <td className="px-2 py-1.5 border text-center font-medium">
              ₹{item.amount.toFixed(2)}
            </td>
            <td className="px-2 py-1.5 border">
              <input
                type="text"
                value={item.discount_percent}
                onChange={(e) => handleBillItemChange(index, 'discount_percent', parseFloat(e.target.value) || 0)}
                className="w-full px-1 py-0.5 border border-gray-300 rounded text-xs text-center"
                max="100"
              />
            </td>
            <td className="px-2 py-1.5 border text-center text-red-600 font-medium">
              ₹{item.discount_amount.toFixed(2)}
            </td>
            <td className="px-2 py-1.5 border text-center text-green-700 font-bold">
              ₹{item.total.toFixed(2)}
            </td>
            <td className="px-2 py-1.5 border text-center">
              {billItems.length > 1 && (
                <button
                  onClick={() => removeBillItem(index)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  ×
                </button>
              )}
            </td>
          </tr>
        );
      })}
    </tbody>
  </table>
</div>
            {/* Totals Summary & Add Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={addBillItem}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 text-xs sm:text-sm font-semibold rounded-lg hover:bg-blue-100 border border-blue-200/80 cursor-pointer transition-colors"
              >
                <Plus size={16} />
                <span>Add Charge Line</span>
              </button>

              <div className="grid grid-cols-3 sm:flex sm:items-center gap-2 sm:gap-4 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                <div className="text-center sm:text-right">
                  <div className="text-[10px] uppercase font-bold text-gray-500">Gross Total</div>
                  <div className="font-bold text-gray-900 text-sm">₹{totalAmount.toFixed(2)}</div>
                </div>
                <div className="text-center sm:text-right">
                  <div className="text-[10px] uppercase font-bold text-gray-500">Total Disc.</div>
                  <div className="font-bold text-red-600 text-sm">-₹{totalDiscount.toFixed(2)}</div>
                </div>
                <div className="text-center sm:text-right bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                  <div className="text-[10px] uppercase font-black text-emerald-800">Net Payable</div>
                  <div className="font-black text-emerald-700 text-base">₹{netAmount.toFixed(2)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs sm:text-sm text-gray-600">
              {selectedPatient ? (
                <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                  <User size={15} />
                  <span>Patient: {selectedPatient.name} ({selectedPatient.patient_number})</span>
                </span>
              ) : patientFormData.name ? (
                <span className="text-blue-700 font-semibold flex items-center gap-1.5">
                  <User size={15} />
                  <span>New Patient: {patientFormData.name}</span>
                </span>
              ) : (
                <span className="text-gray-400 italic">Enter patient info or select registered patient</span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleResetForms}
                className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 text-gray-700 text-xs sm:text-sm font-semibold rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              >
                Clear All
              </button>

              <button
                type="button"
                onClick={handlePrintBill}
                className="flex-1 sm:flex-none px-4 py-2 border border-blue-300 text-blue-700 text-xs sm:text-sm font-semibold rounded-lg hover:bg-blue-50 cursor-pointer transition-colors flex items-center justify-center gap-1.5"
              >
                <Printer size={15} />
                <span>Print Bill</span>
              </button>

              <button
                type="button"
                onClick={handleSaveBill}
                disabled={isLoading}
                className="w-full sm:w-auto px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs sm:text-sm font-bold rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 shadow-md shadow-blue-500/20 cursor-pointer transition-all flex items-center justify-center gap-1.5"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Save Bill</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OPBillEntry