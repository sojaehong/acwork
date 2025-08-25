<template>
  <v-app>
    <!-- 헤더 -->
    <v-app-bar :elevation="0" class="custom-header" height="80">
      <div class="d-flex align-center justify-space-between w-100 px-4">
        <div class="d-flex align-center">
          <v-btn icon size="large" class="back-btn mr-3" @click="goBack">
            <v-icon>mdi-arrow-left</v-icon>
          </v-btn>
          <div class="header-icon-wrapper">
            <v-icon size="32">mdi-package-variant</v-icon>
          </div>
          <div class="ml-3">
            <h2 class="header-title">품목 관리</h2>
            <div class="header-subtitle">
              견적서/거래명세서 품목 등록 및 관리
            </div>
          </div>
        </div>
      </div>
    </v-app-bar>

    <v-main class="main-content">
      <!-- 에러 메시지 -->
      <v-alert
        v-if="error"
        type="error"
        class="ma-4"
        prominent
        closable
        @click:close="clearError"
      >
        <v-icon start>mdi-alert-circle</v-icon>
        {{ error }}
      </v-alert>

      <!-- 성공 메시지 -->
      <v-alert
        v-if="successMessage"
        type="success"
        class="ma-4"
        prominent
        closable
        @click:close="successMessage = ''"
      >
        <v-icon start>mdi-check-circle</v-icon>
        {{ successMessage }}
      </v-alert>

      <v-container
        class="pa-6"
        style="max-width: 1200px; padding-bottom: 120px !important"
      >
        <!-- 새 품목 추가 카드 -->
        <v-card class="add-item-card mb-6" elevation="0">
          <div class="card-header">
            <div class="header-icon">
              <v-icon color="primary">mdi-plus-circle</v-icon>
            </div>
            <h3 class="card-title">새 품목 추가</h3>
          </div>

          <div class="card-content">
            <v-form ref="form" @submit.prevent="addProduct">
              <v-row>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="newProduct.name"
                    label="품목명"
                    variant="outlined"
                    density="compact"
                    :rules="nameRules"
                    required
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="newProduct.spec"
                    label="규격/사양"
                    variant="outlined"
                    density="compact"
                  />
                </v-col>
                <v-col cols="12" md="3">
                  <v-text-field
                    v-model.number="newProduct.price"
                    label="단가"
                    type="number"
                    variant="outlined"
                    density="compact"
                    :rules="priceRules"
                    required
                  />
                </v-col>
                <v-col cols="12" md="1">
                  <v-btn
                    color="primary"
                    block
                    height="40"
                    :loading="isSaving"
                    type="submit"
                  >
                    <v-icon>mdi-plus</v-icon>
                  </v-btn>
                </v-col>
              </v-row>
            </v-form>
          </div>
        </v-card>

        <!-- 품목 목록 카드 -->
        <v-card class="product-list-card" elevation="0">
          <div class="card-header">
            <div class="header-icon">
              <v-icon color="primary">mdi-format-list-bulleted</v-icon>
            </div>
            <h3 class="card-title">등록된 품목</h3>
            <v-chip color="info" size="small" class="ml-2">
              {{ products.length }}개
            </v-chip>
          </div>

          <div class="card-content">
            <!-- 로딩 상태 -->
            <template v-if="isLoading">
              <div class="products-grid">
                <div v-for="i in 6" :key="i" class="skeleton-card">
                  <div class="skeleton-line skeleton-name"></div>
                  <div class="skeleton-line skeleton-spec"></div>
                  <div class="skeleton-line skeleton-price"></div>
                </div>
              </div>
            </template>

            <!-- 품목 목록 - 카드 형태 -->
            <template v-else-if="products.length">
              <div class="products-grid">
                <v-card
                  v-for="product in products"
                  :key="product.id"
                  class="product-item-card"
                  :class="{ 'editing-card': editingId === product.id }"
                  elevation="2"
                >
                  <!-- 편집 모드 -->
                  <template v-if="editingId === product.id">
                    <v-card-text class="pa-4">
                      <div class="edit-form">
                        <v-text-field
                          v-model="editProduct.name"
                          label="품목명"
                          variant="outlined"
                          density="compact"
                          class="mb-3"
                        />
                        <v-text-field
                          v-model="editProduct.spec"
                          label="규격/사양"
                          variant="outlined"
                          density="compact"
                          class="mb-3"
                        />
                        <v-text-field
                          v-model.number="editProduct.price"
                          type="number"
                          label="단가"
                          variant="outlined"
                          density="compact"
                          class="mb-3"
                        />
                        <div class="edit-actions">
                          <v-btn
                            color="success"
                            variant="flat"
                            size="small"
                            class="mr-2"
                            :loading="isSaving"
                            @click="saveEdit"
                          >
                            <v-icon start size="16">mdi-check</v-icon>
                            저장
                          </v-btn>
                          <v-btn
                            color="grey"
                            variant="outlined"
                            size="small"
                            @click="cancelEdit"
                          >
                            <v-icon start size="16">mdi-close</v-icon>
                            취소
                          </v-btn>
                        </div>
                      </div>
                    </v-card-text>
                  </template>

                  <!-- 일반 표시 모드 -->
                  <template v-else>
                    <v-card-text class="pa-4">
                      <div class="product-info">
                        <h4 class="product-name">{{ product.name }}</h4>
                        <div class="product-spec">
                          {{ product.spec || '규격 없음' }}
                        </div>
                        <div class="product-price">
                          {{ formatPrice(product.price) }}원
                        </div>
                      </div>
                    </v-card-text>
                    <v-card-actions class="pa-4 pt-0">
                      <v-spacer></v-spacer>
                      <v-btn
                        color="primary"
                        variant="outlined"
                        size="small"
                        class="mr-2"
                        @click="startEdit(product)"
                      >
                        <v-icon start size="16">mdi-pencil</v-icon>
                        수정
                      </v-btn>
                      <v-btn
                        color="error"
                        variant="outlined"
                        size="small"
                        @click="confirmDelete(product)"
                      >
                        <v-icon start size="16">mdi-delete</v-icon>
                        삭제
                      </v-btn>
                    </v-card-actions>
                  </template>
                </v-card>
              </div>
            </template>

            <!-- 빈 상태 -->
            <template v-else>
              <div class="empty-state">
                <v-icon size="64" color="grey-lighten-1"
                  >mdi-package-variant-closed</v-icon
                >
                <h4 class="empty-title">등록된 품목이 없습니다</h4>
                <p class="empty-subtitle">첫 번째 품목을 추가해보세요!</p>
              </div>
            </template>
          </div>
        </v-card>
      </v-container>

      <!-- 하단 고정 액션 버튼 -->
      <div class="floating-actions">
        <v-btn
          variant="outlined"
          size="large"
          block
          class="action-btn back-action-btn"
          @click="goBack"
        >
          <v-icon start>mdi-arrow-left</v-icon>
          뒤로가기
        </v-btn>
      </div>
    </v-main>

    <!-- 삭제 확인 다이얼로그 -->
    <v-dialog v-model="showDeleteDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h6">
          <v-icon color="error" class="mr-2">mdi-alert-circle</v-icon>
          품목 삭제 확인
        </v-card-title>
        <v-card-text>
          <strong>{{ deleteTarget?.name }}</strong> 품목을 삭제하시겠습니까?
          <br />삭제된 품목은 복구할 수 없습니다.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showDeleteDialog = false"> 취소 </v-btn>
          <v-btn color="error" @click="deleteProduct"> 삭제 </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { db } from '@/firebase/config'
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore'

