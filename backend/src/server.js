import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import sqlite3 from "sqlite3";
import { promisify } from "util";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const JWT_SECRET =
  process.env.JWT_SECRET ||
  "7d9508fd837e8ce56320e8e4a968a4f9a8d9c8a7b6f5e4d3c2b1a0f9e8d7c6b5";

app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const db = new sqlite3.Database("./database.sqlite");
const dbRun = promisify(db.run.bind(db));
const dbGet = promisify(db.get.bind(db));
const dbAll = promisify(db.all.bind(db));

// ========== BLOCKCHAIN SERVICE ========== //
class BlockchainService {
  constructor() {
    this.chain = [];
    this.isInitialized = false;
    this.difficulty = 1;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      const tableExists = await dbGet(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='blockchain_blocks'",
      );

      if (tableExists) {
        const existingBlocks = await dbAll(
          "SELECT * FROM blockchain_blocks ORDER BY block_index ASC",
        );

        if (existingBlocks.length > 0) {
          this.chain = existingBlocks.map((block) => ({
            index: block.block_index,
            timestamp: new Date(block.timestamp).getTime(),
            data: {
              action: block.action,
              description: this.getActionDescription(block.action),
              userId: block.user_id,
              ip: block.ip_address,
              details: block.details ? JSON.parse(block.details) : {},
              timestamp: block.timestamp,
            },
            previousHash: block.previous_hash,
            hash: block.block_hash,
            nonce: block.nonce,
          }));
          console.log(`📂 Loaded ${this.chain.length} blocks from database`);
          this.isInitialized = true;
          return;
        }
      }

      await this.createGenesisBlock();
    } catch (error) {
      console.error("Error loading blockchain:", error);
      await this.createGenesisBlock();
    }

