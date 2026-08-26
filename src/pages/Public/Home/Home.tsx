import React, { useState, useEffect } from "react";

import {
  Github,
  Shield,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Database,
  CheckCircle2,
  AlertTriangle,
  Play,
  Trash2,
  Eye,
  Terminal,
  Info,
  ExternalLink,
  Lock,
  Search,
  FileCode,
  Check,
  Settings,
  ArrowRight,
  Flame,
  Bug
} from "lucide-react";

// Mock data structures
interface Repository {
  id: number;
  name: string;
  fullName: string;
  description: string;
  stars: number;
  language: string;
  filesCount?: number;
  status: "idle" | "scanning" | "scanned" | "cleaned";
  lastScan?: string;
  threatsFound: number;
  owner: string;
  ownerType: "User" | "Organization";
  private?: boolean;
}

interface OwnerTab {
  login: string;
  type: "User" | "Organization";
}

interface ScanLog {
  time: string;
  level: "info" | "warning" | "error" | "success";
  message: string;
}

interface DetectedThreat {
  id: string;
  filePath: string;
  repoId: number;
  malwareType: string;
  severity: "high" | "critical" | "medium";
  line: number;
  matchedPattern: string;
  originalCode: string;
  cleanedCode: string;
  isCleaned: boolean;
}


