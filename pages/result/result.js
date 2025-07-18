// pages/result/result.js
Page({
  data: {
    scenarios: [],
    originalResults: null
  },

  onLoad: function (options) {
    const results = getApp().globalData.analysisResults;
    if (results) {
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
        scenarios: scenariosArray,
        originalResults: results
      });
    }
  },

  showIrrTip: function() {
    wx.showModal({
      title: '什么是等效投资年化(IRR)?',
      content: 'IRR（内部收益率）是衡量您本次提前还款操作真实回报率的黄金指标。您可以将此回报率与您其他投资渠道（如理财、基金）的收益率直接比较，如果IRR更高，说明提前还款是更划算的选择。',
      showCancel: false,
      confirmText: '我明白了'
    });
  },

  goBack: function() {
    wx.navigateBack();
  },

  viewSchedule: function(e) {
    const scenarioIndex = e.currentTarget.dataset.key;
    const scenario = this.data.scenarios[scenarioIndex];
    if (scenario && scenario.schedule) {
      getApp().globalData.scheduleToShow = scenario.schedule;
      getApp().globalData.scheduleTitle = scenario.name;
      wx.navigateTo({
        url: '/pages/schedule/schedule',
      });
    }
  },

  onUnload: function () {
    // 清理全局数据
    getApp().globalData.analysisResults = null;
  }
});