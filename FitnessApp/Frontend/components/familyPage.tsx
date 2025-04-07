import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,
  Divider,
  SelectChangeEvent,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  IconButton,
  Tooltip,
  Alert,
  Snackbar,
  Badge,
  Menu,
  ListItem,
  ListItemText,
  List,
  ListItemAvatar,
  ListItemSecondaryAction,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

// Import the family service
import { familyService } from '../services/familyService';
import { USERNAME_KEY } from '../utils/secureStorage';

// Define TypeScript interfaces
interface Family {
  id: number;
  name: string;
}

interface FamilyMember {
  id?: number;
  username: string;
  firstName: string;
  lastName: string;
  joinDate: string;
  isAdmin: boolean;
}

interface FamilyInvitation {
  id: number | string;
  familyName: string;
  fromUsername: string;
  timestamp: string;
  status: string;
  read: boolean;
}

const FamilyPage: React.FC = () => {
  // State for families and selection
  const [families, setFamilies] = useState<Family[]>([]);
  const [selectedFamily, setSelectedFamily] = useState<string>('');
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<FamilyMember[]>([]);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [currentUsername, setCurrentUsername] = useState<string>('');
  
  // State for invite dialog
  const [inviteDialogOpen, setInviteDialogOpen] = useState<boolean>(false);
  const [inviteUsername, setInviteUsername] = useState<string>('');
  
  // State for remove member dialog
  const [removeDialogOpen, setRemoveDialogOpen] = useState<boolean>(false);
  const [memberToRemove, setMemberToRemove] = useState<FamilyMember | null>(null);
  
  // State for promote to admin dialog
  const [promoteDialogOpen, setPromoteDialogOpen] = useState<boolean>(false);
  const [memberToPromote, setMemberToPromote] = useState<FamilyMember | null>(null);
  
  // State for leave family dialog
  const [leaveDialogOpen, setLeaveDialogOpen] = useState<boolean>(false);
  
  // State for delete family dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);

  // State for create family dialog
  const [createFamilyDialogOpen, setCreateFamilyDialogOpen] = useState<boolean>(false);
  const [newFamilyName, setNewFamilyName] = useState<string>('');

  // State for notifications
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  
  // State for notification menu
  const [notificationAnchorEl, setNotificationAnchorEl] = useState<null | HTMLElement>(null);
  const [invitations, setInvitations] = useState<FamilyInvitation[]>([]);

  // State for member search/filtering
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Loading states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingFamilies, setLoadingFamilies] = useState<boolean>(false);
  const [loadingMembers, setLoadingMembers] = useState<boolean>(false);
  const [loadingInvitations, setLoadingInvitations] = useState<boolean>(false);

  // Get current username when component mounts
  useEffect(() => {
    const username = localStorage.getItem(USERNAME_KEY) || '';
    setCurrentUsername(username);
  }, []);

  // Load families and invitations on initial render and set up polling
  useEffect(() => {
    // Fetch families when component mounts
    fetchFamilies();
    
    // Other initialization code can stay
    fetchInvitations();
    
    // Set up polling interval
    const intervalId = setInterval(() => {
      fetchInvitations();
    }, 30000); // Check every 30 seconds
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  // Log families state whenever it changes
  useEffect(() => {
    console.log('Current families state:', families);
  }, [families]);

  // Load family members when selected family changes
  useEffect(() => {
    if (selectedFamily !== '') {
      fetchFamilyMembers(selectedFamily);
    } else {
      setFamilyMembers([]);
      setFilteredMembers([]);
      setIsAdmin(false);
    }
  }, [selectedFamily]);

  // Apply search filter when query or members change
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredMembers(familyMembers);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredMembers(
        familyMembers.filter(
          member => 
            member.username.toLowerCase().includes(query) ||
            member.firstName.toLowerCase().includes(query) ||
            member.lastName.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, familyMembers]);

  const fetchFamilies = async () => {
    try {
      setLoadingFamilies(true);

      // Fetch families from the service
      const response = await familyService.getFamilies();
      console.log('Raw API response from getFamilies:', response);

      // Ensure the response is an array
      if (!Array.isArray(response)) {
        throw new Error('Unexpected response format: Expected an array');
      }

      // Transform the response to match the Family interface
      const transformedFamilies = response.map((family: any) => ({
        id: family.family_id, // Use family_id from the response
        name: family.family_name, // Use family_name from the response
      }));

      console.log('Transformed families for dropdown:', transformedFamilies);
      setFamilies(transformedFamilies);
    } catch (error) {
      console.error('Error fetching families:', error);
      setSnackbarMessage('Failed to load families. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoadingFamilies(false);
    }
  };

  const fetchFamilyMembers = async (familyName: string) => {
    try {
      setLoadingMembers(true);

      // Fetch family members from the service
      const response = await familyService.getFamilyMembers(familyName);
      console.log(`Fetched members for family ${familyName}:`, response);

      // Ensure the response contains the expected structure
      if (response && typeof response === 'object' && 'members' in response && Array.isArray(response.members)) {
        // Transform API response to match our FamilyMember interface
        const members = response.members.map((member: any, index) => ({
          id: index + 1, // Generate an ID if the API doesn't provide one
          username: member.username,
          firstName: member.fname,
          lastName: member.lname,
          joinDate: member.join_date || new Date().toISOString().split('T')[0], // Default to today if not provided
          isAdmin: member.is_admin,
        }));

        setFamilyMembers(members);

        // Check if the current user is an admin
        const currentUserIsAdmin = members.some(
          (member) => member.isAdmin && member.username === currentUsername
        );
        setIsAdmin(currentUserIsAdmin);
      } else {
        console.warn('Unexpected response structure:', response);
        setFamilyMembers([]);
      }
    } catch (error) {
      console.error(`Error fetching members for family:`, error);
      setSnackbarMessage('Failed to load family members. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoadingMembers(false);
    }
  };

  const fetchInvitations = async () => {
    try {
      setLoadingInvitations(true);
      const response = await familyService.getNotifications();

      console.log('Fetched notifications:', response);

      // Transform the API response to match our component's expected format
      const familyInvitations = response
        .filter((request: any) => request.status === 'pending')
        .map((request: any) => ({
          id: request.request_id,
          familyName: request.family_name,
          fromUsername: request.sender_username,
          timestamp: request.created_at,
          status: request.status,
          read: false, // Assume unread unless specified
        }));

      setInvitations(familyInvitations);
    } catch (error) {
      console.error('Error fetching invitations:', error);
      // Don't show an error snackbar for invitations, as it's not critical
    } finally {
      setLoadingInvitations(false);
    }
  };

  const handleFamilyChange = (event: SelectChangeEvent<string>) => {
    setSelectedFamily(event.target.value);
  };

  const stringToColor = (string: string): string => {
    let hash = 0;
    for (let i = 0; string.length > i; i++) {
      hash = string.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = '#';
    for (let i = 0; 3 > i; i++) {
      const value = (hash >> (i * 8)) & 0xff;
      color += `00${value.toString(16)}`.slice(-2);
    }
    return color;
  };

  const formatDate = (dateString: string): string => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatTimeAgo = (dateString: string): string => {
    // Try to parse the date in multiple formats (in case the format changes)
    let date;
    try {
      date = new Date(dateString);
      if (isNaN(date.getTime())) {
        // If invalid, default to current time minus 1 day
        date = new Date();
        date.setDate(date.getDate() - 1);
      }
    } catch (e) {
      // If parsing fails, default to current time minus 1 day
      date = new Date();
      date.setDate(date.getDate() - 1);
    }
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
  
    if (diffDay > 0) {
      return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    } else if (diffHour > 0) {
      return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    } else if (diffMin > 0) {
      return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  const handleInviteOpen = () => {
    setInviteDialogOpen(true);
  };

  const handleInviteClose = () => {
    setInviteDialogOpen(false);
    setInviteUsername('');
  };

  const handleInviteSubmit = async () => {
    try {
      setIsLoading(true);
      
      // Send the invitation using the selected family name
      await familyService.sendFamilyInvitation(selectedFamily, inviteUsername);
      
      setSnackbarMessage(`Invitation sent to ${inviteUsername}`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      handleInviteClose();
    } catch (error) {
      console.error('Error inviting user:', error);
      setSnackbarMessage('Failed to send invitation. Please check the username and try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveOpen = (member: FamilyMember) => {
    setMemberToRemove(member);
    setRemoveDialogOpen(true);
  };

  const handleRemoveClose = () => {
    setRemoveDialogOpen(false);
    setMemberToRemove(null);
  };

  const handleRemoveSubmit = async () => {
    if (!memberToRemove) return;
    try {
      setIsLoading(true);
      
      // Only allow admin to remove users
      if (!isAdmin) {
        setSnackbarMessage('You need admin privileges to remove members');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        handleRemoveClose();
        return;
      }
      
      // Send the request with family name and username
      await familyService.removeUser(selectedFamily, memberToRemove.username);
      
      // Update the UI
      setFamilyMembers(prevMembers => prevMembers.filter(m => m.username !== memberToRemove.username));
      
      setSnackbarMessage(`${memberToRemove.username} has been removed from the family`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      handleRemoveClose();
    } catch (error) {
      console.error('Error removing member:', error);
      setSnackbarMessage('Failed to remove member. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromoteOpen = (member: FamilyMember) => {
    setMemberToPromote(member);
    setPromoteDialogOpen(true);
  };

  const handlePromoteClose = () => {
    setPromoteDialogOpen(false);
    setMemberToPromote(null);
  };

  const handlePromoteSubmit = async () => {
    if (!memberToPromote) return;
    try {
      setIsLoading(true);
      
      // Only allow admin to promote users
      if (!isAdmin) {
        setSnackbarMessage('You need admin privileges to promote members');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        handlePromoteClose();
        return;
      }
      
      // Send the request with family name and username
      await familyService.promoteToAdmin(selectedFamily, memberToPromote.username);
      
      // Update the UI to reflect the change
      setFamilyMembers(prevMembers => 
        prevMembers.map(m => 
          m.username === memberToPromote.username ? { ...m, isAdmin: true } : m
        )
      );
      
      setSnackbarMessage(`${memberToPromote.username} has been promoted to admin`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      handlePromoteClose();
      
      // Refresh family members to get updated admin status
      await fetchFamilyMembers(selectedFamily);
    } catch (error) {
      console.error('Error promoting member:', error);
      setSnackbarMessage('Failed to promote member. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveOpen = () => {
    setLeaveDialogOpen(true);
  };

  const handleLeaveClose = () => {
    setLeaveDialogOpen(false);
  };

  const handleLeaveSubmit = async () => {
    try {
      setIsLoading(true);
      
      // Send leave request with family name
      await familyService.leaveFamily(selectedFamily);
      
      setSnackbarMessage(`You have left ${selectedFamily}`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setSelectedFamily('');
      handleLeaveClose();
      
      // Refresh the families list to reflect changes
      fetchFamilies();
    } catch (error: any) {
      console.error('Error leaving family:', error);
      setSnackbarMessage(error.message || 'Failed to leave family. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteOpen = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteClose = () => {
    setDeleteDialogOpen(false);
  };

  const handleDeleteSubmit = async () => {
    try {
      setIsLoading(true);
      
      // Only allow admin to delete the family
      if (!isAdmin) {
        setSnackbarMessage('You need admin privileges to delete this family');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        handleDeleteClose();
        return;
      }
      
      // Send the delete request with family name
      await familyService.deleteFamily(selectedFamily);
      
      setSnackbarMessage(`Family "${selectedFamily}" has been deleted`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setSelectedFamily('');
      handleDeleteClose();
      
      // Refresh the families list
      fetchFamilies();
    } catch (error) {
      console.error('Error deleting family:', error);
      setSnackbarMessage('Failed to delete family. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFamilyOpen = () => {
    setCreateFamilyDialogOpen(true);
  };

  const handleCreateFamilyClose = () => {
    setCreateFamilyDialogOpen(false);
    setNewFamilyName('');
  };

  const handleCreateFamilySubmit = async () => {
    try {
      setIsLoading(true);
      const response = await familyService.createFamily(newFamilyName);
      console.log('Family created:', response);
      
      setSnackbarMessage(`Family "${newFamilyName}" created successfully!`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      
      // Refresh the families list
      await fetchFamilies();
      
      // After refreshing families, select the newly created family
      setSelectedFamily(newFamilyName);
      
      handleCreateFamilyClose();
    } catch (error) {
      console.error('Error creating family:', error);
      setSnackbarMessage('Failed to create family. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationClick = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchorEl(null);
  };

  const handleAcceptInvitation = async (invitation: FamilyInvitation) => {
    try {
      setIsLoading(true);
      
      // Accept the invitation with the proper request format
      // Convert to number if it's a string
      const invitationId = typeof invitation.id === 'string' ? parseInt(invitation.id, 10) : invitation.id;
      await familyService.acceptFamilyInvitation(invitationId);
      
      // Remove from invitations list
      setInvitations(prevInvitations => prevInvitations.filter(inv => inv.id !== invitation.id));
      
      setSnackbarMessage(`You have joined ${invitation.familyName}!`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      
      // Refresh families
      await fetchFamilies();
      
      // Select the new family by name
      setSelectedFamily(invitation.familyName);
      
      handleNotificationClose();
    } catch (error) {
      console.error('Error accepting invitation:', error);
      setSnackbarMessage('Failed to accept invitation. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeclineInvitation = async (invitation: FamilyInvitation) => {
    try {
      setIsLoading(true);
      
      // Decline the invitation with the proper request format
      // Convert to number if it's a string
      const invitationId = typeof invitation.id === 'string' ? parseInt(invitation.id, 10) : invitation.id;
      await familyService.declineFamilyInvitation(invitationId);
      
      // Remove from invitations list
      setInvitations(prevInvitations => prevInvitations.filter(inv => inv.id !== invitation.id));
      
      setSnackbarMessage(`Invitation to ${invitation.familyName} declined`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      handleNotificationClose();
    } catch (error) {
      console.error('Error declining invitation:', error);
      setSnackbarMessage('Failed to decline invitation. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  const isOnlyAdmin = 
    isAdmin && 
    familyMembers.filter(member => member.isAdmin).length === 1 &&
    familyMembers.some(member => member.username === currentUsername && member.isAdmin);

  return (
    <Box 
      sx={{ 
        height: '100%',
        overflow: 'auto', 
        display: 'flex', 
        flexDirection: 'column',
        position: 'relative'
      }}
    >
      {/* Notifications bell */}
      <Box sx={{ position: 'absolute', top: 10, right: 20, zIndex: 1000 }}>
        <Tooltip title="Invitations">
          <IconButton 
            color="primary"
            onClick={handleNotificationClick}
            size="large"
          >
            <Badge badgeContent={invitations.filter(inv => !inv.read).length} 
              color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
        </Tooltip>
      </Box>

      {/* Notifications menu */}
      <Menu
        anchorEl={notificationAnchorEl}
        open={Boolean(notificationAnchorEl)}
        onClose={handleNotificationClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: { 
            width: 320,
            maxHeight: 400,
            overflow: 'auto'
          }
        }}
      >
        <Box sx={{ p: 1, bgcolor: 'primary.main', color: 'white' }}>
          <Typography variant="subtitle1">Family Invitations</Typography>
        </Box>
        {invitations.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No pending invitations
            </Typography>
          </Box>
        ) : (
            <List sx={{ width: '100%', p: 0 }}>
              {invitations.map((invitation) => (
                <React.Fragment key={invitation.id}>
                  <ListItem
                    alignItems="flex-start"
                    sx={{
                      backgroundColor: invitation.read ? 'transparent' : 'rgba(25, 118, 210, 0.08)'
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: stringToColor(invitation.familyName) }}>
                        {invitation.familyName.charAt(0)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={`Join ${invitation.familyName}`}
                      secondary={
                        <React.Fragment>
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.primary"
                          >
                            From: {invitation.fromUsername}
                          </Typography>
                          <br />
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.secondary"
                          >
                            {formatTimeAgo(invitation.timestamp)}
                          </Typography>
                        </React.Fragment>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Tooltip title="Accept">
                        <IconButton
                          edge="end"
                          color="success"
                          onClick={() => handleAcceptInvitation(invitation)}
                          disabled={isLoading}
                        >
                          <CheckCircleIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Decline">
                        <IconButton
                          edge="end"
                          color="error"
                          onClick={() => handleDeclineInvitation(invitation)}
                          disabled={isLoading}
                          sx={{ ml: 1 }}
                        >
                          <CancelIcon />
                        </IconButton>
                      </Tooltip>
                    </ListItemSecondaryAction>
                  </ListItem>
                  <Divider variant="inset" component="li" />
                </React.Fragment>
              ))}
            </List>
        )}
      </Menu>

      <Container maxWidth="lg" sx={{ mt: 4, flexGrow: 1 }}>
        <Typography variant="h3" gutterBottom component="div" align="center">
          Family
        </Typography>
        
        {/* Family selector and create button */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1">
              Select a family or create a new one:
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleCreateFamilyOpen}
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Family'}
            </Button>
          </Box>
          {/* Family Selection Dropdown - Updated with better styling */}
          <FormControl 
            variant="outlined" 
            sx={{ 
              m: 1, 
              minWidth: { xs: '100%', sm: 300 },  // Wider on all screens, full width on mobile
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              flexGrow: 1
            }}
            disabled={loadingFamilies}
          >
            <Box sx={{ flexGrow: 1 }}>
              <InputLabel id="family-select-label">Select Family</InputLabel>
              <Select
                labelId="family-select-label"
                id="family-select"
                value={selectedFamily}
                onChange={(e) => {
                  const newFamilyName = e.target.value;
                  console.log('Selected family:', newFamilyName);
                  setSelectedFamily(newFamilyName);
                  // If a family is selected, fetch its members
                  if (newFamilyName) {
                    fetchFamilyMembers(newFamilyName);
                  }
                }}
                label="Select Family"
                sx={{ width: '100%' }} // Make select take full width of its container
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 300,
                      width: 'auto',
                      minWidth: '250px' // Ensure menu is wide enough
                    }
                  }
                }}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {families.map((family) => (
                  <MenuItem key={family.id} value={family.name}>
                    {family.name}
                  </MenuItem>
                ))}
              </Select>
            </Box>
            {loadingFamilies && (
              <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                <CircularProgress size={24} />
              </Box>
            )}
          </FormControl>
        </Box>

        <Divider sx={{ my: 3 }} />
        
        {selectedFamily !== '' ? (
          <>
            {/* Family actions */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5">
                Members of {selectedFamily}
              </Typography>
              
              <Box>
                {isAdmin && (
                  <>
                    <Button 
                      variant="contained" 
                      color="primary" 
                      startIcon={<PersonAddIcon />}
                      onClick={handleInviteOpen}
                      sx={{ mr: 1 }}
                      disabled={isLoading}
                    >
                      Invite Member
                    </Button>
                    <Button 
                      variant="contained" 
                      color="error" 
                      startIcon={<DeleteForeverIcon />}
                      onClick={handleDeleteOpen}
                      sx={{ mr: 1 }}
                      disabled={isLoading}
                    >
                      Delete Family
                    </Button>
                  </>
                )}
                
                <Tooltip 
                  title={isOnlyAdmin ? "You can't leave as the only admin. Promote another member first." : ""}
                >
                  <span>
                    <Button 
                      variant="outlined" 
                      color="error" 
                      startIcon={<ExitToAppIcon />}
                      onClick={handleLeaveOpen}
                      disabled={isOnlyAdmin || isLoading}
                    >
                      Leave Family
                    </Button>
                  </span>
                </Tooltip>
              </Box>
            </Box>
            
            {/* Search box */}
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                variant="outlined"
                size="small"
                placeholder="Search members by name or username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={handleClearSearch}>
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                }}
              />
            </Box>
            
            {/* Search results info */}
            {searchQuery && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Showing {filteredMembers.length} of {familyMembers.length} members
              </Typography>
            )}
            
            {/* Members table */}
            <TableContainer 
              component={Paper} 
              elevation={3} 
              sx={{ 
                mt: 2,
                mb: 4,
                maxHeight: '55vh',
                overflow: 'auto'
              }}
            >
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ backgroundColor: 'primary.main', color: 'white' }}>Member</TableCell>
                    <TableCell sx={{ backgroundColor: 'primary.main', color: 'white' }}>Username</TableCell>
                    <TableCell sx={{ backgroundColor: 'primary.main', color: 'white' }}>Name</TableCell>
                    <TableCell sx={{ backgroundColor: 'primary.main', color: 'white' }}>Joined</TableCell>
                    <TableCell sx={{ backgroundColor: 'primary.main', color: 'white' }}>Status</TableCell>
                    {isAdmin && (
                      <TableCell sx={{ backgroundColor: 'primary.main', color: 'white' }}>Actions</TableCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loadingMembers ? (
                    <TableRow>
                      <TableCell colSpan={isAdmin ? 6 : 5} align="center" sx={{ py: 3 }}>
                        <Typography>Loading members...</Typography>
                      </TableCell>
                    </TableRow>
                  ) : filteredMembers.length > 0 ? (
                    filteredMembers.map((member) => (
                      <TableRow 
                        key={member.username}
                        hover
                        sx={{ 
                          '&:last-child td, &:last-child th': { border: 0 },
                          ...(member.username === currentUsername ? { bgcolor: 'rgba(0, 150, 136, 0.08)' } : {})
                        }}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar 
                              sx={{ 
                                bgcolor: stringToColor(member.username),
                                mr: 2
                              }}
                            >
                              {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                            </Avatar>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {member.username}
                          {member.username === currentUsername && (
                            <Chip 
                              label="You" 
                              size="small" 
                              variant="outlined" 
                              color="success" 
                              sx={{ ml: 1 }} 
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          {`${member.firstName} ${member.lastName}`}
                        </TableCell>
                        <TableCell>
                          {formatDate(member.joinDate)}
                        </TableCell>
                        <TableCell>
                          {member.isAdmin ? (
                            <Chip
                              icon={<AdminPanelSettingsIcon />}
                              label="Admin"
                              color="primary"
                              variant="outlined"
                            />
                          ) : (
                            <Chip
                              icon={<PersonIcon />}
                              label="Member"
                              color="default"
                              variant="outlined"
                            />
                          )}
                        </TableCell>
                        {isAdmin && (
                          <TableCell>
                            {!member.isAdmin && member.username !== currentUsername && (
                              <>
                                <Tooltip title="Promote to admin">
                                  <IconButton 
                                    color="primary" 
                                    onClick={() => handlePromoteOpen(member)}
                                    sx={{ mr: 1 }}
                                    disabled={isLoading}
                                  >
                                    <SupervisorAccountIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Remove member">
                                  <IconButton 
                                    color="error" 
                                    onClick={() => handleRemoveOpen(member)}
                                    disabled={isLoading}
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={isAdmin ? 6 : 5} align="center" sx={{ py: 3 }}>
                        {searchQuery ? (
                          <Typography variant="body1" color="text.secondary">
                            No members found matching your search
                          </Typography>
                        ) : (
                          <Typography variant="body1" color="text.secondary">
                            No family members to display
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        ) : (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            height: '200px',
            backgroundColor: '#f5f5f5',
            borderRadius: 2
          }}>
            <Typography variant="h6" color="text.secondary">
              Please select a family to view members
            </Typography>
          </Box>
        )}
        
        <Box sx={{ height: '80px' }} />
      </Container>
      
      {/* Invite dialog */}
      <Dialog open={inviteDialogOpen} onClose={handleInviteClose}>
        <DialogTitle>
          Invite Member to Family
          <IconButton
            aria-label="close"
            onClick={handleInviteClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Enter the username of the person you want to invite to your family.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="username"
            label="Username"
            type="text"
            fullWidth
            variant="outlined"
            value={inviteUsername}
            onChange={(e) => setInviteUsername(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleInviteClose} color="primary" disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleInviteSubmit} 
            color="primary" 
            variant="contained" 
            disabled={!inviteUsername.trim() || isLoading}
          >
            {isLoading ? 'Sending...' : 'Send Invitation'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Remove dialog */}
      <Dialog open={removeDialogOpen} onClose={handleRemoveClose}>
        <DialogTitle>Confirm Removal</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove {memberToRemove?.username} from the family?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRemoveClose} color="primary" disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleRemoveSubmit} color="error" variant="contained" disabled={isLoading}>
            {isLoading ? 'Removing...' : 'Remove'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Promote dialog */}
      <Dialog open={promoteDialogOpen} onClose={handlePromoteClose}>
        <DialogTitle>Promote to Admin</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to promote {memberToPromote?.username} to admin? 
            They will have full administrative rights to the family.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePromoteClose} color="primary" disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handlePromoteSubmit} color="primary" variant="contained" disabled={isLoading}>
            {isLoading ? 'Promoting...' : 'Promote'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Leave dialog */}
      <Dialog open={leaveDialogOpen} onClose={handleLeaveClose}>
        <DialogTitle>Leave Family</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to leave this family? 
            {isAdmin && familyMembers.filter(m => m.isAdmin).length === 1 && (
              <Typography color="error" sx={{ mt: 2 }}>
                <strong>Warning:</strong> You are the only admin of this family. 
                If you leave, you should promote another member to admin first.
              </Typography>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleLeaveClose} color="primary" disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleLeaveSubmit} 
            color="error" 
            variant="contained" 
            disabled={isOnlyAdmin || isLoading}
          >
            {isLoading ? 'Leaving...' : 'Leave Family'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteClose}>
        <DialogTitle>Delete Family</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this family? This action is permanent and cannot be undone.
            All members will be removed from the family.
          </DialogContentText>
          <Typography color="error" sx={{ mt: 2, fontWeight: 'bold' }}>
            This action cannot be undone!
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteClose} color="primary" disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleDeleteSubmit} color="error" variant="contained" disabled={isLoading}>
            {isLoading ? 'Deleting...' : 'Delete Family'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Create family dialog */}
      <Dialog open={createFamilyDialogOpen} onClose={handleCreateFamilyClose}>
        <DialogTitle>
          Create New Family
          <IconButton
            aria-label="close"
            onClick={handleCreateFamilyClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Enter a name for your new family group. You'll be automatically added as the admin.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="familyName"
            label="Family Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newFamilyName}
            onChange={(e) => setNewFamilyName(e.target.value)}
            helperText="Choose a meaningful name that represents your family or group"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCreateFamilyClose} color="primary" disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateFamilySubmit} 
            color="primary" 
            variant="contained" 
            disabled={!newFamilyName.trim() || isLoading}
          >
            {isLoading ? 'Creating...' : 'Create Family'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications - moved to top center for better visibility */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ 
          mt: 2, // Add margin top
          width: { xs: '90%', sm: '80%', md: '60%' }, // Make it responsive
          '& .MuiAlert-root': {
            width: '100%'
          }
        }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbarSeverity}
          variant="filled" // Make alerts more prominent
          elevation={6} // Add shadow for better visibility
          sx={{ 
            width: '100%',
            fontSize: '1rem' // Slightly larger text
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FamilyPage;