    this.isInitialized = true;
  }

  async createGenesisBlock() {
    console.log("🔗 Creating genesis block...");

    const timestamp = Date.now();
    const genesisData = {
      action: "GENESIS_BLOCK",
      description: "Initial block of the audit chain",
      userId: "system",
      ip: "0.0.0.0",
      details: {},
      timestamp: new Date(timestamp).toISOString(),
    };

    const genesisBlock = await this.mineBlock(
      0,
      timestamp,
      genesisData,
      "0".repeat(64),
    );

    this.chain.push(genesisBlock);
    await this.saveBlockToDatabase(genesisBlock);

    console.log(
      `✅ Genesis block created: ${genesisBlock.hash.substring(0, 16)}...`,
    );
  }

  async mineBlock(index, timestamp, data, previousHash) {
    let nonce = 0;
    let hash = "";
    const prefix = "0".repeat(this.difficulty);
    const maxAttempts = 1000;

    for (let i = 0; i < maxAttempts; i++) {
      nonce = i;
      hash = this.calculateHash(index, timestamp, data, previousHash, nonce);

      if (hash.startsWith(prefix)) {
        console.log(
          `   Mined block #${index} with nonce: ${nonce}, hash: ${hash.substring(0, 16)}...`,
        );
        return {
          index,
          timestamp,
          data,
          previousHash,
          hash,
          nonce,
        };
      }
    }

    hash = this.calculateHash(index, timestamp, data, previousHash, nonce);

    console.log(
      `   Created block #${index} with nonce: ${nonce}, hash: ${hash.substring(0, 16)}...`,
    );

    return {
      index,
      timestamp,
      data,
      previousHash,
      hash,
      nonce,
    };
  }

  calculateHash(index, timestamp, data, previousHash, nonce) {
    const indexStr = String(index);
    const timestampStr = String(timestamp);
    const dataStr = JSON.stringify(data);
    const previousHashStr = String(previousHash);
    const nonceStr = String(nonce);

    const content = `${indexStr}${timestampStr}${dataStr}${previousHashStr}${nonceStr}`;

    return crypto.createHash("sha256").update(content).digest("hex");
  }

  async addBlock(userId, action, ip, details = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const lastBlock = this.chain[this.chain.length - 1];
    const index = this.chain.length;
    const timestamp = Date.now();

    const blockData = {
      action,
      description: this.getActionDescription(action),
      userId,
      ip,
      details,
      timestamp: new Date(timestamp).toISOString(),
    };

    const newBlock = await this.mineBlock(
      index,
      timestamp,
      blockData,
      lastBlock.hash,
    );

    this.chain.push(newBlock);
    await this.saveBlockToDatabase(newBlock);

    console.log(`🔗 Block #${index} added: ${action} by ${userId}`);
    console.log(`   Hash: ${newBlock.hash.substring(0, 16)}...`);
    return newBlock;
  }

  async saveBlockToDatabase(block) {
    try {
      await dbRun(
        `INSERT OR IGNORE INTO blockchain_blocks 
         (block_index, block_hash, previous_hash, action, user_id, ip_address, details, timestamp, nonce) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          block.index,
          block.hash,
          block.previousHash,
          block.data.action,
          block.data.userId,
          block.data.ip,
          JSON.stringify(block.data.details),
          block.data.timestamp,
          block.nonce,
        ],
      );
    } catch (error) {
      if (!error.message.includes("UNIQUE constraint failed")) {
        console.error("Failed to save block to database:", error.message);
      }
    }
  }

  getActionDescription(action) {
    const descriptions = {
      LOGIN: "User authentication attempt",
      LOGIN_SUCCESS: "User logged in successfully",
      LOGIN_FAILED: "Failed login attempt",
      LOGOUT: "User session terminated",
      CREATE_RESOURCE: "New resource created",
      UPDATE_RESOURCE: "Resource updated",
      DELETE_RESOURCE: "Resource deleted",
      UPDATE_PERMISSION: "Permission modified",
      ROLE_ASSIGNMENT: "Role assigned to user",
      UNAUTHORIZED_ACCESS: "Unauthorized access attempt",
      PASSWORD_CHANGE: "Password updated",
      MFA_SETUP: "Multi-factor authentication configured",
      RESOURCE_CREATE: "Resource created",
      RESOURCE_VIEW: "Resource accessed",
      AUTHENTICATE: "Token authentication",
      AUTH_FAILED: "Authentication failed",
      BLOCKCHAIN_VIEW: "Blockchain accessed",
      DASHBOARD_VIEW: "Dashboard viewed",
      GENESIS_BLOCK: "Initial blockchain block",
      SERVER_ERROR: "Server error occurred",
      ENDPOINT_NOT_FOUND: "Endpoint not found",
      ROLE_CREATED: "New role created",
      ROLE_UPDATED: "Role updated",
      ROLE_DELETED: "Role deleted",
      PERMISSION_ASSIGNED: "Permission assigned to role",
      USER_ROLE_CHANGED: "User role changed",
      TOKEN_VALIDATED: "Token validated successfully",
      // IP Control actions
      IP_WHITELIST_ADDED: "IP address added to whitelist",
      IP_WHITELIST_REMOVED: "IP address removed from whitelist",
      IP_BLACKLIST_ADDED: "IP address added to blacklist",
      IP_BLACKLIST_REMOVED: "IP address removed from blacklist",
      IP_AUTO_BLOCKED: "IP automatically blocked due to failed attempts",
      BLACKLISTED_IP_ATTEMPT: "Blocked attempt from blacklisted IP",
    };
    return descriptions[action] || "System activity";
  }

  getChain() {
    return this.chain;
  }

  getRecentBlocks(limit = 10) {
    return this.chain.slice(-limit).reverse();
  }

  verifyChain() {
    if (this.chain.length === 0) {
      return {
        valid: false,
        message: "Blockchain is empty",
      };
    }

    const genesis = this.chain[0];
    if (genesis.index !== 0 || genesis.previousHash !== "0".repeat(64)) {
      return {
        valid: false,
        invalidBlock: 0,
        reason: "Invalid genesis block",
      };
    }

    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      const calculatedHash = this.calculateHash(
        currentBlock.index,
        currentBlock.timestamp,
        currentBlock.data,
        currentBlock.previousHash,
        currentBlock.nonce,
      );

      if (currentBlock.hash !== calculatedHash) {
        return {
          valid: false,
          invalidBlock: currentBlock.index,
          reason: "Hash mismatch",
        };
      }

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

  getStats() {
    const actions = this.chain.reduce((acc, block) => {
      acc[block.data.action] = (acc[block.data.action] || 0) + 1;
      return acc;
    }, {});

    return {
      totalBlocks: this.chain.length,
      firstBlock: this.chain[0]?.timestamp || null,
      lastBlock: this.chain[this.chain.length - 1]?.timestamp || null,
      actions,
      integrity: this.verifyChain().valid,
      difficulty: this.difficulty,
    };
  }
}

// Create blockchain service instance
const blockchainService = new BlockchainService();

// ========== IP CONTROL SERVICE ========== //
class IPControlService {
  constructor() {
    this.maxAttempts = 5; // Max failed attempts before blocking
    this.blockDuration = 15 * 60 * 1000; // 15 minutes in milliseconds
  }

  // Get client IP from request
  getClientIP(req) {
    const forwarded = req.headers["x-forwarded-for"];
    const ip = forwarded
      ? forwarded.split(",").shift()
      : req.socket.remoteAddress;
    return ip?.replace("::ffff:", "") || "0.0.0.0";
  }

  // Check if IP is whitelisted
  async isWhitelisted(ip) {
    try {
      const result = await dbGet(
        "SELECT * FROM ip_whitelist WHERE ip_address = ?",
        [ip],
      );
      return !!result;
    } catch (error) {
      console.error("Error checking whitelist:", error);
      return false;
    }
  }

  // Check if IP is blacklisted
  async isBlacklisted(ip) {
    try {
      const result = await dbGet(
        "SELECT * FROM ip_blacklist WHERE ip_address = ?",
        [ip],
      );
      return !!result;
    } catch (error) {
      console.error("Error checking blacklist:", error);
      return false;
    }
  }

  // Log login attempt
  async logLoginAttempt(ip, username, success, userAgent) {
    try {
      await dbRun(
        `INSERT INTO ip_login_attempts (ip_address, username, success, user_agent) 
         VALUES (?, ?, ?, ?)`,
        [ip, username, success ? 1 : 0, userAgent],
      );

      // If failed attempt, check if we need to block
      if (!success) {
        await this.checkAndBlockIP(ip);
      }
    } catch (error) {
      console.error("Error logging login attempt:", error);
    }
  }

  // Check failed attempts and block if necessary
  async checkAndBlockIP(ip) {
    try {
      const recentAttempts = await dbAll(
        `SELECT COUNT(*) as count FROM ip_login_attempts 
         WHERE ip_address = ? AND success = 0 
         AND attempt_time > datetime('now', '-15 minutes')`,
        [ip],
      );

      if (recentAttempts[0].count >= this.maxAttempts) {
        // Auto-block IP after too many failures
        await this.addToBlacklist(
          ip,
          "Auto-blocked: Too many failed attempts",
          "system",
        );

        // Log to blockchain
        await blockchainService.addBlock("system", "IP_AUTO_BLOCKED", ip, {
          reason: "Too many failed attempts",
          count: recentAttempts[0].count,
        });

        return true;
      }
      return false;
    } catch (error) {
      console.error("Error checking failed attempts:", error);
      return false;
    }
  }

  // Add IP to whitelist
  async addToWhitelist(ip, description, userId) {
    try {
      await dbRun(
        `INSERT OR IGNORE INTO ip_whitelist (ip_address, description, created_by) 
         VALUES (?, ?, ?)`,
        [ip, description, userId],
      );

      await blockchainService.addBlock(
        userId.toString(),
        "IP_WHITELIST_ADDED",
        ip,
        { description },
      );

      return true;
    } catch (error) {
      console.error("Error adding to whitelist:", error);
      return false;
    }
  }

  // Add IP to blacklist
  async addToBlacklist(ip, reason, userId) {
    try {
      await dbRun(
        `INSERT OR IGNORE INTO ip_blacklist (ip_address, reason, created_by) 
         VALUES (?, ?, ?)`,
        [ip, reason, userId],
      );

      await blockchainService.addBlock(
        userId.toString(),
        "IP_BLACKLIST_ADDED",
        ip,
        { reason },
      );

      return true;
    } catch (error) {
      console.error("Error adding to blacklist:", error);
      return false;
    }
  }

  // Remove from blacklist
  async removeFromBlacklist(ip, userId) {
    try {
      await dbRun("DELETE FROM ip_blacklist WHERE ip_address = ?", [ip]);

      await blockchainService.addBlock(
        userId.toString(),
        "IP_BLACKLIST_REMOVED",
        ip,
        {},
      );

      return true;
    } catch (error) {
      console.error("Error removing from blacklist:", error);
      return false;
    }
  }

  // Get whitelist
  async getWhitelist() {
    try {
      return await dbAll(`
        SELECT w.*, u.username as created_by_username 
        FROM ip_whitelist w
        LEFT JOIN users u ON w.created_by = u.id
        ORDER BY w.created_at DESC
      `);
    } catch (error) {
      console.error("Error getting whitelist:", error);
      return [];
    }
  }

  // Get blacklist
  async getBlacklist() {
    try {
      return await dbAll(`
        SELECT b.*, u.username as created_by_username 
        FROM ip_blacklist b
        LEFT JOIN users u ON b.created_by = u.id
        ORDER BY b.created_at DESC
      `);
    } catch (error) {
      console.error("Error getting blacklist:", error);
      return [];
    }
  }

  // Get login attempts for an IP
  async getLoginAttempts(ip, hours = 24) {
    try {
      return await dbAll(
        `SELECT * FROM ip_login_attempts 
         WHERE ip_address = ? 
         AND attempt_time > datetime('now', ? || ' hours')
         ORDER BY attempt_time DESC`,
        [ip, `-${hours}`],
      );
    } catch (error) {
      console.error("Error getting login attempts:", error);
      return [];
    }
  }

  // Get IP statistics
  async getIPStats(ip) {
    try {
      const [totalAttempts, failedAttempts, successAttempts, lastAttempt] =
        await Promise.all([
          dbGet(
            "SELECT COUNT(*) as count FROM ip_login_attempts WHERE ip_address = ?",
            [ip],
          ),
          dbGet(
            "SELECT COUNT(*) as count FROM ip_login_attempts WHERE ip_address = ? AND success = 0",
            [ip],
          ),
          dbGet(
            "SELECT COUNT(*) as count FROM ip_login_attempts WHERE ip_address = ? AND success = 1",
            [ip],
          ),
          dbGet(
            "SELECT attempt_time, success FROM ip_login_attempts WHERE ip_address = ? ORDER BY attempt_time DESC LIMIT 1",
            [ip],
          ),
        ]);

      const isWhitelisted = await this.isWhitelisted(ip);
      const isBlacklisted = await this.isBlacklisted(ip);

      return {
        ip,
        totalAttempts: totalAttempts?.count || 0,
        failedAttempts: failedAttempts?.count || 0,
        successAttempts: successAttempts?.count || 0,
        successRate: totalAttempts?.count
          ? ((successAttempts?.count / totalAttempts.count) * 100).toFixed(1)
          : 0,
        lastAttempt: lastAttempt || null,
        isWhitelisted,
        isBlacklisted,
      };
    } catch (error) {
      console.error("Error getting IP stats:", error);
      return null;
    }
  }
}

// Create IP control service instance
const ipControlService = new IPControlService();

// ========== IP CONTROL MIDDLEWARE ========== //
const ipControlMiddleware = async (req, res, next) => {
  const ip = ipControlService.getClientIP(req);

  // Skip IP check for health endpoint
  if (req.path === "/health") {
    return next();
  }

  // Add IP and blacklist status to request object
  req.clientIP = ip;
  const isBlacklisted = await ipControlService.isBlacklisted(ip);
  req.isBlacklisted = isBlacklisted;

  if (isBlacklisted) {
    await blockchainService.addBlock("system", "BLACKLISTED_IP_ATTEMPT", ip, {
      path: req.path,
      method: req.method,
    });

    // Let them hit the login endpoint so they can attempt an admin override
    if (req.path === "/api/auth/login") {
      return next();
    }

    // Zero-Trust Admin Override: If they possess a valid ADMIN token, they bypass the blackout
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role === "ADMIN") {
          return next();
        }
      } catch (err) {
        // Token invalid or expired, continue to block
      }
    }

    return res.status(403).json({
      success: false,
      error: "Access denied. Your IP has been blocked.",
    });
  }

  next();
};

// Apply IP control middleware globally (after CORS but before routes)
app.use(ipControlMiddleware);

// ========== DATABASE INITIALIZATION ========== //
async function initDatabase() {
  try {
    console.log("🔄 Initializing database...");

    // Create roles table if not exists
    await dbRun(`
      CREATE TABLE IF NOT EXISTS roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        is_system INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create permissions table if not exists
    await dbRun(`
      CREATE TABLE IF NOT EXISTS permissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        resource TEXT NOT NULL,
        action TEXT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create role_permissions junction table if not exists
    await dbRun(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        role_id INTEGER,
        permission_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (role_id, permission_id),
        FOREIGN KEY(role_id) REFERENCES roles(id) ON DELETE CASCADE,
        FOREIGN KEY(permission_id) REFERENCES permissions(id) ON DELETE CASCADE
      )
    `);

    // Create users table if not exists
    await dbRun(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        email TEXT,
        full_name TEXT,
        role_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(role_id) REFERENCES roles(id)
      )
    `);

    // Create resources table if not exists
    await dbRun(`
      CREATE TABLE IF NOT EXISTS resources (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        access_level TEXT DEFAULT 'RESTRICTED',
        user_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);

    // Create sessions table if not exists
    await dbRun(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        action TEXT NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);

    // Create IP Control Tables if not exists
    await dbRun(`
      CREATE TABLE IF NOT EXISTS ip_whitelist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ip_address TEXT NOT NULL UNIQUE,
        description TEXT,
        created_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await dbRun(`
      CREATE TABLE IF NOT EXISTS ip_blacklist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ip_address TEXT NOT NULL UNIQUE,
        reason TEXT,
        created_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await dbRun(`
      CREATE TABLE IF NOT EXISTS ip_login_attempts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ip_address TEXT NOT NULL,
        username TEXT,
        success BOOLEAN DEFAULT 0,
        user_agent TEXT,
        attempt_time DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create blockchain blocks table IF IT DOESN'T EXIST
    await dbRun(`
      CREATE TABLE IF NOT EXISTS blockchain_blocks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        block_index INTEGER NOT NULL UNIQUE,
        block_hash TEXT NOT NULL UNIQUE,
        previous_hash TEXT NOT NULL,
        action TEXT NOT NULL,
        user_id TEXT NOT NULL,
        ip_address TEXT,
        details TEXT,
        timestamp DATETIME,
        nonce INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert default permissions if they don't exist
    const defaultPermissions = [
      // User management permissions
      ["user.create", "users", "create", "Create new users"],
      ["user.read", "users", "read", "View users"],
      ["user.update", "users", "update", "Update users"],
      ["user.delete", "users", "delete", "Delete users"],
      ["user.assign_role", "users", "assign_role", "Assign roles to users"],
      ["user.read_all", "users", "read_all", "View all users data"],

      // Role management permissions
      ["role.create", "roles", "create", "Create new roles"],
      ["role.read", "roles", "read", "View roles"],
      ["role.update", "roles", "update", "Update roles"],
      ["role.delete", "roles", "delete", "Delete roles"],
      [
        "role.assign_permission",
        "roles",
        "assign_permission",
        "Assign permissions to roles",
      ],

      // Resource management permissions
      ["resource.create", "resources", "create", "Create resources"],
      ["resource.read", "resources", "read", "View resources"],
      ["resource.read_all", "resources", "read_all", "View all resources"],
      ["resource.update", "resources", "update", "Update resources"],
      ["resource.delete", "resources", "delete", "Delete resources"],
      ["resource.publish", "resources", "publish", "Publish resources"],

      // Dashboard permissions
      ["dashboard.view", "dashboard", "view", "View dashboard"],
      ["dashboard.stats", "dashboard", "stats", "View statistics"],

      // Blockchain permissions
      ["blockchain.view", "blockchain", "view", "View blockchain"],
      ["blockchain.verify", "blockchain", "verify", "Verify blockchain"],
      ["blockchain.export", "blockchain", "export", "Export blockchain data"],

      // System permissions
      ["system.config", "system", "config", "Configure system"],
      ["system.audit", "system", "audit", "View audit logs"],

      // IP Control permissions
      ["ip.whitelist", "ip", "whitelist", "Manage IP whitelist"],
      ["ip.blacklist", "ip", "blacklist", "Manage IP blacklist"],
      ["ip.audit", "ip", "audit", "View IP audit logs"],
    ];

    for (const [name, resource, action, description] of defaultPermissions) {
      await dbRun(
        `INSERT OR IGNORE INTO permissions (name, resource, action, description) VALUES (?, ?, ?, ?)`,
        [name, resource, action, description],
      );
    }
    console.log(`✅ Created ${defaultPermissions.length} default permissions`);

    // Insert default roles if they don't exist
    const defaultRoles = [
      { name: "ADMIN", description: "Full system access", is_system: 1 },
      {
        name: "USER",
        description: "Regular user with limited access",
        is_system: 1,
      },
      { name: "GUEST", description: "Read-only guest access", is_system: 1 },
    ];

    for (const role of defaultRoles) {
      await dbRun(
        `INSERT OR IGNORE INTO roles (name, description, is_system) VALUES (?, ?, ?)`,
        [role.name, role.description, role.is_system],
      );
    }
    console.log(`✅ Created ${defaultRoles.length} default roles`);

    // Get all permissions and role IDs
    const allPermissions = await dbAll(`SELECT id, name FROM permissions`);
    const adminRole = await dbGet(`SELECT id FROM roles WHERE name = 'ADMIN'`);
    const userRole = await dbGet(`SELECT id FROM roles WHERE name = 'USER'`);
    const guestRole = await dbGet(`SELECT id FROM roles WHERE name = 'GUEST'`);

    // ADMIN gets all permissions
    if (adminRole) {
      for (const perm of allPermissions) {
        await dbRun(
          `INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)`,
          [adminRole.id, perm.id],
        );
      }
    }

    // USER gets specific permissions
    if (userRole) {
      // Clear old permissions
      await dbRun(`DELETE FROM role_permissions WHERE role_id = ?`, [userRole.id]);

      const userPermissions = [
        "user.read",
        "resource.create",
        "resource.read",
        "resource.update",
        "dashboard.view",
        "blockchain.view",
      ];

      for (const permName of userPermissions) {
        const perm = allPermissions.find((p) => p.name === permName);
        if (perm) {
          await dbRun(
            `INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)`,
            [userRole.id, perm.id],
          );
        }
      }
    }

    // GUEST gets read-only permissions
    if (guestRole) {
      // Clear old permissions
      await dbRun(`DELETE FROM role_permissions WHERE role_id = ?`, [guestRole.id]);

      const guestPermissions = [
        "resource.read",
        "dashboard.view",
      ];

      for (const permName of guestPermissions) {
        const perm = allPermissions.find((p) => p.name === permName);
        if (perm) {
          await dbRun(
            `INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)`,
            [guestRole.id, perm.id],
          );
        }
      }
    }

    console.log(`✅ Assigned permissions to default roles`);

    // Create default users if they don't exist
    const defaultUsers = [
      {
        username: "admin",
        password: "Admin@123",
        role_name: "ADMIN",
        email: "admin@rbac.com",
        full_name: "System Administrator",
      },
      {
        username: "user",
        password: "User@123",
        role_name: "USER",
        email: "user@rbac.com",
        full_name: "Regular User",
      },
      {
        username: "guest",
        password: "Guest@123",
        role_name: "GUEST",
        email: "guest@rbac.com",
        full_name: "Guest Viewer",
      },
    ];

    for (const user of defaultUsers) {
      try {
        const userExists = await dbGet(
          "SELECT * FROM users WHERE username = ?",
          [user.username],
        );
        const role = await dbGet("SELECT id FROM roles WHERE name = ?", [
          user.role_name,
        ]);

        if (!userExists && role) {
          const passwordHash = await bcrypt.hash(user.password, 10);
          await dbRun(
            "INSERT INTO users (username, password_hash, role_id, email, full_name) VALUES (?, ?, ?, ?, ?)",
            [user.username, passwordHash, role.id, user.email, user.full_name],
          );
          console.log(
            `✅ Created ${user.role_name} user: ${user.username} / ${user.password}`,
          );
        } else if (userExists) {
          console.log(
            `👤 User already exists: ${user.username} (${user.role_name})`,
          );
        }
      } catch (error) {
        console.error(
          `❌ Error creating user ${user.username}:`,
          error.message,
        );
      }
    }

    // Verify database state
    const roleCount = await dbGet("SELECT COUNT(*) as count FROM roles");
    const permCount = await dbGet("SELECT COUNT(*) as count FROM permissions");
    const userCount = await dbGet("SELECT COUNT(*) as count FROM users");
    const whitelistCount = await dbGet(
      "SELECT COUNT(*) as count FROM ip_whitelist",
    );
    const blacklistCount = await dbGet(
      "SELECT COUNT(*) as count FROM ip_blacklist",
    );

    console.log(`📊 Database Stats:`);
    console.log(`   - Roles: ${roleCount.count}`);
    console.log(`   - Permissions: ${permCount.count}`);
    console.log(`   - Users: ${userCount.count}`);
    console.log(`   - Whitelist: ${whitelistCount.count}`);
    console.log(`   - Blacklist: ${blacklistCount.count}`);

    console.log("✅ Database initialized successfully");

    // Initialize blockchain
    await blockchainService.initialize();
  } catch (error) {
    console.error("❌ Database initialization error:", error);
    throw error;
  }
}

// ========== AUTHENTICATION MIDDLEWARE ========== //
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      await blockchainService.addBlock("unknown", "AUTH_FAILED", req.clientIP, {
        endpoint: req.path,
        reason: "No token provided",
      });
      return res
        .status(401)
        .json({ success: false, error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await dbGet(
      `SELECT u.*, r.name as role_name, r.id as role_id 
       FROM users u 
       LEFT JOIN roles r ON u.role_id = r.id 
       WHERE u.id = ?`,
      [decoded.id],
    );

    if (!user) {
      await blockchainService.addBlock(
        decoded.id?.toString() || "unknown",
        "AUTH_FAILED",
        req.clientIP,
        { endpoint: req.path, reason: "User not found" },
      );
      return res.status(401).json({ success: false, error: "User not found" });
    }

    req.user = {
      id: user.id,
      username: user.username,
      role: user.role_name || "USER",
      roleId: user.role_id,
      email: user.email,
      fullName: user.full_name,
    };

    await blockchainService.addBlock(
      user.id.toString(),
      "AUTHENTICATE",
      req.clientIP,
      { endpoint: req.path, method: req.method },
    );

    next();
  } catch (error) {
    console.error("❌ Auth error:", error.message);
    await blockchainService.addBlock("unknown", "AUTH_FAILED", req.clientIP, {
      error: error.message,
      endpoint: req.path,
    });
    return res.status(401).json({ success: false, error: "Invalid token" });
  }
};

// ========== AUTHORIZATION MIDDLEWARE ========== //
const authorize = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res
          .status(401)
          .json({ success: false, error: "Not authenticated" });
      }

      // Check if user has the required permission
      const hasPermission = await dbGet(
        `SELECT 1 FROM role_permissions rp
         JOIN permissions p ON rp.permission_id = p.id
         WHERE rp.role_id = ? AND p.name = ?`,
        [req.user.roleId, requiredPermission],
      );

      if (!hasPermission) {
        await blockchainService.addBlock(
          req.user.id.toString(),
          "UNAUTHORIZED_ACCESS",
          req.clientIP,
          {
            endpoint: req.path,
            requiredPermission,
            userRole: req.user.role,
          },
        );
        return res.status(403).json({
          success: false,
          error: "Insufficient permissions",
          required: requiredPermission,
        });
      }

      next();
    } catch (error) {
      console.error("❌ Authorization error:", error);
      res
        .status(500)
        .json({ success: false, error: "Authorization check failed" });
    }
  };
};

