<template>
  <v-container class="pa-4">
    <h2 class="text-h5 mb-4">📄 견적서 작성</h2>

    <!-- 상단 기본 정보 입력 -->
    <v-row>
      <v-col cols="12" md="4">
        <v-text-field v-model="form.title" label="견적명" outlined />
      </v-col>
      <v-col cols="12" md="4">
        <v-text-field v-model="form.date" label="견적일자" type="date" outlined />
      </v-col>
      <v-col cols="12" md="4">
        <v-text-field v-model="form.client" label="업체명" outlined />
      </v-col>
    </v-row>

    <v-divider class="my-4" />

    <!-- 품목 선택 버튼 -->
    <v-slide-group show-arrows class="mb-4" v-model="selectedItemIndex">
      <v-slide-item v-for="(item, i) in productButtons" :key="i">
        <v-btn class="ma-1" color="primary" variant="tonal" :style="{ minWidth: '120px' }" @click="selectPresetItem(item)">
          {{ item.displayName }}
        </v-btn>
      </v-slide-item>
      <v-slide-item>
        <v-btn class="ma-1" color="secondary" variant="outlined" @click="addCustomItem">+ 기타</v-btn>
      </v-slide-item>
    </v-slide-group>

   <!-- 품목 리스트 (카드 기반으로 전면 교체) -->
<v-row v-for="(item, i) in form.items" :key="i" class="mb-2">
  <v-col cols="12">
    <v-card outlined class="pa-3">
      <v-row dense>
        <v-col cols="12" class="text-subtitle-2 mb-2">
          📦 #{{ i + 1 }}번 품목
        </v-col>

        <v-col cols="6" sm="4">
          <v-text-field v-model="item.name" label="품명" />
        </v-col>
        <v-col cols="6" sm="4">
          <v-text-field v-model="item.spec" label="규격" />
        </v-col>
        <v-col cols="6" sm="2">
          <v-text-field
            v-model="item.qty"
            type="number"
            label="수량"
            @input="updateItem(i)"
          />
        </v-col>
        <v-col cols="6" sm="2">
          <v-text-field
            :model-value="format(item.unit)"
            @update:model-value="onUnitInput($event, i)"
            label="단가"
          />
        </v-col>

        <v-col cols="6" sm="3" class="pt-1">
          <div>공급가액: <strong>{{ format(item.supply) }}원</strong></div>
        </v-col>
        <v-col cols="6" sm="3" class="pt-1">
          <div>세액: <strong>{{ format(item.vat) }}원</strong></div>
        </v-col>

        <v-col cols="12" sm="6">
          <v-text-field v-model="item.note" label="비고" />
        </v-col>

        <v-col cols="12" class="text-right">
          <v-btn icon color="error" @click="removeItem(i)">
            <v-icon>mdi-delete</v-icon>
          </v-btn>
        </v-col>
      </v-row>
    </v-card>
  </v-col>
</v-row>
    <v-checkbox v-model="includeVAT" label="세액 포함" class="mt-4" @change="recalculateAll" />

    <v-row class="mt-4">
      <v-col cols="12" md="6">
        <div>총 공급가액: {{ format(totalSupply) }}원</div>
        <div>총 세액: {{ format(totalVAT) }}원</div>
        <div>합계금액: {{ format(totalAmount) }}원</div>
        <div>한글표기: {{ totalKorean }}원</div>
      </v-col>
      <v-col cols="12" md="6" class="text-right">
        <v-btn color="primary" @click="generatePDF">📄 PDF 생성</v-btn>
        <v-btn color="secondary" @click="saveProductToDB">💾 품목 저장</v-btn>
        <v-btn color="success" @click="saveEstimateToDB">🗃️ 견적 저장</v-btn>
      </v-col>
    </v-row>

    <!-- PDF 미리보기 -->
    <div id="pdf-preview" ref="pdfPreview" class="preview-box">
  <h1 class="title">견&nbsp;적&nbsp;서</h1>

  <!-- ✅ info-table 수정 -->
  <table class="info-table">
    <tbody>
      <tr><th>견적명</th><td>{{ form.title }}</td></tr>
      <tr><th>견적일자</th><td>{{ form.date }}</td></tr>
      <tr><th>업체명</th><td>{{ form.client }}</td></tr>
    </tbody>
  </table>

  <!-- ✅ supplier-table 수정 -->
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
        <tr><th>사업자주소</th><td colspan="4">서울시 송파구 송파대로 201, B동 216호</td></tr>
        <tr><th>업태</th><td>서비스</td><th>종목</th><td colspan="2">기계 수리</td></tr>
      </tbody>
    </table>
  </div>

  <!-- ✅ item-table 수정 -->
  <table class="item-table">
    <thead>
      <tr><th>품명</th><th>규격</th><th>수량</th><th>단가</th><th>공급가액</th><th>세액</th><th>비고</th></tr>
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
    <div>합계금액: {{ format(totalAmount) }}원 ({{ totalKorean }}원)</div>
    <div>계좌번호: 1002-150-335422 (우리은행)</div>
    <div>연락처: 010-4684-4794 / 담당자: 배규석</div>
  </div>
