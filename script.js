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

      // 기존 데이터 호환성 처리 (기존 단일 배열을 요일별 배열로 변환)
      tablesData.forEach(table => {
        if (table.times && !Array.isArray(table.times[0])) {
          // 기존 형식: ["시간1", "시간2", ...]
          // 새 형식으로 변환: [["시간1", ...], ["시간1", ...], ...]
          const oldTimes = table.times;
          table.times = [
            oldTimes, // 월
            oldTimes, // 화
            oldTimes, // 수
            oldTimes, // 목
            oldTimes  // 금
          ];
        }
      });

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
          // 요일별 시간 (0:월, 1:화, 2:수, 3:목, 4:금)
          times: [
            ["08:30~09:15", "09:25~10:10", "10:30~11:15", "11:25~12:10", "13:10~13:55", "14:05~14:50", "15:00~15:45", ""], // 월
            ["08:30~09:15", "09:25~10:10", "10:30~11:15", "11:25~12:10", "13:10~13:55", "14:05~14:50", "15:00~15:45", ""], // 화
            ["08:30~09:15", "09:25~10:10", "10:30~11:15", "11:25~12:10", "13:10~13:55", "14:05~14:50", "15:00~15:45", ""], // 수
            ["08:30~09:15", "09:25~10:10", "10:30~11:15", "11:25~12:10", "13:10~13:55", "14:05~14:50", "15:00~15:45", ""], // 목
            ["08:30~09:15", "09:25~10:10", "10:25~11:10", "11:20~12:05", "13:05~13:50", "14:00~14:45", "14:55~15:40", "15:45~16:30"]  // 금
          ],
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

    // 기존 데이터 호환성 처리
    tablesData.forEach(table => {
      if (table.times && !Array.isArray(table.times[0])) {
        const oldTimes = table.times;
        table.times = [
          oldTimes, // 월
          oldTimes, // 화
          oldTimes, // 수
          oldTimes, // 목
          oldTimes  // 금
        ];
      }
    });
  } else {
    tablesData.push({
      id: Date.now(),
      title: "1학기 🏫",
      schedule: getEmptySchedule(),
      // 요일별 시간 (0:월, 1:화, 2:수, 3:목, 4:금)
      times: [
        ["08:30~09:15", "09:25~10:10", "10:30~11:15", "11:25~12:10", "13:10~13:55", "14:05~14:50", "15:00~15:45", ""], // 월
        ["08:30~09:15", "09:25~10:10", "10:30~11:15", "11:25~12:10", "13:10~13:55", "14:05~14:50", "15:00~15:45", ""], // 화
        ["08:30~09:15", "09:25~10:10", "10:30~11:15", "11:25~12:10", "13:10~13:55", "14:05~14:50", "15:00~15:45", ""], // 수
        ["08:30~09:15", "09:25~10:10", "10:30~11:15", "11:25~12:10", "13:10~13:55", "14:05~14:50", "15:00~15:45", ""], // 목
        ["08:30~09:15", "09:25~10:10", "10:25~11:10", "11:20~12:05", "13:05~13:50", "14:00~14:45", "14:55~15:40", "15:45~16:30"]  // 금
      ],
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
  timetableArea.innerHTML = "";

  const currentData = tablesData[currentTableIndex];
  if (!currentData) return;

  // 제목 텍스트도 현재 시간표 제목으로 변경
  timetableTitleInput.value = currentData.title || "새 시간표";

  currentData.schedule.forEach((row, rowIndex) => {
    // 4교시와 5교시 사이에 점심시간 바 생성 (인덱스 값이 4일 때)
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
    // 실시간으로 변할 때 너무 어지럽지 않게 초기 로드시에만 적용되거나 빠르게 처리되도록 조절 가능
    timeRow.style.animation = "none";
    timeRow.style.opacity = "1";
    timeRow.style.transform = "none";

    // "교시 숫자" 및 시간 텍스트 표시 (왼쪽 첫번째 칸)
    const timeLabel = document.createElement("div");
    timeLabel.classList.add("time-label");
    timeLabel.innerHTML = `<span>${rowIndex + 1}</span>`;

    // 요일별 시간 텍스트 표시 (가장 많이 사용되는 시간 표시 - 월~목)
    const timeText = document.createElement("div");
    timeText.classList.add("time-text");
    const mondayTime = currentData.times && currentData.times[0] && currentData.times[0][rowIndex] ? currentData.times[0][rowIndex] : "시간입력";
    // 시간을 줄바꿈 없이 그대로 표시
    timeText.textContent = mondayTime;
    timeLabel.appendChild(timeText);

    timeLabel.addEventListener("click", () => openTimeModal(rowIndex));
    timeRow.appendChild(timeLabel);

    // 각 교시의 월~금 과목 카드 그리기
    row.forEach((cellData, colIndex) => {
      const card = document.createElement("div");
      card.classList.add("subject-card");
      if (cellData.colorClass) card.classList.add(cellData.colorClass);
      if (cellData.highlight) card.classList.add("current-class");

      // 해당 요일의 시간 표시 (카드 상단에 작게)
      const dayTime = currentData.times && currentData.times[colIndex] && currentData.times[colIndex][rowIndex] ? currentData.times[colIndex][rowIndex] : "";
      if (dayTime && dayTime !== mondayTime) {
        const timeInfo = document.createElement("div");
        timeInfo.style.fontSize = "10px";
        timeInfo.style.color = "#999";
        timeInfo.style.marginBottom = "4px";
        timeInfo.textContent = dayTime;
        card.appendChild(timeInfo);
      }

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

      // 카드 누르면 수정 팝업 열기 연결
      card.addEventListener("click", () => showModal(colIndex, rowIndex, cellData));
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
  updateColorButtonsSelection();

  // "짠!" 하고 모달을 보여줍니다. (hidden 클래스 제거)
  editModal.classList.remove("hidden");

  // 모달이 열리면 자동으로 과목명 입력칸에 커서를 깜빡이게 도와줍니다.
  subjectInput.focus();
}

// 모달창을 닫아주는 마법
function closeModal() {
  editModal.classList.add("hidden");
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

    // 붙여넣기 마법을 부린 다음, 귀찮게 저장 버튼을 따로 누르지 않아도
    // 곧바로 스스로! 저장 버튼을 투닥! 눌러주고 창을 닫아줍니다. 
    btnSave.click();
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

  tablesData[currentTableIndex].schedule[p][d] = {
    subject: "자습",
    teacher: "",
    colorClass: "subject-empty"
  };

  saveAllData();
  renderTimetable();
  closeModal();
});

// 저장 버튼 기능
btnSave.addEventListener("click", () => {
  const newSubject = subjectInput.value.trim() || "자습";
  const newTeacher = teacherInput.value.trim();

  const d = currentEditInfo.dayIndex;
  const p = currentEditInfo.periodIndex;

  tablesData[currentTableIndex].schedule[p][d] = {
    subject: newSubject,
    teacher: newTeacher,
    colorClass: selectedColor || "subject-empty"
  };

  saveAllData();
  renderTimetable();
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

// ----------------------------------------------------
// 🌟 6. 일과 시간표 및 학사일정 팝업 제어
// ----------------------------------------------------
const scheduleBtn = document.getElementById("schedule-btn");
const scheduleModal = document.getElementById("scheduleModal");
const btnCloseSchedule = document.getElementById("btnCloseSchedule");

// 상단 버튼을 누르면 팝업창 나타나기!
if (scheduleBtn && scheduleModal) {
  scheduleBtn.addEventListener("click", () => {
    scheduleModal.classList.remove("hidden");
  });
}

// X 버튼을 누르면 팝업창 숨기기!
if (btnCloseSchedule && scheduleModal) {
  btnCloseSchedule.addEventListener("click", () => {
    scheduleModal.classList.add("hidden");
  });
}

// 팝업창 바깥의 어두운 배경을 눌러도 닫히게 하는 마법
if (scheduleModal) {
  scheduleModal.addEventListener("click", (event) => {
    // 클릭한 곳이 정확히 '어두운 배경(modal-overlay)'일 때만 닫기
    if (event.target === scheduleModal) {
      scheduleModal.classList.add("hidden");
    }
  });
}

// ----------------------------------------------------
// 🌟 7. 학사일정 이미지 줌인/줌아웃 (Panzoom) 마법 적용
// ----------------------------------------------------
const calImg1 = document.getElementById('calImg1');
const calImg2 = document.getElementById('calImg2');

// 공통 Panzoom 설정 (최대 4배까지 확대 가능, 부드러운 움직임)
const panzoomOptions = {
  maxScale: 4,
  minScale: 1,
  contain: 'outside', // 이미지가 상자 밖으로 무리하게 드래그 안 되게 막음
};

if (calImg1 && typeof Panzoom !== 'undefined') {
  const pz1 = Panzoom(calImg1, panzoomOptions);

  // 컴퓨터 마우스 휠로 확대/축소 지원
  calImg1.parentElement.addEventListener('wheel', pz1.zoomWithWheel);
}

if (calImg2 && typeof Panzoom !== 'undefined') {
  const pz2 = Panzoom(calImg2, panzoomOptions);

  // 컴퓨터 마우스 휠로 확대/축소 지원
  calImg2.parentElement.addEventListener('wheel', pz2.zoomWithWheel);
}