// ========== AUTH ROUTES ========== //
app.post("/api/auth/login", async (req, res) => {
  try {
    let { username, password } = req.body;
    const ip = req.clientIP;
    const userAgent = req.headers["user-agent"];

    username = username?.trim();
    password = password?.trim();

    if (!username || !password) {
      await ipControlService.logLoginAttempt(ip, username, false, userAgent);
      return res.status(400).json({
        success: false,
        error: "Username and password required",
      });
    }

    const user = await dbGet(
      `SELECT u.*, r.name as role_name, r.id as role_id 
       FROM users u 
       LEFT JOIN roles r ON u.role_id = r.id 
       WHERE u.username = ?`,
      [username],
    );

    if (!user) {
      await ipControlService.logLoginAttempt(ip, username, false, userAgent);
      await blockchainService.addBlock("unknown", "LOGIN_FAILED", ip, {
        username,
        reason: "User not found",
      });

      // Instant zero-trust auto-block for totally unknown usernames
      await ipControlService.addToBlacklist(
        ip,
        `Zero-trust Auto-block: Attempted login with unrecognized username '${username}'`,
        "system"
      );
      await blockchainService.addBlock("system", "IP_AUTO_BLOCKED", ip, {
        reason: "Unknown username attempt",
        username,
      });

      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      await ipControlService.logLoginAttempt(ip, username, false, userAgent);
      await blockchainService.addBlock(user.id.toString(), "LOGIN_FAILED", ip, {
        username,
        reason: "Invalid password",
      });

      // Instant zero-trust auto-block for valid usernames but wrong passwords
      await ipControlService.addToBlacklist(
        ip,
        `Zero-trust Auto-block: Invalid password attempt for user '${username}'`,
        "system"
      );
      await blockchainService.addBlock("system", "IP_AUTO_BLOCKED", ip, {
        reason: "Invalid password attempt",
        username,
      });

      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });
    }

    // If they were blacklisted but provided a non-admin valid login, REJECT them!
    // Only Admin can punch through a blacklisted IP
    if (req.isBlacklisted && user.role_name !== "ADMIN") {
      return res.status(403).json({
        success: false,
        error: "Access denied. Your IP has been blocked."
      });
    }

    // Successful login (leave the Blacklist alone so it shows in the Demo Dashboard!)
    await ipControlService.logLoginAttempt(ip, username, true, userAgent);

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role_name || "USER",
      },
      JWT_SECRET,
      { expiresIn: "30d" },
    );

    await blockchainService.addBlock(user.id.toString(), "LOGIN_SUCCESS", ip, {
      username,
      role: user.role_name,
    });

    await dbRun(
      "INSERT INTO sessions (user_id, action, ip_address, user_agent) VALUES (?, ?, ?, ?)",
      [user.id, "LOGIN", ip, userAgent],
    );

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role_name || "USER",
        roleId: user.role_id,
        email: user.email,
        fullName: user.full_name,
        createdAt: user.created_at,
      },
      ipInfo: {
        ip,
        message: "Login from this IP has been recorded",
      },
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    await blockchainService.addBlock("unknown", "LOGIN_FAILED", req.clientIP, {
      error: error.message,
    });
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Token validation endpoint (for frontend)
app.get("/api/auth/validate", authenticate, async (req, res) => {
  try {
    // Get user's permissions
    const permissions = await dbAll(
      `
      SELECT p.name 
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = ?
    `,
      [req.user.roleId],
    );

    await blockchainService.addBlock(
      req.user.id.toString(),
      "TOKEN_VALIDATED",
      req.clientIP,
      { userId: req.user.id, username: req.user.username },
    );

    res.json({
      success: true,
      user: {
        ...req.user,
        permissions: permissions.map((p) => p.name),
      },
    });
  } catch (error) {
    console.error("Token validation error:", error);
    res.status(500).json({ success: false, error: "Token validation failed" });
  }
});

