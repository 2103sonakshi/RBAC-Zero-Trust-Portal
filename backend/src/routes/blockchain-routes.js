import express from "express";
import blockchainService from "../services/blockchain-service.js";

const router = express.Router();

// Get entire blockchain
router.get("/chain", (req, res) => {
  try {
    const chain = blockchainService.getChain();
    res.json({
      success: true,
      chain,
      length: chain.length,
    });
  } catch (error) {
    console.error("Get chain error:", error);
    res.status(500).json({ success: false, error: "Failed to get blockchain" });
  }
});

// Get recent blocks
router.get("/recent", (req, res) => {
  try {
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
});

// Add audit block
router.post("/add-block", (req, res) => {
  try {
    const { userId, action, ip, details } = req.body;

    if (!userId || !action) {
      return res.status(400).json({
        success: false,
        error: "UserId and action are required",
      });
    }

    const block = blockchainService.addBlock(
      userId,
      action,
      ip || "127.0.0.1",
      details,
    );

    res.json({
      success: true,
      message: "Block added to blockchain",
      block: {
        index: block.index,
        hash: block.hash,
        timestamp: block.timestamp,
        action: block.data.action,
        userId: block.data.userId,
      },
    });
  } catch (error) {
    console.error("Add block error:", error);
    res.status(500).json({ success: false, error: "Failed to add block" });
  }
});

// Verify chain integrity
router.get("/verify", (req, res) => {
  try {
    const verification = blockchainService.verifyChain();
    res.json({
      success: true,
      ...verification,
    });
  } catch (error) {
    console.error("Verify chain error:", error);
    res.status(500).json({ success: false, error: "Failed to verify chain" });
  }
});

// Demo: Simulate tampering
router.post("/simulate-tamper/:blockIndex", (req, res) => {
  try {
    const blockIndex = parseInt(req.params.blockIndex);

    if (
      isNaN(blockIndex) ||
      blockIndex < 1 ||
      blockIndex >= blockchainService.getChain().length
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid block index",
      });
    }

    blockchainService.simulateTampering(blockIndex);
    const verification = blockchainService.verifyChain();

    res.json({
      success: true,
      message: `Simulated tampering on block #${blockIndex}`,
      verification,
    });
  } catch (error) {
    console.error("Simulate tamper error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to simulate tampering" });
  }
});

// Get blockchain stats
router.get("/stats", (req, res) => {
  try {
    const chain = blockchainService.getChain();
    const actions = chain.reduce((acc, block) => {
      acc[block.data.action] = (acc[block.data.action] || 0) + 1;
      return acc;
    }, {});

    res.json({
      success: true,
      stats: {
        totalBlocks: chain.length,
        firstBlock: chain[0].timestamp,
        lastBlock: chain[chain.length - 1].timestamp,
        actions,
        integrity: blockchainService.verifyChain().valid,
      },
    });
  } catch (error) {
    console.error("Get stats error:", error);
    res.status(500).json({ success: false, error: "Failed to get stats" });
  }
});

export default router;
