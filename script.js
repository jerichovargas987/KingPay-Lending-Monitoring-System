console.log("✅ script.js loaded");
let customers = JSON.parse(localStorage.getItem("customers")) || [];
if (sessionStorage.getItem("isLoggedIn") === "true") {
  getEl("loginSection").style.display = "none";
  getEl("dashboardWrapper").style.display = "block";
  showSection("dashboardSummary");
  loadSavedCustomerData();
  resetDashboard();
}

function getEl(id) {
  return document.getElementById(id);
}

let activeCustomers = [];
let historyLogs = [];
const OWNER_USERNAME = "owner";
const OWNER_PASSWORD = "lend123";

function showSection(id) {
  document.querySelectorAll(".section").forEach(s => {
    s.classList.remove("active");
    s.style.display = "none";
  });

  const target = getEl(id);
  if (target) {
    target.classList.add("active");
    target.style.display = "block";
  } else {
    console.warn("❌ Section not found:", id);
  }
}

function goHome() {
  showSection("dashboardSummary");
  resetDashboard();
}

// ✅ UPDATED CSV EXPORT FUNCTIONS - Fix date formatting
function exportToCSV() {
  const customers = JSON.parse(localStorage.getItem("customers")) || [];
  
  if (customers.length === 0) {
    alert("No customer data found to export.");
    return;
  }

  try {
    const csvData = convertToCSV(customers);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const timestamp = new Date().toLocaleDateString('en-PH').replace(/\//g, '-');
    link.setAttribute('href', url);
    link.setAttribute('download', `Lending_Report_${timestamp}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert(`✅ CSV file downloaded successfully!\n\nOpen it in Microsoft Excel for easy viewing.`);
    
  } catch (error) {
    console.error('CSV export error:', error);
    alert('Error generating CSV file. Please try again.');
  }
}

function convertToCSV(customers) {
  // CSV headers
  const headers = [
    'Customer Name',
    'Loan Amount',
    'Original Loan', 
    'Interest',
    'Current Balance',
    'Total Paid',
    'Status',
    'Start Date',
    'End Date',
    'Monthly Due Date',
    'Months to Pay',
    'Payments Made',
    'Remaining Payments',
    'Last Payment Date',
    'Penalties Count'
  ];

  // CSV rows
  const rows = customers.map(customer => {
    const totalPaid = (customer.originalLoan + customer.interest) - customer.balance;
    const paymentsCount = customer.paymentHistory ? customer.paymentHistory.length : 0;
    const remainingPayments = customer.monthsToPay - paymentsCount;
    
    // ✅ FIXED: Format dates properly for Excel
    const startDate = customer.startDate ? formatDateForCSV(customer.startDate) : 'N/A';
    const endDate = customer.endDate ? formatDateForCSV(customer.endDate) : 'N/A';
    const lastPaymentDate = customer.lastPaymentDate ? formatDateForCSV(customer.lastPaymentDate) : 'No payments';
    
    return [
      `"${customer.name}"`,
      customer.loanAmount,
      customer.originalLoan,
      customer.interest,
      customer.balance,
      totalPaid,
      customer.status.toUpperCase(),
      startDate,  // ✅ Now properly formatted
      endDate,    // ✅ Now properly formatted
      `Day ${customer.monthlyDueDate}`,
      customer.monthsToPay,
      paymentsCount,
      remainingPayments > 0 ? remainingPayments : 0,
      lastPaymentDate,  // ✅ Now properly formatted
      customer.penaltyHistory ? customer.penaltyHistory.length : 0
    ];
  });

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  return csvContent;
}

// ✅ NEW: Format dates for Excel (YYYY-MM-DD format)
function formatDateForCSV(dateString) {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    // Format as YYYY-MM-DD (Excel-friendly)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'Invalid Date';
  }
}

function exportActiveLoansToCSV() {
  const customers = JSON.parse(localStorage.getItem("customers")) || [];
  const activeCustomers = customers.filter(c => c.status === 'active' && c.balance > 0);
  
  if (activeCustomers.length === 0) {
    alert("No active loans to export.");
    return;
  }

  try {
    const headers = [
      'Customer Name',
      'Loan Amount', 
      'Current Balance',
      'Monthly Due Date',
      'Payments Made',
      'Months Remaining',
      'Last Payment Date',
      'Status',
      'Next Due Date'  // ✅ ADDED: Next due date calculation
    ];

    const rows = activeCustomers.map(customer => {
      const paymentsCount = customer.paymentHistory ? customer.paymentHistory.length : 0;
      const monthsRemaining = customer.monthsToPay - paymentsCount;
      const status = isCustomerOverdue(customer) ? 'OVERDUE' : 'ON TRACK';
      const lastPaymentDate = customer.lastPaymentDate ? formatDateForCSV(customer.lastPaymentDate) : 'No payments yet';
      const nextDueDate = calculateNextDueDate(customer);  // ✅ ADDED: Next due date
      
      return [
        `"${customer.name}"`,
        customer.loanAmount,
        customer.balance,
        `Day ${customer.monthlyDueDate}`,
        paymentsCount,
        monthsRemaining > 0 ? monthsRemaining : 0,
        lastPaymentDate,
        status,
        nextDueDate  // ✅ ADDED: Next due date
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const timestamp = new Date().toLocaleDateString('en-PH').replace(/\//g, '-');
    link.setAttribute('href', url);
    link.setAttribute('download', `Active_Loans_${timestamp}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert(`✅ Active loans exported to CSV!`);
    
  } catch (error) {
    console.error('CSV export error:', error);
    alert('Error generating CSV file. Please try again.');
  }
}

// ✅ NEW: Calculate next due date
function calculateNextDueDate(customer) {
  if (!customer.lastPaymentDate) {
    // If no payments made, next due is the monthly due date of current month
    const today = new Date();
    const dueDay = parseInt(customer.monthlyDueDate);
    const nextDue = new Date(today.getFullYear(), today.getMonth(), dueDay);
    
    // If due date has passed this month, set to next month
    if (nextDue < today) {
      nextDue.setMonth(nextDue.getMonth() + 1);
    }
    
    return formatDateForCSV(nextDue.toISOString().split('T')[0]);
  }
  
  // If payments made, next due is one month after last payment
  const lastPayment = new Date(customer.lastPaymentDate);
  const nextDue = new Date(lastPayment);
  nextDue.setMonth(nextDue.getMonth() + 1);
  
  return formatDateForCSV(nextDue.toISOString().split('T')[0]);
}

function exportSummaryToCSV() {
  const customers = JSON.parse(localStorage.getItem("customers")) || [];
  
  const totalCustomers = customers.length;
  const activeLoans = customers.filter(c => c.status === 'active' && c.balance > 0).length;
  const paidLoans = customers.filter(c => c.status === 'paid').length;
  
  const totalLoanAmount = customers.reduce((sum, c) => sum + c.loanAmount, 0);
  const totalBalance = customers.reduce((sum, c) => sum + c.balance, 0);
  const totalPaid = totalLoanAmount - totalBalance;
  const totalInterest = customers.reduce((sum, c) => sum + c.interest, 0);
  
  const collectionRate = totalLoanAmount > 0 ? (totalPaid / totalLoanAmount * 100) : 0;

  const summaryData = [
    ['LENDING SYSTEM SUMMARY REPORT'],
    ['Generated on', new Date().toLocaleDateString('en-PH')],
    [],
    ['METRIC', 'VALUE'],
    ['Total Customers', totalCustomers],
    ['Active Loans', activeLoans],
    ['Paid Loans', paidLoans],
    ['Total Loan Portfolio', `₱${totalLoanAmount.toLocaleString()}`],
    ['Total Amount Collected', `₱${totalPaid.toLocaleString()}`],
    ['Total Remaining Balance', `₱${totalBalance.toLocaleString()}`],
    ['Total Interest Earned', `₱${totalInterest.toLocaleString()}`],
    ['Collection Rate', `${collectionRate.toFixed(1)}%`],
    [],
    ['REPORT DATE', formatDateForCSV(new Date().toISOString().split('T')[0])]
  ];

  const csvContent = summaryData.map(row => row.join(',')).join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  const timestamp = new Date().toLocaleDateString('en-PH').replace(/\//g, '-');
  link.setAttribute('href', url);
  link.setAttribute('download', `Lending_Summary_${timestamp}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  alert(`✅ Summary report exported to CSV!`);
}
// ✅ END CSV EXPORT FUNCTIONS

function exportCustomerData() {
  localStorage.setItem("lastExportDate", new Date().toISOString());
  if (!confirm("Exporting will remove all paid customers. Continue?")) return;

  const blob = new Blob([JSON.stringify(customers, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "customer_data_" + new Date().toISOString().slice(0, 10) + ".json";
  a.click();
  URL.revokeObjectURL(url);

  customers = customers.filter(c => c.status !== "paid");
  localStorage.setItem("customers", JSON.stringify(customers));
  resetDashboard();
  alert("Export complete. Paid customers have been archived and removed.");
}

function loadSavedCustomerData() {
  const saved = localStorage.getItem("loans");
  if (!saved) {
    console.log("📂 No saved loan data found.");
    return;
  }

  try {
    const loans = JSON.parse(saved);
    renderLoanList();
    console.log("✅ Loaded saved loan data.");
  } catch (err) {
    console.error("❌ Failed to parse saved loan data:", err);
  }
}

function renderLoanList() {
  const loans = JSON.parse(localStorage.getItem("loans") || "[]");
  const container = document.getElementById("mainView");

  container.innerHTML = "";

  if (loans.length === 0) {
    container.innerHTML = "<p>No loans found.</p>";
    return;
  }

  loans.forEach(loan => {
    const div = document.createElement("div");
    div.className = "loan-card";
    div.innerHTML = `
      <strong>${loan.name}</strong><br>
      Amount: ₱${loan.amount}<br>
      Start: ${loan.startDate}<br>
      Status: ${loan.status || "Active"}
    `;
    container.appendChild(div);
  });
}

function handleLogin(e) {
  e.preventDefault();

  const username = getEl("username").value.trim();
  const password = getEl("ownerPassword").value.trim();
  const errorEl = getEl("loginError");

  if (username === OWNER_USERNAME && password === OWNER_PASSWORD) {
    errorEl.textContent = "";
    sessionStorage.setItem("isLoggedIn", "true");

    getEl("loginSection").style.display = "none";
    getEl("dashboardWrapper").style.display = "block";

    document.querySelectorAll(".section").forEach(sec => {
      sec.classList.remove("active");
      sec.style.display = "none";
    });

    showSection("dashboardSummary");
    loadSavedCustomerData();
    resetDashboard();

    console.log("✅ Login successful. Showing dashboard.");
  } else {
    errorEl.textContent = "Incorrect username or password.";
  }
}

// ✅ FIXED: Correct overdue calculation
function isCustomerOverdue(customer) {
  if (customer.status !== "active") return false;

  const today = new Date();
  const dueDay = parseInt(customer.monthlyDueDate);
  
  // If due day is invalid, return false
  if (isNaN(dueDay) || dueDay < 1 || dueDay > 31) return false;

  // Create due date for current month
  const dueDateThisMonth = new Date(today.getFullYear(), today.getMonth(), dueDay);
  
  // If due date is in the past, check if payment was made
  if (today > dueDateThisMonth) {
    if (!customer.lastPaymentDate) {
      // No payment made and due date passed = overdue
      return true;
    }
    
    // Check if last payment was before this month's due date
    const lastPayment = new Date(customer.lastPaymentDate);
    const lastPaymentMonth = new Date(lastPayment.getFullYear(), lastPayment.getMonth(), 1);
    const dueDateMonth = new Date(dueDateThisMonth.getFullYear(), dueDateThisMonth.getMonth(), 1);
    
    // If last payment was from a previous month, check if it covers the due date
    if (lastPaymentMonth < dueDateMonth) {
      return true;
    }
  }
  
  return false;
}

function handleAddCustomer(e) {
  e.preventDefault();

  const name = getEl("name").value.trim();
  const loanAmount = parseFloat(getEl("loanAmount").value);
  const startDate = getEl("startDate").value;
  const monthlyDueDate = parseInt(getEl("monthlyDueDate").value);
  const monthsToPay = parseInt(getEl("monthsToPay").value);

  if (!name || isNaN(loanAmount) || !startDate || isNaN(monthlyDueDate) || isNaN(monthsToPay)) {
    alert("Please fill out all fields correctly.");
    return;
  }

  const duplicate = customers.find(c => c.name.toLowerCase() === name.toLowerCase());
  if (duplicate) {
    alert("Customer with this name already exists.");
    return;
  }

  const interest = loanAmount * 0.10;
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + monthsToPay);

  const id = `cust-${Date.now()}`;

  const newCustomer = {
    id,
    name,
    loanAmount,
    originalLoan: loanAmount,
    interest,
    balance: loanAmount + interest,
    status: "active",
    startDate,
    monthlyDueDate: monthlyDueDate.toString(),
    monthsToPay,
    lastPaymentDate: null,
    penaltyAppliedThisMonth: false,
    penaltyHistory: [],
    paymentHistory: [],
    createdAt: new Date().toISOString().slice(0, 10),
    endDate: endDate.toISOString().slice(0, 10)
  };

  customers.push(newCustomer);
  localStorage.setItem("customers", JSON.stringify(customers));

  alert(`Customer "${name}" added successfully.`);
  getEl("loanForm").reset();
  getEl("dashboardWrapper").style.display = "block";
  resetDashboard();
  showSection("dashboardSummary");
}

function isActive(c) {
  return c.status === "active" && c.balance > 0;
}

function toggleAddCustomer() {
  showSection("addCustomerSection");
}

console.log("📦 Active customers:", customers);

function showActiveLoans() {
  showSection("mainView");
  const container = getEl("mainView");

  container.innerHTML = "<h2>✅ Active Loans</h2>";

  const activeOnly = (customers || [])
    .filter(c => c.status === "active" && c.balance > 0)
    .sort((a, b) => parseInt(a.monthlyDueDate) - parseInt(b.monthlyDueDate));

  if (activeOnly.length === 0) {
    container.innerHTML += "<p>No active loans found.</p>";
    return;
  }

  activeOnly.forEach(customer => {
    const card = renderCustomerCard(customer);
    if (card) container.appendChild(card);
  });
}

function renderCustomerCard(customer) {
  const div = document.createElement("div");

  const isOverdue = isCustomerOverdue(customer);
  const statusClass = isOverdue ? "overdue" : "ontrack";
  div.className = `customer ${statusClass}`;

  const statusLabel = isOverdue
    ? "<span style='color: red; font-weight: bold;'>Overdue</span>"
    : "<span style='color: green; font-weight: bold;'>On Track</span>";

  div.innerHTML = `
    <strong>Status:</strong> ${customer.status.toUpperCase()} ${statusLabel}<br>
    <strong>${customer.name}</strong><br>
    <strong>Due Date:</strong> ${customer.monthlyDueDate}<br>
    <strong>Loan:</strong> ₱${Number(customer.originalLoan || 0).toFixed(2)}<br>
    <strong>Months to Pay:</strong> ${customer.monthsToPay}<br>
    <strong>Penalties:</strong> ₱${Number(customer.penaltyTotal || 0).toFixed(2)}<br>
    <strong>Total Return:</strong> ₱${Number(customer.balance || 0).toFixed(2)}<br>
  `;

  const payBtn = document.createElement("button");
  payBtn.textContent = "Pay";
  payBtn.onclick = () => openPaymentModal(customer.id);
  div.appendChild(payBtn);

  return div;
}

function showDueAndUpcoming() {
  showSection('mainView');
  const container = getEl("mainView");
  container.innerHTML = "<h2>📋 Due & Upcoming Dues</h2>";

  const today = new Date();

  const upcoming = (customers || []).filter(c => {
    const dueDay = parseInt(c.monthlyDueDate);
    if (isNaN(dueDay)) return false;

    const dueDate = new Date(today.getFullYear(), today.getMonth(), dueDay);
    const diffInDays = (dueDate - today) / (1000 * 60 * 60 * 24);
    return isActive(c) && diffInDays >= 0 && diffInDays <= 7;
  });

  const overdue = (customers || []).filter(c => isCustomerOverdue(c));

  container.innerHTML += "<h3>📅 Upcoming Dues (Next 7 Days)</h3>";
  if (upcoming.length === 0) {
    container.innerHTML += "<p>No upcoming dues.</p>";
  } else {
    upcoming.forEach(c => {
      const card = renderCustomerCard(c);
      if (card) container.appendChild(card);
    });
  }

  container.innerHTML += "<h3>⚠️ Overdue Loans</h3>";
  if (overdue.length === 0) {
    container.innerHTML += "<p>No overdue loans.</p>";
  } else {
    overdue.forEach(c => {
      const card = renderCustomerCard(c);
      if (card) container.appendChild(card);
    });
  }
}

let selectedCustomer = null;

function openPaymentModal(customerId) {
  const customer = customers.find(c => c.id === customerId);
  if (!customer) {
    alert("Customer not found.");
    return;
  }

  selectedCustomer = customer;

  const minPayment = customer.monthsToPay > 0
    ? Math.ceil(customer.balance / customer.monthsToPay)
    : customer.balance;

  selectedCustomer.minPayment = minPayment;

  getEl("modalTitle").textContent = `Enter Payment Amount — ${customer.name}`;
  getEl("monthlyDueLabel").innerHTML = `
    Balance: ₱${customer.balance.toFixed(2)}<br>
    Minimum Monthly Payment: ₱${minPayment.toFixed(2)}
  `;
  getEl("paymentInput").value = "";
  getEl("paymentModal").style.display = "flex";

  getEl("confirmPayment").onclick = confirmPaymentHandler;
}

function closePaymentModal() {
  getEl("paymentModal").style.display = "none";
  selectedCustomer = null;
}

// ✅ FIXED: Improved payment handler with better date handling
function confirmPaymentHandler() {
  const paymentAmount = parseFloat(getEl("paymentInput").value);

  if (!selectedCustomer || typeof selectedCustomer.balance !== "number") {
    alert("No customer selected or invalid data.");
    return;
  }

  if (isNaN(paymentAmount) || paymentAmount <= 0) {
    alert("Please enter a valid payment amount.");
    return;
  }

  const minimum = selectedCustomer.minPayment || 0;
  if (paymentAmount < minimum) {
    alert(`Minimum payment is ₱${minimum.toFixed(2)}. Please enter that amount or more.`);
    return;
  }

  if (paymentAmount > selectedCustomer.balance) {
    alert("Payment exceeds remaining balance.");
    return;
  }

  // ✅ FIXED: Update balance and status
  selectedCustomer.balance -= paymentAmount;
  const today = new Date().toISOString().split("T")[0];
  selectedCustomer.lastPaymentDate = today;

  if (selectedCustomer.balance <= 0) {
    selectedCustomer.status = "paid";
    selectedCustomer.balance = 0;
  }

  // ✅ FIXED: Update payment history
  if (!Array.isArray(selectedCustomer.paymentHistory)) {
    selectedCustomer.paymentHistory = [];
  }

  selectedCustomer.paymentHistory.push({
    amount: paymentAmount,
    date: today
  });

  // ✅ FIXED: Update global customers array and localStorage
  const index = customers.findIndex(c => c.id === selectedCustomer.id);
  if (index !== -1) {
    customers[index] = selectedCustomer;
    localStorage.setItem("customers", JSON.stringify(customers));
  }

  // ✅ FIXED: Log payment entry
  const logs = JSON.parse(localStorage.getItem("payment") || "[]");
  logs.push({
    name: selectedCustomer.name,
    amount: paymentAmount,
    date: today
  });
  localStorage.setItem("payment", JSON.stringify(logs));

  // Cleanup
  closePaymentModal();
  resetDashboard();
  
  alert(`Payment of ₱${paymentAmount.toFixed(2)} recorded for ${selectedCustomer.name}`);
}

function logHistory(type, name, amount) {
  historyLogs.push({
    type,
    name,
    amount,
    date: new Date().toISOString().split('T')[0]
  });
}

// ✅ PAYMENT HISTORY FUNCTIONS - ADDED

// Function to show payment history for a customer
function showPaymentHistory(customerId, customerName) {
  // In a real application, you would fetch this data from your database
  // For now, we'll use sample data
  const paymentHistory = getSamplePaymentHistory(customerId);
  
  // Update modal title
  document.getElementById('paymentHistoryCustomerName').textContent = customerName;
  
  // Populate the table
  const tableBody = document.getElementById('paymentHistoryTableBody');
  tableBody.innerHTML = '';
  
  paymentHistory.forEach(payment => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${payment.date}</td>
      <td>₱${payment.amount.toFixed(2)}</td>
      <td>${payment.method}</td>
      <td class="status-paid">${payment.status}</td>
      <td>${payment.reference}</td>
    `;
    tableBody.appendChild(row);
  });
  
  // Show the modal
  document.getElementById('paymentHistoryModal').style.display = 'flex';
}

// Function to generate sample payment history
function getSamplePaymentHistory(customerId) {
  // This is sample data - in a real app, you would fetch from your database
  return [
    { date: 'Oct 22, 2025', amount: 150.00, method: 'Bank Transfer', status: 'Paid', reference: 'REF-78543' },
    { date: 'Sep 15, 2025', amount: 120.50, method: 'Credit Card', status: 'Paid', reference: 'REF-67432' },
    { date: 'Aug 10, 2025', amount: 100.25, method: 'Bank Transfer', status: 'Paid', reference: 'REF-56321' },
    { date: 'Jul 5, 2025', amount: 80.75, method: 'Cash', status: 'Paid', reference: 'REF-45210' },
    { date: 'Jun 1, 2025', amount: 50.52, method: 'Bank Transfer', status: 'Paid', reference: 'REF-34109' }
  ];
}

// Function to display paid customers with payment history buttons
function displayPaidCustomers() {
  const historyList = document.getElementById('historyList');
  
  // In a real application, you would get this data from your database
  const paidCustomers = [
    {
      id: 1,
      name: 'Dxshy',
      originalLoan: '₱2,000.00',
      interest: '₱302.00',
      totalPaid: '₱502.02',
      lastPaymentDate: 'Oct 22, 2025'
    }
    // Add more paid customers as needed
  ];
  
  historyList.innerHTML = '';
  
  paidCustomers.forEach(customer => {
    const customerCard = document.createElement('div');
    customerCard.className = 'paid-customer-card';
    customerCard.innerHTML = `
      <div class="paid-customer-name">${customer.name}</div>
      <div class="paid-customer-details">
        <div class="paid-detail-item">
          <div class="paid-detail-label">Original Loan:</div>
          <div class="paid-detail-value">${customer.originalLoan}</div>
        </div>
        <div class="paid-detail-item">
          <div class="paid-detail-label">Interest:</div>
          <div class="paid-detail-value">${customer.interest}</div>
        </div>
        <div class="paid-detail-item">
          <div class="paid-detail-label">Total Paid:</div>
          <div class="paid-detail-value">${customer.totalPaid}</div>
        </div>
        <div class="paid-detail-item">
          <div class="paid-detail-label">Last Payment Date:</div>
          <div class="paid-detail-value">${customer.lastPaymentDate}</div>
        </div>
      </div>
      <button class="view-payment-btn" onclick="showPaymentHistory(${customer.id}, '${customer.name}')">
        View Payment History
      </button>
    `;
    historyList.appendChild(customerCard);
  });
}

// Override or modify your existing showFullHistory function
function showFullHistory() {
  // Hide other sections and show history section
  hideAllSections();
  getEl("historySection").style.display = "block";
  
  // Display paid customers with payment history buttons
  displayPaidCustomers();
}

function hideAllSections() {
  document.querySelectorAll(".section").forEach(section => {
    section.style.display = "none";
  });
}

// ✅ END PAYMENT HISTORY FUNCTIONS

function updateDashboardSummary() {
  const totalActive = customers.filter(c => c.status === "active" && c.balance > 0).length;
  const totalBalance = customers.reduce((sum, c) => sum + c.balance, 0);
  const totalPenalties = customers.reduce((sum, c) => sum + (c.penaltyHistory?.length || 0) * 100, 0);
  const totalPaid = customers.filter(c => c.status === "paid").length;
  const totalInterest = customers.reduce((sum, c) => sum + c.interest, 0);

  getEl("totalActive").textContent = totalActive;
  getEl("totalBalance").textContent = totalBalance.toFixed(2);
  getEl("totalPenalties").textContent = totalPenalties;
  getEl("totalPaid").textContent = totalPaid;
  getEl("totalInterest").textContent = totalInterest.toFixed(2);
}

function renderLoanStatusChart() {
  const canvas = getEl("loanStatusChart");
  if (!canvas) {
    console.warn("❌ Chart canvas not found.");
    return;
  }

  const ctx = canvas.getContext("2d");

  const customers = JSON.parse(localStorage.getItem("customers") || "[]");

  const active = customers.filter(c => c.status === "active" && c.balance > 0).length;
  const paid = customers.filter(c => c.status === "paid").length;
  const overdue = customers.filter(c => isCustomerOverdue(c)).length;

  if (window.loanChart instanceof Chart) {
    window.loanChart.destroy();
  }

  window.loanChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Active", "Paid", "Overdue"],
      datasets: [{
        label: "Loan Status",
        data: [active, paid, overdue],
        backgroundColor: ["#228B22", "#FFD700", "#FF6347"],
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: context => `${context.label}: ${context.raw} loan${context.raw !== 1 ? "s" : ""}`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            precision: 0
          },
          title: {
            display: true,
            text: "Number of Loans"
          }
        },
        x: {
          title: {
            display: true,
            text: "Loan Status"
          }
        }
      }
    }
  });
}

