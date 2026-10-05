"use client";
import { useEffect, useState } from "react";
import { TABLES } from "@/lib/math-engine";
import { overallMastery, tableMastery } from "@/lib/learning-engine";
import { emptyProgress, loadProgress, Progress, resetProgress, saveProgress } from "@/lib/storage";
import { tone } from "@/lib/sound";
import { Hard, ModeWithTable, Quiz, Speed, Test, Train } from "./QuizModes";
import { Family, Games, type Game } from "./Games";

const APP_NAME="MULTIKIDS";
type Screen="home"|"learn"|"train"|"hard"|"test"|"speed"|"daily"|"games"|"division"|"family";
const pct=(n:number)=>Math.round(n*100);
const stars=(n:number)=>Math.round(n*5);

export default function MultiKidsApp(){
  const [p,setP]=useState<Progress>(emptyProgress());
  const [ready,setReady]=useState(false),[screen,setScreen]=useState<Screen>("home");
  const [table,setTable]=useState<number|undefined>(),[game,setGame]=useState<Game|null>(null),[reset,setReset]=useState(false);
  useEffect(()=>{setP(loadProgress());setReady(true)},[]);
  useEffect(()=>{if(ready)saveProgress(p)},[p,ready]);
  const go=(s:Screen)=>{tone("tap",p.sound);setScreen(s);setTable(undefined);setGame(null)};
  return <main className="min-h-screen bg-grid bg-[#f7f8ff] pb-12 text-slate-900">
    <header className="sticky top-0 z-40 border-b border-white/70 bg-[#f7f8ff]/90 backdrop-blur-xl"><div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
      <button onClick={()=>go("home")} className="flex items-center gap-2 font-black"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-500 text-xl text-white">×</span><span className="text-lg md:text-xl">{APP_NAME}</span></button>
      <div className="flex gap-2"><span className="rounded-2xl bg-white px-3 py-2 text-sm font-black shadow-sm">⭐ {p.stars}</span><button aria-label="Звук" onClick={()=>setP({...p,sound:!p.sound})} className="press grid h-10 w-10 place-items-center rounded-2xl bg-white text-xl shadow-sm">{p.sound?"🔊":"🔇"}</button></div>
    </div></header>
    <div className="mx-auto max-w-6xl px-4 pt-5 md:px-6 md:pt-8">{screen!=="home"&&<button onClick={()=>go("home")} className="press mb-5 rounded-2xl bg-white px-4 py-2 font-bold shadow-sm">← На главную</button>}
      {screen==="home"&&<Home p={p} go={go} learn={t=>{setTable(t);setScreen("learn")}} onReset={()=>setReset(true)}/>} 
      {screen==="learn"&&<Learn table={table} setTable={setTable}/>} 
      {screen==="train"&&<Train p={p} setP={setP} table={table} setTable={setTable}/>} 
      {screen==="daily"&&<Quiz title="🚀 Тренировка на 5 минут" count={18} p={p} setP={setP} adaptive division/>}
      {screen==="division"&&<ModeWithTable title="➗ Учимся делить" table={table} setTable={setTable}><Quiz title="➗ Деление" count={15} table={table} p={p} setP={setP} force="division"/></ModeWithTable>}
      {screen==="hard"&&<Hard p={p} setP={setP}/>} 
      {screen==="test"&&<Test p={p} setP={setP}/>} 
      {screen==="speed"&&<Speed p={p} setP={setP}/>} 
      {screen==="family"&&<Family sound={p.sound}/>} 
      {screen==="games"&&<Games game={game} setGame={setGame} p={p} setP={setP}/>} 
    </div>
    {reset&&<div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm"><div className="card max-w-md p-7 text-center"><div className="text-5xl">🗑️</div><h2 className="mt-3 text-2xl font-black">Сбросить весь прогресс?</h2><p className="mt-2 text-slate-500">Звёзды, рекорды и изученные примеры удалятся только на этом устройстве.</p><div className="mt-5 grid grid-cols-2 gap-3"><button onClick={()=>setReset(false)} className="answer">Отмена</button><button onClick={()=>{resetProgress();setP(emptyProgress());setReset(false)}} className="answer !border-rose-100 !bg-rose-50 !text-rose-600">Сбросить</button></div></div></div>}
  </main>
}

function Home({p,go,learn,onReset}:{p:Progress;go:(s:Screen)=>void;learn:(t:number)=>void;onReset:()=>void}){
  const total=p.totalCorrect+p.totalWrong,acc=total?Math.round(p.totalCorrect/total*100):0,m=overallMastery(p);
  const modes:[string,string,string,Screen,string][]=[
    ["🎓","Учить","Понять на картинках","learn","from-violet-500 to-indigo-500"],["🎯","Тренироваться","Разные задания","train","from-blue-500 to-cyan-500"],["🎮","Играть","5 мини-игр","games","from-fuchsia-500 to-pink-500"],["🧠","Сложные примеры","Повторить ошибки","hard","from-orange-500 to-amber-500"],["⚡","На скорость","60 секунд","speed","from-yellow-400 to-orange-500"],["🏆","Проверить себя","10, 20 или 30 вопросов","test","from-emerald-500 to-teal-500"]
  ];
  return <><section className="relative overflow-hidden rounded-[34px] bg-gradient-to-br from-[#7657ff] via-[#6958f5] to-[#4f7cf7] p-6 text-white shadow-[0_18px_55px_rgba(91,76,220,.28)] md:p-10"><div className="relative z-10 max-w-3xl"><span className="rounded-full bg-white/15 px-3 py-1 text-sm font-bold">Математика без скуки ✨</span><h1 className="mt-4 text-3xl font-black leading-tight md:text-5xl">УЧИМ ТАБЛИЦУ<br/>УМНОЖЕНИЯ 🚀</h1><p className="mt-4 max-w-xl font-medium text-white/85 md:text-lg">Понял → попробовал → поиграл → повторил → запомнил.</p><button onClick={()=>go("daily")} className="press mt-6 rounded-2xl bg-white px-6 py-4 text-lg font-black text-violet-700 shadow-xl">🚀 Тренировка на 5 минут</button></div></section>
    <section className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{modes.map(([i,t,x,s,c])=><button key={t} onClick={()=>go(s)} className="card press flex items-center gap-4 p-5 text-left"><span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${c} text-2xl shadow-md`}>{i}</span><span><b className="block text-lg">{t}</b><small className="font-medium text-slate-500">{x}</small></span></button>)}</section>
    <section className="mt-8"><div className="mb-4 flex items-end justify-between"><div><p className="text-xs font-black uppercase tracking-[.16em] text-violet-500">Выбери таблицу</p><h2 className="text-2xl font-black">От ×2 до ×9</h2></div><span className="text-sm font-bold text-slate-400">Нажми, чтобы учить</span></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">{TABLES.map(t=>{const x=tableMastery(p,t),s=stars(x);return <button key={t} onClick={()=>learn(t)} className="card press p-4 text-center"><b className="text-3xl">×{t}</b><div className="mt-2 text-[11px]">{"⭐".repeat(s)}{"☆".repeat(5-s)}</div><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-violet-500" style={{width:`${pct(x)}%`}}/></div><small className="font-bold text-slate-400">{pct(x)}%</small></button>})}</div></section>
    <section className="mt-8 grid gap-4 lg:grid-cols-[1.4fr_.6fr]"><div className="card p-6"><div className="flex justify-between"><div><p className="text-xs font-black uppercase tracking-[.16em] text-emerald-500">Твой прогресс</p><h2 className="text-2xl font-black">Уже получается 💪</h2></div><b className="grid h-20 w-20 place-items-center rounded-full bg-violet-50 text-xl text-violet-600">{pct(m)}%</b></div><div className="mt-5 grid grid-cols-3 gap-3"><Stat v={`${Object.keys(p.facts).length}/80`} l="освоено"/><Stat v={`${acc}%`} l="точность"/><Stat v={`${p.maxStreak}`} l="серия"/></div><div className="mt-5 space-y-2">{TABLES.map(t=><Bar key={t} t={t} v={tableMastery(p,t)}/>)}</div></div><div className="space-y-4"><button onClick={()=>go("division")} className="card press w-full p-5 text-left"><span className="text-3xl">➗</span><b className="mt-2 block text-xl">Деление</b><span className="text-sm text-slate-500">Связываем его с умножением</span></button><button onClick={()=>go("family")} className="card press w-full p-5 text-left"><span className="text-3xl">👨‍👩‍👧‍👦</span><b className="mt-2 block text-xl">Семья примеров</b><span className="text-sm text-slate-500">4 равенства из трёх чисел</span></button><div className="card p-5"><b>🏅 Достижения</b><div className="mt-3 flex flex-wrap gap-2">{p.achievements.length?p.achievements.slice(-5).map(a=><span key={a} className="rounded-full bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">{a}</span>):<span className="text-sm text-slate-400">Первое достижение уже близко!</span>}</div></div></div></section>
    <div className="mt-8 text-center"><button onClick={onReset} className="rounded-xl px-4 py-2 text-sm font-bold text-slate-400 hover:bg-white hover:text-rose-500">Сбросить весь прогресс</button></div></>
}
function Bar({t,v}:{t:number;v:number}){return <div className="grid grid-cols-[35px_1fr_42px] items-center gap-3"><b>×{t}</b><div className="h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500" style={{width:`${pct(v)}%`}}/></div><small className="text-right font-black text-slate-400">{pct(v)}%</small></div>}

function Learn({table,setTable}:{table?:number;setTable:(t?:number)=>void}){
  const [n,setN]=useState(1),[view,setView]=useState<"groups"|"sum"|"grid"|"line">("groups");
  useEffect(()=>setN(1),[table]); if(!table)return <Picker title="Какую таблицу изучаем?" onPick={setTable} all={false}/>;
  const product=table*n,emoji=["🍎","⭐","⚽","🚗","🍬"][n%5];
  return <div className="card mx-auto max-w-4xl overflow-hidden"><div className="bg-gradient-to-r from-violet-600 to-blue-500 p-6 text-white md:p-8"><b className="text-white/70">РЕЖИМ «УЧИТЬ»</b><div className="mt-2 flex items-end justify-between"><h1 className="text-4xl font-black">Таблица на ×{table}</h1><span className="rounded-2xl bg-white/15 px-4 py-2 font-black">{n} из 10</span></div></div><div className="p-5 md:p-8"><div className="text-center text-5xl font-black md:text-7xl">{table} × {n} = <span className="text-violet-600">{product}</span></div><div className="mt-6 flex flex-wrap justify-center gap-2">{(["groups","sum","grid","line"] as const).map(v=><button key={v} onClick={()=>setView(v)} className={`rounded-full px-4 py-2 text-sm font-black ${view===v?"bg-violet-600 text-white":"bg-slate-100"}`}>{v==="groups"?"Группы":v==="sum"?"Сложение":v==="grid"?"Сетка":"Линия"}</button>)}</div><div className="mt-5 min-h-64 rounded-[28px] bg-slate-50 p-5 md:p-7"><Visual view={view} a={table} b={n} emoji={emoji}/></div><div className="mt-5 grid grid-cols-2 gap-3"><button disabled={n===1} onClick={()=>setN(x=>Math.max(1,x-1))} className="answer disabled:opacity-30">← Назад</button><button onClick={()=>setN(x=>x===10?1:x+1)} className="answer !border-violet-600 !bg-violet-600 !text-white">{n===10?"Ещё раз 🔁":"Дальше →"}</button></div></div></div>
}
function Visual({view,a,b,emoji}:{view:"groups"|"sum"|"grid"|"line";a:number;b:number;emoji:string}){
  if(view==="groups")return <><p className="mb-5 text-center text-lg font-black">{a} групп по {b} предметов</p><div className="flex flex-wrap justify-center gap-3">{Array.from({length:a},(_,i)=><div key={i} className="rounded-2xl bg-white p-3 text-2xl shadow-sm">{emoji.repeat(b)}</div>)}</div></>;
  if(view==="sum")return <div className="grid min-h-52 place-items-center text-center"><div><p className="text-slate-500">Повторяем число {b} {a} раз</p><b className="mt-4 block text-3xl md:text-5xl">{Array.from({length:a},()=>b).join(" + ")} = <span className="text-violet-600">{a*b}</span></b></div></div>;
  if(view==="grid")return <div className="grid min-h-52 place-items-center"><div className="grid gap-2" style={{gridTemplateColumns:`repeat(${b},28px)`}}>{Array.from({length:a*b},(_,i)=><span key={i} className="h-7 w-7 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500"/>)}</div></div>;
  return <div className="flex min-h-52 items-center overflow-x-auto"><div className="mx-auto flex min-w-max items-center px-3">{Array.from({length:a+1},(_,i)=><div key={i} className="flex items-center"><span className="grid h-12 w-12 place-items-center rounded-full bg-white font-black shadow">{i*b}</span>{i<a&&<span className="w-14 text-center text-2xl text-violet-500">→</span>}</div>)}</div></div>
}


function Stat({v,l}:{v:string;l:string}){return <div className="rounded-2xl bg-slate-50 p-3 text-center"><b className="text-xl md:text-2xl">{v}</b><small className="block uppercase tracking-wide text-slate-400">{l}</small></div>}
function Picker({title,onPick,all=true}:{title:string;onPick:(t?:number)=>void;all?:boolean}){return <div className="card mx-auto max-w-3xl p-6 text-center md:p-8"><div className="text-5xl">✖️</div><h2 className="mt-3 text-3xl font-black">{title}</h2><div className="mt-6 grid grid-cols-4 gap-3">{TABLES.map(t=><button key={t} onClick={()=>onPick(t)} className="answer !text-2xl">×{t}</button>)}</div>{all&&<button onClick={()=>onPick()} className="press mt-4 w-full rounded-2xl bg-violet-600 p-4 text-lg font-black text-white">🎲 Все таблицы вперемешку</button>}</div>}
