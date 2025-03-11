import { MD3LightTheme } from 'react-native-paper';

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#f4511e', // Orange
    secondary: '#757575', // Gray
    background: '#f5f5f5', // Light Gray
    card: '#ffffff', // White Cards
    text: '#333333', // Dark Text
    onPrimary: '#ffffff', // Ensures contrast on primary color
  },
};