// pages/result/result.js
Page({
  data: {
    scenarios: [],
    // originalResults: null // 不再需要
  },

  onLoad: function (options) {
    // V2.0 重构: 从URL参数获取数据
    if (options.results) {
        try {
            const results = JSON.parse(decodeURIComponent(options.results));
            const scenariosArray = Object.values(results);
      
            let maxInterestSaved = -1;
            let bestScenarioIndex = -1;
            scenariosArray.forEach((scenario, index) => {
              if (parseFloat(scenario.interestSaved) > maxInterestSaved) {
                maxInterestSaved = parseFloat(scenario.interestSaved);
                bestScenarioIndex = index;
              }
            });
            if (bestScenarioIndex !== -1) {
              scenariosArray[bestScenarioIndex].isRecommended = true;
            }

            this.setData({
              scenarios: scenariosArray
            });
        } catch (e) {
            console.error("解析计算结果失败", e);
            wx.showToast({ title: '页面加载失败', icon: 'none' });
        }
    }
  },

  // ... [showIrrTip, goBack 函数保持原样] ...
  showIrrTip: function() { wx.showModal({ title: '什么是等效投资年化(IRR)?', content: '...', showCancel: false, confirmText: '我明白了' }); },
  goBack: function() { wx.navigateBack(); },
  
  // V2.0 重构：使用 Storage 传递详情页数据
  viewSchedule: function(e) {
    const scenarioIndex = e.currentTarget.dataset.key;
    const scenario = this.data.scenarios[scenarioIndex];
    if (scenario && scenario.schedule) {
      // 使用 Storage 传递大数据，避免URL超长
      wx.setStorageSync('temp_schedule_data', {
        schedule: scenario.schedule,
        title: scenario.name
      });
      wx.navigateTo({
        url: '/pages/schedule/schedule',
      });
    }
  },

  // V2.0 重构: onUnload不再需要清理 globalData
  onUnload: function () { }
});