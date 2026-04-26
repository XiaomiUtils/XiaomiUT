export interface FirmwareData {
  device: string;
  version: string;
  android_version: string;
  filename?: string;
  filesize: string;
  md5: string;
  description: string;
  download_url?: string;
  mirrors?: Record<string, string>;
  error?: string;
}

// 
const API_BASE = 'https://API.1234567.com';

export const fetchFirmware = async (type: 'fastboot' | 'ota', params: any): Promise<FirmwareData> => {
  if (type === 'fastboot') {
    const response = await fetch(`${API_BASE}/generateMIUI_FASTBOOT.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return response.json();
  } else {
    const formData = new URLSearchParams();
    formData.append('v', params.v);
    formData.append('d', params.d);

    const response = await fetch(`${API_BASE}/generateMIUI_ROM.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData,
    });
    return response.json();
  }
};