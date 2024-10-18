import React, { Component, Suspense } from 'react'
import { HashRouter, Route, Routes, Navigate } from 'react-router-dom'
import './scss/style.scss'
import { AuthProvider } from './AuthContext';
import ProtectedRoute from './ProtectedRoute';


const loading = (
  <div className="pt-3 text-center">
    <div className="sk-spinner sk-spinner-pulse"></div>
  </div>
)

// Containers
const DefaultLayout = React.lazy(() => import('./layout/DefaultLayout'))
const DashboardLayout = React.lazy(() => import('./layout/DashboardLayout'))
const MachineDashboardLayout = React.lazy(() => import('./layout/MachineDashboardLayout'))

// Pages
const Login = React.lazy(() => import('./views/pages/login/Login'))
const Logindemo =React.lazy(()=> import('./views/base/users/Logindemo'))
const Activatedemo =React.lazy(()=> import('./views/base/users/Activatedemo'))
const Register = React.lazy(() => import('./views/pages/register/Register'))
const Page404 = React.lazy(() => import('./views/pages/page404/Page404'))
const Page500 = React.lazy(() => import('./views/pages/page500/Page500'))

class App extends Component {
  render() {
    return (
      <AuthProvider>
      <HashRouter>
        <Suspense fallback={loading}>
          <Routes>
            <Route exact path="/" element={<Navigate to="/login" />} />
            <Route exact path="/login" name="Login Page" element={<Login />} />
            <Route exact path="/users/Logindemo" name="Logindemo" element={<Logindemo />} />
            <Route exact path="/users/Activatedemo" name="Activatedemo" element={<Activatedemo/>} />
            <Route exact path="/register" name="Register Page" element={<Register />} />
            <Route exact path="/404" name="Page 404" element={<Page404 />} />
            <Route exact path="/500" name="Page 500" element={<Page500 />} />
            <Route exact path="/live" name="Home 2" element={<ProtectedRoute element={DashboardLayout} />} />
            <Route exact path="/machinelive" name="Machine 2" element={<ProtectedRoute element={MachineDashboardLayout} />} />
            <Route path="*" name="Home" element={<ProtectedRoute element={DefaultLayout} />} />
          </Routes>
        </Suspense>
      </HashRouter>
      </AuthProvider>
    )
  }
}

export default App
