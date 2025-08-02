# SuperClaude v3 완전 활용 가이드

## 🚀 개요

SuperClaude v3는 2025년 Claude Code의 최신 프레임워크로, 19개 전문 명령어, 9개 인지 페르소나, 4개 MCP 서버 통합, Wave 오케스트레이션 시스템을 제공합니다.

---

## 📝 19개 전문 명령어

### 🔨 개발 & 구현
```bash
/build $ARGUMENTS              # 프로젝트 빌더 (프레임워크 자동 감지, Wave 지원)
/implement $ARGUMENTS          # 기능 구현 (UI/API/서비스, 지능형 페르소나 활성화)
/design $ARGUMENTS             # 디자인 오케스트레이션 (시스템/UI 설계)
```

### 🔍 분석 & 조사
```bash
/analyze $ARGUMENTS            # 다차원 코드/시스템 분석 (Wave 지원)
/troubleshoot [symptoms]       # 문제 조사 (근본 원인 분석)
/explain [topic]               # 교육적 설명 (멘토 페르소나 자동 활성화)
```

### ✨ 품질 & 향상
```bash
/improve [target]              # 증거 기반 코드 개선 (Wave 지원)
/cleanup [target]              # 프로젝트 정리 및 기술 부채 감소
/test [type]                   # 테스팅 워크플로우 (Playwright 통합)
```

### 📚 문서화 & 관리
```bash
/document [target]             # 문서 생성 (Scribe 페르소나)
/estimate [target]             # 증거 기반 추정
/git [operation]               # Git 워크플로우 어시스턴트
```

### 🎯 메타 & 오케스트레이션
```bash
/task [operation]              # 장기 프로젝트 관리 (Wave 지원)
/index [query]                 # 명령어 카탈로그 브라우징
/load [path]                   # 프로젝트 컨텍스트 로딩
/spawn [mode]                  # 태스크 오케스트레이션 (모든 서버 활용)
```

### 🔄 워크플로우
```bash
/workflow [type]               # 워크플로우 자동화
/schedule [task]               # 스케줄링 및 자동화
```

---

## 🚩 고급 플래그 시스템

### 🧠 사고 깊이 플래그
| 플래그 | 설명 | 토큰 사용량 | 활용 상황 |
|--------|------|-------------|-----------|
| `--plan` | 실행 전 계획 표시 | +500 | 모든 복잡한 작업 |
| `--think` | 다중 파일 분석 | ~4K | 모듈 레벨 분석 |
| `--think-hard` | 심층 아키텍처 분석 | ~10K | 시스템 전체 분석 |
| `--ultrathink` | 임계 시스템 재설계 | ~32K | 레거시 현대화, 심각한 성능 문제 |

### ⚡ 압축 & 효율성 플래그
| 플래그 | 설명 | 토큰 절약 | 자동 활성화 |
|--------|------|-----------|------------|
| `--uc` / `--ultracompressed` | 30-50% 토큰 감소 | 30-50% | 컨텍스트 >75% |
| `--answer-only` | 직접 응답 (워크플로우 없음) | 20-40% | 명시적 사용만 |
| `--validate` | 사전 운영 검증 | -10% | 위험도 >0.7 |
| `--safe-mode` | 최대 검증 + 보수적 실행 | -20% | 리소스 >85% |
| `--verbose` | 최대 상세 설명 | +100% | 학습/디버깅 시 |

### 🔧 MCP 서버 제어 플래그
| 플래그 | MCP 서버 | 자동 활성화 조건 | 주요 기능 |
|--------|----------|------------------|-----------|
| `--c7` / `--context7` | Context7 | 외부 라이브러리 임포트 감지 | 라이브러리 문서, 패턴 |
| `--seq` / `--sequential` | Sequential | 복잡한 디버깅, `--think` 플래그 | 체계적 분석, 문제 해결 |
| `--magic` | Magic | UI 컴포넌트 요청 | UI 컴포넌트 생성 |
| `--play` / `--playwright` | Playwright | 테스트 워크플로우 | 브라우저 자동화, E2E 테스트 |
| `--all-mcp` | 모든 서버 | 복잡도 >0.8, 다중 도메인 | 종합적 분석 |
| `--no-mcp` | 없음 | 명시적 사용만 | 40-60% 빠른 실행 |

