import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import Home from '@/components/Home';
import Leaderboard from '@/components/Leaderboard';
import WorkoutForm from '@/components/WorkoutForm';
import FamilyPage from '@/components/FamilyPage';
import ProfileStackNavigator from '@/components/ProfileStackNavigator';
import Chatbot from '@/components/ChatBot'; 

const Tab = createBottomTabNavigator();

export default function BottomTabsNavigator() {
  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName = '';

            switch (route.name) {
              case 'Home':
                iconName = focused ? 'home' : 'home-outline';
                break;
              case 'Leaderboard':
                iconName = focused ? 'trophy' : 'trophy-outline';
                break;
              case 'Workout':
                iconName = focused ? 'barbell' : 'barbell-outline';
                break;
              case 'Family':
                iconName = focused ? 'people' : 'people-outline';
                break;
              case 'Profile':
                iconName = focused ? 'person' : 'person-outline';
                break;
            }

            return (
              <View style={focused ? styles.bubble : null}>
                <Ionicons name={iconName as any} size={size} color={focused ? '#fff' : color} />
              </View>
            );
          },
          tabBarActiveTintColor: '#fff',
          tabBarInactiveTintColor: '#aaa',
          tabBarStyle: styles.tabBar,
          headerShown: false,
        })}
      >
        <Tab.Screen name="Home" component={Home} />
        <Tab.Screen name="Leaderboard" component={Leaderboard} />
        <Tab.Screen name="Workout" component={WorkoutForm} />
        <Tab.Screen name="Family" component={FamilyPage} />
        <Tab.Screen name="Profile" component={ProfileStackNavigator} />
      </Tab.Navigator>


      <Chatbot />
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#1e1e2f',
    borderTopWidth: 0,
    height: 70,
    paddingBottom: 10,
  },
  bubble: {
    backgroundColor: '#007AFF',
    padding: 7,
    borderRadius: 25,
  },
});