// ========== IP CONTROL API ROUTES ========== //

// Get current IP info
app.get("/api/ip/my-info", authenticate, async (req, res) => {
  try {
    const ip = req.clientIP;
    const stats = await ipControlService.getIPStats(ip);
    const attempts = await ipControlService.getLoginAttempts(ip, 24);

    res.json({
      success: true,
      data: {
        ip,
        ...stats,
        recentAttempts: attempts.slice(0, 10),
      },
    });
  } catch (error) {
    console.error("Error getting IP info:", error);
    res.status(500).json({ success: false, error: "Failed to get IP info" });
  }
});

// Get whitelist (admin only)
app.get(
  "/api/ip/whitelist",
  authenticate,
  authorize("ip.whitelist"),
  async (req, res) => {
    try {
      const whitelist = await ipControlService.getWhitelist();
      res.json({ success: true, data: whitelist });
    } catch (error) {
      console.error("Error getting whitelist:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to get whitelist" });
    }
  },
);

// Add to whitelist (admin only)
app.post(
  "/api/ip/whitelist",
  authenticate,
  authorize("ip.whitelist"),
  async (req, res) => {
    try {
      const { ip, description } = req.body;

      if (!ip) {
        return res
          .status(400)
          .json({ success: false, error: "IP address required" });
      }

      const success = await ipControlService.addToWhitelist(
        ip,
        description,
        req.user.id.toString(),
      );

      if (success) {
        res.json({ success: true, message: "IP added to whitelist" });
      } else {
        res
          .status(500)
          .json({ success: false, error: "Failed to add IP to whitelist" });
      }
    } catch (error) {
      console.error("Error adding to whitelist:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to add to whitelist" });
    }
  },
);

