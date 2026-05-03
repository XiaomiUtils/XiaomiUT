import { miuiEncrypt, miuiDecrypt } from '../utils/miuiCrypto';
import { API_CONFIG } from '../config';

// ─── 接口定义 ────────────────────────────────────────────────────────────────

export interface FirmwareData {
    device: string;
    version: string;
    android_version: string;
    filesize: string;
    md5: string;
    description: string;
    download_url?: string;
    error?: string;
}

/** fastboot 列表中的单条记录 */
export interface FastbootDevice {
    id: number;
    /** 清理后的包名：去除 ★ 和 "Fastboot File Download" 后缀 */
    name: string;
    /** 镜像直链下载地址 */
    download_url: string;
    /**
     * 格式为：代号_地区_市场类型_分支
     * 示例：arctic_global_global_F
     */
    key: string;
}

// ─── 辅助函数 ───────────────────────────────────────────────────────────────

/**
 * 清理 package_name 中的无用信息：
 *   "★ Redmi A7 Pro Latest Global Stable Version Fastboot File Download"
 *    → "Redmi A7 Pro Latest Global Stable Version"
 */
const cleanPackageName = (raw: string): string =>
    raw
        .replace(/★\s*/g, '')                        // 去除星号
        .replace(/\s*Fastboot\s+File\s+Download.*/i, '') // 去除后缀
        .trim();

// ─── OTA：版本号解析 ───────────────────────────────────────────────────────

const parseOtaVersion = (version: string) => {
    const regex = /^([A-Z]+\d+)\.(\d+)\.(\d+)\.(\d+)\.([A-Z])([A-Z])([A-Z])([A-Z]{2})(.*)/;
    const matches = version.match(regex);

    if (!matches) return { v: version, c: '', bv: '', r: '' };

    let firstBlock = matches[1];
    const firstLetter = matches[5];
    const middleSymbols = matches[8];
    const remainingText = matches[9];
    let bv = '';

    if (firstBlock === 'OS1') {
        firstBlock = 'V816';
    } else {
        const bvMatches = firstBlock.match(/^V(\d{2})/);
        if (bvMatches) {
            const bvValue = parseInt(bvMatches[1]);
            if (bvValue <= 13) bv = bvValue.toString();
        }
        firstBlock = `MIUI-${firstBlock}`;
    }

    const codeBaseMap: Record<string, string> = {
        U: '14.0', T: '13.0', S: '12.0', R: '11.0',
        Q: '10.0', P: '9.0',  O: '8.0',  N: '7.0', M: '6.0',
    };

    const regionMap: Record<string, string> = {
        MI: '_global', EU: '_eea_global', RU: '_ru_global',
        TW: '_tw_global', ID: '_id_global', IN: '_in_global', CN: '',
    };

    const v = `${firstBlock}.${matches[2]}.${matches[3]}.${matches[4]}.${matches[5]}${matches[6]}${matches[7]}${matches[8]}${remainingText}`;

    return {
        v,
        c: codeBaseMap[firstLetter] || '',
        bv,
        r: regionMap[middleSymbols] || '',
    };
};

// ─── Fastboot：获取完整设备列表 ──────────────────────────────────────────────

/**
 * 通过代理向小米服务器请求完整的 fastboot 固件列表。
 *
 * 代理端点：  <FASTBOOT_BASE_URL>/fastboot/getlinepackagelist
 * 实际端点：  https://sgp-api.buy.mi.com/bbs/api/global/phone/getlinepackagelist
 *
 * @returns 清理后的设备记录数组，出错时返回空数组。
 */
export const fetchFastbootList = async (): Promise<FastbootDevice[]> => {
    const endpoint = `${API_CONFIG.FASTBOOT_BASE_URL}/getlinepackagelist`;

    try {
        const response = await fetch(endpoint, { method: 'GET' });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status} ${response.statusText}`);
        }

        const json = await response.json();

        // code: 0 — 按 API 文档表示成功
        if (json.code !== 0) {
            throw new Error(`API 返回 code=${json.code}，期望值为 0`);
        }

        const rawList: any[] = json.data ?? [];

        const devices: FastbootDevice[] = rawList.map((item) => ({
            id:           item.id,
            name:         cleanPackageName(item.package_name),
            download_url: item.package_url,
            key:          item.key,
        }));

        return devices;

    } catch (error: any) {
        console.error('[Fastboot] 加载列表时出错：', error.message);
        return [];
    }
};

// ─── OTA：获取固件数据 ────────────────────────────────────────────────────────

/**
 * 请求指定设备的 OTA 固件信息。
 */
export const fetchFirmware = async (params: { d: string; v: string }): Promise<FirmwareData> => {
    const endpoint = `${API_CONFIG.OTA_BASE_URL}/updates/miotaV3.php`;

    try {
        const parsed = parseOtaVersion(params.v);

        const deviceData = {
            a:      '0',
            c:      parsed.c,
            b:      'F',
            d:      params.d + parsed.r,
            g:      '00000000000000000000000000000000',
            cts:    '0',
            i:      '0000000000000000000000000000000000000000000000000000000000000000',
            isR:    '0',
            f:      '1',
            l:      'en_US',
            n:      '',
            sys:    '0',
            unlock: '0',
            r:      'CN',
            sn:     '0x00000000',
            v:      parsed.v,
            bv:     parsed.bv,
            id:     '',
        };

        const encryptedQuery = miuiEncrypt(deviceData);

        const formData = new URLSearchParams();
        formData.append('q', encryptedQuery);
        formData.append('t', '');
        formData.append('s', '1');

        const response = await fetch(endpoint, {
            method:  'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body:    formData,
        });

        if (!response.ok) throw new Error('Network response was not ok');

        const encryptedResult = await response.text();
        const result = miuiDecrypt(encryptedResult);

        if (!result.LatestRom) {
            throw new Error('No ROM update found for this device/version.');
        }

        const rom = result.LatestRom;
        return {
            description:     rom.description,
            device:          rom.device,
            version:         rom.version,
            android_version: rom.codebase,
            filesize:        rom.filesize,
            md5:             rom.md5,
            download_url:    `${result.MirrorList[0]}/${rom.version}/${rom.filename}`,
        };

    } catch (error: any) {
        console.error('[OTA] Fetch Error:', error);
        return { error: error.message } as FirmwareData;
    }
};