export function convertToKoreanMoney(num) {
  const hanA = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구']
  const danA = ['', '십', '백', '천']
  const unitA = ['', '만', '억', '조', '경']

  let result = ''
  let i = 0
  while (num > 0) {
    let part = ''
    const n = num % 10000
    const digits = n.toString().padStart(4, '0').split('').map(Number)
    digits.forEach((d, j) => {
      if (d > 0) part += hanA[d] + danA[3 - j]
    })
    if (part) result = part + unitA[i] + result
    num = Math.floor(num / 10000)
    i++
  }

  return result || '영'
}
