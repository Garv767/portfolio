import { useState, useEffect } from "react";
import axios from "axios";
import { supabase } from "../utils/supabaseClient";

const GITHUB_USERNAME = "garv767";

const useProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);

        // 1. Fetch GitHub Repos
        const ghResponse = await axios.get(
          `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=100`
        );
        const ghRepos = ghResponse.data;

        // 2. Fetch Supabase Configs
        const { data: dbConfigs, error: dbError } = await supabase
          .from("portfolio_projects")
          .select("*")
          .order("priority", { ascending: true });

        if (dbError) throw dbError;

        // 3. Merge: Supabase overrides take priority over GitHub data
        const configMap = new Map();
        dbConfigs.forEach((c) => configMap.set(c.repo_name, c));

        const merged = ghRepos
          .map((repo) => {
            const config = configMap.get(repo.name);

            // Hide if explicitly marked not visible in admin
            if (config && config.is_visible === false) return null;

            // Only show repos that are either in the DB (visible) or tagged 'portfolio' on GitHub
            const isPortfolioTagged = repo.topics?.includes("portfolio");
            if (!config && !isPortfolioTagged) return null;

            // demo_url: admin override → GitHub homepage → nothing
            const demoLink = config?.demo_url || repo.homepage || "";

            return {
              id: repo.id,
              name: repo.name,
              title: config?.display_title || repo.name.replace(/-/g, " "),
              description:
                config?.custom_description ||
                repo.description ||
                "No description provided.",
              ghLink: repo.html_url,
              demoLink,
              imgPath:
                config?.custom_image_url ||
                `https://opengraph.githubassets.com/1/${GITHUB_USERNAME}/${repo.name}`,
              stars: repo.stargazers_count,
              forks: repo.forks_count,
              language: repo.language,
              priority: config?.priority ?? 999,
              updatedAt: new Date(repo.updated_at),
            };
          })
          .filter(Boolean)
          .sort((a, b) => {
            if (a.priority !== b.priority) return a.priority - b.priority;
            return b.updatedAt - a.updatedAt;
          });

        setProjects(merged);
      } catch (err) {
        console.error("Error fetching projects:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  return { projects, loading, error };
};

export default useProjects;
