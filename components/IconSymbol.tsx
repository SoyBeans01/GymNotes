// components/ui/IconSymbol.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface IconSymbolProps {
  name: string;
  size?: number;
  color?: string;
}

export const IconSymbol: React.FC<IconSymbolProps> = ({
  name,
  size = 24,
  color = 'white',
}) => {
  // Placeholder: Just render the icon name as text for now
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Text style={[styles.text, { fontSize: size * 0.8, color }]}>
        {name}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontWeight: 'bold',
  },
});
