
import { useState, useEffect, useCallback } from 'react';
import { GitHubUser, GitHubRepo, GitHubContent } from '../types';
import * as githubService from '../services/githubService';

export const useGitHub = () => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncingRepo, setIsSyncingRepo] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem('github_token');
    if (storedToken) {
      setToken(storedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      githubService.getUser(token)
        .then(userData => {
          setUser(userData);
          localStorage.setItem('github_token', token);
        })
        .catch(err => {
          console.error("Failed to fetch GitHub user:", err);
          logout(); // Token might be invalid
        })
        .finally(() => setIsLoading(false));
    }
  }, [token]);

  const login = () => {
    githubService.redirectToGitHubAuth();
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('github_token');
  };

  const handleRedirect = useCallback(async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
      setIsLoading(true);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
      try {
        const accessToken = await githubService.exchangeCodeForToken(code);
        setToken(accessToken);
      } catch (error) {
        console.error("GitHub token exchange failed:", error);
        setIsLoading(false);
      }
    }
  }, []);
  
  const getRepos = useCallback(async (): Promise<GitHubRepo[]> => {
    if (!token) throw new Error("Not authenticated with GitHub.");
    return githubService.getRepos(token);
  }, [token]);

  const getRepoContents = useCallback(async (repoFullName: string): Promise<GitHubContent[]> => {
    if (!token) throw new Error("Not authenticated with GitHub.");
    setIsSyncingRepo(true);
    try {
        return await githubService.getRepoContents(token, repoFullName);
    } finally {
        setIsSyncingRepo(false);
    }
  }, [token]);


  return {
    token,
    user,
    isAuthenticated: !!user,
    isLoading,
    isSyncingRepo,
    login,
    logout,
    handleRedirect,
    getRepos,
    getRepoContents,
  };
};
