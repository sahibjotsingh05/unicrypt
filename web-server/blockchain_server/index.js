const express = require("express");
const hre = require("hardhat"); // Hardhat runtime environment
const { ethers } = hre;
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());

const JWT_SECRET = "your_jwt_secret"; // Replace with a secure secret in production

// In-memory storage for JWT tokens and email lookup
const activeTokens = new Set();
const emailToUsername = {};

// Hardhat local node
const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");

// Use the first Hardhat account as admin
const adminWallet = new ethers.Wallet(
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", // Hardhat account #0 private key
  provider
);

// BearBucks contract address (update after deployment)
const bearBucksAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Replace with your deployed address
let bearBucks;

// In-memory user storage and merchants
const users = {};
const merchants = {};
const studentIdToUser = {};

// Initialize contract and a demo merchant
async function init() {
  const BearBucks = await hre.ethers.getContractFactory("BearBucks");
  bearBucks = BearBucks.attach(bearBucksAddress).connect(adminWallet);
  console.log("BearBucks initialized at:", bearBucksAddress);

  // Create a demo merchant
  const merchantWallet = ethers.Wallet.createRandom();
  const merchantId = 0;
  const merchantName = "submart";

  merchants[merchantId] = {
    name: merchantName,
    address: merchantWallet.address,
    privateKey: merchantWallet.privateKey,
  };

  await adminWallet.sendTransaction({
    to: merchantWallet.address,
    value: ethers.utils.parseEther("10"), // 10 ETH
  });

  await bearBucks.mint(merchantWallet.address, ethers.utils.parseEther("100"));
  console.log("Merchant wallet created:");
  console.log("Merchant ID:", merchantId);
  console.log("Merchant Name:", merchantName);
  console.log("Merchant Address:", merchantWallet.address);
  console.log("Merchant Private Key:", merchantWallet.privateKey);
}

// Create new user with email and encrypted password
app.post("/createUser", async (req, res) => {
  const { username, email, encryptedPassword } = req.body;

  if (!username || !email || !encryptedPassword) {
    return res.status(400).json({ error: "username, email, and encryptedPassword are required" });
  }

  if (users[username]) {
    return res.status(400).json({ error: "User already exists" });
  }

  if (emailToUsername[email]) {
    return res.status(400).json({ error: "Email already registered" });
  }

  // Create wallet for the new user
  const wallet = ethers.Wallet.createRandom();
  users[username] = {
    address: wallet.address,
    privateKey: wallet.privateKey,
  };
  emailToUsername[email] = username;

  // Fund the wallet with ETH and BearBucks tokens
  await adminWallet.sendTransaction({
    to: wallet.address,
    value: ethers.utils.parseEther("10"), // 10 ETH
  });

  await bearBucks.mint(wallet.address, ethers.utils.parseEther("5")); // 1000 BRB

  // Store user credentials on-chain (assumes your contract has setUserCredentials)
  try {
    const tx = await bearBucks.setUserCredentials(wallet.address, email, encryptedPassword);
    await tx.wait();
  } catch (error) {
    console.error("Error storing credentials on-chain:", error);
    return res.status(500).json({ error: "Failed to store credentials", details: error.message });
  }

  // Create a JWT token for the new user session
  const token = jwt.sign({ username, address: wallet.address }, JWT_SECRET, { expiresIn: "1h" });
  activeTokens.add(token);

  res.json({ address: wallet.address, token });
});

// Login route: verify email and encryptedPassword then issue JWT
app.post("/login", async (req, res) => {
  const { email, encryptedPassword } = req.body;

  if (!email || !encryptedPassword) {
    return res.status(400).json({ error: "Email and encryptedPassword are required" });
  }

  const username = emailToUsername[email];
  if (!username) {
    return res.status(404).json({ error: "User not found" });
  }

  const user = users[username];

  // Retrieve stored credentials from the blockchain
  try {
    const credentials = await bearBucks.userCredentials(user.address);
    const storedEmail = credentials.email;
    const storedEncryptedPassword = credentials.encryptedPassword;

    if (storedEmail !== email || storedEncryptedPassword !== encryptedPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (error) {
    console.error("Error verifying credentials:", error);
    return res.status(500).json({ error: "Failed to verify credentials", details: error.message });
  }

  // Credentials valid, generate a new JWT
  const token = jwt.sign({ username, address: user.address }, JWT_SECRET, { expiresIn: "1h" });
  activeTokens.add(token);

  res.json({ token });
});


app.get("/authenticateUser", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.json({ valid: false });
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.json({ valid: false });
  }

  // Verify token signature and check if token is active
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err || !activeTokens.has(token)) {
      return res.json({ valid: false });
    }
    // Return valid true along with username from the decoded token
    return res.json({ valid: true, username: decoded.username });
  });
});

