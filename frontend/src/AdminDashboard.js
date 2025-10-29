import React, { useState, useEffect } from "react";
import { useAuth } from './auth/AuthContext';
import { motion } from 'framer-motion';
import { SkeletonCard, SkeletonBlock } from './components/Skeleton';

import "./AdminDashboard.css"; // Assuming you have a CSS file for styling
import DashboardViz from './components/DashboardViz';

// Grid + icons
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import "./Form.css";
import { useToast } from './components/Toast';

const AdminDashboard = () => {
  useEffect(() => {
    setLoading(true);
    fetch(`${process.env.REACT_APP_API_URL}/api/companies`)
      .then(res => res.json())
      .then(data => setCompanies(data))
      .catch(err => console.error("Error fetching companies", err))
      .finally(() => setLoading(false));
  }, []);

  const [showModal, setShowModal] = useState(false);
  const [newCompany, setNewCompany] = useState({ name: "", rounds: "" });
  const [selectedCompany, setSelectedCompany] = useState("");
  const [notification, setNotification] = useState({ message: "", visible: false });
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDetailsPopup, setShowDetailsPopup] = useState({ visible: false, company: null });

  // Company management UI states
  const [searchText, setSearchText] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, company: null });
  const [form, setForm] = useState({ cname: '', trounds: '' });
  const [addSubmitting, setAddSubmitting] = useState(false);
  const toast = useToast();
  const auth = useAuth();