const Home = () => {
  // Authentication states


  // Owner tabs
  const [ownerTabs, setOwnerTabs] = useState<OwnerTab[]>([]);
  const [activeOwnerTab, setActiveOwnerTab] = useState<string>("");

  // Multi-select
  const [selectedRepoIds, setSelectedRepoIds] = useState<Set<number>>(new Set());
  const [isBulkScanning, setIsBulkScanning] = useState(false);

  // Dashboard & Scanning States
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [safeRepoIds, setSafeRepoIds] = useState<Set<number>>(() => {
    const saved = localStorage.getItem("safe_repos");
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const toggleSafeRepo = (id: number) => {
    setSafeRepoIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      localStorage.setItem("safe_repos", JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const bulkMarkSafe = () => {
    setSafeRepoIds(prev => {
      const next = new Set(prev);
      selectedRepoIds.forEach(id => next.add(id));
      localStorage.setItem("safe_repos", JSON.stringify(Array.from(next)));
      return next;
    });
    setSelectedRepoIds(new Set());
    addLog(`Marked ${selectedRepoIds.size} repositories as safe.`, "success");
  };

  const [selectedRepoId, setSelectedRepoId] = useState<number | null>(null);
  const [scanLogs, setScanLogs] = useState<ScanLog[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<"scan" | "threats" | "logs">("scan");

  // Threats states
  const [threatsList, setThreatsList] = useState<DetectedThreat[]>([]);
  const [selectedThreat, setSelectedThreat] = useState<DetectedThreat | null>(null);
  const [isCleaning, setIsCleaning] = useState(false);

  // Stats
  const [totalFilesScanned, setTotalFilesScanned] = useState(0);
  const [threatsCleanedCount, setThreatsCleanedCount] = useState(0);
  const [rateLimit, setRateLimit] = useState<{ limit: number; used: number; remaining: number; resetAt: string } | null>(null);

  // Fetch rate limit
  const fetchRateLimit = async (token: string) => {
    try {
      const res = await fetch("http://localhost:3001/github/rate-limit", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setRateLimit(await res.json());
    } catch (_) { }
  };

  // Repos filtered by active owner tab
  const visibleRepos = activeOwnerTab === "SAFE_REPOS"
    ? repositories.filter((r) => safeRepoIds.has(r.id))
    : activeOwnerTab
      ? repositories.filter((r) => r.owner === activeOwnerTab)
      : repositories;

  // Initialize Logs
  const addLog = (message: string, level: ScanLog["level"] = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    setScanLogs((prev) => [{ time: timestamp, level, message }, ...prev]);
  };

  
  useEffect(() => {
    fetchRepositories();
  }, []);

  const fetchRepositories = async () => {

    addLog(`Initiating connection via GitHub...`, "info");

    try {
      const authHeaders = { "Authorization": `Bearer ${(localStorage.getItem("github_pat") || "") || "default_token"}` };

      // Fetch repos and orgs in parallel
      const [reposRes, orgsRes] = await Promise.all([
        fetch("http://localhost:3001/github/repos", { headers: authHeaders }),
        fetch("http://localhost:3001/github/orgs", { headers: authHeaders }),
      ]);

      if (!reposRes.ok) throw new Error(await reposRes.text());

      const repos: Repository[] = await reposRes.json();

      // Merge saved scan history from MongoDB
      const token = localStorage.getItem("github_pat") || "";
      let githubLoginLocal = "";
      try {
        if (orgsRes.ok) {
          const orgData = await orgsRes.json();
          githubLoginLocal = orgData.user?.login || "";
          const tabs: OwnerTab[] = [
            { login: orgData.user.login, type: "User" },
            ...orgData.orgs,
          ];
          setOwnerTabs(tabs);
          setActiveOwnerTab(orgData.user.login);

          // Fetch and merge scan history from MongoDB
          try {
            const historyRes = await fetch(`http://localhost:3001/github/history?githubLogin=${orgData.user.login}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (historyRes.ok) {
              const history: any[] = await historyRes.json();
              const historyMap = new Map(history.map((h: any) => [h.repoId, h]));
              const mergedRepos = repos.map((r) => {
                const h = historyMap.get(r.id);
                if (!h) return r;
                return {
                  ...r,
                  status: h.status as Repository["status"],
                  threatsFound: h.threatsFound - h.threatsCleaned,
                  filesCount: h.filesScanned,
                  lastScan: new Date(h.lastScanDate).toLocaleDateString(),
                };
              });
              setRepositories(mergedRepos);
              // Restore cleaned counts
              const totalCleaned = history.reduce((sum: number, h: any) => sum + (h.threatsCleaned || 0), 0);
              setThreatsCleanedCount(totalCleaned);
            } else {
              setRepositories(repos);
            }
          } catch (_) {
            setRepositories(repos);
          }
        } else {
          setRepositories(repos);
        }
      } catch (_) {
        setRepositories(repos);
      }

      // Fetch rate limit
      await fetchRateLimit(token);


      addLog("Successfully authenticated! Fetched live repository list.", "success");
    } catch (err: any) {
      addLog(`Authentication failed: ${err.message || err}`, "error");
    } finally {

    }
  };

  const handleDisconnect = () => {

    setSelectedRepoId(null);
    setSelectedThreat(null);
    setThreatsList([]);
    setScanLogs([]);
    setRepositories([]);
    setOwnerTabs([]);
    setActiveOwnerTab("");
    setSelectedRepoIds(new Set());
    addLog("Authenticated session closed.", "info");
  };

  // Toggle single repo selection
  const toggleRepoSelect = (repoId: number) => {
    setSelectedRepoIds((prev) => {
      const next = new Set(prev);
      if (next.has(repoId)) next.delete(repoId);
      else next.add(repoId);
      return next;
    });
  };

  // Select / deselect all visible repos in active tab
  const toggleSelectAll = () => {
    const visibleIds = visibleRepos.map((r) => r.id);
    const allSelected = visibleIds.every((id) => selectedRepoIds.has(id));
    if (allSelected) {
      setSelectedRepoIds((prev) => {
        const next = new Set(prev);
        visibleIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedRepoIds((prev) => {
        const next = new Set(prev);
        visibleIds.forEach((id) => next.add(id));
        return next;
      });
    }
  };

  // Bulk scan all selected repos sequentially
  const bulkScan = async () => {
    if (selectedRepoIds.size === 0) return;
    setIsBulkScanning(true);
    addLog(`Starting bulk scan for ${selectedRepoIds.size} selected repositories...`, "info");
    for (const repoId of Array.from(selectedRepoIds)) {
      if (safeRepoIds.has(repoId)) {
        addLog(`Skipping safe repository ID: ${repoId}`, "info");
        continue;
      }
      await startScan(repoId);
    }
    setIsBulkScanning(false);
    addLog("Bulk scan complete!", "success");
  };

  // Bulk clean all dirty threats across all scanned repos
  const bulkCleanAll = async () => {
    const dirtyThreats = threatsList.filter((t) => !t.isCleaned);
    if (dirtyThreats.length === 0) return;
    setIsCleaning(true);
    addLog(`Bulk patching ${dirtyThreats.length} threats across all repositories...`, "info");

    // Keep track of threats we successfully cleaned in this run
    const successfullyCleanedIds = new Set<string>();

    for (const threat of dirtyThreats) {
      const repo = repositories.find((r) => r.id === threat.repoId);
      if (!repo) continue;
      try {
        const response = await fetch("http://localhost:3001/github/clean", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${(localStorage.getItem("github_pat") || "") || "default_token"}`,
          },
          body: JSON.stringify({
            fullName: repo.fullName,
            filePath: threat.filePath,
            sha: (threat as any).sha,
            cleanedCode: threat.cleanedCode,
            deleteFilePath: (threat as any).deleteFilePath,
            githubLogin: activeOwnerTab,
            repoId: repo.id
          }),
        });
        if (response.ok) {
          successfullyCleanedIds.add(threat.id);
          addLog(`Patched: ${threat.filePath}`, "success");
        }
      } catch {
        addLog(`Failed to patch: ${threat.filePath}`, "error");
      }
    }

    // Apply all updates at once to avoid stale closures
    setThreatsList((prev) =>
      prev.map((t) => (successfullyCleanedIds.has(t.id) ? { ...t, isCleaned: true } : t))
    );

    setThreatsCleanedCount((prev) => prev + successfullyCleanedIds.size);

    setRepositories((prev) =>
      prev.map((r) => {
        // Evaluate remaining threats using the newly computed sets
        const remaining = threatsList.filter(
          (t) => t.repoId === r.id && !t.isCleaned && !successfullyCleanedIds.has(t.id)
        ).length;

        return remaining === 0 && r.status === "scanned" ? { ...r, status: "cleaned", threatsFound: 0 } : r;
      })
    );

    setIsCleaning(false);
    addLog("Bulk patch complete!", "success");
  };

  // Perform Simulated API Scan
  const startScan = async (repoId: number) => {
    const repo = repositories.find((r) => r.id === repoId);
    if (!repo) return;

    setSelectedRepoId(repoId);
    setIsScanning(true);
    setScanProgress(0);
    setActiveTab("scan");
    setSelectedThreat(null);

    // Update repository state
    setRepositories((prev) =>
      prev.map((r) => (r.id === repoId ? { ...r, status: "scanning", threatsFound: 0 } : r))
    );

    addLog(`Starting live security scan on: ${repo.fullName}`, "info");
    addLog(`Connecting EventSource log listener...`, "info");

    // Connect to Server Sent Events for live logs
    const eventSource = new EventSource(`http://localhost:3001/github/scan-events?fullName=${repo.fullName}`);
    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload && payload.message) {
          addLog(payload.message, payload.type || "info");
        }
      } catch (e) {
        // Skip log parses
      }
    };

    // Also refresh rate limit after scan
    fetchRateLimit(localStorage.getItem("github_pat") || "");

    // progress bar animation
    const progressInterval = setInterval(() => {
      setScanProgress((prev) => Math.min(prev + 12, 90));
    }, 250);

    try {
      const response = await fetch(`http://localhost:3001/github/scan?fullName=${repo.fullName}&repoId=${repo.id}&githubLogin=${activeOwnerTab}`, {
        headers: {
          "Authorization": `Bearer ${(localStorage.getItem("github_pat") || "") || "default_token"}`,
        }
      });

      clearInterval(progressInterval);
      setScanProgress(100);
      eventSource.close(); // Close stream once complete

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const result = await response.json();

      // Map threat models from backend schema
      const mappedThreats = result.threats.map((threat: any) => ({
        ...threat,
        repoId: repo.id,
      }));

      setThreatsList((prev) => {
        const filtered = prev.filter((t) => t.repoId !== repo.id);
        return [...filtered, ...mappedThreats];
      });

      setRepositories((prev) =>
        prev.map((r) =>
          r.id === repo.id
            ? {
              ...r,
              status: "scanned",
              threatsFound: mappedThreats.length,
              lastScan: new Date().toLocaleDateString(),
            }
            : r
        )
      );

      setTotalFilesScanned((prev) => prev + result.filesScanned);

      if (mappedThreats.length > 0) {
        addLog(`Scan finished. Found ${mappedThreats.length} potential security threat(s).`, "warning");
        setActiveTab("threats");
        setSelectedThreat(mappedThreats[0]);
      } else {
        addLog("Scan finished. Clean codebase! No malware matches detected.", "success");
      }
    } catch (err: any) {
      eventSource.close();
      addLog(`Scan failed: ${err.message || err}`, "error");
      setRepositories((prev) =>
        prev.map((r) => (r.id === repo.id ? { ...r, status: "idle" } : r))
      );
    } finally {
      setIsScanning(false);
    }
  };

  // Perform File Remediation
  const cleanThreat = async (threatId: string) => {
    setIsCleaning(true);
    const threat = threatsList.find((t) => t.id === threatId);
    if (!threat) return;

    addLog(`Initiating patch via NestJS REST API for: ${threat.filePath}`, "info");

    try {
      const repo = repositories.find((r) => r.id === threat.repoId);
      const response = await fetch("http://localhost:3001/github/clean", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${(localStorage.getItem("github_pat") || "") || "default_token"}`,
        },
        body: JSON.stringify({
          fullName: repo?.fullName,
          filePath: threat.filePath,
          sha: (threat as any).sha,
          cleanedCode: threat.cleanedCode,
          deleteFilePath: (threat as any).deleteFilePath,
          githubLogin: activeOwnerTab,
          repoId: repo?.id
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const result = await response.json();

      setThreatsList((prev) =>
        prev.map((t) => (t.id === threatId ? { ...t, isCleaned: true } : t))
      );

      // Check if all threats are cleaned for this repo
      const updatedThreats = threatsList.map((t) => (t.id === threatId ? { ...t, isCleaned: true } : t));
      const repoThreats = updatedThreats.filter((t) => t.repoId === threat.repoId);
      const remainingThreats = repoThreats.filter((t) => !t.isCleaned).length;

      setRepositories((prev) =>
        prev.map((r) =>
          r.id === threat.repoId
            ? {
              ...r,
              status: remainingThreats === 0 ? "cleaned" : "scanned",
              threatsFound: remainingThreats,
            }
            : r
        )
      );

      // Update selected threat view
      setSelectedThreat((prev) => (prev && prev.id === threatId ? { ...prev, isCleaned: true } : prev));
      setThreatsCleanedCount((prev) => prev + 1);
      addLog(`Success! Patched ${threat.filePath}. Reference commit: ${result.commitSha.substring(0, 8)}`, "success");
    } catch (err: any) {
      addLog(`Failed to patch threat: ${err.message || err}`, "error");
    } finally {
      setIsCleaning(false);
    }
  };

  const cleanAllThreats = async (repoId: number) => {
    setIsCleaning(true);
    const repo = repositories.find((r) => r.id === repoId);
    addLog(`Initiating bulk cleanup for all files in repository ${repo?.fullName}...`, "info");

    const repoThreats = threatsList.filter((t) => t.repoId === repoId && !t.isCleaned);
    const successfullyCleanedIds = new Set<string>();

    for (const threat of repoThreats) {
      try {
        addLog(`Patching file: ${threat.filePath}...`, "info");
        const response = await fetch("http://localhost:3001/github/clean", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${(localStorage.getItem("github_pat") || "") || "default_token"}`,
          },
          body: JSON.stringify({
            fullName: repo?.fullName,
            filePath: threat.filePath,
            sha: (threat as any).sha,
            cleanedCode: threat.cleanedCode,
            deleteFilePath: (threat as any).deleteFilePath,
            githubLogin: activeOwnerTab,
            repoId: repo?.id
          }),
        });

        if (response.ok) {
          successfullyCleanedIds.add(threat.id);
        }
      } catch (err) {
        // Skip on fail
      }
    }

    setThreatsList((prev) =>
      prev.map((t) => (successfullyCleanedIds.has(t.id) ? { ...t, isCleaned: true } : t))
    );

    setRepositories((prev) =>
      prev.map((r) => {
        if (r.id !== repoId) return r;
        const remaining = threatsList.filter(
          (t) => t.repoId === r.id && !t.isCleaned && !successfullyCleanedIds.has(t.id)
        ).length;

        return remaining === 0 && r.status === "scanned"
          ? { ...r, status: "cleaned", threatsFound: 0 }
          : { ...r, threatsFound: remaining };
      })
    );

    setThreatsCleanedCount((prev) => prev + successfullyCleanedIds.size);

    if (selectedThreat && selectedThreat.repoId === repoId && successfullyCleanedIds.has(selectedThreat.id)) {
      setSelectedThreat((prev) => prev ? { ...prev, isCleaned: true } : prev);
    }

    setIsCleaning(false);
    addLog(`Finished batch cleanup. ${successfullyCleanedIds.size} files patched successfully.`, "success");
  };


  return (
    <div className="p-8 w-full min-h-[calc(100vh-5rem)]">
      <div className="w-full space-y-8">


        {/* Global Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="surface border border-border p-5 rounded-md flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs text-secondary-text font-bold uppercase tracking-wider">Connected Repositories</p>
              <h3 className="text-2xl font-bold mt-1 text-primary-text">
                {repositories.length}
              </h3>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-md">
              <Database className="w-5 h-5" />
            </div>
          </div>

          <div className="surface border border-border p-5 rounded-md flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs text-secondary-text font-bold uppercase tracking-wider">Total Scanned Files</p>
              <h3 className="text-2xl font-bold mt-1 text-primary-text">
                {totalFilesScanned}
              </h3>
            </div>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-md">
              <FileCode className="w-5 h-5" />
            </div>
          </div>

          <div className="surface border border-border p-5 rounded-md flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs text-secondary-text font-bold uppercase tracking-wider">Pending Threats</p>
              <h3 className="text-2xl font-bold mt-1 text-rose-500">
                {threatsList.filter(t => !t.isCleaned).length}
              </h3>
            </div>
            <div className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-md">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>

          <div className="surface border border-border p-5 rounded-md flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs text-secondary-text font-bold uppercase tracking-wider">Patched &amp; Cleaned</p>
              <h3 className="text-2xl font-bold mt-1 text-emerald-500">
                {threatsCleanedCount}
              </h3>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          {/* Rate Limit Card */}
          <div className="surface border border-border p-5 rounded-md shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-secondary-text font-bold uppercase tracking-wider">API Rate Limit</p>
              <div className="p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-md">
                <RefreshCw className="w-4 h-4" />
              </div>
            </div>
            {rateLimit ? (
              <>
                <div className="flex items-end gap-1">
                  <span className={`text-xl font-bold ${rateLimit.remaining < 100 ? 'text-rose-500' : rateLimit.remaining < 500 ? 'text-amber-500' : 'text-emerald-500'}`}>
                    {rateLimit.remaining.toLocaleString()}
                  </span>
                  <span className="text-xs text-secondary-text mb-0.5">/ {rateLimit.limit.toLocaleString()} remaining</span>
                </div>
                <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${rateLimit.remaining < 100 ? 'bg-rose-500' : rateLimit.remaining < 500 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${(rateLimit.remaining / rateLimit.limit) * 100}%` }}
                  />
                </div>
                <p className="text-[10px] text-secondary-text">
                  Resets {new Date(rateLimit.resetAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </>
            ) : (
              <p className="text-xs text-secondary-text">Connect to view</p>
            )}
          </div>
        </div>

        {/* Main Security Dashboard workspace */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">

          {/* Left Column: Repository Selection Panel */}
          <div className="xl:col-span-4 surface shadow-all border border-white/10 dark:border-white/5 rounded-md flex flex-col h-[calc(100vh-10rem)] overflow-hidden backdrop-blur-xl bg-surface/80 relative before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/10 before:to-transparent before:pointer-events-none">

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border">
              <h2 className="text-base font-bold text-primary-text flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-500" />
                Repositories
              </h2>
              <span className="text-xs bg-light-background text-secondary-text px-2.5 py-0.5 rounded-full font-bold">
                {visibleRepos.length} Active
              </span>
            </div>

            {/* Owner Tabs */}
            {(ownerTabs.length > 0 || safeRepoIds.size > 0) && (
              <div className="flex gap-1 overflow-x-auto px-3 pt-3 pb-2 scrollbar-hide">
                {safeRepoIds.size > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveOwnerTab("SAFE_REPOS");
                      setSelectedRepoIds(new Set());
                    }}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${activeOwnerTab === "SAFE_REPOS"
                        ? "bg-emerald-600 text-white"
                        : "bg-light-background text-secondary-text hover:bg-border/50"
                      }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Safe ({safeRepoIds.size})
                  </button>
                )}
                {ownerTabs.map((tab) => (
                  <button
                    key={tab.login}
                    type="button"
                    onClick={() => {
                      setActiveOwnerTab(tab.login);
                      setSelectedRepoIds(new Set());
                    }}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${activeOwnerTab === tab.login
                        ? "bg-blue-600 text-white"
                        : "bg-light-background text-secondary-text hover:bg-border/50"
                      }`}
                  >
                    {tab.type === "User" ? "👤" : "🏢"}
                    {tab.login}
                  </button>
                ))}
              </div>
            )}

            {/* Select All + Bulk Actions */}
            <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-border bg-light-background">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={visibleRepos.length > 0 && visibleRepos.every((r) => selectedRepoIds.has(r.id))}
                  onChange={toggleSelectAll}
                  className="w-3.5 h-3.5 rounded accent-blue-600 cursor-pointer"
                />
                <span className="text-sm font-semibold text-secondary-text">
                  {selectedRepoIds.size > 0 ? `${selectedRepoIds.size} selected` : "Select all"}
                </span>
              </label>

              <div className="flex items-center gap-1.5">
                {selectedRepoIds.size > 0 && (
                  <button
                    type="button"
                    onClick={bulkMarkSafe}
                    className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-md transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <ShieldCheck className="w-2.5 h-2.5" />
                    Mark Safe
                  </button>
                )}
                {selectedRepoIds.size > 0 && (
                  <button
                    type="button"
                    onClick={bulkScan}
                    disabled={isBulkScanning || isScanning}
                    className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Play className="w-2.5 h-2.5" />
                    Scan {selectedRepoIds.size}
                  </button>
                )}
                {threatsList.filter((t) => !t.isCleaned).length > 0 && (
                  <button
                    type="button"
                    onClick={bulkCleanAll}
                    disabled={isCleaning}
                    className="flex items-center gap-1 px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                    Clean All
                  </button>
                )}
              </div>
            </div>

            {/* Repo List */}
            <div className="divide-y divide-border flex-1 overflow-y-auto">
              {visibleRepos.length === 0 && (
                <div className="px-5 py-10 text-center text-xs text-secondary-text">No repositories found for this owner.</div>
              )}
              {visibleRepos.map((repo) => {
                const isSelected = selectedRepoId === repo.id;
                const isChecked = selectedRepoIds.has(repo.id);
                const isSafe = safeRepoIds.has(repo.id);

                return (
                  <div
                    key={repo.id}
                    className={`px-5 py-4 transition-all duration-300 cursor-pointer relative group ${isSafe ? 'opacity-70 grayscale-[0.1]' : ''} ${isSelected
                        ? "bg-blue-500/10 dark:bg-blue-500/10 border-l-4 border-blue-500"
                        : "hover:bg-light-background/80 border-l-4 border-transparent"
                      }`}
                    onClick={() => {
                      setSelectedRepoId(repo.id);
                      const repoThreats = threatsList.filter((t) => t.repoId === repo.id);
                      setSelectedThreat(repoThreats.length > 0 ? repoThreats[0] : null);
                    }}
                  >
                    <div className="flex items-start gap-2.5">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleRepoSelect(repo.id);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-0.5 w-3.5 h-3.5 rounded accent-blue-600 cursor-pointer shrink-0"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-primary-text truncate flex items-center gap-1.5">
                              {repo.name}
                              {isSafe && <span className="bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-extrabold flex items-center gap-0.5"><ShieldCheck className="w-2 h-2" /> Safe</span>}
                            </p>
                            <p className="text-[10px] text-secondary-text mt-0.5 line-clamp-1">
                              {repo.description}
                            </p>
                          </div>

                          <div className="shrink-0">
                            {repo.status === "scanning" && (
                              <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
                            )}
                            {repo.status === "scanned" && repo.threatsFound > 0 && (
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-xs font-bold text-white">
                                {repo.threatsFound}
                              </span>
                            )}
                            {repo.status === "scanned" && repo.threatsFound === 0 && (
                              <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            )}
                            {repo.status === "cleaned" && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-100 dark:fill-emerald-950" />
                            )}
                          </div>
                        </div>

                        <div className="mt-2 flex items-center justify-between text-[10px] text-secondary-text font-semibold">
                          <div className="flex items-center gap-2">
                            <span>{repo.language}{repo.private ? " • 🔒 Private" : ""}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSafeRepo(repo.id);
                              }}
                              className={`opacity-0 group-hover:opacity-100 px-1.5 py-0.5 rounded flex items-center gap-1 transition-all cursor-pointer ${isSafe ? 'bg-emerald-500/20 text-emerald-600 hover:bg-emerald-500/30' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 hover:bg-slate-300 dark:hover:bg-slate-700'}`}
                            >
                              <ShieldCheck className="w-2 h-2" />
                              {isSafe ? 'Safe' : 'Mark Safe'}
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              startScan(repo.id);
                            }}
                            disabled={isScanning || isBulkScanning}
                            className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-md flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-40"
                          >
                            <Play className="w-2 h-2" />
                            {isSafe ? 'Force Scan' : 'Scan'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Dynamic Workspace Details */}
          <div className="xl:col-span-8 space-y-6 flex flex-col h-[calc(100vh-10rem)]">

            {/* Tab Navigation */}
            <div className="flex border-b border-border">
              <button
                onClick={() => setActiveTab("scan")}
                className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${activeTab === "scan"
                    ? "border-blue-600 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
              >
                Scanner Overview
              </button>
              <button
                onClick={() => setActiveTab("threats")}
                className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all relative cursor-pointer ${activeTab === "threats"
                    ? "border-blue-600 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
              >
                Infected Files
                {threatsList.filter((t) => !t.isCleaned).length > 0 && (
                  <span className="absolute top-1 right-0 w-2 h-2 bg-rose-500 rounded-full" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("logs")}
                className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${activeTab === "logs"
                    ? "border-blue-600 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
              >
                Scan Logs
              </button>
            </div>

            {/* Workspace Content Tabs */}
            {activeTab === "scan" && (
              <div className="surface border border-border rounded-md p-6 shadow-sm space-y-6">

                {isScanning ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-full animate-pulse border border-blue-500/10">
                      <RefreshCw className="w-8 h-8 animate-spin" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-primary-text">Scanning Directory Tree...</h3>
                      <p className="text-xs text-secondary-text mt-1 max-w-sm">
                        Reading repository file contents. Comparing buffer streams against malicious regex signatures.
                      </p>
                    </div>

                    <div className="w-full max-w-md bg-light-background rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-600 h-full transition-all duration-100"
                        style={{ width: `${scanProgress}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{scanProgress}% completed</span>
                  </div>
                ) : selectedRepoId ? (
                  (() => {
                    const repo = repositories.find((r) => r.id === selectedRepoId);
                    if (!repo) return null;
                    const repoThreats = threatsList.filter((t) => t.repoId === repo.id);

                    return (
                      <div className="space-y-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-bold text-primary-text">{repo.fullName}</h3>
                            <p className="text-xs text-secondary-text mt-1">{repo.description}</p>
                          </div>

                          <button
                            onClick={() => startScan(repo.id)}
                            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-md text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 cursor-pointer active:scale-95"
                          >
                            <Play className="w-3.5 h-3.5" />
                            Re-Scan Codebase
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="p-4 rounded-md border border-border bg-light-background text-center">
                            <span className="text-xs text-secondary-text uppercase font-bold tracking-wider">Repository Status</span>
                            <div className="flex items-center justify-center gap-1.5 mt-2">
                              {repo.status === "idle" && (
                                <>
                                  <Info className="w-4 h-4 text-secondary-text" />
                                  <span className="text-xs font-bold text-secondary-text">Not Scanned Yet</span>
                                </>
                              )}
                              {repo.status === "scanned" && repo.threatsFound > 0 && (
                                <>
                                  <AlertTriangle className="w-4 h-4 text-rose-500 animate-bounce" />
                                  <span className="text-xs font-bold text-rose-500">Infected</span>
                                </>
                              )}
                              {repo.status === "scanned" && repo.threatsFound === 0 && (
                                <>
                                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                  <span className="text-xs font-bold text-emerald-500">Healthy</span>
                                </>
                              )}
                              {repo.status === "cleaned" && (
                                <>
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                  <span className="text-xs font-bold text-emerald-500">Cleaned & Patched</span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="p-4 rounded-md border border-border bg-light-background text-center">
                            <span className="text-xs text-secondary-text uppercase font-bold tracking-wider">Files Evaluated</span>
                            <p className="text-base font-extrabold mt-1 text-primary-text">
                              {repo.status !== "idle" ? repo.filesCount : 0} / {repo.filesCount}
                            </p>
                          </div>

                          <div className="p-4 rounded-md border border-border bg-light-background text-center">
                            <span className="text-xs text-secondary-text uppercase font-bold tracking-wider">Active Threat Indicators</span>
                            <p className={`text-base font-extrabold mt-1 ${repo.threatsFound > 0 ? "text-rose-500" : "text-emerald-500"}`}>
                              {repo.threatsFound} Matches
                            </p>
                          </div>
                        </div>

                        {/* Threat Quick-List */}
                        {repoThreats.length > 0 ? (
                          <div className="border border-border rounded-md p-5 space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold text-primary-text uppercase tracking-wider">Malware Detected</h4>
                              <button
                                onClick={() => cleanAllThreats(repo.id)}
                                disabled={isCleaning}
                                className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer"
                              >
                                {isCleaning ? "Remediating..." : "Auto-clean all malware"}
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                              {repoThreats.map((threat) => (
                                <div key={threat.id} className="py-3 flex items-center justify-between gap-4">
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-primary-text flex items-center gap-2">
                                      <Bug className="w-3.5 h-3.5 text-rose-500" />
                                      {threat.filePath}
                                    </p>
                                    <p className="text-xs text-secondary-text mt-1">
                                      Signature match: <span className="font-mono text-rose-400">{threat.malwareType}</span> (line {threat.line})
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${threat.severity === "critical"
                                        ? "bg-rose-50 dark:bg-rose-950/20 text-rose-600"
                                        : "bg-amber-50 dark:bg-amber-950/20 text-amber-600"
                                      }`}>
                                      {threat.severity}
                                    </span>

                                    {threat.isCleaned ? (
                                      <span className="text-xs text-emerald-500 font-bold flex items-center gap-1">
                                        <Check className="w-3 h-3" /> Patched
                                      </span>
                                    ) : (
                                      <button
                                        onClick={() => {
                                          setSelectedThreat(threat);
                                          setActiveTab("threats");
                                        }}
                                        className="px-2.5 py-1 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                                      >
                                        Inspect Threat
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="border border-dashed border-border p-8 rounded-md flex flex-col items-center justify-center text-center space-y-2">
                            <ShieldCheck className="w-10 h-10 text-emerald-500" />
                            <h4 className="text-xs font-bold text-primary-text uppercase tracking-wider">Clean Codebase</h4>
                            <p className="text-sm text-secondary-text max-w-xs">
                              {repo.status === "idle"
                                ? "Perform a security scan to evaluate this repository for vulnerability signatures."
                                : "Zero malicious code indicators detected inside Javascript/TypeScript sources."
                              }
                            </p>
                          </div>
                        )}

                      </div>
                    );
                  })()
                ) : (
                  <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
                    <Github className="w-12 h-12 text-secondary-text animate-pulse" />
                    <div>
                      <h3 className="text-sm font-bold text-primary-text uppercase tracking-wider">Select a Repository</h3>
                      <p className="text-xs text-secondary-text mt-1 max-w-xs">
                        Choose a repository from the left panel to scan directory files or run malware removal operations.
                      </p>
                    </div>
                  </div>
                )}

              </div>
            )}

            {activeTab === "threats" && (
              <div className="surface border border-border rounded-md p-6 shadow-sm space-y-6">

                {threatsList.filter((t) => !t.isCleaned).length === 0 ? (
                  <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
                    <ShieldCheck className="w-12 h-12 text-emerald-500" />
                    <div>
                      <h3 className="text-sm font-bold text-primary-text uppercase tracking-wider">No Threats Detected</h3>
                      <p className="text-xs text-secondary-text mt-1 max-w-xs">
                        Your codebases are currently fully patched! No infected files are pending remediation.
                      </p>
                    </div>
                  </div>
                ) : selectedThreat ? (
                  <div className="space-y-6">

                    {/* Threat metadata summary */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider bg-rose-50 dark:bg-rose-950/20 text-rose-600 px-2 py-0.5 rounded-full">
                            {selectedThreat.severity} Severity
                          </span>
                          <span className="text-xs font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-850 text-secondary-text px-2.5 py-0.5 rounded-full">
                            {selectedThreat.malwareType}
                          </span>
                        </div>
                        <h3 className="text-base font-bold mt-2 text-primary-text">{selectedThreat.filePath}</h3>
                      </div>

                      {!selectedThreat.isCleaned && (
                        <button
                          onClick={() => cleanThreat(selectedThreat.id)}
                          disabled={isCleaning}
                          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-rose-600/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          {isCleaning ? "Remediating malware..." : "Patch Code (Clean File)"}
                        </button>
                      )}
                    </div>

                    {/* File List Navigation of threats */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-50 dark:border-slate-850">
                      {threatsList.filter((t) => t.repoId === selectedThreat.repoId).map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setSelectedThreat(t)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${selectedThreat.id === t.id
                              ? "bg-slate-900 text-white dark:bg-slate-800"
                              : t.isCleaned
                                ? "text-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20"
                                : "text-slate-600 hover:bg-slate-50 dark:text-secondary-text dark:hover:bg-slate-850"
                            }`}
                        >
                          {t.filePath.split("/").pop()} {t.isCleaned && "✓"}
                        </button>
                      ))}
                    </div>

                    {/* Side-by-side Diffs visual mock */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                        <span>Security Code Inspector Diff</span>
                        <span className="font-mono text-xs text-rose-500">Signature: {selectedThreat.matchedPattern.substring(0, 40)}...</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Original Infected Code */}
                        <div className="border border-border rounded-md overflow-hidden bg-slate-50 dark:bg-slate-950">
                          <div className="bg-slate-100 dark:bg-slate-900 px-4 py-2 border-b border-border flex items-center justify-between">
                            <span className="text-xs uppercase font-bold text-rose-500">Original (Infected)</span>
                            <Flame className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                          </div>
                          <pre className="p-4 text-sm font-mono text-slate-800 dark:text-slate-300 overflow-x-auto leading-relaxed">
                            {selectedThreat.originalCode}
                          </pre>
                        </div>

                        {/* Proposed Clean Patched Code */}
                        <div className="border border-border rounded-md overflow-hidden bg-slate-50 dark:bg-slate-950">
                          <div className="bg-slate-100 dark:bg-slate-900 px-4 py-2 border-b border-border flex items-center justify-between">
                            <span className="text-xs uppercase font-bold text-emerald-500">Proposed (Cleaned Code)</span>
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                          </div>
                          <pre className="p-4 text-sm font-mono text-slate-800 dark:text-slate-300 overflow-x-auto leading-relaxed">
                            {selectedThreat.cleanedCode}
                          </pre>
                        </div>
                      </div>
                    </div>

                  </div>
                ) : null}

              </div>
            )}

            {activeTab === "logs" && (
              <div className="surface border border-border rounded-md p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <h3 className="text-sm font-bold text-primary-text flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-blue-500" />
                    Live Action log (GitHub API request pipeline)
                  </h3>
                </div>

                <div className="bg-slate-950 rounded-md p-5 font-mono text-xs text-slate-300 h-96 overflow-y-auto space-y-2.5">
                  {scanLogs.length === 0 ? (
                    <p className="text-slate-500 text-center py-12">No logs generated. Connect and execute scan operations.</p>
                  ) : (
                    scanLogs.map((log, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="text-slate-600 shrink-0 select-none">[{log.time}]</span>
                        <span className={`shrink-0 uppercase font-bold text-xs px-1.5 py-0.2 rounded-md ${log.level === "success"
                            ? "bg-emerald-950 text-emerald-400"
                            : log.level === "warning"
                              ? "bg-rose-950 text-rose-400"
                              : "bg-slate-800 text-secondary-text"
                          }`}>
                          {log.level}
                        </span>
                        <p className="text-slate-200 break-words">{log.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};

export default Home;
