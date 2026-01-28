(function(){
'use strict';
let e=null,n=null,d=null,o=!1,i=null;function h(){return{url:window.location.href,title:document.title}}function l(t){const r=h(),s=chrome.runtime.getURL(`chat.html?sessionId=${t}&pageUrl=${encodeURIComponent(r.url)}&pageTitle=${encodeURIComponent(r.title)}`);if(e){e.src=s,setTimeout(()=>{e!=null&&e.contentWindow&&e.contentWindow.postMessage({type:"PAGE_INFO",url:r.url,title:r.title},"*")},500);return}n=document.createElement("div"),n.id="ai-chat-container",n.style.cssText=`
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
  `,e=document.createElement("iframe"),e.src=s,e.style.cssText=`
    width: 100%;
    height: 100%;
    border: none;
  `,n.appendChild(e),document.body.appendChild(n),i=document.createElement("style"),i.id="ai-chat-layout-style",i.textContent=`
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
  `,document.head.appendChild(i);const a=new ResizeObserver(()=>{n&&(n.style.height=`${window.innerHeight}px`)});a.observe(document.documentElement),n.__resizeObserver=a,window.addEventListener("message",m),o&&chrome.storage.local.set({chatPinned:!0,chatSessionId:t})}let c=window.location.href;const u=new MutationObserver(()=>{if(window.location.href!==c&&(c=window.location.href,e!=null&&e.contentWindow)){const t=h();e.contentWindow.postMessage({type:"PAGE_INFO",url:t.url,title:t.title},"*")}});u.observe(document.body,{childList:!0,subtree:!0});function m(t){t.source===(e==null?void 0:e.contentWindow)&&(console.log("Received message from chat:",t.data),t.data.type==="CLOSE_CHAT"?p():t.data.type==="PIN_CHAT"&&(console.log("Handling PIN_CHAT"),f()))}function f(){o=!o,console.log("togglePin called, new isPinned:",o),o?(chrome.storage.local.set({chatPinned:!0,chatSessionId:d},()=>{console.log("Saved pin state to storage")}),e!=null&&e.contentWindow&&(e.contentWindow.postMessage({type:"PIN_STATUS_CHANGED",isPinned:!0},"*"),console.log("Sent PIN_STATUS_CHANGED: true to chat"))):(chrome.storage.local.remove(["chatPinned","chatSessionId"],()=>{console.log("Removed pin state from storage")}),e!=null&&e.contentWindow&&(e.contentWindow.postMessage({type:"PIN_STATUS_CHANGED",isPinned:!1},"*"),console.log("Sent PIN_STATUS_CHANGED: false to chat")))}function p(){if(n){const t=n.__resizeObserver;t&&t.disconnect(),n.remove(),n=null,e=null,i&&(i.remove(),i=null),o||chrome.storage.local.remove(["chatPinned","chatSessionId"])}}chrome.storage.local.get(["chatPinned","chatSessionId"],t=>{t.chatPinned&&t.chatSessionId&&(o=!0,d=t.chatSessionId,document.readyState==="loading"?document.addEventListener("DOMContentLoaded",()=>{l(t.chatSessionId)}):l(t.chatSessionId))});chrome.runtime.onMessage.addListener((t,r,s)=>(t.type==="OPEN_CHAT"?(d=t.sessionId,n?e.src=chrome.runtime.getURL(`chat.html?sessionId=${t.sessionId}`):l(t.sessionId),s({success:!0})):t.type==="CLOSE_CHAT"?(p(),s({success:!0})):t.type==="CHECK_CHAT_STATUS"&&s({isOpen:!!n,isPinned:o,sessionId:d}),!0));

})()