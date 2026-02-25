import crypto from "crypto";

class BlockchainService {
  constructor() {
    this.chain = [];
    this.createGenesisBlock();
  }

  // Create first block
  createGenesisBlock() {
    const timestamp = Date.now();
    const data = {
      action: "GENESIS_BLOCK",
      description: "Initial block of the audit chain",
      userId: "system",
      ip: "0.0.0.0",
    };

    const genesisBlock = {
      index: 0,
      timestamp: timestamp,
      data: data,
      previousHash: "0".repeat(64), // 64 zeros
      hash: this.calculateHash(
        0,
        timestamp,
        data,
        "0".repeat(64),
      ),
    };
    this.chain.push(genesisBlock);
    console.log(
      "✅ Genesis block created:",
      genesisBlock.hash.substring(0, 16) + "...",
    );
  }

  // Calculate SHA-256 hash
  calculateHash(index, timestamp, data, previousHash) {
    // Ensure previousHash is a string
    const prevHashStr = String(previousHash);
    const content = `${index}${timestamp}${JSON.stringify(data)}${prevHashStr}`;
    return crypto.createHash("sha256").update(content).toString("hex");
  }

  // Add new audit block
  addBlock(userId, action, ip, details = {}) {
    const lastBlock = this.chain[this.chain.length - 1];
    const index = this.chain.length;
    const timestamp = Date.now();

    let safeDetails = {};
    try {
      safeDetails = JSON.parse(JSON.stringify(details));
    } catch (e) {
      safeDetails = String(details);
    }

    const blockData = {
      action,
      description: this.getActionDescription(action),
      userId,
      ip,
      details: safeDetails,
      timestamp: new Date(timestamp).toISOString(),
    };

    const hash = this.calculateHash(
      index,
      timestamp,
      blockData,
      lastBlock.hash,
    );

    const newBlock = {
      index,
      timestamp,
      data: blockData,
      previousHash: lastBlock.hash,
      hash,
      nonce: Math.floor(Math.random() * 10000), // Simple proof-of-work simulation
    };

    this.chain.push(newBlock);
    console.log(`🔗 Block #${index} added: ${hash.substring(0, 16)}...`);

    return newBlock;
  }

  // Get action descriptions
  getActionDescription(action) {
    const descriptions = {
      LOGIN: "User authentication attempt",
      LOGOUT: "User session terminated",
      CREATE_RESOURCE: "New resource created",
      DELETE_RESOURCE: "Resource deleted",
      UPDATE_PERMISSION: "Permission modified",
      ROLE_ASSIGNMENT: "Role assigned to user",
      UNAUTHORIZED_ACCESS: "Unauthorized access attempt",
      PASSWORD_CHANGE: "Password updated",
      MFA_SETUP: "Multi-factor authentication configured",
    };
    return descriptions[action] || "System activity";
  }

  // Get entire chain
  getChain() {
    return this.chain;
  }

  // Get last N blocks
  getRecentBlocks(limit = 10) {
    return this.chain.slice(-limit).reverse();
  }

  // Verify chain integrity
  verifyChain() {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      // Verify current block's hash
      const calculatedHash = this.calculateHash(
        currentBlock.index,
        currentBlock.timestamp,
        currentBlock.data,
        currentBlock.previousHash,
      );

      if (currentBlock.hash !== calculatedHash) {
        return {
          valid: false,
          invalidBlock: currentBlock.index,
          reason: "Hash mismatch",
        };
      }

      // Verify link to previous block
      if (currentBlock.previousHash !== previousBlock.hash) {
        return {
          valid: false,
          invalidBlock: currentBlock.index,
          reason: "Broken chain link",
        };
      }
    }

    return {
      valid: true,
      blockCount: this.chain.length,
      message: "✅ Blockchain integrity verified",
    };
  }

  // Simulate tampering (for demo purposes)
  simulateTampering(blockIndex) {
    if (blockIndex >= 0 && blockIndex < this.chain.length) {
      const originalHash = this.chain[blockIndex].hash;
      this.chain[blockIndex].data.description = "TAMPERED DATA";
      console.log(`⚠️ Simulated tampering on block #${blockIndex}`);
      console.log(`   Original hash: ${originalHash.substring(0, 16)}...`);
      console.log(`   Chain now invalid: ${!this.verifyChain().valid}`);
    }
  }
}

// Create singleton instance
const blockchainService = new BlockchainService();

export default blockchainService;
