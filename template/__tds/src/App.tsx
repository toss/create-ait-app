import { Asset, Button, Top } from "@toss/tds-mobile";
import "./App.css";
{{SAMPLE_IMPORTS}}

function App() {
  {{PAGE_STATE_AND_ROUTES}}
  return (
    <>
      <Top
        title={<Top.TitleParagraph size={22}>반가워요</Top.TitleParagraph>}
        subtitleBottom={
          <Top.SubtitleParagraph size={17}>
            앱인토스 개발을 시작해 보세요.
          </Top.SubtitleParagraph>
        }
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          padding: "24px",
        }}
      >
        <Button
          as="a"
          variant="weak"
          href="https://developers-apps-in-toss.toss.im"
          target="_blank"
          rel="noopener noreferrer"
        >
          개발자센터
        </Button>
        <Button
          as="a"
          variant="weak"
          href="https://techchat-apps-in-toss.toss.im"
          target="_blank"
          rel="noopener noreferrer"
        >
          개발자 커뮤니티
        </Button>
        {{SAMPLE_BUTTONS}}
      </div>

      <div
        style={{
          position: "fixed",
          bottom: "24px",
          left: "50%",
          transform: "translateX(-50%)",
        }}
      >
        <Asset.Image
          alt="apps in toss logo"
          frameShape={{ width: 160 }}
          backgroundColor="transparent"
          src={`${import.meta.env.BASE_URL}appsintoss-logo.png`}
        />
      </div>
    </>
  );
}

export default App;
