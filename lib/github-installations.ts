import { githubUserApi, type GithubSession } from "@/lib/github-auth";

type Installation = { id?: number };
type Repo = { full_name?: string; private?: boolean; permissions?: { pull?: boolean } };
export async function userInstalledRepositories(session: GithubSession) {
  const output: { fullName: string; private: boolean }[] = [];
  // Hard cap prevents unexpected API fan-out and excessive installation access.
  for (let page = 1; page <= 2; page++) {
    const res = await githubUserApi("/user/installations?per_page=50&page=" + page, session.token);
    if (!res.ok) throw new Error("GitHub installation authorization expired or unavailable.");
    const value = await res.json() as { installations?: Installation[] };
    const installations = value.installations || [];
    for (const installation of installations.slice(0, 40)) {
      if (!Number.isSafeInteger(installation.id)) continue;
      for (let repoPage = 1; repoPage <= 3; repoPage++) {
        const response = await githubUserApi("/user/installations/" + installation.id +
          "/repositories?per_page=100&page=" + repoPage, session.token);
        if (!response.ok) throw new Error("Could not validate repository permissions.");
        const body = await response.json() as { repositories?: Repo[] };
        const repos = body.repositories || [];
        for (const r of repos) {
          if (typeof r.full_name === "string" && /^[A-Za-z0-9-]{1,39}\/[A-Za-z0-9_.-]{1,100}$/.test(r.full_name))
            output.push({ fullName: r.full_name, private: !!r.private });
        }
        if (repos.length < 100) break;
      }
    }
    if (installations.length < 50) break;
  }
  return Array.from(new Map(output.map(r => [r.fullName.toLowerCase(), r])).values())
    .slice(0, 300);
}
export async function authorizePrivateRepo(session: GithubSession, target: string) {
  const available = await userInstalledRepositories(session);
  return available.some(r => r.private && r.fullName.toLowerCase() === target.toLowerCase());
}
