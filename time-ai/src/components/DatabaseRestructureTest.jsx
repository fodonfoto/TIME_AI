import React, { useState } from 'react';
import { getDataStructureInfo } from '../utils/restructureDatabase';
import { autoSetupNewUser, checkUserDataCompleteness, createDemoDataForNewUser } from '../utils/autoUserSetup';
import { runFirebaseDebugTests } from '../utils/firebaseDebug';
import { useAuth } from '../hooks/useAuth';

const DatabaseRestructureTest = () => {
  const { user } = useAuth();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastTestUserId, setLastTestUserId] = useState(null);
  const [testChatId, setTestChatId] = useState(null);

  const addResult = (message, type = 'info') => {
    setResults(prev => {
      const newResult = { message, type, timestamp: new Date().toLocaleTimeString() };
      return [...prev, newResult];
    });
  };

  // 🆕 ทดสอบระบบ Auto Setup
  const handleTestAutoSetup = async () => {
    setLoading(true);
    addResult('🔄 ทดสอบระบบ Auto Setup สำหรับ user ปัจจุบัน...', 'info');
    
    if (!user) {
      addResult('❌ ไม่มี user ที่ login อยู่', 'error');
      setLoading(false);
      return;
    }
    
    try {
      const result = await autoSetupNewUser(user);
      addResult(result.message, result.success ? 'success' : 'error');
      
      if (result.success) {
        addResult(`👤 User ID: ${user.uid}`, 'info');
        addResult(`🆕 Is New User: ${result.isNewUser ? 'ใช่' : 'ไม่ใช่'}`, 'info');
        setLastTestUserId(user.uid);
      }
    } catch (error) {
      addResult(`❌ Error: ${error.message}`, 'error');
    }
    
    setLoading(false);
  };

  // 🆕 ตรวจสอบความสมบูรณ์ของข้อมูล user ปัจจุบัน
  const handleCheckCurrentUserData = async () => {
    setLoading(true);
    addResult('🔍 ตรวจสอบความสมบูรณ์ของข้อมูล user ปัจจุบัน...', 'info');
    
    if (!user) {
      addResult('❌ ไม่มี user ที่ login อยู่', 'error');
      setLoading(false);
      return;
    }
    
    try {
      const result = await checkUserDataCompleteness(user.uid);
      
      if (result.complete) {
        addResult('✅ ข้อมูล user สมบูรณ์', 'success');
      } else {
        addResult(`⚠️ ข้อมูลไม่สมบูรณ์ ขาด: ${result.missing.join(', ')}`, 'warning');
      }
      
      if (result.userData) {
        addResult(`📧 Email: ${result.userData.email}`, 'info');
        addResult(`👤 Display Name: ${result.userData.displayName}`, 'info');
      }
      
      if (result.planData) {
        addResult(`📋 Plan: ${result.planData.planName}`, 'info');
        addResult(`📊 Daily Limit: ${result.planData.dailyLimit}`, 'info');
        addResult(`📈 Daily Usage: ${result.planData.dailyUsage}`, 'info');
      }
    } catch (error) {
      addResult(`❌ Error: ${error.message}`, 'error');
    }
    
    setLoading(false);
  };

  // 🆕 สร้างข้อมูล demo สำหรับ user ปัจจุบัน
  const handleCreateDemoForCurrentUser = async () => {
    setLoading(true);
    addResult('🎭 สร้างข้อมูล demo สำหรับ user ปัจจุบัน...', 'info');
    
    if (!user) {
      addResult('❌ ไม่มี user ที่ login อยู่', 'error');
      setLoading(false);
      return;
    }
    
    try {
      const result = await createDemoDataForNewUser(user.uid);
      addResult(result.success ? '✅ สร้างข้อมูล demo เรียบร้อย' : `❌ ${result.message}`, result.success ? 'success' : 'error');
      
      if (result.success) {
        addResult(`💬 Demo Chat ID: ${result.demoChatId}`, 'info');
      }
    } catch (error) {
      addResult(`❌ Error: ${error.message}`, 'error');
    }
    
    setLoading(false);
  };

  // Test 1: สร้างโครงสร้างใหม่สำหรับ user
  const handleTestCreateUser = async () => {
    setLoading(true);
    addResult('⚠️ ฟีเจอร์การทดสอบ Mock User Structure ถูกลบออกแล้ว', 'info');
    addResult('ใช้ระบบ Auto Setup สำหรับ user จริงแทน', 'info');
    setLoading(false);
  };

  // Test 2: สร้าง chat session
  const handleTestCreateChat = async () => {
    setLoading(true);
    addResult('⚠️ ฟีเจอร์การทดสอบ Mock Chat Session ถูกลบออกแล้ว', 'info');
    addResult('ใช้ระบบ Auto Setup สำหรับ user จริงแทน', 'info');
    setLoading(false);
  };

  // Test 3: บันทึกข้อความ
  const handleTestSaveMessage = async () => {
    setLoading(true);
    addResult('⚠️ ฟีเจอร์การทดสอบ Mock Messages ถูกลบออกแล้ว', 'info');
    addResult('ใช้ระบบ Auto Setup สำหรับ user จริงแทน', 'info');
    setLoading(false);
  };

  // Test 4: ดึงประวัติการสนทนา
  const handleTestGetHistory = async () => {
    setLoading(true);
    addResult('⚠️ ฟีเจอร์การทดสอบ Mock History ถูกลบออกแล้ว', 'info');
    addResult('ใช้ระบบ Auto Setup สำหรับ user จริงแทน', 'info');
    setLoading(false);
  };

  // Test 5: สร้างข้อมูล mockup ให้สมบูรณ์ 100%
  const handleCreateCompleteMockup = async () => {
    setLoading(true);
    addResult('⚠️ ฟีเจอร์การทดสอบ Complete Mockup ถูกลบออกแล้ว', 'info');
    addResult('ใช้ระบบ Auto Setup สำหรับ user จริงแทน', 'info');
    setLoading(false);
  };

  // Test 6: ตรวจสอบความสมบูรณ์ของข้อมูล
  const handleVerifyCompleteness = async () => {
    setLoading(true);
    addResult('⚠️ ฟีเจอร์การตรวจสอบ Mock Data Completeness ถูกลบออกแล้ว', 'info');
    addResult('ใช้ระบบ Auto Setup สำหรับ user จริงแทน', 'info');
    setLoading(false);
  };

  // แสดงโครงสร้างข้อมูล
  const showDataStructure = () => {
    const structure = getDataStructureInfo();
    addResult('📋 โครงสร้างข้อมูลที่ควรมี:', 'info');
    
    Object.entries(structure).forEach(([key, value]) => {
      addResult(`🔹 ${key}: ${value.description}`, 'info');
      addResult(`   Fields: ${value.fields.join(', ')}`, 'info');
    });
  };

  // ล้างผลลัพธ์
  const clearResults = () => {
    setResults([]);
    addResult('🧹 ล้างผลลัพธ์เรียบร้อย', 'info');
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">🔧 Database Restructure Test</h2>
      
      {/* ข้อมูลสถานะ */}
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h3 className="font-semibold mb-2">📊 สถานะการทดสอบ</h3>
        <p>Current User: <span className="font-mono text-sm">{user ? user.uid : 'ไม่มี user login'}</span></p>
        <p>Last Test User ID: <span className="font-mono text-sm">{lastTestUserId || 'ยังไม่มี'}</span></p>
        <p>Test Chat ID: <span className="font-mono text-sm">{testChatId || 'ยังไม่มี'}</span></p>
      </div>

      {/* 🆕 ปุ่มทดสอบระบบ Auto Setup */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">🚀 ระบบ Auto Setup (สำหรับ User จริง)</h3>
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={handleTestAutoSetup}
            disabled={loading || !user}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50 font-bold"
          >
            🔄 ทดสอบ Auto Setup
          </button>
          
          <button
            onClick={handleCheckCurrentUserData}
            disabled={loading || !user}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            🔍 ตรวจสอบข้อมูล User
          </button>
          
          <button
            onClick={handleCreateDemoForCurrentUser}
            disabled={loading || !user}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          >
            🎭 สร้าง Demo Data
          </button>
        </div>
      </div>

      {/* ปุ่มทดสอบหลัก */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">🧪 การทดสอบระบบ (Mock Data)</h3>
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={handleTestCreateUser}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            1️⃣ ทดสอบสร้าง User Structure
          </button>
          
          <button
            onClick={handleTestCreateChat}
            disabled={loading}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
          >
            2️⃣ ทดสอบสร้าง Chat Session
          </button>
          
          <button
            onClick={handleTestSaveMessage}
            disabled={loading}
            className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 disabled:opacity-50"
          >
            3️⃣ ทดสอบบันทึกข้อความ
          </button>
          
          <button
            onClick={handleTestGetHistory}
            disabled={loading}
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
          >
            4️⃣ ทดสอบดึงประวัติ
          </button>

          <button
            onClick={handleCreateCompleteMockup}
            disabled={loading}
            className="bg-pink-500 text-white px-4 py-2 rounded hover:bg-pink-600 disabled:opacity-50 font-bold"
          >
            🎭 สร้าง Mockup 100%
          </button>

          <button
            onClick={handleVerifyCompleteness}
            disabled={loading}
            className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 disabled:opacity-50"
          >
            🔍 ตรวจสอบความสมบูรณ์
          </button>
        </div>
      </div>

      {/* ปุ่มทดสอบเพิ่มเติม */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <button
          onClick={async () => {
            setLoading(true);
            try {
              addResult('🔄 ทดสอบ Migration...', 'info');
              const testUserId = lastTestUserId || 'fCrU8uEzN2PhLeTXxn5pSa3jCLO2';
              const result = await testMigration(testUserId);
              addResult(result.message, result.success ? 'success' : 'error');
            } catch (error) {
              addResult(`❌ Error: ${error.message}`, 'error');
            }
            setLoading(false);
          }}
          disabled={loading}
          className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 disabled:opacity-50"
        >
          5️⃣ ทดสอบ Migration
        </button>
        
        <button
          onClick={async () => {
            setLoading(true);
            try {
              addResult('🔍 เปรียบเทียบโครงสร้าง...', 'info');
              const testUserId = lastTestUserId || 'fCrU8uEzN2PhLeTXxn5pSa3jCLO2';
              const result = await testCompareStructures(testUserId);
              addResult(result.message, 'info');
              addResult(`📊 โครงสร้างเก่า: ${result.oldStructure.count} รายการ`, 'info');
              addResult(`🆕 โครงสร้างใหม่: ${result.newStructure.count} รายการ`, 'info');
            } catch (error) {
              addResult(`❌ Error: ${error.message}`, 'error');
            }
            setLoading(false);
          }}
          disabled={loading}
          className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 disabled:opacity-50"
        >
          6️⃣ เปรียบเทียบโครงสร้าง
        </button>
        
        <button
          onClick={async () => {
            setLoading(true);
            try {
              addResult('🎯 ทดสอบ End-to-End...', 'info');
              const result = await testEndToEnd();
              addResult(result.message, result.success ? 'success' : 'error');
            } catch (error) {
              addResult(`❌ Error: ${error.message}`, 'error');
            }
            setLoading(false);
          }}
          disabled={loading}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:opacity-50"
        >
          7️⃣ ทดสอบ End-to-End
        </button>

        <button
          onClick={showDataStructure}
          disabled={loading}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 disabled:opacity-50"
        >
          📋 แสดงโครงสร้างข้อมูล
        </button>
      </div>

      {/* ปุ่มจัดการ */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={clearResults}
          className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
        >
          🧹 ล้างผลลัพธ์
        </button>
        
        <button
          onClick={async () => {
            setLoading(true);
            try {
              addResult('🔍 ทดสอบการเชื่อมต่อ Firebase...', 'info');
              const result = await testFirebaseConnectionStatus();
              addResult(result.message, result.success ? 'success' : 'error');
            } catch (error) {
              addResult(`❌ Error: ${error.message}`, 'error');
            }
            setLoading(false);
          }}
          disabled={loading}
          className="bg-teal-500 text-white px-4 py-2 rounded hover:bg-teal-600 disabled:opacity-50"
        >
          🔗 ทดสอบ Firebase Connection
        </button>
      </div>

      {/* แสดงผลลัพธ์ */}
      <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
        <h3 className="text-white mb-2">📊 ผลลัพธ์การทดสอบ:</h3>
        {results.length === 0 ? (
          <p className="text-gray-400">ยังไม่มีผลลัพธ์...</p>
        ) : (
          results.map((result, index) => (
            <div key={index} className={`mb-1 ${
              result.type === 'success' ? 'text-green-400' :
              result.type === 'error' ? 'text-red-400' :
              result.type === 'warning' ? 'text-yellow-400' :
              'text-gray-300'
            }`}>
              <span className="text-gray-500">[{result.timestamp}]</span> {result.message}
            </div>
          ))
        )}
        {loading && (
          <div className="text-yellow-400 animate-pulse">
            ⏳ กำลังประมวลผล...
          </div>
        )}
      </div>
    </div>
  );
};

export default DatabaseRestructureTest;