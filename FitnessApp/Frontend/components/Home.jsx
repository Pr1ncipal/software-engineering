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
import { LinearGradient } from 'expo-linear-gradient';

export default function Home() {
  const [activeTab, setActiveTab] = useState('home');
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const isSmallScreen = screenWidth < 768;
  const [expandedComponent, setExpandedComponent] = useState(null);
  const achievementsSlideAnim = useState(new Animated.Value(screenWidth))[0];
  const [showAchievements, setShowAchievements] = useState(false);

  useEffect(() => {
    const updateLayout = () => {
      const newWidth = Dimensions.get('window').width;
      setScreenWidth(newWidth);
      if (!showAchievements) {
        achievementsSlideAnim.setValue(newWidth);
      }
    };

    const dimensionsSubscription = Dimensions.addEventListener('change', updateLayout);
    return () => {
      dimensionsSubscription.remove();
    };
  }, [showAchievements]);

  const toggleExpand = (componentName) => {
    setExpandedComponent(prev => prev === componentName ? null : componentName);
  };

  const handleTrophyPress = () => {
    if (!showAchievements) {
      setShowAchievements(true);
      Animated.timing(achievementsSlideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(achievementsSlideAnim, {
        toValue: screenWidth,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setShowAchievements(false);
      });
    }
  };

  return ( 
    <LinearGradient colors={['#007AFF', '#B3E5FC']} style={styles.gradientBackground}>
      <SafeAreaView style={styles.container}>
        <View style={styles.contentContainer}>
          <View style={styles.headerContainer}>
            <TouchableOpacity 
              style={styles.trophyButton} 
              onPress={handleTrophyPress}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="trophy" size={28} color="#FFD700" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={[styles.content, expandedComponent && styles.dimmedBackground]}
            contentContainerStyle={{alignItems: 'center'}}
            scrollEnabled={!expandedComponent}
          >
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Home</Text>
              <View style={styles.titleUnderline} />
            </View>

            <Text style={styles.subHeaderText}>-//recent workout\\-</Text>

            {/* Personal Block (full width, centered) */}
            <View style={styles.personalBlockContainer}>
              <TouchableOpacity style={styles.personalBlock} onPress={() => toggleExpand('progress')}>
                <Text style={styles.halfBlockText}>Personal</Text>
                <Text style={styles.placeholderText}>Snippet - stats & graphs</Text>
              </TouchableOpacity>
            </View>

            {/* Family + Leaderboard */}
            <View style={styles.halfBlockContainer}>
              <TouchableOpacity style={styles.halfBlock} onPress={() => toggleExpand('family')}>
                <Text style={styles.halfBlockText}>Family</Text>
                <Text style={styles.placeholderText}>See shared workouts & progress</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.halfBlock} onPress={() => toggleExpand('leaderboard')}>
                <Text style={styles.halfBlockText}>Leaderboard</Text>
                <Text style={styles.placeholderText}>Snippet - stats & graphs</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

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
                  <Text style={styles.placeholderText}>Stats & graphs go here</Text>
                </View>
              </View>
            </View>
          )}

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
                  <Text style={styles.placeholderText}>Stats & graphs go here</Text>
                </View>
              </View>
            </View>
          )}

          {expandedComponent === 'family' && (
            <View style={styles.expandedComponentOverlay}>
              <View style={styles.expandedComponent}>
                <View style={styles.expandedComponentHeader}>
                  <Text style={styles.expandedComponentTitle}>Family</Text>
                  <TouchableOpacity onPress={() => setExpandedComponent(null)}>
                    <Ionicons name="close" size={24} color="#333" />
                  </TouchableOpacity>
                </View>
                <View style={styles.expandedComponentContent}>
                  <Text style={styles.placeholderText}>Family stats, encouragement, and shared workouts</Text>
                </View>
              </View>
            </View>
          )}

          <Animated.View 
            style={[
              styles.achievementsPanel,
              { 
                transform: [{ translateX: achievementsSlideAnim }],
                position: 'absolute',
                right: 0,
                width: isSmallScreen ? '90%' : '33%',
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
            </ScrollView> 
          </Animated.View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 60,
    fontFamily: 'RalewayRegular',
    color: '#ffffff',
    textAlign: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 25,
  },
  titleUnderline: {
    marginTop: 5,
    width: 120,
    height: 4,
    backgroundColor: '#ffffff',
    borderRadius: 2,
  },
  gradientBackground: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
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
    paddingTop: 20,
  },
  dimmedBackground: {
    opacity: 0.4,
  },
  subHeaderText: {
    fontSize: 16,
    color: '#eee',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  personalBlockContainer: {
    width: '90%',
    alignItems: 'center',
    marginBottom: 20,
  },
  personalBlock: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 20,
    borderRadius: 20,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    elevation: 5,
    minHeight: 160,
  },
  halfBlockContainer: {
    flexDirection: 'row',
    width: '90%',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  halfBlock: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 20,
    borderRadius: 20,
    width: '48%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    elevation: 5,
    minHeight: 160,
  },
  halfBlockText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  placeholderText: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 10,
  },
  trophyButton: {
    backgroundColor: '#000000',
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
  expandedComponentOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  expandedComponent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '85%',
    height: '75%',
    padding: 20,
  },
  expandedComponentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  expandedComponentTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  expandedComponentContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  },
  achievementsContent: {
    padding: 20,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  achievementText: {
    marginLeft: 10,
    fontSize: 16,
  },
});
