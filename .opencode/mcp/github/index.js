import { execFileSync } from "node:child_process";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Octokit } from "octokit";
import { z } from "zod";

// Usage:
//   export GITHUB_PERSONAL_ACCESS_TOKEN="github_pat_xxx"
//   opencode
//
// Example OpenCode requests:
//   "Use project_github to show the current GitHub repository."
//   "List the open issues in this repository."
//   "Create an issue titled 'Improve documentation' with a short body."
//   "List open pull requests."
//   "Show the latest commits on the default branch."
//   "Read the file README.md from GitHub."
//   "List recent workflow runs."

const server = new McpServer({
  name: "project-github",
  version: "1.0.0"
});

const ownerRepoSchema = {
  owner: z.string().min(1).optional(),
  repo: z.string().min(1).optional()
};

const limitSchema = z.number().int().min(1).max(100).optional();

let cachedRepoContext;
let cachedOctokit;

function runGit(args) {
  try {
    return execFileSync("git", args, {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"]
    }).trim();
  } catch {
    throw new Error(
      "Current folder is not a git repository, or git is not available. Run OpenCode from inside this project repository."
    );
  }
}

function getOriginRemoteUrl() {
  try {
    return runGit(["remote", "get-url", "origin"]);
  } catch {
    throw new Error(
      "The git origin remote is missing. Add a GitHub origin remote before using the project GitHub MCP server."
    );
  }
}

function parseGitHubRemote(remoteUrl) {
  const patterns = [
    /^git@github\.com:([^/]+)\/(.+?)(?:\.git)?$/,
    /^ssh:\/\/git@github\.com\/([^/]+)\/(.+?)(?:\.git)?$/,
    /^https:\/\/github\.com\/([^/]+)\/(.+?)(?:\.git)?$/,
    /^http:\/\/github\.com\/([^/]+)\/(.+?)(?:\.git)?$/
  ];

  for (const pattern of patterns) {
    const match = remoteUrl.match(pattern);
    if (match) {
      return {
        owner: match[1],
        repo: match[2].replace(/\.git$/, "")
      };
    }
  }

  throw new Error(
    `The origin remote is not a supported GitHub repository URL: ${remoteUrl}`
  );
}

function getRepoContext() {
  if (cachedRepoContext) {
    return cachedRepoContext;
  }

  runGit(["rev-parse", "--show-toplevel"]);
  const remoteUrl = getOriginRemoteUrl();
  const { owner, repo } = parseGitHubRemote(remoteUrl);
  cachedRepoContext = { owner, repo, remoteUrl };
  return cachedRepoContext;
}

function resolveRepo(input = {}) {
  const current = getRepoContext();
  return {
    owner: input.owner || current.owner,
    repo: input.repo || current.repo
  };
}

function getOctokit() {
  if (cachedOctokit) {
    return cachedOctokit;
  }

  const token = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
  if (!token) {
    throw new Error(
      "GITHUB_PERSONAL_ACCESS_TOKEN is missing. Export a GitHub personal access token before starting OpenCode."
    );
  }

  cachedOctokit = new Octokit({ auth: token });
  return cachedOctokit;
}

function toJsonText(data) {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(data, null, 2)
      }
    ]
  };
}

function simplifyRepo(repo) {
  return {
    owner: repo.owner.login,
    repo: repo.name,
    full_name: repo.full_name,
    description: repo.description,
    private: repo.private,
    visibility: repo.visibility,
    default_branch: repo.default_branch,
    html_url: repo.html_url,
    fork: repo.fork,
    archived: repo.archived,
    open_issues_count: repo.open_issues_count,
    stargazers_count: repo.stargazers_count,
    forks_count: repo.forks_count,
    updated_at: repo.updated_at
  };
}

function simplifyIssue(issue) {
  return {
    number: issue.number,
    title: issue.title,
    state: issue.state,
    author: issue.user?.login,
    labels: issue.labels?.map((label) =>
      typeof label === "string" ? label : label.name
    ),
    comments: issue.comments,
    html_url: issue.html_url,
    created_at: issue.created_at,
    updated_at: issue.updated_at,
    pull_request: Boolean(issue.pull_request)
  };
}

