
function notifyUser(message) {
  const container = document.getElementById("container");
  const notification = document.createElement("div");
  notification.classList.add("notification");
  notification.innerHTML = `<h4>${message}</h4>`;
  container.appendChild(notification);
  setTimeout(() => {
    notification.remove();
  }, 2500);
}
const form__newGroup = document.getElementById("form__newGroup");
form__newGroup.addEventListener("submit", async (e) => {
  e.preventDefault();
  const newGroupData = {group_name: document.getElementById("newGroup__input").value};
  try {
    const response = await axios.post(`http://localhost:5000/newGroup`,newGroupData,
    { headers: { authorization: `Bearer ${localStorage.getItem("token")}` } }
    );
    notifyUser(response.data.message);
  } catch (err) {
    console.log(err);
  }
});

window.addEventListener("DOMContentLoaded", ready);

function ready() {
   //------------------------fetch All groups----------------------//
   let groups = document.getElementById("groups");
   function addYourGroupsToScreen(contact) {
    let groupsDiv = `<div class="single__group" id="${contact.groupId}">
        <h5 >${contact.group_name}</h5></div>`;
      groups.innerHTML += groupsDiv;}

  axios.get(`http://localhost:5000/getChatGroups`, {headers: { authorization: `Bearer ${localStorage.getItem("token")}` },})
    .then((res) => {
        const yourGroups = res.data.groupInfo;
        yourGroups.forEach((element) => {
        addYourGroupsToScreen(element);
      });
    }).catch((err) => console.log(err));
    
  //--------Group data and chat feature ------------//
    groups.addEventListener("click", (e) => {
    let chatSection = document.getElementsByClassName("chat__section")[0];
    if (e.target.classList.contains('single__group')) {
        let groupId = e.target.id;
        chatSection.innerHTML = `<div class="display__chat" id="display__chat">
                                    <h4 id="${groupId}" class="group__name">${e.target.textContent}</h4>
                                    <div class="actual__chat">
                                    </div>
                                  </div>

                                  <div class="send_MediaOrMsg">
                                    <button id="showSendMediaForm">✉</button>
                                    <div class="send__media" id="sendMediaSection">
                                      <form action="" method="post" id="media__form">
                                        <input type="file" id="real_file" class="${groupId}" name="fileFromSender">
                                        <input type="submit" value="⇑" id="${groupId}" >
                                      </form>
                                    </div>
                                    <div class="send__message">
                                      <form action="" method="post" id="send__message__form">
                                        <input type="text" id="${groupId}" class="msgText" placeholder="Write Your Mesaage">
                                        <button type="submit" id="message_send_button">➤</button>
                                      </form>
                                     </div>
                                  </div>`;
      getAllMessagesOfThisGroup(groupId);

      // setInterval(getAllMessagesOfThisGroup(groupId), 1000);

      const displaychat = document.getElementById('display__chat');
      displaychat.addEventListener('click', showGroupInfo);
      }
      

    //---------------------send media------------------------------//
      const showSendMediaFormBtn = document.getElementById('showSendMediaForm');
      showSendMediaFormBtn.addEventListener('click', (e)=> {
        //console.log(e.target);
        const showSendMediaForm = document.getElementById('sendMediaSection');
        console.log('media button clicked');
        showSendMediaForm.classList.toggle('mediaFormActive');
      });

      const sendMediaForm = document.getElementById('media__form');
      sendMediaForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const selectedFile = document.getElementById('real_file').value;
        const groupId= document.getElementById('real_file').className;
        if (!selectedFile) {
          console.log('No file selected !!');
          return
        } else {
          console.log('groupId: ', groupId);
          const formData = new FormData(sendMediaForm);
          for (let key of formData.keys()) {
            console.log(key, formData.get(key).name);
          }



          
        }
      })

      

    //---------------------send messages--------------------------//
    const submitForm = document.getElementById("send__message__form");
    submitForm.addEventListener("submit", (e) => {
      e.preventDefault();
      let groupMsgData = {
        message_text: document.getElementsByClassName("msgText")[0].value,
        sent_to_groupNo: document.getElementsByClassName("msgText")[0].id,
      };

      const groupId = document.getElementsByClassName("msgText")[0].id;
      //getAllMessagesOfThisGroup(groupId);
    
      document.getElementsByClassName("msgText")[0].value = "";
      axios
        .post("http://localhost:5000/sendGroupMessage", groupMsgData, { headers: { authorization: `Bearer ${localStorage.getItem("token")}` }, })
        .then((response) => {
          const msgStoredInLocalStorage = JSON.parse(localStorage.getItem(`${groupId}`) || "[]");
          msgStoredInLocalStorage.push(response.data.messageInfo);
          localStorage.setItem(`${response.data.messageInfo.sent_to_groupId}`, JSON.stringify(msgStoredInLocalStorage));
          addMesaageToChat(response.data.messageInfo.message_text);
        }).catch(err => console.log(err));
    });
  });
}

