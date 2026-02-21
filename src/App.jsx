import React, { createContext } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/layout/Navbar'
import Toast from './components/ui/Toast'
import { useToast } from './hooks/useToast'
import { useProfile } from './hooks/useProfile'
import Dashboard from './pages/Dashboard'
import Activiteiten from './pages/Activiteiten'
import Bloeddruk from './pages/Bloeddruk'
import GewichtVoeding from './pages/GewichtVoeding'
import Rapporten from './pages/Rapporten'

export const ToastContext = createContext(null)
export const ProfileContext = createContext(null)

export default function App() {
  const { toasts, addToast, removeToast } = useToast()
  const { profile, saveProfile } = useProfile()

  return (
    <ToastContext.Provider value={addToast}>
      <ProfileContext.Provider value={{ profile, saveProfile }}>
        <BrowserRouter>
          <div className="min-h-screen bg-[#eef0f8]">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/activiteiten" element={<Activiteiten />} />
                <Route path="/bloeddruk" element={<Bloeddruk />} />
                <Route path="/gewicht-voeding" element={<GewichtVoeding />} />
                <Route path="/rapporten" element={<Rapporten />} />
              </Routes>
            </main>
            <Toast toasts={toasts} removeToast={removeToast} />
          </div>
        </BrowserRouter>
      </ProfileContext.Provider>
    </ToastContext.Provider>
  )
}
