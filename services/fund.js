return api.searchFund(keyword).then(results => {
    // 格式化搜索结果
    return results.map(item => {
      // 如果已经是对象格式，直接返回
      if (typeof item === 'object' && item.code) {
        return item;
      }
      // 否则按字符串解析
      if (typeof item === 'string') {
        const parts = item.split(',');
        return {
          code: parts[0],
          name: parts[1],
          type: parts[2],
          pinyin: parts[3],
        };
      }
      // 其他情况返回 null
      return null;
    }).filter(item => item !== null); // 过滤掉 null 值
  }).catch(err => {
    console.error('搜索基金失败', err);
    return [];
  });