import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Save, X, Search, Trash2, User, Phone, MapPin, /*CalendarClock,*/ Building, FileText, UserCheck, /*Home,*/ Clock, Users, Eye, Loader2, Bed, Stethoscope, Calendar, /*AlertCircle, FileEdit,*/ UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import type { AxiosError } from 'axios'

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
  doctor_id: number
  doctor_name?: string
  registration_date?: string
  is_ip: boolean
}

interface PatientFormData {
  name: string
  age: string
  gender: 'Male' | 'Female' | 'Other'
  complaint: string
  house: string
  street: string
  place: string
  phone: string
  doctor_id: number
  referred_by: string
  room: string
  is_ip: boolean
}

const PatientRegistration = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const type = searchParams.get('type') || 'ip'
  const isIP = type === 'ip'

  const [formData, setFormData] = useState<PatientFormData>({
    name: '',
    age: '',
    gender: 'Male',
    complaint: '',
    house: '',
    street: '',
    place: '',
    phone: '',
    doctor_id: 0,
    referred_by: '',
    room: '',
    is_ip: isIP
  })

  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [isLoading, setIsLoading] = useState(false)
  // const [currentTime, setCurrentTime] = useState(new Date())
  const [searchTerm, setSearchTerm] = useState('')
  const [showPatientList, setShowPatientList] = useState(false)
  const [patients, setPatients] = useState<Patient[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [patientNumber, setPatientNumber] = useState<string>('')

  useEffect(() => {
    fetchDoctors()
    // const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    generateNewPatientNumber()
    // return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      is_ip: isIP,
      room: isIP ? prev.room : ''
    }))
    
    generateNewPatientNumber()
    setSelectedPatient(null)
    setShowPatientList(false)
    setPatients([])
  }, [isIP])

  const generatePatientNumber = (): string => {
    const now = new Date()
    const yearMonth = format(now, 'yyyyMM')
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return isIP
      ? `IP-${yearMonth}-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`
      : `OP-${yearMonth}-${random}`
  }

  const generateNewPatientNumber = () => {
    setPatientNumber(generatePatientNumber())
  }

  const fetchDoctors = async () => {
    try {
      const response = await axios.get('/doctors')
      setDoctors(response.data)
      if (response.data.length > 0) {
        setFormData(prev => ({ ...prev, doctor_id: response.data[0].id }))
      }
    } catch (error) {
      toast.error('Failed to load doctors')
    }
  }

  // const toggleRegistrationType = () => {
  //   const newType = isIP ? 'op' : 'ip'
  //   setSearchParams({ type: newType })
  // }

  const fetchAllPatients = async () => {
    setIsSearching(true)
    try {
      const response = await axios.get('/patients')
      setPatients(response.data)
      setShowPatientList(true)
    } catch (error: any) {
      console.error('Error fetching all patients:', error)
      toast.error('Failed to load patients')
      setPatients([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleShowAllPatients = async () => {
    if (showPatientList) {
      setShowPatientList(false)
    } else {
      await fetchAllPatients()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.age || !formData.gender || !formData.complaint || !formData.phone || !formData.doctor_id) {
      toast.error('Please fill required fields')
      return
    }

    if (isIP && !formData.room) {
      toast.error('Room/Ward is required for inpatient registration')
      return
    }

    setIsLoading(true)

    try {
      const patientData = {
        ...formData,
        patient_number: patientNumber,
        registration_date: format(new Date(), 'yyyy-MM-dd'),
        registration_time: format(new Date(), 'HH:mm:ss')

      }

      await axios.post('/patients', patientData)

      toast.success(`Patient registered successfully! ${isIP ? 'IP' : 'OP'} Number: ${patientNumber}`)

      setFormData({
        name: '',
        age: '',
        gender: 'Male',
        complaint: '',
        house: '',
        street: '',
        place: '',
        phone: '',
        doctor_id: doctors[0]?.id || 0,
        referred_by: '',
        room: '',
        is_ip: isIP
      })
      setSearchTerm('')
      setSelectedPatient(null)
      generateNewPatientNumber()

      setTimeout(() => {
        navigate('/dashboard')
      }, 2000)

    } catch (error: any) {
      console.error('Registration error:', error)
      if (error.response?.status === 400) {
        toast.error(error.response?.data?.detail || 'Invalid data. Please check all fields.')
      } else if (error.response?.status === 409) {
        toast.error('Patient with similar details already exists')
      } else if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.')
        navigate('/login')
      } else {
        toast.error('Registration failed. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearchPatients = async () => {
    if (!searchTerm.trim()) {
      toast.error('Please enter search term')
      return
    }

    setIsSearching(true)
    try {
      const response = await axios.get(`/patients/search?query=${searchTerm}`)
      setPatients(response.data)
      setShowPatientList(true)
      toast.success(`Found ${response.data.length} patients`)
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
  setIsSearching(false)
} finally {
  setIsSearching(false)
}
  }

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient)
    setFormData({
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      complaint: patient.complaint,
      house: '',
      street: '',
      place: '',
      phone: patient.phone,
      doctor_id: patient.doctor_id,
      referred_by: '',
      room: '',
      is_ip: isIP
    })
    setShowPatientList(false)
    toast.success(`Loaded data for ${patient.name}`)
  }

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to clear this form?')) {
      setFormData({
        name: '',
        age: '',
        gender: 'Male',
        complaint: '',
        house: '',
        street: '',
        place: '',
        phone: '',
        doctor_id: doctors[0]?.id || 0,
        referred_by: '',
        room: '',
        is_ip: isIP
      })
      setSearchTerm('')
      setSelectedPatient(null)
      setPatients([])
      setShowPatientList(false)
      generateNewPatientNumber()
      toast.success('Form cleared successfully')
    }
  }

  const handleViewPatient = (patientId: number) => {
    navigate(`/patients/${patientId}`)
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header with Stats - Matching DoctorMaster */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <UserPlus className="mr-3 text-blue-600" size={28} />
              Patient Registration
            </h1>
            <p className="text-gray-600 mt-1">Register new patients for outpatient or inpatient services</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg shadow-md"
          >
            <X size={20} className="mr-2" />
            Back to Dashboard
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                <FileText className="text-blue-600" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-600">{isIP ? 'IP Number' : 'OP Number'}</p>
                <p className="text-2xl font-bold text-gray-900">{patientNumber}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg mr-3">
                <Calendar className="text-green-600" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Registration Date</p>
                <p className="text-2xl font-bold text-gray-900">{format(new Date(), 'dd/MM/yyyy')}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg mr-3">
                <Clock className="text-purple-600" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Registration Time</p>
                <p className="text-2xl font-bold text-gray-900">{format(new Date(), 'HH:mm:ss')}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 rounded-lg mr-3">
                <Building className="text-indigo-600" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Registration Type</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isIP ? 'INPATIENT' : 'OUTPATIENT'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Registration Type Toggle */}
        <div className="mt-4 flex items-center justify-center">
          <div className="bg-white rounded-lg p-2 inline-flex border border-gray-200">
            <button
              onClick={() => setSearchParams({ type: 'ip' })}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${isIP 
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm' 
                : 'text-gray-700 hover:bg-gray-50'}`}
            >
              <Bed size={18} className="inline mr-2" />
              Inpatient (IP)
            </button>
            <button
              onClick={() => setSearchParams({ type: 'op' })}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${!isIP 
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm' 
                : 'text-gray-700 hover:bg-gray-50'}`}
            >
              <Stethoscope size={18} className="inline mr-2" />
              Outpatient (OP)
            </button>
          </div>
        </div>
      </div>

      {/* Main Form Section - Matching DoctorMaster */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <UserPlus className="mr-2 text-blue-600" size={24} />
                Patient Information
              </h2>
              <p className="text-gray-600 mt-1">
                Fill in the patient details for {isIP ? 'inpatient admission' : 'outpatient consultation'}
              </p>
            </div>
            
            {/* Search Patients Section */}
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearchPatients()}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                  placeholder="Search existing patients..."
                />
              </div>
              <button
                type="button"
                onClick={handleSearchPatients}
                disabled={isSearching}
                className="btn-secondary hover:bg-gray-200 px-3"
              >
                {isSearching ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Search size={18} />
                )}
              </button>
              <button
                type="button"
                onClick={handleShowAllPatients}
                disabled={isSearching}
                className="btn-secondary hover:bg-gray-200 px-3"
              >
                {isSearching ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Users size={18} />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Patient List Overlay */}
        {showPatientList && (
          <div className="px-6 pt-4">
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Users className="mr-2" size={20} />
                  {searchTerm ? 'Search Results' : 'All Patients'}
                </h3>
                <button
                  onClick={() => setShowPatientList(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>

              {patients.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="mx-auto mb-3" size={40} />
                  <p>No patients found. {searchTerm ? 'Try a different search term.' : 'No patients in the system yet.'}</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {patients.map((patient) => (
                    <div
                      key={patient.id}
                      className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      <div className="flex items-center flex-1">
                        <div className={`w-2 h-2 rounded-full mr-3 ${patient.is_ip ? 'bg-purple-500' : 'bg-blue-500'}`} />
                        <div>
                          <div className="flex items-center">
                            <h4 className="font-medium text-gray-900">{patient.name}</h4>
                            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">
                              {patient.patient_number}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">
                            Age: {patient.age} • Gender: {patient.gender} • Phone: {patient.phone}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleSelectPatient(patient)}
                          className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                        >
                          Use
                        </button>
                        <button
                          onClick={() => handleViewPatient(patient.id)}
                          className="text-sm border border-gray-300 px-3 py-1 rounded hover:bg-gray-100"
                        >
                          <Eye size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Selected Patient Info */}
        {selectedPatient && (
          <div className="px-6 pt-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <UserCheck className="text-green-600 mr-3" size={20} />
                  <div>
                    <h3 className="font-semibold text-green-900">
                      Using data from: {selectedPatient.name}
                    </h3>
                    <p className="text-sm text-green-700">
                      {selectedPatient.patient_number} • {selectedPatient.age} • {selectedPatient.gender}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedPatient(null)
                    setFormData({
                      name: '',
                      age: '',
                      gender: 'Male',
                      complaint: '',
                      house: '',
                      street: '',
                      place: '',
                      phone: '',
                      doctor_id: doctors[0]?.id || 0,
                      referred_by: '',
                      room: '',
                      is_ip: isIP
                    })
                  }}
                  className="text-sm text-green-700 hover:text-green-900"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center pb-2 border-b">
              <User className="mr-2 text-blue-600" size={20} />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-900">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field px-2 py-1.5 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Enter patient's full name"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-900">
                  Age *
                </label>
                <input
                  type="text"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  className="input-field px-2 py-1.5 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="e.g., 30 years, 6 months, 7 days"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-900">
                  Gender *
                </label>
                <div className="flex space-x-4 mt-2">
                  {['Male', 'Female', 'Other'].map((gender) => (
                    <label key={gender} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="gender"
                        checked={formData.gender === gender}
                        onChange={() => setFormData({ ...formData, gender: gender as any })}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="text-gray-700">{gender}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="md:col-span-3 space-y-2">
                <label className="block text-sm font-medium text-gray-900">
                  Complaint (C/O) *
                </label>
                <textarea
                  value={formData.complaint}
                  onChange={(e) => setFormData({ ...formData, complaint: e.target.value })}
                  className="input-field px-2 py-1.5 border-gray-300 focus:border-blue-500 focus:ring-blue-500 w-full"
                  rows={3}
                  placeholder="Describe the patient's complaint"
                  required
                />
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center pb-2 border-b">
              <MapPin className="mr-2 text-green-600" size={20} />
              Address Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-900">
                  House/Flat No.
                </label>
                <input
                  type="text"
                  value={formData.house}
                  onChange={(e) => setFormData({ ...formData, house: e.target.value })}
                  className="input-field px-2 py-1.5 border-gray-300 focus:border-green-500 focus:ring-green-500"
                  placeholder="House number"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-900">
                  Street
                </label>
                <input
                  type="text"
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  className="input-field px-2 py-1.5 border-gray-300 focus:border-green-500 focus:ring-green-500"
                  placeholder="Street name"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-900">
                  Place *
                </label>
                <input
                  type="text"
                  value={formData.place}
                  onChange={(e) => setFormData({ ...formData, place: e.target.value })}
                  className="input-field px-2 py-1.5 border-gray-300 focus:border-green-500 focus:ring-green-500"
                  placeholder="City/Town"
                  required
                />
              </div>
            </div>
          </div>

          {/* Contact & Medical Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center pb-2 border-b">
              <Phone className="mr-2 text-purple-600" size={20} />
              Contact & Medical Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-900">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input-field px-2 py-1.5 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                  placeholder="10-digit mobile number"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-900">
                  Consulting Doctor *
                </label>
                <select
                  value={formData.doctor_id}
                  onChange={(e) => setFormData({ ...formData, doctor_id: parseInt(e.target.value) })}
                  className="input-field px-2 py-1.5 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                  required
                >
                  {Array.isArray(doctors) && doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.name} ({doctor.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-900">
                  Referred By
                </label>
                <input
                  type="text"
                  value={formData.referred_by}
                  onChange={(e) => setFormData({ ...formData, referred_by: e.target.value })}
                  className="input-field px-2 py-1.5 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                  placeholder="Referring doctor/clinic"
                />
              </div>

              {isIP && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-900">
                    Room/Ward *
                  </label>
                  <input
                    type="text"
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    className="input-field px-2 py-1.5 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    placeholder="e.g., ICU-101, Ward-2A"
                    required={isIP}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Form Actions - Matching DoctorMaster */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={handleDelete}
              className="px-6 py-2.5 border border-red-300 rounded-lg font-medium text-red-700 hover:bg-red-50 transition-colors flex items-center"
            >
              <Trash2 size={20} className="mr-2" />
              Clear Form
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`px-6 py-2.5 text-white font-medium rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center shadow-md ${
                isIP 
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700' 
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
              }`}
            >
              {isLoading ? (
                <Loader2 className="animate-spin mr-2" size={20} />
              ) : (
                <Save size={20} className="mr-2" />
              )}
              {isLoading ? 'Registering...' : `Register as ${isIP ? 'IP' : 'OP'}`}
            </button>
          </div>
        </form>
      </div>

      {/* Patient List Summary - Optional if you want to show quick stats */}
      {!showPatientList && patients.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Users className="text-gray-400 mr-3" size={20} />
              <span className="text-sm text-gray-600">
                Found <span className="font-semibold">{patients.length}</span> patients in search
              </span>
            </div>
            <button
              onClick={() => setShowPatientList(true)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Show all
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default PatientRegistration