import { useState, useEffect } from 'react'
import axios from 'axios'
import { Save, Trash2, Plus, Edit, X, Search, Phone, Mail, Clock, BriefcaseMedical, Stethoscope, User } from 'lucide-react'
import toast from 'react-hot-toast'

interface Department{  
  id?: number
  name: string
}

interface Doctor {
  id?: number
  code: string
  name: string
  address: string
  qualification: string
  phone: string
  email: string
  specialty: string
  department: string
  op_validity: number
  booking_code: string
  max_tokens: number
  doctor_amount: number
  hospital_amount: number
  doctor_revisit: number
  hospital_revisit: number
  from_time: string
  to_time: string
  is_resigned: boolean
  is_discontinued: boolean
  resignation_date?: string
}

const DoctorMaster = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    fetchDepartments()
    fetchDoctors()
  }, [])
const [formData, setFormData] = useState<Doctor>({
    code: '',
    name: '',
    address: '',
    qualification: '',
    phone: '',
    email: '',
    specialty: '',
    department: String(departments.at(0)?.id),
    op_validity: 30,
    booking_code: '',
    max_tokens: 50,
    doctor_amount: 0,
    hospital_amount: 0,
    doctor_revisit: 0,
    hospital_revisit: 0,
    from_time: '09:00',
    to_time: '17:00',
    is_resigned: false,
    is_discontinued: false,
    resignation_date: ''
  })

  const fetchDoctors = async () => {
    try {
      const response = await axios.get('/doctors', {
        params: { active_only: false }
      })
      setDoctors(response.data)
    } catch (error) {
      console.error('Error fetching doctors:', error)
      toast.error('Failed to load doctors')
    }
  }

  const fetchDepartments = async () => {
    try {
      const response = await axios.get('/settings/departments', {
        params: { active_only: false }
      })
      setDepartments(response.data)
    } catch (error) {
      console.error('Error fetching doctors:', error)
      toast.error('Failed to load doctors')
    }
  }

  const generateDoctorCode = () => {
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `DR${random}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.code || !formData.name || !formData.specialty || !formData.department) {
      toast.error('Please fill required fields')
      return
    }

    setIsLoading(true)

    try {
      console.log('Current token:', localStorage.getItem('token'))

      if (isEditing && formData.id) {
        await axios.put(`/doctors/${formData.id}`, formData)
        toast.success('Doctor updated successfully')
      } else {
        await axios.post('/doctors', {
          ...formData,
          code: formData.code || generateDoctorCode()
        })
        toast.success('Doctor added successfully')
      }

      resetForm()
      fetchDoctors()
      setShowForm(false)
    } catch (error: any) {
      console.error('Full error:', error)
      toast.error(error.response?.data?.detail || 'Operation failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (doctor: Doctor) => {
    setFormData({
      ...doctor,
      resignation_date: doctor.resignation_date || ''
    })
    setIsEditing(true)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this doctor?')) return

    try {
      await axios.delete(`/doctors/${id}`)
      toast.success('Doctor deleted successfully')
      fetchDoctors()
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete doctor')
    }
  }

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      address: '',
      qualification: '',
      phone: '',
      email: '',
      specialty: '',
      department: '',
      op_validity: 1,
      booking_code: '',
      max_tokens: 50,
      doctor_amount: 0,
      hospital_amount: 0,
      doctor_revisit: 0,
      hospital_revisit: 0,
      from_time: '09:00',
      to_time: '17:00',
      is_resigned: false,
      is_discontinued: false,
      resignation_date: ''
    })
    setIsEditing(false)
    setShowForm(false)
  }

  const filteredDoctors = doctors.filter(doctor =>
    doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.phone.includes(searchTerm)
  )

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header with Stats */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Stethoscope className="mr-3 text-blue-600" size={28} />
              Doctor Master
            </h1>
            <p className="text-gray-600 mt-1">Manage hospital doctors and their consultation details</p>
          </div>
          <button
            onClick={() => {
              resetForm()
              setShowForm(true)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            className="
    flex items-center
    bg-gradient-to-r from-blue-600 to-indigo-600
    hover:from-blue-700 hover:to-indigo-700
    text-white p-2 rounded-lg shadow-md
  "
          >
            <Plus size={20} className="mr-2" />
            Add New Doctor
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg mr-3">
                <User className="text-green-600" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Doctors</p>
                <p className="text-2xl font-bold text-gray-900">{doctors.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                <BriefcaseMedical className="text-blue-600" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900">
                  {doctors.filter(d => !d.is_resigned && !d.is_discontinued).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg mr-3">
                <Clock className="text-yellow-600" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Available Today</p>
                <p className="text-2xl font-bold text-gray-900">
                  {doctors.filter(d => !d.is_resigned && !d.is_discontinued).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg mr-3">
                <Stethoscope className="text-purple-600" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Departments</p>
                <p className="text-2xl font-bold text-gray-900">
                  {[...new Set(doctors.map(d => d.department))].length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Doctor Form Section */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  {isEditing ? '✏️ Edit Doctor Details' : '➕ Add New Doctor'}
                </h2>
                <p className="text-gray-600 mt-1">
                  {isEditing ? 'Update doctor information' : 'Fill in the details to add a new doctor'}
                </p>
              </div>
              <button
                onClick={resetForm}
                className="btn-secondary hover:bg-gray-200"
              >
                <X size={20} />
              </button>
            </div>
          </div>

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
                    Doctor Code *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="input-field px-2 py-1.5 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="JS"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-900">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field px-2 py-1.5 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="John Smith"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-900">
                    Qualification
                  </label>
                  <input
                    type="text"
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    className="input-field px-2 py-1.5 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="MBBS, MD"
                  />
                </div>
              </div>
            </div>

            {/* Medical Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center pb-2 border-b">
                <Stethoscope className="mr-2 text-green-600" size={20} />
                Medical Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-900">
                    Specialty *
                  </label>
                  <input
                    type="text"
                    value={formData.specialty}
                    onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                    className="input-field px-2 py-1.5 border-gray-300 focus:border-green-500 focus:ring-green-500"
                    placeholder="Cardiology"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-900">
                    Department *
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: String(e.target.value) })}
                    className="input-field px-2 py-1.5 border-gray-300 focus:border-green-500 focus:ring-green-500"
                    required
                  >
                    <option value="0">Please select a department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center pb-2 border-b">
                <Phone className="mr-2 text-purple-600" size={20} />
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-900">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input-field px-2 py-1.5 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    placeholder="10-digit mobile number"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-900">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input-field px-2 py-1.5 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    placeholder="doctor@hospital.com"
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="block text-sm font-medium text-gray-900">
                    Address
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="input-field px-2 py-1.5 w-full border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    rows={2}
                    placeholder="Full address"
                  />
                </div>
              </div>
            </div>

            {/* Schedule & Practice Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center pb-2 border-b">
                <Clock className="mr-2 text-orange-600" size={20} />
                Schedule & Practice Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-900">
                    From Time
                  </label>
                  <input
                    type="time"
                    value={formData.from_time}
                    onChange={(e) => setFormData({ ...formData, from_time: e.target.value })}
                    className="input-field px-2 py-1.5 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-900">
                    To Time
                  </label>
                  <input
                    type="time"
                    value={formData.to_time}
                    onChange={(e) => setFormData({ ...formData, to_time: e.target.value })}
                    className="input-field px-2 py-1.5 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-900">
                    OP Validity (days)
                  </label>
                  <input
                    type="number"
                    value={formData.op_validity}
                    onChange={(e) => setFormData({ ...formData, op_validity: parseInt(e.target.value) })}
                    className="input-field px-2 py-1.5 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-900">
                    Max Tokens/Day
                  </label>
                  <input
                    type="number"
                    value={formData.max_tokens}
                    onChange={(e) => setFormData({ ...formData, max_tokens: parseInt(e.target.value) })}
                    className="input-field px-2 py-1.5 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>

                <div className="space-y-2 hidden">
                  <label className="block text-sm font-medium text-gray-900">
                    Booking Code
                  </label>
                  <input
                    type="text"
                    value={formData.booking_code}
                    onChange={(e) => setFormData({ ...formData, booking_code: e.target.value })}
                    className="input-field px-2 py-1.5 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                    placeholder="GP01"
                  />
                </div>
              </div>
            </div>

            {/* Fee Structure */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center pb-2 border-b">
                <span className="mr-2">💰</span>
                Fee Structure (₹)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-900">
                    Doctor Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.doctor_amount}
                    onChange={(e) => setFormData({ ...formData, doctor_amount: parseFloat(e.target.value) })}
                    className="input-field px-2 py-1.5 border-gray-300 focus:border-yellow-500 focus:ring-yellow-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-900">
                    Hospital Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.hospital_amount}
                    onChange={(e) => setFormData({ ...formData, hospital_amount: parseFloat(e.target.value) })}
                    className="input-field px-2 py-1.5 border-gray-300 focus:border-yellow-500 focus:ring-yellow-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-900">
                    Doctor Revisit
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.doctor_revisit}
                    onChange={(e) => setFormData({ ...formData, doctor_revisit: parseFloat(e.target.value) })}
                    className="input-field px-2 py-1.5 border-gray-300 focus:border-yellow-500 focus:ring-yellow-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-900">
                    Hospital Revisit
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.hospital_revisit}
                    onChange={(e) => setFormData({ ...formData, hospital_revisit: parseFloat(e.target.value) })}
                    className="input-field px-2 py-1.5 border-gray-300 focus:border-yellow-500 focus:ring-yellow-500"
                  />
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center pb-2 border-b">
                <span className="mr-2">📊</span>
                Status
              </h3>
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center space-x-3">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={formData.is_resigned}
                      onChange={(e) => setFormData({ ...formData, is_resigned: e.target.checked })}
                      className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">Resigned</span>
                    <p className="text-sm text-gray-500">Doctor has left the hospital</p>
                  </div>
                </label>

                <label className="flex items-center space-x-3">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={formData.is_discontinued}
                      onChange={(e) => setFormData({ ...formData, is_discontinued: e.target.checked })}
                      className="w-5 h-5 rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                    />
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">Discontinued</span>
                    <p className="text-sm text-gray-500">Temporarily not practicing</p>
                  </div>
                </label>

                {formData.is_resigned && (
                  <div className="w-full space-y-2">
                    <label className="block text-sm font-medium text-gray-900">
                      Resignation Date
                    </label>
                    <input
                      type="date"
                      value={formData.resignation_date}
                      onChange={(e) => setFormData({ ...formData, resignation_date: e.target.value })}
                      className="input-field px-2 py-1.5 border-gray-300 focus:border-red-500 focus:ring-red-500 w-64"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center shadow-md"
              >
                <Save size={20} className="mr-2" />
                {isLoading ? 'Saving...' : (isEditing ? 'Update Doctor' : 'Save Doctor')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Doctor List Section */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Doctor Directory</h2>
              <p className="text-gray-600 mt-1">Search and manage all hospital doctors</p>
            </div>
            <div className="text-lg font-semibold text-gray-900">
              Total: <span className="text-blue-600">{filteredDoctors.length}</span> doctors
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search doctors by name, code, specialty, department, or phone..."
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Doctors Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                  Doctor Details
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                  Speciality
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                  Schedule
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredDoctors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Stethoscope className="text-gray-400 mb-3" size={48} />
                      <h3 className="text-lg font-medium text-gray-900 mb-1">
                        {searchTerm ? 'No doctors found' : 'No doctors added yet'}
                      </h3>
                      <p className="text-gray-600">
                        {searchTerm ? 'Try a different search term' : 'Click "Add New Doctor" to get started'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDoctors.map((doctor) => (
                  <tr key={doctor.id} className="hover:bg-blue-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                            <span className="font-bold text-blue-600">DR</span>
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{doctor.name}</div>
                            <div className="text-sm text-gray-600">
                              <span className="font-medium text-gray-900">{doctor.code}</span> • {doctor.qualification}
                            </div>
                            <div className="text-sm text-gray-500">{doctor.department}</div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900 font-medium">{doctor.specialty}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-900">
                          <Phone size={14} className="mr-2 text-gray-400" />
                          {doctor.phone}
                        </div>
                        <div className="flex items-center text-sm text-gray-900">
                          <Mail size={14} className="mr-2 text-gray-400" />
                          {doctor.email || 'Not provided'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-900">
                          <Clock size={14} className="mr-2 text-gray-400" />
                          {doctor.from_time} - {doctor.to_time}
                        </div>
                        <div className="text-xs text-gray-500">
                          Max {doctor.max_tokens} tokens • {doctor.op_validity} days validity
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${doctor.is_resigned
                          ? 'bg-red-100 text-red-800'
                          : doctor.is_discontinued
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                        {doctor.is_resigned ? 'Resigned' : doctor.is_discontinued ? 'Discontinued' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(doctor)}
                          className="inline-flex items-center px-3 py-1.5 border border-blue-300 text-sm font-medium rounded-lg text-blue-700 bg-white hover:bg-blue-50 transition-colors"
                        >
                          <Edit size={14} className="mr-1.5" />
                          Edit
                        </button>
                        <button
                          onClick={() => doctor.id && handleDelete(doctor.id)}
                          className="inline-flex items-center px-3 py-1.5 border border-red-300 text-sm font-medium rounded-lg text-red-700 bg-white hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={14} className="mr-1.5" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Summary Footer */}
        {filteredDoctors.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing <span className="font-semibold">{filteredDoctors.length}</span> doctors
              </div>
              <div className="flex items-center space-x-6">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                  <span className="text-sm text-gray-600">
                    Active: <span className="font-semibold">{doctors.filter(d => !d.is_resigned && !d.is_discontinued).length}</span>
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                  <span className="text-sm text-gray-600">
                    Discontinued: <span className="font-semibold">{doctors.filter(d => d.is_discontinued).length}</span>
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                  <span className="text-sm text-gray-600">
                    Resigned: <span className="font-semibold">{doctors.filter(d => d.is_resigned).length}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DoctorMaster