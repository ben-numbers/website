function parseCSV(text) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const character = text[i];
    const next = text[i + 1];

    if (character === '"' && quoted && next === '"') {
      value += '"';
      i += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      row.push(value.trim());
      value = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && next === "\n") i += 1;
      row.push(value.trim());
      if (row.some((cell) => cell !== "")) rows.push(row);
      row = [];
      value = "";
    } else {
      value += character;
    }
  }

  row.push(value.trim());
  if (row.some((cell) => cell !== "")) rows.push(row);
  return rows;
}

async function loadQuote() {
  const quoteElement = document.querySelector("#daily-quote");
  if (!quoteElement) return;

  try {
    const response = await fetch("quotes.csv", { cache: "no-store" });
    if (!response.ok) throw new Error("Quote file could not be loaded.");
    const rows = parseCSV(await response.text()).slice(1);
    if (!rows.length) throw new Error("No quotes were found.");
    const [quote, author] = rows[Math.floor(Math.random() * rows.length)];
    quoteElement.textContent = `“${quote}”`;
    document.querySelector("#quote-author").textContent = author ? `— ${author}` : "";
  } catch (error) {
    quoteElement.textContent = "The quote list will appear here once it is added.";
  }
}

async function loadStats() {
  const tableBody = document.querySelector("#stats-body");
  if (!tableBody) return;

  try {
    const response = await fetch("sabremetrics.csv", { cache: "no-store" });
    if (!response.ok) throw new Error("Statistics could not be loaded.");
    const rows = parseCSV(await response.text()).slice(1);
    tableBody.textContent = "";

    rows.forEach((row) => {
      const tableRow = document.createElement("tr");
      row.slice(0, 6).forEach((value) => {
        const cell = document.createElement("td");
        cell.textContent = value;
        tableRow.appendChild(cell);
      });
      tableBody.appendChild(tableRow);
    });
  } catch (error) {
    tableBody.innerHTML = '<tr><td colspan="6">The standings could not be loaded.</td></tr>';
  }
}

async function loadUpdatedDate() {
  const dateElement = document.querySelector("#last-updated");
  if (!dateElement) return;

  const config = window.SITE_CONFIG || {};
  let date = null;

  if (config.githubUsername && config.repositoryName) {
    try {
      const path = encodeURIComponent("sabremetrics.csv");
      const endpoint = `https://api.github.com/repos/${config.githubUsername}/${config.repositoryName}/commits?path=${path}&per_page=1`;
      const response = await fetch(endpoint);
      const commits = await response.json();
      if (response.ok && commits[0]?.commit?.author?.date) {
        date = new Date(commits[0].commit.author.date);
      }
    } catch (error) {
      date = null;
    }
  }

  if (!date) date = new Date(document.lastModified);
  const validDate = !Number.isNaN(date.getTime());
  dateElement.textContent = validDate
    ? `Last updated: ${new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(date)}`
    : "Last updated: unavailable";
}

loadQuote();
loadStats();
loadUpdatedDate();
