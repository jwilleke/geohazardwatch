import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import VolcanoDataManager from './VolcanoDataManager.js';

describe('VolcanoDataManager', () => {
  it('searches loaded volcanoes by country', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ghw-vdm-'));
    fs.writeFileSync(
      path.join(dir, 'volcanoes.json'),
      JSON.stringify([
        {
          volcanoNumber: 1,
          volcanoName: 'Fuego',
          country: 'Guatemala',
          volcanicRegionGroup: 'Central America',
          volcanicRegion: 'Guatemala',
          volcanoLandform: 'Composite',
          primaryVolcanoType: 'Stratovolcano',
          activityEvidence: 'Eruption Observed',
          lastKnownEruption: '2026 CE',
          latitude: 14.47,
          longitude: -90.88,
          elevation: 3763,
          dominantRockType: 'Andesite',
          tectonicSetting: 'Subduction zone',
          epoch: 'Holocene'
        }
      ])
    );
    const mgr = new VolcanoDataManager(dir);
    await mgr.load();
    assert.equal(mgr.volcanoCount(), 1);
    const { volcanoes, total } = mgr.search({ country: 'Guatemala' });
    assert.equal(total, 1);
    assert.equal(volcanoes[0]?.volcanoName, 'Fuego');
    const miss = mgr.search({ country: 'Iceland' });
    assert.equal(miss.total, 0);
  });
});
