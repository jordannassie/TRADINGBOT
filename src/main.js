const roiHistory = [
  { date: "Jan 28", value: 38 },
  { date: "Feb 04", value: 52 },
  { date: "Feb 11", value: 67 },
  { date: "Feb 18", value: 74 },
  { date: "Feb 25", value: 81 },
  { date: "Mar 04", value: 70 },
  { date: "Mar 11", value: 66 },
  { date: "Mar 18", value: 72 },
];

const followers = [
  { handle: "0x1979...e653", label: "Joined Jan 2026", views: "62.3K views" },
  { handle: "0xB8F4...9c21", label: "Joined Dec 2025", views: "48.9K views" },
  { handle: "0xD4C2...7a1b", label: "Joined Nov 2025", views: "39.2K views" },
];

const trades = [
  { market: "Bitcoin · Feb 19 8PM", price: "58¢", value: "$12,342.85", pnl: "+$5,158 (71.81%)", side: "up" },
  { market: "Bitcoin · Feb 19 7PM", price: "79¢", value: "$8,695.57", pnl: "+$1,812 (26.33%)", side: "up" },
  { market: "Ethereum · Feb 19 8PM", price: "77¢", value: "$4,509.90", pnl: "+$1,055 (30.54%)", side: "down" },
  { market: "Solana · Feb 19 8PM", price: "60¢", value: "$3,568.41", pnl: "+$1,413 (65.56%)", side: "up" },
  { market: "Ethereum · Feb 19 7PM", price: "71¢", value: "$3,537.31", pnl: "+$1,014 (40.19%)", side: "up" },
];

const roiChart = document.getElementById("roi-chart");
const roiSpark = document.getElementById("roi-spark");
const followersList = document.getElementById("followers");
const tradeRows = document.getElementById("trade-rows");

function paintChart(target, values) {
  target.innerHTML = "";
  const max = Math.max(...values.map((entry) => entry.value));
  values.forEach((entry) => {
    const bar = document.createElement("span");
    const height = (entry.value / max) * 160 + 20;
    bar.style.height = `${height}px`;
    bar.dataset.value = `${entry.value}%`;
    target.appendChild(bar);
  });
}

function paintSpark(target, values) {
  target.innerHTML = "";
  const max = Math.max(...values.map((entry) => entry.value));
  values.forEach((entry) => {
    const line = document.createElement("span");
    const height = (entry.value / max) * 100;
    line.style.height = `${height}px`;
    line.className = "spark-dot";
    target.appendChild(line);
  });
}

function populateFollowers() {
  followersList.innerHTML = "";
  followers.forEach((follower) => {
    const item = document.createElement("li");
    item.innerHTML = `<div>
        <strong>${follower.handle}</strong>
        <small>${follower.label}</small>
      </div>
      <span>${follower.views}</span>`;
    followersList.appendChild(item);
  });
}

function populateTrades() {
  trades.forEach((trade) => {
    const row = document.createElement("div");
    row.className = "trade-row";
    row.innerHTML = `
      <span>${trade.market}</span>
      <span>${trade.price}</span>
      <span>${trade.value}</span>
      <span><span class="trade-badge ${trade.side}">${trade.pnl}</span></span>`;
    tradeRows.appendChild(row);
  });
}

paintChart(roiChart, roiHistory);
paintSpark(roiSpark, roiHistory.slice(-4));
populateFollowers();
populateTrades();
