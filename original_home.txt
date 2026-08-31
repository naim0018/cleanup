import React, { useState, useEffect, useMemo } from "react";
import {
  useGetGithubReposQuery,
  useGetGithubOrgsQuery,
  useGetGithubHistoryQuery,
  useGetGithubRateLimitQuery,
  useCleanRepositoryFileMutation,
} from "@/store/Api/Github/github.api";
import { getErrorMessage } from "@/store/Api/Github/github.type";

import {
  Github,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Database,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Play,
  Trash2,
  Terminal,
  Info,
  FileCode,
  Check,
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
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");

const Home = () => {
  // RTK Query hooks
  const { data: orgsData, error: orgsError } = useGetGithubOrgsQuery();
  const githubLogin = orgsData?.user?.login || "";
  const { data: historyData, refetch: refetchHistory } = useGetGithubHistoryQuery(githubLogin, { skip: !githubLogin });
  const { data: reposData, error: reposError } = useGetGithubReposQuery();
  const { data: rateLimitData, refetch: refetchRateLimit, isFetching: isFetchingRateLimit } = useGetGithubRateLimitQuery(undefined, {
    pollingInterval: 30000,
  });
  const [cleanFileMutation] = useCleanRepositoryFileMutation();

  const [activeOwnerTab, setActiveOwnerTab] = useState<string>("");
  const [localRepoStatus, setLocalRepoStatus] = useState<Record<number, { status: Repository["status"]; threatsFound: number; lastScan?: string }>>({});


  // Initialize activeOwnerTab once orgsData is loaded
  useEffect(() => {
    if (orgsData?.user?.login && !activeOwnerTab) {
      setActiveOwnerTab(orgsData.user.login);
    }
  }, [orgsData, activeOwnerTab]);

  const ownerTabs = useMemo(() => {
    if (!orgsData) return [];
    const tabsMap = new Map<string, { login: string; type: "User" | "Organization" }>();
    
    // Add primary user tab
    tabsMap.set(orgsData.user.login, { login: orgsData.user.login, type: "User" });
    
    // Add orgs returned from API
    orgsData.orgs.forEach(o => {
      tabsMap.set(o.login, { login: o.login, type: "Organization" });
    });
    
    // Dynamically extract any other owners from repositories
    if (reposData) {
      reposData.forEach((r) => {
        if (r.owner && !tabsMap.has(r.owner)) {
          tabsMap.set(r.owner, { login: r.owner, type: r.ownerType || "Organization" });
        }
      });
    }
    
    return Array.from(tabsMap.values()) as Array<{ login: string; type: "User" | "Organization" }>;
  }, [orgsData, reposData]);

  // Multi-select
  const [selectedRepoIds, setSelectedRepoIds] = useState<Set<number>>(new Set());
  const [isBulkScanning, setIsBulkScanning] = useState(false);



  const repositories = useMemo(() => {
    if (!reposData) return [];
    const historyMap = new Map((historyData || []).map((h: any) => [h.repoId, h]));
    return reposData.map((r) => {
      const h = historyMap.get(r.id);
      let repo = h
        ? {
            ...r,
            status: h.status as Repository["status"],
            threatsFound: h.threatsFound - h.threatsCleaned,
            filesCount: h.filesScanned,
            lastScan: new Date(h.lastScanDate).toLocaleDateString(),
          }
        : r;
      if (localRepoStatus[r.id]) {
        repo = {
          ...repo,
          ...localRepoStatus[r.id],
        };
      }
      return repo;
    }).filter(r => {
      const h = historyMap.get(r.id);
      return !h?.archived;
    });
  }, [reposData, historyData, localRepoStatus]);

  const archiveRepoAPI = async (repoId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/github/archive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(localStorage.getItem("github_pat") || "") || "default_token"}`,
        },
        body: JSON.stringify({
          githubLogin: activeOwnerTab,
          repoId: repoId,
        }),
      });
      if (response.ok) {
        addLog(`Moved repository to Scanned Repos tab.`, "success");
        refetchHistory();
        if (selectedRepoId === repoId) {
          setSelectedRepoId(null);
        }
      }
    } catch (err) {
      console.error("Failed to archive:", err);
    }
  };

  const [selectedRepoId, setSelectedRepoId] = useState<number | null>(null);
  const [scanLogs, setScanLogs] = useState<ScanLog[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<"scan" | "threats" | "logs">("scan");

  const recentlyAuditedFiles = useMemo(() => {
    const audited: string[] = [];
    for (let i = scanLogs.length - 1; i >= 0; i--) {
      const msg = scanLogs[i].message;
      if (msg.includes("Auditing code buffer:")) {
        const file = msg.replace("Auditing code buffer:", "").trim();
        if (!audited.includes(file)) {
          audited.push(file);
          if (audited.length === 3) break;
        }
      }
    }
    return audited;
  }, [scanLogs]);

  // Threats states
  const [threatsList, setThreatsList] = useState<DetectedThreat[]>([]);
  const [selectedThreat, setSelectedThreat] = useState<DetectedThreat | null>(null);
  const [isCleaning, setIsCleaning] = useState(false);

  useEffect(() => {
    if (historyData) {
      const allHistoryThreats: DetectedThreat[] = [];
      historyData.forEach((h: any) => {
        if (h.threats && Array.isArray(h.threats)) {
          h.threats.forEach((threat: any) => {
            allHistoryThreats.push({
              ...threat,
              repoId: h.repoId,
            });
          });
        }
      });
      setThreatsList(allHistoryThreats);
      
      if (!selectedThreat && allHistoryThreats.length > 0) {
        const uncleaned = allHistoryThreats.find(t => !t.isCleaned);
        if (uncleaned) setSelectedThreat(uncleaned);
      }
    }
  }, [historyData]);

  // Stats
  const totalFilesScanned = useMemo(() => {
    return (historyData || []).reduce((sum, h) => sum + (h.filesScanned || 0), 0);
  }, [historyData]);

  const threatsCleanedCount = useMemo(() => {
    return (historyData || []).reduce((sum, h) => sum + (h.threatsCleaned || 0), 0);
  }, [historyData]);

  const rateLimit = rateLimitData || null;
  const [resetCountdown, setResetCountdown] = useState<string>("");

  useEffect(() => {
    if (!rateLimit) return;
    const updateTimer = () => {
      const msLeft = new Date(rateLimit.resetAt).getTime() - Date.now();
      if (msLeft <= 0) {
        setResetCountdown("Resetting...");
        return;
      }
      const mins = Math.floor(msLeft / 60000);
      const secs = Math.floor((msLeft % 60000) / 1000);
      setResetCountdown(`Resets in ${mins}m ${secs}s`);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [rateLimit]);

  // Repos filtered by active owner tab and excluding scanned/cleaned ones
  const unscannedRepos = repositories.filter(
    (r) => r.status === "idle" || r.status === "scanning"
  );

  const visibleRepos = activeOwnerTab
      ? unscannedRepos.filter((r) => r.owner === activeOwnerTab)
      : unscannedRepos;

  // Initialize Logs
  const addLog = (message: string, level: ScanLog["level"] = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    setScanLogs((prev) => [{ time: timestamp, level, message }, ...prev]);
  };

  useEffect(() => {
    addLog(`Initiating connection via GitHub...`, "info");
    addLog("Successfully authenticated! Fetched live repository list.", "success");
  }, []);


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
        await cleanFileMutation({
          fullName: repo.fullName,
          filePath: threat.filePath,
          sha: (threat as any).sha,
          cleanedCode: threat.cleanedCode,
          deleteFilePath: (threat as any).deleteFilePath,
          githubLogin: activeOwnerTab,
          repoId: repo.id
        }).unwrap();

        successfullyCleanedIds.add(threat.id);
        addLog(`Patched: ${threat.filePath}`, "success");
      } catch {
        addLog(`Failed to patch: ${threat.filePath}`, "error");
      }
    }

    // Apply all updates at once to avoid stale closures
    setThreatsList((prev) =>
      prev.map((t) => (successfullyCleanedIds.has(t.id) ? { ...t, isCleaned: true } : t))
    );

    // Apply local status overrides for each repo that was modified
    const affectedRepoIds = Array.from(new Set(dirtyThreats.map((t) => t.repoId)));
    const updatedThreats = threatsList.map((t) => (successfullyCleanedIds.has(t.id) ? { ...t, isCleaned: true } : t));

    setLocalRepoStatus((prev) => {
      const next = { ...prev };
      affectedRepoIds.forEach((repoId) => {
        const repoThreatsForThisRepo = updatedThreats.filter((t) => t.repoId === repoId);
        const remainingThreats = repoThreatsForThisRepo.filter((t) => !t.isCleaned).length;
        next[repoId] = {
          status: remainingThreats === 0 ? "cleaned" : "scanned",
          threatsFound: remainingThreats,
        };
      });
      return next;
    });

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
    setLocalRepoStatus((prev) => ({
      ...prev,
      [repoId]: { status: "scanning", threatsFound: 0 }
    }));

    addLog(`Starting live security scan on: ${repo.fullName}`, "info");
    addLog(`Connecting scan logs polling listener...`, "info");

    const pollLogs = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/github/logs?fullName=${repo.fullName}`, {
          headers: {
            "Authorization": `Bearer ${(localStorage.getItem("github_pat") || "") || "default_token"}`,
          }
        });
        if (res.ok) {
          const logs = await res.json();
          setScanLogs(logs);
          const latestProgressLog = [...logs].reverse().find((log: any) => log.progress !== undefined);
          if (latestProgressLog) {
            setScanProgress(latestProgressLog.progress);
          }
        }
      } catch (err) {
        // ignore
      }
    };
    pollLogs();
    const logInterval = setInterval(pollLogs, 500);

    // Also refresh rate limit after scan
    refetchRateLimit();



    try {
      const response = await fetch(`${API_BASE_URL}/github/scan?fullName=${repo.fullName}&repoId=${repo.id}&githubLogin=${activeOwnerTab}`, {
        headers: {
          "Authorization": `Bearer ${(localStorage.getItem("github_pat") || "") || "default_token"}`,
        }
      });


      clearInterval(logInterval);
      setScanProgress(100);
      pollLogs();

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

      setLocalRepoStatus((prev) => ({
        ...prev,
        [repo.id]: {
          status: "scanned",
          threatsFound: mappedThreats.length,
          lastScan: new Date().toLocaleDateString(),
        }
      }));

      if (mappedThreats.length > 0) {
        addLog(`Scan finished. Found ${mappedThreats.length} potential security threat(s).`, "warning");
        setActiveTab("threats");
        setSelectedThreat(mappedThreats[0]);
      } else {
        addLog("Scan finished. Clean codebase! No malware matches detected.", "success");
      }
    } catch (err: any) {
      clearInterval(logInterval);
      addLog(`Scan failed: ${getErrorMessage(err)}`, "error");
      setLocalRepoStatus((prev) => ({
        ...prev,
        [repo.id]: { status: "idle", threatsFound: 0 }
      }));
    } finally {
      setIsScanning(false);
    }
  };

  // Perform File Remediation
  const cleanThreat = async (threatId: string) => {
    setIsCleaning(true);
    const threat = threatsList.find((t) => t.id === threatId);
    if (!threat) return;

    addLog(`Initiating patch via RTK Query mutation for: ${threat.filePath}`, "info");

    try {
      const repo = repositories.find((r) => r.id === threat.repoId);
      const result = await cleanFileMutation({
        fullName: repo?.fullName || "",
        filePath: threat.filePath,
        sha: (threat as any).sha,
        cleanedCode: threat.cleanedCode,
        deleteFilePath: (threat as any).deleteFilePath,
        githubLogin: activeOwnerTab,
        repoId: repo?.id,
        malwareType: threat.malwareType,
        severity: threat.severity
      }).unwrap();

      setThreatsList((prev) =>
        prev.map((t) => (t.id === threatId ? { ...t, isCleaned: true } : t))
      );

      // Check if all threats are cleaned for this repo
      const updatedThreats = threatsList.map((t) => (t.id === threatId ? { ...t, isCleaned: true } : t));
      const repoThreats = updatedThreats.filter((t) => t.repoId === threat.repoId);
      const remainingThreats = repoThreats.filter((t) => !t.isCleaned).length;

      setLocalRepoStatus((prev) => ({
        ...prev,
        [threat.repoId]: {
          status: remainingThreats === 0 ? "cleaned" : "scanned",
          threatsFound: remainingThreats,
        }
      }));

      // Update selected threat view
      setSelectedThreat((prev) => (prev && prev.id === threatId ? { ...prev, isCleaned: true } : prev));
      addLog(`Success! Patched ${threat.filePath}. Reference commit: ${result.commitSha.substring(0, 8)}`, "success");
    } catch (err: any) {
      addLog(`Failed to patch threat: ${getErrorMessage(err)}`, "error");
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
        await cleanFileMutation({
          fullName: repo?.fullName || "",
          filePath: threat.filePath,
          sha: (threat as any).sha,
          cleanedCode: threat.cleanedCode,
          deleteFilePath: (threat as any).deleteFilePath,
          githubLogin: activeOwnerTab,
          repoId: repo?.id,
          malwareType: threat.malwareType,
          severity: threat.severity
        }).unwrap();

        successfullyCleanedIds.add(threat.id);
      } catch {
        // Skip on fail
      }
    }

    setThreatsList((prev) =>
      prev.map((t) => (successfullyCleanedIds.has(t.id) ? { ...t, isCleaned: true } : t))
    );

    const remaining = threatsList.filter(
      (t) => t.repoId === repoId && !t.isCleaned && !successfullyCleanedIds.has(t.id)
    ).length;

    setLocalRepoStatus((prev) => ({
      ...prev,
      [repoId]: {
        status: remaining === 0 ? "cleaned" : "scanned",
        threatsFound: remaining,
      }
    }));

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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 items-stretch">

          {/* My Repositories */}
          <div className="surface border border-border rounded-xl p-5 shadow-sm flex flex-col justify-between gap-3 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-blue-500 to-indigo-500 rounded-b-xl" />
            <div className="flex items-start justify-between">
              <p className="text-[11px] text-secondary-text font-bold uppercase tracking-widest leading-none">My Repositories</p>
              <div className="p-2 bg-blue-500/10 dark:bg-blue-500/15 text-blue-500 rounded-lg">
                <Database className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h3 className="text-3xl font-extrabold text-primary-text leading-none">
                {repositories.filter(r => r.owner === githubLogin).length}
              </h3>
              <p className="text-[11px] text-secondary-text mt-1.5">personal repositories</p>
            </div>
          </div>

          {/* Org Repositories */}
          <div className="surface border border-border rounded-xl p-5 shadow-sm flex flex-col justify-between gap-3 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-violet-500 to-purple-500 rounded-b-xl" />
            <div className="flex items-start justify-between">
              <p className="text-[11px] text-secondary-text font-bold uppercase tracking-widest leading-none">Org Repositories</p>
              <div className="p-2 bg-violet-500/10 dark:bg-violet-500/15 text-violet-500 rounded-lg">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h3 className="text-3xl font-extrabold text-primary-text leading-none">
                {repositories.filter(r => r.owner !== githubLogin).length}
              </h3>
              <p className="text-[11px] text-secondary-text mt-1.5">organization repositories</p>
            </div>
          </div>

          {/* Total Scanned Files */}
          <div className="surface border border-border rounded-xl p-5 shadow-sm flex flex-col justify-between gap-3 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-indigo-500 to-sky-500 rounded-b-xl" />
            <div className="flex items-start justify-between">
              <p className="text-[11px] text-secondary-text font-bold uppercase tracking-widest leading-none">Total Scanned Files</p>
              <div className="p-2 bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-500 rounded-lg">
                <FileCode className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h3 className="text-3xl font-extrabold text-primary-text leading-none">
                {totalFilesScanned}
              </h3>
              <p className="text-[11px] text-secondary-text mt-1.5">files evaluated</p>
            </div>
          </div>

          {/* Pending Threats */}
          <div className="surface border border-border rounded-xl p-5 shadow-sm flex flex-col justify-between gap-3 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-rose-500 to-red-500 rounded-b-xl" />
            <div className="flex items-start justify-between">
              <p className="text-[11px] text-secondary-text font-bold uppercase tracking-widest leading-none">Pending Threats</p>
              <div className="p-2 bg-rose-500/10 dark:bg-rose-500/15 text-rose-500 rounded-lg">
                <ShieldAlert className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h3 className={`text-3xl font-extrabold leading-none ${threatsList.filter(t => !t.isCleaned).length > 0 ? 'text-rose-500' : 'text-primary-text'}`}>
                {threatsList.filter(t => !t.isCleaned).length}
              </h3>
              <p className="text-[11px] text-secondary-text mt-1.5">active indicators</p>
            </div>
          </div>

          {/* Patched & Cleaned */}
          <div className="surface border border-border rounded-xl p-5 shadow-sm flex flex-col justify-between gap-3 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-emerald-500 to-teal-500 rounded-b-xl" />
            <div className="flex items-start justify-between">
              <p className="text-[11px] text-secondary-text font-bold uppercase tracking-widest leading-none">Patched & Cleaned</p>
              <div className="p-2 bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-500 rounded-lg">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h3 className={`text-3xl font-extrabold leading-none ${threatsCleanedCount > 0 ? 'text-emerald-500' : 'text-primary-text'}`}>
                {threatsCleanedCount}
              </h3>
              <p className="text-[11px] text-secondary-text mt-1.5">threats removed</p>
            </div>
          </div>

          {/* API Rate Limit */}
          <div className="surface border border-border rounded-xl p-5 shadow-sm flex flex-col justify-between gap-3 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className={`absolute inset-x-0 bottom-0 h-[3px] rounded-b-xl ${rateLimit ? (rateLimit.remaining < 100 ? 'bg-gradient-to-r from-rose-500 to-red-500' : rateLimit.remaining < 500 ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-emerald-500 to-teal-500') : 'bg-gradient-to-r from-amber-500 to-orange-500'}`} />
            <div className="flex items-start justify-between">
              <p className="text-[11px] text-secondary-text font-bold uppercase tracking-widest leading-none">API Rate Limit</p>
              <button 
                type="button"
                onClick={() => refetchRateLimit()}
                disabled={isFetchingRateLimit}
                className={`p-2 rounded-lg cursor-pointer transition-colors ${rateLimit ? (rateLimit.remaining < 100 ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20' : rateLimit.remaining < 500 ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20' : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20') : 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20'} disabled:opacity-50`}
              >
                <RefreshCw className={`w-4 h-4 ${isFetchingRateLimit ? 'animate-spin' : ''}`} />
              </button>
            </div>
            {rateLimit ? (
              <div className="space-y-2">
                <div className="flex items-baseline gap-1 leading-none">
                  <span className={`text-3xl font-extrabold ${rateLimit.remaining < 100 ? 'text-rose-500' : rateLimit.remaining < 500 ? 'text-amber-500' : 'text-emerald-500'}`}>
                    {rateLimit.remaining.toLocaleString()}
                  </span>
                  <span className="text-[11px] text-secondary-text">/ {rateLimit.limit.toLocaleString()}</span>
                </div>
                <div className="w-full bg-border rounded-full h-1 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${rateLimit.remaining < 100 ? 'bg-rose-500' : rateLimit.remaining < 500 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${(rateLimit.remaining / rateLimit.limit) * 100}%` }}
                  />
                </div>
                <p className="text-[11px] text-secondary-text">{resetCountdown}</p>
              </div>
            ) : (
              <div>
                <h3 className="text-3xl font-extrabold text-primary-text leading-none">—</h3>
                <p className="text-[11px] text-secondary-text mt-1.5">connect to view</p>
              </div>
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
            {ownerTabs.length > 0 && (
              <div className="flex gap-1 overflow-x-auto px-3 pt-3 pb-2 scrollbar-hide">
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
                <span className="text-sm font-semibold text-secondary-text leading-none">
                  {selectedRepoIds.size > 0 ? `${selectedRepoIds.size} selected` : "Select all"}
                </span>
              </label>

              <div className="flex items-center gap-1.5">

                {selectedRepoIds.size > 0 && (
                  <button
                    type="button"
                    onClick={bulkScan}
                    disabled={isBulkScanning || isScanning}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-sm hover:shadow transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <Play className="w-4 h-4" />
                    Scan {selectedRepoIds.size}
                  </button>
                )}
                {threatsList.filter((t) => !t.isCleaned).length > 0 && (
                  <button
                    type="button"
                    onClick={bulkCleanAll}
                    disabled={isCleaning}
                    className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg shadow-sm hover:shadow transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clean All
                  </button>
                )}
              </div>
            </div>

            {/* Repo List */}
            <div className="divide-y divide-border flex-1 overflow-y-auto">
              {(reposError || orgsError) && (
                <div className="mx-4 my-3 p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-lg flex items-start gap-2.5 shadow-sm text-status-danger text-xs font-medium">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold">GitHub Connection Error</p>
                    <p className="opacity-90">{getErrorMessage(reposError || orgsError)}</p>
                  </div>
                </div>
              )}
              {visibleRepos.length === 0 && (
                <div className="px-5 py-10 text-center text-xs text-secondary-text">No repositories found for this owner.</div>
              )}
              {visibleRepos.map((repo) => {
                const isSelected = selectedRepoId === repo.id;
                const isChecked = selectedRepoIds.has(repo.id);

                return (
                  <div
                    key={repo.id}
                    className={`px-5 py-4 transition-all duration-300 cursor-pointer relative group ${isSelected
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
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              startScan(repo.id);
                            }}
                            disabled={isScanning || isBulkScanning}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-md flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
                          >
                            <Play className="w-3 h-3" />
                            Scan
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
                  <div className="py-10 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-full animate-pulse border border-blue-500/10">
                      <RefreshCw className="w-8 h-8 animate-spin" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-primary-text animate-pulse">Scanning Directory Tree...</h3>
                      <p className="text-xs text-secondary-text mt-1 max-w-sm">
                        Reading repository file contents. Comparing buffer streams against malicious regex signatures.
                      </p>
                    </div>

                    <div className="w-full max-w-md bg-light-background rounded-full h-2 overflow-hidden shadow-inner">
                      <div
                        className="bg-blue-600 h-full transition-all duration-100"
                        style={{ width: `${scanProgress}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{scanProgress}% completed</span>

                    {/* Auditing File Animation Feed */}
                    {recentlyAuditedFiles.length > 0 && (
                      <div className="w-full bg-slate-900/95 dark:bg-slate-950/95 border border-slate-700/50 p-4.5 rounded-xl text-left space-y-2.5 font-mono text-[12px] shadow-xl relative overflow-hidden">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                          <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Live Audit Trace</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                        </div>
                        <div className="space-y-2">
                          {recentlyAuditedFiles.map((file, idx) => (
                            <div
                              key={file}
                              className={`flex items-center gap-2.5 overflow-hidden text-ellipsis whitespace-nowrap transition-all duration-300 ${
                                idx === 0 
                                  ? "text-blue-400 font-bold opacity-100 scale-100 translate-y-0" 
                                  : idx === 1 
                                    ? "text-slate-300 opacity-70 scale-95 translate-y-0.5" 
                                    : "text-slate-500 opacity-40 scale-90 translate-y-1"
                              }`}
                            >
                              <span className="shrink-0 text-blue-500">🔍</span>
                              <span className="select-all break-all">{file}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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
                            {repo.status !== "idle" && (
                              <div className="mt-4 flex flex-col items-center gap-2 max-w-xs">
                                <button
                                  onClick={() => archiveRepoAPI(repo.id)}
                                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors cursor-pointer shadow-sm shadow-blue-600/20"
                                >
                                  Move to Scanned
                                </button>
                              </div>
                            )}
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
