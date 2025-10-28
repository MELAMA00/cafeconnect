import { Routes, Route, Navigate } from 'react-router-dom'
import TablePage from './pages/TablePage.jsx'
import AdminPage from './pages/AdminPage.jsx'
import LoginPage from './pages/LoginPage.jsx'

function RequireAuth({ children }) {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <div className="max-w-5xl mx-auto p-4">
      <Routes>
        <Route path="/c/:cafeId/table/:tableId" element={<TablePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <AdminPage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/c/1/table/1" replace />} />
      </Routes>
    </div>
  )
}
