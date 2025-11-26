import React, { useState } from "react";
import Swal from "sweetalert2";
import axios from 'axios';
import "./CompanySelection.css";
import "./Form.css";
import { useToast } from './components/Toast';
import { useAuth } from './auth/AuthContext';

const OfCompanySelection = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [showCompanies, setShowCompanies] = useState(false);
  // off-campus blog content is shown via modal/alert; we don't store it persistently here
  const [modalTitle, setModalTitle] = useState("");
  const [companies, setCompanies] = useState([]);
  // const [onCampusCompanies, setOnCampusCompanies] = useState([]); // New state for on-campus companies
  const [formData, setFormData] = useState({
    name: "",
    regNumber: "",
    branch: "CSE",
    company: "",
    roundsCleared: "0",
    placementBlog: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const toast = useToast();
  const auth = useAuth();

  // useEffect(() => {
  //   axios.get("http://localhost:5000/api/ofcompanies")
  //     .then((response) => {
  //       setCompanies(response.data);
  //     })
  //     .catch((error) => {
  //       console.error("Error fetching companies:", error);
  //     });
  // }, []);

  const fetchOfCampusCompanies = () => {
    axios.get(`${`https://placement-tracker-backend.azurewebsites.net`}/api/ofcompanies`)
      .then((response) => {
        setCompanies(response.data);
        setShowCompanies(true);
      })
      .catch((error) => {
        console.error("Error fetching off-campus companies:", error);
      });
  };
  

  const showModal = (companyName) => {
    setModalTitle(companyName);
    setFormData((prev) => ({ ...prev, company: companyName }));
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const fetchBlog = (companyName) => {
    console.log(`Fetching blog for: ${companyName}`);
    axios
      .get(`${`https://placement-tracker-backend.azurewebsites.net`}/api/ofblogs/${companyName}`)
      .then((response) => {
        console.log("Blog Data:", response.data);
        Swal.fire({
          title: `Blog - ${companyName}`,
          text: response.data.ocontent || "No blog available.",
          icon: "info",
        });
      })
      .catch((error) => {
        // console.error("Error fetching Blog: ", error);
        Swal.fire("No blogs were posted till now");
      });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const saveDetails = (event) => {
    event.preventDefault();
    const { name, regNumber, branch, company, placementBlog } = formData;
    const newErrors = {};
    if (!name) newErrors.name = "Name is required.";
    if (!regNumber) newErrors.regNumber = "Registration number is required.";
    if (!branch) newErrors.branch = "Branch is required.";
    if (!company) newErrors.company = "Company is required.";
    if (!placementBlog) newErrors.placementBlog = "Please add the placement blog.";

    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);
    axios.post(`${`https://placement-tracker-backend.azurewebsites.net`}/saveOffStudentProgress`, formData)
      .then(() => {
        toast.success('Saved');
        closeModal();
      })
      .catch((error) => {
        toast.error('Failed to save');
        console.error("Error saving details:", error);
      })
      .finally(() => setSubmitting(false));
  };

  return (
    <div className="company-selection-container">
      <div className="header">
        <h1>Company Selection</h1>
        <p>Select a company to proceed</p>
      </div>

  <button className="offcampus-btn btn-primary" onClick={fetchOfCampusCompanies} aria-label="Load off-campus companies">Off-Campus Companies</button> 

      
      
      {showCompanies && companies.length > 0 && (
        <div className="table-container">
          <div className="table-wrapper" role="region" aria-label="Off campus companies table">
          <h2>Off-Campus Companies</h2>
          <table>
            <thead>
              <tr>
                <th>Company</th>
                <th>Enter</th>
                <th>Blog</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => (
                <tr key={company.ocname}>
                  <td>{company.ocname}</td>
                  <td>
                    {auth.role === 'student' ? (
                      <button className="enter-btn btn-primary" onClick={() => showModal(company.ocname)} aria-label={`Enter details for ${company.ocname}`}>Enter</button>
                    ) : (
                      <span className="muted">(admin-only)</span>
                    )}
                  </td>
                  <td>
                    {auth.role === 'student' ? (
                      <button className="blog-btn btn-primary" onClick={() => fetchBlog(company.ocname)} aria-label={`View blog for ${company.ocname}`}>View Blog</button>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {modalVisible && (
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div className="modal-content">
            <button className="close-button" onClick={closeModal} aria-label="Close modal">&times;</button>
            <h2>{modalTitle}</h2>
            <form onSubmit={saveDetails} className="form-card">
              <label className="form-label">Name</label>
              <input className="form-input" type="text" id="name" value={formData.name} onChange={handleChange} />
              {errors.name && <div className="form-error">{errors.name}</div>}

              <label className="form-label">Registration Number</label>
              <input className="form-input" type="text" id="regNumber" value={formData.regNumber} onChange={handleChange} />
              {errors.regNumber && <div className="form-error">{errors.regNumber}</div>}

              <label className="form-label">Branch</label>
              <select className="form-select" id="branch" value={formData.branch} onChange={handleChange}>
                {["CSE", "CS", "IT", "AI&DS", "AI&ML", "ECE", "EEE", "Civil", "Mech"].map((branch) => (
                  <option key={branch} value={branch}>{branch}</option>
                ))}
              </select>
              {errors.branch && <div className="form-error">{errors.branch}</div>}
              <label>Company</label>
              <select className="form-select" id="company" value={formData.company} onChange={handleChange}>
                <option value="">Select Company</option>
                {companies.map((company) => (
                  <option key={company.ocname} value={company.ocname}>{company.ocname}</option>
                ))}
                
              </select>
              {errors.company && <div className="form-error">{errors.company}</div>}

              <label>Rounds Cleared</label>
              <select className="form-select" id="roundsCleared" value={formData.roundsCleared} onChange={handleChange}>
                {["0", "1", "2", "3", "4", "6", "7", "8"].map((num) => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
              <label className="form-label">Placement Blog</label>
              <textarea className="form-textarea" id="placementBlog" value={formData.placementBlog} onChange={handleChange}></textarea>
              {errors.placementBlog && <div className="form-error">{errors.placementBlog}</div>}
              <div className="form-actions">
                <button type="submit" className="save-btn" disabled={submitting}>
                  {submitting ? <span className="spinner" aria-hidden></span> : null}
                  {submitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfCompanySelection;
