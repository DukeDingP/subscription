import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // 获取查询参数
    const searchParams = request.nextUrl.searchParams;
    const prompt = searchParams.get('prompt');
    const highQuality = searchParams.get('highQuality') === 'true';
    
    if (!prompt) {
      return NextResponse.json(
        { status: 'error', detail: 'prompt参数不能为空' },
        { status: 400 }
      );
    }
    
    // 构建API URL
    const apiUrl = process.env.API_SERVER_URL;
    const url = `${apiUrl}/generate?prompt=${encodeURIComponent(prompt)}${highQuality ? '&highQuality=true' : ''}`;
    
    // 转发请求到Flask后端
    console.log('url:', url);
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // 获取响应数据
    console.log(response);
    const data = await response.json();
    
    // 返回响应
    return NextResponse.json(data);
  } catch (error) {
    console.error('API代理错误:', error);
    return NextResponse.json(
      { status: 'error', detail: '服务器内部错误' },
      { status: 500 }
    );
  }
} 