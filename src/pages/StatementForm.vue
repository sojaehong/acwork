<template>
    <v-container class="pa-4">
        <h2 class="text-h5 mb-4">📦 거래명세서 작성</h2>

        <!-- 상단 입력 -->
        <v-row>
            <v-col cols="12" md="4">
                <v-text-field v-model="form.date" label="작성일자 (년-월-일)" type="date" outlined />
            </v-col>
            <v-col cols="12" md="4">
                <v-text-field v-model="form.client" label="공급받는자 (거래처명)" outlined />
            </v-col>
        </v-row>

        <v-row>
            <v-col cols="12" md="6">
                <v-text-field v-model="form.remark" label="비고" outlined />
            </v-col>
        </v-row>

        <v-divider class="my-4" />

        <!-- 품목 선택 버튼 -->
        <v-slide-group show-arrows class="mb-4">
            <v-slide-item v-for="(item, i) in productButtons" :key="i">
                <v-btn class="ma-1" color="primary" @click="selectPresetItem(item)">{{ item.displayName }}</v-btn>
            </v-slide-item>
            <v-slide-item>
                <v-btn class="ma-1" color="secondary" @click="addItem">+ 기타</v-btn>
            </v-slide-item>
        </v-slide-group>

        <!-- 품목 입력 영역 -->
        <v-row v-for="(item, i) in form.items" :key="i" class="mb-2">
            <v-col cols="12">
                <v-card outlined class="pa-3">
                    <v-row dense>
                        <v-col cols="12" class="text-subtitle-2 mb-2">📄 품목 #{{ i + 1 }}</v-col>
                        <v-col cols="6" sm="2"><v-text-field v-model="item.name" label="품목" /></v-col>
                        <v-col cols="6" sm="2"><v-text-field v-model="item.spec" label="규격" /></v-col>
                        <v-col cols="6" sm="2"><v-text-field v-model="item.qty" type="number" label="수량"
                                @input="updateItem(i)" /></v-col>
                        <v-col cols="6" sm="2"><v-text-field :model-value="format(item.unit)" label="단가"
                                @update:model-value="onUnitInput($event, i)" /></v-col>
                        <v-col cols="6" sm="2">
                            <div class="mt-4">공급가액: <strong>{{ format(item.supply) }}</strong></div>
                        </v-col>
                        <v-col cols="6" sm="2">
                            <div class="mt-4">세액: <strong>{{ format(item.vat) }}</strong></div>
                        </v-col>
                        <v-col cols="12" class="text-right">
                            <v-btn icon color="error" @click="removeItem(i)"><v-icon>mdi-delete</v-icon></v-btn>
                        </v-col>
                    </v-row>
                </v-card>
            </v-col>
        </v-row>

        <v-checkbox v-model="includeVAT" label="세액 포함" class="my-2" @change="recalculateAll" />

         <!-- PDF 버튼 -->
        <v-row class="mt-4">
            <v-col class="text-right">
                <v-btn color="primary" @click="generatePDF">PDF 저장</v-btn>
            </v-col>
        </v-row>

        <!-- PDF 출력 템플릿 -->
        <div ref="pdfPreview" class="pdf-box">
            <h3 class="form-title">거 래 명 세 표</h3>
             <!-- 상단 공급자 정보 + 수신자 정보 -->
      <div class="top-header">
        <div class="left-box">
          <div class="underline-text mt-2">{{ formatKoreanDate(form.date) }}</div><br />
          <div class="underline-text mt-2">{{ form.client }} 귀하</div><br />
          <div class="mt-2">아래와 같이 계산합니다.</div>
        </div>

        <div class="right-box">
          <table class="supplier-info">
            <tbody>
              <tr>
                <td class="vertical-label" rowspan="5">공<br />급<br />자</td>
                <td>등록번호</td>
                <td colspan="3">403-41-01157</td>
              </tr>
              <tr>
                <td>상호</td>
                <td>이안공조프러스</td>
                <td>성명</td>
                <td class="relative supplier-signer">
                  배규석 (인)
                  <img src="/stamp.png" class="stamp-image" />
                </td>
              </tr>
              <tr>
                <td>사업장소재지</td>
                <td colspan="3">서울특별시 송파구 송파대로 201, B동 208-71호(문정동, 송파 테라타워2)</td>
              </tr>
              <tr>
                <td>업태</td>
                <td>서비스</td>
                <td>종목</td>
                <td>기계수리</td>
              </tr>
              <tr>
                <td>전화번호</td>
                <td colspan="3">010-4684-4794</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

            <table class="sum-table">
                <tbody>
                    <tr>
                        <td class="sum-label">합계<br>금액</td>
                        <td class="sum-amount"> {{ convertToKoreanMoney(totalSupply + totalVAT) }}원정 (&#x20A9;{{format(totalSupply + totalVAT)}})</td>
                    </tr>
                </tbody>
            </table>

            <table class="item-table">
                <thead>
                    <tr>
                        <th>번호</th>
                        <th>품목</th>
                        <th>규격</th>
                        <th>수량</th>
                        <th>단가</th>
                        <th>공급가액</th>
                        <th>세액</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(item, i) in displayRows" :key="i">
                        <td>{{ i + 1 }}</td>
                        <td>{{ item?.name || '' }}</td>
                        <td>{{ item?.spec || '' }}</td>
                        <td>{{ item?.qty || '' }}</td>
                        <td>{{ format(item?.unit) }}</td>
                        <td>{{ format(item?.supply) }}</td>
                        <td>{{ format(item?.vat) }}</td>
                    </tr>
                    <tr class="total-row">
                        <td colspan="5">계</td>
                        <td>{{ format(totalSupply) }}</td>
                        <td>{{ format(totalVAT) }}</td>
                    </tr>
                    <tr class="total-row">
                        <td colspan="1">전잔금</td>
                        <td colspan="2"></td>
                        <td colspan="1">합계</td>
                        <td colspan="3">{{ format(totalSupply+totalVAT) }}</td>
                    </tr>
                    <tr class="bottom-info-row">
                        <td colspan="1" class="remark">비고</td>
                        <td colspan="3">{{ form.remark }}</td>
                        <td colspan="1" class="receiver">인수자</td>
                        <td colspan="2">{{ form.receiver }}</td>
                    </tr>
                </tbody>
            </table>

        </div>

       
    </v-container>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { db } from '@/firebase/config'
import { collection, getDocs } from 'firebase/firestore'
import { convertToKoreanMoney } from '@/utils/money'

const form = reactive({
    date: getTodayKST(),
    client: '',
    writer: '',
    items: [],
    remark: '',
    receiver: ''
})

function getTodayKST() {
    const now = new Date()
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
    return now.toISOString().slice(0, 10)
}

function formatKoreanDate(dateStr) {
  const [year, month, day] = dateStr.split('-')
  return `${year}년 ${Number(month)}월 ${Number(day)}일`
}

const includeVAT = ref(true)
const pdfPreview = ref(null)
const totalSupply = ref(0)
const totalVAT = ref(0)
const productOptions = ref([])
const productButtons = ref([])

const displayRows = computed(() => {
    const copy = [...form.items]
    while (copy.length < 20) copy.push({})
    return copy
})

function format(n) {
    if (!n && n !== 0) return ''
    return Number(n).toLocaleString()
}
function parseNumberInput(val) {
    const cleaned = typeof val === 'string' ? val.replace(/,/g, '') : val
    return isNaN(parseFloat(cleaned)) ? 0 : parseFloat(cleaned)
}
function onUnitInput(val, i) {
    form.items[i].unit = parseNumberInput(val)
    updateItem(i)
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
    form.items.forEach(item => {
        item.supply = item.qty * item.unit
        item.vat = includeVAT.value ? Math.round(item.supply * 0.1) : 0
        totalSupply.value += item.supply
        totalVAT.value += item.vat
    })
}
function addItem() {
    form.items.push({ name: '', spec: '', qty: 1, unit: 0, supply: 0, vat: 0 })
}
function removeItem(i) {
    form.items.splice(i, 1)
    recalculateAll()
}
function selectPresetItem(product) {
    const name = product.name.trim()
    const spec = (product.spec || '').trim()
    const existing = form.items.find(item => item.name === name && item.spec === spec)
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
            vat: 0
        })
        recalculateAll()
    }
}
async function loadProducts() {
    const snap = await getDocs(collection(db, 'products'))
    productOptions.value = snap.docs.map(doc => doc.data())
    processProductButtons()
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
        return { ...p, displayName }
    })
}
onMounted(() => {
    loadProducts()
})

