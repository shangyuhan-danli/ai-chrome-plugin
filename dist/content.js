(function(){
'use strict';
let t=null,n=null,s=null,o=!1,i=null;function d(e){if(t){t.src=chrome.runtime.getURL(`chat.html?sessionId=${e}`);return}n=document.createElement("div"),n.id="ai-chat-container",n.style.cssText=`
    position: fixed;
    width: 400px;
    height: 100vh;
    right: 0;
    top: 0;
    z-index: 2147483647;
    background: white;
    border-left: 1px solid #e5e7eb;
    box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  `,t=document.createElement("iframe"),t.src=chrome.runtime.getURL(`chat.html?sessionId=${e}`),t.style.cssText=`
    width: 100%;
    height: 100%;
    border: none;
  `,n.appendChild(t),document.body.appendChild(n),i=document.createElement("style"),i.id="ai-chat-layout-style",i.textContent=`
    /* 核心：缩小 html 宽度，让页面内容自然收缩 */
    html {
      width: calc(100% - 400px) !important;
      min-width: auto !important;
      overflow-x: hidden !important;
      position: relative !important;
    }

    /* 确保 body 跟随 html 宽度 */
    body {
      width: 100% !important;
      min-width: auto !important;
      max-width: 100% !important;
      overflow-x: hidden !important;
      position: relative !important;
    }

    /* 确保聊天容器不受影响，固定在视口右侧 */
    #ai-chat-container {
      position: fixed !important;
      right: 0 !important;
      top: 0 !important;
      width: 400px !important;
      height: 100vh !important;
      margin: 0 !important;
      padding: 0 !important;
      box-sizing: border-box !important;
    }
  `,document.head.appendChild(i);const r=new ResizeObserver(()=>{n&&(n.style.height=`${window.innerHeight}px`)});r.observe(document.documentElement),n.__resizeObserver=r,window.addEventListener("message",l),o&&chrome.storage.local.set({chatPinned:!0,chatSessionId:e})}function l(e){e.source===(t==null?void 0:t.contentWindow)&&(console.log("Received message from chat:",e.data),e.data.type==="CLOSE_CHAT"?c():e.data.type==="PIN_CHAT"&&(console.log("Handling PIN_CHAT"),h()))}function h(){o=!o,console.log("togglePin called, new isPinned:",o),o?(chrome.storage.local.set({chatPinned:!0,chatSessionId:s},()=>{console.log("Saved pin state to storage")}),t!=null&&t.contentWindow&&(t.contentWindow.postMessage({type:"PIN_STATUS_CHANGED",isPinned:!0},"*"),console.log("Sent PIN_STATUS_CHANGED: true to chat"))):(chrome.storage.local.remove(["chatPinned","chatSessionId"],()=>{console.log("Removed pin state from storage")}),t!=null&&t.contentWindow&&(t.contentWindow.postMessage({type:"PIN_STATUS_CHANGED",isPinned:!1},"*"),console.log("Sent PIN_STATUS_CHANGED: false to chat")))}function c(){if(n){const e=n.__resizeObserver;e&&e.disconnect(),n.remove(),n=null,t=null,i&&(i.remove(),i=null),o||chrome.storage.local.remove(["chatPinned","chatSessionId"])}}chrome.storage.local.get(["chatPinned","chatSessionId"],e=>{e.chatPinned&&e.chatSessionId&&(o=!0,s=e.chatSessionId,document.readyState==="loading"?document.addEventListener("DOMContentLoaded",()=>{d(e.chatSessionId)}):d(e.chatSessionId))});chrome.runtime.onMessage.addListener((e,r,a)=>(e.type==="OPEN_CHAT"?(s=e.sessionId,n?t.src=chrome.runtime.getURL(`chat.html?sessionId=${e.sessionId}`):d(e.sessionId),a({success:!0})):e.type==="CLOSE_CHAT"?(c(),a({success:!0})):e.type==="CHECK_CHAT_STATUS"&&a({isOpen:!!n,isPinned:o,sessionId:s}),!0));

})()