import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from '../screens/auth/SplashScreen';
import LoginFormScreen from '../screens/auth/LoginFormScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import EnterOTPScreen from '../screens/auth/EnterOTPScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';

export type AuthStackParamList = {
  Splash: undefined;
  LoginForm: undefined;
  ForgotPassword: undefined;
  EnterOTP: { email?: string };
  ResetPassword: { email?: string } | undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthNavigator = ({ initialRouteName = 'Splash' }: { initialRouteName?: keyof AuthStackParamList }) => {
  return (
    <Stack.Navigator
      id="AuthStack"
      initialRouteName={initialRouteName}
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="LoginForm" component={LoginFormScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="EnterOTP" component={EnterOTPScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
