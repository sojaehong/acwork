<template>
  <v-app>
    <!-- 🎨 현대적인 그라데이션 헤더 -->
    <v-app-bar :elevation="0" class="custom-header" height="80">
      <div
        class="d-flex align-center justify-space-between w-100 px-4 header-content"
      >
        <div class="d-flex align-center header-left">
          <div class="header-icon-wrapper">
            <v-icon size="32" color="white">mdi-file-document-outline</v-icon>
          </div>
          <div class="ml-3 header-text">
            <h2 class="header-title">견적서 작성</h2>
            <div class="header-subtitle">스마트 문서 관리</div>
          </div>
        </div>

        <div class="d-flex align-center header-right">
          <v-btn
            variant="outlined"
            size="small"
            class="document-list-btn"
            @click="showDocumentList = true"
          >
            <v-icon start size="16">mdi-file-document-multiple</v-icon>
            <span class="btn-text">문서 목록</span>
          </v-btn>
          <v-btn
            variant="outlined"
            size="small"
            class="product-manage-btn"
            @click="goToProductManagement"
          >
            <v-icon start size="16">mdi-package-variant</v-icon>
            <span class="btn-text">품목 관리</span>
          </v-btn>
          <v-btn icon size="large" class="back-btn" @click="goBack">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
      </div>
    </v-app-bar>

    <v-main class="main-content">
      <!-- 🌀 로딩 스피너 -->
      <div v-if="loading" class="loading-overlay">
        <div class="loading-container">
          <v-progress-circular
            indeterminate
            color="primary"
            size="64"
            width="6"
          />
          <div class="loading-text mt-4">데이터 로딩 중...</div>
        </div>
      </div>

      <v-container
        class="pa-6"
        style="padding-bottom: 120px !important; max-width: 1200px"
      >
        <!-- 📋 기본 정보 입력 카드 -->
        <v-card class="info-card mb-6" elevation="0">
          <div class="card-header">
            <div class="section-icon info">
              <v-icon color="white">mdi-information-outline</v-icon>
            </div>
            <h3 class="section-title">기본 정보</h3>
          </div>

          <div class="card-content">
            <v-row>
              <v-col cols="12" md="4">
                <div class="input-wrapper">
                  <v-text-field
                    v-model="form.title"
                    label="견적명"
                    variant="outlined"
                    density="comfortable"
                    class="modern-input"
                  />
                </div>
              </v-col>
              <v-col cols="12" md="4">
                <div class="input-wrapper">
                  <v-text-field
                    v-model="form.date"
                    label="견적일자"
                    type="date"
                    variant="outlined"
                    density="comfortable"
                    class="modern-input"
                  />
                </div>
              </v-col>
              <v-col cols="12" md="4">
                <div class="input-wrapper">
                  <v-text-field
                    v-model="form.client"
                    label="업체명"
                    variant="outlined"
                    density="comfortable"
                    class="modern-input"
                  />
                </div>
              </v-col>
            </v-row>
          </div>
        </v-card>

        <!-- 📦 품목 선택 카드 -->
        <v-card class="item-selection-card mb-6" elevation="0">
          <div class="card-header">
            <div class="section-icon items">
              <v-icon color="white">mdi-package-variant</v-icon>
            </div>
            <h3 class="section-title">품목 선택</h3>
          </div>

          <div class="card-content">
            <!-- 품목 선택 버튼들 -->
            <div class="product-buttons-grid mb-4">
              <v-btn
                v-for="(item, i) in productButtons"
                :key="i"
                class="product-btn"
                color="primary"
                variant="tonal"
                @click="selectPresetItem(item)"
              >
                {{ item.displayName }}
              </v-btn>
              <v-btn
                class="custom-item-btn"
                color="secondary"
                variant="outlined"
                @click="addCustomItem"
              >
                <v-icon start>mdi-plus</v-icon>
                기타
              </v-btn>
            </div>

            <!-- 선택된 품목 칩 -->
            <div v-if="form.items.length" class="selected-items-chips">
              <v-chip
                v-for="(item, i) in form.items"
                :key="i"
                class="ma-1"
                color="primary"
                variant="flat"
                size="small"
              >
                <v-icon start size="16">mdi-check</v-icon>
                {{ item.name
                }}<span v-if="item.spec"> - {{ item.spec }}</span> ×
                {{ item.qty }}
              </v-chip>
            </div>
          </div>
        </v-card>

        <!-- 📝 품목 상세 목록 -->
        <transition-group name="item-fade" tag="div">
          <div
            v-for="(item, i) in form.items"
            :key="'item-' + i"
            class="item-card-wrapper"
          >
            <v-card class="item-detail-card" elevation="0">
              <div class="item-header">
                <div class="item-number">
                  <v-icon size="20" class="mr-2">mdi-numeric</v-icon>
                  {{ i + 1 }}번 품목
                </div>
                <v-btn
                  icon
                  size="small"
                  color="error"
                  variant="tonal"
                  @click="removeItem(i)"
                >
                  <v-icon size="20">mdi-delete</v-icon>
                </v-btn>
              </div>

              <v-row dense class="mt-3">
                <v-col cols="12" sm="6" md="3">
                  <v-text-field
                    v-model="item.name"
                    label="품명"
                    variant="outlined"
                    density="compact"
                    class="modern-input"
                  />
                </v-col>
                <v-col cols="12" sm="6" md="3">
                  <v-text-field
                    v-model="item.spec"
                    label="규격"
                    variant="outlined"
                    density="compact"
                    class="modern-input"
                  />
                </v-col>
                <v-col cols="6" sm="3" md="2">
                  <v-text-field
                    v-model="item.qty"
                    type="number"
                    label="수량"
                    variant="outlined"
                    density="compact"
                    class="modern-input"
                    @input="updateItem(i)"
                  />
                </v-col>
                <v-col cols="6" sm="3" md="2">
                  <v-text-field
                    :model-value="format(item.unit)"
                    @update:model-value="onUnitInput($event, i)"
                    label="단가"
                    variant="outlined"
                    density="compact"
                    class="modern-input"
                  />
                </v-col>
                <v-col cols="12" md="2">
                  <v-text-field
                    v-model="item.note"
                    label="비고"
                    variant="outlined"
                    density="compact"
                    class="modern-input"
                  />
                </v-col>
              </v-row>

              <div class="item-summary">
                <div class="summary-item">
                  <span class="summary-label">공급가액</span>
                  <span class="summary-value">{{ format(item.supply) }}원</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">세액</span>
                  <span class="summary-value">{{ format(item.vat) }}원</span>
                </div>
              </div>
            </v-card>
          </div>
        </transition-group>

        <!-- 💰 합계 정보 카드 -->
        <v-card class="total-card" elevation="0">
          <div class="card-header">
            <div class="section-icon total">
              <v-icon color="white">mdi-calculator</v-icon>
            </div>
            <h3 class="section-title">합계 정보</h3>
          </div>

          <div class="card-content">
            <div class="vat-checkbox-wrapper">
              <v-checkbox
                v-model="includeVAT"
                label="부가세 포함"
                color="primary"
                @change="recalculateAll"
              />
            </div>

            <div class="total-grid">
              <div class="total-item">
                <div class="total-label">총 공급가액</div>
                <div class="total-value">{{ format(totalSupply) }}원</div>
              </div>
              <div class="total-item">
                <div class="total-label">총 부가세</div>
                <div class="total-value">{{ format(totalVAT) }}원</div>
              </div>
              <div class="total-item highlight">
                <div class="total-label">합계금액</div>
                <div class="total-value">{{ format(totalAmount) }}원</div>
              </div>
              <div class="total-item korean">
                <div class="total-label">한글표기</div>
                <div class="total-value">{{ totalKorean }}원</div>
              </div>
            </div>
          </div>
        </v-card>

        <!-- 📄 미리보기 카드 -->
        <v-card class="preview-card mb-6" elevation="0">
          <div class="card-header">
            <div class="section-icon preview">
              <v-icon color="white">mdi-eye</v-icon>
            </div>
            <h3 class="section-title">미리보기</h3>
            <v-spacer />
            <v-btn
              icon
              size="small"
              variant="tonal"
              @click="showPreview = !showPreview"
            >
              <v-icon>{{
                showPreview ? 'mdi-chevron-up' : 'mdi-chevron-down'
              }}</v-icon>
            </v-btn>
          </div>

          <v-expand-transition>
            <div v-show="showPreview" class="preview-wrapper">
              <div class="preview-content">
                <h1 class="preview-title">견&nbsp;적&nbsp;서</h1>

                <table class="preview-info-table">
                  <tbody>
                    <tr>
                      <th>견적명</th>
                      <td>{{ form.title || '-' }}</td>
                    </tr>
                    <tr>
                      <th>견적일자</th>
                      <td>{{ form.date || '-' }}</td>
                    </tr>
                    <tr>
                      <th>업체명</th>
                      <td>{{ form.client || '-' }}</td>
                    </tr>
                  </tbody>
                </table>

                <div class="preview-supplier-block">
                  <table class="preview-supplier-table">
                    <tbody>
                      <tr>
                        <th colspan="2">공급자</th>
                        <th>등록번호</th>
                        <td colspan="2">403-41-01157</td>
                      </tr>
                      <tr>
                        <th>상호</th>
                        <td>이안공조프러스</td>
                        <th>대표자</th>
                        <td colspan="2">
                          <div class="stamp-wrapper">
                            <span>배 규 석 (인)</span>
                            <img
                              src="@/assets/stamp.png"
                              class="stamp-image"
                              loading="lazy"
                            />
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <th>사업자주소</th>
                        <td colspan="4">
                          서울특별시 송파구 송파대로 201, B동 208-71호(문정동,
                          송파 테라타워2)
                        </td>
                      </tr>
                      <tr>
                        <th>업태</th>
                        <td>서비스</td>
                        <th>종목</th>
                        <td colspan="2">기계수리</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <table class="preview-item-table">
                  <thead>
                    <tr>
                      <th>품명</th>
                      <th>규격</th>
                      <th>수량</th>
                      <th>단가</th>
                      <th>공급가액</th>
                      <th>부가세</th>
                      <th>비고</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="form.items.length === 0">
                      <td
                        colspan="7"
                        style="text-align: center; padding: 20px; color: #999"
                      >
                        품목을 추가해주세요
                      </td>
                    </tr>
                    <tr v-for="(item, i) in form.items" :key="i">
                      <td>{{ item.name || '-' }}</td>
                      <td>{{ item.spec || '-' }}</td>
                      <td>{{ item.qty || 0 }}</td>
                      <td>{{ format(item.unit) || 0 }}</td>
                      <td>{{ format(item.supply) || 0 }}</td>
                      <td>{{ format(item.vat) || 0 }}</td>
                      <td>{{ item.note || '-' }}</td>
                    </tr>
                  </tbody>
                </table>

                <div class="preview-summary">
                  <div>
                    합계금액: {{ totalKorean || '영' }}원정 (₩{{
                      format(totalAmount) || 0
                    }}원)
                  </div>
                  <div>계좌번호: 1002-150-335422 (우리은행)</div>
                  <div>연락처: 010-4684-4794 / 담당자: 배규석</div>
                </div>
              </div>
            </div>
          </v-expand-transition>
        </v-card>

        <!-- 🎯 액션 버튼 영역 -->
        <div class="action-buttons-container">
          <v-btn
            color="primary"
            size="large"
            class="action-btn primary-btn"
            @click="generatePDF"
          >
            <v-icon start>mdi-file-pdf-box</v-icon>
            PDF 생성
          </v-btn>
          <v-btn
            color="secondary"
            size="large"
            class="action-btn"
            @click="downloadWithMarginImage"
          >
            <v-icon start>mdi-image</v-icon>
            이미지 생성
          </v-btn>
          <v-btn
            color="success"
            size="large"
            class="action-btn success-btn"
            @click="saveEstimateToDB"
          >
            <v-icon start>mdi-content-save</v-icon>
            견적 저장
          </v-btn>
        </div>

        <!-- PDF 미리보기 (숨김) -->
        <div
          id="pdf-preview"
          ref="pdfPreview"
          class="preview-box"
          style="position: absolute; left: -9999px"
        >
          <h1 class="title">견&nbsp;적&nbsp;서</h1>

          <table class="info-table">
            <tbody>
              <tr>
                <th>견적명</th>
                <td>{{ form.title }}</td>
              </tr>
              <tr>
                <th>견적일자</th>
                <td>{{ form.date }}</td>
              </tr>
              <tr>
                <th>업체명</th>
                <td>{{ form.client }}</td>
              </tr>
            </tbody>
          </table>

          <div class="supplier-block">
            <table class="supplier-table">
              <tbody>
                <tr>
                  <th colspan="2">공급자</th>
                  <th>등록번호</th>
                  <td colspan="2">403-41-01157</td>
                </tr>
                <tr>
                  <th>상호</th>
                  <td>이안공조프러스</td>
                  <th>대표자</th>
                  <td colspan="2">
                    <div class="stamp-wrapper">
                      <span>배 규 석 (인)</span>
                      <img
                        src="@/assets/stamp.png"
                        class="stamp-image"
                        loading="lazy"
                      />
                    </div>
                  </td>
                </tr>
                <tr>
                  <th>사업자주소</th>
                  <td colspan="4">
                    서울특별시 송파구 송파대로 201, B동 208-71호(문정동, 송파
                    테라타워2)
                  </td>
                </tr>
                <tr>
                  <th>업태</th>
                  <td>서비스</td>
                  <th>종목</th>
                  <td colspan="2">기계수리</td>
                </tr>
              </tbody>
            </table>
          </div>

          <table class="item-table">
            <thead>
              <tr>
                <th>품명</th>
                <th>규격</th>
                <th>수량</th>
                <th>단가</th>
                <th>공급가액</th>
                <th>부가세</th>
                <th>비고</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, i) in form.items" :key="i">
                <td>{{ item.name }}</td>
                <td>{{ item.spec }}</td>
                <td>{{ item.qty }}</td>
                <td>{{ format(item.unit) }}</td>
                <td>{{ format(item.supply) }}</td>
                <td>{{ format(item.vat) }}</td>
                <td>{{ item.note }}</td>
              </tr>
            </tbody>
          </table>

          <div class="summary">
            <div>
              합계금액: {{ totalKorean }}원정 (&#x20A9;{{
                format(totalAmount)
              }}원)
            </div>
            <div>계좌번호: 1002-150-335422 (우리은행)</div>
            <div>연락처: 010-4684-4794 / 담당자: 배규석</div>
          </div>
        </div>
      </v-container>
    </v-main>

    <!-- 문서 목록 다이얼로그 -->
    <v-dialog v-model="showDocumentList" max-width="800" scrollable>
      <v-card>
        <v-card-title class="document-dialog-header">
          <v-icon class="mr-2" color="primary"
            >mdi-file-document-multiple</v-icon
          >
          저장된 견적서 목록
          <v-spacer />
          <v-btn icon size="small" @click="showDocumentList = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-card-text class="pa-0">
          <!-- 로딩 상태 -->
          <div v-if="loadingDocuments" class="text-center pa-8">
            <v-progress-circular indeterminate color="primary" size="64" />
            <div class="mt-4 text-h6">문서 목록을 불러오는 중...</div>
          </div>

          <!-- 문서 목록 -->
          <div v-else-if="documents.length" class="document-list">
            <div v-for="doc in documents" :key="doc.id" class="document-item">
              <div class="document-info">
                <div class="document-header">
                  <h4 class="document-title">{{ doc.title || '제목 없음' }}</h4>
                  <v-chip
                    :color="getActionColor(doc.actionType)"
                    size="small"
                    variant="flat"
                  >
                    <v-icon start size="14">{{
                      getActionIcon(doc.actionType)
                    }}</v-icon>
                    {{ getActionLabel(doc.actionType) }}
                  </v-chip>
                </div>

                <div class="document-details">
                  <div class="detail-row">
                    <v-icon size="16" class="mr-2">mdi-domain</v-icon>
                    <span>{{ doc.client || '업체명 없음' }}</span>
                  </div>
                  <div class="detail-row">
                    <v-icon size="16" class="mr-2">mdi-calendar</v-icon>
                    <span>{{ doc.date }}</span>
                  </div>
                  <div class="detail-row">
                    <v-icon size="16" class="mr-2">mdi-currency-krw</v-icon>
                    <span>{{ formatPrice(doc.totalAmount) }}원</span>
                  </div>
                  <div class="detail-row">
                    <v-icon size="16" class="mr-2">mdi-clock</v-icon>
                    <span>{{ formatDateTime(doc.createdAt) }}</span>
                  </div>
                  <div
                    class="detail-row items-row"
                    v-if="doc.items && doc.items.length"
                  >
                    <v-icon size="16" class="mr-2">mdi-package-variant</v-icon>
                    <div class="items-list">
                      <span
                        v-for="(item, index) in doc.items.slice(0, 4)"
                        :key="index"
                        class="item-chip"
                      >
                        {{ item.name }}{{ item.qty ? ` (${item.qty})` : '' }}
                      </span>
                      <span v-if="doc.items.length > 4" class="more-items">
                        +{{ doc.items.length - 4 }}개 더
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="document-actions">
                <v-btn
                  size="small"
                  color="primary"
                  variant="outlined"
                  @click="loadDocumentData(doc)"
                  class="mr-2"
                >
                  <v-icon start size="16">mdi-eye</v-icon>
                  불러오기
                </v-btn>
                <v-btn
                  size="small"
                  color="error"
                  variant="outlined"
                  @click="confirmDeleteDocument(doc)"
                >
                  <v-icon size="16">mdi-delete</v-icon>
                </v-btn>
              </div>
            </div>
          </div>

          <!-- 빈 상태 -->
          <div v-else class="empty-documents">
            <v-icon size="64" color="grey-lighten-1"
              >mdi-file-document-outline</v-icon
            >
            <h4 class="mt-4">저장된 견적서가 없습니다</h4>
            <p class="text-grey">견적서를 작성하고 저장해보세요!</p>
          </div>
        </v-card-text>

        <v-card-actions class="justify-end pa-4">
          <v-btn @click="loadDocuments">
            <v-icon start>mdi-refresh</v-icon>
            새로고침
          </v-btn>
          <v-btn @click="showDocumentList = false"> 닫기 </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 문서 삭제 확인 다이얼로그 -->
    <v-dialog v-model="showDeleteDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h6">
          <v-icon color="error" class="mr-2">mdi-alert-circle</v-icon>
          문서 삭제 확인
        </v-card-title>
        <v-card-text>
          <strong>{{ documentToDelete?.title || '제목 없음' }}</strong> 문서를
          삭제하시겠습니까? <br />삭제된 문서는 복구할 수 없습니다.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showDeleteDialog = false"> 취소 </v-btn>
          <v-btn color="error" @click="deleteDocument"> 삭제 </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { db } from '@/firebase/config'
