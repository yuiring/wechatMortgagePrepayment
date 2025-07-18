// pages/result/result.js
Page({
  data: {
    scenarios: [],
    prepaymentAmount: 0,
    investmentAnalysis: {}
  },

  onLoad: function (options) {
    if (options.results) {
        try {
            const results = JSON.parse(decodeURIComponent(options.results));
            const scenariosArray = Object.values(results);
            const prepaymentAmount = parseFloat(options.prepaymentAmount || 0);
      
            let maxInterestSaved = -1;
            let bestScenarioIndex = -1;
            scenariosArray.forEach((scenario, index) => {
              if (parseFloat(scenario.interestSaved) > maxInterestSaved) {
                maxInterestSaved = parseFloat(scenario.interestSaved);
                bestScenarioIndex = index;
              }
              // V2.2 新增: 为每个方案增加万元单位的数值，方便展示
              scenario.originalFuturePaymentInWan = (scenario.originalFuturePayment / 10000).toFixed(2);
              scenario.newFuturePaymentInWan = (scenario.newFuturePayment / 10000).toFixed(2);
            });
            if (bestScenarioIndex !== -1) {
              scenariosArray[bestScenarioIndex].isRecommended = true;
            }

            this.setData({
              scenarios: scenariosArray,
              prepaymentAmount: prepaymentAmount
            });

            this.calculateInvestment(scenariosArray, prepaymentAmount);

        } catch (e) {
            console.error("解析计算结果失败", e);
            wx.showToast({ title: '页面加载失败', icon: 'none' });
        }
    }
  },

  // V2.2 新增: 计算投资收益分析
  calculateInvestment: function(scenarios, prepaymentAmount) {
    // 找到“缩短期限”方案中，节省时间最长的那个作为参考
    let maxTermSaved = 0;
    scenarios.forEach(s => {
      if(s.name.includes('缩短期限') && s.termSaved > maxTermSaved) {
        maxTermSaved = s.termSaved;
      }
    });

    if (maxTermSaved > 0 && prepaymentAmount > 0) {
      const termSavedInYears = (maxTermSaved / 12).toFixed(1);
      const investmentRate = 0.03; // 假设年化3%
      const futureValue = (prepaymentAmount * 10000 * Math.pow(1 + investmentRate, termSavedInYears)).toFixed(2);
      
      this.setData({
        investmentAnalysis: {
          hasData: true,
          termSavedInYears: termSavedInYears,
          futureValueInWan: (futureValue / 10000).toFixed(2),
          investmentRatePercent: investmentRate * 100
        }
      });
    } else {
      this.setData({ investmentAnalysis: { hasData: false } });
    }
  },

  // ... (其他函数保持不变) ...
  showIrrTip: function() { /* ... */ },
  goBack: function() { /* ... */ },
  viewSchedule: function(e) { /* ... */ },
  onUnload: function () { }
});