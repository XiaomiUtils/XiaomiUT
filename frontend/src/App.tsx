import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import {
  SearchOutlined,
  DownloadOutlined,
  GlobalOutlined,
  GithubOutlined,
  InfoCircleOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import './App.css';
import { fetchFirmware } from './services/firmware';
import type { FirmwareData } from './services/firmware';

function App() {
  const [formType, setFormType] = useState<'fastboot' | 'ota'>('fastboot');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FirmwareData | null>(null);

  const [codename, setCodename] = useState('');
  const [region, setRegion] = useState('_global');
  const [isOld, setIsOld] = useState('1');
  const [otaVersion, setOtaVersion] = useState('');

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      let data: FirmwareData;
      if (formType === 'fastboot') {
        const regionMap: Record<string, string> = {
          "_global": "global",
          "_ru_global": isOld === "0" ? "global" : "ru",
          "_eea_global": "eea",
          "_tw_global": "tw",
          "_id_global": isOld === "0" ? "global" : "id",
          "_in_global": "in",
        };

        data = await fetchFirmware('fastboot', {
          d: codename.trim().toLowerCase() + region,
          b: "F",
          r: regionMap[region] || "cn",
          l: "en-en"
        });
      } else {
        data = await fetchFirmware('ota', {
          v: otaVersion.trim().toUpperCase(),
          d: codename.trim().toLowerCase()
        });
      }
      setResult(data);
    } catch (error) {
      setResult({ error: String(error) } as FirmwareData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <section id="center">
        <div className="hero">
          <h1>XiaomiUT</h1>
        </div>

        <div className="main-card">
          <div className="search-container">
            <div className="type-selector">
              <button
                className={formType === 'fastboot' ? 'active' : ''}
                onClick={() => { setFormType('fastboot'); setResult(null); }}
              >
                <ThunderboltOutlined /> Fastboot
              </button>
              <button
                className={formType === 'ota' ? 'active' : ''}
                onClick={() => { setFormType('ota'); setResult(null); }}
              >
                <DownloadOutlined /> OTA
              </button>
            </div>

            <form onSubmit={handleSearch} className="firmware-form">
              <div className="input-wrapper">
                <SearchOutlined className="input-icon" />
                <input
                  type="text"
                  placeholder="Device Codename (e.g. sweet)"
                  value={codename}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setCodename(e.target.value)}
                  required
                />
              </div>

              {formType === 'fastboot' ? (
                <>
                  <div className="input-wrapper">
                    <GlobalOutlined className="input-icon" />
                    <select value={region} onChange={(e: ChangeEvent<HTMLSelectElement>) => setRegion(e.target.value)}>
                      <option value="_global">Global</option>
                      <option value="_eea_global">Europe (EEA)</option>
                      <option value="_ru_global">Russia (RU)</option>
                      <option value="_in_global">India (IN)</option>
                      <option value="">China</option>
                    </select>
                  </div>
                  {(region === '_id_global' || region === '_ru_global') && (
                    <select value={isOld} onChange={(e: ChangeEvent<HTMLSelectElement>) => setIsOld(e.target.value)}>
                      <option value="1">HyperOS / New</option>
                      <option value="0">MIUI / Old</option>
                    </select>
                  )}
                </>
              ) : (
                <input
                  type="text"
                  placeholder="Version (e.g. OS1.0.1.0...)"
                  value={otaVersion}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setOtaVersion(e.target.value)}
                  required
                />
              )}

              <button type="submit" className="counter search-btn" disabled={loading}>
                {loading ? 'Searching...' : <><SearchOutlined /> Find Firmware</>}
              </button>
            </form>
          </div>

          {result && (
            <div className="result-inline-container">
              <div className="divider"></div>
              {result.error ? (
                <div className="result-content error-msg">❌ {result.error}</div>
              ) : (
                <div className="result-content">
                  <div className="result-header-small">
                    <h3>{result.device}</h3>
                    <span className="version-tag">{result.version}</span>
                  </div>

                  <div className="info-row">
                    <span><InfoCircleOutlined /> <strong>Android:</strong> {result.android_version}</span>
                    <span><strong>Size:</strong> {result.filesize}</span>
                  </div>

                  <div className="download-actions">
                    {result.download_url ? (
                      <a href={result.download_url} target="_blank" className="btn-primary">
                        <DownloadOutlined /> Download ROM
                      </a>
                    ) : (
                      <div className="mirrors-layout">
                        {Object.entries(result.mirrors || {}).map(([name, url]) => (
                          <a key={name} href={`${url}/${result.version}/${result.filename}`} target="_blank" className="btn-mirror">
                            <ThunderboltOutlined /> {name}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <div className="ticks"></div>

      <section id="next-steps">
        <div id="social">
          <h2>Connect</h2>
          <div className="social-links">

            <a href="https://github.com/XiaomiUtils" target="_blank" className="social-card">
              <GithubOutlined className="social-icon-big" />
              <div className="social-info">
                <strong>GitHub</strong>
                <span>Source Code</span>
              </div>
            </a>
          </div>
        </div>
      </section>

      <div className="ticks"></div>
      <section id="spacer"></section>
    </>
  );
}

export default App;