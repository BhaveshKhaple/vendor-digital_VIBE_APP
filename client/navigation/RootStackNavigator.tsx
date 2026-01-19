import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import AddProductScreen from "@/screens/AddProductScreen";
import EditProductScreen from "@/screens/EditProductScreen";
import AddCreditScreen from "@/screens/AddCreditScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import type { Customer } from "@/lib/repositories/types";

export type RootStackParamList = {
  Main: undefined;
  AddProduct: undefined;
  EditProduct: { productId: number };
  AddCredit: { customer?: Customer };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Main"
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AddProduct"
        component={AddProductScreen}
        options={{
          presentation: "modal",
          headerTitle: "Add Product",
        }}
      />
      <Stack.Screen
        name="EditProduct"
        component={EditProductScreen}
        options={{
          presentation: "modal",
          headerTitle: "Edit Product",
        }}
      />
      <Stack.Screen
        name="AddCredit"
        component={AddCreditScreen}
        options={{
          presentation: "modal",
          headerTitle: "Add Credit (Udhaar)",
        }}
      />
    </Stack.Navigator>
  );
}
