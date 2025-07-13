<template>
  <v-app>
    <!-- 🎨 현대적인 그라데이션 헤더 -->
    <v-app-bar 
      :elevation="0" 
      class="custom-header"
      height="80"
    >
      <div class="d-flex align-center justify-space-between w-100 px-4">
        <div class="d-flex align-center">
          <div class="header-icon-wrapper">
            <v-icon size="32" color="white">mdi-file-document-outline</v-icon>
          </div>
          <div class="ml-3">
            <h2 class="header-title">견적서 작성</h2>
            <div class="header-subtitle">스마트 문서 관리</div>
          </div>
        </div>
        
        <v-btn 
          icon 
          size="large"
          class="back-btn"
          @click="goBack"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
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

      <v-container class="pa-6" style="padding-bottom: 120px !important; max-width: 1200px;">
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
            <v-slide-group show-arrows class="mb-4" v-model="selectedItemIndex">
              <v-slide-item v-for="(item, i) in productButtons" :key="i">
                <v-btn 
                  class="product-btn ma-1" 
                  color="primary" 
                  variant="tonal" 
                  @click="selectPresetItem(item)"
                >
                  {{ item.displayName }}
                </v-btn>
              </v-slide-item>
              <v-slide-item>
                <v-btn 
                  class="custom-item-btn ma-1" 
                  color="secondary" 
                  variant="outlined" 
                  @click="addCustomItem"
                >
                  <v-icon start>mdi-plus</v-icon>
                  기타
                </v-btn>
              </v-slide-item>
            </v-slide-group>

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
                {{ item.name }}<span v-if="item.spec"> - {{ item.spec }}</span> × {{ item.qty }}
              </v-chip>
            </div>
          </div>
        </v-card>

        <!-- 📝 품목 상세 목록 -->
        <transition-group name="item-fade" tag="div">
          <div v-for="(item, i) in form.items" :key="'item-' + i" class="item-card-wrapper">
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
              <v-icon>{{ showPreview ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
            </v-btn>
          </div>
          
          <v-expand-transition>
            <div v-show="showPreview" class="preview-wrapper">
              <div class="preview-content">
                <h1 class="preview-title">견&nbsp;적&nbsp;서</h1>

                <table class="preview-info-table">
                  <tbody>
                    <tr><th>견적명</th><td>{{ form.title || '-' }}</td></tr>
                    <tr><th>견적일자</th><td>{{ form.date || '-' }}</td></tr>
                    <tr><th>업체명</th><td>{{ form.client || '-' }}</td></tr>
                  </tbody>
                </table>

                <div class="preview-supplier-block">
                  <table class="preview-supplier-table">
                    <tbody>
                      <tr><th colspan="2">공급자</th><th>등록번호</th><td colspan="2">403-41-01157</td></tr>
                      <tr>
                        <th>상호</th><td>이안공조프러스</td>
                        <th>대표자</th>
                        <td colspan="2">
                          <div class="stamp-wrapper">
                            <span>배 규 석 (인)</span>
                            <img src="/stamp.png" class="stamp-image" />
                          </div>
                        </td>
                      </tr>
                      <tr><th>사업자주소</th><td colspan="4">서울특별시 송파구 송파대로 201, B동 208-71호(문정동, 송파 테라타워2)</td></tr>
                      <tr><th>업태</th><td>서비스</td><th>종목</th><td colspan="2">기계수리</td></tr>
                    </tbody>
                  </table>
                </div>

                <table class="preview-item-table">
                  <thead>
                    <tr><th>품명</th><th>규격</th><th>수량</th><th>단가</th><th>공급가액</th><th>부가세</th><th>비고</th></tr>
                  </thead>
                  <tbody>
                    <tr v-if="form.items.length === 0">
                      <td colspan="7" style="text-align: center; padding: 20px; color: #999;">
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
                  <div>합계금액: {{ totalKorean || '영' }}원정 (₩{{ format(totalAmount) || 0 }}원)</div>
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
            color="info" 
            size="large"
            class="action-btn"
            @click="saveProductToDB"
          >
            <v-icon start>mdi-package-variant-closed</v-icon>
            품목 저장
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
        <div id="pdf-preview" ref="pdfPreview" class="preview-box" style="position: absolute; left: -9999px;">
          <h1 class="title">견&nbsp;적&nbsp;서</h1>

          <table class="info-table">
            <tbody>
              <tr><th>견적명</th><td>{{ form.title }}</td></tr>
              <tr><th>견적일자</th><td>{{ form.date }}</td></tr>
              <tr><th>업체명</th><td>{{ form.client }}</td></tr>
            </tbody>
          </table>

          <div class="supplier-block">
            <table class="supplier-table">
              <tbody>
                <tr><th colspan="2">공급자</th><th>등록번호</th><td colspan="2">403-41-01157</td></tr>
                <tr>
                  <th>상호</th><td>이안공조프러스</td>
                  <th>대표자</th>
                  <td colspan="2">
                    <div class="stamp-wrapper">
                      <span>배 규 석 (인)</span>
                      <img src="/stamp.png" class="stamp-image" />
                    </div>
                  </td>
                </tr>
                <tr><th>사업자주소</th><td colspan="4">서울특별시 송파구 송파대로 201, B동 208-71호(문정동, 송파 테라타워2)</td></tr>
                <tr><th>업태</th><td>서비스</td><th>종목</th><td colspan="2">기계수리</td></tr>
              </tbody>
            </table>
          </div>

          <table class="item-table">
            <thead>
              <tr><th>품명</th><th>규격</th><th>수량</th><th>단가</th><th>공급가액</th><th>부가세</th><th>비고</th></tr>
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
            <div>합계금액: {{ totalKorean }}원정 (&#x20A9;{{ format(totalAmount) }}원)</div>
            <div>계좌번호: 1002-150-335422 (우리은행)</div>
            <div>연락처: 010-4684-4794 / 담당자: 배규석</div>
          </div>
        </div>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { db } from '@/firebase/config'
import { collection, addDoc, getDocs, serverTimestamp, setDoc, doc } from 'firebase/firestore'
import { convertToKoreanMoney } from '@/utils/money'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

const router = useRouter()
const loading = ref(false)
const showPreview = ref(true) // 미리보기 기본적으로 표시

const form = reactive({
  title: '',
  date: getTodayKST(),
  client: '',
  items: []
})

function getTodayKST() {
  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
  return now.toISOString().substring(0, 10)
}

const productOptions = ref([])
const productButtons = ref([])
const selectedItemIndex = ref(null)
const includeVAT = ref(true)
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
  form.items.push({ name: '', spec: '', qty: 1, unit: 0, supply: 0, vat: 0, note: '' })
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
    item => item.name === name && (item.spec || '').trim() === spec
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
      note: ''
    })
    recalculateAll()
  }
}

