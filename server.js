const express = require("express");
const cors = require("cors");
const jsonServer = require("json-server");
const path = require("path");
const fs = require("fs").promises;  // Use async fs module

const server = express();
const router = jsonServer.router(path.join(__dirname, "db.json"));

server.use(cors());
server.use(express.json()); // To handle JSON data

// Custom Middleware for Logging
server.use((req, res, next) => {
  console.log(`📢 API Request: ${req.method} ${req.url}`);
  next();
});

// Function to dynamically load JSON data (avoids caching issues)
const getPokemonData = async () => {
  try {
    const filePath = path.join(__dirname, "data/pokemon.json");
    const data = await fs.readFile(filePath, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading pokemon.json:", err);
    throw err;  // Propagate error to be handled by the API routes
  }
};

// Pokémon List API (Paginated)
server.get("/:requestUId/pokemon-list", async (req, res) => {
  const { page = 1, pageSize = 10 } = req.query;

  try {
    const db = await getPokemonData();
    const pokemonSummaryList = db["pokemon-list"].pokemonSummaryList;

    const startIndex = (parseInt(page, 10) - 1) * parseInt(pageSize, 10);
    const paginatedList = pokemonSummaryList.slice(
      startIndex,
      startIndex + parseInt(pageSize, 10)
    );

    res.json({
      totalItems: db["pokemon-list"].totalItems,
      pokemonSummaryList: paginatedList,
    });
  } catch (err) {
    res.status(500).json({ error: "Error loading Pokémon list" });
  }
});

// Pokémon Detail API
server.get("/:requestUId/pokemon-detail", async (req, res) => {
  const { pokemonId } = req.query;

  try {
    const db = await getPokemonData();

    if (!pokemonId || !db["pokemon-detail"][pokemonId]) {
      return res.status(404).json({ error: "Pokémon not found" });
    }

    res.json(db["pokemon-detail"][pokemonId]);
  } catch (err) {
    res.status(500).json({ error: "Error loading Pokémon detail" });
  }
});

// Use JSON Server's default router for other endpoints
server.use(jsonServer.rewriter(require("./routes.json")));

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`✅ JSON Server is running on http://localhost:${PORT}/`);
});
