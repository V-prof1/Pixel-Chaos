import {ABILITIES} from './abilities.js?v=0.4';
export class AbilityAudio{
 constructor(getContext){this.getContext=getContext;this.lastCharge=-10;this.lastRelease=-10;this.noise=null;}
 play(type,phase,enabled){if(!enabled)return;const ctx=this.getContext();if(!ctx)return;const now=ctx.currentTime,key=phase==='charge'?'lastCharge':'lastRelease';if(now-this[key]<.10)return;this[key]=now;const profile=ABILITIES[type],duration=phase==='charge'?Math.min(.8,profile.charge):.32;
  const master=ctx.createGain();master.gain.setValueAtTime(phase==='charge'?.016:.038,now);master.gain.exponentialRampToValueAtTime(.001,now+duration);master.connect(ctx.destination);
  const oscillator=ctx.createOscillator();oscillator.type=['energy','magic','ice'].includes(profile.sound)?'sine':'triangle';const electric=['electric','thunder','energy'].includes(profile.sound);oscillator.frequency.setValueAtTime(phase==='charge'?(electric?170:110):(electric?380:90),now);oscillator.frequency.exponentialRampToValueAtTime(phase==='charge'?(electric?700:260):45,now+duration);oscillator.connect(master);oscillator.start(now);oscillator.stop(now+duration);
  if(phase!=='charge'){
   if(!this.noise){this.noise=ctx.createBuffer(1,ctx.sampleRate*.5,ctx.sampleRate);const data=this.noise.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;}
   const noise=ctx.createBufferSource();noise.buffer=this.noise;const filter=ctx.createBiquadFilter();filter.type=['water','wind','web','slash'].includes(profile.sound)?'bandpass':'lowpass';filter.frequency.setValueAtTime(electric?4200:profile.sound==='explosion'?750:1800,now);filter.frequency.exponentialRampToValueAtTime(160,now+duration);noise.connect(filter).connect(master);noise.start(now);noise.stop(now+duration);noise.onended=()=>{noise.disconnect();filter.disconnect();};
  }
  oscillator.onended=()=>{oscillator.disconnect();master.disconnect();};
 }
}
