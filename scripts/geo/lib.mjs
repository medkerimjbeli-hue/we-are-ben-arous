// Shared validation for the derived geographic files. Used by build, validate and the test suite.
export const BEN_AROUS_ID = 'TN-13';
export const EXPECTED_DELEGATION_CODES = ['1351','1352','1353','1354','1355','1356','1357','1358','1359','1360','1361','1362'];

function rings(geom) {
  if (geom.type === 'Polygon') return geom.coordinates;
  if (geom.type === 'MultiPolygon') return geom.coordinates.flat();
  return null;
}

export function validateGeo(governorates, delegations) {
  const errors = [];
  const check = (fc, label) => {
    for (const f of fc.features) {
      const r = rings(f.geometry);
      if (!r) { errors.push(`${label} ${f.properties.id}: unsupported geometry ${f.geometry.type}`); continue; }
      for (const ring of r) {
        if (ring.length < 4) errors.push(`${label} ${f.properties.id}: ring with <4 points`);
        const a = ring[0], b = ring[ring.length - 1];
        if (a[0] !== b[0] || a[1] !== b[1]) errors.push(`${label} ${f.properties.id}: open ring`);
        for (const [x, y] of ring) if (!(x > 7 && x < 12.5 && y > 30 && y < 38)) { errors.push(`${label} ${f.properties.id}: coordinate outside Tunisia (${x},${y})`); break; }
      }
      for (const k of ['id', 'name_fr', 'name_ar']) if (!f.properties[k]) errors.push(`${label} ${f.properties.id}: missing ${k}`);
    }
  };
  check(governorates, 'governorate');
  check(delegations, 'delegation');
  const govIds = new Set(governorates.features.map((f) => f.properties.id));
  if (governorates.features.length !== 24 || govIds.size !== 24) errors.push(`expected 24 unique governorates, got ${govIds.size}`);
  if (!govIds.has(BEN_AROUS_ID)) errors.push('Ben Arous (TN-13) missing');
  const codes = delegations.features.map((f) => f.properties.ins_code).sort();
  if (JSON.stringify(codes) !== JSON.stringify(EXPECTED_DELEGATION_CODES)) errors.push(`unexpected Ben Arous delegation codes: ${codes.join(',')}`);
  for (const f of delegations.features) {
    if (f.properties.governorate !== BEN_AROUS_ID) errors.push(`${f.properties.id} not in TN-13`);
    if (f.properties.id !== `delegation-${f.properties.ins_code}`) errors.push(`${f.properties.id} id/ins_code mismatch`);
    if (!f.properties.ins_code.startsWith('13')) errors.push(`${f.properties.id} INS prefix is not Ben Arous (13)`);
  }
  return errors;
}
