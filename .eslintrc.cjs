module.exports = {
  root: true,
  env: {
    node: true,
    'vue/setup-compiler-macros': true,
  },
  extends: [
    'plugin:vue/vue3-essential',
    'eslint:recommended',
    '@vue/eslint-config-prettier',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
  },
  rules: {
    'vue/multi-word-component-names': 'off', // 단일 단어 컴포넌트 이름 허용
    'no-unused-vars': 'warn', // 사용되지 않는 변수는 경고로 처리
    'no-undef': 'off', // 'arguments'와 같은 전역 변수 정의되지 않음 오류 끄기
  },
}
