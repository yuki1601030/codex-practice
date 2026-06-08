// HTMLの入力欄やボタンをJavaScriptで使えるように取得します
const destinationInput = document.getElementById("destination");
const memoInput = document.getElementById("memo");
const estimatedCostInput = document.getElementById("estimatedCost");
const daySelect = document.getElementById("day");
const timeOfDaySelect = document.getElementById("timeOfDay");
const prioritySelect = document.getElementById("priority");
const statusSelect = document.getElementById("status");
const addButton = document.getElementById("addButton");
const searchInput = document.getElementById("searchInput");
const totalBudget = document.getElementById("totalBudget");
const dayBudgetList = document.getElementById("dayBudgetList");
const memoList = document.getElementById("memoList");

// localStorageに保存するときの名前です。同じ名前を使って読み書きします
const storageKey = "travelMemos";

// 日程と時間帯の選択肢です。表示順や並び替え順もこの配列で決まります
const dayOptions = ["1日目", "2日目", "3日目", "未定"];
const timeOfDayOptions = ["朝", "昼", "午後", "夜", "未定"];

// 優先度が高いメモから順番に表示するための点数です
const priorityOrder = {
  高: 1,
  中: 2,
  低: 3,
};

// 入力された費用から数字以外を取り除き、空欄や不正な値は0円として扱います
const normalizeCost = (cost) => {
  const digits = String(cost ?? "").replace(/\D/g, "");
  return digits === "" ? 0 : Number(digits);
};

// 3,000円のように、日本円らしいカンマ区切りで表示します
const formatYen = (cost) => `${normalizeCost(cost).toLocaleString("ja-JP")}円`;

// 費用入力欄は数字だけ残すようにして、初心者にも分かりやすい制限にします
const keepOnlyDigits = (input) => {
  input.value = input.value.replace(/\D/g, "");
};

// 追加フォームと編集フォームの費用欄へ、同じ数字入力ルールを設定します
const setupCostInput = (input) => {
  input.inputMode = "numeric";
  input.pattern = "[0-9]*";
  input.addEventListener("input", () => keepOnlyDigits(input));
};

setupCostInput(estimatedCostInput);

// 配列の何番目かを並び替え用の数字にします。知らない値は「未定」と同じ扱いにします
const getOrder = (options, value) => {
  const index = options.indexOf(value);
  return index === -1 ? options.indexOf("未定") : index;
};

// 古い保存データに足りない項目があっても、画面で使える形にそろえます
const normalizeMemo = (travelMemo, index) => {
  const safeMemo = travelMemo || {};

  return {
    id: safeMemo.id || Date.now() + index,
    destination: safeMemo.destination || "",
    memo: safeMemo.memo || "",
    day: dayOptions.includes(safeMemo.day) ? safeMemo.day : "未定",
    timeOfDay: timeOfDayOptions.includes(safeMemo.timeOfDay) ? safeMemo.timeOfDay : "未定",
    estimatedCost: normalizeCost(safeMemo.estimatedCost),
    priority: safeMemo.priority || "中",
    status: safeMemo.status || "行きたい",
  };
};

// localStorageから保存済みの旅行メモを読み込みます。保存がない場合や読めない場合は空の配列にします
const loadMemos = () => {
  try {
    const savedMemos = JSON.parse(localStorage.getItem(storageKey));
    return Array.isArray(savedMemos) ? savedMemos.map(normalizeMemo) : [];
  } catch (error) {
    return [];
  }
};

let travelMemos = loadMemos();

// 今の旅行メモ一覧をlocalStorageに保存します
const saveMemos = () => {
  localStorage.setItem(storageKey, JSON.stringify(travelMemos));
};

// セレクトボックスを作る共通処理です。編集フォームでも同じ選択肢を使います
const createSelect = (id, options, selectedValue) => {
  const select = document.createElement("select");
  select.id = id;

  options.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    option.selected = value === selectedValue;
    select.appendChild(option);
  });

  return select;
};


