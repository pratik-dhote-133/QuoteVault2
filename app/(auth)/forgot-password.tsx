import { Link } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { supabase } from "../../src/lib/supabase";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const onReset = async () => {
    if (!email) return Alert.alert("Missing email", "Enter your email.");

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (error) return Alert.alert("Error", error.message);

      Alert.alert("Sent!", "Reset link sent to your email.");
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>We’ll send a reset link to your email.</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Forgot password</Text>

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.7 }]}
            onPress={onReset}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? "Sending..." : "Send Reset Link"}</Text>
          </TouchableOpacity>

          <Link href="/(auth)/login" asChild>
            <TouchableOpacity style={{ paddingVertical: 12 }}>
              <Text style={{ textAlign: "center", color: "#374151" }}>Back to login</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  header: {
    backgroundColor: "#000",
    paddingHorizontal: 22,
    paddingTop: 32,
    paddingBottom: 26,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  title: { color: "#fff", fontSize: 28, fontWeight: "800" },
  subtitle: { color: "rgba(255,255,255,0.75)", marginTop: 8, fontSize: 15 },

  body: { paddingHorizontal: 22, marginTop: 22 },
  card: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 22,
    padding: 16,
    backgroundColor: "#fff",
  },
  cardTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12, color: "#111" },

  label: { fontSize: 13, color: "#6B7280", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#111",
  },

  button: {
    backgroundColor: "#000",
    borderRadius: 16,
    paddingVertical: 14,
    marginTop: 18,
  },
  buttonText: { color: "#fff", textAlign: "center", fontWeight: "700", fontSize: 16 },
});
