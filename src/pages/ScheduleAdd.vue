<template>
  <v-app>
    <v-main>
      <v-container class="pa-4 pb-16">
        <h2 class="text-h5 mb-4">📝 작업 등록</h2>

        <!-- ✅ 날짜 선택 (상단, 크게) -->
        <v-text-field
          v-model="form.date"
          label="날짜"
          type="date"
          outlined
          class="mb-4"
          dense
          style="font-size: 18px; height: 72px;"
        />

        <!-- ✅ 건물 선택 -->
        <div class="mb-4">
          <div class="mb-2">건물 선택</div>
          <div class="horizontal-scroll">
            <v-btn-toggle
              v-model="form.building"
              mandatory
              class="scroll-toggle"
            >
              <v-btn
                v-for="b in buildings"
                :key="b"
                :value="b"
                class="scroll-btn"
                color="primary"
                variant="tonal"
              >{{ b }}</v-btn>
            </v-btn-toggle>
          </div>
          <v-text-field
            v-if="form.building === '기타'"
            v-model="form.buildingEtc"
            label="건물명 직접 입력"
            outlined
            class="mt-2"
          />
        </div>

        <!-- ✅ 동 선택 -->
        <div class="mb-4">
          <div class="mb-2">동 선택</div>
          <div class="horizontal-scroll">
            <v-btn-toggle
              v-model="form.unit"
              mandatory
              class="scroll-toggle"
            >
              <v-btn
                v-for="u in units"
                :key="u"
                :value="u"
                class="scroll-btn"
                color="primary"
                variant="tonal"
              >{{ u }}</v-btn>
            </v-btn-toggle>
          </div>
          <v-text-field
            v-if="form.unit === '기타'"
            v-model="form.unitEtc"
            label="동 직접 입력"
            outlined
            class="mt-2"
          />
        </div>

        <!-- ✅ 호수 -->
        <v-text-field v-model="form.room" label="호수" outlined class="mb-4" />

        <!-- ✅ 작업 내용 및 수량 -->
        <div class="mb-4">
          <div class="mb-2">작업 내용 및 수량</div>
          <div
            v-for="(task, index) in form.tasks"
            :key="index"
            class="d-flex align-center flex-wrap mb-2"
          >
            <div class="horizontal-scroll mr-2">
              <v-btn-toggle
                v-model="task.name"
                mandatory
                class="scroll-toggle"
              >
                <v-btn
                  v-for="t in types"
                  :key="t"
                  :value="t"
                  class="scroll-btn"
                  color="secondary"
                  variant="tonal"
                >{{ t }}</v-btn>
              </v-btn-toggle>
            </div>
            <v-text-field
              v-if="task.name === '기타'"
              v-model="task.etc"
              label="직접 입력"
              style="max-width: 120px"
              class="mr-2"
              dense
            />
            <v-text-field
              v-model="task.count"
              label="수량"
              type="number"
              min="1"
              style="max-width: 80px"
              class="mr-2"
              dense
            />
            <v-btn icon color="error" @click="removeTask(index)">
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </div>
          <v-btn small color="success" @click="addTask">+ 작업 추가</v-btn>
        </div>

        <!-- ✅ 작업 상태 -->
        <div class="mb-4">
          <div class="mb-2">작업 상태</div>
          <v-btn-toggle
            v-model="form.status"
            mandatory
            style="flex-wrap: wrap; gap: 8px;"
          >
            <v-btn
              v-for="s in statuses"
              :key="s"
              :value="s"
              style="min-width: 90px; height: 40px; font-size: 14px;"
              color="success"
              variant="tonal"
            >{{ s }}</v-btn>
          </v-btn-toggle>
        </div>

        <!-- ✅ 세금계산서 여부 -->
        <div class="mb-4">
          <div class="mb-2">세금계산서 발행 여부</div>
          <v-btn-toggle v-model="form.invoice" mandatory>
            <v-btn value="Y" color="blue" variant="tonal">O</v-btn>
            <v-btn value="N" color="red" variant="tonal">X</v-btn>
          </v-btn-toggle>
        </div>

        <!-- ✅ 메모 -->
        <v-textarea
          v-model="form.memo"
          label="작업 관련 메모 (선택사항)"
          outlined
          rows="3"
          class="mb-4"
        />
      </v-container>

      <!-- ✅ 하단 고정 버튼 -->
      <v-container
        class="pa-2"
        style="position: fixed; bottom: 0; left: 0; right: 0; background: #fff; z-index: 100; box-shadow: 0 -2px 6px rgba(0,0,0,0.1);"
      >
        <v-row dense>
          <v-col cols="6">
            <v-btn color="secondary" block @click="goHome">홈으로</v-btn>
          </v-col>
          <v-col cols="6">
            <v-btn color="primary" block @click="submit">등록</v-btn>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
// ... (기존 동일)
</script>

<style scoped>
.horizontal-scroll {
  overflow-x: auto;
  white-space: nowrap;
  padding-bottom: 4px;
  -webkit-overflow-scrolling: touch;
}
.scroll-toggle {
  display: inline-flex;
  flex-wrap: nowrap !important;
}
.scroll-btn {
  margin-right: 8px;
  white-space: nowrap;
  min-width: 100px;
  height: 40px;
  font-size: 14px;
}
</style>