// Logout route: "remove" the token from the active tokens set
app.post("/logout", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(400).json({ error: "No token provided" });
  }
  const token = authHeader.split(" ")[1];
  if (activeTokens.has(token)) {
    activeTokens.delete(token);
    return res.json({ success: true, message: "Logged out successfully" });
  } else {
    return res.status(400).json({ error: "Invalid token" });
  }
});

// Existing routes below remain unchanged

app.get("/balances/:username", async (req, res) => {
  const username = req.params.username;
  let address;

  // Check if the username is "merchant"
  if (username === "merchant") {
    console.log("Doing Merchant");
    const merchantId = 0; // Fixed merchant ID
    const merchant = merchants[merchantId];
    if (!merchant) {
      return res.status(404).json({ error: "Merchant not found" });
    }
    address = merchant.address;
  } else {
    const user = users[username];
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    address = user.address;
  }

  try {
    const ethBalance = await provider.getBalance(address);
    const brbBalance = await bearBucks.balanceOf(address);
    res.json({
      eth: ethers.utils.formatEther(ethBalance),
      brb: ethers.utils.formatEther(brbBalance),
    });
  } catch (error) {
    console.error("Error fetching balances:", error);
    res.status(500).json({ error: "Failed to fetch balances", details: error.message });
  }
});

app.post("/transfer", async (req, res) => {
  const { studentId, merchantId, amount } = req.body;

  if (!studentId) {
    return res.status(400).json({ success: false, message: "Student ID is required" });
  }

  // Look up the user using studentId
  const user = studentIdToUser[studentId];
  if (!user) {
    return res.status(404).json({ success: false, message: "Unauthorized Card" });
  }

  const merchant = merchants[merchantId];
  if (!merchant) {
    return res.status(404).json({ success: false, message: "Merchant not found" });
  }

  const userWallet = new ethers.Wallet(user.privateKey, provider);
  const bearBucksWithUser = bearBucks.connect(userWallet);

  try {
    // Check user's BearBucks balance before attempting transfer
    const balance = await bearBucks.balanceOf(user.address);
    const transferAmount = ethers.utils.parseEther(amount);

    if (balance.lt(transferAmount)) {
      return res.status(400).json({ success: false, message: "Insufficient Funds" });
    }

    const tx = await bearBucksWithUser.transfer(merchant.address, transferAmount);
    await tx.wait();

    return res.json({ success: true, txHash: tx.hash });
  } catch (error) {
    console.error("Transfer failed:", error);
    return res.status(500).json({ success: false, message: "Transfer failed", details: error.message });
  }
});

app.post("/updateUserAssets", async (req, res) => {
  const { username, studentId, ticketAccess, doorAccess, attendance } = req.body;
  if (!users[username]) {
    return res.status(404).json({ error: "User not found" });
  }
  const userAddress = users[username].address;
  try {
    const tx = await bearBucks.setUserAssets(
      userAddress,
      studentId,
      ticketAccess,
      doorAccess,
      attendance
    );
    await tx.wait();

    // If a studentId is provided, update our in-memory mapping.
    if (studentId) {
      studentIdToUser[studentId] = users[username];
    }

    res.json({ success: true, txHash: tx.hash });
  } catch (error) {
    console.error("Error updating user assets:", error);
    res.status(500).json({ error: "Failed to update user assets", details: error.message });
  }
});

app.get("/getUserAssets/:username", async (req, res) => {
  const { username } = req.params;
  if (!users[username]) {
    return res.status(404).json({ error: "User not found" });
  }
  const userAddress = users[username].address;
  try {
    const [studentId, ticketAccess, doorAccess, attendance] = await bearBucks.getUserAssets(
      userAddress
    );
    
    // Fetch ETH and BRB balances
    const ethBalance = await provider.getBalance(userAddress);
    const brbBalance = await bearBucks.balanceOf(userAddress);

    // Format balances to readable strings
    const formattedEth = ethers.utils.formatEther(ethBalance);
    const formattedBrb = ethers.utils.formatEther(brbBalance);

    res.json({ 
      studentId, 
      ticketAccess, 
      doorAccess, 
      attendance, 
      ethBalance: formattedEth,
      brbBalance: formattedBrb 
    });
  } catch (error) {
    console.error("Error fetching user assets:", error);
    res.status(500).json({ error: "Failed to fetch user assets", details: error.message });
  }
});

