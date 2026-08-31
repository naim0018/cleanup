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
  ShieldCheck,
  ShieldAlert,
  RefreshCw,
  Database,
  Building2,
  AlertTriangle,
  FileCode,
  Check,
  Play,
  ArrowRight,
  Flame,
  Bug,
  Info
} from "lucide-react";
import { Link } from "react-router-dom";

// Types matching Home.tsx
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

export default function Scanned() {
  // RTK Query hooks
  const { data: orgsData, error: orgsError } = useGetGithubOrgsQuery();
  const userLogin = orgsData?.user?.login || "";
  const { data: historyData } = useGetGithubHistoryQuery(userLogin, { skip: !userLogin });
  const { data: reposData, error: reposError } = useGetGithubReposQuery();
  const { data: rateLimitData, refetch: refetchRateLimit } = useGetGithubRateLimitQuery(undefined, {
    pollingInterval: 30000,
  });
  const [cleanFileMutation] = useCleanRepositoryFileMutation();

  const [localRepoStatus, setLocalRepoStatus] = useState<Record<number, { status: Repository["status"]; threatsFound: number; lastScan?: string }>>({});

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
          }
        : r;
      if (localRepoStatus[r.id]) {
        repo = {
          ...repo,
          ...localRepoStatus[r.id],
        };
      }
      return repo;
    });
  }, [reposData, historyData, localRepoStatus]);

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
    }
  }, [historyData]);

  // Tabs: "own" | "org"
  const [activeFilterTab, setActiveFilterTab] = useState<"own" | "org">("own");

  // Selection & Scanning
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

  // Stats
  const totalFilesScanned = useMemo(() => {
    return (historyData || []).reduce((sum: number, h: any) => sum + (h.filesScanned || 0), 0);
  }, [historyData]);

  const threatsCleanedCount = useMemo(() => {
    return (historyData || []).reduce((sum: number, h: any) => sum + (h.threatsCleaned || 0), 0);
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

  const addLog = (message: string, level: ScanLog["level"] = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    setScanLogs((prev) => [{ time: timestamp, level, message }, ...prev]);
  };

  useEffect(() => {
    addLog(`Loading history and scanned repositories...`, "info");
  }, []);

  const startScan = async (repoId: number) => {
    const repo = repositories.find((r) => r.id === repoId);
    if (!repo) return;

    setSelectedRepoId(repoId);
    setIsScanning(true);
    setScanProgress(0);
    setActiveTab("scan");
    setSelectedThreat(null);

    setLocalRepoStatus((prev) => ({
      ...prev,
      [repoId]: { status: "scanning", threatsFound: 0 }
    }));

    addLog(`Re-scanning security status on: ${repo.fullName}`, "info");
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

    refetchRateLimit();



    try {
      const response = await fetch(`${API_BASE_URL}/github/scan?fullName=${repo.fullName}&repoId=${repo.id}&githubLogin=${userLogin}`, {
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
        addLog(`Re-scan finished. Found ${mappedThreats.length} security threat(s).`, "warning");
        setActiveTab("threats");
        setSelectedThreat(mappedThreats[0]);
      } else {
        addLog("Re-scan finished. Clean codebase! No malware detected.", "success");
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

  const cleanThreat = async (threatId: string) => {
    setIsCleaning(true);
    const threat = threatsList.find((t) => t.id === threatId);
    if (!threat) return;

    addLog(`Initiating patch for: ${threat.filePath}`, "info");

    try {
      const repo = repositories.find((r) => r.id === threat.repoId);
      const result = await cleanFileMutation({
        fullName: repo?.fullName || "",
        filePath: threat.filePath,
        sha: (threat as any).sha,
        cleanedCode: threat.cleanedCode,
        deleteFilePath: (threat as any).deleteFilePath,
        githubLogin: userLogin,
        repoId: repo?.id,
        malwareType: threat.malwareType,
        severity: threat.severity
      }).unwrap();

      setThreatsList((prev) =>
        prev.map((t) => (t.id === threatId ? { ...t, isCleaned: true } : t))
      );

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

      setSelectedThreat((prev) => (prev && prev.id === threatId ? { ...prev, isCleaned: true } : prev));
      addLog(`Patched ${threat.filePath}. Commit: ${result.commitSha.substring(0, 8)}`, "success");
    } catch (err: any) {
      addLog(`Failed to patch: ${getErrorMessage(err)}`, "error");
    } finally {
      setIsCleaning(false);
    }
  };

  // Filter scanned repositories by active filter tab
  const scannedRepos = repositories.filter(
    (r) => r.status === "scanned" || r.status === "cleaned"
  );

  const visibleRepos = scannedRepos.filter((r) => {
    if (activeFilterTab === "own") {
      return r.owner === userLogin;
    } else {
      return r.owner !== userLogin;
    }
  });

  const activeRepo = repositories.find((r) => r.id === selectedRepoId);
  const activeRepoThreats = threatsList.filter((t) => t.repoId === selectedRepoId);

  return (
    <div className="p-8 w-full min-h-[calc(100vh-5rem)]">
      <div className="w-full space-y-8">
        
        {/* Global Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-stretch">

          {/* My Scanned Repos */}
          <div className="surface border border-border rounded-xl p-5 shadow-sm flex flex-col justify-between gap-3 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-blue-500 to-indigo-500 rounded-b-xl" />
            <div className="flex items-start justify-between">
              <p className="text-[11px] text-secondary-text font-bold uppercase tracking-widest leading-none">My Scanned Repos</p>
              <div className="p-2 bg-blue-500/10 dark:bg-blue-500/15 text-blue-500 rounded-lg">
                <Database className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h3 className="text-3xl font-extrabold text-primary-text leading-none">
                {scannedRepos.filter(r => r.owner === userLogin).length}
              </h3>
              <p className="text-[11px] text-secondary-text mt-1.5">personal repositories</p>
            </div>
          </div>

          {/* Org Scanned Repos */}
          <div className="surface border border-border rounded-xl p-5 shadow-sm flex flex-col justify-between gap-3 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-violet-500 to-purple-500 rounded-b-xl" />
            <div className="flex items-start justify-between">
              <p className="text-[11px] text-secondary-text font-bold uppercase tracking-widest leading-none">Org Scanned Repos</p>
              <div className="p-2 bg-violet-500/10 dark:bg-violet-500/15 text-violet-500 rounded-lg">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h3 className="text-3xl font-extrabold text-primary-text leading-none">
                {scannedRepos.filter(r => r.owner !== userLogin).length}
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
              <div className={`p-2 rounded-lg ${rateLimit ? (rateLimit.remaining < 100 ? 'bg-rose-500/10 text-rose-500' : rateLimit.remaining < 500 ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500') : 'bg-amber-500/10 text-amber-500'}`}>
                <RefreshCw className="w-4 h-4" />
              </div>
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

        {/* Scanned Repos view layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Scanned repositories list column */}
          <div className="lg:col-span-4 surface border border-border rounded-xl p-6 space-y-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-primary-text flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                Scanned Repositories
              </h2>
              <span className="px-2.5 py-1 text-xs font-bold bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-full">
                {scannedRepos.length} Total
              </span>
            </div>

            {/* Own vs Org Filter Tabs */}
            <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
              <button
                onClick={() => setActiveFilterTab("own")}
                className={`flex-1 py-2 text-xs font-bold rounded-md transition-all cursor-pointer ${activeFilterTab === "own" ? "bg-white dark:bg-slate-800 text-primary-text shadow-sm" : "text-secondary-text hover:text-primary-text"}`}
              >
                My Repos
              </button>
              <button
                onClick={() => setActiveFilterTab("org")}
                className={`flex-1 py-2 text-xs font-bold rounded-md transition-all cursor-pointer ${activeFilterTab === "org" ? "bg-white dark:bg-slate-800 text-primary-text shadow-sm" : "text-secondary-text hover:text-primary-text"}`}
              >
                Org Repos
              </button>
            </div>

            {/* List */}
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {(reposError || orgsError) && (
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-lg flex items-start gap-2.5 shadow-sm text-status-danger text-xs font-medium">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold">GitHub Connection Error</p>
                    <p className="opacity-90">{getErrorMessage(reposError || orgsError)}</p>
                  </div>
                </div>
              )}
              {visibleRepos.length === 0 ? (
                <div className="text-center py-8">
                  <Database className="w-8 h-8 text-secondary-text/30 mx-auto mb-2" />
                  <p className="text-xs text-secondary-text">No scanned repositories found in this tab.</p>
                </div>
              ) : (
                visibleRepos.map((repo) => {
                  const isSelected = selectedRepoId === repo.id;
                  return (
                    <div
                      key={repo.id}
                      onClick={() => {
                        setSelectedRepoId(repo.id);
                        setSelectedThreat(null);
                        setActiveTab("scan");
                      }}
                      className={`group p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? "border-indigo-600 bg-indigo-50/10 dark:bg-indigo-950/15"
                          : "border-border hover:border-slate-300 dark:hover:border-slate-700 bg-light-background"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="font-semibold text-sm text-primary-text truncate max-w-[180px]">
                          {repo.name}
                        </div>
                        <div className="flex gap-1.5">
                          {repo.status === "cleaned" ? (
                            <span className="px-1.5 py-0.5 text-[9px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded border border-emerald-200 dark:border-emerald-900">
                              Clean
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 text-[9px] font-bold bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 rounded border border-rose-200 dark:border-rose-900">
                              {repo.threatsFound} Threat(s)
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-[10px] text-secondary-text mt-1 truncate">{repo.description || "No description provided."}</p>

                      <div className="mt-3 flex items-center justify-between text-[9px] text-secondary-text font-bold">
                        <span>{repo.language}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            startScan(repo.id);
                          }}
                          disabled={isScanning}
                          className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Play className="w-1.5 h-1.5" />
                          Rescan
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Details column (Only visible when a repo is selected) */}
          <div className="lg:col-span-8 space-y-6">
            {!activeRepo ? (
              <div className="surface border border-border rounded-xl p-12 text-center shadow-sm">
                <ShieldCheck className="w-12 h-12 text-indigo-500/20 mx-auto mb-4" />
                <h3 className="font-bold text-primary-text">Select a scanned repository</h3>
                <p className="text-sm text-secondary-text mt-1">Choose a repo from the sidebar to review scan logs and resolve any pending security threats.</p>
              </div>
            ) : (
              <div className="surface border border-border rounded-xl p-6 shadow-sm space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-primary-text">{activeRepo.fullName}</h3>
                    <p className="text-xs text-secondary-text mt-1">{activeRepo.description}</p>
                  </div>
                  <button
                    onClick={() => startScan(activeRepo.id)}
                    disabled={isScanning}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-md text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md"
                  >
                    <Play className="w-3 h-3" />
                    Rescan Codebase
                  </button>
                </div>

                {/* Workspace tab selectors */}
                <div className="flex border-b border-border">
                  <button
                    onClick={() => setActiveTab("scan")}
                    className={`px-4 py-2.5 text-xs font-bold border-b-2 cursor-pointer transition-all ${
                      activeTab === "scan"
                        ? "border-indigo-600 text-indigo-600"
                        : "border-transparent text-secondary-text hover:text-primary-text"
                    }`}
                  >
                    Auditor Console
                  </button>
                  <button
                    onClick={() => setActiveTab("threats")}
                    className={`px-4 py-2.5 text-xs font-bold border-b-2 cursor-pointer transition-all flex items-center gap-1.5 ${
                      activeTab === "threats"
                        ? "border-indigo-600 text-indigo-600"
                        : "border-transparent text-secondary-text hover:text-primary-text"
                    }`}
                  >
                    Threat Detections
                    {activeRepoThreats.length > 0 && (
                      <span className="px-1.5 py-0.5 text-[9px] font-bold bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 rounded-full">
                        {activeRepoThreats.filter(t => !t.isCleaned).length}
                      </span>
                    )}
                  </button>
                </div>

                {/* Tab Contents */}
                {activeTab === "scan" && (
                  <div className="space-y-4">
                    {/* Live scan console logs */}
                    <div className="bg-slate-950 dark:bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono text-[11px] text-slate-300 h-64 overflow-y-auto space-y-1">
                      {isScanning && (
                        <div className="flex flex-col space-y-3.5 mb-4 border-b border-border/40 pb-4">
                          <div className="text-blue-400 flex items-center justify-between text-xs font-bold animate-pulse">
                            <span className="flex items-center gap-2">
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              Re-scanning repository files...
                            </span>
                            <span>{scanProgress}%</span>
                          </div>
                          
                          {/* Live Scan Progress Bar */}
                          <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-blue-600 h-full transition-all duration-100" style={{ width: `${scanProgress}%` }} />
                          </div>

                          {/* Rolling files animation */}
                          {recentlyAuditedFiles.length > 0 && (
                            <div className="space-y-2 p-4.5 rounded-xl bg-slate-900/95 dark:bg-slate-950/95 border border-slate-700/50 font-mono text-[12px] text-left">
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
                          )}
                        </div>
                      )}
                      {scanLogs.length === 0 ? (
                        <p className="text-slate-500">Awaiting console scanner output... Click Rescan to stream logs.</p>
                      ) : (
                        scanLogs.map((log, index) => (
                          <div key={index} className="flex gap-2">
                            <span className="text-slate-600">[{log.time}]</span>
                            <span
                              className={
                                log.level === "error"
                                  ? "text-rose-500 font-bold"
                                  : log.level === "warning"
                                  ? "text-amber-500 font-semibold"
                                  : log.level === "success"
                                  ? "text-emerald-500 font-semibold"
                                  : "text-slate-400"
                              }
                            >
                              {log.message}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "threats" && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Detections sidebar list */}
                    <div className="lg:col-span-4 space-y-2.5 max-h-[350px] overflow-y-auto">
                      {activeRepoThreats.length === 0 ? (
                        <div className="text-center py-12 border border-dashed border-border rounded-xl">
                          <ShieldCheck className="w-8 h-8 text-emerald-500/25 mx-auto mb-2" />
                          <p className="text-xs text-secondary-text font-semibold">No threats detected.</p>
                        </div>
                      ) : (
                        activeRepoThreats.map((threat) => (
                          <div
                            key={threat.id}
                            onClick={() => setSelectedThreat(threat)}
                            className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                              selectedThreat?.id === threat.id
                                ? "border-rose-600 bg-rose-500/5"
                                : "border-border hover:border-slate-300 dark:hover:border-slate-700 bg-light-background"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] uppercase font-bold text-rose-500 tracking-wider">
                                {threat.severity}
                              </span>
                              {threat.isCleaned && (
                                <span className="px-1.5 py-0.2 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 rounded text-[9px] font-bold">
                                  Patched
                                </span>
                              )}
                            </div>
                            <h4 className="text-xs font-bold text-primary-text mt-1.5 truncate">
                              {threat.filePath.split("/").pop()}
                            </h4>
                            <p className="text-[9px] text-secondary-text mt-1 truncate">{threat.filePath}</p>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Threat Code View Workspace */}
                    <div className="lg:col-span-8 border border-border rounded-xl p-5 bg-light-background space-y-4">
                      {!selectedThreat ? (
                        <div className="text-center py-16">
                          <Bug className="w-8 h-8 text-secondary-text/30 mx-auto mb-2" />
                          <p className="text-xs text-secondary-text font-bold">Select threat signature to preview payload</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500">
                                {selectedThreat.severity} Severity
                              </span>
                              <h4 className="font-bold text-sm text-primary-text mt-0.5">{selectedThreat.malwareType}</h4>
                              <p className="text-[10px] text-slate-500 font-mono mt-1">{selectedThreat.filePath}</p>
                            </div>
                            {!selectedThreat.isCleaned && (
                              <button
                                onClick={() => cleanThreat(selectedThreat.id)}
                                disabled={isCleaning}
                                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow"
                              >
                                {isCleaning ? "Cleaning..." : "Clean File"}
                              </button>
                            )}
                          </div>

                          <div className="rounded-lg bg-slate-950 p-4 font-mono text-[10px] overflow-x-auto text-slate-200">
                            <span className="text-rose-400 font-bold block mb-1">
                              // Line {selectedThreat.line} Matches: {selectedThreat.matchedPattern}
                            </span>
                            <pre className="text-rose-300 bg-rose-950/20 p-2 rounded border border-rose-900/30 overflow-x-auto">
                              {selectedThreat.originalCode}
                            </pre>
                            {selectedThreat.isCleaned && (
                              <div className="mt-3">
                                <span className="text-emerald-400 font-bold block mb-1">// Cleaned Replacements:</span>
                                <pre className="text-emerald-300 bg-emerald-950/20 p-2 rounded border border-emerald-900/30 overflow-x-auto">
                                  {selectedThreat.cleanedCode}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
