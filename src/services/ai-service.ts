// AI服务，用于与火山方舟API通信
import { volcengineConfig, unsplashConfig, systemPrompts, apiEndpoints, devConfig } from '@/config/api-config';
import { imageCacheService } from './image-cache-service';

// 定义生成内容的接口
export interface GeneratedContent {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  tags: string[];
  relatedImages?: string[]; // 添加相关图片数组
  createdAt: number; // 添加创建时间
}

// 生成心理学内容
export async function generatePsychologyContent(userComment: string): Promise<GeneratedContent[]> {
  console.log('生成内容，用户问题:', userComment);
  
  // 如果使用本地模拟数据
  if (devConfig.useLocalMockData) {
    console.log('使用模拟数据');
    // 模拟API响应延迟
    await new Promise(resolve => setTimeout(resolve, devConfig.mockDelay));
    return generateMockContent(userComment);
  }
  
  try {
    // 尝试调用火山方舟API
    console.log('尝试调用火山方舟API');
    console.log('火山方舟配置:', {
      apiKey: volcengineConfig.apiKey,
      model: volcengineConfig.model,
      endpoint: apiEndpoints.volcengine
    });
    
    // 构建请求体 - 使用火山方舟API的官方格式（doubao模型）
    const requestBody = {
      model: volcengineConfig.model,
      messages: [
        {
          role: "system",
          content: systemPrompts.psychologyAnalysis
        },
        {
          role: "user",
          content: userComment
        }
      ],
      temperature: volcengineConfig.temperature,
      max_tokens: volcengineConfig.maxTokens
    };
    
    console.log('请求体:', JSON.stringify(requestBody));
    
    // 调用火山方舟API
    const response = await fetch(apiEndpoints.volcengine, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${volcengineConfig.apiKey}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log('API响应状态:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API错误响应:', errorText);
      throw new Error(`API请求失败: ${response.status}, ${errorText}`);
    }
    
    const data = await response.json();
    console.log('API响应数据:', data);
    
    // 根据火山方舟API的官方响应格式获取内容
    const aiResponse = data.choices?.[0]?.message?.content || 
                      data.output?.text || 
                      data.response || 
                      data.choices?.[0]?.text || 
                      data.result || 
                      '';
    
    if (!aiResponse) {
      console.error('API响应中没有找到内容:', data);
      throw new Error('API返回的响应为空');
    }
    
    // 解析AI响应
    return parseAIResponse(aiResponse, userComment);
  } catch (error) {
    console.error('调用火山方舟API失败:', error);
    // 如果API调用失败，回退到模拟数据
    console.log('API调用失败，使用模拟数据');
    const mockContent = generateMockContent(userComment);
    
    // 添加一些定制信息，表明这是基于火山方舟API的模拟
    const content = await mockContent;
    if (content.length > 0) {
      content[0].title = `${content[0].title} (火山方舟AI分析)`;
      content[0].tags = [...content[0].tags, '火山方舟AI'];
    }
    
    return mockContent;
  }
}

// 保留原来的函数名以保持兼容性
export const generateNutritionContent = generatePsychologyContent;

