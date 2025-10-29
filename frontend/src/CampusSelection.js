import React from "react";
import "./CampusSelection.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from './auth/AuthContext';

const CampusSelection = () => {
    const navigate = useNavigate();
    // Check role from global auth
    const auth = useAuth();
    const isStudent = auth.role === 'student';
    const isAdmin = auth.role === 'admin';

    // Handle navigation to CompanySelection or AdminDashboard
    const handleNavigation = (type) => {
        if (isStudent) {
            const path = type === "On Campus" ? "/company-selection" : "/ofCompany-selection";
            navigate(path, { state: { campusType: type } });
        } else if (isAdmin) {
            const path2 = type === "On Campus" ? "/admin-dashboard" : "/ofadmin-dashboard";
            navigate(path2, { state: { campusType: type } }); // Retaining the previous state
        }
    };
    
  
    return (
        <div className="container app-container" role="main">
                <button className="campus-button on-campus" onClick={() => handleNavigation("On Campus")} aria-label="Select on-campus placement">
                    On Campus
                </button>
                <button className="campus-button off-campus" onClick={() => handleNavigation("Off Campus")} aria-label="Select off-campus placement">
                    Off Campus
                </button>
            </div>
    );
};

export default CampusSelection;