const router = useRouter()
const userStore = useUserStore()

// 상태 관리
const products = ref([])
const isLoading = ref(false)
const isSaving = ref(false)
const error = ref('')
const successMessage = ref('')

// 새 품목 추가
const newProduct = ref({
  name: '',
  spec: '',
  price: 0,
})

// 편집 관련
const editingId = ref(null)
const editProduct = ref({})

// 삭제 관련
const showDeleteDialog = ref(false)
const deleteTarget = ref(null)

// 폼 참조
const form = ref(null)

// 유효성 검사 규칙
const nameRules = [
  (v) => !!v || '품목명을 입력해주세요',
  (v) => (v && v.length >= 2) || '품목명은 2자 이상 입력해주세요',
]

const priceRules = [
  (v) => (v !== null && v !== undefined && v !== '') || '단가를 입력해주세요',
  (v) => v >= 0 || '단가는 0 이상이어야 합니다',
]

// 메서드
const goBack = () => {
  router.go(-1)
}

const clearError = () => {
  error.value = ''
}

const formatPrice = (price) => {
  return new Intl.NumberFormat('ko-KR').format(price)
}

// 품목 목록 로딩
const loadProducts = async () => {
  isLoading.value = true
  try {
    const authResult = await userStore.executeWithAuth(async () => {
      return await getDocs(collection(db, 'products'))
    }, router)

    if (!authResult.success) {
      if (authResult.shouldRedirect) return
      throw new Error(authResult.error || '인증에 실패했습니다.')
    }

    const snap = authResult.data
    products.value = snap.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
  } catch (err) {
    console.error('품목 로딩 오류:', err)
    error.value = '품목 목록을 불러오는데 실패했습니다.'
  } finally {
    isLoading.value = false
  }
}

