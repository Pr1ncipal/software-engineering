import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, Text, Alert, StyleSheet, ScrollView, Platform, SafeAreaView, Dimensions, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import CryptoJS from "crypto-js";
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

export default function RegisterForm({ onLogin }) {
  const navigation = useNavigation();

  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const isSmallScreen = screenWidth < 768;

  useEffect(() => {
    const updateLayout = () => {
      setScreenWidth(Dimensions.get('window').width);
    };

    Dimensions.addEventListener('change', updateLayout);
    return () => {
      if (Dimensions.removeEventListener) {
        Dimensions.removeEventListener('change', updateLayout);
      }
    };
  }, []);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 101 }, (_, i) => currentYear - i);
  const months = [
    { label: "Jan", value: "01" }, { label: "Feb", value: "02" }, { label: "Mar", value: "03" },
    { label: "Apr", value: "04" }, { label: "May", value: "05" }, { label: "June", value: "06" },
    { label: "July", value: "07" }, { label: "Aug", value: "08" }, { label: "Sep", value: "09" },
    { label: "Oct", value: "10" }, { label: "Nov", value: "11" }, { label: "Dec", value: "12" }
  ];
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const feet = Array.from({ length: 7 }, (_, i) => (i + 1).toString() + "'");
  const inches = Array.from({ length: 12 }, (_, i) => i.toString() + "\"");

  const [formData, setFormData] = useState({
    first_name: '', last_name: '', email: '', username: '', password: '',
    year: currentYear.toString(), month: "01", day: "01", sex: 'M',
    feet: "5'", inches: "6\"", weight: ''
  });
  const [errors, setErrors] = useState({});

  const handleChange = (name, value) => setFormData({ ...formData, [name]: value });
  const hashPassword = (password) => CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);

  const validateForm = () => {
    let isValid = true;
    let newErrors = {};

    if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
    if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (!formData.password || formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (!formData.weight.trim() || isNaN(formData.weight)) newErrors.weight = 'Weight must be a number';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please correct the errors in the form');
      return;
    }

    try {
      const hashedPassword = await hashPassword(formData.password);
      const dob = `${formData.year}-${formData.month}-${formData.day}`;
      const height = `${formData.feet.replace("'", "")}'${formData.inches.replace("\"", "")}`;

      const userData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        username: formData.username,
        pass_hash: hashedPassword,
        dob,
        sex: formData.sex,
        height,
        weight: formData.weight
      };

      await fetch('http://localhost:8080/api/user/create_user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      }).then(res => res.json())
        .then(data => {
          Alert.alert('Success', 'User registered successfully!');
          onLogin();
        }).catch(error => {
          console.error("Error:", error);
          Alert.alert('Error', 'Failed to register user.');
        });
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'An unexpected error occurred.');
    }
  };

  const RenderPicker = ({ selectedValue, onValueChange, items, style }) => (
    Platform.OS === 'ios' ?
      <View style={[style, styles.iosPicker]}>
        <Picker selectedValue={selectedValue} onValueChange={onValueChange} itemStyle={styles.iosPickerItem}>{items}</Picker>
      </View> :
      <Picker style={style} selectedValue={selectedValue} onValueChange={onValueChange}>{items}</Picker>
  );

  return (
    <LinearGradient colors={['#007AFF', '#FFCC80']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.outerContainer}>
          <View style={[styles.container, isSmallScreen ? styles.containerSmall : styles.containerLarge]}>
            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.backButton}>
              <Text style={styles.backButtonText}>← Back to Login</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Strong Starts Here!</Text>


            <Text style={styles.label}>Name:</Text>
           <View style={styles.nameContainer}>
             <View style={styles.nameField}>
               <TextInput
                 style={[
                   styles.input,
                   errors.first_name ? styles.inputError : null,
                   isSmallScreen ? styles.inputSmall : {}
                 ]}
                 placeholder="First Name"
                 value={formData.first_name}
                 onChangeText={text => handleChange('first_name', text)}
                 maxLength={20}
               />
               {errors.first_name && <Text style={styles.errorText}>{errors.first_name}</Text>}
             </View>
            
             <View style={styles.nameField}>
               <TextInput
                 style={[
                   styles.input,
                   errors.last_name ? styles.inputError : null,
                   isSmallScreen ? styles.inputSmall : {}
                 ]}
                 placeholder="Last Name"
                 value={formData.last_name}
                 onChangeText={text => handleChange('last_name', text)}
                 maxLength={30}
               />
               {errors.last_name && <Text style={styles.errorText}>{errors.last_name}</Text>}
             </View>
           </View>
          
           <Text style={styles.label}>Email:</Text>
           <TextInput
             style={[
               styles.input,
               errors.email ? styles.inputError : null,
               isSmallScreen ? styles.inputSmall : {}
             ]}
             placeholder="Email"
             value={formData.email}
             keyboardType="email-address"
             onChangeText={text => handleChange('email', text)}
           />
           {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          
           <Text style={styles.label}>Username:</Text>
           <TextInput
             style={[
               styles.input,
               errors.username ? styles.inputError : null,
               isSmallScreen ? styles.inputSmall : {}
             ]}
             placeholder="Username"
             value={formData.username}
             onChangeText={text => handleChange('username', text)}
             maxLength={20}
           />
           {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}
          
           <Text style={styles.label}>Password:</Text>
           <TextInput
             style={[
               styles.input,
               errors.password ? styles.inputError : null,
               isSmallScreen ? styles.inputSmall : {}
             ]}
             placeholder="Password (8+ characters)"
             secureTextEntry
             value={formData.password}
             onChangeText={text => handleChange('password', text)}
           />
           {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}


           <Text style={styles.label}>Date of Birth:</Text>
           <View style={[
             styles.pickerContainer,
             isSmallScreen ? styles.pickerContainerSmall : {}
           ]}>
             <RenderPicker
               style={[
                 styles.picker,
                 isSmallScreen ? styles.pickerSmall : {}
               ]}
               selectedValue={formData.month}
               onValueChange={(value) => handleChange('month', value)}
               items={months.map((month) => <Picker.Item key={month.value} label={month.label} value={month.value} />)}
             />
             <RenderPicker
               style={[
                 styles.picker,
                 isSmallScreen ? styles.pickerSmall : {}
               ]}
               selectedValue={formData.day}
               onValueChange={(value) => handleChange('day', value)}
               items={days.map((day) => <Picker.Item key={day} label={day} value={day} />)}
             />
             <RenderPicker
               style={[
                 styles.picker,
                 isSmallScreen ? styles.pickerSmall : {}
               ]}
               selectedValue={formData.year}
               onValueChange={(value) => handleChange('year', value)}
               items={years.map((year) => <Picker.Item key={year} label={year.toString()} value={year.toString()} />)}
             />
           </View>


           <Text style={styles.label}>Sex:</Text>
           <RenderPicker
             style={[
               styles.input,
               isSmallScreen ? styles.inputSmall : {}
             ]}
             selectedValue={formData.sex}
             onValueChange={(value) => handleChange('sex', value)}
             items={[
               <Picker.Item key="M" label="Male" value="M" />,
               <Picker.Item key="F" label="Female" value="F" />
             ]}
           />


           <Text style={styles.label}>Height:</Text>
           <View style={[
             styles.pickerContainer,
             isSmallScreen ? styles.pickerContainerSmall : {}
           ]}>
             <RenderPicker
               style={[
                 styles.picker,
                 isSmallScreen ? styles.pickerSmall : {}
               ]}
               selectedValue={formData.feet}
               onValueChange={(value) => handleChange('feet', value)}
               items={feet.map((ft) => <Picker.Item key={ft} label={ft} value={ft} />)}
             />
             <RenderPicker
               style={[
                 styles.picker,
                 isSmallScreen ? styles.pickerSmall : {}
               ]}
               selectedValue={formData.inches}
               onValueChange={(value) => handleChange('inches', value)}
               items={inches.map((inch) => <Picker.Item key={inch} label={inch} value={inch} />)}
             />
           </View>


           <Text style={styles.label}>Weight:</Text>
           <TextInput
             style={[
               styles.input,
               errors.weight ? styles.inputError : null,
               isSmallScreen ? styles.inputSmall : {}
             ]}
             placeholder="Weight (in lbs)"
             keyboardType="numeric"
             value={formData.weight}
             onChangeText={text => handleChange('weight', text)}
           />
           {errors.weight && <Text style={styles.errorText}>{errors.weight}</Text>}


           <View style={styles.buttonContainer}>
             <Button title="Register" onPress={handleSubmit} />
           </View>
         </View>
       </View>
     </ScrollView>
     </LinearGradient>
 );
}


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingVertical: 20,
  },
  outerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  container: {
    marginBottom: 20,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  containerLarge: {
    width: '50%',
    maxWidth: 500,
  },
  containerSmall: {
    width: '90%',
    maxWidth: 500,
  },
  title: {
    fontSize: 30,
    fontFamily: 'RalewayRegular',
    color: '#007AFF',
    textAlign: 'center',
    marginBottom: 25,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 5,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 5,
    color: '#555',
  },
  nameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  nameField: {
    flex: 1,
    marginHorizontal: 5,
  },
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  pickerContainerSmall: {
    flexDirection: 'row',
  },
  picker: {
    flex: 1,
    height: Platform.OS === 'ios' ? 150 : 40,
    marginHorizontal: 2,
    borderColor: '#ccc',
    borderWidth: 1,
    backgroundColor: 'white',
    borderRadius: 5,
  },
  pickerSmall: {
    height: Platform.OS === 'ios' ? 150 : 50,
    fontSize: 16,
  },
  iosPicker: {
    overflow: 'hidden',
    backgroundColor: 'white',
    borderRadius: 5,
  },
  iosPickerItem: {
    height: 110,
    fontSize: 16,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 10,
    backgroundColor: 'white',
    borderRadius: 5,
  },
  inputSmall: {
    height: 50, // Taller input fields on small screens
    fontSize: 16, // Larger font for better touch targets
    marginBottom: 15,
  },
  inputError: {
    borderColor: '#dc3545',
    borderWidth: 1,
  },
  errorText: {
    color: '#dc3545',
    fontSize: 12,
    marginTop: -10,
    marginBottom: 10,
  },
  buttonContainer: {
    marginTop: 10,
    width: '100%',
  }
});

