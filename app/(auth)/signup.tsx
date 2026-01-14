import { Link, useRouter } from "expo-router";
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

export default function Signup() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSignup = async () => {
    if (!name || !email || !password) {
      return Alert.alert("Missing info", "Fill name, email and password");
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (error) return Alert.alert("Signup failed", error.message);

      const userId = data.user?.id;
      if (userId) {
        await supabase.from("profiles").upsert({
          id: userId,
          name,
          avatar_url: avatarUrl || null,
        });
      }

      Alert.alert("Success", "Account created. Please login.");
      router.replace("/(auth)/login");
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Start building your quote collection.</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign up</Text>

          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Your name"
            placeholderTextColor="#9CA3AF"
            value={name}
            onChangeText={setName}
          />

          <Text style={[styles.label, { marginTop: 12 }]}>Avatar URL (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="https://..."
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
            value={avatarUrl}
            onChangeText={setAvatarUrl}
          />

          <Text style={[styles.label, { marginTop: 12 }]}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={[styles.label, { marginTop: 12 }]}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Minimum 6 characters"
            placeholderTextColor="#9CA3AF"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.7 }]}
            onPress={onSignup}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? "Creating..." : "Sign up"}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomRow}>
          <Text style={styles.bottomText}>Already have account? </Text>
          <Link href="/(auth)/login" style={styles.bottomLink}>
            Login
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

  bottomRow: { flexDirection: "row", justifyContent: "center", marginTop: 18 },
  bottomText: { color: "#6B7280" },
  bottomLink: { color: "#000", fontWeight: "700" },
});
