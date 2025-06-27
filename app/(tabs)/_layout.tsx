import { Tabs } from 'expo-router';
import React from 'react';

import { IconSymbol } from '@/components/IconSymbol';
import { PlatformPressable } from '@react-navigation/elements';


export default function TabLayout() {

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: (props) => (
      <PlatformPressable
        {...props}
        android_ripple={{ color: 'transparent' }}  // Disables the ripple effect for Android
      />
    ),
      }}>
        <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="H" color={color} />,
        }}
      />
      <Tabs.Screen
        name="log"
        options={{
          title: 'Logs',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="L" color={color} />,
        }}
      />
      <Tabs.Screen
        name="graphs"
        options={{
          title: 'Data',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="D" color={color} />,
        }}
      />
    </Tabs>
  );
}