// Googleマップ検索URLを作ります。Google Maps APIは使わず、旅行先名を安全にURLへ入れます
const createGoogleMapsSearchUrl = (destination) => {
  const searchText = destination.trim();
  return `https://www.google.com/maps/search/${encodeURIComponent(searchText)}`;
};

// 地図リンクを新しいタブで安全に開くための共通設定を入れます
const setMapLinkAttributes = (link, destination) => {
  link.href = createGoogleMapsSearchUrl(destination);
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.setAttribute("aria-label", `${destination}をGoogleマップで検索する`);
};

// 旅行先名そのものをクリックできるGoogleマップ検索リンクにします
const createDestinationMapLink = (destination) => {
  const link = document.createElement("a");
  link.className = "destination-link";
  link.textContent = destination;
  setMapLinkAttributes(link, destination);
  return link;
};

// カード内に置く、指でも押しやすい「地図で見る」ボタン風リンクを作ります
const createMapButton = (destination) => {
  const link = document.createElement("a");
  link.className = "map-button";
  link.textContent = "地図で見る";
  setMapLinkAttributes(link, destination);
  return link;
};

// ステータス切り替えボタンで次に入れる値を返します
const getNextStatus = (currentStatus) => (currentStatus === "行った" ? "行きたい" : "行った");

// メモのidを使って、配列の中の同じ旅行メモを探します
const findMemoIndex = (id) => travelMemos.findIndex((travelMemo) => travelMemo.id === id);

// 検索に合う旅行メモを取り出します。保存データは変えず、表示だけを絞り込みます
const getFilteredMemos = () => {
  // 検索欄の文字を小文字にそろえると、大文字小文字を気にせず探せます
  const searchText = searchInput.value.trim().toLowerCase();

  return travelMemos.filter((travelMemo) => {
    // 検索欄が空なら、すべての旅行メモを表示します
    if (searchText === "") {
      return true;
    }

    // 旅行先名またはメモ内容に検索文字が含まれているか確認します
    const destination = travelMemo.destination.toLowerCase();
    const memo = travelMemo.memo.toLowerCase();
    return destination.includes(searchText) || memo.includes(searchText);
  });
};

// 日程グループの中で、時間帯順、優先度順、追加順に並べます
const sortMemosForPlan = (memos) =>
  [...memos].sort((a, b) => {
    const timeOrder = getOrder(timeOfDayOptions, a.timeOfDay) - getOrder(timeOfDayOptions, b.timeOfDay);
    const priorityA = priorityOrder[a.priority || "中"] || priorityOrder["中"];
    const priorityB = priorityOrder[b.priority || "中"] || priorityOrder["中"];

    return timeOrder || priorityA - priorityB || a.id - b.id;
  });

// すべての旅行メモを合計して、画面上部の予算サマリーを更新します
const renderBudgetSummary = () => {
  const total = travelMemos.reduce((sum, travelMemo) => sum + normalizeCost(travelMemo.estimatedCost), 0);
  totalBudget.textContent = `合計予算：${formatYen(total)}`;

  dayBudgetList.innerHTML = "";

  dayOptions.forEach((day) => {
    const dayTotal = travelMemos
      .filter((travelMemo) => travelMemo.day === day)
      .reduce((sum, travelMemo) => sum + normalizeCost(travelMemo.estimatedCost), 0);

    const dayBudget = document.createElement("p");
    dayBudget.className = "day-budget";
    dayBudget.textContent = `${day} 合計：${formatYen(dayTotal)}`;
    dayBudgetList.appendChild(dayBudget);
  });
};

// 一覧をいったん空にして、日程ごとのカードに分けて表示します
const renderMemos = () => {
  memoList.innerHTML = "";
  renderBudgetSummary();

  const filteredMemos = getFilteredMemos();

  dayOptions.forEach((day) => {
    const dayMemos = sortMemosForPlan(filteredMemos.filter((travelMemo) => travelMemo.day === day));
    memoList.appendChild(createDaySection(day, dayMemos));
  });
};

