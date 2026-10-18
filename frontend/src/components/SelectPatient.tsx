import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Search, X, Check } from 'lucide-react'
import toast from 'react-hot-toast'

interface Patient {
  id: number
  op_number: string
  ip_number: string | null
  name: string
  house: string
  street: string
  place: string
  phone: string
  room: string | null
}

const SelectPatient = () => {
  const navigate = useNavigate()
  const [patients, setPatients] = useState<Patient[]>([])
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [searchBy, setSearchBy] = useState('name')
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)

  useEffect(() => {
    fetchPatients()
  }, [])

  useEffect(() => {
    filterPatients()
  }, [searchTerm, searchBy, patients])

  const fetchPatients = async () => {
    try {
      const response = await axios.get('/patients')
      setPatients(response.data)
      setFilteredPatients(response.data)
    } catch (error) {
      toast.error('Failed to load patients')
    } finally {
      setIsLoading(false)
    }
  }

  const filterPatients = () => {
    if (!searchTerm.trim()) {
      setFilteredPatients(patients)
      return
    }

    const filtered = patients.filter(patient => {
      const searchValue = searchTerm.toLowerCase()
      const patientValue = (patient[searchBy as keyof Patient] || '').toString().toLowerCase()
      return patientValue.includes(searchValue)
    })
    
    setFilteredPatients(filtered)
  }

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient)
  }

  const handleConfirm = () => {
    if (selectedPatient) {
      // Pass selected patient data back to parent (you might want to use context or callbacks)
      toast.success(`Selected: ${selectedPatient.name}`)
      navigate(-1) // Go back to previous page
    } else {
      toast.error('Please select a patient')
    }
  }

  const searchOptions = [
    { value: 'name', label: 'Name' },
    { value: 'op_number', label: 'OP Number' },
    { value: 'ip_number', label: 'IP Number' },
    { value: 'phone', label: 'Phone' },
    { value: 'place', label: 'Place' },
    { value: 'room', label: 'Room' }
  ]

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-6xl">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Select Patient</h2>
            <button
              onClick={() => navigate(-1)}
              className="btn-secondary"
            >
              <X size={20} />
            </button>
          </div>

          {/* Search Bar */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex space-x-4">
              <div className="w-48">
                <select
                  value={searchBy}
                  onChange={(e) => setSearchBy(e.target.value)}
                  className="input-field px-2 py-1.5"
                >
                  {searchOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      Search by {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex-1">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={`Enter ${searchOptions.find(o => o.value === searchBy)?.label.toLowerCase()}...`}
                  className="input-field px-2 py-1.5"
                />
              </div>
              
              <button
                onClick={filterPatients}
                className="btn-primary flex items-center"
              >
                <Search size={20} className="mr-2" />
                Search
              </button>
            </div>
          </div>

          {/* Patient Grid/Table */}
          <div className="mb-6">
            {/* Mobile Patient Cards View */}
            <div className="lg:hidden space-y-2.5">
              {isLoading ? (
                <div className="py-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                </div>
              ) : filteredPatients.length === 0 ? (
                <div className="py-8 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-sm">
                  No patients found
                </div>
              ) : (
                filteredPatients.map((patient, index) => {
                  const isSelected = selectedPatient?.id === patient.id;
                  return (
                    <div
                      key={patient.id}
                      onClick={() => handleSelectPatient(patient)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 ${
                        isSelected
                          ? 'bg-blue-50/80 border-blue-400 shadow-sm'
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <input
                            type="radio"
                            name="patient_mobile"
                            checked={isSelected}
                            onChange={() => handleSelectPatient(patient)}
                            className="h-4 w-4 text-primary-600"
                          />
                          <span className="font-bold text-gray-900 text-sm">{patient.name}</span>
                        </div>
                        <span className="text-xs font-mono font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                          {patient.ip_number ? `IP: ${patient.ip_number}` : `#${index + 1}`}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 bg-gray-50/70 p-2 rounded-lg">
                        {patient.room && (
                          <div>
                            <span className="text-gray-400 block text-[10px] uppercase font-bold">Room</span>
                            <span className="font-medium text-gray-800">{patient.room}</span>
                          </div>
                        )}
                        {patient.phone && (
                          <div>
                            <span className="text-gray-400 block text-[10px] uppercase font-bold">Mobile</span>
                            <span className="font-medium text-gray-800">{patient.phone}</span>
                          </div>
                        )}
                        {patient.place && (
                          <div>
                            <span className="text-gray-400 block text-[10px] uppercase font-bold">Place</span>
                            <span className="font-medium text-gray-800">{patient.place}</span>
                          </div>
                        )}
                        {patient.street && (
                          <div>
                            <span className="text-gray-400 block text-[10px] uppercase font-bold">Street</span>
                            <span className="font-medium text-gray-800 truncate block">{patient.street}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Select
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SL No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Room
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Place
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mobile
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Street
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                        </div>
                      </td>
                    </tr>
                  ) : filteredPatients.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                        No patients found
                      </td>
                    </tr>
                  ) : (
                    filteredPatients.map((patient, index) => (
                      <tr 
                        key={patient.id}
                        className={`hover:bg-gray-50 cursor-pointer ${
                          selectedPatient?.id === patient.id ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => handleSelectPatient(patient)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="radio"
                            name="patient"
                            checked={selectedPatient?.id === patient.id}
                            onChange={() => handleSelectPatient(patient)}
                            className="h-4 w-4 text-primary-600"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{index + 1}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{patient.room || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{patient.ip_number || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{patient.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{patient.place}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{patient.phone}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{patient.street || '-'}</div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t">
            <div className="text-xs sm:text-sm text-gray-600">
              Total Patients: <span className="font-semibold">{filteredPatients.length}</span>
            </div>
            
            <div className="flex space-x-3 w-full sm:w-auto">
              <button
                onClick={() => navigate(-1)}
                className="btn-secondary"
              >
                Cancel
              </button>
              
              <button
                onClick={handleConfirm}
                disabled={!selectedPatient}
                className="btn-primary flex items-center"
              >
                <Check size={20} className="mr-2" />
                OK
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SelectPatient