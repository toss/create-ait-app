import "./App.css";
{{SAMPLE_IMPORTS}}

let currentPage = null;

function renderHome() {
  const root = document.getElementById("root");
  root.innerHTML = `
    <div class="app">
      <header class="app-header">
        <h1 class="page-title">반가워요</h1>
        <p class="page-subtitle">앱인토스 개발을 시작해 보세요.</p>
      </header>

      <div class="app-actions">
        <a
          class="app-button app-button-primary"
          href="https://developers-apps-in-toss.toss.im"
          target="_blank"
          rel="noopener noreferrer"
        >
          개발자센터
        </a>
        <a
          class="app-button app-button-primary"
          href="https://techchat-apps-in-toss.toss.im"
          target="_blank"
          rel="noopener noreferrer"
        >
          개발자 커뮤니티
        </a>
        {{SAMPLE_BUTTONS}}
      </div>

      <div class="app-logo-wrap">
        <img
          class="logo"
          src="${import.meta.env.BASE_URL}appsintoss-logo.png"
          alt="apps in toss"
        />
      </div>
    </div>
  `;

  root.querySelectorAll("[data-page]").forEach((button) => {
    button.addEventListener("click", () => {
      currentPage = button.dataset.page;
      render();
    });
  });
}

function render() {
{{SAMPLE_ROUTES}}
  renderHome();
}

render();
