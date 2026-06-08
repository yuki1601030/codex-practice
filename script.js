// HTMLの入力欄やボタンをJavaScriptで使えるように取得します
const destinationInput = document.getElementById("destination");
const memoInput = document.getElementById("memo");
const prioritySelect = document.getElementById("priority");
const statusSelect = document.getElementById("status");
const addButton = document.getElementById("addButton");
const searchInput = document.getElementById("searchInput");
const memoList = document.getElementById("memoList");

// localStorageに保存するときの名前です。同じ名前を使って読み書きします
const storageKey = "travelMemos";

// 古い保存データに足りない項目があっても、画面で使える形にそろえます
const normalizeMemo = (travelMemo, index) => ({
  id: travelMemo.id || Date.now() + index,
  destination: travelMemo.destination || "",
  memo: travelMemo.memo || "",
  priority: travelMemo.priority || "中",
  status: travelMemo.status || "行きたい",
});

// localStorageから保存済みの旅行メモを読み込みます。保存がない場合は空の配列にします
let travelMemos = (JSON.parse(localStorage.getItem(storageKey)) || []).map(normalizeMemo);

// 今の旅行メモ一覧をlocalStorageに保存します
const saveMemos = () => {
  localStorage.setItem(storageKey, JSON.stringify(travelMemos));
};

// 優先度が高いメモから順番に表示するための点数です
const priorityOrder = {
  高: 1,
  中: 2,
  低: 3,
};

// ステータス切り替えボタンで次に入れる値を返します
const getNextStatus = (currentStatus) => (currentStatus === "行った" ? "行きたい" : "行った");

// メモのidを使って、配列の中の同じ旅行メモを探します
const findMemoIndex = (id) => travelMemos.findIndex((travelMemo) => travelMemo.id === id);

// 一覧をいったん空にして、検索条件に合うものだけを優先度順に並べ直してから表示します
const renderMemos = () => {
  memoList.innerHTML = "";

  // 検索欄の文字を小文字にそろえると、大文字小文字を気にせず探せます
  const searchText = searchInput.value.trim().toLowerCase();

  [...travelMemos]
    .filter((travelMemo) => {
      // 検索欄が空なら、すべての旅行メモを表示します
      if (searchText === "") {
        return true;
      }

      // 旅行先名またはメモ内容に検索文字が含まれているか確認します
      const destination = travelMemo.destination.toLowerCase();
      const memo = travelMemo.memo.toLowerCase();
      return destination.includes(searchText) || memo.includes(searchText);
    })
    .sort((a, b) => {
      // 古い保存データに優先度がない場合は「中」として扱います
      const priorityA = priorityOrder[a.priority || "中"];
      const priorityB = priorityOrder[b.priority || "中"];

      // 優先度が同じ場合は、追加された順番が変わらないようにします
      return priorityA - priorityB || a.id - b.id;
    })
    .forEach((travelMemo) => {
      memoList.appendChild(createMemoItem(travelMemo));
    });
};

// カード内の「メモ」「優先度」「ステータス」を並べる行を作ります
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

// 旅行メモ1件分のli要素を作ります
const createMemoItem = (travelMemo) => {
  // 一覧に追加するためのli要素を作ります
  const listItem = document.createElement("li");
  listItem.className = "memo-item";

  // 旅行先の見出しを作ります
  const title = document.createElement("h3");
  title.textContent = travelMemo.destination;

  // メモ、優先度、ステータスをカードの中で読みやすく表示します
  const memoText = createDetailRow("メモ", travelMemo.memo);
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

  // li要素の中に旅行先、メモ、優先度、ステータス、操作ボタンを入れます
  listItem.appendChild(title);
  listItem.appendChild(memoText);
  listItem.appendChild(priorityText);
  listItem.appendChild(statusText);
  listItem.appendChild(actions);

  return listItem;
};

// 編集ボタンを押したときに表示する、旅行メモ1件分の編集フォームを作ります
const createEditMemoItem = (travelMemo) => {
  const listItem = document.createElement("li");
  listItem.className = "memo-item memo-item-editing";

  const title = document.createElement("h3");
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

  const priorityLabel = document.createElement("label");
  priorityLabel.htmlFor = `edit-priority-${travelMemo.id}`;
  priorityLabel.textContent = "優先度";

  const priorityEditSelect = document.createElement("select");
  priorityEditSelect.id = `edit-priority-${travelMemo.id}`;
  ["高", "中", "低"].forEach((priority) => {
    const option = document.createElement("option");
    option.value = priority;
    option.textContent = priority;
    option.selected = priority === (travelMemo.priority || "中");
    priorityEditSelect.appendChild(option);
  });

  const statusLabel = document.createElement("label");
  statusLabel.htmlFor = `edit-status-${travelMemo.id}`;
  statusLabel.textContent = "ステータス";

  const statusEditSelect = document.createElement("select");
  statusEditSelect.id = `edit-status-${travelMemo.id}`;
  ["行きたい", "行った"].forEach((status) => {
    const option = document.createElement("option");
    option.value = status;
    option.textContent = status;
    option.selected = status === (travelMemo.status || "行きたい");
    statusEditSelect.appendChild(option);
  });

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
  const priority = prioritySelect.value;
  const status = statusSelect.value;

  // 旅行先かメモが空の場合は、一覧に追加しないで知らせます
  if (destination === "" || memo === "") {
    alert("旅行先の名前とメモを入力してください。");
    return;
  }

  // 保存する旅行メモのデータを作ります。idは編集や削除のときにどのメモか見分けるための番号です
  // priorityとstatusも入れるので、ページ更新後もlocalStorageから読み込まれます
  const travelMemo = {
    id: Date.now(),
    destination,
    memo,
    priority,
    status,
  };

  // 配列に追加してからlocalStorageに保存します
  travelMemos.push(travelMemo);
  saveMemos();

  // 優先度順になるように一覧を並べ直して表示します
  renderMemos();

  // 次の入力がしやすいように入力欄を空にします
  destinationInput.value = "";
  memoInput.value = "";
  prioritySelect.value = "中";
  statusSelect.value = "行きたい";
  destinationInput.focus();
});