import { getTodayDateKST } from '@/utils/date.js'
import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  doc,
  query,
  where,
  orderBy,
} from 'firebase/firestore'
import { convertToKoreanMoney } from '@/utils/money'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { useUiStore } from '@/stores/ui'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const loading = ref(false)
const showPreview = ref(true) // 미리보기 기본적으로 표시

const uiStore = useUiStore()
const userStore = useUserStore()

const form = reactive({
  title: '',
  date: getTodayDateKST(),
  client: '',
  items: [],
})

const productOptions = ref([])
const productButtons = ref([])
const selectedItemIndex = ref(null)
const includeVAT = ref(true)

// 문서 목록 관련
const showDocumentList = ref(false)
const documents = ref([])
const loadingDocuments = ref(false)
const showDeleteDialog = ref(false)
const documentToDelete = ref(null)
const totalSupply = ref(0)
const totalVAT = ref(0)
const totalAmount = ref(0)
const totalKorean = ref('')
const pdfPreview = ref(null)

function format(n) {
  if (!n && n !== 0) return ''
  return Number(n).toLocaleString()
}

function parseNumberInput(value) {
  if (typeof value === 'string') {
    const cleaned = value.replaceAll(',', '')
    const num = parseFloat(cleaned)
    return isNaN(num) ? 0 : num
  }
  return value
}

