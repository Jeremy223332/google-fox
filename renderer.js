
const tabsElement = document.getElementById("tabs");
const browser = document.getElementById("browser");
const address = document.getElementById("address");
const welcome = document.getElementById("welcome");

let tabs = [];
let activeTabId = null;
let nextId = 1;

function makeTab(url = null) {
  const id = nextId++;

  const view = document.createElement("webview");
  view.setAttribute("partition", "persist:google-fox");
  view.setAttribute("allowpopups", "");
  view.style.display = "none";

  browser.appendChild(view);

  const tab = {
    id,
    url,
    title: "New Tab",
    view
  };

  tabs.push(tab);

  view.addEventListener("page-title-updated", event => {
    tab.title = event.title || "Website";
    renderTabs();
  });

  view.addEventListener("did-navigate", event => {
    tab.url = event.url;
    if (activeTabId === id) address.value = event.url;
  });

  view.addEventListener("did-navigate-in-page", event => {
    tab.url = event.url;
    if (activeTabId === id) address.value = event.url;
  });

  view.addEventListener("did-fail-load", event => {
    if (event.errorCode === -3) return;
    console.warn("Navigation failed:", event.errorDescription);
  });

  activateTab(id);

  if (url) navigate(url);
}

function activateTab(id) {
  activeTabId = id;

  for (const tab of tabs) {
    const active = tab.id === id;
    tab.view.style.display = active ? "flex" : "none";

    if (active) {
      address.value = tab.url || "";
    }
  }

  const current = tabs.find(tab => tab.id === id);
  const isHome = !current || !current.url;

  welcome.style.display = isHome ? "flex" : "none";
  renderTabs();
}

function renderTabs() {
  tabsElement.replaceChildren();

  for (const tab of tabs) {
    const element = document.createElement("div");
    element.className =
      "tab" + (tab.id === activeTabId ? " active" : "");

    const label = document.createElement("span");
    label.className = "tab-label";
    label.textContent = tab.title;

    const close = document.createElement("button");
    close.className = "close-tab";
    close.textContent = "×";
    close.title = "Close tab";

    element.addEventListener("click", () => activateTab(tab.id));

    close.addEventListener("click", event => {
      event.stopPropagation();
      closeTab(tab.id);
    });

    element.append(label, close);
    tabsElement.appendChild(element);
  }
}

function normalizeInput(input) {
  input = input.trim();
  if (!input) return null;

  if (/^https?:\/\//i.test(input)) {
    try {
      const parsed = new URL(input);
      return ["http:", "https:"].includes(parsed.protocol)
        ? parsed.href
        : null;
    } catch {
      return "https://www.google.com/search?q=" +
        encodeURIComponent(input);
    }
  }

  const looksLikeDomain =
    /^[a-z0-9-]+(\.[a-z0-9-]+)+(\/.*)?$/i.test(input) &&
    !input.includes(" ");

  if (looksLikeDomain) return "https://" + input;

  return "https://www.google.com/search?q=" +
    encodeURIComponent(input);
}

function navigate(input) {
  const tab = tabs.find(tab => tab.id === activeTabId);
  if (!tab) return;

  const url = normalizeInput(input);
  if (!url) return;

  tab.url = url;
  tab.title = "Loading...";
  address.value = url;

  welcome.style.display = "none";
  tab.view.loadURL(url);
  renderTabs();
}

function closeTab(id) {
  const index = tabs.findIndex(tab => tab.id === id);
  if (index === -1) return;

  tabs[index].view.remove();
  tabs.splice(index, 1);

  if (tabs.length === 0) {
    makeTab();
    return;
  }

  if (activeTabId === id) {
    activateTab(tabs[Math.max(0, index - 1)].id);
  } else {
    renderTabs();
  }
}

document.getElementById("address-form").addEventListener(
  "submit",
  event => {
    event.preventDefault();
    navigate(address.value);
  }
);

document.getElementById("search-form").addEventListener(
  "submit",
  event => {
    event.preventDefault();
    navigate(document.getElementById("home-search").value);
  }
);

document.getElementById("new-tab").addEventListener(
  "click",
  () => makeTab()
);

document.getElementById("back").addEventListener("click", () => {
  const tab = tabs.find(tab => tab.id === activeTabId);
  if (tab?.view.canGoBack()) tab.view.goBack();
});

document.getElementById("forward").addEventListener("click", () => {
  const tab = tabs.find(tab => tab.id === activeTabId);
  if (tab?.view.canGoForward()) tab.view.goForward();
});

document.getElementById("reload").addEventListener("click", () => {
  const tab = tabs.find(tab => tab.id === activeTabId);
  if (tab) tab.view.reload();
});

document.getElementById("home").addEventListener("click", () => {
  const tab = tabs.find(tab => tab.id === activeTabId);
  if (!tab) return;

  tab.url = null;
  tab.title = "New Tab";
  tab.view.src = "about:blank";
  activateTab(tab.id);
});

document.querySelectorAll("[data-url]").forEach(button => {
  button.addEventListener("click", () => {
    navigate(button.dataset.url);
  });
});

document.addEventListener("keydown", event => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "l") {
    event.preventDefault();
    address.focus();
    address.select();
  }

  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "t") {
    event.preventDefault();
    makeTab();
  }

  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "w") {
    event.preventDefault();
    closeTab(activeTabId);
  }
});

makeTab();
