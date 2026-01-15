import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Browse from './pages/Browse';
import MyList from './pages/MyList';
import Upload from './pages/Upload';
import Watch from './pages/Watch';
import ProfileSelect from './pages/ProfileSelect';
import Settings from './pages/Settings';
import Navbar from './components/Navbar';
import './App.css';

const ProtectedRoute = ({ children }) => {
  const { user, currentProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <h1>Zeloz Streaming</h1>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!currentProfile) {
    return <Navigate to="/profiles" />;
  }

  return children;
};

const AdminRoute = ({ children }) => {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return <Navigate to="/" />;
  }

  return children;
};

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Router>
      {user && <Navbar />}
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
        <Route path="/profiles" element={user ? <ProfileSelect /> : <Navigate to="/login" />} />

        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/movies" element={<ProtectedRoute><Browse type="movie" /></ProtectedRoute>} />
        <Route path="/series" element={<ProtectedRoute><Browse type="series" /></ProtectedRoute>} />
        <Route path="/my-list" element={<ProtectedRoute><MyList /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/watch/:id" element={<ProtectedRoute><Watch /></ProtectedRoute>} />
        <Route path="/upload" element={<ProtectedRoute><AdminRoute><Upload /></AdminRoute></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