function onUnitInput(val, i) {
  form.items[i].unit = parseNumberInput(val)
  updateItem(i)
}

function addItem() {
  form.items.push({
    name: '',
    spec: '',
    qty: 1,
    unit: 0,
    supply: 0,
    vat: 0,
    note: '',
  })
}

function removeItem(i) {
  form.items.splice(i, 1)
  recalculateAll()
}

function updateItem(i) {
  const item = form.items[i]
  item.qty = parseNumberInput(item.qty)
  item.unit = parseNumberInput(item.unit)
  item.supply = item.qty * item.unit
  item.vat = includeVAT.value ? Math.round(item.supply * 0.1) : 0
  recalculateAll()
}

function recalculateAll() {
  totalSupply.value = 0
  totalVAT.value = 0
  form.items.forEach((item, i) => {
    item.supply = item.qty * item.unit
    item.vat = includeVAT.value ? Math.round(item.supply * 0.1) : 0
    totalSupply.value += item.supply
    totalVAT.value += item.vat
  })
  totalAmount.value = totalSupply.value + totalVAT.value
  totalKorean.value = convertToKoreanMoney(totalAmount.value)
}

function selectPresetItem(product) {
  const name = product.name.trim()
  const spec = (product.spec || '').trim()

  const existing = form.items.find(
    (item) => item.name === name && (item.spec || '').trim() === spec
  )

  if (existing) {
    existing.qty += 1
    updateItem(form.items.indexOf(existing))
  } else {
    form.items.push({
      name,
      spec,
      qty: 1,
      unit: product.price,
      supply: 0,
      vat: 0,
      note: '',
    })
    recalculateAll()
  }
}

