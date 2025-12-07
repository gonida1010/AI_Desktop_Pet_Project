# 🐱 AI Desktop Pet Project

React, Electron, 그리고 Python FastAPI를 활용한 **데스크톱 마스코트** 프로젝트입니다.
배경이 투명한 윈도우 위에서 캐릭터가 자유롭게 돌아다니며, 마우스 위치에 반응하거나 AI 알고리즘에 따라 독자적인 행동(배회, 잠자기, 상호작용 등)을 수행합니다.

## 🛠 Tech Stack

### Client (Desktop App)
- **Framework**: React 19 (Vite)
- **Wrapper**: Electron (투명 창 및 데스크톱 애플리케이션 구현)
- **Physics**: Matter.js (물리 엔진 적용)
- **Communication**: Axios (AI 서버 통신)

### Server (AI Logic)
- **Backend**: Python FastAPI
- **Automation**: PyAutoGUI (마우스 좌표 추적 및 상호작용)
- **Server**: Uvicorn

---

## 📂 Directory Structure

프로젝트는 크게 클라이언트와 서버로 나뉩니다.

```bash
CatVsBrowser/         # 최상위 루트
├── client/           # React + Electron 소스
│   ├── src/
│   ├── electron.cjs  # Electron 메인 프로세스
│   └── package.json
├── server/           # Python FastAPI 소스
│   ├── main.py
│   └── venv/
└── .gitignore        # Git 무시 설정 (최상위 위치)
```

## 🚀 Installation (설치 방법)

프로젝트를 실행하기 전, 각 폴더의 라이브러리를 설치해야 합니다.

### 1. Client 설정
`client` 폴더로 이동하여 Node.js 의존성을 설치합니다.

```bash
cd client
npm install
```
### 2. Server 설정
server 폴더(또는 루트)에서 Python 패키지를 설치합니다.
### (선택) 가상환경 생성 및 실행 후
```
pip install fastapi uvicorn pyautogui multipart
```
### ▶️ Usage (실행 방법)
총 3개의 터미널을 열어 아래 순서대로 실행해야 정상 작동합니다.

### 1️⃣ Terminal 1: Frontend 서버 (Vite)
React 개발 서버를 실행하여 UI를 렌더링합니다.
```
cd client
npm run dev
```
### 2️⃣ Terminal 2: Desktop 앱 (Electron)
투명 윈도우를 띄우는 Electron을 실행합니다. (Terminal 1이 켜져 있어야 합니다.)
```
cd client
npm run electron
```
### 3️⃣ Terminal 3: AI 서버 (FastAPI)
캐릭터의 행동 알고리즘을 계산하는 Python 서버를 실행합니다.
```
cd server
uvicorn main:app --reload
```
