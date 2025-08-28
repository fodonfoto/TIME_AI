import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where,
  addDoc,
  serverTimestamp,
  connectFirestoreEmulator
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';

// ทดสอบ Firebase Connection
export const testFirebaseConnection = async () => {
  try {
    console.log('🔍 Testing Firebase connection...');
    console.log('🔗 Database instance:', !!db);
    console.log('🔗 Auth instance:', !!auth);
    
    // ตรวจสอบ authentication status
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        console.log('👤 Current user:', user ? {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName
        } : 'No user authenticated');
        
        unsubscribe();
        resolve({
          dbConnected: !!db,
          authConnected: !!auth,
          userAuthenticated: !!user,
          user: user ? {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName
          } : null
        });
      });
    });
  } catch (error) {
    console.error('❌ Firebase connection test failed:', error);
    return {
      dbConnected: false,
      authConnected: false,
      userAuthenticated: false,
      error: error.message
    };
  }
};

/**
 * โครงสร้างฐานข้อมูลใหม่:
 * users > plan_configs > chat_id (เก็บข้อความจริง) > history_items (เก็บข้อมูลสำหรับ History page)
 */

// 1. สร้าง subcollection structure สำหรับ new user
export const createUserStructure = async (userId, userInfo) => {
  try {
    console.log(`🔄 กำลังสร้างโครงสร้างสำหรับ user: ${userId}`);
    
    if (!db) {
      throw new Error('Firebase database not initialized');
    }

    // สร้าง user document
    const userRef = doc(db, 'users', userId);
    const userData = {
      ...userInfo,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    await setDoc(userRef, userData);
    console.log('✅ User document created successfully');

    // สร้าง plan_configs subcollection
    const planConfigsRef = collection(userRef, 'plan_configs');
    const defaultPlanRef = doc(planConfigsRef, 'current_plan');
    const planData = {
      planName: 'Free Plan',
      dailyLimit: 5,
      dailyUsage: 0,
      lastResetDate: new Date().toISOString().split('T')[0],
      createdAt: serverTimestamp()
    };
    
    await setDoc(defaultPlanRef, planData);
    console.log('✅ Plan config created successfully');

    console.log(`✅ สร้างโครงสร้างสำหรับ user ${userId} เรียบร้อย`);
    return true;
  } catch (error) {
    console.error('❌ Error creating user structure:', error);
    return false;
  }
};

// 2. สร้าง chat session ใหม่
export const createChatSession = async (userId, chatTitle = 'การสนทนาใหม่', initialModel = null) => {
  try {
    const userRef = doc(db, 'users', userId);
    const planConfigsRef = collection(userRef, 'plan_configs');
    const currentPlanRef = doc(planConfigsRef, 'current_plan');
    const chatIdRef = collection(currentPlanRef, 'chat_id');
    
    // สร้าง chat_id document พร้อมข้อมูลเริ่มต้น
    const newChatRef = await addDoc(chatIdRef, {
      title: chatTitle,
      messages: [], // เก็บข้อความจริงที่นี่
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: 'active',
      // เพิ่มข้อมูล AI model ที่ใช้ในการสร้างแชทใหม่ (ถ้ามี)
      initialModel: initialModel,
      lastModel: null // จะอัปเดตเมื่อมีการตอบกลับจาก AI
    });

    console.log(`✅ สร้าง chat session ใหม่: ${newChatRef.id}`);
    return newChatRef.id;
  } catch (error) {
    console.error('❌ Error creating chat session:', error);
    return null;
  }
};

// 3. บันทึกข้อความในการสนทนา (เก็บใน chat_id)
export const saveChatMessage = async (userId, chatId, message) => {
  try {
    const userRef = doc(db, 'users', userId);
    const planConfigsRef = collection(userRef, 'plan_configs');
    const currentPlanRef = doc(planConfigsRef, 'current_plan');
    const chatIdRef = collection(currentPlanRef, 'chat_id');
    const specificChatRef = doc(chatIdRef, chatId);
    
    // ดึงข้อความเดิม
    const chatDoc = await getDocs(query(collection(currentPlanRef, 'chat_id'), where('__name__', '==', chatId)));
    let existingMessages = [];
    
    if (!chatDoc.empty) {
      const chatData = chatDoc.docs[0].data();
      existingMessages = chatData.messages || [];
    }
    
    // เพิ่มข้อความใหม่
    const newMessage = {
      role: message.role,
      content: message.content,
      timestamp: serverTimestamp(),
      messageId: `msg_${Date.now()}`,
      // เพิ่มข้อมูล AI model ที่ใช้ในการตอบกลับ (ถ้ามี)
      model: message.model || null
    };
    
    const updatedMessages = [...existingMessages, newMessage];
    
    // อัปเดต chat document
    await setDoc(specificChatRef, {
      title: message.title || 'การสนทนาใหม่',
      messages: updatedMessages,
      updatedAt: serverTimestamp(),
      status: 'active',
      messageCount: updatedMessages.length,
      // เก็บข้อมูล AI model ล่าสุดที่ใช้ในการตอบกลับ
      lastModel: message.role === 'assistant' ? message.model : null
    }, { merge: true });

    console.log(`✅ บันทึกข้อความ: ${newMessage.messageId}`);
    return newMessage.messageId;
  } catch (error) {
    console.error('❌ Error saving chat message:', error);
    return null;
  }
};

// 4. สร้าง history item (เก็บใน history_items สำหรับแสดงในหน้า History)
export const createHistoryItem = async (userId, chatId, historyData) => {
  try {
    const userRef = doc(db, 'users', userId);
    const planConfigsRef = collection(userRef, 'plan_configs');
    const currentPlanRef = doc(planConfigsRef, 'current_plan');
    const chatIdRef = collection(currentPlanRef, 'chat_id');
    const specificChatRef = doc(chatIdRef, chatId);
    const historyItemsRef = collection(specificChatRef, 'history_items');
    
    // ดึงข้อมูล chat session เพื่อเอาข้อมูล model
    const chatDoc = await getDoc(specificChatRef);
    let initialModel = null;
    let lastModel = null;
    
    if (chatDoc.exists()) {
      const chatData = chatDoc.data();
      initialModel = chatData.initialModel || null;
      lastModel = chatData.lastModel || null;
    }
    
    // สร้าง history item
    const historyItemRef = await addDoc(historyItemsRef, {
      title: historyData.title,
      preview: historyData.preview, // ข้อความสุดท้าย
      date: historyData.date || new Date().toLocaleDateString('th-TH'),
      messageCount: historyData.messageCount || 0,
      createdAt: serverTimestamp(),
      chatId: chatId, // reference กลับไป chat_id
      // เพิ่มข้อมูล AI model ที่ใช้ในการตอบกลับ
      initialModel: initialModel,
      lastModel: lastModel
    });

    console.log(`✅ สร้าง history item: ${historyItemRef.id}`);
    return historyItemRef.id;
  } catch (error) {
    console.error('❌ Error creating history item:', error);
    return null;
  }
};

// 5. ดึงประวัติการสนทนาทั้งหมดของ user (จาก history_items)
export const getUserChatHistory = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const planConfigsRef = collection(userRef, 'plan_configs');
    const currentPlanRef = doc(planConfigsRef, 'current_plan');
    const chatIdRef = collection(currentPlanRef, 'chat_id');
    
    const chatSnapshot = await getDocs(chatIdRef);
    const chatHistory = [];

    for (const chatDoc of chatSnapshot.docs) {
      const chatData = chatDoc.data();
      const historyItemsRef = collection(chatDoc.ref, 'history_items');
      const historySnapshot = await getDocs(historyItemsRef);
      
      // ดึงข้อมูลจาก history_items
      const historyItems = historySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // ถ้ามี history items ให้เอามาแสดง
      if (historyItems.length > 0) {
        historyItems.forEach(item => {
          chatHistory.push({
            historyId: item.id,
            chatId: chatDoc.id,
            title: item.title,
            preview: item.preview,
            date: item.date,
            messageCount: item.messageCount,
            createdAt: item.createdAt,
            // เพิ่มข้อมูล AI model ที่ใช้ในการตอบกลับ
            initialModel: chatData.initialModel || null,
            lastModel: chatData.lastModel || null
          });
        });
      }
    }

    return chatHistory.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error('❌ Error getting user chat history:', error);
    return [];
  }
};

