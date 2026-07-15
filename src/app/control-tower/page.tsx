import React from 'react';

export default function EnterpriseControlTower() {
  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Enterprise Control Tower</h1>
        <p className="text-gray-600 mt-2">
          Autonomous Audit Operating System — Continuous Monitoring & Risk Orchestration
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Autonomous Resolutions</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">1,248</p>
          <p className="text-xs text-gray-400 mt-1">Exceptions resolved without human intervention</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Financial Leakage Prevented</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">$4.2M</p>
          <p className="text-xs text-gray-400 mt-1">Identified and blocked proactively</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Active Policy Violations</h3>
          <p className="text-3xl font-bold text-red-600 mt-2">12</p>
          <p className="text-xs text-gray-400 mt-1">Requiring immediate executive review</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-100 p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Autonomous Actions</h2>
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Confidence</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action Taken</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">tx-sap-98214</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">96.5%</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Payment Blocked</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Just now</td>
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">po-oracle-45902</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">91.2%</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Escalated to Review</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">12 mins ago</td>
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">tx-sap-98213</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">89.8%</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Auto-Approved</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">1 hour ago</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
