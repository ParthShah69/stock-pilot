import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import axios from 'axios';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function AdminPanel() {
  const [tabValue, setTabValue] = useState(0);
  const [dashboardData, setDashboardData] = useState(null);
  const [pendingKYC, setPendingKYC] = useState([]);
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Dialog states
  const [kycDialogOpen, setKycDialogOpen] = useState(false);
  const [selectedKYC, setSelectedKYC] = useState(null);
  const [kycAction, setKycAction] = useState('');
  const [kycNotes, setKycNotes] = useState('');
  
  const [queryDialogOpen, setQueryDialogOpen] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [queryStatus, setQueryStatus] = useState('');
  const [queryNotes, setQueryNotes] = useState('');
  
  const [viewMessageDialogOpen, setViewMessageDialogOpen] = useState(false);
  const [selectedMessageQuery, setSelectedMessageQuery] = useState(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setDataLoading(true);
    setError('');
    
    try {
      await Promise.all([
        loadDashboardData(),
        loadPendingKYC(),
        loadQueries()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setDataLoading(false);
    }
  };

  const getAuthToken = () => {
    // Try both localStorage and sessionStorage for token
    // The AuthContext uses 'authToken' as the key
    return localStorage.getItem('authToken') || 
           sessionStorage.getItem('authToken');
  };

  const loadDashboardData = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        setError('No authentication token found');
        return;
      }

      const response = await axios.get('http://localhost:5000/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setDashboardData(response.data);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      if (error.response?.status === 401) {
        setError('Authentication failed. Please login again.');
      } else {
        setError('Failed to load dashboard data');
      }
    }
  };

  const loadPendingKYC = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        setError('No authentication token found');
        return;
      }

      const response = await axios.get('http://localhost:5000/api/admin/kyc/pending', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setPendingKYC(response.data.kyc_list || []);
      }
    } catch (error) {
      console.error('Error loading pending KYC:', error);
      if (error.response?.status === 401) {
        setError('Authentication failed. Please login again.');
      } else {
        setError('Failed to load pending KYC');
      }
    }
  };

  const loadQueries = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        setError('No authentication token found');
        return;
      }

      const response = await axios.get('http://localhost:5000/api/admin/queries', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setQueries(response.data.queries || []);
      }
    } catch (error) {
      console.error('Error loading queries:', error);
      if (error.response?.status === 401) {
        setError('Authentication failed. Please login again.');
      } else {
        setError('Failed to load queries');
      }
    }
  };

  const handleKYCUpdate = async () => {
    if (!selectedKYC || !kycAction || !kycNotes.trim()) {
      setError('Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      const token = getAuthToken();
      if (!token) {
        setError('No authentication token found');
        return;
      }

      const endpoint = kycAction === 'approve' ? 'approve' : 'reject';
      
      const response = await axios.put(
        `http://localhost:5000/api/admin/kyc/${selectedKYC._id}/${endpoint}`,
        { admin_notes: kycNotes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setSuccess(`KYC ${kycAction}d successfully`);
        setKycDialogOpen(false);
        setSelectedKYC(null);
        setKycAction('');
        setKycNotes('');
        
        // Refresh both KYC and dashboard data
        await Promise.all([
          loadPendingKYC(),
          loadDashboardData()
        ]);
      }
    } catch (error) {
      console.error('Error updating KYC:', error);
      setError('Failed to update KYC');
    } finally {
      setLoading(false);
    }
  };

  const handleQueryUpdate = async () => {
    if (!selectedQuery || !queryStatus || !queryNotes.trim()) {
      setError('Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      const token = getAuthToken();
      if (!token) {
        setError('No authentication token found');
        return;
      }

      const response = await axios.put(
        `http://localhost:5000/api/admin/queries/${selectedQuery._id}/update`,
        { 
          status: queryStatus,
          admin_notes: queryNotes 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setSuccess('Query updated successfully');
        setQueryDialogOpen(false);
        setSelectedQuery(null);
        setQueryStatus('');
        setQueryNotes('');
        
        // Refresh both queries and dashboard data
        await Promise.all([
          loadQueries(),
          loadDashboardData()
        ]);
      }
    } catch (error) {
      console.error('Error updating query:', error);
      setError('Failed to update query');
    } finally {
      setLoading(false);
    }
  };

  const openKYCDialog = (kyc, action) => {
    setSelectedKYC(kyc);
    setKycAction(action);
    setKycNotes('');
    setKycDialogOpen(true);
  };

  const openQueryDialog = (query) => {
    setSelectedQuery(query);
    setQueryStatus(query.status);
    setQueryNotes(query.admin_notes || '');
    setQueryDialogOpen(true);
  };

  const openViewMessageDialog = (query) => {
    setSelectedMessageQuery(query);
    setViewMessageDialogOpen(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'New': return 'error';
      case 'Read': return 'warning';
      case 'Resolved': return 'success';
      case 'Pending': return 'warning';
      case 'Verified': return 'success';
      case 'Rejected': return 'error';
      default: return 'default';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Admin Panel
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {dataLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Dashboard Stats */}
          {dashboardData && (
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Total Users
                    </Typography>
                    <Typography variant="h4">
                      {dashboardData.stats?.total_users || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Pending KYC
                    </Typography>
                    <Typography variant="h4" color="warning.main">
                      {dashboardData.stats?.pending_kyc || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Total Queries
                    </Typography>
                    <Typography variant="h4">
                      {dashboardData.stats?.total_queries || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      New Queries
                    </Typography>
                    <Typography variant="h4" color="error.main">
                      {dashboardData.stats?.new_queries || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Tabs - Only 2 tabs as requested */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
              <Tab label="Pending KYC" />
              <Tab label="Contact Queries" />
            </Tabs>
          </Box>

          {/* Pending KYC Tab */}
          <TabPanel value={tabValue} index={0}>
            <Typography variant="h6" gutterBottom>
              Pending KYC Submissions ({pendingKYC.length})
            </Typography>
            
            {pendingKYC.length === 0 ? (
              <Alert severity="info">No pending KYC submissions found</Alert>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Aadhar Number</TableCell>
                      <TableCell>Date of Birth</TableCell>
                      <TableCell>Gender</TableCell>
                      <TableCell>Address</TableCell>
                      <TableCell>Submitted</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pendingKYC.map((kyc) => (
                      <TableRow key={kyc._id}>
                        <TableCell>{kyc.name}</TableCell>
                        <TableCell>{kyc.aadhar_number}</TableCell>
                        <TableCell>{kyc.date_of_birth}</TableCell>
                        <TableCell>{kyc.gender}</TableCell>
                        <TableCell>{kyc.address}</TableCell>
                        <TableCell>
                          {new Date(kyc.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            color="success"
                            onClick={() => openKYCDialog(kyc, 'approve')}
                            sx={{ mr: 1 }}
                          >
                            Approve
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            onClick={() => openKYCDialog(kyc, 'reject')}
                          >
                            Reject
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>

          {/* Contact Queries Tab */}
          <TabPanel value={tabValue} index={1}>
            <Typography variant="h6" gutterBottom>
              Contact Queries ({queries.length})
            </Typography>
            
            {queries.length === 0 ? (
              <Alert severity="info">No contact queries found</Alert>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Phone</TableCell>
                      <TableCell>Subject</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Submitted</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {queries.map((query) => (
                      <TableRow key={query._id}>
                        <TableCell>{query.name}</TableCell>
                        <TableCell>{query.email}</TableCell>
                        <TableCell>{query.phone || '-'}</TableCell>
                        <TableCell>{query.subject}</TableCell>
                        <TableCell>
                          <Chip 
                            label={query.status} 
                            color={getStatusColor(query.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {new Date(query.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            color="info"
                            onClick={() => openViewMessageDialog(query)}
                            sx={{ mr: 1 }}
                          >
                            View Message
                          </Button>
                          <Button
                            size="small"
                            color="primary"
                            onClick={() => openQueryDialog(query)}
                          >
                            Update
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>

          {/* KYC Action Dialog */}
          <Dialog open={kycDialogOpen} onClose={() => setKycDialogOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle>
              {kycAction === 'approve' ? 'Approve' : 'Reject'} KYC Submission
            </DialogTitle>
            <DialogContent>
              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>Name:</strong> {selectedKYC?.name}<br />
                <strong>Aadhar:</strong> {selectedKYC?.aadhar_number}
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Admin Notes"
                value={kycNotes}
                onChange={(e) => setKycNotes(e.target.value)}
                placeholder={`Enter notes for ${kycAction === 'approve' ? 'approval' : 'rejection'}...`}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setKycDialogOpen(false)}>Cancel</Button>
              <Button 
                onClick={handleKYCUpdate} 
                variant="contained"
                color={kycAction === 'approve' ? 'success' : 'error'}
                disabled={loading || !kycNotes.trim()}
              >
                {loading ? <CircularProgress size={20} /> : kycAction === 'approve' ? 'Approve' : 'Reject'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Query Update Dialog */}
          <Dialog open={queryDialogOpen} onClose={() => setQueryDialogOpen(false)} maxWidth="md" fullWidth>
            <DialogTitle>Update Query Status</DialogTitle>
            <DialogContent>
              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>From:</strong> {selectedQuery?.name} ({selectedQuery?.email})<br />
                <strong>Subject:</strong> {selectedQuery?.subject}<br />
                {selectedQuery?.phone && <><strong>Phone:</strong> {selectedQuery.phone}<br /></>}
                <strong>Submitted:</strong> {new Date(selectedQuery?.created_at).toLocaleString()}
              </Typography>
              
              {/* Display the user's message */}
              <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1, border: '1px solid', borderColor: 'grey.300' }}>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  <strong>User's Message:</strong>
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {selectedQuery?.message}
                </Typography>
              </Box>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="query-status-label">Status</InputLabel>
                <Select
                  labelId="query-status-label"
                  value={queryStatus}
                  label="Status"
                  onChange={(e) => setQueryStatus(e.target.value)}
                >
                  <MenuItem value="New">New</MenuItem>
                  <MenuItem value="Read">Read</MenuItem>
                  <MenuItem value="Resolved">Resolved</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Admin Notes"
                value={queryNotes}
                onChange={(e) => setQueryNotes(e.target.value)}
                placeholder="Enter admin notes..."
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setQueryDialogOpen(false)}>Cancel</Button>
              <Button 
                onClick={handleQueryUpdate} 
                variant="contained"
                disabled={loading || !queryStatus || !queryNotes.trim()}
              >
                {loading ? <CircularProgress size={20} /> : 'Update'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* View Message Dialog */}
          <Dialog open={viewMessageDialogOpen} onClose={() => setViewMessageDialogOpen(false)} maxWidth="md" fullWidth>
            <DialogTitle>View Query Message</DialogTitle>
            <DialogContent>
              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>From:</strong> {selectedMessageQuery?.name} ({selectedMessageQuery?.email})<br />
                <strong>Subject:</strong> {selectedMessageQuery?.subject}<br />
                {selectedMessageQuery?.phone && <><strong>Phone:</strong> {selectedMessageQuery.phone}<br /></>}
                <strong>Status:</strong> 
                <Chip 
                  label={selectedMessageQuery?.status} 
                  color={getStatusColor(selectedMessageQuery?.status)}
                  size="small"
                  sx={{ ml: 1 }}
                /><br />
                <strong>Submitted:</strong> {selectedMessageQuery?.created_at ? new Date(selectedMessageQuery.created_at).toLocaleString() : 'N/A'}
              </Typography>
              
              {/* Display the user's message */}
              <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1, border: '1px solid', borderColor: 'grey.300' }}>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  <strong>User's Message:</strong>
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {selectedMessageQuery?.message}
                </Typography>
              </Box>
              
              {/* Display admin notes if any */}
              {selectedMessageQuery?.admin_notes && (
                <Box sx={{ p: 2, bgcolor: 'blue.50', borderRadius: 1, border: '1px solid', borderColor: 'blue.300' }}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    <strong>Admin Notes:</strong>
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {selectedMessageQuery.admin_notes}
                  </Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setViewMessageDialogOpen(false)}>Close</Button>
              <Button 
                onClick={() => {
                  setViewMessageDialogOpen(false);
                  openQueryDialog(selectedMessageQuery);
                }} 
                variant="contained"
                color="primary"
              >
                Update Status
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </Container>
  );
}

export default AdminPanel;