// Remove from whitelist (admin only)
app.delete(
  "/api/ip/whitelist/:ip",
  authenticate,
  authorize("ip.whitelist"),
  async (req, res) => {
    try {
      const { ip } = req.params;
      await dbRun("DELETE FROM ip_whitelist WHERE ip_address = ?", [ip]);

      await blockchainService.addBlock(
        req.user.id.toString(),
        "IP_WHITELIST_REMOVED",
        ip,
        {},
      );

      res.json({ success: true, message: "IP removed from whitelist" });
    } catch (error) {
      console.error("Error removing from whitelist:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to remove from whitelist" });
    }
  },
);

// Get blacklist (admin only)
app.get(
  "/api/ip/blacklist",
  authenticate,
  authorize("ip.blacklist"),
  async (req, res) => {
    try {
      const blacklist = await ipControlService.getBlacklist();
      res.json({ success: true, data: blacklist });
    } catch (error) {
      console.error("Error getting blacklist:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to get blacklist" });
    }
  },
);

// Add to blacklist (admin only)
app.post(
  "/api/ip/blacklist",
  authenticate,
  authorize("ip.blacklist"),
  async (req, res) => {
    try {
      const { ip, reason } = req.body;

      if (!ip) {
        return res
          .status(400)
          .json({ success: false, error: "IP address required" });
      }

      const success = await ipControlService.addToBlacklist(
        ip,
        reason,
        req.user.id.toString(),
      );

      if (success) {
        res.json({ success: true, message: "IP added to blacklist" });
      } else {
        res
          .status(500)
          .json({ success: false, error: "Failed to add IP to blacklist" });
      }
    } catch (error) {
      console.error("Error adding to blacklist:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to add to blacklist" });
    }
  },
);

// Remove from blacklist (admin only)
app.delete(
  "/api/ip/blacklist/:ip",
  authenticate,
  authorize("ip.blacklist"),
  async (req, res) => {
    try {
      const { ip } = req.params;
      await ipControlService.removeFromBlacklist(ip, req.user.id.toString());

      res.json({ success: true, message: "IP removed from blacklist" });
    } catch (error) {
      console.error("Error removing from blacklist:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to remove from blacklist" });
    }
  },
);

// Get login attempts for an IP (admin only)
app.get(
  "/api/ip/attempts/:ip",
  authenticate,
  authorize("ip.audit"),
  async (req, res) => {
    try {
      const { ip } = req.params;
      const hours = parseInt(req.query.hours) || 24;
      const attempts = await ipControlService.getLoginAttempts(ip, hours);
      const stats = await ipControlService.getIPStats(ip);

      res.json({
        success: true,
        data: {
          attempts,
          stats,
          total: attempts.length,
        },
      });
    } catch (error) {
      console.error("Error getting login attempts:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to get login attempts" });
    }
  },
);

// Get all IP statistics (admin only)
app.get(
  "/api/ip/stats",
  authenticate,
  authorize("ip.audit"),
  async (req, res) => {
    try {
      const [topFailedIPs, recentActivity] = await Promise.all([
        dbAll(`
        SELECT ip_address, COUNT(*) as attempt_count, 
               SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed_count
        FROM ip_login_attempts 
        WHERE attempt_time > datetime('now', '-7 days')
        GROUP BY ip_address
        HAVING failed_count > 0
        ORDER BY failed_count DESC
        LIMIT 20
      `),
        dbAll(`
        SELECT * FROM ip_login_attempts 
        WHERE attempt_time > datetime('now', '-1 hour')
        ORDER BY attempt_time DESC
        LIMIT 50
      `),
      ]);

      const whitelistCount = await dbGet(
        "SELECT COUNT(*) as count FROM ip_whitelist",
      );
      const blacklistCount = await dbGet(
        "SELECT COUNT(*) as count FROM ip_blacklist",
      );
      const totalAttemptsToday = await dbGet(`
      SELECT COUNT(*) as count FROM ip_login_attempts 
      WHERE attempt_time > datetime('now', '-1 day')
    `);

      res.json({
        success: true,
        data: {
          topFailedIPs,
          recentActivity,
          whitelistCount: whitelistCount.count,
          blacklistCount: blacklistCount.count,
          totalAttemptsToday: totalAttemptsToday.count,
        },
      });
    } catch (error) {
      console.error("Error getting IP stats:", error);
      res.status(500).json({ success: false, error: "Failed to get IP stats" });
    }
  },
);

// ========== ROLES ROUTES ========== //
// Get all roles
app.get(
  "/api/roles",
  authenticate,
  authorize("role.read"),
  async (req, res) => {
    try {
      const roles = await dbAll(`
      SELECT r.*, 
             COUNT(DISTINCT u.id) as user_count,
             COUNT(DISTINCT rp.permission_id) as permission_count
      FROM roles r
      LEFT JOIN users u ON r.id = u.role_id
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      GROUP BY r.id
      ORDER BY r.created_at DESC
    `);

      res.json({
        success: true,
        data: roles,
        count: roles.length,
      });
    } catch (error) {
      console.error("Get roles error:", error);
      res.status(500).json({ success: false, error: "Failed to fetch roles" });
    }
  },
);

// Get single role with permissions
app.get(
  "/api/roles/:id",
  authenticate,
  authorize("role.read"),
  async (req, res) => {
    try {
      const role = await dbGet(
        `SELECT r.*, 
              COUNT(DISTINCT u.id) as user_count
       FROM roles r
       LEFT JOIN users u ON r.id = u.role_id
       WHERE r.id = ?
       GROUP BY r.id`,
        [req.params.id],
      );

      if (!role) {
        return res
          .status(404)
          .json({ success: false, error: "Role not found" });
      }

      // Get role permissions
      const permissions = await dbAll(
        `
      SELECT p.* 
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = ?
      ORDER BY p.resource, p.action
    `,
        [req.params.id],
      );

      res.json({
        success: true,
        data: {
          ...role,
          permissions,
        },
      });
    } catch (error) {
      console.error("Get role error:", error);
      res.status(500).json({ success: false, error: "Failed to fetch role" });
    }
  },
);

