import React from 'react';

export default function EnterpriseControlTower() {
  return (
    <div className="p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Enterprise Control Tower</h1>
        <p className="text-[#9CA3AF] mt-2">
          Autonomous Audit Operating System — Continuous Monitoring & Risk Orchestration
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#181B21] p-6 rounded-xl shadow-md border border-[#2A2E37] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:border-[#5E6AD2]/50">
          <h3 className="text-sm font-semibold text-[#9CA3AF] uppercase tracking-wider">Autonomous Resolutions</h3>
          <p className="text-3xl font-bold text-emerald-400 mt-2 tabular-nums">1,248</p>
          <p className="text-xs text-[#9CA3AF] mt-1">Exceptions resolved without human intervention</p>
        </div>
        <div className="bg-[#181B21] p-6 rounded-xl shadow-md border border-[#2A2E37] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:border-[#5E6AD2]/50">
          <h3 className="text-sm font-semibold text-[#9CA3AF] uppercase tracking-wider">Financial Leakage Prevented</h3>
          <p className="text-3xl font-bold text-[#22D3EE] mt-2 tabular-nums">$4.2M</p>
          <p className="text-xs text-[#9CA3AF] mt-1">Identified and blocked proactively</p>
        </div>
        <div className="bg-[#181B21] p-6 rounded-xl shadow-md border border-[#2A2E37] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:border-[#5E6AD2]/50">
          <h3 className="text-sm font-semibold text-[#9CA3AF] uppercase tracking-wider">Active Policy Violations</h3>
          <p className="text-3xl font-bold text-rose-400 mt-2 tabular-nums">12</p>
          <p className="text-xs text-[#9CA3AF] mt-1">Requiring immediate executive review</p>
        </div>
      </div>

      <div className="bg-[#181B21]/80 backdrop-blur-md rounded-xl shadow-lg border border-[#2A2E37] p-6">
        <h2 className="text-xl font-semibold mb-4 text-white tracking-tight">Recent Autonomous Actions</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#2A2E37]">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">Transaction ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">Risk Confidence</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">Action Taken</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">Time</th>
              </tr>
            </thead>
            <tbody className="bg-transparent divide-y divide-[#2A2E37]">
              <tr className="hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">tx-sap-98214</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-[#9CA3AF] tabular-nums">96.5%</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-md border bg-rose-500/10 text-rose-400 border-rose-500/20">Payment Blocked</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-[#9CA3AF]">Just now</td>
              </tr>
              <tr className="hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">po-oracle-45902</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-[#9CA3AF] tabular-nums">91.2%</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-md border bg-amber-500/10 text-amber-400 border-amber-500/20">Escalated to Review</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-[#9CA3AF]">12 mins ago</td>
              </tr>
              <tr className="hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">tx-sap-98213</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-[#9CA3AF] tabular-nums">89.8%</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-md border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Auto-Approved</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-[#9CA3AF]">1 hour ago</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
