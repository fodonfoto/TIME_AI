# 📊 Time.AI Dashboard System - Product Requirements Document (PRD)

## 🎯 **Executive Summary**

Time.AI Dashboard เป็นหน้าหลักสำหรับแสดงสถิติการใช้งานของผู้ใช้ ประกอบด้วยกราฟแสดงการใช้งานรายวันในรูปแบบ 30-day periods และข้อมูลสถานะปัจจุบันของแผนการใช้งาน พร้อมด้วยระบบติดตามการใช้งานที่ซับซ้อนและแม่นยำ

## 🏗️ **System Architecture**

### **Data Architecture (Firebase-only)**
```
Firebase Firestore Structure:
├── users/{userId}
│   ├── plan_configs/current_plan    - ข้อมูลแผนและลิมิตการใช้งาน
│   └── usage_history/{date}        - ประวัติการใช้งานรายวัน
├── usage_tracking/                 - ติดตามการใช้งานรายวัน
├── usage_analytics/                - วิเคราะห์การใช้งาน
└── subscription_plans/             - แผนการสมาชิก
```

### **Frontend Components Structure**
```
src/components/
├── Dashboard.jsx               - หน้าหลัก Dashboard
├── DashboardIcon.jsx           - Lottie animation icon
└── PlanStatus.jsx              - แสดงสถานะแผนการใช้งาน
```

### **Core Services & Utilities**
```
src/utils/
├── usageTracker.js             - จัดการข้อมูลการใช้งาน
└── 30-day period system        - ระบบรอบการใช้งาน 30 วัน

src/services/
├── firebaseService.js          - การดำเนินการ Firestore
├── usageService.js             - บริการติดตามการใช้งาน
└── subscriptionService.js      - จัดการแผนการสมาชิก
```

### **Chart Libraries**
```
Dependencies:
├── recharts                    - สำหรับกราฟ BarChart
├── lottie-react               - สำหรับ icon animation
└── react-router-dom           - สำหรับ navigation
```

## 📋 **Feature Specifications**

### **1. Usage Statistics Chart**

#### **Chart Features**
- **ประเภทกราฟ**: Bar Chart แสดงจำนวน requests รายวัน
- **ข้อมูลที่แสดง**: การใช้งาน requests ย้อนหลัง 30 วันในรอบปัจจุบัน
- **Period System**: แสดงข้อมูลตามรอบ 30 วันนับจากวันที่ user สมัคร
- **Responsive Design**: ปรับขนาดอัตโนมัติตามหน้าจอ
- **Interactive Tooltip**: แสดงรายละเอียดเมื่อ hover

#### **30-Day Period System Implementation**
```javascript
// Period calculation logic
const daysSinceJoin = Math.floor((today - joinDate) / (1000 * 60 * 60 * 24));
const currentPeriod = Math.floor(daysSinceJoin / 30);
const dayInPeriod = (daysSinceJoin % 30) + 1;

// Period date ranges
const periodStartDate = new Date(joinDate);
periodStartDate.setDate(periodStartDate.getDate() + (currentPeriod * 30));

const periodEndDate = new Date(periodStartDate);
periodEndDate.setDate(periodEndDate.getDate() + 29);
```

#### **Chart Data Model**
```javascript
// ข้อมูลสำหรับแต่ละวันในกราฟ
{
  date: "2024-01-15",           // วันที่ในรูปแบบ ISO
  count: 5,                    // จำนวน requests ที่ใช้
  displayDate: "15 ม.ค.",      // วันที่สำหรับแสดงในกราฟ
  period: 1,                   // รอบที่ (Period 1, 2, 3, ...)
  dayInPeriod: 15              // วันที่ในรอบ (1-30)
}
```

#### **Custom Tooltip Implementation**
```javascript
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="tooltip">
        <p>{data.displayDate}</p>
        <p>Period {data.period}, Day {data.dayInPeriod}</p>
        <p>Requests: {data.count}/{usageData.dailyLimit}</p>
      </div>
    );
  }
  return null;
};
```

### **2. Current Status Panel**

#### **Plan Information Display**
- **แผนปัจจุบัน**: แสดงชื่อแผน (Free Plan, Pro Plan, Max Plan)
- **การใช้งานวันนี้**: จำนวน requests ที่ใช้ไป / ลิมิตรายวัน
- **คงเหลือ**: จำนวน requests ที่เหลือใช้ได้
- **สถานะ**: Ready to Use หรือ Daily Limit Reached

