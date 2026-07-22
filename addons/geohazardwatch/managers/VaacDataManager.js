'use strict';

const fs   = require('fs');
const path = require('path');

/**
 * VaacDataManager
 *
 * Loads the Washington VAAC advisory snapshot (vaac.json) and provides
 * lookups by GVP volcano number and region.
 *
 * Snapshot shape:
 *   { fetchedUtc, maxAgeHours, advisories[], totalCount }
 *
 * Each advisory:
 *   vaac, volcanoName, gvpNumber, latitude, longitude, region,
 *   summitElevationFt, advisoryNumber, issueTimeUtc, informationSource,
 *   eruptionDetails, ashCloudTopFl, directionOfMotionDeg, speedOfMotionKt,
 *   remarks, nextAdvisoryTimeUtc, matchedVolcanoNumber, sourceXmlUrl
 */
class VaacDataManager {
  /** @param {string} dataPath  Directory containing vaac.json */
  constructor(dataPath) {
    this.dataPath   = dataPath;
    /** @type {object[]} */
    this.advisories = [];
    this.fetchedUtc  = null;
    this.maxAgeHours = null;
  }

  async load() {
    const file = path.join(this.dataPath, 'vaac.json');
    if (!fs.existsSync(file)) return;

    const snapshot     = JSON.parse(fs.readFileSync(file, 'utf8'));
    this.fetchedUtc    = snapshot.fetchedUtc  || null;
    this.maxAgeHours   = snapshot.maxAgeHours || null;
    this.advisories    = snapshot.advisories  || [];
  }

  /** @returns {number} */
  count() { return this.advisories.length; }

  /**
   * Get the active advisory for a single volcano by GVP number.
   * Returns null if that volcano has no active advisory.
   * @param {string|number} volcanoNumber
   * @returns {object|null}
   */
  getAdvisory(volcanoNumber) {
    return this.advisories.find(a =>
      String(a.matchedVolcanoNumber) === String(volcanoNumber)
    ) || null;
  }

  /**
   * All active advisories, optionally filtered.
   * @param {{ region?: string, vaac?: string }} [filters]
   * @returns {object[]}
   */
  getActive(filters = {}) {
    let results = [...this.advisories];

    if (filters.region) {
      results = results.filter(a =>
        a.region?.toLowerCase() === filters.region.toLowerCase()
      );
    }
    if (filters.vaac) {
      results = results.filter(a =>
        a.vaac?.toLowerCase() === filters.vaac.toLowerCase()
      );
    }

    return results;
  }

  /**
   * Returns a pre-formatted string suitable for use as MarqueePlugin text.
   *
   * Common options (from ManagerFetchOptions):
   *   limit — max number of advisories to include (0 = all)
   *
   * Domain-specific options:
   *   region — filter by state/region (e.g. 'GUATEMALA')
   *   vaac   — filter by issuing VAAC (currently only WASHINGTON)
   *
   * @param {Record<string, string>} [options]
   * @returns {string}
   */
  toMarqueeText(options = {}) {
    const { limit, region, vaac } = options;

    let advisories = this.getActive({ region, vaac });

    const n = limit !== undefined ? parseInt(limit, 10) : 0;
    if (n > 0) advisories = advisories.slice(0, n);

    if (advisories.length === 0) return 'No active volcanic ash advisories.';
    return 'ASH ADVISORIES: ' + advisories
      .map(a => `${a.volcanoName} — FL${a.ashCloudTopFl ?? '?'}`)
      .join('  •  ');
  }

  /** @returns {object} Status summary for AddonsManager.status() */
  status() {
    return {
      fetchedUtc:  this.fetchedUtc,
      totalCount:  this.advisories.length,
    };
  }
}

module.exports = VaacDataManager;
