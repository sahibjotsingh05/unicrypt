
import React, { useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  Button,
  StyleSheet,
  ActivityIndicator,
  Modal,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";

const API_BASE_URL = "http://3.94.208.17:2000";

export default function DashboardScreen() {
  // Existing states
  const [username, setUsername] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal and assets states
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<"id" | "crypto" | "tickets" | "door" | null>(null);
  const [userAssets, setUserAssets] = useState<any>(null);
  const [purchaseAmount, setPurchaseAmount] = useState("");

 useFocusEffect(
   React.useCallback(() => {
     checkUser();
   }, [])
 );

 const checkUser = async () => {

   setUsername(null);
   setBalance(null);
   setUserAssets(null);

   const storedUsername = await AsyncStorage.getItem("username");
   if (storedUsername) {
     setUsername(storedUsername);
     fetchBalance(storedUsername);
   } else {
     setLoading(false);
   }
 };

  const fetchBalance = async (user: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/balances/${user}`);
      const data = await response.json();
      setBalance(data.brb || "0.0");
    } catch (error) {
      console.error("Balance Fetch Error:", error);
      setBalance("0.0");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserAssets = async (user: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/getUserAssets/${user}`);
      const data = await response.json();
      setUserAssets(data);
    } catch (error) {
      console.error("Error fetching user assets:", error);
      setUserAssets(null);
    }
  };

  const openModal = async (type: "id" | "crypto" | "tickets" | "door") => {
    if (!username) return;
    await fetchUserAssets(username);
    setModalType(type);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setModalType(null);
    setUserAssets(null);
    setPurchaseAmount("");
  };

  const handleBuyBears = async () => {
    if (!username || !purchaseAmount) {
      Alert.alert("Error", "Please enter an amount.");
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/buybearbucks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, amount: purchaseAmount }),
      });
      const data = await response.json();
      if (data.token || data.success) {
        Alert.alert("Success", "Purchase successful!");
        // Optionally update the balance after purchase
        fetchBalance(username);
        closeModal();
      } else {
        Alert.alert("Purchase Failed", "Unable to complete purchase.");
      }
    } catch (error) {
      console.error("Buy Bears Error:", error);
      Alert.alert("Error", "An error occurred during purchase.");
    }
  };

  if (loading)
    return (
      <ActivityIndicator size="large" color="blue" style={styles.loader} />
    );

  if (!username) {
    return (
      <ThemedView style={styles.logoutcontainer}>
        <ThemedText type="title">Please Log In to Continue</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header Container */}
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <ThemedText type="title">Welcome, {username}!</ThemedText>
        </View>
        <View style={styles.balanceContainer}>
          <ThemedText type="subtitle" style={styles.balanceText}>
            ${parseFloat(balance || "0").toFixed(2)}
          </ThemedText>
        </View>
      </View>

      {/* Dashboard Grid */}
      <View style={styles.gridContainer}>
        <TouchableOpacity style={styles.gridItem} onPress={() => openModal("id")}>
          <Text style={styles.gridText}>My ID</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.gridItem} onPress={() => openModal("crypto")}>
          <Text style={styles.gridText}>Crypto Wallet</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.gridItem} onPress={() => openModal("tickets")}>
          <Text style={styles.gridText}>Tickets</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.gridItem} onPress={() => openModal("door")}>
          <Text style={styles.gridText}>Door Access</Text>
        </TouchableOpacity>
      </View>

      {/* Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {modalType === "id" && (
              <>
                <ThemedText type="title" style={styles.modalThemeText}>My ID</ThemedText>
                <View style={styles.card}>
                  <Text style={styles.cardText}>Username: {username}</Text>
                  <Text style={styles.cardText}>
                    {userAssets && userAssets.studentId
                      ? `Student ID: ${userAssets.studentId}`
                      : "Not attached to a UserID"}
                  </Text>
                </View>
              </>
            )}
            {modalType === "crypto" && (
              <>
                <ThemedText type="title" style={styles.modalThemeText}>Crypto Wallet</ThemedText>
                {userAssets && (
                  <Text style={styles.cardText}>
                    Current BRB Balance: {userAssets.brbBalance}
                  </Text>
                )}
		<TextInput
		  style={styles.inputModal}
                  placeholder="Credit Card Number"
		  keyboardType="numeric"
                  placeholderTextColor="#888"
                 />
                <TextInput
                  style={styles.inputModal}
                  placeholder="Enter amount to buy"
                  keyboardType="numeric"
                  value={purchaseAmount}
                  onChangeText={setPurchaseAmount}
                  placeholderTextColor="#888"
                />
                <Button title="Buy" onPress={handleBuyBears} />
              </>
            )}
            {modalType === "tickets" && (
              <>
                <ThemedText type="title" style={styles.modalThemeText}>Tickets</ThemedText>
                <View style={styles.card}>
                  <Text style={styles.cardText}>
                    {userAssets && userAssets.ticketAccess
                      ? "Ticket 1: Currently in Wallet"
                      : "Ticket 1: Not in Wallet"}
                  </Text>
                </View>
              </>
            )}
            {modalType === "door" && (
              <>
                <ThemedText type="title" style={styles.modalThemeText}>Door Access</ThemedText>
                <View style={styles.card}>
                  <Text style={styles.cardText}>
                    {userAssets && userAssets.doorAccess
                      ? "Building 1 Door: Access Granted to Wallet"
                      : "Building 1 Door: Access Denied"}
                  </Text>
                </View>
              </>
            )}
            <Button title="Close" onPress={closeModal} />
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  logoutcontainer: {flex: 1, padding: 20, backgroundColor: "#000", marginTop: 60},
  container: { flex: 1, padding: 20, backgroundColor: "#000" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Header Container
  header: {
    width: "100%",
    height: "25%",
    backgroundColor: "#445D48",
    borderRadius: 10,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    marginTop: 60
  },
  headerTextContainer: { flex: 1 },
  balanceContainer: {
    backgroundColor: "#D6CC99",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  balanceText: { 
   color: "#445D48",
},
  // Grid Container
  gridContainer: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  gridItem: {
    width: "48%",
    height: 100,
    backgroundColor: "#D2D79F",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    marginBottom: 10,
  },
  gridText: { color: "#2C3930", fontWeight: "bold", fontSize: 16 },
  modalThemeText: {
  color: "#445D48",
 },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  card: {
    width: "100%",
    padding: 15,
    backgroundColor: "#f2f2f2",
    borderRadius: 10,
    marginVertical: 10,
  },
  inputModal: {
    color: "#000",
  },
  cardText: { fontSize: 16, marginBottom: 5 },
  inputModal: {
    width: "100%",
    padding: 10,
    borderWidth: 1,
    borderRadius: 5,
    marginVertical: 10,
  },
});
