import React from 'react';
import { SafeAreaView, FlatList, Text, View, Image, StyleSheet, TouchableOpacity } from 'react-native';
import WorkoutForm from '@/components/WorkoutForm';  // Import WorkoutForm
import { Link } from 'expo-router';

const leaderboardData = [
    { id: '1', photo: 'https://picsum.photos/id/73/400', name: 'Admin Name', text: "" },
    { id: '2', photo: 'https://picsum.photos/id/64/400', name: 'Mom Name', text: "minus button" },
    { id: '3', photo: 'https://picsum.photos/id/103/400', name: 'Son Name', text: "minus button" },
    { id: '4', photo: 'https://picsum.photos/id/65/400', name: 'Daughter Name', text: "minus button" },
    { id: '5',  photo: 'https://picsum.photos/id/237/400', name: 'Dog Name', text: "minus button" },
  ];

export default function family_management() {
    return (
        <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Family Management (Admin)</Text>
        <FlatList
            data={leaderboardData}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
            // need to add link to profile here <---------------------------------------------------------------------------
            <Link href="/tabs" style={styles.rowContainer}> 
                <View style={styles.row}>
                    {/* Profile Photo */}
                    <Image source={{ uri: item.photo }} style={styles.profileImage} />
                    
                    {/* Name, and Remove Icon */}
                    <View style={styles.nameContainer}>
                        <Text style={styles.name}>{item.name}</Text>
                    </View>

                    {/* Red circular minus button */}
                    <TouchableOpacity style={styles.minusButton} onPress={() => alert('Remove clicked')}>
                        <Text style={styles.minusButtonText}>-</Text>
                    </TouchableOpacity>
                </View>
            </Link>
            )}
        />
        <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.removeButton} onPress={() => alert('Disband Family clicked')}>
                <Text style={styles.buttonText}>Disband Family</Text>
            </TouchableOpacity>
        </View>
        </SafeAreaView>
    );
}


const styles = StyleSheet.create({
rowContainer: {
    width: '100%',
    padding: 10,
},
container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f8f8',
},
title: {
    fontSize: 40    ,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    padding: 30
},
row: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    padding: 25,
    backgroundColor: '#ffffff',
    marginVertical: 5,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
},
nameContainer: {
    flex: 1,  // Allows the name to take up remaining space
    justifyContent: 'center',  // Centers the text vertically
  },
name: {
    fontSize: 28,
    paddingLeft: 10,
    fontWeight: 'bold',
    textAlign: 'left',  // Ensures the name is aligned left within the container
},
minus_sign: {
    fontSize: 28,
    paddingLeft: 10,
    fontWeight: 'bold',
    textAlign: 'right',  // Ensures the name is aligned left within the container
},
profileImage: {
    width: 90,  // Set the width of the profile photo
    height: 90, // Set the height of the profile photo
    borderRadius: 40, // Makes the image round
    marginRight: 10,  // Spacing between image and text
},
buttonContainer: {
    position: 'absolute',
    bottom: 20,  // Position the button at the bottom
    width: '100%',
    paddingHorizontal: 20,
    alignItems: 'center',  // Center the button horizontally
},
removeButton: {
    backgroundColor: '#C7372F',  // Red color for the button
    paddingVertical: 20,  // Smaller vertical padding
    paddingHorizontal: 120,  // Smaller horizontal padding
    borderRadius: 20,
    alignSelf: 'center',  // Centers the button horizontally
},
buttonText: {
    color: 'white',  // Text color
    fontSize: 16,  // Smaller font size
    fontWeight: 'bold',
},
minusButton: {
    width: 50,
    height: 50,
    backgroundColor: '#C7372F',
    borderRadius: 23, // Makes the button circular
    justifyContent: 'center',
    alignItems: 'center',
  },
minusButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
});
  