import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  SafeAreaView,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const LeaderboardPage = () => {
  // Sample data for leaderboard
  const initialData = [
    { id: 1, name: "Sarah Johnson", workouts: 32, steps: 287456, avatar: "https://randomuser.me/api/portraits/women/1.jpg" },
    { id: 2, name: "Michael Chen", workouts: 28, steps: 245890, avatar: "https://randomuser.me/api/portraits/men/2.jpg" },
    { id: 3, name: "Alex Rodriguez", workouts: 35, steps: 302145, avatar: "https://randomuser.me/api/portraits/men/3.jpg" },
    { id: 4, name: "Emma Williams", workouts: 26, steps: 231780, avatar: "https://randomuser.me/api/portraits/women/4.jpg" },
    { id: 5, name: "James Wilson", workouts: 30, steps: 265432, avatar: "https://randomuser.me/api/portraits/men/5.jpg" },
    { id: 6, name: "Olivia Martinez", workouts: 24, steps: 219876, avatar: "https://randomuser.me/api/portraits/women/6.jpg" },
    { id: 7, name: "Daniel Lee", workouts: 31, steps: 275321, avatar: "https://randomuser.me/api/portraits/men/7.jpg" },
    { id: 8, name: "Sophia Kim", workouts: 27, steps: 241098, avatar: "https://randomuser.me/api/portraits/women/8.jpg" },
    { id: 9, name: "Ethan Brown", workouts: 29, steps: 258743, avatar: "https://randomuser.me/api/portraits/men/9.jpg" },
    { id: 10, name: "Isabella Garcia", workouts: 33, steps: 295632, avatar: "https://randomuser.me/api/portraits/women/10.jpg" }
  ];

  const [data, setData] = useState(initialData);
  const [sortField, setSortField] = useState('workouts');
  const [sortDirection, setSortDirection] = useState('desc');
  const [activeTab, setActiveTab] = useState('workouts');

  // Sort data based on current sort field and direction
  const sortedData = [...data].sort((a, b) => {
    if (sortDirection === 'asc') {
      return a[sortField] - b[sortField];
    } else {
      return b[sortField] - a[sortField];
    }
  });

  // Handle sort toggle
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Get rank badge for top 3 positions
  const getRankBadge = (index) => {
    switch (index) {
      case 0:
        return <Ionicons name="trophy" size={24} color="#FFD700" />;
      case 1:
        return <Ionicons name="medal" size={24} color="#C0C0C0" />;
      case 2:
        return <Ionicons name="ribbon" size={24} color="#CD7F32" />;
      default:
        return <Text style={styles.rankText}>{index + 1}</Text>;
    }
  };

  // Render a leaderboard item
  const renderItem = ({ item, index }) => (
    <View style={[styles.row, index < 3 && styles.topThreeRow]}>
      <View style={styles.rankContainer}>
        {getRankBadge(index)}
      </View>
      <View style={styles.userContainer}>
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
        <Text style={styles.userName}>{item.name}</Text>
      </View>
      <View style={styles.statsContainer}>
        <Text style={[
          styles.statValue, 
          sortField === 'workouts' && styles.highlightedStat
        ]}>
          {item.workouts}
        </Text>
      </View>
      <View style={styles.statsContainer}>
        <Text style={[
          styles.statValue, 
          sortField === 'steps' && styles.highlightedStat
        ]}>
          {item.steps.toLocaleString()}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4169E1" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>FitTrack Leaderboard</Text>
        <Text style={styles.headerSubtitle}>See how you stack up against other users</Text>
      </View>
      
      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'workouts' && styles.activeTab]}
          onPress={() => {
            setActiveTab('workouts');
            setSortField('workouts');
            setSortDirection('desc');
          }}
        >
          <Text style={[styles.tabText, activeTab === 'workouts' && styles.activeTabText]}>
            Workouts
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'steps' && styles.activeTab]}
          onPress={() => {
            setActiveTab('steps');
            setSortField('steps');
            setSortDirection('desc');
          }}
        >
          <Text style={[styles.tabText, activeTab === 'steps' && styles.activeTabText]}>
            Steps
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Leaderboard */}
      <View style={styles.leaderboardContainer}>
        <View style={styles.leaderboardHeader}>
          <Text style={styles.leaderboardTitle}>
            {activeTab === 'workouts' ? 'Most Workouts Completed' : 'Highest Step Count'}
          </Text>
          <Text style={styles.leaderboardSubtitle}>Updated daily</Text>
        </View>
        
        {/* Table Header */}
        <View style={styles.tableHeader}>
          <View style={styles.rankHeaderContainer}>
            <Text style={styles.columnHeader}>Rank</Text>
          </View>
          <View style={styles.userHeaderContainer}>
            <Text style={styles.columnHeader}>User</Text>
          </View>
          <TouchableOpacity
            style={styles.statsHeaderContainer}
            onPress={() => handleSort('workouts')}
          >
            <Text style={styles.columnHeader}>Workouts</Text>
            <Ionicons
              name={sortField === 'workouts' && sortDirection === 'asc' ? 'arrow-up' : 'arrow-down'}
              size={14}
              color="#666"
              style={{ marginLeft: 4 }}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.statsHeaderContainer}
            onPress={() => handleSort('steps')}
          >
            <Text style={styles.columnHeader}>Steps</Text>
            <Ionicons
              name={sortField === 'steps' && sortDirection === 'asc' ? 'arrow-up' : 'arrow-down'}
              size={14}
              color="#666"
              style={{ marginLeft: 4 }}
            />
          </TouchableOpacity>
        </View>
        
        {/* Leaderboard List */}
        <FlatList
          data={sortedData}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
        />
        
        {/* Footer Stats */}
        <View style={styles.footerStats}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Total Users</Text>
            <Text style={styles.statTotal}>{data.length}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>
              {activeTab === 'workouts' ? 'Average Workouts' : 'Average Steps'}
            </Text>
            <Text style={styles.statTotal}>
              {activeTab === 'workouts' 
                ? Math.round(data.reduce((sum, user) => sum + user.workouts, 0) / data.length)
                : Math.round(data.reduce((sum, user) => sum + user.steps, 0) / data.length).toLocaleString()}
            </Text>
          </View>
        </View>
      </View>
      
      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2025 FitTrack App. All rights reserved.</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#4169E1',
    padding: 20,
    paddingTop: 40,
    paddingBottom: 25,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 15,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#4169E1',
  },
  activeTab: {
    backgroundColor: '#4169E1',
  },
  tabText: {
    color: '#4169E1',
    fontWeight: '600',
  },
  activeTabText: {
    color: 'white',
  },
  leaderboardContainer: {
    flex: 1,
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  leaderboardHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  leaderboardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  leaderboardSubtitle: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  columnHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    textTransform: 'uppercase',
  },
  rankHeaderContainer: {
    width: 50,
    alignItems: 'center',
  },
  userHeaderContainer: {
    flex: 1,
  },
  statsHeaderContainer: {
    width: 80,
    flexDirection: 'row',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 10,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  topThreeRow: {
    backgroundColor: '#f0f8ff',
  },
  rankContainer: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#888',
  },
  userContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  userName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  statsContainer: {
    width: 80,
  },
  statValue: {
    fontSize: 14,
    color: '#333',
  },
  highlightedStat: {
    fontWeight: 'bold',
    color: '#4169E1',
  },
  footerStats: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  stat: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
  },
  statTotal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  footer: {
    backgroundColor: '#333',
    padding: 16,
    alignItems: 'center',
  },
  footerText: {
    color: '#ccc',
    fontSize: 12,
  },
});

export default LeaderboardPage;