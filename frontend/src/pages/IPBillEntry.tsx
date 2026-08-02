import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { X, Search, Building, CalendarClock, Bed, Loader2, Users, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import type { AxiosError } from 'axios'

interface BillItem {
  particular: string  // This stores the particular ID (as string)
  department: string  // This stores the department ID (as string)
  amount: number
  discount_percent: number
  discount_amount: number
  total: number
  doctor_id?: number
}

interface BillPurtcularsnDept {
  particular: string
  department: string
}

interface Doctor {
  id: number
  name: string
  code: string
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
  room: string
  admission_date: string
  is_ip: boolean
}

interface PreviousBill {
  id: number
  bill_number: string
  bill_date: string
  total_amount: number
  discount_amount: number
  net_amount: number
  room: string
  category: string
  patient_id: number
  doctor_id: number
  is_insurance: boolean
  is_credit: boolean
  insurance_company: string | null
  third_party: string | null
  service_tax: number
  education_cess: number
  she_education_cess: number
  admission_date: string
}

interface BillDetails {
  bill: PreviousBill
  items: Array<{
    particular: string
    department: string
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

const IPBillEntry = () => {
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
  const [billParticularsnDepts, setBillParticularsnDepts] = useState<BillPurtcularsnDept[]>([])

  // Patient Form Data
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
    referred_by: '',
    room: '',
    admission_date: format(new Date(), 'yyyy-MM-dd')
  })

  // Bill Form Data
  const [billFormData, setBillFormData] = useState({
    bill_type: 'Cash',
    category: 'General',
    payment_mode: 'Cash',
    is_insurance: false,
    is_credit: false,
    insurance_company: '',
    policy_number: '',
    service_tax: 0,
    education_cess: 0,
    she_education_cess: 0
  })

  const [billItems, setBillItems] = useState<BillItem[]>([])

  // Initialize bill number on component mount
  useEffect(() => {
    if (!billNumberRef.current) {
      billNumberRef.current = generateBillNumber()
    }
    
    fetchInitialData()
  }, [])

  // Initialize bill items when billParticularsnDepts, particulars, and departments are set
  useEffect(() => {
  if (billParticularsnDepts.length > 0 && billItems.length === 0 && particulars.length > 0 && departments.length > 0) {
    // Filter to only get IP default particulars
    const ipDefaultParticulars = particulars.filter(p => p.ipdefault === true);
    
    // If no IP defaults found, use the first particular as fallback
    const defaultParticulars = ipDefaultParticulars.length > 0 
      ? ipDefaultParticulars 
      : [particulars[0]];
    
    // Sort by sortorder if available
    const sortedParticulars = [...defaultParticulars].sort((a, b) => 
      (a.sortorder || 0) - (b.sortorder || 0)
    );

    // Create initial bill items
    const initialBillItems = sortedParticulars.map((particular) => {
      // Find department for this particular (if you have a mapping)
      // Or use the default department from billParticularsnDepts
      const defaultDept = billParticularsnDepts.find(pnd => pnd.particular === particular.name);
      const department = departments.find(d => d.name === (defaultDept?.department || 'General'));
      
      return {
        particular: particular.id.toString(),
        department: department ? department.id.toString() : '',
        amount: 0,
        discount_percent: 0,
        discount_amount: 0,
        total: 0,
        // For IP bills, doctor_id should be 0 or not included at all
        // Check your IPBillItemCreate schema - if it has doctor_id with default 0
        doctor_id: 0 // or remove this field if not needed
      }
    })
    
    setBillItems(initialBillItems)
  }
}, [billParticularsnDepts, billItems.length, particulars, departments])

  const fetchInitialData = async () => {
    setIsLoading(true)
    try {
      // Fetch doctors first
      await fetchDoctors()
      
      // Then fetch departments and particulars
      await Promise.all([
        fetchDepartments(),
        fetchParticulars()
      ])
    } catch (error) {
      toast.error('Failed to load initial data')
    } finally {
      setIsLoading(false)
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
      const particularsData = response.data
      setParticulars(particularsData)
      
      // Initialize billParticularsnDepts if we have particulars
      if (particularsData.length > 0) {
        const initialBillParticulars = particularsData.map((particular: Particular) => ({
          particular: particular.name,
          department: 'General' // Default department name
        }))
        setBillParticularsnDepts(initialBillParticulars)
      }
      
      return particularsData
    } catch (error) {
      console.error('Error fetching particulars:', error)
      toast.error('Failed to load particulars')
      return []
    }
  }

  // Helper function to get particular name from ID
  const getParticularName = (id: string): string => {
    if (!id) return 'Select Particular'
    const particular = particulars.find(p => p.id.toString() === id)
    return particular ? particular.name : 'N/A'
  }

  // Helper function to get department name from ID
  const getDepartmentName = (id: string): string => {
    if (!id) return 'Select Department'
    const department = departments.find(d => d.id.toString() === id)
    return department ? department.name : 'N/A'
  }

  const fetchDoctors = async () => {
    try {
      const response = await axios.get('/doctors')
      setDoctors(response.data)
      if (response.data.length > 0) {
        const doctorId = response.data[0].id
        setPatientFormData(prev => ({ ...prev, doctor_id: doctorId }))
        // Update bill items with the new doctor ID if they exist
        if (billItems.length > 0) {
          setBillItems(prev => prev.map(item => ({
            ...item,
            doctor_id: doctorId
          })))
        }
      }
    } catch (error) {
      toast.error('Failed to load doctors')
    }
  }

  const searchPatients = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter search term')
      return
    }

    setIsSearching(true)
    try {
      const response = await axios.get(`/patients/search/ip/${encodeURIComponent(searchQuery)}`)
      const ipPatients = response.data
      setPatients(ipPatients)
      setShowSearchResults(true)
      toast.success(`Found ${ipPatients.length} IP patients`)
    } catch (error) {
      const axiosError = error as AxiosError

      if (axiosError.response) {
        toast.error(`Search failed: ${axiosError.response.status}`)
      } else if (axiosError.request) {
        toast.error('Network error - unable to connect to server')
      } else {
        toast.error('Search failed: ' + axiosError.message)
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
      referred_by: patient.referred_by || '',
      room: patient.room || '',
      admission_date: patient.admission_date || format(new Date(), 'yyyy-MM-dd')
    })

    // Reset previous bills navigation
    setPreviousBills([])
    setCurrentBillIndex(-1)
    setShowPreviousBills(false)

    // Update bill items with selected patient's doctor ID
    setBillItems(prev => prev.map(item => ({
      ...item,
      doctor_id: patient.doctor_id
    })))

    // Load previous bills for this patient
    await fetchPreviousBills(patient.id)

    setShowSearchResults(false)
    setSearchQuery('')
    toast.success(`Patient ${patient.name} selected`)
  }

  const fetchPreviousBills = async (patientId: number) => {
    setIsLoadingBills(true)
    try {
      const response = await axios.get(`/bills/ip/${patientId}`)
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
      const response = await axios.get(`/bills/ip/details/${bill.id}`)
      const billDetails: BillDetails = response.data

      // Update current bill index
      setCurrentBillIndex(index)

      // Populate form with loaded bill data
      await populateFormWithBill(billDetails)

      toast.success(`Bill ${bill.bill_number} loaded successfully`)
    } catch (error: any) {
      console.error('Error loading bill details:', error)
      toast.error('Failed to load bill details')
      setCurrentBillIndex(-1)
    } finally {
      setIsLoadingBillDetails(false)
    }
  }

  const populateFormWithBill = async (billDetails: BillDetails) => {
    const { bill, items } = billDetails

    // Update bill form data
    setBillFormData({
      bill_type: bill.is_credit ? 'Credit' : 'Cash',
      category: bill.category || 'General',
      payment_mode: bill.is_credit ? 'Credit' : 'Cash',
      is_insurance: bill.is_insurance || false,
      is_credit: bill.is_credit || false,
      insurance_company: bill.insurance_company || '',
      policy_number: '',
      service_tax: bill.service_tax || 0,
      education_cess: bill.education_cess || 0,
      she_education_cess: bill.she_education_cess || 0
    })

    // Update patient form data (if available in bill)
    if (selectedPatient) {
      setPatientFormData(prev => ({
        ...prev,
        room: bill.room || prev.room,
        admission_date: bill.admission_date || prev.admission_date,
        doctor_id: bill.doctor_id || prev.doctor_id
      }))
    }

    // Update bill items
    if (items.length > 0) {
      const doctorId = selectedPatient?.doctor_id || patientFormData.doctor_id
      const mappedItems: BillItem[] = await Promise.all(items.map(async (item) => {
        // Find IDs for particular and department
        let particularId = ''
        let departmentId = ''
        
        // Find particular ID by name
        const particular = particulars.find(p => p.name === item.particular)
        if (particular) {
          particularId = particular.id.toString()
        } else {
          // If particular not found, try to get it from the first available
          particularId = particulars.length > 0 ? particulars[0].id.toString() : ''
        }
        
        // Find department ID by name
        const department = departments.find(d => d.name === item.department)
        if (department) {
          departmentId = department.id.toString()
        } else {
          // If department not found, try to get it from the first available
          departmentId = departments.length > 0 ? departments[0].id.toString() : ''
        }
        
        return {
          particular: particularId,
          department: departmentId,
          doctor_id: doctorId,
          amount: item.amount,
          discount_percent: item.discount_percent,
          discount_amount: item.discount_amount,
          total: item.total
        }
      }))
      setBillItems(mappedItems)
    } else {
      // If no items, use default items from billParticularsnDepts
      const doctorId = selectedPatient?.doctor_id || patientFormData.doctor_id
      const defaultItems = await Promise.all(billParticularsnDepts.map(async (PnD) => {
        // Find IDs for particular and department
        const particular = particulars.find(p => p.name === PnD.particular)
        const department = departments.find(d => d.name === PnD.department)
        
        return {
          particular: particular ? particular.id.toString() : '',
          department: department ? department.id.toString() : '',
          doctor_id: doctorId,
          amount: 0,
          discount_percent: 0,
          discount_amount: 0,
          total: 0
        }
      }))
      setBillItems(defaultItems)
    }
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
      payment_mode: 'Cash',
      is_insurance: false,
      is_credit: false,
      insurance_company: '',
      policy_number: '',
      service_tax: 0,
      education_cess: 0,
      she_education_cess: 0
    })

    // Reset bill items using billParticularsnDepts with current patient's doctor
    const doctorId = selectedPatient?.doctor_id || patientFormData.doctor_id
    const defaultItems = billParticularsnDepts.map(PnD => {
      // Find IDs for particular and department
      const particular = particulars.find(p => p.name === PnD.particular)
      const department = departments.find(d => d.name === PnD.department)
      
      return {
        particular: particular ? particular.id.toString() : '',
        department: department ? department.id.toString() : '',
        doctor_id: doctorId,
        amount: 0,
        discount_percent: 0,
        discount_amount: 0,
        total: 0
      }
    })
    setBillItems(defaultItems)

    toast('Ready to create new bill', {
      icon: '📝',
      duration: 2000
    })
  }

  const generateBillNumber = () => {
    const now = new Date()
    const dateStr = format(now, 'yyyyMMdd')
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `IP${dateStr}-${random}`
  }

  const handleBillItemChange = (index: number, field: keyof BillItem, value: any) => {
    const newItems = [...billItems]
    newItems[index] = { ...newItems[index], [field]: value }

    if (field === 'amount' || field === 'discount_percent') {
      const item = newItems[index]
      const discount = item.amount * (item.discount_percent / 100)
      item.discount_amount = discount
      item.total = item.amount - discount
    }

    setBillItems(newItems)
  }

  const addBillItem = () => {
    setBillItems([
      ...billItems,
      { 
        particular: particulars.length > 0 ? particulars[0].id.toString() : '', 
        department: departments.length > 0 ? departments[0].id.toString() : '', 
        amount: 0, 
        discount_percent: 0, 
        discount_amount: 0, 
        total: 0,
        doctor_id: selectedPatient?.doctor_id || patientFormData.doctor_id
      }
    ])
  }

  const removeBillItem = (index: number) => {
    if (billItems.length > billParticularsnDepts.length) {
      const newItems = billItems.filter((_, i) => i !== index)
      setBillItems(newItems)
    } else {
      toast.error('Cannot remove default bill items')
    }
  }

  const calculateTotals = () => {
    const totalAmount = billItems.reduce((sum, item) => sum + item.amount, 0)
    const totalDiscount = billItems.reduce((sum, item) => sum + item.discount_amount, 0)
    const subTotal = totalAmount - totalDiscount
    const netAmount = subTotal + billFormData.service_tax + billFormData.education_cess + billFormData.she_education_cess

    return { totalAmount, totalDiscount, subTotal, netAmount }
  }

  const handlePrintBill = () => {
    // Calculate total safely
    const calculateTotal = () => {
      let total = 0;
      billItems.forEach(item => {
        const amount = typeof item.amount === 'string'
          ? parseFloat(item.amount) || 0
          : typeof item.amount === 'number'
            ? item.amount
            : 0;
        total += amount;
      });
      return total.toFixed(2);
    };

    const totalAmount = calculateTotal();

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
              margin: 8px 0 0 0;
            }
            
            .header .heading {
              font-size: 20px;
              font-weight: bold;
              font-decoration: underline;
              color: #111827;
              margin: 8px 0 0 0;
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
            
            .room-icon {
              display: inline-flex;
              align-items: center;
              margin-right: 4px;
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
            
            .total-row {
              font-weight: bold;
              background-color: #f3f4f6;
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
                <div class="heading">CASH BILL</div>
              </div>
            
            <!-- Patient Information -->
            <div class="patient-info">
              <div class="patient-grid">
                <!-- Name -->
                <div class="patient-item">
                  <span class="patient-label">Name:</span>
                  <span class="patient-value">${patientFormData.name || 'N/A'}</span>
                </div>              
                <!-- BillNo -->
                <div class="patient-item">
                  <span class="patient-label">Bill No:</span>
                  <span class="patient-value">${billNumberRef.current}</span>
                </div>              
                
                <!-- Doctor -->
                <div class="patient-item">
                  <span class="patient-label">Doctor:</span>
                  <span class="patient-value">${doctors.filter(dr => dr.id == patientFormData.doctor_id).at(0)?.name || 'Not assigned'}</span>
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
                      <th>Department</th>
                      <th class="amount-column">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${billItems.map((bi, index) => {
      const particularName = getParticularName(bi.particular)
      const departmentName = getDepartmentName(bi.department)
      const displayAmount = typeof bi.amount === 'number'
        ? bi.amount.toFixed(2)
        : typeof bi.amount === 'string'
          ? (parseFloat(bi.amount) || 0).toFixed(2)
          : '0.00'

      return `
                        <tr>
                          <td>${index + 1}</td>
                          <td>${particularName}</td>
                          <td>${departmentName}</td>
                          <td class="amount-column">${displayAmount}</td>
                        </tr>
                      `;
    }).join('')}
                    
                    <!-- Total Row -->
                    <tr class="total-row">
                      <td colspan="3" style="text-align: right; padding-right: 12px;">Total Amount:</td>
                      <td class="amount-column">${totalAmount}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ` : `
              <div style="text-align: center; padding: 40px 20px; color: #6b7280; font-style: italic;">
                No bill items to display
              </div>
            `}
            
            <!-- Footer -->
            <div class="footer">
              <div class="footer-content">
                <div>
                  <div>Printed: ${new Date().toLocaleDateString()}</div>
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
    // If selected patient exists, update it, otherwise create new
    if (!selectedPatient && (!patientFormData.name || !patientFormData.age || !patientFormData.gender ||
      !patientFormData.complaint || !patientFormData.phone || !patientFormData.doctor_id ||
      !patientFormData.room)) {
      toast.error('Please fill all required patient details')
      return
    }

    // Validate Bill
    const { netAmount } = calculateTotals()
    if (netAmount <= 0) {
      toast.error('Total amount must be greater than 0')
      return
    }

    if (billFormData.is_insurance && (!billFormData.insurance_company || !billFormData.policy_number)) {
      toast.error('Please provide insurance details')
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
          patient_number: `IP-${format(new Date(), 'yyyyMM')}-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`,
          registration_date: format(new Date(), 'yyyy-MM-dd'),
          registration_time: format(currentTime, 'HH:mm:ss'),
          admission_time: format(currentTime, 'HH:mm:ss'),
          is_ip: true
        }

        const patientResponse = await axios.post('/patients', patientData)
        patientId = patientResponse.data.id
        patientNumber = patientResponse.data.patient_number
      }

      // Create IP Bill - use the persistent bill number
      const billData = {
        patient_id: patientId,
        patient_number: patientNumber,
        bill_number: billNumberRef.current, // Use the persistent bill number
        bill_type: billFormData.bill_type,
        category: billFormData.category,
        payment_mode: billFormData.payment_mode,
        is_insurance: billFormData.is_insurance,
        is_credit: billFormData.is_credit,
        insurance_company: billFormData.is_insurance ? billFormData.insurance_company : null,
        policy_number: billFormData.is_insurance ? billFormData.policy_number : null,
        service_tax: billFormData.service_tax,
        education_cess: billFormData.education_cess,
        she_education_cess: billFormData.she_education_cess,
        room: patientFormData.room,
        admission_date: patientFormData.admission_date,
        admission_time: format(currentTime, 'HH:mm:ss'),
        doctor_id: patientFormData.doctor_id,
        items: billItems.map(item => ({
          particular: item.particular,  // Send ID to backend
          department: item.department,  // Send ID to backend
          // particular: getParticularName(item.particular),  // Also send name for reference
          // department: getDepartmentName(item.department),  // Also send name for reference
          amount: item.amount,
          discount_percent: item.discount_percent
        }))
      }

      await axios.post('/bills/ip', billData)

      toast.success(`IP Bill created successfully! 
        Patient: ${patientNumber}
        Room: ${patientFormData.room}
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
    // Generate new bill number only when resetting the form
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
      referred_by: '',
      room: '',
      admission_date: format(new Date(), 'yyyy-MM-dd')
    })

    setBillFormData({
      bill_type: 'Cash',
      category: 'General',
      payment_mode: 'Cash',
      is_insurance: false,
      is_credit: false,
      insurance_company: '',
      policy_number: '',
      service_tax: 0,
      education_cess: 0,
      she_education_cess: 0
    })

    // Reset bill items using billParticularsnDepts
    const doctorId = doctors[0]?.id || 0
    const defaultItems = billParticularsnDepts.map(PnD => {
      // Find IDs for particular and department
      const particular = particulars.find(p => p.name === PnD.particular)
      const department = departments.find(d => d.name === PnD.department)
      
      return {
        particular: particular ? particular.id.toString() : '',
        department: department ? department.id.toString() : '',
        doctor_id: doctorId,
        amount: 0,
        discount_percent: 0,
        discount_amount: 0,
        total: 0
      }
    })
    setBillItems(defaultItems)

    setSearchQuery('')
    setShowSearchResults(false)
  }

  const { totalAmount, totalDiscount, subTotal, netAmount } = calculateTotals()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Building size={24} />
            <div>
              <h1 className="text-xl font-bold">Inpatient Bill Entry</h1>
              <div className="text-sm text-purple-100 opacity-90">
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
            <div className="p-3 border-b border-gray-200 bg-purple-50">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900 flex items-center">
                  <Search className="mr-2" size={18} />
                  Search IP Patient
                </h2>
                <button
                  onClick={() => setShowSearchResults(!showSearchResults)}
                  className="text-sm text-purple-600 flex items-center"
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
                      placeholder="Search by name, phone, room, complaint, referred by..."
                    />
                  </div>
                </div>
                <button
                  onClick={searchPatients}
                  disabled={isSearching}
                  className="px-4 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 disabled:opacity-50"
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
                        <th className="px-3 py-2 text-left">IP No.</th>
                        <th className="px-3 py-2 text-left">Name</th>
                        <th className="px-3 py-2 text-left">Room</th>
                        <th className="px-3 py-2 text-left">Phone</th>
                        <th className="px-3 py-2 text-left">Complaint</th>
                        <th className="px-3 py-2 text-left">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patients.map(patient => (
                        <tr key={patient.id} className="border-t hover:bg-purple-50">
                          <td className="px-3 py-2">
                            <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                              {patient.patient_number}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <div className="font-medium">{patient.name}</div>
                            <div className="text-xs text-gray-500">{patient.age} • {patient.gender}</div>
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center">
                              <Bed className="mr-1" size={14} />
                              {patient.room || 'N/A'}
                            </div>
                          </td>
                          <td className="px-3 py-2">{patient.phone}</td>
                          <td className="px-3 py-2">
                            <div className="text-xs truncate max-w-xs">{patient.complaint}</div>
                          </td>
                          <td className="px-3 py-2">
                            <button
                              onClick={() => handleSelectPatient(patient)}
                              className="px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700"
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
                  <p>No IP patients found. Try a different search.</p>
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
                  <Bed className="mr-2 text-green-600" size={18} />
                  <h2 className="font-semibold text-gray-900">Selected Inpatient</h2>
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
                  <span className="text-gray-600">Room:</span>
                  <span className="ml-2 font-medium flex items-center">
                    <Bed className="mr-1" size={14} />
                    {selectedPatient.room}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Phone:</span>
                  <span className="ml-2 font-medium">{selectedPatient.phone}</span>
                </div>
                <div>
                  <span className="text-gray-600">Doctor:</span>
                  <span className="ml-2 font-medium">{doctors.filter(dr => dr.id == selectedPatient.doctor_id).at(0)?.name}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-600">Address:</span>
                  <span className="ml-2 font-medium">
                    {[selectedPatient.house, selectedPatient.street, selectedPatient.place].filter(Boolean).join(', ')}
                  </span>
                </div>
                <div className="col-span-4">
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
                        <th className="px-3 py-2 text-left">Room</th>
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
                          <td className="px-3 py-2">{bill.room}</td>
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
            <div className="p-3 border-b border-gray-200 bg-purple-50">
              <h2 className="font-semibold text-gray-900">New Inpatient Details</h2>
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
                  <label className="block text-xs text-gray-600 mb-1">Room/Ward *</label>
                  <input
                    type="text"
                    value={patientFormData.room}
                    onChange={(e) => setPatientFormData({ ...patientFormData, room: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                    placeholder="ICU-101"
                  />
                </div>

                {/* Row 2 */}
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Admission Date</label>
                  <input
                    type="date"
                    value={patientFormData.admission_date}
                    onChange={(e) => setPatientFormData({ ...patientFormData, admission_date: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                  />
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

                <div>
                  <label className="block text-xs text-gray-600 mb-1">Doctor *</label>
                  <select
                    value={patientFormData.doctor_id}
                    onChange={(e) => setPatientFormData({ ...patientFormData, doctor_id: parseInt(e.target.value) })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                  >
                    {doctors.map(doctor => (
                      <option key={doctor.id} value={doctor.id}>{doctor.name}</option>
                    ))}
                  </select>
                </div>

                {/* Row 3 */}
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
                  <label className="block text-xs text-gray-600 mb-1">Referred By</label>
                  <input
                    type="text"
                    value={patientFormData.referred_by}
                    onChange={(e) => setPatientFormData({ ...patientFormData, referred_by: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                    placeholder="Referred by"
                  />
                </div>

                {/* Row 4 */}
                <div className="col-span-4">
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
          <div className="p-3 border-b border-gray-200 bg-indigo-50">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Bill Entry</h2>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={billFormData.is_insurance}
                    onChange={(e) => setBillFormData({ ...billFormData, is_insurance: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label className="text-sm text-gray-600">Insurance</label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={billFormData.is_credit}
                    onChange={(e) => setBillFormData({ ...billFormData, is_credit: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label className="text-sm text-gray-600">Credit</label>
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
              </div>
            </div>
          </div>

          <div className="p-3">
            {/* Insurance Details */}
            {billFormData.is_insurance && (
              <div className="mb-3 p-2 border border-yellow-200 bg-yellow-50 rounded">
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Insurance Co.</label>
                    <input
                      type="text"
                      value={billFormData.insurance_company}
                      onChange={(e) => setBillFormData({ ...billFormData, insurance_company: e.target.value })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      placeholder="Company"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Policy No.</label>
                    <input
                      type="text"
                      value={billFormData.policy_number}
                      onChange={(e) => setBillFormData({ ...billFormData, policy_number: e.target.value })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      placeholder="Policy number"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Bill Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200 text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-2 py-2 border text-center">#</th>
                    <th className="px-2 py-2 border text-left">Particular</th>
                    <th className="px-2 py-2 border text-left">Department</th>
                    <th className="px-2 py-2 border text-center">Amount</th>
                    <th className="px-2 py-2 border text-center">Dis%</th>
                    <th className="px-2 py-2 border text-center">Disc Amt</th>
                    <th className="px-2 py-2 border text-center">Total</th>
                    <th className="px-2 py-2 border text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {billItems.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-2 py-1.5 border text-center">{index + 1}</td>
                      <td className="px-2 py-1.5 border">
                        <div className="relative">
                          <select
                            value={item.particular}  // This stores the ID
                            onChange={(e) => handleBillItemChange(index, 'particular', e.target.value)}
                            className="w-full px-1 py-0.5 border border-gray-300 rounded text-xs appearance-none pr-6"
                          >
                            <option value="">Select Particular</option>
                            {particulars.map((particular) => (
                              <option key={particular.id} value={particular.id.toString()}>
                                {particular.name}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={12} />
                          <div className="absolute left-1 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 pointer-events-none">
                            {getParticularName(item.particular)}
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-1.5 border">
                        <div className="relative">
                          <select
                            value={item.department}  // This stores the ID
                            onChange={(e) => handleBillItemChange(index, 'department', e.target.value)}
                            className="w-full px-1 py-0.5 border border-gray-300 rounded text-xs appearance-none pr-6"
                          >
                            <option value="">Select Department</option>
                            {departments.map((department) => (
                              <option key={department.id} value={department.id.toString()}>
                                {department.name}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={12} />
                          <div className="absolute left-1 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 pointer-events-none">
                            {getDepartmentName(item.department)}
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-1.5 border">
                        <input
                          type="text"
                          value={item.amount}
                          onChange={(e) => handleBillItemChange(index, 'amount', parseFloat(e.target.value) || 0)}
                          className="w-full px-1 py-0.5 border border-gray-300 rounded text-xs text-center"
                        />
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
                        {billItems.length > billParticularsnDepts.length && (
                          <button
                            onClick={() => removeBillItem(index)}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            ×
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center mt-3">
              <button
                onClick={addBillItem}
                className="px-3 py-1.5 bg-purple-100 text-purple-700 text-sm rounded hover:bg-purple-200"
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
                  <div className="text-gray-600">
                    Sub Total: <span className="font-bold text-gray-900">₹{subTotal.toFixed(2)}</span>
                  </div>
                  <div className="text-lg font-bold text-green-700">
                    Net: ₹{netAmount.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            {/* Tax Section */}
            <div className="mt-3 p-2 border border-blue-200 bg-blue-50 rounded">
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Service Tax</label>
                  <input
                    type="text"
                    step="0.01"
                    value={billFormData.service_tax}
                    onChange={(e) => setBillFormData({ ...billFormData, service_tax: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Ed. Cess</label>
                  <input
                    type="text"
                    step="0.01"
                    value={billFormData.education_cess}
                    onChange={(e) => setBillFormData({ ...billFormData, education_cess: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">SH Ed. Cess</label>
                  <input
                    type="text"
                    step="0.01"
                    value={billFormData.she_education_cess}
                    onChange={(e) => setBillFormData({ ...billFormData, she_education_cess: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  />
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
                  Patient: {selectedPatient.name} ({selectedPatient.patient_number}) | Room: {selectedPatient.room}
                </span>
              ) : patientFormData.name ? (
                <span className="text-purple-600 font-medium">
                  New Inpatient: {patientFormData.name} | Room: {patientFormData.room}
                </span>
              ) : (
                'Enter inpatient details or search existing inpatient'
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
                onClick={() => handlePrintBill()}
                className="px-4 py-2 border border-blue-300 text-blue-700 text-sm rounded hover:bg-blue-50"
              >
                Print
              </button>

              <button
                onClick={handleSaveBill}
                disabled={isLoading}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm rounded hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50"
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

export default IPBillEntry