### 🌊 Wave 오케스트레이션 플래그
| 플래그 | 설명 | 자동 활성화 | 성능 향상 |
|--------|------|-------------|-----------|
| `--wave-mode auto` | 자동 Wave 감지 | 복잡도≥0.7 + 파일>20 + 작업타입>2 | 30-50% |
| `--wave-mode force` | 강제 Wave 활성화 | 명시적 사용 | 조건부 |
| `--wave-strategy progressive` | 점진적 개선 | 성능 최적화 | 증분 향상 |
| `--wave-strategy systematic` | 체계적 분석 | 대규모 리팩토링 | 75% |
| `--wave-strategy adaptive` | 동적 구성 | 복잡도 변화 | 적응적 |
| `--wave-strategy enterprise` | 엔터프라이즈 | 파일>100, 복잡도>0.7 | 85% |

### 👥 Sub-Agent 위임 플래그
| 플래그 | 설명 | 자동 활성화 | 성능 향상 |
|--------|------|-------------|-----------|
| `--delegate files` | 파일별 위임 | 파일>50 | 40-70% |
| `--delegate folders` | 폴더별 위임 | 디렉토리>7 | 40-70% |
| `--delegate auto` | 자동 위임 전략 | 복잡한 프로젝트 구조 | 적응적 |
| `--concurrency [n]` | 동시 에이전트 수 | 자동 조정 (1-15) | 병렬 처리 |

### 🔄 반복 개선 플래그
| 플래그 | 설명 | 자동 활성화 | 기본값 |
|--------|------|-------------|--------|
| `--loop` | 반복 개선 모드 | polish, refine, enhance 키워드 | 3회 반복 |
| `--iterations [n]` | 반복 횟수 지정 | 사용자 지정 | 1-10회 |
| `--interactive` | 반복 간 확인 | 사용자 승인 필요 | 수동 가이드 |

### 🎭 페르소나 활성화 플래그
| 페르소나 | 플래그 | 자동 활성화 키워드 | 전문 분야 |
|----------|-------|-------------------|-----------|
| **architect** | `--persona-architect` | architecture, design, scalability | 시스템 설계, 장기 계획 |
| **frontend** | `--persona-frontend` | component, responsive, accessibility | UX/UI, 접근성, 성능 |
| **backend** | `--persona-backend` | API, database, service, reliability | 서버 사이드, 인프라 |
| **analyzer** | `--persona-analyzer` | analyze, investigate, root cause | 근본 원인 분석 |
| **security** | `--persona-security` | vulnerability, threat, compliance | 보안, 위협 모델링 |
| **mentor** | `--persona-mentor` | explain, learn, understand | 교육, 지식 전달 |
| **refactorer** | `--persona-refactorer` | refactor, cleanup, technical debt | 코드 품질, 리팩토링 |
| **performance** | `--persona-performance` | optimize, performance, bottleneck | 성능 최적화 |
| **qa** | `--persona-qa` | test, quality, validation | 품질 보증, 테스팅 |
| **devops** | `--persona-devops` | deploy, infrastructure, automation | 배포, 인프라 |
| **scribe** | `--persona-scribe=ko` | document, write, guide | 문서화, 다국어 |

### 🔍 범위 & 포커스 플래그
| 플래그 | 옵션 | 설명 |
|--------|------|------|
| `--scope` | file, module, project, system | 분석 범위 지정 |
| `--focus` | performance, security, quality, architecture, accessibility, testing | 특정 영역 집중 |

### 🔬 메타 플래그
| 플래그 | 설명 | 활용 |
|--------|------|------|
| `--introspect` | 사고 과정 투명화 | SuperClaude 작업 시 |

