<script setup>
const logoUrl = `${import.meta.env.BASE_URL}appsintoss-logo.png`;
</script>

<template>
  <main class="app" data-testid="apps-in-toss-starter">
    <header class="app-header">
      <h1 class="page-title">반가워요</h1>
      <p class="page-subtitle">앱인토스 개발을 시작해 보세요.</p>
    </header>

    <nav class="app-actions" aria-label="Apps in Toss 링크">
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
    </nav>

    <div class="app-logo-wrap">
      <img class="logo" :src="logoUrl" alt="Apps in Toss" />
    </div>
  </main>
</template>
