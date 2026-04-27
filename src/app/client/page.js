"use client";

import { useState, useEffect } from "react";

export default function ClientDashboard() {
  const [updateStatus, setUpdateStatus] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [version, setVersion] = useState("1.0.0");
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Initial fetch to get current state
    fetch("/api/robot")
      .then((res) => res.json())
      .then((data) => {
        if (data.version) setVersion(data.version);
        if (data.status) setUpdateStatus(data.status);
        if (data.github_url && data.target_version && data.version !== data.target_version) setUpdateAvailable(true);
        else setUpdateAvailable(false);
      });

    // Polling mechanism every 3 seconds to check status
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/robot");
        const data = await res.json();
        
        if (data.version) setVersion(data.version);
        if (data.github_url && data.target_version && data.version !== data.target_version) setUpdateAvailable(true); // "sees" the link here and checks if it's new!
        else setUpdateAvailable(false);

        setUpdateStatus((prev) => {
          // If the backend robot manually updates status to success
          if (prev === "updating" && data.status === "success") {
            setProgress(100);
            setTimeout(() => setUpdateStatus("idle"), 5000);
            return "success";
          }
          if (prev === "idle" && data.status === "updating") {
            return "updating";
          }
          return prev;
        });
      } catch (e) {
        console.error(e);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Visual progress animation independently managed while waiting
    let interval;
    if (updateStatus === "updating" && progress < 90) {
      interval = setInterval(() => {
        setProgress((p) => (p >= 90 ? 90 : p + 5));
      }, 300);
    }
    return () => clearInterval(interval);
  }, [updateStatus, progress]);

  // Fallback testing local simulation since API currently doesn't simulate real robots 
  useEffect(() => {
    if (updateStatus === "updating") {
       // Increased simulation time to 15 seconds so you have time to check the API!
       const sim = setTimeout(async () => {
          try {
            await fetch("/api/robot", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ apply_update: true }),
            });
          } catch(e) {
            console.error(e);
          }
       }, 15000);
       return () => clearTimeout(sim);
    }
  }, [updateStatus]);

  const handleUpdate = async () => {
    if (updateStatus === "updating" || !updateAvailable) return;

    setUpdateStatus("updating");
    setProgress(0);

    console.log("Triggering client update check...");
    try {
      await fetch("/api/robot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trigger_update: true }),
      });
    } catch (e) {
      console.error(e);
      setUpdateStatus("idle");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-500/30 transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-xl font-extrabold tracking-tight">My Robot Assistant</h1>
            
            {/* Status Badge */}
            <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-500/10 dark:text-green-400 border border-green-200 dark:border-green-500/20">
              <span className="w-2 h-2 mr-1.5 bg-green-500 rounded-full animate-pulse"></span>
              Connected
            </span>
          </div>
          
          <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex justify-center items-start min-h-[calc(100vh-64px)]">
        
        {/* Central Dashboard Card */}
        <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-3xl shadow-xl dark:shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden relative">
          
          {/* Decorative Top Accent */}
          <div className="h-2 w-full bg-blue-500"></div>

          <div className="p-8 sm:p-10">
            
            <div className="text-center mb-10">
              <div className="mx-auto w-20 h-20 bg-blue-50 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-blue-100 dark:border-blue-500/20 transform hover:scale-105 transition-transform">
                <svg className="w-10 h-10 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Robot System Panel</h2>
              <p className="text-slate-500 dark:text-slate-400 mt-2">Manage settings and keep your robot healthy.</p>
            </div>

            {/* Version & Status Area */}
            <div className="space-y-6 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Current Version</span>
                <span className="text-base font-bold text-slate-800 dark:text-slate-200 tracking-wide font-mono bg-white dark:bg-slate-800 px-3 py-1 rounded-md shadow-sm border border-slate-200 dark:border-slate-700">
                  v{version}
                </span>
              </div>

              {/* Progress/Health Meter Line */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">System Readiness</span>
                  <span className={`text-xs font-semibold ${updateStatus === 'idle' && updateAvailable ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'}`}>
                    {updateStatus === 'idle' ? (updateAvailable ? 'Update Available' : 'System Up-to-Date') : updateStatus === 'updating' ? `${progress}%` : 'System Up-to-Date'}
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ease-out flex items-center justify-end relative
                      ${updateStatus === 'idle' ? (updateAvailable ? 'bg-blue-500 animate-pulse w-full' : 'bg-slate-400 w-full opacity-60') : updateStatus === 'success' ? 'bg-emerald-500 w-full' : 'bg-blue-500'}`}
                    style={{ width: updateStatus === 'updating' ? `${progress}%` : undefined }}
                  >
                    {updateStatus === 'updating' && <div className="absolute top-0 bottom-0 left-0 right-0 bg-white/20 animate-pulse"></div>}
                  </div>
                </div>
                
                {updateStatus === 'updating' && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 text-center animate-pulse font-medium">
                    Fetching new code from cloud...
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons Area */}
            <div className="mt-8 relative">
              <button
                onClick={handleUpdate}
                disabled={updateStatus !== 'idle' || !updateAvailable}
                className={`w-full flex items-center justify-center py-4 px-6 rounded-xl text-base font-bold text-white transition-all duration-200 shadow-md ${
                  updateStatus === 'updating' || (!updateAvailable && updateStatus === 'idle')
                    ? 'bg-blue-400 dark:bg-blue-600 cursor-not-allowed opacity-60'
                    : updateStatus === 'success'
                    ? 'bg-emerald-500 hover:bg-emerald-600'
                    : 'bg-blue-600 hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-900'
                }`}
              >
                {updateStatus === 'idle' && (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    {updateAvailable ? 'Install Latest Firmware' : 'No Updates Available'}
                  </>
                )}
                
                {updateStatus === 'updating' && (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </>
                )}

                {updateStatus === 'success' && (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                    Firmware Up-to-Date
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Toast Notification Area */}
      <div className={`fixed bottom-6 right-6 transition-all duration-500 ease-in-out z-50 ${
        updateStatus === 'success' ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0 pointer-events-none'
      }`}>
        <div className="bg-emerald-50 dark:bg-emerald-900 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-100 px-6 py-4 rounded-xl shadow-lg flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-800 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h4 className="font-bold text-sm">Update Completed Successfully</h4>
            <p className="text-xs opacity-80 mt-0.5">Your robot assistant is now running v{version} and is perfectly healthy.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
