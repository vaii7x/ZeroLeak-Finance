import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import FrontPage from './pages/FrontPage';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import ForgotPassword from './pages/ForgotPassword';
import SafeDataset from './pages/SafeDataset';
import Sanitization from './pages/Sanitization';
import ExposurePlan from './pages/ExposurePlan';
import DataUpload from './pages/DataUpload';
import ByokSettings from './pages/ByokSettings';
import About from './pages/About';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { PipelineProvider } from './context/PipelineContext';

export default function App() {
  return (
    <AuthProvider>
      <PipelineProvider>
        <BrowserRouter>
          <Routes>
              {/* Public Routes */}
              <Route path="/" element={<FrontPage />} />
              <Route path="/about" element={<About />} />
              <Route path="/architecture" element={<About />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />

              {/* Protected Enclave Routes */}
              <Route
                path="/upload"
                element={
                  <ProtectedRoute>
                    <DataUpload />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/prepare"
                element={
                  <ProtectedRoute>
                    <DataUpload />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/data-upload"
                element={
                  <ProtectedRoute>
                    <DataUpload />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/exposure-plan"
                element={
                  <ProtectedRoute>
                    <ExposurePlan />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/sanitization"
                element={
                  <ProtectedRoute>
                    <Sanitization />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/loading"
                element={
                  <ProtectedRoute>
                    <Sanitization />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/processing"
                element={
                  <ProtectedRoute>
                    <Sanitization />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/safe-dataset"
                element={
                  <ProtectedRoute>
                    <SafeDataset />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/byok"
                element={
                  <ProtectedRoute>
                    <ByokSettings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings/ai"
                element={
                  <ProtectedRoute>
                    <ByokSettings />
                  </ProtectedRoute>
                }
              />
              <Route path="/dashboard" element={<Navigate to="/safe-dataset" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
      </PipelineProvider>
    </AuthProvider>
  );
}

