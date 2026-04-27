import { miuiEncrypt, miuiDecrypt } from '../utils/miuiCrypto';
import { API_CONFIG } from '../config';

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

const parseOtaVersion = (version: string) => {
    const regex = /^([A-Z]+\d+)\.(\d+)\.(\d+)\.(\d+)\.([A-Z])([A-Z])([A-Z])([A-Z]{2})(.*)/;
    const matches = version.match(regex);

    if (!matches) return { v: version, c: "", bv: "", r: "" };

    let firstBlock = matches[1];
    const firstLetter = matches[5];
    const middleSymbols = matches[8];
    const remainingText = matches[9];
    let bv = "";


    if (firstBlock === "OS1") {
        firstBlock = "V816";
    } else {
        const bvMatches = firstBlock.match(/^V(\d{2})/);
        if (bvMatches) {
            const bvValue = parseInt(bvMatches[1]);
            if (bvValue <= 13) bv = bvValue.toString();
        }
        firstBlock = `MIUI-${firstBlock}`;
    }

    const codeBaseMap: Record<string, string> = {
        "U": "14.0", "T": "13.0", "S": "12.0", "R": "11.0",
        "Q": "10.0", "P": "9.0", "O": "8.0", "N": "7.0", "M": "6.0"
    };

    const regionMap: Record<string, string> = {
        "MI": "_global", "EU": "_eea_global", "RU": "_ru_global",
        "TW": "_tw_global", "ID": "_id_global", "IN": "_in_global", "CN": ""
    };

    const v = `${firstBlock}.${matches[2]}.${matches[3]}.${matches[4]}.${matches[5]}${matches[6]}${matches[7]}${matches[8]}${remainingText}`;

    return {
        v,
        c: codeBaseMap[firstLetter] || "",
        bv,
        r: regionMap[middleSymbols] || ""
    };
};

export const fetchFirmware = async (type: 'fastboot' | 'ota', params: any): Promise<FirmwareData> => {
    const baseUrl = type === 'fastboot' ? API_CONFIG.FASTBOOT_BASE_URL : API_CONFIG.OTA_BASE_URL;
    const endpoint = type === 'fastboot'
        ? `${baseUrl}/updates/miota-fullrom.php`
        : `${baseUrl}/updates/miotaV3.php`;

    try {
        if (type === 'ota') {
            const parsed = parseOtaVersion(params.v);

            const deviceData = {
                a: "0",
                c: parsed.c,
                b: "F",
                d: params.d + parsed.r,
                g: "00000000000000000000000000000000",
                cts: "0",
                i: "0000000000000000000000000000000000000000000000000000000000000000",
                isR: "0",
                f: "1",
                l: "en_US",
                n: "",
                sys: "0",
                unlock: "0",
                r: "CN",
                sn: "0x00000000",
                v: parsed.v,
                bv: parsed.bv,
                id: "",
            };

            const encryptedQuery = miuiEncrypt(deviceData);

            const formData = new URLSearchParams();
            formData.append('q', encryptedQuery);
            formData.append('t', '');
            formData.append('s', '1');

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData
            });

            if (!response.ok) throw new Error("Network response was not ok");

            const encryptedResult = await response.text();
            const result = miuiDecrypt(encryptedResult);

            if (!result.LatestRom) {
                throw new Error("No ROM update found for this device/version.");
            }

            const rom = result.LatestRom;
            return {
                description: rom.description,
                device: rom.device,
                version: rom.version,
                android_version: rom.codebase,
                filesize: rom.filesize,
                md5: rom.md5,
                download_url: `${result.MirrorList[0]}/${rom.version}/${rom.filename}`
            };

        } else {
            const query = new URLSearchParams({
                d: params.d,
                b: params.b,
                r: params.r,
                l: params.l,
                n: ""
            }).toString();

            const response = await fetch(`${endpoint}?${query}`);
            const data = await response.json();

            if (data.error || !data.device) {
                throw new Error(data.error || "Fastboot ROM not found.");
            }

            return data;
        }
    } catch (error: any) {
        console.error("Fetch Error:", error);
        return { error: error.message } as FirmwareData;
    }
};