"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const [repoUrl, setRepoUrl] = useState("");
  const [targetVersion, setTargetVersion] = useState("");
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentStatus, setDeploymentStatus] = useState(null); // 'success' or null
  const router = useRouter();

  useEffect(() => {
    // Fetch currently stored URL
    fetch("/api/robot")
      .then((res) => res.json())
      .then((data) => {
        if (data.github_url) setRepoUrl(data.github_url);
      })
      .catch((err) => console.error("Failed to fetch initial robot data", err));
  }, []);

  const handleLogout = () => {
    // Navigate back to auth page
    router.push("/auth");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!repoUrl) return;

    setIsDeploying(true);
    setDeploymentStatus(null);
    console.log("Preparing to Push OTA Update from URL:", repoUrl);
    
    try {
      const response = await fetch("/api/robot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ github_url: repoUrl, target_version: targetVersion }),
      });

      if (response.ok) {
        console.log("OTA Update Successfully Pushed to Database!");
        setIsDeploying(false);
        setDeploymentStatus("success");
        setRepoUrl(""); // Clear the input after success
        setTargetVersion(""); // Clear version after success
        
        // Auto-dismiss the success notification after 3.5 seconds
        setTimeout(() => setDeploymentStatus(null), 3500);
      } else {
        throw new Error("Failed to deploy");
      }
    } catch (error) {
      console.error(error);
      setIsDeploying(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500/30">
      {/* Header Navigation */}
      <header className="sticky top-0 z-20 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
               {/* Industrial Robot/Chip Icon */}
               <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
               </svg>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">RobotCore Admin</h1>
          </div>
          <button 
            onClick={handleLogout}
            className="text-sm font-medium text-zinc-400 hover:text-zinc-100 px-4 py-2 rounded-lg hover:bg-zinc-800 transition-colors border border-transparent hover:border-zinc-700 active:scale-95 flex items-center group"
          >
            Logout
            <svg className="w-4 h-4 ml-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Administrative Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 mt-4">
        <div className="max-w-2xl mx-auto">
          
          {/* Main Deployment Form */}
          <div className="space-y-6">
            <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-lg p-6 lg:p-8 shadow-sm relative overflow-hidden group">
              {/* Subtle top border highlight effect */}
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-zinc-600 to-transparent opacity-30 group-hover:opacity-60 transition-opacity"></div>
              
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white tracking-tight flex items-center">
                  Push OTA Update
                </h2>
                <p className="text-zinc-400 mt-2 text-sm leading-relaxed max-w-xl">
                  Enter the GitHub repository ZIP URL to deploy new firmware to the robot. The system will automatically download and reflash the core unit.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="repoUrl" className="block text-sm font-semibold text-zinc-300 mb-2">
                    Firmware Bundle URL
                  </label>
                  <div className="relative rounded-lg shadow-sm group/input">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-zinc-500 group-focus-within/input:text-emerald-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </div>
                    <input
                      type="url"
                      name="repoUrl"
                      id="repoUrl"
                      className="block w-full pl-11 pr-4 py-3.5 bg-zinc-950/80 border border-zinc-700/80 rounded-lg text-zinc-100 placeholder-zinc-600 focus:ring-2 focus:ring-emerald-500 max-w-full focus:border-emerald-500 transition-all font-mono text-sm shadow-inner"
                      placeholder="https://github.com/user/repo/archive/refs/heads/main.zip"
                      value={repoUrl}
                      onChange={(e) => setRepoUrl(e.target.value)}
                      required
                      spellCheck="false"
                      autoComplete="off"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="targetVersion" className="block text-sm font-semibold text-zinc-300 mb-2 mt-4">
                    Target Firmware Version (e.g., 2.0.0)
                  </label>
                  <div className="relative rounded-lg shadow-sm group/input">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-zinc-500 group-focus-within/input:text-emerald-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      name="targetVersion"
                      id="targetVersion"
                      className="block w-full pl-11 pr-4 py-3.5 bg-zinc-950/80 border border-zinc-700/80 rounded-lg text-zinc-100 placeholder-zinc-600 focus:ring-2 focus:ring-emerald-500 max-w-full focus:border-emerald-500 transition-all font-mono text-sm shadow-inner"
                      placeholder="2.0.0"
                      value={targetVersion}
                      onChange={(e) => setTargetVersion(e.target.value)}
                      required
                      spellCheck="false"
                      autoComplete="off"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-zinc-800/80">
                  <div className="flex-1">
                    {deploymentStatus === 'success' && (
                      <div className="flex items-center text-emerald-400 text-sm font-semibold animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center mr-2">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        Update initialized successfully
                      </div>
                    )}
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isDeploying || !repoUrl}
                    className={`inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white transition-all min-w-[160px]
                      ${isDeploying || !repoUrl 
                        ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border-zinc-700/50' 
                        : 'bg-emerald-600 hover:bg-emerald-500 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:-translate-y-0.5 active:translate-y-0'
                      }`}
                  >
                    {isDeploying ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2.5 h-4 w-4 text-emerald-100" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Deploying...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Deploy to Robot
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
