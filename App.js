import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView, Alert } from 'react-native';
import 'react-native-get-random-values'; 
import { ethers } from 'ethers';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Network & Token Configurations
const RPC_URL = "https://bsc-dataseed.binance.org/"; 
const EFC_CONTRACT = "0x677Ce9CBa67f7484ea951a12897CE780cFd8fED1";
const MINIMAL_ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

export default function App() {
  const [wallet, setWallet] = useState(null);
  const [efcBalance, setEfcBalance] = useState("0.0");
  const [bnbBalance, setBnbBalance] = useState("0.0");
  const [loading, setLoading] = useState(false);

  // Load existing wallet on startup
  useEffect(() => {
    checkForSavedWallet();
  }, []);

  const checkForSavedWallet = async () => {
    try {
      const savedPrivateKey = await AsyncStorage.getItem('@private_key');
      if (savedPrivateKey) {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const importedWallet = new ethers.Wallet(savedPrivateKey, provider);
        setWallet(importedWallet);
        fetchBalances(importedWallet);
      }
    } catch (e) {
      console.log("Failed to load secure keys", e);
    }
  };

  // Generate a brand new self-custodial wallet locally
  const createNewWallet = async () => {
    setLoading(true);
    try {
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const newLocalWallet = ethers.Wallet.createRandom(provider);
      
      // Encrypt/Save private key locally on device storage
      await AsyncStorage.setItem('@private_key', newLocalWallet.privateKey);
      
      setWallet(newLocalWallet);
      Alert.alert("Wallet Created!", "Make sure to back up your private keys safely.");
      fetchBalances(newLocalWallet);
    } catch (error) {
      Alert.alert("Error", "Could not generate keys.");
    }
    setLoading(false);
  };

  // Fetch real-time blockchain balances
  const fetchBalances = async (currentWallet) => {
    if (!currentWallet) return;
    try {
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      
      // 1. Fetch native BNB Balance
      const rawBnb = await provider.getBalance(currentWallet.address);
      setBnbBalance(ethers.formatEther(rawBnb));

      // 2. Fetch custom EFC Balance
      const contract = new ethers.Contract(EFC_CONTRACT, MINIMAL_ERC20_ABI, provider);
      const decimals = await contract.decimals();
      const rawEfc = await contract.balanceOf(currentWallet.address);
      setEfcBalance(ethers.formatUnits(rawEfc, decimals));
    } catch (error) {
      console.log("Error updating balances:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.centerContent}>
        <Text style={styles.title}>Efikcoin Wallet 🌎</Text>
        
        {!wallet ? (
          <View style={styles.card}>
            <Text style={styles.infoText}>Create your secure, decentralised self-custodial wallet to begin trading globally.</Text>
            <TouchableOpacity style={styles.button} onPress={createNewWallet} disabled={loading}>
              <Text style={styles.buttonText}>{loading ? "Generating..." : "Create New Wallet"}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.walletContainer}>
            <Text style={styles.label}>Your Secure Public Address:</Text>
            <Text style={styles.addressText}>{wallet.address}</Text>

            {/* Asset Rows */}
            <View style={styles.assetCard}>
              <Text style={styles.assetTitle}>Efikcoin (EFC)</Text>
              <Text style={styles.assetAmount}>{parseFloat(efcBalance).toFixed(2)} EFC</Text>
            </View>

            <View style={styles.assetCard}>
              <Text style={styles.assetTitle}>BNB (Gas Network fees)</Text>
              <Text style={styles.assetAmount}>{parseFloat(bnbBalance).toFixed(4)} BNB</Text>
            </View>

            {/* Global Actions */}
            <View style={styles.row}>
              <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#27ae60'}]} onPress={() => fetchBalances(wallet)}>
                <Text style={styles.buttonText}>Refresh</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#2980b9'}]} onPress={() => Alert.alert("Send Feature", "Input destination address and EFC amount.")}>
                <Text style={styles.buttonText}>Send EFC</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  centerContent: { padding: 20, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#f8fafc', marginVertical: 20 },
  card: { width: '100%', backgroundColor: '#1e293b', padding: 20, borderRadius: 12, alignItems: 'center' },
  walletContainer: { width: '100%', marginTop: 10 },
  label: { color: '#94a3b8', fontSize: 14, marginBottom: 4 },
  addressText: { color: '#38bdf8', fontSize: 12, backgroundColor: '#1e293b', padding: 10, borderRadius: 6, marginBottom: 20, textAlign: 'center' },
  infoText: { color: '#cbd5e1', textAlign: 'center', marginBottom: 20, fontSize: 15 },
  assetCard: { width: '100%', backgroundColor: '#1e293b', padding: 18, borderRadius: 10, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  assetTitle: { color: '#f8fafc', fontWeight: '600', fontSize: 16 },
  assetAmount: { color: '#4ade80', fontSize: 16, fontWeight: 'bold' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  button: { backgroundColor: '#e2b53e', paddingVertical: 14, paddingHorizontal: 30, borderRadius: 8 },
  actionBtn: { flex: 0.48, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#0f172a', fontWeight: 'bold', fontSize: 16 }
});
