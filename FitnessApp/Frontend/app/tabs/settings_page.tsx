import React, { useState } from 'react';
import { SafeAreaView, FlatList, Text, View, Image, StyleSheet, Switch } from 'react-native';
import WorkoutForm from '@/components/WorkoutForm';  // Import WorkoutForm
import { Link } from 'expo-router';

const leaderboardData = [
    { id: '1', photo: 'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fstatic.vecteezy.com%2Fsystem%2Fresources%2Fpreviews%2F000%2F437%2F945%2Foriginal%2Fvector-settings-icon.jpg&f=1&nofb=1&ipt=2fe91b858742e0ba0b874a20cdf7f0c790da81ac8233be8aa02c1627a8944f61&ipo=images', name: 'Setting 1'},
    { id: '2', photo: 'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fstatic.vecteezy.com%2Fsystem%2Fresources%2Fpreviews%2F000%2F437%2F945%2Foriginal%2Fvector-settings-icon.jpg&f=1&nofb=1&ipt=2fe91b858742e0ba0b874a20cdf7f0c790da81ac8233be8aa02c1627a8944f61&ipo=images', name: 'Setting 2'},
    { id: '3', photo: 'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fstatic.vecteezy.com%2Fsystem%2Fresources%2Fpreviews%2F000%2F437%2F945%2Foriginal%2Fvector-settings-icon.jpg&f=1&nofb=1&ipt=2fe91b858742e0ba0b874a20cdf7f0c790da81ac8233be8aa02c1627a8944f61&ipo=images', name: 'Setting 3'},
    { id: '4', photo: 'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fstatic.vecteezy.com%2Fsystem%2Fresources%2Fpreviews%2F000%2F437%2F945%2Foriginal%2Fvector-settings-icon.jpg&f=1&nofb=1&ipt=2fe91b858742e0ba0b874a20cdf7f0c790da81ac8233be8aa02c1627a8944f61&ipo=images', name: 'Setting 4'},
    { id: '5',  photo: 'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fstatic.vecteezy.com%2Fsystem%2Fresources%2Fpreviews%2F000%2F437%2F945%2Foriginal%2Fvector-settings-icon.jpg&f=1&nofb=1&ipt=2fe91b858742e0ba0b874a20cdf7f0c790da81ac8233be8aa02c1627a8944f61&ipo=images', name: 'Setting 5'},
  ];

export default function FamilyManagement() {
    // State to manage switch toggles for each setting
    const [switchStates, setSwitchStates] = useState(
        Object.fromEntries(leaderboardData.map(item => [item.id, false])) // Initialize all switches to false
    );

    // Toggle function
    const toggleSwitch = (id) => {
        setSwitchStates((prevState) => {
            const newValue = !prevState[id];
    
            // Example: Log the switch action
            //console.log(`Setting ${id} changed to ${newValue}`);
    
            // Example: Call an API when toggled
            // fetch(`https://example.com/api/settings/${id}`, {
            //    method: 'POST',
            //    headers: { 'Content-Type': 'application/json' },
            //    body: JSON.stringify({ enabled: newValue }),
            //})
            //.then(response => response.json())
            //.then(data => console.log(`API Response:`, data))
            //.catch(error => console.error(`API Error:`, error));
    
            // Return new state
            return { ...prevState, [id]: newValue };
        });
    };
    

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Setting Page</Text>
            <FlatList
                data={leaderboardData}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.rowContainer}>
                        <Link href="/tabs" style={styles.row}>
                            <Image source={{ uri: item.photo }} style={styles.profileImage} />
                            <View style={styles.nameContainer}>
                                <Text style={styles.name}>{item.name}</Text>
                            </View>
                        </Link>
                        <View style={styles.switchContainer}>
                            <Switch
                                    value={switchStates[item.id]}
                                    onValueChange={() => toggleSwitch(item.id)}
                                    trackColor={{ false: "#ccc", true: "#4cd964" }} // iOS green when enabled
                                    thumbColor="#ffffff"
                                    style={styles.switchBox}
                                />
                        </View>
                    </View>
                )}
            />
        </SafeAreaView>
    );
}


const styles = StyleSheet.create({
rowContainer: {
    width: '80%',
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between'
},
switchContainer: {
    width: '20%',
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'center'
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
  