// Create new role
app.post(
  "/api/roles",
  authenticate,
  authorize("role.create"),
  async (req, res) => {
    try {
      const { name, description } = req.body;

      if (!name || !name.trim()) {
        return res
          .status(400)
          .json({ success: false, error: "Role name is required" });
      }

      // Check if role already exists
      const existingRole = await dbGet("SELECT id FROM roles WHERE name = ?", [
        name.trim(),
      ]);
      if (existingRole) {
        return res
          .status(400)
          .json({ success: false, error: "Role already exists" });
      }

      const result = await dbRun(
        "INSERT INTO roles (name, description, is_system) VALUES (?, ?, 0)",
        [name.trim(), description?.trim() || null],
      );

      const newRole = await dbGet("SELECT * FROM roles WHERE id = ?", [
        result.lastID,
      ]);

      // Log to blockchain
      await blockchainService.addBlock(
        req.user.id.toString(),
        "ROLE_CREATED",
        req.clientIP,
        { roleId: result.lastID, roleName: name.trim() },
      );

      res.status(201).json({
        success: true,
        message: "Role created successfully",
        data: newRole,
      });
    } catch (error) {
      console.error("Create role error:", error);
      res.status(500).json({ success: false, error: "Failed to create role" });
    }
  },
);

// Update role
app.put(
  "/api/roles/:id",
  authenticate,
  authorize("role.update"),
  async (req, res) => {
    try {
      const { name, description } = req.body;
      const roleId = req.params.id;

      // Check if role exists and is not system role
      const role = await dbGet("SELECT * FROM roles WHERE id = ?", [roleId]);
      if (!role) {
        return res
          .status(404)
          .json({ success: false, error: "Role not found" });
      }

      if (role.is_system) {
        return res
          .status(403)
          .json({ success: false, error: "Cannot modify system roles" });
      }

      // Check if new name conflicts with existing role
      if (name && name !== role.name) {
        const existingRole = await dbGet(
          "SELECT id FROM roles WHERE name = ? AND id != ?",
          [name, roleId],
        );
        if (existingRole) {
          return res
            .status(400)
            .json({ success: false, error: "Role name already exists" });
        }
      }

      await dbRun(
        "UPDATE roles SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [name || role.name, description || role.description, roleId],
      );

      const updatedRole = await dbGet("SELECT * FROM roles WHERE id = ?", [
        roleId,
      ]);

      // Log to blockchain
      await blockchainService.addBlock(
        req.user.id.toString(),
        "ROLE_UPDATED",
        req.clientIP,
        { roleId, roleName: updatedRole.name },
      );

      res.json({
        success: true,
        message: "Role updated successfully",
        data: updatedRole,
      });
    } catch (error) {
      console.error("Update role error:", error);
      res.status(500).json({ success: false, error: "Failed to update role" });
    }
  },
);

// Delete role
app.delete(
  "/api/roles/:id",
  authenticate,
  authorize("role.delete"),
  async (req, res) => {
    try {
      const roleId = req.params.id;

      // Check if role exists and is not system role
      const role = await dbGet("SELECT * FROM roles WHERE id = ?", [roleId]);
      if (!role) {
        return res
          .status(404)
          .json({ success: false, error: "Role not found" });
      }

      if (role.is_system) {
        return res
          .status(403)
          .json({ success: false, error: "Cannot delete system roles" });
      }

      // Check if role has users assigned
      const userCount = await dbGet(
        "SELECT COUNT(*) as count FROM users WHERE role_id = ?",
        [roleId],
      );
      if (userCount.count > 0) {
        return res.status(400).json({
          success: false,
          error:
            "Cannot delete role with assigned users. Reassign users first.",
        });
      }

      await dbRun("DELETE FROM roles WHERE id = ?", [roleId]);

      // Log to blockchain
      await blockchainService.addBlock(
        req.user.id.toString(),
        "ROLE_DELETED",
        req.clientIP,
        { roleId, roleName: role.name },
      );

      res.json({
        success: true,
        message: "Role deleted successfully",
      });
    } catch (error) {
      console.error("Delete role error:", error);
      res.status(500).json({ success: false, error: "Failed to delete role" });
    }
  },
);

// ========== PERMISSIONS ROUTES ========== //
// Get all permissions
app.get("/api/permissions", authenticate, async (req, res) => {
  try {
    const permissions = await dbAll(`
      SELECT * FROM permissions 
      ORDER BY resource, action
    `);

    // Group by resource for easier frontend consumption
    const grouped = permissions.reduce((acc, perm) => {
      if (!acc[perm.resource]) {
        acc[perm.resource] = [];
      }
      acc[perm.resource].push(perm);
      return acc;
    }, {});

    res.json({
      success: true,
      data: permissions,
      grouped,
      count: permissions.length,
    });
  } catch (error) {
    console.error("Get permissions error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch permissions" });
  }
});

// Assign permissions to role
app.post(
  "/api/roles/:roleId/permissions",
  authenticate,
  authorize("role.assign_permission"),
  async (req, res) => {
    try {
      const { roleId } = req.params;
      const { permissionIds } = req.body;

      if (!Array.isArray(permissionIds)) {
        return res
          .status(400)
          .json({ success: false, error: "permissionIds must be an array" });
      }

      // Check if role exists
      const role = await dbGet("SELECT * FROM roles WHERE id = ?", [roleId]);
      if (!role) {
        return res
          .status(404)
          .json({ success: false, error: "Role not found" });
      }

      // Start transaction
      await dbRun("BEGIN TRANSACTION");

      try {
        // Remove all existing permissions
        await dbRun("DELETE FROM role_permissions WHERE role_id = ?", [roleId]);

        // Add new permissions
        for (const permissionId of permissionIds) {
          await dbRun(
            "INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)",
            [roleId, permissionId],
          );
        }

        await dbRun("COMMIT");

        // Get updated permissions
        const permissions = await dbAll(
          `
        SELECT p.* 
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        WHERE rp.role_id = ?
        ORDER BY p.resource, p.action
      `,
          [roleId],
        );

        // Log to blockchain
        await blockchainService.addBlock(
          req.user.id.toString(),
          "PERMISSION_ASSIGNED",
          req.clientIP,
          {
            roleId,
            roleName: role.name,
            permissionCount: permissionIds.length,
          },
        );

        res.json({
          success: true,
          message: "Permissions assigned successfully",
          data: permissions,
        });
      } catch (error) {
        await dbRun("ROLLBACK");
        throw error;
      }
    } catch (error) {
      console.error("Assign permissions error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to assign permissions" });
    }
  },
);

// ========== USER MANAGEMENT ROUTES ========== //
// Get all users
app.get(
  "/api/users",
  authenticate,
  authorize("user.read"),
  async (req, res) => {
    try {
      const users = await dbAll(`
      SELECT u.id, u.username, u.email, u.full_name, u.created_at,
             r.id as role_id, r.name as role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      ORDER BY u.created_at DESC
    `);

      res.json({
        success: true,
        data: users,
        count: users.length,
      });
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ success: false, error: "Failed to fetch users" });
    }
  },
);

