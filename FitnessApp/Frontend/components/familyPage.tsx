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
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

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

// Use a record type for the family members mapping
type FamilyMembersMap = Record<number, FamilyMember[]>;

// Sample data - replace with actual API calls
const sampleFamilies: Family[] = [
  { id: 1, name: 'Smith Family' },
  { id: 2, name: 'Johnson Family' },
  { id: 3, name: 'Fitness Buddies' }
];

const sampleFamilyMembers: FamilyMembersMap = {
  1: [
    { id: 101, username: 'john_smith', firstName: 'John', lastName: 'Smith', joinDate: '2023-01-15', isAdmin: true },
    { id: 102, username: 'sarah_smith', firstName: 'Sarah', lastName: 'Smith', joinDate: '2023-01-15', isAdmin: false },
    { id: 103, username: 'mike_smith', firstName: 'Mike', lastName: 'Smith', joinDate: '2023-02-20', isAdmin: false }
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

const FamilyPage: React.FC = () => {
  const [selectedFamily, setSelectedFamily] = useState<number | ''>('');
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);

  useEffect(() => {
    // If a family is selected, fetch its members
    // This would be replaced with an actual API call
    if (selectedFamily !== '') {
      setFamilyMembers(sampleFamilyMembers[selectedFamily as number] || []);
    } else {
      setFamilyMembers([]);
    }
  }, [selectedFamily]);

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

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h3" gutterBottom component="div" align="center">
        Family
      </Typography>
      
      <Box sx={{ mb: 3 }}>
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
          <Typography variant="h5" gutterBottom>
            Members of {sampleFamilies.find(f => f.id === selectedFamily)?.name}
          </Typography>
          
          <TableContainer component={Paper} elevation={3} sx={{ mt: 2 }}>
            <Table>
              <TableHead sx={{ backgroundColor: 'primary.main' }}>
                <TableRow>
                  <TableCell sx={{ color: 'white' }}>Member</TableCell>
                  <TableCell sx={{ color: 'white' }}>Username</TableCell>
                  <TableCell sx={{ color: 'white' }}>Name</TableCell>
                  <TableCell sx={{ color: 'white' }}>Joined</TableCell>
                  <TableCell sx={{ color: 'white' }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {familyMembers.map((member) => (
                  <TableRow 
                    key={member.id}
                    hover
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
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
                  </TableRow>
                ))}
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
    </Container>
  );
};

export default FamilyPage;