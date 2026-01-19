import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LedgerScreen from '@/screens/LedgerScreen';
import { useScreenOptions } from '@/hooks/useScreenOptions';

export type LedgerStackParamList = {
  Ledger: undefined;
};

const Stack = createNativeStackNavigator<LedgerStackParamList>();

export default function LedgerStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Ledger"
        component={LedgerScreen}
        options={{
          headerTitle: 'Customer Ledger',
        }}
      />
    </Stack.Navigator>
  );
}