app.get("/transactions", async (req, res) => {
  try {
    // Query for all Transfer events from the BearBucks contract (from block 0 to latest)
    const filter = bearBucks.filters.Transfer();
    const events = await bearBucks.queryFilter(filter, 0, "latest");

    // Build reverse lookups for user addresses and merchant addresses
    const userAddressMapping = {};
    for (const username in users) {
      userAddressMapping[users[username].address.toLowerCase()] = username;
    }
    const merchantAddressMapping = {};
    for (const merchantId in merchants) {
      const merchant = merchants[merchantId];
      merchantAddressMapping[merchant.address.toLowerCase()] = merchant.name;
    }

    // Filter events to include only those where the sender is a registered user and the receiver is a known merchant.
    const transactions = events.reduce((acc, event) => {
      const fromAddr = event.args.from.toLowerCase();
      const toAddr = event.args.to.toLowerCase();
      if (userAddressMapping[fromAddr] && merchantAddressMapping[toAddr]) {
        acc.push({
          from: userAddressMapping[fromAddr],
          merchant: merchantAddressMapping[toAddr],
          amount: ethers.utils.formatEther(event.args.value)
        });
      }
      return acc;
    }, []);

    res.json({ success: true, transactions });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ success: false, message: "Failed to fetch transactions", details: error.message });
  }
});

// BuyBearBucks route: mint additional BearBucks tokens for the user
app.post("/buybearbucks", async (req, res) => {
  const { username, amount } = req.body;

  if (!username || !amount) {
    return res.status(400).json({ success: false, message: "Username and amount are required" });
  }

  const user = users[username];
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  try {
    // Convert the provided amount to Wei (assumes BearBucks has 18 decimals)
    const mintAmount = ethers.utils.parseEther(amount);

    // Call the mint function on the BearBucks contract using the admin wallet
    const tx = await bearBucks.mint(user.address, mintAmount);
    await tx.wait();

    res.json({ success: true, message: "BearBucks purchased successfully", txHash: tx.hash });
  } catch (error) {
    console.error("Error buying BearBucks:", error);
    res.status(500).json({ success: false, message: "Failed to buy BearBucks", details: error.message });
  }
});
app.post("/incrementAttendance", async (req, res) => {
  const { studentId } = req.body;

  if (!studentId) {
    return res.status(400).json({ 
      status: "error", 
      message: "Student ID is required" 
    });
  }

  // Check if studentId exists in the mapping
  const user = studentIdToUser[studentId];
  if (!user) {
    return res.status(404).json({ 
      status: "error", 
      message: "Student ID not found" 
    });
  }

  try {
    // Execute the increment through the admin wallet
    const tx = await bearBucks
      .connect(adminWallet)
      .incrementAttendance(user.address);
    
    await tx.wait();

    res.json({ 
      status: "success", 
      message: "Attendance incremented successfully",
      txHash: tx.hash
    });
  } catch (error) {
    console.error("Error incrementing attendance:", error);
    res.status(500).json({ 
      status: "error", 
      message: "Failed to increment attendance",
      details: error.message 
    });
  }
});

app.post("/validateAccess", async (req, res) => {
  const { studentId, verificationType } = req.body;

  // Validate input parameters
  if (!studentId || !verificationType) {
    return res.status(400).json({
      valid: false,
      message: "Both studentId and verificationType are required"
    });
  }

  // Check valid verification types
  const validTypes = ['door', 'ticket', 'studentId'];
  if (!validTypes.includes(verificationType)) {
    return res.status(400).json({
      valid: false,
      message: "Invalid verification type. Use 'door', 'ticket', or 'studentId'"
    });
  }

  // Find user by studentId
  const user = studentIdToUser[studentId];
  if (!user) {
    return res.status(404).json({
      valid: false,
      message: "Student ID not registered"
    });
  }

  try {
    // Get user assets from blockchain
    const [storedStudentId, ticketAccess, doorAccess] = await bearBucks.getUserAssets(user.address);

    let isValid = false;
    let message = "";

    switch(verificationType) {
      case 'door':
        isValid = doorAccess;
        message = doorAccess 
          ? "Door access granted" 
          : "Door access denied";
        break;
        
      case 'ticket':
        isValid = ticketAccess;
        message = ticketAccess 
          ? "Ticket access granted" 
          : "Ticket access denied";
        break;
        
      case 'studentId':
        isValid = storedStudentId === studentId;
        message = isValid 
          ? "Valid student ID" 
          : "Invalid student ID";
        break;
    }

    res.json({
      valid: isValid,
      message: message,
      studentId: studentId,
      verificationType: verificationType
    });

  } catch (error) {
    console.error("Access validation failed:", error);
    res.status(500).json({
      valid: false,
      message: "Failed to validate access",
      details: error.message
    });
  }
});

// Start server
app.listen(2000, async () => {
  console.log("API running on port 2000");
  await init();
});