// 새 품목 추가
const addProduct = async () => {
  const { valid } = await form.value.validate()
  if (!valid) return

  isSaving.value = true
  try {
    const authResult = await userStore.executeWithAuth(async () => {
      return await addDoc(collection(db, 'products'), {
        name: newProduct.value.name,
        spec: newProduct.value.spec,
        price: newProduct.value.price,
        createdAt: new Date(),
        createdBy: userStore.userId,
      })
    }, router)

    if (!authResult.success) {
      if (authResult.shouldRedirect) return
      throw new Error(authResult.error || '품목 추가에 실패했습니다.')
    }

    successMessage.value = '품목이 성공적으로 추가되었습니다.'

    // 폼 초기화
    newProduct.value = { name: '', spec: '', price: 0 }
    form.value.reset()

    // 목록 새로고침
    await loadProducts()

    // 성공 메시지 자동 제거
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  } catch (err) {
    console.error('품목 추가 오류:', err)
    error.value = '품목 추가 중 오류가 발생했습니다.'
  } finally {
    isSaving.value = false
  }
}

// 편집 시작
const startEdit = (product) => {
  editingId.value = product.id
  editProduct.value = { ...product }
}

// 편집 취소
const cancelEdit = () => {
  editingId.value = null
  editProduct.value = {}
}

// 편집 저장
const saveEdit = async () => {
  if (!editProduct.value.name || editProduct.value.price < 0) {
    error.value = '품목명과 단가를 올바르게 입력해주세요.'
    return
  }

  isSaving.value = true
  try {
    const authResult = await userStore.executeWithAuth(async () => {
      return await updateDoc(doc(db, 'products', editingId.value), {
        name: editProduct.value.name,
        spec: editProduct.value.spec,
        price: editProduct.value.price,
        updatedAt: new Date(),
        updatedBy: userStore.userId,
      })
    }, router)

    if (!authResult.success) {
      if (authResult.shouldRedirect) return
      throw new Error(authResult.error || '품목 수정에 실패했습니다.')
    }

    successMessage.value = '품목이 성공적으로 수정되었습니다.'

    // 편집 모드 종료
    editingId.value = null
    editProduct.value = {}

    // 목록 새로고침
    await loadProducts()

    // 성공 메시지 자동 제거
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  } catch (err) {
    console.error('품목 수정 오류:', err)
    error.value = '품목 수정 중 오류가 발생했습니다.'
  } finally {
    isSaving.value = false
  }
}

// 삭제 확인
const confirmDelete = (product) => {
  deleteTarget.value = product
  showDeleteDialog.value = true
}

// 품목 삭제
const deleteProduct = async () => {
  if (!deleteTarget.value) return

  try {
    const authResult = await userStore.executeWithAuth(async () => {
      return await deleteDoc(doc(db, 'products', deleteTarget.value.id))
    }, router)

    if (!authResult.success) {
      if (authResult.shouldRedirect) return
      throw new Error(authResult.error || '품목 삭제에 실패했습니다.')
    }

    successMessage.value = '품목이 성공적으로 삭제되었습니다.'

    // 다이얼로그 닫기
    showDeleteDialog.value = false
    deleteTarget.value = null

    // 목록 새로고침
    await loadProducts()

    // 성공 메시지 자동 제거
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  } catch (err) {
    console.error('품목 삭제 오류:', err)
    error.value = '품목 삭제 중 오류가 발생했습니다.'
  }
}

// 초기화
onMounted(async () => {
  const authResult = await userStore.initializeAuth(router)
  if (!authResult.success) {
    if (authResult.shouldRedirect) return
    error.value = authResult.error || '인증에 실패했습니다.'
    return
  }

  await loadProducts()
})
</script>

<style scoped>
/* 헤더 스타일 */
.custom-header {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%) !important;
  backdrop-filter: blur(10px) !important;
  border-bottom: 1px solid rgba(148, 163, 184, 0.2) !important;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04) !important;
}

.back-btn {
  background: rgba(100, 116, 139, 0.1) !important;
  color: #475569 !important;
  border-radius: 12px !important;
  transition: all 0.2s ease !important;
}

.back-btn:hover {
  background: rgba(100, 116, 139, 0.15) !important;
  transform: translateY(-1px) !important;
}

.header-icon-wrapper {
  width: 48px !important;
  height: 48px !important;
  border-radius: 12px !important;
  background: rgba(100, 116, 139, 0.1) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  backdrop-filter: blur(10px) !important;
}

.header-icon-wrapper .v-icon {
  color: #64748b !important;
}

.header-title {
  color: #1e293b !important;
  font-weight: 700 !important;
  font-size: 24px !important;
  margin: 0 !important;
}

