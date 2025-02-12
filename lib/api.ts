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

export async function simulateLinuxCommand(command: string, isAsciiArt: boolean = false): Promise<string> {
  try {
    const response = await axios.post<ApiResponse>('/api/command', {
      command,
      isAsciiArt
    });

    if (!response.data.choices || !response.data.choices[0]) {
      throw new Error('无效的 API 响应格式');
    }

    return response.data.choices[0].message.content;
  } catch (error) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    
    if (axiosError.response?.status === 403) {
      return '错误: 该命令已被禁用，出于安全考虑';
    } else if (axiosError.response?.status === 429) {
      return '错误: 请求过于频繁，请稍后再试';
    } else {
      const errorMessage = axiosError.response?.data?.error || axiosError.message || '命令执行失败';
      throw new Error(errorMessage);
    }
  }
} 