const BASE_URL = "https://lighthouse-user-api.herokuapp.com";
const INDEX_URL = BASE_URL + "/api/v1/users/";
const dataPanel = document.querySelector("#data-panel");
const users = JSON.parse(localStorage.getItem("following")) || []; //收藏改這裡
const searchForm = document.querySelector("#search-form");
const searchInput = document.querySelector("#search-input");
let filteredUsers = [];
const AMOUNTS_PER_PAGE = 30;
const paginator = document.querySelector("#paginator");
const pageActive = document.querySelector("#page-active");
const searchRefresh = document.querySelector("#refresh");
const modal = document.querySelector(".modal.fade"); //需要兩個點

//函式:顯示資料卡
function renderUserList(data) {
  let rawHTML = "";
  data.forEach((item) => {
    rawHTML += `
       <div
          class="col-sm-2"
          data-bs-toggle="modal"
          data-bs-target="#user-modal"          
        >
          <div class="mt-2 mb-2">
            <div class="card">
              <img
                class="card-img-top"
                src="${item.avatar}"
                alt=" "
                data-id="${item.id}"
              />
              <div class="card-body">
                <p class="card-text" data-id="${item.id}">${item.name} ${item.surname}</p>
              </div>
            </div>
          </div>
        </div>
    `;
  });
  dataPanel.innerHTML = rawHTML; //注意，必須在forEach外面，才能避免remove時沒有立即刪除
}

//函式:顯示modal資訊及新增modal id
function showUserModal(id) {
  const name = document.querySelector("#user-modal-name");
  const image = document.querySelector("#user-modal-image");
  const email = document.querySelector("#user-modal-email");
  const gender = document.querySelector("#user-modal-gender");
  const age = document.querySelector("#user-modal-age");
  const region = document.querySelector("#user-modal-region");
  const birthday = document.querySelector("#user-modal-birthday");
  const modalFooter = document.querySelector(".modal-footer");

  axios
    .get(INDEX_URL + id)
    .then((response) => {
      //去console看看就知道為什麼不用results，用了2小時=  =
      const data = response.data;
      name.innerText = `${data.name} ${data.surname}`;
      image.innerHTML = `<img src="${data.avatar}" alt="" class="img-fluid">`;
      email.innerText = `email:${data.email}`;
      gender.innerText = `gender:${data.gender}`;
      age.innerText = `age:${data.age}`;
      region.innerText = `region:${data.region}`;
      birthday.innerText = `birthday:${data.birthday}`;
      modalFooter.innerHTML = `
      <button type="button" class="btn btn-primary unfollow" data-id="${data.id}" data-bs-dismiss="modal">Unfollow</button>
      <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
      `; //class改成unfollow 並新增點選後關閉modal視窗 data-bs-dismiss="modal"
    })
    .catch((err) => console.log(err));
}

//事件:點選資料卡，顯示modal
dataPanel.addEventListener("click", function onPanelClick(event) {
  // console.log(event.target);
  if (event.target.matches(".card-img-top")) {
    showUserModal(event.target.dataset.id);
  }
});

//函式:取消追蹤，全域變數users已改
function unFollowing(id) {
  if (!users || !users.length) return; //users不存在或null則結束
  const userIndex = users.findIndex((user) => user.id === id); //找出符合這條件的index
  if (userIndex === -1) return;
  users.splice(userIndex, 1);
  localStorage.setItem("following", JSON.stringify(users)); //轉為JSON格式的字串，存入資料
  renderUserList(users);
}

//事件:modal中取消追蹤
// const modal = document.querySelector(".modal.fade");
modal.addEventListener("click", function onModalClick(event) {
  if (event.target.matches(".unfollow")) {
    unFollowing(Number(event.target.dataset.id));
  }
});

////搜尋欄search bar製作////
//函式&全域變數
// const searchForm = document.querySelector("#search-form");
// const searchInput = document.querySelector("#search-input");
// let filteredUsers = [];

//SUBMIT本身就包含按下ENTER
//若要即時搜尋，僅改成keyup是不行的，搜尋結果會有誤
searchForm.addEventListener("submit", function onSearch(event) {
  event.preventDefault();
  const keyword = searchInput.value.trim().toLowerCase();

  if (!keyword.length) {
    return alert("Please enter valid string!");
  }

  filteredUsers = users.filter((user) =>
    (user.name + user.surname).toLowerCase().includes(keyword)
  );

  if (filteredUsers.length === 0) {
    return alert(`您輸入的關鍵字：${keyword} 沒有符合的搜尋結果`);
  }

  renderUserList(getDataByPage(1));
  renderPaginator(filteredUsers.length);
  getPageText(1);
});

////分頁Paginator製作////
//函式&全域變數
// const AMOUNTS_PER_PAGE = 30;
// const paginator = document.querySelector("#paginator");
// const pageActive = document.querySelector("#page-active");

//函式:顯示分頁數
function renderPaginator(amount) {
  const numberOfPage = Math.ceil(amount / AMOUNTS_PER_PAGE);
  let rawPageHTML = "";
  for (let page = 1; page <= numberOfPage; page++) {
    rawPageHTML += `<li class="page-item"><a class="page-link" href="#" data-page="${page}">${page}</a></li>`;
  }
  paginator.innerHTML = rawPageHTML;
}
//函式:顯示各頁要取哪幾個資料資訊
function getDataByPage(page) {
  const data = filteredUsers.length ? filteredUsers : users;
  const startIndex = (page - 1) * AMOUNTS_PER_PAGE;
  //slice(含,不含)
  return data.slice(startIndex, startIndex + AMOUNTS_PER_PAGE);
}

//函式:寫HTML顯示在第幾頁
function getPageText(page) {
  const data = filteredUsers.length ? filteredUsers : users;
  const startIndex = (page - 1) * AMOUNTS_PER_PAGE;
  const activeAmount = document.querySelector("#data-panel").childElementCount;
  const endIndex = startIndex + activeAmount;
  pageActive.innerText = `第${page}頁 (第${startIndex + 1}~${endIndex}筆)，共${
    data.length
  }筆`;
}

//事件:於分頁器 顯示各分頁的搜尋結果
paginator.addEventListener("click", function onPaginatorClicked(event) {
  //如果被點擊的不是 <a> 標籤，結束。 tagName一律回傳大寫
  console.log(event.target);
  if (event.target.tagName !== "A") return;
  //它是字串，保險起見轉Number
  const page = Number(event.target.dataset.page);
  renderUserList(getDataByPage(page));
  getPageText(page);
});

////重新整理按鈕///
//函式:顯示重新整理後資訊
function getRefreshPage(page) {
  const startIndex = (page - 1) * AMOUNTS_PER_PAGE;
  //slice(含,不含)
  return users.slice(startIndex, startIndex + AMOUNTS_PER_PAGE);
}
// const searchRefresh = document.querySelector("#refresh");
searchRefresh.addEventListener("click", function refresh(event) {
  event.preventDefault();
  searchInput.value = " "; //清空輸入欄位
  renderUserList(getRefreshPage(1));
  renderPaginator(users.length);
  getPageText(1);
  filteredUsers = []; //重新整理就清空，若沒清空getDataByPage會抓到filters.length
});

//不用axios
renderUserList(getDataByPage(1));
renderPaginator(users.length);
getPageText(1);
