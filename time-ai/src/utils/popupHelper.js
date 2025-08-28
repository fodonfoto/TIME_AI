/**
 * Popup Helper Utilities
 * จัดการปัญหา popup blocker และให้คำแนะนำผู้ใช้
 */

export const detectPopupBlocker = () => {
  try {
    const popup = window.open('', '_blank', 'width=1,height=1');
    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      return true; // Popup is blocked
    }
    popup.close();
    return false; // Popup is allowed
  } catch (e) {
    return true; // Popup is blocked
  }
};

export const getPopupInstructions = (browser = 'unknown') => {
  const instructions = {
    chrome: [
      '1. คลิกที่ไอคอน 🔒 หรือ ⓘ ข้างซ้ายของ URL',
      '2. เลือก "Site settings" หรือ "การตั้งค่าเว็บไซต์"',
      '3. เปลี่ยน "Pop-ups and redirects" เป็น "Allow"',
      '4. รีเฟรชหน้าเว็บและลองใหม่'
    ],
    firefox: [
      '1. คลิกที่ไอคอน 🛡️ ข้างซ้ายของ URL',
      '2. คลิก "Turn off Blocking for This Site"',
      '3. หรือไปที่ Settings > Privacy & Security > Permissions',
      '4. รีเฟรชหน้าเว็บและลองใหม่'
    ],
    safari: [
      '1. ไปที่ Safari > Preferences > Websites',
      '2. เลือก "Pop-up Windows" ทางซ้าย',
      '3. เปลี่ยนการตั้งค่าสำหรับเว็บไซต์นี้เป็น "Allow"',
      '4. รีเฟรชหน้าเว็บและลองใหม่'
    ],
    edge: [
      '1. คลิกที่ไอคอน 🔒 ข้างซ้ายของ URL',
      '2. เลือก "Site permissions"',
      '3. เปลี่ยน "Pop-ups and redirects" เป็น "Allow"',
      '4. รีเฟรชหน้าเว็บและลองใหม่'
    ],
    unknown: [
      '1. มองหาไอคอนการตั้งค่าข้างซ้ายของ URL',
      '2. เปิดการตั้งค่าเว็บไซต์หรือ Site Settings',
      '3. อนุญาต Pop-ups สำหรับเว็บไซต์นี้',
      '4. รีเฟรชหน้าเว็บและลองใหม่'
    ]
  };

  return instructions[browser] || instructions.unknown;
};

export const getBrowserName = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (userAgent.includes('chrome') && !userAgent.includes('edge')) {
    return 'chrome';
  } else if (userAgent.includes('firefox')) {
    return 'firefox';
  } else if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
    return 'safari';
  } else if (userAgent.includes('edge')) {
    return 'edge';
  }
  
  return 'unknown';
};

export const showPopupBlockerHelp = () => {
  const browser = getBrowserName();
  const instructions = getPopupInstructions(browser);
  
  return {
    browser,
    instructions,
    message: `ตรวจพบว่าเบราว์เซอร์บล็อก popup กรุณาทำตามขั้นตอนเหล่านี้:`
  };
};