function addCustomItem() {
  addItem()
}

function processProductButtons() {
  const seen = new Set()
  productButtons.value = productOptions.value.filter(p => {
    const specTrimmed = (p.spec || '').trim()
    const key = specTrimmed ? `${p.name}-${specTrimmed}` : p.name
    if (seen.has(key)) return false
    seen.add(key)
    return true
  }).map(p => {
    const specTrimmed = (p.spec || '').trim()
    const displayName = specTrimmed ? `${p.name} - ${specTrimmed}` : p.name
    return {
      ...p,
      displayName
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
    pdf.save(`${form.client}_${form.date}.pdf`)
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
      backgroundColor: '#fff'
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
    link.download = `${form.client}_${form.date}_견적서.jpg`
    link.click()
  } catch (err) {
    console.error('이미지 생성 실패:', err)
    alert('이미지 생성 중 오류가 발생했습니다.')
  } finally {
    loading.value = false
  }
}

async function loadProducts() {
  try {
    const snap = await getDocs(collection(db, 'products'))
    productOptions.value = snap.docs.map(doc => doc.data())
    processProductButtons()
  } catch (err) {
    console.error('제품 로딩 실패:', err)
  }
}

async function saveProductToDB() {
  loading.value = true
  try {
    const existing = new Map()

    const snap = await getDocs(collection(db, 'products'))
    snap.forEach(doc => {
      const data = doc.data()
      const key = `${data.name}-${(data.spec || '').trim()}`
      existing.set(key, { ...data, id: doc.id })
    })

    const toSave = form.items.filter(i => {
      const name = (i.name || '').trim()
      return name !== ''
    })

    if (toSave.length === 0) {
      alert('저장할 유효한 항목이 없습니다.')
      return
    }

    for (const i of toSave) {
      const name = i.name.trim()
      const spec = (i.spec || '').trim()
      const price = parseNumberInput(i.unit)
      const key = `${name}-${spec}`

      const existingItem = existing.get(key)

      if (existingItem) {
        if (existingItem.price !== price) {
          await setDoc(doc(db, 'products', existingItem.id), {
            name,
            spec,
            price
          })
        }
      } else {
        await addDoc(collection(db, 'products'), {
          name,
          spec,
          price
        })
      }
    }

    alert('품목 DB 저장 완료')
    await loadProducts()
  } catch (e) {
    console.error('Firestore 저장 실패:', e)
    alert('DB 저장 중 오류 발생')
  } finally {
    loading.value = false
  }
}

async function saveEstimateToDB() {
  loading.value = true
  try {
    const payload = {
      title: form.title,
      date: form.date,
      client: form.client,
      items: form.items,
      totalSupply: totalSupply.value,
      totalVAT: totalVAT.value,
      totalAmount: totalAmount.value,
      totalKorean: totalKorean.value,
      includeVAT: includeVAT.value,
      createdAt: serverTimestamp()
    }
    await addDoc(collection(db, 'estimates'), payload)
    alert('견적서가 저장되었습니다')
  } catch (err) {
    console.error('견적서 저장 실패:', err)
    alert('견적서 저장 중 오류가 발생했습니다.')
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.back()
}

onMounted(() => {
  loadProducts()
})
</script>

<style scoped>
/* 🎨 헤더 스타일 */
.custom-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
.info-card, .item-selection-card, .total-card, .preview-card {
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
  }

  .action-btn {
    min-width: 140px;
    height: 48px;
    font-size: 14px;
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

.info-table, .supplier-table, .item-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 16px;
}

.info-table th, .supplier-table th, .item-table th,
.info-table td, .supplier-table td, .item-table td {
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

.preview-info-table, .preview-supplier-table, .preview-item-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
  font-size: 14px;
}

.preview-info-table th, .preview-supplier-table th, .preview-item-table th,
.preview-info-table td, .preview-supplier-table td, .preview-item-table td {
  border: 1px solid #cbd5e1;
  padding: 8px 12px;
  text-align: left;
}

.preview-info-table th, .preview-supplier-table th, .preview-item-table th {
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
  
  .preview-info-table, .preview-supplier-table, .preview-item-table {
    font-size: 12px;
  }
  
  .preview-info-table th, .preview-supplier-table th, .preview-item-table th,
  .preview-info-table td, .preview-supplier-table td, .preview-item-table td {
    padding: 6px 8px;
  }
}
</style>