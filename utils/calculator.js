// utils/calculator.js

/**
 * 内部收益率 (IRR) 计算函数
 * @param {number[]} cashFlows - 现金流数组
 * @returns {number} - 年化IRR (百分比)
 */
function calculateIRR(cashFlows) {
  const maxIterations = 1000;
  const tolerance = 1e-7;
  let guess = 0.005;

  for (let i = 0; i < maxIterations; i++) {
    let npv = 0.0;
    let derivative = 0.0;
    for (let t = 0; t < cashFlows.length; t++) {
      npv += cashFlows[t] / Math.pow(1 + guess, t);
      if (t > 0) derivative -= t * cashFlows[t] / Math.pow(1 + guess, t + 1);
    }
    if (Math.abs(derivative) < tolerance) break;
    const newGuess = guess - npv / derivative;
    if (Math.abs(newGuess - guess) < tolerance) {
      return (Math.pow(1 + newGuess, 12) - 1) * 100;
    }
    guess = newGuess;
  }
  return 0;
}

/**
 * 单个场景计算（内部函数）
 * @returns {object} - 单个方案的计算结果
 */
function calculateSingleScenario(params) {
  const { totalAmount, loanTerm, rate, monthsPaid, prepaymentAmount, repaymentMethod, prepaymentOption } = params;
  
  let originalFutureCashFlow = [];
  let originalTotalInterest = 0;
  let remainingPrincipal = 0;
  let alreadyPaidInterest = 0;

  if (repaymentMethod === 'AC') {
    const monthlyPayment = totalAmount * rate * Math.pow(1 + rate, loanTerm) / (Math.pow(1 + rate, loanTerm) - 1);
    originalTotalInterest = monthlyPayment * loanTerm - totalAmount;
    remainingPrincipal = totalAmount * (Math.pow(1 + rate, loanTerm) - Math.pow(1 + rate, monthsPaid)) / (Math.pow(1 + rate, loanTerm) - 1);
    alreadyPaidInterest = monthlyPayment * monthsPaid - (totalAmount - remainingPrincipal);
    for(let i=0; i < (loanTerm - monthsPaid); i++) originalFutureCashFlow.push(monthlyPayment);
  } else { // AP
    originalTotalInterest = (loanTerm + 1) * totalAmount * rate / 2;
    remainingPrincipal = totalAmount - (monthsPaid * (totalAmount / loanTerm));
    alreadyPaidInterest = (monthsPaid * totalAmount * rate) - (totalAmount / loanTerm) * rate * (monthsPaid - 1) * monthsPaid / 2;
    for(let i=0; i < (loanTerm - monthsPaid); i++) {
        const currentPrincipalLeft = totalAmount - (monthsPaid + i) * (totalAmount / loanTerm);
        originalFutureCashFlow.push((totalAmount / loanTerm) + currentPrincipalLeft * rate);
    }
  }

  // 【优化】增加“全部还清”的判断逻辑
  if (prepaymentAmount >= remainingPrincipal) {
    const finalInterestSaved = originalTotalInterest - alreadyPaidInterest;
    return { 
      interestSaved: finalInterestSaved.toFixed(2),
      newMonthlyPayment: '0.00',
      newTerm: 0,
      irr: 'N/A',
      schedule: [],
      leverage: (finalInterestSaved / (remainingPrincipal / 10000)).toFixed(2), // 计算还清时的杠杆
      name: (repaymentMethod === 'AC' ? '等额本息' : '等额本金') + ' · 全部还清'
    };
  }

  const newPrincipal = remainingPrincipal - prepaymentAmount;
  
  let newTerm = 0;
  let newFutureCashFlow = [];
  let newAmortizationSchedule = [];

  if (prepaymentOption === 'shortenTerm') {
    if (repaymentMethod === 'AC') {
      const originalMonthlyPayment = originalFutureCashFlow[0];
      newTerm = Math.ceil(Math.log(originalMonthlyPayment / (originalMonthlyPayment - newPrincipal * rate)) / Math.log(1 + rate));
      let tempPrincipal = newPrincipal;
      if (isFinite(newTerm)) {
        for(let i=1; i<=newTerm; i++) {
            const interest = tempPrincipal * rate;
            const principalPaid = originalMonthlyPayment - interest;
            newFutureCashFlow.push(originalMonthlyPayment);
            newAmortizationSchedule.push({ period: i, principal: principalPaid.toFixed(2), interest: interest.toFixed(2), total: originalMonthlyPayment.toFixed(2), remaining: (tempPrincipal - principalPaid).toFixed(2) });
            tempPrincipal -= principalPaid;
        }
      }
    } else { // AP - shortenTerm
      const monthlyPrincipal = totalAmount / loanTerm;
      newTerm = Math.ceil(newPrincipal / monthlyPrincipal);
      let tempPrincipal = newPrincipal;
      for(let i=1; i<=newTerm; i++) {
        const interest = tempPrincipal * rate;
        const totalPayment = monthlyPrincipal + interest;
        newFutureCashFlow.push(totalPayment);
        newAmortizationSchedule.push({ period: i, principal: monthlyPrincipal.toFixed(2), interest: interest.toFixed(2), total: totalPayment.toFixed(2), remaining: (tempPrincipal - monthlyPrincipal).toFixed(2) });
        tempPrincipal -= monthlyPrincipal;
      }
    }
  } else { // reducePayment
    newTerm = loanTerm - monthsPaid;
    if (repaymentMethod === 'AC') {
      const newMonthlyPayment = newPrincipal * rate * Math.pow(1 + rate, newTerm) / (Math.pow(1 + rate, newTerm) - 1);
      let tempPrincipal = newPrincipal;
      if (isFinite(newMonthlyPayment)) {
        for(let i=1; i<=newTerm; i++) {
            const interest = tempPrincipal * rate;
            const principalPaid = newMonthlyPayment - interest;
            newFutureCashFlow.push(newMonthlyPayment);
            newAmortizationSchedule.push({ period: i, principal: principalPaid.toFixed(2), interest: interest.toFixed(2), total: newMonthlyPayment.toFixed(2), remaining: (tempPrincipal - principalPaid).toFixed(2) });
            tempPrincipal -= principalPaid;
        }
      }
    } else { // AP - reducePayment
      const monthlyPrincipal = newPrincipal / newTerm;
      let tempPrincipal = newPrincipal;
      for(let i=1; i<=newTerm; i++) {
        const interest = tempPrincipal * rate;
        const totalPayment = monthlyPrincipal + interest;
        newFutureCashFlow.push(totalPayment);
        newAmortizationSchedule.push({ period: i, principal: monthlyPrincipal.toFixed(2), interest: interest.toFixed(2), total: totalPayment.toFixed(2), remaining: (tempPrincipal - monthlyPrincipal).toFixed(2) });
        tempPrincipal -= monthlyPrincipal;
      }
    }
  }

  const irrCashFlow = [-prepaymentAmount];
  const maxLength = Math.max(originalFutureCashFlow.length, newFutureCashFlow.length);
  for (let i = 0; i < maxLength; i++) {
    irrCashFlow.push((originalFutureCashFlow[i] || 0) - (newFutureCashFlow[i] || 0));
  }
  const irr = calculateIRR(irrCashFlow);
  
  const newFutureInterest = newFutureCashFlow.reduce((a, b) => a + b, 0) - newPrincipal;
  const newTotalInterest = alreadyPaidInterest + newFutureInterest;
  const interestSaved = originalTotalInterest - newTotalInterest;

  return {
    interestSaved: interestSaved.toFixed(2),
    newMonthlyPayment: (newFutureCashFlow[0] || 0).toFixed(2),
    newTerm: isFinite(newTerm) ? newTerm : 'N/A',
    irr: irr.toFixed(2),
    schedule: newAmortizationSchedule
  };
}

/**
 * 主分析函数
 */
function analyzeAllScenarios(params) {
  const { prepaymentAmount } = params;

  const scenarios = {};
  const methods = [{ key: 'AC', name: '等额本息' }, { key: 'AP', name: '等额本金' }];
  const options = [{ key: 'shortenTerm', name: '缩短期限' }, { key: 'reducePayment', name: '减少月供' }];

  methods.forEach(method => {
    options.forEach(option => {
      const scenarioKey = `${method.key}_${option.key}`;
      const result = calculateSingleScenario({ ...params, repaymentMethod: method.key, prepaymentOption: option.key });
      if (result) {
        if (!result.error) {
          result.leverage = (result.interestSaved / (prepaymentAmount / 10000)).toFixed(2);
          scenarios[scenarioKey] = { ...result, name: `${method.name} · ${option.name}` };
        } else {
            // 将错误信息也放入结果，以便调试
            scenarios[scenarioKey] = result;
        }
      }
    });
  });
  
  return scenarios;
}

module.exports.analyze = analyzeAllScenarios;