// Per-character staging, pose, palette and sound; simulation and visuals share timings.
export const ABILITIES={
 goku:{charge:.85,release:.65,pose:'beam',visual:'kamehameha',palette:[0x39baff,0xd6f7ff,0xffffff],sound:'energy'},
 naruto:{charge:.48,release:.55,pose:'dash',visual:'rasengan',palette:[0x4dbeff,0xd4f8ff,0xffffff],sound:'wind'},
 luffy:{charge:.42,release:.48,pose:'stretch',visual:'elastic',palette:[0xdf956b,0xffcf94,0xffffff],sound:'punch'},
 gojo:{charge:.95,release:.65,pose:'cast',visual:'purple',palette:[0xaa55ff,0x548aff,0xff6588],sound:'energy'},
 ichigo:{charge:.34,release:.50,pose:'slash',visual:'getsuga',palette:[0x1e384f,0x46bcff,0xe1f8ff],sound:'slash'},
 tanjiro:{charge:.38,release:.62,pose:'spin',visual:'waterdragon',palette:[0x2d9eda,0x65def3,0xedffff],sound:'water'},
 vader:{charge:.45,release:1.15,pose:'force',visual:'forcechoke',palette:[0xf45769,0xad647d,0xecd4e3],sound:'force'},
 yoda:{charge:.40,release:.70,pose:'force',visual:'forcewave',palette:[0x9cf08b,0xc7ffb1,0xf3ffe5],sound:'magic'},
 spiderman:{charge:.24,release:.45,pose:'web',visual:'webcast',palette:[0xc6dbe0,0xf4ffff,0x70b5de],sound:'web'},
 elsa:{charge:.68,release:.95,pose:'cast',visual:'frost',palette:[0x6cbff1,0xb5efff,0xf4ffff],sound:'ice'},
 eleven:{charge:.62,release:.65,pose:'force',visual:'telekinesis',palette:[0xfa9bb4,0xf8d7e3,0xffffff],sound:'force'},
 wednesday:{charge:.42,release:.80,pose:'cast',visual:'thing',palette:[0xb7a1df,0xe0c4ad,0x766997],sound:'shadow'},
 vegeta:{charge:.80,release:.65,pose:'beam',visual:'finalflash',palette:[0xffd45a,0xfff3ad,0xffffff],sound:'energy'},
 sasuke:{charge:.44,release:.48,pose:'dash',visual:'chidori',palette:[0x8d9dff,0xc6edff,0xffffff],sound:'electric'},
 saitama:{charge:.65,release:.45,pose:'punch',visual:'seriouspunch',palette:[0xffdca5,0xfff6df,0xffffff],sound:'punch'},
 bakugo:{charge:.50,release:.75,pose:'blast',visual:'howitzer',palette:[0xffa33e,0xffe58b,0xd6573c],sound:'explosion'},
 ironman:{charge:.40,release:.70,pose:'repulsor',visual:'missiles',palette:[0x72dfff,0xffc581,0xffffff],sound:'missile'},
 thor:{charge:.60,release:.75,pose:'hammer',visual:'thunder',palette:[0x73b8ff,0xc0eaff,0xffffff],sound:'thunder'},
 harry:{charge:.32,release:.60,pose:'wand',visual:'spellcast',palette:[0xff8a8d,0xffdba1,0xfff4e8],sound:'magic'},
 geralt:{charge:.36,release:.50,pose:'force',visual:'aard',palette:[0x7bb9cf,0xc7e6ed,0xf1ffff],sound:'wind'}
};
export function castPose(type,phase,progress){
 const pose=ABILITIES[type].pose,charging=phase==='charge',weight=charging?Math.sin(Math.min(1,progress)*Math.PI/2):Math.sin(Math.min(1,progress)*Math.PI),w=weight;
 const p={arms:[-.1,-.1],forearms:[-.12,-.12],bodyX:0,bodyY:0,bodyZ:0,headY:0};
 if(pose==='beam'){p.arms=charging?[-.8,-.8]:[-1.45,-1.45];p.forearms=[charging?-1.25:-.08,charging?-1.25:-.08];p.bodyX=charging?.14:-.14;}
 else if(['slash','spin'].includes(pose)){p.arms=[-.5,-1.9*w];p.forearms=[-.3,-.7];p.bodyY=(charging?-.35:.9)*w;p.bodyZ=.14*w;}
 else if(pose==='dash'){p.arms=[.6,-.8];p.forearms=[-.65,-1.1];p.bodyX=.28*w;}
 else if(['force','cast','wand','web','repulsor'].includes(pose)){p.arms=[-.35,-1.3*w];p.forearms=[-.2,-.12];p.bodyY=-.18*w;if(pose==='web')p.arms=[-1.25*w,-1.25*w];}
 else if(pose==='hammer'){p.arms=[-.8,-2.8*w];p.bodyX=-.16*w;}
 else if(pose==='punch'||pose==='stretch'){p.arms=[-.6,charging?.5:-1.6];p.forearms=[-.4,charging?-1.1:-.04];p.bodyY=(charging?-.4:.45)*w;p.bodyX=(charging?.12:-.2)*w;}
 else if(pose==='blast'){p.arms=[-1.4*w,-1.4*w];p.bodyX=-.17*w;}
 const blend=charging?weight:Math.min(1,progress/.12)*Math.min(1,(1-progress)/.28);p.arms=p.arms.map(a=>-.1+(a+.1)*blend);p.forearms=p.forearms.map(a=>-.12+(a+.12)*blend);p.bodyX*=blend;p.bodyY*=blend;p.bodyZ*=blend;
 return p;
}
