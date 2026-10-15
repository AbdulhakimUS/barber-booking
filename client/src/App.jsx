import { useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './AuthContext.jsx'
import { CatalogProvider } from './CatalogContext.jsx'
import BookingModal from './components/BookingModal.jsx'
import Nav from './components/Nav.jsx'
import Account from './pages/Account.jsx'
import AdminPanel from './pages/AdminPanel.jsx'
import BarberPanel from './pages/BarberPanel.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'

export default function App() {
  const [bookOpen, setBookOpen] = useState(false)

  return (
    <AuthProvider>
      <CatalogProvider>
        <BrowserRouter>
          <Nav onBook={() => setBookOpen(true)} />
          <Routes>
            <Route path="/" element={<Home onBook={() => setBookOpen(true)} />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/account" element={<Account />} />
            <Route path="/barber" element={<BarberPanel />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <BookingModal open={bookOpen} onClose={() => setBookOpen(false)} />
        </BrowserRouter>
      </CatalogProvider>
    </AuthProvider>
  )
}
