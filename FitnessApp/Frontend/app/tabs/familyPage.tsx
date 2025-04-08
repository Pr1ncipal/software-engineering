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

// Define TypeScript interfaces
interface Family {
  id: number;
  name: string;
}

interface FamilyMember {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  joinDate: string;
  isAdmin: boolean;
}

interface FamilyInvitation {
  id: number;
  familyId: number;
  familyName: string;
  fromUsername: string;
  timestamp: string;
}

// Use a record type for the family members mapping
type FamilyMembersMap = Record<number, FamilyMember[]>;

// Sample data - replace with actual API calls
const sampleFamilies: Family[] = [
  { id: 1, name: 'Smith Family' },
  { id: 2, name: 'Johnson Family' },
  { id: 3, name: 'Fitness Buddies' }
];

// Add more sample family members to demonstrate scrolling
const sampleFamilyMembers: FamilyMembersMap = {
  1: [
    { id: 101, username: 'john_smith', firstName: 'John', lastName: 'Smith', joinDate: '2023-01-15', isAdmin: true },
    { id: 102, username: 'sarah_smith', firstName: 'Sarah', lastName: 'Smith', joinDate: '2023-01-15', isAdmin: false },
    { id: 103, username: 'mike_smith', firstName: 'Mike', lastName: 'Smith', joinDate: '2023-02-20', isAdmin: false },
    { id: 104, username: 'amy_smith', firstName: 'Amy', lastName: 'Smith', joinDate: '2023-03-05', isAdmin: false },
    { id: 105, username: 'robert_smith', firstName: 'Robert', lastName: 'Smith', joinDate: '2023-04-10', isAdmin: false },
    { id: 106, username: 'emma_smith', firstName: 'Emma', lastName: 'Smith', joinDate: '2023-05-12', isAdmin: false },
    { id: 107, username: 'jason_smith', firstName: 'Jason', lastName: 'Smith', joinDate: '2023-06-15', isAdmin: false },
    { id: 108, username: 'olivia_smith', firstName: 'Olivia', lastName: 'Smith', joinDate: '2023-07-20', isAdmin: false },
    { id: 109, username: 'william_smith', firstName: 'William', lastName: 'Smith', joinDate: '2023-08-25', isAdmin: false },
    { id: 110, username: 'sophia_smith', firstName: 'Sophia', lastName: 'Smith', joinDate: '2023-09-30', isAdmin: false }
  ],
  2: [
    { id: 201, username: 'david_johnson', firstName: 'David', lastName: 'Johnson', joinDate: '2023-03-10', isAdmin: true },
    { id: 202, username: 'lisa_johnson', firstName: 'Lisa', lastName: 'Johnson', joinDate: '2023-03-10', isAdmin: false }
  ],
  3: [
    { id: 301, username: 'fitness_guru', firstName: 'Alex', lastName: 'Trainer', joinDate: '2022-11-05', isAdmin: true },
    { id: 302, username: 'runner123', firstName: 'Jessica', lastName: 'Runner', joinDate: '2022-12-15', isAdmin: false },
    { id: 303, username: 'yoga_master', firstName: 'Sam', lastName: 'Flexible', joinDate: '2023-01-20', isAdmin: false },
    { id: 304, username: 'gym_rat', firstName: 'Chris', lastName: 'Weights', joinDate: '2023-02-25', isAdmin: false }
  ]
};

// Sample invitations data
const sampleInvitations: FamilyInvitation[] = [
  {
    id: 1,
    familyId: 3,
    familyName: 'Fitness Buddies',
    fromUsername: 'fitness_guru',
    timestamp: '2023-04-01T14:23:45Z'
  },
  {
    id: 2,
    familyId: 2,
    familyName: 'Johnson Family',
    fromUsername: 'david_johnson',
    timestamp: '2023-04-02T09:12:33Z'
  }
];

