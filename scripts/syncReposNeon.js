const axios = require("axios");
const { neon } = require("@neondatabase/serverless");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env.local") });
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const GITHUB_USERNAME = "garv767";
const rawDbUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
const DATABASE_URL = rawDbUrl ? rawDbUrl.trim().replace(/^["']|["']$/g, '') : null;
const GITHUB_TOKEN = (process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "").trim();

if (!DATABASE_URL) {
  console.error("Missing DATABASE_URL. Ensure environment variables include the Neon connection string.");
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
    console.log(`📦 Found ${repos.length} public repositories from GitHub.`);

    let insertedCount = 0;
    let updatedCount = 0;

    for (const repo of repos) {
      // Check if repo already exists in portfolio_projects
      const existing = await sql`
        SELECT repo_name, display_title, custom_description, demo_url, custom_image_url, is_visible, priority
        FROM portfolio_projects
        WHERE LOWER(repo_name) = LOWER(${repo.name})
        LIMIT 1
      `;

      if (existing.length === 0) {
        // New repository: Insert with GitHub defaults
        await sql`
          INSERT INTO portfolio_projects (
            repo_name,
            display_title,
            custom_description,
            demo_url,
            is_visible,
            priority,
            language,
            topics,
            updated_at
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
        `;
        insertedCount++;
      } else {
        // Existing repository: Update GitHub metadata ONLY.
        // DO NOT overwrite admin overrides (display_title, custom_description, custom_image_url, priority, is_visible).
        await sql`
          UPDATE portfolio_projects
          SET
            language = ${repo.language || null},
            topics = ${repo.topics || []},
            updated_at = NOW()
          WHERE LOWER(repo_name) = LOWER(${repo.name})
        `;
        updatedCount++;
      }
    }

    console.log(`✅ Sync complete: ${insertedCount} new repos inserted, ${updatedCount} existing repos updated (admin overrides strictly preserved).`);
  } catch (error) {
    console.error("❌ Sync failed:", error.message);
    process.exit(1);
  }
}

syncRepos();