// 日程ごとのまとまりを作ります。メモがない日程も見出しを出して、計画全体を見渡せるようにします
const createDaySection = (day, dayMemos) => {
  const sectionItem = document.createElement("li");
  sectionItem.className = "day-section";

  const heading = document.createElement("h3");
  heading.className = "day-heading";
  heading.textContent = day;

  const count = document.createElement("span");
  count.className = "day-count";
  count.textContent = `${dayMemos.length}件`;
  heading.appendChild(count);

  const dayList = document.createElement("ul");
  dayList.className = "day-memo-list";

  if (dayMemos.length === 0) {
    const emptyMessage = document.createElement("li");
    emptyMessage.className = "empty-message";
    emptyMessage.textContent = "この日程の予定はまだありません。";
    dayList.appendChild(emptyMessage);
  } else {
    dayMemos.forEach((travelMemo) => {
      dayList.appendChild(createMemoItem(travelMemo));
    });
  }

  sectionItem.appendChild(heading);
  sectionItem.appendChild(dayList);
  return sectionItem;
};

// カード内の「メモ」「想定費用」「優先度」「ステータス」などを並べる行を作ります
const createDetailRow = (labelText, valueText) => {
  const row = document.createElement("p");
  row.className = "memo-detail";

  const label = document.createElement("span");
  label.className = "memo-detail-label";
  label.textContent = labelText;

  const value = document.createElement("span");
  value.className = "memo-detail-value";
  value.textContent = valueText;

  row.appendChild(label);
  row.appendChild(value);
  return row;
};

// 時間帯を旅行先名の近くにラベル表示して、予定の流れを見やすくします
const createTimeBadge = (timeOfDay) => {
  const badge = document.createElement("span");
  badge.className = "time-badge";
  badge.textContent = timeOfDay || "未定";
  return badge;
};

// 旅行メモ1件分のli要素を作ります
const createMemoItem = (travelMemo) => {
  // 一覧に追加するためのli要素を作ります
  const listItem = document.createElement("li");
  listItem.className = "memo-item";

  const header = document.createElement("div");
  header.className = "memo-header";

  // 旅行先の見出しを作ります。旅行先名はGoogleマップ検索リンクとしてクリックできます
  const title = document.createElement("h4");
  title.appendChild(createDestinationMapLink(travelMemo.destination));

  const headerMeta = document.createElement("div");
  headerMeta.className = "memo-header-meta";
  headerMeta.appendChild(createTimeBadge(travelMemo.timeOfDay));
  headerMeta.appendChild(createMapButton(travelMemo.destination));

  header.appendChild(title);
  header.appendChild(headerMeta);

  // メモ、想定費用、優先度、ステータスをカードの中で読みやすく表示します
  const memoText = createDetailRow("メモ", travelMemo.memo);
  const costText = createDetailRow("想定費用", formatYen(travelMemo.estimatedCost));
  const priorityText = createDetailRow("優先度", travelMemo.priority || "中");
  const statusText = createDetailRow("ステータス", travelMemo.status || "行きたい");

  // 操作用のボタンを横並びで入れる場所を作ります
  const actions = document.createElement("div");
  actions.className = "memo-actions";

  // 編集フォームに切り替えるためのボタンを作ります
  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.className = "action-button edit-button";
  editButton.textContent = "編集";
  editButton.addEventListener("click", () => {
    listItem.replaceWith(createEditMemoItem(travelMemo));
  });

  // ステータスを「行きたい」と「行った」で切り替えるボタンを作ります
  const statusButton = document.createElement("button");
  statusButton.type = "button";
  statusButton.className = "action-button status-button";
  statusButton.textContent = `${getNextStatus(travelMemo.status)}にする`;
  statusButton.addEventListener("click", () => {
    const memoIndex = findMemoIndex(travelMemo.id);

    if (memoIndex === -1) {
      return;
    }

    travelMemos[memoIndex].status = getNextStatus(travelMemos[memoIndex].status);
    saveMemos();
    renderMemos();
  });

  // この旅行メモを削除するためのボタンを作ります
  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "action-button delete-button";
  deleteButton.textContent = "削除";

  // 削除ボタンが押されたら、配列とlocalStorageの両方から消します
  deleteButton.addEventListener("click", () => {
    travelMemos = travelMemos.filter((memo) => memo.id !== travelMemo.id);
    saveMemos();
    renderMemos();
  });

  actions.appendChild(editButton);
  actions.appendChild(statusButton);
  actions.appendChild(deleteButton);

  // li要素の中に旅行先、時間帯、地図リンク、メモ、想定費用、優先度、ステータス、操作ボタンを入れます
  listItem.appendChild(header);
  listItem.appendChild(memoText);
  listItem.appendChild(costText);
  listItem.appendChild(priorityText);
  listItem.appendChild(statusText);
  listItem.appendChild(actions);

  return listItem;
};

