const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());

// In-memory user budget data (for simplicity, not persistent)
let budgetData = {
  incomes: [],
  expenses: [],
  categories: ["Food", "Transport", "Rent", "Entertainment", "Others"],
};

// Serve frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// API to get budget data
app.get('/api/budget', (req, res) => {
  res.json(budgetData);
});

// API to add income
app.post('/api/income', (req, res) => {
  const { amount, description, date } = req.body;
  if (amount && !isNaN(amount)) {
    budgetData.incomes.push({ amount: +amount, description, date });
    return res.json({ success: true });
  }
  res.status(400).json({ success: false, message: 'Invalid income data' });
});

// API to add expense
app.post('/api/expense', (req, res) => {
  const { amount, description, category, date } = req.body;
  if (amount && !isNaN(amount) && budgetData.categories.includes(category)) {
    budgetData.expenses.push({ amount: +amount, description, category, date });
    return res.json({ success: true });
  }
  res.status(400).json({ success: false, message: 'Invalid expense data' });
});

// API to get categories
app.get('/api/categories', (req, res) => {
  res.json(budgetData.categories);
});

// AI-like simple recommendation for savings suggestions
app.get('/api/suggestions', (req, res) => {
  const totalIncome = budgetData.incomes.reduce((acc, i) => acc + i.amount, 0);
  const totalExpense = budgetData.expenses.reduce((acc, e) => acc + e.amount, 0);
  const balance = totalIncome - totalExpense;

  let suggestion = 'Good job managing your budget!';
  if (balance < 0) suggestion = 'You are overspending! Try reducing expenses.';
  else if (balance < totalIncome * 0.1) suggestion = 'Try to save more for safety.';
  else suggestion = 'You have healthy savings. Consider investing!';

  res.json({ suggestion });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`PocketSmart AI backend running on http://localhost:${PORT}`);
});
