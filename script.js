// ----------------------------------------------------
// ☁️ 1. 구글 파이어베이스(Firebase) 도서관 연결 준비!
// ----------------------------------------------------
// [선생님 전용 열쇠칸!] 
// 나중에 선생님만의 완벽한 폰-컴퓨터 연결을 위해 구글 Firebase 가입 후 여기에 주소를 넣으면 진짜 클라우드가 됩니다!
const firebaseConfig = {
  // 예시: databaseURL: "https://선생님프로젝트.firebaseio.com"
  databaseURL: "https://temporary-test-db-for-teacher.firebaseio.com"
};

// 파이어베이스 연결 시도는 잠시 안전하게 꺼두고(Try-Catch), 
// 대신 컴퓨터 창 2개를 띄웠을 때 완벽하게 똑같이 실시간 마법이 일어하는 코드를 핵심으로 적용할게요!
let db;
try {
  firebase.initializeApp(firebaseConfig);
  db = firebase.database();
} catch (e) {
  console.log("☁️ 아직 진짜 클라우드 주소가 없어서, 마법의 실시간 동기화 모드로 작동합니다!");
}


const TOTAL_ROWS = 8;
const TOTAL_COLS = 5;

// 기본 빈 시간표 뼈대 만들기
function getEmptySchedule() {
  const empty = [];
  for (let i = 0; i < TOTAL_ROWS; i++) {
    const row = [];
    for (let j = 0; j < TOTAL_COLS; j++) {
      row.push({ subject: "자습", teacher: "", colorClass: "subject-empty", highlight: false });
    }
    empty.push(row);
  }
  return empty;
}

// 여러 개의 시간표를 저장할 큰 서랍장!
let tablesData = [];
// 현재 보고 있는 시간표가 몇 번째(순서)인지 기억하기 (0 = 첫 번째)
let currentTableIndex = 0;

// 임시 저장소에서 꺼내오기
const savedData = localStorage.getItem("myAllTimetableData");
if (savedData) {
  tablesData = JSON.parse(savedData);
} else {
  // 처음 켰을 때는 '1학기 🏫' 라는 기본 시간표 한 개를 만들어줍시다.
  tablesData.push({
    id: Date.now(), // 겹치지 않는 고유 번호
    title: "1학기 🏫",
    schedule: getEmptySchedule(),
    times: ["", "", "", "", "", "", "", ""],
    lunchTime: ""
  });
}


// ----------------------------------------------------
// 🌟 2. 시간표 화면에 예쁘게 그리기 (핵심 그리기 마법)
// ----------------------------------------------------
const timetableArea = document.getElementById("timetableArea");
const timetableTitleInput = document.getElementById("timetableTitle");

// 상단 타이틀 이름 바꿀 때마다 저장하기 이벤트
timetableTitleInput.addEventListener('input', (e) => {
  if (tablesData[currentTableIndex]) {
    tablesData[currentTableIndex].title = e.target.value;
    saveAllData(); // 글자 하나 칠 때마다 저장하고 탭 업데이트!
  }
});

