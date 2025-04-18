import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  Dimensions, 
  Animated, 
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns'; // Add this import for date formatting
import { secureStorage } from '../utils/secureStorage';
import { fetchWithRetry, prepareAuthHeaders } from '../utils/networkUtils';

export default function Home() {
  const [activeTab, setActiveTab] = useState('home');
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const isSmallScreen = screenWidth < 768;
  const [expandedComponent, setExpandedComponent] = useState(null);
  const achievementsSlideAnim = useState(new Animated.Value(screenWidth))[0];
  const [showAchievements, setShowAchievements] = useState(false);
  const [homeData, setHomeData] = useState({
    activity: {},
    family: [],
    leaderboard: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data from backend
  useEffect(() => {
    const fetchHomeData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Get authentication headers with the properly encoded API key
        const headers = await prepareAuthHeaders();
        
        // API endpoint for homepage data
        const response = await fetchWithRetry(
          'http://localhost:8080/api/user/get_homepage', // Update with your actual API URL
          {
            method: 'GET',
            headers
          },
          2 // Number of retries
        );
        
        // Update state with the fetched data
        if (response) {
          setHomeData({
            activity: response.activity || {},
            family: response.family || [],
            leaderboard: response.leaderboard || []
          });
          console.log('Successfully loaded homepage data:', response);
        } else {
          throw new Error('No data returned from API');
        }
      } catch (error) {
        console.error('Error fetching homepage data:', error);
        setError('Failed to load homepage data. Please try again later.');
        // Keep the sample data as fallback
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchHomeData();
  }, []);

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

  // Format workout date nicely
  const formatWorkoutDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      return dateString || 'Unknown date';
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
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FFFFFF" />
                <Text style={styles.loadingText}>Loading your data...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={48} color="#FFFFFF" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : (
              <>
                {/* Personal Block with better use of space */}
                <View style={styles.personalBlockContainer}>
                  <TouchableOpacity 
                    style={styles.personalBlock} 
                    onPress={() => toggleExpand('progress')}
                  >
                    <View style={styles.personalBlockHeader}>
                      <Text style={styles.personalBlockTitle}>Personal Workout</Text>
                      <View style={styles.personalBlockIndicator}>
                        <Ionicons name="fitness" size={18} color="#007AFF" />
                      </View>
                    </View>
                    
                    {homeData.activity ? (
                      <View style={styles.activityContainerEnhanced}>
                        <View style={styles.activityTopRow}>
                          <View style={styles.activityDateContainer}>
                            <Text style={styles.activityDateLabel}>Date</Text>
                            <Text style={styles.activityDateValue}>{formatWorkoutDate(homeData.activity.date)}</Text>
                          </View>
                          
                          <View style={styles.activityNameContainer}>
                            <Text style={styles.activityNameLabel}>Workout Name</Text>
                            <Text style={styles.activityNameValue}>{homeData.activity.name}</Text>
                          </View>
                        </View>
                        
                        <View style={styles.activityStatsRow}>
                          <View style={styles.activityStat}>
                            <Text style={styles.activityStatValue}>{homeData.activity.sets}</Text>
                            <Text style={styles.activityStatLabel}>Sets</Text>
                          </View>
                          
                          <View style={styles.activityStatDivider} />
                          
                          <View style={styles.activityStat}>
                            <Text style={styles.activityStatValue}>{homeData.activity.reps}</Text>
                            <Text style={styles.activityStatLabel}>Reps</Text>
                          </View>
                          
                          <View style={styles.activityStatDivider} />
                          
                          <View style={styles.activityStat}>
                            <Text style={styles.activityStatValue}>{homeData.activity.weight}</Text>
                            <Text style={styles.activityStatLabel}>Lbs</Text>
                          </View>
                        </View>
                        
                        <View style={styles.activityTypeContainer}>
                          <Text style={styles.activityTypeLabel}>Type</Text>
                          <View style={styles.activityTypeTag}>
                            <Text style={styles.activityTypeText}>{homeData.activity.type || "General"}</Text>
                          </View>
                        </View>
                        
                        <View style={styles.viewDetailsContainer}>
                          <Text style={styles.viewDetailsText}>Tap to view details</Text>
                          <Ionicons name="chevron-forward" size={14} color="#007AFF" />
                        </View>
                      </View>
                    ) : (
                      <View style={styles.noActivityContainer}>
                        <Ionicons name="barbell-outline" size={48} color="#ccc" />
                        <Text style={styles.placeholderText}>No recent workouts found</Text>
                        <Text style={styles.noActivitySubtext}>Time to hit the gym!</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Family + Leaderboard */}
                <View style={styles.halfBlockContainer}>
                  <TouchableOpacity style={styles.halfBlock} onPress={() => toggleExpand('family')}>
                    <Text style={styles.halfBlockText}>Family</Text>
                    {homeData.family && homeData.family.length > 0 ? (
                      <View style={styles.familyPreviewContainer}>
                        <View style={styles.familyPreviewHeader}>
                          <Text style={styles.familyPreviewName}>
                            {homeData.family[0].family_member}
                          </Text>
                          <Text style={styles.familyPreviewFamily}>
                            {homeData.family[0].family_name}
                          </Text>
                        </View>
                        <Text style={styles.familyPreviewDate}>
                          {formatWorkoutDate(homeData.family[0].workout_date)}
                        </Text>
                        <Text style={styles.familyPreviewMuscles}>
                          {homeData.family[0].primary_muscles_hit.join(', ')}
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.placeholderText}>No family workouts found</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.halfBlock} onPress={() => toggleExpand('leaderboard')}>
                    <Text style={styles.halfBlockText}>Leaderboard</Text>
                    {homeData.leaderboard && homeData.leaderboard.length > 0 ? (
                      <View style={styles.leaderboardPreviewContainer}>
                        {homeData.leaderboard.slice(0, 2).map((entry, index) => (
                          <View key={index} style={styles.leaderboardPreviewItem}>
                            <Text style={styles.leaderboardPreviewRank}>#{entry.rank}</Text>
                            <Text style={styles.leaderboardPreviewName}>{entry.username}</Text>
                            <Text style={styles.leaderboardPreviewSteps}>
                              {parseInt(entry.avg_steps).toLocaleString()} steps
                            </Text>
                          </View>
                        ))}
                        <Text style={styles.leaderboardPreviewMore}>+ more</Text>
                      </View>
                    ) : (
                      <Text style={styles.placeholderText}>No leaderboard data found</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>

          {/* Expanded Personal Progress */}
          {expandedComponent === 'progress' && (
            <View style={styles.expandedComponentOverlay}>
              <View style={styles.expandedComponent}>
                <View style={styles.expandedComponentHeader}>
                  <Text style={styles.expandedComponentTitle}>Personal Progress</Text>
                  <TouchableOpacity onPress={() => setExpandedComponent(null)}>
                    <Ionicons name="close" size={24} color="#333" />
                  </TouchableOpacity>
                </View>
                {homeData.activity ? (
                  <ScrollView 
                    style={{flex: 1}} 
                    contentContainerStyle={{paddingVertical: 10}}
                  >
                    <View style={styles.expandedActivityContainer}>
                      <View style={styles.expandedActivityHeader}>
                        <Text style={styles.expandedActivityName}>{homeData.activity.name}</Text>
                        <Text style={styles.expandedActivityDate}>
                          {formatWorkoutDate(homeData.activity.date)}
                        </Text>
                      </View>
                      
                      <View style={styles.expandedActivityDetails}>
                        <View style={styles.expandedActivityStat}>
                          <Text style={styles.expandedActivityStatLabel}>Type</Text>
                          <Text style={styles.expandedActivityStatValue}>
                            {homeData.activity.type}
                          </Text>
                        </View>
                        
                        <View style={styles.expandedActivityStat}>
                          <Text style={styles.expandedActivityStatLabel}>Sets</Text>
                          <Text style={styles.expandedActivityStatValue}>
                            {homeData.activity.sets}
                          </Text>
                        </View>
                        
                        <View style={styles.expandedActivityStat}>
                          <Text style={styles.expandedActivityStatLabel}>Reps</Text>
                          <Text style={styles.expandedActivityStatValue}>
                            {homeData.activity.reps}
                          </Text>
                        </View>
                        
                        <View style={styles.expandedActivityStat}>
                          <Text style={styles.expandedActivityStatLabel}>Weight</Text>
                          <Text style={styles.expandedActivityStatValue}>
                            {homeData.activity.weight} lbs
                          </Text>
                        </View>
                      </View>
                    </View>
                  </ScrollView>
                ) : (
                  <View style={styles.expandedComponentContent}>
                    <Text style={styles.placeholderText}>No workout data available</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Expanded Leaderboard */}
          {expandedComponent === 'leaderboard' && (
            <View style={styles.expandedComponentOverlay}>
              <View style={styles.expandedComponent}>
                <View style={styles.expandedComponentHeader}>
                  <Text style={styles.expandedComponentTitle}>Leaderboard</Text>
                  <TouchableOpacity onPress={() => setExpandedComponent(null)}>
                    <Ionicons name="close" size={24} color="#333" />
                  </TouchableOpacity>
                </View>
                {homeData.leaderboard && homeData.leaderboard.length > 0 ? (
                  <ScrollView 
                    style={{flex: 1}} 
                    contentContainerStyle={{paddingVertical: 5}}
                  >
                    {homeData.leaderboard.map((entry, index) => (
                      <View key={index} style={styles.leaderboardItem}>
                        <Text style={styles.leaderboardRank}>#{entry.rank}</Text>
                        <View style={styles.leaderboardUserContainer}>
                          <Text style={styles.leaderboardUsername}>{entry.username}</Text>
                        </View>
                        <Text style={styles.leaderboardSteps}>
                          {parseInt(entry.avg_steps).toLocaleString()} steps
                        </Text>
                      </View>
                    ))}
                  </ScrollView>
                ) : (
                  <View style={styles.expandedComponentContent}>
                    <Text style={styles.placeholderText}>No leaderboard data available</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Expanded Family */}
          {expandedComponent === 'family' && (
            <View style={styles.expandedComponentOverlay}>
              <View style={styles.expandedComponent}>
                <View style={styles.expandedComponentHeader}>
                  <Text style={styles.expandedComponentTitle}>Family</Text>
                  <TouchableOpacity onPress={() => setExpandedComponent(null)}>
                    <Ionicons name="close" size={24} color="#333" />
                  </TouchableOpacity>
                </View>
                {homeData.family && homeData.family.length > 0 ? (
                  <ScrollView 
                    style={{flex: 1}} 
                    contentContainerStyle={{paddingVertical: 5}}
                  >
                    {homeData.family.map((familyMember, index) => (
                      <View key={index} style={styles.familyMemberItem}>
                        <View style={styles.familyMemberHeader}>
                          <View>
                            <Text style={styles.familyMemberName}>{familyMember.family_member}</Text>
                            <Text style={styles.familyName}>{familyMember.family_name}</Text>
                          </View>
                          <Text style={styles.familyMemberDate}>
                            {formatWorkoutDate(familyMember.workout_date)}
                          </Text>
                        </View>
                        
                        <View style={styles.musclesContainer}>
                          <Text style={styles.musclesLabel}>Primary muscles:</Text>
                          <View style={styles.musclesTags}>
                            {familyMember.primary_muscles_hit.map((muscle, i) => (
                              <View key={i} style={styles.muscleTag}>
                                <Text style={styles.muscleTagText}>{muscle}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                        
                        <View style={styles.musclesContainer}>
                          <Text style={styles.musclesLabel}>Secondary muscles:</Text>
                          <View style={styles.musclesTags}>
                            {familyMember.secondary_muscles_hit.map((muscle, i) => (
                              <View key={i} style={[styles.muscleTag, styles.secondaryMuscleTag]}>
                                <Text style={styles.secondaryMuscleTagText}>{muscle}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                ) : (
                  <View style={styles.expandedComponentContent}>
                    <Text style={styles.placeholderText}>No family workout data available</Text>
                  </View>
                )}
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
            <ScrollView 
              style={styles.achievementsContent} 
              contentContainerStyle={{paddingVertical: 5}}
            >
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
  // Keep all your existing styles
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
    marginBottom: 12,
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
    marginBottom: 20,
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
  expandedComponentScrollContent: {
    flex: 1,
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
  
  // New Styles for the Personal Activity Display
  activityContainer: {
    width: '100%',
    marginTop: 10,
    alignItems: 'center',
  },
  activityDate: {
    fontSize: 13,
    color: '#666',
  },
  activityName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 2,
  },
  activityDetails: {
    fontSize: 15,
    color: '#333',
    marginTop: 5,
  },
  activityType: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 5,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  
  // Family Preview
  familyPreviewContainer: {
    width: '100%',
    marginTop: 10,
    alignItems: 'center',
  },
  familyPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
  },
  familyPreviewName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  familyPreviewFamily: {
    fontSize: 12,
    color: '#007AFF',
    marginLeft: 5,
    paddingLeft: 5,
    borderLeftWidth: 1,
    borderLeftColor: '#ddd',
  },
  familyPreviewDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  familyPreviewMuscles: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 4,
    textAlign: 'center',
  },
  
  // Leaderboard Preview
  leaderboardPreviewContainer: {
    width: '100%',
    marginTop: 8,
  },
  leaderboardPreviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  leaderboardPreviewRank: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  leaderboardPreviewName: {
    fontSize: 12,
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  leaderboardPreviewSteps: {
    fontSize: 11,
    color: '#007AFF',
    fontWeight: '500',
  },
  leaderboardPreviewMore: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
    fontStyle: 'italic',
  },
  
  // Expanded Personal Activity
  expandedActivityContainer: {
    width: '100%',
    padding: 10,
  },
  expandedActivityHeader: {
    marginBottom: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 15,
  },
  expandedActivityName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  expandedActivityDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  expandedActivityDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  expandedActivityStat: {
    width: '48%',
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
    alignItems: 'center',
  },
  expandedActivityStatLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  expandedActivityStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  
  // Expanded Leaderboard
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  leaderboardRank: {
    width: 40,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  leaderboardUserContainer: {
    flex: 1,
  },
  leaderboardUsername: {
    fontSize: 16,
    color: '#333',
  },
  leaderboardSteps: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  
  // Expanded Family
  familyMemberItem: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  familyMemberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  familyMemberName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  familyMemberDate: {
    fontSize: 14,
    color: '#666',
  },
  musclesContainer: {
    marginBottom: 10,
  },
  musclesLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  musclesTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  muscleTag: {
    backgroundColor: '#e6f2ff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginRight: 6,
    marginBottom: 6,
  },
  muscleTagText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '600',
  },
  secondaryMuscleTag: {
    backgroundColor: '#f0f0f0',
  },
  secondaryMuscleTagText: {
    color: '#666',
  },

  // New styles for enhanced personal block
  personalBlockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  personalBlockTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  personalBlockIndicator: {
    backgroundColor: '#e6f2ff',
    padding: 5,
    borderRadius: 10,
  },
  activityContainerEnhanced: {
    width: '100%',
    marginTop: 10,
  },
  activityTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  activityDateContainer: {
    flex: 1,
  },
  activityDateLabel: {
    fontSize: 12,
    color: '#666',
  },
  activityDateValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  activityNameContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  activityNameLabel: {
    fontSize: 12,
    color: '#666',
  },
  activityNameValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  activityStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  activityStat: {
    flex: 1,
    alignItems: 'center',
  },
  activityStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  activityStatLabel: {
    fontSize: 12,
    color: '#666',
  },
  activityStatDivider: {
    width: 1,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 10,
  },
  activityTypeContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  activityTypeLabel: {
    fontSize: 12,
    color: '#666',
  },
  activityTypeTag: {
    backgroundColor: '#e6f2ff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginTop: 5,
  },
  activityTypeText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '600',
  },
  viewDetailsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  viewDetailsText: {
    fontSize: 12,
    color: '#007AFF',
    marginRight: 5,
  },
  noActivityContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  noActivitySubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  loadingContainer: {
    width: '90%',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    width: '90%',
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    marginVertical: 20,
  },
  errorText: {
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 10,
    fontSize: 16,
  },
  familyPreviewFamily: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 2,
    textAlign: 'center',
  },

  familyName: {
    fontSize: 13,
    color: '#007AFF',
    marginTop: 2,
    marginBottom: 4,
  },
  familyPreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
});