---

## 🎯 실제 사용 예제

### 일반적인 개발 작업
```bash
# React 컴포넌트 생성
/implement "로그인 폼 컴포넌트" --magic --c7 --persona-frontend --plan

# API 엔드포인트 구현
/implement "사용자 인증 API" --seq --persona-backend --validate

# 버그 분석 및 수정
/troubleshoot "로그인 실패 문제" --think --seq --persona-analyzer

# 성능 최적화
/improve --focus performance --persona-performance --think-hard
```

### 대규모 프로젝트 작업
```bash
# 전체 시스템 분석
/analyze @src/ --ultrathink --all-mcp --persona-architect --plan

# 대규모 리팩토링
/improve @entire-project --wave-mode force --wave-strategy enterprise --delegate auto

# 레거시 현대화
/improve --wave-strategy systematic --ultrathink --persona-architect --validate
```

### 품질 & 보안 작업
```bash
# 보안 감사
/analyze --focus security --ultrathink --persona-security --validate --plan

# 코드 품질 개선 (반복적)
/improve --loop --iterations 5 --persona-refactorer --interactive

# 전체 테스트 전략
/test --persona-qa --play --seq --plan
```

### 문서화 & 교육
```bash
# 한국어 문서 생성
/document @README.md --persona-scribe=ko --c7

# 코드 설명 (교육적)
/explain "React Hooks 사용법" --persona-mentor --verbose

# 아키텍처 문서
/document --focus architecture --persona-architect --c7
```

---

## 📊 자동 활성화 조건

### Wave 시스템 자동 활성화
```yaml
조건:
  복잡도: ≥0.7
  파일 수: >20개
  작업 유형: >2개
  도메인: >3개
```

### Sub-Agent 위임 자동 활성화
```yaml
조건:
  디렉토리: >7개 또는
  파일: >50개 또는
  복잡도: >0.8
```

### 페르소나 자동 활성화 (신뢰도 기준)
```yaml
frontend: 80% (component, UI 키워드)
backend: 85% (API, service 키워드)
security: 90% (vulnerability, threat 키워드)
performance: 85% (optimize, bottleneck 키워드)
qa: 75% (test, quality 키워드)
```

---

## 🔄 플래그 우선순위 규칙

1. **안전 플래그** (`--safe-mode`) > 최적화 플래그
2. **명시적 플래그** > 자동 활성화
3. **사고 깊이:** `--ultrathink` > `--think-hard` > `--think`
4. **`--no-mcp`** 모든 개별 MCP 플래그 무시
5. **범위:** `system` > `project` > `module` > `file`
6. **마지막 지정 페르소나**가 우선
7. **Wave 모드:** `off` > `force` > `auto`
8. **Sub-Agent:** 명시적 `--delegate` > 자동 감지
9. **Loop 모드:** 명시적 `--loop` > 키워드 기반 자동 감지
10. **`--uc` 자동 활성화**가 verbose 플래그 무시

---

## 💡 최적 활용 팁

### 토큰 효율성
- 복잡한 작업에는 `--plan` 먼저 사용
- 컨텍스트가 75% 이상일 때 `--uc` 활용  
- 간단한 질문에는 `--answer-only`

### 성능 최적화
- 대규모 프로젝트에는 Wave 시스템 활용
- 병렬 처리 가능한 작업에는 `--delegate` 사용
- MCP 서버는 필요시에만 활성화

### 품질 보장
- 중요한 작업에는 `--validate` 필수
- 프로덕션 환경에는 `--safe-mode`
- 반복적 개선에는 `--loop` 활용

### 학습 & 디버깅
- 복잡한 문제는 `--think-hard` 또는 `--ultrathink`
- 과정 이해가 필요할 때 `--introspect`
- 교육 목적에는 `--persona-mentor`

---

이 가이드를 참조하여 SuperClaude v3의 모든 기능을 최대한 활용하세요! 🚀