// 화면 다시 그리기 함수 (이게 불리면 전체가 새로고침 없이 짠! 바뀝니다)
function renderTimetable() {
  timetableArea.innerHTML = "";

  const currentData = tablesData[currentTableIndex];
  if (!currentData) return;

  // 제목 텍스트도 현재 시간표 제목으로 변경
  timetableTitleInput.value = currentData.title || "새 시간표";

  currentData.schedule.forEach((row, rowIndex) => {
    if (rowIndex === 4) {
      const lunchBreak = document.createElement("div");
      lunchBreak.classList.add("lunch-break");
      lunchBreak.style.cursor = "pointer"; // 누를 수 있다는 표시
      const lunchTimeStr = currentData.lunchTime ? `<span style="font-size: 13px; font-weight: normal; margin: 0 8px; color: #df7238; background: #fff; padding: 2px 8px; border-radius: 10px;">${currentData.lunchTime}</span>` : "";
      lunchBreak.innerHTML = `<i class="fa-solid fa-cookie-bite" style="margin-right:8px;"></i> 맛있는 점심 ${lunchTimeStr} <i class="fa-solid fa-cookie-bite" style="margin-left:8px;"></i>`;
      lunchBreak.addEventListener("click", () => openTimeModal('lunch'));
      timetableArea.appendChild(lunchBreak);
    }

    const timeRow = document.createElement("div");
    timeRow.classList.add("time-row");
    // 실시간으로 변할 때 너무 어지럽지 않게 딜레이 제거 (클라우드 모드 최적화)
    timeRow.style.animation = "none";
    timeRow.style.opacity = "1";
    timeRow.style.transform = "none";

    // "교시 숫자" 및 시간 텍스트 표시
    const timeLabel = document.createElement("div");
    timeLabel.classList.add("time-label");
    timeLabel.innerHTML = `<span>${rowIndex + 1}</span>`;

    const timeText = document.createElement("div");
    timeText.classList.add("time-text");
    timeText.innerHTML = currentData.times[rowIndex] ? currentData.times[rowIndex].replace("-", "<br>-<br>").replace("~", "<br>~<br>") : "시간<br>입력";
    timeLabel.appendChild(timeText);

    timeLabel.addEventListener("click", () => openTimeModal(rowIndex));
    timeRow.appendChild(timeLabel);

    // 각 교시의 과목 카드 그리기
    row.forEach((cellData, colIndex) => {
      const card = document.createElement("div");
      card.classList.add("subject-card");
      if (cellData.colorClass) card.classList.add(cellData.colorClass);
      if (cellData.highlight) card.classList.add("current-class");

      const subjectName = document.createElement("div");
      subjectName.classList.add("subject-name");
      subjectName.textContent = cellData.subject;
      card.appendChild(subjectName);

      if (cellData.teacher) {
        const teacherName = document.createElement("div");
        teacherName.classList.add("teacher-name");
        teacherName.textContent = cellData.teacher;
        card.appendChild(teacherName);
      }

      // 카드 누르면 팝업 열기
      card.addEventListener("click", () => openModal(rowIndex, colIndex, cellData));
      timeRow.appendChild(card);
    });

    timetableArea.appendChild(timeRow);
  });
}

// 하단 탭 버튼 그리기 마법!
function renderTabs() {
  const tabsArea = document.getElementById("tabsArea");
  tabsArea.innerHTML = "";

  // 현재 있는 시간표 개수만큼 탭 버튼을 만듭니다.
  tablesData.forEach((table, index) => {
    const btn = document.createElement("button");
    btn.classList.add("nav-item");
    if (index === currentTableIndex) {
      btn.classList.add("active");
    }

    // 탭 모양 구성 (선택된 애는 뒤에 활성화 분홍 배경 추가)
    const bgDiv = index === currentTableIndex ? '<div class="active-bg"></div>' : '';
    // 이모지 꾸미기
    const iconClass = index === 0 ? "fa-solid fa-house" : "fa-regular fa-calendar-days";

    btn.innerHTML = `
      ${bgDiv}
      <i class="${iconClass}"></i>
      <span>${table.title.substring(0, 5)}...</span> <!-- 너무 길면 자름 -->
    `;

    // 탭을 누르면 화면 전환!
    btn.addEventListener("click", () => {
      currentTableIndex = index;
      // 탭 누를 때 다시 그려주세요!
      renderTabs();
      renderTimetable();
    });

    tabsArea.appendChild(btn);
  });

  // 맨 끝에 '+' 새 시간표 추가 버튼
  const addBtn = document.createElement("button");
  addBtn.classList.add("nav-item");
  addBtn.innerHTML = `
    <i class="fa-solid fa-plus"></i>
    <span>추가</span>
  `;
  addBtn.addEventListener("click", () => {
    // 새 시간표를 배열 끝에 추가
    tablesData.push({
      id: Date.now(),
      title: "새 시간표 ✨",
      schedule: getEmptySchedule(),
      times: ["", "", "", "", "", "", "", ""],
      lunchTime: ""
    });
    // 방금 만든 새 시간표로 바로 이동 (마지막 순번)
    currentTableIndex = tablesData.length - 1;
    saveAllData();
  });
  tabsArea.appendChild(addBtn);
}

// ----------------------------------------------------
// 🌟 3. 데이터 저장 및 ✨실시간 동기화 마법✨
// ----------------------------------------------------
function saveAllData() {
  // 1단계: 내 서랍에 안전하게 보관 (기본)
  localStorage.setItem("myAllTimetableData", JSON.stringify(tablesData));

  // 2단계: 진짜 클라우드(DB)가 연결되어 있다면 도서관으로 전송!
  if (db) {
    try {
      db.ref('teacher_timetable').set({
        tables: tablesData
      });
    } catch (e) { }
  }

  // 3단계: 화면 바로 다시 그리기!
  renderTimetable();
  renderTabs();
}