function resetDashboard() {
  if (typeof checkBackupReminder === "function" && checkBackupReminder()) {
    const reminder = document.createElement("div");
    reminder.className = "backup-reminder";
    reminder.innerHTML = `
      ⚠️ It's been over 7 days since your last backup.
      <button onclick="exportCustomerData()">Export Now</button>
    `;
    getEl("dashboardCustomerList").prepend(reminder);
  }

  showSection("dashboardSummary");
  renderLoanStatusChart();

  const customers = JSON.parse(localStorage.getItem("customers") || "[]");
  const loans = JSON.parse(localStorage.getItem("loans") || "[]");

  const totalLoans = loans.length;
  const totalPaid = loans.filter(l => l.status === "paid").length;
  const totalUnpaid = loans.filter(l => l.status === "unpaid").length;
  const totalAmount = loans.reduce((sum, l) => sum + (typeof l.amount === "number" ? l.amount : 0), 0);

  const totalBalance = customers.reduce((sum, c) => {
    const balance = typeof c.balance === "number" ? c.balance : 0;
    return sum + balance;
  }, 0);

  const totalPenalties = customers.reduce((sum, c) => {
    const penalties = Array.isArray(c.penaltyHistory) ? c.penaltyHistory.length : 0;
    return sum + penalties;
  }, 0);

  const totalInterest = customers.reduce((sum, c) => {
    const interest = typeof c.interest === "number" ? c.interest : 0;
    return sum + interest;
  }, 0);

  getEl("totalActive").textContent = totalLoans;
  getEl("totalBalance").textContent = totalBalance.toFixed(2);
  getEl("totalPenalties").textContent = totalPenalties;
  getEl("totalPaid").textContent = totalPaid;
  getEl("totalInterest").textContent = totalInterest.toFixed(2);

  const listContainer = getEl("dashboardCustomerList");
  listContainer.innerHTML = "<h3>📋 Current Customers</h3>";

  const activeCustomers = customers.filter(c => c.status === "active" && c.balance > 0);

  if (activeCustomers.length === 0) {
    listContainer.innerHTML += "<p>No active customers.</p>";
  } else {
    activeCustomers.forEach(c => {
      const div = document.createElement("div");
      let statusClass = `customer ${c.status}`;
      if (isCustomerOverdue(c)) {
        statusClass += " overdue";
      }
      div.className = statusClass;

      div.innerHTML = `
        <strong>${c.name}</strong><br>
        Loan Amount: ₱${c.loanAmount}<br>
        Balance: ₱${c.balance}<br>
        Status: ${c.status}${isCustomerOverdue(c) ? " (Overdue)" : ""}
      `;
      listContainer.appendChild(div);
    });
  }
}

