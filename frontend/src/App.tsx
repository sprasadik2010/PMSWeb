import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import PatientRegistration from './pages/PatientRegistration'
import DoctorMaster from './pages/DoctorMaster'
import OPBillEntry from './pages/OPBillEntry'
import IPBillEntry from './pages/IPBillEntry'
import Reports from './pages/Reports'
import SelectPatient from './components/SelectPatient'
import Settings from './pages/Settings'
import PricingUpgrade from './pages/PricingUpgrade'
import AdminPanel from './pages/AdminPanel'
import Prescriptions from './pages/Prescriptions'
import Appointments from './pages/Appointments'
import DischargeSummaries from './pages/DischargeSummaries'
import ClinicSettings from './pages/ClinicSettings'
import StaffManagement from './pages/StaffManagement'

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* All protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="patient/registration" element={<PatientRegistration />} />
            <Route path="doctor/master" element={<DoctorMaster />} />
            <Route path="billing/op" element={<OPBillEntry />} />
            <Route path="billing/ip" element={<IPBillEntry />} />
            <Route path="prescriptions" element={<Prescriptions />} />
            <Route path="appointments" element={<Appointments />} />
            <Route path="discharge-summaries" element={<DischargeSummaries />} />
            <Route path="reports" element={<Reports />} />
            <Route path="clinic-branding" element={<ClinicSettings />} />
            <Route path="staff-management" element={<StaffManagement />} />
            <Route path="settings" element={<Settings />} />
            <Route path="upgrade" element={<PricingUpgrade />} />
            <Route path="admin" element={<AdminPanel />} />
            <Route path="select-patient" element={<SelectPatient />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App