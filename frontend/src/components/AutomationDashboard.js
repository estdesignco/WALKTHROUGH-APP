import React, { useState, useEffect } from 'react';
import { Zap, Mail, Bell, CheckSquare, Settings } from 'lucide-react';

const AutomationDashboard = ({ projectId }) => {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [automationRules, setAutomationRules] = useState([]);
  const [showAddRule, setShowAddRule] = useState(false);
  const [newRule, setNewRule] = useState({
    name: '',
    trigger: 'status_change',
    condition: '',
    action: 'send_email',
    recipient: '',
    message: ''
  });

  useEffect(() => {
    loadAutomationData();
  }, [projectId]);

  const loadAutomationData = async () => {
    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      
      const response = await fetch(`${BACKEND_URL}/api/automation/${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setAutomationRules(data.rules || []);
      }
      
      const projectResponse = await fetch(`${BACKEND_URL}/api/projects/${projectId}`);
      if (projectResponse.ok) {
        setProject(await projectResponse.json());
      }
    } catch (error) {
      console.error('Error loading automation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRule = async () => {
    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      await fetch(`${BACKEND_URL}/api/automation/${projectId}/rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRule)
      });
      
      setShowAddRule(false);
      setNewRule({
        name: '',
        trigger: 'status_change',
        condition: '',
        action: 'send_email',
        recipient: '',
        message: ''
      });
      loadAutomationData();
      alert('✅ Automation rule created!');
    } catch (error) {
      console.error('Error adding rule:', error);
      alert('Failed to add automation rule');
    }
  };

  const handleToggleRule = async (ruleId, enabled) => {
    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      await fetch(`${BACKEND_URL}/api/automation/${projectId}/rules/${ruleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      });
      loadAutomationData();
    } catch (error) {
      console.error('Error toggling rule:', error);
    }
  };

  const handleDeleteRule = async (ruleId) => {
    if (!window.confirm('Delete this automation rule?')) return;
    
    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      await fetch(`${BACKEND_URL}/api/automation/${projectId}/rules/${ruleId}`, {
        method: 'DELETE'
      });
      loadAutomationData();
    } catch (error) {
      console.error('Error deleting rule:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-[#D4C5A9]">Loading automation...</div>;
  }

  return (
    <div className="w-full" style={{ backgroundColor: '#0F172A', padding: '24px' }}>
      <h2 className="text-3xl font-bold text-[#D4A574] mb-6">⚡ Automation & Workflows</h2>

      {/* PRE-BUILT AUTOMATIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="rounded-2xl p-6 border border-[#D4A574]/60" style={{
          background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(30,30,30,0.9) 50%, rgba(0,0,0,0.95) 100%)'
        }}>
          <h3 className="text-xl font-bold text-[#D4A574] mb-4">📧 Email Automations</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-gray-800/50 p-3 rounded-lg">
              <div>
                <div className="text-[#D4C5A9] font-semibold">Item Delivered → Email Client</div>
                <div className="text-xs text-gray-400">Notify when items arrive at receiver</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-green-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between bg-gray-800/50 p-3 rounded-lg">
              <div>
                <div className="text-[#D4C5A9] font-semibold">Ready for Install → Email Alert</div>
                <div className="text-xs text-gray-400">When all items ready</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-green-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between bg-gray-800/50 p-3 rounded-lg">
              <div>
                <div className="text-[#D4C5A9] font-semibold">Status Change → Client Update</div>
                <div className="text-xs text-gray-400">Any status change notification</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-green-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-6 border border-[#D4A574]/60" style={{
          background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(30,30,30,0.9) 50%, rgba(0,0,0,0.95) 100%)'
        }}>
          <h3 className="text-xl font-bold text-[#D4A574] mb-4">🔔 Teams Notifications</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-gray-800/50 p-3 rounded-lg">
              <div>
                <div className="text-[#D4C5A9] font-semibold">Backordered Items Alert</div>
                <div className="text-xs text-gray-400">When item becomes backordered</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-green-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between bg-gray-800/50 p-3 rounded-lg">
              <div>
                <div className="text-[#D4C5A9] font-semibold">Shipment Tracking Updates</div>
                <div className="text-xs text-gray-400">Real-time shipping notifications</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-green-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between bg-gray-800/50 p-3 rounded-lg">
              <div>
                <div className="text-[#D4C5A9] font-semibold">Daily Status Summary</div>
                <div className="text-xs text-gray-400">End of day project update</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-green-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* CUSTOM AUTOMATION RULES */}
      <div className="rounded-2xl p-6 border border-[#D4A574]/60 mb-8" style={{
        background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(30,30,30,0.9) 50%, rgba(0,0,0,0.95) 100%)'
      }}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-[#D4A574]">🤖 Custom Automation Rules</h3>
          <button
            onClick={() => setShowAddRule(true)}
            className="bg-[#D4A574] hover:bg-[#C49564] text-black px-6 py-3 rounded-lg font-bold flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Rule
          </button>
        </div>
        
        {automationRules.length === 0 ? (
          <div className="text-center py-12 text-[#B49B7E]">
            No custom rules yet. Create automation rules to streamline your workflow.
          </div>
        ) : (
          <div className="space-y-4">
            {automationRules.map((rule, index) => (
              <div key={rule.id || index} className="bg-gray-800/50 p-4 rounded-lg border border-[#D4A574]/30">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-bold text-[#D4C5A9]">{rule.name}</h4>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={rule.enabled}
                          onChange={(e) => handleToggleRule(rule.id, e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-green-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                      </label>
                    </div>
                    <div className="text-sm text-[#B49B7E] mb-2">
                      <strong>When:</strong> {rule.trigger} → {rule.condition}
                    </div>
                    <div className="text-sm text-[#B49B7E]">
                      <strong>Then:</strong> {rule.action} to {rule.recipient}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    className="text-red-400 hover:text-red-300 ml-4"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AUTOMATION ACTIVITY LOG */}
      <div className="rounded-2xl p-6 border border-[#D4A574]/60" style={{
        background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(30,30,30,0.9) 50%, rgba(0,0,0,0.95) 100%)'
      }}>
        <h3 className="text-2xl font-bold text-[#D4A574] mb-6">📝 Recent Automation Activity</h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          <div className="bg-green-900/20 border-l-4 border-green-500 p-4 rounded">
            <div className="flex justify-between">
              <div>
                <div className="text-green-400 font-bold">✅ Email Sent</div>
                <div className="text-sm text-gray-300">Chandelier delivered notification sent to client</div>
              </div>
              <div className="text-xs text-gray-400">2 hours ago</div>
            </div>
          </div>
          
          <div className="bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded">
            <div className="flex justify-between">
              <div>
                <div className="text-blue-400 font-bold">🔔 Teams Alert</div>
                <div className="text-sm text-gray-300">Backordered item flagged: Dining Table</div>
              </div>
              <div className="text-xs text-gray-400">5 hours ago</div>
            </div>
          </div>
          
          <div className="bg-purple-900/20 border-l-4 border-purple-500 p-4 rounded">
            <div className="flex justify-between">
              <div>
                <div className="text-purple-400 font-bold">📅 Calendar Updated</div>
                <div className="text-sm text-gray-300">Install date auto-updated to Jan 12, 2026</div>
              </div>
              <div className="text-xs text-gray-400">1 day ago</div>
            </div>
          </div>
        </div>
      </div>

      {/* ADD RULE MODAL */}
      {showAddRule && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-[#1E293B] border-2 border-[#D4A574] rounded-2xl p-8 max-w-2xl w-full">
            <h3 className="text-2xl font-bold text-[#D4A574] mb-6">⚡ Create Automation Rule</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[#B49B7E] mb-2">Rule Name</label>
                <input
                  type="text"
                  value={newRule.name}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                  className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-[#D4A574]"
                  placeholder="e.g., Notify when items ship"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#B49B7E] mb-2">Trigger</label>
                  <select
                    value={newRule.trigger}
                    onChange={(e) => setNewRule({ ...newRule, trigger: e.target.value })}
                    className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-[#D4A574]"
                  >
                    <option value="status_change">Status Changes</option>
                    <option value="item_added">Item Added</option>
                    <option value="daily">Daily Schedule</option>
                    <option value="weekly">Weekly Schedule</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-[#B49B7E] mb-2">Condition</label>
                  <select
                    value={newRule.condition}
                    onChange={(e) => setNewRule({ ...newRule, condition: e.target.value })}
                    className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-[#D4A574]"
                  >
                    <option value="">Any change</option>
                    <option value="SHIPPED">Status = SHIPPED</option>
                    <option value="DELIVERED">Status = DELIVERED</option>
                    <option value="READY FOR INSTALL">Status = READY FOR INSTALL</option>
                    <option value="BACKORDERED">Status = BACKORDERED</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#B49B7E] mb-2">Action</label>
                  <select
                    value={newRule.action}
                    onChange={(e) => setNewRule({ ...newRule, action: e.target.value })}
                    className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-[#D4A574]"
                  >
                    <option value="send_email">Send Email</option>
                    <option value="teams_notification">Teams Notification</option>
                    <option value="create_task">Create To-Do Task</option>
                    <option value="update_calendar">Update Calendar</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-[#B49B7E] mb-2">Recipient</label>
                  <input
                    type="text"
                    value={newRule.recipient}
                    onChange={(e) => setNewRule({ ...newRule, recipient: e.target.value })}
                    className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-[#D4A574]"
                    placeholder="Email or Teams channel"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-[#B49B7E] mb-2">Message Template</label>
                <textarea
                  value={newRule.message}
                  onChange={(e) => setNewRule({ ...newRule, message: e.target.value })}
                  className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-[#D4A574]"
                  rows="3"
                  placeholder="Your {item_name} for {room_name} has {status}. Expected delivery: {eta}"
                />
                <div className="text-xs text-gray-400 mt-1">
                  Use variables: {'{item_name}'}, {'{room_name}'}, {'{status}'}, {'{eta}'}
                </div>
              </div>
            </div>
            
            <div className="flex gap-4 mt-6">
              <button
                onClick={handleAddRule}
                className="flex-1 bg-[#D4A574] hover:bg-[#C49564] text-black px-6 py-3 rounded-lg font-bold"
              >
                Create Rule
              </button>
              <button
                onClick={() => setShowAddRule(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutomationDashboard;