// HTMLの入力欄やボタンをJavaScriptで使えるように取得します
const destinationInput = document.getElementById("destination");
const memoInput = document.getElementById("memo");
const prioritySelect = document.getElementById("priority");
const addButton = document.getElementById("addButton");
const memoList = document.getElementById("memoList");

// localStorageに保存するときの名前です。同じ名前を使って読み書きします
const storageKey = "travelMemos";

// localStorageから保存済みの旅行メモを読み込みます。保存がない場合は空の配列にします
let travelMemos = JSON.parse(localStorage.getItem(storageKey)) || [];

// 今の旅行メモ一覧をlocalStorageに保存します
const saveMemos = () => {
  localStorage.setItem(storageKey, JSON.stringify(travelMemos));
};

// 旅行メモ1件分のli要素を作ります
const createMemoItem = (travelMemo) => {
  // 一覧に追加するためのli要素を作ります
  const listItem = document.createElement("li");
  listItem.className = "memo-item";

  // 旅行先の見出しを作ります
  const title = document.createElement("h3");
  title.textContent = travelMemo.destination;

  // メモ本文を作ります
  const memoText = document.createElement("p");
  memoText.textContent = travelMemo.memo;

  // 優先度を表示します。古い保存データに優先度がない場合は「中」にします
  const priorityText = document.createElement("p");
  priorityText.className = "memo-priority";
  priorityText.textContent = `優先度：${travelMemo.priority || "中"}`;

  // この旅行メモを削除するためのボタンを作ります
  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "delete-button";
  deleteButton.textContent = "削除";

  // 削除ボタンが押されたら、配列とlocalStorageの両方から消します
  deleteButton.addEventListener("click", () => {
    travelMemos = travelMemos.filter((memo) => memo.id !== travelMemo.id);
    saveMemos();
    listItem.remove();
  });

  // li要素の中に旅行先、メモ、優先度、削除ボタンを入れます
  listItem.appendChild(title);
  listItem.appendChild(memoText);
  listItem.appendChild(priorityText);
  listItem.appendChild(deleteButton);

  return listItem;
};

// 保存済みの旅行メモを画面に表示します
travelMemos.forEach((travelMemo) => {
  memoList.appendChild(createMemoItem(travelMemo));
});

// 追加ボタンが押されたときに実行する処理です
addButton.addEventListener("click", () => {
  // 入力された文字の前後にある余分な空白を取り除きます
  const destination = destinationInput.value.trim();
  const memo = memoInput.value.trim();
  const priority = prioritySelect.value;

  // 旅行先かメモが空の場合は、一覧に追加しないで知らせます
  if (destination === "" || memo === "") {
    alert("旅行先の名前とメモを入力してください。");
    return;
  }

  // 保存する旅行メモのデータを作ります。idは削除するときにどのメモか見分けるための番号です
  // priorityも入れるので、ページ更新後も優先度がlocalStorageから読み込まれます
  const travelMemo = {
    id: Date.now(),
    destination,
    memo,
    priority,
  };

  // 配列に追加してからlocalStorageに保存します
  travelMemos.push(travelMemo);
  saveMemos();

  // 完成したli要素を一覧に追加します
  memoList.appendChild(createMemoItem(travelMemo));

  // 次の入力がしやすいように入力欄を空にします
  destinationInput.value = "";
  memoInput.value = "";
  prioritySelect.value = "中";
  destinationInput.focus();
});