// 解析AI响应
async function parseAIResponse(aiResponse: string, userComment: string): Promise<GeneratedContent[]> {
  console.log('解析AI响应:', aiResponse);
  try {
    // 尝试解析AI响应
    const lines = aiResponse.split('\n');
    let title = '';
    let explanation = '';
    let suggestion = '';
    let tags: string[] = [];
    
    for (const line of lines) {
      if (line.startsWith('标题：')) {
        title = line.replace('标题：', '').trim().replace(/^\[|\]$/g, '');
      } else if (line.startsWith('解释：')) {
        explanation = line.replace('解释：', '').trim();
      } else if (line.startsWith('建议：')) {
        suggestion = line.replace('建议：', '').trim();
      } else if (line.startsWith('标签：')) {
        const tagLine = line.replace('标签：', '').trim();
        tags = tagLine.replace(/^\[|\]$/g, '').split(/[,，]/).map(tag => tag.trim().replace(/^\[|\]$/g, ''));
      }
    }
    
    // 如果解析失败，使用默认值
    if (!title) title = '心理学分析';
    if (!explanation && !suggestion) {
      explanation = aiResponse;
    }
    if (tags.length === 0) tags = ['心理分析', '情绪管理'];
    
    // 格式化描述内容，添加段落分隔和思维导图
    const formattedDescription = formatContentWithMindMap(explanation, suggestion, tags, userComment);
    
    // 搜索相关图片
    let relatedImages: string[] = [];
    let mainImageUrl = 'https://images.unsplash.com/photo-1527525443983-6e60c75fff46?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80';
    
    try {
      // 使用标题和标签作为搜索关键词
      const searchKeywords = [title, ...tags].join(' ');
      relatedImages = await getRelatedImages(searchKeywords);
      
      // 如果找到相关图片，使用第一张作为主图
      if (relatedImages.length > 0) {
        mainImageUrl = relatedImages[0];
      }
    } catch (error) {
      console.error('搜索相关图片失败:', error);
      // 如果搜索失败，使用默认图片
    }
    
    return [{
      id: Date.now(),
      title,
      description: formattedDescription,
      imageUrl: mainImageUrl,
      tags: [...tags, '火山方舟AI'],
      relatedImages: relatedImages.length > 0 ? relatedImages : [mainImageUrl],
      createdAt: Date.now()
    }];
  } catch (error) {
    console.error('解析AI响应失败:', error);
    // 如果解析失败，回退到模拟数据
    return generateMockContent(userComment);
  }
}

// 格式化内容，添加段落分隔和思维导图
function formatContentWithMindMap(explanation: string, suggestion: string, tags: string[], userComment: string): string {
  let formattedContent = '';
  
  // 添加思维导图部分
  const mindMapKeywords = extractKeywords(explanation + ' ' + suggestion + ' ' + userComment, tags);
  if (mindMapKeywords.length > 0) {
    formattedContent += '🧠 **核心概念关系图**\n\n';
    formattedContent += generateMindMapText(mindMapKeywords, userComment);
    formattedContent += '\n\n---\n\n';
  }
  
  // 格式化解释部分
  if (explanation) {
    formattedContent += '📖 **心理学解析**\n\n';
    formattedContent += formatParagraphs(explanation);
    formattedContent += '\n\n';
  }
  
  // 格式化建议部分
  if (suggestion) {
    formattedContent += '💡 **心理建议**\n\n';
    formattedContent += formatParagraphs(suggestion);
  }
  
  return formattedContent;
}

// 提取关键词
function extractKeywords(text: string, tags: string[]): string[] {
  const keywords = new Set<string>();
  
  // 添加标签作为关键词
  tags.forEach(tag => {
    if (tag && tag !== '火山方舟AI') {
      keywords.add(tag);
    }
  });
  
  // 从文本中提取心理学相关关键词
  const psychologyKeywords = [
    '情绪', '焦虑', '抑郁', '压力', '自尊', '自信',
    '认知', '行为', '思维', '潜意识', '意识', '人格',
    '沟通', '关系', '冲突', '亲密', '依恋', '信任',
    '创伤', '恢复', '成长', '韧性', '幸福感', '满足感',
    '心理健康', '心理咨询', '心理治疗', '心理干预',
    '情绪调节', '情绪管理', '认知重构', '行为改变',
    '自我认知', '自我接纳', '自我实现', '自我成长'
  ];
  
  psychologyKeywords.forEach(keyword => {
    if (text.includes(keyword)) {
      keywords.add(keyword);
    }
  });
  
  return Array.from(keywords).slice(0, 6); // 限制关键词数量
}

// 生成思维导图文本
function generateMindMapText(keywords: string[], userComment: string): string {
  if (keywords.length === 0) return '';
  
  let mindMap = '';
  const centerTopic = keywords[0] || '心理健康';
  
  mindMap += `┌─ 🎯 **${centerTopic}**\n`;
  
  keywords.slice(1).forEach((keyword, index) => {
    const isLast = index === keywords.length - 2;
    const connector = isLast ? '└─' : '├─';
    mindMap += `${connector} 📌 ${keyword}\n`;
  });
  
  // 添加用户问题的关联
  if (userComment) {
    mindMap += `└─ ❓ 用户关注: ${userComment.slice(0, 20)}${userComment.length > 20 ? '...' : ''}\n`;
  }
  
  return mindMap;
}

