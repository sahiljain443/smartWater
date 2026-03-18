import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Water Warrior</Text>
      <Text style={styles.subtitle}>Smart WaterVerse Consumer App</Text>
      <Text style={styles.info}>Coming in Sprint 16 (Phase 2: WALK)</Text>
      <Text style={styles.features}>
        Features: Eco-Score, Water Balance, Community Board, Notifications
      </Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eff8ff",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1e458a",
  },
  subtitle: {
    fontSize: 16,
    color: "#3b95f6",
    marginTop: 4,
  },
  info: {
    fontSize: 14,
    color: "#666",
    marginTop: 20,
  },
  features: {
    fontSize: 12,
    color: "#999",
    marginTop: 8,
    textAlign: "center",
  },
});
