// HTMLの入力欄やボタンをJavaScriptで使えるように取得します
const destinationInput = document.getElementById("destination");
const memoInput = document.getElementById("memo");
const addButton = document.getElementById("addButton");
const memoList = document.getElementById("memoList");

// 追加ボタンが押されたときに実行する処理です
addButton.addEventListener("click", () => {
  // 入力された文字の前後にある余分な空白を取り除きます
  const destination = destinationInput.value.trim();
  const memo = memoInput.value.trim();

  // 旅行先かメモが空の場合は、一覧に追加しないで知らせます
  if (destination === "" || memo === "") {
    alert("旅行先の名前とメモを入力してください。");
    return;
  }

  // 一覧に追加するためのli要素を作ります
  const listItem = document.createElement("li");
  listItem.className = "memo-item";

  // 旅行先の見出しを作ります
  const title = document.createElement("h3");
  title.textContent = destination;

  // メモ本文を作ります
  const memoText = document.createElement("p");
  memoText.textContent = memo;

  // この旅行メモを削除するためのボタンを作ります
  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "delete-button";
  deleteButton.textContent = "削除";

  // 削除ボタンが押されたら、このli要素だけを一覧から消します
  deleteButton.addEventListener("click", () => {
    listItem.remove();
  });

  // li要素の中に旅行先、メモ、削除ボタンを入れます
  listItem.appendChild(title);
  listItem.appendChild(memoText);
  listItem.appendChild(deleteButton);

  // 完成したli要素を一覧に追加します
  memoList.appendChild(listItem);

  // 次の入力がしやすいように入力欄を空にします
  destinationInput.value = "";
  memoInput.value = "";
  destinationInput.focus();
});
