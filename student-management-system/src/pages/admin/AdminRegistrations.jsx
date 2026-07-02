import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../components/supabaseClient';
import { 
  Eye, CheckCircle, XCircle, Search,
  RefreshCw, Clock, Mail, Phone, BookOpen,
  GraduationCap, DollarSign, Download,
  Printer, X, ArrowLeft
} from 'lucide-react';
import '../../styles/adminStyles/adminRegistrations.css';

const AdminRegistrations = ({ onUpdate }) => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReg, setSelectedReg] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [imageError, setImageError] = useState(false);
  const printRef = useRef(null);

  useEffect(() => {
    checkMobile();
    fetchRegistrations();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [activeView]);

  const checkMobile = () => {
    setIsMobile(window.innerWidth <= 768);
  };

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('student_registrations')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (activeView !== 'all') {
        query = query.eq('registration_status', activeView);
      }

      const { data } = await query;
      setRegistrations(data || []);
      console.log('📋 Registrations fetched:', data?.length || 0, 'records');
    } catch (error) {
      console.error('❌ Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScreenshotUrl = (url) => {
    if (!url) {
      console.log('🖼️ No screenshot URL provided');
      return null;
    }
    
    console.log('🔍 Processing screenshot URL:', url);
    
    if (url.startsWith('http://') || url.startsWith('https://')) {
      console.log('✅ Full URL detected:', url);
      return url;
    }
    
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ikuilhpgplkbiuqhuouu.supabase.co';
    const fullUrl = `${supabaseUrl}/storage/v1/object/public/${url}`;
    console.log('🔧 Constructed Supabase URL:', fullUrl);
    return fullUrl;
  };

  const handleApprove = async () => {
    setProcessing(true);
    console.log('✅ Approving registration:', selectedReg?.id);
    try {
      const { error } = await supabase
        .from('student_registrations')
        .update({
          registration_status: 'approved',
          admin_notes: adminNotes,
          approved_at: new Date().toISOString()
        })
        .eq('id', selectedReg.id);

      if (error) throw error;

      console.log('✅ Registration approved successfully');
      setAdminNotes('');
      fetchRegistrations();
      if (onUpdate) onUpdate();
      if (isMobile) setShowDetails(false);
    } catch (error) {
      console.error('❌ Error approving:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    setProcessing(true);
    console.log('❌ Rejecting registration:', selectedReg?.id);
    try {
      const { error } = await supabase
        .from('student_registrations')
        .update({
          registration_status: 'rejected',
          admin_notes: adminNotes
        })
        .eq('id', selectedReg.id);

      if (error) throw error;

      console.log('✅ Registration rejected successfully');
      setAdminNotes('');
      fetchRegistrations();
      if (onUpdate) onUpdate();
      if (isMobile) setShowDetails(false);
    } catch (error) {
      console.error('❌ Error rejecting:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleViewDetails = (reg) => {
    console.log('👁️ Viewing registration details:', reg?.id, reg?.full_name);
    console.log('🖼️ Screenshot URL:', reg?.payment_screenshot_url);
    setSelectedReg(reg);
    setShowDetails(true);
    setAdminNotes('');
    setImageError(false);
  };

  const handleCloseDetails = () => {
    console.log('👋 Closing details view');
    setShowDetails(false);
    setSelectedReg(null);
    setAdminNotes('');
    setImageError(false);
  };

  const handlePrint = () => {
    console.log('🖨️ Opening print dialog');
    window.print();
  };

  const handleExportPDF = () => {
    console.log('📄 === STARTING PDF EXPORT ===');
    console.log('📋 Registration data:', {
      id: selectedReg?.id,
      name: selectedReg?.full_name,
      studentNumber: selectedReg?.student_number,
      status: selectedReg?.registration_status
    });

    const screenshotUrl = getScreenshotUrl(selectedReg?.payment_screenshot_url);
    console.log('🖼️ Screenshot URL for PDF:', screenshotUrl);

    const subjectsList = Array.isArray(selectedReg?.subjects) && selectedReg.subjects.length > 0
      ? selectedReg.subjects.map(s => `<span class="subject-tag">${s}</span>`).join(' ')
      : '<em>No subjects selected</em>';

    const printWindow = window.open('', '_blank');
    
    const content = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Registration Details - ${selectedReg?.full_name || 'Student'}</title>
          <meta charset="UTF-8">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
              padding: 2.5rem;
              color: #1e293b;
              line-height: 1.7;
              max-width: 900px;
              margin: 0 auto;
            }
            .header {
              border-bottom: 3px solid #283593;
              padding-bottom: 1.25rem;
              margin-bottom: 2rem;
            }
            .logo {
              font-size: 1.5rem;
              font-weight: 800;
              color: #283593;
              letter-spacing: -0.02em;
            }
            .subtitle {
              font-size: 0.85rem;
              color: #64748b;
              margin-top: 0.3rem;
            }
            .section-title {
              font-size: 1rem;
              font-weight: 700;
              color: #283593;
              margin: 1.75rem 0 0.85rem;
              padding-bottom: 0.5rem;
              border-bottom: 2px solid #e2e8f0;
              text-transform: uppercase;
              letter-spacing: 0.06em;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 1rem;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              overflow: hidden;
            }
            tr {
              border-bottom: 1px solid #f1f5f9;
            }
            tr:last-child {
              border-bottom: none;
            }
            th {
              padding: 0.7rem 1rem;
              text-align: left;
              background: #f8fafc;
              font-weight: 600;
              color: #64748b;
              font-size: 0.8rem;
              width: 30%;
              border-right: 1px solid #e2e8f0;
            }
            td {
              padding: 0.7rem 1rem;
              font-size: 0.85rem;
              color: #1e293b;
            }
            .status-badge {
              display: inline-block;
              padding: 0.25rem 0.75rem;
              border-radius: 12px;
              font-size: 0.8rem;
              font-weight: 600;
              text-transform: capitalize;
            }
            .status-pending { background: #fffbeb; color: #b45309; border: 1px solid #fde68a; }
            .status-approved { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
            .status-rejected { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
            .subject-tag {
              display: inline-block;
              padding: 0.25rem 0.6rem;
              background: #f1f5f9;
              border: 1px solid #e2e8f0;
              border-radius: 5px;
              font-size: 0.78rem;
              margin: 0.2rem;
            }
            .screenshot-container {
              margin-top: 0.75rem;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              overflow: hidden;
              background: #f8fafc;
            }
            .screenshot-img {
              width: 100%;
              max-height: 450px;
              object-fit: contain;
              display: block;
            }
            .screenshot-fallback {
              padding: 2rem;
              text-align: center;
              color: #94a3b8;
              font-size: 0.85rem;
            }
            .footer {
              margin-top: 2.5rem;
              padding-top: 1.25rem;
              border-top: 1px solid #e2e8f0;
              font-size: 0.78rem;
              color: #94a3b8;
              text-align: center;
            }
            .footer p {
              margin: 0.2rem 0;
            }
            @media print {
              body { padding: 0.5rem; }
              @page { margin: 1.5cm; }
              .screenshot-img { max-height: 350px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">NJEC - New Jerusalem Extra Classes</div>
            <div class="subtitle">Student Registration Details Report</div>
            <div class="subtitle">Generated: ${new Date().toLocaleString()}</div>
            <div class="subtitle">Registration ID: ${selectedReg?.id || 'N/A'}</div>
          </div>

          <div class="section-title">Student Information</div>
          <table>
            <tbody>
              <tr><th>Full Name</th><td>${selectedReg?.full_name || 'N/A'}</td></tr>
              <tr><th>Student Number</th><td>${selectedReg?.student_number || 'N/A'}</td></tr>
              <tr><th>Email Address</th><td>${selectedReg?.email || 'N/A'}</td></tr>
              <tr><th>Phone Number</th><td>${selectedReg?.phone || 'N/A'}</td></tr>
              <tr><th>Date of Birth</th><td>${selectedReg?.birth_date || 'N/A'}</td></tr>
              <tr><th>Gender</th><td>${selectedReg?.gender || 'N/A'}</td></tr>
              <tr><th>Class Type</th><td>${selectedReg?.class_type === 'extra' ? 'Extra Classes' : selectedReg?.class_type === 'supplementary' ? 'Supplementary Classes' : 'N/A'}</td></tr>
              <tr><th>Registration Status</th><td><span class="status-badge status-${selectedReg?.registration_status}">${selectedReg?.registration_status || 'N/A'}</span></td></tr>
            </tbody>
          </table>

          <div class="section-title">Payment Information</div>
          <table>
            <tbody>
              <tr><th>Payment Method</th><td>${selectedReg?.payment_method === 'mpesa' ? 'M-Pesa' : selectedReg?.payment_method === 'ecocash' ? 'Eco-Cash' : 'N/A'}</td></tr>
              <tr><th>Total Amount Due</th><td><strong>M${(selectedReg?.total_amount || 0).toLocaleString()}</strong></td></tr>
              <tr><th>Payer Name</th><td>${selectedReg?.payer_name || 'N/A'}</td></tr>
              <tr><th>Payment Number</th><td>${selectedReg?.payment_number || 'N/A'}</td></tr>
              <tr><th>Selected Subjects (${Array.isArray(selectedReg?.subjects) ? selectedReg.subjects.length : 0})</th><td>${subjectsList}</td></tr>
              ${selectedReg?.submitted_at ? `<tr><th>Submission Date</th><td>${new Date(selectedReg.submitted_at).toLocaleString()}</td></tr>` : ''}
              ${selectedReg?.approved_at ? `<tr><th>Approved Date</th><td>${new Date(selectedReg.approved_at).toLocaleString()}</td></tr>` : ''}
              ${selectedReg?.admin_notes ? `<tr><th>Admin Notes</th><td>${selectedReg.admin_notes}</td></tr>` : ''}
            </tbody>
          </table>

          <div class="section-title">Payment Proof</div>
          ${screenshotUrl ? `
            <div class="screenshot-container">
              <img src="${screenshotUrl}" alt="Payment Proof" class="screenshot-img" 
                onerror="this.style.display='none'; this.parentNode.innerHTML='<div class=\\'screenshot-fallback\\'>Payment proof image could not be loaded.<br><a href=\\'${screenshotUrl}\\' target=\\'_blank\\' style=\\'color:#283593;\\'>Click here to view the image directly</a></div>';" />
            </div>
          ` : `
            <div class="screenshot-fallback">No payment proof was uploaded with this registration.</div>
          `}

          <div class="footer">
            <p>This is an official registration document generated by NJEC.</p>
            <p>New Jerusalem Extra Classes &copy; ${new Date().getFullYear()}. All Rights Reserved.</p>
            <p>Document generated on ${new Date().toLocaleString()}</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
    
    console.log('✅ PDF content generated successfully');
    console.log('📄 Waiting for content to load before printing...');
    
    setTimeout(() => {
      console.log('🖨️ Opening print dialog');
      printWindow.print();
    }, 1000);
  };

  const filteredData = registrations.filter(item => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      item.full_name?.toLowerCase().includes(s) ||
      item.student_number?.toLowerCase().includes(s) ||
      item.email?.toLowerCase().includes(s)
    );
  });

  const tabs = [
    { key: 'pending', label: 'Pending', icon: Clock, color: '#f59e0b', bgColor: '#fffbeb' },
    { key: 'approved', label: 'Approved', icon: CheckCircle, color: '#10b981', bgColor: '#ecfdf5' },
    { key: 'rejected', label: 'Rejected', icon: XCircle, color: '#ef4444', bgColor: '#fef2f2' },
    { key: 'all', label: 'All', icon: BookOpen, color: '#283593', bgColor: '#eef2ff' }
  ];

  const screenshotUrl = selectedReg ? getScreenshotUrl(selectedReg.payment_screenshot_url) : null;

  return (
    <div className="reg-page">
      <div className="reg-page-header">
        <div>
          <h2>Student Registrations</h2>
          <p>Review and manage registration requests</p>
        </div>
        <button onClick={fetchRegistrations} className="reg-btn-outline">
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="reg-tabs">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`reg-tab ${activeView === tab.key ? 'active' : ''}`}
            onClick={() => setActiveView(tab.key)}
            style={{
              '--tab-color': tab.color,
              '--tab-bg': tab.bgColor
            }}
          >
            <tab.icon size={16} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="reg-card">
        <div className="reg-card-header">
          <div className="reg-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by name, number, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <span className="reg-count">{filteredData.length} records</span>
        </div>

        {loading ? (
          <div className="reg-loading">
            <RefreshCw size={24} className="reg-spinner" />
            <p>Loading registrations...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="reg-empty">
            <BookOpen size={40} />
            <h3>No {activeView} registrations</h3>
            <p>There are no {activeView} registrations to display.</p>
          </div>
        ) : (
          <div className="reg-table-wrap">
            <table className="reg-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Student No.</th>
                  <th>Contact</th>
                  <th>Subjects</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map(reg => (
                  <tr key={reg.id}>
                    <td>
                      <div className="reg-student">
                        <div
                          className="reg-student-avatar"
                          style={{
                            background: activeView === 'pending' ? '#fef3c7' :
                                       activeView === 'approved' ? '#d1fae5' :
                                       activeView === 'rejected' ? '#fee2e2' : '#eef2ff',
                            color: activeView === 'pending' ? '#d97706' :
                                  activeView === 'approved' ? '#059669' :
                                  activeView === 'rejected' ? '#dc2626' : '#283593'
                          }}
                        >
                          {reg.full_name?.charAt(0) || 'S'}
                        </div>
                        <div className="reg-student-info">
                          <span className="reg-student-name">{reg.full_name}</span>
                          <span className="reg-student-email">{reg.email}</span>
                        </div>
                      </div>
                    </td>
                    <td><code>{reg.student_number}</code></td>
                    <td>
                      <div className="reg-contact">
                        <span><Mail size={12} /> {reg.email}</span>
                        <span><Phone size={12} /> {reg.phone}</span>
                      </div>
                    </td>
                    <td>
                      <span className="reg-subjects-badge">
                        <BookOpen size={14} />
                        {Array.isArray(reg.subjects) ? reg.subjects.length : 0}
                      </span>
                    </td>
                    <td><strong>M{reg.total_amount?.toLocaleString()}</strong></td>
                    <td>{new Date(reg.submitted_at).toLocaleDateString()}</td>
                    <td>
                      <span className={`reg-badge reg-badge-${reg.registration_status}`}>
                        {reg.registration_status === 'pending' && <Clock size={12} />}
                        {reg.registration_status === 'approved' && <CheckCircle size={12} />}
                        {reg.registration_status === 'rejected' && <XCircle size={12} />}
                        {reg.registration_status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="reg-btn-view"
                        onClick={() => handleViewDetails(reg)}
                      >
                        <Eye size={14} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ============ MOBILE MODAL ============ */}
      {isMobile && showDetails && selectedReg && (
        <div className="reg-mobile-modal">
          <div className="reg-mobile-modal-content">
            <div className="reg-mobile-modal-header">
              <button onClick={handleCloseDetails} className="reg-back-btn">
                <ArrowLeft size={20} />
                Back
              </button>
              <div className="reg-mobile-modal-actions">
                <button onClick={handlePrint} className="reg-btn-icon" title="Print">
                  <Printer size={18} />
                </button>
                <button onClick={handleExportPDF} className="reg-btn-icon" title="Export PDF">
                  <Download size={18} />
                </button>
              </div>
            </div>
            <div className="reg-mobile-modal-body" ref={printRef}>
              <DetailsContent 
                selectedReg={selectedReg} 
                screenshotUrl={screenshotUrl}
                imageError={imageError}
                setImageError={setImageError}
                adminNotes={adminNotes}
                setAdminNotes={setAdminNotes}
              />
            </div>
            {selectedReg.registration_status === 'pending' && (
              <div className="reg-mobile-modal-footer">
                <button
                  onClick={handleReject}
                  className="reg-btn-danger"
                  disabled={processing}
                >
                  <XCircle size={18} /> Reject
                </button>
                <button
                  onClick={handleApprove}
                  className="reg-btn-success"
                  disabled={processing}
                >
                  {processing ? 'Processing...' : <><CheckCircle size={18} /> Approve</>}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============ DESKTOP DETAIL PAGE ============ */}
      {!isMobile && showDetails && selectedReg && (
        <div className="reg-detail-page" ref={printRef}>
          <div className="reg-detail-page-header">
            <button onClick={handleCloseDetails} className="reg-back-btn">
              <ArrowLeft size={20} />
              Back to List
            </button>
            <div className="reg-detail-page-actions">
              <button onClick={handlePrint} className="reg-btn-outline">
                <Printer size={16} /> Print
              </button>
              <button onClick={handleExportPDF} className="reg-btn-outline">
                <Download size={16} /> Export PDF
              </button>
            </div>
          </div>
          
          <div className="reg-detail-page-body">
            <div className="reg-detail-page-heading">
              <GraduationCap size={28} />
              <div>
                <h2>Registration Details</h2>
                <p>Student: {selectedReg.full_name} • {selectedReg.student_number}</p>
              </div>
            </div>
            <DetailsContent 
              selectedReg={selectedReg} 
              screenshotUrl={screenshotUrl}
              imageError={imageError}
              setImageError={setImageError}
              adminNotes={adminNotes}
              setAdminNotes={setAdminNotes}
            />
          </div>

          {selectedReg.registration_status === 'pending' && (
            <div className="reg-detail-page-footer">
              <button
                onClick={handleReject}
                className="reg-btn-danger"
                disabled={processing}
              >
                <XCircle size={18} /> Reject Registration
              </button>
              <button
                onClick={handleApprove}
                className="reg-btn-success"
                disabled={processing}
              >
                {processing ? 'Processing...' : <><CheckCircle size={18} /> Approve Registration</>}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// =============================================
// DETAILS CONTENT COMPONENT
// =============================================
const DetailsContent = ({ selectedReg, screenshotUrl, imageError, setImageError, adminNotes, setAdminNotes }) => {
  if (!selectedReg) return null;

  console.log('🖼️ DetailsContent - Screenshot URL:', screenshotUrl);

  return (
    <>
      {/* Student Information */}
      <div className="reg-section">
        <h3 className="reg-section-title">Student Information</h3>
        <table className="reg-detail-table">
          <tbody>
            <tr>
              <td className="reg-detail-label">Full Name</td>
              <td className="reg-detail-value">{selectedReg.full_name}</td>
              <td className="reg-detail-label">Student Number</td>
              <td className="reg-detail-value"><code>{selectedReg.student_number}</code></td>
            </tr>
            <tr>
              <td className="reg-detail-label">Email</td>
              <td className="reg-detail-value">{selectedReg.email}</td>
              <td className="reg-detail-label">Phone</td>
              <td className="reg-detail-value">{selectedReg.phone}</td>
            </tr>
            <tr>
              <td className="reg-detail-label">Date of Birth</td>
              <td className="reg-detail-value">{selectedReg.birth_date || 'N/A'}</td>
              <td className="reg-detail-label">Gender</td>
              <td className="reg-detail-value">{selectedReg.gender}</td>
            </tr>
            <tr>
              <td className="reg-detail-label">Class Type</td>
              <td className="reg-detail-value">
                <span className="reg-badge reg-badge-primary">
                  {selectedReg.class_type === 'extra' ? 'Extra Classes' : 'Supplementary'}
                </span>
              </td>
              <td className="reg-detail-label">Status</td>
              <td className="reg-detail-value">
                <span className={`reg-badge reg-badge-${selectedReg.registration_status}`}>
                  {selectedReg.registration_status === 'pending' && <Clock size={12} />}
                  {selectedReg.registration_status === 'approved' && <CheckCircle size={12} />}
                  {selectedReg.registration_status === 'rejected' && <XCircle size={12} />}
                  {selectedReg.registration_status}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Payment Information */}
      <div className="reg-section">
        <h3 className="reg-section-title">Payment Information</h3>
        <table className="reg-detail-table">
          <tbody>
            <tr>
              <td className="reg-detail-label">Payment Method</td>
              <td className="reg-detail-value">
                <span className="reg-badge reg-badge-primary">
                  {selectedReg.payment_method === 'mpesa' ? 'M-Pesa' : 'Eco-Cash'}
                </span>
              </td>
              <td className="reg-detail-label">Total Amount</td>
              <td className="reg-detail-value">
                <strong>M{selectedReg.total_amount?.toLocaleString()}</strong>
              </td>
            </tr>
            <tr>
              <td className="reg-detail-label">Payer Name</td>
              <td className="reg-detail-value">{selectedReg.payer_name}</td>
              <td className="reg-detail-label">Payment Number</td>
              <td className="reg-detail-value"><code>{selectedReg.payment_number}</code></td>
            </tr>
            <tr>
              <td className="reg-detail-label">Subjects</td>
              <td className="reg-detail-value" colSpan="3">
                <div className="reg-subjects-list">
                  {Array.isArray(selectedReg.subjects) && selectedReg.subjects.length > 0 ? (
                    selectedReg.subjects.map((subject, index) => (
                      <span key={index} className="reg-subject-tag">
                        <BookOpen size={12} />
                        {subject}
                      </span>
                    ))
                  ) : (
                    <span className="reg-text-muted">No subjects selected</span>
                  )}
                </div>
              </td>
            </tr>
            {selectedReg.approved_at && (
              <tr>
                <td className="reg-detail-label">Approved Date</td>
                <td className="reg-detail-value" colSpan="3">
                  {new Date(selectedReg.approved_at).toLocaleString()}
                </td>
              </tr>
            )}
            {selectedReg.admin_notes && (
              <tr>
                <td className="reg-detail-label">Admin Notes</td>
                <td className="reg-detail-value" colSpan="3">
                  {selectedReg.admin_notes}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Payment Screenshot */}
      {screenshotUrl && (
        <div className="reg-section">
          <h3 className="reg-section-title">Payment Proof</h3>
          <div className="reg-screenshot">
            {imageError ? (
              <div className="reg-screenshot-fallback">
                <p>Unable to load payment proof image.</p>
                <a 
                  href={screenshotUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="reg-link"
                >
                  <Eye size={14} /> View Image Directly
                </a>
              </div>
            ) : (
              <img 
                src={screenshotUrl} 
                alt="Payment proof"
                onLoad={() => console.log('✅ Screenshot loaded successfully')}
                onError={() => {
                  console.error('❌ Screenshot failed to load:', screenshotUrl);
                  setImageError(true);
                }}
              />
            )}
          </div>
          {!imageError && (
            <div style={{ marginTop: '0.5rem' }}>
              <a 
                href={screenshotUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="reg-link"
              >
                <Eye size={14} /> Open Full Image
              </a>
            </div>
          )}
        </div>
      )}

      {/* Admin Notes */}
      {selectedReg.registration_status === 'pending' && (
        <div className="reg-section">
          <h3 className="reg-section-title">Add Notes</h3>
          <textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            rows={3}
            placeholder="Add notes about this registration..."
            className="reg-textarea"
          />
        </div>
      )}
    </>
  );
};

export default AdminRegistrations;