</div>
  </v-container>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { db } from '@/firebase/config'
import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore'
import { convertToKoreanMoney } from '@/utils/money'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

const form = reactive({
  title: '',
  date: new Date().toISOString().substring(0, 10),
  client: '',
  items: []
})

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
  form.items.push({
    name: product.name,
    spec: product.spec,
    qty: 1,
    unit: product.price,
    supply: 0,
    vat: 0,
    note: ''
  })
  recalculateAll()
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
  const previewEl = pdfPreview.value

  const canvas = await html2canvas(previewEl, {
    scale: 2,
    useCORS: true,
    width: 794,
    windowWidth: 794
  })

  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF('p', 'mm', 'a4')
  const width = pdf.internal.pageSize.getWidth()
  const height = (canvas.height * width) / canvas.width

  pdf.addImage(imgData, 'PNG', 0, 0, width, height)
  pdf.save(`${form.client}_${form.date}.pdf`)
}

async function loadProducts() {
  const snap = await getDocs(collection(db, 'products'))
  productOptions.value = snap.docs.map(doc => doc.data())
  processProductButtons()
}

async function saveProductToDB() {
  try {
    const existing = new Map()

    // 모든 product 불러와서 중복 체크용 Map 구성 (name+spec → price)
    const snap = await getDocs(collection(db, 'products'))
    snap.forEach(doc => {
      const data = doc.data()
      const key = `${data.name}-${(data.spec || '').trim()}`
      existing.set(key, { ...data, id: doc.id })
    })

    const toSave = form.items.filter(i => {
      const name = (i.name || '').trim()
      const spec = (i.spec || '').trim()
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
        // 이미 있으면 단가가 다른 경우에만 업데이트
        if (existingItem.price !== price) {
          await setDoc(doc(db, 'products', existingItem.id), {
            name,
            spec,
            price
          })
          console.log(`🔁 수정됨: ${key} (단가 ${existingItem.price} → ${price})`)
        } else {
          console.log(`✅ 이미 존재 (변경 없음): ${key}`)
        }
      } else {
        // 신규 항목이면 추가
        await addDoc(collection(db, 'products'), {
          name,
          spec,
          price
        })
        console.log(`➕ 새로 저장: ${key}`)
      }
    }

    alert('품목 DB 저장 완료')
    await loadProducts()

  } catch (e) {
    console.error('🔥 Firestore 저장 실패:', e)
    alert('DB 저장 중 오류 발생')
  }
}

async function saveEstimateToDB() {
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
}

onMounted(() => {
  loadProducts()
})
</script>

<style scoped>
.item-table-wrapper {
  overflow-x: auto;
}
.item-table-ui td {
  vertical-align: middle;
  padding: 10px 6px;
  min-width: 100px;
}
.item-table-ui .v-input {
  margin: 0;
  width: 100%;
}
.item-table-ui .v-input input {
  padding-top: 6px !important;
  padding-bottom: 6px !important;
  line-height: 1.4;
  font-size: 14px !important;
  text-align: right;
}
@media (max-width: 600px) {
  .item-table-ui td {
    font-size: 12px;
    padding: 6px 4px;
  }
  .item-table-ui .v-input input {
    font-size: 12px !important;
  }
}

.preview-box {
  width: 794px;                /* A4 width in px (210mm @96dpi) */
  min-height: 1123px;          /* A4 height in px */
  background: white;
  padding: 16px;
  margin: 40px auto;
  border: 1px solid #ccc;
  font-size: 12px;
  color: black;
  box-sizing: border-box;
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
  top: -10px;
  right: -11px;
  height: 40px;
  width: 40px;
  pointer-events: none;
}
.summary {
  margin-top: 20px;
  font-weight: bold;
  font-size: 13px;
}
</style>