const FamilyPage: React.FC = () => {
  const [selectedFamily, setSelectedFamily] = useState<number | ''>('');
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<FamilyMember[]>([]);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [currentUserId] = useState<number>(101); // For demo purposes, assuming current user is John Smith
  
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
  const [invitations, setInvitations] = useState<FamilyInvitation[]>(sampleInvitations);

  // State for member search/filtering
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    // If a family is selected, fetch its members
    // This would be replaced with an actual API call
    if (selectedFamily !== '') {
      const members = sampleFamilyMembers[selectedFamily as number] || [];
      setFamilyMembers(members);
      
      // Apply search filter if there's a query
      if (searchQuery.trim() === '') {
        setFilteredMembers(members);
      } else {
        const query = searchQuery.toLowerCase();
        setFilteredMembers(
          members.filter(
            member => 
              member.username.toLowerCase().includes(query) ||
              member.firstName.toLowerCase().includes(query) ||
              member.lastName.toLowerCase().includes(query)
          )
        );
      }
      
      // Check if current user is admin
      const currentUserIsAdmin = members.some(member => member.isAdmin && member.id === currentUserId);
      setIsAdmin(currentUserIsAdmin);
    } else {
      setFamilyMembers([]);
      setFilteredMembers([]);
      setIsAdmin(false);
    }

    // In a real app, fetch invitations from the backend
    // For now, we use the sample data
  }, [selectedFamily, currentUserId, searchQuery]);

  const handleFamilyChange = (event: SelectChangeEvent<number | ''>) => {
    setSelectedFamily(event.target.value as number | '');
  };

  // Generate a color based on username for avatar
  const stringToColor = (string: string): string => {
    let hash = 0;
    for (let i = 0; i < string.length; i++) {
      hash = string.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = '#';
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xff;
      color += `00${value.toString(16)}`.slice(-2);
    }
    return color;
  };

  // Format date to be more readable
  const formatDate = (dateString: string): string => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Format time ago for notifications
  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
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

  // Handler for the invite button
  const handleInviteOpen = () => {
    setInviteDialogOpen(true);
  };

  const handleInviteClose = () => {
    setInviteDialogOpen(false);
    setInviteUsername('');
  };

  const handleInviteSubmit = () => {
    // Here you would call your API to invite the user
    console.log(`Inviting user: ${inviteUsername} to family ${selectedFamily}`);
    
    // Mock successful invitation
    setSnackbarMessage(`Invitation sent to ${inviteUsername}`);
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
    handleInviteClose();
  };

  // Handler for remove member button
  const handleRemoveOpen = (member: FamilyMember) => {
    setMemberToRemove(member);
    setRemoveDialogOpen(true);
  };

  const handleRemoveClose = () => {
    setRemoveDialogOpen(false);
    setMemberToRemove(null);
  };

  const handleRemoveSubmit = () => {
    if (!memberToRemove) return;
    
    // Here you would call your API to remove the member
    console.log(`Removing member: ${memberToRemove.username} from family ${selectedFamily}`);
    
    // Mock successful removal
    setFamilyMembers(prevMembers => prevMembers.filter(m => m.id !== memberToRemove.id));
    setSnackbarMessage(`${memberToRemove.username} has been removed from the family`);
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
    handleRemoveClose();
  };

  // Handler for promoting a member to admin
  const handlePromoteOpen = (member: FamilyMember) => {
    setMemberToPromote(member);
    setPromoteDialogOpen(true);
  };

  const handlePromoteClose = () => {
    setPromoteDialogOpen(false);
    setMemberToPromote(null);
  };

  const handlePromoteSubmit = () => {
    if (!memberToPromote) return;
    
    // Here you would call your API to promote the member to admin
    console.log(`Promoting ${memberToPromote.username} to admin of family ${selectedFamily}`);
    
    // Mock successful promotion
    setFamilyMembers(prevMembers => 
      prevMembers.map(m => 
        m.id === memberToPromote.id ? { ...m, isAdmin: true } : m
      )
    );
    setSnackbarMessage(`${memberToPromote.username} has been promoted to admin`);
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
    handlePromoteClose();
  };

  // Handler for leaving a family
  const handleLeaveOpen = () => {
    setLeaveDialogOpen(true);
  };

  const handleLeaveClose = () => {
    setLeaveDialogOpen(false);
  };

  const handleLeaveSubmit = () => {
    // Here you would call your API to leave the family
    console.log(`Leaving family ${selectedFamily}`);
    
    // Mock successful leaving
    const familyName = sampleFamilies.find(f => f.id === selectedFamily)?.name;
    setSnackbarMessage(`You have left ${familyName}`);
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
    setSelectedFamily('');  // Reset selected family
    handleLeaveClose();
  };

  // Handler for delete family button
  const handleDeleteOpen = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteClose = () => {
    setDeleteDialogOpen(false);
  };

  const handleDeleteSubmit = () => {
    // Here you would call your API to delete the family
    console.log(`Deleting family ${selectedFamily}`);
    
    // Mock successful deletion
    const familyName = sampleFamilies.find(f => f.id === selectedFamily)?.name;
    setSnackbarMessage(`Family "${familyName}" has been deleted`);
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
    setSelectedFamily('');  // Reset selected family
    handleDeleteClose();
  };

  // Handler for creating a new family
  const handleCreateFamilyOpen = () => {
    setCreateFamilyDialogOpen(true);
  };

  const handleCreateFamilyClose = () => {
    setCreateFamilyDialogOpen(false);
    setNewFamilyName('');
  };

  const handleCreateFamilySubmit = () => {
    // Here you would call your API to create a new family
    console.log(`Creating new family: ${newFamilyName}`);
    
    // Mock successful creation (in a real app, you'd get the new ID from the API)
    const newFamilyId = Math.max(...sampleFamilies.map(f => f.id)) + 1;
    
    // Add to sample families
    const newFamily = { id: newFamilyId, name: newFamilyName };
    // In a real app you'd refresh from API instead
    sampleFamilies.push(newFamily);
    
    // Create an entry for the new family in sampleFamilyMembers
    sampleFamilyMembers[newFamilyId] = [
      { 
        id: currentUserId, 
        username: 'john_smith', // This would come from current user data
        firstName: 'John', 
        lastName: 'Smith', 
        joinDate: new Date().toISOString().split('T')[0],
        isAdmin: true 
      }
    ];
    
    setSnackbarMessage(`Family "${newFamilyName}" created successfully!`);
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
    
    // Select the new family
    setSelectedFamily(newFamilyId);
    handleCreateFamilyClose();
  };

  // Handler for notification icon click
  const handleNotificationClick = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchorEl(null);
  };

  // Handler for accepting invitation
  const handleAcceptInvitation = (invitation: FamilyInvitation) => {
    // Here you would call your API to accept the invitation
    console.log(`Accepting invitation to join ${invitation.familyName}`);

    // Mock successful acceptance
    setInvitations(prevInvitations => prevInvitations.filter(inv => inv.id !== invitation.id));
    setSnackbarMessage(`You have joined ${invitation.familyName}!`);
    setSnackbarSeverity('success');
    setSnackbarOpen(true);

    // Optionally, refresh family list or switch to the new family
    setSelectedFamily(invitation.familyId);
    handleNotificationClose();
  };

  // Handler for declining invitation
  const handleDeclineInvitation = (invitation: FamilyInvitation) => {
    // Here you would call your API to decline the invitation
    console.log(`Declining invitation to join ${invitation.familyName}`);

    // Mock successful decline
    setInvitations(prevInvitations => prevInvitations.filter(inv => inv.id !== invitation.id));
    setSnackbarMessage(`Invitation to ${invitation.familyName} declined`);
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
    
    handleNotificationClose();
  };

  // Handler for clearing search
  const handleClearSearch = () => {
    setSearchQuery('');
  };

  // Handler for snackbar close
  const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  // Check if current user is the only admin
  const isOnlyAdmin = 
    isAdmin && 
    familyMembers.filter(member => member.isAdmin).length === 1;

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
      {/* Notification bell in top right corner */}
      <Box sx={{ position: 'absolute', top: 10, right: 20, zIndex: 1000 }}>
        <Tooltip title="Invitations">
          <IconButton 
            color="primary"
            onClick={handleNotificationClick}
            size="large"
          >
            <Badge badgeContent={invitations.length} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
        </Tooltip>
      </Box>

      {/* Notifications dropdown menu */}
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
                <ListItem alignItems="flex-start">
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
                      >
                        <CheckCircleIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Decline">
                      <IconButton 
                        edge="end" 
                        color="error"
                        onClick={() => handleDeclineInvitation(invitation)}
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
            >
              Create Family
            </Button>
          </Box>
          <FormControl fullWidth>
            <InputLabel id="family-select-label">Select Family</InputLabel>
            <Select
              labelId="family-select-label"
              id="family-select"
              value={selectedFamily}
              label="Select Family"
              onChange={handleFamilyChange}
            >
              <MenuItem value="">
                <em>Select a family</em>
              </MenuItem>
              {sampleFamilies.map((family) => (
                <MenuItem key={family.id} value={family.id}>
                  {family.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Divider sx={{ my: 3 }} />
        
        {selectedFamily !== '' ? (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5">
                Members of {sampleFamilies.find(f => f.id === selectedFamily)?.name}
              </Typography>
              
              <Box>
                {/* Admin-only buttons */}
                {isAdmin && (
                  <>
                    <Button 
                      variant="contained" 
                      color="primary" 
                      startIcon={<PersonAddIcon />}
                      onClick={handleInviteOpen}
                      sx={{ mr: 1 }}
                    >
                      Invite Member
                    </Button>
                    <Button 
                      variant="contained" 
                      color="error" 
                      startIcon={<DeleteForeverIcon />}
                      onClick={handleDeleteOpen}
                      sx={{ mr: 1 }}
                    >
                      Delete Family
                    </Button>
                  </>
                )}
                
                {/* Leave family button - available to all members but disabled for sole admin */}
                <Tooltip 
                  title={isOnlyAdmin ? "You can't leave as the only admin. Promote another member first." : ""}
                >
                  <span> {/* Wrapper needed for disabled button with tooltip */}
                    <Button 
                      variant="outlined" 
                      color="error" 
                      startIcon={<ExitToAppIcon />}
                      onClick={handleLeaveOpen}
                      disabled={isOnlyAdmin}
                    >
                      Leave Family
                    </Button>
                  </span>
                </Tooltip>
              </Box>
            </Box>
            
            {/* Add search box */}
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
            
            {/* Show search results info if filtering */}
            {searchQuery && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Showing {filteredMembers.length} of {familyMembers.length} members
              </Typography>
            )}
            
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
                  {filteredMembers.length > 0 ? (
                    filteredMembers.map((member) => (
                      <TableRow 
                        key={member.id}
                        hover
                        sx={{ 
                          '&:last-child td, &:last-child th': { border: 0 },
                          ...(member.id === currentUserId ? { bgcolor: 'rgba(0, 150, 136, 0.08)' } : {})
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
                          {member.id === currentUserId && (
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
                            {!member.isAdmin && member.id !== currentUserId && (
                              <>
                                <Tooltip title="Promote to admin">
                                  <IconButton 
                                    color="primary" 
                                    onClick={() => handlePromoteOpen(member)}
                                    sx={{ mr: 1 }}
                                  >
                                    <SupervisorAccountIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Remove member">
                                  <IconButton 
                                    color="error" 
                                    onClick={() => handleRemoveOpen(member)}
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
          <Button onClick={handleInviteClose} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleInviteSubmit} 
            color="primary" 
            variant="contained" 
            disabled={!inviteUsername.trim()}
          >
            Send Invitation
          </Button>
        </DialogActions>
      </Dialog>
      
      <Dialog open={removeDialogOpen} onClose={handleRemoveClose}>
        <DialogTitle>Confirm Removal</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove {memberToRemove?.username} from the family?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRemoveClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleRemoveSubmit} color="error" variant="contained">
            Remove
          </Button>
        </DialogActions>
      </Dialog>
      
      <Dialog open={promoteDialogOpen} onClose={handlePromoteClose}>
        <DialogTitle>Promote to Admin</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to promote {memberToPromote?.username} to admin? 
            They will have full administrative rights to the family.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePromoteClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handlePromoteSubmit} color="primary" variant="contained">
            Promote
          </Button>
        </DialogActions>
      </Dialog>
      
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
          <Button onClick={handleLeaveClose} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleLeaveSubmit} 
            color="error" 
            variant="contained" 
            disabled={isOnlyAdmin}
          >
            Leave Family
          </Button>
        </DialogActions>
      </Dialog>
      
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
          <Button onClick={handleDeleteClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteSubmit} color="error" variant="contained">
            Delete Family
          </Button>
        </DialogActions>
      </Dialog>
      
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
          <Button onClick={handleCreateFamilyClose} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleCreateFamilySubmit} 
            color="primary" 
            variant="contained" 
            disabled={!newFamilyName.trim()}
          >
            Create Family
          </Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FamilyPage;