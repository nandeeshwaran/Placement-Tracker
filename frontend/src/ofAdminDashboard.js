import React, { useState, useEffect } from "react";

import "./ofAdminDashboard.css"; // Assuming you have a CSS file for styling

const OfAdminDashboard = () => {
    useEffect(() => {
        fetch(`${process.env.REACT_APP_API_URL}/api/ofcompanies`)
            .then(res => res.json())
            .then(data => setCompanies(data))
            .catch(err => console.error("Error fetching companies", err));
    }, []);

    const [showModal, setShowModal] = useState(false);
    const [newCompany, setNewCompany] = useState({ name: "", rounds: "" });
    const [selectedCompany, setSelectedCompany] = useState("");
    const [notification, setNotification] = useState({ message: "", visible: false });
    const [showDetailsPopup, setShowDetailsPopup] = useState({ visible: false, company: null });
    const [filterRounds] = useState("All");

    const [ofcompanies, setCompanies] = useState([]);

    console.log(ofcompanies);


    const [branchCounts, setBranchCounts] = useState({}); // Key: company name, Value: count

    const handleShowBranchDetails = (e, companyName) => {
    const branch = e.target.value;
    console.log("Fetching count for:", companyName, "Branch:", branch);

    fetch(`${process.env.REACT_APP_API_URL}/api/ofbranchPassedCount?branch=${branch}&company=${companyName}`)
        .then(res => res.json())
        .then(data => {
            console.log(`Count for ${companyName} (${branch}):`, data.count); // ✅ Print here
            setBranchCounts(prev => ({
                ...prev,
                [companyName]: {
                    branch,
                    count: data.count
                }
            }));
        })
        .catch(err => {
            console.error("Error fetching branch count:", err);
        });
};



    const handleShowDetails = (company) => {
        fetch(`${process.env.REACT_APP_API_URL}/api/ofpassedStudents/${company.ocname}`)
            .then(res => res.json())
            .then(data => {
                setShowDetailsPopup({ visible: true, company: company.ocname, students: data });
            });
    };


    const handleAddCompany = () => {
        if (newCompany.name && newCompany.rounds) {
            // API call to backend
            fetch(`${process.env.REACT_APP_API_URL}/api/ofaddCompany`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    ocname: newCompany.name,
                    otrounds: Number(newCompany.rounds)
                })
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        // Refresh company list from DB
                        fetch(`${process.env.REACT_APP_API_URL}/api/ofcompanies`)
                            .then(res => res.json())
                            .then(data => setCompanies(data));

                        setNewCompany({ name: "", rounds: "" });
                        setNotification({ message: "Company Added Successfully!", visible: true });
                        setTimeout(() => setNotification({ message: "", visible: false }), 3000);
                    }
                })
                .catch(err => {
                    console.error("Error adding company:", err);
                });
        }
    };


    const handleRemoveCompany = () => {
        if (!selectedCompany || selectedCompany === "Select Company") return;

        fetch(`${process.env.REACT_APP_API_URL}/ofdeleteCompany/${selectedCompany}`, {
            method: "DELETE",
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    // Refresh the company list from DB
                    fetch(`${process.env.REACT_APP_API_URL}/api/ofcompanies`)
                        .then(res => res.json())
                        .then(data => setCompanies(data));

                    setSelectedCompany("");
                    setNotification({ message: "Company Removed Successfully!", visible: true });
                    setTimeout(() => setNotification({ message: "", visible: false }), 3000);
                }
            })
            .catch(err => {
                console.error("Error deleting company:", err);
            });
    };


    return (
        <div className="admin-dashboard">
            <h2 className="header">Admin Dashboard</h2>
            <button className="edit-btn" onClick={() => setShowModal(true)}>Edit</button>
            {/* <div className="filter-section">
        <label>Filter by Rounds:</label>
        <select onChange={(e) => setFilterRounds(e.target.value)}>
          <option>All</option>
          {[...new Set(companies.map((c) => c.rounds))].map((round, index) => (
            <option key={index} value={round}>{round}</option>
          ))}
        </select>
      </div> */}

            {notification.visible && <div className="popup-message">{notification.message}</div>}

            {showDetailsPopup.visible && showDetailsPopup.company && (
                <div className="show-details-modal">
                    <div className="show-details-content">
                        <span className="close-btn" onClick={() => setShowDetailsPopup({ visible: false, company: null })}>
                            &times;
                        </span>
                        <h3>{showDetailsPopup.company} - Passed Students Details</h3>
                        <ul>
                            {showDetailsPopup.students?.length > 0 ? (
                                showDetailsPopup.students.map((s, i) => (
                                    <li key={i}>{s.ostname} ({s.osrno}) - {s.obranch}</li>
                                ))
                            ) : (
                                <li>No students passed all rounds yet.</li>
                            )}
                        </ul>
                    </div>
                </div>
            )}



            <table className="company-table">
                <thead>
                    <tr>
                        <th>Company Name</th>
                        <th>Total Rounds</th>
                        {/* <th>Passed Students Count</th> */}
                        <th>Show Details</th>
                        <th>Branch</th>
                    </tr>
                </thead>
                <tbody>
                    {ofcompanies.filter(company => filterRounds === "All" || company.rounds === Number(filterRounds)).map((company, index) => (
                        <tr key={index}>
                            <td>{company.ocname}</td>
                            <td>{company.otrounds}</td>
                            {/* <td>{company.passed}</td> */}
                            <td>
                                <button className="show-btn" onClick={() => handleShowDetails(company)}>Show</button>
                            </td>


                            <td>
                                <select onChange={(e) => handleShowBranchDetails(e, company.ocname)}>
                                    <option value="Select">Select</option>
                                    <option value="CSE">CSE</option>
                                    <option value="IT">IT</option>
                                    <option value="CAD">CAD</option>
                                    <option value="CSM">CSM</option>
                                    <option value="ECE">ECE</option>
                                    <option value="EEE">EEE</option>
                                    <option value="Civil">Civil</option>
                                    <option value="Mech">Mech</option>
                                </select>

                                <p>
                                    {
                                        branchCounts[company.ocname]
                                            ? `Count (${branchCounts[company.ocname].branch}): ${branchCounts[company.ocname].count}`
                                            : ""
                                    }
                                </p>
                            </td>

                        </tr>
                    ))}
                </tbody>
            </table>

            {showModal && (
                <div className="modal">
                    <div className="modal-content">
                        <h3>Edit Companies</h3>
                        <div>
                            <h4>Add Company</h4>
                            <input type="text" placeholder="Company Name" value={newCompany.name} onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })} />
                            <input type="number" placeholder="Total Rounds" value={newCompany.rounds} onChange={(e) => setNewCompany({ ...newCompany, rounds: e.target.value })} />
                            <button onClick={handleAddCompany}>Add Company</button>
                        </div>
                        <div>
                            <h4>Remove Company</h4>
                            <select onChange={(e) => setSelectedCompany(e.target.value)}>
                                <option>Select Company</option>
                                {ofcompanies.map((c, index) => (
                                    <option key={index} value={c.ocname}>{c.ocname}</option>
                                ))}
                            </select>
                            <button onClick={handleRemoveCompany}>Remove</button>
                        </div>
                        <button className="close-btn" onClick={() => setShowModal(false)}>Close</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OfAdminDashboard;
