import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import contractABI from "./abi.json";

const contractAddress = "0x677ce9cba67f7484ea951a12897ce780cfd8fed1";

export default function Portfolio() {
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState("0");
  const [rewards, setRewards] = useState("0");

  useEffect(() => {
    async function load() {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(contractAddress, contractABI, signer);

        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        setAccount(accounts[0]);

        const bal = await contract.balanceOf(accounts[0]);
        setBalance(ethers.formatUnits(bal, 18));

        const pending = await contract.pendingReward(accounts[0]);
        setRewards(ethers.formatUnits(pending, 18));
      }
    }
    load();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold">My Portfolio</h2>
      <p>Wallet: {account}</p>
      <p>Balance: {balance}</p>
      <p>Pending Rewards: {rewards}</p>
      <button
        onClick={async () => {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const contract = new ethers.Contract(contractAddress, contractABI, signer);
          await contract.claimRewards();
        }}
        className="bg-blue-600 text-white px-4 py-2 rounded mt-4"
      >
        Claim Rewards
      </button>
    </div>
  );
}
