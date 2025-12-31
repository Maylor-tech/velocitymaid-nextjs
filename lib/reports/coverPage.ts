/**
 * Shared Cover Page Generator
 * 
 * Provides a consistent branded cover page for all VelocityMaid PDFs
 * Ensures visual alignment across Investor, Partner, and other PDFs
 * 
 * Design principles:
 * - Institutional, trust-first, infrastructure-grade
 * - Same brand anchor (logo, colors, typography)
 * - Structural rhythm (logo → title → subtitle → tagline → meta → confidential)
 */

export interface CoverPageMeta {
  logoPath?: string;
  title: string;
  subtitle: string;
  tagline: string;
  date: string;
  confidentialNote: string;
  preparedFor?: string; // Optional, for partner-specific covers
}

/**
 * Generate HTML for a branded cover page
 * 
 * @param meta - Cover page metadata
 * @returns HTML string for the cover page
 */
export function generateBrandedCoverPage(meta: CoverPageMeta): string {
  const {
    logoPath,
    title,
    subtitle,
    tagline,
    date,
    confidentialNote,
    preparedFor,
  } = meta;

  return `
    <!-- Cover Page -->
    <div class="cover-page">
      <div>
        ${logoPath ? `<img src="${logoPath}" alt="VelocityMaid" class="cover-logo" />` : ""}
        
        <div class="cover-title">${title}</div>
        <div class="cover-subtitle">${subtitle}</div>
        <div class="cover-tagline">${tagline}</div>
      </div>
      
      <div>
        <div class="cover-meta">
          ${preparedFor ? `<p><strong>Prepared for:</strong> ${preparedFor}</p>` : ""}
          <p><strong>Prepared by:</strong> VelocityMaid</p>
          <p><strong>Date:</strong> ${date}</p>
        </div>
        <div class="cover-brand-principle">
          Built to protect people, processes, and progress.
        </div>
        <div class="cover-confidential">
          ${confidentialNote}
        </div>
      </div>
    </div>
  `;
}

/**
 * Generate CSS styles for cover pages
 * 
 * @returns CSS string for cover page styling
 */
export function getCoverPageStyles(): string {
  return `
    .cover-page {
      min-height: 9in;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      text-align: center;
      page-break-after: always;
    }
    .cover-logo {
      margin: 0 auto;
      max-width: 2.2in;
      max-height: 2.2in;
      margin-top: 1.5in;
    }
    .cover-title {
      font-size: 28pt;
      font-weight: bold;
      margin-top: 0.8in;
      margin-bottom: 12pt;
      color: #1F2937;
    }
    .cover-subtitle {
      font-size: 14pt;
      color: #374151;
      margin-bottom: 18pt;
    }
    .cover-tagline {
      font-size: 11pt;
      font-style: italic;
      color: #6B7280;
      margin-bottom: 2in;
    }
    .cover-meta {
      font-size: 10pt;
      color: #6B7280;
      line-height: 1.6;
    }
    .cover-brand-principle {
      font-size: 9pt;
      font-style: italic;
      color: #9CA3AF;
      margin-top: 12pt;
      text-align: center;
    }
    .cover-confidential {
      font-size: 9pt;
      color: #9CA3AF;
      margin-top: 10pt;
    }
  `;
}