console.log(companies);

  // summary metrics and branch helpers removed for now to silence unused-variable warnings


  const handleAddCompany = () => {
  if (newCompany.name && newCompany.rounds) {
    // API call to backend
    fetch(`${process.env.REACT_APP_API_URL}/api/addCompany`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        cname: newCompany.name,
        trounds: Number(newCompany.rounds)
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          // Refresh company list from DB
          fetch(`${process.env.REACT_APP_API_URL}/api/companies`)
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

  fetch(`${process.env.REACT_APP_API_URL}/api/deleteCompany/${selectedCompany}`, {
    method: "DELETE",
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        // Refresh the company list from DB
        fetch(`${process.env.REACT_APP_API_URL}/api/companies`)
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

// New handlers for improved company management UI
const handleAddSubmit = () => {
  if (!form.cname || !form.trounds) {
    toast.error('Please enter company name and total rounds');
    return;
  }
  setAddSubmitting(true);
  fetch(`${process.env.REACT_APP_API_URL}/api/addCompany`, {
    method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ cname: form.cname, trounds: Number(form.trounds) })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      // refresh companies
      fetch(`${process.env.REACT_APP_API_URL}/api/companies`).then(r=>r.json()).then(setCompanies);
      setForm({ cname: '', trounds: '' });
      setAddOpen(false);
      toast.success('Company added');
    } else {
      toast.error(data.message || 'Failed to add');
    }
  })
  .catch(err => toast.error(err.message || 'Error'))
  .finally(()=>setAddSubmitting(false));
};

const handleDelete = (cname) => {
  setDeleteConfirm({ open: true, company: cname });
};

const confirmDelete = () => {
  const cname = deleteConfirm.company;
  fetch(`${process.env.REACT_APP_API_URL}/api/deleteCompany/${cname}`, { method: 'DELETE' })
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        setCompanies(prev => prev.filter(c => c.cname !== cname));
        toast.success('Company deleted');
      } else toast.error(data.message || 'Failed to delete');
    })
    .catch(err => toast.error(err.message || 'Error'))
    .finally(()=> setDeleteConfirm({ open:false, company:null }));
};


  return (
    <div className="admin-dashboard">
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
        <div className="app-container">
          {loading ? (
            <div>
              <div className="summary-cards">
                <div className="card-item"><div className="card-icon" style={{background:'linear-gradient(135deg,var(--color-primary),var(--color-accent))'}}/><div className="card-content"><SkeletonCard width="60%" height={14} /><div style={{height:8}}/><SkeletonCard width="40%" height={20} style={{marginTop:8}}/></div></div>
                <div className="card-item"><div className="card-icon" style={{background:'linear-gradient(135deg,var(--color-blue-300),var(--color-blue-500))'}}/><div className="card-content"><SkeletonCard width="60%" height={14} /><div style={{height:8}}/><SkeletonCard width="40%" height={20} style={{marginTop:8}}/></div></div>
                <div className="card-item"><div className="card-icon" style={{background:'linear-gradient(135deg,var(--color-blue-400),var(--color-blue-500))'}}/><div className="card-content"><SkeletonCard width="60%" height={14} /><div style={{height:8}}/><SkeletonCard width="40%" height={20} style={{marginTop:8}}/></div></div>
                <div className="card-item"><div className="card-icon" style={{background:'linear-gradient(135deg,var(--color-blue-500),var(--color-blue-700))'}}/><div className="card-content"><SkeletonCard width="60%" height={14} /><div style={{height:8}}/><SkeletonCard width="40%" height={20} style={{marginTop:8}}/></div></div>
              </div>

              <div style={{display:'grid', gridTemplateColumns:'1fr 340px', gap:16}}>
                <div className="card"><SkeletonBlock lines={6} /></div>
                <div className="card"><SkeletonBlock lines={8} /></div>
              </div>
            </div>
          ) : (
            <DashboardViz companies={companies} />
          )}
        </div>
      </motion.div>

      <h2 className="header">Admin Dashboard</h2>
      {auth.role === 'admin' && (
        <button className="edit-btn" onClick={() => setShowModal(true)}>Edit</button>
      )}
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
            <h3>{showDetailsPopup.company.name} - Passed Students Details</h3>
            <ul>
              {showDetailsPopup.students?.length > 0 ? (
                showDetailsPopup.students.map((s, i) => (
                  <li key={i}>{s.stname} ({s.srno}) - {s.branch}</li>
                ))
              ) : (
                <li>No students passed all rounds yet.</li>
              )}
            </ul>
          </div>
        </div>
      )}

      

      {/* Company management toolbar */}
      <div className="company-toolbar">
        <input className="search-input" placeholder="Search companies..." value={searchText} onChange={(e)=>setSearchText(e.target.value)} />
        <div>
          <button className="add-btn" onClick={()=>setAddOpen(true)}>Add Company</button>
        </div>
      </div>

      <div style={{height: 420, width: '100%', maxWidth: '1100px', margin: '0 auto', padding: '0 16px'}}>
        {/* DataGrid - requires @mui/x-data-grid and @mui/material */}
        <DataGrid
          rows={companies.filter(c => (!searchText || c.cname?.toLowerCase().includes(searchText.toLowerCase())))?.map((c, i)=>({ id: i, cname: c.cname, trounds: c.trounds, raw: c }))}
          columns={[
            { field: 'cname', headerName: 'Company Name', flex: 1, sortable: true },
            { field: 'trounds', headerName: 'Total Rounds', width: 140, sortable: true },
            { field: 'actions', type:'actions', headerName: 'Actions', width:120, getActions: (params) => (
              auth.role === 'admin' ? [
                <GridActionsCellItem icon={<EditIcon />} label="Edit" onClick={()=>{ /* optional edit */ }} showInMenu={false} className="action-icons" />,
                <GridActionsCellItem icon={<DeleteIcon />} label="Delete" onClick={()=>handleDelete(params.row.cname)} showInMenu={false} className="action-icons" />
              ] : []
            ) }
          ]}
          pageSize={pageSize}
          onPageSizeChange={(newSize)=>setPageSize(newSize)}
          rowsPerPageOptions={[5,10,20]}
          pagination
          disableSelectionOnClick
          autoHeight
        />
      </div>

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
                {companies.map((c, index) => (
                  <option key={index} value={c.cname}>{c.cname}</option>
                ))}
              </select>
              <button onClick={handleRemoveCompany}>Remove</button>
            </div>
            <button className="close-btn" onClick={() => setShowModal(false)}>Close</button>
          </div>
        </div>
      )}

      {/* Add Company modal (custom) */}
      {addOpen && (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="modal-content">
            <button className="close-button" onClick={() => setAddOpen(false)} aria-label="Close">&times;</button>
            <h3>Add Company</h3>
            <form className="form-card" onSubmit={(e)=>{e.preventDefault(); handleAddSubmit();}}>
              <label className="form-label">Company Name</label>
              <input className="form-input" value={form.cname} onChange={(e)=>setForm({...form, cname:e.target.value})} />

              <label className="form-label">Total Rounds</label>
              <input className="form-input" type="number" value={form.trounds} onChange={(e)=>setForm({...form, trounds:e.target.value})} />

              <div className="form-actions">
                <button type="button" className="save-btn" onClick={()=>setAddOpen(false)}>Cancel</button>
                <button type="submit" className="save-btn" disabled={addSubmitting}>{addSubmitting ? <span className="spinner" aria-hidden></span> : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation modal (custom) */}
      {deleteConfirm.open && (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="modal-content">
            <button className="close-button" onClick={() => setDeleteConfirm({ open:false, company:null })} aria-label="Close">&times;</button>
            <h3>Confirm delete</h3>
            <p>Delete company <strong>{deleteConfirm.company}</strong>? This action cannot be undone.</p>
            <div className="form-actions">
              <button className="save-btn" onClick={()=>setDeleteConfirm({ open:false, company:null })}>Cancel</button>
              <button className="save-btn" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