window.addEventListener("DOMContentLoaded", () => {
  console.log("✅ DOM fully loaded");

  const loginForm = getEl("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
    console.log("✅ Login listener attached");
  }

  // Add event listeners for payment history modal
  const paymentHistoryModal = document.getElementById('paymentHistoryModal');
  const paymentHistoryClose = document.querySelector('.payment-history-close');
  
  if (paymentHistoryClose) {
    paymentHistoryClose.addEventListener('click', function() {
      paymentHistoryModal.style.display = 'none';
    });
  }
  
  window.addEventListener('click', function(event) {
    if (event.target === paymentHistoryModal) {
      paymentHistoryModal.style.display = 'none';
    }
  });

  const loginStatus = sessionStorage.getItem("isLoggedIn");
  console.log("Login status on load:", loginStatus);

  const loginSection = getEl("loginSection");
  const dashboardWrapper = getEl("dashboardWrapper");

  if (loginStatus === "true") {
    console.log("✅ Showing dashboard");
    loginSection.style.display = "none";
    dashboardWrapper.style.display = "block";
    showSection("dashboardSummary");
    loadSavedCustomerData();
    resetDashboard();
  } else {
    console.log("❌ Showing login");
    loginSection.style.display = "flex";
    dashboardWrapper.style.display = "none";
  }
});

function formatDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-PH", { year: 'numeric', month: 'short', day: 'numeric' });
}

function logout() {
  console.log("✅ Custom logout triggered");
  sessionStorage.removeItem("isLoggedIn");

  getEl("username").value = "";
  getEl("ownerPassword").value = "";

  getEl("dashboardWrapper").style.display = "none";

  document.querySelectorAll(".section").forEach(sec => {
    sec.classList.remove("active");
    sec.style.display = "none";
  });

  getEl("loginSection").style.display = "flex";
  getEl("loginSection").classList.add("active");

  document.getElementById("logoutConfirm").style.display = "none";
}

function exportCustomerDataAsJSON() {
  const dataStr = JSON.stringify(customers, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "lendmetrics_customers_backup.json";
  a.click();

  URL.revokeObjectURL(url);
}

document.addEventListener("DOMContentLoaded", function () {
  getEl("loanForm").addEventListener("submit", handleAddCustomer);
  getEl("loginForm").addEventListener("submit", handleLogin);
});