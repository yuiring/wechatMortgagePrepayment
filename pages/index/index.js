// pages/index/index.js
const calculator = require('../../utils/calculator.js');
const util = require('../../utils/util.js');

Page({
  data: {
    termRange: Array.from({length: 26}, (v, k) => k + 5),
    termIndex: 25,
    rate: 3.95,
    today: '',
    startDate: '',
    prepaymentDate: '',
    farFutureDate: '2099-12-31',
    formData: {
      totalAmount: null,
      prepaymentAmount: null
    }
  },

  onLoad: function () {
    const today = util.formatDate(new Date());
    const oneYearAgo = util.formatDate(new Date(new Date().setFullYear(new Date().getFullYear() - 1)));
    this.setData({
      today: today,
      startDate: oneYearAgo,
      prepaymentDate: today
    });
  },

  onShow: function() {
    const app = getApp();
    if (app.globalData.tabBarRedirectionData) {
      const dataToLoad = app.globalData.tabBarRedirectionData;
      this.setData({
        'formData.totalAmount': dataToLoad.formData.totalAmount,
        'formData.prepaymentAmount': dataToLoad.formData.prepaymentAmount,
        termIndex: this.data.termRange.indexOf(dataToLoad.loanTerm),
        rate: dataToLoad.rate,
        startDate: dataToLoad.startDate,
        prepaymentDate: dataToLoad.prepaymentDate,
      });
      app.globalData.tabBarRedirectionData = null;
      wx.showToast({ title: '已载入历史数据', icon: 'none' });
    }
  },

  bindTermChange: function(e) { this.setData({ termIndex: e.detail.value }); },
  bindRateInput: function(e) { this.setData({ rate: e.detail.value }); },
  bindDateChange(e) { const field = e.currentTarget.dataset.field; this.setData({ [field]: e.detail.value }); },
  
  handleInput: function(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [`formData.${field}`]: e.detail.value
    });
  },

  onCalculate(e) {
    const values = this.data.formData;
    
    // V2.0 修复: 从 this.data 直接读取 rate 进行校验，而不是从 values (即 this.data.formData) 中读取
    if (!values.totalAmount || !this.data.rate || !values.prepaymentAmount) {
      wx.showToast({ title: '请填写所有必填项', icon: 'none' });
      return;
    }
    
    const monthsPaid = util.getMonthsDifference(this.data.startDate, this.data.prepaymentDate);
    if (monthsPaid < 0) {
      wx.showToast({ title: '计划还款时间不能早于首次还款时间', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '智能分析中...', mask: true });

    setTimeout(() => {
      const params = {
        totalAmount: parseFloat(values.totalAmount) * 10000,
        loanTerm: this.data.termRange[this.data.termIndex] * 12,
        rate: parseFloat(this.data.rate) / 100 / 12,
        monthsPaid: monthsPaid,
        prepaymentAmount: parseFloat(values.prepaymentAmount) * 10000,
      };
      
      const results = calculator.analyze(params);
      wx.hideLoading();

      if (results.error) {
        wx.showToast({ title: results.error, icon: 'none', duration: 2000 });
        return;
      }
      
      this.saveToHistory({
        formData: values,
        loanTerm: this.data.termRange[this.data.termIndex],
        rate: this.data.rate,
        startDate: this.data.startDate,
        prepaymentDate: this.data.prepaymentDate,
        results: results
      });
      
      const resultsStr = encodeURIComponent(JSON.stringify(results));
      wx.navigateTo({
        url: `/pages/result/result?results=${resultsStr}`
      });
    }, 100);
  },

  saveToHistory(record) {
    const history = wx.getStorageSync('calculation_history') || [];
    const newRecord = {
      id: Date.now(),
      date: util.formatDate(new Date()),
      ...record
    };
    history.unshift(newRecord);
    if (history.length > 20) {
      history.pop();
    }
    wx.setStorageSync('calculation_history', history);
  },
});