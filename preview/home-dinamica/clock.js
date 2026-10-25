(function(root){
 'use strict';
 function format(now){
  return {date:new Intl.DateTimeFormat('it-IT',{timeZone:'Europe/Rome',weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(now),clock:new Intl.DateTimeFormat('it-IT',{timeZone:'Europe/Rome',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(now)};
 }
 if(typeof module!=='undefined')module.exports={format};
 if(!root.document)return;
 function update(){const now=new Date(),value=format(now),date=root.document.getElementById('top-news-live-date'),clock=root.document.getElementById('top-news-live-clock');if(date&&clock){date.textContent=value.date;clock.textContent=value.clock;clock.dateTime=now.toISOString();}}
 update();root.setInterval(update,1000);
 root.document.addEventListener('visibilitychange',()=>{if(!root.document.hidden)update();});
})(typeof window!=='undefined'?window:{});
