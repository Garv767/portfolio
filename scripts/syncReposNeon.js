const axios = require("axios");
const { neon } = require("@neondatabase/serverless");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env.local") });
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const GITHUB_USERNAME = "garv767";
const DATABASE_URL = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;

if (!DATABASE_URL) {
  console.error("Missing DATABASE_URL. Ensure .env.local has the connection string.");
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function syncRepos() {
  try {
    console.log(`🚀 Starting GitHub repository sync for: ${GITHUB_USERNAME}`);

    const githubUrl = `https://api.github.com/users/${GITHUB_USERNAME}/repos?type=public&sort=updated&per_page=100`;
    const headers = GITHUB_TOKEN ? { Authorization: `token ${GITHUB_TOKEN}` } : {};

    const response = await axios.get(githubUrl, { headers });
    const repos = response.data;
    console.log(`📦 Found ${repos.length} public repositories.`);

    for (const repo of repos) {
      await sql`
        INSERT INTO portfolio_projects (
          repo_name, display_title, custom_description, demo_url, is_visible, priority, language, topics, updated_at
        ) VALUES (
          ${repo.name},
          ${repo.name},
          ${repo.description || "No description provided."},
          ${repo.homepage || repo.html_url},
          true,
          999,
          ${repo.language || null},
          ${repo.topics || []},
          NOW()
        )
        ON CONFLICT (repo_name) DO UPDATE SET
          demo_url = EXCLUDED.demo_url,
          language = EXCLUDED.language,
          topics = EXCLUDED.topics,
          updated_at = NOW()
      `;
    }

    console.log(`✅ Synced ${repos.length} projects to Neon PostgreSQL!`);
  } catch (error) {
    console.error("❌ Sync failed:", error.message);
    process.exit(1);
  }
}

syncRepos();
