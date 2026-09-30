const incomeForm = document.getElementById('income-form');
const expenseForm = document.getElementById('expense-form');
const totalIncomeEl = document.getElementById('total-income');
const totalExpensesEl = document.getElementById('total-expenses');
const remainingBalanceEl = document.getElementById('remaining-balance');
const expenseCategorySelect = document.getElementById('expense-category');
const suggestionText = document.getElementById('suggestion-text');
const ctx = document.getElementById('budgetChart').getContext('2d');

let budgetChart;

async function fetchCategories() {
  const res = await fetch('/api/categories');
  const categories = await res.json();
  expenseCategorySelect.innerHTML = '';
  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    expenseCategorySelect.appendChild(option);
  });
}

async function fetchBudgetData() {
  const res = await fetch('/api/budget');
  const data = await res.json();
  return data;
}

function formatCurrency(value) {
  return `₹${value.toFixed(2)}`;
}

function groupByMonthYear(items, dateKey = 'date') {
  const result = {};
  items.forEach(item => {
    let date = item[dateKey] ? new Date(item[dateKey]) : new Date();
    const monthYear = `${date.getFullYear()}-${date.getMonth() + 1}`;
    if (!result[monthYear]) result[monthYear] = 0;
    result[monthYear] += item.amount;
  });
  return result;
}

async function loadDashboard() {
  const data = await fetchBudgetData();

  const totalIncome = data.incomes.reduce((acc, i) => acc + i.amount, 0);
  const totalExpenses = data.expenses.reduce((acc, e) => acc + e.amount, 0);
  const balance = totalIncome - totalExpenses;

  totalIncomeEl.textContent = formatCurrency(totalIncome);
  totalExpensesEl.textContent = formatCurrency(totalExpenses);
  remainingBalanceEl.textContent = formatCurrency(balance);

  // Chart data preparation - monthly totals for last 6 months
  const incomeByMonth = groupByMonthYear(data.incomes);
  const expenseByMonth = groupByMonthYear(data.expenses);

  const today = new Date();
  const labels = [];
  const incomeValues = [];
  const expenseValues = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const label = d.toLocaleString('default', { month: 'short', year: 'numeric' });
    labels.push(label);

    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    incomeValues.push(incomeByMonth[key] || 0);
    expenseValues.push(expenseByMonth[key] || 0);
  }

  if (budgetChart) budgetChart.destroy();

  budgetChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Income',
          backgroundColor: '#27ae60',
          data: incomeValues,
        },
        {
          label: 'Expense',
          backgroundColor: '#e74c3c',
          data: expenseValues,
        },
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true },
      }
    }
  });

  loadSuggestions();
}

async function loadSuggestions() {
  const res = await fetch('/api/suggestions');
  const data = await res.json();
  suggestionText.textContent = data.suggestion;
}

incomeForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const amount = parseFloat(document.getElementById('income-amount').value);
  const description = document.getElementById('income-description').value.trim();
  const date = document.getElementById('income-date').value || new Date().toISOString().split('T')[0];

  if (amount <= 0 || isNaN(amount)) return alert('Enter a valid income amount.');

  const res = await fetch('/api/income', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, description, date }),
  });

  const data = await res.json();
  if (data.success) {
    incomeForm.reset();
    loadDashboard();
  } else {
    alert(data.message || 'Failed to add income.');
  }
});

expenseForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const amount = parseFloat(document.getElementById('expense-amount').value);
  const description = document.getElementById('expense-description').value.trim();
  const category = document.getElementById('expense-category').value;
  const date = document.getElementById('expense-date').value || new Date().toISOString().split('T')[0];

  if (amount <= 0 || isNaN(amount)) return alert('Enter a valid expense amount.');

  const res = await fetch('/api/expense', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, description, category, date }),
  });

  const data = await res.json();
  if (data.success) {
    expenseForm.reset();
    loadDashboard();
  } else {
    alert(data.message || 'Failed to add expense.');
  }
});

async function init() {
  await fetchCategories();
  await loadDashboard();
}

init();
