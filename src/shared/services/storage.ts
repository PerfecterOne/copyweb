import { R2Provider, S3Provider, StorageManager } from '@/extensions/storage';
import { Configs, getAllConfigs } from '@/shared/models/config';

/**
 * get storage service with configs
 */
export function getStorageServiceWithConfigs(configs: Configs) {
  const storageManager = new StorageManager();

  // Add R2 provider if configured
  if (
    configs.r2_access_key &&
    configs.r2_secret_key &&
    configs.r2_bucket_name
  ) {
    // Extract account ID from endpoint if not provided
    let accountId = configs.r2_account_id || '';
    
    // If no account ID but has endpoint, try to extract from endpoint
    if (!accountId && configs.r2_endpoint) {
      const match = configs.r2_endpoint.match(/https?:\/\/([a-f0-9]+)\.r2\.cloudflarestorage\.com/);
      if (match) {
        accountId = match[1];
      }
    }

    storageManager.addProvider(
      new R2Provider({
        accountId: accountId,
        accessKeyId: configs.r2_access_key,
        secretAccessKey: configs.r2_secret_key,
        bucket: configs.r2_bucket_name,
        uploadPath: configs.r2_upload_path,
        region: 'auto', // R2 uses "auto" as region
        endpoint: configs.r2_endpoint, // Optional custom endpoint
        publicDomain: configs.r2_domain,
      }),
      true // Set R2 as default
    );
  }

  // Add S3 provider if configured (future support)
  if (configs.s3_access_key && configs.s3_secret_key && configs.s3_bucket) {
    storageManager.addProvider(
      new S3Provider({
        endpoint: configs.s3_endpoint,
        region: configs.s3_region,
        accessKeyId: configs.s3_access_key,
        secretAccessKey: configs.s3_secret_key,
        bucket: configs.s3_bucket,
        publicDomain: configs.s3_domain,
      })
    );
  }

  return storageManager;
}

/**
 * global storage service
 */
let storageService: StorageManager | null = null;

/**
 * get storage service instance
 */
export async function getStorageService(
  configs?: Configs
): Promise<StorageManager> {
  if (!configs) {
    configs = await getAllConfigs();
  }
  storageService = getStorageServiceWithConfigs(configs);

  return storageService;
}
