const data = {
  network: {
    "No internet connection": {
      question: "Are other devices working on the same network?",
      options: {
        yes: "Device-specific issue. Check Wi-Fi or DNS.",
        no: "Router/ISP issue. Restart router."
      }
    },
    "Slow internet": {
      question: "Is it affecting all devices?",
      options: {
        yes: "Network congestion.",
        no: "Device issue. Close apps."
      }
    }
  },

  device: {
    "Laptop won't start": {
      question: "Does power light turn on?",
      options: {
        yes: "Software issue.",
        no: "Power issue."
      }
    },
    "Printer not working": {
      question: "Is the printer connected to the network?",
      options: {
        yes: "Check printer queue or driver.",
        no: "Reconnect printer to the network."
      }
    }
  },

  accounts: {
    "Can't log in": {
      question: "Is password correct?",
      options: {
        yes: "MFA issue.",
        no: "Reset password."
      }
    },
    "Forgot password": {
      question: "Can the user access their recovery email?",
      options: {
        yes: "Use password reset.",
        no: "Contact administrator."
      }
    }
  },

  apps: {
    "App not opening": {
      question: "Did it recently update?",
      options: {
        yes: "Compatibility issue.",
        no: "Reinstall app."
      }
    },
    "App keeps crashing": {
      question: "Does it crash after launch?",
      options: {
        yes: "Clear cache or reinstall app.",
        no: "Check for updates."
      }
    }
  }
};

// STATE
let stack = [];
let pos = -1;

// DOM
const home = document.getElementById("home");
const categories = document.getElementById("categories");
const supportLayout = document.getElementById("supportLayout");
const result = document.getElementById("result");

const questionText = document.getElementById("questionText");
const optionsBox = document.getElementById("options");
const resultText = document.getElementById("resultText");
const logBox = document.getElementById("logBox");

const backBtn = document.getElementById("backBtn");

// FINAL ACTION BUTTONS
const finalActions = document.createElement("div");
finalActions.id = "finalActions";
finalActions.classList.add("hidden");

const finalReportBtn = document.createElement("button");
finalReportBtn.innerText = "Generate Incident Report";
finalReportBtn.addEventListener("click", generateReport);

const finalRestartBtn = document.createElement("button");
finalRestartBtn.innerText = "Restart";
finalRestartBtn.addEventListener("click", restart);

const finalBackBtn = document.createElement("button");
finalBackBtn.innerText = "⬅ Back";
finalBackBtn.addEventListener("click", goBack);

finalActions.appendChild(finalReportBtn);
finalActions.appendChild(finalRestartBtn);
finalActions.appendChild(finalBackBtn);

backBtn.insertAdjacentElement("afterend", finalActions);

// BUTTONS
document.getElementById("startBtn").addEventListener("click", showCategories);
document.getElementById("backBtnCategories").addEventListener("click", restart);

backBtn.addEventListener("click", goBack);
document.getElementById("backBtnResult").addEventListener("click", goBack);
document.getElementById("restartBtn").addEventListener("click", restart);
document.getElementById("reportBtn").addEventListener("click", generateReport);

document.querySelectorAll(".card").forEach(card => {
  card.addEventListener("click", () => {
    selectCategory(card.dataset.cat);
  });
});

// PUSH STATE
function push(state) {
  stack = stack.slice(0, pos + 1);
  stack.push(state);
  pos++;
}

// NAVIGATION
function showCategories() {
  stack = [];
  pos = -1;

  resetUI();
  categories.classList.remove("hidden");
}

function selectCategory(cat) {
  stack = [];
  pos = -1;

  push({
    view: "category",
    cat,
    text: formatCategory(cat)
  });

  push({
    view: "problemList",
    cat,
    problems: Object.keys(data[cat])
  });

  render();
}

function selectProblem(cat, problem) {
  push({
    view: "problem",
    cat,
    problem
  });

  const q = data[cat][problem];

  push({
    view: "question",
    cat,
    problem,
    question: q.question,
    options: q.options
  });

  render();
}

