interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

const REQUESTS_PER_MINUTE = 20;
const WINDOW_SIZE_MS = 60 * 1000; // 1 minute

const ipRequests = new Map<string, number[]>();

export async function rateLimit(ip: string): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = now - WINDOW_SIZE_MS;

  // 获取该 IP 的请求历史
  let requests = ipRequests.get(ip) || [];

  // 清理旧的请求记录
  requests = requests.filter(timestamp => timestamp > windowStart);

  // 检查是否超出限制
  if (requests.length >= REQUESTS_PER_MINUTE) {
    const oldestRequest = requests[0];
    const resetTime = oldestRequest + WINDOW_SIZE_MS;
    return {
      success: false,
      limit: REQUESTS_PER_MINUTE,
      remaining: 0,
      reset: resetTime
    };
  }

  // 添加新请求
  requests.push(now);
  ipRequests.set(ip, requests);

  // 定期清理 Map
  if (Math.random() < 0.1) { // 10% 的概率执行清理
    for (const [key, timestamps] of ipRequests.entries()) {
      const validTimestamps = timestamps.filter(t => t > windowStart);
      if (validTimestamps.length === 0) {
        ipRequests.delete(key);
      } else {
        ipRequests.set(key, validTimestamps);
      }
    }
  }

  return {
    success: true,
    limit: REQUESTS_PER_MINUTE,
    remaining: REQUESTS_PER_MINUTE - requests.length,
    reset: now + WINDOW_SIZE_MS
  };
} 