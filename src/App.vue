<template>
  <v-app>
    <router-view />
  </v-app>
</template>

<style>
.responsive-padding {
  padding: 16px;
}

@media (max-width: 600px) {
  .responsive-padding {
    padding: 12px;
  }
}

.responsive-title {
  font-size: 18px;
  font-weight: bold;
}

@media (max-width: 600px) {
  .responsive-title {
    font-size: 16px;
  }
}

.responsive-btn {
  height: 48px;
  font-size: 16px;
}

@media (max-width: 600px) {
  .responsive-btn {
    height: 44px;
    font-size: 15px;
  }
}

.responsive-card {
  padding: 16px;
}

@media (max-width: 600px) {
  .responsive-card {
    padding: 12px;
  }
}
</style>