// Get current user
app.get("/api/users/me", authenticate, async (req, res) => {
  try {
    // Get user's permissions
    const permissions = await dbAll(
      `
      SELECT p.name 
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = ?
    `,
      [req.user.roleId],
    );

    res.json({
      success: true,
      data: {
        ...req.user,
        permissions: permissions.map((p) => p.name),
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Update user role
app.put(
  "/api/users/:userId/role",
  authenticate,
  authorize("user.assign_role"),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { roleId } = req.body;

      // Check if user exists
      const user = await dbGet("SELECT * FROM users WHERE id = ?", [userId]);
      if (!user) {
        return res
          .status(404)
          .json({ success: false, error: "User not found" });
      }

      // Check if role exists
      const role = await dbGet("SELECT * FROM roles WHERE id = ?", [roleId]);
      if (!role) {
        return res
          .status(404)
          .json({ success: false, error: "Role not found" });
      }

      await dbRun(
        "UPDATE users SET role_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [roleId, userId],
      );

      // Log to blockchain
      await blockchainService.addBlock(
        req.user.id.toString(),
        "USER_ROLE_CHANGED",
        req.clientIP,
        {
          userId,
          username: user.username,
          newRole: role.name,
          oldRole: user.role_id,
        },
      );

      res.json({
        success: true,
        message: "User role updated successfully",
      });
    } catch (error) {
      console.error("Update user role error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to update user role" });
    }
  },
);

// Debug endpoint to check users
app.get("/debug/users", async (req, res) => {
  try {
    const users = await dbAll(`
      SELECT u.id, u.username, u.email, u.full_name, u.created_at, u.role_id,
             r.name as role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
    `);

    const roles = await dbAll("SELECT * FROM roles");
    const permissions = await dbAll("SELECT * FROM permissions");

    res.json({
      success: true,
      data: {
        users,
        roles,
        permissions,
        counts: {
          users: users.length,
          roles: roles.length,
          permissions: permissions.length,
        },
      },
    });
  } catch (error) {
    console.error("Debug error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== RESOURCE ROUTES ========== //
app.get("/api/resources", authenticate, async (req, res) => {
  try {
    let query =
      "SELECT r.*, u.username as owner FROM resources r LEFT JOIN users u ON r.user_id = u.id";
    let params = [];

    // Check user's permissions
    const canViewAll = await dbGet(
      `SELECT 1 FROM role_permissions rp
       JOIN permissions p ON rp.permission_id = p.id
       WHERE rp.role_id = ? AND p.name = 'resource.read_all'`,
      [req.user.roleId],
    );

    if (!canViewAll) {
      if (req.user.role === "GUEST") {
        query += " WHERE r.access_level = 'PUBLIC'";
      } else if (req.user.role === "USER") {
        query += " WHERE r.access_level = 'PUBLIC' OR r.user_id = ?";
        params.push(req.user.id);
      }
    }

    query += " ORDER BY r.created_at DESC";
    const resources = await dbAll(query, params);

    await blockchainService.addBlock(
      req.user.id.toString(),
      "RESOURCE_VIEW",
      req.clientIP,
      { count: resources.length, role: req.user.role },
    );

    res.json({
      success: true,
      data: resources,
      count: resources.length,
    });
  } catch (error) {
    console.error("Get resources error:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

app.post("/api/resources", authenticate, async (req, res) => {
  try {
    // Check if user has permission to create resources
    const canCreate = await dbGet(
      `SELECT 1 FROM role_permissions rp
       JOIN permissions p ON rp.permission_id = p.id
       WHERE rp.role_id = ? AND p.name = 'resource.create'`,
      [req.user.roleId],
    );

    if (!canCreate) {
      return res.status(403).json({
        success: false,
        error: "Insufficient permissions to create resources",
      });
    }

    const { title, description, access_level = "RESTRICTED" } = req.body;
    if (!title || !title.trim()) {
      return res
        .status(400)
        .json({ success: false, error: "Title is required" });
    }

    const result = await dbRun(
      "INSERT INTO resources (title, description, access_level, user_id) VALUES (?, ?, ?, ?)",
      [
        title.trim(),
        description?.trim(),
        access_level.toUpperCase(),
        req.user.id,
      ],
    );

    await blockchainService.addBlock(
      req.user.id.toString(),
      "CREATE_RESOURCE",
      req.clientIP,
      {
        resourceId: result.lastID,
        title: title.trim(),
        accessLevel: access_level.toUpperCase(),
      },
    );

    await dbRun(
      "INSERT INTO sessions (user_id, action, ip_address, user_agent) VALUES (?, ?, ?, ?)",
      [req.user.id, "RESOURCE_CREATE", req.clientIP, req.headers["user-agent"]],
    );

    const resource = await dbGet(
      "SELECT r.*, u.username as owner FROM resources r LEFT JOIN users u ON r.user_id = u.id WHERE r.id = ?",
      [result.lastID],
    );

    res.status(201).json({
      success: true,
      message: "Resource created successfully",
      data: resource,
    });
  } catch (error) {
    console.error("Create resource error:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// ========== UPDATE RESOURCE ENDPOINT ========== //
app.put("/api/resources/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, access_level } = req.body;

    // Check if resource exists
    const resource = await dbGet("SELECT * FROM resources WHERE id = ?", [id]);

    if (!resource) {
      return res.status(404).json({
        success: false,
        error: "Resource not found",
      });
    }

    // Check permissions:
    // - ADMIN can update any resource
    // - USER can only update their own resources
    // - GUEST cannot update any resources
    if (req.user.role !== "ADMIN" && resource.user_id !== req.user.id) {
      await blockchainService.addBlock(
        req.user.id.toString(),
        "UNAUTHORIZED_ACCESS",
        req.clientIP,
        {
          endpoint: `/api/resources/${id}`,
          method: "PUT",
          reason: "Attempted to update someone else's resource",
          resourceId: id,
          resourceOwner: resource.user_id,
        },
      );

      return res.status(403).json({
        success: false,
        error: "You don't have permission to update this resource",
      });
    }

    // Validate title if provided
    if (title !== undefined && !title.trim()) {
      return res.status(400).json({
        success: false,
        error: "Title cannot be empty",
      });
    }

    // Build update query dynamically based on provided fields
    const updates = [];
    const values = [];

    if (title !== undefined) {
      updates.push("title = ?");
      values.push(title.trim());
    }

    if (description !== undefined) {
      updates.push("description = ?");
      values.push(description?.trim() || null);
    }

    if (access_level !== undefined) {
      updates.push("access_level = ?");
      values.push(access_level.toUpperCase());
    }

    // Always update the updated_at timestamp
    updates.push("updated_at = CURRENT_TIMESTAMP");

    // Add the resource ID to values array
    values.push(id);

    // Execute update query
    await dbRun(
      `UPDATE resources SET ${updates.join(", ")} WHERE id = ?`,
      values,
    );

    // Log to blockchain
    await blockchainService.addBlock(
      req.user.id.toString(),
      "UPDATE_RESOURCE",
      req.clientIP,
      {
        resourceId: id,
        title: title || resource.title,
        accessLevel: access_level || resource.access_level,
        changes: {
          title: title !== undefined,
          description: description !== undefined,
          access_level: access_level !== undefined,
        },
      },
    );

    // Log to sessions
    await dbRun(
      "INSERT INTO sessions (user_id, action, ip_address, user_agent) VALUES (?, ?, ?, ?)",
      [req.user.id, "RESOURCE_UPDATE", req.clientIP, req.headers["user-agent"]],
    );

    // Fetch updated resource
    const updatedResource = await dbGet(
      "SELECT r.*, u.username as owner FROM resources r LEFT JOIN users u ON r.user_id = u.id WHERE r.id = ?",
      [id],
    );

    res.json({
      success: true,
      message: "Resource updated successfully",
      data: updatedResource,
    });
  } catch (error) {
    console.error("Update resource error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// ========== DELETE RESOURCE ENDPOINT ========== //
app.delete("/api/resources/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if resource exists
    const resource = await dbGet("SELECT * FROM resources WHERE id = ?", [id]);

    if (!resource) {
      return res.status(404).json({
        success: false,
        error: "Resource not found",
      });
    }

    // Check permissions:
    // - ADMIN can delete any resource
    // - USER can only delete their own resources
    // - GUEST cannot delete any resources
    if (req.user.role !== "ADMIN" && resource.user_id !== req.user.id) {
      await blockchainService.addBlock(
        req.user.id.toString(),
        "UNAUTHORIZED_ACCESS",
        req.clientIP,
        {
          endpoint: `/api/resources/${id}`,
          method: "DELETE",
          reason: "Attempted to delete someone else's resource",
          resourceId: id,
          resourceOwner: resource.user_id,
        },
      );

      return res.status(403).json({
        success: false,
        error: "You don't have permission to delete this resource",
      });
    }

    // Delete the resource
    await dbRun("DELETE FROM resources WHERE id = ?", [id]);

    // Log to blockchain
    await blockchainService.addBlock(
      req.user.id.toString(),
      "DELETE_RESOURCE",
      req.clientIP,
      {
        resourceId: id,
        title: resource.title,
        accessLevel: resource.access_level,
      },
    );

    // Log to sessions
    await dbRun(
      "INSERT INTO sessions (user_id, action, ip_address, user_agent) VALUES (?, ?, ?, ?)",
      [req.user.id, "RESOURCE_DELETE", req.clientIP, req.headers["user-agent"]],
    );

    res.json({
      success: true,
      message: "Resource deleted successfully",
    });
  } catch (error) {
    console.error("Delete resource error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// ========== DASHBOARD ROUTES ========== //
app.get("/api/dashboard/stats", authenticate, async (req, res) => {
  try {
    const [
      userCount,
      resourceCount,
      sessionCount,
      myResources,
      roleCount,
      permCount,
    ] = await Promise.all([
      dbGet("SELECT COUNT(*) as count FROM users"),
      dbGet("SELECT COUNT(*) as count FROM resources"),
      dbGet("SELECT COUNT(*) as count FROM sessions WHERE user_id = ?", [
        req.user.id,
      ]),
      dbGet("SELECT COUNT(*) as count FROM resources WHERE user_id = ?", [
        req.user.id,
      ]),
      dbGet("SELECT COUNT(*) as count FROM roles"),
      dbGet("SELECT COUNT(*) as count FROM permissions"),
    ]);

    await blockchainService.addBlock(
      req.user.id.toString(),
      "DASHBOARD_VIEW",
      req.clientIP,
      {
        userRole: req.user.role,
        statsViewed: [
          "users",
          "resources",
          "sessions",
          "myResources",
          "roles",
          "permissions",
        ],
      },
    );

    res.json({
      success: true,
      data: {
        users: userCount.count,
        resources: resourceCount.count,
        mySessions: sessionCount.count,
        myResources: myResources.count,
        roles: roleCount.count,
        permissions: permCount.count,
        blockchain: {
          totalBlocks: blockchainService.getChain().length,
          integrity: blockchainService.verifyChain().valid,
          difficulty: blockchainService.difficulty,
        },
      },
    });
  } catch (error) {
    console.error("Get stats error:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// ========== BLOCKCHAIN ROUTES ========== //
app.get(
  "/api/blockchain/chain",
  authenticate,
  authorize("blockchain.view"),
  async (req, res) => {
    try {
      await blockchainService.initialize();
      const chain = blockchainService.getChain();

      await blockchainService.addBlock(
        req.user.id.toString(),
        "BLOCKCHAIN_VIEW",
        req.clientIP,
        {
          action: "view_chain",
          blocks: chain.length,
        },
      );

      res.json({
        success: true,
        chain,
        length: chain.length,
        difficulty: blockchainService.difficulty,
      });
    } catch (error) {
      console.error("Get chain error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to get blockchain" });
    }
  },
);

app.get(
  "/api/blockchain/recent",
  authenticate,
  authorize("blockchain.view"),
  async (req, res) => {
    try {
      await blockchainService.initialize();
      const limit = parseInt(req.query.limit) || 10;
      const blocks = blockchainService.getRecentBlocks(limit);

      res.json({
        success: true,
        blocks,
        count: blocks.length,
      });
    } catch (error) {
      console.error("Get recent blocks error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to get recent blocks" });
    }
  },
);

app.get(
  "/api/blockchain/verify",
  authenticate,
  authorize("blockchain.verify"),
  async (req, res) => {
    try {
      await blockchainService.initialize();
      const verification = blockchainService.verifyChain();

      await blockchainService.addBlock(
        req.user.id.toString(),
        "BLOCKCHAIN_VERIFY",
        req.clientIP,
        { valid: verification.valid, blocks: verification.blockCount },
      );

      res.json({
        success: true,
        ...verification,
        difficulty: blockchainService.difficulty,
      });
    } catch (error) {
      console.error("Verify chain error:", error);
      res.status(500).json({ success: false, error: "Failed to verify chain" });
    }
  },
);

app.get(
  "/api/blockchain/stats",
  authenticate,
  authorize("blockchain.view"),
  async (req, res) => {
    try {
      await blockchainService.initialize();
      const stats = blockchainService.getStats();

      res.json({
        success: true,
        stats,
      });
    } catch (error) {
      console.error("Get stats error:", error);
      res.status(500).json({ success: false, error: "Failed to get stats" });
    }
  },
);

// Health endpoint
app.get("/health", async (req, res) => {
  try {
    await blockchainService.initialize();
    const verification = blockchainService.verifyChain();

    res.json({
      success: true,
      status: "healthy",
      service: "RBAC Portal with Blockchain Audit",
      timestamp: new Date().toISOString(),
      blockchain: {
        blocks: blockchainService.getChain().length,
        integrity: verification.valid,
        difficulty: blockchainService.difficulty,
      },
    });
  } catch (error) {
    console.error("Health check error:", error);
    res.json({
      success: true,
      status: "healthy",
      service: "RBAC Portal with Blockchain Audit",
      timestamp: new Date().toISOString(),
      blockchain: {
        blocks: 0,
        integrity: false,
        error: "Blockchain initialization failed",
      },
    });
  }
});

// ========== OPTIONS HANDLER ========== //
app.options("*", cors());

// ========== START SERVER ========== //
initDatabase().then(() => {
  app.listen(port, "0.0.0.0", () => {
    console.log(`
🚀 RBAC Portal Backend with Blockchain Audit & Dynamic Role Management
📍 Port: ${port}
🔐 JWT Secret: ${JWT_SECRET.substring(0, 10)}...

📊 Database Schema Updated:
   • roles - Dynamic roles management
   • permissions - Granular permissions
   • role_permissions - Many-to-many relationship
   • users - Now linked to roles table
   • ip_whitelist - IP whitelist management
   • ip_blacklist - IP blacklist management
   • ip_login_attempts - Track login attempts by IP
   
👤 Default Users (with role-based permissions):
   • ADMIN: admin / Admin@123 (Full access)
   • USER: user / User@123 (Limited access)
   • GUEST: guest / Guest@123 (Read-only access)

🔗 Blockchain Difficulty: ${blockchainService.difficulty}

📡 NEW ENDPOINTS - Role Management:
   GET    /api/roles
   GET    /api/roles/:id
   POST   /api/roles
   PUT    /api/roles/:id
   DELETE /api/roles/:id
   
🔑 Permission Management:
   GET    /api/permissions
   POST   /api/roles/:roleId/permissions
   
👥 User Management:
   GET    /api/users
   GET    /api/users/me
   PUT    /api/users/:userId/role

🔐 Auth Endpoints:
   POST   /api/auth/login
   GET    /api/auth/validate  (NEW)

🌐 IP Control Endpoints:
   GET    /api/ip/my-info
   GET    /api/ip/whitelist
   POST   /api/ip/whitelist
   DELETE /api/ip/whitelist/:ip
   GET    /api/ip/blacklist
   POST   /api/ip/blacklist
   DELETE /api/ip/blacklist/:ip
   GET    /api/ip/attempts/:ip
   GET    /api/ip/stats

📊 Resource Management:
   GET    /api/resources
   POST   /api/resources
   PUT    /api/resources/:id  (NEW - Resource update)
   DELETE /api/resources/:id  (Resource deletion)
   
🔗 Blockchain Endpoints:
   GET    /api/blockchain/chain
   GET    /api/blockchain/recent
   GET    /api/blockchain/verify
   GET    /api/blockchain/stats

🔧 Debug Endpoints:
   GET    /debug/users

✅ IP-Based Access Control Ready!
    `);
  });
});

// ========== ERROR HANDLING ========== //
app.use((err, req, res, next) => {
  console.error("❌ Server error:", err.stack);

  blockchainService
    .addBlock(
      req.user?.id?.toString() || "system",
      "SERVER_ERROR",
      req.clientIP || req.ip,
      {
        error: err.message,
        endpoint: req.path,
        method: req.method,
      },
    )
    .catch((e) => console.error("Failed to log error to blockchain:", e));

  res.status(500).json({
    success: false,
    error: "Internal server error",
  });
});

app.use((req, res) => {
  console.log(`❌ 404: ${req.method} ${req.path}`);

  blockchainService
    .addBlock("unknown", "ENDPOINT_NOT_FOUND", req.clientIP || req.ip, {
      endpoint: req.path,
      method: req.method,
    })
    .catch((e) => console.error("Failed to log 404 to blockchain:", e));

  res.status(404).json({
    success: false,
    error: `Endpoint ${req.method} ${req.path} not found`,
  });
});