function simplifyPullRequest(pr) {
  return {
    number: pr.number,
    title: pr.title,
    state: pr.state,
    draft: pr.draft,
    author: pr.user?.login,
    head: {
      ref: pr.head?.ref,
      sha: pr.head?.sha,
      repo: pr.head?.repo?.full_name
    },
    base: {
      ref: pr.base?.ref,
      sha: pr.base?.sha,
      repo: pr.base?.repo?.full_name
    },
    html_url: pr.html_url,
    created_at: pr.created_at,
    updated_at: pr.updated_at,
    merged_at: pr.merged_at
  };
}

function simplifyCommit(commit) {
  return {
    sha: commit.sha,
    message: commit.commit?.message,
    author: commit.commit?.author,
    committer: commit.commit?.committer,
    html_url: commit.html_url
  };
}

function simplifyWorkflowRun(run) {
  return {
    id: run.id,
    name: run.name,
    event: run.event,
    status: run.status,
    conclusion: run.conclusion,
    branch: run.head_branch,
    sha: run.head_sha,
    html_url: run.html_url,
    created_at: run.created_at,
    updated_at: run.updated_at
  };
}

function formatGitHubError(error) {
  if (error?.status === 401) {
    return "GitHub API authentication failed. Check that GITHUB_PERSONAL_ACCESS_TOKEN is valid.";
  }
  if (error?.status === 403) {
    return "GitHub API permission denied or rate limited. Check token scopes and repository access.";
  }
  if (error?.status === 404) {
    return "GitHub API could not find the requested repository or resource. Check repository access and input values.";
  }
  return error?.message || String(error);
}

function registerTool(name, description, inputSchema, handler) {
  server.registerTool(
    name,
    {
      description,
      inputSchema
    },
    async (input) => {
      try {
        const parsed = z.object(inputSchema).parse(input || {});
        const data = await handler(parsed);
        return toJsonText(data);
      } catch (error) {
        return toJsonText({
          error: formatGitHubError(error),
          status: error?.status
        });
      }
    }
  );
}

async function getRepository(input = {}) {
  const octokit = getOctokit();
  const { owner, repo } = resolveRepo(input);
  const { data } = await octokit.rest.repos.get({ owner, repo });
  return data;
}

async function getDefaultBranch(input = {}) {
  const repo = await getRepository(input);
  return repo.default_branch;
}

registerTool(
  "github_current_repo",
  "Return the detected current GitHub repository context.",
  ownerRepoSchema,
  async (input) => {
    const context = getRepoContext();
    const repo = await getRepository(input);
    return {
      owner: input.owner || context.owner,
      repo: input.repo || context.repo,
      remote_url: context.remoteUrl,
      default_branch: repo.default_branch,
      visibility: repo.visibility,
      repository_url: repo.html_url
    };
  }
);

registerTool(
  "github_repo_info",
  "Return basic repository metadata.",
  ownerRepoSchema,
  async (input) => simplifyRepo(await getRepository(input))
);

registerTool(
  "github_list_issues",
  "List repository issues.",
  {
    ...ownerRepoSchema,
    state: z.enum(["open", "closed", "all"]).optional(),
    labels: z.string().optional(),
    limit: limitSchema
  },
  async (input) => {
    const octokit = getOctokit();
    const { owner, repo } = resolveRepo(input);
    const { data } = await octokit.rest.issues.listForRepo({
      owner,
      repo,
      state: input.state || "open",
      labels: input.labels,
      per_page: input.limit || 20
    });
    return data.map(simplifyIssue);
  }
);

registerTool(
  "github_get_issue",
  "Get a single issue.",
  {
    ...ownerRepoSchema,
    issue_number: z.number().int().positive()
  },
  async (input) => {
    const octokit = getOctokit();
    const { owner, repo } = resolveRepo(input);
    const { data } = await octokit.rest.issues.get({
      owner,
      repo,
      issue_number: input.issue_number
    });
    return simplifyIssue(data);
  }
);

registerTool(
  "github_create_issue",
  "Create an issue.",
  {
    ...ownerRepoSchema,
    title: z.string().min(1),
    body: z.string().optional(),
    labels: z.array(z.string().min(1)).optional()
  },
  async (input) => {
    const octokit = getOctokit();
    const { owner, repo } = resolveRepo(input);
    const { data } = await octokit.rest.issues.create({
      owner,
      repo,
      title: input.title,
      body: input.body,
      labels: input.labels
    });
    return simplifyIssue(data);
  }
);