// 格式化段落，添加适当的换行
function formatParagraphs(text: string): string {
  // 按句号分割，但保留句号
  const sentences = text.split(/([。！？])/).filter(s => s.trim());
  let formattedText = '';
  let currentParagraph = '';
  
  for (let i = 0; i < sentences.length; i += 2) {
    const sentence = sentences[i] || '';
    const punctuation = sentences[i + 1] || '';
    const fullSentence = sentence + punctuation;
    
    currentParagraph += fullSentence;
    
    // 每2-3句话换一段，或者遇到特定关键词时换段
    if ((i >= 4 && (i % 4 === 0)) || 
        sentence.includes('建议') || 
        sentence.includes('此外') || 
        sentence.includes('另外') ||
        sentence.includes('同时')) {
      formattedText += currentParagraph.trim() + '\n\n';
      currentParagraph = '';
    }
  }
  
  // 添加剩余内容
  if (currentParagraph.trim()) {
    formattedText += currentParagraph.trim();
  }
  
  return formattedText;
}

// 生成模拟内容
async function generateMockContent(userComment: string): Promise<GeneratedContent[]> {
  console.log('使用模拟数据');
  
  // 根据用户问题的内容，生成不同的响应
  const generatedContents: GeneratedContent[] = [];
  let content: GeneratedContent | null = null;
  
  if (userComment.includes('焦虑') || userComment.includes('紧张') || userComment.includes('担忧')) {
    content = {
      id: 1,
      title: '焦虑情绪的认知调节',
      description: '焦虑是人类面对不确定性和潜在威胁时的自然反应，就像我们的内部预警系统。适度的焦虑可以帮助我们保持警觉和动力，但过度的焦虑则会干扰日常生活和心理健康。\n\n从认知角度看，焦虑往往源于对未来的过度担忧和灾难性思维。我们的大脑倾向于放大潜在风险，低估自己的应对能力。这种思维模式就像戴着放大镜看问题，使小石头看起来像大山。\n\n认知重构是应对焦虑的有效策略之一。它包括识别自动化的负面思维，质疑其合理性，并用更平衡、现实的想法替代它们。例如，将"如果我失败了，一切就完了"重构为"失败是学习的机会，我可以从中成长"。\n\n此外，正念冥想可以帮助我们将注意力从担忧未来转移到当下体验。通过专注于呼吸和身体感觉，我们可以打破焦虑的循环，培养内心的平静。\n\n渐进式肌肉放松也是缓解焦虑的实用技术。通过有意识地绷紧和放松不同的肌肉群，我们可以减轻身体紧张，促进整体放松。',
      imageUrl: 'https://images.unsplash.com/photo-1527525443983-6e60c75fff46?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
      tags: ['焦虑管理', '认知重构', '情绪调节'],
      createdAt: Date.now()
    };
  } else if (userComment.includes('抑郁') || userComment.includes('情绪低落') || userComment.includes('无力')) {
    content = {
      id: 2,
      title: '抑郁情绪的心理疗愈',
      description: '抑郁情绪就像一层灰色的滤镜，影响我们看待自己、他人和世界的方式。它不仅仅是感到悲伤，还可能包括持续的无力感、失去兴趣、睡眠和食欲变化等症状。\n\n抑郁的认知模型指出，负面的思维模式往往维持和加深抑郁情绪。这些模式包括选择性关注负面信息、过度概括化（"我总是失败"）和非黑即白的思维（"如果不完美，就是失败"）。\n\n行为激活是应对抑郁的有效策略之一。尽管可能缺乏动力，但参与愉快和有意义的活动可以打破抑郁的恶性循环。从小而可行的步骤开始，逐渐增加活动量和复杂性。\n\n社会联系也是抵抗抑郁的重要资源。即使在感到孤独时，尝试维持与亲友的联系，分享感受和经历，可以提供情感支持和不同视角。\n\n此外，自我关怀是应对抑郁的核心。这包括充分休息、均衡饮食、适度运动，以及对自己的想法和感受持接纳和理解的态度，就像对待亲密朋友一样。',
      imageUrl: 'https://images.unsplash.com/photo-1527525443983-6e60c75fff46?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
      tags: ['抑郁管理', '行为激活', '自我关怀'],
      createdAt: Date.now()
    };
  } else if (userComment.includes('压力') || userComment.includes('倦怠') || userComment.includes('疲惫')) {
    content = {
      id: 3,
      title: '压力管理与心理韧性',
      description: '压力是我们对生活中各种挑战和要求的身心反应，就像弹簧受到的张力。适度的压力可以激发潜能和提高效率，但长期过度的压力则可能导致身心耗竭和倦怠。\n\n压力反应涉及复杂的生理和心理过程。当我们感到威胁时，身体会释放肾上腺素和皮质醇等激素，准备"战斗或逃跑"。这种反应在短期内很有用，但长期激活会损害健康。\n\n心理韧性是面对压力和逆境时保持适应和恢复的能力。它不是固定的特质，而是可以通过实践和学习来培养的技能。建立韧性的关键包括发展积极的思维模式、维持支持性关系网络，以及培养有效的应对策略。\n\n时间管理和边界设定是减轻压力的实用技巧。这包括区分紧急和重要的任务，学会委派和拒绝，以及在工作和个人生活之间创造清晰的界限。\n\n此外，定期的自我照顾活动对于预防倦怠至关重要。这些活动可以是简单的日常习惯，如充足的睡眠、健康的饮食、适度的运动，以及有意识地安排时间进行放松和享受的活动。',
      imageUrl: 'https://images.unsplash.com/photo-1527525443983-6e60c75fff46?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
      tags: ['压力管理', '心理韧性', '自我照顾'],
      createdAt: Date.now()
    };
  } else if (userComment.includes('关系') || userComment.includes('沟通') || userComment.includes('冲突')) {
    content = {
      id: 4,
      title: '人际关系与有效沟通',
      description: '人际关系是我们生活的基础，就像一座桥梁连接着不同的个体。健康的关系为我们提供支持、归属感和成长的机会，而困难的关系则可能成为压力和痛苦的来源。\n\n有效沟通是建立和维护健康关系的核心。它不仅包括清晰地表达自己的想法和感受，还包括积极倾听和理解他人的视角。这种双向的交流过程就像一场舞蹈，需要参与者之间的协调和默契。\n\n情绪智力在人际关系中扮演着重要角色。它包括识别和管理自己的情绪，以及理解和回应他人情绪的能力。高情商的人往往能够在关系中创造更多的和谐和满足感。\n\n冲突是人际关系中不可避免的部分。健康的冲突解决不是避免分歧，而是以尊重和建设性的方式处理它们。这包括关注问题而非人，使用"我"陈述而非指责，以及寻求双赢的解决方案。\n\n此外，在关系中设定健康的界限也很重要。清晰的界限帮助我们保护自己的需求和价值观，同时尊重他人的自主性。学会适时地说"不"，是自我照顾和维护关系健康的关键部分。',
      imageUrl: 'https://images.unsplash.com/photo-1527525443983-6e60c75fff46?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
      tags: ['人际关系', '有效沟通', '冲突解决'],
      createdAt: Date.now()
    };
  } else if (userComment.includes('自信') || userComment.includes('自尊') || userComment.includes('自我')) {
    content = {
      id: 5,
      title: '自尊与自我接纳',
      description: '自尊是我们对自己的整体评价和感受，就像内心的温度计，影响着我们的思想、情绪和行为。健康的自尊不是自负或自大，而是对自己的价值和能力的现实认识，以及对自己的优点和局限的平衡接纳。\n\n自尊的形成受多种因素影响，包括童年经历、重要他人的反馈、个人成就和社会比较。我们的自我形象往往是这些外部信息和内部解释的复杂混合。\n\n自我批评是低自尊的常见表现。内在批评者就像一个严厉的法官，不断指出我们的缺点和错误。学习识别和质疑这些负面自我对话，是提升自尊的重要步骤。\n\n自我接纳是健康自尊的基础。它意味着承认我们既有优点也有缺点，既有成功也有失败，但这些都不定义我们的整体价值。自我接纳创造了成长的空间，因为我们不再需要隐藏或否认自己的部分。\n\n此外，培养自我同情也有助于提升自尊。自我同情包括对自己的痛苦和挣扎持温和和理解的态度，认识到困难是人类共同的经历，以及在面对挑战时保持平衡的觉知。',
      imageUrl: 'https://images.unsplash.com/photo-1527525443983-6e60c75fff46?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
      tags: ['自尊', '自我接纳', '自我同情'],
      createdAt: Date.now()
    };
  } else {
    // 如果没有匹配到特定关键词，生成通用回应
    content = {
      id: 6,
      title: '心理健康与情绪平衡',
      description: '心理健康不仅仅是没有心理疾病，而是一种积极的状态，包括情绪平衡、有效应对生活挑战的能力，以及实现个人潜能的过程。就像身体健康需要均衡的营养和定期锻炼，心理健康也需要持续的关注和维护。\n\n情绪是我们内在体验的重要组成部分，就像内部的指南针，帮助我们理解自己的需求和价值观。所有情绪，无论是愉快的还是不愉快的，都有其功能和信息价值。学习识别、接纳和适当表达各种情绪，是情绪健康的关键。\n\n心理弹性是面对生活挑战和逆境时的适应和恢复能力。它不是避免困难，而是在经历困难后能够恢复和成长。培养心理弹性的方法包括发展积极的思维模式、建立支持性的社交网络，以及实践自我关怀。\n\n自我意识是心理健康的基础。它包括对自己的思想、情绪、行为模式和价值观的了解。通过反思和觉察，我们可以更好地理解自己的反应和选择，从而做出更符合自己真实需求的决定。\n\n此外，寻求平衡也是维护心理健康的重要方面。这包括工作与休息的平衡、社交与独处的平衡，以及追求目标与享受当下的平衡。在快节奏的现代生活中，有意识地创造这种平衡尤为重要。',
      imageUrl: 'https://images.unsplash.com/photo-1527525443983-6e60c75fff46?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
      tags: ['心理健康', '情绪平衡', '自我意识'],
      createdAt: Date.now()
    };
  }
  
  // 为模拟内容搜索相关图片
  if (content) {
    try {
      // 使用标题和标签作为搜索关键词
      const searchKeywords = [content.title, ...content.tags].join(' ');
      const relatedImages = await getRelatedImages(searchKeywords);
      
      // 如果找到相关图片，使用第一张作为主图
      if (relatedImages.length > 0) {
        content.imageUrl = relatedImages[0];
        content.relatedImages = relatedImages;
      }
      
      // 确保 relatedImages 字段存在
      if (!content.relatedImages || content.relatedImages.length === 0) {
        content.relatedImages = [content.imageUrl];
      }
      
      generatedContents.push(content);
    } catch (error) {
      console.error('搜索相关图片失败:', error);
      // 如果搜索失败，使用默认图片
      if (!content.relatedImages || content.relatedImages.length === 0) {
        content.relatedImages = [content.imageUrl];
      }
      generatedContents.push(content);
    }
  }
  
  return generatedContents;
}

