/**
 * Linger · 余温 — 数据备份与恢复
 *
 * 数据全部存在 localStorage，清空缓存/换设备都会丢失。
 * 本模块提供：导出（备份）、导入（恢复）功能。
 * 页面入口：「我 → 数据备份与恢复」
 */

/**
 * 收集所有 linger_* 相关数据
 * @returns {Object} 备份包
 */
function collectAllData() {
  const backup = {
    version: '1.0',
    exported_at: new Date().toISOString(),
    fixed: {},   // 固定 key
    prefixed: {}, // 动态前缀 key (linger_chat_*, linger_memorial_chat_*)
  };

  // 固定 key
  const fixedKeys = [
    'linger_characters', 'linger_pets', 'linger_memorials',
    'linger_together', 'linger_onboarded', 'linger_first_use',
    'linger_day1_memories', 'linger_day1_char', 'linger_day1_time',
    'rv_gender', 'linger_llm_config',
  ];
  for (const k of fixedKeys) {
    const v = localStorage.getItem(k);
    if (v !== null) backup.fixed[k] = v;
  }

  // 前缀匹配 key（聊天历史、纪念聊天）
  const prefixes = ['linger_chat_', 'linger_memorial_chat_'];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    for (const prefix of prefixes) {
      if (key.startsWith(prefix) && key !== prefix) {
        const val = localStorage.getItem(key);
        if (val !== null) backup.prefixed[key] = val;
      }
    }
  }

  return backup;
}

/**
 * 导出备份为 JSON 文件下载
 */
function exportData() {
  const backup = collectAllData();
  const now = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const filename = `余温备份_${now}.json`;
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
  return filename;
}

/**
 * 从 JSON 文件恢复数据
 */
function importData(fileContent) {
  const errors = [];
  let restored = 0;
  try {
    const backup = JSON.parse(fileContent);
    if (!backup.version || !backup.fixed) {
      return { restored: 0, errors: ['不是有效的余温备份文件'] };
    }
    if (backup.fixed) {
      for (const [key, val] of Object.entries(backup.fixed)) {
        try { localStorage.setItem(key, val); restored++; }
        catch (e) { errors.push(`${key}: ${e.message}`); }
      }
    }
    if (backup.prefixed) {
      for (const [key, val] of Object.entries(backup.prefixed)) {
        try { localStorage.setItem(key, val); restored++; }
        catch (e) { errors.push(`${key}: ${e.message}`); }
      }
    }
  } catch (e) {
    errors.push(`解析备份文件失败：${e.message}`);
  }
  return { restored, errors };
}

// 暴露给全局
window.LingerDataBackup = {
  collectAllData,
  exportData,
  importData,
};
