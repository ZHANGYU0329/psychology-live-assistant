import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { volcengineConfig, unsplashConfig, apiEndpoints, devConfig } from '@/config/api-config';
import { AlertCircle, CheckCircle2, RefreshCw, Info } from 'lucide-react';
import { useHistoryActions } from '../contexts/history-context';

// API测试结果接口
interface TestResult {
  success: boolean;
  message: string;
  data?: any;
  rawData?: any;
}

// 测试Unsplash API
async function testUnsplashAPI(keyword: string): Promise<TestResult> {
  console.log('测试Unsplash API，关键词:', keyword);
  
  // 如果使用本地模拟数据
  if (devConfig.useLocalMockData) {
    console.log('使用模拟数据');
    // 模拟API响应延迟
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      message: '成功获取图片（模拟数据）',
      data: {
        imageUrl: 'https://images.unsplash.com/photo-1527525443983-6e60c75fff46?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80'
      }
    };
  }
  
  try {
    // 检查API密钥
    if (!unsplashConfig.accessKey || unsplashConfig.accessKey === 'demo-unsplash-key') {
      return {
        success: false,
        message: 'Unsplash API密钥未配置或使用了演示密钥'
      };
    }
    
    // 构建请求URL
    const url = `${apiEndpoints.unsplash}?query=${encodeURIComponent(keyword)}&client_id=${unsplashConfig.accessKey}&per_page=1`;
    
    // 调用Unsplash API
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        message: `API请求失败: ${response.status}, ${errorText}`
      };
    }
    
    const data = await response.json();
    
    // 检查是否有结果
    if (!data.results || data.results.length === 0) {
      return {
        success: false,
        message: '没有找到匹配的图片',
        rawData: data
      };
    }
    
    // 获取图片URL
    const imageUrl = data.results[0].urls.regular;
    
    return {
      success: true,
      message: '成功获取图片',
      data: { imageUrl },
      rawData: data
    };
  } catch (error) {
    console.error('调用Unsplash API失败:', error);
    return {
      success: false,
      message: `API调用错误: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

// 测试火山方舟API
async function testVolcengineAPI(prompt: string): Promise<TestResult> {
  console.log('测试火山方舟API，提示词:', prompt);
  
  // 如果使用本地模拟数据
  if (devConfig.useLocalMockData) {
    console.log('使用模拟数据');
    // 模拟API响应延迟
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      success: true,
      message: '成功生成回复（模拟数据）',
      data: {
        response: '这是一个模拟的AI回复。在实际使用中，这里会显示来自火山方舟API的真实回复内容。请在api-config.ts中配置您的API密钥以使用真实API。'
      }
    };
  }
  
  try {
    // 检查API密钥
    if (!volcengineConfig.apiKey || volcengineConfig.apiKey === 'demo-volcengine-key') {
      return {
        success: false,
        message: '火山方舟API密钥未配置或使用了演示密钥'
      };
    }
    
    // 构建请求体
    const requestBody = {
      model: volcengineConfig.model,
      messages: [
        {
          role: "system",
          content: "你是一个专业的心理咨询师，擅长心理分析和情绪管理指导。"
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: volcengineConfig.temperature,
      max_tokens: volcengineConfig.maxTokens
    };
    
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
    
    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        message: `API请求失败: ${response.status}, ${errorText}`
      };
    }
    
    const data = await response.json();
    
    // 根据火山方舟API的官方响应格式获取内容
    const aiResponse = data.choices?.[0]?.message?.content || 
                      data.output?.text || 
                      data.response || 
                      data.choices?.[0]?.text || 
                      data.result || 
                      '';
    
    if (!aiResponse) {
      return {
        success: false,
        message: 'API返回的响应为空',
        rawData: data
      };
    }
    
    return {
      success: true,
      message: '成功生成回复',
      data: { response: aiResponse },
      rawData: data
    };
  } catch (error) {
    console.error('调用火山方舟API失败:', error);
    return {
      success: false,
      message: `API调用错误: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

// API测试组件
export function ApiTest() {
  const { addApiTestRecord } = useHistoryActions();
  const [loading, setLoading] = useState<{
    unsplash: boolean;
    volcengine: boolean;
  }>({
    unsplash: false,
    volcengine: false
  });
  
  const [results, setResults] = useState<{
    unsplash: { success: boolean; message: string; imageUrl?: string; rawData?: any };
    volcengine: { success: boolean; message: string; response?: string; rawData?: any };
  }>({
    unsplash: { success: false, message: '未测试' },
    volcengine: { success: false, message: '未测试' }
  });
  
  const [showRawData, setShowRawData] = useState(false);
  
  // 检查是否使用模拟数据
  useEffect(() => {
    if (devConfig.useLocalMockData) {
      alert('警告：当前配置使用的是模拟数据，而不是真实API调用。请在api-config.ts中将useLocalMockData设置为false以使用真实API。');
    }
  }, []);

  const [prompt, setPrompt] = useState<string>("你好，请用一句话介绍自己作为心理咨询师的专业领域");
  const [imageKeyword, setImageKeyword] = useState<string>("心理咨询");

  // 测试Unsplash API
  const testUnsplashApi = async () => {
    setLoading(prev => ({ ...prev, unsplash: true }));
    
    try {
      // 使用测试服务
      const result = await testUnsplashAPI(imageKeyword);
      
      setResults(prev => ({
        ...prev,
        unsplash: {
          success: result.success,
          message: result.message,
          imageUrl: result.data?.imageUrl
        }
      }));
      
      // 保存到历史记录
      addApiTestRecord(`Unsplash API - ${imageKeyword}`, {
        type: 'unsplash',
        keyword: imageKeyword,
        success: result.success,
        message: result.message,
        imageUrl: result.data?.imageUrl
      });
    } catch (error) {
      console.error('调用测试服务失败:', error);
      setResults(prev => ({
        ...prev,
        unsplash: {
          success: false,
          message: `测试服务错误: ${error instanceof Error ? error.message : String(error)}`
        }
      }));
    } finally {
      setLoading(prev => ({ ...prev, unsplash: false }));
    }
  };

  // 测试火山方舟API
  const testVolcengineApi = async () => {
    setLoading(prev => ({ ...prev, volcengine: true }));
    
    try {
      // 使用测试服务
      const result = await testVolcengineAPI(prompt);
      
      setResults(prev => ({
        ...prev,
        volcengine: {
          success: result.success,
          message: result.message,
          response: result.data?.response || JSON.stringify(result.data),
          rawData: result.rawData // 保存原始数据
        }
      }));
      
      // 保存到历史记录
      addApiTestRecord(`火山方舟API - ${prompt.slice(0, 20)}...`, {
        type: 'volcengine',
        prompt: prompt,
        success: result.success,
        message: result.message,
        response: result.data?.response
      });
    } catch (error) {
      console.error('调用测试服务失败:', error);
      setResults(prev => ({
        ...prev,
        volcengine: {
          success: false,
          message: `测试服务错误: ${error instanceof Error ? error.message : String(error)}`
        }
      }));
    } finally {
      setLoading(prev => ({ ...prev, volcengine: false }));
    }
  };

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">API测试工具</h1>
      
      <Tabs defaultValue="volcengine" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="volcengine">火山方舟API测试</TabsTrigger>
          <TabsTrigger value="unsplash">Unsplash API测试</TabsTrigger>
        </TabsList>
        
        {/* 火山方舟API测试面板 */}
        <TabsContent value="volcengine">
          <Card>
            <CardHeader>
              <CardTitle>火山方舟API测试</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="prompt">测试提示词</Label>
                <Textarea 
                  id="prompt" 
                  value={prompt} 
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="输入测试提示词..."
                  className="min-h-[100px]"
                />
              </div>
              
              <div className="bg-muted/50 p-4 rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <Label>API配置信息</Label>
                </div>
                <div className="text-sm space-y-1">
                  <p><strong>API Key:</strong> {volcengineConfig.apiKey}</p>
                  <p><strong>模型:</strong> {volcengineConfig.model}</p>
                  <p><strong>端点:</strong> {apiEndpoints.volcengine}</p>
                  <p><strong>本地模拟模式:</strong> {devConfig.useLocalMockData ? '开启' : '关闭'}</p>
                </div>
              </div>
              
              {results.volcengine.message !== '未测试' && (
                <Alert variant={results.volcengine.success ? "default" : "destructive"}>
                  <div className="flex items-center gap-2">
                    {results.volcengine.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    <AlertTitle>{results.volcengine.success ? '测试成功' : '测试失败'}</AlertTitle>
                  </div>
                  <AlertDescription className="mt-2">
                    {results.volcengine.message}
                  </AlertDescription>
                </Alert>
              )}
              
              {results.volcengine.response && (
                <div className="space-y-2">
                  <Label>API响应</Label>
                  <div className="bg-muted p-3 rounded-md overflow-auto max-h-[200px]">
                    <pre className="text-xs whitespace-pre-wrap">{results.volcengine.response}</pre>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                onClick={testVolcengineApi} 
                disabled={loading.volcengine}
                className="w-full"
              >
                {loading.volcengine ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    测试中...
                  </>
                ) : '测试火山方舟API'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Unsplash API测试面板 */}
        <TabsContent value="unsplash">
          <Card>
            <CardHeader>
              <CardTitle>Unsplash API测试</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="imageKeyword">图片关键词</Label>
                <Input 
                  id="imageKeyword" 
                  value={imageKeyword} 
                  onChange={(e) => setImageKeyword(e.target.value)}
                  placeholder="输入图片搜索关键词..."
                />
              </div>
              
              <div className="bg-muted/50 p-4 rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <Label>API配置信息</Label>
                </div>
                <div className="text-sm space-y-1">
                  <p><strong>Access Key:</strong> {unsplashConfig.accessKey}</p>
                  <p><strong>端点:</strong> {apiEndpoints.unsplash}</p>
                  <p><strong>本地模拟模式:</strong> {devConfig.useLocalMockData ? '开启' : '关闭'}</p>
                </div>
              </div>
              
              {results.unsplash.message !== '未测试' && (
                <Alert variant={results.unsplash.success ? "default" : "destructive"}>
                  <div className="flex items-center gap-2">
                    {results.unsplash.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    <AlertTitle>{results.unsplash.success ? '测试成功' : '测试失败'}</AlertTitle>
                  </div>
                  <AlertDescription className="mt-2">
                    {results.unsplash.message}
                  </AlertDescription>
                </Alert>
              )}
              
              {results.unsplash.imageUrl && (
                <div className="space-y-2">
                  <Label>获取的图片</Label>
                  <div className="rounded-md overflow-hidden border">
                    <img 
                      src={results.unsplash.imageUrl} 
                      alt="Unsplash测试图片" 
                      className="w-full h-auto object-cover"
                    />
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                onClick={testUnsplashApi} 
                disabled={loading.unsplash}
                className="w-full"
              >
                {loading.unsplash ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    测试中...
                  </>
                ) : '测试Unsplash API'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-md">
        <h3 className="font-semibold text-yellow-800 dark:text-yellow-400">API测试说明</h3>
        <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
          <li>此工具用于测试项目中使用的API是否正常工作</li>
          <li>火山方舟API: 测试AI文本生成功能</li>
          <li>Unsplash API: 测试图片搜索功能</li>
          <li>如果测试失败，请检查API密钥和网络连接</li>
          <li>如果使用了代理，请确保代理配置正确</li>
          <li>在vite.config.ts中配置正确的代理设置可以解决CORS问题</li>
        </ul>
      </div>
    </div>
  );
}

export default ApiTest;