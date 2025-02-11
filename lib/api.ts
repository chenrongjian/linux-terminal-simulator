import axios, { AxiosError } from 'axios';

interface ApiResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface ApiErrorResponse {
  error: string;
}

export async function simulateLinuxCommand(command: string): Promise<string> {
  try {
    const response = await axios.post<ApiResponse>('/api/command', {
      command
    });

    if (!response.data.choices || !response.data.choices[0]) {
      throw new Error('Invalid API response format');
    }

    return response.data.choices[0].message.content;
  } catch (error) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    
    if (axiosError.response?.status === 403) {
      return '错误: 该命令已被禁用，出于安全考虑';
    } else if (axiosError.response?.status === 429) {
      return '错误: 请求过于频繁，请稍后再试';
    } else {
      return `错误: ${axiosError.response?.data?.error || '命令执行失败'}`;
    }
  }
} 