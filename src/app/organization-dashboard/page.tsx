import React from 'react';

import { organizationMockData } from '@/lib/organizationMockData';

// Mock function to fetch the profile. In production, this would call OrganizationalIntelligenceService
async function fetchOrganizationProfile() {
  // Since we don't have a database wired up, we'll return a static mock that matches the API
  return organizationMockData;
}

export default async function OrganizationDashboardPage() {
  const profile = await fetchOrganizationProfile();
  const metrics = profile.enterpriseMetrics;
  const trends = profile.trendMetrics;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 p-8 font-sans">
      <header className="mb-8 border-b border-neutral-200 dark:border-neutral-800 pb-4">
        <h1 className="text-3xl font-bold tracking-tight">Organizational Intelligence</h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-2">
          Enterprise-wide operational facts, financial exposure, and performance trends.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* KPI Cards */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 p-6">
          <span className="block text-xs text-neutral-500 uppercase tracking-wider mb-2">Enterprise Spend</span>
          <span className="text-3xl font-bold">${(metrics.totalEnterpriseSpend / 1000000).toFixed(1)}M</span>
        </div>
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 p-6">
          <span className="block text-xs text-neutral-500 uppercase tracking-wider mb-2">Total Exposure</span>
          <span className="text-3xl font-bold text-amber-500">${(metrics.enterpriseFinancialExposure / 1000000).toFixed(2)}M</span>
        </div>
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 p-6">
          <span className="block text-xs text-neutral-500 uppercase tracking-wider mb-2">Prevented Losses</span>
          <span className="text-3xl font-bold text-emerald-500">${(metrics.preventedLosses / 1000).toFixed(0)}K</span>
        </div>
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 p-6">
          <span className="block text-xs text-neutral-500 uppercase tracking-wider mb-2">Audit Productivity</span>
          <span className="text-3xl font-bold">{metrics.auditProductivity}%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Exposure Breakdown */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Financial Exposure</h2>
          <div className="flex items-center space-x-8 mb-6">
            <div>
              <span className="block text-sm text-neutral-500">Open Exposure</span>
              <span className="text-2xl font-bold text-rose-500">${(metrics.openExposure / 1000).toFixed(0)}K</span>
            </div>
            <div>
              <span className="block text-sm text-neutral-500">Resolved Exposure</span>
              <span className="text-2xl font-bold text-emerald-500">${(metrics.resolvedExposure / 1000).toFixed(0)}K</span>
            </div>
          </div>
          <div className="h-4 flex rounded-full overflow-hidden bg-neutral-100">
            <div className="bg-rose-500" style={{ width: `${(metrics.openExposure / metrics.enterpriseFinancialExposure) * 100}%` }}></div>
            <div className="bg-emerald-500" style={{ width: `${(metrics.resolvedExposure / metrics.enterpriseFinancialExposure) * 100}%` }}></div>
          </div>
        </div>

        {/* Operational Performance */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 p-6">
          <h2 className="text-lg font-semibold mb-4">Operational Performance</h2>
          <div className="space-y-4">
            <div>
              <span className="flex justify-between text-sm mb-1"><span>Process Compliance</span> <span>{metrics.processCompliance}%</span></span>
              <div className="h-2 bg-neutral-100 dark:bg-neutral-700 rounded-full"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${metrics.processCompliance}%` }}></div></div>
            </div>
            <div>
              <span className="flex justify-between text-sm mb-1"><span>Avg Processing Time</span> <span>{metrics.averageEnterpriseProcessingTimeDays} days</span></span>
              <div className="h-2 bg-neutral-100 dark:bg-neutral-700 rounded-full"><div className="h-full bg-blue-500 rounded-full" style={{ width: '45%' }}></div></div>
            </div>
            <div>
              <span className="flex justify-between text-sm mb-1"><span>Avg Resolution Time</span> <span>{metrics.averageEnterpriseResolutionTimeDays} days</span></span>
              <div className="h-2 bg-neutral-100 dark:bg-neutral-700 rounded-full"><div className="h-full bg-amber-500 rounded-full" style={{ width: '70%' }}></div></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Intelligence Heatmaps (Placeholder for visuals) */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 p-6">
          <h2 className="text-lg font-semibold mb-4">Risk Heatmap: Vendors</h2>
          <div className="aspect-video bg-neutral-100 dark:bg-neutral-900 rounded-lg flex items-center justify-center border border-dashed border-neutral-300 dark:border-neutral-700 relative overflow-hidden">
             <div className="absolute inset-0 opacity-20 bg-gradient-to-tr from-rose-500 via-amber-500 to-emerald-500"></div>
             <span className="text-sm font-medium z-10">{profile.trendMetrics.deterioratingVendorCount} Deteriorating Vendors Detected</span>
          </div>
        </div>
        
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 p-6">
          <h2 className="text-lg font-semibold mb-4">Risk Heatmap: Departments</h2>
          <div className="aspect-video bg-neutral-100 dark:bg-neutral-900 rounded-lg flex items-center justify-center border border-dashed border-neutral-300 dark:border-neutral-700 relative overflow-hidden">
             <div className="absolute inset-0 opacity-20 bg-gradient-to-br from-amber-500 via-emerald-500 to-blue-500"></div>
             <span className="text-sm font-medium z-10">{profile.trendMetrics.improvingDepartmentCount} Improving Departments Detected</span>
          </div>
        </div>
      </div>
    </div>
  );
}
