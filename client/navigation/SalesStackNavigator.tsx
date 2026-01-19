import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SalesScreen from '@/screens/SalesScreen';
import { HeaderTitle } from '@/components/HeaderTitle';
import { useScreenOptions } from '@/hooks/useScreenOptions';

export type SalesStackParamList = {
  Sales: undefined;
};

const Stack = createNativeStackNavigator<SalesStackParamList>();

export default function SalesStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Sales"
        component={SalesScreen}
        options={{
          headerTitle: () => <HeaderTitle title="Vendor Ledger" />,
        }}
      />
    </Stack.Navigator>
  );
}
