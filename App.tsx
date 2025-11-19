/**
 * App.tsx
 * Root app with auth-aware navigation
 */

import React from 'react';
import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Home from './src/screens/Home';
import Login from './src/screens/Login';
import Register from './src/screens/Register';
import Vendors from './src/screens/Vendors';
import VendorDetail from './src/screens/VendorDetail';
import Bookings from './src/screens/Bookings';
import NewBooking from './src/screens/NewBooking';
import useAuth from './src/store/auth';
import { SidebarProvider, Sidebar } from './src/components/Sidebar';

const Stack = createNativeStackNavigator();

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <SidebarProvider>
        <AppContent />
      </SidebarProvider>
    </SafeAreaProvider>
  );
}

function AppContent() {
  const insets = useSafeAreaInsets();
  const token = useAuth((s) => s.token);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {token ? (
            <>
              <Stack.Screen name="Home" component={Home} />
              <Stack.Screen name="Vendors" component={Vendors} />
              <Stack.Screen name="VendorDetail" component={VendorDetail} />
              <Stack.Screen name="Bookings" component={Bookings} />
              <Stack.Screen name="NewBooking" component={NewBooking} />
            </>
          ) : (
            <>
              <Stack.Screen name="Login" component={Login} />
              <Stack.Screen name="Register" component={Register} />
            </>
          )}
        </Stack.Navigator>
        {token && <Sidebar />}
      </NavigationContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});

export default App;