function addMesaageToChat(msg) {
  let actualChat = document.getElementsByClassName("actual__chat")[0];
  let sendersMessage = `<div class="my__message msgs">
                     <h4>${msg}</h4>
                     <p>timestamp</p></div>`;
  actualChat.innerHTML += sendersMessage;
}

const getAllMessagesOfThisGroup = async (groupId) => {
  //--------------Old messages from local storage-------//
  const msgStoredInLocalStorage = JSON.parse(localStorage.getItem(`${groupId}`) || "[]");
  const yourUserId = localStorage.getItem('userId');

  console.log(yourUserId);
  if (msgStoredInLocalStorage.length > 0) {
    msgStoredInLocalStorage.forEach((messageData) => {
      showGroupMsgOnScreen(messageData, yourUserId);
    });
  }
  
  //-------new messages from network call---------//
  //setInterval(async(groupId)=>{await newMessagesFromNetworkCall(groupId)}, 3000);
  newMessagesFromNetworkCall(groupId)
};

async function newMessagesFromNetworkCall(groupId) {
  //-------new messages from network call---------//
  const msgStoredInLocalStorage = JSON.parse(localStorage.getItem(`${groupId}`) || "[]");
  const lastMsgId = msgStoredInLocalStorage.length === 0 ? 0 : msgStoredInLocalStorage[msgStoredInLocalStorage.length - 1].id;

  const response = await axios.get(
    `http://localhost:5000/getGroupMessages/${groupId}?lastMsgId=${lastMsgId}`,
    { headers: { authorization: `Bearer ${localStorage.getItem("token")}` } });
  localStorage.setItem('userId', response.data.reqUserId);
  
  const newMessageArr = response.data.messages;
  const nowAllMsgsArr = [...msgStoredInLocalStorage, ...newMessageArr];
  localStorage.setItem(`${groupId}`, JSON.stringify(nowAllMsgsArr));
  
  console.log(newMessageArr);

  if (newMessageArr.length > 0) {
    newMessageArr.forEach((messageData) => {
      showGroupMsgOnScreen(messageData, response.data.reqUserId);
    });
  }
}

function showGroupMsgOnScreen(messageData, yourUserId) {
  let actualChat = document.getElementsByClassName("actual__chat")[0];

  if (messageData.userId != yourUserId) {
    let recieversMessage = `<div class="others__message msgs">
                   <h5 class="message_sender_name">${messageData.message_sender_name}:</h5>
                   <h4>${messageData.message_text}</h4>
                   <p>timestamp</p></div>`;
    actualChat.innerHTML += recieversMessage;
  } else {
    let sendersMessage = `<div class="my__message msgs">
                   <h4>${messageData.message_text}</h4>
                   <p>timestamp</p></div>`;
    actualChat.innerHTML += sendersMessage;
  }
  
}