function addCustomItem() {
  addItem()
}

function processProductButtons() {
  const seen = new Set()
  productButtons.value = productOptions.value
    .filter((p) => {
      const specTrimmed = (p.spec || '').trim()
      const key = specTrimmed ? `${p.name}-${specTrimmed}` : p.name
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .map((p) => {
      const specTrimmed = (p.spec || '').trim()
      const displayName = specTrimmed ? `${p.name} - ${specTrimmed}` : p.name
      return {
        ...p,
        displayName,
      }
    })
}

async function generatePDF() {
  loading.value = true
  try {
    const previewEl = pdfPreview.value

    const canvas = await html2canvas(previewEl, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    })

    const imgData = canvas.toDataURL('image/jpeg', 0.85)

    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const margin = 10
    const contentWidth = pageWidth - margin * 2
    const imageHeight = (canvas.height * contentWidth) / canvas.width

    pdf.addImage(imgData, 'JPEG', margin, margin, contentWidth, imageHeight)
    const fileName = `${form.client}_${form.date}.pdf`
    pdf.save(fileName)

    // 데이터베이스에 문서 정보 저장
    await saveDocumentToDB('pdf', 'pdf')
  } catch (err) {
    console.error('PDF 생성 실패:', err)
    alert('PDF 생성 중 오류가 발생했습니다.')
  } finally {
    loading.value = false
  }
}

async function downloadWithMarginImage() {
  loading.value = true
  try {
    const previewEl = pdfPreview.value
    const scale = 2

    const originalCanvas = await html2canvas(previewEl, {
      scale,
      useCORS: true,
      backgroundColor: '#fff',
    })

    const margin = 76
    const canvasWithMargin = document.createElement('canvas')
    canvasWithMargin.width = originalCanvas.width + margin * 2
    canvasWithMargin.height = originalCanvas.height + margin * 2

    const ctx = canvasWithMargin.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvasWithMargin.width, canvasWithMargin.height)
    ctx.drawImage(originalCanvas, margin, margin)

    const finalImg = canvasWithMargin.toDataURL('image/jpeg', 1.0)
    const link = document.createElement('a')
    link.href = finalImg
    const fileName = `${form.client}_${form.date}_견적서.jpg`
    link.download = fileName
    link.click()

    // 데이터베이스에 문서 정보 저장
    await saveDocumentToDB('image', 'jpeg')
  } catch (err) {
    console.error('이미지 생성 실패:', err)
    alert('이미지 생성 중 오류가 발생했습니다.')
  } finally {
    loading.value = false
  }
}

