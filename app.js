// State
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let chart = null;

// DOM refs
const form = document.getElementById('transaction-form');
const list = document.getElementById('transaction-list');

// Init
form.querySelector('#date').valueAsDate = new Date();
render();

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const desc   = document.getElementById('description').value.trim();
  const amount = parseFloat(document.getElementById('amount').value);
  const type   = document.getElementById('type').value;
  const date   = document.getElementById('date').value;

  if (!desc || isNaN(amount) || amount <= 0) return;

  transactions.unshift({ id: Date.now(), desc, amount, type, date });
  save();
  render();
  form.reset();
  form.querySelector('#date').valueAsDate = new Date();
});

function save() {
  localStorage.setItem('transactions', JSON.stringify(transactions));
}

function deleteTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  save();
  render();
}

function render() {
  renderSummary();
  renderList();
  renderChart();
}

function renderSummary() {
  const income  = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;

  document.getElementById('total-income').textContent  = fmt(income);
  document.getElementById('total-expense').textContent = fmt(expense);
  const balEl = document.getElementById('balance');
  balEl.textContent = fmt(balance);
  balEl.style.color = balance < 0 ? '#fca5a5' : 'white';
}

function renderList() {
  if (transactions.length === 0) {
    list.innerHTML = '<p class="empty-state">No transactions yet. Add one above!</p>';
    return;
  }
  list.innerHTML = transactions.map(t => `
    <li class="transaction-item ${t.type}">
      <div class="transaction-info">
        <div class="desc">${escHtml(t.desc)}</div>
        <div class="date-label">${formatDate(t.date)}</div>
      </div>
      <div class="transaction-right">
        <span class="transaction-amount">${t.type === 'income' ? '+' : '-'}${fmt(t.amount)}</span>
        <button class="delete-btn" onclick="deleteTransaction(${t.id})" title="Delete">&#x2715;</button>
      </div>
    </li>
  `).join('');
}

function renderChart() {
  const income  = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const ctx = document.getElementById('myChart').getContext('2d');
  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Income', 'Expenses'],
      datasets: [{
        data: [income || 0.001, expense || 0.001],
        backgroundColor: ['#4ade80', '#f87171'],
        borderColor: ['#16a34a', '#dc2626'],
        borderWidth: 2,
        hoverOffset: 8,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '65%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: { font: { size: 13 }, padding: 16 }
        },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.label}: ${fmt(ctx.raw === 0.001 ? 0 : ctx.raw)}`
          }
        }
      }
    }
  });
}

// Helpers
function fmt(n) {
  return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-');
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