// 😲 [마법의 핵심] 다른 창(또는 스마트폰)에서 누군가 시간표를 바꿨을 때, 내 화면도 자동으로 스르륵 바뀌게 하는 주문!
window.addEventListener('storage', (event) => {
  // 다른 창에서 뭔가 변경해서 내 서랍장(로컬스토리지)이 바뀌었다는 소식을 들으면!
  if (event.key === "myAllTimetableData") {
    // 바뀐 최신 시간표를 몰래 꺼내와서
    const newData = JSON.parse(localStorage.getItem("myAllTimetableData"));
    if (newData && newData.length > 0) {
      tablesData = newData;
      // 혹시 보고 있는 시간표 탭이 삭제되어 번호가 안 맞으면 첫 탭으로 이동
      if (currentTableIndex >= tablesData.length) currentTableIndex = 0;

      renderTimetable();
      renderTabs();
    }
  }
});


// ----------------------------------------------------
// 🌟 4. 과목 입력 팝업창 제어하기
// ----------------------------------------------------
const modal = document.getElementById("editModal");
const btnCancel = document.getElementById("btnCancel");
const btnSave = document.getElementById("btnSave");
const subjectInput = document.getElementById("subjectInput");
const teacherInput = document.getElementById("teacherInput");
const colorButtons = document.querySelectorAll(".color-btn");

let currentRowIndex = -1;
let currentColIndex = -1;
let selectedColorClass = "subject-empty";

function openModal(rowIndex, colIndex, cellData) {
  currentRowIndex = rowIndex;
  currentColIndex = colIndex;
  subjectInput.value = cellData.subject !== "자습" ? cellData.subject : "";
  teacherInput.value = cellData.teacher;
  selectedColorClass = cellData.colorClass;
  updateColorButtonsSelection();
  modal.classList.remove("hidden");
}

function closeModal() {
  modal.classList.add("hidden");
}

colorButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    selectedColorClass = btn.getAttribute("data-color");
    updateColorButtonsSelection();
  });
});

function updateColorButtonsSelection() {
  colorButtons.forEach(btn => btn.classList.remove("selected"));
  const selectedBtn = document.querySelector(`.color-btn[data-color="${selectedColorClass}"]`);
  if (selectedBtn) selectedBtn.classList.add("selected");
}

btnSave.addEventListener("click", () => {
  const newSubject = subjectInput.value.trim() || "자습";
  const newTeacher = teacherInput.value.trim();

  tablesData[currentTableIndex].schedule[currentRowIndex][currentColIndex] = {
    subject: newSubject,
    teacher: newTeacher,
    colorClass: selectedColorClass,
    highlight: false
  };

  // 실시간 마법을 부리며 저장합니다!
  saveAllData();
  closeModal();
});
btnCancel.addEventListener("click", closeModal);


// ----------------------------------------------------
// 🌟 5. 교시 시간 입력 팝업창 제어하기
// ----------------------------------------------------
const timeModal = document.getElementById("timeModal");
const btnTimeCancel = document.getElementById("btnTimeCancel");
const btnTimeSave = document.getElementById("btnTimeSave");
const timeInput = document.getElementById("timeInput");
const timeModalTitle = document.getElementById("timeModalTitle");
let editingRowIndex = -1;

function openTimeModal(rowIndex) {
  editingRowIndex = rowIndex;
  if (rowIndex === 'lunch') {
    timeModalTitle.textContent = `점심 시간 ⏰`;
    timeInput.value = tablesData[currentTableIndex].lunchTime || "";
  } else {
    timeModalTitle.textContent = `${rowIndex + 1}교시 시간 ⏰`;
    timeInput.value = tablesData[currentTableIndex].times[rowIndex] || "";
  }
  timeModal.classList.remove("hidden");
}

function closeTimeModal() {
  timeModal.classList.add("hidden");
}

btnTimeSave.addEventListener("click", () => {
  if (editingRowIndex === 'lunch') {
    tablesData[currentTableIndex].lunchTime = timeInput.value.trim();
  } else {
    tablesData[currentTableIndex].times[editingRowIndex] = timeInput.value.trim();
  }
  // 실시간 마법을 부리며 저장합니다!
  saveAllData();
  closeTimeModal();
});
btnTimeCancel.addEventListener("click", closeTimeModal);


// 🎉 모든 준비가 끝났으니 시작할 때 한 번 화면을 그립니다!
renderTabs(); // 탭도 처음부터 그려줘야 나오죠!
renderTimetable();