//-----------------------Group Info---Admin Superpowers(add,remove,make otheradmin, remove from admin)------//
function showGroupInfo(e) {
  if (e.target.id === "person__name") {
    console.log('No Group Selected');
    return
  }
  else if (e.target.classList.contains("group__name")) {
    const groupId = e.target.id;
    document.getElementsByClassName('actual__chat')[0].style.display = 'none';
    let displayChatArea = e.target.parentElement;
    let detailsArea = `
    <div id='groupDetail__section'>
      <div class="groupMembers">
       <h4> Members of the group</h4>
      </div>
     <div class="add_new_member">
       <form action='#' method="post" id="add_new_memberForm" >
        <input type="text" id="${groupId}" class="add_member_mobile" placeholder="Enter Valid Mobile Number">
        <input type="submit" value="Add Member" >
       </form>
       <button class="leave__group" id="${groupId}"> Leave Group </button>
     </div>
    </div>`
    displayChatArea.innerHTML += detailsArea;
    
    
    axios.get(`http://localhost:5000/getGroupMembers/${groupId}`, { headers: { authorization: `Bearer ${localStorage.getItem("token")}` } })
      .then(res => {
        const members = res.data.groupMembers;
        members.forEach((member) => {
          let groupMembers = document.getElementsByClassName('groupMembers')[0];
          let groupMember= `<div class="groupMember">
            <h5>User Id: ${member.userId}</h5>
            <button class="adminBtn ${member.isAdmin}" id="${member.userId}"> ${member.isAdmin ? "Admin" : "Make Admin"} </buuton>
            <button class="removeUser" id="${member.userId}"> Remove User </buuton>
            </div>`
          groupMembers.innerHTML +=groupMember;
        })
      }).catch(err => console.log(err))
    
    const groupDetail__section = document.getElementById("groupDetail__section");
    groupDetail__section.addEventListener('click', (e) => {
      
      //-------------------Admin => Make other users as Admin-------------------// 
      if (e.target.classList.contains('adminBtn') && e.target.classList.contains('false')) {
        axios.post('http://localhost:5000/makeAdmin', { targetId: e.target.id ,groupId:groupId}, { headers: { authorization: `Bearer ${localStorage.getItem("token")}` } })
          .then(res => console.log(res))
          .catch(err=>console.log(err))
        
      }

      //---------------------Admin => Remove other admin from admin, but peron will still group member----//
      if (e.target.classList.contains('adminBtn') && e.target.classList.contains('true')) {
        axios.post('http://localhost:5000/removeAdmin', { targetId:e.target.id ,groupId:groupId}, { headers: { authorization: `Bearer ${localStorage.getItem("token")}` } })
          .then(res => console.log(res))
          .catch(err=>console.log(err))
      }

      //----------------------Admin => Remove existing member from group----//
      if (e.target.classList.contains('removeUser')) {
        console.log('remove user clicked', e.target.id);
        axios.post('http://localhost:5000/removeMember', { targetId: e.target.id ,groupId:groupId}, { headers: { authorization: `Bearer ${localStorage.getItem("token")}` } })
          .then(res => console.log(res.data.message))
          .catch(err=>console.log(err))
      }

      //---------------Group member => wants to leave group---------------//
      if (e.target.classList.contains('leave__group')) {
        axios.post('http://localhost:5000/leaveGroup', {groupId:groupId}, { headers: { authorization: `Bearer ${localStorage.getItem("token")}` } })
          .then(res => console.log(res.data.message))
          .catch(err=>console.log(err))
      }
    })
    
    //---------------Admin => Add new members-----------------------------//
    const add_new_memberForm = document.getElementById('add_new_memberForm');
    add_new_memberForm.addEventListener('submit',(e)=> {
      e.preventDefault();
      const mobileNo = document.getElementsByClassName('add_member_mobile')[0].value;
      const groupId = document.getElementsByClassName('add_member_mobile')[0].id;
      document.getElementsByClassName('add_member_mobile')[0].value=''
      axios.post("http://localhost:5000/addNewMember", { mobileNo: mobileNo, groupId:groupId }, {
        headers: { authorization: `Bearer ${localStorage.getItem("token")}` },
      }).then(res => console.log(res)).catch(err => console.log(err));
      
    })
  }
}