// 編集ボタンを押したときに表示する、旅行メモ1件分の編集フォームを作ります
const createEditMemoItem = (travelMemo) => {
  const listItem = document.createElement("li");
  listItem.className = "memo-item memo-item-editing";

  const title = document.createElement("h4");
  title.textContent = "旅行メモを編集";

  const destinationLabel = document.createElement("label");
  destinationLabel.htmlFor = `edit-destination-${travelMemo.id}`;
  destinationLabel.textContent = "旅行先の名前";

  const destinationEditInput = document.createElement("input");
  destinationEditInput.id = `edit-destination-${travelMemo.id}`;
  destinationEditInput.type = "text";
  destinationEditInput.value = travelMemo.destination;

  const memoLabel = document.createElement("label");
  memoLabel.htmlFor = `edit-memo-${travelMemo.id}`;
  memoLabel.textContent = "メモ";

  const memoEditInput = document.createElement("textarea");
  memoEditInput.id = `edit-memo-${travelMemo.id}`;
  memoEditInput.rows = 4;
  memoEditInput.value = travelMemo.memo;

  const costLabel = document.createElement("label");
  costLabel.htmlFor = `edit-cost-${travelMemo.id}`;
  costLabel.textContent = "想定費用（円）";

  const costEditInput = document.createElement("input");
  costEditInput.id = `edit-cost-${travelMemo.id}`;
  costEditInput.type = "text";
  costEditInput.value = normalizeCost(travelMemo.estimatedCost) || "";
  setupCostInput(costEditInput);

  const dayLabel = document.createElement("label");
  dayLabel.htmlFor = `edit-day-${travelMemo.id}`;
  dayLabel.textContent = "日程";

  const dayEditSelect = createSelect(`edit-day-${travelMemo.id}`, dayOptions, travelMemo.day || "未定");

  const timeOfDayLabel = document.createElement("label");
  timeOfDayLabel.htmlFor = `edit-time-${travelMemo.id}`;
  timeOfDayLabel.textContent = "時間帯";

  const timeOfDayEditSelect = createSelect(
    `edit-time-${travelMemo.id}`,
    timeOfDayOptions,
    travelMemo.timeOfDay || "未定",
  );

  const priorityLabel = document.createElement("label");
  priorityLabel.htmlFor = `edit-priority-${travelMemo.id}`;
  priorityLabel.textContent = "優先度";

  const priorityEditSelect = createSelect(`edit-priority-${travelMemo.id}`, ["高", "中", "低"], travelMemo.priority || "中");

  const statusLabel = document.createElement("label");
  statusLabel.htmlFor = `edit-status-${travelMemo.id}`;
  statusLabel.textContent = "ステータス";

  const statusEditSelect = createSelect(
    `edit-status-${travelMemo.id}`,
    ["行きたい", "行った"],
    travelMemo.status || "行きたい",
  );

  const actions = document.createElement("div");
  actions.className = "memo-actions";

  const saveButton = document.createElement("button");
  saveButton.type = "button";
  saveButton.className = "action-button save-button";
  saveButton.textContent = "保存";

  // 保存ボタンが押されたら、配列の中の同じidのメモを書き換えてlocalStorageにも保存します
  saveButton.addEventListener("click", () => {
    const destination = destinationEditInput.value.trim();
    const memo = memoEditInput.value.trim();
    const estimatedCost = normalizeCost(costEditInput.value);

    if (destination === "" || memo === "") {
      alert("旅行先の名前とメモを入力してください。");
      return;
    }

    const memoIndex = findMemoIndex(travelMemo.id);

    if (memoIndex === -1) {
      return;
    }

    travelMemos[memoIndex] = {
      ...travelMemos[memoIndex],
      destination,
      memo,
      estimatedCost,
      day: dayEditSelect.value,
      timeOfDay: timeOfDayEditSelect.value,
      priority: priorityEditSelect.value,
      status: statusEditSelect.value,
    };

    saveMemos();
    renderMemos();
  });

  const cancelButton = document.createElement("button");
  cancelButton.type = "button";
  cancelButton.className = "action-button cancel-button";
  cancelButton.textContent = "キャンセル";
  cancelButton.addEventListener("click", renderMemos);

  actions.appendChild(saveButton);
  actions.appendChild(cancelButton);

  listItem.appendChild(title);
  listItem.appendChild(destinationLabel);
  listItem.appendChild(destinationEditInput);
  listItem.appendChild(memoLabel);
  listItem.appendChild(memoEditInput);
  listItem.appendChild(costLabel);
  listItem.appendChild(costEditInput);
  listItem.appendChild(dayLabel);
  listItem.appendChild(dayEditSelect);
  listItem.appendChild(timeOfDayLabel);
  listItem.appendChild(timeOfDayEditSelect);
  listItem.appendChild(priorityLabel);
  listItem.appendChild(priorityEditSelect);
  listItem.appendChild(statusLabel);
  listItem.appendChild(statusEditSelect);
  listItem.appendChild(actions);

  // 編集開始後すぐ入力できるように、次の描画タイミングで旅行先欄にカーソルを合わせます
  setTimeout(() => destinationEditInput.focus(), 0);

  return listItem;
};

