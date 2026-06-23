import "./App.css";
{{SAMPLE_IMPORTS}}


function App() {
  {{PAGE_STATE_AND_ROUTES}}
  return (
    <div className="app">
      <header className="app-header">
        <h1 className="page-title">반가워요</h1>
        <p className="page-subtitle">앱인토스 개발을 시작해 보세요.</p>
      </header>

      <div className="app-actions">
        <a
          className="app-button app-button-primary"
          href="https://developers-apps-in-toss.toss.im"
          target="_blank"
          rel="noopener noreferrer"
        >
          개발자센터
        </a>
        <a
          className="app-button app-button-primary"
          href="https://techchat-apps-in-toss.toss.im"
          target="_blank"
          rel="noopener noreferrer"
        >
          개발자 커뮤니티
        </a>
        {{SAMPLE_BUTTONS}}
      </div>

      <div className="app-logo-wrap">
        <img
          className="logo"
          src={`${import.meta.env.BASE_URL}appsintoss-logo.png`}
          alt="apps in toss"
        />
      </div>
    </div>
  );
}

export default App;