async function loadProducts() {
  try {
    const authResult = await userStore.executeWithAuth(async () => {
      return await getDocs(collection(db, 'products'))
    }, router)

    if (!authResult.success) {
      if (authResult.shouldRedirect) return
      throw new Error(authResult.error || '인증에 실패했습니다.')
    }

    const snap = authResult.data
    productOptions.value = snap.docs.map((doc) => doc.data())
    processProductButtons()
  } catch (err) {
    console.error('제품 로딩 실패:', err)
  }
}

// 공통 문서 저장 함수
async function saveDocumentToDB(actionType = 'save', fileFormat = null) {
  try {
    console.log('문서 저장 시작:', actionType, fileFormat)
    console.log('userStore.userId:', userStore.userId)

    if (!userStore.userId) {
      throw new Error('사용자 ID가 없습니다.')
    }

    const payload = {
      documentType: 'estimate',
      title: form.title || '',
      date: form.date || '',
      client: form.client || '',
      items: form.items || [],
      totalSupply: totalSupply.value || 0,
      totalVAT: totalVAT.value || 0,
      totalAmount: totalAmount.value || 0,
      totalKorean: totalKorean.value || '',
      includeVAT: includeVAT.value ?? true,
      actionType: actionType || 'save',
      fileFormat: fileFormat || null,
      fileName: fileFormat
        ? `${form.client || 'unnamed'}_${form.date || 'nodate'}.${fileFormat}`
        : null,
      createdAt: serverTimestamp(),
      createdBy: userStore.userId,
    }

    console.log('저장할 데이터:', payload)

    const authResult = await userStore.executeWithAuth(async () => {
      return await addDoc(collection(db, 'documents'), payload)
    }, router)

    if (!authResult.success) {
      if (authResult.shouldRedirect) return false
      throw new Error(authResult.error || '문서 저장에 실패했습니다.')
    }

    console.log('문서 저장 성공:', authResult.data.id)
    return true
  } catch (err) {
    console.error('문서 저장 실패:', err)
    return false
  }
}