// 6. ดึงข้อมูลการสนทนาเฉพาะ chat_id (ข้อความจริง)
export const getChatById = async (userId, chatId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const planConfigsRef = collection(userRef, 'plan_configs');
    const currentPlanRef = doc(planConfigsRef, 'current_plan');
    const chatIdRef = collection(currentPlanRef, 'chat_id');
    const specificChatRef = doc(chatIdRef, chatId);
    
    const chatDoc = await getDocs(query(chatIdRef, where('__name__', '==', chatId)));
    
    if (!chatDoc.empty) {
      const chatData = chatDoc.docs[0].data();
      return {
        chatId: chatId,
        title: chatData.title,
        messages: chatData.messages || [],
        createdAt: chatData.createdAt,
        updatedAt: chatData.updatedAt,
        // เพิ่มข้อมูล AI model ที่ใช้ในการตอบกลับ
        initialModel: chatData.initialModel || null,
        lastModel: chatData.lastModel || null
      };
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error getting chat by ID:', error);
    return null;
  }
};

// 7. สร้างข้อมูล mockup ให้สมบูรณ์ 100%
export const createCompleteMockupData = async (userId = null) => {
  try {
    console.log('🎭 เริ่มสร้างข้อมูล mockup ให้สมบูรณ์...');
    
    const testUserId = userId || `mockup_user_${Date.now()}`;
    
    // 1. สร้างโครงสร้าง user
    const userInfo = {
      email: `${testUserId}@example.com`,
      firstName: 'ทดสอบ',
      lastName: 'ระบบ',
      displayName: `ผู้ใช้ทดสอบ ${testUserId.slice(-6)}`,
      photoURL: 'https://via.placeholder.com/150',
      uid: testUserId
    };
    
    await createUserStructure(testUserId, userInfo);
    console.log('✅ สร้างโครงสร้าง user เรียบร้อย');
    
    // 2. สร้าง chat sessions พร้อมข้อความและ history items
    const chatData = [
      {
        title: 'สอบถามเกี่ยวกับ AI',
        initialModel: 'gpt-4o',
        messages: [
          { role: 'user', content: 'AI คืออะไร และทำงานอย่างไร?' },
          { role: 'assistant', content: 'AI หรือ Artificial Intelligence คือเทคโนโลยีที่ช่วยให้คอมพิวเตอร์สามารถเรียนรู้และตัดสินใจได้เหมือนมนุษย์', model: 'gpt-4o' },
          { role: 'user', content: 'มีประเภทของ AI อะไรบ้าง?' },
          { role: 'assistant', content: 'AI แบ่งออกเป็น 3 ประเภทหลัก: 1) Narrow AI (AI เฉพาะทาง) 2) General AI (AI ทั่วไป) 3) Super AI (AI ที่เหนือกว่ามนุษย์)', model: 'gpt-4o' }
        ]
      },
      {
        title: 'วางแผนการเรียน',
        initialModel: 'gpt-3.5-turbo',
        messages: [
          { role: 'user', content: 'ช่วยวางแผนการเรียนภาษาอังกฤษให้หน่อย' },
          { role: 'assistant', content: 'แผนการเรียนภาษาอังกฤษ 3 เดือน:\n1. เดือนที่ 1: พื้นฐานไวยากรณ์และคำศัพท์\n2. เดือนที่ 2: ฝึกฟัง-พูด\n3. เดือนที่ 3: อ่าน-เขียน', model: 'gpt-3.5-turbo' },
          { role: 'user', content: 'มีแอปไหนแนะนำสำหรับฝึกภาษาอังกฤษบ้าง?' },
          { role: 'assistant', content: 'แนะนำ Duolingo, BBC Learning English, และ HelloTalk', model: 'gpt-3.5-turbo' }
        ]
      },
      {
        title: 'ปรึกษาเรื่องงาน',
        initialModel: 'claude-3-opus',
        messages: [
          { role: 'user', content: 'กำลังคิดจะเปลี่ยนงาน ควรพิจารณาอะไรบ้าง?' },
          { role: 'assistant', content: 'การเปลี่ยนงานควรพิจารณา:\n1. เป้าหมายในอาชีพ\n2. สภาพการเงิน\n3. โอกาสเติบโต\n4. สภาพแวดล้อมการทำงาน\n5. Work-life balance', model: 'claude-3-opus' },
          { role: 'user', content: 'ขอบคุณครับ มีประโยชน์มาก' },
          { role: 'assistant', content: 'ยินดีครับ! หวังว่าจะช่วยให้ตัดสินใจได้ดีนะครับ', model: 'claude-3-opus' }
        ]
      }
    ];
    
    let totalMessages = 0;
    const chatSessions = [];
    
    for (const chat of chatData) {
      // สร้าง chat session
      const chatId = await createChatSession(testUserId, chat.title);
      if (chatId) {
        chatSessions.push({ chatId, title: chat.title });
        
        // บันทึกข้อความทั้งหมดใน chat_id
        const userRef = doc(db, 'users', testUserId);
        const planConfigsRef = collection(userRef, 'plan_configs');
        const currentPlanRef = doc(planConfigsRef, 'current_plan');
        const chatIdRef = collection(currentPlanRef, 'chat_id');
        const specificChatRef = doc(chatIdRef, chatId);
        
        await setDoc(specificChatRef, {
          title: chat.title,
          messages: chat.messages,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          status: 'active',
          messageCount: chat.messages.length
        });
        
        // สร้าง history item
        const lastMessage = chat.messages[chat.messages.length - 1];
        await createHistoryItem(testUserId, chatId, {
          title: chat.title,
          preview: lastMessage.content.substring(0, 50) + '...',
          date: new Date().toLocaleDateString('th-TH'),
          messageCount: chat.messages.length
        });
        
        totalMessages += chat.messages.length;
        console.log(`✅ สร้าง chat "${chat.title}" เรียบร้อย (${chat.messages.length} ข้อความ)`);
      }
    }
    
    console.log('🎉 สร้างข้อมูล mockup เรียบร้อยแล้ว!');
    
    return {
      success: true,
      testUserId,
      chatSessions: chatSessions.length,
      totalMessages,
      message: `สร้างข้อมูล mockup สำหรับ user ${testUserId} เรียบร้อย (${chatSessions.length} chats, ${totalMessages} messages)`
    };
    
  } catch (error) {
    console.error('❌ Error creating complete mockup data:', error);
    return {
      success: false,
      error: error.message,
      message: 'เกิดข้อผิดพลาดในการสร้างข้อมูล mockup'
    };
  }
};

// 8. ข้อมูลที่ควรมีในแต่ละ collection
export const getDataStructureInfo = () => {
  return {
    users: {
      description: "ข้อมูลผู้ใช้หลัก",
      fields: ["email", "firstName", "lastName", "displayName", "photoURL", "uid", "createdAt", "updatedAt"]
    },
    plan_configs: {
      description: "ข้อมูลแผนการใช้งานของผู้ใช้",
      fields: ["planName", "dailyLimit", "dailyUsage", "lastResetDate", "features", "createdAt"]
    },
    chat_id: {
      description: "ข้อมูลการสนทนาจริง (เก็บข้อความ)",
      fields: ["title", "messages", "createdAt", "updatedAt", "status", "messageCount"]
    },
    history_items: {
      description: "ข้อมูลสำหรับแสดงในหน้า History",
      fields: ["title", "preview", "date", "messageCount", "chatId", "createdAt"]
    }
  };
};