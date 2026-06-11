const calculateTool = document.querySelector('#calculateTool');
const calculatorResult = document.querySelector('#calculatorResult');
const estimateProject = document.querySelector('#estimateProject');
const estimateResult = document.querySelector('#estimateResult');

function parseToolNumber(selector) {
  const value = Number(document.querySelector(selector)?.value || 0);
  return Number.isFinite(value) ? value : 0;
}

if (calculateTool && calculatorResult) {
  calculateTool.addEventListener('click', () => {
    const firstValue = parseToolNumber('#calcValueOne');
    const secondValue = parseToolNumber('#calcValueTwo');
    const operator = document.querySelector('#calcOperator')?.value || 'add';
    let result = 0;

    if (operator === 'subtract') {
      result = firstValue - secondValue;
    } else if (operator === 'multiply') {
      result = firstValue * secondValue;
    } else if (operator === 'divide') {
      if (secondValue === 0) {
        calculatorResult.textContent = 'Cannot divide by zero.';
        return;
      }
      result = firstValue / secondValue;
    } else {
      result = firstValue + secondValue;
    }

    calculatorResult.textContent = `Result: ${result.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  });
}

if (estimateProject && estimateResult) {
  estimateProject.addEventListener('click', () => {
    const hours = parseToolNumber('#estimateHours');
    const rate = parseToolNumber('#estimateRate');
    const total = hours * rate;

    estimateResult.textContent = `Estimated total: ${total.toLocaleString(undefined, {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    })}`;
  });
}