async function saveEstimateToDB() {
  loading.value = true
  try {
    const saved = await saveDocumentToDB('save')
    if (saved) {
      alert('견적서가 저장되었습니다')
    } else {
      throw new Error('문서 저장 실패')
    }
  } catch (err) {
    console.error('견적서 저장 실패:', err)
    uiStore.showSnackbar('견적서 저장 중 오류가 발생했습니다.', 'error')
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.back()
}

const goToProductManagement = () => {
  router.push('/product-management')
}

// 문서 목록 관련 함수들
const loadDocuments = async () => {
  loadingDocuments.value = true
  try {
    console.log('문서 목록 로딩 시작, userId:', userStore.userId)

    if (!userStore.userId) {
      throw new Error('사용자 ID가 없습니다.')
    }

    const authResult = await userStore.executeWithAuth(async () => {
      const q = query(
        collection(db, 'documents'),
        where('createdBy', '==', userStore.userId)
      )
      return await getDocs(q)
    }, router)

    if (!authResult.success) {
      if (authResult.shouldRedirect) return
      throw new Error(authResult.error || '문서 목록 조회에 실패했습니다.')
    }

    const snap = authResult.data
    console.log('쿼리 결과:', snap.size, '개 문서 발견')

    const allDocs = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    console.log('모든 문서:', allDocs)

    documents.value = allDocs
      .filter((doc) => doc.documentType === 'estimate')
      .sort((a, b) => {
        // createdAt이 Firebase Timestamp인 경우를 처리
        const aTime = a.createdAt?.toDate
          ? a.createdAt.toDate()
          : new Date(a.createdAt || 0)
        const bTime = b.createdAt?.toDate
          ? b.createdAt.toDate()
          : new Date(b.createdAt || 0)
        return bTime - aTime // 최신순 정렬
      })

    console.log('필터링된 견적서 문서:', documents.value.length, '개')
  } catch (err) {
    console.error('문서 목록 로딩 오류:', err)
    uiStore.showSnackbar('문서 목록을 불러오는데 실패했습니다.', 'error')
  } finally {
    loadingDocuments.value = false
  }
}

const loadDocumentData = (doc) => {
  // 문서 데이터를 폼에 로드
  form.title = doc.title || ''
  form.date = doc.date || ''
  form.client = doc.client || ''
  form.items = doc.items || []
  includeVAT.value = doc.includeVAT ?? true

  // 다이얼로그 닫기
  showDocumentList.value = false

  uiStore.showSnackbar('문서 데이터를 불러왔습니다.', 'success')
}

const confirmDeleteDocument = (doc) => {
  documentToDelete.value = doc
  showDeleteDialog.value = true
}

const deleteDocument = async () => {
  if (!documentToDelete.value) return

  try {
    const authResult = await userStore.executeWithAuth(async () => {
      const { deleteDoc, doc } = await import('firebase/firestore')
      return await deleteDoc(doc(db, 'documents', documentToDelete.value.id))
    }, router)

    if (!authResult.success) {
      if (authResult.shouldRedirect) return
      throw new Error(authResult.error || '문서 삭제에 실패했습니다.')
    }

    uiStore.showSnackbar('문서가 삭제되었습니다.', 'success')

    // 문서 목록에서 제거
    documents.value = documents.value.filter(
      (doc) => doc.id !== documentToDelete.value.id
    )

    // 다이얼로그 닫기
    showDeleteDialog.value = false
    documentToDelete.value = null
  } catch (err) {
    console.error('문서 삭제 실패:', err)
    uiStore.showSnackbar('문서 삭제 중 오류가 발생했습니다.', 'error')
  }
}

const getActionColor = (actionType) => {
  switch (actionType) {
    case 'save':
      return 'success'
    case 'pdf':
      return 'error'
    case 'image':
      return 'warning'
    default:
      return 'grey'
  }
}

const getActionIcon = (actionType) => {
  switch (actionType) {
    case 'save':
      return 'mdi-content-save'
    case 'pdf':
      return 'mdi-file-pdf-box'
    case 'image':
      return 'mdi-image'
    default:
      return 'mdi-file'
  }
}

const getActionLabel = (actionType) => {
  switch (actionType) {
    case 'save':
      return '저장'
    case 'pdf':
      return 'PDF'
    case 'image':
      return '이미지'
    default:
      return '알 수 없음'
  }
}

const formatPrice = (price) => {
  return new Intl.NumberFormat('ko-KR').format(price || 0)
}

const formatDateTime = (timestamp) => {
  if (!timestamp) return ''
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 문서 목록 다이얼로그가 열릴 때 데이터 로드
watch(showDocumentList, (newValue) => {
  if (newValue) {
    loadDocuments()
  }
})

onMounted(async () => {
  const authResult = await userStore.initializeAuth(router)
  if (!authResult.success) {
    if (authResult.shouldRedirect) return
    console.error('인증 초기화 실패:', authResult.error)
    return
  }

  await loadProducts()
})
</script>

<style scoped>
/* 🎨 헤더 스타일 - :deep() 선택자 사용하여 v-app-bar에 적용 */
:deep(.custom-header) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
}

.header-title {
  color: white;
  font-weight: 700;
  font-size: 24px;
  margin: 0;
}

.header-subtitle {
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
  font-weight: 500;
}

.back-btn {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 12px;
}
.back-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.product-manage-btn {
  background: rgba(255, 255, 255, 0.15) !important;
  color: white !important;
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
  border-radius: 12px !important;
  backdrop-filter: blur(10px);
}
.product-manage-btn:hover {
  background: rgba(255, 255, 255, 0.25) !important;
  border-color: rgba(255, 255, 255, 0.4) !important;
}

.document-list-btn {
  background: rgba(255, 255, 255, 0.15) !important;
  color: white !important;
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
  border-radius: 12px !important;
  backdrop-filter: blur(10px);
}
.document-list-btn:hover {
  background: rgba(255, 255, 255, 0.25) !important;
  border-color: rgba(255, 255, 255, 0.4) !important;
}

/* 🌀 로딩 오버레이 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-container {
  text-align: center;
}

.loading-text {
  font-weight: 600;
  color: #666;
  font-size: 16px;
}

/* 📋 메인 컨텐츠 */
.main-content {
  background: linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%);
  min-height: 100vh;
}

