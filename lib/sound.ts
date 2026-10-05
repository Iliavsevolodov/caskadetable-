export function tone(kind:"tap"|"ok"|"bad"|"done",on:boolean){
  if(!on||typeof window==="undefined")return;
  try{const C=window.AudioContext||(window as typeof window&{webkitAudioContext?:typeof AudioContext}).webkitAudioContext;if(!C)return;const c=new C(),o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.frequency.value={tap:420,ok:720,bad:190,done:900}[kind];g.gain.value=.06;o.start();g.gain.exponentialRampToValueAtTime(.001,c.currentTime+.16);o.stop(c.currentTime+.17);o.onended=()=>c.close()}catch{}
}
