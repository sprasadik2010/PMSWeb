import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  Home, 
  UserPlus, 
  Stethoscope, 
  FileText, 
  ClipboardList,
  LogOut,
  Menu,
  X,
  Building,
  BarChart3,
  Settings,
  ChevronRight,
  User,
  MoreVertical,
  ShieldCheck,
  Sparkles,
  Calendar,
  FileCheck2,
  Building2,
  Users
} from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { AdBanner } from './AdBanner'
import { VoiceSwitch } from './VoiceFloatingBar'

const Layout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  const menuItems = [
    { 
      path: '/dashboard', 
      label: 'Dashboard', 
      icon: Home,
      description: 'Overview & analytics',
      color: 'from-blue-500 to-cyan-500'
    },
    { 
      path: '/appointments', 
      label: 'Appointments & Queue', 
      icon: Calendar,
      description: 'Token queue & TV mode',
      color: 'from-emerald-500 to-teal-500'
    },
    { 
      path: '/prescriptions', 
      label: 'Consultation & Rx', 
      icon: Stethoscope,
      description: 'Diagnosis & Prescriptions',
      color: 'from-blue-600 to-indigo-600'
    },
    { 
      path: '/billing/op', 
      label: 'OP Billing', 
      icon: FileText,
      description: 'Outpatient billing',
      color: 'from-orange-500 to-amber-500'
    },
    { 
      path: '/billing/ip', 
      label: 'IP Billing', 
      icon: ClipboardList,
      description: 'Inpatient billing',
      color: 'from-red-500 to-pink-500'
    },
    { 
      path: '/discharge-summaries', 
      label: 'Discharge Summaries', 
      icon: FileCheck2,
      description: 'Inpatient discharge notes',
      color: 'from-purple-600 to-pink-600'
    },
    { 
      path: '/patient/registration', 
      label: 'Patient Registration', 
      icon: UserPlus,
      description: 'OP & IP registration',
      color: 'from-green-500 to-emerald-500'
    },
    { 
      path: '/doctor/master', 
      label: 'Doctor Master', 
      icon: User,
      description: 'Manage doctors',
      color: 'from-purple-500 to-indigo-500'
    },
    { 
      path: '/reports', 
      label: 'Reports & Export', 
      icon: BarChart3,
      description: 'Analytics & CSV export',
      color: 'from-indigo-500 to-purple-500'
    },
    { 
      path: '/clinic-branding', 
      label: 'Clinic Profile', 
      icon: Building2,
      description: 'Hospital branding & tax ID',
      color: 'from-slate-600 to-gray-800'
    },
    { 
      path: '/staff-management', 
      label: 'Staff & Roles (RBAC)', 
      icon: Users,
      description: 'Manage clinic staff logins',
      color: 'from-teal-600 to-cyan-700'
    },
    { 
      path: '/settings', 
      label: 'Master Settings', 
      icon: Settings,
      description: 'Particulars & Departments',
      color: 'from-gray-600 to-gray-800'
    },
  ]

  if (user?.role === 'superadmin') {
    menuItems.push({
      path: '/admin',
      label: 'Admin Panel',
      icon: ShieldCheck,
      description: 'Manage platform & ads',
      color: 'from-rose-500 to-red-500'
    })
  }

  const handleLogout = () => {
    logout()
    setIsUserMenuOpen(false)
    toast.success('Logged out successfully')
  }

  const handleNavigation = (path: string) => {
    navigate(path)
    setIsSidebarOpen(false)
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 18) return 'Good Afternoon'
    return 'Good Evening'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Notifications Panel */}
      {isNotificationsOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-30 z-50 transition-opacity duration-300"
          onClick={() => setIsNotificationsOpen(false)}
        >
          <div 
            className="absolute right-0 top-0 h-full w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-out"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Notifications</h3>
                <button onClick={() => setIsNotificationsOpen(false)}>
                  <X size={20} className="text-gray-500" />
                </button>
              </div>
            </div>
            {/* Notifications content would go here */}
          </div>
        </div>
      )}

      {/* Sidebar Drawer */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-80 bg-gradient-to-b from-blue-900 to-indigo-900 shadow-2xl transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
      `}>
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-1 border-b border-blue-800">
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                  <Building className="text-white" size={32} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">PMS Pro</h1>
                  <p className="text-blue-200 text-sm">Patient Management System</p>
                </div>
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                title="Close menu"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            <div className="px-4 mb-2">
              <p className="text-blue-300 text-sm font-medium uppercase tracking-wider">MAIN NAVIGATION</p>
            </div>
            
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  className={`
                    w-full group flex items-center space-x-4 px-4 py-4 rounded-2xl transition-all duration-200
                    ${isActive 
                      ? `bg-gradient-to-r ${item.color} shadow-lg transform scale-[1.02]` 
                      : 'hover:bg-white/10 hover:transform hover:scale-[1.02]'
                    }
                  `}
                >
                  <div className={`p-3 rounded-xl ${isActive ? 'bg-white/20' : 'bg-white/10 group-hover:bg-white/20'}`}>
                    <Icon size={20} className={isActive ? 'text-white' : 'text-blue-300'} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className={`font-semibold ${isActive ? 'text-white' : 'text-blue-100'}`}>
                      {item.label}
                    </p>
                    <p className={`text-sm ${isActive ? 'text-white/90' : 'text-blue-300/70'}`}>
                      {item.description}
                    </p>
                  </div>
                  <ChevronRight size={16} className={isActive ? 'text-white' : 'text-blue-300'} />
                </button>
              )
            })}
          </nav>

          {/* Ad Banner for Free Users */}
          {user && !user.ad_free && (
            <div className="p-4 mt-auto">
              <AdBanner />
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-200">
          {user && !user.ad_free && (
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white px-4 py-2 text-center text-xs font-semibold flex items-center justify-center gap-2 shadow-inner">
              <Sparkles size={14} className="animate-pulse text-amber-300" />
              <span>You are running on the free sponsored tier. Go premium for an ad-free workspace and advanced features.</span>
              <button 
                onClick={() => navigate('/upgrade')}
                className="bg-white text-indigo-700 px-2.5 py-0.5 rounded-full hover:bg-indigo-50 transition-colors shadow-sm cursor-pointer ml-2"
              >
                Upgrade Clinic
              </button>
            </div>
          )}
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-3 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all shadow-sm cursor-pointer"
                title={isSidebarOpen ? "Close menu" : "Open menu"}
              >
                {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
              
              <div className="hidden lg:block">
                <h2 className="text-xl font-bold text-gray-900">
                  {menuItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
                </h2>
                <p className="text-gray-600 text-sm">
                  {getGreeting()}, {user?.full_name?.split(' ')[0]}!
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Universal Free Voice-to-Text Switch */}
              <VoiceSwitch label="Voice Dictation" />

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-sm font-bold text-white">
                      {user?.full_name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="font-semibold text-gray-900 text-sm">{user?.full_name}</p>
                    <p className="text-gray-600 text-xs font-semibold text-indigo-600">
                      {user?.role === 'superadmin' ? 'Super Admin' : (user?.subscription_tier === 'premium' ? 'Premium Tier' : 'Free Tier')}
                    </p>
                  </div>
                  <MoreVertical size={20} className="text-gray-600" />
                </button>

                {/* User Dropdown Menu */}
                {isUserMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40"
                      onClick={() => setIsUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
                      <div className="p-4 border-b border-gray-100">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                            <span className="text-lg font-bold text-white">
                              {user?.full_name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{user?.full_name}</p>
                            <p className="text-indigo-600 font-semibold text-sm">
                              {user?.role === 'superadmin' ? 'Super Admin' : (user?.subscription_tier === 'premium' ? 'Premium Tier' : 'Free Tier')}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="py-2">
                        {user && !user.ad_free && (
                          <button
                            onClick={() => {
                              navigate('/upgrade')
                              setIsUserMenuOpen(false)
                            }}
                            className="w-full flex items-center space-x-3 px-4 py-3 text-indigo-600 font-bold hover:bg-indigo-50 transition-colors"
                          >
                            <Sparkles size={18} className="text-amber-500 shrink-0" />
                            <span>Upgrade Clinic</span>
                          </button>
                        )}
                        {/* <button
                          onClick={() => {
                            navigate('/profile')
                            setIsUserMenuOpen(false)
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <User size={18} />
                          <span>My Profile</span>
                        </button> */}
                        {/* <button
                          onClick={() => {
                            navigate('/settings')
                            setIsUserMenuOpen(false)
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Settings size={18} />
                          <span>Settings</span>
                        </button> */}
                        <div className="border-t border-gray-100 my-2"></div>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 text-red-600 transition-all"
                        >
                          <LogOut size={18} />
                          <span className="font-semibold">Logout</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {children || <Outlet />}
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200 bg-white/50 backdrop-blur-sm">
          <div className="px-6 py-4">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="flex items-center space-x-6 mb-4 md:mb-0">
                <p className="text-sm text-gray-600">
                  System Status: <span className="text-green-600 font-medium">● Online</span>
                </p>
                <p className="text-sm text-gray-600">
                  Server Load: <span className="text-blue-600 font-medium">24%</span>
                </p>
                <p className="text-sm text-gray-600">
                  Last Backup: <span className="text-gray-900 font-medium">2 hours ago</span>
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                <button className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Privacy Policy
                </button>
                <button className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Terms of Service
                </button>
                <button className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Contact Support
                </button>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Floating Logout Button (Mobile) */}
      <div className="fixed bottom-6 right-6 z-40 lg:hidden">
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200"
            title="Quick Actions"
          >
            <MoreVertical size={24} />
          </button>

          {/* Mobile Quick Actions Menu */}
          {isUserMenuOpen && (
            <>
              <div 
                className="fixed inset-0 bg-black bg-opacity-30 z-40"
                onClick={() => setIsUserMenuOpen(false)}
              />
              <div className="absolute bottom-16 right-0 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center">
                      <span className="text-sm font-bold text-white">
                        {user?.full_name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{user?.full_name}</p>
                      <p className="text-gray-600 text-xs">Administrator</p>
                    </div>
                  </div>
                </div>
                <div className="py-2">
                  <button
                    onClick={() => {
                      navigate('/profile')
                      setIsUserMenuOpen(false)
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <User size={18} />
                    <span>My Profile</span>
                  </button>
                  <button
                    onClick={() => {
                      navigate('/settings')
                      setIsUserMenuOpen(false)
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Settings size={18} />
                    <span>Settings</span>
                  </button>
                  <div className="border-t border-gray-100 my-2"></div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={18} />
                    <span className="font-semibold">Logout</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Layout