# 감사숲평생교육원 소개 페이지

감사교육 전문가이자 평생교육 기획자 **호영미** 대표의 감사숲평생교육원 소개 홈페이지입니다.

## 폴더 구조

```
hoho/
├─ index.html      ← 페이지 내용 (글, 메뉴, 프로그램 카드)
├─ css/style.css   ← 색깔, 글꼴, 배치, 반응형
├─ js/main.js      ← 애니메이션, 햄버거 메뉴, 이메일 조합
├─ images/         ← 사진 (profile.jpg, preview.jpg, favicon.svg)
├─ netlify.toml    ← Netlify 배포 설정과 보안 헤더
├─ .gitignore      ← GitHub에 올리지 않을 파일 목록
└─ README.md       ← 이 설명서
```

## 내 컴퓨터에서 미리 보기

`index.html` 파일을 더블클릭하면 브라우저에서 열려요.

## 자주 고치는 곳

| 고칠 내용 | 파일 | 찾을 글자 |
|---|---|---|
| 프로그램 카드 | `index.html` | `진행했던 프로그램`, `지금 진행 중`, `곧 만나요` |
| 숫자 (수강생 수 등) | `index.html` | `data-target="20000"` |
| 색깔 | `css/style.css` | 맨 위 `:root` |
| 오른쪽 아래 안내원 메뉴 | `index.html` | `플로팅 안내원` |
| 안내원 위치·크기·움직임 | `css/style.css` | `플로팅 안내원` |
| 카카오톡 미리보기 문구 | `index.html` | `og:title`, `og:description` |

> 지금 프로그램 내용은 **예시**예요. 실제 내용으로 바꿔 주세요.

## 사용한 것
- 글꼴: Google Fonts **Noto Sans KR**
- 외부 라이브러리 없이 HTML·CSS·JavaScript만 사용
- 움직임 줄이기(prefers-reduced-motion) 설정을 켠 사용자는 애니메이션이 꺼져요.
