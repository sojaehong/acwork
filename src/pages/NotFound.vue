<template>
  <div class="not-found">
    <div class="content">
      <h1>404</h1>
      <p>페이지를 찾을 수 없습니다.</p>
      <router-link to="/" class="home-link">홈으로 돌아가기</router-link>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NotFound',
}
</script>

<style scoped>
.not-found {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  text-align: center;
}

.content h1 {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.content p {
  font-size: 1.2rem;
  margin-bottom: 2rem;
}

.home-link {
  display: inline-block;
  padding: 0.5rem 1rem;
  background-color: #007bff;
  color: white;
  text-decoration: none;
  border-radius: 4px;
}
</style>
