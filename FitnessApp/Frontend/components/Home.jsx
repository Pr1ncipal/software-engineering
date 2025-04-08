import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  Dimensions, 
  Animated, 
  ScrollView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Home() {
  const [activeTab, setActiveTab] = useState('home');
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const isSmallScreen = screenWidth < 768;
  
  // State for expanded components
  const [expandedComponent, setExpandedComponent] = useState(null);

  // Animated value for achievements slide-in
  const achievementsSlideAnim = useState(new Animated.Value(screenWidth))[0];
  const [showAchievements, setShowAchievements] = useState(false);

  // Update screen dimensions on orientation change or window resize
  useEffect(() => {
    const updateLayout = () => {
      const newWidth = Dimensions.get('window').width;
      setScreenWidth(newWidth);
      
      // If achievements panel is hidden, update its position based on new screen width
      if (!showAchievements) {
        achievementsSlideAnim.setValue(newWidth);
      }
    };

    const dimensionsSubscription = Dimensions.addEventListener('change', updateLayout);
    return () => {
      dimensionsSubscription.remove();
    };
  }, [showAchievements]);

  // Handle expanding and collapsing components
  const toggleExpand = (componentName) => {
    if (expandedComponent === componentName) {
      setExpandedComponent(null);
    } else {
      setExpandedComponent(componentName);
    }
  };

  // Handle trophy button press to show achievements
  const handleTrophyPress = () => {
    if (!showAchievements) {
      // Show the achievements panel
      setShowAchievements(true);
      Animated.timing(achievementsSlideAnim, {
        toValue: 0, // Slide in to position (0 means no offset from its position in layout)
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      // Hide the achievements panel
      Animated.timing(achievementsSlideAnim, {
        toValue: screenWidth,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setShowAchievements(false);
      });
    }
  };

  const handleTabPress = (tabName) => {
    setActiveTab(tabName);
  };

  return ( 
    <SafeAreaView style={styles.container}>
      <View style={styles.contentContainer}>
        <View style={styles.headerContainer}>
          <TouchableOpacity 
            style={styles.trophyButton} 
            onPress={handleTrophyPress}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="trophy" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        {// Main Content
        }
        <ScrollView 
          style={[styles.content, expandedComponent && styles.dimmedBackground]}
          contentContainerStyle={{alignItems: 'center'}}
          scrollEnabled={!expandedComponent}
        >
          <Text style={[styles.headerText, { paddingTop: 20 }]}>Recent Activity</Text>
          <Text style={styles.headerText}>-//recent workout\\-</Text>

          {// Big Block for Stats 
          }
          <View style={styles.bigBlock}>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Reps</Text>
                <Text style={styles.statValue}>10</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Sets</Text>
                <Text style={styles.statValue}>3</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Weight</Text>
                <Text style={styles.statValue}>50 lbs</Text>
              </View>
            </View>
          </View>

          {// Half Blocks for Progress & Leaderboard 
          }
          <View style={styles.halfBlockContainer}>
            <TouchableOpacity 
              style={styles.halfBlock}
              onPress={() => toggleExpand('progress')}
              activeOpacity={0.8}
            >
              <Text style={styles.halfBlockText}>Personal</Text>
              <Text style={styles.placeholderBreak}>{'\n\n'}</Text>
              <Text style={styles.placeholderText}>snippet - stats & graphs</Text>
              <Text style={styles.placeholderBreak}>{'\n\n'}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.halfBlock}
              onPress={() => toggleExpand('leaderboard')}
              activeOpacity={0.8}
            >
              <Text style={styles.halfBlockText}>Leaderboard</Text>
              <Text style={styles.placeholderBreak}>{'\n\n'}</Text>
              <Text style={styles.placeholderText}>snippet - stats & graphs</Text>
              <Text style={styles.placeholderBreak}>{'\n\n'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        
        {// Expanded Progress Component 
        }
        {expandedComponent === 'progress' && (
          <View style={styles.expandedComponentOverlay}>
            <View style={styles.expandedComponent}>
              <View style={styles.expandedComponentHeader}>
                <Text style={styles.expandedComponentTitle}>Personal Progress</Text>
                <TouchableOpacity onPress={() => setExpandedComponent(null)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              <View style={styles.expandedComponentContent}>
                <Text style={styles.placeholderText}>stast & graphs</Text>
                {// Add your detailed progress content here
                }
              </View>
            </View>
          </View>
        )}
        
        {// Expanded Leaderboard Component 
        }
        {expandedComponent === 'leaderboard' && (
          <View style={styles.expandedComponentOverlay}>
            <View style={styles.expandedComponent}>
              <View style={styles.expandedComponentHeader}>
                <Text style={styles.expandedComponentTitle}>Leaderboard</Text>
                <TouchableOpacity onPress={() => setExpandedComponent(null)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              <View style={styles.expandedComponentContent}>
                <Text style={styles.placeholderText}>stast & graphs</Text>
                {//Add your detailed leaderboard content here 
                }
              </View>
            </View>
          </View>
        )}
        
        {// Achievements Slide-in Panel
        }
        <Animated.View 
          style={[
            styles.achievementsPanel,
            { 
              transform: [{ translateX: achievementsSlideAnim }],
              // Make sure the panel is rendered behind scenes even when not shown
              // This ensures it's positioned correctly when animation starts
              //    I could not get it working to appear only on click so it's always tehre
              position: 'absolute',
              right: 0,
              width: isSmallScreen ? '90%' : '33%',  // Adjust width/height based on screen size
                                                        // increasing this to 90% for mobile
              height: isSmallScreen ? '50%' : '60%',
              display: showAchievements ? 'flex' : 'none'
            }
          ]}
        >
          <View style={styles.achievementsHeader}>
            <Text style={styles.achievementsTitle}>Weekly Achievements</Text>
            <TouchableOpacity onPress={handleTrophyPress}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.achievementsContent}>
            {// Sample achievements content 
            }
            <View style={styles.achievementItem}>
              <Ionicons name="trophy" size={24} color="#FFD700" />
              <Text style={styles.achievementText}>Completed 5 workouts</Text>
            </View>
            <View style={styles.achievementItem}>
              <Ionicons name="star" size={24} color="#FFD700" />
              <Text style={styles.achievementText}>New personal best: Bench Press</Text>
            </View>
            <View style={styles.achievementItem}>
              <Ionicons name="ribbon" size={24} color="#FFD700" />
              <Text style={styles.achievementText}>Ranked top 10% in local leaderboard</Text>
            </View>
            {// Add more achievements as needed 
            }
          </ScrollView> 
        </Animated.View>
      </View>

 
      
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8FA',
  },
  contentContainer: {
    flex: 1,
    position: 'relative',
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    zIndex: 10,
    paddingTop: 20,
    paddingRight: 20,
    alignItems: 'flex-end',
  },
  content: {
    flex: 1,
    paddingTop: 60, // Make space for the trophy button
  },
  dimmedBackground: {
    opacity: 0.4,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  bigBlock: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    width: '90%',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    elevation: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 5,
  },
  statLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginTop: 5,
    textAlign: 'center',
  },
  halfBlockContainer: {
    flexDirection: 'row',
    width: '90%',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  halfBlock: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    width: '48%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    elevation: 5,
    minHeight: 180, // Adjusting the box size
  },
  halfBlockText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  placeholderBreak: {
    textAlign: 'center',
  },
  placeholderText: {
    fontSize: 14,
    color: '#8E8E93',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  trophyButton: {
    backgroundColor: '#4A90E2',
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 8,
    elevation: 10,
    transform: [{ scale: Dimensions.get('window').width < 768 ? 0.8 : 1 }],
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  activeNavItem: {
    borderRadius: 8,
  },
  navText: {
    fontSize: 12,
    marginTop: 4,
    color: '#8E8E93',
  },
  activeNavText: {
    color: '#4A90E2',
    fontWeight: '500',
  },
  
  // Expanded component styles
  expandedComponentOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  expandedComponent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    width: '85%',
    height: '75%',
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 10,
    elevation: 15,
  },
  expandedComponentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingBottom: 10,
  },
  expandedComponentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  expandedComponentContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Achievements panel styles
  achievementsPanel: {
    backgroundColor: '#fff',
    zIndex: 200,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: -5, height: 0 },
    shadowRadius: 10,
    elevation: 20,
  },
  achievementsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  achievementsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  achievementsContent: {
    flex: 1,
    padding: 20,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  achievementText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
});