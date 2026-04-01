import { createServer } from 'node:http';
import { URL } from 'node:url';

const port = Number(process.env.CONTROLLED_TARGET_PORT || 4300);

type Transaction = {
  id: string;
  date: string;
  description: string;
  type: 'Credit' | 'Debit';
  amount: string;
};

const accounts = [
  { id: '1001', type: 'Checking', balance: '$850.00', availableBalance: '$850.00' },
  { id: '1002', type: 'Savings', balance: '$1,250.00', availableBalance: '$1,250.00' },
];

const transactionsByAccount: Record<string, Transaction[]> = {
  '1001': [
    { id: '90001', date: '03-25-2026', description: 'Transfer to account 1002', type: 'Debit', amount: '$45.00' },
    { id: '90002', date: '03-20-2026', description: 'Employer deposit', type: 'Credit', amount: '$750.00' },
  ],
  '1002': [
    { id: '90003', date: '03-25-2026', description: 'Transfer from account 1001', type: 'Credit', amount: '$45.00' },
  ],
};

function layout(title: string, body: string): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    body { font-family: Georgia, serif; margin: 0; background: #f6f3ec; color: #1e1b18; }
    header { background: #214e5a; color: #fff; padding: 16px 24px; }
    main { display: grid; grid-template-columns: 260px 1fr; gap: 24px; padding: 24px; }
    nav { background: #fff; border: 1px solid #d6cec0; padding: 16px; }
    nav h2 { margin-top: 0; }
    nav ul { list-style: none; padding: 0; margin: 0; }
    nav li { margin: 10px 0; }
    nav a { color: #214e5a; text-decoration: none; }
    section { background: #fff; border: 1px solid #d6cec0; padding: 20px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th, td { border: 1px solid #d6cec0; padding: 10px; text-align: left; }
    .summary { display: grid; grid-template-columns: repeat(2, minmax(180px, 1fr)); gap: 12px; margin-top: 16px; }
    .card { border: 1px solid #d6cec0; padding: 12px; background: #fbfaf6; }
    .error { background: #fff2f0; color: #8f2d1f; border: 1px solid #e8b4aa; padding: 12px; margin-top: 16px; }
    .status { font-weight: bold; }
    form { display: grid; gap: 12px; max-width: 480px; }
    label { display: grid; gap: 4px; }
    input, select, button { font: inherit; padding: 8px; }
    button { background: #214e5a; color: #fff; border: none; cursor: pointer; }
  </style>
</head>
<body>
  <header><h1>Controlled Bank Target</h1></header>
  <main>
    <nav id="leftPanel">
      <p>Welcome Stable User</p>
      <h2>Account Services</h2>
      <ul>
        <li><a href="/overview.htm">Accounts Overview</a></li>
        <li><a href="/activity.htm?id=1001">Account Activity</a></li>
        <li><a href="/findtrans.htm">Find Transactions</a></li>
        <li><a href="/billpay.htm">Bill Pay</a></li>
        <li><a href="/requestloan.htm">Request Loan</a></li>
      </ul>
    </nav>
    <section>${body}</section>
  </main>
</body>
</html>`;
}

function accountTable(): string {
  return `<table id="accountTable">
    <thead><tr><th>Account</th><th>Type</th><th>Balance</th></tr></thead>
    <tbody>
      ${accounts.map((account) => `<tr><td><a href="/activity.htm?id=${account.id}">${account.id}</a></td><td>${account.type}</td><td>${account.balance}</td></tr>`).join('')}
    </tbody>
  </table>`;
}

function transactionTable(accountId: string, rows: Transaction[]): string {
  return `<table id="transactionTable" data-account-id="${accountId}">
    <thead><tr><th>Date</th><th>Transaction</th><th>Description</th><th>Debit (-)</th><th>Credit (+)</th></tr></thead>
    <tbody>
      ${rows.map((transaction) => `<tr>
        <td>${transaction.date}</td>
        <td><a href="/transaction.htm?id=${transaction.id}">${transaction.id}</a></td>
        <td>${transaction.description}</td>
        <td>${transaction.type === 'Debit' ? transaction.amount : ''}</td>
        <td>${transaction.type === 'Credit' ? transaction.amount : ''}</td>
      </tr>`).join('')}
    </tbody>
  </table>`;
}

function renderOverview(): string {
  return layout('Controlled Bank | Accounts Overview', `
    <h2>Accounts Overview</h2>
    <p>This controlled target keeps seeded accounts and deterministic transaction history.</p>
    ${accountTable()}
  `);
}

function renderActivity(url: URL): string {
  const accountId = url.searchParams.get('id') || '1001';
  const account = accounts.find((entry) => entry.id === accountId) ?? accounts[0];
  const transactions = transactionsByAccount[account.id] ?? [];
  return layout('Controlled Bank | Account Activity', `
    <h2>Account Details</h2>
    <div class="summary">
      <div class="card"><strong>Account Number</strong><div id="accountId">${account.id}</div></div>
      <div class="card"><strong>Account Type</strong><div id="accountType">${account.type.toUpperCase()}</div></div>
      <div class="card"><strong>Balance</strong><div id="balance">${account.balance}</div></div>
      <div class="card"><strong>Available</strong><div id="availableBalance">${account.availableBalance}</div></div>
    </div>
    <h2>Account Activity</h2>
    ${transactionTable(account.id, transactions)}
  `);
}

function renderFindTransactions(url: URL): string {
  const accountId = url.searchParams.get('accountId') || '1001';
  const amount = url.searchParams.get('amount');
  const rows = (transactionsByAccount[accountId] || []).filter((transaction) => !amount || transaction.amount === `$${amount}.00`);
  return layout('Controlled Bank | Find Transactions', `
    <h2>Find Transactions</h2>
    <form action="/findtrans.htm" method="get">
      <label>Account
        <select id="accountId" name="accountId">
          ${accounts.map((account) => `<option value="${account.id}" ${account.id === accountId ? 'selected' : ''}>${account.id}</option>`).join('')}
        </select>
      </label>
      <label>Amount
        <input id="amount" name="amount" value="${amount || ''}" />
      </label>
      <button id="findByAmount" type="submit">Find By Amount</button>
    </form>
    <h2>Transaction Results</h2>
    ${transactionTable(accountId, rows)}
  `);
}

function renderTransaction(url: URL): string {
  const id = url.searchParams.get('id') || '90001';
  const transaction = Object.values(transactionsByAccount).flat().find((entry) => entry.id === id) ?? transactionsByAccount['1001'][0];
  return layout('Controlled Bank | Transaction Details', `
    <h2>Transaction Details</h2>
    <div class="summary">
      <div class="card"><strong>Transaction ID</strong><div>${transaction.id}</div></div>
      <div class="card"><strong>Date</strong><div>${transaction.date}</div></div>
      <div class="card"><strong>Description</strong><div>${transaction.description}</div></div>
      <div class="card"><strong>Type</strong><div>${transaction.type}</div></div>
      <div class="card"><strong>Amount</strong><div>${transaction.amount}</div></div>
    </div>
  `);
}

function renderBillPay(url: URL): string {
  const source = url.searchParams.get('fromAccountId');
  const showError = source === '999999';
  return layout('Controlled Bank | Bill Pay', `
    <h2>Bill Pay</h2>
    <form action="/billpay.htm" method="get">
      <label>Payee name<input name="payeeName" value="Utility Company" /></label>
      <label>From account
        <select name="fromAccountId">
          <option value="1001">1001</option>
          <option value="1002">1002</option>
          <option value="999999" ${showError ? 'selected' : ''}>999999</option>
        </select>
      </label>
      <label>Amount<input name="amount" value="40" /></label>
      <button type="submit">Send Payment</button>
    </form>
    ${showError ? '<h2>Error!</h2><p class="error">An internal error has occurred and has been logged.</p>' : '<p class="status">Ready to submit controlled bill pay requests.</p>'}
  `);
}

function renderRequestLoan(url: URL): string {
  const denial = url.searchParams.get('denial');
  let details = '<p class="status">Choose a denial branch to simulate deterministic server logic.</p>';

  if (denial === 'insufficient-down-payment') {
    details = '<h2>Loan Request Processed</h2><p id="loanStatus" class="status">Denied</p><p id="loanRequestDenied" class="error">You do not have sufficient funds for the given down payment.</p>';
  } else if (denial === 'amount-too-high') {
    details = '<h2>Loan Request Processed</h2><p id="loanStatus" class="status">Denied</p><p id="loanRequestDenied" class="error">We cannot grant a loan in that amount with your available funds.</p>';
  }

  return layout('Controlled Bank | Request Loan', `
    <h2>Request Loan</h2>
    <form action="/requestloan.htm" method="get">
      <label>Denial branch
        <select name="denial">
          <option value="">Select one</option>
          <option value="insufficient-down-payment" ${denial === 'insufficient-down-payment' ? 'selected' : ''}>Insufficient down payment</option>
          <option value="amount-too-high" ${denial === 'amount-too-high' ? 'selected' : ''}>Amount too high</option>
        </select>
      </label>
      <button type="submit">Apply Now</button>
    </form>
    ${details}
  `);
}

function renderIndex(): string {
  return layout('Controlled Bank | Home', `
    <h2>Controlled Coverage Target</h2>
    <p>This local app exists specifically for deterministic deep-branch Playwright coverage.</p>
    ${accountTable()}
  `);
}

const server = createServer((request, response) => {
  const requestUrl = new URL(request.url || '/', `http://127.0.0.1:${port}`);
  let html = '';

  switch (requestUrl.pathname) {
    case '/':
    case '/index.htm':
      html = renderIndex();
      break;
    case '/overview.htm':
      html = renderOverview();
      break;
    case '/activity.htm':
      html = renderActivity(requestUrl);
      break;
    case '/findtrans.htm':
      html = renderFindTransactions(requestUrl);
      break;
    case '/transaction.htm':
      html = renderTransaction(requestUrl);
      break;
    case '/billpay.htm':
      html = renderBillPay(requestUrl);
      break;
    case '/requestloan.htm':
      html = renderRequestLoan(requestUrl);
      break;
    default:
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Not found');
      return;
  }

  response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  response.end(html);
});

server.listen(port, '127.0.0.1', () => {
  // eslint-disable-next-line no-console
  console.log(`Controlled target listening on http://127.0.0.1:${port}`);
});
