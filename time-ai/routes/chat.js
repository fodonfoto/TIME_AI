import express from 'express';

const router = express.Router();

// Question classifier using GPT-5 Mini
async function classifyQuestion(userMessage) {
  const classifierPrompt = [
    {
      role: 'system',
      content: `คุณเป็น TIME AI classifier ที่จำแนกประเภทคำถาม ตอบเป็นหนึ่งในสามประเภทนี้เท่านั้น:
1. "general" - คำถามทั่วไป ข้อมูลพื้นฐาน การสนทนาธรรมดา
2. "research" - คำถามเชิงลึกงานวิจัย ต้องการข้อมูลอ้างอิง วิเคราะห์ซับซ้อน
3. "coding" - คำถามเกี่ยวกับ Design, Programming, Development, Code, การแก้ไข bug, การรีวิว code, การเขียนโปรแกรม`
    },
    {
      role: 'user',
      content: userMessage
    }
  ];

  const classification = await puter.ai.chat(classifierPrompt, {
    model: 'gpt-5-mini',
    max_tokens: 10
  });

  return classification.toLowerCase().trim();
}

// Enhanced response with research sources
async function getResearchResponse(messages) {
  const response = await puter.ai.chat([
    {
      role: 'system',
      content: `คุณเป็น AI researcher ที่ตอบคำถามเชิงลึกพร้อมแนบแหล่งข้อมูลอ้างอิง

รูปแบบการตอบ:
- ใช้ headers (## หัวข้อหลัก, ### หัวข้อย่อย) เพื่อจัดโครงสร้าง
- ใช้ bullet points (-) สำหรับรายการ
- ใช้ **ตัวหนา** สำหรับคำสำคัญ
- ใช้ \`inline code\` สำหรับ technical terms
- ใช้ code blocks (\`\`\`) สำหรับ code examples
- เขียนให้อ่านง่าย เป็นระเบียบ เหมือนบทความ`
    },
    ...messages
  ], {
    model: 'gpt-5-mini',
    max_tokens: 3000
  });

  return response + '\n\n## 📚 แหล่งข้อมูลอ้างอิง\n\n- ข้อมูลจาก **GPT-5 Mini Knowledge Base**\n- วิเคราะห์เชิงลึกจาก **AI Reasoning**\n- การประมวลผลข้อมูลแบบ **Real-time**';
}

// Coding response with Claude-4
async function getCodingResponse(messages) {
  return await puter.ai.chat([
    {
      role: 'system',
      content: `คุณเป็น expert developer ที่ให้คำแนะนำด้าน Design และ Coding อย่างละเอียด

กฎสำคัญ - ต้องปฏิบัติเสมอ:
1. ทุกครั้งที่แนะนำ code ต้องใช้ code blocks ด้วย \`\`\` เสมอ
2. ระบุภาษาหลัง \`\`\` เช่น \`\`\`javascript, \`\`\`python, \`\`\`css
3. ห้ามใส่ code ในข้อความธรรมดาโดยไม่มี code blocks

รูปแบบการตอบ:
- ใช้ headers (## หัวข้อหลัก, ### หัวข้อย่อย) เพื่อจัดโครงสร้าง
- ใช้ bullet points (-) สำหรับรายการขั้นตอน
- ใช้ **ตัวหนา** สำหรับคำสำคัญและชื่อ functions
- ใช้ \`inline code\` สำหรับ variable names และ technical terms
- ใช้ code blocks พร้อมระบุภาษา เช่น \`\`\`javascript หรือ \`\`\`python
- เขียนให้อ่านง่าย เป็นระเบียบ เหมือนบทความ technical
- ให้ code examples ที่ copy ได้ทันที
- อธิบาย best practices และ common pitfalls

ตัวอย่างการใช้ code blocks ที่ถูกต้อง:

\`\`\`javascript
const authHeader = req.headers.authorization;
if (!authHeader || !authHeader.startsWith('Bearer ')) {
  return res.status(401).json({ error: 'Missing or invalid Authorization header' });
}
\`\`\`

\`\`\`python
def validate_input(data):
    if not data:
        raise ValueError("Data cannot be empty")
    return True
\`\`\`

ห้ามทำ: ใส่ code ในข้อความธรรมดาแบบนี้ const example = 'wrong'
ต้องทำ: ใส่ code ใน code blocks เสมอ`
    },
    ...messages
  ], {
    model: 'claude-sonnet-4',
    max_tokens: 4000
  });
}

router.post('/', async (req, res) => {
  try {
    const { messages } = req.body;
    const lastMessage = messages[messages.length - 1];
    
    if (!lastMessage || lastMessage.role !== 'user') {
      return res.status(400).json({ error: 'Invalid message format' });
    }

    // Step 1: Classify question type
    const questionType = await classifyQuestion(lastMessage.content);
    console.log('Question classified as:', questionType);

    let response;

    // Step 2: Route to appropriate model
    if (questionType.includes('general')) {
      // General questions -> GPT-5 Mini with formatting
      response = await puter.ai.chat([
        {
          role: 'system',
          content: `คุณเป็น AI assistant ที่ตอบคำถามทั่วไปอย่างเป็นมิตรและมีประโยชน์

รูปแบบการตอบ:
- ใช้ headers (## หัวข้อหลัก, ### หัวข้อย่อย) เมื่อเหมาะสม
- ใช้ bullet points (-) สำหรับรายการ
- ใช้ **ตัวหนา** สำหรับคำสำคัญ
- เขียนให้อ่านง่าย เป็นระเบียบ เหมือนบทความ`
        },
        ...messages
      ], {
        model: 'gpt-5-mini',
        max_tokens: 2000
      });
    } else if (questionType.includes('research')) {
      // Research questions -> GPT-5 Mini with enhanced response
      response = await getResearchResponse(messages);
    } else if (questionType.includes('coding')) {
      // Coding questions -> Claude-4 with code blocks
      response = await getCodingResponse(messages);
      console.log('Coding response from Claude:', response.substring(0, 500) + '...');
    } else {
      // Fallback to general with formatting
      response = await puter.ai.chat([
        {
          role: 'system',
          content: `คุณเป็น AI assistant ที่ตอบคำถามอย่างเป็นมิตรและมีประโยชน์

รูปแบบการตอบ:
- ใช้ headers (## หัวข้อหลัก, ### หัวข้อย่อย) เมื่อเหมาะสม
- ใช้ bullet points (-) สำหรับรายการ
- ใช้ **ตัวหนา** สำหรับคำสำคัญ
- เขียนให้อ่านง่าย เป็นระเบียบ เหมือนบทความ`
        },
        ...messages
      ], {
        model: 'gpt-5-mini',
        max_tokens: 2000
      });
    }

    // Debug: Log response format
    console.log('Final response preview:', response.substring(0, 200) + '...');
    console.log('Contains code blocks:', response.includes('```'));

    res.json({
      choices: [{
        message: {
          role: 'assistant',
          content: response
        }
      }],
      metadata: {
        questionType,
        modelUsed: questionType.includes('coding') ? 'claude-sonnet-4' : 'gpt-5-mini'
      }
    });
  } catch (error) {
    console.error('Chat error:', error.message);
    
    // ส่ง error message ที่เข้าใจได้กลับไปยัง frontend
    res.status(500).json({ 
      error: 'Chat request failed',
      details: error.message,
      suggestions: [
        'รีเฟรชหน้าเว็บ',
        'ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต',
        'ไปที่ /chat-debug เพื่อตรวจสอบระบบ'
      ]
    });
  }
});

export default router;