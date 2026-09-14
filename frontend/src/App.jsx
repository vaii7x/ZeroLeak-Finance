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
import ClickSpark from './components/ClickSpark';
import { PipelineProvider } from './context/PipelineContext';

export default function App() {
  return (
    <PipelineProvider>
      <BrowserRouter>
        <ClickSpark
        sparkColor="#72D6A0"
        sparkSize={10}
        sparkRadius={20}
        sparkCount={8}
        duration={400}
      >
        <Routes>
          <Route path="/" element={<FrontPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/upload" element={<DataUpload />} />
          <Route path="/prepare" element={<DataUpload />} />
          <Route path="/data-upload" element={<DataUpload />} />
          <Route path="/exposure-plan" element={<ExposurePlan />} />
          <Route path="/sanitization" element={<Sanitization />} />
          <Route path="/loading" element={<Sanitization />} />
          <Route path="/processing" element={<Sanitization />} />
          <Route path="/safe-dataset" element={<SafeDataset />} />
          <Route path="/dashboard" element={<Navigate to="/safe-dataset" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ClickSpark>
    </BrowserRouter>
  </PipelineProvider>
  );
}