async function generatePDF() {
    const canvas = await html2canvas(pdfPreview.value, { scale: 2 })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'mm', 'a4')
    const width = pdf.internal.pageSize.getWidth()
    const height = (canvas.height * width) / canvas.width
    pdf.addImage(imgData, 'PNG', 0, 0, width, height)
    pdf.save(`${form.client}_${form.date}_거래명세서.pdf`)
}
</script>

<style scoped>
.pdf-box {
  width: 794px;
  min-height: 1123px;
  background: white;
  border: 1px solid #000;
  padding: 20px;
  margin: 32px auto;
  font-size: 12px;
  color: black;
}

.form-title {
  text-align: center;
  font-weight: bold;
  font-size: 18px;
  margin-bottom: 12px;
}

.top-header {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 16px;
}
.left-box {
  width: 30%;
  font-size: 14px;
  line-height: 1.6;
}
.right-box {
  width: 68%;
}

.supplier-info {
  width: 100%;
  border-collapse: collapse;
}
.supplier-info td {
  border: 1px solid #000;
  padding: 6px;
  font-size: 12px;
  text-align: left;
}
.vertical-label {
  text-align: center;
  vertical-align: middle;
  font-size: 14px;
  padding: 4px;
  border: 1px solid #000;
}

.relative {
  min-height: 60px;
  position: relative;
}
.stamp-image {
  position: absolute;
  top: -7px;
  right: 61px;
  width: 48px;
  height: 48px;
  pointer-events: none;
}
.underline-text {
  border-bottom: 1px solid #000;
  display: inline-block;
  padding-bottom: 2px;
  margin-bottom: 8px; /* 여백 명확하게 줌 */
  font-size: 14px;
}

.sum-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 16px;
}
.sum-table td {
  border: 1px solid #000;
  padding: 6px;
  text-align: center;
  font-size: 14px;
}
.sum-label {
  width: 20%;
  font-weight: bold;
  text-align: center;
  white-space: nowrap;
}
.sum-amount {
  width: 80%;
  font-size: 16px;
  font-weight: bold;
  text-align: center;
}

.item-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 16px;
}
.item-table th,
.item-table td {
  border: 1px solid #000;
  padding: 4px;
  text-align: center;
}
.total-row td {
  font-weight: bold;
  background: #eee;
}
.bottom-info-row td {
  height: 50px;
  vertical-align: middle;
}
.remark,
.receiver {
  border: 1px solid #000;
}
</style>
