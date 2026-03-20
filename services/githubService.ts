
import { GitHubUser, GitHubRepo, GitHubContent, GitCommit } from '../types';
import { utf8ToBase64 } from '../utils/encoding';

// IMPORTANT: In a real app, this would be a public environment variable.
const GITHUB_CLIENT_ID = 'YOUR_GITHUB_CLIENT_ID'; 
const REDIRECT_URI = window.location.origin + window.location.pathname;

/**
 * Redirects the user to the GitHub authorization page.
 */
export const redirectToGitHubAuth = () => {
  // For this demo/prototype, we simulate the OAuth callback by reloading 
  // the page with a mock code parameter. This triggers the handleRedirect 
  // logic in useGitHub.ts without needing a real GitHub App.
  const url = new URL(window.location.href);
  url.searchParams.set('code', 'mock_auth_code_123');
  window.location.href = url.toString();

  // Real implementation would be:
  // const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=repo`;
  // window.location.href = authUrl;
};

/**
 * Simulates exchanging the authorization code for an access token.
 */
export const exchangeCodeForToken = async (code: string): Promise<string> => {
  console.log(`Simulating token exchange with code: ${code}`);
  await new Promise(res => setTimeout(res, 500));
  return `mock_token_for_${code}`;
};

/**
 * Mocks fetching the authenticated user's profile.
 */
export const getUser = async (token: string): Promise<GitHubUser> => {
  if (!token) throw new Error("Token is required");
  await new Promise(res => setTimeout(res, 300));
  return {
    login: 'yfhskb12',
    avatar_url: 'https://avatars.githubusercontent.com/u/1024025?v=4',
    name: 'Developer User',
  };
};

/**
 * Mocks fetching the user's repositories.
 */
export const getRepos = async (token: string): Promise<GitHubRepo[]> => {
    if (!token) throw new Error("Token is required");
    await new Promise(res => setTimeout(res, 800));
    return [
        { id: 1, name: 'md_red_v2', full_name: 'yfhskb12/md_red_v2', private: false, description: 'Official repository for Markdown Redactor V2 documents.', updated_at: new Date().toISOString() },
        { id: 5, name: 'design-system-v2', full_name: 'dev-user/design-system-v2', private: false, description: 'The next generation of our design system components and tokens.', updated_at: '2024-03-15T10:00:00Z' },
        { id: 6, name: 'api-gateway', full_name: 'dev-user/api-gateway', private: true, description: 'GraphQL API gateway for all client applications.', updated_at: '2024-03-14T11:00:00Z' },
        { id: 7, name: 'marketing-website', full_name: 'dev-user/marketing-website', private: false, description: 'Source code for the main company website.', updated_at: '2024-02-20T18:00:00Z' },
    ];
};

/**
 * Mocks fetching the contents of a repository.
 */
export const getRepoContents = async (token: string, repoFullName: string): Promise<GitHubContent[]> => {
    if (!token) throw new Error("Token is required");
    await new Promise(res => setTimeout(res, 1500));

    if (repoFullName === 'yfhskb12/md_red_v2') {
         return [
            { name: 'README.md', path: 'README.md', type: 'file', content: utf8ToBase64('# Markdown Redactor V2\n\nThis repository stores the official documentation and synced files for the Redactor V2 app.\n\n## Structure\n- `docs/` contains documentation\n- `blueprints/` contains project blueprints') },
            { name: 'docs', path: 'docs', type: 'dir', children: [
                 { name: 'getting-started.md', path: 'docs/getting-started.md', type: 'file', content: utf8ToBase64('# Getting Started\n\nWelcome to V2! \n\nWe have successfully migrated from gapro-staging to md_red_v2. All new changes should be committed here.') },
                 { name: 'architecture.md', path: 'docs/architecture.md', type: 'file', content: utf8ToBase64('# System Architecture\n\nOverview of the V2 system design.') }
            ]},
            { name: 'blueprints', path: 'blueprints', type: 'dir', children: [
                 { name: 'architecture.lkml', path: 'blueprints/architecture.lkml', type: 'file', content: utf8ToBase64('view: architecture {\n  dimension: id {\n    primary_key: yes\n    type: number\n  }\n}') }
            ]}
        ];
    }

    if (repoFullName.includes('design-system-v2')) {
        return [
            { name: 'README.md', path: 'README.md', type: 'file', content: utf8ToBase64('# Design System v2\nWelcome to the future of our UI!') },
            { name: 'tokens', path: 'tokens', type: 'dir', children: [
                { name: 'colors.json', path: 'tokens/colors.json', type: 'file', content: utf8ToBase64('{\n  "primary": "#1f6feb",\n  "secondary": "#c9d1d9",\n  "background": "#0d1117"\n}') },
                { name: 'typography.json', path: 'tokens/typography.json', type: 'file', content: utf8ToBase64('{\n  "fontFamily": "Inter, sans-serif",\n  "fontSize": "16px"\n}') },
            ]},
            { name: 'components', path: 'components', type: 'dir', children: [
                { name: 'Button.md', path: 'components/Button.md', type: 'file', content: utf8ToBase64('## Button Component\nDocumentation for the new button component.') },
                { name: 'Card.md', path: 'components/Card.md', type: 'file', content: utf8ToBase64('## Card Component\nDocumentation for the new card component.') },
            ]}
        ];
    }

    return [
        { name: 'README.md', path: 'README.md', type: 'file', content: utf8ToBase64('# Sample Repository\nThis is a sample repository structure with emoji 🚀.') },
        { name: 'package.json', path: 'package.json', type: 'file', content: utf8ToBase64('{ "name": "sample-repo", "version": "1.0.0" }') },
        { name: 'src', path: 'src', type: 'dir', children: [
            { name: 'index.js', path: 'src/index.js', type: 'file', content: utf8ToBase64('console.log("hello world");') },
        ]},
    ];
};

/**
 * Simulates pushing commits to a remote repository.
 */
export const pushChanges = async (token: string, repoFullName: string, commits: GitCommit[]): Promise<boolean> => {
    console.log(`Pushing ${commits.length} commits to ${repoFullName}...`);
    await new Promise(res => setTimeout(res, 1500));
    // Simulate generic success
    return true;
};

/**
 * Simulates pulling changes from a remote repository.
 */
export const pullChanges = async (token: string, repoFullName: string): Promise<{ updatedFiles: number }> => {
    console.log(`Pulling changes from ${repoFullName}...`);
    await new Promise(res => setTimeout(res, 1500));
    // Simulate a scenario where nothing changed on remote for now
    return { updatedFiles: 0 };
};
