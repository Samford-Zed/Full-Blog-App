import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import UserDashboard from "./pages/UserDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import { AuthProvider } from "./contexts/AuthContext";
import PrivateRoute from "./components/PrivateRoute";

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Default redirect: root "/" → /login */}
          <Route path='/' element={<Navigate to='/login' replace />} />

          {/* Auth Routes */}
          <Route path='/login' element={<Login />} />
          <Route path='/register' element={<Register />} />

          {/* Protected Routes */}
          <Route
            path='/dashboard'
            element={
              <PrivateRoute>
                <UserDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path='/admin'
            element={
              <PrivateRoute adminOnly>
                <AdminDashboard />
              </PrivateRoute>
            }
          />

          {/* Fallback for 404 */}
          <Route
            path='*'
            element={
              <h1 className='text-center mt-20 text-gray-700 text-xl'>
                404 - Page Not Found
              </h1>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}