registerTool(
  "github_comment_issue",
  "Add a comment to an issue or pull request conversation.",
  {
    ...ownerRepoSchema,
    issue_number: z.number().int().positive(),
    body: z.string().min(1)
  },
  async (input) => {
    const octokit = getOctokit();
    const { owner, repo } = resolveRepo(input);
    const { data } = await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: input.issue_number,
      body: input.body
    });
    return {
      id: data.id,
      author: data.user?.login,
      html_url: data.html_url,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  }
);

registerTool(
  "github_list_pull_requests",
  "List pull requests.",
  {
    ...ownerRepoSchema,
    state: z.enum(["open", "closed", "all"]).optional(),
    limit: limitSchema
  },
  async (input) => {
    const octokit = getOctokit();
    const { owner, repo } = resolveRepo(input);
    const { data } = await octokit.rest.pulls.list({
      owner,
      repo,
      state: input.state || "open",
      per_page: input.limit || 20
    });
    return data.map(simplifyPullRequest);
  }
);

registerTool(
  "github_get_pull_request",
  "Get a single pull request.",
  {
    ...ownerRepoSchema,
    pull_number: z.number().int().positive()
  },
  async (input) => {
    const octokit = getOctokit();
    const { owner, repo } = resolveRepo(input);
    const { data } = await octokit.rest.pulls.get({
      owner,
      repo,
      pull_number: input.pull_number
    });
    return simplifyPullRequest(data);
  }
);

registerTool(
  "github_create_pull_request",
  "Create a pull request.",
  {
    ...ownerRepoSchema,
    title: z.string().min(1),
    head: z.string().min(1),
    base: z.string().min(1).optional(),
    body: z.string().optional(),
    draft: z.boolean().optional()
  },
  async (input) => {
    const octokit = getOctokit();
    const { owner, repo } = resolveRepo(input);
    const base = input.base || (await getDefaultBranch(input));
    const { data } = await octokit.rest.pulls.create({
      owner,
      repo,
      title: input.title,
      head: input.head,
      base,
      body: input.body,
      draft: input.draft
    });
    return simplifyPullRequest(data);
  }
);

registerTool(
  "github_list_branches",
  "List repository branches.",
  {
    ...ownerRepoSchema,
    limit: limitSchema
  },
  async (input) => {
    const octokit = getOctokit();
    const { owner, repo } = resolveRepo(input);
    const { data } = await octokit.rest.repos.listBranches({
      owner,
      repo,
      per_page: input.limit || 30
    });
    return data.map((branch) => ({
      name: branch.name,
      protected: branch.protected,
      sha: branch.commit?.sha
    }));
  }
);

registerTool(
  "github_get_default_branch",
  "Return the repository default branch.",
  ownerRepoSchema,
  async (input) => ({
    default_branch: await getDefaultBranch(input)
  })
);

registerTool(
  "github_compare_branches",
  "Compare two branches or refs.",
  {
    ...ownerRepoSchema,
    base: z.string().min(1),
    head: z.string().min(1)
  },
  async (input) => {
    const octokit = getOctokit();
    const { owner, repo } = resolveRepo(input);
    const { data } = await octokit.rest.repos.compareCommitsWithBasehead({
      owner,
      repo,
      basehead: `${input.base}...${input.head}`
    });
    return {
      status: data.status,
      ahead_by: data.ahead_by,
      behind_by: data.behind_by,
      total_commits: data.total_commits,
      html_url: data.html_url,
      commits: data.commits.map(simplifyCommit),
      files: data.files?.map((file) => ({
        filename: file.filename,
        status: file.status,
        additions: file.additions,
        deletions: file.deletions,
        changes: file.changes,
        patch: file.patch
      }))
    };
  }
);

registerTool(
  "github_get_file",
  "Read a file from the repository.",
  {
    ...ownerRepoSchema,
    path: z.string().min(1),
    ref: z.string().min(1).optional()
  },
  async (input) => {
    const octokit = getOctokit();
    const { owner, repo } = resolveRepo(input);
    const ref = input.ref || (await getDefaultBranch(input));
    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: input.path,
      ref
    });

    if (Array.isArray(data) || data.type !== "file") {
      throw new Error(`Path is not a file: ${input.path}`);
    }

    const content =
      data.encoding === "base64"
        ? Buffer.from(data.content || "", "base64").toString("utf8")
        : data.content;

    return {
      path: data.path,
      name: data.name,
      sha: data.sha,
      size: data.size,
      encoding: "utf8",
      content
    };
  }
);