// 保存済みの旅行メモを画面に表示します
renderMemos();

// 検索欄に文字が入力されたら、保存データは変えずに表示だけ絞り込みます
searchInput.addEventListener("input", renderMemos);

// 追加ボタンが押されたときに実行する処理です
addButton.addEventListener("click", () => {
  // 入力された文字の前後にある余分な空白を取り除きます
  const destination = destinationInput.value.trim();
  const memo = memoInput.value.trim();
  const estimatedCost = normalizeCost(estimatedCostInput.value);
  const day = daySelect.value;
  const timeOfDay = timeOfDaySelect.value;
  const priority = prioritySelect.value;
  const status = statusSelect.value;

  // 旅行先かメモが空の場合は、一覧に追加しないで知らせます
  if (destination === "" || memo === "") {
    alert("旅行先の名前とメモを入力してください。");
    return;
  }

  // 保存する旅行メモのデータを作ります。idは編集や削除のときにどのメモか見分けるための番号です
  // estimatedCost、day、timeOfDay、priority、statusも入れるので、ページ更新後もlocalStorageから読み込まれます
  const travelMemo = {
    id: Date.now(),
    destination,
    memo,
    estimatedCost,
    day,
    timeOfDay,
    priority,
    status,
  };

  // 配列に追加してからlocalStorageに保存します
  travelMemos.push(travelMemo);
  saveMemos();

  // 日程別・時間帯順になるように一覧を並べ直して表示します
  renderMemos();

  // 次の入力がしやすいように入力欄を空にします
  destinationInput.value = "";
  memoInput.value = "";
  estimatedCostInput.value = "";
  daySelect.value = "未定";
  timeOfDaySelect.value = "未定";
  prioritySelect.value = "中";
  statusSelect.value = "行きたい";
  destinationInput.focus();
});