#### **Dynamic Status Indicators**
```javascript
// การแสดงสถานะตามการใช้งาน
const statusDisplay = usageData.dailyUsage >= usageData.dailyLimit 
  ? {
      title: '⚠️ Daily Limit Reached',
      message: 'You have reached your daily request limit',
      color: '#ef4444',
      backgroundColor: 'rgba(239, 68, 68, 0.1)'
    }
  : {
      title: '✅ Ready to Use', 
      message: 'You can use the service normally',
      color: '#10A37F',
      backgroundColor: 'rgba(16, 163, 127, 0.1)'
    };
```

#### **Plan Data Model**
```javascript
// plan_configs/current_plan collection
{
  planName: "Free Plan",        // ชื่อแผน
  dailyLimit: 10,              // ลิมิตรายวัน
  dailyUsage: 3,               // การใช้งานวันนี้
  lastResetDate: "2024-01-15", // วันที่ reset ครั้งล่าสุด
  firstUsageDate: "2024-01-01", // วันแรกที่เริ่มใช้งาน
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### **3. Period Information Display**

#### **Period Metadata**
- **Period Number**: แสดงรอบปัจจุบัน (Period 1, Period 2, ...)
- **Date Range**: วันที่เริ่มต้นและสิ้นสุดของรอบ
- **Current Day**: วันปัจจุบันในรอบ (Day X/30)
- **Total Days Displayed**: จำนวนวันทั้งหมดที่แสดงในกราฟ

#### **Period Info Implementation**
```javascript
const getCurrentPeriodInfo = async (userId) => {
  // คำนวณรอบปัจจุบันจากวันที่สมัคร
  const joinDate = await getUserJoinDate(userId);
  const today = new Date();
  const daysSinceJoin = Math.floor((today - joinDate) / (1000 * 60 * 60 * 24));
  
  return {
    period: Math.floor(daysSinceJoin / 30) + 1,
    dayInPeriod: (daysSinceJoin % 30) + 1,
    periodStartDate: calculatePeriodStart(joinDate, currentPeriod),
    periodEndDate: calculatePeriodEnd(joinDate, currentPeriod),
    totalDaysInPeriod: Math.min(30, daysSinceJoin % 30 + 1)
  };
};
```

## 🔄 **Data Flow & User Journey**

### **Complete Dashboard Load Flow**
```
1. User เข้าถึง /dashboard → AuthGuard verification
2. Dashboard component mount → useEffect trigger
3. loadUsageData() → Parallel API calls:
   ├── getUserUsage(userId) → ข้อมูลการใช้งานปัจจุบัน
   ├── getUsageHistory(userId, 30) → ประวัติ 30 วัน
   └── getCurrentPeriodInfo(userId) → ข้อมูลรอบ
