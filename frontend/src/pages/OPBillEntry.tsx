import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { X, Search, Building, CalendarClock, User, Loader2, Users, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react'
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
  const [isDataLoaded, setIsDataLoaded] = useState(false)

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

  // Initialize with empty array, will be populated after particulars load
  const [billItems, setBillItems] = useState<BillItem[]>([])

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
    try {
      await Promise.all([
        fetchDoctors(),
        fetchDepartments(),
        fetchParticulars()
      ])
    } catch (error) {
      toast.error('Failed to load initial data')
    }
  }
  
  const fetchDepartments = async () => {
    try {
      const response = await axios.get('/settings/departments', {
        params: { active_only: false }
      })
      setDepartments(response.data)
    } catch (error) {
      console.error('Error fetching departments:', error)
      toast.error('Failed to load departments')
    }
  }
  
  const fetchParticulars = async () => {
    try {
      const response = await axios.get('/settings/particulars', {
        params: { active_only: false }
      })
      setParticulars(response.data)
      return response.data
    } catch (error) {
      console.error('Error fetching particulars:', error)
      toast.error('Failed to load particulars')
      return []
    }
  }

  // Initialize bill items after doctors and particulars are loaded
  useEffect(() => {
    if (particulars.length > 0 && doctors.length > 0 && !isDataLoaded) {
      initializeBillItems()
      setIsDataLoaded(true)
    }
  }, [particulars, doctors])

  const initializeBillItems = () => {
    const defaultDoctorId = doctors[0]?.id || 0
    const defaultDoctor = doctors.find(dr => dr.id === defaultDoctorId)
    // const defaultParticularId = particulars.length > 0 ? String(particulars[0].id) : ''
    // ADDED BY SIVAPRASAD I K ================
    const initialBillItems = particulars
  .filter(par => par.opdefault === true) // Only get OP default particulars
  .sort((a, b) => a.sortorder - b.sortorder) // Sort by sortorder
  .map(par => ({
    particular: par.id.toString(), // Use particular ID
    doctor: defaultDoctor?.booking_code || '',
    doctor_id: defaultDoctorId,
    department: defaultDoctor?.department || 'OPD',
    unit: 1,
    rate: 0,
    amount: 0,
    discount_percent: 0,
    discount_amount: 0,
    total: 0
  }));

// If no opdefault particulars found, add at least one item
if (initialBillItems.length === 0 && particulars.length > 0) {
  initialBillItems.push({
    particular: particulars[0].id.toString(),
    doctor: defaultDoctor?.booking_code || '',
    doctor_id: defaultDoctorId,
    department: defaultDoctor?.department || 'OPD',
    unit: 1,
    rate: 0,
    amount: 0,
    discount_percent: 0,
    discount_amount: 0,
    total: 0
  });
}

setBillItems(initialBillItems);
    //=================================
    // Also set default doctor in patient form
    if (doctors.length > 0) {
      setPatientFormData(prev => ({ ...prev, doctor_id: doctors[0].id }))
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

  // Show loading state while data is being fetched
  if (!isDataLoaded || billItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4" size={32} />
          <p className="text-gray-600">Loading bill entry form...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-700 text-white px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Building size={24} />
            <div>
              <h1 className="text-xl font-bold">Outpatient Bill Entry</h1>
              {/* Display persistent bill number from ref */}
              <div className="text-sm text-blue-100 opacity-90">
                Bill #: {billNumberRef.current} | Date: {format(new Date(), 'dd/MM/yyyy HH:mm')}
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded text-sm"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-4">
        {/* Search Patient Section */}
        {!selectedPatient && (
          <div className="bg-white rounded-lg shadow border border-gray-200">
            <div className="p-3 border-b border-gray-200 bg-blue-50">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900 flex items-center">
                  <Search className="mr-2" size={18} />
                  Search OP Patient
                </h2>
                <button
                  onClick={() => setShowSearchResults(!showSearchResults)}
                  className="text-sm text-blue-600 flex items-center"
                >
                  {showSearchResults ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>
            </div>

            <div className="p-3">
              <div className="flex space-x-2">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && searchPatients()}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded text-sm"
                      placeholder="Search by name, phone, address, complaint, referred by..."
                    />
                  </div>
                </div>
                <button
                  onClick={searchPatients}
                  disabled={isSearching}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSearching ? <Loader2 className="animate-spin" size={18} /> : 'Search'}
                </button>
              </div>

              {/* Search Results */}
              {showSearchResults && patients.length > 0 && (
                <div className="mt-3 border border-gray-200 rounded max-h-60 overflow-y-auto">
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
          <div className="bg-white rounded-lg shadow border border-green-200">
            <div className="p-3 border-b border-green-200 bg-green-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <User className="mr-2 text-green-600" size={18} />
                  <h2 className="font-semibold text-gray-900">Selected Patient</h2>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                    {selectedPatient.patient_number}
                  </span>
                  <button
                    onClick={() => setSelectedPatient(null)}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Change Patient
                  </button>
                </div>
              </div>
            </div>
            <div className="p-3">
              <div className="grid grid-cols-4 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Name:</span>
                  <span className="ml-2 font-medium">{selectedPatient.name}</span>
                </div>
                <div>
                  <span className="text-gray-600">Age/Gender:</span>
                  <span className="ml-2 font-medium">{selectedPatient.age} • {selectedPatient.gender}</span>
                </div>
                <div>
                  <span className="text-gray-600">Phone:</span>
                  <span className="ml-2 font-medium">{selectedPatient.phone}</span>
                </div>
                <div>
                  <span className="text-gray-600">Doctor:</span>
                  <span className="ml-2 font-medium">{selectedPatient.doctor_name}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-600">Address:</span>
                  <span className="ml-2 font-medium">
                    {[selectedPatient.house, selectedPatient.street, selectedPatient.place].filter(Boolean).join(', ')}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-600">Complaint:</span>
                  <span className="ml-2 font-medium">{selectedPatient.complaint}</span>
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
                <div className="border border-gray-200 rounded overflow-hidden">
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
            )}
          </div>
        )}

        {/* Patient Details Section (Only for new patients) */}
        {!selectedPatient && (
          <div className="bg-white rounded-lg shadow border border-gray-200">
            <div className="p-3 border-b border-gray-200 bg-blue-50">
              <h2 className="font-semibold text-gray-900">New Patient Details</h2>
            </div>

            <div className="p-3">
              <div className="grid grid-cols-4 gap-3">
                {/* Row 1 */}
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Name *</label>
                  <input
                    type="text"
                    value={patientFormData.name}
                    onChange={(e) => setPatientFormData({ ...patientFormData, name: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                    placeholder="Full name"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">Age *</label>
                  <input
                    type="text"
                    value={patientFormData.age}
                    onChange={(e) => setPatientFormData({ ...patientFormData, age: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                    placeholder="Years"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">Gender *</label>
                  <select
                    value={patientFormData.gender}
                    onChange={(e) => setPatientFormData({ ...patientFormData, gender: e.target.value as any })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">Phone *</label>
                  <input
                    type="tel"
                    value={patientFormData.phone}
                    onChange={(e) => setPatientFormData({ ...patientFormData, phone: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                    placeholder="Mobile"
                  />
                </div>

                {/* Row 2 */}
                <div>
                  <label className="block text-xs text-gray-600 mb-1">House No.</label>
                  <input
                    type="text"
                    value={patientFormData.house}
                    onChange={(e) => setPatientFormData({ ...patientFormData, house: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                    placeholder="House"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">Street</label>
                  <input
                    type="text"
                    value={patientFormData.street}
                    onChange={(e) => setPatientFormData({ ...patientFormData, street: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                    placeholder="Street"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">Place *</label>
                  <input
                    type="text"
                    value={patientFormData.place}
                    onChange={(e) => setPatientFormData({ ...patientFormData, place: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                    placeholder="City"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">Email</label>
                  <input
                    type="email"
                    value={patientFormData.email}
                    onChange={(e) => setPatientFormData({ ...patientFormData, email: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                    placeholder="Email"
                  />
                </div>

                {/* Row 3 */}
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Doctor *</label>
                  <select
                    value={patientFormData.doctor_id}
                    onChange={(e) => setPatientFormData({ ...patientFormData, doctor_id: parseInt(e.target.value) })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                  >
                    {doctors.map(doctor => (
                      <option key={doctor.id} value={doctor.id}>{doctor.name.replace('Dr.', '').trim()}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">Referred By</label>
                  <input
                    type="text"
                    value={patientFormData.referred_by}
                    onChange={(e) => setPatientFormData({ ...patientFormData, referred_by: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                    placeholder="Referred by"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs text-gray-600 mb-1">Complaint *</label>
                  <input
                    type="text"
                    value={patientFormData.complaint}
                    onChange={(e) => setPatientFormData({ ...patientFormData, complaint: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                    placeholder="Patient complaint"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bill Entry Section */}
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="p-3 border-b border-gray-200 bg-green-50">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Bill Entry</h2>
              <div className="flex items-center space-x-2">
                <div className="text-sm">
                  <label className="text-gray-600 mr-2">Bill Type:</label>
                  <select
                    value={billFormData.bill_type}
                    onChange={(e) => setBillFormData({ ...billFormData, bill_type: e.target.value })}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Credit">Credit</option>
                    <option value="Insurance">Insurance</option>
                  </select>
                </div>

                <div className="text-sm">
                  <label className="text-gray-600 mr-2">Category:</label>
                  <select
                    value={billFormData.category}
                    onChange={(e) => setBillFormData({ ...billFormData, category: e.target.value })}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="General">General</option>
                    <option value="ICU">ICU</option>
                    <option value="Surgery">Surgery</option>
                  </select>
                </div>

                <div className="text-sm">
                  <label className="text-gray-600 mr-2">Payment:</label>
                  <select
                    value={billFormData.payment_mode}
                    onChange={(e) => setBillFormData({ ...billFormData, payment_mode: e.target.value })}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
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

{/* Bill Items Table */}
<div className="overflow-x-auto">
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
            <div className="flex justify-between items-center mt-3">
              <button
                onClick={addBillItem}
                className="px-3 py-1.5 bg-blue-100 text-blue-700 text-sm rounded hover:bg-blue-200"
              >
                + Add Item
              </button>

              <div className="text-right">
                <div className="flex items-center space-x-4 text-sm">
                  <div className="text-gray-600">
                    Total: <span className="font-bold text-gray-900">₹{totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="text-gray-600">
                    Discount: <span className="font-bold text-red-600">-₹{totalDiscount.toFixed(2)}</span>
                  </div>
                  <div className="text-lg font-bold text-green-700">
                    Net: ₹{netAmount.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-3">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {selectedPatient ? (
                <span className="text-green-600 font-medium">
                  Patient: {selectedPatient.name} ({selectedPatient.patient_number})
                </span>
              ) : patientFormData.name ? (
                <span className="text-blue-600 font-medium">
                  New Patient: {patientFormData.name}
                </span>
              ) : (
                'Enter patient details or search existing patient'
              )}
            </div>

            <div className="flex space-x-2">
              <button
                onClick={handleResetForms}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
              >
                Clear All
              </button>

              <button
                onClick={handlePrintBill}
                className="px-4 py-2 border border-blue-300 text-blue-700 text-sm rounded hover:bg-blue-50"
              >
                Print
              </button>

              <button
                onClick={handleSaveBill}
                disabled={isLoading}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-sm rounded hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Save Bill'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OPBillEntry