import React from "react";
import { SafeAreaView } from "react-native";
import TravelModeScreen from "./screens/TravelModeScreen";

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <TravelModeScreen onEnabled={() => {}} />
    </SafeAreaView>
  );
}
