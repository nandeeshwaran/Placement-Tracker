import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./LoginPage";
import AdminDashboard from "./AdminDashboard";
import OfAdminDashboard from "./ofAdminDashboard";
import CompanySelection from "./CompanySelection";
import CampusSelection from "./CampusSelection";
import OfCompanySelection from "./ofCompanySelection";
import StudentManagement from "./StudentManagement";
import SummaryDashboard from "./SummaryDashboard";
import Layout from "./components/Layout";
import PageTransition from "./components/PageTransition";
import { AuthProvider } from './auth/AuthContext';
import RequireAuth from './components/RequireAuth';
import PlacementOverview from './PlacementOverview';


function App() {
  return (
    <Router>
      <AuthProvider>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        {/* All app routes wrapped in the Layout (sticky sidebar + topbar) */}
        <Route path="/placement" element={
          <RequireAuth allowedRoles={[ 'student', 'admin' ]}>
            <Layout><PageTransition><PlacementOverview /></PageTransition></Layout>
          </RequireAuth>
        } />

        <Route path="/company-selection" element={
          <RequireAuth allowedRoles={[ 'student', 'admin' ]}>
            <Layout><PageTransition><CompanySelection /></PageTransition></Layout>
          </RequireAuth>
        } />

        <Route path="/admin-dashboard" element={
          <RequireAuth allowedRoles={[ 'admin' ]}>
            <Layout><PageTransition><AdminDashboard /></PageTransition></Layout>
          </RequireAuth>
        } />

        <Route path="/ofadmin-dashboard" element={
          <RequireAuth allowedRoles={[ 'admin' ]}>
            <Layout><PageTransition><OfAdminDashboard /></PageTransition></Layout>
          </RequireAuth>
        } />

        <Route path="/campus-selection" element={
          <RequireAuth allowedRoles={[ 'student', 'admin' ]}>
            <Layout><PageTransition><CampusSelection /></PageTransition></Layout>
          </RequireAuth>
        } />

        <Route path="/ofcompany-selection" element={
          <RequireAuth allowedRoles={[ 'student', 'admin' ]}>
            <Layout><PageTransition><OfCompanySelection /></PageTransition></Layout>
          </RequireAuth>
        } />

        <Route path="/students" element={
          <RequireAuth allowedRoles={[ 'student', 'admin' ]}>
            <Layout><PageTransition><StudentManagement /></PageTransition></Layout>
          </RequireAuth>
        } />
        
        <Route path="/my-resume" element={
          <RequireAuth allowedRoles={[ 'student' ]}>
            <Layout><PageTransition><SummaryDashboard /></PageTransition></Layout>
          </RequireAuth>
        } />
      </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
