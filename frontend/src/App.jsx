import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './App.css';
import './styles/layout.css';
import { NewHabitForm } from './components/NewHabitForm';
import { EditHabitForm } from './components/EditHabitForm';
import { HabitList } from './components/HabitList';
import { Login } from './components/Login';
import { Home } from './components/Home';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <Home />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/habits"
          element={
            <ProtectedRoute>
              <Layout>
                <HabitList />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/new-habit"
          element={
            <ProtectedRoute>
              <Layout>
                <NewHabitForm />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/edit-habit/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <EditHabitForm />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/statistics"
          element={
            <ProtectedRoute>
              <Layout>
                <div className="p-8">Statistics page coming soon!</div>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <Layout>
                <div className="p-8">Calendar view coming soon!</div>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Layout>
                <div className="p-8">Notifications coming soon!</div>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Layout>
                <div className="p-8">Profile page coming soon!</div>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Layout>
                <div className="p-8">Settings page coming soon!</div>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
      <Toaster 
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#333',
            color: '#fff',
          },
        }}
      />
    </Router>
  );
}

export default App;
