import 'react-native-gesture-handler';
import React from 'react';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { store } from './src/store';

// Import Screens
import RegisterScreen from './src/screens/Auth/RegisterScreen';
import OTPScreen from './src/screens/Auth/OTPScreen';
import AppSecuritySetupScreen from './src/screens/Auth/AppSecuritySetupScreen';
import HomeScreen from './src/screens/Home/HomeScreen';

import LoginScreen from './src/screens/Auth/LoginScreen';
import PasswordConfirmScreen from './src/screens/Auth/PasswordConfirmScreen';
import EmailOTPScreen from './src/screens/Auth/EmailOTPScreen';
import EmergencyContactsScreen from './src/screens/Emergency/EmergencyContactsScreen';
import SOSVideoScreen from './src/screens/Emergency/SOSVideoScreen';
import FaceRecognitionScreen from './src/screens/Emergency/FaceRecognitionScreen';
import SafeRouteScreen from './src/screens/Home/SafeRouteScreen';
import DashboardScreen from './src/screens/Dashboard/DashboardScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <Provider store={store}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login">
          {/* ... existing screens ... */}
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{ title: 'Registration' }}
          />
          <Stack.Screen
            name="PasswordConfirm"
            component={PasswordConfirmScreen}
            options={{ title: 'Confirm Password' }}
          />
          <Stack.Screen
            name="EmailOTP"
            component={EmailOTPScreen}
            options={{ title: 'Verify Email' }}
          />
          <Stack.Screen
            name="OTPVerification"
            component={OTPScreen}
            options={{ title: 'Verify OTP' }}
          />
          <Stack.Screen
            name="AppSecuritySetup"
            component={AppSecuritySetupScreen}
            options={{ title: 'Setup Security' }}
          />
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="EmergencyContacts"
            component={EmergencyContactsScreen}
            options={{ title: 'Emergency Contacts' }}
          />
          <Stack.Screen
            name="SOSVideo"
            component={SOSVideoScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="FaceRecognition"
            component={FaceRecognitionScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SafeRoute"
            component={SafeRouteScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Dashboard"
            component={DashboardScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </Provider>
  );
}