registerTool(
  "github_list_directory",
  "List a directory from the repository.",
  {
    ...ownerRepoSchema,
    path: z.string().optional(),
    ref: z.string().min(1).optional()
  },
  async (input) => {
    const octokit = getOctokit();
    const { owner, repo } = resolveRepo(input);
    const ref = input.ref || (await getDefaultBranch(input));
    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: input.path || "",
      ref
    });

    if (!Array.isArray(data)) {
      throw new Error(`Path is not a directory: ${input.path || ""}`);
    }

    return data.map((entry) => ({
      name: entry.name,
      path: entry.path,
      type: entry.type,
      size: entry.size,
      sha: entry.sha,
      html_url: entry.html_url
    }));
  }
);

registerTool(
  "github_list_commits",
  "List repository commits.",
  {
    ...ownerRepoSchema,
    sha: z.string().min(1).optional(),
    limit: limitSchema
  },
  async (input) => {
    const octokit = getOctokit();
    const { owner, repo } = resolveRepo(input);
    const { data } = await octokit.rest.repos.listCommits({
      owner,
      repo,
      sha: input.sha,
      per_page: input.limit || 20
    });
    return data.map(simplifyCommit);
  }
);

registerTool(
  "github_get_commit",
  "Get a commit by SHA, branch, tag, or ref.",
  {
    ...ownerRepoSchema,
    ref: z.string().min(1)
  },
  async (input) => {
    const octokit = getOctokit();
    const { owner, repo } = resolveRepo(input);
    const { data } = await octokit.rest.repos.getCommit({
      owner,
      repo,
      ref: input.ref
    });
    return simplifyCommit(data);
  }
);

registerTool(
  "github_list_workflows",
  "List GitHub Actions workflows.",
  ownerRepoSchema,
  async (input) => {
    const octokit = getOctokit();
    const { owner, repo } = resolveRepo(input);
    const { data } = await octokit.rest.actions.listRepoWorkflows({
      owner,
      repo
    });
    return data.workflows.map((workflow) => ({
      id: workflow.id,
      name: workflow.name,
      path: workflow.path,
      state: workflow.state,
      html_url: workflow.html_url,
      created_at: workflow.created_at,
      updated_at: workflow.updated_at
    }));
  }
);

registerTool(
  "github_list_workflow_runs",
  "List GitHub Actions workflow runs.",
  {
    ...ownerRepoSchema,
    workflow_id: z.union([z.string().min(1), z.number().int().positive()]).optional(),
    branch: z.string().min(1).optional(),
    status: z
      .enum([
        "completed",
        "action_required",
        "cancelled",
        "failure",
        "neutral",
        "skipped",
        "stale",
        "success",
        "timed_out",
        "in_progress",
        "queued",
        "requested",
        "waiting",
        "pending"
      ])
      .optional(),
    limit: limitSchema
  },
  async (input) => {
    const octokit = getOctokit();
    const { owner, repo } = resolveRepo(input);
    const params = {
      owner,
      repo,
      branch: input.branch,
      status: input.status,
      per_page: input.limit || 20
    };
    const response = input.workflow_id
      ? await octokit.rest.actions.listWorkflowRuns({
          ...params,
          workflow_id: input.workflow_id
        })
      : await octokit.rest.actions.listWorkflowRunsForRepo(params);

    return response.data.workflow_runs.map(simplifyWorkflowRun);
  }
);

registerTool(
  "github_search_repo_code",
  "Search code within the repository.",
  {
    ...ownerRepoSchema,
    query: z.string().min(1),
    limit: limitSchema
  },
  async (input) => {
    const octokit = getOctokit();
    const { owner, repo } = resolveRepo(input);
    const { data } = await octokit.rest.search.code({
      q: `${input.query} repo:${owner}/${repo}`,
      per_page: input.limit || 20
    });
    return data.items.map((item) => ({
      name: item.name,
      path: item.path,
      sha: item.sha,
      html_url: item.html_url,
      repository: item.repository?.full_name,
      score: item.score
    }));
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
