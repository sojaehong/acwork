<template>
  <v-card
    class="mb-3 task-card"
    :class="statusClass"
    hover
    elevation="2"
    @click="$emit('click')"
  >
    <v-card-title class="font-weight-bold">
      <v-icon left>{{ statusIcon }}</v-icon>
      {{ item.building }} {{ item.unit }}동 {{ item.room }}호
    </v-card-title>

    <v-card-subtitle class="text-body-2">
      작업: {{ formattedTasks }}
    </v-card-subtitle>

    <v-card-text class="text-caption text-grey-darken-1 d-flex justify-space-between">
      <div>상태: <b>{{ item.status }}</b></div>
      <div>세금계산서: <b>{{ item.invoice ? 'O' : 'X' }}</b></div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  item: {
    type: Object,
    required: true
  }
})

const statusClass = computed(() => {
  switch (props.item.status) {
    case '완료':
      return 'status-complete'
    case '보류':
      return 'status-hold'
    default:
      return 'status-active'
  }
})

const statusIcon = computed(() => {
  switch (props.item.status) {
    case '완료':
      return 'mdi-check-circle'
    case '보류':
      return 'mdi-pause-circle'
    default:
      return 'mdi-progress-clock'
  }
})

const formattedTasks = computed(() =>
  props.item.tasks?.map(t => `${t.name}(${t.count})`).join(', ') || '-'
)
</script>

<style scoped>
.task-card {
  cursor: pointer;
  transition: box-shadow 0.2s;
}
.status-active {
  border-left: 6px solid #2196f3;
}
.status-complete {
  border-left: 6px solid #4caf50;
}
.status-hold {
  border-left: 6px solid #fb8c00;
}
</style>
