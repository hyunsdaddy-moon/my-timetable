// ----------------------------------------------------
// ☁️ 1. 구글 파이어베이스(Firebase) 도서관 연결 준비!
// ----------------------------------------------------
// [선생님 전용 열쇠칸!] 
const firebaseConfig = {
  databaseURL: "https://my-school-timetable-f8cdd-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// 파이어베이스에 진짜로 연결을 시도하는 마법!
let db;
try {
  firebase.initializeApp(firebaseConfig);
  db = firebase.database();
} catch (e) {
  console.log("☁️ 실시간 동기화 모드로 작동합니다!");
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

let tablesData = [];
let currentTableIndex = 0;

// 파이어베이스(클라우드)에서 실시간으로 데이터 감시하기!
if (db) {
  const timetableRef = db.ref('teacher_timetable');

  // 누군가(폰이나 컴퓨터) 데이터를 바꾸면 이 마법이 즉시 실행됩니다!
  timetableRef.on('value', (snapshot) => {
    const data = snapshot.val();
    if (data && data.tables) {
      // 클라우드에서 최신 시간표 정보를 가져와서 내 서랍장에 넣습니다.
      tablesData = data.tables;

      // 혹시 폰에서 탭을 삭제해서 지금 보고 있는 탭 번호가 안 맞으면 첫 탭으로 이동
      if (currentTableIndex >= tablesData.length) currentTableIndex = 0;

      // 화면 짠! 하고 다시 그리기
      renderTimetable();
      renderTabs();
    } else {
      // 만약 클라우드가 텅텅 비어있다면(처음 사용하는 거라면) 기본 시간표를 만들어줍니다.
      if (tablesData.length === 0) {
        tablesData.push({
          id: Date.now(),
          title: "1학기 🏫",
          schedule: getEmptySchedule(),
          times: ["", "", "", "", "", "", "", ""],
          lunchTime: ""
        });
        saveAllData(); // 만든 걸 클라우드에 올려서 채워주기
      }
    }
  });
} else {
  // 클라우드 연결이 안 되었을 때 (혹시 모를 대비책)
  const savedData = localStorage.getItem("myAllTimetableData");
  if (savedData) {
    tablesData = JSON.parse(savedData);
  } else {
    tablesData.push({
      id: Date.now(),
      title: "1학기 🏫",
      schedule: getEmptySchedule(),
      times: ["", "", "", "", "", "", "", ""],
      lunchTime: ""
    });
  }
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
  const tbody = document.getElementById("timetableBody");
  tbody.innerHTML = "";

  const currentTable = tablesData[currentTableIndex];
  if (!currentTable) return;

  // 제목 텍스트도 현재 시간표 제목으로 변경
  timetableTitleInput.value = currentTable.title || "새 시간표";

  for (let p = 0; p < currentTable.schedule[0].length; p++) {
    const tr = document.createElement("tr");

    const thPeriod = document.createElement("th");

    // 교시 클릭 (시간 설정 모달 호출)
    thPeriod.innerHTML = `<div class="period-circle">${p + 1}</div><div class="period-time">${currentTable.times[p] || ""}</div>`;
    thPeriod.style.cursor = "pointer";
    thPeriod.addEventListener("click", () => {
      openTimeModal(p);
    });
    tr.appendChild(thPeriod);

    for (let d = 0; d < 5; d++) {
      const td = document.createElement("td");
      const cellData = currentTable.schedule[d][p];

      let cellClass = cellData.colorClass || "subject-empty";

      td.innerHTML = `
        <div class="subject-box ${cellClass}">
          <div class="subject-name">${cellData.subject}</div>
          ${cellData.teacher ? `<div class="teacher-name">${cellData.teacher}</div>` : ""}
        </div>
      `;

      // 칸을 클릭하면 모달이 열림 (showModal 함수 사용)
      td.addEventListener("click", () => {
        showModal(d, p, cellData);
      });

      tr.appendChild(td);
    }
    tbody.appendChild(tr);

    // 점심시간 바 (4교시 후)
    if (p === 3) {
      const trLunch = document.createElement("tr");
      trLunch.classList.add("lunch-row");
      const tdLunchMode = document.createElement("td");
      tdLunchMode.colSpan = 6;
      tdLunchMode.innerHTML = `<span><i class="fa-solid fa-utensils"></i> 맛있는 점심 시간 <span class="lunch-time-text">${currentTable.lunchTime || ""}</span></span>`;

      // 점심시간 바 클릭 (점심시간 설정 모달 호출)
      tdLunchMode.style.cursor = "pointer";
      tdLunchMode.addEventListener("click", () => {
        openLunchTimeModal();
      });
      trLunch.appendChild(tdLunchMode);
      tbody.appendChild(trLunch);
    }
  }
}
// 이전 버전의 잔재 삭제 완료

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
// ----------------------------------------------// --- 모달 (과목 입력 팝업) 관련 변수들 ---
const editModal = document.getElementById("editModal");
const subjectInput = document.getElementById("subjectInput");
const teacherInput = document.getElementById("teacherInput");
const btnSave = document.getElementById("btnSave");
const btnCancel = document.getElementById("btnCancel");
const btnDelete = document.getElementById("btnDelete"); // 새로 추가된 삭제 버튼
const btnCopy = document.getElementById("btnCopy");     // 새로 추가된 복사 버튼
const btnPaste = document.getElementById("btnPaste");   // 새로 추가된 붙여넣기 버튼
const colorOptions = document.querySelectorAll(".color-btn"); // Changed from .color-option to .color-btn based on original

// 모달창이 열렸을 때 "지금 누른 칸"이 정확히 월요일 3교시인지 등 정보를 임시 기억
let currentEditInfo = {
  dayIndex: -1,
  periodIndex: -1
};
let selectedColor = "";

// 🌟 복사한 시간표 데이터를 잠시 기억할 마법의 주머니!
let copiedClassData = null;

// 모달창을 스르륵 열어주는 마법
function showModal(dayIndex, periodIndex, existingData) {
  // 모달을 열 때, 지금 누른 요일과 교시를 'currentEditInfo' 변수에 기억해 둡니다.
  currentEditInfo.dayIndex = dayIndex;
  currentEditInfo.periodIndex = periodIndex;

  // 만약 붙여넣기 할 내용이 없다면 붙여넣기 버튼을 숨깁니다 (회색 처리).
  if (copiedClassData === null) {
    btnPaste.style.opacity = "0.4";
    btnPaste.style.pointerEvents = "none";
  } else {
    btnPaste.style.opacity = "1";
    btnPaste.style.pointerEvents = "auto";
  }

  // 만약 이 칸이 원래 비어있던 칸(자습)이라면
  if (existingData.subject === "자습" && existingData.teacher === "") {
    subjectInput.value = "";
    teacherInput.value = "";
    selectedColor = ""; // Reset color for empty/default
  } else {
    // 이미 내용이 있던 칸(예: 국어/김국어)이라면, 팝업창에 그 내용을 미리 띄워줍니다.
    subjectInput.value = existingData.subject;
    teacherInput.value = existingData.teacher;
    selectedColor = existingData.colorClass; // Use colorClass from existingData
  }

  // 색깔 선택 동그라미 테두리를 다시 설정
  updateColorSelection();

  // "짠!" 하고 모달을 보여줍니다. (flex로 바꾸면 화면에 보임)
  editModal.style.display = "flex";

  // 모달이 열리면 자동으로 과목명 입력칸에 커서를 깜빡이게 도와줍니다.
  subjectInput.focus();
}

// 모달창을 닫아주는 마법
function closeModal() {
  editModal.style.display = "none";
}

function updateColorButtonsSelection() {
  colorOptions.forEach(btn => btn.classList.remove("selected"));
  const selectedBtn = document.querySelector(`.color-btn[data-color="${selectedColor}"]`);
  if (selectedBtn) selectedBtn.classList.add("selected");
}

colorOptions.forEach((btn) => {
  btn.addEventListener("click", () => {
    selectedColor = btn.getAttribute("data-color");
    updateColorButtonsSelection();
  });
});

// ----------------------------------------------------
// 🌟 새로운 버튼 3. 붙여넣기 기능
// ----------------------------------------------------
btnPaste.addEventListener("click", () => {
  if (copiedClassData) {
    subjectInput.value = copiedClassData.subject;
    teacherInput.value = copiedClassData.teacher;
    selectedColor = copiedClassData.color;
    updateColorButtonsSelection();
  }
});

// ----------------------------------------------------
// 🌟 새로운 버튼 2. 복사 기능
// ----------------------------------------------------
btnCopy.addEventListener("click", () => {
  copiedClassData = {
    subject: subjectInput.value.trim(),
    teacher: teacherInput.value.trim(),
    color: selectedColor
  };

  const originalText = btnCopy.innerHTML;
  btnCopy.innerHTML = `<i class="fa-solid fa-check"></i> 복사됨`;
  setTimeout(() => {
    btnCopy.innerHTML = originalText;
  }, 1000);
});

// ----------------------------------------------------
// 🌟 새로운 버튼 1. 삭제 기능
// ----------------------------------------------------
btnDelete.addEventListener("click", () => {
  const d = currentEditInfo.dayIndex;
  const p = currentEditInfo.periodIndex;

  tablesData[currentTableIndex].schedule[d][p] = {
    subject: "자습",
    teacher: "",
    colorClass: "subject-empty"
  };

  saveAllData();
  closeModal();
});

// 저장 버튼 기능
btnSave.addEventListener("click", () => {
  const newSubject = subjectInput.value.trim() || "자습";
  const newTeacher = teacherInput.value.trim();

  const d = currentEditInfo.dayIndex;
  const p = currentEditInfo.periodIndex;

  tablesData[currentTableIndex].schedule[d][p] = {
    subject: newSubject,
    teacher: newTeacher,
    colorClass: selectedColor || "subject-empty"
  };

  saveAllData();
  closeModal();
});

// 취소 버튼
btnCancel.addEventListener("click", () => {
  closeModal();
});

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
