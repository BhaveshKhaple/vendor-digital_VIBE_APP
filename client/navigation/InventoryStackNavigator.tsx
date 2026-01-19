import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import InventoryScreen from '@/screens/InventoryScreen';
import { useScreenOptions } from '@/hooks/useScreenOptions';

export type InventoryStackParamList = {
  Inventory: undefined;
};

const Stack = createNativeStackNavigator<InventoryStackParamList>();

export default function InventoryStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Inventory"
        component={InventoryScreen}
        options={{
          headerTitle: 'Products',
        }}
      />
    </Stack.Navigator>
  );
}
