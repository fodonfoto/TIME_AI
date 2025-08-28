import { useState } from 'react';
import firebaseService from '../services/firebaseService';
import { updateUserToPro } from '../utils/updateUserPlan';
import { getUserPlanInfo, updateUserPlan } from '../utils/userPlanManager';
import { addPlanFieldsToAllUsers } from '../utils/addPlanFieldsToUsers';
// cleanupPlanConfigs removed - using subscription_plans collection instead
import { useAuth } from '../hooks/useAuth';

function FirebaseTest() {
  const { user } = useAuth();
  const [testResult, setTestResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [createDataLoading, setCreateDataLoading] = useState(false);
  const [planConfigLoading, setPlanConfigLoading] = useState(false);
  const [scenarioLoading, setScenarioLoading] = useState(false);
  const [performanceLoading, setPerformanceLoading] = useState(false);
  const [updateUserLoading, setUpdateUserLoading] = useState(false);
  const [planInfoLoading, setPlanInfoLoading] = useState(false);
  const [addPlanFieldsLoading, setAddPlanFieldsLoading] = useState(false);
  // cleanupLoading state removed - cleanup function not needed with subscription_plans

  const testConnection = async () => {
    setIsLoading(true);
    setTestResult('กำลังทดสอบ...');
    
    try {
      const result = await firebaseService.testFirestoreConnection();
      if (result) {
        setTestResult('✅ เชื่อมต่อ Firebase สำเร็จ!');
      } else {
        setTestResult('❌ ไม่สามารถเชื่อมต่อ Firebase ได้');
      }
    } catch (error) {
      setTestResult(`❌ เกิดข้อผิดพลาด: ${error.message}`);
    }
    
    setIsLoading(false);
  };

  // cleanupDatabase function removed - using subscription_plans collection instead of plan_configs

  const addPlanFields = async () => {
    setAddPlanFieldsLoading(true);
    setTestResult('🔧 กำลังเพิ่ม plan fields ให้ users ที่มีอยู่...');
    
    try {
      const updatedCount = await addPlanFieldsToAllUsers();
      setTestResult(`✅ เพิ่ม plan fields ให้ ${updatedCount} users เรียบร้อย!`);
    } catch (error) {
      setTestResult(`❌ ไม่สามารถเพิ่ม plan fields ได้: ${error.message}`);
    }
    
    setAddPlanFieldsLoading(false);
  };

  const createTestData = async () => {
    if (!user) {
      setTestResult('❌ กรุณาเข้าสู่ระบบก่อน');
      return;
    }

    setCreateDataLoading(true);
    setTestResult('⚠️ ฟีเจอร์สร้างข้อมูลทดสอบถูกลบออกแล้ว\nใช้สคริปต์ใน /scripts แทน หรือสร้างข้อมูลผ่าน Firebase Console');
    setCreateDataLoading(false);
  };

  const testPlanConfigs = async () => {
    setPlanConfigLoading(true);
    setTestResult('⚠️ ฟีเจอร์ทดสอบ plan configs ถูกลบออกแล้ว\nใช้สคริปต์ initPlanConfigs.js ใน /scripts แทน');
    setPlanConfigLoading(false);
  };

  const updateUserPlanTest = async () => {
    setUpdateUserLoading(true);
    setTestResult('🔄 กำลังอัปเดต researchchatgpt01@gmail.com เป็น Pro plan...');
    
    try {
      const success = await updateUserPlan('researchchatgpt01@gmail.com', 'Pro Plan');
      if (success) {
        setTestResult('✅ อัปเดต researchchatgpt01@gmail.com เป็น Pro Plan สำเร็จ!');
      } else {
        setTestResult('❌ ไม่สามารถอัปเดต user plan ได้');
      }
    } catch (error) {
      setTestResult(`❌ เกิดข้อผิดพลาดในการอัปเดต user plan: ${error.message}`);
    }
    
    setUpdateUserLoading(false);
  };

  const checkUserPlanInfo = async () => {
    if (!user) {
      setTestResult('❌ กรุณาเข้าสู่ระบบก่อน');
      return;
    }

    setPlanInfoLoading(true);
    setTestResult('🔍 กำลังตรวจสอบข้อมูล plan ของ user...');
    
    try {
      const planInfo = await getUserPlanInfo(user.uid);
      setTestResult(`📋 ข้อมูล Plan ของคุณ:\nPlan: ${planInfo.planName}\nราคา: $${planInfo.price}/เดือน\nขีดจำกัดรายวัน: ${planInfo.dailyLimit === -1 ? 'ไม่จำกัด' : planInfo.dailyLimit + ' ครั้ง'}\nใช้งานวันนี้: ${planInfo.dailyUsage || 0} ครั้ง\nFeatures: ${planInfo.features.join(', ')}`);
    } catch (error) {
      setTestResult(`❌ ไม่สามารถดึงข้อมูล plan ได้: ${error.message}`);
    }
    
    setPlanInfoLoading(false);
  };

  const runScenarios = async () => {
    if (!user) {
      setTestResult('❌ กรุณาเข้าสู่ระบบก่อน');
      return;
    }

    setScenarioLoading(true);
    setTestResult('⚠️ ฟีเจอร์ Scenario Tests ถูกลบออกแล้ว\nใช้ automated tests ใน /tests แทน หรือรัน npm test');
    setScenarioLoading(false);
  };

  const runPerformance = async () => {
    if (!user) {
      setTestResult('❌ กรุณาเข้าสู่ระบบก่อน');
      return;
    }

    setPerformanceLoading(true);
    setTestResult('⚠️ ฟีเจอร์ Performance Tests ถูกลบออกแล้ว\nใช้ automated tests ใน /tests แทน หรือรัน npm test');
    setPerformanceLoading(false);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>ทดสอบการเชื่อมต่อ Firebase และ User Plan Management</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '20px' }}>
        {/* Cleanup button removed - using subscription_plans collection instead of plan_configs */}
        
        <button 
          onClick={testConnection}
          disabled={isLoading}
          style={{
            padding: '10px 15px',
            fontSize: '14px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? 'กำลังทดสอบ...' : 'ทดสอบการเชื่อมต่อ'}
        </button>
        
        <button 
          onClick={checkUserPlanInfo}
          disabled={planInfoLoading || !user}
          style={{
            padding: '10px 15px',
            fontSize: '14px',
            backgroundColor: '#17a2b8',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: (planInfoLoading || !user) ? 'not-allowed' : 'pointer'
          }}
        >
          {planInfoLoading ? 'กำลังตรวจสอบ...' : 'ตรวจสอบ Plan Info'}
        </button>
        
        <button 
          onClick={updateUserPlanTest}
          disabled={updateUserLoading}
          style={{
            padding: '10px 15px',
            fontSize: '14px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: updateUserLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {updateUserLoading ? 'กำลังอัปเดต...' : 'อัปเดต User เป็น Pro'}
        </button>
        
        <button 
          onClick={createTestData}
          disabled={createDataLoading || !user}
          style={{
            padding: '10px 15px',
            fontSize: '14px',
            backgroundColor: '#6f42c1',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: (createDataLoading || !user) ? 'not-allowed' : 'pointer'
          }}
        >
          {createDataLoading ? 'กำลังสร้าง...' : 'สร้างข้อมูลทดสอบ'}
        </button>
        
        <button 
          onClick={runScenarios}
          disabled={scenarioLoading || !user}
          style={{
            padding: '10px 15px',
            fontSize: '14px',
            backgroundColor: '#fd7e14',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: (scenarioLoading || !user) ? 'not-allowed' : 'pointer'
          }}
        >
          {scenarioLoading ? 'กำลังทดสอบ...' : 'รัน Scenario Tests'}
        </button>
        
        <button 
          onClick={runPerformance}
          disabled={performanceLoading || !user}
          style={{
            padding: '10px 15px',
            fontSize: '14px',
            backgroundColor: '#20c997',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: (performanceLoading || !user) ? 'not-allowed' : 'pointer'
          }}
        >
          {performanceLoading ? 'กำลังทดสอบ...' : 'ทดสอบ Performance'}
        </button>
      </div>
      
      {testResult && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: testResult.includes('✅') ? '#d4edda' : '#f8d7da',
          border: `1px solid ${testResult.includes('✅') ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: '5px',
          fontSize: '14px',
          whiteSpace: 'pre-line'
        }}>
          {testResult}
        </div>
      )}
      
      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        <p><strong>หมายเหตุ:</strong></p>
        <ul>
          <li><strong>ตรวจสอบ Plan Info</strong>: แสดงข้อมูล plan ปัจจุบันของ user ที่ login อยู่</li>
          <li><strong>อัปเดต User เป็น Pro</strong>: อัปเดต researchchatgpt01@gmail.com ให้เป็น Pro Plan</li>
          <li><strong>สร้างข้อมูลทดสอบ</strong>: สร้างข้อมูล chat history สำหรับทดสอบ</li>
          <li><strong>รัน Tests</strong>: ทดสอบประสิทธิภาพและ scenario ต่างๆ</li>
          <li>เปิด Developer Console (F12) เพื่อดู logs รายละเอียด</li>
        </ul>
      </div>
    </div>
  );
}

export default FirebaseTest;