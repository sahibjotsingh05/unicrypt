import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Button, TouchableOpacity, StyleSheet, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { useFocusEffect } from "@react-navigation/native";

const API_BASE_URL = "http://3.94.208.17:2000";

export default function ProfileScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loggedInUser, setLoggedInUser] = useState("");

 useFocusEffect(
   React.useCallback(() => {
     checkAuthentication();
   }, [])
 );

  const checkAuthentication = async () => {
    const token = await AsyncStorage.getItem("jwt");
    if (token) {
      try {
        const response = await fetch(`${API_BASE_URL}/authenticateUser`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (data.valid) {
          setLoggedInUser(data.username);
        } else {
          AsyncStorage.removeItem("jwt");
          AsyncStorage.removeItem("username");
          setLoggedInUser(null);
        }
      } catch (error) {
        console.error("Auth Check Error:", error);
        setLoggedInUser(null);
      }
    }
  };

  const handleSignup = async () => {
    if (!username || !email || !password || password !== confirmPassword) {
      Alert.alert("Error", "Please fill all fields correctly");
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/createUser`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, encryptedPassword: password }),
      });
      const data = await response.json();
      if (data.token) {
        await AsyncStorage.setItem("jwt", data.token);
        await AsyncStorage.setItem("username", username);
        setLoggedInUser(username);
      } else {
        Alert.alert("Signup Failed", "Something went wrong");
      }
    } catch (error) {
      console.error("Signup Error:", error);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, encryptedPassword: password }),
      });
      const data = await response.json();
      if (data.token) {
        await AsyncStorage.setItem("jwt", data.token);
        await AsyncStorage.setItem("username", email);
        setLoggedInUser(email);
      } else {
        Alert.alert("Login Failed", data.error || "Invalid credentials");
      }
    } catch (error) {
      console.error("Login Error:", error);
    }
  };

 const handleLogout = async () => {
   await AsyncStorage.removeItem("jwt");
   await AsyncStorage.removeItem("username");
   setLoggedInUser(null);
   setIsLogin(true);
   setUsername("");
   setEmail("");
   setPassword("");
   setConfirmPassword("");
 };
  return (
    <ThemedView style={styles.container}>
      {loggedInUser ? (
        <>
          <ThemedText type="title">Hi, {loggedInUser}!</ThemedText>
          <Button title="Logout" onPress={handleLogout} />
        </>
      ) : (
        <>
          <ThemedText type="title">{isLogin ? "Login" : "Sign Up"}</ThemedText>

          {!isLogin && (
            <TextInput
              style={styles.input}
              placeholder="Username"
              value={username}
              onChangeText={setUsername}
            />
          )}
          <TextInput
            style={styles.input}
            placeholder="Email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          {!isLogin && (
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          )}

          <Button title={isLogin ? "Login" : "Sign Up"} onPress={isLogin ? handleLogin : handleSignup} />

          <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
            <Text style={styles.toggleText}>
              {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
            </Text>
          </TouchableOpacity>
        </>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  input: { width: "100%", padding: 10, borderWidth: 1, borderRadius: 5, color: "#fff", marginBottom: 10, borderColor: "#fff", marginTop: 30 },
  toggleText: { marginTop: 10, color: "#9AE66E" },
});