4. Data processing → Set state สำหรับ UI
5. Chart rendering → Recharts visualization
6. Auto-refresh → ไม่มีการ auto-refresh (manual reload)
```

### **Period-Based Data Retrieval**
```
1. Get user join date → จาก users collection
2. Calculate current period → Math.floor(daysSinceJoin / 30)
3. Generate date range → Period start/end dates
4. Fetch usage history → เฉพาะวันในรอบปัจจุบัน
5. Fill missing days → วันที่ไม่มีข้อมูล = 0 requests
6. Format for chart → Convert to display format
```

### **Error Handling Flow**
```
Error occurs → Log error → Show fallback data → Don't break UI
Fallback data: 30 days with 0 requests each
```

## 💻 **Technical Implementation**

### **Dashboard Component State Management**
```javascript
const Dashboard = () => {
  const { user } = useAuth();
  const [usageData, setUsageData] = useState({
    dailyUsage: 0,
    dailyLimit: 10,
    planName: 'Free Plan'
  });
  const [chartData, setChartData] = useState([]);
  const [periodInfo, setPeriodInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load data on component mount
  useEffect(() => {
    if (user?.uid) {
      loadUsageData();
    }
  }, [user]);
};
```

### **Data Loading Implementation**
```javascript
const loadUsageData = async () => {
  try {
    setLoading(true);
    
    // Parallel data fetching for performance
    const [currentUsage, history, currentPeriodInfo] = await Promise.all([
      getUserUsage(user.uid),
      getUsageHistory(user.uid, 30),
      getCurrentPeriodInfo(user.uid)
    ]);
    
    setUsageData(currentUsage);
    setChartData(history);
    setPeriodInfo(currentPeriodInfo);
    
  } catch (error) {
    console.error('Error loading usage data:', error);
    // Fallback data for error cases
    setUsageData({ dailyUsage: 0, dailyLimit: 10, planName: 'Free Plan' });
    setChartData(generateFallbackData());
  } finally {
    setLoading(false);
  }
};
```

### **Chart Configuration**
```javascript
<BarChart data={chartData}>
  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
  <XAxis 
    dataKey="displayDate" 
    tick={{ fill: 'var(--text-secondary)' }}
    label={{ value: 'Date', position: 'insideBottomRight' }}
  />
  <YAxis 
    domain={[0, usageData.dailyLimit]}
    tickCount={usageData.dailyLimit + 1}
    label={{ 
      value: `Requests (Max ${usageData.dailyLimit}/day)`, 
      angle: -90, 
      position: 'insideLeft'
    }}
  />
  <Tooltip content={<CustomTooltip />} />
  <Bar 
    dataKey="count" 
    fill="#10A37F"
    radius={[4, 4, 0, 0]}
    isAnimationActive={false}
  />
</BarChart>
```

### **Usage Tracking Services**
```javascript
// usageTracker.js key functions

// ดึงข้อมูลการใช้งานปัจจุบัน
export const getUserUsage = async (userId) => {
  const planConfigRef = doc(db, 'users', userId, 'plan_configs', 'current_plan');
  const planDoc = await getDoc(planConfigRef);
  
  if (planDoc.exists()) {
    const data = planDoc.data();
    const today = new Date().toISOString().split('T')[0];
    
    // Auto-reset เมื่อวันใหม่
    if (data.lastResetDate !== today) {
      await updateDoc(planConfigRef, {
        dailyUsage: 0,
        lastResetDate: today
      });
      return { ...data, dailyUsage: 0 };
    }
    
    return data;
  }
  
  // สร้างข้อมูลเริ่มต้นถ้าไม่มี
  return createDefaultPlanConfig(userId);
};

// บันทึกการใช้งาน
export const recordUsage = async (userId) => {
  const planConfigRef = doc(db, 'users', userId, 'plan_configs', 'current_plan');
  const today = new Date().toISOString().split('T')[0];
  
  await updateDoc(planConfigRef, {
    dailyUsage: increment(1),
    lastResetDate: today,
    updatedAt: serverTimestamp()
  });
  
  await recordDailyUsageHistory(userId, today);
};

// ดึงประวัติการใช้งานแบบ 30-day period
export const getUsageHistory = async (userId, maxDays = 30) => {
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  
  const joinDate = userDoc.data().createdAt.toDate();
  const today = new Date();
  
  // คำนวณรอบปัจจุบัน
  const daysSinceJoin = Math.floor((today - joinDate) / (1000 * 60 * 60 * 24));
  const currentPeriod = Math.floor(daysSinceJoin / 30);
  
  // สร้าง date range สำหรับรอบปัจจุบัน
  const periodStart = new Date(joinDate);
  periodStart.setDate(periodStart.getDate() + (currentPeriod * 30));
  
  const history = [];
  const currentDate = new Date(periodStart);
  
  while (currentDate <= today && currentDate <= periodEnd) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const historyDoc = await getDoc(doc(userRef, 'usage_history', dateStr));
    
    history.push({
      date: dateStr,
      count: historyDoc.exists() ? historyDoc.data().count : 0,
      displayDate: currentDate.toLocaleDateString('th-TH', { 
        day: '2-digit', 
        month: 'short' 
      }),
      period: currentPeriod + 1,
      dayInPeriod: Math.floor((currentDate - periodStart) / (1000 * 60 * 60 * 24)) + 1
    });
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return history;
};
```

## 🎨 **UI/UX Design Specifications**

### **Layout Structure**
```
┌─────────────────────────────────────────────────────────┐
│                    Dashboard Header                      │
│                  "Usage Statistics"                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─ Usage Chart Card ─────────────────────────────────┐ │
│  │ Number of Requests (Period X - Y days)             │ │
│  │ 📅 Period X: DD/MM/YYYY - DD/MM/YYYY (Day Z/30)   │ │
│  │                                                     │ │
│  │     ▓▓▓  ▓▓   ▓▓▓▓  ▓▓  ▓▓▓   ▓▓▓ ▓▓              │ │
│  │     ▓▓▓  ▓▓   ▓▓▓▓  ▓▓  ▓▓▓   ▓▓▓ ▓▓              │ │
│  │   ┌─▓▓▓──▓▓───▓▓▓▓──▓▓──▓▓▓───▓▓▓─▓▓─┐           │ │
│  │   │ Bar Chart with 30-day period data  │           │ │
│  │   └─────────────────────────────────────┘           │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│  ┌─ Current Status Card ──────────────────────────────┐ │
│  │ Current Status                                      │ │
│  │                                                     │ │
│  │ ┌─ Current Plan (Green Background) ───────────────┐ │ │
│  │ │ 📦 Free Plan                                    │ │ │
│  │ │ 📊 3/10 requests today                         │ │ │
│  │ │ 🔋 7 requests remaining                        │ │ │
│  │ └─────────────────────────────────────────────────┘ │ │
│  │                                                     │ │
│  │ ┌─ Status Indicator (Green/Red Background) ──────┐ │ │
│  │ │ ✅ Ready to Use / ⚠️ Daily Limit Reached      │ │ │
│  │ │ Status message                                  │ │ │
│  │ └─────────────────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### **Responsive Design**
- **Desktop**: Single column layout with full-width cards
- **Mobile**: Stack cards vertically, reduce chart height
- **Tablet**: Maintain desktop layout with adjusted sizing
- **Chart**: Responsive container maintains aspect ratio

### **Visual Theme**
- **Color Scheme**: Dark theme with green accents (#10A37F)
- **Typography**: System fonts with clear hierarchy
- **Spacing**: 20px gaps between major elements
- **Cards**: Rounded corners (12px), subtle shadows
- **Chart**: Green bars with hover effects

### **Loading States**
```javascript
if (loading) {
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Loading data...</h2>
      </div>
    </div>
  );
}
```

### **CSS Variables Used**
```css
:root {
  --bg-primary: #1a1a1a;      /* Main background */
  --bg-secondary: #2d2d2d;    /* Card backgrounds */
  --text-primary: #ffffff;    /* Main text */
  --text-secondary: #b3b3b3;  /* Secondary text */
  --border: #4a4a4a;          /* Border color */
  --accent: #10A37F;          /* Brand green */
}
```

## 🔐 **Security & Data Protection**

### **Data Access Control**
- **User-specific data**: ผู้ใช้เข้าถึงได้เฉพาะข้อมูลของตัวเองผ่าน Firebase Auth
- **Firestore Security Rules**: จำกัดการเข้าถึงตาม userId
- **No sensitive data exposure**: ไม่แสดงข้อมูลที่ละเอียดอ่อน

### **Privacy Protection**
```javascript
// Security logging practice - ไม่ log ข้อมูลส่วนตัว
console.log('Loading usage data for user:', '(ID hidden for security)');
console.log('Period info:', { 
  period: periodInfo.period, 
  // ไม่ log userId หรือข้อมูลส่วนตัว
});
```

### **Data Integrity**
- **Validation**: ตรวจสอบข้อมูลก่อนแสดงผล
- **Error handling**: จัดการกรณีข้อมูลไม่ครบถ้วน
- **Fallback data**: ข้อมูลสำรองเมื่อเกิดข้อผิดพลาด

## 🚀 **Performance Optimization**

### **Data Loading Optimization**
```javascript
// Parallel API calls สำหรับประสิทธิภาพ
const [currentUsage, history, currentPeriodInfo] = await Promise.all([
  getUserUsage(user.uid),
  getUsageHistory(user.uid, 30),
  getCurrentPeriodInfo(user.uid)
]);
```

### **Chart Performance**
- **Animation disabled**: `isAnimationActive={false}` เพื่อประสิทธิภาพ
- **Responsive container**: ปรับขนาดอัตโนมัติไม่ re-render
- **Optimized data structure**: ข้อมูลถูกประมวลผลก่อนส่งให้ chart

### **Memory Management**
- **Cleanup on unmount**: useEffect cleanup functions
- **Efficient state updates**: ไม่ update state ที่ไม่จำเป็น
- **Lazy loading**: โหลดข้อมูลเมื่อ component mount เท่านั้น

## 🧪 **Testing Requirements**

### **Unit Tests Needed**
- Dashboard component rendering
- Data loading functions
- Period calculation logic
- Chart data transformation
- Error handling scenarios

### **Integration Tests**
- Complete dashboard load flow
- Firebase data retrieval
- Chart interaction
- Responsive design validation

### **Test Cases**
```javascript
describe('Dashboard Component', () => {
  test('should load usage data on mount', async () => {
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('Usage Statistics')).toBeInTheDocument();
    });
  });

  test('should display correct period information', async () => {
    const mockPeriodInfo = {
      period: 2,
      dayInPeriod: 15,
      periodStartDate: new Date('2024-01-01'),
      periodEndDate: new Date('2024-01-30')
    };
    
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText(/Period 2/)).toBeInTheDocument();
    });
  });

  test('should handle error states gracefully', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    render(<Dashboard />);
    // Test error handling
  });
});
```

## 📊 **Analytics & Monitoring**

### **Key Metrics to Track**
- Dashboard page views
- Data loading performance
- Error rates in data fetching
- User engagement with charts
- Period calculation accuracy

### **Performance Monitoring**
- Chart render time < 1 second
- Data loading time < 3 seconds
- Memory usage optimization
- Error tracking and resolution

## 🔄 **Integration Points**

### **With Other Components**
- **Sidebar**: Navigation to Dashboard via DashboardIcon
- **PlanStatus**: Shows current plan status
- **ChatAI**: Usage data affects chat capabilities
- **SubscriptionPage**: Plan upgrades impact dashboard data

### **External Dependencies**
- **Firebase Firestore**: Primary data source
- **Recharts**: Chart visualization library
- **Lottie React**: Icon animations
- **React Router**: Navigation and routing

## 📋 **Development Guidelines**

### **Code Standards**
- Follow React hooks best practices
- Use TypeScript-style JSDoc comments
- Implement comprehensive error handling
- Follow Firebase security logging practices

### **Data Operations**
- Always use serverTimestamp() for timestamps
- Validate data before setting state
- Handle edge cases gracefully
- Follow Firestore document reference rules

### **Performance Guidelines**
- Minimize unnecessary re-renders
- Use React.memo for expensive components
- Implement efficient data structures
- Cache frequently accessed data

## 🎯 **Success Metrics**

### **User Experience**
- Dashboard load time < 3 seconds
- Zero data loss in usage tracking
- 99.9% uptime for dashboard functionality
- Accurate period calculations

### **Technical Performance**
- Firebase operation success rate > 99%
- Chart rendering performance > 60 FPS
- Memory usage < 50MB for dashboard
- Error rate < 1%

## 🛠️ **Troubleshooting Guide**

### **Common Issues & Solutions**

#### **Issue 1: Period Calculation Errors**
```javascript
// Solution: Validate join date exists
const getUserJoinDate = async (userId) => {
  const userDoc = await getDoc(doc(db, 'users', userId));
  if (!userDoc.exists() || !userDoc.data().createdAt) {
    console.warn('User join date not found, using current date');
    return new Date();
  }
  return userDoc.data().createdAt.toDate();
};
```

#### **Issue 2: Chart Not Rendering**
```javascript
// Solution: Validate chart data structure
const validateChartData = (data) => {
  return data.filter(item => 
    item.date && 
    typeof item.count === 'number' && 
    item.displayDate
  );
};
```

#### **Issue 3: Performance Issues**
```javascript
// Solution: Implement data caching
const useCachedData = (key, fetchFunction) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const cached = sessionStorage.getItem(key);
    if (cached) {
      setData(JSON.parse(cached));
      setLoading(false);
      return;
    }
    
    fetchFunction().then(result => {
      setData(result);
      sessionStorage.setItem(key, JSON.stringify(result));
      setLoading(false);
    });
  }, [key]);
  
  return { data, loading };
};
```

## 📝 **Future Enhancements**

### **Planned Features**
- **Real-time updates**: Live chart updates without refresh
- **Export functionality**: Download usage data as CSV/PDF
- **Comparison views**: Compare different time periods
- **Advanced analytics**: Weekly/monthly aggregations
- **Notifications**: Usage limit warnings

### **Technical Improvements**
- **Caching strategy**: Implement intelligent data caching
- **Progressive loading**: Load chart data incrementally
- **Offline support**: Show cached data when offline
- **Performance metrics**: Built-in performance monitoring

---

**💡 สำหรับ AI Agents: ไฟล์นี้รวบรวมข้อมูลทั้งหมดที่จำเป็นสำหรับการพัฒนา maintain และ extend Dashboard feature ของ Time.AI application คุณสามารถใช้ข้อมูลนี้เป็น context สำหรับการทำงานใดๆ ที่เกี่ยวข้องกับ Dashboard ได้เลย ระบบ Dashboard ใช้ 30-day period system ที่ซับซ้อนและมีการจัดการข้อมูลการใช้งานแบบละเอียดและแม่นยำ**