// BACK
function goBack() {
  if (pos > 0) {
    const currentState = stack[pos];

    stack.pop();
    pos--;

    if (currentState.view === "result" && stack[pos].view === "question") {
      delete stack[pos].answer;
    }

    if (stack[pos] && stack[pos].view === "problem") {
      stack.pop();
      pos--;
    }

    render();
  } else {
    showCategories();
  }
}

// RENDER
function render() {
  const state = stack[pos];

  resetUI();

  if (!state) {
    categories.classList.remove("hidden");
    return;
  }

  if (state.view === "category") {
    categories.classList.remove("hidden");
    return;
  }

  if (state.view === "problemList") {
    supportLayout.classList.remove("hidden");
    logPanelVisible(true);
    renderLog();

    backBtn.classList.remove("hidden");
    finalActions.classList.add("hidden");

    questionText.innerText = "Select a problem";
    optionsBox.innerHTML = "";

    state.problems.forEach(problem => {
      const btn = document.createElement("button");
      btn.innerText = problem;
      btn.onclick = () => selectProblem(state.cat, problem);
      optionsBox.appendChild(btn);
    });
  }

  if (state.view === "question") {
    supportLayout.classList.remove("hidden");
    logPanelVisible(true);
    renderLog();

    backBtn.classList.remove("hidden");
    finalActions.classList.add("hidden");

    questionText.innerText = state.question;
    optionsBox.innerHTML = "";

    Object.keys(state.options).forEach(opt => {
      const btn = document.createElement("button");
      btn.innerText = opt;

      btn.onclick = () => {
        state.answer = opt;

        push({
          view: "result",
          text: state.options[opt]
        });

        render();
      };

      optionsBox.appendChild(btn);
    });
  }

  if (state.view === "result") {
    supportLayout.classList.remove("hidden");
    logPanelVisible(true);
    renderLog();

    questionText.innerText = "Diagnosis";
    optionsBox.innerHTML = `<div>${state.text}</div>`;

    backBtn.classList.add("hidden");
    finalActions.classList.remove("hidden");
  }
}

// LOG
function renderLog() {
  let html = "";

  stack.slice(0, pos + 1).forEach(s => {
    if (s.view === "category") {
      html += `<div>✔ Category: ${s.text}</div>`;
    }

    if (s.view === "problem") {
      html += `<div>✔ Problem: ${s.problem}</div>`;
    }

    if (s.view === "question" && s.answer) {
      html += `<div>✔ Question: ${s.question} → ${s.answer}</div>`;
    }
  });

  logBox.innerHTML = html;
}

// LOG PANEL CONTROL
function logPanelVisible(show) {
  const logPanel = document.getElementById("logPanel");
  logPanel.classList.toggle("hidden", !show);
}

// REPORT
function generateReport() {
  const report = `
=== INCIDENT REPORT ===

${stack.map(s => {
  if (s.view === "category") return `Category: ${s.text}`;
  if (s.view === "problem") return `Problem: ${s.problem}`;
  if (s.view === "question" && s.answer) return `Question: ${s.question} -> ${s.answer}`;
  if (s.view === "result") return `Diagnosis: ${s.text}`;
  return "";
}).filter(Boolean).join("\n")}

Status: Resolved
Generated: ${new Date().toLocaleString()}
`;

  alert(report);
}

// RESTART
function restart() {
  stack = [];
  pos = -1;
  resetUI();
  home.classList.remove("hidden");
}

// RESET
function resetUI() {
  home.classList.add("hidden");
  categories.classList.add("hidden");
  supportLayout.classList.add("hidden");
  result.classList.add("hidden");
  finalActions.classList.add("hidden");
}

// FORMAT
function formatCategory(cat) {
  return {
    network: "Network & Connectivity",
    device: "Device & Hardware",
    accounts: "Accounts & Access",
    apps: "Applications & Software"
  }[cat] || cat;
}