import React from 'react';
import { ExecutiveIntelligenceProfile } from '@/lib/executiveIntelligence';
import { getMockExecutiveProfile } from '@/lib/executiveMockData';

async function fetchExecutiveProfile(): Promise<ExecutiveIntelligenceProfile> {
  return getMockExecutiveProfile();
}

export default async function CommandCenterPage() {
  const profile = await fetchExecutiveProfile();

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 p-8 font-sans">
      <header className="mb-8 border-b border-neutral-200 dark:border-neutral-800 pb-4">
        <h1 className="text-3xl font-bold tracking-tight">Executive Command Center</h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-2">
          Strategic visibility into enterprise risk, procurement health, and compliance.
        </p>
        <div className="text-xs text-neutral-400 mt-4">
          Last Updated: {new Date(profile.metadata.generatedAt).toLocaleString()} &bull; 
          Intelligence Version: {profile.metadata.intelligenceVersion}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Enterprise Risk View */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 p-6 flex flex-col">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-4">Enterprise Risk View</h2>
          <div className="flex-1 flex flex-col justify-center">
            <div className="mb-4">
              <span className="block text-xs text-neutral-400 mb-1">Enterprise Trend</span>
              <span className={`text-2xl font-bold ${profile.strategicIndicators.enterpriseTrend === 'IMPROVING' ? 'text-emerald-500' : profile.strategicIndicators.enterpriseTrend === 'DETERIORATING' ? 'text-rose-500' : 'text-amber-500'}`}>
                {profile.strategicIndicators.enterpriseTrend}
              </span>
            </div>
            <div>
              <span className="block text-xs text-neutral-400 mb-1">Operational Stability</span>
              <span className={`text-xl font-medium ${profile.strategicIndicators.operationalStability === 'HIGH' ? 'text-emerald-500' : profile.strategicIndicators.operationalStability === 'LOW' ? 'text-rose-500' : 'text-amber-500'}`}>
                {profile.strategicIndicators.operationalStability}
              </span>
            </div>
          </div>
        </div>

        {/* Procurement Health */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 p-6 flex flex-col">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-4">Procurement Health</h2>
          <div className="flex-1 flex flex-col justify-center">
            <div className="mb-4">
              <span className="block text-xs text-neutral-400 mb-1">Total Procurement Volume</span>
              <span className="text-3xl font-bold">{profile.executiveSummary.totalProcurementVolume.toLocaleString()}</span>
            </div>
            <div>
              <span className="block text-xs text-neutral-400 mb-1">Global Exception Rate</span>
              <span className={`text-2xl font-bold ${(profile.executiveSummary.globalExceptionRate * 100) > 10 ? 'text-rose-500' : 'text-emerald-500'}`}>
                {(profile.executiveSummary.globalExceptionRate * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Financial Exposure Overview */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 p-6 flex flex-col">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-4">Financial Exposure</h2>
          <div className="flex-1 flex flex-col justify-center">
            <div className="mb-4">
              <span className="block text-xs text-neutral-400 mb-1">Total Enterprise Spend</span>
              <span className="text-3xl font-bold">${profile.executiveSummary.totalEnterpriseSpend.toLocaleString()}</span>
            </div>
            <div>
              <span className="block text-xs text-neutral-400 mb-1">Open Financial Exposure</span>
              <span className="text-2xl font-bold text-rose-500">${profile.executiveSummary.totalEnterpriseExposure.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Vendor Risk Rankings */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 p-6 flex flex-col lg:col-span-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-4">
            Vendor Risk Rankings
          </h2>
          <div className="flex-1">
            <div className="space-y-3">
              {profile.strategicIndicators.highestRiskVendors.map((vendor, index) => (
                <div key={vendor.id} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{vendor.name}</div>
                      <div className="font-mono text-xs text-neutral-400">{vendor.id}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-neutral-500">Risk Score</span>
                    <span className={`font-bold ${vendor.riskScore >= 80 ? 'text-rose-500' : 'text-amber-500'}`}>{vendor.riskScore}/100</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Compliance Indicators */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 p-6 flex flex-col">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-4">
            Compliance Indicators
          </h2>
          <div className="flex-1 flex flex-col justify-center space-y-6">
            <div>
              <span className="block text-xs text-neutral-400 mb-1">Process Compliance</span>
              <div className="flex items-center space-x-3">
                <div className="flex-1 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500" 
                    style={{ width: `${profile.strategicIndicators.complianceIndicators.processCompliance}%` }} 
                  />
                </div>
                <span className="font-bold">{profile.strategicIndicators.complianceIndicators.processCompliance.toFixed(1)}%</span>
              </div>
            </div>
            <div>
              <span className="block text-xs text-neutral-400 mb-1">Audit Policy Violations (Est.)</span>
              <span className="text-2xl font-bold text-amber-500">
                {(profile.strategicIndicators.complianceIndicators.globalExceptionRate * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
