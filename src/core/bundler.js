import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { generatePlayerHtml } from '../templates/player';
import { generateManifestXml } from '../templates/manifest';
import { sanitizeConfig } from '../security/sanitizer';

/**
 * Creates and downloads the SCORM ZIP package.
 * @param {object} rawConfig - The configuration from the UI.
 */
export const bundleScorm = async (rawConfig) => {
  const config = sanitizeConfig(rawConfig);
  const zip = new JSZip();

  const playerHtml = generatePlayerHtml(config);
  const manifestXml = generateManifestXml(config);

  zip.file("index.html", playerHtml);
  zip.file("imsmanifest.xml", manifestXml);

  const content = await zip.generateAsync({ type: "blob" });
  const filename = `${config.title.replace(/\s+/g, '_')}_SCORM.zip`;
  
  saveAs(content, filename);
};