/* 카드 공통 스타일 */
.info-card,
.item-selection-card,
.total-card,
.preview-card {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.card-header {
  display: flex;
  align-items: center;
  padding: 20px 24px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.card-content {
  padding: 24px;
}

.section-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.section-icon.info {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.section-icon.items {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
}

.section-icon.total {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.section-icon.preview {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.section-title {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

/* 입력 필드 스타일 */
.input-wrapper {
  position: relative;
}

.modern-input {
  border-radius: 12px;
}

.modern-input :deep(.v-field) {
  border-radius: 12px;
  background: #f8fafc;
  transition: all 0.3s ease;
}

.modern-input :deep(.v-field:hover) {
  background: #f1f5f9;
}

.modern-input :deep(.v-field--focused) {
  background: white;
  box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
}

/* 품목 선택 버튼 그리드 */
.product-buttons-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
}

/* 품목 선택 버튼 */
.product-btn {
  min-width: 120px;
  height: 44px;
  border-radius: 12px;
  font-weight: 600;
  text-transform: none;
  transition: all 0.3s ease;
}

.product-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
}

.custom-item-btn {
  height: 44px;
  border-radius: 12px;
  font-weight: 600;
  text-transform: none;
  min-width: 100px;
}

.selected-items-chips {
  padding: 12px;
  background: #f8fafc;
  border-radius: 12px;
  margin-top: 16px;
}

/* 품목 상세 카드 */
.item-card-wrapper {
  margin-bottom: 16px;
}

.item-detail-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
}

.item-detail-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 1px solid #f1f5f9;
}

.item-number {
  display: flex;
  align-items: center;
  font-weight: 600;
  color: #475569;
  font-size: 16px;
}

.item-summary {
  display: flex;
  gap: 24px;
  margin-top: 16px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-label {
  font-size: 12px;
  color: #64748b;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.summary-value {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
}

/* 애니메이션 */
.item-fade-enter-active {
  transition: all 0.4s ease;
}

.item-fade-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.item-fade-leave-active {
  transition: all 0.3s ease;
}

.item-fade-leave-to {
  opacity: 0;
  transform: translateX(-20px) scale(0.95);
}

/* 합계 정보 */
.vat-checkbox-wrapper {
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
  margin-bottom: 24px;
}

.total-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.total-item {
  padding: 20px;
  background: #f8fafc;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.total-item:hover {
  background: #e2e8f0;
  transform: translateY(-2px);
}

.total-item.highlight {
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  color: white;
}

.total-item.highlight .total-label,
.total-item.highlight .total-value {
  color: white;
}

.total-item.korean {
  grid-column: 1 / -1;
  background: #fef3c7;
  border: 1px solid #fbbf24;
}

.total-label {
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.total-value {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
}

/* 액션 버튼 */
.action-buttons-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid #e2e8f0;
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.1);
  padding: 20px;
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.action-btn {
  min-width: 160px;
  height: 52px;
  border-radius: 12px;
  font-weight: 600;
  text-transform: none;
  font-size: 16px;
  transition: all 0.3s ease;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.primary-btn {
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  color: white;
  box-shadow: 0 4px 16px rgba(79, 70, 229, 0.3);
}

.primary-btn:hover {
  box-shadow: 0 6px 20px rgba(79, 70, 229, 0.4);
}

.success-btn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
}

/* 반응형 품목 버튼 그리드 */
@media (max-width: 768px) {
  .product-buttons-grid {
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 8px;
  }

  .product-btn {
    min-width: 100px;
    height: 40px;
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .product-buttons-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .product-btn {
    min-width: auto;
    height: 36px;
    font-size: 12px;
  }
}

/* 문서 목록 스타일 */
.document-item {
  display: flex;
  align-items: flex-start;
  padding: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  margin-bottom: 12px;
  background: white;
  transition: all 0.2s ease;
}

.document-item:hover {
  border-color: #cbd5e1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.document-info {
  flex: 1;
}

.document-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.document-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.document-details {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.detail-row {
  display: flex;
  align-items: center;
  font-size: 13px;
  color: #64748b;
}

.items-row {
  align-items: flex-start;
}

.items-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  flex: 1;
}

.item-chip {
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  color: #475569;
  white-space: nowrap;
}

.more-items {
  background: #e2e8f0;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  color: #64748b;
  font-style: italic;
}

.document-actions {
  margin-left: 16px;
}

/* 헤더 모바일 최적화 */
@media (max-width: 768px) {
  .header-content {
    padding: 0 16px !important;
  }

  .header-right {
    gap: 6px;
  }

  .document-list-btn,
  .product-manage-btn {
    min-width: auto;
    padding: 0 8px;
  }

  .btn-text {
    font-size: 10px;
  }

  .header-title {
    font-size: 20px;
  }

  .header-subtitle {
    font-size: 11px;
  }

  .header-icon-wrapper {
    width: 40px;
    height: 40px;
  }

  .header-icon-wrapper v-icon {
    font-size: 24px;
  }
}

@media (max-width: 480px) {
  .header-content {
    padding: 0 12px !important;
  }

  .header-left {
    min-width: 0;
    flex-shrink: 1;
  }

  .header-text {
    margin-left: 8px !important;
    min-width: 0;
  }

  .header-title {
    font-size: 16px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .header-subtitle {
    display: none;
  }

  .header-right {
    gap: 4px;
    flex-shrink: 0;
  }

  .document-list-btn,
  .product-manage-btn {
    min-width: 60px;
    padding: 0 4px;
  }
  
  .btn-text {
    font-size: 9px;
  }

  .back-btn {
    min-width: 40px;
    width: 40px;
  }

  .header-icon-wrapper {
    width: 36px;
    height: 36px;
  }
}

/* 모바일 대응 */
@media (max-width: 600px) {
  .card-header {
    padding: 16px 20px;
  }

  .card-content {
    padding: 16px;
  }

  .section-icon {
    width: 36px;
    height: 36px;
  }

  .section-title {
    font-size: 18px;
  }

  .item-detail-card {
    padding: 16px;
  }

  .item-summary {
    flex-direction: column;
    gap: 12px;
  }

  .total-grid {
    grid-template-columns: 1fr;
  }

  .action-buttons-container {
    padding: 16px;
    gap: 8px;
    flex-wrap: nowrap;
    overflow-x: auto;
  }

  .action-btn {
    min-width: 100px;
    height: 48px;
    font-size: 13px;
    flex-shrink: 0;
  }

  .total-value {
    font-size: 20px;
  }
}

/* PDF 미리보기 스타일 (기존 유지) */
.preview-box {
  width: 794px;
  min-height: 1123px;
  margin: 32px auto;
  padding: 38px;
  background: white;
  box-sizing: border-box;
  border: 1px solid #888;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.15);
  font-size: 12px;
  color: black;
}

.title {
  font-size: 20px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 16px;
}

.info-table,
.supplier-table,
.item-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 16px;
}

.info-table th,
.supplier-table th,
.item-table th,
.info-table td,
.supplier-table td,
.item-table td {
  border: 1px solid #444;
  padding: 4px 8px;
  text-align: left;
}

.stamp-wrapper {
  position: relative;
  display: inline-block;
}

.stamp-image {
  position: absolute;
  top: -15px;
  right: -18px;
  height: 50px;
  width: 50px;
  pointer-events: none;
}

.summary {
  margin-top: 20px;
  font-weight: bold;
  font-size: 13px;
}

/* 미리보기 스타일 */
/* 미리보기 스타일 */
.preview-wrapper {
  padding: 24px;
  background: #f8fafc;
  overflow-x: auto; /* 핵심: 내용이 넘칠 경우 가로 스크롤 생성 */
}

.preview-content {
  min-width: 700px; /* 최소 너비를 지정하여 모바일에서 표가 깨지는 것을 방지 */
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
}

.preview-title {
  font-size: 24px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 24px;
  color: #1e293b;
}

.preview-info-table,
.preview-supplier-table,
.preview-item-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
  font-size: 14px;
}

.preview-info-table th,
.preview-supplier-table th,
.preview-item-table th,
.preview-info-table td,
.preview-supplier-table td,
.preview-item-table td {
  border: 1px solid #cbd5e1;
  padding: 8px 12px;
  text-align: left;
}

.preview-info-table th,
.preview-supplier-table th,
.preview-item-table th {
  background: #f1f5f9;
  font-weight: 600;
  color: #475569;
}

.preview-summary {
  margin-top: 24px;
  padding: 20px;
  background: #f8fafc;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  line-height: 1.8;
  color: #1e293b;
}

@media (max-width: 600px) {
  .preview-content {
    padding: 20px;
  }

  .preview-title {
    font-size: 20px;
  }

  .preview-info-table,
  .preview-supplier-table,
  .preview-item-table {
    font-size: 12px;
  }

  .preview-info-table th,
  .preview-supplier-table th,
  .preview-item-table th,
  .preview-info-table td,
  .preview-supplier-table td,
  .preview-item-table td {
    padding: 6px 8px;
  }
}

/* 문서 목록 다이얼로그 스타일 */
.document-dialog-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white !important;
  font-weight: 700;
}

.document-list {
  max-height: 500px;
  overflow-y: auto;
}

.document-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e2e8f0;
  transition: background-color 0.2s ease;
}

.document-item:hover {
  background: #f8fafc;
}

.document-item:last-child {
  border-bottom: none;
}

.document-info {
  flex: 1;
}

.document-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.document-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.document-details {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.detail-row {
  display: flex;
  align-items: center;
  font-size: 13px;
  color: #64748b;
}

.items-row {
  align-items: flex-start;
}

.items-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  flex: 1;
}

.item-chip {
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  color: #475569;
  white-space: nowrap;
}

.more-items {
  background: #e2e8f0;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  color: #64748b;
  font-style: italic;
}

.document-actions {
  margin-left: 16px;
}

.empty-documents {
  text-align: center;
  padding: 60px 20px;
  color: #64748b;
}

/* 문서 목록 다이얼로그 모바일 최적화 */
@media (max-width: 768px) {
  .document-list {
    max-height: 400px;
  }

  .document-item {
    padding: 12px 16px;
  }

  .document-title {
    font-size: 14px;
  }

  .detail-row {
    font-size: 12px;
  }

  .item-chip {
    font-size: 10px;
    padding: 1px 4px;
  }

  .more-items {
    font-size: 10px;
    padding: 1px 4px;
  }
}

@media (max-width: 600px) {
  .document-details {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .document-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    padding: 12px 16px;
  }

  .document-header {
    width: 100%;
    margin-bottom: 6px;
  }

  .document-title {
    font-size: 14px;
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .document-actions {
    margin-left: 0;
    width: 100%;
    display: flex;
    gap: 8px;
  }

  .document-actions .v-btn {
    flex: 1;
    min-width: 0;
    font-size: 12px;
    height: 32px;
  }

  .items-row {
    grid-column: 1 / -1;
  }

  .items-list {
    gap: 2px;
  }
}

@media (max-width: 480px) {
  .document-item {
    padding: 10px 12px;
  }

  .document-title {
    font-size: 13px;
    max-width: 150px;
  }

  .detail-row {
    font-size: 11px;
  }

  .document-actions .v-btn {
    font-size: 11px;
    height: 28px;
    padding: 0 8px;
  }
}
</style>
