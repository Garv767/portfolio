const axios = require("axios");
const { createClient } = require("@supabase/supabase-js");
const path = require("path");
try {
  require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
} catch (e) {
  // dotenv not installed, using environment variables directly
}

// Configuration
const GITHUB_USERNAME = "garv767";
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing Supabase credentials. Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function syncRepos() {
  try {
    console.log(`🚀 Starting sync for GitHub user: ${GITHUB_USERNAME}`);

    // 1. Fetch repositories from GitHub
    const githubUrl = `https://api.github.com/users/${GITHUB_USERNAME}/repos?type=public&sort=updated`;
    const headers = GITHUB_TOKEN ? { Authorization: `token ${GITHUB_TOKEN}` } : {};
    
    const response = await axios.get(githubUrl, { headers });
    const repos = response.data;

    console.log(`📦 Found ${repos.length} public repositories.`);

    // 2. Prepare data for Supabase
    // We map GitHub repo data to our portfolio_projects schema
    const projectsToSync = repos.map((repo) => ({
      repo_name: repo.name,
      display_title: repo.name, // Default to repo name
      custom_description: repo.description || "No description provided.",
      demo_url: repo.homepage || repo.html_url,
      is_visible: true, // Visible by default per user request
      priority: 999,    // Lower priority (higher number) by default
      updated_at: new Date().toISOString(),
    }));

    // 3. Upsert into Supabase
    // Using onConflict: 'repo_name' to prevent duplicates and update existing records
    const { data, error } = await supabase
      .from("portfolio_projects")
      .upsert(projectsToSync, { 
        onConflict: "repo_name",
        ignoreDuplicates: false // We want to update descriptions/urls if they changed
      });

    if (error) {
      throw error;
    }

    console.log("✅ Successfully synced repositories to Supabase.");
    console.log(`✨ Synced ${projectsToSync.length} items.`);

  } catch (error) {
    console.error("❌ Sync failed:");
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data: ${JSON.stringify(error.response.data)}`);
    } else {
      console.error(`   Message: ${error.message}`);
    }
    process.exit(1);
  }
}

syncRepos();
