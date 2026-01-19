import { getAllConfigs } from '@/shared/models/config';
import { respData } from '@/shared/lib/resp';

export async function GET() {
  try {
    const configs = await getAllConfigs();
    
    // 只返回 R2 相关配置的存在状态（不返回实际值，保护敏感信息）
    const r2Status = {
      r2_access_key: !!configs.r2_access_key,
      r2_secret_key: !!configs.r2_secret_key,
      r2_bucket_name: !!configs.r2_bucket_name,
      r2_account_id: !!configs.r2_account_id,
      r2_upload_path: configs.r2_upload_path || '(not set)',
      r2_endpoint: configs.r2_endpoint || '(not set)',
      r2_domain: configs.r2_domain || '(not set)',
    };
    
    return respData(r2Status);
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