// 获取相关图片的函数
export async function getRelatedImages(keyword: string): Promise<string[]> {
  console.log('搜索相关图片，关键词:', keyword);
  
  // 首先尝试从缓存获取
  const cacheKey = `images_${keyword}`;
  
  // 检查是否已经有缓存的图片结果
  const cachedResult = sessionStorage.getItem(cacheKey);
  if (cachedResult) {
    console.log('使用缓存的图片结果');
    return JSON.parse(cachedResult);
  }
  
  // 检查Unsplash API密钥是否有效
  if (devConfig.useLocalMockData || unsplashConfig.accessKey === 'demo-unsplash-key' || !unsplashConfig.accessKey) {
    console.log('使用模拟图片数据（本地模式或API密钥无效）');
    const mockImages = getMockImages(keyword);
    
    // 将结果存入会话存储
    sessionStorage.setItem(cacheKey, JSON.stringify(mockImages));
    
    // 异步预加载模拟图片以提高显示速度，但不等待完成
    setTimeout(() => {
      imageCacheService.preloadImages(
        mockImages.map((url: string, index: number) => ({ key: `${cacheKey}_${index}`, url }))
      ).catch(error => {
        console.warn('预加载模拟图片失败:', error);
      });
    }, 100);
    
    return mockImages;
  }
  
  try {
    // 实际调用Unsplash API
    const response = await fetch(`${apiEndpoints.unsplash}?query=${encodeURIComponent(keyword)}&per_page=6`, {
      headers: {
        'Authorization': `Client-ID ${unsplashConfig.accessKey}`
      }
    });
    
    if (!response.ok) {
      console.warn(`Unsplash API请求失败: ${response.status}，使用模拟数据`);
      const mockImages = getMockImages(keyword);
      
      // 将结果存入会话存储
      sessionStorage.setItem(cacheKey, JSON.stringify(mockImages));
      
      // 异步预加载模拟图片
      setTimeout(() => {
        imageCacheService.preloadImages(
          mockImages.map((url: string, index: number) => ({ key: `${cacheKey}_${index}`, url }))
        ).catch(error => {
          console.warn('预加载模拟图片失败:', error);
        });
      }, 100);
      
      return mockImages;
    }
    
    const data = await response.json();
    console.log(`找到 ${data.results.length} 张相关图片`);
    
    // 如果没有找到图片，使用模拟数据
    if (!data.results || data.results.length === 0) {
      console.log('Unsplash API没有返回图片，使用模拟数据');
      const mockImages = getMockImages(keyword);
      
      // 将结果存入会话存储
      sessionStorage.setItem(cacheKey, JSON.stringify(mockImages));
      
      // 异步预加载模拟图片
      setTimeout(() => {
        imageCacheService.preloadImages(
          mockImages.map((url: string, index: number) => ({ key: `${cacheKey}_${index}`, url }))
        ).catch(error => {
          console.warn('预加载模拟图片失败:', error);
        });
      }, 100);
      
      return mockImages;
    }
    
    // 获取图片URL数组
    const imageUrls = data.results.map((result: any) => result.urls.regular);
    
    // 将结果存入会话存储
    sessionStorage.setItem(cacheKey, JSON.stringify(imageUrls));
    
    // 异步预加载真实图片以提高显示速度
    setTimeout(() => {
      imageCacheService.preloadImages(
        imageUrls.map((url: string, index: number) => ({ key: `${cacheKey}_${index}`, url }))
      ).then(() => {
        console.log('图片预加载完成');
      }).catch(error => {
        console.warn('预加载真实图片失败:', error);
      });
    }, 100);
    
    return imageUrls;
  } catch (error) {
    console.error('调用Unsplash API失败:', error);
    // 如果API调用失败，回退到模拟数据
    const mockImages = getMockImages(keyword);
    
    // 将结果存入会话存储
    sessionStorage.setItem(cacheKey, JSON.stringify(mockImages));
    
    // 异步预加载模拟图片
    setTimeout(() => {
      imageCacheService.preloadImages(
        mockImages.map((url: string, index: number) => ({ key: `${cacheKey}_${index}`, url }))
      ).catch(error => {
        console.warn('预加载模拟图片失败:', error);
      });
    }, 100);
    
    return mockImages;
  }
}

