import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  SafeAreaView,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const API_URL = 'http://localhost:8080/api/leaderboard/get_leaderboard';

const LeaderboardPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState('steps');

  // Fetch leaderboard data
  const fetchLeaderboard = async (category) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}?category=${category}`);
      const result = await response.json();
      setData(result.leaderboard);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLeaderboard(activeCategory);
  }, [activeCategory]);

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

  // Render leaderboard item
  const renderItem = ({ item, index }) => (
    <View style={styles.row}>
      <View style={styles.rankContainer}>{getRankBadge(index)}</View>
      <Text style={styles.userName}>{item.username}</Text>
      <Text style={styles.statValue}>{item.value.toLocaleString()}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4169E1" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Leaderboard</Text>
      </View>

      {/* Category Selection */}
      <View style={styles.tabContainer}>
        {['steps', '1rm', 'workouts', 'pace'].map((category) => (
          <TouchableOpacity
            key={category}
            style={[styles.tab, activeCategory === category && styles.activeTab]}
            onPress={() => setActiveCategory(category)}
          >
            <Text style={[styles.tabText, activeCategory === category && styles.activeTabText]}>
              {category.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Leaderboard List */}
      {loading ? (
        <ActivityIndicator size="large" color="#4169E1" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#4169E1', padding: 20, alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: 'white' },
  tabContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  tab: { padding: 10, margin: 5, borderRadius: 8, borderWidth: 1, borderColor: '#4169E1' },
  activeTab: { backgroundColor: '#4169E1' },
  tabText: { color: '#4169E1', fontWeight: '600' },
  activeTabText: { color: 'white' },
  listContent: { paddingBottom: 20 },
  row: { flexDirection: 'row', padding: 16, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#eee' },
  rankContainer: { width: 50, alignItems: 'center' },
  rankText: { fontSize: 16, fontWeight: 'bold', color: '#888' },
  userName: { flex: 1, fontSize: 14, fontWeight: '500', color: '#333' },
  statValue: { fontSize: 14, fontWeight: 'bold', color: '#4169E1' },
});

export default LeaderboardPage;
