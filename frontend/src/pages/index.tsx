import { useState, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import Head from 'next/head';
import {
  SearchOutlined,
  DownloadOutlined,
  GlobalOutlined,
  GithubOutlined,
  InfoCircleOutlined,
  ThunderboltOutlined,
  LoadingOutlined,
} from '@ant-design/icons';

import { fetchFirmware, fetchFastbootList } from '../services/firmware';
import type { FirmwareData, FastbootDevice } from '../services/firmware';

export default function Home() {
  const [formType, setFormType] = useState<'fastboot' | 'ota'>('fastboot');

  const [fastbootDevices, setFastbootDevices] = useState<FastbootDevice[]>([]);
  const [fastbootLoading, setFastbootLoading] = useState(true);
  const [fastbootError, setFastbootError] = useState<string | null>(null);
  const [fastbootFilter, setFastbootFilter] = useState('');
  const [selectedDevice, setSelectedDevice] = useState<FastbootDevice | null>(null);

  const [otaCodename, setOtaCodename] = useState('');
  const [otaVersion, setOtaVersion] = useState('');
  const [otaLoading, setOtaLoading] = useState(false);
  const [otaResult, setOtaResult] = useState<FirmwareData | null>(null);

  useEffect(() => {
    setFastbootLoading(true);
    setFastbootError(null);

    fetchFastbootList()
      .then((devices) => {
        if (devices.length === 0) {
          setFastbootError('Device list is empty or unavailable.');
        } else {
          setFastbootDevices(devices);
        }
      })
      .catch((err) => {
        setFastbootError(String(err));
      })
      .finally(() => setFastbootLoading(false));
  }, []);

  const filteredDevices = fastbootDevices.filter((d) =>
    d.name.toLowerCase().includes(fastbootFilter.toLowerCase())
  );

  const handleOtaSearch = async (e: FormEvent) => {
    e.preventDefault();
    setOtaLoading(true);
    setOtaResult(null);

    const data = await fetchFirmware({
      v: otaVersion.trim().toUpperCase(),
      d: otaCodename.trim().toLowerCase(),
    });

    setOtaResult(data);
    setOtaLoading(false);
  };

  const switchTab = (tab: 'fastboot' | 'ota') => {
    setFormType(tab);
    setOtaResult(null);
    setSelectedDevice(null);
  };

  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>XiaomiUT - 小米官方固件查询工具</title>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </Head>
      <section id="center">
        <div className="hero">
          <h1>XiaomiUT</h1>
        </div>

        <div className="main-card">
          <div className="search-container">

            <div className="type-selector">
              <button
                className={formType === 'fastboot' ? 'active' : ''}
                onClick={() => switchTab('fastboot')}
              >
                <ThunderboltOutlined /> Fastboot
              </button>
              <button
                className={formType === 'ota' ? 'active' : ''}
                onClick={() => switchTab('ota')}
              >
                <DownloadOutlined /> OTA
              </button>
            </div>


            {formType === 'fastboot' && (
              <div className="fastboot-picker">
                {fastbootLoading && (
                  <div className="fastboot-status">
                    <LoadingOutlined spin /> Loading device list...
                  </div>
                )}

                {fastbootError && !fastbootLoading && (
                  <div className="fastboot-status error">
                    ❌ {fastbootError}
                  </div>
                )}

                {!fastbootLoading && !fastbootError && (
                  <>
                    <div className="input-wrapper">
                      <SearchOutlined className="input-icon" />
                      <input
                        type="text"
                        placeholder={`Search ${fastbootDevices.length} devices...`}
                        value={fastbootFilter}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                          setFastbootFilter(e.target.value);
                          setSelectedDevice(null);
                        }}
                      />
                    </div>

                    <select
                      className="device-listbox"
                      size={6}
                      value={selectedDevice?.id ?? ''}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                        const device = filteredDevices.find(
                          (d) => d.id === Number(e.target.value)
                        );
                        setSelectedDevice(device ?? null);
                      }}
                    >
                      {filteredDevices.length === 0 ? (
                        <option disabled value="">No devices match your search</option>
                      ) : (
                        filteredDevices.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))
                      )}
                    </select>

                    <div className="device-count">
                      {filteredDevices.length} / {fastbootDevices.length} devices
                    </div>
                  </>
                )}
              </div>
            )}

            {formType === 'ota' && (
              <form onSubmit={handleOtaSearch} className="firmware-form">
                <div className="input-wrapper">
                  <SearchOutlined className="input-icon" />
                  <input
                    type="text"
                    placeholder="Device Codename (e.g. sweet)"
                    value={otaCodename}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setOtaCodename(e.target.value)}
                    required
                  />
                </div>

                <div className="input-wrapper">
                  <GlobalOutlined className="input-icon" />
                  <input
                    type="text"
                    placeholder="Version (e.g. OS1.0.1.0.TLIMIXM)"
                    value={otaVersion}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setOtaVersion(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="search-btn" disabled={otaLoading}>
                  {otaLoading
                    ? <><LoadingOutlined spin /> Searching...</>
                    : <><SearchOutlined /> Find OTA</>
                  }
                </button>
              </form>
            )}
          </div>

          {formType === 'fastboot' && selectedDevice && (
            <>
              <div className="divider" />
              <div className="result-inline-container">
                <div className="result-content">
                  <div className="result-header-small">
                    <h3>{selectedDevice.name}</h3>
                    <span className="version-tag">Fastboot</span>
                  </div>
                  <a
                    href={selectedDevice.download_url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary"
                  >
                    <DownloadOutlined /> Download ROM
                  </a>
                </div>
              </div>
            </>
          )}

          {formType === 'ota' && otaResult && (
            <>
              <div className="divider" />
              <div className="result-inline-container">
                {otaResult.error ? (
                  <div className="result-content error-msg">❌ {otaResult.error}</div>
                ) : (
                  <div className="result-content">
                    <div className="result-header-small">
                      <h3>{otaResult.device}</h3>
                      <span className="version-tag">{otaResult.version}</span>
                    </div>

                    <div className="info-row">
                      <span><InfoCircleOutlined /> <strong>Android:</strong> {otaResult.android_version}</span>
                      <span><strong>Size:</strong> {otaResult.filesize}</span>
                    </div>

                    {otaResult.download_url && (
                      <a
                        href={otaResult.download_url}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-primary"
                      >
                        <DownloadOutlined /> Download ROM
                      </a>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </section>

      <div className="ticks" />

      <section id="next-steps">
        <div id="social">
          <h2>Connect</h2>
          <div className="social-links">
            <a href="https://github.com/XiaomiUtils" target="_blank" rel="noreferrer" className="social-card">
              <GithubOutlined className="social-icon-big" />
              <div className="social-info">
                <strong>GitHub</strong>
                <span>Source Code</span>
              </div>
            </a>
          </div>
        </div>
      </section>

      <div className="ticks" />
      <section id="spacer" />
    </>
  );
}