.header-subtitle {
  color: #64748b !important;
  font-size: 12px !important;
  font-weight: 500 !important;
}

/* 메인 컨텐츠 */
.main-content {
  background: linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%);
  min-height: 100vh;
}

/* 카드 스타일 */
.add-item-card,
.product-list-card {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.card-header {
  display: flex;
  align-items: center;
  padding: 20px 24px;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-bottom: 1px solid #e2e8f0;
}

.header-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card-title {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.card-content {
  padding: 24px;
}

/* 테이블 스타일 */
.product-table {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
}

.table-header {
  display: grid;
  grid-template-columns: 2fr 2fr 1fr 1fr;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.header-cell {
  padding: 16px;
  font-weight: 600;
  color: #64748b;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.table-body {
  display: flex;
  flex-direction: column;
}

.table-row {
  display: grid;
  grid-template-columns: 2fr 2fr 1fr 1fr;
  border-bottom: 1px solid #e2e8f0;
  transition: all 0.2s ease;
}

.table-row:hover {
  background: #f8fafc;
}

.table-row.editing {
  background: #f0f9ff;
  border-color: #0ea5e9;
}

.table-row:last-child {
  border-bottom: none;
}

.cell {
  padding: 16px;
  display: flex;
  align-items: center;
}

.product-name {
  font-weight: 600;
  color: #1e293b;
}

.product-spec {
  color: #64748b;
}

.product-price {
  font-weight: 600;
  color: #059669;
}

/* 빈 상태 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-title {
  color: #64748b;
  margin: 16px 0 8px 0;
  font-weight: 600;
}

.empty-subtitle {
  color: #94a3b8;
  margin: 0;
}

/* 로딩 스켈레톤 */
.loading-skeleton {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-item {
  display: grid;
  grid-template-columns: 2fr 2fr 1fr 1fr;
  gap: 16px;
  padding: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.skeleton-name,
.skeleton-spec,
.skeleton-price,
.skeleton-actions {
  height: 20px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

/* 반응형 */
@media (max-width: 768px) {
  .table-header,
  .table-row {
    grid-template-columns: 1fr;
    gap: 0;
  }

  .header-cell,
  .cell {
    padding: 12px;
    border-bottom: 1px solid #f1f5f9;
  }

  .header-cell {
    display: none;
  }

  .cell:before {
    content: attr(data-label);
    font-weight: 600;
    color: #64748b;
    display: block;
    margin-bottom: 4px;
    font-size: 12px;
    text-transform: uppercase;
  }

  .cell.name:before {
    content: '품목명';
  }
  .cell.spec:before {
    content: '규격/사양';
  }
  .cell.price:before {
    content: '단가';
  }
  .cell.actions:before {
    content: '작업';
  }
}

/* 하단 고정 액션 버튼 */
.floating-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid #e2e8f0;
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  padding: 20px;
}

.action-btn {
  height: 56px;
  border-radius: 16px;
  font-weight: 600;
  text-transform: none;
  transition: all 0.3s ease;
}

.action-btn:hover {
  transform: translateY(-2px);
}

.action-btn:disabled {
  opacity: 0.6;
  transform: none;
}

.back-action-btn {
  border: 2px solid #e2e8f0;
  color: #1e293b !important;
}

.back-action-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
  color: #1e293b !important;
}

.back-action-btn .v-btn__content {
  color: #1e293b !important;
}

/* 새로운 카드 기반 UI */
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.product-item-card {
  border-radius: 12px !important;
  transition: all 0.3s ease;
  border: 1px solid #e2e8f0;
}

.product-item-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1) !important;
}

.editing-card {
  border: 2px solid #4f46e5 !important;
  box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1) !important;
}

.product-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.product-name {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.product-spec {
  font-size: 14px;
  color: #64748b;
  font-style: italic;
}

.product-price {
  font-size: 20px;
  font-weight: 600;
  color: #059669;
  margin-top: 4px;
}

.edit-form {
  display: flex;
  flex-direction: column;
}

.edit-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

/* 로딩 스켈레톤 업데이트 */
.skeleton-card {
  background: #f8fafc;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  animation: pulse 2s infinite;
}

.skeleton-line {
  background: #e2e8f0;
  border-radius: 4px;
  margin-bottom: 8px;
}

.skeleton-name {
  height: 20px;
  width: 70%;
}

.skeleton-spec {
  height: 16px;
  width: 50%;
}

.skeleton-price {
  height: 18px;
  width: 30%;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* 모바일 최적화 */
@media (max-width: 768px) {
  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .products-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .product-item-card {
    margin: 0 4px;
  }
}
</style>