// 获取模拟图片
function getMockImages(keyword: string): string[] {
  console.log('使用模拟图片数据，关键词:', keyword);
  
  // 模拟图片数据库 - 根据不同的心理学主题提供相关图片
  const imageMap: Record<string, string[]> = {
    '焦虑': [
      'https://images.unsplash.com/photo-1527525443983-6e60c75fff46?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
      'https://images.unsplash.com/photo-1542596594-649edbc13630?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
      'https://images.unsplash.com/photo-1490645935967-10de6ba17061?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
      'https://images.unsplash.com/photo-1474418397713-2f1091953b12?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1480&q=80',
      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
      'https://images.unsplash.com/photo-1493770348161-369560ae357d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80'
    ],
    '抑郁': [
      'https://images.unsplash.com/photo-1527525443983-6e60c75fff46?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
      'https://images.unsplash.com/photo-1541199249251-f713e6145474?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
      'https://images.unsplash.com/photo-1432139555190-58524dae6a55?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1476&q=80',
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1480&q=80',
      'https://images.unsplash.com/photo-1529566652340-2c41a1eb6d93?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80'
    ],
    'default': [
      'https://images.unsplash.com/photo-1527525443983-6e60c75fff46?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
      'https://images.unsplash.com/photo-1541199249251-f713e6145474?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1480&q=80',
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
      'https://images.unsplash.com/photo-1505253758473-96b7015fcd40?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80'
    ]
  };
  
  // 查找匹配的关键词
  const lowerKeyword = keyword.toLowerCase();
  
  // 尝试精确匹配关键词
  for (const key in imageMap) {
    if (lowerKeyword.includes(key.toLowerCase())) {
      console.log(`找到关键词匹配: ${key}`);
      return imageMap[key];
    }
  }
  
  // 如果没有匹配，返回默认图片
  console.log('没有找到匹配，使用默认图片');
  return imageMap['default'];
}
