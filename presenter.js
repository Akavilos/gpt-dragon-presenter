/* MIT, copyright 2026 Akavilos. Artwork rights are recorded separately. */
class DragonPresenter {
  constructor(canvas, {assetRoot='assets', amplitude=7, size=440}={}) {
    this.canvas=canvas; this.ctx=canvas.getContext('2d'); this.amplitude=amplitude; this.size=size;
    this.expression='neutral'; this.x=1050; this.destination=1050; this.origin=1050;
    this.mirrored=false; this.moveStart=-100; this.bounceStart=-100; this.images={};
    this.background='#f5f3f8'; this.analyser=null; this.talking=false;
    this.ready=Promise.all(['neutral','talk','blink','star','wink','serious','annoyed'].map(name=>new Promise((resolve,reject)=>{
      const im=new Image(); im.onload=()=>{this.images[name]=im;resolve();}; im.onerror=reject; im.src=`${assetRoot}/${name}.png`;
    })));
  }
  move(side, now=performance.now()/1000) {
    this.origin=this.x; this.destination=side==='left'?45:side==='center'?(this.canvas.width-this.size)/2:this.canvas.width-this.size-45;
    this.moveStart=now; this.oldMirrored=this.mirrored;this.targetMirrored=side==='left';
  }
  enter(now=performance.now()/1000){this.x=this.origin=this.canvas.width+30;this.destination=this.canvas.width-this.size-45;this.moveStart=now;this.oldMirrored=this.mirrored=false;this.targetMirrored=false;}
  bounce(now=performance.now()/1000){this.bounceStart=now;}
  setAudio(audio) {
    if(!this.audioContext){this.audioContext=new AudioContext();this.analyser=this.audioContext.createAnalyser();
      this.analyser.fftSize=512;this.samples=new Uint8Array(512);this.audioContext.createMediaElementSource(audio).connect(this.analyser);this.analyser.connect(this.audioContext.destination);}
    this.audioContext.resume();
  }
  render(now=performance.now()/1000) {
    const ctx=this.ctx,w=this.canvas.width,h=this.canvas.height;ctx.clearRect(0,0,w,h);
    if(this.background!=='transparent'){ctx.fillStyle=this.background;ctx.fillRect(0,0,w,h);}
    const progress=Math.min(1,Math.max(0,(now-this.moveStart)/1.6)),ease=progress*progress*(3-2*progress);
    this.x=this.origin+(this.destination-this.origin)*ease;
    let flip=this.mirrored?-1:1,turn=1;
    const turnAge=now-this.moveStart;
    if(this.moveStart>0){
      if(this.oldMirrored!==this.targetMirrored&&turnAge<.16){turn=Math.max(.12,Math.abs(Math.cos(turnAge/.16*Math.PI)));flip=(turnAge<.08?this.oldMirrored:this.targetMirrored)?-1:1;}
      else {this.mirrored=this.targetMirrored;flip=this.mirrored?-1:1;}
    }
    const age=now-this.bounceStart;
    const bump=age>=0&&age<.9?-24*Math.exp(-3*age)*Math.abs(Math.sin(9*age)):0;
    let dy=Math.sin(now*6.5)*this.amplitude+bump;
    if(progress<1)dy-=10*Math.abs(Math.sin(progress*Math.PI*4));
    let speech=this.talking;
    if(this.analyser){this.analyser.getByteTimeDomainData(this.samples);speech=this.samples.reduce((s,v)=>s+(v-128)**2,0)/this.samples.length>15;}
    const blink=now%4.3>4.10;
    let expression=this.expression;if(expression==='neutral'||expression==='talk')expression=blink?'blink':(speech||this.expression==='talk')&&Math.sin(now*16)>.05?'talk':'neutral';
    const base=this.images.neutral,state=this.images[expression];if(!base||!state)return;
    const actorY=h-this.size-35+dy;
    ctx.save();ctx.translate(this.x+this.size/2,actorY+this.size/2);ctx.scale(flip*turn,1);
    ctx.rotate(Math.sin(now*(progress<1?10:2.7))*(progress<1?.04:.018));ctx.translate(-this.size/2,-this.size/2);
    ctx.drawImage(base,0,0,this.size,this.size);
    if(expression!=='neutral'){const [x,y,r,b]=[565,355,935,575];
      ctx.drawImage(state,x,y,r-x,b-y,x*(this.size/base.width),y*(this.size/base.width),(r-x)*(this.size/base.width),(b-y)*(this.size/base.width));}
    if(speech&&expression!=='blink'&&this.expression!=='neutral'&&this.expression!=='talk'){
      const mouth=this.images[Math.sin(now*16)>.05?'talk':'neutral'],sc=this.size/base.width;
      ctx.drawImage(mouth,640,490,125,70,640*sc,490*sc,125*sc,70*sc);}
    ctx.restore();
  }
}
if(typeof window!=='undefined')window.DragonPresenter=DragonPresenter;
