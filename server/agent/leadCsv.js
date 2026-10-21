const EXPORT_COLUMNS = [
  ['名称', 'name'],
  ['分类', 'type'],
  ['区域', 'district'],
  ['地址', 'address'],
  ['电话', 'tel'],
  ['评分/消费', 'ratingCost'],
  ['营业时间', 'openTimeText'],
];

function text(value) {
  return value === undefined || value === null ? '' : String(value);
}

function escapeCsv(value) {
  const valueText = text(value);
  if (/[",\n\r]/.test(valueText)) {
    return `"${valueText.replaceAll('"', '""')}"`;
  }
  return valueText;
}

function leadValue(lead, key) {
  if (key === 'ratingCost') {
    return [lead.rating ? `评分 ${lead.rating}` : '', lead.cost ? `人均 ${lead.cost}` : '']
      .filter(Boolean)
      .join(' / ');
  }

  if (key === 'openTimeText') {
    return [lead.openTime, lead.openTimeDetail].filter(Boolean).join(' / ');
  }

  return lead[key];
}

function toLeadTableCsv(leads = []) {
  const lines = [EXPORT_COLUMNS.map(([label]) => label).join(',')];
  for (const lead of leads) {
    lines.push(EXPORT_COLUMNS.map(([, key]) => escapeCsv(leadValue(lead, key))).join(','));
  }
  return `${lines.join('\n')}\n`;
}

module.exports = {
  EXPORT_COLUMNS,
  toLeadTableCsv,
};
